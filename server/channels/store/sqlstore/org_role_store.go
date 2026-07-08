// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"database/sql"
	"encoding/json"
	"fmt"

	sq "github.com/mattermost/squirrel"

	"github.com/mattermost/mattermost/server/public/model"
)

func (ss *SqlStore) ListPositionDefinitions(teamID string, includeInactive bool) ([]*model.PositionDefinition, error) {
	query := ss.getQueryBuilder().
		Select("ID", "TeamID", "Code", "Name", "Rank", "Active", "CreateAt", "UpdateAt").
		From("PositionDefinitions").
		Where(sq.Eq{"TeamID": teamID}).
		OrderBy("Rank ASC", "Name ASC")

	if !includeInactive {
		query = query.Where(sq.Eq{"Active": true})
	}

	sqlQuery, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	var result []*model.PositionDefinition
	if err := ss.GetReplica().Select(&result, sqlQuery, args...); err != nil {
		return nil, err
	}

	return result, nil
}

func (ss *SqlStore) CreatePositionDefinition(position *model.PositionDefinition) (*model.PositionDefinition, error) {
	if position.ID == "" {
		position.ID = model.NewId()
	}
	now := model.GetMillis()
	position.CreateAt = now
	position.UpdateAt = now

	if _, err := ss.GetMaster().Exec(
		`INSERT INTO PositionDefinitions
			(ID, TeamID, Code, Name, Rank, Active, CreateAt, UpdateAt)
		 VALUES
			($1, $2, $3, $4, $5, $6, $7, $8)`,
		position.ID, position.TeamID, position.Code, position.Name, position.Rank, position.Active, position.CreateAt, position.UpdateAt,
	); err != nil {
		return nil, err
	}

	return position, nil
}

func (ss *SqlStore) UpdatePositionDefinition(position *model.PositionDefinition) (*model.PositionDefinition, error) {
	position.UpdateAt = model.GetMillis()
	res, err := ss.GetMaster().Exec(
		`UPDATE PositionDefinitions
		    SET Code = $1, Name = $2, Rank = $3, Active = $4, UpdateAt = $5
		  WHERE ID = $6 AND TeamID = $7`,
		position.Code, position.Name, position.Rank, position.Active, position.UpdateAt, position.ID, position.TeamID,
	)
	if err != nil {
		return nil, err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, sql.ErrNoRows
	}

	return position, nil
}

func (ss *SqlStore) ListOrgUnits(teamID string, includeInactive bool) ([]*model.OrgUnit, error) {
	query := ss.getQueryBuilder().
		Select("ID", "TeamID", "Code", "Name", "Type", "ParentID", "Active", "CreateAt", "UpdateAt").
		From("OrgUnits").
		Where(sq.Eq{"TeamID": teamID}).
		OrderBy("Type ASC", "Name ASC")

	if !includeInactive {
		query = query.Where(sq.Eq{"Active": true})
	}

	sqlQuery, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	var result []*model.OrgUnit
	if err := ss.GetReplica().Select(&result, sqlQuery, args...); err != nil {
		return nil, err
	}

	return result, nil
}

