// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react';
import React from 'react';

import {renderWithContext, userEvent} from 'tests/react_testing_utils';
import {LandingProducts} from 'utils/constants';

import TeamLandingSection from './team_landing_section';

describe('components/TeamSettings/TeamLandingSection', () => {
    const baseProps = {
        landingProduct: '',
        handleLandingProductChanges: jest.fn(),
    };

    // 보드 플러그인만 활성화된 상태
    const boardsOnlyState = {
        plugins: {
            plugins: {focalboard: {id: 'focalboard', version: '1.0.0'}},
            components: {Product: []},
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('활성화된 제품만 선택지로 노출한다', () => {
        renderWithContext(<TeamLandingSection {...baseProps}/>, boardsOnlyState as any);

        expect(screen.getByRole('radio', {name: 'Channels'})).toBeInTheDocument();
        expect(screen.getByRole('radio', {name: 'Boards'})).toBeInTheDocument();
        expect(screen.queryByRole('radio', {name: 'Playbooks'})).not.toBeInTheDocument();
    });

    test('라디오를 바꾸면 변경 핸들러에 선택값을 넘긴다', async () => {
        renderWithContext(<TeamLandingSection {...baseProps}/>, boardsOnlyState as any);

        await userEvent.click(screen.getByRole('radio', {name: 'Boards'}));
        expect(baseProps.handleLandingProductChanges).toHaveBeenCalledWith(LandingProducts.BOARDS);
    });
});
