// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import RailTeamButton from './rail_team_button';

describe('components/team_sidebar/components/rail_team_button', () => {
    const teamA = TestHelper.getTeamMock({id: 'team-a-id', name: 'team-a', display_name: 'Team A', delete_at: 0});
    const teamB = TestHelper.getTeamMock({id: 'team-b-id', name: 'team-b', display_name: 'Team B', delete_at: 0});

    const state: DeepPartial<GlobalState> = {
        entities: {
            general: {config: {}, license: {}},
            teams: {
                currentTeamId: teamA.id,
                teams: {
                    [teamA.id]: teamA,
                    [teamB.id]: teamB,
                },
                myMembers: {
                    [teamA.id]: {roles: 'team_user'},
                    [teamB.id]: {roles: 'team_user'},
                },
            },
            users: {
                currentUserId: 'current-user-id',
                profiles: {'current-user-id': {id: 'current-user-id', roles: 'system_user'}},
            },
            roles: {
                roles: {
                    system_user: {permissions: []},
                    team_user: {permissions: []},
                },
            },
            preferences: {myPreferences: {}},
        },
    };

    it('should show the current team with an accessible name', () => {
        renderWithContext(<RailTeamButton/>, state);

        expect(screen.getByRole('button', {name: /Team A/})).toBeInTheDocument();
    });

    it('should open the shared team list on click', async () => {
        renderWithContext(<RailTeamButton/>, state);

        await userEvent.click(screen.getByRole('button', {name: /Team A/}));

        await waitFor(() => {
            expect(screen.getByRole('menuitem', {name: /Team B/})).toBeInTheDocument();
        });
        expect(screen.getByText('My teams')).toBeInTheDocument();
    });
});
