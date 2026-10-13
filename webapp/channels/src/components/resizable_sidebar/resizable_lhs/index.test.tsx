// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react';
import React from 'react';

import {renderWithContext} from 'tests/react_testing_utils';

import ResizableLhs from './index';

describe('components/resizable_sidebar/resizable_lhs', () => {
    // okrbest: 채널 사이드바 접힘(peek) 기능이 컨테이너의 mouseenter/mouseleave에
    // 의존한다 — 핸들러가 DOM까지 전달되지 않으면 peek이 영구히 남는다.
    it('should forward mouse enter/leave handlers to the container', () => {
        const onMouseEnter = jest.fn();
        const onMouseLeave = jest.fn();

        renderWithContext(
            <ResizableLhs
                id='SidebarContainer'
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div/>
            </ResizableLhs>,
        );

        const container = document.getElementById('SidebarContainer')!;

        fireEvent.mouseEnter(container);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);

        fireEvent.mouseLeave(container);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });
});