func (ss *SqlStore) CreateOrgUnit(orgUnit *model.OrgUnit) (*model.OrgUnit, error) {
	if orgUnit.ID == "" {
		orgUnit.ID = model.NewId()
	}
	now := model.GetMillis()
	orgUnit.CreateAt = now
	orgUnit.UpdateAt = now

	if _, err := ss.GetMaster().Exec(
		`INSERT INTO OrgUnits
			(ID, TeamID, Code, Name, Type, ParentID, Active, CreateAt, UpdateAt)
		 VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		orgUnit.ID, orgUnit.TeamID, orgUnit.Code, orgUnit.Name, orgUnit.Type, orgUnit.ParentID, orgUnit.Active, orgUnit.CreateAt, orgUnit.UpdateAt,
	); err != nil {
		return nil, err
	}

	return orgUnit, nil
}

func (ss *SqlStore) UpdateOrgUnit(orgUnit *model.OrgUnit) (*model.OrgUnit, error) {
	orgUnit.UpdateAt = model.GetMillis()
	res, err := ss.GetMaster().Exec(
		`UPDATE OrgUnits
		    SET Code = $1, Name = $2, Type = $3, ParentID = $4, Active = $5, UpdateAt = $6
		  WHERE ID = $7 AND TeamID = $8`,
		orgUnit.Code, orgUnit.Name, orgUnit.Type, orgUnit.ParentID, orgUnit.Active, orgUnit.UpdateAt, orgUnit.ID, orgUnit.TeamID,
	)
	if err != nil {
		return nil, err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, sql.ErrNoRows
	}

	return orgUnit, nil
}

func (ss *SqlStore) GetUserOrgProfile(teamID, userID string) (*model.UserOrgProfile, error) {
	var profile model.UserOrgProfile
	if err := ss.GetReplica().Get(&profile,
		`SELECT TeamID, UserID, PrimaryPositionID, PrimaryOrgUnitID, ExtraPositions, EffectiveFrom, EffectiveTo, CreateAt, UpdateAt
		   FROM UserOrgProfiles
		  WHERE TeamID = $1 AND UserID = $2`, teamID, userID); err != nil {
		return nil, err
	}

	return &profile, nil
}

func (ss *SqlStore) UpsertUserOrgProfile(profile *model.UserOrgProfile) (*model.UserOrgProfile, error) {
	now := model.GetMillis()
	if profile.CreateAt == 0 {
		profile.CreateAt = now
	}
	profile.UpdateAt = now

	extraPositions, err := json.Marshal(profile.ExtraPositions)
	if err != nil {
		return nil, err
	}

	if _, err := ss.GetMaster().Exec(
		`INSERT INTO UserOrgProfiles
			(TeamID, UserID, PrimaryPositionID, PrimaryOrgUnitID, ExtraPositions, EffectiveFrom, EffectiveTo, CreateAt, UpdateAt)
		 VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 ON CONFLICT (TeamID, UserID) DO UPDATE
		    SET PrimaryPositionID = EXCLUDED.PrimaryPositionID,
		        PrimaryOrgUnitID = EXCLUDED.PrimaryOrgUnitID,
		        ExtraPositions = EXCLUDED.ExtraPositions,
		        EffectiveFrom = EXCLUDED.EffectiveFrom,
		        EffectiveTo = EXCLUDED.EffectiveTo,
		        UpdateAt = EXCLUDED.UpdateAt`,
		profile.TeamID, profile.UserID, profile.PrimaryPositionID, profile.PrimaryOrgUnitID, string(extraPositions), profile.EffectiveFrom, profile.EffectiveTo, profile.CreateAt, profile.UpdateAt,
	); err != nil {
		return nil, err
	}

	return profile, nil
}

func (ss *SqlStore) ListOrgRoleAuditLogs(teamID string, page, perPage int) ([]*model.OrgRoleAuditLog, error) {
	if perPage <= 0 {
		perPage = 50
	}
	offset := page * perPage

	query := ss.getQueryBuilder().
		Select("ID", "TeamID", "ActorUserID", "Action", "EntityType", "EntityID", "BeforeState", "AfterState", "CreateAt").
		From("OrgRoleAuditLogs").
		Where(sq.Eq{"TeamID": teamID}).
		OrderBy("CreateAt DESC").
		Limit(uint64(perPage)).
		Offset(uint64(offset))

	sqlQuery, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	var result []*model.OrgRoleAuditLog
	if err := ss.GetReplica().Select(&result, sqlQuery, args...); err != nil {
		return nil, err
	}

	return result, nil
}

func (ss *SqlStore) SaveOrgRoleAuditLog(log *model.OrgRoleAuditLog) error {
	if log.ID == "" {
		log.ID = model.NewId()
	}
	if log.CreateAt == 0 {
		log.CreateAt = model.GetMillis()
	}

	if _, err := ss.GetMaster().Exec(
		`INSERT INTO OrgRoleAuditLogs
			(ID, TeamID, ActorUserID, Action, EntityType, EntityID, BeforeState, AfterState, CreateAt)
		 VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		log.ID, log.TeamID, log.ActorUserID, log.Action, log.EntityType, log.EntityID, toNullableJSONString(log.BeforeState), toNullableJSONString(log.AfterState), log.CreateAt,
	); err != nil {
		return err
	}

	return nil
}

func toNullableJSONString(m model.StringMap) any {
	if len(m) == 0 {
		return nil
	}

	raw, err := json.Marshal(m)
	if err != nil {
		return nil
	}

	return string(raw)
}

func (ss *SqlStore) IsOrgRoleUniqueConstraintError(err error) bool {
	return IsUniqueConstraintError(err, []string{
		"idx_positiondefinitions_teamid_code",
		"idx_orgunits_teamid_code",
		"positiondefinitions_teamid_code",
		"orgunits_teamid_code",
	})
}

func (ss *SqlStore) IsOrgRoleNotFound(err error) bool {
	return err == sql.ErrNoRows
}

func (ss *SqlStore) OrgRoleStoreErrorWrap(operation string, err error) error {
	return fmt.Errorf("%s: %w", operation, err)
}
