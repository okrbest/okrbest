// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import FilesFilterMenu from 'components/search_results/files_filter_menu';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';

describe('components/search_results/FilesFilterMenu', () => {
    // Slack 필터 벤치마크(019 measurements 18절) — 라벨 알약 + 드롭다운 라디오
    test('필터 버튼은 라벨과 함께 렌더된다', () => {
        renderWithContext(
            <FilesFilterMenu
                selectedFilter='all'
                onFilter={jest.fn()}
            />,
        );

        expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    test('버튼 클릭은 파일 유형 라디오 메뉴를 연다', async () => {
        renderWithContext(
            <FilesFilterMenu
                selectedFilter='all'
                onFilter={jest.fn()}
            />,
        );

        await userEvent.click(screen.getByTestId('filesFilterButton'));

        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /All file types/})).toBeInTheDocument();
        });
        expect(screen.getByRole('menuitemradio', {name: /Documents/})).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', {name: /Videos/})).toBeInTheDocument();
    });

    test('유형을 고르면 onFilter가 호출된다', async () => {
        const onFilter = jest.fn();
        renderWithContext(
            <FilesFilterMenu
                selectedFilter='all'
                onFilter={onFilter}
            />,
        );

        await userEvent.click(screen.getByTestId('filesFilterButton'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Documents/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Documents/}));

        await waitFor(() => {
            expect(onFilter).toHaveBeenCalledWith('documents');
        });
    });

    test('현재 선택이 체크로 표시된다', async () => {
        renderWithContext(
            <FilesFilterMenu
                selectedFilter='images'
                onFilter={jest.fn()}
            />,
        );

        await userEvent.click(screen.getByTestId('filesFilterButton'));

        await waitFor(() => {
            expect(screen.getByTestId('filesFilter-check-images')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('filesFilter-check-all')).not.toBeInTheDocument();
    });

    test('필터가 걸려 있으면 버튼에 활성 점이 보인다', () => {
        renderWithContext(
            <FilesFilterMenu
                selectedFilter='documents'
                onFilter={jest.fn()}
            />,
        );

        expect(screen.getByTestId('filesFilter-activeDot')).toBeInTheDocument();
    });
});
