// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {$convertFromMarkdownString} from '@lexical/markdown';
import {$createQuoteNode, $isQuoteNode, HeadingNode, QuoteNode} from '@lexical/rich-text';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';
import type {LexicalEditor} from 'lexical';
import {$createLineBreakNode, $createTextNode, $getRoot, $getSelection, $isParagraphNode, $isRangeSelection, createEditor} from 'lexical';

import {appendQuoteToMessage, formatQuote} from 'utils/quote';

import {$appendQuote} from './append_quote';
import {readChannelsMarkdownForSubmit} from './read_channels_markdown_for_submit';

import {CHANNELS_MARKDOWN_IMPORT_WITHOUT_TABLE} from '../config/markdown_transformers';
import {$isQuotedMarkdownTextNode, QuotedMarkdownTextNode} from '../nodes/quoted_markdown_text_node';

function createTestEditor(existing = ''): LexicalEditor {
    const editor = createEditor({
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            CodeNode,
            CodeHighlightNode,
            LinkNode,
            AutoLinkNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            QuotedMarkdownTextNode,
        ],
        onError: (error) => {
            throw error;
        },
    });

    editor.update(() => {
        $convertFromMarkdownString(existing, CHANNELS_MARKDOWN_IMPORT_WITHOUT_TABLE);
    }, {discrete: true});

    return editor;
}

function appendQuote(editor: LexicalEditor, markdown: string): boolean {
    let inserted = false;
    editor.update(() => {
        inserted = $appendQuote(markdown);
    }, {discrete: true});
    return inserted;
}

describe('$appendQuote', () => {
    // The Markdown sent with the post has to match what upstream's message box produces for the same quote
    // (appendQuoteToMessage). The trailing blank lines upstream adds for the caret are not part of the post.
    test.each([
        ['a single line', '', 'Diam sapien'],
        ['paragraphs separated by a blank line', '', 'first para\n\nsecond para'],
        ['lists', '', '- item one\n- item two\n\n1. first'],
        ['a fenced code block', '', '```python\nprint("hi")\n\nprint("bye")\n```'],
        ['inline formatting and links', '', '**bold** and _it_ and `code` and [link](https://example.com)'],
        ['user and channel mentions', '', '@jieun and ~town-square'],
        ['an existing draft', 'original draft', 'Diam sapien\npellentesque'],
    ])('should send the same Markdown as upstream for %s', (_, existing, quoted) => {
        const editor = createTestEditor(existing);

        expect(appendQuote(editor, quoted)).toBe(true);

        expect(readChannelsMarkdownForSubmit(editor).trimEnd()).toBe(appendQuoteToMessage(existing, quoted).trimEnd());
    });

    test('should show the quote as one blockquote', () => {
        const editor = createTestEditor('original draft');

        appendQuote(editor, 'first para\n\nsecond para');

        editor.getEditorState().read(() => {
            const children = $getRoot().getChildren();
            expect(children.filter($isQuoteNode)).toHaveLength(1);
        });
    });

    test('should replace the content of an empty message box', () => {
        const editor = createTestEditor('');

        appendQuote(editor, 'Diam sapien');

        expect(readChannelsMarkdownForSubmit(editor).trimEnd()).toBe(formatQuote('Diam sapien'));
        editor.getEditorState().read(() => {
            expect($isQuoteNode($getRoot().getFirstChild())).toBe(true);
        });
    });

    test('should put the caret in an empty paragraph after the quote', () => {
        const editor = createTestEditor('original draft');

        appendQuote(editor, 'Diam sapien');

        editor.getEditorState().read(() => {
            const last = $getRoot().getLastChild();
            expect($isParagraphNode(last)).toBe(true);
            expect(last?.getTextContent()).toBe('');
            expect($isQuoteNode(last?.getPreviousSibling())).toBe(true);

            const selection = $getSelection();
            expect($isRangeSelection(selection)).toBe(true);
            if ($isRangeSelection(selection)) {
                expect(selection.anchor.getNode().is(last)).toBe(true);
            }
        });
    });

    test('should send text added to the end of the quote without escaping it', () => {
        const editor = createTestEditor('');

        appendQuote(editor, 'Diam sapien');
        editor.update(() => {
            const quote = $getRoot().getFirstChild();
            const lastText = $isQuoteNode(quote) ? quote.getLastChild() : null;
            if ($isQuotedMarkdownTextNode(lastText)) {
                lastText.setTextContent(`${lastText.getTextContent()} **more**`);
            }
        }, {discrete: true});

        expect(readChannelsMarkdownForSubmit(editor).trimEnd()).toBe('> Diam sapien **more**');
    });

    test('should leave the message box alone when there is nothing to quote', () => {
        const editor = createTestEditor('original draft');

        expect(appendQuote(editor, '  \n \n')).toBe(false);

        expect(readChannelsMarkdownForSubmit(editor)).toBe('original draft');
    });
});

describe('blockquote Markdown export', () => {
    test('should write a blank line of a typed blockquote as a bare ">"', () => {
        const editor = createTestEditor('');

        editor.update(() => {
            const quote = $createQuoteNode();
            quote.append($createTextNode('first'), $createLineBreakNode(), $createLineBreakNode(), $createTextNode('third'));
            $getRoot().clear().append(quote);
        }, {discrete: true});

        expect(readChannelsMarkdownForSubmit(editor)).toBe('> first\n>\n> third');
    });
});
