// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {addMinutes, formatISO, subMinutes} from 'date-fns';

import {
    cleanupExpiredItems,
    clearLocalStorage,
    getLocalStorageItem,
    popLocalStorageItem,
    removeLocalStorageItem,
    removeLocalStorageItemsByPrefix,
    setLocalStorageItem,
} from './local_storage';

describe('LocalStorage Utils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('setLocalStorageItem', () => {
        it('should store data without expiry', () => {
            setLocalStorageItem('test_key', 'test_value');
            const stored = localStorage.getItem('test_key');
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored!);
            expect(parsed.data).toBe('test_value');
            expect(parsed.expiry).toBe('');
        });

        it('should store data with expiry', () => {
            setLocalStorageItem('test_key', 'test_value', 10);
            const stored = localStorage.getItem('test_key');
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored!);
            expect(parsed.data).toBe('test_value');
            expect(parsed.expiry).toBeTruthy();
        });

        it('should store complex objects', () => {
            const complexData = {
                id: 1,
                name: 'Test User',
                settings: {theme: 'dark'},
            };
            setLocalStorageItem('user', complexData);
            const retrieved = getLocalStorageItem<typeof complexData>('user');
            expect(retrieved).toEqual(complexData);
        });
    });

    describe('getLocalStorageItem', () => {
        it('should return null for non-existent key', () => {
            const result = getLocalStorageItem('non_existent');
            expect(result).toBeNull();
        });

        it('should return data without expiry', () => {
            setLocalStorageItem('test_key', 'test_value');
            const result = getLocalStorageItem('test_key');
            expect(result).toBe('test_value');
        });

        it('should return data if not expired', () => {
            setLocalStorageItem('test_key', 'test_value', 10);
            const result = getLocalStorageItem('test_key');
            expect(result).toBe('test_value');
        });

        it('should return null and remove item if expired', () => {
            // 과거 시간으로 만료 설정
            const expiredData = {
                data: 'test_value',
                expiry: formatISO(subMinutes(new Date(), 10)),
            };
            localStorage.setItem('expired_key', JSON.stringify(expiredData));

            const result = getLocalStorageItem('expired_key');
            expect(result).toBeNull();
            expect(localStorage.getItem('expired_key')).toBeNull();
        });

        it('should handle invalid JSON gracefully', () => {
            localStorage.setItem('invalid_key', 'invalid json {');
            const result = getLocalStorageItem('invalid_key');
            expect(result).toBeNull();
            expect(localStorage.getItem('invalid_key')).toBeNull();
        });

        it('should handle data without StorageData wrapper', () => {
            // 직접 JSON 저장 (이전 버전 호환성)
            const directData = {theme: 'dark'};
            localStorage.setItem('legacy_key', JSON.stringify(directData));
            const result = getLocalStorageItem('legacy_key');
            expect(result).toEqual(directData);
        });
    });

    describe('removeLocalStorageItem', () => {
        it('should remove item from localStorage', () => {
            setLocalStorageItem('test_key', 'test_value');
            expect(localStorage.getItem('test_key')).toBeTruthy();

            removeLocalStorageItem('test_key');
            expect(localStorage.getItem('test_key')).toBeNull();
        });
    });

    describe('popLocalStorageItem', () => {
        it('should return data and remove item', () => {
            setLocalStorageItem('test_key', 'test_value');
            const result = popLocalStorageItem('test_key');

            expect(result).toBe('test_value');
            expect(localStorage.getItem('test_key')).toBeNull();
        });

        it('should return null for non-existent key', () => {
            const result = popLocalStorageItem('non_existent');
            expect(result).toBeNull();
        });
    });

    describe('clearLocalStorage', () => {
        it('should clear all items', () => {
            setLocalStorageItem('key1', 'value1');
            setLocalStorageItem('key2', 'value2');
            setLocalStorageItem('key3', 'value3');

            expect(localStorage.length).toBe(3);

            clearLocalStorage();
            expect(localStorage.length).toBe(0);
        });
    });

    describe('removeLocalStorageItemsByPrefix', () => {
        it('should remove all items with specified prefix', () => {
            setLocalStorageItem('draft_1', 'value1');
            setLocalStorageItem('draft_2', 'value2');
            setLocalStorageItem('user_1', 'value3');

            removeLocalStorageItemsByPrefix('draft_');

            expect(localStorage.getItem('draft_1')).toBeNull();
            expect(localStorage.getItem('draft_2')).toBeNull();
            expect(localStorage.getItem('user_1')).toBeTruthy();
        });

        it('should handle empty prefix', () => {
            setLocalStorageItem('key1', 'value1');
            setLocalStorageItem('key2', 'value2');

            removeLocalStorageItemsByPrefix('');

            // 빈 prefix는 모든 키와 매치
            expect(localStorage.length).toBe(0);
        });
    });

    describe('cleanupExpiredItems', () => {
        it('should remove only expired items', () => {
            // 유효한 항목
            setLocalStorageItem('valid_key', 'valid_value', 10);

            // 만료된 항목
            const expiredData = {
                data: 'expired_value',
                expiry: formatISO(subMinutes(new Date(), 10)),
            };
            localStorage.setItem('expired_key', JSON.stringify(expiredData));

            // 만료 시간 없는 항목
            setLocalStorageItem('permanent_key', 'permanent_value');

            cleanupExpiredItems();

            expect(localStorage.getItem('valid_key')).toBeTruthy();
            expect(localStorage.getItem('expired_key')).toBeNull();
            expect(localStorage.getItem('permanent_key')).toBeTruthy();
        });

        it('should handle invalid JSON during cleanup', () => {
            localStorage.setItem('invalid_json', 'not a json');
            setLocalStorageItem('valid_key', 'valid_value');

            expect(() => cleanupExpiredItems()).not.toThrow();
            expect(localStorage.getItem('valid_key')).toBeTruthy();
        });

        it('should handle multiple expired items', () => {
            const expiredTime = formatISO(subMinutes(new Date(), 10));

            localStorage.setItem('expired_1', JSON.stringify({data: 'value1', expiry: expiredTime}));
            localStorage.setItem('expired_2', JSON.stringify({data: 'value2', expiry: expiredTime}));
            localStorage.setItem('expired_3', JSON.stringify({data: 'value3', expiry: expiredTime}));

            cleanupExpiredItems();

            expect(localStorage.length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle special characters in keys', () => {
            const specialKey = 'test:key/with-special_chars.123';
            setLocalStorageItem(specialKey, 'value');
            expect(getLocalStorageItem(specialKey)).toBe('value');
        });

        it('should handle empty string as value', () => {
            setLocalStorageItem('empty_key', '');
            expect(getLocalStorageItem('empty_key')).toBe('');
        });

        it('should handle null as value', () => {
            setLocalStorageItem('null_key', null);
            expect(getLocalStorageItem('null_key')).toBeNull();
        });

        it('should handle array as value', () => {
            const arrayValue = [1, 2, 3, 'test'];
            setLocalStorageItem('array_key', arrayValue);
            expect(getLocalStorageItem('array_key')).toEqual(arrayValue);
        });

        it('should handle very large expiry times', () => {
            setLocalStorageItem('long_expiry', 'value', 999999);
            expect(getLocalStorageItem('long_expiry')).toBe('value');
        });
    });
});
