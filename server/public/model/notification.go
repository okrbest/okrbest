// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import (
	"encoding/json"
	"net/http"
)

type NotificationStatus string
type NotificationType string
type NotificationReason string

const (
	NotificationStatusSuccess     NotificationStatus = "success"
	NotificationStatusError       NotificationStatus = "error"
	NotificationStatusNotSent     NotificationStatus = "not_sent"
	NotificationStatusUnsupported NotificationStatus = "unsupported"

	NotificationTypeAll       NotificationType = "all"
	NotificationTypeEmail     NotificationType = "email"
	NotificationTypeWebsocket NotificationType = "websocket"
	NotificationTypePush      NotificationType = "push"

	NotificationNoPlatform = "no_platform"

	NotificationReasonFetchError                         NotificationReason = "fetch_error"
	NotificationReasonParseError                         NotificationReason = "json_parse_error"
	NotificationReasonMarshalError                       NotificationReason = "json_marshal_error"
	NotificationReasonPushProxyError                     NotificationReason = "push_proxy_error"
	NotificationReasonPushProxySendError                 NotificationReason = "push_proxy_send_error"
	NotificationReasonPushProxyRemoveDevice              NotificationReason = "push_proxy_remove_device"
	NotificationReasonRejectedByPlugin                   NotificationReason = "rejected_by_plugin"
	NotificationReasonSessionExpired                     NotificationReason = "session_expired"
	NotificationReasonChannelMuted                       NotificationReason = "channel_muted"
	NotificationReasonSystemMessage                      NotificationReason = "system_message"
	NotificationReasonLevelSetToNone                     NotificationReason = "notify_level_none"
	NotificationReasonNotMentioned                       NotificationReason = "not_mentioned"
	NotificationReasonUserStatus                         NotificationReason = "user_status"
	NotificationReasonUserIsActive                       NotificationReason = "user_is_active"
	NotificationReasonMissingProfile                     NotificationReason = "missing_profile"
	NotificationReasonEmailNotVerified                   NotificationReason = "email_not_verified"
	NotificationReasonEmailSendError                     NotificationReason = "email_send_error"
	NotificationReasonTooManyUsersInChannel              NotificationReason = "too_many_users_in_channel"
	NotificationReasonResolvePersistentNotificationError NotificationReason = "resolve_persistent_notification_error"
	NotificationReasonMissingThreadMembership            NotificationReason = "missing_thread_membership"
	NotificationReasonRecipientIsBot                     NotificationReason = "recipient_is_bot"
)

// ============================================================================
// NotificationHistory - 알림 히스토리 (알림 센터용)
// ============================================================================

// 알림 히스토리 타입 상수
const (
	NotificationHistoryTypeMention       = "mention"        // @멘션
	NotificationHistoryTypeDirectMessage = "direct_message" // DM
	NotificationHistoryTypeGroupMessage  = "group_message"  // 그룹 메시지
	NotificationHistoryTypeThreadReply   = "thread_reply"   // 스레드 답글
	NotificationHistoryTypeChannelPost   = "channel_post"   // 채널 메시지
	NotificationHistoryTypeSystem        = "system"         // 시스템 알림
)

// NotificationHistory는 사용자에게 발송된 알림 히스토리를 나타냅니다.
type NotificationHistory struct {
	Id        string `json:"id"`
	UserId    string `json:"user_id"`    // 알림 수신자
	SenderId  string `json:"sender_id"`  // 알림 발신자
	Type      string `json:"type"`       // 알림 타입
	PostId    string `json:"post_id"`    // 관련 포스트
	ChannelId string `json:"channel_id"` // 관련 채널
	TeamId    string `json:"team_id"`    // 관련 팀
	RootId    string `json:"root_id"`    // 스레드 루트 포스트 ID
	Title     string `json:"title"`      // 알림 제목 (채널명 등)
	Message   string `json:"message"`    // 알림 메시지 미리보기
	IsRead    bool   `json:"is_read"`    // 읽음 여부
	IsUrgent  bool   `json:"is_urgent"`  // 긴급 여부
	CreateAt  int64  `json:"create_at"`
	ReadAt    int64  `json:"read_at"` // 읽은 시간
}

// NotificationHistoryWithData는 발신자/채널 정보를 포함한 알림입니다.
type NotificationHistoryWithData struct {
	NotificationHistory
	SenderUsername string `json:"sender_username"`
	ChannelName    string `json:"channel_name"`
	TeamName       string `json:"team_name"`
}

// NotificationHistoryList는 알림 목록과 메타데이터를 포함합니다.
type NotificationHistoryList struct {
	Notifications []*NotificationHistoryWithData `json:"notifications"`
	TotalCount    int64                          `json:"total_count"`
	UnreadCount   int64                          `json:"unread_count"`
	HasMore       bool                           `json:"has_more"`
}

// NotificationHistoryCounts는 알림 개수 정보입니다.
type NotificationHistoryCounts struct {
	TotalCount    int64 `json:"total_count"`
	UnreadCount   int64 `json:"unread_count"`
	MentionCount  int64 `json:"mention_count"`
	DMCount       int64 `json:"dm_count"`
	ThreadCount   int64 `json:"thread_count"`
	UrgentCount   int64 `json:"urgent_count"`
}

// GetNotificationHistoryOptions는 알림 조회 옵션입니다.
type GetNotificationHistoryOptions struct {
	Page       int      `json:"page"`
	PerPage    int      `json:"per_page"`
	Types      []string `json:"types"`       // 필터링할 알림 타입
	UnreadOnly bool     `json:"unread_only"` // 읽지 않은 것만
	Since      int64    `json:"since"`       // 특정 시간 이후
	Before     int64    `json:"before"`      // 특정 시간 이전
	TeamId     string   `json:"team_id"`     // 특정 팀만
}

func (n *NotificationHistory) PreSave() {
	if n.Id == "" {
		n.Id = NewId()
	}
	if n.CreateAt == 0 {
		n.CreateAt = GetMillis()
	}
}

func (n *NotificationHistory) IsValid() *AppError {
	if !IsValidId(n.Id) {
		return NewAppError("NotificationHistory.IsValid", "model.notification_history.is_valid.id.app_error", nil, "", http.StatusBadRequest)
	}

	if !IsValidId(n.UserId) {
		return NewAppError("NotificationHistory.IsValid", "model.notification_history.is_valid.user_id.app_error", nil, "", http.StatusBadRequest)
	}

	if n.Type == "" {
		return NewAppError("NotificationHistory.IsValid", "model.notification_history.is_valid.type.app_error", nil, "", http.StatusBadRequest)
	}

	if n.CreateAt == 0 {
		return NewAppError("NotificationHistory.IsValid", "model.notification_history.is_valid.create_at.app_error", nil, "", http.StatusBadRequest)
	}

	return nil
}

func (n *NotificationHistory) ToJSON() string {
	b, _ := json.Marshal(n)
	return string(b)
}

func (n *NotificationHistory) DeepCopy() *NotificationHistory {
	copy := *n
	return &copy
}
