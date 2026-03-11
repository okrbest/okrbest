import {useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {BLUR_COMMAND, FOCUS_COMMAND, COMMAND_PRIORITY_LOW} from 'lexical';

type Props = {
    onFocus?: () => void;
    onBlur?: () => void;
};

export default function FocusPlugin({onFocus, onBlur}: Props): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const removeFocusListener = editor.registerCommand(
            FOCUS_COMMAND,
            () => {
                onFocus?.();
                return false;
            },
            COMMAND_PRIORITY_LOW,
        );

        const removeBlurListener = editor.registerCommand(
            BLUR_COMMAND,
            () => {
                onBlur?.();
                return false;
            },
            COMMAND_PRIORITY_LOW,
        );

        return () => {
            removeFocusListener();
            removeBlurListener();
        };
    }, [editor, onFocus, onBlur]);

    return null;
}
