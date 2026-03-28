// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getLicense} from 'mattermost-redux/selectors/entities/general';

import type {GlobalState} from 'types/store';

import LicenseSettings from './license_settings';

function mapStateToProps(state: GlobalState) {
    return {
        license: getLicense(state),
    };
}

export default connect(mapStateToProps)(LicenseSettings);
