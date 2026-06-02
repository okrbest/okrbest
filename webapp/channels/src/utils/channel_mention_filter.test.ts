// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    channelMatchesMentionPrefix,
    filterChannelsForMentionPrefix,
} from './channel_mention_filter';

const channels = [
    {name: 'off-topic', display_name: '잡담'},
    {name: 'town-square', display_name: '공지사항'},
    {name: 'bbb', display_name: 'bbb'},
    {name: '1ae7f9f366a800921454a63cb5268e14', display_name: '테스트'},
];

describe('channelMatchesMentionPrefix', () => {
    it('matches empty prefix for all channels', () => {
        channels.forEach((channel) => {
            expect(channelMatchesMentionPrefix(channel, '')).toBe(true);
        });
    });

    it('matches slug prefix off', () => {
        expect(channelMatchesMentionPrefix(channels[0], 'off')).toBe(true);
        expect(channelMatchesMentionPrefix(channels[1], 'off')).toBe(false);
    });

    it('matches display name prefix 잡', () => {
        expect(channelMatchesMentionPrefix(channels[0], '잡')).toBe(true);
        expect(channelMatchesMentionPrefix(channels[2], '잡')).toBe(false);
    });

    it('matches single letter b only for bbb', () => {
        const filtered = filterChannelsForMentionPrefix(channels, 'b');
        expect(filtered.map((c) => c.name)).toEqual(['bbb']);
    });

    it('filters multi-word prefix against display name words', () => {
        const incident = {name: 'incident-name-df9a', display_name: 'Incident: name'};
        expect(channelMatchesMentionPrefix(incident, 'incident name')).toBe(true);
        expect(channelMatchesMentionPrefix(channels[0], 'incident name')).toBe(false);
    });
});
