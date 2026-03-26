// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {createHeadlessEditor} from '@lexical/headless';
import {LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {$convertFromMarkdownString} from '@lexical/markdown';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';
import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $parseSerializedNode,
    COMMAND_PRIORITY_HIGH,
    PASTE_COMMAND,
    PASTE_TAG,
} from 'lexical';
import type {LexicalEditor, LexicalNode, SerializedLexicalNode} from 'lexical';
import {useEffect, useRef, type MutableRefObject} from 'react';

import {CHANNELS_MARKDOWN_IMPORT_WITHOUT_TABLE} from '../config/markdown_transformers';
import {ChannelMentionNode} from '../nodes/channel_mention_node';
import {EmojiNode} from '../nodes/emoji_node';
import {MentionNode} from '../nodes/mention_node';
import {plainTextLooksLikeMarkdown} from '../utils/markdown_paste_heuristics';

function sanitizePlainForMarkdown(text: string): string {
    return text.
        replace(/^\uFEFF/, '').
        replace(/\u200B/g, '').
        replace(/\r\n/g, '\n').
        replace(/\r/g, '\n');
}

/**
 * `exportJSON()`만 쓰면 Element의 `children`이 빠져 $parseSerializedNode 이후
 * 제목 본문·테이블·리스트 내용이 비어 복원된다(EditorState.toJSON()은 재귀 export 사용).
 */
function deepSerializeLexicalNode(node: LexicalNode): SerializedLexicalNode {
    const serialized = node.exportJSON();
    if ($isElementNode(node)) {
        return {
            ...serialized,
            children: node.getChildren().map(deepSerializeLexicalNode),
        };
    }
    return serialized;
}

const STAGING_NODES = [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    MentionNode,
    ChannelMentionNode,
    EmojiNode,
];

function getHeadlessStagingEditor(ref: MutableRefObject<LexicalEditor | null>): LexicalEditor {
    if (!ref.current) {
        ref.current = createHeadlessEditor({
            namespace: 'channels-markdown-paste-staging',
            nodes: STAGING_NODES,
            onError: () => {},
        });
    }
    return ref.current;
}

export default function MarkdownPastePlugin(): null {
    const [editor] = useLexicalComposerContext();
    const stagingRef = useRef<LexicalEditor | null>(null);

    useEffect(() => {
        return () => {
            stagingRef.current = null;
        };
    }, []);

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event) => {
                if (!(event instanceof ClipboardEvent)) {
                    return false;
                }
                const data = event.clipboardData;
                if (!data) {
                    return false;
                }

                if (data.files.length > 0) {
                    return false;
                }

                const plainRaw = data.getData('text/plain');
                const plain = sanitizePlainForMarkdown(plainRaw);
                if (!plain || !plainTextLooksLikeMarkdown(plain)) {
                    return false;
                }

                event.preventDefault();

                const staging = getHeadlessStagingEditor(stagingRef);

                // update 직후 바깥에서 getEditorState().read() 하면 이전 트랜잭션이 보일 수 있어
                // (재사용 headless에서 두 번째 붙여넣기 시 빈/이전 결과) — 같은 update 안에서 직렬화한다.
                let serializedChildren: SerializedLexicalNode[] = [];
                staging.update(() => {
                    $convertFromMarkdownString(plain, CHANNELS_MARKDOWN_IMPORT_WITHOUT_TABLE, undefined, true);
                    serializedChildren = $getRoot().getChildren().map(deepSerializeLexicalNode);
                });

                editor.update(
                    () => {
                        const root = $getRoot();
                        if (root.getChildrenSize() === 0) {
                            root.append($createParagraphNode());
                        }

                        let selectionNode = $getSelection();
                        if (selectionNode === null || !$isRangeSelection(selectionNode)) {
                            root.selectEnd();
                            selectionNode = $getSelection();
                        }

                        const insertAtRootEnd = () => {
                            try {
                                if (serializedChildren.length === 0) {
                                    const p = $createParagraphNode();
                                    p.append($createTextNode(plain));
                                    root.append(p);
                                    return;
                                }
                                const nodes = serializedChildren.map((json) => $parseSerializedNode(json));
                                for (const node of nodes) {
                                    root.append(node);
                                }
                            } catch {
                                const p = $createParagraphNode();
                                p.append($createTextNode(plainRaw));
                                root.append(p);
                            }
                            root.selectEnd();
                        };

                        if (!$isRangeSelection(selectionNode)) {
                            insertAtRootEnd();
                            return;
                        }

                        try {
                            if (serializedChildren.length === 0) {
                                selectionNode.insertText(plain);
                                return;
                            }
                            const nodes = serializedChildren.map((json) => $parseSerializedNode(json));
                            selectionNode.insertNodes(nodes);
                        } catch {
                            selectionNode.insertText(plainRaw);
                        }
                    },
                    {tag: PASTE_TAG},
                );

                return true;
            },
            COMMAND_PRIORITY_HIGH,
        );
    }, [editor]);

    return null;
}
