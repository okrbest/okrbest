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

export type SerializedMentionNode = Spread<
    {username: string; displayName: string},
    SerializedLexicalNode
>;

export class MentionNode extends DecoratorNode<React.ReactElement> {
    __username: string;
    __displayName: string;

    static getType(): string {
        return 'mention';
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__username, node.__displayName, node.__key);
    }

    constructor(username: string, displayName: string, key?: NodeKey) {
        super(key);
        this.__username = username;
        this.__displayName = displayName;
    }

    getUsername(): string {
        return this.__username;
    }

    getDisplayName(): string {
        return this.__displayName;
    }

    getTextContent(): string {
        return `@${this.__displayName}`;
    }

    createDOM(): HTMLElement {
        const span = document.createElement('span');
        span.className = 'mention-node';
        span.setAttribute('data-mention', this.__username);
        return span;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-mention')) {
                    return null;
                }
                return {
                    conversion: (element: HTMLElement): DOMConversionOutput | null => {
                        const username = element.getAttribute('data-mention');
                        const displayName = (element.textContent || '').replace(/^@/, '');
                        if (username) {
                            return {node: $createMentionNode(username, displayName)};
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
        element.className = 'mention-node';
        element.setAttribute('data-mention', this.__username);
        element.textContent = `@${this.__displayName}`;
        return {element};
    }

    static importJSON(serialized: SerializedMentionNode): MentionNode {
        return $createMentionNode(serialized.username, serialized.displayName);
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            type: 'mention',
            username: this.__username,
            displayName: this.__displayName,
            version: 1,
        };
    }

    decorate(): React.ReactElement {
        return React.createElement(
            'span',
            {className: 'mention-node', 'data-mention': this.__username},
            `@${this.__displayName}`,
        );
    }

    isInline(): boolean {
        return true;
    }
}

export function $createMentionNode(username: string, displayName: string): MentionNode {
    return new MentionNode(username, displayName);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
    return node instanceof MentionNode;
}
