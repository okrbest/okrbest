// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// spec 014 US1 계약 테스트 — slate 프리셋, 명도 3단, 활성 반전, 기본 테마 폴백.
// 판정 기준: specs/014-slack-design-benchmark/data-model.md §1, spec.md SC-002·003·008.

import type {GlobalState} from '@mattermost/types/store';

import {Preferences} from 'mattermost-redux/constants';
import {getTheme} from 'mattermost-redux/selectors/entities/preferences';
import {getPreferenceKey} from 'mattermost-redux/utils/preference_utils';
import {contrastRatio, relativeLuminance} from 'mattermost-redux/utils/wcag_contrast';

function makeState(myPreferences: Record<string, unknown> = {}): GlobalState {
    return {
        entities: {
            general: {
                config: {},
            },
            teams: {
                currentTeamId: '1234',
            },
            preferences: {
                myPreferences,
            },
        },
    } as unknown as GlobalState;
}

describe('slate theme (spec 014 US1)', () => {
    const slate = Preferences.THEMES.slate;

    it('exists with the Slack-measured surface values', () => {
        expect(slate).toBeDefined();
        expect(slate.type).toBe('Slate');
        expect(slate.sidebarBg).toBe('#fdfdfd');
        expect(slate.sidebarHeaderBg).toBe('#eaeaea');
        expect(slate.sidebarTeamBarBg).toBe('#eaeaea');
        expect(slate.centerChannelBg).toBe('#ffffff');
    });

    it('layers the chrome by luminance: team bar < sidebar < center (SC-003)', () => {
        expect(relativeLuminance(slate.sidebarTeamBarBg)).toBeLessThan(relativeLuminance(slate.sidebarBg));
        expect(relativeLuminance(slate.sidebarBg)).toBeLessThan(relativeLuminance(slate.centerChannelBg));
    });

    it('keeps sidebar text contrast at 8.8 or higher (SC-002)', () => {
        expect(contrastRatio(slate.sidebarText, slate.sidebarBg)).toBeGreaterThanOrEqual(8.8);
    });

    it('keeps the active inversion pair at 7.0 or higher (SC-002)', () => {
        // 활성 항목: 배경 = sidebarTextActiveBorder, 글자 = sidebarTextActiveColor (R3)
        expect(contrastRatio(slate.sidebarTextActiveBorder, slate.sidebarTextActiveColor)).toBeGreaterThanOrEqual(7.0);
    });

    it('makes the active item the highest-contrast sidebar entry (SC-002)', () => {
        const activePair = contrastRatio(slate.sidebarTextActiveBorder, slate.sidebarTextActiveColor);
        const defaultPair = contrastRatio(slate.sidebarText, slate.sidebarBg);
        expect(activePair).toBeGreaterThan(defaultPair);
    });

    it('is the default theme when the user saved nothing (FR-002)', () => {
        expect(getTheme(makeState())).toEqual(slate);
    });

    it('does not override a saved preset (SC-008)', () => {
        const state = makeState({
            [getPreferenceKey(Preferences.CATEGORY_THEME, '')]: {
                category: Preferences.CATEGORY_THEME,
                name: '',
                value: JSON.stringify(Preferences.THEMES.sapphire),
            },
        });

        expect(getTheme(state).sidebarBg).toBe('#1543a3');
    });
});
