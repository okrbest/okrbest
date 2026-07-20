// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createEditor} from 'lexical';
import {
    $getRoot,
    $createParagraphNode,
    $createTextNode,
    $createRangeSelection,
    $setSelection,
} from 'lexical';

import {applyMentionReplacement} from './apply_mention_replacement';
import {getTextAfterReplaceEnd} from './mention_replace';
import {$createMentionNode, $isMentionNode} from '../nodes/mention_node';

const CHANNEL_PREFIX_PATTERN = /^[^~\r\n]*/;
const MENTION_PREFIX_PATTERN = /^[\p{L}\d\-_. ]*/u;

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

        test('커서 우측 기존 텍스트를 지우지 않는다 (@ 멘션)', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const node = $createTextNode('@샘플1 dddd @조회사라짐');
                p.append(node);
                root.append(p);

                const triggerOffset = node.getTextContent().lastIndexOf('@');
                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: node.getKey(),
                        triggerOffset,
                        prefix: '조회',
                    },
                    fallbackQueryPrefix: '조회',
                    prefixCharPattern: MENTION_PREFIX_PATTERN,
                    triggerChar: '@',
                    createNodesToInsert: (afterText) => [
                        $createTextNode('@매치유저'),
                        $createTextNode(afterText || ' '),
                    ],
                });

                expect(result?.prefix).toBe('조회');
                expect(result?.afterText).toBe('사라짐');
                expect(p.getTextContent()).toBe('@샘플1 dddd @매치유저사라짐');
            });
        });

        test('트리거 직후 빈 prefix 상태에서도 커서 우측 기존 텍스트를 지우지 않는다', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const node = $createTextNode('@어드민 dddd @어드민 @샘플2 @dddd');
                p.append(node);
                root.append(p);

                const triggerOffset = node.getTextContent().lastIndexOf('@');
                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: node.getKey(),
                        triggerOffset,
                        prefix: '',
                    },
                    fallbackQueryPrefix: '',
                    prefixCharPattern: MENTION_PREFIX_PATTERN,
                    triggerChar: '@',
                    createNodesToInsert: (afterText) => [
                        $createTextNode('@샘플2'),
                        $createTextNode(afterText || ' '),
                    ],
                });

                expect(result?.prefix).toBe('');
                expect(result?.usedRangePath).toBe(true);
                expect(result?.afterText).toBe('dddd');
                expect(p.getTextContent()).toBe('@어드민 dddd @어드민 @샘플2 @샘플2dddd');
            });
        });

        test('트리거 노드가 다 소진되고 실제 내용은 형제 노드에 있어도 지우지 않는다', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const before = $createTextNode('내용 입력 @');
                const after = $createTextNode('하는 중 내용 확인');
                p.append(before, after);
                root.append(p);

                const triggerOffset = before.getTextContent().lastIndexOf('@');
                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: before.getKey(),
                        triggerOffset,
                        prefix: '',
                    },
                    fallbackQueryPrefix: '',
                    prefixCharPattern: MENTION_PREFIX_PATTERN,
                    triggerChar: '@',
                    createNodesToInsert: (afterText) => [
                        $createTextNode('@샘플1'),
                        $createTextNode(afterText || ' '),
                    ],
                });

                expect(result?.prefix).toBe('');
                expect(p.getTextContent()).toBe('내용 입력 @샘플1 하는 중 내용 확인');
            });
        });

        test('커서 우측 기존 텍스트를 지우지 않는다 (~ 채널 멘션)', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const node = $createTextNode('foo ~마케팅기존텍스트');
                p.append(node);
                root.append(p);

                const triggerOffset = node.getTextContent().indexOf('~');
                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: node.getKey(),
                        triggerOffset,
                        prefix: '마케팅',
                    },
                    fallbackQueryPrefix: '마케팅',
                    prefixCharPattern: CHANNEL_PREFIX_PATTERN,
                    triggerChar: '~',
                    createNodesToInsert: (afterText) => [
                        $createTextNode('~marketing'),
                        $createTextNode(afterText || ' '),
                    ],
                });

                expect(result?.afterText).toBe('기존텍스트');
                expect(p.getTextContent()).toBe('foo ~marketing기존텍스트');
            });
        });

        test('분리 노드 IME 조합 + 이어치기 후에도 정상 치환 (Range 경로)', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const tilde = $createTextNode('~');
                const hangul = $createTextNode('공x');
                p.append(tilde, hangul);
                root.append(p);

                const selection = $createRangeSelection();
                const end = hangul.getTextContent().length;
                selection.anchor.set(hangul.getKey(), end, 'text');
                selection.focus.set(hangul.getKey(), end, 'text');
                $setSelection(selection);

                const result = applyMentionReplacement({
                    pendingMatch: null,
                    fallbackQueryPrefix: '',
                    prefixCharPattern: CHANNEL_PREFIX_PATTERN,
                    triggerChar: '~',
                    createNodesToInsert: (afterText) => [
                        $createTextNode('~channel'),
                        $createTextNode(afterText || ' '),
                    ],
                });

                expect(result?.usedRangePath).toBe(true);
                expect(p.getTextContent()).toBe('~channel ');
            });
        });

        test('영문 @멘션을 문장 시작에서 선택하면 멘션 노드로 치환된다', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const node = $createTextNode('@sam');
                p.append(node);
                root.append(p);

                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: node.getKey(),
                        triggerOffset: 0,
                        prefix: 'sam',
                    },
                    fallbackQueryPrefix: 'sam',
                    prefixCharPattern: MENTION_PREFIX_PATTERN,
                    triggerChar: '@',
                    createNodesToInsert: (afterText) => {
                        const mention = $createMentionNode('sample1', 'sample1');
                        return afterText ? [mention, $createTextNode(afterText)] : [mention, $createTextNode(' ')];
                    },
                });

                expect(result?.usedRangePath).toBe(true);
                expect($isMentionNode(p.getFirstChild())).toBe(true);
                expect(p.getTextContent()).toBe('@sample1 ');
            });
        });

        test('문장 시작 영문 @멘션 치환 시 뒤 텍스트를 보존한다', () => {
            const editor = createEditor();
            editor.update(() => {
                const root = $getRoot();
                const p = $createParagraphNode();
                const node = $createTextNode('@sam rest');
                p.append(node);
                root.append(p);

                const result = applyMentionReplacement({
                    pendingMatch: {
                        triggerKey: node.getKey(),
                        triggerOffset: 0,
                        prefix: 'sam',
                    },
                    fallbackQueryPrefix: 'sam',
                    prefixCharPattern: MENTION_PREFIX_PATTERN,
                    triggerChar: '@',
                    createNodesToInsert: (afterText) => {
                        const mention = $createMentionNode('sample1', 'sample1');
                        return afterText ? [mention, $createTextNode(afterText)] : [mention, $createTextNode(' ')];
                    },
                });

                expect(result?.usedRangePath).toBe(true);
                expect($isMentionNode(p.getFirstChild())).toBe(true);
                expect(p.getTextContent()).toBe('@sample1 rest');
            });
        });
    });
});
