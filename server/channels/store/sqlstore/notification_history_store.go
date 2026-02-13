// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"database/sql"

	sq "github.com/mattermost/squirrel"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/v8/channels/store"
)

type SqlNotificationHistoryStore struct {
	*SqlStore
}

func newSqlNotificationHistoryStore(sqlStore *SqlStore) store.NotificationHistoryStore {
	return &SqlNotificationHistoryStore{
		SqlStore: sqlStore,
	}
}

func notificationHistoryColumns() []string {
	return []string{
		"Id",
		"UserId",
		"SenderId",
		"Type",
		"PostId",
		"ChannelId",
		"TeamId",
		"RootId",
		"Title",
		"Message",
		"IsRead",
		"IsUrgent",
		"CreateAt",
		"ReadAt",
	}
}

func notificationHistoryToSlice(n *model.NotificationHistory) []any {
	return []any{
		n.Id,
		n.UserId,
		n.SenderId,
		n.Type,
		n.PostId,
		n.ChannelId,
		n.TeamId,
		n.RootId,
		n.Title,
		n.Message,
		n.IsRead,
		n.IsUrgent,
		n.CreateAt,
		n.ReadAt,
	}
}

func (s *SqlNotificationHistoryStore) Save(notification *model.NotificationHistory) (*model.NotificationHistory, error) {
	notification.PreSave()
	if err := notification.IsValid(); err != nil {
		return nil, err
	}

	query := s.getQueryBuilder().
		Insert("NotificationHistory").
		Columns(notificationHistoryColumns()...).
		Values(notificationHistoryToSlice(notification)...)

	queryStr, args, err := query.ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "notification_history_save_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return nil, errors.Wrap(err, "failed to save NotificationHistory")
	}

	return notification, nil
}

