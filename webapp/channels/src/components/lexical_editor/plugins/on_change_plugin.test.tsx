import React from 'react';
import {render, screen, act} from '@testing-library/react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {ListNode, ListItemNode} from '@lexical/list';
import {CodeNode, CodeHighlightNode} from '@lexical/code';
import {LinkNode} from '@lexical/link';
import {$getRoot, $createParagraphNode, $createTextNode, type LexicalEditor} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

import OnChangeMarkdownPlugin from './on_change_plugin';

// Helper to capture editor instance
let testEditor: LexicalEditor | null = null;
function EditorCapture() {
    const [editor] = useLexicalComposerContext();
    testEditor = editor;
    return null;
}

const TestEditor = ({onChange}: {onChange: jest.Mock}) => (
    <LexicalComposer
        initialConfig={{
            namespace: 'test',
            onError: jest.fn(),
            theme: {},
            nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode],
        }}
    >
        <RichTextPlugin
            contentEditable={<ContentEditable data-testid="editor" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangeMarkdownPlugin onChange={onChange} />
        <EditorCapture />
    </LexicalComposer>
);

describe('OnChangeMarkdownPlugin', () => {
    beforeEach(() => {
        testEditor = null;
    });

    it('should call onChange with markdown string when editor content changes', async () => {
        const onChange = jest.fn();
        render(<TestEditor onChange={onChange} />);

        // 에디터에 직접 텍스트 삽입
        await act(async () => {
            testEditor!.update(() => {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode('hello world'));
                root.append(paragraph);
            });
        });

        // onChange가 마크다운 문자열로 호출되어야 함
        expect(onChange).toHaveBeenCalled();
        const allCalls = onChange.mock.calls.map((call: [string]) => call[0]);
        expect(allCalls.some((md: string) => typeof md === 'string' && md.includes('hello world'))).toBe(true);
    });

    it('should export string type from onChange', async () => {
        const onChange = jest.fn();
        render(<TestEditor onChange={onChange} />);

        // 에디터 변경을 트리거하여 onChange 호출 확인
        await act(async () => {
            testEditor!.update(() => {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode('test'));
                root.append(paragraph);
            });
        });

        expect(onChange).toHaveBeenCalled();
        const firstCall = onChange.mock.calls[0][0];
        expect(typeof firstCall).toBe('string');
    });
});
