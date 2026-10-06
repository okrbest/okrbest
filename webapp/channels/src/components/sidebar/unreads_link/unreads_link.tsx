// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {useSelector} from 'react-redux';
import {matchPath, useLocation, Link} from 'react-router-dom';

import {getUnreadStatusInCurrentTeam} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentRelativeTeamUrl} from 'mattermost-redux/selectors/entities/teams';

import ChannelMentionBadge from 'components/sidebar/sidebar_channel/channel_mention_badge';

import './unreads_link.scss';

// Slack의 "읽지 않은 항목" 벤치마크 — 사이드바 static 영역 최상단에 항상 표시한다
// (FR-001). 클릭하면 /:team/unreads 전용 화면으로 이동한다 (FR-002).
const UnreadsLink = () => {
    const {pathname} = useLocation();

    const unreadStatus = useSelector(getUnreadStatusInCurrentTeam);
    const teamUrl = useSelector(getCurrentRelativeTeamUrl);

    const isActive = Boolean(matchPath(pathname, {path: '/:team/unreads'}));
    const hasUnreads = Boolean(unreadStatus);
    const mentionCount = typeof unreadStatus === 'number' ? unreadStatus : 0;

    return (
        <ul className='SidebarUnreads NavGroupContent nav nav-pills__container'>
            <li
                className={classNames('SidebarChannel', {
                    active: isActive,
                    unread: hasUnreads,
                })}
                tabIndex={-1}
                id='sidebar-unreads-button'
            >
                <Link
                    to={`${teamUrl}/unreads`}
                    id='sidebarItem_unreads'
                    draggable='false'
                    className={classNames('SidebarLink sidebar-item', {
                        'unread-title': hasUnreads,
                    })}
                    tabIndex={0}
                >
                    <i className='icon icon-mark-as-unread'/>
                    <div className='SidebarChannelLinkLabel_wrapper'>
                        <span className='SidebarChannelLinkLabel sidebar-item__name'>
                            <FormattedMessage
                                id='unreads.sidebarLink'
                                defaultMessage='Unreads'
                            />
                        </span>
                    </div>
                    {mentionCount > 0 && (
                        <ChannelMentionBadge unreadMentions={mentionCount}/>
                    )}
                </Link>
            </li>
        </ul>
    );
};

export default UnreadsLink;
