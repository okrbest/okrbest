// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$createParagraphNode, $getRoot, $isTextNode, createEditor} from 'lexical';

import {$createQuotedMarkdownTextNode, $isQuotedMarkdownTextNode, QuotedMarkdownTextNode} from './quoted_markdown_text_node';

describe('QuotedMarkdownTextNode', () => {
    test('should hold the quoted Markdown as plain text', () => {
        const editor = createEditor({nodes: [QuotedMarkdownTextNode]});
        editor.update(() => {
            const node = $createQuotedMarkdownTextNode('**bold** `code`');

            expect($isQuotedMarkdownTextNode(node)).toBe(true);
            expect($isTextNode(node)).toBe(true);
            expect(node.getTextContent()).toBe('**bold** `code`');
            expect(node.getFormat()).toBe(0);
        }, {discrete: true});
    });

    test('should not treat a plain text node as quoted Markdown', () => {
        const editor = createEditor({nodes: [QuotedMarkdownTextNode]});
        editor.update(() => {
            const paragraph = $createParagraphNode();
            expect($isQuotedMarkdownTextNode(paragraph)).toBe(false);
        }, {discrete: true});
    });

    test('should survive a JSON round trip', () => {
        const editor = createEditor({nodes: [QuotedMarkdownTextNode]});
        editor.update(() => {
            const paragraph = $createParagraphNode();
            paragraph.append($createQuotedMarkdownTextNode('> - item'));
            $getRoot().clear().append(paragraph);
        }, {discrete: true});

        const json = JSON.stringify(editor.getEditorState().toJSON());
        expect(json).toContain('"type":"quoted-markdown-text"');

        const restored = createEditor({nodes: [QuotedMarkdownTextNode]});
        restored.setEditorState(restored.parseEditorState(json));
        restored.getEditorState().read(() => {
            const node = $getRoot().getFirstDescendant();
            expect($isQuotedMarkdownTextNode(node)).toBe(true);
            expect(node?.getTextContent()).toBe('> - item');
        });
    });
});
