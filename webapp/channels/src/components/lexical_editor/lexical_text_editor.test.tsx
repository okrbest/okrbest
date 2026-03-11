import React from 'react';
import {render, screen} from '@testing-library/react';

import LexicalTextEditor from './lexical_text_editor';

describe('LexicalTextEditor', () => {
    const baseProps = {
        id: 'test-editor',
        value: '',
        channelId: 'channel-1',
        characterLimit: 4000,
        onChange: jest.fn(),
        createMessage: 'Write a message...',
    };

    it('should render without crashing', () => {
        render(<LexicalTextEditor {...baseProps} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with initial markdown value', () => {
        render(<LexicalTextEditor {...baseProps} value="**bold text**" />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
        render(<LexicalTextEditor {...baseProps} disabled={true} />);
        expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
    });
});
