import {
    FORMAT_TEXT_COMMAND,
    $getSelection,
    $isRangeSelection,
} from 'lexical';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {$createHeadingNode, $createQuoteNode} from '@lexical/rich-text';
import {$setBlocksType} from '@lexical/selection';
import {$toggleLink} from '@lexical/link';
import type {LexicalEditor} from 'lexical';
import type {MarkdownMode} from 'utils/markdown/apply_markdown';

export function applyLexicalFormatting(editor: LexicalEditor, mode: MarkdownMode): void {
    switch (mode) {
    case 'bold':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        break;
    case 'italic':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        break;
    case 'strike':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        break;
    case 'code':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        break;
    case 'ul':
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        break;
    case 'ol':
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        break;
    case 'heading':
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode('h3'));
            }
        });
        break;
    case 'quote':
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
            }
        });
        break;
    case 'link':
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                // 선택된 텍스트가 이미 링크인 경우 토글 해제, 아니면 placeholder URL 삽입
                $toggleLink('https://');
            }
        });
        break;
    }
}
