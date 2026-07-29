// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPositionDefinitionIsValid(t *testing.T) {
	createValid := &PositionDefinition{
		TeamID: NewId(),
		Name:   "C-Level",
	}
	require.True(t, createValid.IsValidForCreate())
	require.False(t, createValid.IsValidForUpdate())

	updateValid := &PositionDefinition{
		TeamID: NewId(),
		Code:   "c_level",
		Name:   "C-Level",
	}
	require.True(t, updateValid.IsValidForUpdate())

	invalidCode := &PositionDefinition{
		TeamID: NewId(),
		Code:   "C_LEVEL",
		Name:   "NoCode",
	}
	require.False(t, invalidCode.IsValidForUpdate())
}

func TestOrgUnitIsValid(t *testing.T) {
	createValid := &OrgUnit{
		TeamID: NewId(),
		Name:   "Dept A",
		Type:   OrgUnitTypeDepartment,
	}
	require.True(t, createValid.IsValidForCreate())
	require.False(t, createValid.IsValidForUpdate())

	updateValid := &OrgUnit{
		TeamID: NewId(),
		Code:   "dept_a",
		Name:   "Dept A",
		Type:   OrgUnitTypeDepartment,
	}
	require.True(t, updateValid.IsValidForUpdate())

	invalid := &OrgUnit{
		TeamID: NewId(),
		Code:   "unknown",
		Name:   "Unknown",
		Type:   "unknown",
	}
	require.False(t, invalid.IsValidForCreate())

	division := &OrgUnit{
		TeamID: NewId(),
		Name:   "본부 A",
		Type:   OrgUnitTypeDivision,
	}
	require.True(t, division.IsValidForCreate())

	divisionWithParent := &OrgUnit{
		TeamID:   NewId(),
		Name:     "본부 B",
		Type:     OrgUnitTypeDivision,
		ParentID: NewId(),
	}
	require.False(t, divisionWithParent.IsValidForCreate())

	departmentWithParent := &OrgUnit{
		TeamID:   NewId(),
		Name:     "부서 A",
		Type:     OrgUnitTypeDepartment,
		ParentID: NewId(),
	}
	require.True(t, departmentWithParent.IsValidForCreate())

	// 고객사 구분은 Mattermost Team이 담당 — 'team' 타입 신규 생성 차단 (FR-011)
	teamType := &OrgUnit{
		TeamID: NewId(),
		Name:   "Team A",
		Type:   "team",
	}
	require.False(t, teamType.IsValidForCreate())
}
