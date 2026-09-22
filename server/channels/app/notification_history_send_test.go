// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
)

// 알림 히스토리(알림 센터)는 okrbest 자체 기능으로, SendNotifications 안에서
// 채널 종류별로 수신자를 산출해 SaveNotificationHistory를 호출한다. upstream의
// 알림 경로 리팩터가 이 블록을 지나가므로, 수신자 산출 규칙을 여기서 고정해
// 무회귀를 커밋 단위로 검증한다.

// waitForNotificationHistory는 SaveNotificationHistory가 a.Srv().Go로 비동기
// 저장되므로 대상 사용자의 알림이 나타날 때까지 폴링한다.
func waitForNotificationHistory(t *testing.T, th *TestHelper, userID, postID string) []*model.NotificationHistoryWithData {
	t.Helper()

	var found []*model.NotificationHistoryWithData
	require.Eventually(t, func() bool {
		list, err := th.App.Srv().Store().NotificationHistory().GetForUser(userID, model.GetNotificationHistoryOptions{
			Page:    0,
			PerPage: 100,
		})
		if err != nil || list == nil {
			return false
		}

		found = nil
		for _, n := range list.Notifications {
			if n.PostId == postID {
				found = append(found, n)
			}
		}
		return len(found) > 0
	}, 10*time.Second, 50*time.Millisecond, "해당 게시물의 알림 히스토리가 저장되지 않았다")

	return found
}

// assertNoNotificationHistory는 일정 시간 동안 알림이 저장되지 않음을 확인한다.
func assertNoNotificationHistory(t *testing.T, th *TestHelper, userID, postID string) {
	t.Helper()

	require.Never(t, func() bool {
		list, err := th.App.Srv().Store().NotificationHistory().GetForUser(userID, model.GetNotificationHistoryOptions{
			Page:    0,
			PerPage: 100,
		})
		if err != nil || list == nil {
			return false
		}
		for _, n := range list.Notifications {
			if n.PostId == postID {
				return true
			}
		}
		return false
	}, 2*time.Second, 100*time.Millisecond, "알림 히스토리가 저장되지 않아야 한다")
}

func TestSendNotificationsSavesNotificationHistory(t *testing.T) {
	mainHelper.Parallel(t)

	t.Run("DM은 발신자를 뺀 상대에게 direct_message로 저장된다", func(t *testing.T) {
		th := Setup(t).InitBasic(t)

		channel := th.CreateDmChannel(t, th.BasicUser2)

		post, _, appErr := th.App.CreatePost(th.Context, &model.Post{
			UserId:    th.BasicUser.Id,
			ChannelId: channel.Id,
			Message:   "안녕하세요",
		}, channel, model.CreatePostFlags{})
		require.Nil(t, appErr)

		got := waitForNotificationHistory(t, th, th.BasicUser2.Id, post.Id)
		require.Len(t, got, 1)
		require.Equal(t, model.NotificationHistoryTypeDirectMessage, got[0].Type)
		require.Equal(t, th.BasicUser.Id, got[0].SenderId)
		require.Equal(t, channel.Id, got[0].ChannelId)

		// 발신자 본인에게는 저장되지 않는다.
		assertNoNotificationHistory(t, th, th.BasicUser.Id, post.Id)
	})

	t.Run("그룹 메시지는 발신자를 뺀 전원에게 group_message로 저장된다", func(t *testing.T) {
		th := Setup(t).InitBasic(t)

		user3 := th.CreateUser(t)
		channel := th.CreateGroupChannel(t, th.BasicUser2, user3)

		post, _, appErr := th.App.CreatePost(th.Context, &model.Post{
			UserId:    th.BasicUser.Id,
			ChannelId: channel.Id,
			Message:   "그룹 인사",
		}, channel, model.CreatePostFlags{})
		require.Nil(t, appErr)

		for _, recipient := range []*model.User{th.BasicUser2, user3} {
			got := waitForNotificationHistory(t, th, recipient.Id, post.Id)
			require.Len(t, got, 1)
			require.Equal(t, model.NotificationHistoryTypeGroupMessage, got[0].Type)
			require.Equal(t, th.BasicUser.Id, got[0].SenderId)
		}

		assertNoNotificationHistory(t, th, th.BasicUser.Id, post.Id)
	})

	t.Run("일반 채널은 멘션된 사용자에게만 mention으로 저장된다", func(t *testing.T) {
		th := Setup(t).InitBasic(t)

		th.AddUserToChannel(t, th.BasicUser2, th.BasicChannel)
		bystander := th.CreateUser(t)
		th.LinkUserToTeam(t, bystander, th.BasicTeam)
		th.AddUserToChannel(t, bystander, th.BasicChannel)

		post, _, appErr := th.App.CreatePost(th.Context, &model.Post{
			UserId:    th.BasicUser.Id,
			ChannelId: th.BasicChannel.Id,
			Message:   "@" + th.BasicUser2.Username + " 확인 부탁드립니다",
		}, th.BasicChannel, model.CreatePostFlags{})
		require.Nil(t, appErr)

		got := waitForNotificationHistory(t, th, th.BasicUser2.Id, post.Id)
		require.Len(t, got, 1)
		require.Equal(t, model.NotificationHistoryTypeMention, got[0].Type)
		require.Equal(t, th.BasicTeam.Id, got[0].TeamId)

		// 멘션되지 않은 채널 멤버에게는 저장되지 않는다.
		assertNoNotificationHistory(t, th, bystander.Id, post.Id)
	})

	t.Run("CRT 활성 스레드 답글은 팔로워에게 thread_reply로 저장된다", func(t *testing.T) {
		th := Setup(t).InitBasic(t)

		th.App.UpdateConfig(func(cfg *model.Config) {
			*cfg.ServiceSettings.ThreadAutoFollow = true
			*cfg.ServiceSettings.CollapsedThreads = model.CollapsedThreadsDefaultOn
		})

		th.AddUserToChannel(t, th.BasicUser2, th.BasicChannel)

		root, _, appErr := th.App.CreatePost(th.Context, &model.Post{
			UserId:    th.BasicUser2.Id,
			ChannelId: th.BasicChannel.Id,
			Message:   "스레드 루트",
		}, th.BasicChannel, model.CreatePostFlags{})
		require.Nil(t, appErr)

		reply, _, appErr := th.App.CreatePost(th.Context, &model.Post{
			UserId:    th.BasicUser.Id,
			ChannelId: th.BasicChannel.Id,
			RootId:    root.Id,
			Message:   "답글입니다",
		}, th.BasicChannel, model.CreatePostFlags{})
		require.Nil(t, appErr)

		// 루트 작성자는 ThreadAutoFollow로 팔로워가 되므로 알림을 받는다.
		got := waitForNotificationHistory(t, th, th.BasicUser2.Id, reply.Id)
		require.Len(t, got, 1)
		require.Equal(t, model.NotificationHistoryTypeThreadReply, got[0].Type)
		require.Equal(t, root.Id, got[0].RootId)

		assertNoNotificationHistory(t, th, th.BasicUser.Id, reply.Id)
	})
}
