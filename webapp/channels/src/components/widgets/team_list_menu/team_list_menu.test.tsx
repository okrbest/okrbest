// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {Permissions} from 'mattermost-redux/constants';

import * as Menu from 'components/menu';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import TeamListMenu from './team_list_menu';

jest.mock('actions/team_actions', () => ({
    switchTeam: jest.fn(() => ({type: 'MOCK_SWITCH_TEAM'})),
}));

jest.mock('mattermost-redux/selectors/entities/channels', () => ({
    ...jest.requireActual('mattermost-redux/selectors/entities/channels'),
    getTeamsUnreadStatuses: jest.fn(() => [new Set(), new Map(), new Map()]),
}));

jest.mock('utils/products', () => ({
    ...jest.requireActual('utils/products'),
    useCurrentProduct: jest.fn(() => null),
}));

const {switchTeam} = jest.requireMock('actions/team_actions');
const {getTeamsUnreadStatuses} = jest.requireMock('mattermost-redux/selectors/entities/channels');
const {useCurrentProduct} = jest.requireMock('utils/products');

describe('components/widgets/team_list_menu', () => {
    const teamA = TestHelper.getTeamMock({id: 'team-a-id', name: 'team-a', display_name: 'Team A', delete_at: 0});
    const teamB = TestHelper.getTeamMock({id: 'team-b-id', name: 'team-b', display_name: 'Team B', delete_at: 0});
    const teamC = TestHelper.getTeamMock({id: 'team-c-id', name: 'team-c', display_name: 'Team C', delete_at: 0});

    const baseState: DeepPartial<GlobalState> = {
        entities: {
            general: {
                config: {},
                license: {},
            },
            teams: {
                currentTeamId: teamA.id,
                teams: {
                    [teamA.id]: teamA,
                    [teamB.id]: teamB,
                    [teamC.id]: teamC,
                },
                myMembers: {
                    [teamA.id]: {roles: 'team_user'},
                    [teamB.id]: {roles: 'team_user'},
                    [teamC.id]: {roles: 'team_user'},
                },
            },
            users: {
                currentUserId: 'current-user-id',
                profiles: {
                    'current-user-id': {id: 'current-user-id', roles: 'system_user'},
                },
            },
            roles: {
                roles: {
                    system_user: {permissions: []},
                    team_user: {permissions: []},
                },
            },
            preferences: {
                myPreferences: {},
            },
        },
    };

    function renderInMenu(state: DeepPartial<GlobalState>) {
        return renderWithContext(
            <Menu.Container
                menuButton={{id: 'testMenuButton', children: 'open-menu'}}
                menu={{id: 'testMenu'}}
            >
                <TeamListMenu/>
            </Menu.Container>,
            state,
        );
    }

    async function openMenu() {
        await userEvent.click(screen.getByText('open-menu'));
        await waitFor(() => {
            expect(screen.getByText('Team A')).toBeInTheDocument();
        });
    }

    beforeEach(() => {
        jest.clearAllMocks();
        getTeamsUnreadStatuses.mockReturnValue([new Set(), new Map(), new Map()]);
    });

    it('should list my teams in saved order with the current team checked', async () => {
        const state = {
            ...baseState,
            entities: {
                ...baseState.entities,
                preferences: {
                    myPreferences: {
                        'teams_order--': {
                            category: 'teams_order',
                            name: '',
                            value: `${teamC.id},${teamA.id},${teamB.id}`,
                        },
                    },
                },
            },
        };

        renderInMenu(state);
        await openMenu();

        const items = screen.getAllByText(/^Team [ABC]$/).map((el) => el.textContent);
        expect(items).toEqual(['Team C', 'Team A', 'Team B']);

        expect(screen.getByTestId(`teamListMenuItem-check-${teamA.id}`)).toBeInTheDocument();
        expect(screen.queryByTestId(`teamListMenuItem-check-${teamB.id}`)).not.toBeInTheDocument();
    });

    it('should show a team icon on the left of every team item', async () => {
        renderInMenu(baseState);
        await openMenu();

        for (const team of [teamA, teamB, teamC]) {
            const item = screen.getByRole('menuitem', {name: new RegExp(team.display_name)});
            expect(item.querySelector('.TeamIcon')).toBeInTheDocument();
        }
    });

    it('should mark teams with unreads with a dot, except the current team', async () => {
        getTeamsUnreadStatuses.mockReturnValue([new Set([teamA.id, teamB.id]), new Map(), new Map()]);

        renderInMenu(baseState);
        await openMenu();

        expect(screen.getByTestId(`teamListMenuItem-unread-${teamB.id}`)).toBeInTheDocument();

        // 현재 팀(teamA)은 보고 있는 팀이므로 점을 띄우지 않는다
        expect(screen.queryByTestId(`teamListMenuItem-unread-${teamA.id}`)).not.toBeInTheDocument();
        expect(screen.queryByTestId(`teamListMenuItem-unread-${teamC.id}`)).not.toBeInTheDocument();
    });

    it('should switch to the clicked team', async () => {
        renderInMenu(baseState);
        await openMenu();

        await userEvent.click(screen.getByRole('menuitem', {name: 'Team B'}));

        // Menu.Item defers onClick until the menu has closed
        await waitFor(() => {
            expect(switchTeam).toHaveBeenCalledWith(`/${teamB.name}`, undefined);
        });
    });

    it('should stay in the current product when switching teams inside one', async () => {
        useCurrentProduct.mockReturnValue({id: 'boards-product-id', baseURL: '/boards'});

        renderInMenu(baseState);
        await openMenu();

        await userEvent.click(screen.getByRole('menuitem', {name: 'Team B'}));

        // 제품 안에서는 URL 이동 없이 팀 객체를 넘겨 selectTeam만 일어나야 한다
        await waitFor(() => {
            expect(switchTeam).toHaveBeenCalledWith(`/${teamB.name}`, expect.objectContaining({id: teamB.id}));
        });

        useCurrentProduct.mockReturnValue(null);
    });

    it('should show join and create entries when permitted', async () => {
        const openTeam = TestHelper.getTeamMock({
            id: 'open-team-id',
            name: 'open-team',
            display_name: 'Open Team',
            delete_at: 0,
            allow_open_invite: true,
        });
        const state = {
            ...baseState,
            entities: {
                ...baseState.entities,
                teams: {
                    ...baseState.entities!.teams,
                    teams: {
                        ...baseState.entities!.teams!.teams,
                        [openTeam.id]: openTeam,
                    },
                },
                roles: {
                    roles: {
                        system_user: {
                            permissions: [
                                Permissions.CREATE_TEAM,
                                Permissions.JOIN_PUBLIC_TEAMS,
                            ],
                        },
                        team_user: {permissions: []},
                    },
                },
            },
        };

        renderInMenu(state);
        await openMenu();

        expect(screen.getByText('Join another team')).toBeInTheDocument();
        expect(screen.getByText('Create a team')).toBeInTheDocument();
    });

    it('should hide join and create entries without permission', async () => {
        renderInMenu(baseState);
        await openMenu();

        expect(screen.queryByText('Join another team')).not.toBeInTheDocument();
        expect(screen.queryByText('Create a team')).not.toBeInTheDocument();
    });
});
