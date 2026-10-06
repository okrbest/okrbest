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
        total_msg_count: 10,
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
});
