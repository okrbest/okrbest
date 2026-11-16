// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import {TeamModes} from './team_modes';

describe('admin_console/team_channel_settings/team/TeamModes', () => {
    test('omits separator under Sync Group Members when synced and no following row', () => {
        renderWithContext(
            <TeamModes
                onToggle={jest.fn()}
                syncChecked={true}
                allAllowedChecked={false}
                allowedDomains={''}
                allowedDomainsChecked={false}
                isLicensedForLDAPGroups={true}
                abacSupported={false}
            />,
        );

        expect(screen.queryByTestId('policy-enforce-toggle')).not.toBeInTheDocument();

        const syncRow = screen.getByTestId('syncGroupSwitch');
        expect(syncRow.nextElementSibling).toBeNull();
    });
});
