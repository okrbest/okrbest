// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package localcachelayer

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/v8/platform/services/cache"
)

func TestSessionAttributeStoreCache(t *testing.T) {
	logger := mlog.CreateConsoleTestLogger(t)

	t.Run("Refresh writes attributes that Get returns", func(t *testing.T) {
		mockStore := getMockStore(t)
		mockCacheProvider := getMockCacheProvider()
		cachedStore, err := NewLocalCacheLayer(mockStore, nil, nil, mockCacheProvider, logger)
		require.NoError(t, err)

		sessionID := model.NewId()
		err = cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldUserAgentBrowserName: "Chrome",
			model.SessionAttributesPropertyFieldIPAddress:            "192.0.2.10",
		})
		require.NoError(t, err)

		got, err := cachedStore.SessionAttribute().Get(sessionID)
		require.NoError(t, err)
		require.Equal(t, "Chrome", got[model.SessionAttributesPropertyFieldUserAgentBrowserName])
		require.Equal(t, "192.0.2.10", got[model.SessionAttributesPropertyFieldIPAddress])
	})

	t.Run("Refresh overwrites existing attributes", func(t *testing.T) {
		mockStore := getMockStore(t)
		mockCacheProvider := getMockCacheProvider()
		cachedStore, err := NewLocalCacheLayer(mockStore, nil, nil, mockCacheProvider, logger)
		require.NoError(t, err)

		sessionID := model.NewId()
		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldUserAgentBrowserName: "Chrome",
		}))

		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldUserAgentBrowserName: "Firefox",
		}))

		got, err := cachedStore.SessionAttribute().Get(sessionID)
		require.NoError(t, err)
		require.Equal(t, "Firefox", got[model.SessionAttributesPropertyFieldUserAgentBrowserName])
	})

	t.Run("GetEpoch advances only when a value changes", func(t *testing.T) {
		mockStore := getMockStore(t)
		mockCacheProvider := getMockCacheProvider()
		cachedStore, err := NewLocalCacheLayer(mockStore, nil, nil, mockCacheProvider, logger)
		require.NoError(t, err)

		sessionID := model.NewId()
		epoch, err := cachedStore.SessionAttribute().GetEpoch(sessionID)
		require.NoError(t, err)
		require.Equal(t, "0", epoch)

		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldIPAddress: "192.0.2.10",
		}))
		first, err := cachedStore.SessionAttribute().GetEpoch(sessionID)
		require.NoError(t, err)
		require.NotEqual(t, "0", first)

		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldIPAddress: "192.0.2.10",
		}))
		unchanged, err := cachedStore.SessionAttribute().GetEpoch(sessionID)
		require.NoError(t, err)
		require.Equal(t, first, unchanged, "refreshing with the same values must not advance the epoch")

		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldIPAddress:            "192.0.2.10",
			model.SessionAttributesPropertyFieldUserAgentBrowserName: "Chrome",
		}))
		added, err := cachedStore.SessionAttribute().GetEpoch(sessionID)
		require.NoError(t, err)
		require.NotEqual(t, first, added, "a new attribute must advance the epoch")

		// Back-to-back changes in the same millisecond must still advance it.
		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionID, map[string]any{
			model.SessionAttributesPropertyFieldIPAddress: "203.0.113.42",
		}))
		changed, err := cachedStore.SessionAttribute().GetEpoch(sessionID)
		require.NoError(t, err)
		require.NotEqual(t, added, changed, "a changed value must advance the epoch")
	})

	t.Run("Get on missing session returns ErrKeyNotFound", func(t *testing.T) {
		mockStore := getMockStore(t)
		mockCacheProvider := getMockCacheProvider()
		cachedStore, err := NewLocalCacheLayer(mockStore, nil, nil, mockCacheProvider, logger)
		require.NoError(t, err)

		got, err := cachedStore.SessionAttribute().Get(model.NewId())
		require.ErrorIs(t, err, cache.ErrKeyNotFound)
		require.Nil(t, got)
	})

	t.Run("cluster invalidation with clear-cache marker purges every entry", func(t *testing.T) {
		mockStore := getMockStore(t)
		mockCacheProvider := getMockCacheProvider()
		cachedStore, err := NewLocalCacheLayer(mockStore, nil, nil, mockCacheProvider, logger)
		require.NoError(t, err)

		sessionA := model.NewId()
		sessionB := model.NewId()
		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionA, map[string]any{
			model.SessionAttributesPropertyFieldIPAddress: "192.0.2.10",
		}))
		require.NoError(t, cachedStore.SessionAttribute().Refresh(sessionB, map[string]any{
			model.SessionAttributesPropertyFieldIPAddress: "203.0.113.42",
		}))

		cachedStore.sessionAttribute.handleClusterInvalidateSessionAttributes(&model.ClusterMessage{
			Event: model.ClusterEventInvalidateCacheForSessionAttributes,
			Data:  clearCacheMessageData,
		})

		_, err = cachedStore.SessionAttribute().Get(sessionA)
		require.ErrorIs(t, err, cache.ErrKeyNotFound)
		_, err = cachedStore.SessionAttribute().Get(sessionB)
		require.ErrorIs(t, err, cache.ErrKeyNotFound)
	})
}
