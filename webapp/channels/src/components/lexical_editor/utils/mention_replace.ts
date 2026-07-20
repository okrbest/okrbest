// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {LexicalNode} from 'lexical';
import {
    $createRangeSelection,
    $getNodeByKey,
    $setSelection,
    TextNode,
} from 'lexical';

export type MentionRangeEnd = {
    focusKey: string;
    focusOffset: number;
};

export type PendingMentionMatch = {
    triggerKey: string;
    triggerOffset: number;
    prefix: string;
};

export function getNextTextSibling(node: LexicalNode): TextNode | null {
    let sibling: LexicalNode | null = node.getNextSibling();
    while (sibling) {
        if (sibling instanceof TextNode) {
            return sibling;
        }
        sibling = sibling.getNextSibling();
    }
    return null;
}

export function getPreviousTextSibling(node: LexicalNode): TextNode | null {
    let sibling: LexicalNode | null = node.getPreviousSibling();
    while (sibling) {
        if (sibling instanceof TextNode) {
            return sibling;
        }
        sibling = sibling.getPreviousSibling();
    }
    return null;
}

export function computeMentionRangeEnd(
    startNode: TextNode,
    startOffset: number,
    charCount: number,
): MentionRangeEnd {
    let remaining = charCount;
    let node: TextNode | null = startNode;
    let offset = startOffset;

    while (node && remaining > 0) {
        const text = node.getTextContent();
        const available = text.length - offset;

        if (available >= remaining) {
            return {focusKey: node.getKey(), focusOffset: offset + remaining};
        }

        remaining -= available;
        const next = getNextTextSibling(node);
        if (!next) {
            return {focusKey: node.getKey(), focusOffset: text.length};
        }
        node = next;
        offset = 0;
    }

    return {focusKey: startNode.getKey(), focusOffset: startOffset};
}

/**
 * Lexical 트리에 아직 없는 IME 조합분이 다음 TextNode 형제로 붙은 경우 제거.
 */
export function consumeSearchTextFromFollowingSiblings(
    startNode: TextNode,
    startOffset: number,
    charCount: number,
): void {
    const firstAvailable = startNode.getTextContent().length - startOffset;
    let remaining = charCount - firstAvailable;
    if (remaining <= 0) {
        return;
    }

    let sibling = getNextTextSibling(startNode);
    while (sibling && remaining > 0) {
        const text = sibling.getTextContent();
        if (text.length <= remaining) {
            remaining -= text.length;
            const next = getNextTextSibling(sibling);
            sibling.remove();
            sibling = next;
            continue;
        }

        sibling.setTextContent(text.slice(remaining));
        remaining = 0;
    }
}

function isImeOrphanText(content: string, prefix: string): boolean {
    if (!content || !prefix) {
        return false;
    }
    const trimmed = content.trim();
    if (!trimmed) {
        return false;
    }
    if (trimmed === prefix) {
        return true;
    }
    if (prefix.length > 0 && trimmed === prefix.slice(-1)) {
        return true;
    }
    return trimmed.length <= prefix.length && prefix.includes(trimmed);
}

/**
 * 멘션 직후 IME 조합 잔여 TextNode 제거.
 */
export function removeImeOrphanAfterMention(
    mentionNode: LexicalNode,
    prefix: string,
): void {
    let sibling: LexicalNode | null = mentionNode.getNextSibling();
    while (sibling instanceof TextNode) {
        const content = sibling.getTextContent();
        if (!isImeOrphanText(content, prefix)) {
            break;
        }
        const next = sibling.getNextSibling();
        sibling.remove();
        sibling = next;
    }
}

/**
 * 트리거(~/@)+검색어 구간에 RangeSelection을 잡고 노드를 삽입합니다.
 */
