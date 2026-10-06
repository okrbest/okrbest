// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';

import {readMultipleChannels} from 'mattermost-redux/actions/channels';

import {selectLhsItem} from 'actions/views/lhs';
import {suppressRHS, unsuppressRHS} from 'actions/views/rhs';

import ChatIllustration from 'components/common/svg_images_components/chat_illustration_svg';
import LoadingScreen from 'components/loading_screen';
import NoResultsIndicator from 'components/no_results_indicator';
import Header from 'components/widgets/header';

import {LhsItemType, LhsPage} from 'types/store/lhs';

import UnreadChannelGroupList from './unread_channel_group_list';
import useUnreadsSnapshot from './use_unreads_snapshot';

import './unreads_view.scss';

const UnreadsView = () => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    const {groups, isLoading, removeGroups} = useUnreadsSnapshot();
    const [hasMarkReadError, setHasMarkReadError] = useState(false);

    useEffect(() => {
        dispatch(selectLhsItem(LhsItemType.Page, LhsPage.Unreads));
        dispatch(suppressRHS);

        return () => {
            dispatch(unsuppressRHS);
        };
    }, []);

    // 읽음 처리는 사용자의 명시적 동작으로만 일어난다 (FR-007·FR-008).
    const markChannelsRead = useCallback(async (channelIds: string[]) => {
        setHasMarkReadError(false);

        const result = await (dispatch(readMultipleChannels(channelIds)) as unknown as Promise<{data?: boolean; error?: unknown}>);

        if (result?.error) {
            setHasMarkReadError(true);
            return;
        }

        removeGroups(channelIds);
    }, [dispatch, removeGroups]);

    const handleMarkAllRead = useCallback(() => {
        markChannelsRead(groups.map((group) => group.channel.id));
    }, [groups, markChannelsRead]);

    // Esc는 포커스가 속한 그룹을 읽음 처리한다 (FR-010). 이모지 선택기·메뉴·모달은
    // 포털로 그룹 바깥에 렌더되므로 그 안의 Esc는 여기까지 버블되지 않는다 —
    // "열린 팝업부터 닫는다" 규칙이 구조적으로 지켜진다.
    const handleBodyKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape') {
            return;
        }

        const groupElement = (event.target as HTMLElement).closest('[data-channel-id]');
        const channelId = groupElement?.getAttribute('data-channel-id');
        if (channelId) {
            markChannelsRead([channelId]);
        }
    }, [markChannelsRead]);

    return (
        <div
            id='app-content'
            className='UnreadsView app__content'
        >
            <Header
                level={2}
                className='UnreadsView__header'
                data-testid='unreads-header'
                heading={
                    <FormattedMessage
                        id='unreads.heading'
                        defaultMessage='Unreads'
                    />
                }
                subtitle={
                    <FormattedMessage
                        id='unreads.subtitle'
                        defaultMessage='Unread messages from all your channels show here'
                    />
                }
                right={groups.length > 0 ? (
                    <button
                        type='button'
                        className='btn btn-tertiary btn-sm'
                        onClick={handleMarkAllRead}
                    >
                        <FormattedMessage
                            id='unreads.markAllRead'
                            defaultMessage='Mark all as read'
                        />
                    </button>
                ) : undefined}
            />
            <div
                className='UnreadsView__body'
                onKeyDown={handleBodyKeyDown}
            >
                {hasMarkReadError && (
                    <div
                        className='UnreadsView__error'
                        role='alert'
                    >
                        <FormattedMessage
                            id='unreads.markReadError'
                            defaultMessage='Couldn’t mark as read. Please try again.'
                        />
                    </div>
                )}
                {groups.length > 0 && (
                    <UnreadChannelGroupList
                        groups={groups}
                        renderGroupActions={(group) => (
                            <button
                                type='button'
                                className='btn btn-tertiary btn-xs'
                                onClick={() => markChannelsRead([group.channel.id])}
                            >
                                <FormattedMessage
                                    id='unreads.group.markRead'
                                    defaultMessage='Mark as read'
                                />
                            </button>
                        )}
                    />
                )}
                {groups.length === 0 && isLoading && (
                    <LoadingScreen/>
                )}
                {groups.length === 0 && !isLoading && (
                    <NoResultsIndicator
                        expanded={true}
                        iconGraphic={ChatIllustration}
                        title={formatMessage({
                            id: 'unreads.emptyState.title',
                            defaultMessage: 'You’re all caught up',
                        })}
                        subtitle={formatMessage({
                            id: 'unreads.emptyState.subtitle',
                            defaultMessage: 'New unread messages will show here.',
                        })}
                    />
                )}
            </div>
        </div>
    );
};

export default UnreadsView;
