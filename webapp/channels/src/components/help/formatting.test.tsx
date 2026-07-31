// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import HelpFormatting from './formatting';

describe('components/help/HelpFormatting', () => {
    it('should render formatting examples', () => {
        renderWithContext(<HelpFormatting/>);

        expect(screen.getByText('Formatting Messages Using Markdown')).toBeInTheDocument();
        expect(screen.getByText('Text Style')).toBeInTheDocument();
        expect(screen.getByText('Tables')).toBeInTheDocument();
    });

    it('should not contain any Mattermost product name mentions', () => {
        const {container} = renderWithContext(<HelpFormatting/>);

        expect(container.textContent).not.toMatch(/Mattermost/);
    });
});
