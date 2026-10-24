// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getPreferenceKey} from 'mattermost-redux/utils/preference_utils';

import {getLandingProductURL, resolveLandingProduct} from 'selectors/landing';

import {LandingProducts, Preferences, suitePluginIds} from 'utils/constants';

import type {GlobalState} from 'types/store';
import type {ProductComponent} from 'types/store/plugins';

const TEAM_ID = 'teamid000000000000000000001';

const boardsProduct = {
    id: 'product-boards',
    pluginId: suitePluginIds.focalboard,
    baseURL: '/boards',
    switcherLinkURL: '/boards',
} as unknown as ProductComponent;

const playbooksProduct = {
    id: 'playbooks',
    pluginId: suitePluginIds.playbooks,
    baseURL: '/playbooks',
    switcherLinkURL: '/playbooks',
} as unknown as ProductComponent;

function makeState({
    teamPreference,
    globalPreference,
    teamLanding = '',
    products = [],
}: {
    teamPreference?: string;
    globalPreference?: string;
    teamLanding?: string;
    products?: ProductComponent[];
}): GlobalState {
    const myPreferences: Record<string, {category: string; name: string; value: string}> = {};
    if (teamPreference !== undefined) {
        myPreferences[getPreferenceKey(Preferences.CATEGORY_LANDING_PRODUCT, TEAM_ID)] = {
            category: Preferences.CATEGORY_LANDING_PRODUCT,
            name: TEAM_ID,
            value: teamPreference,
        };
    }
    if (globalPreference !== undefined) {
        myPreferences[getPreferenceKey(Preferences.CATEGORY_LANDING_PRODUCT, '')] = {
            category: Preferences.CATEGORY_LANDING_PRODUCT,
            name: '',
            value: globalPreference,
        };
    }

    return {
        entities: {
            preferences: {
                myPreferences,
            },
            teams: {
                currentTeamId: TEAM_ID,
                teams: {
                    [TEAM_ID]: {
                        id: TEAM_ID,
                        name: 'test-team',
                        landing_product: teamLanding,
                    },
                },
            },
        },
        plugins: {
            components: {
                Product: products,
            },
        },
    } as unknown as GlobalState;
}

describe('resolveLandingProduct', () => {
    test('아무 설정이 없으면 채널로 판정한다', () => {
        const state = makeState({products: [boardsProduct, playbooksProduct]});
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.CHANNELS);
    });

    test('팀별 개인 설정이 등록된 제품이면 그 제품으로 판정한다', () => {
        const state = makeState({
            teamPreference: LandingProducts.BOARDS,
            products: [boardsProduct, playbooksProduct],
        });
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.BOARDS);
    });

    test('팀별 개인 설정의 제품이 미등록이면 다음 후보(공통 개인 설정)로 내려간다', () => {
        const state = makeState({
            teamPreference: LandingProducts.BOARDS,
            globalPreference: LandingProducts.PLAYBOOKS,
            products: [playbooksProduct],
        });
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.PLAYBOOKS);
    });

    test('공통 개인 설정이 명시적 채널이면 팀 기본값보다 우선한다', () => {
        const state = makeState({
            globalPreference: LandingProducts.CHANNELS,
            teamLanding: LandingProducts.BOARDS,
            products: [boardsProduct],
        });
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.CHANNELS);
    });

    test('개인 설정이 없으면 팀 기본값으로 판정한다', () => {
        const state = makeState({
            teamLanding: LandingProducts.PLAYBOOKS,
            products: [playbooksProduct],
        });
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.PLAYBOOKS);
    });

    test('팀 기본값의 제품이 미등록이면 채널로 대체한다', () => {
        const state = makeState({
            teamLanding: LandingProducts.BOARDS,
            products: [],
        });
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.CHANNELS);
    });

    test('알 수 없는 값은 무시하고 다음 후보로 내려간다', () => {
        const state = makeState({
            teamPreference: 'calendar',
            teamLanding: LandingProducts.BOARDS,
            products: [boardsProduct],
        });
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.BOARDS);
    });

    test('Team에 landing_product 필드가 없는 구서버 응답도 채널로 판정한다', () => {
        const state = makeState({products: [boardsProduct]});
        delete (state.entities.teams.teams[TEAM_ID] as unknown as Record<string, unknown>).landing_product;
        expect(resolveLandingProduct(state, TEAM_ID)).toBe(LandingProducts.CHANNELS);
    });
});

describe('getLandingProductURL', () => {
    test('등록된 제품의 전환 URL을 돌려준다', () => {
        const state = makeState({products: [boardsProduct, playbooksProduct]});
        expect(getLandingProductURL(state, LandingProducts.BOARDS)).toBe('/boards');
        expect(getLandingProductURL(state, LandingProducts.PLAYBOOKS)).toBe('/playbooks');
    });

    test('미등록 제품이면 null을 돌려준다', () => {
        const state = makeState({products: []});
        expect(getLandingProductURL(state, LandingProducts.BOARDS)).toBeNull();
    });
});
