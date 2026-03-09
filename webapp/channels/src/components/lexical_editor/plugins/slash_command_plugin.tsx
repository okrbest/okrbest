import React, {useCallback, useEffect, useState} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    $getRoot,
    TextNode,
} from 'lexical';

import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

type CommandResult = {
    trigger: string;
    display_name: string;
    description: string;
};

type Props = {
    searchCommands?: (term: string) => Promise<CommandResult[]>;
};

export default function SlashCommandPlugin({searchCommands}: Props) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

    // / 입력 감지 (줄 시작에서만)
    useEffect(() => {
        return editor.registerTextContentListener(() => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const anchor = selection.anchor;
                const anchorNode = anchor.getNode();

                if (!(anchorNode instanceof TextNode)) {
                    setQueryString(null);
                    return;
                }

                // 첫 번째 paragraph의 첫 번째 텍스트 노드인지 확인
                const parent = anchorNode.getParent();
                const root = $getRoot();
                const firstChild = root.getFirstChild();
                if (parent !== firstChild) {
                    setQueryString(null);
                    return;
                }

                const text = anchorNode.getTextContent().slice(0, anchor.offset);
                const slashMatch = text.match(/^\/(\w*)$/);

                if (slashMatch) {
                    setQueryString(slashMatch[1]);
                } else {
                    setQueryString(null);
                }
            });
        });
    }, [editor]);

    // 검색 (debounce + cancellation)
    useEffect(() => {
        if (queryString === null || !searchCommands) {
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            searchCommands(queryString).then((commands) => {
                if (!cancelled) {
                    setSuggestions(
                        commands.map((cmd) => ({
                            id: cmd.trigger,
                            display: `/${cmd.trigger}`,
                            description: cmd.description,
                        })),
                    );
                }
            });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [queryString, searchCommands]);

    const handleSelect = useCallback((item: SuggestionItem) => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }

            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();

            if (!(anchorNode instanceof TextNode)) {
                return;
            }

            // 슬래시 명령어 텍스트로 교체
            anchorNode.setTextContent(`/${item.id} `);
            anchorNode.selectEnd();
        });

        setQueryString(null);
    }, [editor]);

    const handleClose = useCallback(() => {
        setQueryString(null);
    }, []);

    if (queryString === null) {
        return null;
    }

    return (
        <SuggestionList
            items={suggestions}
            onSelect={handleSelect}
            onClose={handleClose}
            header="Commands"
        />
    );
}
