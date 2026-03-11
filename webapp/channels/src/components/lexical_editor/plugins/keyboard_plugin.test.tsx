import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';

import KeyboardPlugin from './keyboard_plugin';

const TestEditor = ({onSubmit, onEscape}: {onSubmit: jest.Mock; onEscape?: jest.Mock}) => (
    <LexicalComposer initialConfig={{namespace: 'test', onError: jest.fn(), theme: {}}}>
        <RichTextPlugin
            contentEditable={<ContentEditable data-testid="editor" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
        />
        <KeyboardPlugin onSubmit={onSubmit} onEscape={onEscape} />
    </LexicalComposer>
);

describe('KeyboardPlugin', () => {
    it('should call onSubmit when Enter is pressed', async () => {
        const onSubmit = jest.fn();
        render(<TestEditor onSubmit={onSubmit} />);

        const editor = screen.getByTestId('editor');
        await userEvent.click(editor);
        await userEvent.keyboard('{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when Shift+Enter is pressed', async () => {
        const onSubmit = jest.fn();
        render(<TestEditor onSubmit={onSubmit} />);

        const editor = screen.getByTestId('editor');
        await userEvent.click(editor);
        await userEvent.keyboard('{Shift>}{Enter}{/Shift}');

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should call onEscape when Escape is pressed', async () => {
        const onEscape = jest.fn();
        render(<TestEditor onSubmit={jest.fn()} onEscape={onEscape} />);

        const editor = screen.getByTestId('editor');
        await userEvent.click(editor);
        await userEvent.keyboard('{Escape}');

        expect(onEscape).toHaveBeenCalledTimes(1);
    });
});
