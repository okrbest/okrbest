// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$convertToMarkdownString} from '@lexical/markdown';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$getRoot} from 'lexical';
import {useEffect} from 'react';

import {CHANNELS_TRANSFORMERS} from '../config/markdown_transformers';

type Props = {
    onChange: (markdown: string) => void;
};

export default function OnChangeMarkdownPlugin({onChange}: Props): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(
            ({editorState, dirtyElements, dirtyLeaves, tags}) => {
                if (
                    tags.has('history-merge') ||
                    (dirtyElements.size === 0 && dirtyLeaves.size === 0)
                ) {
                    return;
                }
                editorState.read(() => {
                    const markdown = $convertToMarkdownString(
                        CHANNELS_TRANSFORMERS,
                    );
                    const visibleText = $getRoot().getTextContent();

                    // 마크다운 export 버그·일부 노드 미지원 시 빈 문자열만 나오면 draft가 ''가 되고
                    // ValueSyncPlugin이 에디터를 비워 버림 → 평문으로라도 draft를 유지
                    if (markdown.trim() === '' && visibleText.trim() !== '') {
                        onChange(visibleText);
                        return;
                    }
                    onChange(markdown);
                });
            },
        );
    }, [editor, onChange]);

    return null;
}
