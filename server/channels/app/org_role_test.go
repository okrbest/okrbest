// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
)

func TestGenerateOrgRoleCodeBase(t *testing.T) {
	t.Run("normalizes name", func(t *testing.T) {
		code := generateOrgRoleCodeBase("  Senior Engineer / R&D  ", orgRolePositionPrefix)
		require.Equal(t, "senior-engineer-r-d", code)
	})

	t.Run("falls back to prefix when empty", func(t *testing.T) {
		code := generateOrgRoleCodeBase("###", orgRoleDepartmentPrefix)
		require.Equal(t, orgRoleDepartmentPrefix, code)
	})

	t.Run("trims max length", func(t *testing.T) {
		name := strings.Repeat("a", 80)
		code := generateOrgRoleCodeBase(name, orgRolePositionPrefix)
		require.Len(t, code, orgRoleCodeMaxLen)
	})
}

func TestGenerateOrgRoleCodeCandidate(t *testing.T) {
	base := "engineering-manager"

	require.Equal(t, "engineering-manager", generateOrgRoleCodeCandidate(base, 0))
	require.Equal(t, "engineering-manager-2", generateOrgRoleCodeCandidate(base, 1))
	require.Equal(t, "engineering-manager-3", generateOrgRoleCodeCandidate(base, 2))

	longBase := strings.Repeat("a", orgRoleCodeMaxLen)
	candidate := generateOrgRoleCodeCandidate(longBase, 10)
	require.Len(t, candidate, orgRoleCodeMaxLen)
	require.True(t, strings.HasSuffix(candidate, "-11"))
}

func TestOrgUnitCodePrefix(t *testing.T) {
	require.Equal(t, orgRoleDepartmentPrefix, orgUnitCodePrefix("department"))
	require.Equal(t, orgRoleTeamPrefix, orgUnitCodePrefix("team"))
	require.Equal(t, orgRoleFallbackPrefix, orgUnitCodePrefix("unknown"))
	require.Equal(t, orgRoleDivisionPrefix, orgUnitCodePrefix("division"))
}

func setupOrgRoleDBHelper(t *testing.T) *TestHelper {
	th := Setup(t).InitBasic(t)
	th.Server.Platform().SetSqlStore(th.GetSqlStore())
	return th
}

func TestDutyDefinitionLifecycle(t *testing.T) {
	th := setupOrgRoleDBHelper(t)
	teamID := th.BasicTeam.Id
	actorID := th.BasicUser.Id

	t.Run("duty creation uses duty code prefix and keeps full_visibility", func(t *testing.T) {
		duty, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
			TeamID:         teamID,
			Name:           "팀장",
			Kind:           model.PositionKindDuty,
			FullVisibility: true, // 보드 전체보기 권한은 직책에서 관리한다
		})
		require.Nil(t, appErr)
		require.Equal(t, model.PositionKindDuty, duty.Kind)
		require.True(t, duty.FullVisibility)
		require.True(t, strings.HasPrefix(duty.Code, "duty"))
	})

	t.Run("position creation forces full_visibility off", func(t *testing.T) {
		position, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
			TeamID:         teamID,
			Name:           "전무",
			Kind:           model.PositionKindPosition,
			FullVisibility: true, // 직위에선 강제 해제
		})
		require.Nil(t, appErr)
		require.False(t, position.FullVisibility)
	})

	t.Run("full-visibility duty assignment marks the user as CEO-visibility", func(t *testing.T) {
		duty, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
			TeamID:         teamID,
			Name:           "총괄임원",
			Kind:           model.PositionKindDuty,
			FullVisibility: true,
		})
		require.Nil(t, appErr)

		_, appErr = th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:        teamID,
			UserID:        th.BasicUser2.Id,
			PrimaryDutyID: duty.ID,
		})
		require.Nil(t, appErr)

		user, appErr := th.App.GetUser(th.BasicUser2.Id)
		require.Nil(t, appErr)
		require.Equal(t, "true", user.Props["is_ceo"])

		// 해제하면 회수
		_, appErr = th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID: teamID,
			UserID: th.BasicUser2.Id,
		})
		require.Nil(t, appErr)
		user, appErr = th.App.GetUser(th.BasicUser2.Id)
		require.Nil(t, appErr)
		require.Equal(t, "false", user.Props["is_ceo"])
	})

	t.Run("omitted kind is normalized to position", func(t *testing.T) {
		position, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
			TeamID: teamID,
			Name:   "차장",
		})
		require.Nil(t, appErr)
		require.Equal(t, model.PositionKindPosition, position.Kind)
	})

	t.Run("kind change between position and duty rejected", func(t *testing.T) {
		duty, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
			TeamID: teamID,
			Name:   "파트장",
			Kind:   model.PositionKindDuty,
		})
		require.Nil(t, appErr)

		duty.Kind = model.PositionKindPosition
		_, appErr = th.App.UpdatePositionDefinition(actorID, duty)
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.kind_change_not_allowed.app_error", appErr.Id)
	})
}

