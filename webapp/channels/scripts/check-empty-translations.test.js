// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const {
    analyzeCatalogs,
    findEmptyAndOrphanedTranslations,
    hasBlockingIssues,
    normalizeCatalog,
} = require('./check-empty-translations');

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

describe('normalizeCatalog', () => {
    test('passes through the webapp object format', () => {
        expect(normalizeCatalog({'a.b': 'Hello'})).toEqual({'a.b': 'Hello'});
    });

    test('flattens the server array format', () => {
        const raw = [{id: 'April', translation: '4월'}, {id: 'May', translation: '5월'}];

        expect(normalizeCatalog(raw)).toEqual({April: '4월', May: '5월'});
    });

    test('flattens an empty server catalog', () => {
        expect(normalizeCatalog([])).toEqual({});
    });
});

describe('analyzeCatalogs', () => {
    test('reports missing keys that exist in en.json but not ko.json', () => {
        const en = {'a.b': 'Hello', 'a.new': 'New string'};
        const ko = {'a.b': '안녕'};

        expect(analyzeCatalogs({en, ko})).toEqual({
            emptyKeys: [],
            orphanedKeys: [],
            missingKeys: ['a.new'],
            changedKeys: [],
        });
    });

    test('reports no changed keys when no base catalog is given', () => {
        const en = {'a.b': 'Changed source'};
        const ko = {'a.b': '안녕'};

        expect(analyzeCatalogs({en, ko}).changedKeys).toEqual([]);
    });

    test('reports keys whose English source changed since the base catalog', () => {
        const baseEn = {'a.b': 'Hello', 'a.c': 'World'};
        const en = {'a.b': 'Hello there', 'a.c': 'World'};
        const ko = {'a.b': '안녕', 'a.c': '세상'};

        expect(analyzeCatalogs({en, ko, baseEn}).changedKeys).toEqual(['a.b']);
    });

    test('excludes untranslated keys from changedKeys - they are missing, not stale', () => {
        const baseEn = {'a.b': 'Hello'};
        const en = {'a.b': 'Hello there'};
        const ko = {};

        expect(analyzeCatalogs({en, ko, baseEn})).toEqual({
            emptyKeys: [],
            orphanedKeys: [],
            missingKeys: ['a.b'],
            changedKeys: [],
        });
    });

    test('excludes newly added keys from changedKeys', () => {
        const baseEn = {'a.b': 'Hello'};
        const en = {'a.b': 'Hello', 'a.new': 'New string'};
        const ko = {'a.b': '안녕', 'a.new': '새 문자열'};

        expect(analyzeCatalogs({en, ko, baseEn}).changedKeys).toEqual([]);
    });

    test('accepts the server array format on both sides', () => {
        const en = [{id: 'April', translation: 'April'}, {id: 'May', translation: 'May'}];
        const ko = [{id: 'April', translation: '4월'}];

        expect(analyzeCatalogs({en, ko}).missingKeys).toEqual(['May']);
    });
});

describe('hasBlockingIssues', () => {
    test('blocks on empty translations', () => {
        expect(hasBlockingIssues({emptyKeys: ['a.b'], orphanedKeys: [], missingKeys: [], changedKeys: []})).toBe(true);
    });

    test('blocks on orphaned keys', () => {
        expect(hasBlockingIssues({emptyKeys: [], orphanedKeys: ['a.b'], missingKeys: [], changedKeys: []})).toBe(true);
    });

    test('does not block on missing or changed keys - those are follow-up work', () => {
        expect(hasBlockingIssues({emptyKeys: [], orphanedKeys: [], missingKeys: ['a.b'], changedKeys: ['a.c']})).toBe(false);
    });
});
