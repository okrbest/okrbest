// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {GlobalState} from 'types/store';

import {
    BOOKMARKS_BAR_COLLAPSE_CATEGORY,
    isBookmarksBarCollapsed,
    toggleBookmarksBarCollapsed,
} from './bookmark_bar_collapse';

jest.mock('mattermost-redux/actions/preferences', () => ({
    savePreferences: jest.fn(() => ({type: 'MOCK_SAVE_PREFERENCES'})),
    deletePreferences: jest.fn(() => ({type: 'MOCK_DELETE_PREFERENCES'})),
}));

const {savePreferences, deletePreferences} = jest.requireMock('mattermost-redux/actions/preferences');

describe('components/channel_bookmarks/bookmark_bar_collapse', () => {
    const channelId = 'channel-id-1';
    const currentUserId = 'user-id-1';

    function stateWith(myPreferences: Record<string, unknown>): GlobalState {
        return {
            entities: {
                users: {currentUserId},
                preferences: {myPreferences},
            },
        } as unknown as GlobalState;
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('행이 없으면 펼침(접힘 아님)이다', () => {
        expect(isBookmarksBarCollapsed(stateWith({}), channelId)).toBe(false);
    });

    it('collapsed 행이 있으면 접힘이다', () => {
        const state = stateWith({
            [`${BOOKMARKS_BAR_COLLAPSE_CATEGORY}--${channelId}`]: {
                category: BOOKMARKS_BAR_COLLAPSE_CATEGORY,
                name: channelId,
                value: 'collapsed',
            },
        });

        expect(isBookmarksBarCollapsed(state, channelId)).toBe(true);
    });

    it('펼침 상태에서 토글하면 collapsed 행을 저장한다', () => {
        const dispatch = jest.fn();
        const getState = () => stateWith({});

        toggleBookmarksBarCollapsed(channelId)(dispatch, getState, undefined);

        expect(savePreferences).toHaveBeenCalledWith(currentUserId, [{
            user_id: currentUserId,
            category: BOOKMARKS_BAR_COLLAPSE_CATEGORY,
            name: channelId,
            value: 'collapsed',
        }]);
        expect(deletePreferences).not.toHaveBeenCalled();
    });

    it('접힘 상태에서 토글하면 행을 삭제해 "행 없음=펼침"을 유지한다', () => {
        const dispatch = jest.fn();
        const getState = () => stateWith({
            [`${BOOKMARKS_BAR_COLLAPSE_CATEGORY}--${channelId}`]: {
                category: BOOKMARKS_BAR_COLLAPSE_CATEGORY,
                name: channelId,
                value: 'collapsed',
            },
        });

        toggleBookmarksBarCollapsed(channelId)(dispatch, getState, undefined);

        expect(deletePreferences).toHaveBeenCalledWith(currentUserId, [expect.objectContaining({
            category: BOOKMARKS_BAR_COLLAPSE_CATEGORY,
            name: channelId,
        })]);
        expect(savePreferences).not.toHaveBeenCalled();
    });
});
