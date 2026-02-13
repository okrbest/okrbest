// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"net/http"
	"unicode/utf8"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/public/shared/request"
)

// truncateRuneString은 UTF-8 문자열을 안전하게 truncate합니다.
// maxRunes는 최대 rune(문자) 수입니다 (ellipsis "..." 포함).
func truncateRuneString(s string, maxRunes int) string {
	if maxRunes <= 0 {
		return ""
	}

	runeCount := utf8.RuneCountInString(s)
	if runeCount <= maxRunes {
		return s
	}

	runes := []rune(s)

	// maxRunes가 3 이하면 ellipsis 없이 그대로 자르기
	if maxRunes <= 3 {
		return string(runes[:maxRunes])
	}

	// maxRunes-3개 문자 + "..." = maxRunes 길이
	return string(runes[:maxRunes-3]) + "..."
}

// GetNotificationHistoryForUser는 사용자의 알림 히스토리를 조회합니다.
func (a *App) GetNotificationHistoryForUser(rctx request.CTX, userId string, opts model.GetNotificationHistoryOptions) (*model.NotificationHistoryList, *model.AppError) {
	list, err := a.Srv().Store().NotificationHistory().GetForUser(userId, opts)
	if err != nil {
		return nil, model.NewAppError("GetNotificationHistoryForUser", "app.notification_history.get_for_user.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return list, nil
}

// GetNotificationHistoryCountsForUser는 사용자의 알림 개수를 조회합니다.
func (a *App) GetNotificationHistoryCountsForUser(rctx request.CTX, userId string) (*model.NotificationHistoryCounts, *model.AppError) {
	counts, err := a.Srv().Store().NotificationHistory().GetCountsForUser(userId)
	if err != nil {
		return nil, model.NewAppError("GetNotificationHistoryCountsForUser", "app.notification_history.get_counts.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return counts, nil
}

// MarkNotificationHistoryAsRead는 알림을 읽음 처리합니다.
func (a *App) MarkNotificationHistoryAsRead(rctx request.CTX, notificationId string) *model.AppError {
	if err := a.Srv().Store().NotificationHistory().MarkAsRead(notificationId); err != nil {
		return model.NewAppError("MarkNotificationHistoryAsRead", "app.notification_history.mark_read.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return nil
}

// MarkAllNotificationHistoryAsReadForUser는 사용자의 모든 알림을 읽음 처리합니다.
func (a *App) MarkAllNotificationHistoryAsReadForUser(rctx request.CTX, userId string) *model.AppError {
	if err := a.Srv().Store().NotificationHistory().MarkAllAsReadForUser(userId); err != nil {
		return model.NewAppError("MarkAllNotificationHistoryAsReadForUser", "app.notification_history.mark_all_read.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return nil
}

// MarkNotificationHistoryAsReadByChannel은 채널 관련 알림을 읽음 처리합니다.
func (a *App) MarkNotificationHistoryAsReadByChannel(rctx request.CTX, userId, channelId string) *model.AppError {
	if err := a.Srv().Store().NotificationHistory().MarkAsReadByChannel(userId, channelId); err != nil {
		return model.NewAppError("MarkNotificationHistoryAsReadByChannel", "app.notification_history.mark_read_by_channel.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return nil
}

// DeleteNotificationHistory는 알림을 삭제합니다.
func (a *App) DeleteNotificationHistory(rctx request.CTX, notificationId string) *model.AppError {
	if err := a.Srv().Store().NotificationHistory().Delete(notificationId); err != nil {
		return model.NewAppError("DeleteNotificationHistory", "app.notification_history.delete.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return nil
}

// SaveNotificationHistory는 알림 히스토리를 저장합니다.
// SendNotifications에서 호출됩니다.
func (a *App) SaveNotificationHistory(rctx request.CTX, post *model.Post, channel *model.Channel, sender *model.User, mentionedUsers []string, notificationType string) {
	if post == nil || channel == nil || sender == nil {
		return
	}

	// 메시지 미리보기 생성 (최대 100자, UTF-8 안전)
	message := truncateRuneString(post.Message, 100)

	// 채널 타이틀 생성
	title := channel.DisplayName
	if title == "" {
		title = channel.Name
	}

	var notifications []*model.NotificationHistory

	for _, userId := range mentionedUsers {
		// 자기 자신에게는 알림을 보내지 않음
		if userId == sender.Id {
			continue
		}

		notification := &model.NotificationHistory{
			UserId:    userId,
			SenderId:  sender.Id,
			Type:      notificationType,
			PostId:    post.Id,
			ChannelId: channel.Id,
			TeamId:    channel.TeamId,
			RootId:    post.RootId,
			Title:     title,
			Message:   message,
			IsRead:    false,
			IsUrgent:  post.GetPriority() != nil && post.GetPriority().Priority != nil && *post.GetPriority().Priority == model.PostPriorityUrgent,
		}

		notifications = append(notifications, notification)
	}

	if len(notifications) == 0 {
		return
	}

	// 배치 저장
	if err := a.Srv().Store().NotificationHistory().SaveBatch(notifications); err != nil {
		rctx.Logger().Warn("Failed to save notification history",
			mlog.Err(err),
			mlog.String("post_id", post.Id),
			mlog.String("channel_id", channel.Id),
		)
	}
}

// SaveDMNotificationHistory는 DM 알림 히스토리를 저장합니다.
func (a *App) SaveDMNotificationHistory(rctx request.CTX, post *model.Post, channel *model.Channel, sender *model.User, recipientId string) {
	if post == nil || channel == nil || sender == nil || recipientId == "" {
		return
	}

	// 메시지 미리보기 생성 (최대 100자, UTF-8 안전)
	message := truncateRuneString(post.Message, 100)

	// DM 타이틀은 발신자 이름
	title := sender.GetDisplayName(model.ShowNicknameFullName)
	if title == "" {
		title = sender.Username
	}

	notification := &model.NotificationHistory{
		UserId:    recipientId,
		SenderId:  sender.Id,
		Type:      model.NotificationHistoryTypeDirectMessage,
		PostId:    post.Id,
		ChannelId: channel.Id,
		TeamId:    channel.TeamId,
		RootId:    post.RootId,
		Title:     title,
		Message:   message,
		IsRead:    false,
	}

	if _, err := a.Srv().Store().NotificationHistory().Save(notification); err != nil {
		rctx.Logger().Warn("Failed to save DM notification history",
			mlog.Err(err),
			mlog.String("post_id", post.Id),
			mlog.String("recipient_id", recipientId),
		)
	}
}
