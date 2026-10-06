// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {WithTooltip} from '@mattermost/shared/components/tooltip';

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {setChannelSidebarCollapsed} from 'actions/views/lhs';
import {getChannelSidebarCollapsed} from 'selectors/lhs';

// OKR.BEST: 채널 사이드바 표시/숨기기 토글. 기본은 "숨기기" 모드(사이드바 보임).
// 접힌 상태에서는 팀 레일 호버로 사이드바가 임시 공개되고, 이 버튼은
// "표시" 모드로 동작해 다시 고정한다. 상태는 사용자별 localStorage에 보존한다.
const ChannelSidebarToggle = () => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    const currentUserId = useSelector(getCurrentUserId);
    const collapsed = useSelector(getChannelSidebarCollapsed);

    const storageKey = `channel_sidebar_collapsed_${currentUserId}`;

    useEffect(() => {
        try {
            if (localStorage.getItem(storageKey) === 'true') {
                dispatch(setChannelSidebarCollapsed(true));
            }
        } catch {
            // localStorage를 못 쓰는 환경에서는 세션 한정으로 동작한다
        }
    }, [storageKey, dispatch]);

    const handleToggle = useCallback(() => {
        const next = !collapsed;
        dispatch(setChannelSidebarCollapsed(next));
        try {
            localStorage.setItem(storageKey, String(next));
        } catch {
            // 보존 실패는 무시 — 동작 자체는 유지
        }
    }, [collapsed, dispatch, storageKey]);

    const label = collapsed ? formatMessage({
        id: 'sidebar.channelSidebarToggle.show',
        defaultMessage: 'Show channel sidebar',
    }) : formatMessage({
        id: 'sidebar.channelSidebarToggle.hide',
        defaultMessage: 'Hide channel sidebar',
    });

    return (
        <WithTooltip title={label}>
            <button
                type='button'
                className='ChannelSidebarToggle style--none'
                aria-label={label}
                aria-pressed={collapsed}
                onClick={handleToggle}
            >
                <i className='icon icon-dock-left'/>
            </button>
        </WithTooltip>
    );
};

export default ChannelSidebarToggle;
