// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';
import type {ComponentProps} from 'react';

import LicenseSettings from './license_settings';

describe('components/admin_console/license_settings/LicenseSettings', () => {
    const defaultProps: ComponentProps<typeof LicenseSettings> = {
        license: {
            IsLicensed: 'false',
        },
    };

    test('should render edition info', () => {
        const wrapper = shallow<LicenseSettings>(<LicenseSettings {...defaultProps}/>);
        expect(wrapper).toMatchSnapshot();
    });
});
