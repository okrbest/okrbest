// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {render} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import SearchChannelSuggestion from './search_channel_suggestion';

describe('components/suggestion/search_channel_suggestion', () => {
    const baseProps = {
        id: 'test-suggestion',
        item: TestHelper.getChannelMock(),
        isSelection: false,
        currentUserId: 'userid1',
        teammateIsBot: false,
        term: '',
        matchedPretext: '',
        onClick: jest.fn(),
        onMouseMove: jest.fn(),
    };

    test('should render globe icon for open channel', () => {
        const mockChannel = TestHelper.getChannelMock({type: 'O'});
        const props = {...baseProps, item: mockChannel};
        const {container} = render(
            <SearchChannelSuggestion {...props}/>,
        );

        const icon = container.querySelector('i');
        expect(icon).toHaveClass('icon', 'icon-globe');
    });
});
