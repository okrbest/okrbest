// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import HelpMentioning from './mentioning';

jest.mock('./avatar.svg', () => () => <div/>);

describe('components/help/HelpMentioning', () => {
    it('should render mentioning guidance', () => {
        renderWithContext(<HelpMentioning/>);

        expect(screen.getByText('Mentioning Teammates')).toBeInTheDocument();
        expect(screen.getByText('@Mentions')).toBeInTheDocument();
        expect(screen.getByText('Keywords That Trigger Mentions')).toBeInTheDocument();
    });

    it('should not contain any Mattermost product name mentions', () => {
        const {container} = renderWithContext(<HelpMentioning/>);

        expect(container.textContent).not.toMatch(/Mattermost/);
    });
});
