// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fireEvent, renderWithContext, screen, userEvent, waitFor, within} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import OrgRoleManagement from './org_role_management';

describe('components/admin_console/org_role_management', () => {
    const originalFetch = global.fetch;
    const team = TestHelper.getTeamMock({
        id: 'teamid12345678901234567890',
        display_name: 'Test Team',
        name: 'test-team',
    });
    const team2 = TestHelper.getTeamMock({
        id: 'teamid29999999999999999999',
        display_name: 'Second Team',
        name: 'second-team',
    });
    const user = TestHelper.getUserMock({
        id: 'userid12345678901234567890',
        username: 'test_user',
        email: 'test@example.com',
        first_name: 'User',
        last_name: 'One',
    });
    const secondUser = TestHelper.getUserMock({
        id: 'userid22345678901234567890',
        username: 'blue_sky',
        email: 'blue@example.com',
        nickname: '푸른하늘',
    });
    const position = {
        id: 'positionid1234567890123456ab',
        team_id: team.id,
        code: 'developer',
        name: '개발자',
        rank: 1,
        active: true,
        full_visibility: false,
    };
    const secondPosition = {
        ...position,
        id: 'positionid5555555555555555cd',
        code: 'manager',
        name: '매니저',
    };
    const inactivePosition = {
        ...position,
        id: 'positionid9999999999999999zz',
        code: 'archived-position',
        name: '비활성 직위',
        active: false,
    };
    const department = {
        id: 'departmentid1234567890123ab',
        team_id: team.id,
        code: 'rnd',
        name: 'R&D',
        type: 'department',
        parent_id: '',
        active: true,
    };
    const inactiveDepartment = {
        ...department,
        id: 'departmentid9999999999999zz',
        code: 'archived-dept',
        name: '비활성 부서',
        active: false,
    };

    const buildResponse = (data: unknown, ok = true): Response => {
        return {
            ok,
            statusText: ok ? 'OK' : 'Bad Request',
            text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
            json: () => Promise.resolve(typeof data === 'string' ? JSON.parse(data) : data),
        } as Response;
    };

    const emptyProfile = (forUser: {id: string}) => ({
        team_id: team.id,
        user_id: forUser.id,
        primary_position_id: '',
        primary_org_unit_id: '',
        extra_positions: [],
        effective_from: 0,
        effective_to: 0,
        create_at: 0,
        update_at: 0,
    });

    const defaultFetchMock = () => {
        return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes(`/positions/${position.id}`) && method === 'PUT') {
                return Promise.resolve(buildResponse({}));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes(`/org-units/${department.id}`) && method === 'PUT') {
                return Promise.resolve(buildResponse({}));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile') && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse({
                    ...body,
                    team_id: team.id,
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            return Promise.resolve(buildResponse({}));
        });
    };

    beforeEach(() => {
        global.fetch = defaultFetchMock() as typeof fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.useRealTimers();
    });

    const getUserRow = (text: string) => screen.getByText(text).closest('tr') as HTMLTableRowElement;

    const renderAndWaitForBody = async () => {
        renderWithContext(<OrgRoleManagement/>);
        await waitFor(() => {
            expect(screen.getByText('사용자 리스트')).toBeInTheDocument();
        });
    };

    const twoUserFetchMock = (profiles: unknown[] = []) => {
        return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position, secondPosition]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user, secondUser]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse(profiles));
            }

            if (url.includes('/org-profile') && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse({
                    ...body,
                    team_id: team.id,
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            return Promise.resolve(buildResponse({}));
        });
    };

    test('renders management header', async () => {
        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('조직/직위 배정')).toBeInTheDocument();
            expect(screen.getByText('사용자 리스트')).toBeInTheDocument();
        });
    });

    test('does not crash when org role APIs return null', async () => {
        global.fetch = jest.fn((input: RequestInfo | URL) => {
            const url = String(input);

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions') || url.includes('/org-units') || url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse(null));
            }

            return Promise.resolve(buildResponse({}));
        }) as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('조직/직위 배정')).toBeInTheDocument();
            expect(screen.getByText('필터 조건에 해당하는 사용자가 없습니다.')).toBeInTheDocument();
        });
    });

    test('filters position list by keyword', async () => {
        await renderAndWaitForBody();

        const positionTable = screen.getAllByRole('table')[2];
        await waitFor(() => {
            expect(within(positionTable).queryByText('검색 조건에 해당하는 직위가 없습니다.')).not.toBeInTheDocument();
        });
        expect(within(positionTable).getByText('개발자')).toBeInTheDocument();

        await userEvent.type(screen.getByPlaceholderText('직위 검색 (이름)'), 'unknown');

        await waitFor(() => {
            expect(screen.getByText('검색 조건에 해당하는 직위가 없습니다.')).toBeInTheDocument();
        });
    });

    test('updates position with edited values', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            if (url.includes(`/positions/${position.id}`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse(body));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        const positionTable = screen.getAllByRole('table')[2];
        await waitFor(() => {
            expect(within(positionTable).queryByText('검색 조건에 해당하는 직위가 없습니다.')).not.toBeInTheDocument();
        });

        await userEvent.click(within(positionTable).getByRole('button', {name: '수정'}));
        const nameInput = within(positionTable).getByDisplayValue('개발자');
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, '시니어 개발자');
        await userEvent.click(within(positionTable).getByRole('button', {name: '저장'}));

        await waitFor(() => {
            const updateCalls = fetchMock.mock.calls.filter(([input, init]) => {
                return String(input).includes(`/positions/${position.id}`) && init?.method === 'PUT';
            });
            expect(updateCalls).toHaveLength(1);
            const payload = JSON.parse(String(updateCalls[0][1]?.body || '{}'));
            expect(payload.name).toBe('시니어 개발자');
            expect(payload.active).toBe(true);
        });
    });

    test('creates position and department without code field in payload', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            if (url.endsWith(`/api/v4/teams/${team.id}/positions`) && method === 'POST') {
                return Promise.resolve(buildResponse({
                    ...position,
                    ...(JSON.parse((init?.body as string) || '{}')),
                }));
            }

            if (url.endsWith(`/api/v4/teams/${team.id}/org-units`) && method === 'POST') {
                return Promise.resolve(buildResponse({
                    ...department,
                    ...(JSON.parse((init?.body as string) || '{}')),
                }));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        expect(screen.queryByPlaceholderText('직위 코드 (예: team_lead)')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('부서 코드 (예: rnd)')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: '직위 추가'}));
        await userEvent.type(screen.getByPlaceholderText('직위명'), '리드 개발자');
        await userEvent.clear(screen.getByPlaceholderText('정렬 순서(rank)'));
        await userEvent.type(screen.getByPlaceholderText('정렬 순서(rank)'), '5');
        await userEvent.click(screen.getByRole('button', {name: '직위 저장'}));
        await waitFor(() => {
            expect(screen.getByText('저장되었습니다')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', {name: '부서 추가'}));
        await userEvent.type(screen.getByPlaceholderText('부서명'), '플랫폼실');
        await userEvent.click(screen.getByRole('button', {name: '부서 저장'}));
        await waitFor(() => {
            expect(screen.getByText('저장되었습니다')).toBeInTheDocument();
        });

        await waitFor(() => {
            const positionCreateCalls = fetchMock.mock.calls.filter(([input, init]) => {
                return String(input).endsWith(`/api/v4/teams/${team.id}/positions`) && init?.method === 'POST';
            });
            expect(positionCreateCalls).toHaveLength(1);
            const positionPayload = JSON.parse(String(positionCreateCalls[0][1]?.body || '{}'));
            expect(positionPayload.name).toBe('리드 개발자');
            expect(positionPayload.rank).toBe(5);
            expect(positionPayload).not.toHaveProperty('code');

            const departmentCreateCalls = fetchMock.mock.calls.filter(([input, init]) => {
                return String(input).endsWith(`/api/v4/teams/${team.id}/org-units`) && init?.method === 'POST';
            });
            expect(departmentCreateCalls).toHaveLength(1);
            const departmentPayload = JSON.parse(String(departmentCreateCalls[0][1]?.body || '{}'));
            expect(departmentPayload.name).toBe('플랫폼실');
            expect(departmentPayload.type).toBe('department');
            expect(departmentPayload.parent_id).toBe('');
            expect(departmentPayload).not.toHaveProperty('code');
        });
    });

    test('shows only one add form at a time', async () => {
        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('조직/직위 배정')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', {name: '부서 추가'}));
        expect(screen.getByPlaceholderText('부서명')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('직위명')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: '직위 추가'}));
        expect(screen.getByPlaceholderText('직위명')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('부서명')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: '직위 추가'}));
        expect(screen.queryByPlaceholderText('직위명')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('부서명')).not.toBeInTheDocument();
    });

    test('auto hides success message and keeps a single success alert', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            if (url.endsWith(`/api/v4/teams/${team.id}/positions`) && method === 'POST') {
                return Promise.resolve(buildResponse({
                    ...position,
                    ...(JSON.parse((init?.body as string) || '{}')),
                }));
            }

            if (url.endsWith(`/api/v4/teams/${team.id}/org-units`) && method === 'POST') {
                return Promise.resolve(buildResponse({
                    ...department,
                    ...(JSON.parse((init?.body as string) || '{}')),
                }));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('조직/직위 배정')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', {name: '직위 추가'}));
        fireEvent.change(screen.getByPlaceholderText('직위명'), {target: {value: '리드 개발자'}});
        fireEvent.change(screen.getByPlaceholderText('정렬 순서(rank)'), {target: {value: '5'}});
        fireEvent.click(screen.getByRole('button', {name: '직위 저장'}));

        await waitFor(() => {
            expect(screen.getByText('저장되었습니다')).toBeInTheDocument();
        });
        expect(screen.queryAllByText('저장되었습니다')).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', {name: '부서 추가'}));
        fireEvent.change(screen.getByPlaceholderText('부서명'), {target: {value: '플랫폼실'}});
        fireEvent.click(screen.getByRole('button', {name: '부서 저장'}));

        await waitFor(() => {
            expect(screen.getByText('저장되었습니다')).toBeInTheDocument();
        });
        expect(screen.queryAllByText('저장되었습니다')).toHaveLength(1);

        await new Promise((resolve) => setTimeout(resolve, 2700));
        expect(screen.queryByText('저장되었습니다')).not.toBeInTheDocument();
    });

    test('deletes department only after confirmation', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            if (url.includes(`/org-units/${department.id}`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse(body));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        const departmentTable = screen.getAllByRole('table')[1];
        await waitFor(() => {
            expect(within(departmentTable).queryByText('검색 조건에 해당하는 부서가 없습니다.')).not.toBeInTheDocument();
        });
        expect(within(departmentTable).getByText('R&D')).toBeInTheDocument();
        await userEvent.click(within(departmentTable).getByRole('button', {name: '삭제'}));

        const modal = await screen.findByTestId('org-role-delete-confirm-modal');
        expect(within(modal).getByText("'R&D' 항목을 삭제하시겠습니까?")).toBeInTheDocument();

        const beforeConfirmCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes(`/org-units/${department.id}`) && init?.method === 'PUT';
        });
        expect(beforeConfirmCalls).toHaveLength(0);

        await userEvent.click(within(modal).getByRole('button', {name: '삭제'}));

        await waitFor(() => {
            const updateCalls = fetchMock.mock.calls.filter(([input, init]) => {
                return String(input).includes(`/org-units/${department.id}`) && init?.method === 'PUT';
            });
            expect(updateCalls).toHaveLength(1);
            const payload = JSON.parse(String(updateCalls[0][1]?.body || '{}'));
            expect(payload.active).toBe(false);
            expect(payload.code).toBe('rnd');
            expect(payload.name).toBe('R&D');
        });
    });

    test('does not delete department when confirmation is cancelled', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            if (url.includes(`/org-units/${department.id}`) && method === 'PUT') {
                return Promise.resolve(buildResponse({}));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        const departmentTable = screen.getAllByRole('table')[1];
        await waitFor(() => {
            expect(within(departmentTable).queryByText('검색 조건에 해당하는 부서가 없습니다.')).not.toBeInTheDocument();
        });

        await userEvent.click(within(departmentTable).getByRole('button', {name: '삭제'}));
        const modal = await screen.findByTestId('org-role-delete-confirm-modal');
        await userEvent.click(within(modal).getByRole('button', {name: '취소'}));

        await waitFor(() => {
            expect(screen.queryByTestId('org-role-delete-confirm-modal')).not.toBeInTheDocument();
        });

        const updateCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes(`/org-units/${department.id}`) && init?.method === 'PUT';
        });
        expect(updateCalls).toHaveLength(0);
    });

    test('deletes position only after confirmation', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            if (url.includes(`/positions/${position.id}`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse(body));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        const positionTable = screen.getAllByRole('table')[2];
        await waitFor(() => {
            expect(within(positionTable).queryByText('검색 조건에 해당하는 직위가 없습니다.')).not.toBeInTheDocument();
        });

        await userEvent.click(within(positionTable).getByRole('button', {name: '삭제'}));
        const modal = await screen.findByTestId('org-role-delete-confirm-modal');
        expect(within(modal).getByText("'개발자' 항목을 삭제하시겠습니까?")).toBeInTheDocument();

        await userEvent.click(within(modal).getByRole('button', {name: '삭제'}));

        await waitFor(() => {
            const updateCalls = fetchMock.mock.calls.filter(([input, init]) => {
                return String(input).includes(`/positions/${position.id}`) && init?.method === 'PUT';
            });
            expect(updateCalls).toHaveLength(1);
            const payload = JSON.parse(String(updateCalls[0][1]?.body || '{}'));
            expect(payload.active).toBe(false);
            expect(payload.code).toBe('developer');
            expect(payload.name).toBe('개발자');
        });
    });

    test('hides inactive position and department items from list', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL) => {
            const url = String(input);

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position, inactivePosition]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department, inactiveDepartment]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        const positionTable = screen.getAllByRole('table')[2];
        const departmentTable = screen.getAllByRole('table')[1];
        await waitFor(() => {
            expect(within(positionTable).queryByText('검색 조건에 해당하는 직위가 없습니다.')).not.toBeInTheDocument();
            expect(within(departmentTable).queryByText('검색 조건에 해당하는 부서가 없습니다.')).not.toBeInTheDocument();
        });

        expect(within(positionTable).getByText('개발자')).toBeInTheDocument();
        expect(within(positionTable).queryByText(position.code)).not.toBeInTheDocument();
        expect(within(positionTable).queryByText(inactivePosition.code)).not.toBeInTheDocument();
        expect(within(positionTable).queryByText('비활성')).not.toBeInTheDocument();

        expect(within(departmentTable).getByText('R&D')).toBeInTheDocument();
        expect(within(departmentTable).queryByText(department.code)).not.toBeInTheDocument();
        expect(within(departmentTable).queryByText(inactiveDepartment.code)).not.toBeInTheDocument();
        expect(within(departmentTable).queryByText('비활성')).not.toBeInTheDocument();
    });

    test('filters users by display name and username', async () => {
        global.fetch = jest.fn((input: RequestInfo | URL) => {
            const url = String(input);

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user, secondUser]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            return Promise.resolve(buildResponse({}));
        }) as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        const userSearchInput = screen.getByPlaceholderText('사용자 검색 (이름/username)');

        await userEvent.type(userSearchInput, '푸른');
        await waitFor(() => {
            expect(screen.queryByText('User One - test_user')).not.toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.clear(userSearchInput);
        await userEvent.type(userSearchInput, 'test_user');
        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.queryByText('푸른하늘 - blue_sky')).not.toBeInTheDocument();
        });
    });

    // --- User Story 1: bulk selection, bulk apply, single save-all ---

    test('T009: renders a checkbox per user row and toggles selection', async () => {
        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        const checkbox = within(getUserRow('User One - test_user')).getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
        await userEvent.click(checkbox);
        expect(checkbox).toBeChecked();
        await userEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    test('T010: bulk-applying only the department field leaves each user\'s existing position untouched, and fires no PUT yet', async () => {
        const fetchMock = twoUserFetchMock([
            {...emptyProfile(user), primary_position_id: position.id},
            {...emptyProfile(secondUser), primary_position_id: secondPosition.id},
        ]);
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.click(within(getUserRow('User One - test_user')).getByRole('checkbox'));
        await userEvent.click(within(getUserRow('푸른하늘 - blue_sky')).getByRole('checkbox'));

        await userEvent.selectOptions(screen.getByDisplayValue('부서 변경 안 함'), department.id);
        await userEvent.click(screen.getByRole('button', {name: '선택 적용'}));

        const userRow = getUserRow('User One - test_user');
        const secondUserRow = getUserRow('푸른하늘 - blue_sky');

        expect(within(userRow).getByDisplayValue('R&D')).toBeInTheDocument();
        expect(within(secondUserRow).getByDisplayValue('R&D')).toBeInTheDocument();
        expect(within(userRow).getByDisplayValue('개발자')).toBeInTheDocument();
        expect(within(secondUserRow).getByDisplayValue('매니저')).toBeInTheDocument();

        const putCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes('/org-profile') && init?.method === 'PUT';
        });
        expect(putCalls).toHaveLength(0);
    });

    test('T011: bulk-apply does not affect unselected users, and fires no PUT yet', async () => {
        const fetchMock = twoUserFetchMock();
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.click(within(getUserRow('User One - test_user')).getByRole('checkbox'));
        await userEvent.selectOptions(screen.getByDisplayValue('부서 변경 안 함'), department.id);
        await userEvent.click(screen.getByRole('button', {name: '선택 적용'}));

        const secondUserRow = getUserRow('푸른하늘 - blue_sky');
        expect(within(secondUserRow).getByDisplayValue('부서 미지정')).toBeInTheDocument();

        const putCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes('/org-profile') && init?.method === 'PUT';
        });
        expect(putCalls).toHaveLength(0);
    });

    test('T012: "선택 적용" is disabled unless a user is selected and a bulk field is set', async () => {
        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        const applyButton = screen.getByRole('button', {name: '선택 적용'});
        expect(applyButton).toBeDisabled();

        await userEvent.click(within(getUserRow('User One - test_user')).getByRole('checkbox'));
        expect(applyButton).toBeDisabled();

        await userEvent.selectOptions(screen.getByDisplayValue('부서 변경 안 함'), department.id);
        expect(applyButton).not.toBeDisabled();
    });

    test('T013: bulk toolbar has no "unassign" option, only a "no change" default', async () => {
        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue('부서 변경 안 함')).toBeInTheDocument();
        expect(screen.getByDisplayValue('직위 변경 안 함')).toBeInTheDocument();
    });

    test('T014: saving fires exactly one PUT per dirty user and skips untouched users', async () => {
        const thirdUser = TestHelper.getUserMock({
            id: 'userid33345678901234567890',
            username: 'third_user',
            email: 'third@example.com',
        });
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }
            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position, secondPosition]));
            }
            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }
            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user, secondUser, thirdUser]));
            }
            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes('/org-profile') && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse({...body, team_id: team.id, extra_positions: [], effective_from: 0, effective_to: 0, create_at: 0, update_at: 0}));
            }
            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
            expect(screen.getByText('third_user - third_user')).toBeInTheDocument();
        });

        await userEvent.selectOptions(within(getUserRow('User One - test_user')).getByDisplayValue('부서 미지정'), department.id);
        await userEvent.selectOptions(within(getUserRow('푸른하늘 - blue_sky')).getByDisplayValue('직위 미지정'), position.id);

        await userEvent.click(screen.getByRole('button', {name: '저장'}));

        await waitFor(() => {
            const putCalls = fetchMock.mock.calls.filter(([input, init]) => {
                return String(input).includes('/org-profile') && init?.method === 'PUT';
            });
            expect(putCalls).toHaveLength(2);
            const putUrls = putCalls.map(([input]) => String(input));
            expect(putUrls.some((u) => u.includes(`/users/${user.id}/org-profile`))).toBe(true);
            expect(putUrls.some((u) => u.includes(`/users/${secondUser.id}/org-profile`))).toBe(true);
            expect(putUrls.some((u) => u.includes(`/users/${thirdUser.id}/org-profile`))).toBe(false);
        });
    });

    test('T015: zero dirty users disables the save button', async () => {
        const fetchMock = twoUserFetchMock();
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        const saveButton = screen.getByRole('button', {name: '저장'});
        expect(saveButton).toBeDisabled();

        fireEvent.click(saveButton);

        const putCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes('/org-profile') && init?.method === 'PUT';
        });
        expect(putCalls).toHaveLength(0);
    });

    test('T016: the save button stays disabled while a save is in flight, preventing a duplicate PUT round', async () => {
        let resolvePut: (value: Response) => void = () => {};
        const putPromise = new Promise<Response>((resolve) => {
            resolvePut = resolve;
        });

        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }
            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }
            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }
            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }
            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes('/org-profile') && method === 'PUT') {
                return putPromise;
            }
            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        await userEvent.selectOptions(screen.getByDisplayValue('부서 미지정'), department.id);

        const saveButton = screen.getByRole('button', {name: '저장'});
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByRole('button', {name: '저장 중...'})).toBeDisabled();
        });

        fireEvent.click(screen.getByRole('button', {name: '저장 중...'}));

        resolvePut(buildResponse({
            team_id: team.id,
            user_id: user.id,
            primary_position_id: '',
            primary_org_unit_id: department.id,
            extra_positions: [],
            effective_from: 0,
            effective_to: 0,
            create_at: 0,
            update_at: 0,
        }));

        await waitFor(() => {
            // The button label reverts once the in-flight save settles. It is correctly
            // disabled again here because the saved user is no longer dirty - not because
            // a save is still in flight.
            expect(screen.getByRole('button', {name: '저장'})).toBeInTheDocument();
        });

        const putCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes('/org-profile') && init?.method === 'PUT';
        });
        expect(putCalls).toHaveLength(1);
    });

    test('T017: saving a single dirtied user fires exactly one PUT and shows a success summary that auto-hides', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }
            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }
            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }
            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }
            if (url.includes('/org-profile') && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse({...body, team_id: team.id, user_id: user.id, extra_positions: [], effective_from: 0, effective_to: 0, create_at: 0, update_at: 0}));
            }
            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse(emptyProfile(user)));
            }
            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        await userEvent.selectOptions(screen.getByDisplayValue('부서 미지정'), department.id);
        await userEvent.selectOptions(screen.getByDisplayValue('직위 미지정'), position.id);
        await userEvent.click(screen.getByRole('button', {name: '저장'}));

        await waitFor(() => {
            expect(screen.getByText('1명 저장되었습니다')).toBeInTheDocument();
        });

        const updateCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes(`/api/v4/teams/${team.id}/users/${user.id}/org-profile`) && init?.method === 'PUT';
        });
        expect(updateCalls).toHaveLength(1);

        await new Promise((resolve) => setTimeout(resolve, 2700));
        expect(screen.queryByText('1명 저장되었습니다')).not.toBeInTheDocument();
    });

    test('T018: a team switch mid-save discards the stale response instead of applying it to the new team\'s view', async () => {
        let resolvePut: (value: Response) => void = () => {};
        const putPromise = new Promise<Response>((resolve) => {
            resolvePut = resolve;
        });

        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team, team2]));
            }
            if (url.includes(`/teams/${team.id}/positions?include_inactive=true`)) {
                return Promise.resolve(buildResponse([position]));
            }
            if (url.includes(`/teams/${team.id}/org-units?include_inactive=true`)) {
                return Promise.resolve(buildResponse([department]));
            }
            if (url.includes(`/api/v4/users?in_team=${team.id}`)) {
                return Promise.resolve(buildResponse([user]));
            }
            if (url.includes(`/teams/${team.id}/org-profiles`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/teams/${team.id}/users/${user.id}/org-profile`) && method === 'PUT') {
                return putPromise;
            }

            if (url.includes(`/teams/${team2.id}/positions?include_inactive=true`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/teams/${team2.id}/org-units?include_inactive=true`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/api/v4/users?in_team=${team2.id}`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/teams/${team2.id}/org-profiles`)) {
                return Promise.resolve(buildResponse([]));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        await userEvent.selectOptions(screen.getByDisplayValue('부서 미지정'), department.id);
        await userEvent.click(screen.getByRole('button', {name: '저장'}));

        await waitFor(() => {
            expect(screen.getByRole('button', {name: '저장 중...'})).toBeInTheDocument();
        });

        await userEvent.selectOptions(screen.getByLabelText('팀'), team2.id);

        await waitFor(() => {
            expect(screen.getByText('필터 조건에 해당하는 사용자가 없습니다.')).toBeInTheDocument();
        });

        resolvePut(buildResponse({
            team_id: team.id,
            user_id: user.id,
            primary_position_id: '',
            primary_org_unit_id: department.id,
            extra_positions: [],
            effective_from: 0,
            effective_to: 0,
            create_at: 0,
            update_at: 0,
        }));

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(screen.queryByText('1명 저장되었습니다')).not.toBeInTheDocument();
        expect(screen.queryByText(/명 실패/)).not.toBeInTheDocument();
    });

    test('T019: switching teams resets selection and the bulk-apply toolbar', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL) => {
            const url = String(input);

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team, team2]));
            }
            if (url.includes(`/teams/${team.id}/positions?include_inactive=true`)) {
                return Promise.resolve(buildResponse([position]));
            }
            if (url.includes(`/teams/${team.id}/org-units?include_inactive=true`)) {
                return Promise.resolve(buildResponse([department]));
            }
            if (url.includes(`/api/v4/users?in_team=${team.id}`)) {
                return Promise.resolve(buildResponse([user]));
            }
            if (url.includes(`/teams/${team.id}/org-profiles`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/teams/${team2.id}/positions?include_inactive=true`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/teams/${team2.id}/org-units?include_inactive=true`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/api/v4/users?in_team=${team2.id}`)) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/teams/${team2.id}/org-profiles`)) {
                return Promise.resolve(buildResponse([]));
            }
            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        await userEvent.click(within(getUserRow('User One - test_user')).getByRole('checkbox'));
        await userEvent.selectOptions(screen.getByDisplayValue('부서 변경 안 함'), department.id);

        expect(screen.getByText('선택된 사용자: 1명')).toBeInTheDocument();

        await userEvent.selectOptions(screen.getByLabelText('팀'), team2.id);

        await waitFor(() => {
            expect(screen.getByText('선택된 사용자: 0명')).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue('부서 변경 안 함')).toBeInTheDocument();
        expect(screen.getByDisplayValue('직위 변경 안 함')).toBeInTheDocument();
    });

    // --- User Story 2: select-all scoped to the current filter, selection persists across filter changes ---

    test('T026: header "select all" checkbox selects and deselects every row when no filter is active', async () => {
        const fetchMock = twoUserFetchMock();
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        const headerCheckbox = screen.getByRole('checkbox', {name: '전체 선택'});
        await userEvent.click(headerCheckbox);

        expect(within(getUserRow('User One - test_user')).getByRole('checkbox')).toBeChecked();
        expect(within(getUserRow('푸른하늘 - blue_sky')).getByRole('checkbox')).toBeChecked();

        await userEvent.click(headerCheckbox);

        expect(within(getUserRow('User One - test_user')).getByRole('checkbox')).not.toBeChecked();
        expect(within(getUserRow('푸른하늘 - blue_sky')).getByRole('checkbox')).not.toBeChecked();
    });

    test('T027: header "select all" only selects the users currently visible under a search filter', async () => {
        const fetchMock = twoUserFetchMock();
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.type(screen.getByPlaceholderText('사용자 검색 (이름/username)'), 'test_user');
        await waitFor(() => {
            expect(screen.queryByText('푸른하늘 - blue_sky')).not.toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('checkbox', {name: '전체 선택'}));
        expect(within(getUserRow('User One - test_user')).getByRole('checkbox')).toBeChecked();

        await userEvent.clear(screen.getByPlaceholderText('사용자 검색 (이름/username)'));
        await waitFor(() => {
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });
        expect(within(getUserRow('푸른하늘 - blue_sky')).getByRole('checkbox')).not.toBeChecked();
    });

    test('T028: selection is preserved when a filter hides the selected user, and restored when the filter is cleared', async () => {
        const fetchMock = twoUserFetchMock();
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.click(within(getUserRow('푸른하늘 - blue_sky')).getByRole('checkbox'));

        await userEvent.type(screen.getByPlaceholderText('사용자 검색 (이름/username)'), 'test_user');
        await waitFor(() => {
            expect(screen.queryByText('푸른하늘 - blue_sky')).not.toBeInTheDocument();
        });

        await userEvent.clear(screen.getByPlaceholderText('사용자 검색 (이름/username)'));
        await waitFor(() => {
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });
        expect(within(getUserRow('푸른하늘 - blue_sky')).getByRole('checkbox')).toBeChecked();
    });

    // --- User Story 3: bulk save result summary (success/failure) ---

    test('T031: a partial failure shows a summary with both counts and does not auto-hide', async () => {
        const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }
            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }
            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([department]));
            }
            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user, secondUser]));
            }
            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }
            if (url.includes(`/users/${user.id}/org-profile`) && method === 'PUT') {
                return Promise.resolve(buildResponse({message: '저장 실패'}, false));
            }
            if (url.includes(`/users/${secondUser.id}/org-profile`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse({...body, team_id: team.id, extra_positions: [], effective_from: 0, effective_to: 0, create_at: 0, update_at: 0}));
            }
            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.selectOptions(within(getUserRow('User One - test_user')).getByDisplayValue('부서 미지정'), department.id);
        await userEvent.selectOptions(within(getUserRow('푸른하늘 - blue_sky')).getByDisplayValue('직위 미지정'), position.id);
        await userEvent.click(screen.getByRole('button', {name: '저장'}));

        await waitFor(() => {
            expect(screen.getByText('1명 저장 완료, 1명 실패')).toBeInTheDocument();
        });

        await new Promise((resolve) => setTimeout(resolve, 2700));
        expect(screen.getByText('1명 저장 완료, 1명 실패')).toBeInTheDocument();
    });

    test('T032: saving multiple dirty users that all succeed shows a success summary that auto-hides', async () => {
        const fetchMock = twoUserFetchMock();
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
            expect(screen.getByText('푸른하늘 - blue_sky')).toBeInTheDocument();
        });

        await userEvent.selectOptions(within(getUserRow('User One - test_user')).getByDisplayValue('부서 미지정'), department.id);
        await userEvent.selectOptions(within(getUserRow('푸른하늘 - blue_sky')).getByDisplayValue('직위 미지정'), position.id);
        await userEvent.click(screen.getByRole('button', {name: '저장'}));

        await waitFor(() => {
            expect(screen.getByText('2명 저장되었습니다')).toBeInTheDocument();
        });

        await new Promise((resolve) => setTimeout(resolve, 2700));
        expect(screen.queryByText('2명 저장되었습니다')).not.toBeInTheDocument();
    });

    // === 본부-부서 계층 (specs/003-org-division-hierarchy) ===

    const division = {
        id: 'divisionid123456789012345aa',
        team_id: team.id,
        code: 'div-hq',
        name: '경영지원본부',
        type: 'division',
        parent_id: '',
        active: true,
    };
    const childDepartment = {
        ...department,
        id: 'departmentid7777777777777cd',
        code: 'hr',
        name: '인사팀',
        parent_id: 'divisionid123456789012345aa',
    };

    const hierarchyFetchMock = (extraHandler?: (url: string, method: string, init?: RequestInit) => Response | undefined) => {
        return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || 'GET';

            const extra = extraHandler?.(url, method, init);
            if (extra) {
                return Promise.resolve(extra);
            }

            if (url.includes('/api/v4/teams?page=0&per_page=200')) {
                return Promise.resolve(buildResponse([team]));
            }

            if (url.includes('/org-units?include_inactive=true')) {
                return Promise.resolve(buildResponse([division, childDepartment, department]));
            }

            if (url.includes('/positions?include_inactive=true')) {
                return Promise.resolve(buildResponse([position]));
            }

            if (url.includes('/api/v4/users?in_team=')) {
                return Promise.resolve(buildResponse([user]));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            return Promise.resolve(buildResponse({}));
        });
    };

    test('H001: renders division section with add button and division rows', async () => {
        global.fetch = hierarchyFetchMock() as typeof fetch;

        await renderAndWaitForBody();

        expect(screen.getByText('본부 리스트')).toBeInTheDocument();
        expect(screen.getByText('본부 추가')).toBeInTheDocument();

        await waitFor(() => {
            const divisionTable = screen.getByText('본부 리스트').nextElementSibling as HTMLElement;
            expect(within(divisionTable).getByText('경영지원본부')).toBeInTheDocument();
        });
    });

    test('H002: groups departments under their division with an unassigned group', async () => {
        global.fetch = hierarchyFetchMock() as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getAllByText('인사팀').length).toBeGreaterThan(0);
            expect(screen.getAllByText('R&D').length).toBeGreaterThan(0);
        });

        const groupHeaders = document.querySelectorAll('.orgRoleManagement__groupHeader');
        const headerTexts = Array.from(groupHeaders).map((el) => el.textContent);
        expect(headerTexts.some((text) => text?.includes('경영지원본부'))).toBe(true);
        expect(headerTexts.some((text) => text?.includes('미소속'))).toBe(true);
    });

    test('H003: creating a division posts type division', async () => {
        const fetchMock = hierarchyFetchMock((url, method) => {
            if (url.includes('/org-units') && method === 'POST') {
                return buildResponse({...division, id: 'divisionid999999999999999zz'});
            }
            return undefined;
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        fireEvent.click(screen.getByText('본부 추가'));
        const nameInput = screen.getByPlaceholderText('본부명');
        await userEvent.type(nameInput, '신사업본부');
        fireEvent.click(screen.getByText('본부 저장'));

        await waitFor(() => {
            const postCall = fetchMock.mock.calls.find(([callUrl, callInit]) => String(callUrl).includes('/org-units') && callInit?.method === 'POST');
            expect(postCall).toBeTruthy();
            const body = JSON.parse((postCall![1]?.body as string) || '{}');
            expect(body.type).toBe('division');
            expect(body.name).toBe('신사업본부');
            expect(body.parent_id).toBe('');
        });
    });

    test('H004: changing a department parent select fires a transfer PUT with the new division', async () => {
        const fetchMock = hierarchyFetchMock((url, method) => {
            if (url.includes(`/org-units/${department.id}`) && method === 'PUT') {
                return buildResponse({...department, parent_id: division.id});
            }
            return undefined;
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getAllByText('R&D').length).toBeGreaterThan(0);
        });

        const departmentCell = screen.getAllByText('R&D').find((el) => el.tagName === 'TD');
        const departmentRow = departmentCell!.closest('tr') as HTMLTableRowElement;
        const parentSelect = within(departmentRow).getByRole('combobox');
        fireEvent.change(parentSelect, {target: {value: division.id}});

        await waitFor(() => {
            const putCall = fetchMock.mock.calls.find(([callUrl, callInit]) => String(callUrl).includes(`/org-units/${department.id}`) && callInit?.method === 'PUT');
            expect(putCall).toBeTruthy();
            const body = JSON.parse((putCall![1]?.body as string) || '{}');
            expect(body.parent_id).toBe(division.id);
            expect(body.type).toBe('department');
        });
    });

    test('H005: division deactivation conflict surfaces the transfer-first guidance', async () => {
        const guardMessage = '이 본부에는 아직 활성 하위 부서가 있습니다. 하위 부서를 먼저 다른 본부로 이관해 주세요.';
        const fetchMock = hierarchyFetchMock((url, method) => {
            if (url.includes(`/org-units/${division.id}`) && method === 'PUT') {
                return buildResponse(JSON.stringify({message: guardMessage}), false);
            }
            return undefined;
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            const table = screen.getByText('본부 리스트').nextElementSibling as HTMLElement;
            expect(within(table).getByText('경영지원본부')).toBeInTheDocument();
        });

        const divisionTable = screen.getByText('본부 리스트').nextElementSibling as HTMLElement;
        const divisionRow = within(divisionTable).getByText('경영지원본부').closest('tr') as HTMLTableRowElement;
        fireEvent.click(within(divisionRow).getByText('삭제'));

        await waitFor(() => {
            expect(screen.getByText('삭제 확인')).toBeInTheDocument();
        });
        fireEvent.click(document.querySelector('#org-role-delete-confirm-modal .btn-danger') as HTMLElement);

        await waitFor(() => {
            expect(screen.getByText(guardMessage)).toBeInTheDocument();
        });
    });
    test('H006: user assignment select groups divisions and departments into optgroups', async () => {
        global.fetch = hierarchyFetchMock() as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('test_user', {exact: false})).toBeInTheDocument();
        });

        const userRow = screen.getByText('test_user', {exact: false}).closest('tr') as HTMLTableRowElement;
        const orgUnitSelect = within(userRow).getAllByRole('combobox')[0];
        const optgroups = orgUnitSelect.querySelectorAll('optgroup');
        const labels = Array.from(optgroups).map((el) => el.getAttribute('label'));
        expect(labels).toContain('본부 직속');
        expect(labels).toContain('부서');

        const divisionGroup = Array.from(optgroups).find((el) => el.getAttribute('label') === '본부 직속');
        expect(within(divisionGroup as HTMLElement).getByText('경영지원본부')).toBeInTheDocument();
    });

    test('H007: division filter shows direct members plus child department members, department filter shows only its own', async () => {
        const directProfile = {
            team_id: team.id,
            user_id: user.id,
            primary_position_id: '',
            primary_org_unit_id: division.id,
            extra_positions: [],
            effective_from: 0,
            effective_to: 0,
        };
        const childProfile = {
            team_id: team.id,
            user_id: secondUser.id,
            primary_position_id: '',
            primary_org_unit_id: childDepartment.id,
            extra_positions: [],
            effective_from: 0,
            effective_to: 0,
        };
        const unassignedUser = TestHelper.getUserMock({
            id: 'userid33333333333333333333',
            username: 'free_agent',
            email: 'free@example.com',
            nickname: '무소속',
        });
        const fetchMock = hierarchyFetchMock((url) => {
            if (url.includes('/api/v4/users?in_team=')) {
                return buildResponse([user, secondUser, unassignedUser]);
            }
            if (url.includes('/org-profiles')) {
                return buildResponse([directProfile, childProfile]);
            }
            return undefined;
        });
        global.fetch = fetchMock as typeof fetch;

        await renderAndWaitForBody();

        await waitFor(() => {
            expect(screen.getByText('test_user', {exact: false})).toBeInTheDocument();
            expect(screen.getByText('blue_sky', {exact: false})).toBeInTheDocument();
            expect(screen.getByText('free_agent', {exact: false})).toBeInTheDocument();
        });

        const filterSelects = document.querySelectorAll('.orgRoleManagement__filterRow select');
        const orgUnitFilter = filterSelects[0] as HTMLSelectElement;

        // 본부 필터: 직속(user) + 하위 부서(secondUser)만 표시, 미배정 사용자는 제외
        fireEvent.change(orgUnitFilter, {target: {value: division.id}});
        await waitFor(() => {
            expect(screen.queryByText('free_agent', {exact: false})).not.toBeInTheDocument();
        });
        expect(screen.getByText('test_user', {exact: false})).toBeInTheDocument();
        expect(screen.getByText('blue_sky', {exact: false})).toBeInTheDocument();

        // 부서 필터: 그 부서 인원만
        fireEvent.change(orgUnitFilter, {target: {value: childDepartment.id}});
        await waitFor(() => {
            expect(screen.queryByText('test_user', {exact: false})).not.toBeInTheDocument();
            expect(screen.getByText('blue_sky', {exact: false})).toBeInTheDocument();
        });
    });
});
