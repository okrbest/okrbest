// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import TeamSidebar from './index';

describe('components/team_sidebar', () => {
    const currentUserId = 'current_user_id';
    const team = TestHelper.getTeamMock({id: 'team_id1', name: 'team-1', display_name: 'Team 1'});

    function getState(): DeepPartial<GlobalState> {
        return {
            entities: {
                general: {config: {}},
                users: {
                    currentUserId,
                    profiles: {[currentUserId]: TestHelper.getUserMock({id: currentUserId})},
                },
                teams: {
                    currentTeamId: team.id,
                    teams: {[team.id]: team},
                    myMembers: {[team.id]: TestHelper.getTeamMembershipMock({team_id: team.id, user_id: currentUserId})},
                },
            },
        };
    }

    beforeEach(() => {
        // team_sidebar는 #root 엘리먼트의 클래스를 직접 조작한다
        const root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
    });

    afterEach(() => {
        document.getElementById('root')?.remove();
    });

    test('팀이 1개여도 팀 레일을 표시한다 (버튼 거치대로 상시 유지)', () => {
        renderWithContext(<TeamSidebar/>, getState());

        expect(document.querySelector('.team-sidebar')).toBeInTheDocument();
        expect(document.getElementById('root')).toHaveClass('multi-teams');
    });

    test('팀 레일 하단에 프로필 계정 메뉴 버튼을 표시한다 (Slack 벤치마크)', () => {
        renderWithContext(<TeamSidebar/>, getState());

        const footer = document.querySelector('.team-sidebar .SidebarFooter');
        expect(footer).toBeInTheDocument();
        expect(screen.getByLabelText('User\'s account menu')).toBeInTheDocument();
    });
});
