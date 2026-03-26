// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {normalizeGfmTablesInMarkdown} from './markdown_normalize';

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
