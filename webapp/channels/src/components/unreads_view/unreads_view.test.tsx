// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, waitFor} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import UnreadsView from './unreads_view';

import type {GlobalState} from 'types/store';
import type {DeepPartial} from '@mattermost/types/utilities';

const mockMarkChannelAsRead = jest.fn(() => ({type: 'MOCK_MARK_CHANNEL_AS_READ'}));
const mockReadMultipleChannels = jest.fn(() => ({type: 'MOCK_READ_MULTIPLE_CHANNELS'}));

jest.mock('mattermost-redux/actions/channels', () => ({
    ...jest.requireActual('mattermost-redux/actions/channels'),
    markChannelAsRead: (...args: unknown[]) => mockMarkChannelAsRead(...args as []),
    readMultipleChannels: (...args: unknown[]) => mockReadMultipleChannels(...args as []),
}));

jest.mock('actions/views/channel', () => ({
    ...jest.requireActual('actions/views/channel'),
    loadUnreads: jest.fn(() => ({type: 'MOCK_LOAD_UNREADS'})),
}));

describe('components/unreads_view', () => {
    const currentUserId = 'current_user_id';
    const teamId = 'team_id1';

    function getBaseState(): DeepPartial<GlobalState> {
        const user = TestHelper.getUserMock({id: currentUserId, username: 'me'});
        const team = TestHelper.getTeamMock({id: teamId, name: 'team-name'});

        return {
            entities: {
                general: {
                    config: {},
                },
                users: {
                    currentUserId,
                    profiles: {
                        [currentUserId]: user,
                    },
                },
                teams: {
                    currentTeamId: teamId,
                    teams: {
                        [teamId]: team,
                    },
                },
                channels: {
                    channels: {},
                    myMembers: {},
                    messageCounts: {},
                    channelsInTeam: {},
                },
            },
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('마운트 시 LHS 정적 페이지를 unreads로 선택하고 RHS를 억제한다', async () => {
        const {store, unmount} = renderWithContext(<UnreadsView/>, getBaseState());

        await waitFor(() => {
            expect((store.getState() as GlobalState).views.lhs.currentStaticPageId).toBe('unreads');
        });
        expect((store.getState() as GlobalState).views.rhsSuppressed).toBe(true);

        unmount();
        expect((store.getState() as GlobalState).views.rhsSuppressed).toBe(false);
    });

    test('화면 제목을 렌더링한다', () => {
        renderWithContext(<UnreadsView/>, getBaseState());

        expect(screen.getByText('Unreads')).toBeInTheDocument();
    });

    test('읽지 않은 항목이 없으면 빈 상태 안내를 보여준다', async () => {
        renderWithContext(<UnreadsView/>, getBaseState());

        expect(await screen.findByText('You’re all caught up')).toBeInTheDocument();
    });

    test('보기만으로는 어떤 읽음 처리 액션도 디스패치하지 않는다 (FR-007)', async () => {
        const channel = TestHelper.getChannelMock({
            id: 'channel_id1',
            team_id: teamId,
            display_name: 'Unread Channel',
            type: 'O',
        });

        const state = getBaseState();
        const {unmount} = renderWithContext(<UnreadsView/>, {
            ...state,
            entities: {
                ...state.entities,
                channels: {
                    channels: {
                        [channel.id]: channel,
                    },
                    myMembers: {
                        [channel.id]: TestHelper.getChannelMembershipMock({
                            channel_id: channel.id,
                            user_id: currentUserId,
                            msg_count: 0,
                            mention_count: 2,
                            last_viewed_at: 1000,
                        }),
                    },
                    messageCounts: {
                        [channel.id]: {total: 5, root: 5},
                    },
                    channelsInTeam: {
                        [teamId]: new Set([channel.id]),
                    },
                },
            },
        });

        await waitFor(() => {
            expect(screen.queryByText('You’re all caught up')).not.toBeInTheDocument();
        });

        unmount();

        expect(mockMarkChannelAsRead).not.toHaveBeenCalled();
        expect(mockReadMultipleChannels).not.toHaveBeenCalled();
    });
});
