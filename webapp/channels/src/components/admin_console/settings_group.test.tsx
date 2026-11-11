// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {defineMessage} from 'react-intl';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import SettingsGroup from './settings_group';

describe('components/admin_console/SettingsGroup', () => {
    test('should render a translatable subtitle given as a message descriptor', () => {
        renderWithContext(
            <SettingsGroup
                title='Section title'
                subtitle={defineMessage({id: 'test.settings_group.subtitle', defaultMessage: 'Translated subtitle'})}
            />,
        );

        expect(screen.getByText('Translated subtitle')).toBeInTheDocument();
    });

    test('should render a plain string subtitle', () => {
        renderWithContext(
            <SettingsGroup
                title='Section title'
                subtitle='Plain subtitle'
            />,
        );

        expect(screen.getByText('Plain subtitle')).toBeInTheDocument();
    });
});
