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

// TestGetUserOrgProfileSummary covers the read-only org-profile-summary
// endpoint that lets any member of a team look up a teammate's
// department/position names (as assigned via the admin-only org-profile
// write path), without requiring PermissionManageTeamRoles.
func TestGetUserOrgProfileSummary(t *testing.T) {
	th := Setup(t).InitBasic(t)

	positionRoute := "/teams/" + th.BasicTeam.Id + "/positions"
	resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), positionRoute, `{"name":"Team Lead","rank":1}`)
	if err != nil {
		if appErr, ok := err.(*model.AppError); ok && appErr.Id == "app.org_role.unsupported_store.app_error" {
			closeBody(resp)
			t.Skip("org role API requires SQLStore in this test setup")
		}
	}
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	var position model.PositionDefinition
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&position))
	closeBody(resp)

	orgUnitRoute := "/teams/" + th.BasicTeam.Id + "/org-units"
	resp, err = th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, `{"name":"Engineering","type":"department","parent_id":""}`)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	var orgUnit model.OrgUnit
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&orgUnit))
	closeBody(resp)

	profileRoute := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser2.Id + "/org-profile"
	assignPayload := `{"primary_position_id":"` + position.ID + `","primary_org_unit_id":"` + orgUnit.ID + `"}`
	resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), profileRoute, assignPayload)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	closeBody(resp)

	summaryRouteForUser2 := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser2.Id + "/org-profile-summary"

	t.Run("same team regular member can read a teammate's resolved names", func(t *testing.T) {
		resp, err := th.Client.DoAPIGet(context.Background(), summaryRouteForUser2, "")
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		var summary model.UserOrgProfileSummary
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&summary))
		closeBody(resp)
		require.NotNil(t, summary.DepartmentName)
		require.Equal(t, "Engineering", *summary.DepartmentName)
		require.NotNil(t, summary.PositionName)
		require.Equal(t, "Team Lead", *summary.PositionName)
	})

	t.Run("unassigned teammate resolves to null names", func(t *testing.T) {
		route := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser.Id + "/org-profile-summary"
		resp, err := th.Client.DoAPIGet(context.Background(), route, "")
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		var summary model.UserOrgProfileSummary
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&summary))
		closeBody(resp)
		require.Nil(t, summary.DepartmentName)
		require.Nil(t, summary.PositionName)
	})

	t.Run("department without division resolves null division name", func(t *testing.T) {
		resp, err := th.Client.DoAPIGet(context.Background(), summaryRouteForUser2, "")
		require.NoError(t, err)
		var summary model.UserOrgProfileSummary
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&summary))
		closeBody(resp)
		require.Nil(t, summary.DivisionName)
	})

	t.Run("division hierarchy resolves division and department names", func(t *testing.T) {
		resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, `{"name":"경영지원본부","type":"division","parent_id":""}`)
		require.NoError(t, err)
		var division model.OrgUnit
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&division))
		closeBody(resp)

		resp, err = th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, `{"name":"재무팀","type":"department","parent_id":"`+division.ID+`"}`)
		require.NoError(t, err)
		var childDept model.OrgUnit
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&childDept))
		closeBody(resp)

		userProfileRoute := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser.Id + "/org-profile"
		resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), userProfileRoute, `{"primary_position_id":"","primary_org_unit_id":"`+childDept.ID+`"}`)
		require.NoError(t, err)
		closeBody(resp)

		summaryRoute := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser.Id + "/org-profile-summary"
		resp, err = th.Client.DoAPIGet(context.Background(), summaryRoute, "")
		require.NoError(t, err)
		var summary model.UserOrgProfileSummary
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&summary))
		closeBody(resp)
		require.NotNil(t, summary.DivisionName)
		require.Equal(t, "경영지원본부", *summary.DivisionName)
		require.NotNil(t, summary.DepartmentName)
		require.Equal(t, "재무팀", *summary.DepartmentName)

		// 본부 직속 배정: division 이름만 채워지고 department는 null
		resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), userProfileRoute, `{"primary_position_id":"","primary_org_unit_id":"`+division.ID+`"}`)
		require.NoError(t, err)
		closeBody(resp)

		resp, err = th.Client.DoAPIGet(context.Background(), summaryRoute, "")
		require.NoError(t, err)
		var directSummary model.UserOrgProfileSummary
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&directSummary))
		closeBody(resp)
		require.NotNil(t, directSummary.DivisionName)
		require.Equal(t, "경영지원본부", *directSummary.DivisionName)
		require.Nil(t, directSummary.DepartmentName)

		// 다음 서브테스트를 위해 배정 해제
		resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), userProfileRoute, `{"primary_position_id":"","primary_org_unit_id":""}`)
		require.NoError(t, err)
		closeBody(resp)
	})

	t.Run("requester who is not a member of the team is forbidden", func(t *testing.T) {
		outsider := th.CreateUser(t)
		outsiderClient := th.CreateClient()
		_, _, loginErr := outsiderClient.Login(context.Background(), outsider.Email, outsider.Password)
		require.NoError(t, loginErr)

		resp, err := outsiderClient.DoAPIGet(context.Background(), summaryRouteForUser2, "")
		require.Error(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("target user who is not a member of the team is not found", func(t *testing.T) {
		outsider := th.CreateUser(t)

		route := "/teams/" + th.BasicTeam.Id + "/users/" + outsider.Id + "/org-profile-summary"
		resp, err := th.Client.DoAPIGet(context.Background(), route, "")
		require.Error(t, err)
		require.Equal(t, http.StatusNotFound, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("feature flag off returns feature disabled", func(t *testing.T) {
		t.Setenv("MM_FEATUREFLAGS_ENABLEORGROLEMANAGEMENT", "false")
		th2 := Setup(t).InitBasic(t)

		route := "/teams/" + th2.BasicTeam.Id + "/users/" + th2.BasicUser.Id + "/org-profile-summary"
		resp, err := th2.SystemAdminClient.DoAPIGet(context.Background(), route, "")
		require.Error(t, err)
		appErr, ok := err.(*model.AppError)
		require.True(t, ok)
		require.Equal(t, "api.team.org_roles.feature_disabled.app_error", appErr.Id)
		require.Equal(t, http.StatusNotImplemented, resp.StatusCode)
		closeBody(resp)
	})
}

func TestTeamOrgUnitHierarchyAPI(t *testing.T) {
	th := Setup(t).InitBasic(t)

	orgUnitRoute := "/teams/" + th.BasicTeam.Id + "/org-units"

	createOrgUnit := func(t *testing.T, payload string) model.OrgUnit {
		t.Helper()
		resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, payload)
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, resp.StatusCode)
		var unit model.OrgUnit
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&unit))
		closeBody(resp)
		return unit
	}

	division := createOrgUnit(t, `{"name":"경영지원본부","type":"division","parent_id":""}`)
	require.Equal(t, model.OrgUnitTypeDivision, division.Type)
	require.True(t, strings.HasPrefix(division.Code, "div"))

	t.Run("team type creation rejected", func(t *testing.T) {
		resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, `{"name":"고객사","type":"team"}`)
		require.Error(t, err)
		require.Equal(t, http.StatusBadRequest, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("division with parent rejected", func(t *testing.T) {
		resp, err := th.SystemAdminClient.DoAPIPost(context.Background(), orgUnitRoute, `{"name":"하위본부","type":"division","parent_id":"`+division.ID+`"}`)
		require.Error(t, err)
		require.Equal(t, http.StatusBadRequest, resp.StatusCode)
		closeBody(resp)
	})

	t.Run("department transfer keeps user assignment and writes audit logs", func(t *testing.T) {
		dept := createOrgUnit(t, `{"name":"인사팀","type":"department","parent_id":""}`)

		profileRoute := "/teams/" + th.BasicTeam.Id + "/users/" + th.BasicUser.Id + "/org-profile"
		resp, err := th.SystemAdminClient.DoAPIPut(context.Background(), profileRoute, `{"primary_position_id":"","primary_org_unit_id":"`+dept.ID+`"}`)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		closeBody(resp)

		transferPayload := `{"code":"` + dept.Code + `","name":"` + dept.Name + `","type":"department","parent_id":"` + division.ID + `","active":true}`
		resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), orgUnitRoute+"/"+dept.ID, transferPayload)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		var transferred model.OrgUnit
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&transferred))
		closeBody(resp)
		require.Equal(t, division.ID, transferred.ParentID)

		// 이관 후에도 배정 불변 (FR-004)
		profile, appErr := th.App.GetUserOrgProfile(th.BasicTeam.Id, th.BasicUser.Id)
		require.Nil(t, appErr)
		require.Equal(t, dept.ID, profile.PrimaryOrgUnitID)

		// 생성·이관이 감사 로그에 남는다 (FR-012)
		logs, appErr := th.App.ListOrgRoleAuditLogs(th.BasicTeam.Id, 0, 50)
		require.Nil(t, appErr)
		var sawCreate, sawUpdate bool
		for _, l := range logs {
			if l.EntityID == dept.ID && l.Action == "org_unit.create" {
				sawCreate = true
			}
			if l.EntityID == dept.ID && l.Action == "org_unit.update" {
				sawUpdate = true
			}
		}
		require.True(t, sawCreate, "create audit log missing")
		require.True(t, sawUpdate, "update(transfer) audit log missing")
	})

	t.Run("division deactivation blocked with children then allowed after transfer", func(t *testing.T) {
		blockedDivision := createOrgUnit(t, `{"name":"생산본부","type":"division","parent_id":""}`)
		child := createOrgUnit(t, `{"name":"생산1팀","type":"department","parent_id":"`+blockedDivision.ID+`"}`)

		deactivatePayload := `{"code":"` + blockedDivision.Code + `","name":"` + blockedDivision.Name + `","type":"division","parent_id":"","active":false}`
		resp, err := th.SystemAdminClient.DoAPIPut(context.Background(), orgUnitRoute+"/"+blockedDivision.ID, deactivatePayload)
		require.Error(t, err)
		require.Equal(t, http.StatusConflict, resp.StatusCode)
		appErr, ok := err.(*model.AppError)
		require.True(t, ok)
		require.Equal(t, "app.org_role.division_has_children.app_error", appErr.Id)
		closeBody(resp)

		detachPayload := `{"code":"` + child.Code + `","name":"` + child.Name + `","type":"department","parent_id":"","active":true}`
		resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), orgUnitRoute+"/"+child.ID, detachPayload)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		closeBody(resp)

		resp, err = th.SystemAdminClient.DoAPIPut(context.Background(), orgUnitRoute+"/"+blockedDivision.ID, deactivatePayload)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		closeBody(resp)
	})
}
