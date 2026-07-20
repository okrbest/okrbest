// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/public/shared/request"
	"github.com/mattermost/mattermost/server/v8/channels/store/sqlstore"
)

// Props keys read by the boards plugin's board-ACL evaluator
// (server/services/permissions/mmpermissions/mmpermissions.go resolveOrgContext)
// and by its webapp (store/users.ts getMyOrgContext). Keep these literal
// strings in sync with okrbest-plugin-newboards/server/model/board_permissions.go.
const (
	userPropOrgUnitIDs    = "org_unit_ids"
	userPropPositionCodes = "position_codes"
	userPropIsCEO         = "is_ceo"
)

const (
	orgRoleCodeMaxLen       = 64
	orgRoleCodeRetryLimit   = 20
	orgRolePositionPrefix   = "position"
	orgRoleDepartmentPrefix = "department"
	orgRoleTeamPrefix       = "team"
	orgRoleFallbackPrefix   = "orgunit"
)

var orgRoleCodeTokenRegex = regexp.MustCompile(`[^a-z0-9]+`)

func generateOrgRoleCodeBase(name string, fallbackPrefix string) string {
	normalized := strings.ToLower(strings.TrimSpace(name))
	normalized = orgRoleCodeTokenRegex.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "-")
	if normalized == "" {
		normalized = fallbackPrefix
	}

	if len(normalized) > orgRoleCodeMaxLen {
		normalized = strings.Trim(normalized[:orgRoleCodeMaxLen], "-")
		if normalized == "" {
			normalized = fallbackPrefix
		}
	}

	return normalized
}

func generateOrgRoleCodeCandidate(base string, collisionIndex int) string {
	if collisionIndex <= 0 {
		return base
	}

	suffix := fmt.Sprintf("-%d", collisionIndex+1)
	availableBaseLen := orgRoleCodeMaxLen - len(suffix)
	if availableBaseLen <= 0 {
		return suffix[1:]
	}

	trimmedBase := base
	if len(trimmedBase) > availableBaseLen {
		trimmedBase = strings.Trim(trimmedBase[:availableBaseLen], "-")
	}
	if trimmedBase == "" {
		trimmedBase = "x"
	}

	return trimmedBase + suffix
}

func orgUnitCodePrefix(orgUnitType string) string {
	switch orgUnitType {
	case "department":
		return orgRoleDepartmentPrefix
	case "team":
		return orgRoleTeamPrefix
	default:
		return orgRoleFallbackPrefix
	}
}

func (a *App) orgRoleSQLStore() (*sqlstore.SqlStore, *model.AppError) {
	ss := a.Srv().SQLStore()
	if ss == nil {
		return nil, model.NewAppError("orgRoleSQLStore", "app.org_role.unsupported_store.app_error", nil, "", http.StatusNotImplemented)
	}

	return ss, nil
}

