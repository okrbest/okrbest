// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {useSelector} from 'react-redux';

import {usePluginVisibilityInSharedChannel} from 'components/common/hooks/usePluginVisibilityInSharedChannel';
import type {LexicalTextEditorHandle} from 'components/lexical_editor/lexical_text_editor';

import PluggableErrorBoundary from 'plugins/pluggable/error_boundary';

import type {GlobalState} from 'types/store';
import type {PostDraft} from 'types/store/draft';

const usePluginItems = (
    draft: PostDraft,
    editorRef: React.RefObject<LexicalTextEditorHandle>,
    handleDraftChange: (draft: PostDraft) => void,
    channelId?: string,
) => {
    const postEditorActions = useSelector((state: GlobalState) => state.plugins.components.PostEditorAction);
    const pluginItemsVisible = usePluginVisibilityInSharedChannel(channelId);

    const getSelectedText = useCallback(() => {
        return {
            start: 0,
            end: 0,
        };
    }, []);

    const updateText = useCallback((message: string) => {
        handleDraftChange({
            ...draft,
            message,
        });
    }, [handleDraftChange, draft]);

    const items = useMemo(() => {
        if (!pluginItemsVisible) {
            return [];
        }

        return postEditorActions?.map((item) => {
            if (!item.component) {
                return null;
            }

            const Component = item.component as any;
            return (
                <PluggableErrorBoundary
                    key={item.id}
                    pluginId={item.pluginId}
                >
                    <Component
                        draft={draft}
                        getSelectedText={getSelectedText}
                        updateText={updateText}
                    />
                </PluggableErrorBoundary>
            );
        });
    }, [postEditorActions, draft, getSelectedText, updateText, pluginItemsVisible]);

    return items;
};

export default usePluginItems;
