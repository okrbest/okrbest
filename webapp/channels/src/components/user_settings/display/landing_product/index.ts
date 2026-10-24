// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {Dispatch} from 'redux';

import type {PreferencesType} from '@mattermost/types/preferences';

import {deletePreferences, savePreferences} from 'mattermost-redux/actions/preferences';
import {get} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {Preferences} from 'utils/constants';

import type {GlobalState} from 'types/store';

import LandingProductSection from './landing_product';

export type OwnProps = {
    adminMode?: boolean;
    userId: string;
    userPreferences?: PreferencesType;
};

function mapStateToProps(state: GlobalState, ownProps: OwnProps) {
    const userPreferences = ownProps.adminMode && ownProps.userPreferences ? ownProps.userPreferences : undefined;
    return {
        userId: ownProps.adminMode ? ownProps.userId : getCurrentUserId(state),
        globalValue: get(state, Preferences.CATEGORY_LANDING_PRODUCT, '', '', userPreferences),
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
