// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import HelpAttaching from './attaching';

describe('components/help/HelpAttaching', () => {
    it('should render file attachment guidance', () => {
        renderWithContext(<HelpAttaching/>);

        expect(screen.getByText('Attaching Files')).toBeInTheDocument();
        expect(screen.getByText('Attachment Methods')).toBeInTheDocument();
        expect(screen.getByText('File Previewer')).toBeInTheDocument();
    });

    it('should not contain any Mattermost product name mentions', () => {
        const {container} = renderWithContext(<HelpAttaching/>);

        expect(container.textContent).not.toMatch(/Mattermost/);
    });
});
