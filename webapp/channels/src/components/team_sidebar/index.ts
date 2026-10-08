// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import type {ConnectedProps} from 'react-redux';
import {withRouter} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import type {Dispatch} from 'redux';

import {getTeams} from 'mattermost-redux/actions/teams';
import {get} from 'mattermost-redux/selectors/entities/preferences';
import {
    getCurrentTeamId,
    getMyTeams,
} from 'mattermost-redux/selectors/entities/teams';

import {switchTeam} from 'actions/team_actions';
import {setChannelSidebarPeek} from 'actions/views/lhs';
import {getCurrentLocale} from 'selectors/i18n';
import {getChannelSidebarCollapsed, getIsLhsOpen} from 'selectors/lhs';

import {Preferences} from 'utils/constants';

import type {GlobalState} from 'types/store';

import TeamSidebar from './team_sidebar';

function mapStateToProps(state: GlobalState) {
    const products = state.plugins.components.Product || [];

    return {
        currentTeamId: getCurrentTeamId(state),
        myTeams: getMyTeams(state),
        isOpen: getIsLhsOpen(state),
        channelSidebarCollapsed: getChannelSidebarCollapsed(state),
        locale: getCurrentLocale(state),
        userTeamsOrderPreference: get(state, Preferences.TEAMS_ORDER, '', ''),
        products,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            getTeams,
            switchTeam,
            setChannelSidebarPeek,
        }, dispatch),
    };
}

const connector = connect(mapStateToProps, mapDispatchToProps);

export type PropsFromRedux = ConnectedProps<typeof connector>;

export default withRouter(connector(TeamSidebar));
