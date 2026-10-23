// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {parseCsv, serializeCsv} from 'utils/csv';

describe('parseCsv', () => {
    it('parses plain rows', () => {
        const result = parseCsv('a@b.co,홍길동,Pass!2345\nc@d.co,김철수,Pass!2345\n');
        expect(result).toEqual({rows: [
            ['a@b.co', '홍길동', 'Pass!2345'],
            ['c@d.co', '김철수', 'Pass!2345'],
        ]});
    });

    it('strips a UTF-8 BOM', () => {
        const result = parseCsv('﻿a@b.co,홍길동,Pass!2345');
        expect(result).toEqual({rows: [['a@b.co', '홍길동', 'Pass!2345']]});
    });

    it('handles CRLF line endings and skips blank lines', () => {
        const result = parseCsv('a@b.co,홍길동,Pass!2345\r\n\r\nc@d.co,김철수,Pass!2345\r\n');
        expect(result).toEqual({rows: [
            ['a@b.co', '홍길동', 'Pass!2345'],
            ['c@d.co', '김철수', 'Pass!2345'],
        ]});
    });

    it('handles quoted fields with commas, escaped quotes and newlines', () => {
        const result = parseCsv('a@b.co,"홍, 길동","Pa""ss!2345"\nc@d.co,"줄\n바꿈",Pass!2345');
        expect(result).toEqual({rows: [
            ['a@b.co', '홍, 길동', 'Pa"ss!2345'],
            ['c@d.co', '줄\n바꿈', 'Pass!2345'],
        ]});
    });

    it('keeps rows with a mismatched column count for row-level validation', () => {
        const result = parseCsv('a@b.co,홍길동\nc@d.co,김철수,Pass!2345,extra');
        expect(result).toEqual({rows: [
            ['a@b.co', '홍길동'],
            ['c@d.co', '김철수', 'Pass!2345', 'extra'],
        ]});
    });

    it('returns a file-level error for an unterminated quote', () => {
        const result = parseCsv('a@b.co,"깨진 따옴표,Pass!2345');
        expect(result).toEqual({error: 'unterminated_quote'});
    });
});

describe('serializeCsv', () => {
    it('quotes fields containing commas, quotes or newlines and round-trips', () => {
        const rows = [
            ['이메일', '이름', '임시비밀번호'],
            ['a@b.co', '홍, 길동', 'Pa"ss!2345'],
            ['c@d.co', '줄\n바꿈', 'Pass!2345'],
        ];
        const text = serializeCsv(rows);
        expect(text.startsWith('﻿')).toBe(true);
        expect(parseCsv(text)).toEqual({rows});
    });
});
