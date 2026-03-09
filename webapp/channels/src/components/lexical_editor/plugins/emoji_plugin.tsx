import React, {useCallback, useEffect, useState} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import {$createEmojiNode} from '../nodes/emoji_node';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

const MIN_QUERY_LENGTH = 2;

type EmojiResult = {
    name: string;
    unicode: string;
};

type Props = {
    searchEmojis?: (term: string) => EmojiResult[];
};

export default function EmojiPlugin({searchEmojis}: Props) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

    // : 입력 감지
    useEffect(() => {
        return editor.registerTextContentListener(() => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const anchor = selection.anchor;
                const anchorNode = anchor.getNode();

                if (!(anchorNode instanceof TextNode)) {
                    setQueryString(null);
                    return;
                }

                const text = anchorNode.getTextContent().slice(0, anchor.offset);
                const emojiMatch = text.match(/:(\w{2,})$/);

                if (emojiMatch && emojiMatch[1].length >= MIN_QUERY_LENGTH) {
                    setQueryString(emojiMatch[1]);
                } else {
                    setQueryString(null);
                }
            });
        });
    }, [editor]);

    // 검색
    useEffect(() => {
        if (queryString === null || !searchEmojis) {
            return;
        }

        const results = searchEmojis(queryString);
        setSuggestions(
            results.slice(0, 20).map((emoji) => ({
                id: emoji.name,
                display: `:${emoji.name}:`,
                description: emoji.unicode,
                icon: React.createElement('span', {className: 'emoji-suggestion-icon'}, emoji.unicode),
            })),
        );
    }, [queryString, searchEmojis]);

    const handleSelect = useCallback((item: SuggestionItem) => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }

            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();

            if (!(anchorNode instanceof TextNode)) {
                return;
            }

            const text = anchorNode.getTextContent();
            const offset = anchor.offset;
            const colonIndex = text.lastIndexOf(':', offset - 1);

            if (colonIndex >= 0) {
                const beforeText = text.slice(0, colonIndex);
                const afterText = text.slice(offset);

                anchorNode.setTextContent(beforeText);

                const emojiNode = $createEmojiNode(item.id, item.description || '');
                anchorNode.insertAfter(emojiNode);

                if (afterText) {
                    const textNode = $createTextNode(afterText);
                    emojiNode.insertAfter(textNode);
                } else {
                    const spaceNode = $createTextNode(' ');
                    emojiNode.insertAfter(spaceNode);
                    spaceNode.select();
                }
            }
        });

        setQueryString(null);
    }, [editor]);

    const handleClose = useCallback(() => {
        setQueryString(null);
    }, []);

    if (queryString === null) {
        return null;
    }

    return (
        <SuggestionList
            items={suggestions}
            onSelect={handleSelect}
            onClose={handleClose}
            header="Emoji"
        />
    );
}
