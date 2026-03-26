// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * Lexical이 문단마다 마크다운을 내보낼 때 표 행 사이에 빈 줄이 끼면 GFM 표가 깨진다.
 * 연속된 `|...|` 형태 줄 사이의 공백 전용 줄을 제거한다.
 */
function lineLooksLikeGfmTableRow(line: string): boolean {
    const t = line.replace(/\r$/, '').trimEnd();
    if (t === '') {
        return false;
    }
    return t.startsWith('|') && t.endsWith('|');
}

export function normalizeGfmTablesInMarkdown(markdown: string): string {
    const lines = markdown.split('\n');
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '' && out.length > 0 && i + 1 < lines.length) {
            const prev = out[out.length - 1];
            const next = lines[i + 1];
            if (lineLooksLikeGfmTableRow(prev) && lineLooksLikeGfmTableRow(next)) {
                continue;
            }
        }
        out.push(line);
    }
    return out.join('\n');
}
