// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

import SearchableSyncJobChannelList from './searchable_sync_job_channel_list';

describe('SearchableSyncJobChannelList empty state', () => {
    const baseProps = {
        channels: [],
        teams: {},
        channelsPerPage: 10,
        nextPage: jest.fn(),
        isSearch: false,
        search: jest.fn(),
        noResultsText: <span>{'Try a different search term'}</span>,
        syncResults: {},
    };

    test('shows the neutral no-changes message when there is no search term', () => {
        renderWithContext(<SearchableSyncJobChannelList {...baseProps}/>);

        expect(screen.getByText('No channels were affected by this job.')).toBeInTheDocument();

        // The search-specific hint only belongs to the search empty state.
        expect(screen.queryByText('Try a different search term')).not.toBeInTheDocument();
    });

    test('labels the neutral empty state for assistive technology', () => {
        renderWithContext(<SearchableSyncJobChannelList {...baseProps}/>);

        expect(screen.getByLabelText('No channels were affected by this job.')).toBeInTheDocument();
        expect(screen.getByText('0 Results')).toBeInTheDocument();
    });

    test('switches to the search empty state once a term is typed', async () => {
        renderWithContext(<SearchableSyncJobChannelList {...baseProps}/>);

        await userEvent.type(screen.getByLabelText('Search Channels'), 'foo');

        expect(screen.getByText('No results for foo')).toBeInTheDocument();
        expect(screen.getByText('Try a different search term')).toBeInTheDocument();
        expect(screen.queryByText('No channels were affected by this job.')).not.toBeInTheDocument();
    });

    test('reverts to the neutral message when the search term is cleared', async () => {
        renderWithContext(<SearchableSyncJobChannelList {...baseProps}/>);

        const searchBox = screen.getByLabelText('Search Channels');
        await userEvent.type(searchBox, 'foo');
        await userEvent.clear(searchBox);

        expect(screen.getByText('No channels were affected by this job.')).toBeInTheDocument();
        expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
    });
});
