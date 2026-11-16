// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fireEvent, renderWithContext, screen} from 'tests/react_testing_utils';
import {RHSStates} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import ChannelHeader from './channel_header';

// The channel header's content tabs read file-search availability from the store config, which these
// tests render without; keep the Files tab visible as on a server with file search on.
jest.mock('utils/file_utils', () => ({
    ...jest.requireActual('utils/file_utils'),
    canSearchFiles: () => true,
}));

describe('components/ChannelHeader', () => {
    const baseProps = {
        actions: {
            showPinnedPosts: jest.fn(),
            showChannelFiles: jest.fn(),
            closeRightHandSide: jest.fn(),
            getCustomEmojisInText: jest.fn(),
            updateChannelNotifyProps: jest.fn(),
            savePreferences: jest.fn(),
            showChannelMembers: jest.fn(),
            fetchChannelRemotes: jest.fn(),
        },
        team: TestHelper.getTeamMock({id: 'team_id'}),
        channel: TestHelper.getChannelMock({}),
        channelMember: TestHelper.getChannelMembershipMock({}),
        currentUser: TestHelper.getUserMock({}),
        isCustomStatusEnabled: false,
        isCustomStatusExpired: false,
        canSearchFiles: true,
        lastActivityTimestamp: 1632146562846,
        isLastActiveEnabled: true,
        memberCount: 2,
        dmUser: undefined,
        gmMembers: undefined,
        rhsState: RHSStates.CHANNEL_INFO,
        isChannelMuted: false,
        hasGuests: false,
        pinnedPostsCount: 0,
        customStatus: undefined,
        timestampUnits: [
            'now',
            'minute',
            'hour',
        ],
        hideGuestTags: false,
        remoteNames: [],

        isChannelAutotranslated: false,
        hasPendingJoinRequests: false,
        showBotMessages: 'false',
    };

    const populatedProps = {
        ...baseProps,
        channel: TestHelper.getChannelMock({
            id: 'channel_id',
            team_id: 'team_id',
            name: 'Test',
            delete_at: 0,
        }),
        channelMember: TestHelper.getChannelMembershipMock({
            channel_id: 'channel_id',
            user_id: 'user_id',
        }),
        currentUser: TestHelper.getUserMock({
            id: 'user_id',
            bot_description: 'the bot description',
        }),
    };

    test('should unmute the channel when mute icon is clicked', () => {
        const props = {
            ...populatedProps,
            isChannelMuted: true,
        };

        const {container} = renderWithContext(
            <ChannelHeader {...props}/>,
        );

        const muteButton = container.querySelector('.channel-header__mute');
        expect(muteButton).not.toBeNull();
        (muteButton as HTMLElement).click();
        expect(props.actions.updateChannelNotifyProps).toHaveBeenCalledTimes(1);
        expect(props.actions.updateChannelNotifyProps).toHaveBeenCalledWith('user_id', 'channel_id', {mark_unread: 'all'});
    });

    test('should contain the channel info button', () => {
        const {container} = renderWithContext(
            <ChannelHeader {...populatedProps}/>,
        );

        // ChannelInfoButton renders a button with channel-info class
        const channelInfoButton = container.querySelector('.channel-header__info');
        expect(channelInfoButton).not.toBeNull();
    });

    describe('우측 운영 아이콘 (US2)', () => {
        test('알림벨이 상시 노출되고 클릭하면 뮤트를 토글한다', () => {
            const props = {
                ...populatedProps,
            };
            renderWithContext(<ChannelHeader {...props}/>);

            const bell = screen.getByTestId('channelHeaderBellButton');
            expect(bell).toBeInTheDocument();

            fireEvent.click(bell);
            expect(props.actions.updateChannelNotifyProps).toHaveBeenCalled();
        });

        test('뮤트 상태면 벨이 빗금 아이콘과 상태 라벨을 가진다', () => {
            const props = {
                ...populatedProps,
                isChannelMuted: true,
            };
            renderWithContext(<ChannelHeader {...props}/>);

            const bell = screen.getByTestId('channelHeaderBellButton');

            // 글리프는 SVG(아이콘 규칙 4항) — 뮤트 상태는 aria-label로 구분된다
            expect(bell.querySelector('svg')).toBeInTheDocument();
            expect(bell.querySelector('i')).not.toBeInTheDocument();
        });

        test('더보기(⋮) 버튼이 채널 메뉴를 연다', async () => {
            const state = {
                entities: {
                    channels: {
                        currentChannelId: 'channel_id',
                        channels: {channel_id: populatedProps.channel},
                        myMembers: {channel_id: populatedProps.channelMember},
                    },
                    users: {
                        currentUserId: populatedProps.currentUser.id,
                        profiles: {[populatedProps.currentUser.id]: populatedProps.currentUser},
                    },
                },
            };
            renderWithContext(<ChannelHeader {...populatedProps}/>, state);

            const kebab = screen.getByTestId('channelHeaderKebabButton');
            fireEvent.click(kebab);

            expect(await screen.findByRole('menu')).toBeInTheDocument();
        });

        test('기존 파일·고정 아이콘 버튼은 더 이상 없다', () => {
            renderWithContext(<ChannelHeader {...populatedProps}/>);

            expect(document.getElementById('channelHeaderFilesButton')).not.toBeInTheDocument();
            expect(document.getElementById('channelHeaderPinButton')).not.toBeInTheDocument();
        });

        test('DM에서도 탭 줄과 벨이 렌더되고 멤버 스택 자리가 유지된다 (FR-009)', () => {
            const props = {
                ...populatedProps,
                channel: TestHelper.getChannelMock({id: 'dm-id', type: 'D', name: 'dm'}),
                dmUser: TestHelper.getUserMock({id: 'other-user'}),
            };
            renderWithContext(<ChannelHeader {...props}/>);

            expect(screen.getByRole('tablist')).toBeInTheDocument();
            expect(screen.getByTestId('channelHeaderBellButton')).toBeInTheDocument();
        });
    });
});
