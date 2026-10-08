// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext} from 'tests/react_testing_utils';

import LeftControls from './left_controls';

jest.mock('@mattermost/shared/utils/user_agent', () => ({
    ...jest.requireActual('@mattermost/shared/utils/user_agent'),
    isDesktopApp: jest.fn(() => true),
}));

describe('components/global_header/left_controls', () => {
    it('product switcher는 제거되었고 history 버튼만 남는다', () => {
        const {container} = renderWithContext(<LeftControls/>);

        // 제품 전환은 좌측 레일이 담당한다 — 상단의 스위처 버튼은 없어야 한다
        expect(container.querySelector('#product_switch_menu')).not.toBeInTheDocument();

        // 데스크톱 앱이면 history 버튼은 그대로 남는다
        expect(container.querySelector('button')).toBeInTheDocument();
    });
});
