import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString } from "@lexical/markdown";
import { CHANNELS_TRANSFORMERS } from "../config/markdown_transformers";

type Props = {
    onChange: (markdown: string) => void;
};

export default function OnChangeMarkdownPlugin({ onChange }: Props): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(
            ({ editorState, dirtyElements, dirtyLeaves, tags }) => {
                // Skip selection-only changes and programmatic history merges
                if (
                    tags.has("history-merge") ||
                    (dirtyElements.size === 0 && dirtyLeaves.size === 0)
                ) {
                    return;
                }
                editorState.read(() => {
                    const markdown = $convertToMarkdownString(
                        CHANNELS_TRANSFORMERS
                    );
                    onChange(markdown);
                });
            }
        );
    }, [editor, onChange]);

    return null;
}
