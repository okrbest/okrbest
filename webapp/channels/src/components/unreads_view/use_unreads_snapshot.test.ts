// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act} from '@testing-library/react';
import {shallowEqual, useSelector} from 'react-redux';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderHookWithContext} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import {getUnreadChannels} from 'selectors/views/channel_sidebar';

import useUnreadsSnapshot from './use_unreads_snapshot';

import type {GlobalState} from 'types/store';

const mockLoadUnreads = jest.fn((channelId: string) => ({type: 'MOCK_LOAD_UNREADS', channelId}));

jest.mock('actions/views/channel', () => ({
    ...jest.requireActual('actions/views/channel'),
    loadUnreads: (channelId: string) => mockLoadUnreads(channelId),
}));

describe('components/unreads_view/use_unreads_snapshot', () => {
    const currentUserId = 'current_user_id';
    const teamId = 'team_id1';

    const mentionChannel = TestHelper.getChannelMock({
        id: 'mention_channel_id',
        team_id: teamId,
        name: 'mention-channel',
        display_name: 'Mention Channel',
        type: 'O',
        last_post_at: 3000,
        total_msg_count: 10,
    });
    const recentChannel = TestHelper.getChannelMock({
        id: 'recent_channel_id',
        team_id: teamId,
        name: 'recent-channel',
        display_name: 'Recent Channel',
        type: 'O',
        last_post_at: 9000,
        total_msg_count: 4,
    });

    const posts = {
        old_post: TestHelper.getPostMock({id: 'old_post', channel_id: mentionChannel.id, create_at: 500, user_id: 'other_user'}),
        unread_post1: TestHelper.getPostMock({id: 'unread_post1', channel_id: mentionChannel.id, create_at: 1500, user_id: 'other_user'}),
        unread_post2: TestHelper.getPostMock({id: 'unread_post2', channel_id: mentionChannel.id, create_at: 2000, user_id: 'other_user'}),
    };

    function getBaseState(): DeepPartial<GlobalState> {
        return {
            entities: {
                general: {config: {}},
                users: {
                    currentUserId,
                    profiles: {
                        [currentUserId]: TestHelper.getUserMock({id: currentUserId}),
                    },
                },
                teams: {
                    currentTeamId: teamId,
                    teams: {[teamId]: TestHelper.getTeamMock({id: teamId, name: 'team-name'})},
                },
                channels: {
                    channels: {
                        [mentionChannel.id]: mentionChannel,
                        [recentChannel.id]: recentChannel,
                    },
                    myMembers: {
                        [mentionChannel.id]: TestHelper.getChannelMembershipMock({
                            channel_id: mentionChannel.id,
                            user_id: currentUserId,
                            msg_count: 7,
                            mention_count: 2,
                            last_viewed_at: 1000,
                        }),
                        [recentChannel.id]: TestHelper.getChannelMembershipMock({
                            channel_id: recentChannel.id,
                            user_id: currentUserId,
                            msg_count: 2,
                            mention_count: 0,
                            last_viewed_at: 8000,
                        }),
                    },
                    messageCounts: {
                        [mentionChannel.id]: {total: 10, root: 10},
                        [recentChannel.id]: {total: 4, root: 4},
                    },
                    channelsInTeam: {
                        [teamId]: new Set([mentionChannel.id, recentChannel.id]),
                    },
                },
                posts: {
                    posts,
                    postsInChannel: {
                        [mentionChannel.id]: [
                            {order: ['unread_post2', 'unread_post1', 'old_post'], recent: true, oldest: false},
                        ],
                    },
                },
            },
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('진입 시점 그룹을 멘션 우선 순서로 고정하고, 사이드바와 같은 원천을 쓴다 (FR-003·FR-015)', () => {
        const {result} = renderHookWithContext(() => ({
            snapshot: useUnreadsSnapshot(),
            sidebarIds: useSelector((state: GlobalState) => getUnreadChannels(state).map((channel) => channel.id), shallowEqual),
        }), getBaseState());

        const groupIds = result.current.snapshot.groups.map((group) => group.channel.id);
        expect(groupIds).toEqual([mentionChannel.id, recentChannel.id]);

        // FR-015: 그룹 집합 = getUnreadChannels 결과 (사이드바 배지와 같은 원천)
        expect(groupIds).toEqual(result.current.sidebarIds);

        expect(result.current.snapshot.groups[0].mentionCount).toBe(2);
        expect(result.current.snapshot.groups[0].lastViewedAt).toBe(1000);
    });

    test('lastViewedAt 이후 포스트만 오래된 순으로 고른다 (FR-005)', () => {
        const {result} = renderHookWithContext(() => useUnreadsSnapshot(), getBaseState());

        expect(result.current.groups[0].postIds).toEqual(['unread_post1', 'unread_post2']);
    });

    test('포스트 묶음이 없는 채널만 loadUnreads를 호출한다', () => {
        renderHookWithContext(() => useUnreadsSnapshot(), getBaseState());

        expect(mockLoadUnreads).toHaveBeenCalledWith(recentChannel.id);
        expect(mockLoadUnreads).not.toHaveBeenCalledWith(mentionChannel.id);
    });

    test('이후 생긴 미읽음은 목록을 바꾸지 않고 newChannelCount로만 알리며, refresh로 반영한다 (FR-013)', () => {
        const baseState = getBaseState();
        const {result, replaceStoreState} = renderHookWithContext(() => useUnreadsSnapshot(), baseState);

        expect(result.current.groups).toHaveLength(2);
        expect(result.current.newChannelCount).toBe(0);

        const newChannel = TestHelper.getChannelMock({
            id: 'new_channel_id',
            team_id: teamId,
            name: 'new-channel',
            display_name: 'New Channel',
            type: 'O',
            last_post_at: 9500,
            total_msg_count: 1,
        });

        const nextState = getBaseState();
        nextState.entities!.channels!.channels![newChannel.id] = newChannel;
        nextState.entities!.channels!.myMembers![newChannel.id] = TestHelper.getChannelMembershipMock({
            channel_id: newChannel.id,
            user_id: currentUserId,
            msg_count: 0,
            mention_count: 0,
            last_viewed_at: 9000,
        });
        nextState.entities!.channels!.messageCounts![newChannel.id] = {total: 1, root: 1};
        nextState.entities!.channels!.channelsInTeam = {
            [teamId]: new Set([mentionChannel.id, recentChannel.id, newChannel.id]),
        };

        replaceStoreState(nextState);

        expect(result.current.groups).toHaveLength(2);
        expect(result.current.newChannelCount).toBe(1);

        act(() => {
            result.current.refresh();
        });

        expect(result.current.groups).toHaveLength(3);
        expect(result.current.newChannelCount).toBe(0);
    });

    test('removeGroups는 해당 그룹만 즉시 제거한다', () => {
        const {result} = renderHookWithContext(() => useUnreadsSnapshot(), getBaseState());

        act(() => {
            result.current.removeGroups([mentionChannel.id]);
        });

        expect(result.current.groups.map((group) => group.channel.id)).toEqual([recentChannel.id]);
    });
});
