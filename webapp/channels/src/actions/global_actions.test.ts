// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Team} from '@mattermost/types/teams';
import type {UserProfile} from '@mattermost/types/users';

import {redirectUserToDefaultTeam, toggleSideBarRightMenuAction, getTeamRedirectChannelIfIsAccesible} from 'actions/global_actions';
import {close as closeLhs} from 'actions/views/lhs';
import {closeRightHandSide, closeMenu as closeRhsMenu} from 'actions/views/rhs';
import {getPreferenceKey} from 'mattermost-redux/utils/preference_utils';
import {waitForProductsInitialized} from 'plugins/products_initialized';
import LocalStorageStore from 'stores/local_storage_store';
import reduxStore from 'stores/redux_store';

import mockStore from 'tests/test_store';
import {getHistory} from 'utils/browser_history';
import {LandingProducts, Preferences, suitePluginIds} from 'utils/constants';

import type {ProductComponent} from 'types/store/plugins';

const getState = jest.mocked(reduxStore.getState);

jest.mock('actions/views/rhs', () => ({
    closeMenu: jest.fn(),
    closeRightHandSide: jest.fn(),
}));

jest.mock('actions/views/lhs', () => ({
    close: jest.fn(),
}));

jest.mock('mattermost-redux/actions/users', () => ({
    loadMe: () => ({type: 'MOCK_RECEIVED_ME'}),
}));

jest.mock('stores/redux_store', () => {
    return {
        dispatch: jest.fn(),
        getState: jest.fn(),
    };
});

jest.mock('plugins/products_initialized', () => ({
    waitForProductsInitialized: jest.fn(),
}));

