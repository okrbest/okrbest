// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';

import type {Channel} from '@mattermost/types/channels';

import {makeGetChannelUnreadCount} from 'mattermost-redux/selectors/entities/channels';
import {getUnreadPostsChunk} from 'mattermost-redux/selectors/entities/posts';

import {loadUnreads} from 'actions/views/channel';
import {getUnreadChannels} from 'selectors/views/channel_sidebar';

import type {GlobalState} from 'types/store';

export type UnreadChannelGroupData = {
    channel: Channel;
    lastViewedAt: number;
    mentionCount: number;
    postIds: string[];
    hasLoadFailed: boolean;
    isLoaded: boolean;
};

type SnapshotEntry = {
    channelId: string;
    lastViewedAt: number;
    mentionCount: number;
};

// 진입(또는 갱신) 시점의 미읽음 채널 목록을 고정한다. 순서는 사이드바와 같은
// 원천(getUnreadChannels: 멘션 우선 → 최근 활동순)을 그대로 쓴다 (FR-003·FR-015).
function takeSnapshot(state: GlobalState): SnapshotEntry[] {
    const getUnreadCount = makeGetChannelUnreadCount();

    return getUnreadChannels(state).map((channel) => {
        const member = state.entities.channels.myMembers[channel.id];

        return {
            channelId: channel.id,
            lastViewedAt: member?.last_viewed_at ?? 0,
            mentionCount: getUnreadCount(state, channel.id)?.mentions ?? 0,
        };
    });
}

// lastViewedAt 이후의 포스트만 오래된 순으로 고른다 (FR-005).
// 포스트 묶음이 아직 store에 없으면 null을 돌려 적재가 필요함을 알린다.
function selectUnreadPostIds(state: GlobalState, channelId: string, lastViewedAt: number): string[] | null {
    const chunk = getUnreadPostsChunk(state, channelId, lastViewedAt);
    if (!chunk) {
        return null;
    }

    const postIds: string[] = [];
    for (const postId of chunk.order) {
        const post = state.entities.posts.posts[postId];
        if (!post || post.delete_at > 0) {
            continue;
        }
        if (post.create_at <= lastViewedAt) {
            continue;
        }
        postIds.push(postId);
    }

    return postIds.reverse();
}

export default function useUnreadsSnapshot() {
    const store = useStore<GlobalState>();
    const dispatch = useDispatch();

    const [entries, setEntries] = useState<SnapshotEntry[]>(() => takeSnapshot(store.getState()));
    const [failedChannelIds, setFailedChannelIds] = useState<ReadonlySet<string>>(new Set());
    const [removedChannelIds, setRemovedChannelIds] = useState<ReadonlySet<string>>(new Set());
    const [pendingLoadCount, setPendingLoadCount] = useState(0);
    const loadRequestedRef = useRef<Set<string>>(new Set());

    const channels = useSelector((state: GlobalState) => state.entities.channels.channels);

    // 그룹별 포스트 선별 결과를 문자열 키로 구독해, 바뀔 때만 groups를 다시 만든다.
    const postIdsKey = useSelector((state: GlobalState) =>
        entries.map((entry) =>
            selectUnreadPostIds(state, entry.channelId, entry.lastViewedAt)?.join(',') ?? '*',
        ).join('|'),
    );

    const groups = useMemo((): UnreadChannelGroupData[] => {
        const state = store.getState();
        const result: UnreadChannelGroupData[] = [];

        for (const entry of entries) {
            const channel = channels[entry.channelId];
            if (!channel) {
                continue;
            }

            const postIds = selectUnreadPostIds(state, entry.channelId, entry.lastViewedAt);

            result.push({
                channel,
                lastViewedAt: entry.lastViewedAt,
                mentionCount: entry.mentionCount,
                postIds: postIds ?? [],
                hasLoadFailed: failedChannelIds.has(entry.channelId),
                isLoaded: postIds !== null,
            });
        }

        return result;
    }, [entries, channels, failedChannelIds, postIdsKey, store]);

    // 스냅샷 밖에서 새로 생긴 미읽음 채널 수. 목록은 바꾸지 않고 배너로만 알린다 (FR-013).
    const newChannelCount = useSelector((state: GlobalState) => {
        const snapshotIds = new Set(entries.map((entry) => entry.channelId));

        return getUnreadChannels(state).filter((channel) =>
            !snapshotIds.has(channel.id) && !removedChannelIds.has(channel.id),
        ).length;
    });

    useEffect(() => {
        const state = store.getState();
        const entriesToLoad = entries.filter((entry) =>
            !loadRequestedRef.current.has(entry.channelId) &&
            selectUnreadPostIds(state, entry.channelId, entry.lastViewedAt) === null,
        );

        if (entriesToLoad.length === 0) {
            return;
        }

        for (const entry of entriesToLoad) {
            loadRequestedRef.current.add(entry.channelId);
        }
        setPendingLoadCount((count) => count + entriesToLoad.length);

        for (const entry of entriesToLoad) {
            Promise.resolve(dispatch(loadUnreads(entry.channelId))).then((result: {error?: unknown} | undefined) => {
                if (result?.error) {
                    setFailedChannelIds((prev) => {
                        const next = new Set(prev);
                        next.add(entry.channelId);
                        return next;
                    });
                }
                setPendingLoadCount((count) => count - 1);
            });
        }
    }, [entries, dispatch, store]);

    const refresh = useCallback(() => {
        loadRequestedRef.current = new Set();
        setFailedChannelIds(new Set());
        setRemovedChannelIds(new Set());
        setEntries(takeSnapshot(store.getState()));
    }, [store]);

    const removeGroups = useCallback((channelIds: string[]) => {
        const toRemove = new Set(channelIds);

        setEntries((prev) => prev.filter((entry) => !toRemove.has(entry.channelId)));
        setRemovedChannelIds((prev) => {
            const next = new Set(prev);
            for (const channelId of channelIds) {
                next.add(channelId);
            }
            return next;
        });
    }, []);

    return {
        groups,
        isLoading: pendingLoadCount > 0,
        newChannelCount,
        refresh,
        removeGroups,
    };
}
