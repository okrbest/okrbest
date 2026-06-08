// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type MentionReplaceRange = {
    beforeText: string;
    afterText: string;
    replaceEnd: number;
};

/**
 * 단일 TextNode 기준으로 트리거(~/@)+prefix 구간 치환 범위를 계산합니다.
 */
export function getMentionReplaceRange(
    text: string,
    triggerIndex: number,
    prefix: string,
): MentionReplaceRange {
    const replaceEnd = triggerIndex + 1 + prefix.length;
    const beforeText = text.slice(0, triggerIndex);
    const afterText = text.slice(replaceEnd);

    return {beforeText, afterText, replaceEnd};
}
