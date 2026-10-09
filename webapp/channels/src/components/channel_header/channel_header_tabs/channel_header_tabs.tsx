// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useCallback} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {
    BookOutlineIcon,
    FileTextOutlineIcon,
    MessageTextOutlineIcon,
    PinOutlineIcon,
} from '@mattermost/compass-icons/components';

import {getAllChannelStats} from 'mattermost-redux/selectors/entities/channels';

import {closeRightHandSide, showChannelFiles, showPinnedPosts} from 'actions/views/rhs';
import {getRhsState} from 'selectors/rhs';

import {
    isBookmarksBarCollapsed,
    toggleBookmarksBarCollapsed,
} from 'components/channel_bookmarks/bookmark_bar_collapse';
import {getIsChannelBookmarksEnabled} from 'components/channel_bookmarks/utils';

import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

import './channel_header_tabs.scss';

type Props = {
    channelId: string;
};

// Slack식 채널 콘텐츠 탭 줄 — 탭 활성은 전부 RHS·북마크 바 상태에서 파생한다.
// 내부 상태를 두지 않으므로 패널을 어떤 경로로 닫아도 탭이 함께 돌아온다.
export default function ChannelHeaderTabs({channelId}: Props) {
    const dispatch = useDispatch();

    const rhsState = useSelector(getRhsState);
    const pinnedCount = useSelector((state: GlobalState) => getAllChannelStats(state)[channelId]?.pinnedpost_count || 0);
    const bookmarksEnabled = useSelector(getIsChannelBookmarksEnabled);
    const bookmarksCollapsed = useSelector((state: GlobalState) => isBookmarksBarCollapsed(state, channelId));

    const filesActive = rhsState === RHSStates.CHANNEL_FILES;
    const pinnedActive = rhsState === RHSStates.PIN;
    const messagesActive = !rhsState;
    const bookmarksActive = bookmarksEnabled && !bookmarksCollapsed;

    const handleMessages = useCallback(() => {
        if (rhsState) {
            dispatch(closeRightHandSide());
        }
    }, [dispatch, rhsState]);

    // 기존 액션은 토글이 아니므로(기존 헤더 버튼이 분기하던 방식) 여기서 분기한다
    const handleFiles = useCallback(() => {
        if (filesActive) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelFiles(channelId));
        }
    }, [dispatch, channelId, filesActive]);

    const handlePinned = useCallback(() => {
        if (pinnedActive) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showPinnedPosts(channelId));
        }
    }, [dispatch, channelId, pinnedActive]);

    const handleBookmarks = useCallback(() => {
        dispatch(toggleBookmarksBarCollapsed(channelId));
    }, [dispatch, channelId]);

    return (
        <div
            className='channel-header-tabs'
            role='tablist'
        >
            <button
                type='button'
                role='tab'
                id='channelHeaderTab-messages'
                aria-selected={messagesActive}
                className={classNames('channel-header-tabs__tab', {active: messagesActive})}
                onClick={handleMessages}
            >
                <MessageTextOutlineIcon
                    size={14}
                    aria-hidden='true'
                />
                <FormattedMessage
                    id='channel_header.tabs.messages'
                    defaultMessage='Messages'
                />
            </button>
            <button
                type='button'
                role='tab'
                id='channelHeaderTab-files'
                aria-selected={filesActive}
                className={classNames('channel-header-tabs__tab', {active: filesActive})}
                onClick={handleFiles}
            >
                <FileTextOutlineIcon
                    size={14}
                    aria-hidden='true'
                />
                <FormattedMessage
                    id='channel_header.tabs.files'
                    defaultMessage='Files'
                />
            </button>
            {bookmarksEnabled && (
                <button
                    type='button'
                    role='tab'
                    id='channelHeaderTab-bookmarks'
                    aria-selected={bookmarksActive}
                    className={classNames('channel-header-tabs__tab', {active: bookmarksActive})}
                    onClick={handleBookmarks}
                >
                    <BookOutlineIcon
                        size={14}
                        aria-hidden='true'
                    />
                    <FormattedMessage
                        id='channel_header.tabs.bookmarks'
                        defaultMessage='Bookmarks'
                    />
                </button>
            )}
            <button
                type='button'
                role='tab'
                id='channelHeaderTab-pinned'
                aria-selected={pinnedActive}
                className={classNames('channel-header-tabs__tab', {active: pinnedActive})}
                onClick={handlePinned}
            >
                <PinOutlineIcon
                    size={14}
                    aria-hidden='true'
                />
                <FormattedMessage
                    id='channel_header.tabs.pinned'
                    defaultMessage='Pinned'
                />
                {pinnedCount > 0 && (
                    <span
                        className='channel-header-tabs__badge'
                        data-testid='channelHeaderTab-pinned-badge'
                    >
                        {pinnedCount}
                    </span>
                )}
            </button>
        </div>
    );
}
