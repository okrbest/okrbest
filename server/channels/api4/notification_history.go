// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package api4

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

func (api *API) InitNotificationHistory() {
	api.BaseRoutes.User.Handle("/notifications", api.APISessionRequired(getNotificationHistoryForUser)).Methods(http.MethodGet)
	api.BaseRoutes.User.Handle("/notifications/counts", api.APISessionRequired(getNotificationHistoryCounts)).Methods(http.MethodGet)
	api.BaseRoutes.User.Handle("/notifications/{notification_id:[A-Za-z0-9]+}/read", api.APISessionRequired(markNotificationHistoryAsRead)).Methods(http.MethodPost)
	api.BaseRoutes.User.Handle("/notifications/read_all", api.APISessionRequired(markAllNotificationHistoryAsRead)).Methods(http.MethodPost)
	api.BaseRoutes.User.Handle("/notifications/{notification_id:[A-Za-z0-9]+}", api.APISessionRequired(deleteNotificationHistory)).Methods(http.MethodDelete)
}

func getNotificationHistoryForUser(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireUserId()
	if c.Err != nil {
		return
	}

	// 본인의 알림만 조회 가능
	if c.Params.UserId != c.AppContext.Session().UserId {
		c.SetPermissionError(model.PermissionViewMembers)
		return
	}

	opts := model.GetNotificationHistoryOptions{
		Page:       c.Params.Page,
		PerPage:    c.Params.PerPage,
		UnreadOnly: r.URL.Query().Get("unread_only") == "true",
		TeamId:     r.URL.Query().Get("team_id"),
	}

	// since 파라미터
	if since := r.URL.Query().Get("since"); since != "" {
		if sinceTime, err := strconv.ParseInt(since, 10, 64); err == nil {
			opts.Since = sinceTime
		}
	}

	// types 파라미터 (콤마 구분)
	if types := r.URL.Query().Get("types"); types != "" {
		opts.Types = strings.Split(types, ",")
	}

	list, appErr := c.App.GetNotificationHistoryForUser(c.AppContext, c.Params.UserId, opts)
	if appErr != nil {
		c.Err = appErr
		return
	}

	if err := json.NewEncoder(w).Encode(list); err != nil {
		c.Logger.Warn("Error writing response", mlog.Err(err))
	}
}

func getNotificationHistoryCounts(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireUserId()
	if c.Err != nil {
		return
	}

	// 본인의 알림만 조회 가능
	if c.Params.UserId != c.AppContext.Session().UserId {
		c.SetPermissionError(model.PermissionViewMembers)
		return
	}

	counts, appErr := c.App.GetNotificationHistoryCountsForUser(c.AppContext, c.Params.UserId)
	if appErr != nil {
		c.Err = appErr
		return
	}

	if err := json.NewEncoder(w).Encode(counts); err != nil {
		c.Logger.Warn("Error writing response", mlog.Err(err))
	}
}

func markNotificationHistoryAsRead(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireUserId().RequireNotificationId()
	if c.Err != nil {
		return
	}

	// 본인의 알림만 읽음 처리 가능
	if c.Params.UserId != c.AppContext.Session().UserId {
		c.SetPermissionError(model.PermissionViewMembers)
		return
	}

	if appErr := c.App.MarkNotificationHistoryAsRead(c.AppContext, c.Params.NotificationId); appErr != nil {
		c.Err = appErr
		return
	}

	ReturnStatusOK(w)
}

func markAllNotificationHistoryAsRead(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireUserId()
	if c.Err != nil {
		return
	}

	// 본인의 알림만 읽음 처리 가능
	if c.Params.UserId != c.AppContext.Session().UserId {
		c.SetPermissionError(model.PermissionViewMembers)
		return
	}

	if appErr := c.App.MarkAllNotificationHistoryAsReadForUser(c.AppContext, c.Params.UserId); appErr != nil {
		c.Err = appErr
		return
	}

	ReturnStatusOK(w)
}

func deleteNotificationHistory(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireUserId().RequireNotificationId()
	if c.Err != nil {
		return
	}

	// 본인의 알림만 삭제 가능
	if c.Params.UserId != c.AppContext.Session().UserId {
		c.SetPermissionError(model.PermissionViewMembers)
		return
	}

	if appErr := c.App.DeleteNotificationHistory(c.AppContext, c.Params.NotificationId); appErr != nil {
		c.Err = appErr
		return
	}

	ReturnStatusOK(w)
}
