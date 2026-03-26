// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * Lexical contenteditable 루트 기준, 브라우저 Selection API로 평문 오프셋을 구한다.
 * draft.message(마크다운) 문자열 인덱스와는 다를 수 있다. 포맷 바는 Lexical 명령에
 * 에디터 내부 선택을 쓰므로, 버튼 클릭 시 포커스 유지(onMouseDown preventDefault)와 함께
 * 오프셋은 UI/호환용으로만 쓰인다.
 */
export function getPlainTextOffsetsFromContentEditable(rootElement: HTMLElement | null): {start: number; end: number} | null {
    if (!rootElement) {
        return null;
    }

    const domSelection = document.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
        return null;
    }

    const range = domSelection.getRangeAt(0);
    if (!rootElement.contains(range.commonAncestorContainer)) {
        return null;
    }

    try {
        const preCaretRange = document.createRange();
        preCaretRange.selectNodeContents(rootElement);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const start = preCaretRange.toString().length;
        const end = start + range.toString().length;
        return {start, end};
    } catch {
        return null;
    }
}
