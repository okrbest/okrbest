// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {addMinutes, formatISO, isBefore} from 'date-fns';

interface StorageData<T> {
    data: T;
    expiry: string;
}

/**
 * @description 만료 시간 계산
 */
function getExpiry(expiryMinutes?: number): string {
    const now = new Date();
    if (expiryMinutes != null) {
        return formatISO(addMinutes(now, expiryMinutes));
    }
    return '';
}

/**
 * @description StorageData 타입 가드
 */
function isStorageData<T>(item: StorageData<T> | T): item is StorageData<T> {
    const castItem = item as StorageData<T>;
    return castItem !== null && typeof castItem === 'object' && 'data' in castItem && 'expiry' in castItem;
}

/**
 * @description 로컬스토리지에 데이터를 저장합니다. expiryMinutes로 데이터의 만료 시간(분)을 지정할 수 있습니다.
 * @example
 * ```ts
 * setLocalStorageItem('user_preference', { theme: 'dark' }, 60) // 60분 후에 만료
 * setLocalStorageItem('session_token', 'abc123') // 만료 시간 없이 저장
 * ```
 */
export function setLocalStorageItem<T>(key: string, data: T, expiryMinutes?: number): void {
    try {
        const payload: StorageData<T> = {
            data,
            expiry: getExpiry(expiryMinutes),
        };

        localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
        console.error('LocalStorage Set Item Error:', error);
    }
}

/**
 * @description 로컬스토리지에서 데이터를 가져옵니다. 만료 시간이 지난 경우 null을 반환하고 해당 데이터를 삭제합니다.
 * @example
 * ```ts
 * const preference = getLocalStorageItem<UserPreference>('user_preference')
 * if (preference) {
 *   console.log(preference.theme)
 * }
 * ```
 */
export function getLocalStorageItem<T>(key: string): T | null {
    try {
        const payload = localStorage.getItem(key);
        if (payload == null) {
            return null;
        }

        const parsedPayload: StorageData<T> | T = JSON.parse(payload);

        // 단순 데이터인 경우 (만료 시간 없음)
        if (!isStorageData(parsedPayload)) {
            return parsedPayload;
        }

        // 만료 시간이 설정되지 않은 경우
        if (!parsedPayload.expiry) {
            return parsedPayload.data;
        }

        // 만료 시간 검증
        const now = new Date();
        const expiry = new Date(parsedPayload.expiry);

        if (isNaN(expiry.getTime()) || isBefore(now, expiry)) {
            return parsedPayload.data;
        }

        // 만료된 데이터 삭제
        localStorage.removeItem(key);
        return null;
    } catch (error) {
        console.error('LocalStorage Get Item Error:', error);
        localStorage.removeItem(key);
        return null;
    }
}

/**
 * @description 로컬스토리지에서 데이터를 제거합니다.
 * @example
 * ```ts
 * removeLocalStorageItem('user_preference')
 * ```
 */
export function removeLocalStorageItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('LocalStorage Remove Item Error:', error);
    }
}

/**
 * @description 로컬스토리지에서 데이터를 가져온 후 해당 데이터를 제거합니다. (pop 연산)
 * @example
 * ```ts
 * const token = popLocalStorageItem<string>('temp_token')
 * // token을 사용 후 자동으로 삭제됨
 * ```
 */
export function popLocalStorageItem<T>(key: string): T | null {
    const data = getLocalStorageItem<T>(key);
    removeLocalStorageItem(key);
    return data;
}

/**
 * @description 로컬스토리지의 모든 데이터를 제거합니다.
 * @example
 * ```ts
 * clearLocalStorage()
 * ```
 */
export function clearLocalStorage(): void {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('LocalStorage Clear Error:', error);
    }
}

/**
 * @description 특정 prefix로 시작하는 모든 키를 찾아서 제거합니다.
 * @example
 * ```ts
 * removeLocalStorageItemsByPrefix('draft_') // draft_로 시작하는 모든 항목 제거
 * ```
 */
export function removeLocalStorageItemsByPrefix(prefix: string): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
        console.error('LocalStorage Remove Items By Prefix Error:', error);
    }
}

/**
 * @description 만료된 모든 항목을 삭제합니다.
 * @example
 * ```ts
 * cleanupExpiredItems() // 만료된 모든 항목 자동 정리
 * ```
 */
export function cleanupExpiredItems(): void {
    try {
        const keysToRemove: string[] = [];
        const now = new Date();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) {
                continue;
            }

            try {
                const payload = localStorage.getItem(key);
                if (!payload) {
                    continue;
                }

                const parsedPayload = JSON.parse(payload);
                if (!isStorageData(parsedPayload) || !parsedPayload.expiry) {
                    continue;
                }

                const expiry = new Date(parsedPayload.expiry);
                if (!isNaN(expiry.getTime()) && !isBefore(now, expiry)) {
                    keysToRemove.push(key);
                }
            } catch {
                // JSON 파싱 실패한 항목은 건너뛰기
                continue;
            }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
        console.error('LocalStorage Cleanup Expired Items Error:', error);
    }
}
