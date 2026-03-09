import React from 'react';
import {
    DecoratorNode,
    type DOMConversionMap,
    type DOMConversionOutput,
    type DOMExportOutput,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from 'lexical';

export type SerializedEmojiNode = Spread<
    {emojiName: string; emojiUnicode: string},
    SerializedLexicalNode
>;

export class EmojiNode extends DecoratorNode<React.ReactElement> {
    __emojiName: string;
    __emojiUnicode: string;

    static getType(): string {
        return 'emoji';
    }

    static clone(node: EmojiNode): EmojiNode {
        return new EmojiNode(node.__emojiName, node.__emojiUnicode, node.__key);
    }

    constructor(emojiName: string, emojiUnicode: string, key?: NodeKey) {
        super(key);
        this.__emojiName = emojiName;
        this.__emojiUnicode = emojiUnicode;
    }

    getEmojiName(): string {
        return this.__emojiName;
    }

    getTextContent(): string {
        return this.__emojiUnicode;
    }

    createDOM(): HTMLElement {
        const span = document.createElement('span');
        span.className = 'emoji-node';
        span.setAttribute('data-emoji', this.__emojiName);
        return span;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-emoji')) {
                    return null;
                }
                return {
                    conversion: (element: HTMLElement): DOMConversionOutput | null => {
                        const emojiName = element.getAttribute('data-emoji');
                        const emojiUnicode = element.textContent || '';
                        if (emojiName) {
                            return {node: $createEmojiNode(emojiName, emojiUnicode)};
                        }
                        return null;
                    },
                    priority: 1,
                };
            },
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('span');
        element.className = 'emoji-node';
        element.setAttribute('data-emoji', this.__emojiName);
        element.textContent = this.__emojiUnicode;
        return {element};
    }

    static importJSON(serialized: SerializedEmojiNode): EmojiNode {
        return $createEmojiNode(serialized.emojiName, serialized.emojiUnicode);
    }

    exportJSON(): SerializedEmojiNode {
        return {
            ...super.exportJSON(),
            type: 'emoji',
            emojiName: this.__emojiName,
            emojiUnicode: this.__emojiUnicode,
            version: 1,
        };
    }

    decorate(): React.ReactElement {
        return React.createElement(
            'span',
            {
                className: 'emoji-node',
                'data-emoji': this.__emojiName,
                role: 'img',
                'aria-label': this.__emojiName,
            },
            this.__emojiUnicode,
        );
    }

    isInline(): boolean {
        return true;
    }
}

export function $createEmojiNode(emojiName: string, emojiUnicode: string): EmojiNode {
    return new EmojiNode(emojiName, emojiUnicode);
}

export function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode {
    return node instanceof EmojiNode;
}
