// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {LexicalNode} from 'lexical';
import {
    $getNodeByKey,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import {
    computeReplaceCharCountFromTrigger,
    findTriggerTextNode,
    getTextAfterReplaceEnd,
    insertMentionViaRangeSelection,
    readPrefixFromTrigger,
    removeImeOrphanAfterMention,
    restoreSelectionForPendingMatch,
    type PendingMentionMatch,
} from './mention_replace';

export type ApplyMentionReplacementParams = {
    pendingMatch: PendingMentionMatch | null;
    fallbackQueryPrefix: string;
    prefixCharPattern: RegExp;
    triggerChar: string;
    createNodesToInsert: (afterText: string) => LexicalNode[];
};

export type ApplyMentionReplacementResult = {
    insertedNode: LexicalNode | null;
    afterText: string;
    usedRangePath: boolean;
    prefix: string;
};

function resolveTrigger(
    pendingMatch: PendingMentionMatch | null,
    triggerChar: string,
): {node: TextNode; offset: number} | null {
    if (pendingMatch) {
        const node = $getNodeByKey(pendingMatch.triggerKey);
        if (node instanceof TextNode) {
            return {node, offset: pendingMatch.triggerOffset};
        }
    }

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return null;
    }

    const anchorNode = selection.anchor.getNode();
    if (!(anchorNode instanceof TextNode)) {
        return null;
    }

    const trigger = findTriggerTextNode(anchorNode, triggerChar);
    if (!trigger) {
        return null;
    }

    return {node: trigger.node, offset: trigger.triggerOffset};
}

/**
 * pendingMatch가 객체로 존재하면(prefix가 빈 문자열이어도) 그 값을 신뢰합니다.
 * pendingMatch.prefix는 항상 커서 위치까지만 읽은 값이라 커서 우측의 기존 텍스트를
 * 포함할 수 없기 때문입니다. pendingMatch가 없을 때만(예: 조합 문자가 분리된
 * 형제 노드로 붙는 IME 케이스) fallbackQueryPrefix, 그 다음 트리 훑기(fromTree, 커서
 * 위치를 모르므로 우측 텍스트까지 집어삼킬 수 있음)로 폴백합니다.
 */
function resolvePrefix(
    triggerNode: TextNode,
    triggerOffset: number,
    prefixCharPattern: RegExp,
    pendingMatch: PendingMentionMatch | null,
    fallbackQueryPrefix: string,
): string {
    if (pendingMatch) {
        return pendingMatch.prefix;
    }
    if (fallbackQueryPrefix) {
        return fallbackQueryPrefix;
    }
    return readPrefixFromTrigger(triggerNode, triggerOffset, prefixCharPattern);
}

function isSearchTextInSingleNode(
    triggerNode: TextNode,
    triggerOffset: number,
    prefix: string,
): boolean {
    const replaceEnd = triggerOffset + 1 + prefix.length;
    return triggerNode.getTextContent().length >= replaceEnd;
}

function applySimpleMentionReplacement(
    triggerNode: TextNode,
    triggerOffset: number,
    prefix: string,
    createNodesToInsert: (afterText: string) => LexicalNode[],
): {insertedNode: LexicalNode | null; afterText: string} {
    const text = triggerNode.getTextContent();
    const replaceEnd = triggerOffset + 1 + prefix.length;
    const beforeText = text.slice(0, triggerOffset);
    const afterText = text.slice(replaceEnd);

    triggerNode.setTextContent(beforeText);

    const nodesToInsert = createNodesToInsert(afterText);
    const primaryNode = nodesToInsert[0];
    if (!primaryNode) {
        return {insertedNode: null, afterText};
    }

    if (beforeText) {
        triggerNode.insertAfter(primaryNode);
    } else {
        triggerNode.replace(primaryNode);
    }

    let lastInserted = primaryNode;
    for (let i = 1; i < nodesToInsert.length; i++) {
        lastInserted.insertAfter(nodesToInsert[i]);
        lastInserted = nodesToInsert[i];
    }

    if (!afterText) {
        const trailing = nodesToInsert[nodesToInsert.length - 1];
        if (trailing instanceof TextNode) {
            trailing.selectEnd();
        }
    }

    return {insertedNode: primaryNode, afterText};
}

/**
 * 멘션/채널 태그 치환: 단일 TextNode는 단순 경로, IME·분리 노드는 Range 경로.
 */
export function applyMentionReplacement(
    params: ApplyMentionReplacementParams,
): ApplyMentionReplacementResult | null {
    const {
        pendingMatch,
        fallbackQueryPrefix,
        prefixCharPattern,
        triggerChar,
        createNodesToInsert,
    } = params;

    const trigger = resolveTrigger(pendingMatch, triggerChar);
    if (!trigger) {
        return null;
    }

    const {node: triggerNode, offset: triggerOffset} = trigger;
    const prefix = resolvePrefix(
        triggerNode,
        triggerOffset,
        prefixCharPattern,
        pendingMatch,
        fallbackQueryPrefix,
    );

    const replaceCharCount = 1 + prefix.length;

    if (pendingMatch) {
        restoreSelectionForPendingMatch(
            pendingMatch.triggerKey,
            triggerOffset,
            replaceCharCount,
        );
    }

    if (prefix.length > 0 && isSearchTextInSingleNode(triggerNode, triggerOffset, prefix)) {
        const {insertedNode, afterText} = applySimpleMentionReplacement(
            triggerNode,
            triggerOffset,
            prefix,
            createNodesToInsert,
        );
        return {
            insertedNode,
            afterText,
            usedRangePath: false,
            prefix,
        };
    }

    const effectivePrefix = prefix;
    const effectiveReplaceCount = 1 + effectivePrefix.length;

    const afterText = getTextAfterReplaceEnd(
        triggerNode,
        triggerOffset,
        effectiveReplaceCount,
    );

    // afterText는 createNodesToInsert가 수동으로 다시 삽입하므로, 실제 치환 범위는
    // afterText 길이만큼 더 넓혀서 잡아야 한다. 그렇지 않으면 insertNodes가 선택 범위
    // 밖의 afterText를 그대로 남겨두어(자체적으로 노드를 분리해 보존) 같은 텍스트가
    // 원본 잔여분 + 수동 재삽입분으로 중복된다.
    const nodesToInsert = createNodesToInsert(afterText);
    const insertedNode = insertMentionViaRangeSelection(
        triggerNode,
        triggerOffset,
        effectiveReplaceCount + afterText.length,
        nodesToInsert,
    );

    if (insertedNode) {
        removeImeOrphanAfterMention(insertedNode, effectivePrefix);
    }

    if (!afterText) {
        const lastNode = nodesToInsert[nodesToInsert.length - 1];
        if (lastNode instanceof TextNode) {
            lastNode.selectEnd();
        }
    }

    return {
        insertedNode,
        afterText,
        usedRangePath: true,
        prefix: effectivePrefix,
    };
}
