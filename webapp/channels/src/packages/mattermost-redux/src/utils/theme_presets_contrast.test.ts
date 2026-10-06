// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// spec 014 US3 계약 테스트 — 프리셋 5종 전부에서 의미색이 WCAG 기준을 넘는다.
// 글자 4.5:1 (WCAG 1.4.3), 비텍스트 UI 3:1 (1.4.11), 활성 반전 짝 7:1 (SC-002·005).
// 판정 기준: specs/014-slack-design-benchmark/contracts/measurement-contract.md.

import {Preferences} from 'mattermost-redux/constants';
import type {Theme} from 'mattermost-redux/selectors/entities/preferences';
import {setThemeDefaults} from 'mattermost-redux/utils/theme_utils';
import {contrastRatio} from 'mattermost-redux/utils/wcag_contrast';

const TEXT_MINIMUM = 4.5;
const NON_TEXT_MINIMUM = 3.0;
const INVERSION_MINIMUM = 7.0;

const PRESET_KEYS = ['denim', 'sapphire', 'quartz', 'indigo', 'onyx'] as const;

describe.each(PRESET_KEYS)('%s preset contrast (spec 014 US3)', (key) => {
    const theme: Theme = Preferences.THEMES[key];

    it('keeps text colors at 4.5:1 or higher', () => {
        expect(contrastRatio(theme.centerChannelColor, theme.centerChannelBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
        expect(contrastRatio(theme.errorTextColor, theme.centerChannelBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
        expect(contrastRatio(theme.linkColor, theme.centerChannelBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
        expect(contrastRatio(theme.buttonColor, theme.buttonBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
        expect(contrastRatio(theme.mentionColor, theme.mentionBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
        expect(contrastRatio(theme.sidebarText, theme.sidebarBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
    });

    it('keeps non-text indicators at 3:1 or higher against the center channel', () => {
        expect(contrastRatio(theme.newMessageSeparator, theme.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
        expect(contrastRatio(theme.onlineIndicator, theme.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
        expect(contrastRatio(theme.awayIndicator, theme.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
        expect(contrastRatio(theme.dndIndicator, theme.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
    });

    it('keeps the active inversion pair at 7:1 or higher', () => {
        // 활성 항목: 배경 = sidebarTextActiveBorder, 글자 = sidebarTextActiveColor (R3)
        expect(contrastRatio(theme.sidebarTextActiveBorder, theme.sidebarTextActiveColor)).toBeGreaterThanOrEqual(INVERSION_MINIMUM);
    });
});

describe('setThemeDefaults semantic fallbacks (FR-004)', () => {
    // 테마에 값이 없으면 denim에서 채워진다 — 그 폴백 자체가 기준을 넘어야
    // 이후 프리셋을 추가할 때 재조율이 필요 없다.
    const defaults = setThemeDefaults({});

    it('fall back to values that already pass against their own background', () => {
        expect(contrastRatio(defaults.errorTextColor, defaults.centerChannelBg)).toBeGreaterThanOrEqual(TEXT_MINIMUM);
        expect(contrastRatio(defaults.newMessageSeparator, defaults.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
        expect(contrastRatio(defaults.onlineIndicator, defaults.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
        expect(contrastRatio(defaults.awayIndicator, defaults.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
        expect(contrastRatio(defaults.dndIndicator, defaults.centerChannelBg)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
    });
});
