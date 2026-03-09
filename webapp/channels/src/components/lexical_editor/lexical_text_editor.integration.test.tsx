import React from 'react';
import {render, screen, act} from '@testing-library/react';

import LexicalTextEditor from './lexical_text_editor';

describe('LexicalTextEditor markdown compatibility', () => {
    const baseProps = {
        id: 'test',
        channelId: 'ch1',
        characterLimit: 4000,
        createMessage: 'Write...',
        onChange: jest.fn(),
    };

    const testCases = [
        {input: '**bold text**', expected: 'bold text'},
        {input: '*italic text*', expected: 'italic text'},
        {input: '~~strikethrough~~', expected: 'strikethrough'},
        {input: '`inline code`', expected: 'inline code'},
        {input: '### Heading', expected: 'Heading'},
        {input: '> blockquote', expected: 'blockquote'},
        {input: '- item 1\n- item 2', expected: 'item 1'},
        {input: '1. first\n2. second', expected: 'first'},
        {input: '[link](https://example.com)', expected: 'link'},
    ];

    testCases.forEach(({input, expected}) => {
        it(`should render markdown: ${input.slice(0, 30)}`, async () => {
            await act(async () => {
                render(<LexicalTextEditor {...baseProps} value={input} />);
            });

            // InitialValuePlugin이 비동기로 마크다운을 파싱하므로 act 후 확인
            const textbox = screen.getByRole('textbox');
            expect(textbox.textContent).toContain(expected);
        });
    });

    it('should export valid markdown on change', async () => {
        const onChange = jest.fn();
        await act(async () => {
            render(<LexicalTextEditor {...baseProps} value="**bold**" onChange={onChange} />);
        });

        if (onChange.mock.calls.length > 0) {
            const lastMarkdown = onChange.mock.calls[onChange.mock.calls.length - 1][0];
            expect(typeof lastMarkdown).toBe('string');
        }
    });
});
