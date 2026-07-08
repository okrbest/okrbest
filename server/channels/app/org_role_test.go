// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
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
}
