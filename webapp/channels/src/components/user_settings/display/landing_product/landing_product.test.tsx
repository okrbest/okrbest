// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import LandingProductSection from 'components/user_settings/display/landing_product/landing_product';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {LandingProducts, Preferences} from 'utils/constants';

describe('components/user_settings/display/landing_product', () => {
    const userId = 'current_user_id';

    const baseProps = {
        userId,
        active: true,
        areAllSectionsInactive: false,
        updateSection: jest.fn(),
        globalValue: '',
        actions: {
            savePreferences: jest.fn().mockResolvedValue({data: true}),
            deletePreferences: jest.fn().mockResolvedValue({data: true}),
        },
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
        renderWithContext(<LandingProductSection {...baseProps}/>, boardsOnlyState as any);

        expect(screen.getByRole('radio', {name: 'Team default'})).toBeInTheDocument();
        expect(screen.getByRole('radio', {name: 'Channels'})).toBeInTheDocument();
        expect(screen.getByRole('radio', {name: 'Boards'})).toBeInTheDocument();
        expect(screen.queryByRole('radio', {name: 'Playbooks'})).not.toBeInTheDocument();
    });

    test('보드를 선택해 저장하면 공통(name="") preference로 저장한다', async () => {
        renderWithContext(<LandingProductSection {...baseProps}/>, boardsOnlyState as any);

        userEvent.click(screen.getByRole('radio', {name: 'Boards'}));
        userEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(baseProps.actions.savePreferences).toHaveBeenCalledWith(userId, [{
                user_id: userId,
                category: Preferences.CATEGORY_LANDING_PRODUCT,
                name: '',
                value: LandingProducts.BOARDS,
            }]);
        });
    });

    test('팀 기본값 따르기를 선택해 저장하면 preference를 삭제한다', async () => {
        renderWithContext(
            <LandingProductSection
                {...baseProps}
                globalValue={LandingProducts.BOARDS}
            />,
            boardsOnlyState as any,
        );

        userEvent.click(screen.getByRole('radio', {name: 'Team default'}));
        userEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(baseProps.actions.deletePreferences).toHaveBeenCalledWith(userId, [{
                user_id: userId,
                category: Preferences.CATEGORY_LANDING_PRODUCT,
                name: '',
                value: LandingProducts.BOARDS,
            }]);
        });
        expect(baseProps.actions.savePreferences).not.toHaveBeenCalled();
    });

    test('저장값의 제품이 비활성이면 접힌 화면에 기본값(팀 기본값 따르기)을 표시하고 저장값은 건드리지 않는다', () => {
        renderWithContext(
            <LandingProductSection
                {...baseProps}
                active={false}
                globalValue={LandingProducts.BOARDS}
            />,
            {plugins: {plugins: {}, components: {Product: []}}} as any,
        );

        expect(screen.getByText('Team default')).toBeInTheDocument();
        expect(baseProps.actions.savePreferences).not.toHaveBeenCalled();
        expect(baseProps.actions.deletePreferences).not.toHaveBeenCalled();
    });
});
