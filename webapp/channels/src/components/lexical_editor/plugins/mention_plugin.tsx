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

import {Constants} from 'utils/constants';

import type {GlobalState} from 'types/store';

import {$createMentionNode} from '../nodes/mention_node';
import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

const groupLabels = defineMessages({
    members: {id: 'suggestion.mention.members', defaultMessage: 'Channel Members'},
    groups: {id: 'suggestion.search.group', defaultMessage: 'Group Mentions'},
    special: {id: 'suggestion.mention.special', defaultMessage: 'Special Mentions'},
    nonMembers: {id: 'suggestion.mention.nonmembers', defaultMessage: 'Not in Channel'},
});

type Props = {
    channelId: string;
    teamId?: string;
    useChannelMentions?: boolean;
    onMentionSelected?: (item: {id: string; username: string}) => void;
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
                    setQueryString(atMatch[1]);
                } else {
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
                        specialMentions.push({
                            id: `special-${name}`,
                            display: name,
                            description: name === 'here' ? 'Notifies everyone online' : name === 'channel' ? 'Notifies everyone in the channel' : 'Notifies everyone in the channel',
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
                            description: isCurrentUser ? '(you)' : `@${user.username}`,
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
        // 실제 username 추출 (display는 displayName일 수 있음)
        const mentionText = item.display;

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

            // @ 위치 찾기 (공백 뒤 또는 줄 시작)
            let atIndex = -1;
            for (let i = offset - 1; i >= 0; i--) {
                if (text[i] === '@') {
                    atIndex = i;
                    break;
                }
            }

            if (atIndex >= 0) {
                const beforeText = text.slice(0, atIndex);
                const afterText = text.slice(offset);

                anchorNode.setTextContent(beforeText);

                // 특별 멘션은 MentionNode 대신 텍스트로 삽입
                const isSpecial = item.id.startsWith('special-');
                const isGroup = item.id.startsWith('group-');

                if (isSpecial || isGroup) {
                    const textNode = $createTextNode(`@${mentionText} `);
                    if (beforeText) {
                        anchorNode.insertAfter(textNode);
                    } else {
                        anchorNode.replace(textNode);
                    }
                    if (afterText) {
                        const afterNode = $createTextNode(afterText);
                        textNode.insertAfter(afterNode);
                    }
                    textNode.selectEnd();
                } else {
                    const mentionNode = $createMentionNode(item.id, mentionText);
                    if (beforeText) {
                        anchorNode.insertAfter(mentionNode);
                    } else {
                        anchorNode.replace(mentionNode);
                    }

                    if (afterText) {
                        const textNode = $createTextNode(afterText);
                        mentionNode.insertAfter(textNode);
                    } else {
                        const spaceNode = $createTextNode(' ');
                        mentionNode.insertAfter(spaceNode);
                        spaceNode.select();
                    }
                }
            }
        });

        // description에서 @username 추출
        const usernameMatch = item.description?.match(/^@(\S+)$/);
        const username = usernameMatch ? usernameMatch[1] : mentionText;
        onMentionSelected?.({id: item.id, username});
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
        />
    );
}
