// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {Dispatch} from 'redux';

import type {PreferencesType} from '@mattermost/types/preferences';

import {deletePreferences, savePreferences} from 'mattermost-redux/actions/preferences';
import {get, makeGetCategory} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {Preferences} from 'utils/constants';

import type {GlobalState} from 'types/store';

import LandingProductSection from './landing_product';

export type OwnProps = {
    adminMode?: boolean;
    userId: string;
    userPreferences?: PreferencesType;
};

const getLandingProductPreferences = makeGetCategory('getLandingProductPreferences', Preferences.CATEGORY_LANDING_PRODUCT);

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const userPreferences = ownProps.adminMode && ownProps.userPreferences ? ownProps.userPreferences : undefined;

    // adminMode에서는 다른 사용자의 팀 컨텍스트를 알 수 없으므로 공통 설정만 다룬다
    const currentTeamId = ownProps.adminMode ? '' : getCurrentTeamId(state);

    return {
        userId: ownProps.adminMode ? ownProps.userId : getCurrentUserId(state),
        globalValue: get(state, Preferences.CATEGORY_LANDING_PRODUCT, '', '', userPreferences),
        currentTeamId,
        teamValue: currentTeamId ? get(state, Preferences.CATEGORY_LANDING_PRODUCT, currentTeamId, '', userPreferences) : '',
        teamSpecificPreferences: ownProps.adminMode ? [] : getLandingProductPreferences(state).filter((preference) => preference.name !== ''),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            savePreferences,
            deletePreferences,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LandingProductSection);
