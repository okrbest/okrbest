import React, {useCallback, useEffect, useRef, useMemo} from 'react';
import classNames from 'classnames';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$convertFromMarkdownString} from '@lexical/markdown';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {ListNode, ListItemNode} from '@lexical/list';
import {CodeNode, CodeHighlightNode} from '@lexical/code';
import {LinkNode} from '@lexical/link';
import {TableNode, TableCellNode, TableRowNode} from '@lexical/table';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {TabIndentationPlugin} from '@lexical/react/LexicalTabIndentationPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';

import editorTheme from './config/editor_theme';
import {CHANNELS_TRANSFORMERS} from './config/markdown_transformers';
import OnChangeMarkdownPlugin from './plugins/on_change_plugin';
import KeyboardPlugin from './plugins/keyboard_plugin';
import FocusPlugin from './plugins/focus_plugin';

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
};

// 에디터 초기값 설정용 내부 플러그인
function InitialValuePlugin({value}: {value: string}) {
    const [editor] = useLexicalComposerContext();
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current && value) {
            isInitialized.current = true;
            editor.update(() => {
                $convertFromMarkdownString(value, CHANNELS_TRANSFORMERS);
            });
        }
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

export default function LexicalTextEditor({
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
}: LexicalTextEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);

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
        ],
        onError: (error: Error) => {
            console.error('LexicalTextEditor error:', error);
        },
        editable: !disabled,
    }), [id, disabled]);

    const handleChange = useCallback((markdown: string) => {
        onChange(markdown);
    }, [onChange]);

    const handleSubmit = useCallback(() => {
        onSubmit?.();
    }, [onSubmit]);

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
                <MarkdownShortcutPlugin transformers={CHANNELS_TRANSFORMERS} />
                <HistoryPlugin />
                <ListPlugin />
                <TablePlugin />
                <TabIndentationPlugin />
                <OnChangeMarkdownPlugin onChange={handleChange} />
                <InitialValuePlugin value={value} />
                <EditablePlugin disabled={disabled} />
                {onSubmit && (
                    <KeyboardPlugin
                        onSubmit={handleSubmit}
                        onEscape={onEscape}
                    />
                )}
                <FocusPlugin onFocus={onFocus} onBlur={onBlur} />
            </LexicalComposer>
        </div>
    );
}
