// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ChannelType} from '@mattermost/types/channels';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {ChannelMember} from './member_list';
import {ListItemType} from './member_list';
import type {ItemData} from './member_list_item';
import MemberListItem from './member_list_item';

jest.mock('./member', () => {
    return (props: any) => (
        <div
            data-testid={`mock-member-${props.member.user.id}`}
            data-filterable={String(props.isFilterable)}
            data-checked={String(props.isChecked)}
            data-has-toggle={String(Boolean(props.onToggleFilter))}
        >
            {props.member.displayName}
        </div>
    );
});

describe('components/channel_members_rhs/MemberListItem', () => {
    const mockChannel = TestHelper.getChannelMock({
        id: 'channel_id',
        display_name: 'Test Channel',
        name: 'test-channel',
        type: 'O' as ChannelType,
        team_id: 'team_id',
    });

    const mockUser = TestHelper.getUserMock({
        id: 'user_id_1',
        username: 'testuser',
        nickname: 'Test User',
        roles: 'system_user',
    });

    const mockMembership = TestHelper.getChannelMembershipMock({
        channel_id: 'channel_id',
        user_id: 'user_id_1',
    });

    const mockMember: ChannelMember = {
        user: mockUser,
        membership: mockMembership,
        status: 'online',
        displayName: 'Test User',
    };

    const baseItemData: ItemData = {
        members: [
            {type: ListItemType.Member, data: mockMember},
        ],
        hasNextPage: false,
        channel: mockChannel,
        editing: false,
        totalMemberCount: 1,
        openDirectMessage: jest.fn(),
        fetchRemoteClusterInfo: jest.fn(),
    };

    const baseStyle = {top: 0, left: 0, width: '100%', height: 48, position: 'absolute' as const};

    test('should render a separator item', () => {
        const separatorData: ItemData = {
            ...baseItemData,
            members: [
                {type: ListItemType.Separator, data: <span>{'Separator Label'}</span>},
            ],
        };

        renderWithContext(
            <MemberListItem
                index={0}
                style={baseStyle}
                data={separatorData}
                isScrolling={false}
            />,
        );

        expect(screen.getByText('Separator Label')).toBeVisible();
    });

    test('should render multiple members at different indices', () => {
        const secondUser = TestHelper.getUserMock({
            id: 'user_id_2',
            username: 'seconduser',
            nickname: 'Second User',
        });

        const secondMember: ChannelMember = {
            ...mockMember,
            user: secondUser,
            displayName: 'Second User',
        };

        const multiMemberData: ItemData = {
            ...baseItemData,
            members: [
                {type: ListItemType.Member, data: mockMember},
                {type: ListItemType.Member, data: secondMember},
            ],
            totalMemberCount: 2,
        };

        const {rerender} = renderWithContext(
            <MemberListItem
                index={0}
                style={baseStyle}
                data={multiMemberData}
                isScrolling={false}
            />,
        );

        expect(screen.getByText('Test User')).toBeVisible();

        rerender(
            <MemberListItem
                index={1}
                style={baseStyle}
                data={multiMemberData}
                isScrolling={false}
            />,
        );

        expect(screen.getByText('Second User')).toBeVisible();
    });

    test('should not render an item that is not loaded yet', () => {
        const loadingData: ItemData = {
            ...baseItemData,
            hasNextPage: true,
        };

        const {container} = renderWithContext(
            <MemberListItem
                index={1}
                style={baseStyle}
                data={loadingData}
                isScrolling={false}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    describe('멤버 필터링 (okrbest)', () => {
        const onToggleMemberFilter = jest.fn();

        test('should mark a member checked when its id is in filterUserIds', () => {
            renderWithContext(
                <MemberListItem
                    index={0}
                    style={baseStyle}
                    data={{
                        ...baseItemData,
                        filterUserIds: ['user_id_1'],
                        onToggleMemberFilter,
                    }}
                    isScrolling={false}
                />,
            );

            const member = screen.getByTestId('mock-member-user_id_1');
            expect(member).toHaveAttribute('data-checked', 'true');
            expect(member).toHaveAttribute('data-filterable', 'true');
            expect(member).toHaveAttribute('data-has-toggle', 'true');
        });

        test('should leave a member unchecked when its id is absent from filterUserIds', () => {
            renderWithContext(
                <MemberListItem
                    index={0}
                    style={baseStyle}
                    data={{
                        ...baseItemData,
                        filterUserIds: ['someone_else'],
                        onToggleMemberFilter,
                    }}
                    isScrolling={false}
                />,
            );

            expect(screen.getByTestId('mock-member-user_id_1')).toHaveAttribute('data-checked', 'false');
        });

        test('should leave a member unchecked when filterUserIds is undefined', () => {
            renderWithContext(
                <MemberListItem
                    index={0}
                    style={baseStyle}
                    data={baseItemData}
                    isScrolling={false}
                />,
            );

            expect(screen.getByTestId('mock-member-user_id_1')).toHaveAttribute('data-checked', 'false');
        });

        test('should not offer filtering while editing', () => {
            renderWithContext(
                <MemberListItem
                    index={0}
                    style={baseStyle}
                    data={{
                        ...baseItemData,
                        editing: true,
                        filterUserIds: ['user_id_1'],
                        onToggleMemberFilter,
                    }}
                    isScrolling={false}
                />,
            );

            expect(screen.getByTestId('mock-member-user_id_1')).toHaveAttribute('data-filterable', 'false');
        });
    });
});
