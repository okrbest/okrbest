// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen, waitFor} from '@testing-library/react';
import React from 'react';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';

import {Client4} from 'mattermost-redux/client';

import {renderWithContext} from 'tests/react_testing_utils';

import ProfilePopoverOrgRole from './profile_popover_org_role';

jest.mock('mattermost-redux/client');

const mockedClient4 = jest.mocked(Client4);

describe('components/ProfilePopoverOrgRole', () => {
    const mockStore = configureStore();

    const teamId = 'team_id';
    const userId = 'user_id';

    const baseState = {
        entities: {
            teams: {
                membersInTeam: {
                    [teamId]: {
                        [userId]: {team_id: teamId, user_id: userId},
                    },
                },
            },
        },
    };

    beforeEach(() => {
        mockedClient4.getUserOrgProfileSummary = jest.fn();
    });

    test('renders department and position combined when both are assigned', async () => {
        mockedClient4.getUserOrgProfileSummary.mockResolvedValue({
            team_id: teamId,
            user_id: userId,
            division_name: null,
            department_name: '개발팀',
            position_name: '팀장',
        });

        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        expect(await screen.findByText('개발팀 · 팀장')).toBeInTheDocument();
    });

    test('renders a position-unassigned label when only the department is assigned', async () => {
        mockedClient4.getUserOrgProfileSummary.mockResolvedValue({
            team_id: teamId,
            user_id: userId,
            division_name: null,
            department_name: '개발팀',
            position_name: null,
        });

        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        expect(await screen.findByText('개발팀 · 직위 미지정')).toBeInTheDocument();
    });

    test('renders both-unassigned labels when neither is assigned', async () => {
        mockedClient4.getUserOrgProfileSummary.mockResolvedValue({
            team_id: teamId,
            user_id: userId,
            division_name: null,
            department_name: null,
            position_name: null,
        });

        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        expect(await screen.findByText('부서 미지정 · 직위 미지정')).toBeInTheDocument();
    });

    test('renders "division > department" when the department belongs to a division', async () => {
        mockedClient4.getUserOrgProfileSummary.mockResolvedValue({
            team_id: teamId,
            user_id: userId,
            division_name: '경영지원본부',
            department_name: '재무팀',
            position_name: '팀장',
        });

        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        expect(await screen.findByText('경영지원본부 > 재무팀 · 팀장')).toBeInTheDocument();
    });

    test('renders only the division name for a direct division assignment', async () => {
        mockedClient4.getUserOrgProfileSummary.mockResolvedValue({
            team_id: teamId,
            user_id: userId,
            division_name: '경영지원본부',
            department_name: null,
            position_name: null,
        });

        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        expect(await screen.findByText('경영지원본부 · 직위 미지정')).toBeInTheDocument();
    });

    test('renders nothing when the API errors (e.g. feature disabled)', async () => {
        mockedClient4.getUserOrgProfileSummary.mockRejectedValue(new Error('feature disabled'));

        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        await waitFor(() => expect(mockedClient4.getUserOrgProfileSummary).toHaveBeenCalled());
        expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    test('renders nothing for bot accounts and does not call the API', () => {
        const store = mockStore(baseState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                    isBot={true}
                />
            </Provider>,
        );

        expect(mockedClient4.getUserOrgProfileSummary).not.toHaveBeenCalled();
        expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    test('renders nothing and does not call the API when the target is not a member of the current team', () => {
        const noMembershipState = {
            entities: {
                teams: {
                    membersInTeam: {
                        [teamId]: {},
                    },
                },
            },
        };
        const store = mockStore(noMembershipState);
        renderWithContext(
            <Provider store={store}>
                <ProfilePopoverOrgRole
                    teamId={teamId}
                    userId={userId}
                />
            </Provider>,
        );

        expect(mockedClient4.getUserOrgProfileSummary).not.toHaveBeenCalled();
        expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });
});
