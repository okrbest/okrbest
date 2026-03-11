import React, {useCallback, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import {Constants} from 'utils/constants';

import {$createChannelMentionNode} from '../nodes/channel_mention_node';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

type ChannelResult = {
    id: string;
    name: string;
    display_name: string;
    type?: string;
};

type Props = {
    searchChannels: (term: string) => Promise<ChannelResult[]>;
};

function getChannelIcon(type?: string) {
    if (type === Constants.PRIVATE_CHANNEL) {
        return <i className='icon icon-lock-outline'/>;
    }
    return <i className='icon icon-globe'/>;
}

export default function ChannelMentionPlugin({searchChannels}: Props) {
    const [editor] = useLexicalComposerContext();
    const {formatMessage} = useIntl();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

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
                    setQueryString(null);
                    return;
                }

                const text = anchorNode.getTextContent().slice(0, anchor.offset);
                const channelMatch = text.match(/~(\w*)$/);

                if (channelMatch) {
                    setQueryString(channelMatch[1]);
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
            searchChannels(queryString).then((channels) => {
                if (!cancelled) {
                    setSuggestions(
                        channels.map((channel) => ({
                            id: channel.id,
                            display: channel.name,
                            description: channel.display_name,
                            icon: getChannelIcon(channel.type),
                        })),
                    );
                }
            });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
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
                    const textNode = $createTextNode(afterText);
                    channelNode.insertAfter(textNode);
                } else {
                    const spaceNode = $createTextNode(' ');
                    channelNode.insertAfter(spaceNode);
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
            header={formatMessage({id: 'suggestion.channels', defaultMessage: 'Channels'})}
        />
    );
}