func (s *SqlNotificationHistoryStore) SaveBatch(notifications []*model.NotificationHistory) error {
	if len(notifications) == 0 {
		return nil
	}

	query := s.getQueryBuilder().
		Insert("NotificationHistory").
		Columns(notificationHistoryColumns()...)

	for _, n := range notifications {
		n.PreSave()
		if err := n.IsValid(); err != nil {
			return err
		}
		query = query.Values(notificationHistoryToSlice(n)...)
	}

	queryStr, args, err := query.ToSql()
	if err != nil {
		return errors.Wrap(err, "notification_history_save_batch_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return errors.Wrap(err, "failed to save notification history batch")
	}

	return nil
}

func (s *SqlNotificationHistoryStore) Get(id string) (*model.NotificationHistory, error) {
	query := s.getQueryBuilder().
		Select(notificationHistoryColumns()...).
		From("NotificationHistory").
		Where(sq.Eq{"Id": id})

	var notification model.NotificationHistory
	if err := s.GetReplica().GetBuilder(&notification, query); err != nil {
		if err == sql.ErrNoRows {
			return nil, store.NewErrNotFound("NotificationHistory", id)
		}
		return nil, errors.Wrapf(err, "failed to find notification history with id=%s", id)
	}

	return &notification, nil
}

func (s *SqlNotificationHistoryStore) GetForUser(userId string, opts model.GetNotificationHistoryOptions) (*model.NotificationHistoryList, error) {
	// 기본값 설정
	if opts.PerPage == 0 {
		opts.PerPage = 20
	}
	if opts.PerPage > 100 {
		opts.PerPage = 100
	}

	// 알림 목록 조회
	query := s.getQueryBuilder().
		Select(
			"n.Id",
			"n.UserId",
			"n.SenderId",
			"n.Type",
			"n.PostId",
			"n.ChannelId",
			"n.TeamId",
			"n.RootId",
			"n.Title",
			"n.Message",
			"n.IsRead",
			"n.IsUrgent",
			"n.CreateAt",
			"n.ReadAt",
			"COALESCE(u.Username, '') AS SenderUsername",
			"COALESCE(c.DisplayName, c.Name, '') AS ChannelName",
			"COALESCE(t.DisplayName, t.Name, '') AS TeamName",
		).
		From("NotificationHistory n").
		LeftJoin("Users u ON n.SenderId = u.Id").
		LeftJoin("Channels c ON n.ChannelId = c.Id").
		LeftJoin("Teams t ON n.TeamId = t.Id").
		Where(sq.Eq{"n.UserId": userId}).
		OrderBy("n.CreateAt DESC").
		Limit(uint64(opts.PerPage + 1)).
		Offset(uint64(opts.Page * opts.PerPage))

	// 필터 적용
	if opts.UnreadOnly {
		query = query.Where(sq.Eq{"n.IsRead": false})
	}
	if len(opts.Types) > 0 {
		query = query.Where(sq.Eq{"n.Type": opts.Types})
	}
	if opts.Since > 0 {
		query = query.Where(sq.Gt{"n.CreateAt": opts.Since})
	}
	if opts.Before > 0 {
		query = query.Where(sq.Lt{"n.CreateAt": opts.Before})
	}
	if opts.TeamId != "" {
		query = query.Where(sq.Eq{"n.TeamId": opts.TeamId})
	}

	var notifications []*model.NotificationHistoryWithData
	if err := s.GetReplica().SelectBuilder(&notifications, query); err != nil {
		return nil, errors.Wrap(err, "failed to get notification history for user")
	}

	// HasMore 체크
	hasMore := len(notifications) > opts.PerPage
	if hasMore {
		notifications = notifications[:opts.PerPage]
	}

	// 총 개수 및 읽지 않은 개수 조회 (동일한 필터 적용)
	countQuery := s.getQueryBuilder().
		Select("COUNT(*) AS totalcount", "COALESCE(SUM(CASE WHEN IsRead = false THEN 1 ELSE 0 END), 0) AS unreadcount").
		From("NotificationHistory").
		Where(sq.Eq{"UserId": userId})

	// 동일한 필터 적용
	if opts.UnreadOnly {
		countQuery = countQuery.Where(sq.Eq{"IsRead": false})
	}
	if len(opts.Types) > 0 {
		countQuery = countQuery.Where(sq.Eq{"Type": opts.Types})
	}
	if opts.Since > 0 {
		countQuery = countQuery.Where(sq.Gt{"CreateAt": opts.Since})
	}
	if opts.Before > 0 {
		countQuery = countQuery.Where(sq.Lt{"CreateAt": opts.Before})
	}
	if opts.TeamId != "" {
		countQuery = countQuery.Where(sq.Eq{"TeamId": opts.TeamId})
	}

	var counts struct {
		TotalCount  int64 `db:"totalcount"`
		UnreadCount int64 `db:"unreadcount"`
	}
	if err := s.GetReplica().GetBuilder(&counts, countQuery); err != nil {
		return nil, errors.Wrap(err, "failed to get notification history counts")
	}

	return &model.NotificationHistoryList{
		Notifications: notifications,
		TotalCount:    counts.TotalCount,
		UnreadCount:   counts.UnreadCount,
		HasMore:       hasMore,
	}, nil
}

func (s *SqlNotificationHistoryStore) GetCountsForUser(userId string) (*model.NotificationHistoryCounts, error) {
	query := `
		SELECT 
			COUNT(*) AS total_count,
			COALESCE(SUM(CASE WHEN IsRead = false THEN 1 ELSE 0 END), 0) AS unread_count,
			COALESCE(SUM(CASE WHEN IsRead = false AND Type = $1 THEN 1 ELSE 0 END), 0) AS mention_count,
			COALESCE(SUM(CASE WHEN IsRead = false AND Type = $2 THEN 1 ELSE 0 END), 0) AS dm_count,
			COALESCE(SUM(CASE WHEN IsRead = false AND Type = $3 THEN 1 ELSE 0 END), 0) AS thread_count,
			COALESCE(SUM(CASE WHEN IsRead = false AND IsUrgent = true THEN 1 ELSE 0 END), 0) AS urgent_count
		FROM NotificationHistory
		WHERE UserId = $4
	`

	var counts struct {
		TotalCount   int64 `db:"total_count"`
		UnreadCount  int64 `db:"unread_count"`
		MentionCount int64 `db:"mention_count"`
		DMCount      int64 `db:"dm_count"`
		ThreadCount  int64 `db:"thread_count"`
		UrgentCount  int64 `db:"urgent_count"`
	}
	err := s.GetReplica().Get(&counts, query,
		model.NotificationHistoryTypeMention,
		model.NotificationHistoryTypeDirectMessage,
		model.NotificationHistoryTypeThreadReply,
		userId,
	)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get notification history counts")
	}

	return &model.NotificationHistoryCounts{
		TotalCount:   counts.TotalCount,
		UnreadCount:  counts.UnreadCount,
		MentionCount: counts.MentionCount,
		DMCount:      counts.DMCount,
		ThreadCount:  counts.ThreadCount,
		UrgentCount:  counts.UrgentCount,
	}, nil
}

