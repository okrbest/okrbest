// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import AtMentionSuggestion from './at_mention_suggestion';
import type {Item} from './at_mention_suggestion';

jest.mock('components/custom_status/custom_status_emoji', () => () => <div/>);

describe('at mention suggestion', () => {
    const userid1 = {
        id: 'userid1',
        username: 'user',
        first_name: 'a',
        last_name: 'b',
        nickname: 'c',
        isCurrentUser: true,
    } as Item;

    const userid2 = {
        id: 'userid2',
        username: 'user2',
        first_name: 'a',
        last_name: 'b',
        nickname: 'c',
    } as Item;

    const baseProps = {
        id: 'test-suggestion-1',
        matchedPretext: '@',
        term: '@user',
        isSelection: false,
        onClick: jest.fn(),
        onMouseMove: jest.fn(),
    };

    // okrbest는 항목 라벨에 teammateNameDisplay 기준 표시 이름을 쓰고(c60016e9),
    // upstream의 '전체 이름 (닉네임)' 부가 설명은 렌더하지 않는다.
    test('shows the signed in user by display name with a "you" marker and no full-name description', () => {
        const {container} = renderWithContext(
            <AtMentionSuggestion
                {...baseProps}
                item={userid1}
            />,
        );

        expect(container).toMatchSnapshot();

        const ellipsis = container.querySelector('.suggestion-list__ellipsis');
        expect(ellipsis?.textContent).toContain('@c');
        expect(ellipsis?.textContent).toContain('(you)');
        expect(ellipsis?.textContent).not.toContain('a b');
    });

    test('shows a non signed in user by display name with no full-name description', () => {
        const {container} = renderWithContext(
            <AtMentionSuggestion
                {...baseProps}
                item={userid2}
            />,
        );

        expect(container).toMatchSnapshot();

        const ellipsis = container.querySelector('.suggestion-list__ellipsis');
        expect(ellipsis?.textContent).toBe('@c');
        expect(ellipsis?.textContent).not.toContain('a b');
    });

    describe('accessible text', () => {
        const testCases = [
            {
                name: 'at-mention suggestions should be labeled with the user\'s display name',
                term: '@test-user',
                item: {...TestHelper.getUserMock({username: 'test-user', first_name: 'First', last_name: 'Last', nickname: 'Nickname'})},
                expectedLabel: '@Nickname',
                expectedDescription: '',
            },
            {
                name: 'at-mention suggestions should include status in the description',
                term: '@test-user',
                item: {...TestHelper.getUserMock({username: 'test-user', first_name: 'First', last_name: 'Last'}), status: 'online'},
                expectedLabel: '@First Last',
                expectedDescription: 'Online',
            },
            {
                name: 'at-mention suggestions should include if the user is the current user',
                term: '@test-user',
                item: {...TestHelper.getUserMock({username: 'test-user', first_name: 'First', last_name: 'Last'}), isCurrentUser: true},
                expectedLabel: '@First Last',
                expectedDescription: '(you)',
            },
            {
                name: 'at-mention suggestions should include if the user is a bot',
                term: '@test-user',
                item: {...TestHelper.getUserMock({username: 'test-user', first_name: '', last_name: '', nickname: 'Nickname', is_bot: true})},
                expectedLabel: '@Nickname',
                expectedDescription: 'BOT',
            },
            {
                name: 'at-mention suggestions should include if the user is a remote user',
                term: '@test-user:remote',
                item: {...TestHelper.getUserMock({username: 'test-user:remote', first_name: '', last_name: '', remote_id: 'remote1'})},
                expectedLabel: '@test-user:remote',
                expectedDescription: 'shared user',
            },
            {
                name: 'group suggestions should be labeled with the group slug and described with the group name',
                term: '@test-group',
                item: TestHelper.getGroupMock({name: 'test-group', display_name: 'Test Group', member_count: 5}),
                expectedLabel: '@test-group',
                expectedDescription: '- Test Group 5 members',
            },
            {
                name: 'special mention suggestions should be labeled with the at-mention and described properly',
                term: '@channel',
                item: {username: 'channel'},
                expectedLabel: '@channel',
                expectedDescription: 'Notifies everyone in this channel',
            },
        ];

        for (const testCase of testCases) {
            test(testCase.name, () => {
                renderWithContext(
                    <AtMentionSuggestion
                        {...baseProps}
                        term={testCase.term}
                        item={testCase.item as Item}
                    />,
                );

                const suggestion = document.getElementById(baseProps.id);
                expect(suggestion).toBe(screen.getByLabelText(testCase.expectedLabel));
                expect(suggestion).toHaveAccessibleName(testCase.expectedLabel);
                expect(suggestion).toHaveAccessibleDescription(testCase.expectedDescription);
            });
        }
    });
});
