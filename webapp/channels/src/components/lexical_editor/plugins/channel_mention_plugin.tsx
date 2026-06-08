// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import {getMyChannels} from 'mattermost-redux/selectors/entities/channels';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {sortChannelsByTypeAndDisplayName} from 'mattermost-redux/utils/channel_utils';

import {MIN_CHANNEL_LINK_LENGTH} from 'components/suggestion/channel_mention_provider';

import {filterChannelsForMentionPrefix} from 'utils/channel_mention_filter';
import {Constants} from 'utils/constants';

import type {GlobalState} from 'types/store';

import {$createChannelMentionNode} from '../nodes/channel_mention_node';
import {applyMentionReplacement} from '../utils/apply_mention_replacement';
import type {PendingMentionMatch} from '../utils/mention_replace';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

const CHANNEL_PREFIX_PATTERN = /^[^~\r\n]*/;

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

function channelsToSuggestionItems(channels: ChannelResult[]): SuggestionItem[] {
    return channels.map((channel) => ({
        id: channel.id,
        display: channel.display_name,
        description: `~${channel.name}`,
        channelName: channel.name,
        icon: getChannelIcon(channel.type),
    }));
}

function mergeChannelResults(primary: ChannelResult[], additional: ChannelResult[]): ChannelResult[] {
    const seen = new Set(primary.map((c) => c.id));
    const merged = [...primary];
    additional.forEach((channel) => {
        if (!seen.has(channel.id)) {
            seen.add(channel.id);
            merged.push(channel);
        }
    });
    return merged;
}

export default function ChannelMentionPlugin({searchChannels}: Props) {
    const [editor] = useLexicalComposerContext();
    const {formatMessage} = useIntl();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const searchRequestIdRef = useRef(0);
    const pendingMatchRef = useRef<PendingMentionMatch | null>(null);

    const delayChannelAutocomplete = useSelector(
        (state: GlobalState) => getConfig(state).DelayChannelAutocomplete === 'true',
    );
    const myChannels = useSelector(getMyChannels);

    const scheduleSelect = useCallback((run: () => void) => {
        editor.focus();
        requestAnimationFrame(() => {
            requestAnimationFrame(run);
        });
    }, [editor]);

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
                const channelMatch = text.match(/\B~([^~\r\n]*)$/i);

                if (!channelMatch) {
                    pendingMatchRef.current = null;
                    setQueryString(null);
                    return;
                }

                const prefix = channelMatch[1];
                if (delayChannelAutocomplete && prefix.length < MIN_CHANNEL_LINK_LENGTH) {
                    pendingMatchRef.current = null;
                    setQueryString(null);
                    return;
                }

                const tildeIndex = text.lastIndexOf('~');
                pendingMatchRef.current = {
                    triggerKey: anchorNode.getKey(),
                    triggerOffset: tildeIndex,
                    prefix,
                };
                setQueryString(prefix);
            });
        });
    }, [editor, delayChannelAutocomplete]);

    // 검색 (동기 내 채널 필터 + debounced API)
    useEffect(() => {
        if (queryString === null) {
            setSuggestions([]);
            return undefined;
        }

        const requestId = ++searchRequestIdRef.current;
        const prefix = queryString;

        const filteredMyChannels = filterChannelsForMentionPrefix(
            myChannels.filter(
                (channel) => channel.type === Constants.OPEN_CHANNEL && channel.delete_at === 0,
            ),
            prefix,
        ).sort((a, b) => sortChannelsByTypeAndDisplayName('en', a, b));

        setSuggestions(channelsToSuggestionItems(filteredMyChannels));

        const timer = setTimeout(() => {
            searchChannels(prefix).then((channels) => {
                if (requestId !== searchRequestIdRef.current) {
                    return;
                }

                const filteredApi = filterChannelsForMentionPrefix(channels, prefix);
                const merged = mergeChannelResults(filteredMyChannels, filteredApi);
                setSuggestions(channelsToSuggestionItems(merged));
            });
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [queryString, searchChannels, myChannels]);

    const handleSelect = useCallback((item: SuggestionItem) => {
        const pendingMatch = pendingMatchRef.current;

        editor.update(() => {
            const channelSlug = item.channelName ?? item.description?.replace(/^~/, '');
            if (!channelSlug) {
                return;
            }

            applyMentionReplacement({
                pendingMatch,
                fallbackQueryPrefix: queryString ?? '',
                prefixCharPattern: CHANNEL_PREFIX_PATTERN,
                triggerChar: '~',
                createNodesToInsert: (afterText) => {
                    const channelNode = $createChannelMentionNode(channelSlug, item.display);
                    return afterText ? [channelNode, $createTextNode(afterText)] : [channelNode, $createTextNode(' ')];
                },
            });
        });

        pendingMatchRef.current = null;
        setQueryString(null);
    }, [editor, queryString]);

    const handleClose = useCallback(() => {
        pendingMatchRef.current = null;
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
            scheduleSelect={scheduleSelect}
            header={formatMessage({id: 'suggestion.channels', defaultMessage: 'Channels'})}
        />
    );
}
