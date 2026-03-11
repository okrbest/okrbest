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

export type SerializedChannelMentionNode = Spread<
    {channelName: string; displayName: string},
    SerializedLexicalNode
>;

export class ChannelMentionNode extends DecoratorNode<React.ReactElement> {
    __channelName: string;
    __displayName: string;

    static getType(): string {
        return 'channel-mention';
    }

    static clone(node: ChannelMentionNode): ChannelMentionNode {
        return new ChannelMentionNode(node.__channelName, node.__displayName, node.__key);
    }

    constructor(channelName: string, displayName: string, key?: NodeKey) {
        super(key);
        this.__channelName = channelName;
        this.__displayName = displayName;
    }

    getChannelName(): string {
        return this.__channelName;
    }

    getDisplayName(): string {
        return this.__displayName;
    }

    getTextContent(): string {
        return `~${this.__displayName}`;
    }

    createDOM(): HTMLElement {
        const span = document.createElement('span');
        span.className = 'channel-mention-node';
        span.setAttribute('data-channel', this.__channelName);
        return span;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-channel')) {
                    return null;
                }
                return {
                    conversion: (element: HTMLElement): DOMConversionOutput | null => {
                        const channelName = element.getAttribute('data-channel');
                        const displayName = (element.textContent || '').replace(/^~/, '');
                        if (channelName) {
                            return {node: $createChannelMentionNode(channelName, displayName)};
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
        element.className = 'channel-mention-node';
        element.setAttribute('data-channel', this.__channelName);
        element.textContent = `~${this.__displayName}`;
        return {element};
    }

    static importJSON(serialized: SerializedChannelMentionNode): ChannelMentionNode {
        return $createChannelMentionNode(serialized.channelName, serialized.displayName);
    }

    exportJSON(): SerializedChannelMentionNode {
        return {
            ...super.exportJSON(),
            type: 'channel-mention',
            channelName: this.__channelName,
            displayName: this.__displayName,
            version: 1,
        };
    }

    decorate(): React.ReactElement {
        return React.createElement(
            'span',
            {className: 'channel-mention-node', 'data-channel': this.__channelName},
            `~${this.__displayName}`,
        );
    }

    isInline(): boolean {
        return true;
    }
}

export function $createChannelMentionNode(channelName: string, displayName: string): ChannelMentionNode {
    return new ChannelMentionNode(channelName, displayName);
}

export function $isChannelMentionNode(node: LexicalNode | null | undefined): node is ChannelMentionNode {
    return node instanceof ChannelMentionNode;
}
