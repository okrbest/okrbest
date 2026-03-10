import React, {useEffect, useRef, useMemo, useImperativeHandle, forwardRef} from 'react';
import type {LexicalEditor} from 'lexical';
import classNames from 'classnames';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$convertFromMarkdownString, $convertToMarkdownString} from '@lexical/markdown';
import {$createParagraphNode, $getRoot} from 'lexical';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {$isListNode, ListNode, ListItemNode} from '@lexical/list';
import {CodeNode, CodeHighlightNode} from '@lexical/code';
import {LinkNode} from '@lexical/link';
import {TableNode, TableCellNode, TableRowNode} from '@lexical/table';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';

import editorTheme from './config/editor_theme';
import {CHANNELS_TRANSFORMERS, CHANNELS_SHORTCUT_TRANSFORMERS} from './config/markdown_transformers';
import {MentionNode} from './nodes/mention_node';
import {ChannelMentionNode} from './nodes/channel_mention_node';
import {EmojiNode} from './nodes/emoji_node';
import OnChangeMarkdownPlugin from './plugins/on_change_plugin';
import KeyboardPlugin from './plugins/keyboard_plugin';
import FocusPlugin from './plugins/focus_plugin';
import MentionPlugin from './plugins/mention_plugin';
import ChannelMentionPlugin from './plugins/channel_mention_plugin';
import EmojiPlugin from './plugins/emoji_plugin';
import SlashCommandPlugin from './plugins/slash_command_plugin';
import ListShortcutPlugin from './plugins/list_shortcut_plugin';

import './lexical_text_editor.scss';

export type LexicalTextEditorProps = {
    id: string;
    value: string;
    channelId: string;
    teamId?: string;
    rootId?: string;
    characterLimit: number;
    createMessage: string;
    disabled?: boolean;
    onChange: (markdown: string) => void;
    onSubmit?: () => void;
    onEscape?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onHeightChange?: (height: number, maxHeight: number) => void;
    onMentionSelected?: (item: {id: string; username: string}) => void;
    searchUsers?: (term: string) => Promise<Array<{id: string; username: string; first_name: string; last_name: string}>>;
    searchChannels?: (term: string) => Promise<Array<{id: string; name: string; display_name: string; type?: string}>>;
    supportsCommands?: boolean;
};

export type LexicalTextEditorHandle = {
    getEditor: () => LexicalEditor | null;
    focus: () => void;
    blur: () => void;
    getInputBox: () => HTMLElement | null;
};

// 에디터 값 동기화 플러그인 (초기값 설정 + 외부에서 빈 값으로 리셋 시 클리어)
function ValueSyncPlugin({value}: {value: string}) {
    const [editor] = useLexicalComposerContext();
    const isInitialized = useRef(false);
    const lastExternalValue = useRef(value);

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            if (value) {
                editor.update(() => {
                    $convertFromMarkdownString(value, CHANNELS_TRANSFORMERS);
                });
            }
            return;
        }

        // 외부에서 값이 비워졌을 때 (전송 후 등) 에디터 클리어
        if (!value && lastExternalValue.current !== value) {
            editor.update(() => {
                const root = $getRoot();
                root.clear();
                root.append($createParagraphNode());
            }, {tag: 'history-merge'});
        }

        lastExternalValue.current = value;
    }, [editor, value]);

    return null;
}

