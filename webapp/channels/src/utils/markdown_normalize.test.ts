// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {normalizeGfmTablesInMarkdown, unescapeUnderscoresInMarkdownUrls} from './markdown_normalize';

describe('normalizeGfmTablesInMarkdown', () => {
    it('removes blank lines between GFM table rows', () => {
        const input = '| a | b |\n\n| --- | --- |\n\n| x | y |';
        expect(normalizeGfmTablesInMarkdown(input)).toBe('| a | b |\n| --- | --- |\n| x | y |');
    });

    it('keeps blank line between non-table blocks', () => {
        const input = 'hello\n\nworld';
        expect(normalizeGfmTablesInMarkdown(input)).toBe('hello\n\nworld');
    });
});

describe('unescapeUnderscoresInMarkdownUrls', () => {
    it('plain http(s) URL', () => {
        expect(unescapeUnderscoresInMarkdownUrls('https://aaa\\_bbb')).
            toBe('https://aaa_bbb');
        expect(unescapeUnderscoresInMarkdownUrls('http://x\\_y\\_z')).
            toBe('http://x_y_z');
    });

    it('does not change non-URLs', () => {
        expect(unescapeUnderscoresInMarkdownUrls('aaa\\_bbb')).toBe('aaa\\_bbb');
    });

    it('parenthesized plain URL', () => {
        expect(unescapeUnderscoresInMarkdownUrls('(https://aaa\\_bbb)')).
            toBe('(https://aaa_bbb)');
    });

    it('markdown link target URL', () => {
        expect(unescapeUnderscoresInMarkdownUrls('[t](https://aaa\\_bbb)')).toBe('[t](https://aaa_bbb)');
    });

    it('angle-bracket URL', () => {
        expect(unescapeUnderscoresInMarkdownUrls('<https://aaa\\_bbb>')).
            toBe('<https://aaa_bbb>');
    });
});
