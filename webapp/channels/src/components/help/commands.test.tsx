// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import HelpCommands from './commands';

describe('components/help/HelpCommands', () => {
    it('should render the built-in command list', () => {
        renderWithContext(<HelpCommands/>);

        expect(screen.getByText('Executing Commands')).toBeInTheDocument();
        expect(screen.getByText('Built-In Commands')).toBeInTheDocument();
        expect(screen.getByText('away')).toBeInTheDocument();
        expect(screen.getByText('code')).toBeInTheDocument();
        expect(screen.getByText('collapse')).toBeInTheDocument();
        expect(screen.getByText('dnd')).toBeInTheDocument();
    });

    it('should not contain any Mattermost product name mentions', () => {
        const {container} = renderWithContext(<HelpCommands/>);

        expect(container.textContent).not.toMatch(/Mattermost/);
    });
});
