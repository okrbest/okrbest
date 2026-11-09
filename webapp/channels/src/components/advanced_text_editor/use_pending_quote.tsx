// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type React from 'react';
import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {clearPendingQuote} from 'actions/views/drafts';
import {getPendingQuote} from 'selectors/drafts';

import type {LexicalTextEditorHandle} from 'components/lexical_editor/lexical_text_editor';
import type TextboxClass from 'components/textbox/textbox';

import {appendQuoteToMessage} from 'utils/quote';
import {setCaretPosition} from 'utils/utils';

import type {PostDraft} from 'types/store/draft';

// okrbest: upstream passes its TipTap editor (WysiwygEditorHandle) here. We pass the Lexical editor, which
// has the same appendQuote (components/lexical_editor/lexical_text_editor.tsx). The Textbox branch below is
// kept as upstream wrote it, for when no editor is mounted.
export type QuotableEditorHandle = Pick<LexicalTextEditorHandle, 'appendQuote'>;

/**
 * Inserts text quoted from a post (see quoteTextInDraft) into this message box when the quote
 * targets the same channel and thread.
 */
const usePendingQuote = (
    draft: PostDraft,
    handleDraftChange: (draft: PostDraft, options?: {instant?: boolean; show?: boolean}) => void,
    channelId: string,
    rootId: string,
    isInEditMode: boolean,
    isDisabled: boolean,
    isBusy: boolean,
    textboxRef: React.RefObject<TextboxClass | null>,
    wysiwygRef: React.RefObject<QuotableEditorHandle | null>,
) => {
    const dispatch = useDispatch();
    const pendingQuote = useSelector(getPendingQuote);

    useEffect(() => {
        if (!pendingQuote || isInEditMode || pendingQuote.channelId !== channelId || pendingQuote.rootId !== rootId) {
            return;
        }

        // Keep the quote until the message box is done with what it's doing, such as rewriting the draft.
        if (isBusy) {
            return;
        }

        dispatch(clearPendingQuote());

        // The message box can't be used, such as in a read-only channel, so drop the quote.
        if (isDisabled) {
            return;
        }

        if (wysiwygRef.current) {
            wysiwygRef.current.appendQuote(pendingQuote.text);
            return;
        }

        const message = appendQuoteToMessage(draft.message, pendingQuote.text);
        if (message === draft.message) {
            return;
        }

        handleDraftChange({...draft, message}, {instant: true});

        // Wait for the new message to be rendered before moving the caret to its end.
        requestAnimationFrame(() => {
            const input = textboxRef.current?.getInputBox();
            if (input) {
                setCaretPosition(input, message.length);
                input.scrollTop = input.scrollHeight;
            }
        });

        // Only react to new quotes and to the message box becoming available. The draft and its
        // handlers are read at that moment.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingQuote, isBusy]);
};

export default usePendingQuote;
