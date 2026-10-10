// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ChannelBookmark} from '@mattermost/types/channel_bookmarks';
import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

import type {GlobalState} from 'types/store';

import ChannelBookmarksRhs from './channel_bookmarks_rhs';

jest.mock('actions/views/rhs', () => ({
    closeRightHandSide: jest.fn(() => ({type: 'MOCK_CLOSE_RHS'})),
}));

jest.mock('actions/channel_bookmarks', () => ({
    fetchChannelBookmarks: jest.fn(() => ({type: 'MOCK_FETCH_BOOKMARKS'})),
    reorderBookmark: jest.fn(() => ({type: 'MOCK_REORDER'})),
}));

const {closeRightHandSide} = jest.requireMock('actions/views/rhs');

describe('components/channel_bookmarks_rhs', () => {
    const channelId = 'channel-id-1';

    function stateWith(bookmarks: Record<string, ChannelBookmark> = {}): DeepPartial<GlobalState> {
        return {
            entities: {
                channels: {
                    currentChannelId: channelId,
                    channels: {
                        [channelId]: {
                            id: channelId,
                            display_name: 'HR Chatbot 프로젝트',
                            type: 'O',
                            team_id: 'team-id-1',
                            delete_at: 0,
                        },
                    },
                },
                channelBookmarks: {
                    byChannelId: {
                        [channelId]: bookmarks,
                    },
                },
                users: {currentUserId: 'user-id'},
            },
        };
    }

    const linkBookmark = (id: string, name: string, url: string, sortOrder: number): ChannelBookmark => ({
        id,
        channel_id: channelId,
        owner_id: 'user-id',
        display_name: name,
        link_url: url,
        type: 'link',
        sort_order: sortOrder,
        create_at: 1,
        update_at: 1,
        delete_at: 0,
    } as ChannelBookmark);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('제목과 채널명, 북마크 링크 목록을 정렬 순서대로 렌더한다', () => {
        renderWithContext(
            <ChannelBookmarksRhs/>,
            stateWith({
                b2: linkBookmark('b2', 'TeamplGPT 테스트', 'https://example.com/b', 2),
                b1: linkBookmark('b1', '인사쟁이 질문 모음', 'https://example.com/a', 1),
            }),
        );

        expect(screen.getByText('Bookmarks')).toBeInTheDocument();
        expect(screen.getByText('HR Chatbot 프로젝트')).toBeInTheDocument();

        const items = screen.getAllByRole('link');
        expect(items[0]).toHaveTextContent('인사쟁이 질문 모음');
        expect(items[1]).toHaveTextContent('TeamplGPT 테스트');
        expect(items[0]).toHaveAttribute('href', 'https://example.com/a');
    });

    it('북마크가 없으면 빈 상태 안내를 보여준다', () => {
        renderWithContext(<ChannelBookmarksRhs/>, stateWith());

        expect(screen.getByText(/No bookmarks/)).toBeInTheDocument();
    });

    it('닫기 버튼은 패널을 닫는다', async () => {
        renderWithContext(<ChannelBookmarksRhs/>, stateWith());

        await userEvent.click(screen.getByLabelText(/Close/i));

        expect(closeRightHandSide).toHaveBeenCalled();
    });
});
