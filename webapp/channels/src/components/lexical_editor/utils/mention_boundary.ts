// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * 멘션 노드 바로 뒤 텍스트가 멘션 토큰으로 이어붙어 링크 파싱이 깨지는 것을 방지한다.
 * - 한글 포함 문자/숫자/._- 로 시작하면 멘션 뒤 공백을 삽입해 경계를 강제한다.
 */
const MENTION_CONTINUATION_START = /^[\p{L}\p{N}._-]/u;

export function addMentionBoundarySpace(afterText: string): string {
    if (!afterText) {
        return afterText;
    }

    if (!MENTION_CONTINUATION_START.test(afterText)) {
        return afterText;
    }

    return ` ${afterText}`;
}
