// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    ELEMENT_TRANSFORMERS,
    TEXT_FORMAT_TRANSFORMERS,
    TEXT_MATCH_TRANSFORMERS,
    TRANSFORMERS,
} from '@lexical/markdown';
import type {Transformer} from '@lexical/markdown';
import {
    $createTableCellNode,
    $createTableNode,
    $createTableRowNode,
    $isTableNode,
    TableCellHeaderStates,
    TableCellNode,
    TableNode,
    TableRowNode,
} from '@lexical/table';
import type {LexicalNode} from 'lexical';
import {$createParagraphNode, $createTextNode, $isElementNode} from 'lexical';

// @lexical/markdown 내부와 동일한 GFM 테이블 행 판별
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

function splitMarkdownTableRow(line: string): string[] {
    let s = line.trim();
    if (s.startsWith('|')) {
        s = s.slice(1);
    }
    if (s.endsWith('|')) {
        s = s.slice(0, -1);
    }
    return s.split('|').map((c) => c.trim());
}

function appendTableCellParagraph(cell: TableCellNode, text: string): void {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(text));
    cell.append(paragraph);
}

// GFM 테이블 → Lexical TableNode (multiline import)
const TABLE_TRANSFORMER: Transformer = {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node) => {
        if (!$isTableNode(node)) {
            return null;
        }

        const rows = node.getChildren();
        if (rows.length === 0) {
            return null;
        }

        const lines: string[] = [];

        rows.forEach((row: LexicalNode, rowIndex: number) => {
            if (!$isElementNode(row)) {
                return;
            }
            const cells = row.getChildren();
            const cellTexts = cells.map((cell) => {
                const text = cell.getTextContent().trim();
                return text || ' ';
            });

            lines.push('| ' + cellTexts.join(' | ') + ' |');

            if (rowIndex === 0) {
                const separator = cells.map(() => '---').join(' | ');
                lines.push('| ' + separator + ' |');
            }
        });

        return lines.join('\n');
    },
    handleImportAfterStartMatch: ({lines, rootNode, startLineIndex}) => {
        const headerLine = lines[startLineIndex]?.replace(/\r$/, '') ?? '';
        if (!TABLE_ROW_REG_EXP.test(headerLine)) {
            return null;
        }
        const dividerIndex = startLineIndex + 1;
        if (dividerIndex >= lines.length) {
            return null;
        }
        const dividerLine = lines[dividerIndex].replace(/\r$/, '');
        if (!TABLE_ROW_DIVIDER_REG_EXP.test(dividerLine)) {
            return null;
        }

        const headerCells = splitMarkdownTableRow(headerLine);
        const colCount = headerCells.length;
        if (colCount === 0) {
            return null;
        }

        const tableNode = $createTableNode();

        const headerRowNode = $createTableRowNode();
        for (let c = 0; c < colCount; c++) {
            const cell = $createTableCellNode(TableCellHeaderStates.ROW);
            appendTableCellParagraph(cell, headerCells[c] ?? '');
            headerRowNode.append(cell);
        }
        tableNode.append(headerRowNode);

        let i = dividerIndex + 1;
        while (i < lines.length) {
            const line = lines[i].replace(/\r$/, '');
            if (!TABLE_ROW_REG_EXP.test(line)) {
                break;
            }
            const cells = splitMarkdownTableRow(line);
            const bodyRow = $createTableRowNode();
            for (let c = 0; c < colCount; c++) {
                const cell = $createTableCellNode();
                appendTableCellParagraph(cell, cells[c] ?? '');
                bodyRow.append(cell);
            }
            tableNode.append(bodyRow);
            i++;
        }

        rootNode.append(tableNode);
        return [true, i - 1];
    },
    regExpStart: TABLE_ROW_REG_EXP,
    replace: () => {
        // handleImportAfterStartMatch에서 import 처리
    },
    type: 'multiline-element',
};

// 리스트 transformer를 제외한 element transformers (heading, code, quote만)
// 리스트는 MarkdownShortcutPlugin의 element transformer와 ListPlugin의 indent/outdent가 충돌하므로 제외
const ELEMENT_TRANSFORMERS_WITHOUT_LIST = ELEMENT_TRANSFORMERS.filter(
    (t) => {
        const regStr = t.regExp?.toString() || '';
        return !regStr.includes('[-*+]') && !regStr.includes('\\d');
    },
);

export const CHANNELS_SHORTCUT_TRANSFORMERS: Transformer[] = [
    ...ELEMENT_TRANSFORMERS_WITHOUT_LIST,
    ...TEXT_FORMAT_TRANSFORMERS,
    ...TEXT_MATCH_TRANSFORMERS,
];

export const CHANNELS_TRANSFORMERS: Transformer[] = [
    TABLE_TRANSFORMER,
    ...TRANSFORMERS,
];

export {TRANSFORMERS};