func (a *App) ListPositionDefinitions(teamID string, includeInactive bool) ([]*model.PositionDefinition, *model.AppError) {
	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	items, err := ss.ListPositionDefinitions(teamID, includeInactive)
	if err != nil {
		return nil, model.NewAppError("ListPositionDefinitions", "app.org_role.list_positions.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	return items, nil
}

func (a *App) CreatePositionDefinition(actorUserID string, input *model.PositionDefinition) (*model.PositionDefinition, *model.AppError) {
	if !input.IsValidForCreate() {
		return nil, model.NewAppError("CreatePositionDefinition", "app.org_role.invalid_position.app_error", nil, "", http.StatusBadRequest)
	}

	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	baseCode := generateOrgRoleCodeBase(input.Name, orgRolePositionPrefix)
	input.Active = true

	var (
		item *model.PositionDefinition
		err  error
	)

	for collisionIndex := 0; collisionIndex < orgRoleCodeRetryLimit; collisionIndex++ {
		input.Code = generateOrgRoleCodeCandidate(baseCode, collisionIndex)
		item, err = ss.CreatePositionDefinition(input)
		if err == nil {
			break
		}
		if !ss.IsOrgRoleUniqueConstraintError(err) {
			return nil, model.NewAppError("CreatePositionDefinition", "app.org_role.create_position.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
		}
	}
	if err != nil {
		return nil, model.NewAppError("CreatePositionDefinition", "app.org_role.duplicate_code.app_error", nil, "", http.StatusBadRequest)
	}

	_ = ss.SaveOrgRoleAuditLog(&model.OrgRoleAuditLog{
		TeamID:      item.TeamID,
		ActorUserID: actorUserID,
		Action:      "position.create",
		EntityType:  "position",
		EntityID:    item.ID,
		AfterState: model.StringMap{
			"code": item.Code,
			"name": item.Name,
		},
	})

	return item, nil
}

func (a *App) UpdatePositionDefinition(actorUserID string, input *model.PositionDefinition) (*model.PositionDefinition, *model.AppError) {
	if !model.IsValidId(input.ID) || !input.IsValidForUpdate() {
		return nil, model.NewAppError("UpdatePositionDefinition", "app.org_role.invalid_position.app_error", nil, "", http.StatusBadRequest)
	}

	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	item, err := ss.UpdatePositionDefinition(input)
	if err != nil {
		if ss.IsOrgRoleNotFound(err) {
			return nil, model.NewAppError("UpdatePositionDefinition", "app.org_role.position_not_found.app_error", nil, "", http.StatusNotFound)
		}
		if ss.IsOrgRoleUniqueConstraintError(err) {
			return nil, model.NewAppError("UpdatePositionDefinition", "app.org_role.duplicate_code.app_error", nil, "", http.StatusBadRequest)
		}
		return nil, model.NewAppError("UpdatePositionDefinition", "app.org_role.update_position.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	_ = ss.SaveOrgRoleAuditLog(&model.OrgRoleAuditLog{
		TeamID:      item.TeamID,
		ActorUserID: actorUserID,
		Action:      "position.update",
		EntityType:  "position",
		EntityID:    item.ID,
		AfterState: model.StringMap{
			"code":   item.Code,
			"name":   item.Name,
			"active": fmt.Sprintf("%t", item.Active),
		},
	})

	return item, nil
}

func (a *App) ListOrgUnits(teamID string, includeInactive bool) ([]*model.OrgUnit, *model.AppError) {
	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	items, err := ss.ListOrgUnits(teamID, includeInactive)
	if err != nil {
		return nil, model.NewAppError("ListOrgUnits", "app.org_role.list_org_units.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	return items, nil
}

func (a *App) CreateOrgUnit(actorUserID string, input *model.OrgUnit) (*model.OrgUnit, *model.AppError) {
	if !input.IsValidForCreate() {
		return nil, model.NewAppError("CreateOrgUnit", "app.org_role.invalid_org_unit.app_error", nil, "", http.StatusBadRequest)
	}

	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	baseCode := generateOrgRoleCodeBase(input.Name, orgUnitCodePrefix(input.Type))
	input.Active = true

	var (
		item *model.OrgUnit
		err  error
	)

	for collisionIndex := 0; collisionIndex < orgRoleCodeRetryLimit; collisionIndex++ {
		input.Code = generateOrgRoleCodeCandidate(baseCode, collisionIndex)
		item, err = ss.CreateOrgUnit(input)
		if err == nil {
			break
		}
		if !ss.IsOrgRoleUniqueConstraintError(err) {
			return nil, model.NewAppError("CreateOrgUnit", "app.org_role.create_org_unit.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
		}
	}
	if err != nil {
		return nil, model.NewAppError("CreateOrgUnit", "app.org_role.duplicate_code.app_error", nil, "", http.StatusBadRequest)
	}

	_ = ss.SaveOrgRoleAuditLog(&model.OrgRoleAuditLog{
		TeamID:      item.TeamID,
		ActorUserID: actorUserID,
		Action:      "org_unit.create",
		EntityType:  "org_unit",
		EntityID:    item.ID,
		AfterState: model.StringMap{
			"code": item.Code,
			"name": item.Name,
			"type": item.Type,
		},
	})

	return item, nil
}

func (a *App) UpdateOrgUnit(actorUserID string, input *model.OrgUnit) (*model.OrgUnit, *model.AppError) {
	if !model.IsValidId(input.ID) || !input.IsValidForUpdate() {
		return nil, model.NewAppError("UpdateOrgUnit", "app.org_role.invalid_org_unit.app_error", nil, "", http.StatusBadRequest)
	}

	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	item, err := ss.UpdateOrgUnit(input)
	if err != nil {
		if ss.IsOrgRoleNotFound(err) {
			return nil, model.NewAppError("UpdateOrgUnit", "app.org_role.org_unit_not_found.app_error", nil, "", http.StatusNotFound)
		}
		if ss.IsOrgRoleUniqueConstraintError(err) {
			return nil, model.NewAppError("UpdateOrgUnit", "app.org_role.duplicate_code.app_error", nil, "", http.StatusBadRequest)
		}
		return nil, model.NewAppError("UpdateOrgUnit", "app.org_role.update_org_unit.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	_ = ss.SaveOrgRoleAuditLog(&model.OrgRoleAuditLog{
		TeamID:      item.TeamID,
		ActorUserID: actorUserID,
		Action:      "org_unit.update",
		EntityType:  "org_unit",
		EntityID:    item.ID,
		AfterState: model.StringMap{
			"code":   item.Code,
			"name":   item.Name,
			"type":   item.Type,
			"active": fmt.Sprintf("%t", item.Active),
		},
	})

	return item, nil
}

func (a *App) GetUserOrgProfile(teamID, userID string) (*model.UserOrgProfile, *model.AppError) {
	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	item, err := ss.GetUserOrgProfile(teamID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &model.UserOrgProfile{
				TeamID:         teamID,
				UserID:         userID,
				ExtraPositions: model.StringArray{},
			}, nil
		}
		return nil, model.NewAppError("GetUserOrgProfile", "app.org_role.get_user_org_profile.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	return item, nil
}

func (a *App) UpsertUserOrgProfile(rctx request.CTX, actorUserID string, input *model.UserOrgProfile) (*model.UserOrgProfile, *model.AppError) {
	if !input.IsValid() {
		return nil, model.NewAppError("UpsertUserOrgProfile", "app.org_role.invalid_user_org_profile.app_error", nil, "", http.StatusBadRequest)
	}

	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	item, err := ss.UpsertUserOrgProfile(input)
	if err != nil {
		return nil, model.NewAppError("UpsertUserOrgProfile", "app.org_role.upsert_user_org_profile.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	isCEO := a.syncUserOrgProfileToProps(rctx, item)

	_ = ss.SaveOrgRoleAuditLog(&model.OrgRoleAuditLog{
		TeamID:      item.TeamID,
		ActorUserID: actorUserID,
		Action:      "user_org_profile.upsert",
		EntityType:  "user_org_profile",
		EntityID:    item.UserID,
		AfterState: model.StringMap{
			"primary_position_id": item.PrimaryPositionID,
			"primary_org_unit_id": item.PrimaryOrgUnitID,
			"is_ceo":              fmt.Sprintf("%t", isCEO),
		},
	})

	return item, nil
}

// syncUserOrgProfileToProps mirrors the assigned org unit/position onto the
// Mattermost user's Props map, since the boards plugin has no direct access
// to the UserOrgProfiles/PositionDefinitions tables and instead reads its org
// context from Props (see the userProp* constants above). userPropPositionCodes
// specifically feeds the boards webapp's card-property default filter, which
// matches against human-readable PositionDefinition.Code values (not IDs) —
// boards' own ACL permission evaluation does not read this prop at all; it
// re-resolves a user's positions directly from UserOrgProfiles by ID whenever
// a team-scoped profile row exists, so this prop's format has no effect there.
// "CEO" full-visibility is not a per-user flag: it is derived from whether any
// of the user's assigned positions (primary or extra) has FullVisibility set,
// so assigning e.g. the "ceo" position automatically grants it. A failure here
// is logged rather than surfaced as a request error: the UserOrgProfiles row
// is the source of truth, and a subsequent save will retry the sync. Returns
// the computed CEO flag for the audit log.
func (a *App) syncUserOrgProfileToProps(rctx request.CTX, item *model.UserOrgProfile) bool {
	rctx.Logger().Debug("syncUserOrgProfileToProps started",
		mlog.String("team_id", item.TeamID),
		mlog.String("user_id", item.UserID),
		mlog.String("primary_org_unit_id", item.PrimaryOrgUnitID),
		mlog.String("primary_position_id", item.PrimaryPositionID),
		mlog.String("extra_positions", strings.Join(item.ExtraPositions, ",")),
	)

	user, appErr := a.GetUser(item.UserID)
	if appErr != nil {
		rctx.Logger().Warn("failed to load user to sync org profile props",
			mlog.String("user_id", item.UserID),
			mlog.Err(appErr),
		)
		return false
	}

	orgUnitIDs := []string{}
	if item.PrimaryOrgUnitID != "" {
		orgUnitIDs = append(orgUnitIDs, item.PrimaryOrgUnitID)
	}

	seenPositions := map[string]struct{}{}
	positionIDs := []string{}
	for _, positionID := range append([]string{item.PrimaryPositionID}, item.ExtraPositions...) {
		if positionID == "" {
			continue
		}
		if _, ok := seenPositions[positionID]; ok {
			continue
		}
		seenPositions[positionID] = struct{}{}
		positionIDs = append(positionIDs, positionID)
	}

	isCEO := false
	positionCodes := []string{}
	positions, positionsAppErr := a.ListPositionDefinitions(item.TeamID, true)
	if positionsAppErr != nil {
		rctx.Logger().Warn("failed to load team positions to resolve position codes and full-visibility flag",
			mlog.String("team_id", item.TeamID),
			mlog.Err(positionsAppErr),
		)
	} else {
		codeByPositionID := map[string]string{}
		fullVisibilityPositionIDs := map[string]struct{}{}
		for _, position := range positions {
			codeByPositionID[position.ID] = position.Code
			if position.FullVisibility {
				fullVisibilityPositionIDs[position.ID] = struct{}{}
			}
		}
		for _, positionID := range positionIDs {
			if code, ok := codeByPositionID[positionID]; ok {
				positionCodes = append(positionCodes, code)
			}
		}
		for positionID := range seenPositions {
			if _, ok := fullVisibilityPositionIDs[positionID]; ok {
				isCEO = true
				break
			}
		}
	}

	newProps := model.StringMap{}
	for k, v := range user.Props {
		newProps[k] = v
	}
	newProps[userPropOrgUnitIDs] = strings.Join(orgUnitIDs, ",")
	newProps[userPropPositionCodes] = strings.Join(positionCodes, ",")
	newProps[userPropIsCEO] = fmt.Sprintf("%t", isCEO)

	if _, appErr := a.PatchUser(rctx, item.UserID, &model.UserPatch{Props: newProps}, true); appErr != nil {
		rctx.Logger().Warn("failed to sync org profile props to user",
			mlog.String("team_id", item.TeamID),
			mlog.String("user_id", item.UserID),
			mlog.String("org_unit_ids", strings.Join(orgUnitIDs, ",")),
			mlog.String("position_codes", strings.Join(positionCodes, ",")),
			mlog.Bool("is_ceo", isCEO),
			mlog.Err(appErr),
		)
	} else {
		rctx.Logger().Debug("syncUserOrgProfileToProps completed",
			mlog.String("team_id", item.TeamID),
			mlog.String("user_id", item.UserID),
			mlog.String("org_unit_ids", strings.Join(orgUnitIDs, ",")),
			mlog.String("position_codes", strings.Join(positionCodes, ",")),
			mlog.Bool("is_ceo", isCEO),
		)
	}

	return isCEO
}

func (a *App) ListOrgRoleAuditLogs(teamID string, page, perPage int) ([]*model.OrgRoleAuditLog, *model.AppError) {
	ss, appErr := a.orgRoleSQLStore()
	if appErr != nil {
		return nil, appErr
	}

	items, err := ss.ListOrgRoleAuditLogs(teamID, page, perPage)
	if err != nil {
		return nil, model.NewAppError("ListOrgRoleAuditLogs", "app.org_role.list_audit_logs.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	return items, nil
}