describe('actions/global_actions', () => {
    describe('redirectUserToDefaultTeam', () => {
        it('should redirect to /select_team when no team is available', async () => {
            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                    },
                    teams: {
                        teams: {},
                        myMembers: {},
                    },
                    channels: {
                        myMembers: {},
                        channels: {},
                        channelsInTeam: {},
                    },
                    users: {
                        currentUserId: 'user1',
                        profiles: {
                            user1: {
                                id: 'user1',
                                roles: '',
                            },
                        },
                    },
                },
            });

            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/select_team');
        });

        it('should redirect to last viewed channel in the last viewed team when the user have access to that team', async () => {
            const userId = 'user1';
            LocalStorageStore.setPreviousTeamId(userId, 'team2');
            LocalStorageStore.setPreviousChannelName(userId, 'team1', 'channel-in-team-1');
            LocalStorageStore.setPreviousChannelName(userId, 'team2', 'channel-in-team-2');

            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                        serverVersion: '5.16.0',
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                            'channel-in-team-1': {},
                            'channel-in-team-2': {},
                        },
                        channels: {
                            'channel-in-team-1': {
                                id: 'channel-in-team-1',
                                team_id: 'team1',
                                name: 'channel-in-team-1',
                            },
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                            },
                        },
                        channelsInTeam: {
                            team1: new Set(['channel-in-team-1']),
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, roles: 'system_guest'},
                        },
                    },
                    roles: {
                        roles: {
                            system_guest: {
                                permissions: [],
                            },
                            team_guest: {
                                permissions: [],
                            },
                            channel_guest: {
                                permissions: [],
                            },
                        },
                    },
                },
            });

            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/team2/channels/channel-in-team-2');
        });

        it('should redirect to last channel on first team with channels when the user have no channels in the current team', async () => {
            const userId = 'user1';
            LocalStorageStore.setPreviousTeamId(userId, 'team1');
            LocalStorageStore.setPreviousChannelName(userId, 'team1', 'channel-in-team-1');
            LocalStorageStore.setPreviousChannelName(userId, 'team2', 'channel-in-team-2');

            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                        serverVersion: '5.16.0',
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                            'channel-in-team-2': {},
                        },
                        channels: {
                            'channel-in-team-1': {
                                id: 'channel-in-team-1',
                                team_id: 'team1',
                                name: 'channel-in-team-1',
                            },
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                            },
                        },
                        channelsInTeam: {
                            team1: new Set(['channel-in-team-1']),
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, roles: 'system_guest'},
                        },
                    },
                    roles: {
                        roles: {
                            system_guest: {
                                permissions: [],
                            },
                            team_guest: {
                                permissions: [],
                            },
                            channel_guest: {
                                permissions: [],
                            },
                        },
                    },
                },
            });

            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/team2/channels/channel-in-team-2');
        });

        it('should redirect to /select_team when the user have no channels in the any of his teams', async () => {
            const userId = 'user1';
            LocalStorageStore.setPreviousTeamId(userId, 'team1');
            LocalStorageStore.setPreviousChannelName(userId, 'team1', 'channel-in-team-1');
            LocalStorageStore.setPreviousChannelName(userId, 'team2', 'channel-in-team-2');

            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                        serverVersion: '5.16.0',
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                        },
                        channels: {
                            'channel-in-team-1': {
                                id: 'channel-in-team-1',
                                team_id: 'team1',
                                name: 'channel-in-team-1',
                            },
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                            },
                        },
                        channelsInTeam: {
                            team1: new Set(['channel-in-team-1']),
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, roles: 'system_guest'},
                        },
                    },
                    roles: {
                        roles: {
                            system_guest: {
                                permissions: [],
                            },
                            team_guest: {
                                permissions: [],
                            },
                            channel_guest: {
                                permissions: [],
                            },
                        },
                    },
                },
            });

            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/select_team');
        });

        it('should do nothing if there is not current user', async () => {
            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    users: {
                        profiles: {
                            user1: {id: 'user1', roles: 'system_guest'},
                        },
                    },
                },
            });

            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).not.toHaveBeenCalled();
        });

        it('should redirect to direct message if that\'s the most recently used', async () => {
            const userId = 'user1';
            const teamId = 'team1';
            const user2 = 'user2';
            const directChannelId = `${userId}__${user2}`;
            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                            TeammateNameDisplay: 'username',
                        },
                        serverVersion: '5.16.0',
                    },
                    preferences: {
                        myPreferences: {},
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                            'channel-in-team-1': {},
                            'channel-in-team-2': {},
                            [directChannelId]: {},
                        },
                        channels: {
                            'channel-in-team-1': {
                                id: 'channel-in-team-1',
                                team_id: 'team1',
                                name: 'channel-in-team-1',
                                type: 'O',
                            },
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                                type: 'O',
                            },
                            [directChannelId]: {
                                id: directChannelId,
                                team_id: '',
                                name: directChannelId,
                                type: 'D',
                                teammate_id: 'user2',
                            },
                            'group-channel': {
                                id: 'group-channel',
                                name: 'group-channel',
                                team_id: 'team1',
                                type: 'G',
                            },
                        },
                        channelsInTeam: {
                            team1: new Set(['channel-in-team-1', directChannelId]),
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: userId, roles: 'system_guest'},
                            [user2]: {id: user2, username: user2, roles: 'system_guest'},
                        },
                    },
                    roles: {
                        roles: {
                            system_guest: {
                                permissions: [],
                            },
                            team_guest: {
                                permissions: [],
                            },
                            channel_guest: {
                                permissions: [],
                            },
                        },
                    },
                },
            });
            getState.mockImplementation(store.getState);
            LocalStorageStore.setPreviousTeamId(userId, teamId);
            LocalStorageStore.setPreviousChannelName(userId, teamId, directChannelId);

            const result = await getTeamRedirectChannelIfIsAccesible({id: userId} as UserProfile, {id: teamId} as Team);
            expect(result?.id).toBe(directChannelId);
        });

        it('should redirect to group message if that\'s the most recently used', async () => {
            const userId = 'user1';
            const teamId = 'team1';
            const user2 = 'user2';
            const directChannelId = `${userId}__${user2}`;
            const groupChannelId = 'group-channel';
            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                            TeammateNameDisplay: 'username',
                        },
                        serverVersion: '5.16.0',
                    },
                    preferences: {
                        myPreferences: {},
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                            'channel-in-team-1': {},
                            'channel-in-team-2': {},
                            [directChannelId]: {},
                            [groupChannelId]: {},
                        },
                        channels: {
                            'channel-in-team-1': {
                                id: 'channel-in-team-1',
                                team_id: 'team1',
                                name: 'channel-in-team-1',
                                type: 'O',
                            },
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                                type: 'O',
                            },
                            [directChannelId]: {
                                id: directChannelId,
                                team_id: '',
                                name: directChannelId,
                                type: 'D',
                                teammate_id: 'user2',
                            },
                            [groupChannelId]: {
                                id: groupChannelId,
                                name: groupChannelId,
                                team_id: 'team1',
                                type: 'G',
                            },
                        },
                        channelsInTeam: {
                            team1: new Set(['channel-in-team-1', directChannelId, groupChannelId]),
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: userId, roles: 'system_guest'},
                            [user2]: {id: user2, username: user2, roles: 'system_guest'},
                        },
                    },
                    roles: {
                        roles: {
                            system_guest: {
                                permissions: [],
                            },
                            team_guest: {
                                permissions: [],
                            },
                            channel_guest: {
                                permissions: [],
                            },
                        },
                    },
                },
            });
            getState.mockImplementation(store.getState);
            LocalStorageStore.setPreviousTeamId(userId, teamId);
            LocalStorageStore.setPreviousChannelName(userId, teamId, groupChannelId);

            const result = await getTeamRedirectChannelIfIsAccesible({id: userId} as UserProfile, {id: teamId} as Team);
            expect(result?.id).toBe(groupChannelId);
        });

        it('should redirect to last channel on first team when current team is no longer available', async () => {
            const userId = 'user1';
            LocalStorageStore.setPreviousTeamId(userId, 'non-existent');
            LocalStorageStore.setPreviousChannelName(userId, 'team1', 'channel-in-team-1');
            LocalStorageStore.setPreviousChannelName(userId, 'team2', 'channel-in-team-2');

            const store = mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                    },
                    teams: {
                        teams: {
                            team1: {id: 'team1', display_name: 'Team 1', name: 'team1', delete_at: 0},
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0},
                        },
                        myMembers: {
                            team1: {team_id: 'team1'},
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                            'channel-in-team-1': {},
                            'channel-in-team-2': {},
                        },
                        channels: {
                            'channel-in-team-1': {
                                id: 'channel-in-team-1',
                                team_id: 'team1',
                                name: 'channel-in-team-1',
                            },
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                            },
                        },
                        channelsInTeam: {
                            team1: new Set(['channel-in-team-1']),
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, roles: ''},
                        },
                    },
                },
            });

            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/team1/channels/channel-in-team-1');
        });
    });

    describe('redirectUserToDefaultTeam 랜딩 제품 분기', () => {
        const userId = 'user1';

        const boardsProduct = {
            id: 'product-boards',
            pluginId: suitePluginIds.focalboard,
            baseURL: '/boards',
            switcherLinkURL: '/boards',
        } as unknown as ProductComponent;

        function makeLandingState({
            globalPreference,
            teamLanding = '',
            products = [],
        }: {
            globalPreference?: string;
            teamLanding?: string;
            products?: ProductComponent[];
        }) {
            const myPreferences: Record<string, {category: string; name: string; value: string}> = {};
            if (globalPreference !== undefined) {
                myPreferences[getPreferenceKey(Preferences.CATEGORY_LANDING_PRODUCT, '')] = {
                    category: Preferences.CATEGORY_LANDING_PRODUCT,
                    name: '',
                    value: globalPreference,
                };
            }

            return mockStore({
                entities: {
                    general: {
                        config: {
                            DefaultClientLocale: 'en',
                        },
                        serverVersion: '5.16.0',
                    },
                    preferences: {
                        myPreferences,
                    },
                    teams: {
                        teams: {
                            team2: {id: 'team2', display_name: 'Team 2', name: 'team2', delete_at: 0, landing_product: teamLanding},
                        },
                        myMembers: {
                            team2: {team_id: 'team2'},
                        },
                    },
                    channels: {
                        myMembers: {
                            'channel-in-team-2': {},
                        },
                        channels: {
                            'channel-in-team-2': {
                                id: 'channel-in-team-2',
                                team_id: 'team2',
                                name: 'channel-in-team-2',
                            },
                        },
                        channelsInTeam: {
                            team2: new Set(['channel-in-team-2']),
                        },
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, roles: ''},
                        },
                    },
                },
                plugins: {
                    components: {
                        Product: products,
                    },
                },
            } as any);
        }

        beforeEach(() => {
            jest.clearAllMocks();
            jest.mocked(waitForProductsInitialized).mockResolvedValue(true);
            LocalStorageStore.setPreviousTeamId(userId, 'team2');
            LocalStorageStore.setPreviousChannelName(userId, 'team2', 'channel-in-team-2');
        });

        it('공통 개인 설정이 보드이고 product가 등록되어 있으면 /boards로 보낸다', async () => {
            const store = makeLandingState({
                globalPreference: LandingProducts.BOARDS,
                products: [boardsProduct],
            });
            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/boards');
        });

        it('개인 설정이 없어도 팀 기본값이 보드면 /boards로 보낸다', async () => {
            const store = makeLandingState({
                teamLanding: LandingProducts.BOARDS,
                products: [boardsProduct],
            });
            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(getHistory().push).toHaveBeenCalledWith('/boards');
        });

        it('설정이 보드인데 product 미등록에 대기 상한을 넘기면 채널로 보내고 저장값은 건드리지 않는다', async () => {
            jest.mocked(waitForProductsInitialized).mockResolvedValue(false);
            const store = makeLandingState({
                globalPreference: LandingProducts.BOARDS,
                products: [],
            });
            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(waitForProductsInitialized).toHaveBeenCalled();
            expect(getHistory().push).toHaveBeenCalledWith('/team2/channels/channel-in-team-2');
            expect(reduxStore.dispatch).not.toHaveBeenCalledWith(
                expect.objectContaining({type: expect.stringContaining('PREFERENCES')}),
            );
        });

        it('랜딩 설정이 없으면 product 등록을 기다리지 않고 기존 채널 경로로 간다', async () => {
            const store = makeLandingState({products: []});
            getState.mockImplementation(store.getState);

            await redirectUserToDefaultTeam();
            expect(waitForProductsInitialized).not.toHaveBeenCalled();
            expect(getHistory().push).toHaveBeenCalledWith('/team2/channels/channel-in-team-2');
        });
    });

    test('toggleSideBarRightMenuAction', () => {
        const dispatchMock = (arg: any) => {
            if (typeof arg === 'function') {
                arg(dispatchMock);
            }
        };
        dispatchMock(toggleSideBarRightMenuAction());
        expect(closeRhsMenu).toHaveBeenCalled();
        expect(closeRightHandSide).toHaveBeenCalled();
        expect(closeLhs).toHaveBeenCalled();
    });
});
