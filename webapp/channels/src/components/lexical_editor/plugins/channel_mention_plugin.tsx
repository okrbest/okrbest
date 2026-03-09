import React, {useCallback, useEffect, useState} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import {$createChannelMentionNode} from '../nodes/channel_mention_node';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

type Props = {
    searchChannels: (term: string) => Promise<Array<{id: string; name: string; display_name: string}>>;
};

export default function ChannelMentionPlugin({searchChannels}: Props) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // ~ 입력 감지
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
                    setIsOpen(false);
                    return;
                }

                const text = anchorNode.getTextContent().slice(0, anchor.offset);
                const channelMatch = text.match(/~(\w*)$/);

                if (channelMatch) {
                    setQueryString(channelMatch[1]);
                    setIsOpen(true);
                } else {
                    setIsOpen(false);
                    setQueryString(null);
                }
            });
        });
    }, [editor]);

    // 검색
    useEffect(() => {
        if (queryString === null) {
            return;
        }

        searchChannels(queryString).then((channels) => {
            setSuggestions(
                channels.map((channel) => ({
                    id: channel.id,
                    display: channel.name,
                    description: channel.display_name,
                })),
            );
        });
    }, [queryString, searchChannels]);

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
            const tildeIndex = text.lastIndexOf('~', offset - 1);

            if (tildeIndex >= 0) {
                const beforeText = text.slice(0, tildeIndex);
                const afterText = text.slice(offset);

                anchorNode.setTextContent(beforeText);

                const channelNode = $createChannelMentionNode(item.id, item.display);
                anchorNode.insertAfter(channelNode);

                if (afterText) {
                    const textNode = new TextNode(afterText);
                    channelNode.insertAfter(textNode);
                } else {
                    const spaceNode = new TextNode(' ');
                    channelNode.insertAfter(spaceNode);
                    spaceNode.select();
                }
            }
        });

        setIsOpen(false);
        setQueryString(null);
    }, [editor]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setQueryString(null);
    }, []);

    if (!isOpen) {
        return null;
    }

    return (
        <SuggestionList
            items={suggestions}
            onSelect={handleSelect}
            onClose={handleClose}
            header="Channels"
        />
    );
}
