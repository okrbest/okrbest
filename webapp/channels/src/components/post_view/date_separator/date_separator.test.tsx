// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import DateSeparator from './date_separator';

describe('components/post_view/DateSeparator', () => {
    const initialState = {
        entities: {
            general: {
                config: {},
            },
            preferences: {
                myPreferences: {},
            },
        },
    } as any;
    test('should render Timestamp inside of a BasicSeparator and pass date/value to it', () => {
        const value = new Date('Fri Jan 12 2018 20:15:13 GMT+1200 (+12)');
        renderWithContext(
            <DateSeparator
                date={value}
            />, initialState,
        );

        expect(screen.getByTestId('basicSeparator')).toBeInTheDocument();

        // Slack 날짜 구분 벤치마크(019 measurements 16절): 요일을 병기한다
        expect(screen.getByText('Friday, January 12, 2018')).toBeInTheDocument();
    });

    test('should include the weekday and omit the year for dates in the current year', () => {
        // 당해 연도 날짜 — 연도 없이 "요일, 월 일"
        const now = new Date();
        const value = new Date(now.getFullYear(), 2, 5); // 3월 5일 (오늘·어제 레인지 회피를 위해 과거 고정 월 사용)
        const expected = new Intl.DateTimeFormat('en', {weekday: 'long', month: 'long', day: 'numeric'}).format(value);

        renderWithContext(<DateSeparator date={value}/>, initialState);

        expect(screen.getByText(expected)).toBeInTheDocument();
    });
});
