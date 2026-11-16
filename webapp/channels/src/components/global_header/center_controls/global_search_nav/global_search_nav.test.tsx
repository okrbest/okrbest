// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {closeRightHandSide, showMentions} from 'actions/views/rhs';

import {renderWithContext, userEvent} from 'tests/react_testing_utils';
import {RHSStates} from 'utils/constants';

import GlobalSearchNav from './global_search_nav';

jest.mock('actions/views/rhs', () => ({
    ...jest.requireActual('actions/views/rhs'),
    closeRightHandSide: jest.fn(() => ({type: 'MOCK_CLOSE_RHS'})),
    showMentions: jest.fn(() => ({type: 'MOCK_SHOW_MENTIONS'})),
}));

describe('components/GlobalSearchNav', () => {
    // 포크의 멘션 단축키는 멘션 필터 없이 열기·닫기만 토글한다
    describe('the mentions shortcut', () => {
        function renderWithRhsState(rhsState: string) {
            renderWithContext(
                <GlobalSearchNav/>,
                {
                    entities: {general: {config: {}}},
                    views: {
                        rhs: {
                            rhsState,
                            isSidebarOpen: true,
                        },
                    },
                },
            );
        }

        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('closes the panel when the mentions view is showing', async () => {
            renderWithRhsState(RHSStates.MENTION);

            await userEvent.keyboard('{Control>}{Shift>}m{/Shift}{/Control}');

            expect(closeRightHandSide).toHaveBeenCalledTimes(1);
            expect(showMentions).not.toHaveBeenCalled();
        });

        test('opens the mentions view when another view is showing', async () => {
            renderWithRhsState(RHSStates.FLAG);

            await userEvent.keyboard('{Control>}{Shift>}m{/Shift}{/Control}');

            expect(showMentions).toHaveBeenCalledTimes(1);
            expect(closeRightHandSide).not.toHaveBeenCalled();
        });
    });
});
