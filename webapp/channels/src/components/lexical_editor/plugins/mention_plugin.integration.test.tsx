// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {act} from '@testing-library/react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$getRoot, $createParagraphNode, $createTextNode, type LexicalEditor} from 'lexical';

import {Client4} from 'mattermost-redux/client';

import {renderWithContext, userEvent, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import {MentionNode} from '../nodes/mention_node';

import MentionPlugin from './mention_plugin';

// jsdom에는 레이아웃 엔진이 없어 Range/Element의 getBoundingClientRect가 없음.
// Lexical이 커서 위치를 계산할 때 이걸 호출하므로 폴리필이 필요함.
const rectStub = () => ({
    x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}),
});
Range.prototype.getBoundingClientRect = rectStub as any;
Range.prototype.getClientRects = function() {
    return [rectStub()] as unknown as DOMRectList;
};
Element.prototype.getBoundingClientRect = rectStub as any;

let testEditor: LexicalEditor | null = null;
function EditorCapture() {
    const [editor] = useLexicalComposerContext();
    testEditor = editor;
    return null;
}

const TestEditor = () => (
    <LexicalComposer
        initialConfig={{
            namespace: 'test',
            onError: (e) => {
                throw e;
            },
            theme: {},
            nodes: [MentionNode],
        }}
    >
        <RichTextPlugin
            contentEditable={<ContentEditable data-testid='editor' />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
        />
        <MentionPlugin channelId='channel-1' teamId='team-1' />
        <EditorCapture />
    </LexicalComposer>
);

const initialState = {
    entities: {
        general: {
            config: {},
        },
        channels: {
            channels: {
                'channel-1': TestHelper.getChannelMock({id: 'channel-1', team_id: 'team-1'}),
            },
        },
        users: {
            currentUserId: 'me',
            profiles: {
                me: TestHelper.getUserMock({id: 'me', username: 'me'}),
            },
        },
        preferences: {
            myPreferences: {},
        },
    },
};

// "내용 입력 @하는 중 확인" 텍스트를 삽입하고 커서를 '@' 바로 뒤(오프셋 7)에 둔다.
// (사용자가 "내용 입력 하는 중 확인"을 먼저 입력한 뒤 커서를 "하는" 앞으로 옮기고 '@'를 입력한 것과 동일한 최종 상태)
async function setUpTriggerWithTrailingText() {
    await act(async () => {
        testEditor!.update(() => {
            const root = $getRoot();
            root.clear();
            const p = $createParagraphNode();
            const node = $createTextNode('내용 입력 @하는 중 확인');
            p.append(node);
            root.append(p);
            node.select(7, 7);
        });
    });

    return screen.findByRole('option', {name: /sample1/}, {timeout: 3000});
}

function readFinalText() {
    return testEditor!.getEditorState().read(() => $getRoot().getTextContent());
}

describe('MentionPlugin integration', () => {
    beforeEach(() => {
        testEditor = null;
        jest.spyOn(Client4, 'autocompleteUsers').mockResolvedValue({
            users: [TestHelper.getUserMock({id: 'u1', username: 'sample1'})],
            out_of_channel: [],
        } as any);
    });

    it('트리거 직후 커서(빈 검색어) 상태에서 키보드로 선택해도 뒤 텍스트를 보존한다', async () => {
        renderWithContext(<TestEditor />, initialState);
        await setUpTriggerWithTrailingText();

        await act(async () => {
            await userEvent.keyboard('{Enter}');
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        expect(readFinalText()).toContain('하는 중 확인');
    });

    it('트리거 직후 커서(빈 검색어) 상태에서 마우스 클릭으로 선택해도 뒤 텍스트를 보존한다', async () => {
        renderWithContext(<TestEditor />, initialState);
        const option = await setUpTriggerWithTrailingText();

        await act(async () => {
            await userEvent.click(option);
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        expect(readFinalText()).toContain('하는 중 확인');
    });
});
