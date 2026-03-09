import {useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_TAB_COMMAND,
    COMMAND_PRIORITY_HIGH,
    INSERT_PARAGRAPH_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
} from 'lexical';

type Props = {
    onSubmit: () => void;
    onEscape?: () => void;
};

export default function KeyboardPlugin({onSubmit, onEscape}: Props): null {
    const [editor] = useLexicalComposerContext();

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

                // Enter = 메시지 전송
                event.preventDefault();
                onSubmit();
                return true;
            },
            COMMAND_PRIORITY_HIGH,
        );

        const removeEscapeListener = editor.registerCommand(
            KEY_ESCAPE_COMMAND,
            () => {
                if (onEscape) {
                    onEscape();
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
    }, [editor, onSubmit, onEscape]);

    return null;
}
