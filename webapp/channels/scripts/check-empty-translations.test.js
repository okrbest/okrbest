// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const {findEmptyAndOrphanedTranslations} = require('./check-empty-translations');

describe('findEmptyAndOrphanedTranslations', () => {
    test('returns no issues when ko.json is fully in sync', () => {
        const en = {'a.b': 'Hello', 'a.c': 'World'};
        const ko = {'a.b': '안녕', 'a.c': '세상'};

        expect(findEmptyAndOrphanedTranslations(en, ko)).toEqual({
            emptyKeys: [],
            orphanedKeys: [],
        });
    });

    test('detects empty-string translations', () => {
        const en = {'a.b': 'Hello'};
        const ko = {'a.b': ''};

        expect(findEmptyAndOrphanedTranslations(en, ko)).toEqual({
            emptyKeys: ['a.b'],
            orphanedKeys: [],
        });
    });

    test('detects orphaned keys not present in en.json', () => {
        const en = {'a.b': 'Hello'};
        const ko = {'a.b': '안녕', 'a.removed': '삭제됨'};

        expect(findEmptyAndOrphanedTranslations(en, ko)).toEqual({
            emptyKeys: [],
            orphanedKeys: ['a.removed'],
        });
    });

    test('detects both empty and orphaned keys together', () => {
        const en = {'a.b': 'Hello'};
        const ko = {'a.b': '', 'a.removed': ''};

        expect(findEmptyAndOrphanedTranslations(en, ko)).toEqual({
            emptyKeys: ['a.b', 'a.removed'],
            orphanedKeys: ['a.removed'],
        });
    });
});
