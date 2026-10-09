// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {GlobalState} from '@mattermost/types/store';

import {deletePreferences, savePreferences} from 'mattermost-redux/actions/preferences';
import {get} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import type {ThunkActionFunc} from 'types/store';

// 채널 북마크 바 접기 상태 — 행이 없으면 펼침(기존 동작), 'collapsed'면 접힘.
// 기존 preference 저장 경로를 그대로 써서 서버 변경 없이 기기 간 동기화된다.
export const BOOKMARKS_BAR_COLLAPSE_CATEGORY = 'channel_bookmarks_bar';

const COLLAPSED = 'collapsed';

export function isBookmarksBarCollapsed(state: GlobalState, channelId: string): boolean {
    return get(state, BOOKMARKS_BAR_COLLAPSE_CATEGORY, channelId, '') === COLLAPSED;
}

export function toggleBookmarksBarCollapsed(channelId: string): ThunkActionFunc<void> {
    return (dispatch, getState) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const preference = {
            user_id: currentUserId,
            category: BOOKMARKS_BAR_COLLAPSE_CATEGORY,
            name: channelId,
            value: COLLAPSED,
        };

        if (isBookmarksBarCollapsed(state, channelId)) {
            // 펼침 전환은 행 삭제 — "행 없음=펼침" 규칙 유지
            dispatch(deletePreferences(currentUserId, [preference]));
        } else {
            dispatch(savePreferences(currentUserId, [preference]));
        }
    };
}