func TestOrgUnitParentValidation(t *testing.T) {
	th := setupOrgRoleDBHelper(t)
	teamID := th.BasicTeam.Id
	actorID := th.BasicUser.Id

	division, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
		TeamID: teamID,
		Name:   "경영지원본부",
		Type:   model.OrgUnitTypeDivision,
	})
	require.Nil(t, appErr)
	require.Equal(t, model.OrgUnitTypeDivision, division.Type)
	require.True(t, strings.HasPrefix(division.Code, "div"))

	t.Run("department under active division succeeds", func(t *testing.T) {
		dept, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID:   teamID,
			Name:     "인사팀",
			Type:     model.OrgUnitTypeDepartment,
			ParentID: division.ID,
		})
		require.Nil(t, appErr)
		require.Equal(t, division.ID, dept.ParentID)
	})

	t.Run("department with nonexistent parent rejected", func(t *testing.T) {
		_, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID:   teamID,
			Name:     "유령팀",
			Type:     model.OrgUnitTypeDepartment,
			ParentID: model.NewId(),
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_parent.app_error", appErr.Id)
	})

	t.Run("department parent must be a division", func(t *testing.T) {
		otherDept, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "총무팀",
			Type:   model.OrgUnitTypeDepartment,
		})
		require.Nil(t, appErr)

		_, appErr = th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID:   teamID,
			Name:     "총무하위팀",
			Type:     model.OrgUnitTypeDepartment,
			ParentID: otherDept.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_parent.app_error", appErr.Id)
	})

	t.Run("department parent must belong to same team", func(t *testing.T) {
		otherTeam := th.CreateTeam(t)
		otherDivision, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: otherTeam.Id,
			Name:   "타사본부",
			Type:   model.OrgUnitTypeDivision,
		})
		require.Nil(t, appErr)

		_, appErr = th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID:   teamID,
			Name:     "월경팀",
			Type:     model.OrgUnitTypeDepartment,
			ParentID: otherDivision.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_parent.app_error", appErr.Id)
	})

	t.Run("department parent must be active", func(t *testing.T) {
		idleDivision, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "휴면본부",
			Type:   model.OrgUnitTypeDivision,
		})
		require.Nil(t, appErr)

		idleDivision.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, idleDivision)
		require.Nil(t, appErr)

		_, appErr = th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID:   teamID,
			Name:     "휴면하위팀",
			Type:     model.OrgUnitTypeDepartment,
			ParentID: idleDivision.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_parent.app_error", appErr.Id)
	})

	t.Run("type change between department and division rejected", func(t *testing.T) {
		dept, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "고정팀",
			Type:   model.OrgUnitTypeDepartment,
		})
		require.Nil(t, appErr)

		dept.Type = model.OrgUnitTypeDivision
		_, appErr = th.App.UpdateOrgUnit(actorID, dept)
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.type_change_not_allowed.app_error", appErr.Id)
	})
}

