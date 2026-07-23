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
    const user = TestHelper.getUserMock({
        id: 'userid12345678901234567890',
        username: 'test_user',
        email: 'test@example.com',
        first_name: 'User',
        last_name: 'One',
    });
    const position = {
        id: 'positionid1234567890123456ab',
        team_id: team.id,
        code: 'developer',
        name: '개발자',
        rank: 1,
        active: true,
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
        } as Response;
    };

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

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
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

    beforeEach(() => {
        global.fetch = defaultFetchMock() as typeof fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.useRealTimers();
    });

    test('renders management header', async () => {
        renderWithContext(<OrgRoleManagement/>);

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

        renderWithContext(<OrgRoleManagement/>);

        await waitFor(() => {
            expect(screen.getByText('조직/직위 배정')).toBeInTheDocument();
            expect(screen.getByText('필터 조건에 해당하는 사용자가 없습니다.')).toBeInTheDocument();
        });
    });

    test('filters position list by keyword', async () => {
        renderWithContext(<OrgRoleManagement/>);

        const positionTable = screen.getAllByRole('table')[1];
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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            if (url.includes(`/positions/${position.id}`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse(body));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        renderWithContext(<OrgRoleManagement/>);

        const positionTable = screen.getAllByRole('table')[1];
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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
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

        renderWithContext(<OrgRoleManagement/>);

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
        renderWithContext(<OrgRoleManagement/>);

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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
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

        renderWithContext(<OrgRoleManagement/>);

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

    test('shows success message when saving user assignment', async () => {
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
                return Promise.resolve(buildResponse({
                    ...body,
                    team_id: team.id,
                    user_id: user.id,
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            if (url.includes('/org-profiles')) {
                return Promise.resolve(buildResponse([]));
            }

            if (url.includes('/org-profile')) {
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        renderWithContext(<OrgRoleManagement/>);

        await waitFor(() => {
            expect(screen.getByText('User One - test_user')).toBeInTheDocument();
        });

        await userEvent.selectOptions(screen.getByDisplayValue('부서 미지정'), department.id);
        await userEvent.selectOptions(screen.getByDisplayValue('직위 미지정'), position.id);
        await userEvent.click(screen.getByRole('button', {name: '저장'}));

        const userRow = screen.getByText('User One - test_user').closest('tr');
        expect(userRow).not.toBeNull();

        await waitFor(() => {
            expect(within(userRow as HTMLTableRowElement).getByText('저장되었습니다')).toBeInTheDocument();
            expect(screen.queryAllByText('저장되었습니다')).toHaveLength(1);
        });
        expect(document.querySelector('.orgRoleManagement__successInline')).not.toBeInTheDocument();

        const updateCalls = fetchMock.mock.calls.filter(([input, init]) => {
            return String(input).includes(`/api/v4/teams/${team.id}/users/${user.id}/org-profile`) && init?.method === 'PUT';
        });
        expect(updateCalls).toHaveLength(1);

        await new Promise((resolve) => setTimeout(resolve, 2700));
        expect(within(userRow as HTMLTableRowElement).queryByText('저장되었습니다')).not.toBeInTheDocument();
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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            if (url.includes(`/org-units/${department.id}`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse(body));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        renderWithContext(<OrgRoleManagement/>);

        const departmentTable = screen.getAllByRole('table')[0];
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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            if (url.includes(`/org-units/${department.id}`) && method === 'PUT') {
                return Promise.resolve(buildResponse({}));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        renderWithContext(<OrgRoleManagement/>);

        const departmentTable = screen.getAllByRole('table')[0];
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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            if (url.includes(`/positions/${position.id}`) && method === 'PUT') {
                const body = JSON.parse((init?.body as string) || '{}');
                return Promise.resolve(buildResponse(body));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        renderWithContext(<OrgRoleManagement/>);

        const positionTable = screen.getAllByRole('table')[1];
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
                return Promise.resolve(buildResponse({
                    team_id: team.id,
                    user_id: user.id,
                    primary_position_id: '',
                    primary_org_unit_id: '',
                    extra_positions: [],
                    effective_from: 0,
                    effective_to: 0,
                    create_at: 0,
                    update_at: 0,
                }));
            }

            return Promise.resolve(buildResponse({}));
        });
        global.fetch = fetchMock as typeof fetch;

        renderWithContext(<OrgRoleManagement/>);

        const positionTable = screen.getAllByRole('table')[1];
        const departmentTable = screen.getAllByRole('table')[0];
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
        const secondUser = TestHelper.getUserMock({
            id: 'userid22345678901234567890',
            username: 'blue_sky',
            email: 'blue@example.com',
            nickname: '푸른하늘',
        });

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

        renderWithContext(<OrgRoleManagement/>);

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
});

