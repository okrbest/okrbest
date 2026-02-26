// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {memo, useCallback} from 'react';
import {useIntl} from 'react-intl';
import {useSelector, useDispatch} from 'react-redux';
import {useHistory, useLocation, matchPath} from 'react-router-dom';

import {closeRightHandSide, showFlaggedPosts} from 'actions/views/rhs';
import {getIsRhsOpen, getRhsState} from 'selectors/rhs';

import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

import './sidebar_saved_posts_link.scss';

function SidebarSavedPostsLink() {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const history = useHistory();
    const {pathname} = useLocation();
    const rhsState = useSelector((state: GlobalState) => getRhsState(state));
    const rhsOpen = useSelector(getIsRhsOpen);
    const isActive = rhsOpen && rhsState === RHSStates.FLAG;

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
            dispatch(showFlaggedPosts());
        }
    }, [isActive, dispatch, inThreadsOrDrafts, pathname, history]);

    return (
        <ul className='SidebarDrafts NavGroupContent nav nav-pills__container'>
            <li
                className={classNames('SidebarChannel', {active: isActive})}
                tabIndex={-1}
                id='sidebar-saved-posts-button'
            >
                <button
                    onClick={handleClick}
                    id='sidebarItem_savedPosts'
                    draggable='false'
                    className={classNames('SidebarLink sidebar-item', {active: isActive})}
                    tabIndex={0}
                    aria-label={formatMessage({id: 'channel_header.flagged', defaultMessage: 'Saved messages'})}
                >
                    <i className='icon icon-bookmark-outline'/>
                    <div className='SidebarChannelLinkLabel_wrapper'>
                        <span className='SidebarChannelLinkLabel sidebar-item__name'>
                            {formatMessage({id: 'channel_header.flagged', defaultMessage: 'Saved messages'})}
                        </span>
                    </div>
                </button>
            </li>
        </ul>
    );
}

export default memo(SidebarSavedPostsLink);
