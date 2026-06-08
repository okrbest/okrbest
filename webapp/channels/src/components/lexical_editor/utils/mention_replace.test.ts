// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createEditor} from 'lexical';
import {$getRoot, $createParagraphNode, $createTextNode} from 'lexical';

import {
    computeMentionRangeEnd,
    computeReplaceCharCountFromTrigger,
    consumeSearchTextFromFollowingSiblings,
    getNextTextSibling,
    readPrefixFromTrigger,
} from './mention_replace';

const CHANNEL_PREFIX_PATTERN = /^[^~\r\n]*/;

describe('mention_replace', () => {
    describe('computeMentionRangeEnd', () => {
        test('단일 노드 ~공', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const text = $createTextNode('~공');
                p.append(text);
                root.append(p);

                const end = computeMentionRangeEnd(text, 0, 2);
                expect(end.focusKey).toBe(text.getKey());
                expect(end.focusOffset).toBe(2);
            });
        });

        test('분리 노드 ~ + 공', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const tilde = $createTextNode('~');
                const hangul = $createTextNode('공');
                p.append(tilde, hangul);
                root.append(p);

                const end = computeMentionRangeEnd(tilde, 0, 2);
                expect(end.focusKey).toBe(hangul.getKey());
                expect(end.focusOffset).toBe(1);
            });
        });
    });

    describe('computeReplaceCharCountFromTrigger', () => {
        test('분리 노드 ~ + 공', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const tilde = $createTextNode('~');
                const hangul = $createTextNode('공');
                p.append(tilde, hangul);
                root.append(p);

                expect(computeReplaceCharCountFromTrigger(tilde, 0, CHANNEL_PREFIX_PATTERN)).toBe(2);
                expect(readPrefixFromTrigger(tilde, 0, CHANNEL_PREFIX_PATTERN)).toBe('공');
            });
        });
    });

    describe('consumeSearchTextFromFollowingSiblings', () => {
        test('~ 노드 뒤 공 형제 제거', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const tilde = $createTextNode('~');
                const hangul = $createTextNode('공');
                p.append(tilde, hangul);
                root.append(p);

                consumeSearchTextFromFollowingSiblings(tilde, 0, 2);
                expect(getNextTextSibling(tilde)).toBeNull();
            });
        });
    });
});
