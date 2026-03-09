import {useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    $isParagraphNode,
    TextNode,
    COMMAND_PRIORITY_HIGH,
    KEY_SPACE_COMMAND,
} from 'lexical';
import {
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
} from '@lexical/list';

/**
 * `- `, `* `, `+ ` → unordered list
 * `1. `, `2. ` 등 → ordered list
 *
 * MarkdownShortcutPlugin의 리스트 transformer 대신 사용.
 * ListPlugin의 indent/outdent와 충돌하지 않음.
 */
export default function ListShortcutPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_SPACE_COMMAND,
            (event: KeyboardEvent) => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                    return false;
                }

                const anchor = selection.anchor;
                const anchorNode = anchor.getNode();

                if (!(anchorNode instanceof TextNode)) {
                    return false;
                }

                const parent = anchorNode.getParent();
                if (!$isParagraphNode(parent)) {
                    return false;
                }

                // 현재 paragraph의 첫 번째 자식이어야 함
                if (parent.getFirstChild() !== anchorNode) {
                    return false;
                }

                const textBeforeCursor = anchorNode.getTextContent().slice(0, anchor.offset);

                // `- `, `* `, `+ ` → unordered list
                if (/^[-*+]$/.test(textBeforeCursor)) {
                    event.preventDefault();
                    // 트리거 문자 제거
                    anchorNode.setTextContent(anchorNode.getTextContent().slice(anchor.offset));
                    if (!anchorNode.getTextContent()) {
                        anchorNode.remove();
                    }
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                    return true;
                }

                // `1.`, `2.` 등 → ordered list
                if (/^\d+\.$/.test(textBeforeCursor)) {
                    event.preventDefault();
                    anchorNode.setTextContent(anchorNode.getTextContent().slice(anchor.offset));
                    if (!anchorNode.getTextContent()) {
                        anchorNode.remove();
                    }
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                    return true;
                }

                return false;
            },
            COMMAND_PRIORITY_HIGH,
        );
    }, [editor]);

    return null;
}
