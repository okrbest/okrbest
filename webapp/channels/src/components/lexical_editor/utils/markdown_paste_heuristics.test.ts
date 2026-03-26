// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {clipboardHtmlLooksFormatted, plainTextLooksLikeMarkdown} from './markdown_paste_heuristics';

describe('markdown_paste_heuristics', () => {
    describe('clipboardHtmlLooksFormatted', () => {
        it('returns false for empty html', () => {
            expect(clipboardHtmlLooksFormatted('')).toBe(false);
        });

        it('detects anchor tags', () => {
            expect(clipboardHtmlLooksFormatted('<a href="https://x.com">x</a>')).toBe(true);
        });

        it('detects bold tags', () => {
            expect(clipboardHtmlLooksFormatted('<p><b>hi</b></p>')).toBe(true);
        });

        it('returns false for plain fragment wrapper only', () => {
            expect(clipboardHtmlLooksFormatted('<div>just text</div>')).toBe(false);
        });
    });

    describe('plainTextLooksLikeMarkdown', () => {
        it('returns false for plain sentences', () => {
            expect(plainTextLooksLikeMarkdown('hello world')).toBe(false);
        });

        it('detects headings', () => {
            expect(plainTextLooksLikeMarkdown('## Title\n')).toBe(true);
        });

        it('detects hash-only heading lines (no space after #)', () => {
            expect(plainTextLooksLikeMarkdown('###\n##\n#')).toBe(true);
        });

        it('detects bold markers', () => {
            expect(plainTextLooksLikeMarkdown('**bold**')).toBe(true);
        });

        it('detects fenced code', () => {
            expect(plainTextLooksLikeMarkdown('```\ncode\n```')).toBe(true);
        });
    });
});
