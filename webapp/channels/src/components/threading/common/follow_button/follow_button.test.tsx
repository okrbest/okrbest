// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

import FollowButton from './follow_button';

describe('components/threading/common/follow_button', () => {
    test('should say follow', async () => {
        const clickHandler = jest.fn();

        renderWithContext(
            <FollowButton
                isFollowing={false}
                onClick={clickHandler}
            />,
        );

        expect(screen.getByText('Follow')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button'));
        expect(clickHandler).toHaveBeenCalled();
    });

    test('should say following', () => {
        renderWithContext(
            <FollowButton
                isFollowing={true}
            />,
        );

        expect(screen.getByText('Following')).toBeInTheDocument();
    });

    test('should fire click handler', async () => {
        const clickHandler = jest.fn();

        renderWithContext(
            <FollowButton
                isFollowing={false}
                onClick={clickHandler}
            />,
        );

        await userEvent.click(screen.getByRole('button'));
        expect(clickHandler).toHaveBeenCalled();
    });
});
