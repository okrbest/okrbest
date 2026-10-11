// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import RightControls from './right_controls';

import CenterControls from '../center_controls/center_controls';

jest.mock('./notification_history_button/notification_history_button', () => () => <div data-testid='notificationHistoryButton'/>);
jest.mock('./plan_upgrade_button', () => () => null);
jest.mock('../center_controls/user_guide_dropdown', () => () => <div data-testid='userGuideDropdown'/>);
jest.mock('../center_controls/global_search_nav/global_search_nav', () => () => <div data-testid='globalSearchNav'/>);

describe('components/global_header/right_controls', () => {
    // Slack 벤치마크(019 measurements 9절): 도움말 버튼은 검색바 옆이 아니라
    // 화면 우측 끝 그룹(알림 히스토리 옆)에 선다
    it('도움말 버튼은 우측 끝 그룹에 있다', () => {
        renderWithContext(<RightControls productId={null}/>);

        expect(screen.getByTestId('userGuideDropdown')).toBeInTheDocument();
        expect(screen.getByTestId('notificationHistoryButton')).toBeInTheDocument();
    });

    it('중앙 그룹(검색바 영역)에는 도움말 버튼이 없다', () => {
        renderWithContext(<CenterControls productId={null}/>);

        expect(screen.getByTestId('globalSearchNav')).toBeInTheDocument();
        expect(screen.queryByTestId('userGuideDropdown')).not.toBeInTheDocument();
    });
});
