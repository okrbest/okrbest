// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {shallowEqual, useSelector} from 'react-redux';
import {useHistory} from 'react-router-dom';

import type {Channel} from '@mattermost/types/channels';

import {isChannelAutotranslated} from 'mattermost-redux/selectors/entities/channels';
import {getPost} from 'mattermost-redux/selectors/entities/posts';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {getChannelURL} from 'selectors/urls';

import DraftTitle from 'components/drafts/draft_title';
import PostComponent from 'components/post';
import ChannelMentionBadge from 'components/sidebar/sidebar_channel/channel_mention_badge';

import {Locations} from 'utils/constants';

import type {GlobalState} from 'types/store';

export type Props = {
    channel: Channel;
    lastViewedAt: number;
    mentionCount: number;
    postIds: string[];
    hasLoadFailed: boolean;
    actions?: React.ReactNode;
};

const UnreadChannelGroup = ({
    channel,
    mentionCount,
    postIds,
    hasLoadFailed,
    actions,
}: Props) => {
    const history = useHistory();
    const {formatMessage} = useIntl();

    // 접힘 상태는 세션 한정 — 저장하지 않는다 (FR-012).
    const [isCollapsed, setIsCollapsed] = useState(false);

    const currentUserId = useSelector(getCurrentUserId);
    const channelUrl = useSelector((state: GlobalState) => getChannelURL(state, channel, channel.team_id));
    const autotranslated = useSelector((state: GlobalState) => isChannelAutotranslated(state, channel.id));
    const posts = useSelector(
        (state: GlobalState) => postIds.map((postId) => getPost(state, postId)).filter(Boolean),
        shallowEqual,
    );

    const handleOpenChannel = useCallback(() => {
        history.push(channelUrl);
    }, [history, channelUrl]);

    return (
        <section
            className='UnreadChannelGroup'
            data-testid={`unread-group-${channel.id}`}
            data-channel-id={channel.id}
        >
            <header className='UnreadChannelGroup__header'>
                <button
                    type='button'
                    className='UnreadChannelGroup__collapse style--none'
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? formatMessage({
                        id: 'unreads.group.expand',
                        defaultMessage: 'Expand channel group',
                    }) : formatMessage({
                        id: 'unreads.group.collapse',
                        defaultMessage: 'Collapse channel group',
                    })}
                    onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                >
                    <i className={isCollapsed ? 'icon icon-chevron-right' : 'icon icon-chevron-down'}/>
                </button>
                <button
                    type='button'
                    className='UnreadChannelGroup__title style--none'
                    onClick={handleOpenChannel}
                >
                    <DraftTitle
                        type='channel'
                        channel={channel}
                        userId={currentUserId}
                    />
                </button>
                {mentionCount > 0 && (
                    <ChannelMentionBadge unreadMentions={mentionCount}/>
                )}
                <div className='UnreadChannelGroup__actions'>
                    {actions}
                </div>
            </header>
            {!isCollapsed && <div className='UnreadChannelGroup__posts'>
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className='UnreadChannelGroup__post'
                    >
                        <PostComponent
                            post={post}
                            location={Locations.SEARCH}
                            isChannelAutotranslated={autotranslated}
                        />
                    </div>
                ))}
                {hasLoadFailed && posts.length === 0 && (
                    <div className='UnreadChannelGroup__load-failed'>
                        <FormattedMessage
                            id='unreads.group.loadFailed'
                            defaultMessage='Couldn’t load unread messages. Open the channel to view them.'
                        />
                    </div>
                )}
            </div>}
        </section>
    );
};

export default UnreadChannelGroup;
