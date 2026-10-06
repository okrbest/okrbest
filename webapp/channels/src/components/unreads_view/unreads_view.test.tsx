// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, waitFor, within, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import UnreadsView from './unreads_view';

import type {GlobalState} from 'types/store';
import type {DeepPartial} from '@mattermost/types/utilities';

const mockMarkChannelAsRead = jest.fn(() => ({type: 'MOCK_MARK_CHANNEL_AS_READ'}));
const mockReadMultipleChannels = jest.fn((_channelIds: string[]) => () => Promise.resolve({data: true}));

jest.mock('mattermost-redux/actions/channels', () => ({
    ...jest.requireActual('mattermost-redux/actions/channels'),
    markChannelAsRead: (...args: unknown[]) => mockMarkChannelAsRead(...args as []),
    readMultipleChannels: (channelIds: string[]) => mockReadMultipleChannels(channelIds),
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

    describe('읽음 처리 (US2)', () => {
        const channelA = TestHelper.getChannelMock({
            id: 'channel_a',
            team_id: teamId,
            name: 'channel-a',
            display_name: 'Channel A',
            type: 'O',
            last_post_at: 3000,
        });
        const channelB = TestHelper.getChannelMock({
            id: 'channel_b',
            team_id: teamId,
            name: 'channel-b',
            display_name: 'Channel B',
            type: 'O',
            last_post_at: 2000,
        });

        function getStateWithUnreads(): DeepPartial<GlobalState> {
            const state = getBaseState();

            return {
                ...state,
                entities: {
                    ...state.entities,
                    channels: {
                        channels: {
                            [channelA.id]: channelA,
                            [channelB.id]: channelB,
                        },
                        myMembers: {
                            [channelA.id]: TestHelper.getChannelMembershipMock({
                                channel_id: channelA.id,
                                user_id: currentUserId,
                                msg_count: 0,
                                mention_count: 0,
                                last_viewed_at: 1000,
                            }),
                            [channelB.id]: TestHelper.getChannelMembershipMock({
                                channel_id: channelB.id,
                                user_id: currentUserId,
                                msg_count: 0,
                                mention_count: 0,
                                last_viewed_at: 1000,
                            }),
                        },
                        messageCounts: {
                            [channelA.id]: {total: 3, root: 3},
                            [channelB.id]: {total: 2, root: 2},
                        },
                        channelsInTeam: {
                            [teamId]: new Set([channelA.id, channelB.id]),
                        },
                    },
                },
            };
        }

        test('그룹의 "읽음으로 표시"는 해당 채널만 읽음 처리하고 그룹을 없앤다 (FR-008)', async () => {
            renderWithContext(<UnreadsView/>, getStateWithUnreads());

            const groupA = await screen.findByTestId(`unread-group-${channelA.id}`);
            await userEvent.click(within(groupA).getByRole('button', {name: 'Mark as read'}));

            expect(mockReadMultipleChannels).toHaveBeenCalledWith([channelA.id]);
            await waitFor(() => {
                expect(screen.queryByTestId(`unread-group-${channelA.id}`)).not.toBeInTheDocument();
            });
            expect(screen.getByTestId(`unread-group-${channelB.id}`)).toBeInTheDocument();
        });

        test('"모든 메시지 읽음으로 표시"는 전 채널을 읽음 처리하고 빈 상태를 보여준다 (FR-009)', async () => {
            renderWithContext(<UnreadsView/>, getStateWithUnreads());

            await screen.findByTestId(`unread-group-${channelA.id}`);
            await userEvent.click(screen.getByRole('button', {name: 'Mark all as read'}));

            expect(mockReadMultipleChannels).toHaveBeenCalledWith([channelA.id, channelB.id]);
            expect(await screen.findByText('You’re all caught up')).toBeInTheDocument();
        });

        test('읽음 처리가 실패하면 그룹을 지우지 않고 오류를 알린다', async () => {
            mockReadMultipleChannels.mockReturnValueOnce(() => Promise.resolve({error: new Error('boom')} as never));

            renderWithContext(<UnreadsView/>, getStateWithUnreads());

            const groupA = await screen.findByTestId(`unread-group-${channelA.id}`);
            await userEvent.click(within(groupA).getByRole('button', {name: 'Mark as read'}));

            expect(await screen.findByText('Couldn’t mark as read. Please try again.')).toBeInTheDocument();
            expect(screen.getByTestId(`unread-group-${channelA.id}`)).toBeInTheDocument();
        });

        test('보는 동안 생긴 새 미읽음은 목록을 흔들지 않고 배너로 알리며, 배너를 누르면 반영된다 (FR-013)', async () => {
            const channelC = TestHelper.getChannelMock({
                id: 'channel_c',
                team_id: teamId,
                name: 'channel-c',
                display_name: 'Channel C',
                type: 'O',
                last_post_at: 9000,
            });

            const {updateStoreState} = renderWithContext(<UnreadsView/>, getStateWithUnreads());

            await screen.findByTestId(`unread-group-${channelA.id}`);
            expect(screen.queryByText('1 new unread conversation')).not.toBeInTheDocument();

            updateStoreState({
                entities: {
                    channels: {
                        channels: {[channelC.id]: channelC},
                        myMembers: {
                            [channelC.id]: TestHelper.getChannelMembershipMock({
                                channel_id: channelC.id,
                                user_id: currentUserId,
                                msg_count: 0,
                                mention_count: 0,
                                last_viewed_at: 8000,
                            }),
                        },
                        messageCounts: {[channelC.id]: {total: 1, root: 1}},
                        channelsInTeam: {
                            [teamId]: new Set([channelA.id, channelB.id, channelC.id]),
                        },
                    },
                },
            });

            // 목록은 그대로, 배너만 나타난다
            expect(screen.queryByTestId(`unread-group-${channelC.id}`)).not.toBeInTheDocument();
            expect(await screen.findByText('1 new unread conversation')).toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', {name: 'Show'}));

            expect(await screen.findByTestId(`unread-group-${channelC.id}`)).toBeInTheDocument();
        });

        test('포커스가 있는 그룹에서 Esc를 누르면 그 그룹이 읽음 처리된다 (FR-010)', async () => {
            renderWithContext(<UnreadsView/>, getStateWithUnreads());

            const groupA = await screen.findByTestId(`unread-group-${channelA.id}`);
            within(groupA).getByRole('button', {name: /Channel A/}).focus();
            await userEvent.keyboard('{Escape}');

            expect(mockReadMultipleChannels).toHaveBeenCalledWith([channelA.id]);
        });
    });
});
