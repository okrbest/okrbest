// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type TextboxClass from 'components/textbox/textbox';

import {renderHookWithContext} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {QuotableEditorHandle} from './use_pending_quote';
import usePendingQuote from './use_pending_quote';

describe('usePendingQuote', () => {
    const channelId = 'channel_id';
    const draft = TestHelper.getPostDraftMock({channelId, rootId: '', message: 'Hey there'});

    const initialState = {
        views: {
            drafts: {
                pendingQuote: {channelId, rootId: '', text: 'quoted text'},
            },
        },
    };

    function renderPendingQuote(isDisabled: boolean, isBusy: boolean) {
        const handleDraftChange = jest.fn();
        const textboxRef = React.createRef<TextboxClass>();
        const wysiwygRef = React.createRef<QuotableEditorHandle>();
        const state = {isDisabled, isBusy};

        const {rerender} = renderHookWithContext(
            () => usePendingQuote(draft, handleDraftChange, channelId, '', false, state.isDisabled, state.isBusy, textboxRef, wysiwygRef),
            initialState,
        );

        const update = (changes: Partial<typeof state>) => {
            Object.assign(state, changes);
            rerender();
        };

        return {handleDraftChange, update};
    }

    test('should append the quote to the draft', () => {
        const {handleDraftChange} = renderPendingQuote(false, false);

        expect(handleDraftChange).toHaveBeenCalledWith({...draft, message: 'Hey there\n\n> quoted text\n\n'}, {instant: true});
    });

    test('should keep the quote while the message box is busy and add it once it is done', () => {
        const {handleDraftChange, update} = renderPendingQuote(true, true);

        expect(handleDraftChange).not.toHaveBeenCalled();

        update({isDisabled: false, isBusy: false});

        expect(handleDraftChange).toHaveBeenCalledTimes(1);
        expect(handleDraftChange).toHaveBeenCalledWith({...draft, message: 'Hey there\n\n> quoted text\n\n'}, {instant: true});
    });

    test('should drop the quote when the message box cannot be used', () => {
        const {handleDraftChange, update} = renderPendingQuote(true, false);

        expect(handleDraftChange).not.toHaveBeenCalled();

        update({isDisabled: false, isBusy: false});

        expect(handleDraftChange).not.toHaveBeenCalled();
    });

    // okrbest: our message box is the Lexical editor, which takes the place of upstream's rich text editor
    describe('with the Lexical editor', () => {
        function renderWithEditor({rootId = '', isInEditMode = false} = {}) {
            const handleDraftChange = jest.fn();
            const appendQuote = jest.fn();
            const textboxRef = React.createRef<TextboxClass>();
            const editorRef = {current: {appendQuote}};

            renderHookWithContext(
                () => usePendingQuote(draft, handleDraftChange, channelId, rootId, isInEditMode, false, false, textboxRef, editorRef),
                initialState,
            );

            return {appendQuote, handleDraftChange};
        }

        test('should insert the quote with the editor instead of rewriting the draft', () => {
            const {appendQuote, handleDraftChange} = renderWithEditor();

            expect(appendQuote).toHaveBeenCalledTimes(1);
            expect(appendQuote).toHaveBeenCalledWith('quoted text');
            expect(handleDraftChange).not.toHaveBeenCalled();
        });

        test('should leave a quote meant for another thread to its message box', () => {
            const {appendQuote} = renderWithEditor({rootId: 'some_root_id'});

            expect(appendQuote).not.toHaveBeenCalled();
        });

        test('should not quote into a message being edited', () => {
            const {appendQuote} = renderWithEditor({isInEditMode: true});

            expect(appendQuote).not.toHaveBeenCalled();
        });
    });
});
