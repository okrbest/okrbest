import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    $getRoot,
    TextNode,
} from 'lexical';

import {Client4} from 'mattermost-redux/client';
import type {AutocompleteSuggestion, CommandArgs} from '@mattermost/types/integrations';

import SuggestionList, {type SuggestionItem} from '../utils/suggestion_list';

type Props = {
    teamId: string;
    channelId: string;
    rootId?: string;
};

export default function SlashCommandPlugin({teamId, channelId, rootId}: Props) {
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
                const slashMatch = text.match(/^\/(\S*)$/);

                if (slashMatch) {
                    setQueryString(slashMatch[0]); // 전체 "/command" 문자열
                } else {
                    setQueryString(null);
                }
            });
        });
    }, [editor]);

    // API에서 자동완성 제안 가져오기
    const teamIdRef = useRef(teamId);
    teamIdRef.current = teamId;
    const channelIdRef = useRef(channelId);
    channelIdRef.current = channelId;
    const rootIdRef = useRef(rootId);
    rootIdRef.current = rootId;

    useEffect(() => {
        if (queryString === null) {
            setSuggestions([]);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            const command = queryString.toLowerCase();
            const args: CommandArgs = {
                team_id: teamIdRef.current,
                channel_id: channelIdRef.current,
                root_id: rootIdRef.current,
            };

            Client4.getCommandAutocompleteSuggestionsList(command, teamIdRef.current, args).then(
                (data: AutocompleteSuggestion[]) => {
                    if (cancelled) {
                        return;
                    }

                    const items: SuggestionItem[] = data.
                        filter((s) => s.Suggestion).
                        sort((a, b) => a.Suggestion.localeCompare(b.Suggestion)).
                        map((s) => ({
                            id: s.Complete || s.Suggestion,
                            display: '/' + s.Suggestion,
                            description: s.Description,
                        }));

                    setSuggestions(items);
                },
            ).catch(() => {
                if (!cancelled) {
                    setSuggestions([]);
                }
            });
        }, 150);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [queryString]);

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
