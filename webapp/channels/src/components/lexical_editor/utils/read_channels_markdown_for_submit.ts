// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$convertToMarkdownString} from '@lexical/markdown';
import type {LexicalEditor} from 'lexical';
import {$getRoot} from 'lexical';

import {CHANNELS_TRANSFORMERS} from '../config/markdown_transformers';
import {unescapeUnderscoresInMarkdownUrls} from 'utils/markdown_normalize';

/**
 * 전송 직전 등 OnChange 반영 전에 호출해 에디터 상태와 draft.message 를 맞춘다.
 */
export function readChannelsMarkdownForSubmit(editor: LexicalEditor): string {
    let result = '';
    editor.getEditorState().read(() => {
        const markdown = $convertToMarkdownString(CHANNELS_TRANSFORMERS);
        const visibleText = $getRoot().getTextContent();
        if (markdown.trim() === '' && visibleText.trim() !== '') {
            result = visibleText;
        } else {
            result = unescapeUnderscoresInMarkdownUrls(markdown);
        }
    });
    return result;
}
