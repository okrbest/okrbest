// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General} from 'mattermost-redux/constants';
import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {getChannelMessageCounts, getMyChannels} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentChannelId, getMyChannelMemberships, getUsers} from 'mattermost-redux/selectors/entities/common';
import {isCollapsedThreadsEnabled} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {getThreadCountsIncludingDirect} from 'mattermost-redux/selectors/entities/threads';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import {calculateUnreadCount, getUserIdFromChannelName} from 'mattermost-redux/utils/channel_utils';

import type {GlobalState} from 'types/store';

export type SplitUnreadCounts = {

    /**
     * 멘션·DM·GM 수 — upstream getUnreadStatusInCurrentTeam이 number를 반환하는
     * 모든 상태에서 그 값과 같다 (CRT 활성 시 스레드 멘션 포함).
     */
    mentions: number;

    /**
     * 일반 채널(공개·비공개)의 미읽음 메시지 수. DM·GM은 ①(mentions)에 이미
     * 집계되므로 여기서 뺀다.
     */
    messages: number;
};

// okrbest(027): upstream getUnreadStatusInCurrentTeam은 내부에서 messages·mentions를
// 모두 계산하지만 반환형(boolean | number)이 messages를 버린다. 반환형을 바꾸면
// 소비처 전부에 파급되고 sync 충돌 표면이 커지므로, 같은 경계 규칙(현재 채널 제외,
// 삭제 채널·비활성 DM 제외, showUnread 판정, CRT 스레드 멘션)을 앱 레벨에서
// 재구성해 두 수치를 분리 공급한다. 규칙 정본: specs/027-unreads-split-badge/data-model.md
export const getSplitUnreadCountsInCurrentTeam: (state: GlobalState) => SplitUnreadCounts = createSelector(
    'getSplitUnreadCountsInCurrentTeam',
    getCurrentChannelId,
    getMyChannels,
    getMyChannelMemberships,
    getChannelMessageCounts,
    getUsers,
    getCurrentUserId,
    getCurrentTeamId,
    isCollapsedThreadsEnabled,
    getThreadCountsIncludingDirect,
    (
        currentChannelId,
        channels,
        myMembers,
        messageCounts,
        users,
        currentUserId,
        currentTeamId,
        collapsedThreadsEnabled,
        threadCounts,
    ): SplitUnreadCounts => {
        const counts = channels.reduce((acc, channel) => {
            const m = myMembers[channel.id];

            if (!m || channel.id === currentChannelId) {
                return acc;
            }

            const channelExists = channel.type === General.DM_CHANNEL ? users[getUserIdFromChannelName(currentUserId, channel.name)]?.delete_at === 0 : channel.delete_at === 0;
            if (!channelExists) {
                return acc;
            }

            const mentions = collapsedThreadsEnabled ? m.mention_count_root : m.mention_count;
            if (mentions) {
                acc.mentions += mentions;
            }

            const isDirect = channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL;
            if (!isDirect) {
                const unreadCount = calculateUnreadCount(messageCounts[channel.id], m, collapsedThreadsEnabled);
                if (unreadCount.showUnread) {
                    acc.messages += unreadCount.messages;
                }
            }

            return acc;
        }, {mentions: 0, messages: 0});

        if (collapsedThreadsEnabled && currentChannelId) {
            const c = threadCounts[currentTeamId];
            if (c) {
                counts.mentions += c.total_unread_mentions;
            }
        }

        return counts;
    },
);
