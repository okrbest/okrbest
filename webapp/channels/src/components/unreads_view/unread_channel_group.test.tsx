// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import UnreadChannelGroup from './unread_channel_group';

import type {GlobalState} from 'types/store';

jest.mock('components/post', () => {
    // PostComponent는 거대한 연결 컴포넌트라 카드 구조 단위 테스트에서는 스텁으로
    // 대체한다. 실제 렌더링은 quickstart 종단 검증이 확인한다.
    return function MockPost(props: {post: {id: string}}) {
        return <div data-testid={`post-stub-${props.post.id}`}/>;
    };
});

describe('components/unreads_view/unread_channel_group', () => {
    const currentUserId = 'current_user_id';
    const teamId = 'team_id1';

    const channel = TestHelper.getChannelMock({
        id: 'channel_id1',
        team_id: teamId,
        name: 'unread-channel',
        display_name: 'Unread Channel',
        type: 'O',
    });

    const posts = {
        unread_post1: TestHelper.getPostMock({id: 'unread_post1', channel_id: channel.id, create_at: 1500, user_id: 'other_user'}),
        unread_post2: TestHelper.getPostMock({id: 'unread_post2', channel_id: channel.id, create_at: 2000, user_id: 'other_user'}),
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
                    channels: {[channel.id]: channel},
                    myMembers: {},
                    messageCounts: {},
                },
                posts: {
                    posts,
                    postsInChannel: {},
                },
            },
        };
    }

    const baseProps = {
        channel,
        lastViewedAt: 1000,
        mentionCount: 0,
        postIds: ['unread_post1', 'unread_post2'],
        hasLoadFailed: false,
    };

    test('채널 유형이 드러나는 머리글과 포스트 목록을 그린다 (FR-004·FR-005)', () => {
        renderWithContext(<UnreadChannelGroup {...baseProps}/>, getBaseState());

        expect(screen.getByText('Unread Channel')).toBeInTheDocument();
        expect(screen.getByTestId('post-stub-unread_post1')).toBeInTheDocument();
        expect(screen.getByTestId('post-stub-unread_post2')).toBeInTheDocument();
    });

    test('멘션 수를 배지로 보여준다', () => {
        renderWithContext(
            <UnreadChannelGroup
                {...baseProps}
                mentionCount={3}
            />,
            getBaseState(),
        );

        expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('본문을 불러오지 못하면 실패 안내를 보여준다', () => {
        renderWithContext(
            <UnreadChannelGroup
                {...baseProps}
                postIds={[]}
                hasLoadFailed={true}
            />,
            getBaseState(),
        );

        expect(screen.getByText('Couldn’t load unread messages. Open the channel to view them.')).toBeInTheDocument();
    });

    test('머리글의 채널 제목을 누르면 채널로 이동한다 (FR-004)', async () => {
        renderWithContext(<UnreadChannelGroup {...baseProps}/>, getBaseState());

        await userEvent.click(screen.getByRole('button', {name: /Unread Channel/}));

        // useHistory는 전역 목(tests/react-router-dom_mock.ts)으로 대체된다
        expect((global as any).historyMock.push).toHaveBeenCalledWith('/team-name/channels/unread-channel');
    });
});
