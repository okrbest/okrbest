import React, {useCallback, useEffect, useState} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import {$createMentionNode} from '../nodes/mention_node';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

type Props = {
    channelId: string;
    onMentionSelected?: (item: {id: string; username: string}) => void;
    searchUsers: (term: string) => Promise<Array<{id: string; username: string; first_name: string; last_name: string}>>;
};

export default function MentionPlugin({channelId, onMentionSelected, searchUsers}: Props) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

    // @ 입력 감지
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
                const atMatch = text.match(/@(\w*)$/);

                if (atMatch) {
                    setQueryString(atMatch[1]);
                } else {
                    setQueryString(null);
                }
            });
        });
    }, [editor]);

    // 검색 (debounce + cancellation)
    useEffect(() => {
        if (queryString === null) {
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            searchUsers(queryString).then((users) => {
                if (!cancelled) {
                    setSuggestions(
                        users.map((user) => ({
                            id: user.id,
                            display: user.username,
                            description: `${user.first_name} ${user.last_name}`.trim(),
                        })),
                    );
                }
            });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [queryString, searchUsers]);

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
            const atIndex = text.lastIndexOf('@', offset - 1);

            if (atIndex >= 0) {
                const beforeText = text.slice(0, atIndex);
                const afterText = text.slice(offset);

                anchorNode.setTextContent(beforeText);

                const mentionNode = $createMentionNode(item.id, item.display);
                anchorNode.insertAfter(mentionNode);

                if (afterText) {
                    const textNode = $createTextNode(afterText);
                    mentionNode.insertAfter(textNode);
                } else {
                    const spaceNode = $createTextNode(' ');
                    mentionNode.insertAfter(spaceNode);
                    spaceNode.select();
                }
            }
        });

        onMentionSelected?.({id: item.id, username: item.display});
        setQueryString(null);
    }, [editor, onMentionSelected]);

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
            header="Users"
        />
    );
}
