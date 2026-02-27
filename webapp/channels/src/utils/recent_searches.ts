// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getLocalStorageItem, setLocalStorageItem} from './local_storage';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 3;
const EXPIRY_DAYS = 30; // 30일 동안 유지

export interface RecentSearch {
    term: string;
    searchType: string;
    timestamp: number;
}

/**
 * @description 최근 검색어 목록을 가져옵니다
 */
export function getRecentSearches(): RecentSearch[] {
    const searches = getLocalStorageItem<RecentSearch[]>(RECENT_SEARCHES_KEY);
    return searches || [];
}

/**
 * @description 새로운 검색어를 추가합니다
 */
export function addRecentSearch(term: string, searchType: string): void {
    if (!term.trim()) {
        return;
    }

    const searches = getRecentSearches();
    const timestamp = Date.now();

    // 동일한 검색어가 있으면 제거 (중복 방지)
    const filteredSearches = searches.filter(
        (search) => search.term.toLowerCase() !== term.toLowerCase() || search.searchType !== searchType,
    );

    // 새 검색어를 맨 앞에 추가
    const updatedSearches = [
        {term, searchType, timestamp},
        ...filteredSearches,
    ].slice(0, MAX_RECENT_SEARCHES);

    // 30일 만료 시간으로 저장
    setLocalStorageItem(RECENT_SEARCHES_KEY, updatedSearches, EXPIRY_DAYS * 24 * 60);
}

/**
 * @description 특정 검색어를 삭제합니다
 */
export function removeRecentSearch(term: string, searchType: string): void {
    const searches = getRecentSearches();
    const updatedSearches = searches.filter(
        (search) => search.term !== term || search.searchType !== searchType,
    );

    if (updatedSearches.length > 0) {
        setLocalStorageItem(RECENT_SEARCHES_KEY, updatedSearches, EXPIRY_DAYS * 24 * 60);
    } else {
        // 모든 검색어가 삭제되면 스토리지에서 제거
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
}

/**
 * @description 모든 최근 검색어를 삭제합니다
 */
export function clearRecentSearches(): void {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
}
