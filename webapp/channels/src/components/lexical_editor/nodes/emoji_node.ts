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
import {useSelector} from 'react-redux';

import {getEmojiImageUrl} from 'mattermost-redux/utils/emoji_utils';

import {getEmojiMap} from 'selectors/emojis';

import type {GlobalState} from 'types/store';

export type SerializedEmojiNode = Spread<
    {emojiName: string; emojiUnicode: string; emojiImageUrl?: string},
    SerializedLexicalNode
>;

const COMPOSER_EMOJI_SIZE = 18;

function getCustomEmojiSpanStyle(imageUrl: string): React.CSSProperties {
    return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'inline-block',
        verticalAlign: 'text-bottom',
        height: COMPOSER_EMOJI_SIZE,
        width: COMPOSER_EMOJI_SIZE,
        maxHeight: COMPOSER_EMOJI_SIZE,
        maxWidth: COMPOSER_EMOJI_SIZE,
        minHeight: COMPOSER_EMOJI_SIZE,
        minWidth: COMPOSER_EMOJI_SIZE,
        overflow: 'hidden',
    };
}

function createCustomEmojiImageSpan(emojiName: string, imageUrl: string): React.ReactElement {
    return React.createElement(
        'span',
        {
            className: 'emoticon',
            'data-emoticon': emojiName,
            role: 'img',
            'aria-label': `:${emojiName}:`,
            style: getCustomEmojiSpanStyle(imageUrl),
        },
    );
}

function LexicalCustomEmojiDecorator({emojiName, emojiImageUrl}: {emojiName: string; emojiImageUrl: string}) {
    const emojiMap = useSelector((state: GlobalState) => getEmojiMap(state));

    if (emojiImageUrl) {
        return createCustomEmojiImageSpan(emojiName, emojiImageUrl);
    }

    const emojiFromMap = emojiMap.get(emojiName);
    if (emojiFromMap) {
        return createCustomEmojiImageSpan(emojiName, getEmojiImageUrl(emojiFromMap));
    }

    return React.createElement(
        'span',
        {className: 'emoji-node', 'data-emoticon': emojiName},
        `:${emojiName}:`,
    );
}

export class EmojiNode extends DecoratorNode<React.ReactElement> {
    __emojiName: string;
    __emojiUnicode: string;
    __emojiImageUrl: string;

    static getType(): string {
        return 'emoji';
    }

    static clone(node: EmojiNode): EmojiNode {
        return new EmojiNode(node.__emojiName, node.__emojiUnicode, node.__emojiImageUrl, node.__key);
    }

    constructor(emojiName: string, emojiUnicode: string, emojiImageUrl = '', key?: NodeKey) {
        super(key);
        this.__emojiName = emojiName;
        this.__emojiUnicode = emojiUnicode;
        this.__emojiImageUrl = emojiImageUrl;
    }

    getEmojiName(): string {
        return this.__emojiName;
    }

    getEmojiImageUrl(): string {
        return this.__emojiImageUrl;
    }

    isCustomEmoji(): boolean {
        return this.__emojiUnicode === '';
    }

    getTextContent(): string {
        if (this.isCustomEmoji()) {
            return `:${this.__emojiName}:`;
        }
        return this.__emojiUnicode;
    }

    createDOM(): HTMLElement {
        const span = document.createElement('span');
        if (this.isCustomEmoji()) {
            span.className = 'emoticon';
            span.setAttribute('data-emoticon', this.__emojiName);
        } else {
            span.className = 'emoji-node';
            span.setAttribute('data-emoji', this.__emojiName);
        }
        return span;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (domNode.hasAttribute('data-emoji')) {
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
                }
                if (domNode.hasAttribute('data-emoticon')) {
                    return {
                        conversion: (element: HTMLElement): DOMConversionOutput | null => {
                            const emojiName = element.getAttribute('data-emoticon');
                            if (emojiName) {
                                return {node: $createEmojiNode(emojiName, '')};
                            }
                            return null;
                        },
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('span');
        if (this.isCustomEmoji()) {
            element.className = 'emoticon';
            element.setAttribute('data-emoticon', this.__emojiName);
            if (this.__emojiImageUrl) {
                element.style.backgroundImage = `url(${this.__emojiImageUrl})`;
                element.style.backgroundSize = 'contain';
                element.style.backgroundRepeat = 'no-repeat';
                element.style.backgroundPosition = 'center';
                element.style.display = 'inline-block';
                element.style.height = `${COMPOSER_EMOJI_SIZE}px`;
                element.style.width = `${COMPOSER_EMOJI_SIZE}px`;
            }
        } else {
            element.className = 'emoji-node';
            element.setAttribute('data-emoji', this.__emojiName);
            element.textContent = this.__emojiUnicode;
        }
        return {element};
    }

    static importJSON(serialized: SerializedEmojiNode): EmojiNode {
        return $createEmojiNode(serialized.emojiName, serialized.emojiUnicode, serialized.emojiImageUrl ?? '');
    }

    exportJSON(): SerializedEmojiNode {
        return {
            ...super.exportJSON(),
            type: 'emoji',
            emojiName: this.__emojiName,
            emojiUnicode: this.__emojiUnicode,
            emojiImageUrl: this.__emojiImageUrl,
            version: 1,
        };
    }

    decorate(): React.ReactElement {
        if (this.isCustomEmoji()) {
            if (this.__emojiImageUrl) {
                return createCustomEmojiImageSpan(this.__emojiName, this.__emojiImageUrl);
            }
            return React.createElement(LexicalCustomEmojiDecorator, {
                emojiName: this.__emojiName,
                emojiImageUrl: this.__emojiImageUrl,
            });
        }
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

export function $createEmojiNode(emojiName: string, emojiUnicode: string, emojiImageUrl = ''): EmojiNode {
    return new EmojiNode(emojiName, emojiUnicode, emojiImageUrl);
}

export function $isEmojiNode(node: LexicalNode | null | undefined): node is EmojiNode {
    return node instanceof EmojiNode;
}
