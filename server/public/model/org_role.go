// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import "strings"

type PositionDefinition struct {
	ID     string `json:"id"`
	TeamID string `json:"team_id"`
	Code   string `json:"code"`
	Name   string `json:"name"`
	Rank   int    `json:"rank"`
	Active bool   `json:"active"`

	// Kind separates the two masters sharing this table: 'position' (직위,
	// rank/grade) and 'duty' (직책, appointment like 팀장). Empty means
	// 'position' and is normalized at the app layer for legacy clients.
	Kind           string `json:"kind"`
	FullVisibility bool   `json:"full_visibility"`
	CreateAt       int64  `json:"create_at"`
	UpdateAt       int64  `json:"update_at"`
}

const (
	OrgUnitTypeDivision   = "division"
	OrgUnitTypeDepartment = "department"

	// PositionDefinition.Kind — 직위(직급)와 직책(보직)을 한 마스터에서 구분한다.
	PositionKindPosition = "position"
	PositionKindDuty     = "duty"
)

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
	PrimaryDutyID     string      `json:"primary_duty_id"`
	PrimaryOrgUnitID  string      `json:"primary_org_unit_id"`
	ExtraPositions    StringArray `json:"extra_positions"`
	EffectiveFrom     int64       `json:"effective_from"`
	EffectiveTo       int64       `json:"effective_to"`
	CreateAt          int64       `json:"create_at"`
	UpdateAt          int64       `json:"update_at"`
}

// UserOrgProfileSummary is a read-only, non-persisted view of a user's
// primary department/position names within a team, resolved from
// UserOrgProfile's PrimaryOrgUnitID/PrimaryPositionID. It powers the
// team-member-readable org-profile-summary endpoint, kept separate from the
// admin-only UserOrgProfile response (which exposes raw IDs and extra
// positions) so the two audiences' contracts can evolve independently.
type UserOrgProfileSummary struct {
	TeamID string `json:"team_id"`
	UserID string `json:"user_id"`

	// DivisionName resolves the hierarchy for display: the parent division's
	// name when the user is assigned to a department under a division, or the
	// division's own name when the user is assigned directly to a division.
	DivisionName   *string `json:"division_name"`
	DepartmentName *string `json:"department_name"`

	// DutyName resolves the user's assigned duty (직책, e.g. 팀장); nil when
	// unassigned — the UI omits the segment entirely in that case.
	DutyName     *string `json:"duty_name"`
	PositionName *string `json:"position_name"`
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
	validKind := p.Kind == "" || p.Kind == PositionKindPosition || p.Kind == PositionKindDuty
	return IsValidId(p.TeamID) && len(p.Name) > 0 && len(p.Name) <= 128 && validKind
}

func (p *PositionDefinition) IsValidForUpdate() bool {
	return p.IsValidForCreate() && isValidOrgRoleCode(p.Code)
}

func (p *PositionDefinition) IsValid() bool {
	return p.IsValidForUpdate()
}

func (o *OrgUnit) IsValidForCreate() bool {
	// 'team' 타입은 신규 생성 불가 — 고객사 구분은 Mattermost Team이 담당한다.
	validType := o.Type == OrgUnitTypeDepartment || o.Type == OrgUnitTypeDivision
	if o.Type == OrgUnitTypeDivision && o.ParentID != "" {
		// 계층은 본부-부서 2단계 고정: 본부는 최상위만 허용
		return false
	}
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
