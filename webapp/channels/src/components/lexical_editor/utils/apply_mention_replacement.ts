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

function resolvePrefix(
    triggerNode: TextNode,
    triggerOffset: number,
    prefixCharPattern: RegExp,
    pendingPrefix: string,
    fallbackQueryPrefix: string,
): string {
    const fromTree = readPrefixFromTrigger(triggerNode, triggerOffset, prefixCharPattern);
    const pending = pendingPrefix || fallbackQueryPrefix;

    if (!pending) {
        return fromTree;
    }
    if (!fromTree) {
        return pending;
    }
    return fromTree.length >= pending.length ? fromTree : pending;
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
    const pendingPrefix = pendingMatch?.prefix ?? '';
    const prefix = resolvePrefix(
        triggerNode,
        triggerOffset,
        prefixCharPattern,
        pendingPrefix,
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

    const rangePrefix = readPrefixFromTrigger(triggerNode, triggerOffset, prefixCharPattern);
    const effectivePrefix = rangePrefix.length >= prefix.length ? rangePrefix : prefix;
    const effectiveReplaceCount = 1 + effectivePrefix.length;

    const afterText = getTextAfterReplaceEnd(
        triggerNode,
        triggerOffset,
        effectiveReplaceCount,
    );

    const nodesToInsert = createNodesToInsert(afterText);
    const insertedNode = insertMentionViaRangeSelection(
        triggerNode,
        triggerOffset,
        effectiveReplaceCount,
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
