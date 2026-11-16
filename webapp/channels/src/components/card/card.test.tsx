// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act} from '@testing-library/react';
import React from 'react';

import {renderWithContext} from 'tests/react_testing_utils';

import Card from './card';

describe('components/card/card', () => {
    test('a real transitionend event clears expanding immediately', () => {
        const props = {
            expanded: true,
        };

        const {container} = renderWithContext(
            <Card {...props}>
                <Card.Header>{'Header Test'}</Card.Header>
                <Card.Body>{'Body Test'}</Card.Body>
            </Card>,
        );

        const body = container.querySelector('.Card__body') as HTMLElement;
        expect(body).toHaveClass('expanding');

        act(() => {
            body.dispatchEvent(new Event('transitionend', {bubbles: true}));
        });

        expect(body).not.toHaveClass('expanding');
    });
});
