// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$applyNodeReplacement, TextNode} from 'lexical';
import type {LexicalNode, NodeKey, SerializedTextNode} from 'lexical';

/**
 * okrbest: Markdown quoted from a post (upstream caaec8cd quotes into Textbox/TipTap, which we don't have).
 * Its text is the Markdown itself, written to the post as is: a plain TextNode would have its `*`, `_`
 * and backticks escaped on export (see QUOTED_MARKDOWN_TEXT in config/markdown_transformers.ts).
 */
export class QuotedMarkdownTextNode extends TextNode {
    static getType(): string {
        return 'quoted-markdown-text';
    }

    static clone(node: QuotedMarkdownTextNode): QuotedMarkdownTextNode {
        return new QuotedMarkdownTextNode(node.getTextContent(), node.getKey());
    }

    constructor(text = '', key?: NodeKey) {
        super(text, key);
    }

    static importJSON(serializedNode: SerializedTextNode): QuotedMarkdownTextNode {
        return $createQuotedMarkdownTextNode().updateFromJSON(serializedNode);
    }
}

export function $createQuotedMarkdownTextNode(text = ''): QuotedMarkdownTextNode {
    return $applyNodeReplacement(new QuotedMarkdownTextNode(text));
}

export function $isQuotedMarkdownTextNode(node: LexicalNode | null | undefined): node is QuotedMarkdownTextNode {
    return node instanceof QuotedMarkdownTextNode;
}
