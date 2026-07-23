// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import type {GlobalState} from 'types/store';

import TeamOrgRoleManagementModal from './team_org_role_management_modal';

function mapStateToProps(state: GlobalState) {
    return {
        currentTeam: getCurrentTeam(state),
    };
}

export default connect(mapStateToProps)(TeamOrgRoleManagementModal);
