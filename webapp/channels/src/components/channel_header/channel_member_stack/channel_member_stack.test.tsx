// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {RHSStates} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import ChannelMemberStack from './channel_member_stack';

jest.mock('actions/views/rhs', () => ({
    showChannelMembers: jest.fn(() => ({type: 'MOCK_SHOW_MEMBERS'})),
    closeRightHandSide: jest.fn(() => ({type: 'MOCK_CLOSE_RHS'})),
}));

jest.mock('mattermost-redux/actions/users', () => ({
    ...jest.requireActual('mattermost-redux/actions/users'),
    getProfilesInChannel: jest.fn(() => ({type: 'MOCK_GET_PROFILES'})),
}));

const {showChannelMembers, closeRightHandSide} = jest.requireMock('actions/views/rhs');
const {getProfilesInChannel} = jest.requireMock('mattermost-redux/actions/users');

describe('components/channel_header/channel_member_stack', () => {
    const channelId = 'channel-id-1';
    const users = ['u1', 'u2', 'u3', 'u4'].map((id) => TestHelper.getUserMock({id, username: `user-${id}`}));

    function stateWith(overrides: {ids?: string[]; memberCount?: number; rhsState?: string | null} = {}): DeepPartial<GlobalState> {
        const ids = overrides.ids ?? users.map((u) => u.id);
        return {
            entities: {
                users: {
                    currentUserId: 'u1',
                    profiles: Object.fromEntries(users.map((u) => [u.id, u])),
                    profilesInChannel: {[channelId]: new Set(ids)},
                },
                channels: {
                    stats: {
                        [channelId]: {
                            channel_id: channelId,
                            member_count: overrides.memberCount ?? 18,
                        },
                    },
                },
                general: {config: {}},
                preferences: {myPreferences: {}},
                teams: {teams: {}},
            },
            views: {rhs: {rhsState: overrides.rhsState ?? null}},
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('아바타 최대 3명과 전체 인원수를 이름 있는 버튼으로 보여준다', () => {
        renderWithContext(<ChannelMemberStack channelId={channelId}/>, stateWith({memberCount: 18}));

        const button = screen.getByRole('button', {name: /18/});
        expect(button).toBeInTheDocument();
        expect(button.querySelectorAll('.Avatar').length).toBeLessThanOrEqual(3);
        expect(screen.getByTestId('channelMemberStack-count')).toHaveTextContent('18');
    });

    it('클릭하면 멤버 패널을 연다', async () => {
        renderWithContext(<ChannelMemberStack channelId={channelId}/>, stateWith());

        await userEvent.click(screen.getByTestId('channelMemberStack'));

        expect(showChannelMembers).toHaveBeenCalledWith(channelId);
    });

    it('멤버 패널이 이미 열려 있으면 클릭이 패널을 닫는다', async () => {
        renderWithContext(<ChannelMemberStack channelId={channelId}/>, stateWith({rhsState: RHSStates.CHANNEL_MEMBERS}));

        await userEvent.click(screen.getByTestId('channelMemberStack'));

        expect(closeRightHandSide).toHaveBeenCalled();
        expect(showChannelMembers).not.toHaveBeenCalled();
    });

    it('채널 프로필이 로드되지 않았으면 로드 액션을 1회 호출한다', () => {
        renderWithContext(<ChannelMemberStack channelId={channelId}/>, stateWith({ids: []}));

        expect(getProfilesInChannel).toHaveBeenCalledTimes(1);
        expect(getProfilesInChannel).toHaveBeenCalledWith(channelId, 0, 3);
    });
});
