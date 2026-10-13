// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {useSelector} from 'react-redux';
import {matchPath, useLocation, Link} from 'react-router-dom';

import {getUnreadStatusInCurrentTeam} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentRelativeTeamUrl} from 'mattermost-redux/selectors/entities/teams';

import {getSplitUnreadCountsInCurrentTeam} from 'selectors/unreads';

import ChannelMentionBadge from 'components/sidebar/sidebar_channel/channel_mention_badge';

import './unreads_link.scss';

// Slack의 "읽지 않은 항목" 벤치마크 — 사이드바 static 영역 최상단에 항상 표시한다
// (FR-001). 클릭하면 /:team/unreads 전용 화면으로 이동한다 (FR-002).
const UnreadsLink = () => {
    const {pathname} = useLocation();

    const unreadStatus = useSelector(getUnreadStatusInCurrentTeam);
    const teamUrl = useSelector(getCurrentRelativeTeamUrl);

    // okrbest(027): 멘션·DM·GM 수와 일반 채널 미읽음 수를 구분 병기한다.
    // mentions는 unreadStatus의 number 값과 항상 같다 (selectors/unreads.ts 참조)
    const {mentions, messages} = useSelector(getSplitUnreadCountsInCurrentTeam);

    const isActive = Boolean(matchPath(pathname, {path: '/:team/unreads'}));
    const hasUnreads = Boolean(unreadStatus);

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
                    {/* okrbest(027): 일반 뱃지(파랑 틴트, 025 표기)가 왼쪽, 멘션 뱃지가 오른쪽 끝 (100건 이상은 99) */}
                    {messages > 0 && (
                        <span
                            className='badge unreadMsgBadge'
                            data-testid='unreadMsgBadge'
                        >
                            {Math.min(messages, 99)}
                        </span>
                    )}
                    {mentions > 0 && (
                        <ChannelMentionBadge unreadMentions={mentions}/>
                    )}
                </Link>
            </li>
        </ul>
    );
};

export default UnreadsLink;
