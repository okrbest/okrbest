// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type NotificationHistoryItem = {
    id: string;
    user_id: string;
    sender_id: string;
    type: NotificationType;
    post_id: string;
    channel_id: string;
    team_id: string;
    root_id: string;
    title: string;
    message: string;
    is_read: boolean;
    is_urgent: boolean;
    create_at: number;
    read_at: number;
    sender_username?: string;
    channel_name?: string;
    team_name?: string;
};

export type NotificationType =
    | 'mention'
    | 'direct_message'
    | 'group_message'
    | 'thread_reply'
    | 'channel_post'
    | 'system';

export type NotificationHistoryResponse = {
    notifications: NotificationHistoryItem[];
    total_count: number;
    unread_count: number;
    has_more: boolean;
};

export type NotificationCountsResponse = {
    total_count: number;
    unread_count: number;
    mention_count: number;
    dm_count: number;
    thread_count: number;
    urgent_count: number;
};

export type GetNotificationHistoryParams = {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
    types?: string;
    team_id?: string;
    since?: number;
};
