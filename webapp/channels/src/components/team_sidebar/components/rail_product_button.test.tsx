// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import RailProductButton from './rail_product_button';

describe('components/team_sidebar/components/rail_product_button', () => {
    const baseProps = {
        id: 'railProduct-test',
        icon: 'product-boards' as const,
        text: 'Boards',
        destination: '/boards',
        active: false,
    };

    it('should render a named link with icon and label', () => {
        renderWithContext(<RailProductButton {...baseProps}/>);

        const link = screen.getByRole('link', {name: 'Boards'});
        expect(link).toHaveAttribute('href', '/boards');
        expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('should render a ReactNode icon as is', () => {
        const props = {
            ...baseProps,
            icon: <span data-testid='custom-icon'/>,
        };

        renderWithContext(<RailProductButton {...props}/>);

        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should mark the active product', () => {
        renderWithContext(
            <RailProductButton
                {...baseProps}
                active={true}
            />,
        );

        const link = screen.getByRole('link', {name: 'Boards'});
        expect(link).toHaveClass('active');
        expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark an inactive product', () => {
        renderWithContext(<RailProductButton {...baseProps}/>);

        const link = screen.getByRole('link', {name: 'Boards'});
        expect(link).not.toHaveClass('active');
        expect(link).not.toHaveAttribute('aria-current');
    });
});
