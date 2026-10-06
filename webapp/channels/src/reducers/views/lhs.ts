// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {TeamTypes, UserTypes} from 'mattermost-redux/action_types';

import {SidebarSize} from 'components/resizable_sidebar/constants';

import {ActionTypes} from 'utils/constants';

import type {MMAction} from 'types/store';

function isOpen(state = false, action: MMAction) {
    switch (action.type) {
    case ActionTypes.TOGGLE_LHS:
        return !state;
    case ActionTypes.OPEN_LHS:
        return true;
    case ActionTypes.CLOSE_LHS:
        return false;
    case ActionTypes.TOGGLE_RHS_MENU:
        return false;
    case ActionTypes.OPEN_RHS_MENU:
        return false;
    case TeamTypes.SELECT_TEAM:
        return false;

    case UserTypes.LOGOUT_SUCCESS:
        return false;
    default:
        return state;
    }
}

function size(state = SidebarSize.MEDIUM, action: MMAction) {
    switch (action.type) {
    case ActionTypes.SET_LHS_SIZE:
        return action.size;
    default:
        return state;
    }
}

function currentStaticPageId(state = '', action: MMAction) {
    switch (action.type) {
    case ActionTypes.SELECT_STATIC_PAGE:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

function channelSidebarCollapsed(state = false, action: MMAction) {
    switch (action.type) {
    case ActionTypes.SET_CHANNEL_SIDEBAR_COLLAPSED:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return false;
    default:
        return state;
    }
}

function channelSidebarPeek(state = false, action: MMAction) {
    switch (action.type) {
    case ActionTypes.SET_CHANNEL_SIDEBAR_PEEK:
        return action.data;
    case ActionTypes.SET_CHANNEL_SIDEBAR_COLLAPSED:
        // 접기 상태가 바뀌면 임시 공개는 초기화한다
        return false;
    case UserTypes.LOGOUT_SUCCESS:
        return false;
    default:
        return state;
    }
}

export default combineReducers({
    isOpen,
    size,
    currentStaticPageId,
    channelSidebarCollapsed,
    channelSidebarPeek,
});
