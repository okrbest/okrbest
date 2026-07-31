// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import HelpMessaging from './messaging';

describe('components/help/HelpMessaging', () => {
    it('should render the messaging basics landing page', () => {
        renderWithContext(<HelpMessaging/>);

        expect(screen.getByText('Messaging Basics')).toBeInTheDocument();
        expect(screen.getByText('Write Messages')).toBeInTheDocument();
        expect(screen.getByText('Attach Files')).toBeInTheDocument();
    });

    it('should not contain any Mattermost product name mentions', () => {
        const {container} = renderWithContext(<HelpMessaging/>);

        expect(container.textContent).not.toMatch(/Mattermost/);
    });
});
