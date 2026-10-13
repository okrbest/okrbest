// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getUnreadStatusInCurrentTeam} from 'mattermost-redux/selectors/entities/channels';
import deepFreezeAndThrowOnMutation from 'mattermost-redux/utils/deep_freeze';

import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import {getSplitUnreadCountsInCurrentTeam} from './unreads';

describe('selectors/unreads', () => {
    const currentUserId = 'current_user_id';
    const otherUserId = 'other_user_id';
    const teamId = 'team_id1';

    const publicMention = TestHelper.getChannelMock({
        id: 'ch_public_mention', team_id: teamId, name: 'public-mention', type: 'O', delete_at: 0,
    });
    const publicPlain = TestHelper.getChannelMock({
        id: 'ch_public_plain', team_id: teamId, name: 'public-plain', type: 'O', delete_at: 0,
    });
    const publicMuted = TestHelper.getChannelMock({
        id: 'ch_public_muted', team_id: teamId, name: 'public-muted', type: 'O', delete_at: 0,
    });
    const currentChannel = TestHelper.getChannelMock({
        id: 'ch_current', team_id: teamId, name: 'current', type: 'O', delete_at: 0,
    });
    const dmChannel = TestHelper.getChannelMock({
        id: 'ch_dm', team_id: '', name: `${currentUserId}__${otherUserId}`, type: 'D', delete_at: 0,
    });
    const gmChannel = TestHelper.getChannelMock({
        id: 'ch_gm', team_id: '', name: 'gm-channel', type: 'G', delete_at: 0,
    });

    function member(channelId: string, over: Record<string, unknown> = {}) {
        return TestHelper.getChannelMembershipMock({
            channel_id: channelId,
            user_id: currentUserId,
            msg_count: 0,
            msg_count_root: 0,
            mention_count: 0,
            mention_count_root: 0,
            notify_props: {},
            ...over,
        } as never);
    }

    // 상태: 멘션 3(공개 1곳) + DM 멘션 1 + 일반 미읽음 12(공개 1곳)
    // + 뮤트 채널 미읽음 7(제외돼야 함) + 현재 채널 미읽음 5(제외돼야 함)
    function baseState(): GlobalState {
        return deepFreezeAndThrowOnMutation({
            entities: {
                general: {config: {}},
                preferences: {myPreferences: {}},
                threads: {counts: {}, countsIncludingDirect: {}},
                users: {
                    currentUserId,
                    profiles: {
                        [currentUserId]: TestHelper.getUserMock({id: currentUserId}),
                        [otherUserId]: TestHelper.getUserMock({id: otherUserId, delete_at: 0}),
                    },

                    // completeDirectChannelInfo가 읽는다 — 값은 집계와 무관
                    statuses: {},
                    profilesInChannel: {[gmChannel.id]: new Set([currentUserId, otherUserId])},
                },
                teams: {currentTeamId: teamId},
                channels: {
                    currentChannelId: currentChannel.id,
                    channels: {
                        [publicMention.id]: publicMention,
                        [publicPlain.id]: publicPlain,
                        [publicMuted.id]: publicMuted,
                        [currentChannel.id]: currentChannel,
                        [dmChannel.id]: dmChannel,
                        [gmChannel.id]: gmChannel,
                    },
                    channelsInTeam: {
                        [teamId]: new Set([publicMention.id, publicPlain.id, publicMuted.id, currentChannel.id]),

                        // DM·GM은 빈 문자열 팀 키 아래에 산다 (upstream 스토어 관례)
                        '': new Set([dmChannel.id, gmChannel.id]),
                    },
                    messageCounts: {
                        [publicMention.id]: {total: 10, root: 10},
                        [publicPlain.id]: {total: 20, root: 20},
                        [publicMuted.id]: {total: 7, root: 7},
                        [currentChannel.id]: {total: 5, root: 5},
                        [dmChannel.id]: {total: 2, root: 2},
                        [gmChannel.id]: {total: 4, root: 4},
                    },
                    myMembers: {
                        [publicMention.id]: member(publicMention.id, {mention_count: 3, mention_count_root: 3, msg_count: 10, msg_count_root: 10}),
                        [publicPlain.id]: member(publicPlain.id, {msg_count: 8, msg_count_root: 8}),
                        [publicMuted.id]: member(publicMuted.id, {notify_props: {mark_unread: 'mention'}}),
                        [currentChannel.id]: member(currentChannel.id),
                        [dmChannel.id]: member(dmChannel.id, {mention_count: 1, mention_count_root: 1, msg_count: 1, msg_count_root: 1}),
                        [gmChannel.id]: member(gmChannel.id, {msg_count: 0, msg_count_root: 0}),
                    },
                },
            },
        }) as unknown as GlobalState;
    }

    test('mentions는 upstream 집계와 일치한다 — CRT off (T003-①)', () => {
        const state = baseState();
        const split = getSplitUnreadCountsInCurrentTeam(state);

        // 공개 채널 멘션 3 + DM 멘션 1
        expect(split.mentions).toBe(4);
        expect(getUnreadStatusInCurrentTeam(state)).toBe(split.mentions);
    });

    test('mentions는 upstream 집계와 일치한다 — CRT on, 스레드 멘션 포함 (T003-①)', () => {
        const base = baseState();
        const state = {
            ...base,
            entities: {
                ...base.entities,
                general: {config: {CollapsedThreads: 'always_on'}},
                threads: {
                    counts: {[teamId]: {total: 1, total_unread_threads: 1, total_unread_mentions: 5}},
                    countsIncludingDirect: {[teamId]: {total: 1, total_unread_threads: 1, total_unread_mentions: 5}},
                },
            },
        } as unknown as GlobalState;
        const split = getSplitUnreadCountsInCurrentTeam(state);

        // 채널 멘션 4(root) + 스레드 멘션 5
        expect(split.mentions).toBe(9);
        expect(getUnreadStatusInCurrentTeam(state)).toBe(split.mentions);
    });

    test('messages는 DM·GM 채널을 제외한다 (T003-②)', () => {
        const split = getSplitUnreadCountsInCurrentTeam(baseState());

        // publicPlain 12 (20-8). DM 1건·GM 4건은 제외
        expect(split.messages).toBe(12);
    });

    test('현재 보는 채널은 두 수치 모두에서 제외한다 (T003-③)', () => {
        const split = getSplitUnreadCountsInCurrentTeam(baseState());

        // currentChannel의 미읽음 5가 messages에 없다 (12 그대로)
        expect(split.messages).toBe(12);
    });

    test('뮤트 채널은 messages에서 제외한다 (T003-④)', () => {
        const split = getSplitUnreadCountsInCurrentTeam(baseState());

        // publicMuted의 7이 빠져 있다
        expect(split.messages).toBe(12);
    });

    test('상대가 비활성화된 DM은 mentions에서 제외한다 (T003-⑤)', () => {
        const base = baseState();
        const state = {
            ...base,
            entities: {
                ...base.entities,
                users: {
                    ...base.entities.users,
                    profiles: {
                        ...base.entities.users.profiles,
                        [otherUserId]: TestHelper.getUserMock({id: otherUserId, delete_at: 123}),
                    },
                },
            },
        } as unknown as GlobalState;
        const split = getSplitUnreadCountsInCurrentTeam(state);

        // DM 멘션 1이 빠져 공개 채널 멘션 3만 남는다
        expect(split.mentions).toBe(3);
    });

    test('채널이 없으면 0·0을 반환한다 (T003-⑥)', () => {
        const state = deepFreezeAndThrowOnMutation({
            entities: {
                general: {config: {}},
                preferences: {myPreferences: {}},
                threads: {counts: {}, countsIncludingDirect: {}},
                users: {currentUserId, profiles: {}},
                teams: {currentTeamId: teamId},
                channels: {currentChannelId: '', channels: {}, channelsInTeam: {}, messageCounts: {}, myMembers: {}},
            },
        }) as unknown as GlobalState;

        expect(getSplitUnreadCountsInCurrentTeam(state)).toEqual({mentions: 0, messages: 0});
    });

    test('같은 state 재호출은 같은 참조를 반환한다 — memoize (T003-⑦)', () => {
        const state = baseState();

        expect(getSplitUnreadCountsInCurrentTeam(state)).toBe(getSplitUnreadCountsInCurrentTeam(state));
    });
});
