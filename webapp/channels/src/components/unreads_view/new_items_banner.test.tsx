// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

import NewItemsBanner from './new_items_banner';

describe('components/unreads_view/new_items_banner', () => {
    test('새 항목 수를 알리고, 누르면 갱신을 요청한다 (FR-013)', async () => {
        const onRefresh = jest.fn();

        renderWithContext(
            <NewItemsBanner
                count={2}
                onRefresh={onRefresh}
            />,
        );

        expect(screen.getByText('2 new unread conversations')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: 'Show'}));

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    test('새 항목이 없으면 아무것도 그리지 않는다', () => {
        const {container} = renderWithContext(
            <NewItemsBanner
                count={0}
                onRefresh={jest.fn()}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
