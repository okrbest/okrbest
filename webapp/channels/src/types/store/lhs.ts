// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {SidebarSize} from 'components/resizable_sidebar/constants';

export type LhsViewState = {
    isOpen: boolean;

    size: SidebarSize;

    // Static pages (e.g. Threads, Insights, etc.)
    currentStaticPageId: string;

    // OKR.BEST: 채널 사이드바 접기(토글)와 레일 호버 임시 공개(peek)
    channelSidebarCollapsed: boolean;
    channelSidebarPeek: boolean;
};

export enum LhsItemType {
    None = 'none',
    Page = 'page',
    Channel = 'channel',
}

export enum LhsPage {
    Drafts = 'drafts',
    Recaps = 'recaps',
    Threads = 'threads',
    Unreads = 'unreads',
}

export type StaticPage = {
    id: string;
    isVisible: boolean;
};

