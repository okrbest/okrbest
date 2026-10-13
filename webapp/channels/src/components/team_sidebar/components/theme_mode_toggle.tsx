// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, type JSX} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {CheckIcon} from '@mattermost/compass-icons/components';

import {savePreferences, saveTheme} from 'mattermost-redux/actions/preferences';
import {Preferences} from 'mattermost-redux/constants';
import {getTheme, get as getPreference} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import * as Menu from 'components/menu';

import type {GlobalState} from 'types/store';

import './theme_mode_toggle.scss';

// OKR.BEST (024): 레일 하단 프로필 위 테마 전환 토글.
// 라이트=Slate(014 기본), 다크=Onyx 고정 매핑, 시스템 모드는
// prefers-color-scheme을 따라 둘 중 하나를 자동 적용한다.
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_MODE_PREFERENCE = 'okr_theme_mode';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

// compass-icons에 sun/moon 글리프가 없어 24×24 패스를 인라인으로 쓴다.
// 다크·시스템은 MDI fill 패스, 라이트는 중앙 원 + 8개 라운드 광선의
// stroke 기반 해(Lucide sun 문법 — 사용자 지정 디자인).
const MODE_GLYPHS: Record<Exclude<ThemeMode, 'light'>, string> = {
    dark: 'M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z',
    system: 'M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z',
};

function osPrefersDark(): boolean {
    return Boolean(window.matchMedia?.(DARK_MEDIA_QUERY).matches);
}

function themeForMode(mode: ThemeMode) {
    if (mode === 'dark') {
        return Preferences.THEMES.onyx;
    }
    if (mode === 'light') {
        return Preferences.THEMES.slate;
    }
    return osPrefersDark() ? Preferences.THEMES.onyx : Preferences.THEMES.slate;
}

function ModeGlyph({mode}: {mode: ThemeMode}) {
    if (mode === 'light') {
        return (
            <svg
                className='ThemeModeToggle_glyph ThemeModeToggle_glyph--stroke'
                width={20}
                height={20}
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden={true}
            >
                <circle
                    cx='12'
                    cy='12'
                    r='4'
                />
                <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41'/>
            </svg>
        );
    }
    return (
        <svg
            className='ThemeModeToggle_glyph'
            width={20}
            height={20}
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden={true}
        >
            <path d={MODE_GLYPHS[mode]}/>
        </svg>
    );
}

export default function ThemeModeToggle(): JSX.Element {
    const intl = useIntl();
    const dispatch = useDispatch();
    const currentUserId = useSelector(getCurrentUserId);
    const themeType = useSelector((state: GlobalState) => getTheme(state).type);
    const savedMode = useSelector((state: GlobalState) => getPreference(state, Preferences.CATEGORY_DISPLAY_SETTINGS, THEME_MODE_PREFERENCE, ''));

    // 저장된 모드가 없으면 현재 테마로 표시만 추론한다 (저장하지 않는다).
    const mode: ThemeMode = (savedMode as ThemeMode) || (themeType === 'Onyx' ? 'dark' : 'light');

    const applyMode = useCallback((nextMode: ThemeMode) => {
        dispatch(savePreferences(currentUserId, [{
            user_id: currentUserId,
            category: Preferences.CATEGORY_DISPLAY_SETTINGS,
            name: THEME_MODE_PREFERENCE,
            value: nextMode,
        }]));
        dispatch(saveTheme('', themeForMode(nextMode)));
    }, [dispatch, currentUserId]);

    // 시스템 모드일 때만 OS 전환을 따라간다. 불일치 상태(다른 기기에서
    // 바꾼 테마 등)도 마운트 시 한 번 바로잡는다.
    useEffect(() => {
        if (savedMode !== 'system') {
            return undefined;
        }
        const sync = () => {
            const target = themeForMode('system');
            if (target.type !== themeType) {
                dispatch(saveTheme('', target));
            }
        };
        sync();
        const mq = window.matchMedia?.(DARK_MEDIA_QUERY);
        mq?.addEventListener?.('change', sync);
        return () => mq?.removeEventListener?.('change', sync);
    }, [savedMode, themeType, dispatch]);

    const labels = useMemo(() => ({
        light: intl.formatMessage({id: 'okrbest.theme_mode.light', defaultMessage: 'Light mode'}),
        dark: intl.formatMessage({id: 'okrbest.theme_mode.dark', defaultMessage: 'Dark mode'}),
        system: intl.formatMessage({id: 'okrbest.theme_mode.system', defaultMessage: 'Follow system'}),
    }), [intl]);

    return (
        <div className='ThemeModeToggle'>
            <Menu.Container
                menuButton={{
                    id: 'themeModeButton',
                    dataTestId: 'themeModeButton',
                    class: 'ThemeModeToggle_button',
                    'aria-label': intl.formatMessage({id: 'okrbest.theme_mode.title', defaultMessage: 'Theme'}),
                    children: <ModeGlyph mode={mode}/>,
                }}
                menuButtonTooltip={{
                    text: intl.formatMessage({id: 'okrbest.theme_mode.title', defaultMessage: 'Theme'}),
                }}
                menu={{
                    id: 'themeModeMenu',
                    'aria-label': intl.formatMessage({id: 'okrbest.theme_mode.title', defaultMessage: 'Theme'}),
                }}
            >
                {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                    <Menu.Item
                        key={m}
                        id={`themeMode-${m}`}
                        role='menuitemradio'
                        aria-checked={mode === m}
                        forceCloseOnSelect={true}
                        onClick={() => applyMode(m)}
                        leadingElement={<ModeGlyph mode={m}/>}
                        labels={<span>{labels[m]}</span>}
                        trailingElements={mode === m && (
                            <span data-testid={`themeMode-check-${m}`}>
                                <CheckIcon
                                    size={18}
                                    aria-hidden={true}
                                />
                            </span>
                        )}
                    />
                ))}
            </Menu.Container>
        </div>
    );
}
