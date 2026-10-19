// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package localcachelayer

import (
	"errors"
	"reflect"
	"strconv"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/v8/channels/store"
	"github.com/mattermost/mattermost/server/v8/platform/services/cache"
)

type sessionAttributeEntry struct {
	Attrs map[string]any
	// ChangedAt advances only when the attribute values change, so the ABAC
	// post ETag is not invalidated by a refresh that carries the same values.
	ChangedAt int64
}

type LocalCacheSessionAttributeStore struct {
	store.SessionAttributeStore
	rootStore *LocalCacheStore
}

func (s *LocalCacheSessionAttributeStore) handleClusterInvalidateSessionAttributes(_ *model.ClusterMessage) {
	if err := s.rootStore.sessionAttributeCache.Purge(); err != nil {
		s.rootStore.logger.Warn("failed to purge session attribute cache", mlog.Err(err))
	}
}

func (s *LocalCacheSessionAttributeStore) Refresh(sessionID string, attrs map[string]any) error {
	entry := &sessionAttributeEntry{Attrs: attrs, ChangedAt: model.GetMillis()}

	var existing *sessionAttributeEntry
	if err := s.rootStore.sessionAttributeCache.Get(sessionID, &existing); err == nil && existing != nil {
		if reflect.DeepEqual(existing.Attrs, attrs) {
			entry.ChangedAt = existing.ChangedAt
		} else if entry.ChangedAt <= existing.ChangedAt {
			// Two changes within the same millisecond must still yield distinct epochs.
			entry.ChangedAt = existing.ChangedAt + 1
		}
	}

	if err := s.rootStore.sessionAttributeCache.SetWithDefaultExpiry(sessionID, entry); err != nil {
		s.rootStore.logger.Warn("failed to set session attribute cache", mlog.Err(err))
		return err
	}
	return nil
}

func (s *LocalCacheSessionAttributeStore) Get(sessionID string) (map[string]any, error) {
	var entry *sessionAttributeEntry
	if err := s.rootStore.sessionAttributeCache.Get(sessionID, &entry); err != nil {
		return nil, err
	}
	return entry.Attrs, nil
}

func (s *LocalCacheSessionAttributeStore) GetEpoch(sessionID string) (string, error) {
	var entry *sessionAttributeEntry
	if err := s.rootStore.sessionAttributeCache.Get(sessionID, &entry); err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return "0", nil
		}
		return "", err
	}
	if entry == nil {
		return "0", nil
	}

	return strconv.FormatInt(entry.ChangedAt, 10), nil
}