// 빈 리스트 노드 정규화 플러그인
// Cmd+A → Backspace 시 빈 리스트가 남는 것을 방지
function EmptyBlockNormalizerPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(({editorState, prevEditorState, tags}) => {
            if (tags.has('history-merge')) {
                return;
            }

            editorState.read(() => {
                const root = $getRoot();
                const children = root.getChildren();

                // 단일 빈 리스트 감지: 리스트 아이템이 1개이고 텍스트가 없는 경우
                const listNode = children[0];
                if (children.length === 1 && $isListNode(listNode) && listNode.getChildrenSize() === 1 && !listNode.getFirstChild()?.getTextContent()) {
                    // 이전 상태가 paragraph였으면 새 리스트 생성 → 무시
                    const wasCreatedFromParagraph = prevEditorState.read(() => {
                        const prevChildren = $getRoot().getChildren();
                        return prevChildren.length === 1 && !$isListNode(prevChildren[0]);
                    });
                    if (wasCreatedFromParagraph) {
                        return;
                    }

                    editor.update(() => {
                        const root = $getRoot();
                        root.clear();
                        root.append($createParagraphNode());
                    }, {tag: 'history-merge'});
                }
            });
        });
    }, [editor]);

    return null;
}

// 비활성화 상태 관리 플러그인
function EditablePlugin({disabled}: {disabled: boolean}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.setEditable(!disabled);
    }, [editor, disabled]);

    return null;
}

// editor 인스턴스를 외부 ref에 노출
function EditorRefPlugin({editorRef}: {editorRef: React.MutableRefObject<LexicalEditor | null>}) {
    const [editor] = useLexicalComposerContext();
    editorRef.current = editor;
    return null;
}

const LexicalTextEditor = forwardRef<LexicalTextEditorHandle, LexicalTextEditorProps>(function LexicalTextEditor({
    id,
    value,
    channelId,
    teamId,
    rootId,
    characterLimit,
    createMessage,
    disabled = false,
    onChange,
    onSubmit,
    onEscape,
    onFocus,
    onBlur,
    onHeightChange,
    onMentionSelected,
    searchUsers,
    searchChannels,
    supportsCommands,
}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<LexicalEditor | null>(null);

    useImperativeHandle(ref, () => ({
        getEditor: () => editorRef.current,
        focus: () => {
            editorRef.current?.focus();
        },
        blur: () => {
            const rootElement = editorRef.current?.getRootElement();
            rootElement?.blur();
        },
        getInputBox: () => {
            return editorRef.current?.getRootElement() ?? null;
        },
    }), []);

    const initialConfig = useMemo(() => ({
        namespace: `channels-editor-${id}`,
        theme: editorTheme,
        nodes: [
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
        ],
        onError: (error: Error) => {
            console.error('LexicalTextEditor error:', error);
        },
        editable: true,
    }), [id]);

    return (
        <div
            ref={containerRef}
            className={classNames('lexical-text-editor', {disabled})}
        >
            <LexicalComposer initialConfig={initialConfig}>
                <div className="lexical-editor-container">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="lexical-content-editable"
                                id={id}
                                data-placeholder={createMessage}
                            />
                        }
                        placeholder={null}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
                <MarkdownShortcutPlugin transformers={CHANNELS_SHORTCUT_TRANSFORMERS} />
                <ListShortcutPlugin />
                <HistoryPlugin />
                <ListPlugin />
                <TablePlugin />
                <OnChangeMarkdownPlugin onChange={onChange} />
                <ValueSyncPlugin value={value} />
                <EditablePlugin disabled={disabled} />
                <EmptyBlockNormalizerPlugin />
                <EditorRefPlugin editorRef={editorRef} />
                {onSubmit && (
                    <KeyboardPlugin
                        onSubmit={onSubmit}
                        onEscape={onEscape}
                    />
                )}
                <FocusPlugin onFocus={onFocus} onBlur={onBlur} />
                <MentionPlugin
                    channelId={channelId}
                    teamId={teamId}
                    onMentionSelected={onMentionSelected}
                />
                {searchChannels && (
                    <ChannelMentionPlugin
                        searchChannels={searchChannels}
                    />
                )}
                <EmojiPlugin />
                {supportsCommands && teamId && (
                    <SlashCommandPlugin
                        teamId={teamId}
                        channelId={channelId}
                        rootId={rootId}
                    />
                )}
            </LexicalComposer>
        </div>
    );
});

export default LexicalTextEditor;
