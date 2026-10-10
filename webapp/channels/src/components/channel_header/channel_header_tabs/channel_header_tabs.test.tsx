// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

import ChannelHeaderTabs from './channel_header_tabs';

jest.mock('actions/views/rhs', () => ({
    showPinnedPosts: jest.fn(() => ({type: 'MOCK_SHOW_PINNED'})),
    showChannelFiles: jest.fn(() => ({type: 'MOCK_SHOW_FILES'})),
    showChannelBookmarks: jest.fn(() => ({type: 'MOCK_SHOW_BOOKMARKS'})),
    closeRightHandSide: jest.fn(() => ({type: 'MOCK_CLOSE_RHS'})),
}));

jest.mock('components/channel_bookmarks/utils', () => ({
    ...jest.requireActual('components/channel_bookmarks/utils'),
    getIsChannelBookmarksEnabled: jest.fn(() => true),
}));

const {showPinnedPosts, showChannelFiles, showChannelBookmarks, closeRightHandSide} = jest.requireMock('actions/views/rhs');
const {getIsChannelBookmarksEnabled} = jest.requireMock('components/channel_bookmarks/utils');

describe('components/channel_header/channel_header_tabs', () => {
    const channelId = 'channel-id-1';

    function stateWith(overrides: {rhsState?: string | null; pinnedCount?: number} = {}): DeepPartial<GlobalState> {
        return {
            entities: {
                channels: {
                    stats: {
                        [channelId]: {
                            channel_id: channelId,
                            pinnedpost_count: overrides.pinnedCount ?? 0,
                        },
                    },
                },
                preferences: {myPreferences: {}},
                users: {currentUserId: 'user-id'},
            },
            views: {
                rhs: {rhsState: overrides.rhsState ?? null},
            },
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
        getIsChannelBookmarksEnabled.mockReturnValue(true);
    });

    it('탭 4개를 tablist 시맨틱과 라벨로 렌더하고 기본은 메시지 탭이 선택이다', () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith());

        expect(screen.getByRole('tablist')).toBeInTheDocument();

        const messages = screen.getByRole('tab', {name: /Messages/});
        expect(messages).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', {name: /Files/})).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', {name: /Bookmarks/})).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', {name: /Pinned/})).toHaveAttribute('aria-selected', 'false');
    });

    it('파일 패널이 열려 있으면 파일 탭만 선택이다', () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({rhsState: RHSStates.CHANNEL_FILES}));

        expect(screen.getByRole('tab', {name: /Files/})).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', {name: /Messages/})).toHaveAttribute('aria-selected', 'false');
    });

    it('고정 패널이 열려 있으면 고정 탭만 선택이다', () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({rhsState: RHSStates.PIN}));

        expect(screen.getByRole('tab', {name: /Pinned/})).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', {name: /Messages/})).toHaveAttribute('aria-selected', 'false');
    });

    it('검색 결과 등 다른 패널이 열려 있으면 어떤 콘텐츠 탭도 선택이 아니다', () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({rhsState: RHSStates.SEARCH}));

        expect(screen.getByRole('tab', {name: /Messages/})).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', {name: /Files/})).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', {name: /Pinned/})).toHaveAttribute('aria-selected', 'false');
    });

    it('고정 개수가 있으면 배지로 보여준다', () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({pinnedCount: 3}));

        expect(screen.getByTestId('channelHeaderTab-pinned-badge')).toHaveTextContent('3');
    });

    it('고정 개수가 0이면 배지가 없다', () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({pinnedCount: 0}));

        expect(screen.queryByTestId('channelHeaderTab-pinned-badge')).not.toBeInTheDocument();
    });

    it('닫힌 패널의 탭 클릭은 해당 패널을 열고, 다른 패널이 열려 있으면 전환한다', async () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith());

        await userEvent.click(screen.getByRole('tab', {name: /Files/}));
        expect(showChannelFiles).toHaveBeenCalledWith(channelId);

        await userEvent.click(screen.getByRole('tab', {name: /Pinned/}));
        expect(showPinnedPosts).toHaveBeenCalledWith(channelId);
    });

    it('패널이 열려 있을 때 메시지 탭 클릭은 패널을 닫는다', async () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({rhsState: RHSStates.CHANNEL_FILES}));

        await userEvent.click(screen.getByRole('tab', {name: /Messages/}));

        expect(closeRightHandSide).toHaveBeenCalled();
    });

    it('열려 있는 패널의 탭을 다시 클릭하면 닫는다 (토글)', async () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({rhsState: RHSStates.PIN}));

        await userEvent.click(screen.getByRole('tab', {name: /Pinned/}));

        expect(closeRightHandSide).toHaveBeenCalled();
        expect(showPinnedPosts).not.toHaveBeenCalled();
    });

    it('패널이 닫혀 있을 때 메시지 탭 클릭은 아무것도 디스패치하지 않는다', async () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith());

        await userEvent.click(screen.getByRole('tab', {name: /Messages/}));

        expect(closeRightHandSide).not.toHaveBeenCalled();
    });

    it('북마크 탭 클릭은 북마크 패널(RHS)을 연다', async () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith());

        await userEvent.click(screen.getByRole('tab', {name: /Bookmarks/}));

        expect(showChannelBookmarks).toHaveBeenCalledWith(channelId);
    });

    it('북마크 패널이 열려 있으면 북마크 탭만 선택이고, 다시 클릭하면 닫는다 (토글)', async () => {
        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith({rhsState: RHSStates.CHANNEL_BOOKMARKS}));

        expect(screen.getByRole('tab', {name: /Bookmarks/})).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', {name: /Messages/})).toHaveAttribute('aria-selected', 'false');

        await userEvent.click(screen.getByRole('tab', {name: /Bookmarks/}));

        expect(closeRightHandSide).toHaveBeenCalled();
        expect(showChannelBookmarks).not.toHaveBeenCalled();
    });

    it('북마크 기능이 꺼진 서버에서는 북마크 탭이 없다', () => {
        getIsChannelBookmarksEnabled.mockReturnValue(false);

        renderWithContext(<ChannelHeaderTabs channelId={channelId}/>, stateWith());

        expect(screen.queryByRole('tab', {name: /Bookmarks/})).not.toBeInTheDocument();
    });
});
