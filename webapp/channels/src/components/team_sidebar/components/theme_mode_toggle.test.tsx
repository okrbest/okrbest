// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {savePreferences, saveTheme} from 'mattermost-redux/actions/preferences';

import ThemeModeToggle from 'components/team_sidebar/components/theme_mode_toggle';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';

jest.mock('mattermost-redux/actions/preferences', () => ({
    savePreferences: jest.fn(() => ({type: 'MOCK_SAVE_PREFERENCES'})),
    saveTheme: jest.fn(() => ({type: 'MOCK_SAVE_THEME'})),
}));

describe('components/team_sidebar/ThemeModeToggle', () => {
    const initialState = {
        entities: {
            users: {
                currentUserId: 'user1',
                profiles: {user1: {id: 'user1', roles: 'system_user'}},
            },
            general: {config: {}, license: {}},
            preferences: {myPreferences: {}},
            teams: {currentTeamId: 'team1'},
        },
    };

    const setMatchMedia = (dark: boolean) => {
        const listeners: Array<(e: {matches: boolean}) => void> = [];
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: query.includes('dark') ? dark : !dark,
            media: query,
            addEventListener: (_: string, cb: (e: {matches: boolean}) => void) => listeners.push(cb),
            removeEventListener: jest.fn(),
        }));
        return listeners;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        setMatchMedia(false);
    });

    test('버튼 클릭은 라이트·다크·시스템 세 모드를 보여준다', async () => {
        renderWithContext(<ThemeModeToggle/>, initialState);

        await userEvent.click(screen.getByTestId('themeModeButton'));

        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Light mode/})).toBeInTheDocument();
        });
        expect(screen.getByRole('menuitemradio', {name: /Dark mode/})).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', {name: /Follow system/})).toBeInTheDocument();
    });

    test('다크 모드를 고르면 Onyx 테마와 모드 preference를 저장한다', async () => {
        renderWithContext(<ThemeModeToggle/>, initialState);

        await userEvent.click(screen.getByTestId('themeModeButton'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Dark mode/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Dark mode/}));

        await waitFor(() => {
            expect(saveTheme).toHaveBeenCalledWith('', expect.objectContaining({type: 'Onyx'}));
        });
        expect(savePreferences).toHaveBeenCalledWith('user1', [
            expect.objectContaining({category: 'display_settings', name: 'okr_theme_mode', value: 'dark'}),
        ]);
    });

    test('라이트 모드를 고르면 Slate 테마를 저장한다', async () => {
        renderWithContext(<ThemeModeToggle/>, initialState);

        await userEvent.click(screen.getByTestId('themeModeButton'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Light mode/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Light mode/}));

        await waitFor(() => {
            expect(saveTheme).toHaveBeenCalledWith('', expect.objectContaining({type: 'Slate'}));
        });
    });

    test('시스템 모드는 OS가 다크면 Onyx를 저장한다', async () => {
        setMatchMedia(true);
        renderWithContext(<ThemeModeToggle/>, initialState);

        await userEvent.click(screen.getByTestId('themeModeButton'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Follow system/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Follow system/}));

        await waitFor(() => {
            expect(saveTheme).toHaveBeenCalledWith('', expect.objectContaining({type: 'Onyx'}));
        });
        expect(savePreferences).toHaveBeenCalledWith('user1', [
            expect.objectContaining({value: 'system'}),
        ]);
    });

    test('모드를 고르면 메뉴가 즉시 닫힌다', async () => {
        renderWithContext(<ThemeModeToggle/>, initialState);

        await userEvent.click(screen.getByTestId('themeModeButton'));
        await waitFor(() => {
            expect(screen.getByRole('menuitemradio', {name: /Dark mode/})).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('menuitemradio', {name: /Dark mode/}));

        await waitFor(() => {
            expect(screen.queryByRole('menuitemradio', {name: /Dark mode/})).not.toBeInTheDocument();
        });
    });

    test('저장된 모드에 체크가 표시된다', async () => {
        const state = JSON.parse(JSON.stringify(initialState));
        state.entities.preferences.myPreferences = {
            'display_settings--okr_theme_mode': {category: 'display_settings', name: 'okr_theme_mode', value: 'dark'},
        };
        renderWithContext(<ThemeModeToggle/>, state);

        await userEvent.click(screen.getByTestId('themeModeButton'));

        await waitFor(() => {
            expect(screen.getByTestId('themeMode-check-dark')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('themeMode-check-light')).not.toBeInTheDocument();
    });
});
