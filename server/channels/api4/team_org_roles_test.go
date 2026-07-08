// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package api4

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
)

func TestTeamOrgRolesFeatureFlag(t *testing.T) {
	th := Setup(t).InitBasic(t)

	route := "/teams/" + th.BasicTeam.Id + "/positions"

	resp, err := th.SystemAdminClient.DoAPIGet(context.Background(), route, "")
	if err != nil {
		appErr, ok := err.(*model.AppError)
		require.True(t, ok)
		require.NotEqual(t, "api.team.org_roles.feature_disabled.app_error", appErr.Id)
	} else {
		require.Equal(t, http.StatusOK, resp.StatusCode)
	}
	closeBody(resp)

	resp, err = th.Client.DoAPIGet(context.Background(), route, "")
	require.Error(t, err)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)
	closeBody(resp)
}

func TestTeamOrgRolesCreateAutoCode(t *testing.T) {
	th := Setup(t).InitBasic(t)

	positionRoute := "/teams/" + th.BasicTeam.Id + "/positions"
	firstPositionPayload := `{"code":"manual_code","name":"QA Lead","rank":5}`

	resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), positionRoute, firstPositionPayload)
	if err != nil {
		if appErr, ok := err.(*model.AppError); ok && appErr.Id == "app.org_role.unsupported_store.app_error" {
			closeBody(resp)
			t.Skip("org role create API requires SQLStore in this test setup")
		}
	}
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var firstPosition model.PositionDefinition
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&firstPosition))
	closeBody(resp)
	require.Equal(t, "qa-lead", firstPosition.Code)
	require.Equal(t, "QA Lead", firstPosition.Name)

	secondPositionPayload := `{"name":"QA Lead","rank":6}`
	resp, err = th.SystemAdminClient.DoAPIPost(context.Background(), positionRoute, secondPositionPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var secondPosition model.PositionDefinition
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&secondPosition))
	closeBody(resp)
	require.NotEqual(t, firstPosition.Code, secondPosition.Code)
	require.True(t, strings.HasPrefix(secondPosition.Code, "qa-lead"))

	orgUnitRoute := "/teams/" + th.BasicTeam.Id + "/org-units"
	orgUnitPayload := `{"code":"manual_dept","name":"Platform Team","type":"department","parent_id":""}`

	resp, err = th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, orgUnitPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var createdOrgUnit model.OrgUnit
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&createdOrgUnit))
	closeBody(resp)
	require.Equal(t, "platform-team", createdOrgUnit.Code)
	require.Equal(t, "department", createdOrgUnit.Type)
}
