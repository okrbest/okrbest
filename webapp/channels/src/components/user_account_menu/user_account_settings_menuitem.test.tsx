// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import * as reactRedux from 'react-redux';

import {openModal} from 'actions/views/modals';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {ModalIdentifiers, WindowSizes} from 'utils/constants';

import UserAccountSettingsMenuItem from './user_account_settings_menuitem';

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux') as typeof import('react-redux'),
    useDispatch: jest.fn(),
}));

jest.mock('actions/views/modals', () => ({
    openModal: jest.fn(),
}));

describe('UserAccountSettingsMenuItem', () => {
    const dispatchMock = jest.fn();

    beforeEach(() => {
        (reactRedux.useDispatch as jest.Mock).mockReturnValue(dispatchMock);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('설정 항목을 누르면 설정 모달(제품 설정 탭)을 연다', async () => {
        // 데스크톱 경로는 메뉴 닫힘 후 onClick을 실행하므로(menu_item.tsx handleClick)
        // 기존 테스트 관례대로 모바일 뷰 상태로 즉시 실행 경로를 탄다
        const initialState = {
            views: {
                browser: {
                    windowSize: WindowSizes.MOBILE_VIEW,
                },
            },
        };
        renderWithContext(<UserAccountSettingsMenuItem/>, initialState);

        await userEvent.click(screen.getByRole('menuitem'));

        expect(openModal).toHaveBeenCalledWith(expect.objectContaining({
            modalId: ModalIdentifiers.USER_SETTINGS,
            dialogProps: expect.objectContaining({
                isContentProductSettings: true,
            }),
        }));
        expect(dispatchMock).toHaveBeenCalled();
    });
});
