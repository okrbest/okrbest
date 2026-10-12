// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {SidebarCategoryHeader, SidebarCategoryHeaderStatic} from 'components/sidebar/sidebar_category_header';

import {renderWithContext, screen} from 'tests/react_testing_utils';

describe('components/sidebar/SidebarCategoryHeader', () => {
    // 022: 카테고리 명칭 앞에 특성 아이콘 — 채널명 행의 타입 아이콘과 같은 문법
    test.each([
        ['favorites', 'categoryIcon-favorites'],
        ['channels', 'categoryIcon-channels'],
        ['direct_messages', 'categoryIcon-direct_messages'],
        ['custom', 'categoryIcon-custom'],
    ])('카테고리 타입 %s 는 대응 아이콘을 렌더한다', (type, testId) => {
        renderWithContext(
            <SidebarCategoryHeader
                displayName='테스트'
                categoryType={type}
                isCollapsed={false}
                isCollapsible={true}
                muted={false}
                onClick={jest.fn()}
            />,
        );

        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    test('타입이 없으면 아이콘 없이 렌더한다', () => {
        renderWithContext(
            <SidebarCategoryHeader
                displayName='테스트'
                isCollapsed={false}
                isCollapsible={true}
                muted={false}
                onClick={jest.fn()}
            />,
        );

        expect(screen.queryByTestId(/categoryIcon-/)).not.toBeInTheDocument();
    });

    test('정적 헤더(읽지 않은 항목)도 타입 아이콘을 렌더한다', () => {
        renderWithContext(
            <SidebarCategoryHeaderStatic
                displayName='읽지 않은 항목'
                categoryType='unreads'
            />,
        );

        expect(screen.getByTestId('categoryIcon-unreads')).toBeInTheDocument();
    });
});
