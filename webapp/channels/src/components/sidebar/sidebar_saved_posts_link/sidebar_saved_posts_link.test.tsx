// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {close as closeLhs} from 'actions/views/lhs';
import {showFlaggedPosts} from 'actions/views/rhs';
import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import SidebarSavedPostsLink from './sidebar_saved_posts_link';

jest.mock('actions/views/lhs', () => ({
    close: jest.fn(() => ({type: 'MOCK_CLOSE_LHS'})),
}));

jest.mock('actions/views/rhs', () => ({
    closeRightHandSide: jest.fn(() => ({type: 'MOCK_CLOSE_RHS'})),
    showFlaggedPosts: jest.fn(() => ({type: 'MOCK_SHOW_FLAGGED_POSTS'})),
}));

describe('components/sidebar/sidebar_saved_posts_link', () => {
    const currentUserId = 'current_user_id';
    const teamId = 'team_id1';

    function getState(): DeepPartial<GlobalState> {
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
                    channels: {},
                    myMembers: {},
                    messageCounts: {},
                    channelsInTeam: {[teamId]: new Set()},
                },
            },
            views: {
                lhs: {isOpen: true},
                rhs: {
                    isSidebarOpen: false,
                    rhsState: null,
                },
            },
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('클릭하면 모바일 LHS를 닫고 보관된 메시지(RHS)를 연다', async () => {
        renderWithContext(<SidebarSavedPostsLink/>, getState());

        await userEvent.click(screen.getByRole('button', {name: /Saved messages/}));

        expect(closeLhs).toHaveBeenCalled();
        expect(showFlaggedPosts).toHaveBeenCalled();
    });
});
