// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
)

// okrbest: 채널별 입장·퇴장 메시지 숨김(upstream MM-68909)은 SendNotifications 맨 앞에서
// 멤버십 게시물의 알림을 끊는다. 알림 히스토리(포크 #167)는 그 뒤에서 기록하므로,
// 숨김 채널에서의 기록 규칙을 여기서 고정한다. upstream notification_test.go와
// 섞지 않으려고 포크 전용 파일에 둔다.

func findChannelPostOfType(t *testing.T, th *TestHelper, channelID, postType string) *model.Post {
	t.Helper()

	var found *model.Post
	require.Eventually(t, func() bool {
		postList, err := th.App.Srv().Store().Post().GetPosts(th.Context, model.GetPostsOptions{
			ChannelId:        channelID,
			PerPage:          100,
			SkipFetchThreads: true,
		}, false, map[string]bool{})
		if err != nil {
			return false
		}
		for _, post := range postList.Posts {
			if post.Type == postType {
				found = post
				return true
			}
		}
		return false
	}, 10*time.Second, 50*time.Millisecond, "%s 게시물이 만들어지지 않았다", postType)

	return found
}

func TestNotificationHistoryWithSuppressedJoinLeaveMessages(t *testing.T) {
	mainHelper.Parallel(t)

	setupSuppressedChannel := func(t *testing.T) (*TestHelper, *model.Channel) {
		th := Setup(t).InitBasic(t)

		channel := th.CreateChannel(t, th.BasicTeam)
		th.AddUserToChannel(t, th.BasicUser2, channel)

		channel.DisableJoinLeaveMessages = true
		channel, appErr := th.App.UpdateChannel(th.Context, channel)
		require.Nil(t, appErr)
		require.True(t, channel.DisableJoinLeaveMessages)

		return th, channel
	}

	t.Run("추가된 당사자에게만 mention 히스토리 1건이 남는다", func(t *testing.T) {
		th, channel := setupSuppressedChannel(t)

		added := th.CreateUser(t)
		th.LinkUserToTeam(t, added, th.BasicTeam)

		_, appErr := th.App.AddChannelMember(th.Context, added.Id, channel, ChannelMemberOpts{UserRequestorID: th.BasicUser.Id})
		require.Nil(t, appErr)

		addPost := findChannelPostOfType(t, th, channel.Id, model.PostTypeAddToChannel)

		notifications := waitForNotificationHistory(t, th, added.Id, addPost.Id)
		require.Len(t, notifications, 1)
		require.Equal(t, model.NotificationHistoryTypeMention, notifications[0].Type)

		assertNoNotificationHistory(t, th, th.BasicUser2.Id, addPost.Id)
	})

	t.Run("스스로 입장한 게시물은 누구의 히스토리에도 남지 않는다", func(t *testing.T) {
		th, channel := setupSuppressedChannel(t)

		joiner := th.CreateUser(t)
		th.LinkUserToTeam(t, joiner, th.BasicTeam)

		require.Nil(t, th.App.JoinChannel(th.Context, channel, joiner.Id))

		joinPost := findChannelPostOfType(t, th, channel.Id, model.PostTypeJoinChannel)

		assertNoNotificationHistory(t, th, th.BasicUser2.Id, joinPost.Id)
		assertNoNotificationHistory(t, th, joiner.Id, joinPost.Id)
	})
}
