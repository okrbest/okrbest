// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type CsvParseResult = {rows: string[][]; error?: never} | {rows?: never; error: 'unterminated_quote'};

// parseCsv parses a small CSV document: UTF-8 BOM, CRLF, quoted fields with
// doubled-quote escapes and embedded newlines. Blank lines are skipped and
// column counts are not enforced — row-level validation happens elsewhere.
// A structurally broken file (unterminated quote) is a file-level error.
export function parseCsv(text: string): CsvParseResult {
    let input = text;
    if (input.startsWith('﻿')) {
        input = input.slice(1);
    }

    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let fieldStarted = false;
    let inQuotes = false;

    const endField = () => {
        row.push(field);
        field = '';
        fieldStarted = false;
    };
    const endRow = () => {
        endField();
        if (row.length > 1 || row[0] !== '') {
            rows.push(row);
        }
        row = [];
    };

    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (inQuotes) {
            if (char === '"') {
                if (input[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        switch (char) {
        case '"':
            if (field === '' && !fieldStarted) {
                inQuotes = true;
                fieldStarted = true;
            } else {
                field += char;
            }
            break;
        case ',':
            endField();
            break;
        case '\r':
            if (input[i + 1] === '\n') {
                i++;
            }
            endRow();
            break;
        case '\n':
            endRow();
            break;
        default:
            field += char;
            fieldStarted = true;
            break;
        }
    }

    if (inQuotes) {
        return {error: 'unterminated_quote'};
    }
    if (fieldStarted || field !== '' || row.length > 0) {
        endRow();
    }

    return {rows};
}

// serializeCsv renders rows as CSV text with a UTF-8 BOM so spreadsheet
// applications detect the encoding. Fields containing commas, quotes or
// newlines are quoted with doubled-quote escapes.
export function serializeCsv(rows: string[][]): string {
    const escapeField = (value: string): string => {
        if ((/[",\n\r]/).test(value)) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    };
    return '﻿' + rows.map((row) => row.map(escapeField).join(',')).join('\n') + '\n';
}
