// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {memo, useCallback} from 'react';
import {useIntl} from 'react-intl';
import {useSelector, useDispatch} from 'react-redux';
import {useHistory, useLocation, matchPath} from 'react-router-dom';

import {isCollapsedThreadsEnabled} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentTeamMembership} from 'mattermost-redux/selectors/entities/teams';
import {getThreadCountsInCurrentTeam} from 'mattermost-redux/selectors/entities/threads';

import {closeRightHandSide, showMentions} from 'actions/views/rhs';
import {getIsRhsOpen, getRhsState} from 'selectors/rhs';

import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

import './sidebar_mentions_link.scss';

function SidebarMentionsLink() {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const history = useHistory();
    const {pathname} = useLocation();
    const rhsState = useSelector((state: GlobalState) => getRhsState(state));
    const rhsOpen = useSelector(getIsRhsOpen);
    const currentTeamMembership = useSelector(getCurrentTeamMembership);
    const collapsedThreads = useSelector(isCollapsedThreadsEnabled);
    const threadCounts = useSelector(getThreadCountsInCurrentTeam);
    const isActive = rhsOpen && rhsState === RHSStates.MENTION;
    const channelMentionCount = currentTeamMembership ? (collapsedThreads ? currentTeamMembership.mention_count_root : currentTeamMembership.mention_count) ?? 0 : 0;
    const threadMentionCount = threadCounts?.total_unread_mentions ?? 0;
    const hasMentions = channelMentionCount > 0 || threadMentionCount > 0;

    const inThreadsOrDrafts = matchPath(pathname, {path: '/:team/(threads|drafts)'}) != null;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (isActive) {
            dispatch(closeRightHandSide());
        } else {
            if (inThreadsOrDrafts) {
                const teamMatch = matchPath<{team: string}>(pathname, {path: '/:team'});
                if (teamMatch) {
                    history.push(`/${teamMatch.params.team}/channels/town-square`);
                }
            }
            dispatch(showMentions());
        }
    }, [isActive, dispatch, inThreadsOrDrafts, pathname, history]);

    return (
        <ul className='SidebarDrafts NavGroupContent nav nav-pills__container'>
            <li
                className={classNames('SidebarChannel', {
                    active: isActive,
                    unread: hasMentions,
                })}
                tabIndex={-1}
                id='sidebar-mentions-button'
            >
                <button
                    onClick={handleClick}
                    id='sidebarItem_mentions'
                    draggable='false'
                    className={classNames('SidebarLink sidebar-item', {
                        active: isActive,
                        'unread-title': hasMentions,
                    })}
                    tabIndex={0}
                    aria-label={formatMessage({id: 'channel_header.recentMentions', defaultMessage: 'Recent mentions'})}
                >
                    <i className='icon icon-at'/>
                    <div className='SidebarChannelLinkLabel_wrapper'>
                        <span className='SidebarChannelLinkLabel sidebar-item__name'>
                            {formatMessage({id: 'channel_header.recentMentions', defaultMessage: 'Recent mentions'})}
                        </span>
                    </div>
                    {hasMentions && (
                        <span
                            className='SidebarMentionsDot'
                            aria-hidden='true'
                        />
                    )}
                </button>
            </li>
        </ul>
    );
}

export default memo(SidebarMentionsLink);
