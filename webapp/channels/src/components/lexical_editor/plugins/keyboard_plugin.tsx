import {useEffect, useRef} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_TAB_COMMAND,
    COMMAND_PRIORITY_HIGH,
    INSERT_PARAGRAPH_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import {ListItemNode} from '@lexical/list';
import {$getNearestNodeOfType} from '@lexical/utils';

type Props = {
    onSubmit: () => void;
    onEscape?: () => void;
};

export default function KeyboardPlugin({onSubmit, onEscape}: Props): null {
    const [editor] = useLexicalComposerContext();

    const onSubmitRef = useRef(onSubmit);
    onSubmitRef.current = onSubmit;

    const onEscapeRef = useRef(onEscape);
    onEscapeRef.current = onEscape;

    useEffect(() => {
        const removeEnterListener = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent | null) => {
                if (event === null) {
                    return false;
                }

                // Shift+Enter = 새 paragraph 삽입 (마크다운 숏컷이 동작하도록)
                if (event.shiftKey) {
                    event.preventDefault();
                    editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
                    return true;
                }

                // 리스트 안에서 Enter = 새 항목 추가 (Lexical 기본 동작에 위임)
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const anchorNode = selection.anchor.getNode();
                    const listItem = $getNearestNodeOfType(anchorNode, ListItemNode);
                    if (listItem) {
                        return false;
                    }
                }

                // Enter = 메시지 전송
                event.preventDefault();
                onSubmitRef.current();
                return true;
            },
            COMMAND_PRIORITY_HIGH,
        );

        const removeEscapeListener = editor.registerCommand(
            KEY_ESCAPE_COMMAND,
            () => {
                if (onEscapeRef.current) {
                    onEscapeRef.current();
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_HIGH,
        );

        // Tab/Shift+Tab = 리스트 들여쓰기/내어쓰기
        const removeTabListener = editor.registerCommand(
            KEY_TAB_COMMAND,
            (event: KeyboardEvent) => {
                event.preventDefault();
                editor.dispatchCommand(
                    event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
                    undefined,
                );
                return true;
            },
            COMMAND_PRIORITY_HIGH,
        );

        return () => {
            removeEnterListener();
            removeEscapeListener();
            removeTabListener();
        };
    }, [editor]);

    return null;
}
