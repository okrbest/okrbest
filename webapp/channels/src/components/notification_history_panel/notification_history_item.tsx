// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useCallback} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useSelector} from 'react-redux';

import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import WithTooltip from 'components/with_tooltip';

import {getHistory} from 'utils/browser_history';

import type {NotificationHistoryItem} from 'types/notification_history';
import type {GlobalState} from 'types/store';

type Props = {
    notification: NotificationHistoryItem;
    onMarkAsRead: (notificationId: string) => void;
    onDelete: (notificationId: string) => void;
};

const NotificationHistoryItemComponent: React.FC<Props> = ({
    notification,
    onMarkAsRead,
    onDelete,
}) => {
    const intl = useIntl();
    const currentTeam = useSelector((state: GlobalState) => getCurrentTeam(state));

    const getNotificationIcon = () => {
        switch (notification.type) {
        case 'mention':
            return 'icon-at';
        case 'direct_message':
            return 'icon-send';
        case 'group_message':
            return 'icon-account-multiple-outline';
        case 'thread_reply':
            return 'icon-reply-outline';
        case 'channel_post':
            return 'icon-globe';
        case 'system':
            return 'icon-information-outline';
        default:
            return 'icon-bell-outline';
        }
    };

    const getNotificationTypeLabel = () => {
        switch (notification.type) {
        case 'mention':
            return intl.formatMessage({id: 'notification_history.type.mention', defaultMessage: 'Mention'});
        case 'direct_message':
            return intl.formatMessage({id: 'notification_history.type.direct_message', defaultMessage: 'Direct message'});
        case 'group_message':
            return intl.formatMessage({id: 'notification_history.type.group_message', defaultMessage: 'Group message'});
        case 'thread_reply':
            return intl.formatMessage({id: 'notification_history.type.thread_reply', defaultMessage: 'Thread reply'});
        case 'channel_post':
            return intl.formatMessage({id: 'notification_history.type.channel_post', defaultMessage: 'Channel post'});
        case 'system':
            return intl.formatMessage({id: 'notification_history.type.system', defaultMessage: 'System'});
        default:
            return intl.formatMessage({id: 'notification_history.type.notification', defaultMessage: 'Notification'});
        }
    };

    const getTimeAgo = () => {
        const now = Date.now();
        const diff = now - notification.create_at;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return intl.formatMessage(
                {id: 'notification_history.time.days_ago', defaultMessage: '{days}d ago'},
                {days},
            );
        }
        if (hours > 0) {
            return intl.formatMessage(
                {id: 'notification_history.time.hours_ago', defaultMessage: '{hours}h ago'},
                {hours},
            );
        }
        if (minutes > 0) {
            return intl.formatMessage(
                {id: 'notification_history.time.minutes_ago', defaultMessage: '{minutes}m ago'},
                {minutes},
            );
        }
        return intl.formatMessage({id: 'notification_history.time.just_now', defaultMessage: 'Just now'});
    };

    const navigateToPost = useCallback(() => {
        if (!notification.post_id) {
            // eslint-disable-next-line no-console
            console.log('[NotificationHistory] navigateToPost: No post_id', {
                notificationId: notification.id,
                notification,
            });
            return;
        }

        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }

        // Navigate to post using permalink URL (same as 바로가기 menu)
        // Use team_name from notification if available, otherwise fallback to current team
        // This ensures it works in deployment where team_name might not be set
        const teamName = notification.team_name || currentTeam?.name || '';

        // eslint-disable-next-line no-console
        console.log('[NotificationHistory] navigateToPost: Navigation attempt', {
            notificationId: notification.id,
            postId: notification.post_id,
            notificationTeamName: notification.team_name,
            currentTeamName: currentTeam?.name,
            currentTeamId: currentTeam?.id,
            finalTeamName: teamName,
            teamId: notification.team_id,
            channelId: notification.channel_id,
        });

        if (!teamName) {
            // If no team name is available, we can't navigate
            // eslint-disable-next-line no-console
            console.error('[NotificationHistory] navigateToPost: No team name available', {
                notificationId: notification.id,
                postId: notification.post_id,
                notificationTeamName: notification.team_name,
                currentTeam,
            });
            return;
        }

        const permalinkUrl = `/${teamName}/pl/${notification.post_id}`;
        // eslint-disable-next-line no-console
        console.log('[NotificationHistory] navigateToPost: Navigating to', {
            url: permalinkUrl,
            notificationId: notification.id,
            postId: notification.post_id,
        });

        getHistory().push(permalinkUrl);
    }, [notification, onMarkAsRead, currentTeam]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToPost();
    }, [navigateToPost]);

    const handleMarkAsRead = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
    }, [notification, onMarkAsRead]);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(notification.id);
    }, [notification.id, onDelete]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateToPost();
        }
    }, [navigateToPost]);

    return (
        <div
            className={classNames('notification-history-item', {
                'notification-history-item--unread': !notification.is_read,
                'notification-history-item--urgent': notification.is_urgent,
            })}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role='button'
            tabIndex={0}
        >
            <div className='notification-history-item__icon'>
                <i className={getNotificationIcon()}/>
            </div>
            <div className='notification-history-item__content'>
                <div className='notification-history-item__header'>
                    <span className='notification-history-item__title'>
                        {notification.title || getNotificationTypeLabel()}
                    </span>
                    <span className='notification-history-item__time'>
                        {getTimeAgo()}
                    </span>
                </div>
                <div className='notification-history-item__message'>
                    {notification.message}
                </div>
                <div className='notification-history-item__meta'>
                    <span className='notification-history-item__type-badge'>
                        {getNotificationTypeLabel()}
                    </span>
                    {notification.is_urgent && (
                        <span className='notification-history-item__urgent-badge'>
                            <FormattedMessage
                                id='notification_history.urgent'
                                defaultMessage='Urgent'
                            />
                        </span>
                    )}
                </div>
            </div>
            <div className='notification-history-item__actions'>
                {!notification.is_read && (
                    <WithTooltip
                        title={
                            <FormattedMessage
                                id='notification_history.markAsRead'
                                defaultMessage='Mark as read'
                            />
                        }
                    >
                        <button
                            className='notification-history-item__action-btn'
                            onClick={handleMarkAsRead}
                            aria-label={intl.formatMessage({id: 'notification_history.markAsRead', defaultMessage: 'Mark as read'})}
                        >
                            <i className='icon-check'/>
                        </button>
                    </WithTooltip>
                )}
                <WithTooltip
                    title={
                        <FormattedMessage
                            id='notification_history.delete'
                            defaultMessage='Delete'
                        />
                    }
                >
                    <button
                        className='notification-history-item__action-btn'
                        onClick={handleDeleteClick}
                        aria-label={intl.formatMessage({id: 'notification_history.delete', defaultMessage: 'Delete'})}
                    >
                        <i className='icon-close'/>
                    </button>
                </WithTooltip>
            </div>
        </div>
    );
};

export default NotificationHistoryItemComponent;
