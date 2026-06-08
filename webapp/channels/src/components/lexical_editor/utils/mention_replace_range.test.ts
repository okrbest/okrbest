// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getMentionReplaceRange} from './mention_replace_range';

describe('getMentionReplaceRange', () => {
    test('Lexical에 ~만 있고 prefix는 공 (IME)', () => {
        const {beforeText, afterText} = getMentionReplaceRange('~', 0, '공');
        expect(beforeText).toBe('');
        expect(afterText).toBe('');
    });

    test('단일 노드 ~공', () => {
        const {beforeText, afterText} = getMentionReplaceRange('~공', 0, '공');
        expect(beforeText).toBe('');
        expect(afterText).toBe('');
    });

    test('문장 중간', () => {
        const {beforeText, afterText} = getMentionReplaceRange(' ~공', 1, '공');
        expect(beforeText).toBe(' ');
        expect(afterText).toBe('');
    });

    test('검색어 뒤 추가 입력은 유지', () => {
        const {beforeText, afterText} = getMentionReplaceRange('~공x', 0, '공');
        expect(beforeText).toBe('');
        expect(afterText).toBe('x');
    });
});
