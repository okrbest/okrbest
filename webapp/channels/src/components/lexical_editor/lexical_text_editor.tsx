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
import {ListNode, ListItemNode} from '@lexical/list';
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
    searchChannels?: (term: string) => Promise<Array<{id: string; name: string; display_name: string}>>;
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
            if (value) {
                isInitialized.current = true;
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
                <EditorRefPlugin editorRef={editorRef} />
                {onSubmit && (
                    <KeyboardPlugin
                        onSubmit={onSubmit}
                        onEscape={onEscape}
                    />
                )}
                <FocusPlugin onFocus={onFocus} onBlur={onBlur} />
                {searchUsers && (
                    <MentionPlugin
                        channelId={channelId}
                        onMentionSelected={onMentionSelected}
                        searchUsers={searchUsers}
                    />
                )}
                {searchChannels && (
                    <ChannelMentionPlugin
                        searchChannels={searchChannels}
                    />
                )}
                <EmojiPlugin />
                {supportsCommands && <SlashCommandPlugin />}
            </LexicalComposer>
        </div>
    );
});

export default LexicalTextEditor;
