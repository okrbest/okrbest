// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FormattedMessage} from 'react-intl';

import {Client4} from 'mattermost-redux/client';

import Scrollbars from 'components/common/scrollbars';
import NoResultsIndicator from 'components/no_results_indicator/no_results_indicator';
import {NoResultsVariant} from 'components/no_results_indicator/types';
import SearchResultsHeader from 'components/search_results_header';

import type {NotificationHistoryItem, NotificationHistoryResponse} from 'types/notification_history';

import NotificationHistoryItemRow from './notification_history_item';

import './notification_history_panel.scss';

const PER_PAGE = 30;

const NotificationHistoryPanel: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const scrollbarsRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async (pageNum: number, resetList = false) => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number | boolean> = {
                page: pageNum,
                per_page: PER_PAGE,
            };

            if (filter === 'unread') {
                params.unread_only = true;
            }

            const response: NotificationHistoryResponse = await Client4.getNotificationHistory(params);

            if (resetList) {
                setNotifications(response.notifications || []);
            } else {
                setNotifications((prev) => [...prev, ...(response.notifications || [])]);
            }
            setUnreadCount(response.unread_count);
            setHasMore(response.has_more);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to fetch notification history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        setPage(0);
        fetchNotifications(0, true);
    }, [fetchNotifications, filter]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage);
        }
    }, [hasMore, isLoading, page, fetchNotifications]);

    const handleScroll = useCallback((e: Event) => {
        const target = e.target as HTMLDivElement;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;

        if (scrollHeight - scrollTop - clientHeight < 100) {
            handleLoadMore();
        }
    }, [handleLoadMore]);

    const handleMarkAsRead = useCallback(async (notificationId: string) => {
        try {
            await Client4.markNotificationAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) => {
                    if (n.id === notificationId) {
                        return {...n, is_read: true, read_at: Date.now()};
                    }
                    return n;
                }),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            await Client4.markAllNotificationsAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({...n, is_read: true, read_at: Date.now()})),
            );
            setUnreadCount(0);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    const handleDelete = useCallback(async (notificationId: string) => {
        try {
            await Client4.deleteNotification(notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to delete notification:', error);
        }
    }, []);

    const renderHeader = () => {
        return (
            <SearchResultsHeader>
                <div className='notification-history-panel__header-title'>
                    <FormattedMessage
                        id='notification_history.title'
                        defaultMessage='Notification history'
                    />
                    {unreadCount > 0 && (
                        <span className='notification-history-panel__badge'>
                            {unreadCount}
                        </span>
                    )}
                </div>
            </SearchResultsHeader>
        );
    };

    const renderFilterBar = () => {
        return (
            <div className='notification-history-panel__filter-bar'>
                <div className='notification-history-panel__filters'>
                    <button
                        className={`notification-history-panel__filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <FormattedMessage
                            id='notification_history.filter.all'
                            defaultMessage='All'
                        />
                    </button>
                    <button
                        className={`notification-history-panel__filter-btn ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        <FormattedMessage
                            id='notification_history.filter.unread'
                            defaultMessage='Unread'
                        />
                    </button>
                </div>
                {unreadCount > 0 && (
                    <button
                        className='notification-history-panel__mark-all-read'
                        onClick={handleMarkAllAsRead}
                    >
                        <FormattedMessage
                            id='notification_history.markAllRead'
                            defaultMessage='Mark all as read'
                        />
                    </button>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (isLoading && notifications.length === 0) {
            return (
                <div className='notification-history-panel__loading'>
                    <i className='fa fa-spinner fa-spin'/>
                    <FormattedMessage
                        id='notification_history.loading'
                        defaultMessage='Loading notifications...'
                    />
                </div>
            );
        }

        if (notifications.length === 0) {
            return (
                <NoResultsIndicator
                    variant={NoResultsVariant.Mentions}
                    titleValues={{}}
                />
            );
        }

        return (
            <Scrollbars
                ref={scrollbarsRef}
                onScroll={handleScroll}
            >
                <div className='notification-history-panel__list'>
                    {notifications.map((notification) => (
                        <NotificationHistoryItemRow
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                        />
                    ))}
                    {isLoading && (
                        <div className='notification-history-panel__loading-more'>
                            <i className='fa fa-spinner fa-spin'/>
                        </div>
                    )}
                </div>
            </Scrollbars>
        );
    };

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body notification-history-panel'
        >
            {renderHeader()}
            {renderFilterBar()}
            {renderContent()}
        </div>
    );
};

export default NotificationHistoryPanel;
