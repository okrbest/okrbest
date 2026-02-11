// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {CommandArgs} from '@mattermost/types/integrations';
import type {Post, PostMetadata} from '@mattermost/types/posts';
import type {SchedulingInfo} from '@mattermost/types/schedule_post';
import {scheduledPostFromPost} from '@mattermost/types/schedule_post';

import type {CreatePostReturnType, SubmitReactionReturnType} from 'mattermost-redux/actions/posts';
import {addMessageIntoHistory} from 'mattermost-redux/actions/posts';
import {Permissions} from 'mattermost-redux/constants';
import {PostTypes} from 'mattermost-redux/constants/posts';
import {getChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCustomEmojisByName} from 'mattermost-redux/selectors/entities/emojis';
import {getLicense} from 'mattermost-redux/selectors/entities/general';
import {getAssociatedGroupsForReferenceByMention} from 'mattermost-redux/selectors/entities/groups';
import {
    getLatestInteractablePostId,
    getLatestPostToEdit,
} from 'mattermost-redux/selectors/entities/posts';
import {isCustomGroupsEnabled} from 'mattermost-redux/selectors/entities/preferences';
import {haveIChannelPermission} from 'mattermost-redux/selectors/entities/roles';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import type {ExecuteCommandReturnType} from 'actions/command';
import {executeCommand} from 'actions/command';
import {runMessageWillBePostedHooks, runSlashCommandWillBePostedHooks} from 'actions/hooks';
import * as PostActions from 'actions/post_actions';
import {createSchedulePostFromDraft} from 'actions/post_actions';
import {isBurnOnReadEnabled} from 'selectors/burn_on_read';

import EmojiMap from 'utils/emoji_map';
import {containsAtChannel, groupsMentionedInText} from 'utils/post_utils';
import * as Utils from 'utils/utils';

import type {ActionFunc, ActionFuncAsync, GlobalState} from 'types/store';
import type {PostDraft, MentionMapping} from 'types/store/draft';

/**
 * 메시지 내의 @displayname을 @username으로 변환합니다.
 * mentionMappings에 저장된 매핑 정보를 사용합니다.
 */
