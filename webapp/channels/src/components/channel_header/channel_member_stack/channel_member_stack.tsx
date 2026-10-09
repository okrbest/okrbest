// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useCallback, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {getProfilesInChannel} from 'mattermost-redux/actions/users';
import {Client4} from 'mattermost-redux/client';
import {getAllChannelStats} from 'mattermost-redux/selectors/entities/channels';
import {getUserIdsInChannels, getUser} from 'mattermost-redux/selectors/entities/users';

import {closeRightHandSide, showChannelMembers} from 'actions/views/rhs';
import {getRhsState} from 'selectors/rhs';

import Avatar from 'components/widgets/users/avatar';

import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

import './channel_member_stack.scss';

type Props = {
    channelId: string;
    hasPendingJoinRequests?: boolean;
};

const STACK_SIZE = 3;

// Slack식 멤버 아바타 스택 — 겹친 아바타 최대 3명 + 전체 인원수.
// 클릭 동작은 기존 멤버 패널(RHS) 토글 그대로다.
export default function ChannelMemberStack({channelId, hasPendingJoinRequests}: Props) {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    const rhsState = useSelector(getRhsState);
    const memberCount = useSelector((state: GlobalState) => getAllChannelStats(state)[channelId]?.member_count || 0);
    const userIdsInChannel = useSelector((state: GlobalState) => getUserIdsInChannels(state)[channelId]);

    const stackIds = userIdsInChannel ? [...userIdsInChannel].slice(0, STACK_SIZE) : [];

    useEffect(() => {
        if (!userIdsInChannel || userIdsInChannel.size === 0) {
            dispatch(getProfilesInChannel(channelId, 0, STACK_SIZE));
        }
    }, [dispatch, channelId]);

    const active = rhsState === RHSStates.CHANNEL_MEMBERS;

    const handleClick = useCallback(() => {
        if (active) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelMembers(channelId));
        }
    }, [dispatch, channelId, active]);

    return (
        <button
            type='button'
            data-testid='channelMemberStack'
            className={classNames('channel-member-stack btn btn-icon btn-xs', {'channel-member-stack--active': active})}
            onClick={handleClick}
            aria-label={formatMessage({
                id: 'channel_header.memberStack.ariaLabel',
                defaultMessage: 'View {count} members',
            }, {count: memberCount})}
        >
            {stackIds.length > 0 && (
                <span
                    className='channel-member-stack__avatars'
                    aria-hidden='true'
                >
                    {stackIds.map((userId) => (
                        <StackAvatar
                            key={userId}
                            userId={userId}
                        />
                    ))}
                </span>
            )}
            <span
                className='channel-member-stack__count'
                data-testid='channelMemberStack-count'
            >
                {memberCount || '-'}
            </span>
            {hasPendingJoinRequests && (
                <span
                    className='channel-header__join-request-badge'
                    aria-hidden='true'
                    data-testid='channelHeaderJoinRequestBadge'
                />
            )}
        </button>
    );
}

function StackAvatar({userId}: {userId: string}) {
    const user = useSelector((state: GlobalState) => getUser(state, userId));
    if (!user) {
        return null;
    }
    return (
        <Avatar
            size='xs'
            username={user.username}
            url={Client4.getProfilePictureUrl(user.id, user.last_picture_update)}
            className='channel-member-stack__avatar'
        />
    );
}
