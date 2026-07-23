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
	t.Run("feature flag off returns feature disabled", func(t *testing.T) {
		t.Setenv("MM_FEATUREFLAGS_ENABLEORGROLEMANAGEMENT", "false")
		th := Setup(t).InitBasic(t)

		route := "/teams/" + th.BasicTeam.Id + "/positions"
		resp, err := th.SystemAdminClient.DoAPIGet(context.Background(), route, "")
		require.Error(t, err)
		appErr, ok := err.(*model.AppError)
		require.True(t, ok)
		require.Equal(t, "api.team.org_roles.feature_disabled.app_error", appErr.Id)
		require.Equal(t, http.StatusNotImplemented, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("feature flag on enforces permission checks", func(t *testing.T) {
		t.Setenv("MM_FEATUREFLAGS_ENABLEORGROLEMANAGEMENT", "true")
		th := Setup(t).InitBasic(t)

		route := "/teams/" + th.BasicTeam.Id + "/positions"
		resp, err := th.SystemAdminClient.DoAPIGet(context.Background(), route, "")
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		closeBody(resp)

		resp, err = th.Client.DoAPIGet(context.Background(), route, "")
		require.Error(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		closeBody(resp)
	})
}

func TestTeamOrgRolesTeamAdminPermission(t *testing.T) {
	th := Setup(t).InitBasic(t)

	route := "/teams/" + th.BasicTeam.Id + "/positions"

	t.Run("regular team member without MANAGE_TEAM_ROLES is forbidden", func(t *testing.T) {
		resp, err := th.Client.DoAPIGet(context.Background(), route, "")
		require.Error(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("team_admin (MANAGE_TEAM_ROLES) can read team org roles", func(t *testing.T) {
		th.UpdateUserToTeamAdmin(t, th.BasicUser, th.BasicTeam)
		appErr := th.App.Srv().InvalidateAllCaches()
		require.Nil(t, appErr)
		th.LoginBasic(t)

		resp, err := th.Client.DoAPIGet(context.Background(), route, "")
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("team_admin can create team org roles", func(t *testing.T) {
		resp, err := th.Client.DoAPIPost(context.Background(), route, `{"name":"QA Lead","rank":1}`)
		if err != nil {
			if appErr, ok := err.(*model.AppError); ok && appErr.Id == "app.org_role.unsupported_store.app_error" {
				closeBody(resp)
				t.Skip("org role create API requires SQLStore in this test setup")
			}
		}
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("team_admin of a different team is forbidden on this team's org roles", func(t *testing.T) {
		otherTeam := th.CreateTeamWithClient(t, th.SystemAdminClient)
		th.LinkUserToTeam(t, th.BasicUser2, otherTeam)
		th.UpdateUserToTeamAdmin(t, th.BasicUser2, otherTeam)
		appErr := th.App.Srv().InvalidateAllCaches()
		require.Nil(t, appErr)

		client2 := th.CreateClient()
		th.LoginBasic2WithClient(t, client2)

		resp, err := client2.DoAPIGet(context.Background(), route, "")
		require.Error(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		closeBody(resp)
	})
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

// TestUpdateUserOrgProfileSyncsUserProps verifies the bridge between a
// UserOrgProfile assignment and the Mattermost User.Props keys
// (org_unit_ids/position_codes/is_ceo) that the boards plugin webapp's
// org-context card-property filter reads from. position_codes stores
// PositionDefinition.Code (not ID) values, since the boards webapp matches
// them against human-readable card-property options; boards' own board-ACL
// evaluator does not read this prop at all, and instead re-resolves a user's
// positions by ID directly from UserOrgProfiles. "CEO" full visibility is
// derived from whether the assigned position has FullVisibility set, not from
// a per-user flag.
func TestUpdateUserOrgProfileSyncsUserProps(t *testing.T) {
	th := Setup(t).InitBasic(t)

	positionRoute := "/teams/" + th.BasicTeam.Id + "/positions"
	resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), positionRoute, `{"name":"Team Lead","rank":1,"full_visibility":false}`)
	if err != nil {
		if appErr, ok := err.(*model.AppError); ok && appErr.Id == "app.org_role.unsupported_store.app_error" {
			closeBody(resp)
			t.Skip("org role API requires SQLStore in this test setup")
		}
	}
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	var regularPosition model.PositionDefinition
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&regularPosition))
	closeBody(resp)

	resp, err = th.SystemAdminClient.DoAPIPost(context.Background(), positionRoute, `{"name":"CEO","rank":0,"full_visibility":true}`)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	var ceoPosition model.PositionDefinition
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&ceoPosition))
	closeBody(resp)

	orgUnitRoute := "/teams/" + th.BasicTeam.Id + "/org-units"
	resp, err = th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, `{"name":"Engineering","type":"department","parent_id":""}`)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	var orgUnit model.OrgUnit
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&orgUnit))
	closeBody(resp)

	profileRoute := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser.Id + "/org-profile"
	assignRegularPayload := `{"primary_position_id":"` + regularPosition.ID + `","primary_org_unit_id":"` + orgUnit.ID + `"}`
	resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), profileRoute, assignRegularPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	closeBody(resp)

	user, _, err := th.SystemAdminClient.GetUser(context.Background(), th.BasicUser.Id, "")
	require.NoError(t, err)
	require.Equal(t, orgUnit.ID, user.Props["org_unit_ids"])
	require.Equal(t, regularPosition.Code, user.Props["position_codes"])
	require.Equal(t, "false", user.Props["is_ceo"])

	assignCEOPayload := `{"primary_position_id":"` + ceoPosition.ID + `","primary_org_unit_id":"` + orgUnit.ID + `"}`
	resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), profileRoute, assignCEOPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	closeBody(resp)

	user, _, err = th.SystemAdminClient.GetUser(context.Background(), th.BasicUser.Id, "")
	require.NoError(t, err)
	require.Equal(t, ceoPosition.Code, user.Props["position_codes"])
	require.Equal(t, "true", user.Props["is_ceo"])

	// Primary + Extra positions: position_codes must serialize both Codes,
	// primary first, in the same order UserOrgProfile stores them.
	assignMultiPayload := `{"primary_position_id":"` + regularPosition.ID + `","primary_org_unit_id":"` + orgUnit.ID + `","extra_positions":["` + ceoPosition.ID + `"]}`
	resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), profileRoute, assignMultiPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	closeBody(resp)

	user, _, err = th.SystemAdminClient.GetUser(context.Background(), th.BasicUser.Id, "")
	require.NoError(t, err)
	require.Equal(t, regularPosition.Code+","+ceoPosition.Code, user.Props["position_codes"])
	require.Equal(t, "true", user.Props["is_ceo"])

	clearPayload := `{"primary_position_id":"","primary_org_unit_id":""}`
	resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), profileRoute, clearPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	closeBody(resp)

	user, _, err = th.SystemAdminClient.GetUser(context.Background(), th.BasicUser.Id, "")
	require.NoError(t, err)
	require.Equal(t, "", user.Props["org_unit_ids"])
	require.Equal(t, "", user.Props["position_codes"])
	require.Equal(t, "false", user.Props["is_ceo"])
}
