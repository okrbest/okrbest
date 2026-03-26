// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * 붙여넣기 클립보드 HTML이 의미 있는 리치 포맷인지 판별한다.
 * 이 경우 Lexical 기본 HTML 붙여넣기에 맡긴다.
 */
export function clipboardHtmlLooksFormatted(html: string): boolean {
    const h = html.trim();
    if (!h) {
        return false;
    }
    const lower = h.toLowerCase();
    if ((/<a\s[^>]*href/i).test(lower)) {
        return true;
    }
    if ((/<table[\s>]/i).test(lower)) {
        return true;
    }
    if ((/<img[\s>]/i).test(lower)) {
        return true;
    }
    if ((/<(?:strong|b|em|i|u|del|s|code|h[1-6]|blockquote|pre|ul|ol|li)[\s>]/i).test(lower)) {
        return true;
    }
    if ((/<span[^>]*style\s*=/i).test(lower)) {
        return true;
    }
    return false;
}

/**
 * text/plain만 있는 붙여넣기에서 마크다운으로 파싱해 처리해도 될 만한지 휴리스틱으로 판별한다.
 */
export function plainTextLooksLikeMarkdown(text: string): boolean {
    const t = text.trim();
    if (t.length < 2) {
        return false;
    }

    // `#`만 있는 줄(예: Dooray 등에서 복사) 또는 `### 제목` 형태
    if ((/^#{1,6}(?:\s|$|\n)/m).test(t)) {
        return true;
    }
    if ((/^[-*+]\s/m).test(t)) {
        return true;
    }
    if ((/^\d+\.\s/m).test(t)) {
        return true;
    }
    if ((/^>\s/m).test(t)) {
        return true;
    }
    if ((/```/).test(t)) {
        return true;
    }
    if ((/\*\*[^*\n]+?\*\*/).test(t)) {
        return true;
    }
    if ((/__(?!_)[^_\n]+__(?!_)/).test(t)) {
        return true;
    }
    if ((/(?<![*])\*(?![*\s])[^*\n]+\*(?!\*)/).test(t)) {
        return true;
    }
    if ((/\[[^\]]+\]\([^)]+\)/).test(t)) {
        return true;
    }
    if ((/^\|.+\|\s*$/m).test(t)) {
        return true;
    }
    if ((/^(?:---+|\*\*\*+)\s*$/m).test(t)) {
        return true;
    }

    return false;
}
