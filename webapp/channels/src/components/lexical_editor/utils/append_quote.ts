// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$createQuoteNode} from '@lexical/rich-text';
import {$createLineBreakNode, $createParagraphNode, $getRoot, $isParagraphNode} from 'lexical';

import {formatQuote} from 'utils/quote';

import {$createQuotedMarkdownTextNode} from '../nodes/quoted_markdown_text_node';

function $isEditorEmpty(): boolean {
    const root = $getRoot();
    const first = root.getFirstChild();

    return root.getChildrenSize() === 0 || (root.getChildrenSize() === 1 && $isParagraphNode(first) && first.isEmpty());
}

/**
 * okrbest: the Lexical counterpart of upstream's WysiwygEditorHandle.appendQuote (caaec8cd). Appends the
 * Markdown as a blockquote at the end of the document, followed by an empty paragraph that receives the
 * caret. The lines are taken from formatQuote so that the post gets the same Markdown upstream sends.
 *
 * Must be called inside editor.update(). Returns whether anything was inserted.
 */
export function $appendQuote(markdown: string): boolean {
    const quote = formatQuote(markdown);
    if (!quote) {
        return false;
    }

    // formatQuote writes "> line", or ">" for a blank line
    const lines = quote.split('\n').map((line) => (line === '>' ? '' : line.slice(2)));

    const quoteNode = $createQuoteNode();
    lines.forEach((line, index) => {
        if (index > 0) {
            quoteNode.append($createLineBreakNode());
        }
        if (line) {
            quoteNode.append($createQuotedMarkdownTextNode(line));
        }
    });

    const paragraph = $createParagraphNode();
    const root = $getRoot();
    if ($isEditorEmpty()) {
        root.clear();
    }
    root.append(quoteNode, paragraph);
    paragraph.select();

    return true;
}