func TestOrgUnitDivisionDeactivationGuard(t *testing.T) {
	th := setupOrgRoleDBHelper(t)
	teamID := th.BasicTeam.Id
	actorID := th.BasicUser.Id

	t.Run("blocked while an active child department exists", func(t *testing.T) {
		division, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "생산본부",
			Type:   model.OrgUnitTypeDivision,
		})
		require.Nil(t, appErr)

		child, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID:   teamID,
			Name:     "생산1팀",
			Type:     model.OrgUnitTypeDepartment,
			ParentID: division.ID,
		})
		require.Nil(t, appErr)

		division.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.division_has_children.app_error", appErr.Id)

		// 하위 부서를 무소속으로 이관하면 비활성화 가능
		child.ParentID = ""
		_, appErr = th.App.UpdateOrgUnit(actorID, child)
		require.Nil(t, appErr)

		division.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.Nil(t, appErr)
	})

	t.Run("blocked while a user is assigned directly", func(t *testing.T) {
		division, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "영업본부",
			Type:   model.OrgUnitTypeDivision,
		})
		require.Nil(t, appErr)

		_, err := th.GetSqlStore().UpsertUserOrgProfile(&model.UserOrgProfile{
			TeamID:           teamID,
			UserID:           th.BasicUser2.Id,
			PrimaryOrgUnitID: division.ID,
		})
		require.NoError(t, err)

		division.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.division_has_members.app_error", appErr.Id)

		// 직속 배정 해제 후에는 비활성화 가능
		_, err = th.GetSqlStore().UpsertUserOrgProfile(&model.UserOrgProfile{
			TeamID:           teamID,
			UserID:           th.BasicUser2.Id,
			PrimaryOrgUnitID: "",
		})
		require.NoError(t, err)

		division.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.Nil(t, appErr)
	})

	t.Run("assignment to active division succeeds and inactive is rejected", func(t *testing.T) {
		division, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "연구본부",
			Type:   model.OrgUnitTypeDivision,
		})
		require.Nil(t, appErr)

		profile, appErr := th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:           teamID,
			UserID:           th.BasicUser.Id,
			PrimaryOrgUnitID: division.ID,
		})
		require.Nil(t, appErr)
		require.Equal(t, division.ID, profile.PrimaryOrgUnitID)

		// 배정 해제 후 본부 비활성화
		_, appErr = th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID: teamID,
			UserID: th.BasicUser.Id,
		})
		require.Nil(t, appErr)

		division.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.Nil(t, appErr)

		// 비활성 조직으로는 배정 불가
		_, appErr = th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:           teamID,
			UserID:           th.BasicUser.Id,
			PrimaryOrgUnitID: division.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_org_unit_assignment.app_error", appErr.Id)
	})

	t.Run("reactivation needs no guard", func(t *testing.T) {
		division, appErr := th.App.CreateOrgUnit(actorID, &model.OrgUnit{
			TeamID: teamID,
			Name:   "재가동본부",
			Type:   model.OrgUnitTypeDivision,
		})
		require.Nil(t, appErr)

		division.Active = false
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.Nil(t, appErr)

		division.Active = true
		_, appErr = th.App.UpdateOrgUnit(actorID, division)
		require.Nil(t, appErr)
	})
}

func TestDutyAssignmentValidation(t *testing.T) {
	th := setupOrgRoleDBHelper(t)
	teamID := th.BasicTeam.Id
	actorID := th.BasicUser.Id

	duty, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
		TeamID: teamID,
		Name:   "팀장",
		Kind:   model.PositionKindDuty,
	})
	require.Nil(t, appErr)

	position, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
		TeamID: teamID,
		Name:   "부장",
		Kind:   model.PositionKindPosition,
	})
	require.Nil(t, appErr)

	t.Run("position and duty are assigned independently", func(t *testing.T) {
		profile, appErr := th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:            teamID,
			UserID:            th.BasicUser.Id,
			PrimaryPositionID: position.ID,
			PrimaryDutyID:     duty.ID,
		})
		require.Nil(t, appErr)
		require.Equal(t, position.ID, profile.PrimaryPositionID)
		require.Equal(t, duty.ID, profile.PrimaryDutyID)

		// 직책만 해제해도 직위는 유지
		profile, appErr = th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:            teamID,
			UserID:            th.BasicUser.Id,
			PrimaryPositionID: position.ID,
			PrimaryDutyID:     "",
		})
		require.Nil(t, appErr)
		require.Equal(t, position.ID, profile.PrimaryPositionID)
		require.Empty(t, profile.PrimaryDutyID)
	})

	t.Run("position id in the duty slot rejected", func(t *testing.T) {
		_, appErr := th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:        teamID,
			UserID:        th.BasicUser.Id,
			PrimaryDutyID: position.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_duty_assignment.app_error", appErr.Id)
	})

	t.Run("duty id in the position slot rejected", func(t *testing.T) {
		_, appErr := th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:            teamID,
			UserID:            th.BasicUser.Id,
			PrimaryPositionID: duty.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_position_assignment.app_error", appErr.Id)
	})

	t.Run("inactive duty rejected", func(t *testing.T) {
		idleDuty, appErr := th.App.CreatePositionDefinition(actorID, &model.PositionDefinition{
			TeamID: teamID,
			Name:   "휴면직책",
			Kind:   model.PositionKindDuty,
		})
		require.Nil(t, appErr)

		idleDuty.Active = false
		_, appErr = th.App.UpdatePositionDefinition(actorID, idleDuty)
		require.Nil(t, appErr)

		_, appErr = th.App.UpsertUserOrgProfile(th.Context, actorID, &model.UserOrgProfile{
			TeamID:        teamID,
			UserID:        th.BasicUser.Id,
			PrimaryDutyID: idleDuty.ID,
		})
		require.NotNil(t, appErr)
		require.Equal(t, "app.org_role.invalid_duty_assignment.app_error", appErr.Id)
	})
}
