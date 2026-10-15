// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/request"
	"github.com/mattermost/mattermost/server/v8/channels/store"
)

// okrbest: the fork's FilterUserIds option and upstream's ExcludeMembershipSystemPosts
// option (MM-68909) both narrow the same post queries. This fork-only file checks that
// they compose; it lives outside storetest/post_store.go so upstream syncs stay clean.
func TestPostStoreFilterUserIdsWithMembershipExclusion(t *testing.T) {
	StoreTest(t, testPostStoreFilterUserIdsWithMembershipExclusion)
}

func testPostStoreFilterUserIdsWithMembershipExclusion(t *testing.T, rctx request.CTX, ss store.Store) {
	channel, err := ss.Channel().Save(rctx, &model.Channel{
		TeamId:      model.NewId(),
		DisplayName: "DisplayName",
		Name:        "channel" + model.NewId(),
		Type:        model.ChannelTypeOpen,
	}, -1)
	require.NoError(t, err)

	userA := model.NewId()
	userB := model.NewId()
	now := model.GetMillis()

	save := func(userID, msg, postType string, createAt int64) *model.Post {
		t.Helper()
		post, saveErr := ss.Post().Save(rctx, &model.Post{
			ChannelId: channel.Id,
			UserId:    userID,
			Message:   msg,
			Type:      postType,
			CreateAt:  createAt,
		})
		require.NoError(t, saveErr)
		return post
	}

	anchor := save(userB, "anchor", "", now)
	aJoin := save(userA, "joined", model.PostTypeJoinChannel, now+1)
	aPost := save(userA, "hello from a", "", now+2)
	bPost := save(userB, "hello from b", "", now+3)
	last := save(userB, "last", "", now+4)

	assertOnlyA := func(t *testing.T, postList *model.PostList) {
		t.Helper()
		require.Contains(t, postList.Posts, aPost.Id)
		require.NotContains(t, postList.Posts, aJoin.Id)
		require.NotContains(t, postList.Posts, bPost.Id)
	}

	both := func(opts model.GetPostsOptions) model.GetPostsOptions {
		opts.ChannelId = channel.Id
		opts.PerPage = 30
		// The webapp fetches with collapsed threads; that is the path where
		// both filters must compose.
		opts.CollapsedThreads = true
		opts.FilterUserIds = []string{userA}
		opts.ExcludeMembershipSystemPosts = true
		return opts
	}

	t.Run("GetPosts applies both filters", func(t *testing.T) {
		postList, err := ss.Post().GetPosts(rctx, both(model.GetPostsOptions{}), false, map[string]bool{})
		require.NoError(t, err)
		assertOnlyA(t, postList)
	})

	t.Run("GetPostsBefore applies both filters", func(t *testing.T) {
		postList, err := ss.Post().GetPostsBefore(rctx, both(model.GetPostsOptions{PostId: last.Id}), map[string]bool{})
		require.NoError(t, err)
		assertOnlyA(t, postList)
	})

	t.Run("GetPostsAfter applies both filters", func(t *testing.T) {
		postList, err := ss.Post().GetPostsAfter(rctx, both(model.GetPostsOptions{PostId: anchor.Id}), map[string]bool{})
		require.NoError(t, err)
		assertOnlyA(t, postList)
	})

	t.Run("GetPostsSince applies both filters", func(t *testing.T) {
		postList, err := ss.Post().GetPostsSince(rctx, model.GetPostsSinceOptions{
			ChannelId:                    channel.Id,
			Time:                         now - 1,
			FilterUserIds:                []string{userA},
			ExcludeMembershipSystemPosts: true,
		}, false, map[string]bool{})
		require.NoError(t, err)
		assertOnlyA(t, postList)
	})

	t.Run("membership exclusion alone keeps other users", func(t *testing.T) {
		postList, err := ss.Post().GetPosts(rctx, model.GetPostsOptions{
			ChannelId:                    channel.Id,
			PerPage:                      30,
			CollapsedThreads:             true,
			ExcludeMembershipSystemPosts: true,
		}, false, map[string]bool{})
		require.NoError(t, err)
		require.Contains(t, postList.Posts, aPost.Id)
		require.Contains(t, postList.Posts, bPost.Id)
		require.NotContains(t, postList.Posts, aJoin.Id)
	})

	t.Run("FilterUserIds alone is unchanged", func(t *testing.T) {
		postList, err := ss.Post().GetPosts(rctx, model.GetPostsOptions{
			ChannelId:        channel.Id,
			PerPage:          30,
			CollapsedThreads: true,
			FilterUserIds:    []string{userA},
		}, false, map[string]bool{})
		require.NoError(t, err)
		// The fork filter already drops system messages on its own.
		assertOnlyA(t, postList)
	})
}
