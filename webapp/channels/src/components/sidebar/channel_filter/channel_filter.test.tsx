// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import ChannelFilterIntl from 'components/sidebar/channel_filter/channel_filter';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';

describe('components/sidebar/channel_filter', () => {
    const baseProps = {
        unreadFilterEnabled: false,
        hasMultipleTeams: false,
        actions: {
            setUnreadFilterEnabled: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Slack 벤치마크(019 measurements 18절): 아이콘만으로는 기능이 안 읽힌다 —
    // "필터" 라벨과 체브론을 노출하고, 옵션은 드롭다운 리스트로 고른다
    test('필터 버튼은 라벨과 함께 렌더된다', () => {
        renderWithContext(<ChannelFilterIntl {...baseProps}/>);

        expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    test('버튼 클릭은 필터 옵션 메뉴를 연다', async () => {
        renderWithContext(<ChannelFilterIntl {...baseProps}/>);

        await userEvent.click(screen.getByTestId('sidebar-unread-filter-button'));

        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Show all channels/})).toBeInTheDocument();
        });
        expect(screen.getByRole('menuitemradio', {name: /Filter by unread/})).toBeInTheDocument();
    });

    test('읽지 않음 필터 옵션을 고르면 필터가 켜진다', async () => {
        renderWithContext(<ChannelFilterIntl {...baseProps}/>);

        await userEvent.click(screen.getByTestId('sidebar-unread-filter-button'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Filter by unread/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Filter by unread/}));

        await waitFor(() => {
            expect(baseProps.actions.setUnreadFilterEnabled).toHaveBeenCalledWith(true);
        });
    });

    test('모든 채널 옵션을 고르면 필터가 꺼진다', async () => {
        const props = {...baseProps, unreadFilterEnabled: true};
        renderWithContext(<ChannelFilterIntl {...props}/>);

        await userEvent.click(screen.getByTestId('sidebar-unread-filter-button'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Show all channels/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Show all channels/}));

        await waitFor(() => {
            expect(baseProps.actions.setUnreadFilterEnabled).toHaveBeenCalledWith(false);
        });
    });

    test('현재 상태가 체크로 표시된다', async () => {
        const props = {...baseProps, unreadFilterEnabled: true};
        renderWithContext(<ChannelFilterIntl {...props}/>);

        await userEvent.click(screen.getByTestId('sidebar-unread-filter-button'));
        await waitFor(() => {
            expect(screen.getByTestId('channelFilter-check-unread')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('channelFilter-check-all')).not.toBeInTheDocument();
    });
});
