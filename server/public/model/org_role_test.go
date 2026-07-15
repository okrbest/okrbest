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
		Name:   "Team A",
		Type:   "team",
	}
	require.True(t, createValid.IsValidForCreate())
	require.False(t, createValid.IsValidForUpdate())

	updateValid := &OrgUnit{
		TeamID: NewId(),
		Code:   "team_a",
		Name:   "Team A",
		Type:   "team",
	}
	require.True(t, updateValid.IsValidForUpdate())

	invalid := &OrgUnit{
		TeamID: NewId(),
		Code:   "unknown",
		Name:   "Unknown",
		Type:   "unknown",
	}
	require.False(t, invalid.IsValidForCreate())
}
