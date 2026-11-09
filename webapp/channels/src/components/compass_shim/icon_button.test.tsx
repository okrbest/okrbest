// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import CloseIcon from '@mattermost/compass-icons/components/close';

import {Icon} from './icon';
import {IconButton} from './icon_button';

describe('compass_shim/IconButton', () => {
    test('should render a button with the default size, padding and style', () => {
        render(
            <IconButton
                icon={<Icon glyph={<CloseIcon/>}/>}
                aria-label='Close'
            />,
        );

        const button = screen.getByRole('button', {name: 'Close'});
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveClass(
            'compass-shim-icon-button',
            'compass-shim-icon-button--size-small',
            'compass-shim-icon-button--padding-default',
            'compass-shim-icon-button--style-default',
        );
    });

    test('should apply the given size, padding, style and class name', () => {
        render(
            <IconButton
                icon={<Icon glyph={<CloseIcon/>}/>}
                aria-label='Close'
                size='medium'
                padding='compact'
                style='inverted'
                className='file-preview-modal__icon-button'
            />,
        );

        expect(screen.getByRole('button', {name: 'Close'})).toHaveClass(
            'compass-shim-icon-button--size-medium',
            'compass-shim-icon-button--padding-compact',
            'compass-shim-icon-button--style-inverted',
            'file-preview-modal__icon-button',
        );
    });

    test('should pass aria attributes, id and click handlers to the button', async () => {
        const onClick = jest.fn();
        render(
            <IconButton
                id='previewArrowLeft'
                icon={<Icon glyph={<CloseIcon/>}/>}
                aria-label='Preview'
                aria-pressed={true}
                onClick={onClick}
            />,
        );

        const button = screen.getByRole('button', {name: 'Preview'});
        expect(button).toHaveAttribute('id', 'previewArrowLeft');
        expect(button).toHaveAttribute('aria-pressed', 'true');

        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should not call the click handler when disabled', async () => {
        const onClick = jest.fn();
        render(
            <IconButton
                icon={<Icon glyph={<CloseIcon/>}/>}
                aria-label='Close'
                onClick={onClick}
                disabled={true}
            />,
        );

        await userEvent.click(screen.getByRole('button', {name: 'Close'}));
        expect(onClick).not.toHaveBeenCalled();
    });

    test('should forward its ref to the button so that tooltips can anchor to it', () => {
        const ref = React.createRef<HTMLButtonElement>();
        render(
            <IconButton
                ref={ref}
                icon={<Icon glyph={<CloseIcon/>}/>}
                aria-label='Close'
            />,
        );

        expect(ref.current).toBe(screen.getByRole('button', {name: 'Close'}));
    });

    test('should render its child instead of a button with asChild, like a download link', () => {
        render(
            <IconButton
                asChild={true}
                icon={<Icon glyph={<CloseIcon/>}/>}
                aria-label='Download'
                className='file-preview-modal-main-actions__download'
            >
                {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- IconButton puts the icon inside the link */}
                <a
                    href='/files/abc'
                    download='a.md'
                    className='external-link'
                />
            </IconButton>,
        );

        const link = screen.getByRole('link', {name: 'Download'});
        expect(link).toHaveAttribute('href', '/files/abc');
        expect(link).toHaveAttribute('download', 'a.md');
        expect(link).toHaveClass('external-link', 'compass-shim-icon-button', 'file-preview-modal-main-actions__download');
        expect(link.querySelector('.compass-shim-icon')).not.toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });
});

describe('compass_shim/Icon', () => {
    test('should wrap the glyph in a decorative span', () => {
        const {container} = render(<Icon glyph={<CloseIcon/>}/>);

        const icon = container.querySelector('.compass-shim-icon');
        expect(icon).not.toBeNull();
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon?.querySelector('svg')).not.toBeNull();
    });
});
