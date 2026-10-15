// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Post} from '@mattermost/types/posts';

import {PostTypes} from 'mattermost-redux/action_types';
import * as reducers from 'mattermost-redux/reducers/entities/posts';
import deepFreeze from 'mattermost-redux/utils/deep_freeze';

import {TestHelper} from 'utils/test_helper';

// okrbest: the fork's bot-message filter (showBotMessages=false) removes posts after the
// server has computed prev_post_id/next_post_id, so a page can come back empty while more
// posts still exist (oldest/recent stay false). Upstream MM-68909 made empty responses mark
// the channel boundary when oldest/recent is true; these cases pin that a filtered-empty page
// does not. Kept in a fork-only file so upstream changes to posts.test.ts sync cleanly.

function toPostsRecord(partials: Record<string, Partial<Post>>): Record<string, Post> {
    return Object.keys(partials).reduce((acc, k) => {
        acc[k] = TestHelper.getPostMock(partials[k]);
        return acc;
    }, {} as Record<string, Post>);
}

describe('postsInChannel with a bot-filtered empty page', () => {
    const state = deepFreeze({
        channel1: [
            {order: ['post1', 'post2'], recent: true},
        ],
    });

    const nextPosts = toPostsRecord({
        post1: {id: 'post1', channel_id: 'channel1', create_at: 2000},
        post2: {id: 'post2', channel_id: 'channel1', create_at: 1000},
    });

    it('does not mark the block oldest when an older page is empty but more posts exist', () => {
        const nextState = reducers.postsInChannel(state, {
            type: PostTypes.RECEIVED_POSTS_BEFORE,
            channelId: 'channel1',
            data: {posts: {}, order: []},
            beforePostId: 'post2',
            oldest: false,
        }, {}, nextPosts);

        expect(nextState).toBe(state);
    });

    it('does not mark the block recent when a newer page is empty but more posts exist', () => {
        const notRecent = deepFreeze({
            channel1: [
                {order: ['post1', 'post2'], recent: false},
            ],
        });

        const nextState = reducers.postsInChannel(notRecent, {
            type: PostTypes.RECEIVED_POSTS_AFTER,
            channelId: 'channel1',
            data: {posts: {}, order: []},
            afterPostId: 'post1',
            recent: false,
        }, {}, nextPosts);

        expect(nextState).toBe(notRecent);
    });

    it('does not mark any block when a page-level fetch is empty and neither end is confirmed', () => {
        const nextState = reducers.postsInChannel(state, {
            type: PostTypes.RECEIVED_POSTS_IN_CHANNEL,
            channelId: 'channel1',
            data: {posts: {}, order: []},
            recent: false,
            oldest: false,
        }, {}, nextPosts);

        expect(nextState).toBe(state);
    });
});
