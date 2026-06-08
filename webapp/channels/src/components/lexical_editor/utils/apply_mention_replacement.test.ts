// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createEditor} from 'lexical';
import {$getRoot, $createParagraphNode, $createTextNode} from 'lexical';

import {applyMentionReplacement} from './apply_mention_replacement';
import {getTextAfterReplaceEnd} from './mention_replace';

const CHANNEL_PREFIX_PATTERN = /^[^~\r\n]*/;

describe('apply_mention_replacement', () => {
    describe('getTextAfterReplaceEnd', () => {
        test('형제 노드 텍스트를 afterText에 포함하지 않음', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const tilde = $createTextNode('~공');
                const sibling = $createTextNode('다른글자');
                p.append(tilde, sibling);
                root.append(p);

                expect(getTextAfterReplaceEnd(tilde, 0, 2)).toBe('');
            });
        });
    });

    describe('applyMentionReplacement', () => {
        test('단일 노드 ~공 단순 치환', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const node = $createTextNode('~공');
                p.append(node);
                root.append(p);

                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: node.getKey(),
                        triggerOffset: 0,
                        prefix: '공',
                    },
                    fallbackQueryPrefix: '공',
                    prefixCharPattern: CHANNEL_PREFIX_PATTERN,
                    triggerChar: '~',
                    createNodesToInsert: (afterText) => [
                        $createTextNode('~channel'),
                        $createTextNode(afterText || ' '),
                    ],
                });

                expect(result?.usedRangePath).toBe(false);
                expect(p.getTextContent()).toBe('~channel ');
            });
        });
    });
});
