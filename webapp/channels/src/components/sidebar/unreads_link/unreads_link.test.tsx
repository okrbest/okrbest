// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import UnreadsLink from './unreads_link';

describe('components/sidebar/unreads_link', () => {
    const currentUserId = 'current_user_id';
    const teamId = 'team_id1';

    const unreadChannel = TestHelper.getChannelMock({
        id: 'channel_id1',
        team_id: teamId,
        name: 'unread-channel',
        display_name: 'Unread Channel',
        type: 'O',
        last_post_at: 3000,
    });

    function getState(withUnreads: boolean): DeepPartial<GlobalState> {
        return {
            entities: {
                general: {config: {}},
                users: {
                    currentUserId,
                    profiles: {[currentUserId]: TestHelper.getUserMock({id: currentUserId})},
                },
                teams: {
                    currentTeamId: teamId,
                    teams: {[teamId]: TestHelper.getTeamMock({id: teamId, name: 'team-name'})},
                },
                channels: {
                    channels: {[unreadChannel.id]: unreadChannel},
                    myMembers: {
                        [unreadChannel.id]: TestHelper.getChannelMembershipMock({
                            channel_id: unreadChannel.id,
                            user_id: currentUserId,
                            msg_count: withUnreads ? 7 : 10,
                            mention_count: withUnreads ? 2 : 0,
                            last_viewed_at: 1000,
                        }),
                    },
                    messageCounts: {
                        [unreadChannel.id]: {total: 10, root: 10},
                    },
                    channelsInTeam: {
                        [teamId]: new Set([unreadChannel.id]),
                    },
                },
            },
        };
    }

    test('읽지 않은 항목 메뉴를 항상 표시하고 전용 화면으로 연결한다 (FR-001·FR-002)', () => {
        renderWithContext(<UnreadsLink/>, getState(false));

        const link = screen.getByRole('link', {name: /Unreads/});
        expect(link).toHaveAttribute('href', '/team-name/unreads');

        // 아이콘은 compass-icons에 실존하는 글리프여야 한다 (mark-as-unread)
        const icon = link.querySelector('i.icon');
        expect(icon).toHaveClass('icon-mark-as-unread');
    });

    test('멘션 수를 배지로 보여준다 (FR-001)', () => {
        renderWithContext(<UnreadsLink/>, getState(true));

        expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('읽지 않은 항목이 없으면 배지를 숨기되 메뉴는 유지한다 (FR-001)', () => {
        renderWithContext(<UnreadsLink/>, getState(false));

        expect(screen.getByRole('link', {name: /Unreads/})).toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    // 027: 멘션·DM·GM 수와 일반 미읽음 수를 구분 병기한다
    describe('뱃지 구분 병기 (spec 027)', () => {
        const plainChannel = TestHelper.getChannelMock({
            id: 'channel_id2',
            team_id: teamId,
            name: 'plain-channel',
            display_name: 'Plain Channel',
            type: 'O',
            delete_at: 0,
        });

        // mentionCount: 멘션 전용 채널(메시지는 모두 읽음), plainUnread: 일반 미읽음 수
        function getSplitState(mentionCount: number, plainUnread: number): DeepPartial<GlobalState> {
            const base = getState(false);
            return {
                entities: {
                    ...base.entities,
                    channels: {
                        channels: {
                            [unreadChannel.id]: unreadChannel,
                            [plainChannel.id]: plainChannel,
                        },
                        myMembers: {
                            [unreadChannel.id]: TestHelper.getChannelMembershipMock({
                                channel_id: unreadChannel.id,
                                user_id: currentUserId,
                                msg_count: 10,
                                mention_count: mentionCount,
                                notify_props: {},
                            }),
                            [plainChannel.id]: TestHelper.getChannelMembershipMock({
                                channel_id: plainChannel.id,
                                user_id: currentUserId,
                                msg_count: 0,
                                mention_count: 0,
                                notify_props: {},
                            }),
                        },
                        messageCounts: {
                            [unreadChannel.id]: {total: 10, root: 10},
                            [plainChannel.id]: {total: plainUnread, root: plainUnread},
                        },
                        channelsInTeam: {
                            [teamId]: new Set([unreadChannel.id, plainChannel.id]),
                        },
                    },
                },
            };
        }

        test('멘션과 일반 미읽음이 함께 있으면 뱃지 두 개를 병기한다 (FR-001·FR-002)', () => {
            renderWithContext(<UnreadsLink/>, getSplitState(3, 12));

            const msgBadge = screen.getByTestId('unreadMsgBadge');
            expect(msgBadge).toHaveTextContent('12');

            const mentionBadge = screen.getByText('3');
            expect(mentionBadge).toBeInTheDocument();

            // DOM 순서: 일반 뱃지가 멘션 뱃지보다 앞(왼쪽)
            expect(msgBadge.compareDocumentPosition(mentionBadge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        test('일반 뱃지는 100건 이상이면 99로 캡한다 (FR-004)', () => {
            renderWithContext(<UnreadsLink/>, getSplitState(0, 120));

            expect(screen.getByTestId('unreadMsgBadge')).toHaveTextContent('99');
        });

        test('일반 미읽음만 있으면 일반 뱃지 하나만 보인다 (FR-003, US2)', () => {
            const {container} = renderWithContext(<UnreadsLink/>, getSplitState(0, 5));

            expect(screen.getByTestId('unreadMsgBadge')).toHaveTextContent('5');
            expect(container.querySelector('#unreadMentions')).not.toBeInTheDocument();
        });

        test('멘션만 있으면 기존과 같이 멘션 뱃지 하나만 보인다 (FR-003, US3)', () => {
            renderWithContext(<UnreadsLink/>, getSplitState(2, 0));

            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.queryByTestId('unreadMsgBadge')).not.toBeInTheDocument();
        });

        test('두 수치가 모두 0이면 뱃지가 없다 (FR-005)', () => {
            const {container} = renderWithContext(<UnreadsLink/>, getSplitState(0, 0));

            expect(screen.queryByTestId('unreadMsgBadge')).not.toBeInTheDocument();
            expect(container.querySelector('#unreadMentions')).not.toBeInTheDocument();
        });
    });
});
