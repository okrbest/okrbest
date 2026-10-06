// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

import type {GlobalState} from 'types/store';

import ChannelSidebarToggle from './channel_sidebar_toggle';

describe('components/sidebar/channel_sidebar_toggle', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('기본은 숨기기 모드 버튼이고, 누르면 사이드바를 접고 표시 모드로 바뀐다', async () => {
        const {store} = renderWithContext(<ChannelSidebarToggle/>);

        const hideButton = screen.getByRole('button', {name: 'Hide channel sidebar'});
        await userEvent.click(hideButton);

        expect((store.getState() as GlobalState).views.lhs.channelSidebarCollapsed).toBe(true);
        expect(screen.getByRole('button', {name: 'Show channel sidebar'})).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: 'Show channel sidebar'}));
        expect((store.getState() as GlobalState).views.lhs.channelSidebarCollapsed).toBe(false);
        expect(screen.getByRole('button', {name: 'Hide channel sidebar'})).toBeInTheDocument();
    });

    test('접힘 상태를 localStorage에 보존하고 마운트 때 복원한다', async () => {
        const first = renderWithContext(<ChannelSidebarToggle/>);
        await userEvent.click(screen.getByRole('button', {name: 'Hide channel sidebar'}));
        first.unmount();

        const {store} = renderWithContext(<ChannelSidebarToggle/>);
        expect((store.getState() as GlobalState).views.lhs.channelSidebarCollapsed).toBe(true);
        expect(screen.getByRole('button', {name: 'Show channel sidebar'})).toBeInTheDocument();
    });
});
