// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getPreferenceKey} from 'mattermost-redux/utils/preference_utils';

import {LandingProducts, Preferences, suitePluginIds} from 'utils/constants';

import type {GlobalState} from 'types/store';
import type {ProductComponent} from 'types/store/plugins';

// 랜딩 값 → 등록된 product를 찾는 pluginId 매핑
const landingProductPluginIds: Record<string, string> = {
    [LandingProducts.BOARDS]: suitePluginIds.focalboard,
    [LandingProducts.PLAYBOOKS]: suitePluginIds.playbooks,
};

// 로그인 초기화 경로에서는 스토어 슬라이스가 아직 없을 수 있어 전부 방어적으로 읽는다.
function getLandingPreferenceValue(state: GlobalState, name: string): string {
    const key = getPreferenceKey(Preferences.CATEGORY_LANDING_PRODUCT, name);
    return state.entities?.preferences?.myPreferences?.[key]?.value ?? '';
}

function getStoredLandingCandidates(state: GlobalState, teamId: string): string[] {
    return [
        getLandingPreferenceValue(state, teamId),
        getLandingPreferenceValue(state, ''),
        state.entities?.teams?.teams?.[teamId]?.landing_product ?? '',
    ];
}

function findRegisteredProduct(state: GlobalState, landingValue: string): ProductComponent | null {
    const pluginId = landingProductPluginIds[landingValue];
    if (!pluginId) {
        return null;
    }
    const products: ProductComponent[] = state.plugins?.components?.Product ?? [];
    return products.find((product) => product.pluginId === pluginId) ?? null;
}

// 저장값 중에 제품(보드·플레이북)을 가리키는 후보가 있는가.
// 참이면 판정 전에 product 등록 완료를 기다릴 가치가 있다 (등록 여부는 보지 않는다).
export function hasProductLandingCandidate(state: GlobalState, teamId: string): boolean {
    return getStoredLandingCandidates(state, teamId).
        some((candidate) => candidate in landingProductPluginIds);
}

// 로그인 랜딩 첫 화면 판정. 우선순위는 팀별 개인 설정 > 공통 개인 설정 > 팀 기본값 > 채널.
// 제품 값은 해당 product가 등록되어 있을 때만 확정하고, 아니면 다음 후보로 내려간다.
// 저장값(preference·Team.landing_product)은 여기서 절대 바꾸지 않는다.
export function resolveLandingProduct(state: GlobalState, teamId: string): string {
    const candidates = getStoredLandingCandidates(state, teamId);

    for (const candidate of candidates) {
        if (candidate === LandingProducts.CHANNELS) {
            return LandingProducts.CHANNELS;
        }
        if (candidate in landingProductPluginIds && findRegisteredProduct(state, candidate)) {
            return candidate;
        }
    }

    return LandingProducts.CHANNELS;
}

// 판정된 제품의 이동 URL. 미등록이면 null.
export function getLandingProductURL(state: GlobalState, landingValue: string): string | null {
    const product = findRegisteredProduct(state, landingValue);
    if (!product) {
        return null;
    }
    return product.switcherLinkURL || product.baseURL;
}
