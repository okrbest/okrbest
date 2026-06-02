// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type ChannelMentionFilterFields = {
    name: string;
    display_name: string;
};

/**
 * 채널 멘션 자동완성 prefix가 channel.name / display_name 과 매칭되는지 확인합니다.
 * 빈 prefix는 레거시 ChannelMentionProvider 와 동일하게 모든 채널에 매칭됩니다.
 */
export function channelMatchesMentionPrefix(
    channel: ChannelMentionFilterFields,
    prefix: string,
): boolean {
    const words = prefix.toLowerCase().split(/\s+/);
    const nameWords = channel.name.toLowerCase().split(/\s+/).concat(
        channel.display_name.toLowerCase().split(/\s+/),
    );

    for (let j = 0; j < words.length; j++) {
        if (!words[j]) {
            continue;
        }
        let wordMatched = false;
        for (let i = 0; i < nameWords.length; i++) {
            if (nameWords[i].startsWith(words[j])) {
                wordMatched = true;
                break;
            }
        }
        if (!wordMatched) {
            return false;
        }
    }

    return true;
}

export function filterChannelsForMentionPrefix<T extends ChannelMentionFilterFields>(
    channels: T[],
    prefix: string,
): T[] {
    return channels.filter((channel) => channelMatchesMentionPrefix(channel, prefix));
}
