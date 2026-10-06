// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {
    isCollapsedThreadsEnabled,
} from 'mattermost-redux/selectors/entities/preferences';

import {makeGetDraftsCount} from 'selectors/drafts';

import type {SidebarSize} from 'components/resizable_sidebar/constants';

import type {GlobalState} from 'types/store';
import {LhsPage} from 'types/store/lhs';
import type {StaticPage} from 'types/store/lhs';

export function getIsLhsOpen(state: GlobalState): boolean {
    return state.views.lhs.isOpen;
}

export function getLhsSize(state: GlobalState): SidebarSize {
    return state.views.lhs.size;
}

export function getCurrentStaticPageId(state: GlobalState): string {
    return state.views.lhs.currentStaticPageId;
}

export function getChannelSidebarCollapsed(state: GlobalState): boolean {
    return state.views.lhs.channelSidebarCollapsed;
}

export function getChannelSidebarPeek(state: GlobalState): boolean {
    return state.views.lhs.channelSidebarPeek;
}

export function getIsGlobalThreadsView(state: GlobalState): boolean {
    return state.views.lhs.currentStaticPageId === LhsPage.Threads;
}

export const getDraftsCount = makeGetDraftsCount();

export const getVisibleStaticPages = createSelector(
    'getVisibleSidebarStaticPages',
    isCollapsedThreadsEnabled,
    getDraftsCount,
    (collapsedThreadsEnabled, draftsCount) => {
        const staticPages: StaticPage[] = [];

        // 읽지 않은 항목 모아보기는 항상 노출한다 (FR-001). id는 URL 세그먼트와
        // 같아야 Alt+↑/↓ 이동(switchToLhsStaticPage)이 동작한다.
        staticPages.push({
            id: 'unreads',
            isVisible: true,
        });

        if (collapsedThreadsEnabled) {
            staticPages.push({
                id: 'threads',
                isVisible: true,
            });
        }

        staticPages.push({
            id: 'drafts',
            isVisible: draftsCount > 0,
        });

        return staticPages.filter((item) => item.isVisible);
    },
);
