// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import "strings"

type PositionDefinition struct {
	ID       string `json:"id"`
	TeamID   string `json:"team_id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	Rank     int    `json:"rank"`
	Active   bool   `json:"active"`
	CreateAt int64  `json:"create_at"`
	UpdateAt int64  `json:"update_at"`
}

type OrgUnit struct {
	ID       string `json:"id"`
	TeamID   string `json:"team_id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	ParentID string `json:"parent_id"`
	Active   bool   `json:"active"`
	CreateAt int64  `json:"create_at"`
	UpdateAt int64  `json:"update_at"`
}

type UserOrgProfile struct {
	TeamID            string      `json:"team_id"`
	UserID            string      `json:"user_id"`
	PrimaryPositionID string      `json:"primary_position_id"`
	PrimaryOrgUnitID  string      `json:"primary_org_unit_id"`
	ExtraPositions    StringArray `json:"extra_positions"`
	EffectiveFrom     int64       `json:"effective_from"`
	EffectiveTo       int64       `json:"effective_to"`
	CreateAt          int64       `json:"create_at"`
	UpdateAt          int64       `json:"update_at"`
}

type OrgRoleAuditLog struct {
	ID          string    `json:"id"`
	TeamID      string    `json:"team_id"`
	ActorUserID string    `json:"actor_user_id"`
	Action      string    `json:"action"`
	EntityType  string    `json:"entity_type"`
	EntityID    string    `json:"entity_id"`
	BeforeState StringMap `json:"before_state,omitempty"`
	AfterState  StringMap `json:"after_state,omitempty"`
	CreateAt    int64     `json:"create_at"`
}

func isValidOrgRoleCode(code string) bool {
	return len(code) > 0 &&
		len(code) <= 64 &&
		strings.ToLower(code) == code &&
		IsValidAlphaNumHyphenUnderscore(code, false)
}

func (p *PositionDefinition) IsValidForCreate() bool {
	return IsValidId(p.TeamID) && len(p.Name) > 0 && len(p.Name) <= 128
}

func (p *PositionDefinition) IsValidForUpdate() bool {
	return p.IsValidForCreate() && isValidOrgRoleCode(p.Code)
}

func (p *PositionDefinition) IsValid() bool {
	return p.IsValidForUpdate()
}

func (o *OrgUnit) IsValidForCreate() bool {
	validType := o.Type == "department" || o.Type == "team"
	return IsValidId(o.TeamID) && len(o.Name) > 0 && len(o.Name) <= 128 && validType
}

func (o *OrgUnit) IsValidForUpdate() bool {
	return o.IsValidForCreate() && isValidOrgRoleCode(o.Code)
}

func (o *OrgUnit) IsValid() bool {
	return o.IsValidForUpdate()
}

func (u *UserOrgProfile) IsValid() bool {
	return IsValidId(u.TeamID) && IsValidId(u.UserID)
}
