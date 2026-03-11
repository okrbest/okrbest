import {
    ELEMENT_TRANSFORMERS,
    TEXT_FORMAT_TRANSFORMERS,
    TEXT_MATCH_TRANSFORMERS,
    TRANSFORMERS,
} from '@lexical/markdown';
import type {Transformer} from '@lexical/markdown';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';

// GFM 테이블 Transformer
// 마크다운 테이블 문법을 Lexical TableNode로 변환
const TABLE_TRANSFORMER: Transformer = {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node) => {
        // TableNode → 마크다운 테이블 문자열
        if (node.getType() !== 'table') {
            return null;
        }

        const rows = node.getChildren();
        if (rows.length === 0) {
            return null;
        }

        const lines: string[] = [];

        rows.forEach((row: any, rowIndex: number) => {
            const cells = row.getChildren();
            const cellTexts = cells.map((cell: any) => {
                const text = cell.getTextContent().trim();
                return text || ' ';
            });

            lines.push('| ' + cellTexts.join(' | ') + ' |');

            // 헤더 구분선 (첫 번째 행 뒤)
            if (rowIndex === 0) {
                const separator = cells.map(() => '---').join(' | ');
                lines.push('| ' + separator + ' |');
            }
        });

        return lines.join('\n');
    },
    regExp: /^(\|.+\|)\n(\|[-| :]+\|)\n((\|.+\|\n?)+)$/m,
    replace: (parentNode) => {
        // 마크다운 테이블 → TableNode
        // 간단한 테이블 파싱 → Lexical TableNode 생성
        // 실제 구현 시 @lexical/table의 $createTableNodeWithDimensions 활용
        // 현재는 기본 텍스트로 유지
        return;
    },
    type: 'element',
};

// 리스트 transformer를 제외한 element transformers (heading, code, quote만)
// 리스트는 MarkdownShortcutPlugin의 element transformer와 ListPlugin의 indent/outdent가 충돌하므로 제외
const ELEMENT_TRANSFORMERS_WITHOUT_LIST = ELEMENT_TRANSFORMERS.filter(
    (t) => {
        // UNORDERED_LIST와 ORDERED_LIST의 regExp 패턴으로 식별
        const regStr = t.regExp?.toString() || '';
        return !regStr.includes('[-*+]') && !regStr.includes('\\d');
    },
);

// MarkdownShortcutPlugin용: 리스트 transformer 제외
// (리스트는 ListShortcutPlugin에서 별도 처리)
export const CHANNELS_SHORTCUT_TRANSFORMERS: Transformer[] = [
    ...ELEMENT_TRANSFORMERS_WITHOUT_LIST,
    ...TEXT_FORMAT_TRANSFORMERS,
    ...TEXT_MATCH_TRANSFORMERS,
];

// 마크다운 <-> 에디터 변환용 (전체 transformer 포함)
export const CHANNELS_TRANSFORMERS: Transformer[] = [
    TABLE_TRANSFORMER,
    ...TRANSFORMERS,
];

export {TRANSFORMERS};
