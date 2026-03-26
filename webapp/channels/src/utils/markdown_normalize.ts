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

/**
 * Lexical $convertToMarkdownString 은 텍스트의 _ 를 마크다운 이스케이프(\_)로 내보냄.
 * http(s) 본문·마크다운 링크 URL·각괄호 URL 안의 \_ 는 실제 주소로 쓰여야 하므로 _ 로 복원한다.
 */
export function unescapeUnderscoresInMarkdownUrls(markdown: string): string {
    if (!markdown.includes('\\_')) {
        return markdown;
    }
    let out = markdown;

    out = out.replace(/\]\((https?:\/\/[^)\s]+)\)/gi, (full, url: string) => {
        if (!url.includes('\\_')) {
            return full;
        }
        return `](${url.replace(/\\_/g, '_')})`;
    });

    out = out.replace(/<(https?:\/\/[^>\s]+)>/gi, (full, url: string) => {
        if (!url.includes('\\_')) {
            return full;
        }
        return `<${url.replace(/\\_/g, '_')}>`;
    });

    out = out.replace(/\bhttps?:\/\/\S+/gi, (raw) => {
        if (!raw.includes('\\_')) {
            return raw;
        }
        let body = raw;
        let suffix = '';
        if (body.endsWith(')') && !body.includes('(')) {
            body = body.slice(0, -1);
            suffix = ')';
        }
        body = body.replace(/\\_/g, '_');
        return body + suffix;
    });

    return out;
}
