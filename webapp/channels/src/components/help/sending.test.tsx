// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import HelpSending from './sending';

describe('components/help/HelpSending', () => {
    it('should render message sending guidance', () => {
        renderWithContext(<HelpSending/>);

        expect(screen.getByText('Sending Messages')).toBeInTheDocument();
        expect(screen.getByText('Post a Message')).toBeInTheDocument();
        expect(screen.getByText('Edit a Message')).toBeInTheDocument();
        expect(screen.getByText('Delete a Message')).toBeInTheDocument();
    });

    it('should not contain any Mattermost product name mentions', () => {
        const {container} = renderWithContext(<HelpSending/>);

        expect(container.textContent).not.toMatch(/Mattermost/);
    });
});
