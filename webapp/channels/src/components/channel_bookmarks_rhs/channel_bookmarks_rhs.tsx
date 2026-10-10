// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {WithTooltip} from '@mattermost/shared/components/tooltip';
import type {ChannelBookmark} from '@mattermost/types/channel_bookmarks';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import {closeRightHandSide} from 'actions/views/rhs';

import {DynamicLink, useBookmarkLink} from 'components/channel_bookmarks/bookmark_item_content';
import {useBookmarkAddActions} from 'components/channel_bookmarks/channel_bookmarks_menu';
import {MAX_BOOKMARKS_PER_CHANNEL, useChannelBookmarkPermission, useChannelBookmarks} from 'components/channel_bookmarks/utils';

import './channel_bookmarks_rhs.scss';

// 채널 북마크 패널 — 파일·고정과 같은 우측 패널(RHS) 진입점.
// 데이터·열기 동작은 북마크 바와 같은 훅(useChannelBookmarks/useBookmarkLink)을 쓴다.
export default function ChannelBookmarksRhs() {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    const channel = useSelector(getCurrentChannel);
    const channelId = channel?.id ?? '';

    const {bookmarks, order} = useChannelBookmarks(channelId);
    const canAdd = useChannelBookmarkPermission(channelId, 'add');
    const {handleCreateLink} = useBookmarkAddActions(channelId);

    if (!channel) {
        return null;
    }

    const limitReached = order.length >= MAX_BOOKMARKS_PER_CHANNEL;

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body channel-bookmarks-rhs'
        >
            <div className='sidebar--right__header'>
                <span className='sidebar--right__title'>
                    <h2>
                        <span
                            id='rhsPanelTitle'
                            className='channel-bookmarks-rhs__title'
                        >
                            <FormattedMessage
                                id='channel_bookmarks_rhs.header.title'
                                defaultMessage='Bookmarks'
                            />
                        </span>
                        {channel.display_name && (
                            <span className='style--none sidebar--right__title__subtitle'>
                                {channel.display_name}
                            </span>
                        )}
                    </h2>
                </span>
                <WithTooltip
                    title={
                        <FormattedMessage
                            id='rhs_header.closeSidebarTooltip'
                            defaultMessage='Close'
                        />
                    }
                >
                    <button
                        id='rhsCloseButton'
                        type='button'
                        className='sidebar--right__close btn btn-icon btn-sm'
                        aria-label={formatMessage({id: 'rhs_header.closeTooltip.icon', defaultMessage: 'Close Sidebar Icon'})}
                        onClick={() => dispatch(closeRightHandSide())}
                    >
                        <i className='icon icon-close'/>
                    </button>
                </WithTooltip>
            </div>
            <div className='channel-bookmarks-rhs__body'>
                {order.length === 0 ? (
                    <div className='channel-bookmarks-rhs__empty'>
                        <FormattedMessage
                            id='channel_bookmarks_rhs.empty'
                            defaultMessage='No bookmarks yet. Add links or files to keep them handy for everyone in the channel.'
                        />
                    </div>
                ) : (
                    <ul className='channel-bookmarks-rhs__list'>
                        {order.map((id) => {
                            const bookmark = bookmarks[id];
                            if (!bookmark) {
                                return null;
                            }
                            return (
                                <BookmarkRow
                                    key={id}
                                    bookmark={bookmark}
                                />
                            );
                        })}
                    </ul>
                )}
                {canAdd && !limitReached && (
                    <button
                        type='button'
                        className='channel-bookmarks-rhs__add btn btn-tertiary btn-sm'
                        onClick={() => handleCreateLink()}
                    >
                        <i
                            className='icon icon-plus'
                            aria-hidden={true}
                        />
                        <FormattedMessage
                            id='channel_bookmarks.addBookmark'
                            defaultMessage='Add a bookmark'
                        />
                    </button>
                )}
            </div>
        </div>
    );
}

function BookmarkRow({bookmark}: {bookmark: ChannelBookmark}) {
    const {href, onClick, linkRef, isFile, icon, displayName} = useBookmarkLink(bookmark, false);

    // 북마크 바와 같은 링크 전략(내부 경로는 라우터, 외부는 새 탭, 파일은 미리보기)
    return (
        <li className='channel-bookmarks-rhs__item'>
            <DynamicLink
                ref={linkRef}
                className='channel-bookmarks-rhs__link'
                href={href}
                onClick={onClick}
                isFile={isFile}
            >
                <span
                    className='channel-bookmarks-rhs__icon'
                    aria-hidden={true}
                >
                    {icon}
                </span>
                <span className='channel-bookmarks-rhs__name'>{displayName}</span>
                {bookmark.type === 'link' && bookmark.link_url && (
                    <span className='channel-bookmarks-rhs__url'>{bookmark.link_url}</span>
                )}
            </DynamicLink>
        </li>
    );
}
