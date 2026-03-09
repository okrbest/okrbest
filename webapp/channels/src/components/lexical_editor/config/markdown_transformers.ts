import {
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

        rows.forEach((row, rowIndex) => {
            const cells = row.getChildren();
            const cellTexts = cells.map((cell) => {
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

// 모든 기본 Transformer + 테이블 Transformer
export const CHANNELS_TRANSFORMERS: Transformer[] = [
    TABLE_TRANSFORMER,
    ...TRANSFORMERS,
];

export {TRANSFORMERS};
