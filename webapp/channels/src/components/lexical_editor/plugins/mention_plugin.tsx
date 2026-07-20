import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import type {UserProfile} from '@mattermost/types/users';
import type {Group} from '@mattermost/types/groups';

import {getChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import {getTeammateNameDisplaySetting} from 'mattermost-redux/selectors/entities/preferences';
import {displayUsername} from 'mattermost-redux/utils/user_utils';

import {autocompleteUsersInChannel} from 'actions/views/channel';
import {searchAssociatedGroupsForReference} from 'actions/views/group';

import Avatar from 'components/widgets/users/avatar';

import {Constants} from 'utils/constants';
import {imageURLForUser} from 'utils/utils';

import type {GlobalState} from 'types/store';

import {$createMentionNode} from '../nodes/mention_node';
import {applyMentionReplacement} from '../utils/apply_mention_replacement';
import {addMentionBoundarySpace} from '../utils/mention_boundary';
import type {PendingMentionMatch} from '../utils/mention_replace';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

const MENTION_PREFIX_PATTERN = /^[\p{L}\d\-_. ]*/u;

const groupLabels = defineMessages({
    members: {id: 'suggestion.mention.members', defaultMessage: 'Channel Members'},
    groups: {id: 'suggestion.search.group', defaultMessage: 'Group Mentions'},
    special: {id: 'suggestion.mention.special', defaultMessage: 'Special Mentions'},
    nonMembers: {id: 'suggestion.mention.nonmembers', defaultMessage: 'Not in Channel'},
    specialHere: {id: 'suggestion.mention.here', defaultMessage: 'Notifies everyone online in this channel'},
    specialChannel: {id: 'suggestion.mention.channel', defaultMessage: 'Notifies everyone in this channel'},
    specialAll: {id: 'suggestion.mention.all', defaultMessage: 'Notifies everyone in this channel'},
    you: {id: 'suggestion.user.isCurrent', defaultMessage: '(you)'},
});

type Props = {
    channelId: string;
    teamId?: string;
    useChannelMentions?: boolean;
    onMentionSelected?: (item: {id: string; username: string; displayName?: string}) => void;
};

export default function MentionPlugin({channelId, teamId, useChannelMentions = true, onMentionSelected}: Props) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const {formatMessage} = useIntl();

    const dispatch = useDispatch();
    const currentUserId = useSelector(getCurrentUserId);
    const teammateNameDisplay = useSelector(getTeammateNameDisplaySetting);
    const channel = useSelector((state: GlobalState) => getChannel(state, channelId));
    const isDMorGM = channel && (channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL);
    const pendingMatchRef = useRef<PendingMentionMatch | null>(null);

    const scheduleSelect = useCallback((run: () => void) => {
        editor.focus();
        requestAnimationFrame(() => {
            requestAnimationFrame(run);
        });
    }, [editor]);

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
                const atMatch = text.match(/(?:^|\s)@([\p{L}\d\-_. ]*)$/iu);

                if (atMatch) {
                    const prefix = atMatch[1];
                    const triggerOffset = text.lastIndexOf('@');
                    pendingMatchRef.current = {
                        triggerKey: anchorNode.getKey(),
                        triggerOffset,
                        prefix,
                    };
                    setQueryString(prefix);
                } else {
                    pendingMatchRef.current = null;
                    setQueryString(null);
                }
            });
        });
    }, [editor]);

    // 검색 refs
    const channelIdRef = useRef(channelId);
    channelIdRef.current = channelId;
    const teamIdRef = useRef(teamId);
    teamIdRef.current = teamId;

    // 검색
    useEffect(() => {
        if (queryString === null) {
            setSuggestions([]);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            const prefix = queryString;

            // 특별 멘션 (@here, @channel, @all)
            const specialMentions: SuggestionItem[] = [];
            if (useChannelMentions) {
                ['here', 'channel', 'all'].
                    filter((name) => name.startsWith(prefix.toLowerCase())).
                    forEach((name) => {
                        const descriptionKey = name === 'here' ? groupLabels.specialHere : name === 'channel' ? groupLabels.specialChannel : groupLabels.specialAll;
                        specialMentions.push({
                            id: `special-${name}`,
                            display: name,
                            description: formatMessage(descriptionKey),
                            icon: <i className='icon icon-account-multiple-outline'/>,
                            group: formatMessage(groupLabels.special),
                        });
                    });
            }

            // 서버에서 사용자 검색
            try {
                const result = await dispatch(autocompleteUsersInChannel(prefix, channelIdRef.current) as any);
                if (cancelled) {
                    return;
                }

                const data = result?.data;
                const members: SuggestionItem[] = [];
                const nonMembers: SuggestionItem[] = [];

                if (data) {
                    // 채널 멤버
                    (data.users || []).forEach((user: UserProfile) => {
                        const name = displayUsername(user, teammateNameDisplay);
                        const isCurrentUser = user.id === currentUserId;
                        members.push({
                            id: user.id,
                            display: name,
                            description: isCurrentUser ? formatMessage(groupLabels.you) : `@${user.username}`,
                            username: user.username,
                            icon: (
                                <Avatar
                                    size='sm'
                                    username={user.username}
                                    url={imageURLForUser(user.id, user.last_picture_update)}
                                />
                            ),
                            group: formatMessage(groupLabels.members),
                        });
                    });

                    // 채널 외 사용자 (DM/GM에서는 표시하지 않음)
                    if (!isDMorGM) {
                        (data.out_of_channel || []).forEach((user: UserProfile) => {
                            const name = displayUsername(user, teammateNameDisplay);
                            nonMembers.push({
                                id: user.id,
                                display: name,
                                description: `@${user.username}`,
                                username: user.username,
                                icon: (
                                    <Avatar
                                        size='sm'
                                        username={user.username}
                                        url={imageURLForUser(user.id, user.last_picture_update)}
                                    />
                                ),
                                group: formatMessage(groupLabels.nonMembers),
                            });
                        });
                    }
                }

                // 그룹 멘션 검색
                let groupItems: SuggestionItem[] = [];
                if (teamIdRef.current) {
                    try {
                        const groupResult = await dispatch(searchAssociatedGroupsForReference(prefix, teamIdRef.current, channelIdRef.current) as any);
                        if (!cancelled && groupResult?.data) {
                            groupItems = (groupResult.data as Group[]).
                                filter((g) => g.name.toLowerCase().includes(prefix.toLowerCase()) || g.display_name.toLowerCase().includes(prefix.toLowerCase())).
                                sort((a, b) => a.name.localeCompare(b.name)).
                                slice(0, 25).
                                map((g) => ({
                                    id: `group-${g.id}`,
                                    display: g.name,
                                    description: `${g.display_name} (${g.member_count || 0})`,
                                    icon: <i className='icon icon-account-multiple-outline'/>,
                                    group: formatMessage(groupLabels.groups),
                                }));
                        }
                    } catch {
                        // 그룹 검색 실패 시 무시
                    }
                }

                if (!cancelled) {
                    setSuggestions([...members, ...groupItems, ...specialMentions, ...nonMembers]);
                }
            } catch {
                if (!cancelled) {
                    setSuggestions([...specialMentions]);
                }
            }
        }, 200);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [queryString, dispatch, currentUserId, teammateNameDisplay, isDMorGM, useChannelMentions, formatMessage]);

    const handleSelect = useCallback((item: SuggestionItem) => {
        const mentionText = item.display;
        const pendingMatch = pendingMatchRef.current;
        // item.username이 있으면 사용 (본인 멘션 시 description이 '(you)'여서 필요)
        const usernameMatch = item.description?.match(/^@(\S+)$/);
        const username = item.username ?? (usernameMatch ? usernameMatch[1] : mentionText);

        const isSpecial = item.id.startsWith('special-');
        const isGroup = item.id.startsWith('group-');

        editor.update(() => {
            applyMentionReplacement({
                pendingMatch,
                fallbackQueryPrefix: queryString ?? '',
                prefixCharPattern: MENTION_PREFIX_PATTERN,
                triggerChar: '@',
                createNodesToInsert: (afterText) => {
                    const normalizedAfterText = addMentionBoundarySpace(afterText);
                    if (isSpecial || isGroup) {
                        const textNode = $createTextNode(`@${mentionText} `);
                        return normalizedAfterText ? [textNode, $createTextNode(normalizedAfterText)] : [textNode];
                    }
                    const mentionNode = $createMentionNode(username, mentionText);
                    return normalizedAfterText ?
                        [mentionNode, $createTextNode(normalizedAfterText)] :
                        [mentionNode, $createTextNode(' ')];
                },
            });
        });

        pendingMatchRef.current = null;
        onMentionSelected?.({id: item.id, username, displayName: mentionText});
        setQueryString(null);
    }, [editor, onMentionSelected, queryString]);

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
        />
    );
}
