// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"testing"
	"time"

	"github.com/mattermost/mattermost/server/public/model"
	storemocks "github.com/mattermost/mattermost/server/v8/channels/store/storetest/mocks"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestInvalidateUserPropertyValuesEpochs_GatedOnABAC(t *testing.T) {
	userID := model.NewId()

	// Returns the attributes store mock so assertions can name the method rather than the
	// Store.Attributes() accessor, which the config listener also calls.
	setup := func(t *testing.T, flag bool, abac bool) (*TestHelper, *storemocks.AttributesStore) {
		thMock := SetupConfigWithStoreMock(t, func(cfg *model.Config) {
			cfg.FeatureFlags.PermissionPolicies = flag
			cfg.AccessControlSettings.EnableAttributeBasedAccessControl = model.NewPointer(abac)
		})

		mockAttributes := &storemocks.AttributesStore{}
		thMock.App.Srv().Store().(*storemocks.Store).On("Attributes").Return(mockAttributes).Maybe()

		return thMock, mockAttributes
	}

	values := []*model.PropertyValue{
		{TargetType: model.PropertyValueTargetTypeUser, TargetID: userID},
		{TargetType: model.PropertyValueTargetTypeUser, TargetID: userID}, // duplicate, one invalidation
		{TargetType: model.PropertyValueTargetTypePost, TargetID: model.NewId()},
	}

	t.Run("no invalidation when the feature flag is off", func(t *testing.T) {
		thMock, mockAttributes := setup(t, false, true)

		thMock.App.invalidateUserPropertyValuesEpochs(values)
		thMock.App.invalidateUserPropertyValuesEpoch(model.PropertyValueTargetTypeUser, userID)

		mockAttributes.AssertNotCalled(t, "InvalidateUserPropertyValuesEpoch", mock.Anything)
		mockAttributes.AssertNotCalled(t, "InvalidateUserAttributes", mock.Anything)
	})

	t.Run("no invalidation when ABAC is off", func(t *testing.T) {
		thMock, mockAttributes := setup(t, true, false)

		thMock.App.invalidateUserPropertyValuesEpochs(values)

		mockAttributes.AssertNotCalled(t, "InvalidateUserPropertyValuesEpoch", mock.Anything)
		mockAttributes.AssertNotCalled(t, "InvalidateUserAttributes", mock.Anything)
	})

	t.Run("one invalidation per distinct user target when active", func(t *testing.T) {
		thMock, mockAttributes := setup(t, true, true)
		mockAttributes.On("InvalidateUserPropertyValuesEpoch", userID).Once()
		mockAttributes.On("InvalidateUserAttributes", userID).Once()

		thMock.App.invalidateUserPropertyValuesEpochs(values)

		mockAttributes.AssertExpectations(t)
	})

	t.Run("single-target form skips non-user targets", func(t *testing.T) {
		thMock, mockAttributes := setup(t, true, true)

		thMock.App.invalidateUserPropertyValuesEpoch(model.PropertyValueTargetTypePost, model.NewId())

		mockAttributes.AssertNotCalled(t, "InvalidateUserPropertyValuesEpoch", mock.Anything)
		mockAttributes.AssertNotCalled(t, "InvalidateUserAttributes", mock.Anything)
	})

	// A write made while ABAC was off must not leave the view stale for a switch back on to read,
	// and the marker is free, so only the epoch half is gated.
	t.Run("the view is marked stale even when ABAC is off", func(t *testing.T) {
		thMock, _ := setup(t, true, false)
		ch := thMock.App.Srv().Channels()

		ch.attributeViewRefreshLast = time.Now()
		thMock.App.invalidateUserPropertyValuesEpochs(values)
		require.True(t, ch.attributeViewRefreshLast.IsZero(), "a user-targeted write should mark the view stale")

		ch.attributeViewRefreshLast = time.Now()
		thMock.App.invalidateUserPropertyValuesEpoch(model.PropertyValueTargetTypeUser, userID)
		require.True(t, ch.attributeViewRefreshLast.IsZero(), "the single-target form should too")
	})

	t.Run("no user target means no invalidation of either kind", func(t *testing.T) {
		thMock, mockAttributes := setup(t, true, true)
		ch := thMock.App.Srv().Channels()
		now := time.Now()
		ch.attributeViewRefreshLast = now

		thMock.App.invalidateUserPropertyValuesEpochs([]*model.PropertyValue{
			{TargetType: model.PropertyValueTargetTypePost, TargetID: model.NewId()},
			nil,
		})

		require.Equal(t, now, ch.attributeViewRefreshLast)
		mockAttributes.AssertNotCalled(t, "InvalidateUserPropertyValuesEpoch", mock.Anything)
	})
}
