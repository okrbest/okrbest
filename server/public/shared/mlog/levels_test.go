// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package mlog_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

// A new audit level must be added to MLvlAuditGeneral too, unless it should not by itself mean
// audit logging is on. okrbest has no such opt-in level (upstream's audit-delivery belongs to
// the excluded post delivery tracking feature), so the two groups are the same.
func TestAuditLevelGroups(t *testing.T) {
	require.Equal(t, mlog.MLvlAuditAll, mlog.MLvlAuditGeneral)
}
