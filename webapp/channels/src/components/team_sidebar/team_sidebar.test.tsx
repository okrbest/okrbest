// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {fireEvent, renderWithContext, screen} from 'tests/react_testing_utils';
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

    test('채널 사이드바가 접힌 상태에서 레일에 호버하면 peek을 켠다', () => {
        const state = getState();
        (state as any).views = {lhs: {channelSidebarCollapsed: true, channelSidebarPeek: false}};
        const {store} = renderWithContext(<TeamSidebar/>, state);

        fireEvent.mouseEnter(document.querySelector('.team-sidebar')!);

        expect((store.getState() as GlobalState).views.lhs.channelSidebarPeek).toBe(true);
    });

    test('팀 레일 하단에 프로필 계정 메뉴 버튼을 표시한다 (Slack 벤치마크)', () => {
        renderWithContext(<TeamSidebar/>, getState());

        const footer = document.querySelector('.team-sidebar .SidebarFooter');
        expect(footer).toBeInTheDocument();
        expect(screen.getByLabelText('User\'s account menu')).toBeInTheDocument();
    });

    test('프로필 버튼이 플러그인 슬롯(BottomTeamSidebar)보다 아래, 레일 최하단에 온다', () => {
        renderWithContext(<TeamSidebar/>, getState());

        const sidebar = document.querySelector('.team-sidebar')!;
        const footer = sidebar.querySelector('.SidebarFooter')!;
        const pluginSlot = sidebar.querySelector('.team-sidebar-bottom-plugin')!;

        expect(pluginSlot).toBeInTheDocument();

        // todo 플러그인 등이 BottomTeamSidebar에 꽂혀도 프로필이 최하단을 지키려면
        // 플러그인 슬롯이 DOM에서 footer보다 앞(위)에 있어야 한다
        expect(pluginSlot.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(sidebar.lastElementChild).toBe(footer);
    });
});