export function insertMentionViaRangeSelection(
    anchorNode: TextNode,
    triggerOffset: number,
    replaceCharCount: number,
    nodesToInsert: LexicalNode[],
): LexicalNode | null {
    const {focusKey, focusOffset} = computeMentionRangeEnd(
        anchorNode,
        triggerOffset,
        replaceCharCount,
    );

    const selection = $createRangeSelection();
    selection.anchor.set(anchorNode.getKey(), triggerOffset, 'text');
    selection.focus.set(focusKey, focusOffset, 'text');
    $setSelection(selection);
    selection.insertNodes(nodesToInsert);

    return nodesToInsert[0] ?? null;
}

/**
 * 치환 구간 끝부터 focus 노드 내 남은 텍스트만 반환합니다 (형제 노드 제외).
 */
export function getTextAfterReplaceEnd(
    startNode: TextNode,
    startOffset: number,
    replaceCharCount: number,
): string {
    const {focusKey, focusOffset} = computeMentionRangeEnd(
        startNode,
        startOffset,
        replaceCharCount,
    );

    const focusNode = $getNodeByKey(focusKey);
    if (!(focusNode instanceof TextNode)) {
        return '';
    }

    return focusNode.getTextContent().slice(focusOffset);
}

/**
 * pendingMatch 기준으로 RangeSelection을 복원합니다 (마우스 클릭 시 selection 소실 대비).
 */
export function restoreSelectionForPendingMatch(
    triggerKey: string,
    triggerOffset: number,
    replaceCharCount: number,
): void {
    const triggerNode = $getNodeByKey(triggerKey);
    if (!(triggerNode instanceof TextNode)) {
        return;
    }

    const {focusKey, focusOffset} = computeMentionRangeEnd(
        triggerNode,
        triggerOffset,
        replaceCharCount,
    );

    const selection = $createRangeSelection();
    selection.anchor.set(triggerKey, triggerOffset, 'text');
    selection.focus.set(focusKey, focusOffset, 'text');
    $setSelection(selection);
}

/**
 * 트리거 직후 실제 검색어 길이(~/@ + prefix)를 Lexical 트리에서 읽습니다.
 * IME 조합 완료 후 queryString보다 최신 상태를 반영합니다.
 */
function collectPrefixFromTrigger(
    triggerNode: TextNode,
    triggerOffset: number,
    prefixCharPattern: RegExp,
): string {
    let result = '';
    let node: TextNode | null = triggerNode;
    let offset = triggerOffset + 1;

    while (node) {
        const slice = node.getTextContent().slice(offset);
        const match = slice.match(prefixCharPattern);
        if (!match) {
            break;
        }

        if (match[0].length === 0) {
            const next = getNextTextSibling(node);
            if (!next) {
                break;
            }
            node = next;
            offset = 0;
            continue;
        }

        result += match[0];
        if (match[0].length < slice.length) {
            break;
        }

        const next = getNextTextSibling(node);
        if (!next) {
            break;
        }
        node = next;
        offset = 0;
    }

    return result;
}

export function computeReplaceCharCountFromTrigger(
    triggerNode: TextNode,
    triggerOffset: number,
    prefixCharPattern: RegExp,
): number {
    return 1 + collectPrefixFromTrigger(triggerNode, triggerOffset, prefixCharPattern).length;
}

export function readPrefixFromTrigger(
    triggerNode: TextNode,
    triggerOffset: number,
    prefixCharPattern: RegExp,
): string {
    return collectPrefixFromTrigger(triggerNode, triggerOffset, prefixCharPattern);
}

/**
 * 커서가 있는 TextNode에서 역방향으로 트리거 문자가 있는 TextNode를 찾습니다.
 */
export function findTriggerTextNode(
    startNode: TextNode,
    triggerChar: string,
): {node: TextNode; triggerOffset: number} | null {
    let node: TextNode | null = startNode;
    while (node) {
        const text = node.getTextContent();
        const idx = text.lastIndexOf(triggerChar);
        if (idx >= 0) {
            return {node, triggerOffset: idx};
        }
        node = getPreviousTextSibling(node);
    }
    return null;
}