function convertDisplayNamesToUsernames(message: string, mentionMappings?: Record<string, MentionMapping>): string {
    if (!mentionMappings || Object.keys(mentionMappings).length === 0) {
        return message;
    }

    // 메시지 끝에 있는 멘션을 처리하기 위해 임시 공백 추가
    let convertedMessage = message + ' ';

    // displayname이 긴 것부터 먼저 변환 (부분 매칭 방지)
    const sortedMappings = Object.entries(mentionMappings).sort(
        ([a], [b]) => b.length - a.length,
    );

    for (const [displayName, mapping] of sortedMappings) {
        // @displayname 패턴을 찾아서 @username으로 변환
        // - (^|\\s): @ 앞에 문자열 시작 또는 공백이 있어야 함 (이메일 주소 등에서 잘못 변환되는 것 방지)
        // - (?=\\s|...): @ 뒤에 공백이나 구두점이 있어야 함
        const escapedDisplayName = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(^|\\s)@${escapedDisplayName}(?=\\s|[.,!?;:'"\\)\\]}>])`, 'gm');

        // 콜백 함수를 사용하여 특수 대체 패턴 문자($&, $' 등)가 username에 있어도 안전하게 처리
        convertedMessage = convertedMessage.replace(pattern, (_match, prefix) => `${prefix}@${mapping.username}`);
    }

    // 임시로 추가한 공백 제거
    return convertedMessage.slice(0, -1);
}

export function submitPost(
    channelId: string,
    rootId: string,
    draft: PostDraft,
    afterSubmit?: (response: SubmitPostReturnType) => void,
    schedulingInfo?: SchedulingInfo,
    options?: OnSubmitOptions,
): ActionFuncAsync<CreatePostReturnType> {
    return async (dispatch, getState) => {
        const state = getState();

        const userId = getCurrentUserId(state);

        const time = Utils.getTimestamp();

        const isBorEnabled = isBurnOnReadEnabled(state);
        const postType = (isBorEnabled && draft.type === PostTypes.BURN_ON_READ) ? PostTypes.BURN_ON_READ : undefined;

        // 멘션 매핑을 이용해 @displayname을 @username으로 변환
        const convertedMessage = convertDisplayNamesToUsernames(draft.message, draft.mentionMappings);

        let post = {
            file_ids: [],
            message: convertedMessage,
            channel_id: channelId,
            root_id: rootId,
            pending_post_id: `${userId}:${time}`,
            user_id: userId,
            create_at: time,
            type: postType,
            metadata: {
                ...(draft.metadata?.priority && {priority: draft.metadata.priority}),
            },
            props: {...draft.props},
        } as unknown as Post;

        const channel = getChannel(state, channelId);
        if (!channel) {
            return {error: new Error('cannot find channel')};
        }
        const useChannelMentions = haveIChannelPermission(state, channel.team_id, channel.id, Permissions.USE_CHANNEL_MENTIONS);
        if (!useChannelMentions && containsAtChannel(post.message, {checkAllMentions: true})) {
            post.props.mentionHighlightDisabled = true;
        }

        const license = getLicense(state);
        const isLDAPEnabled = license?.IsLicensed === 'true' && license?.LDAPGroups === 'true';
        const useLDAPGroupMentions = isLDAPEnabled && haveIChannelPermission(state, channel.team_id, channel.id, Permissions.USE_GROUP_MENTIONS);

        const useCustomGroupMentions = isCustomGroupsEnabled(state) && haveIChannelPermission(state, channel.team_id, channel.id, Permissions.USE_GROUP_MENTIONS);

        const groupsWithAllowReference = useLDAPGroupMentions || useCustomGroupMentions ? getAssociatedGroupsForReferenceByMention(state, channel.team_id, channel.id) : null;
        if (!useLDAPGroupMentions && !useCustomGroupMentions && groupsMentionedInText(post.message, groupsWithAllowReference)) {
            post.props.disable_group_highlight = true;
        }

        const hookResult = await dispatch(runMessageWillBePostedHooks(post));
        if (hookResult.error) {
            return {error: hookResult.error};
        }

        post = hookResult.data!;

        if (schedulingInfo) {
            const scheduledPost = scheduledPostFromPost(post, schedulingInfo);
            scheduledPost.file_ids = draft.fileInfos.map((fileInfo) => fileInfo.id);
            if (draft.fileInfos?.length > 0) {
                if (!scheduledPost.metadata) {
                    scheduledPost.metadata = {} as PostMetadata;
                }

                scheduledPost.metadata.files = draft.fileInfos;
            }
            const response = await dispatch(createSchedulePostFromDraft(scheduledPost));
            if (afterSubmit) {
                const result: CreatePostReturnType = {
                    error: response.error,
                    created: !response.error,
                };
                afterSubmit(result);
            }

            return response;
        }

        return dispatch(PostActions.createPost(post, draft.fileInfos, afterSubmit, options));
    };
}

type SubmitCommandRerturnType = ExecuteCommandReturnType & CreatePostReturnType;

export function submitCommand(channelId: string, rootId: string, draft: PostDraft): ActionFuncAsync<SubmitCommandRerturnType> {
    return async (dispatch, getState) => {
        const state = getState();

        const teamId = getCurrentTeamId(state);

        let args: CommandArgs = {
            channel_id: channelId,
            team_id: teamId,
            root_id: rootId,
        };

        // 멘션 매핑을 이용해 @displayname을 @username으로 변환
        let {message} = draft;
        message = convertDisplayNamesToUsernames(message, draft.mentionMappings);

        const hookResult = await dispatch(runSlashCommandWillBePostedHooks(message, args));
        if (hookResult.error) {
            return {error: hookResult.error};
        } else if (!hookResult.data!.message && !hookResult.data!.args) {
            // do nothing with an empty return from a hook
            // this is allowed by the registerSlashCommandWillBePostedHook API in case
            // a plugin intercepts and handles the command on the client side
            // but doesn't require it to be sent to the server. (e.g., /call start).
            return {};
        }

        message = hookResult.data!.message;
        args = hookResult.data!.args;

        const {error, data} = await dispatch(executeCommand(message, args));

        if (error) {
            if (error.sendMessage) {
                return dispatch(submitPost(channelId, rootId, draft));
            }
            throw (error);
        }

        return {data: data!};
    };
}

export type SubmitPostReturnType = CreatePostReturnType & SubmitCommandRerturnType & SubmitReactionReturnType;
export type OnSubmitOptions = {
    ignoreSlash?: boolean;
    afterSubmit?: (response: SubmitPostReturnType) => void;
    afterOptimisticSubmit?: () => void;
    keepDraft?: boolean;
}

export function onSubmit(
    draft: PostDraft,
    options: OnSubmitOptions,
    schedulingInfo?: SchedulingInfo,
): ActionFuncAsync<SubmitPostReturnType> {
    return async (dispatch, getState) => {
        const {message, channelId, rootId} = draft;
        const state = getState();

        dispatch(addMessageIntoHistory(message));

        if (!schedulingInfo && !options.ignoreSlash) {
            const isReaction = Utils.REACTION_PATTERN.exec(message);

            const emojis = getCustomEmojisByName(state);
            const emojiMap = new EmojiMap(emojis);

            if (isReaction && emojiMap.has(isReaction[2])) {
                const latestPostId = getLatestInteractablePostId(state, channelId, rootId);
                if (latestPostId) {
                    return dispatch(PostActions.submitReaction(latestPostId, isReaction[1], isReaction[2]));
                }
                return {error: new Error('no post to react to')};
            }

            if (message.indexOf('/') === 0 && !options.ignoreSlash) {
                return dispatch(submitCommand(channelId, rootId, draft));
            }
        }

        return dispatch(submitPost(channelId, rootId, draft, options.afterSubmit, schedulingInfo, options));
    };
}

export function editLatestPost(channelId: string, rootId = ''): ActionFunc<boolean, GlobalState> {
    return (dispatch, getState) => {
        const state = getState();

        const lastPostId = getLatestPostToEdit(state, channelId, rootId);

        if (!lastPostId) {
            return {data: false};
        }

        return dispatch(PostActions.setEditingPost(
            lastPostId,
            rootId ? 'reply_textbox' : 'post_textbox',
            Boolean(rootId),
        ));
    };
}