func (s *SqlNotificationHistoryStore) MarkAsRead(notificationId string) error {
	query := s.getQueryBuilder().
		Update("NotificationHistory").
		Set("IsRead", true).
		Set("ReadAt", model.GetMillis()).
		Where(sq.Eq{"Id": notificationId})

	queryStr, args, err := query.ToSql()
	if err != nil {
		return errors.Wrap(err, "notification_history_mark_read_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return errors.Wrap(err, "failed to mark notification history as read")
	}

	return nil
}

func (s *SqlNotificationHistoryStore) MarkAllAsReadForUser(userId string) error {
	query := s.getQueryBuilder().
		Update("NotificationHistory").
		Set("IsRead", true).
		Set("ReadAt", model.GetMillis()).
		Where(sq.Eq{"UserId": userId, "IsRead": false})

	queryStr, args, err := query.ToSql()
	if err != nil {
		return errors.Wrap(err, "notification_history_mark_all_read_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return errors.Wrap(err, "failed to mark all notification history as read")
	}

	return nil
}

func (s *SqlNotificationHistoryStore) MarkAsReadByChannel(userId string, channelId string) error {
	query := s.getQueryBuilder().
		Update("NotificationHistory").
		Set("IsRead", true).
		Set("ReadAt", model.GetMillis()).
		Where(sq.Eq{"UserId": userId, "ChannelId": channelId, "IsRead": false})

	queryStr, args, err := query.ToSql()
	if err != nil {
		return errors.Wrap(err, "notification_history_mark_read_by_channel_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return errors.Wrap(err, "failed to mark notification history as read by channel")
	}

	return nil
}

func (s *SqlNotificationHistoryStore) Delete(id string) error {
	query := s.getQueryBuilder().
		Delete("NotificationHistory").
		Where(sq.Eq{"Id": id})

	queryStr, args, err := query.ToSql()
	if err != nil {
		return errors.Wrap(err, "notification_history_delete_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return errors.Wrap(err, "failed to delete notification history")
	}

	return nil
}

func (s *SqlNotificationHistoryStore) DeleteOlderThan(timestamp int64) (int64, error) {
	query := s.getQueryBuilder().
		Delete("NotificationHistory").
		Where(sq.Lt{"CreateAt": timestamp})

	queryStr, args, err := query.ToSql()
	if err != nil {
		return 0, errors.Wrap(err, "notification_history_delete_older_tosql")
	}

	result, err := s.GetMaster().Exec(queryStr, args...)
	if err != nil {
		return 0, errors.Wrap(err, "failed to delete old notification history")
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, errors.Wrap(err, "failed to get rows affected")
	}

	return rowsAffected, nil
}

func (s *SqlNotificationHistoryStore) DeleteForUser(userId string) error {
	query := s.getQueryBuilder().
		Delete("NotificationHistory").
		Where(sq.Eq{"UserId": userId})

	queryStr, args, err := query.ToSql()
	if err != nil {
		return errors.Wrap(err, "notification_history_delete_for_user_tosql")
	}

	if _, err = s.GetMaster().Exec(queryStr, args...); err != nil {
		return errors.Wrap(err, "failed to delete notification history for user")
	}

	return nil
}
