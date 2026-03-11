// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type React from 'react';
import {useCallback, useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {focusedRHS} from 'actions/views/rhs';
import {getIsRhsExpanded, getIsRhsOpen} from 'selectors/rhs';
import {getShouldFocusRHS} from 'selectors/views/rhs';

import useDidUpdate from 'components/common/hooks/useDidUpdate';
import type {LexicalTextEditorHandle} from 'components/lexical_editor/lexical_text_editor';

import {shouldFocusMainTextbox} from 'utils/post_utils';
import * as UserAgent from 'utils/user_agent';

const useTextboxFocus = (
    editorRef: React.RefObject<LexicalTextEditorHandle>,
    channelId: string,
    isRHS: boolean,
    canPost: boolean,
) => {
    const dispatch = useDispatch();

    const hasMounted = useRef(false);

    const rhsExpanded = useSelector(getIsRhsExpanded);
    const rhsOpen = useSelector(getIsRhsOpen);
    const shouldFocusRHS = useSelector(getShouldFocusRHS, () => true);

    const focusTextbox = useCallback((keepFocus = false) => {
        const postTextboxDisabled = !canPost;
        if (editorRef.current && postTextboxDisabled) {
            requestAnimationFrame(() => {
                editorRef.current?.blur();
            });
            return;
        }
        if (editorRef.current && (keepFocus || !UserAgent.isMobile())) {
            editorRef.current?.focus();

            requestAnimationFrame(() => {
                editorRef.current?.focus();
            });
        }
    }, [canPost]);

    const focusTextboxIfNecessary = useCallback((e: KeyboardEvent) => {
        if (!isRHS && rhsExpanded) {
            return;
        }

        if (isRHS && !rhsExpanded) {
            return;
        }

        if (isRHS && rhsOpen && document.activeElement?.tagName === 'BODY') {
            return;
        }

        if (document.getElementsByClassName('channel-switch-modal').length) {
            return;
        }

        if (shouldFocusMainTextbox(e, document.activeElement)) {
            focusTextbox();
        }
    }, [focusTextbox, rhsExpanded, rhsOpen, isRHS]);

    useEffect(() => {
        document.addEventListener('keydown', focusTextboxIfNecessary);
        return () => {
            document.removeEventListener('keydown', focusTextboxIfNecessary);
        };
    }, [focusTextboxIfNecessary]);

    useDidUpdate(() => {
        focusTextbox();
    }, [channelId]);

    useEffect(() => {
        if (isRHS && shouldFocusRHS) {
            focusTextbox();
            dispatch(focusedRHS());
        } else if (!isRHS && !shouldFocusRHS && !hasMounted.current) {
            focusTextbox();
        }

        if (!hasMounted.current) {
            hasMounted.current = true;
        }
    }, [isRHS, shouldFocusRHS, focusTextbox, dispatch]);

    return focusTextbox;
};

export default useTextboxFocus;
