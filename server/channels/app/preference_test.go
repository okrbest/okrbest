// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
)

func TestApplyThemeToAllUsers(t *testing.T) {
	th := Setup(t).InitBasic(t)

	themeValue := `{"sidebarBg":"#1e325c","type":"Denim"}`

	t.Run("invalid theme is rejected and nothing changes", func(t *testing.T) {
		appErr := th.App.ApplyThemeToAllUsers(th.Context, "not-json")
		require.NotNil(t, appErr)
		require.Equal(t, http.StatusBadRequest, appErr.StatusCode)

		_, appErr = th.App.GetPreferenceByCategoryAndNameForUser(th.Context, th.BasicUser.Id, model.PreferenceCategoryTheme, "")
		require.NotNil(t, appErr, "no theme row may be created by a failed apply")
	})

	t.Run("valid theme is applied to all active users", func(t *testing.T) {
		appErr := th.App.ApplyThemeToAllUsers(th.Context, themeValue)
		require.Nil(t, appErr)

		for _, user := range []*model.User{th.BasicUser, th.BasicUser2} {
			pref, appErr := th.App.GetPreferenceByCategoryAndNameForUser(th.Context, user.Id, model.PreferenceCategoryTheme, "")
			require.Nil(t, appErr)
			require.Equal(t, themeValue, pref.Value)
		}
	})
}
