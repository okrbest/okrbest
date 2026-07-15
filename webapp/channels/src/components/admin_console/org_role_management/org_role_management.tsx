// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FormattedMessage} from 'react-intl';

import type {Team} from '@mattermost/types/teams';
import type {UserProfile} from '@mattermost/types/users';

import ConfirmModal from 'components/confirm_modal';
import AdminHeader from 'components/widgets/admin_console/admin_header';
import AdminPanel from 'components/widgets/admin_console/admin_panel';

import './org_role_management.scss';

type PositionDefinition = {
    id: string;
    team_id: string;
    code: string;
    name: string;
    rank: number;
    active: boolean;
    full_visibility: boolean;
};

type OrgUnit = {
    id: string;
    team_id: string;
    code: string;
    name: string;
    type: 'department' | 'team';
    parent_id: string;
    active: boolean;
};

type UserOrgProfile = {
    team_id: string;
    user_id: string;
    primary_position_id: string;
    primary_org_unit_id: string;
    extra_positions: string[];
    effective_from: number;
    effective_to: number;
};

type AssignmentState = {
    primary_position_id: string;
    primary_org_unit_id: string;
};

const emptyAssignmentState: AssignmentState = {
    primary_position_id: '',
    primary_org_unit_id: '',
};

type PositionEditor = {
    id: string;
    code: string;
    name: string;
    rank: number;
    active: boolean;
    full_visibility: boolean;
};

type DepartmentEditor = {
    id: string;
    code: string;
    name: string;
    type: 'department' | 'team';
    parent_id: string;
    active: boolean;
};

type DeleteConfirmTarget =
    | {
        type: 'position';
        item: PositionDefinition;
    }
    | {
        type: 'department';
        item: OrgUnit;
    };

async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
    });

    const raw = await response.text();

    if (!response.ok) {
        throw new Error(raw || response.statusText);
    }

    if (!raw) {
        return {} as T;
    }

    try {
        return JSON.parse(raw) as T;
    } catch {
        return raw as T;
    }
}

function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? value : [];
}

function parseApiError(error: unknown): string {
    const fallback = (error as Error)?.message || '요청 처리 중 오류가 발생했습니다.';

    try {
        const parsed = JSON.parse(fallback);
        return parsed?.message || fallback;
    } catch {
        return fallback;
    }
}

function getOrgRoleUserDisplayName(user: UserProfile): string {
    if (user.nickname && user.nickname.trim()) {
        return user.nickname.trim();
    }

    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
        return fullName;
    }

    return user.username;
}

const OrgRoleManagement = () => {
    const SUCCESS_MESSAGE_DURATION_MS = 2500;
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');

    const [positions, setPositions] = useState<PositionDefinition[]>([]);
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserOrgProfile>>({});
    const [assignments, setAssignments] = useState<Record<string, AssignmentState>>({});

    const [showPositionForm, setShowPositionForm] = useState(false);
    const [showDepartmentForm, setShowDepartmentForm] = useState(false);
    const [positionForm, setPositionForm] = useState({name: '', rank: 0, full_visibility: false});
    const [departmentForm, setDepartmentForm] = useState({name: ''});
    const [positionSearchKeyword, setPositionSearchKeyword] = useState('');
    const [departmentSearchKeyword, setDepartmentSearchKeyword] = useState('');
    const [userSearchKeyword, setUserSearchKeyword] = useState('');
    const [editingPosition, setEditingPosition] = useState<PositionEditor | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentEditor | null>(null);

    const [filterOrgUnitId, setFilterOrgUnitId] = useState('');
    const [filterPositionId, setFilterPositionId] = useState('');
    const [savingUserId, setSavingUserId] = useState('');
    const [processingActionKey, setProcessingActionKey] = useState('');
    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteConfirmTarget | null>(null);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [savedUserId, setSavedUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const successMessageTimerRef = useRef<number>();
    const userSaveSuccessTimerRef = useRef<number>();

    const selectedTeam = useMemo(() => teams.find((team) => team.id === selectedTeamId), [teams, selectedTeamId]);

    const clearSuccessMessageTimer = useCallback(() => {
        if (successMessageTimerRef.current) {
            window.clearTimeout(successMessageTimerRef.current);
            successMessageTimerRef.current = undefined;
        }
    }, []);

    const showSuccessMessage = useCallback((message: string) => {
        clearSuccessMessageTimer();
        setSuccessMessage(message);
        successMessageTimerRef.current = window.setTimeout(() => {
            setSuccessMessage('');
            successMessageTimerRef.current = undefined;
        }, SUCCESS_MESSAGE_DURATION_MS);
    }, [clearSuccessMessageTimer]);

    const clearUserSaveSuccessTimer = useCallback(() => {
        if (userSaveSuccessTimerRef.current) {
            window.clearTimeout(userSaveSuccessTimerRef.current);
            userSaveSuccessTimerRef.current = undefined;
        }
    }, []);

    const toggleDepartmentForm = useCallback(() => {
        setShowDepartmentForm((prev) => !prev);
        setShowPositionForm(false);
    }, []);

    const togglePositionForm = useCallback(() => {
        setShowPositionForm((prev) => !prev);
        setShowDepartmentForm(false);
    }, []);

    const openDeleteConfirmForPosition = useCallback((position: PositionDefinition) => {
        setDeleteConfirmTarget({
            type: 'position',
            item: position,
        });
    }, []);

    const openDeleteConfirmForDepartment = useCallback((department: OrgUnit) => {
        setDeleteConfirmTarget({
            type: 'department',
            item: department,
        });
    }, []);

    const closeDeleteConfirm = useCallback(() => {
        setDeleteConfirmTarget(null);
    }, []);

    const loadTeams = useCallback(async () => {
        const list = ensureArray<Team>(await request<unknown>('/api/v4/teams?page=0&per_page=200'));
        setTeams(list);
        if (list.length > 0 && !selectedTeamId) {
            setSelectedTeamId(list[0].id);
        }
    }, [selectedTeamId]);

    const loadTeamData = useCallback(async (teamId: string) => {
        if (!teamId) {
            return;
        }

        const [positionsData, orgUnitsData, users] = await Promise.all([
            request<unknown>(`/api/v4/teams/${teamId}/positions?include_inactive=true`),
            request<unknown>(`/api/v4/teams/${teamId}/org-units?include_inactive=true`),
            request<unknown>(`/api/v4/users?in_team=${teamId}&page=0&per_page=200`),
        ]);

        const safePositions = ensureArray<PositionDefinition>(positionsData);
        const safeOrgUnits = ensureArray<OrgUnit>(orgUnitsData);
        const safeUsers = ensureArray<UserProfile>(users);

        setPositions(safePositions);
        setOrgUnits(safeOrgUnits);

        const activeUsers = safeUsers.filter((user) => !user.delete_at && !user.is_bot);
        setTeamUsers(activeUsers);

        const loadedProfiles = await Promise.all(
            activeUsers.map(async (user) => {
                const profile = await request<UserOrgProfile>(`/api/v4/teams/${teamId}/users/${user.id}/org-profile`);
                return {userId: user.id, profile};
            }),
        );

        const profileMap: Record<string, UserOrgProfile> = {};
        const assignmentMap: Record<string, AssignmentState> = {};
        for (const loaded of loadedProfiles) {
            profileMap[loaded.userId] = loaded.profile;
            assignmentMap[loaded.userId] = {
                primary_position_id: loaded.profile.primary_position_id || '',
                primary_org_unit_id: loaded.profile.primary_org_unit_id || '',
            };
        }
        setUserProfiles(profileMap);
        setAssignments(assignmentMap);
    }, []);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                await loadTeams();
            } catch (e) {
                setError(parseApiError(e));
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [loadTeams]);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError('');
                await loadTeamData(selectedTeamId);
            } catch (e) {
                setError(parseApiError(e));
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [loadTeamData, selectedTeamId]);

    useEffect(() => {
        setEditingPosition(null);
        setEditingDepartment(null);
        setPositionSearchKeyword('');
        setDepartmentSearchKeyword('');
        setUserSearchKeyword('');
        setDeleteConfirmTarget(null);
        clearSuccessMessageTimer();
        clearUserSaveSuccessTimer();
        setSuccessMessage('');
        setSavedUserId('');
    }, [clearSuccessMessageTimer, clearUserSaveSuccessTimer, selectedTeamId]);

    useEffect(() => {
        return () => {
            clearSuccessMessageTimer();
            clearUserSaveSuccessTimer();
        };
    }, [clearSuccessMessageTimer, clearUserSaveSuccessTimer]);

    const createPosition = async () => {
        if (!selectedTeamId || !positionForm.name) {
            return;
        }

        try {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            await request(`/api/v4/teams/${selectedTeamId}/positions`, 'POST', {
                name: positionForm.name,
                rank: positionForm.rank,
                full_visibility: positionForm.full_visibility,
            });
            setPositionForm({name: '', rank: 0, full_visibility: false});
            setShowPositionForm(false);
            await loadTeamData(selectedTeamId);
            setError('');
            showSuccessMessage('저장되었습니다');
        } catch (e) {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            setError(parseApiError(e));
        }
    };

    const createDepartment = async () => {
        if (!selectedTeamId || !departmentForm.name) {
            return;
        }

        try {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            await request(`/api/v4/teams/${selectedTeamId}/org-units`, 'POST', {
                name: departmentForm.name,
                type: 'department',
                parent_id: '',
            });
            setDepartmentForm({name: ''});
            setShowDepartmentForm(false);
            await loadTeamData(selectedTeamId);
            setError('');
            showSuccessMessage('저장되었습니다');
        } catch (e) {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            setError(parseApiError(e));
        }
    };

    const updateAssignmentField = (userId: string, key: 'primary_position_id' | 'primary_org_unit_id', value: string) => {
        setAssignments((prev) => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || emptyAssignmentState),
                [key]: value,
            },
        }));
    };

    const saveUserAssignment = async (userId: string) => {
        if (!selectedTeamId) {
            return;
        }

        const assignment = assignments[userId];
        if (!assignment) {
            return;
        }

        try {
            clearUserSaveSuccessTimer();
            setSavedUserId('');
            setSavingUserId(userId);
            const current = userProfiles[userId] || {
                team_id: selectedTeamId,
                user_id: userId,
                extra_positions: [],
                effective_from: 0,
                effective_to: 0,
                create_at: 0,
                update_at: 0,
            };
            const payload = {
                ...current,
                primary_position_id: assignment.primary_position_id,
                primary_org_unit_id: assignment.primary_org_unit_id,
            };
            const savedProfile = await request<UserOrgProfile>(`/api/v4/teams/${selectedTeamId}/users/${userId}/org-profile`, 'PUT', payload);
            setUserProfiles((prev) => ({...prev, [userId]: savedProfile}));
            setError('');
            setSavedUserId(userId);
            userSaveSuccessTimerRef.current = window.setTimeout(() => {
                setSavedUserId('');
                userSaveSuccessTimerRef.current = undefined;
            }, SUCCESS_MESSAGE_DURATION_MS);
        } catch (e) {
            clearUserSaveSuccessTimer();
            setSavedUserId('');
            setError(parseApiError(e));
        } finally {
            setSavingUserId('');
        }
    };

    const startEditPosition = (position: PositionDefinition) => {
        setEditingPosition({
            id: position.id,
            code: position.code,
            name: position.name,
            rank: position.rank,
            active: position.active,
            full_visibility: position.full_visibility,
        });
    };

    const saveEditedPosition = async () => {
        if (!selectedTeamId || !editingPosition) {
            return;
        }

        try {
            setProcessingActionKey(`position-save-${editingPosition.id}`);
            await request(`/api/v4/teams/${selectedTeamId}/positions/${editingPosition.id}`, 'PUT', {
                code: editingPosition.code,
                name: editingPosition.name,
                rank: editingPosition.rank,
                active: editingPosition.active,
                full_visibility: editingPosition.full_visibility,
            });
            setEditingPosition(null);
            await loadTeamData(selectedTeamId);
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const deactivatePosition = async (position: PositionDefinition) => {
        if (!selectedTeamId || !position.active) {
            return;
        }

        try {
            setProcessingActionKey(`position-deactivate-${position.id}`);
            await request(`/api/v4/teams/${selectedTeamId}/positions/${position.id}`, 'PUT', {
                code: position.code,
                name: position.name,
                rank: position.rank,
                active: false,
                full_visibility: position.full_visibility,
            });
            if (editingPosition?.id === position.id) {
                setEditingPosition(null);
            }
            await loadTeamData(selectedTeamId);
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const startEditDepartment = (department: OrgUnit) => {
        setEditingDepartment({
            id: department.id,
            code: department.code,
            name: department.name,
            type: department.type,
            parent_id: department.parent_id,
            active: department.active,
        });
    };

    const saveEditedDepartment = async () => {
        if (!selectedTeamId || !editingDepartment) {
            return;
        }

        try {
            setProcessingActionKey(`department-save-${editingDepartment.id}`);
            await request(`/api/v4/teams/${selectedTeamId}/org-units/${editingDepartment.id}`, 'PUT', {
                code: editingDepartment.code,
                name: editingDepartment.name,
                type: editingDepartment.type,
                parent_id: editingDepartment.parent_id,
                active: editingDepartment.active,
            });
            setEditingDepartment(null);
            await loadTeamData(selectedTeamId);
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const deactivateDepartment = async (department: OrgUnit) => {
        if (!selectedTeamId || !department.active) {
            return;
        }

        try {
            setProcessingActionKey(`department-deactivate-${department.id}`);
            await request(`/api/v4/teams/${selectedTeamId}/org-units/${department.id}`, 'PUT', {
                code: department.code,
                name: department.name,
                type: department.type,
                parent_id: department.parent_id,
                active: false,
            });
            if (editingDepartment?.id === department.id) {
                setEditingDepartment(null);
            }
            await loadTeamData(selectedTeamId);
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const deleteConfirmActionKey = useMemo(() => {
        if (!deleteConfirmTarget) {
            return '';
        }

        if (deleteConfirmTarget.type === 'department') {
            return `department-deactivate-${deleteConfirmTarget.item.id}`;
        }

        return `position-deactivate-${deleteConfirmTarget.item.id}`;
    }, [deleteConfirmTarget]);

    const isDeleteConfirming = Boolean(deleteConfirmActionKey) && processingActionKey === deleteConfirmActionKey;

    const confirmDelete = async () => {
        if (!deleteConfirmTarget) {
            return;
        }

        if (deleteConfirmTarget.type === 'department') {
            await deactivateDepartment(deleteConfirmTarget.item);
        } else {
            await deactivatePosition(deleteConfirmTarget.item);
        }

        setDeleteConfirmTarget(null);
    };

    const activePositions = useMemo(() => ensureArray<PositionDefinition>(positions).filter((position) => position.active), [positions]);
    const activeOrgUnits = useMemo(() => ensureArray<OrgUnit>(orgUnits).filter((orgUnit) => orgUnit.active), [orgUnits]);
    const activeDepartments = useMemo(() => activeOrgUnits.filter((orgUnit) => orgUnit.type === 'department'), [activeOrgUnits]);

    const filteredPositionList = useMemo(() => {
        const keyword = positionSearchKeyword.trim().toLowerCase();
        if (!keyword) {
            return activePositions;
        }

        return activePositions.filter((position) => {
            return position.name.toLowerCase().includes(keyword);
        });
    }, [activePositions, positionSearchKeyword]);

    const filteredDepartmentList = useMemo(() => {
        const keyword = departmentSearchKeyword.trim().toLowerCase();
        if (!keyword) {
            return activeDepartments;
        }

        return activeDepartments.filter((department) => {
            return department.name.toLowerCase().includes(keyword);
        });
    }, [activeDepartments, departmentSearchKeyword]);

    const filteredUsers = useMemo(() => {
        const keyword = userSearchKeyword.trim().toLowerCase();

        return ensureArray<UserProfile>(teamUsers).filter((user) => {
            const displayName = getOrgRoleUserDisplayName(user).toLowerCase();
            const username = user.username.toLowerCase();
            const userMatched = !keyword || displayName.includes(keyword) || username.includes(keyword);
            if (!userMatched) {
                return false;
            }

            const assignment = assignments[user.id];
            if (!assignment) {
                return !filterOrgUnitId && !filterPositionId;
            }

            const orgUnitMatched = !filterOrgUnitId || assignment.primary_org_unit_id === filterOrgUnitId;
            const positionMatched = !filterPositionId || assignment.primary_position_id === filterPositionId;
            return orgUnitMatched && positionMatched;
        });
    }, [assignments, filterOrgUnitId, filterPositionId, teamUsers, userSearchKeyword]);

    return (
        <div className='wrapper--fixed orgRoleManagement'>
            <AdminHeader>
                <FormattedMessage
                    id='admin.org_roles.title'
                    defaultMessage='조직/직위 관리'
                />
            </AdminHeader>
            <div className='admin-console__wrapper'>
                <div className='admin-console__content'>
                    <AdminPanel
                        id='org_roles'
                        title={{id: 'admin.org_roles.panel_title', defaultMessage: '조직/직위 배정'}}
                        subtitle={{id: 'admin.org_roles.panel_subtitle', defaultMessage: '직위/부서를 추가하고, 사용자에게 배정할 수 있습니다.'}}
                    >
                        <div className='orgRoleManagement__contentBody'>
                            {error && <div className='form-group has-error'>{error}</div>}
                            {loading && <div className='form-group'>{'불러오는 중...'}</div>}

                            <div className='form-group'>
                                <label htmlFor='org-role-team'>
                                    <FormattedMessage
                                        id='admin.org_roles.team'
                                        defaultMessage='팀'
                                    />
                                </label>
                                <select
                                    id='org-role-team'
                                    className='form-control'
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                >
                                    <option value=''>{'팀을 선택하세요'}</option>
                                    {teams.map((team) => (
                                        <option
                                            key={team.id}
                                            value={team.id}
                                        >
                                            {team.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='form-group orgRoleManagement__buttonRow'>
                                <button
                                    className='btn btn-primary'
                                    onClick={toggleDepartmentForm}
                                >
                                    {'부서 추가'}
                                </button>
                                <button
                                    className='btn btn-primary'
                                    onClick={togglePositionForm}
                                >
                                    {'직위 추가'}
                                </button>
                            </div>

                            {successMessage && (
                                <div className='alert alert-success orgRoleManagement__successInline'>
                                    <i className='fa fa-check'/>
                                    {successMessage}
                                </div>
                            )}

                        {showDepartmentForm && (
                            <div className='form-group orgRoleManagement__inlineForm'>
                                <input
                                    className='form-control'
                                    placeholder='부서명'
                                    value={departmentForm.name}
                                    onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                                />
                                <button
                                    className='btn btn-primary'
                                    onClick={createDepartment}
                                >
                                    {'부서 저장'}
                                </button>
                            </div>
                        )}

                        {showPositionForm && (
                            <div className='form-group orgRoleManagement__inlineForm'>
                                <input
                                    className='form-control'
                                    placeholder='직위명'
                                    value={positionForm.name}
                                    onChange={(e) => setPositionForm({...positionForm, name: e.target.value})}
                                />
                                <input
                                    className='form-control'
                                    type='number'
                                    placeholder='정렬 순서(rank)'
                                    value={positionForm.rank}
                                    onChange={(e) => setPositionForm({...positionForm, rank: Number(e.target.value)})}
                                />
                                <label>
                                    <input
                                        type='checkbox'
                                        checked={positionForm.full_visibility}
                                        onChange={(e) => setPositionForm({...positionForm, full_visibility: e.target.checked})}
                                    />
                                    {' 보드 전체보기 권한'}
                                </label>
                                <button
                                    className='btn btn-primary'
                                    onClick={createPosition}
                                >
                                    {'직위 저장'}
                                </button>
                            </div>
                        )}

                        <h4>{'부서 리스트'}</h4>
                        <div className='form-group'>
                            <input
                                className='form-control'
                                placeholder='부서 검색 (이름)'
                                value={departmentSearchKeyword}
                                onChange={(e) => setDepartmentSearchKeyword(e.target.value)}
                            />
                        </div>
                        <div className='orgRoleManagement__tableWrap'>
                            <table
                                className='table table-striped orgRoleManagement__table orgRoleManagement__table--department'
                            >
                                <thead>
                                    <tr>
                                        <th>{'부서명'}</th>
                                        <th>{'상태'}</th>
                                        <th>{'관리'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartmentList.map((department) => {
                                        const isEditing = editingDepartment?.id === department.id;
                                        const isSaving = processingActionKey === `department-save-${department.id}`;
                                        const isDeactivating = processingActionKey === `department-deactivate-${department.id}`;

                                        return (
                                            <tr key={department.id}>
                                                <td>
                                                    {isEditing ? (
                                                        <input
                                                            className='form-control'
                                                            value={editingDepartment?.name || ''}
                                                            onChange={(e) => setEditingDepartment({...editingDepartment!, name: e.target.value})}
                                                        />
                                                    ) : (
                                                        department.name
                                                    )}
                                                </td>
                                                <td>{department.active ? '활성' : '비활성'}</td>
                                                <td className='orgRoleManagement__actionCell'>
                                                    {isEditing ? (
                                                        <div className='orgRoleManagement__actionButtons'>
                                                            <button
                                                                className='btn btn-primary btn-sm'
                                                                onClick={saveEditedDepartment}
                                                                disabled={isSaving}
                                                            >
                                                                {isSaving ? '저장 중...' : '저장'}
                                                            </button>
                                                            <button
                                                                className='btn btn-tertiary btn-sm'
                                                                onClick={() => setEditingDepartment(null)}
                                                            >
                                                                {'취소'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className='orgRoleManagement__actionButtons'>
                                                            <button
                                                                className='btn btn-tertiary btn-sm'
                                                                onClick={() => startEditDepartment(department)}
                                                                disabled={isDeactivating}
                                                            >
                                                                {'수정'}
                                                            </button>
                                                            <button
                                                                className='btn btn-danger btn-sm'
                                                                onClick={() => openDeleteConfirmForDepartment(department)}
                                                                disabled={isDeactivating}
                                                            >
                                                                {isDeactivating ? '삭제 중...' : '삭제'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredDepartmentList.length === 0 && (
                                        <tr>
                                            <td colSpan={3}>
                                                <div className='help-text'>{'검색 조건에 해당하는 부서가 없습니다.'}</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <h4>{'직위 리스트'}</h4>
                        <div className='form-group'>
                            <input
                                className='form-control'
                                placeholder='직위 검색 (이름)'
                                value={positionSearchKeyword}
                                onChange={(e) => setPositionSearchKeyword(e.target.value)}
                            />
                        </div>
                        <div className='orgRoleManagement__tableWrap'>
                            <table
                                className='table table-striped orgRoleManagement__table orgRoleManagement__table--position'
                            >
                                <thead>
                                    <tr>
                                        <th>{'직위명'}</th>
                                        <th>{'정렬순서'}</th>
                                        <th>{'상태'}</th>
                                        <th title='체크된 직위를 가진 사용자는 부서/직위 구분 없이 모든 보드를 봅니다'>{'보드 전체보기'}</th>
                                        <th>{'관리'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPositionList.map((position) => {
                                        const isEditing = editingPosition?.id === position.id;
                                        const isSaving = processingActionKey === `position-save-${position.id}`;
                                        const isDeactivating = processingActionKey === `position-deactivate-${position.id}`;

                                        return (
                                            <tr key={position.id}>
                                                <td>
                                                    {isEditing ? (
                                                        <input
                                                            className='form-control'
                                                            value={editingPosition?.name || ''}
                                                            onChange={(e) => setEditingPosition({...editingPosition!, name: e.target.value})}
                                                        />
                                                    ) : (
                                                        position.name
                                                    )}
                                                </td>
                                                <td>
                                                    {isEditing ? (
                                                        <input
                                                            className='form-control'
                                                            type='number'
                                                            value={editingPosition?.rank || 0}
                                                            onChange={(e) => setEditingPosition({...editingPosition!, rank: Number(e.target.value)})}
                                                        />
                                                    ) : (
                                                        position.rank
                                                    )}
                                                </td>
                                                <td>{position.active ? '활성' : '비활성'}</td>
                                                <td>
                                                    {isEditing ? (
                                                        <input
                                                            type='checkbox'
                                                            checked={editingPosition?.full_visibility || false}
                                                            onChange={(e) => setEditingPosition({...editingPosition!, full_visibility: e.target.checked})}
                                                        />
                                                    ) : (
                                                        <input
                                                            type='checkbox'
                                                            checked={position.full_visibility}
                                                            disabled={true}
                                                        />
                                                    )}
                                                </td>
                                                <td className='orgRoleManagement__actionCell'>
                                                    {isEditing ? (
                                                        <div className='orgRoleManagement__actionButtons'>
                                                            <button
                                                                className='btn btn-primary btn-sm'
                                                                onClick={saveEditedPosition}
                                                                disabled={isSaving}
                                                            >
                                                                {isSaving ? '저장 중...' : '저장'}
                                                            </button>
                                                            <button
                                                                className='btn btn-tertiary btn-sm'
                                                                onClick={() => setEditingPosition(null)}
                                                            >
                                                                {'취소'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className='orgRoleManagement__actionButtons'>
                                                            <button
                                                                className='btn btn-tertiary btn-sm'
                                                                onClick={() => startEditPosition(position)}
                                                                disabled={isDeactivating}
                                                            >
                                                                {'수정'}
                                                            </button>
                                                            <button
                                                                className='btn btn-danger btn-sm'
                                                                onClick={() => openDeleteConfirmForPosition(position)}
                                                                disabled={isDeactivating}
                                                            >
                                                                {isDeactivating ? '삭제 중...' : '삭제'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredPositionList.length === 0 && (
                                        <tr>
                                            <td colSpan={5}>
                                                <div className='help-text'>{'검색 조건에 해당하는 직위가 없습니다.'}</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <h4>{'필터'}</h4>
                        <div className='form-group orgRoleManagement__filterRow'>
                            <select
                                className='form-control'
                                value={filterOrgUnitId}
                                onChange={(e) => setFilterOrgUnitId(e.target.value)}
                            >
                                <option value=''>{'전체 부서'}</option>
                                {activeDepartments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className='form-control'
                                value={filterPositionId}
                                onChange={(e) => setFilterPositionId(e.target.value)}
                            >
                                <option value=''>{'전체 직위'}</option>
                                {activePositions.map((position) => (
                                    <option
                                        key={position.id}
                                        value={position.id}
                                    >
                                        {position.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                className='btn btn-tertiary'
                                onClick={() => {
                                    setFilterOrgUnitId('');
                                    setFilterPositionId('');
                                }}
                            >
                                {'초기화'}
                            </button>
                        </div>

                        <h4>{'사용자 리스트'}</h4>
                        <div className='form-group'>
                            <input
                                className='form-control'
                                placeholder='사용자 검색 (이름/username)'
                                value={userSearchKeyword}
                                onChange={(e) => setUserSearchKeyword(e.target.value)}
                            />
                        </div>
                        <div className='orgRoleManagement__tableWrap'>
                            <table
                                className='table table-striped orgRoleManagement__table orgRoleManagement__table--users'
                            >
                                <thead>
                                    <tr>
                                        <th>{'사용자'}</th>
                                        <th>{'부서'}</th>
                                        <th>{'직위'}</th>
                                        <th>{'저장'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const assignment = assignments[user.id] || emptyAssignmentState;
                                        const displayName = getOrgRoleUserDisplayName(user);
                                        return (
                                            <tr key={user.id}>
                                                <td>
                                                    <div>{`${displayName} - ${user.username}`}</div>
                                                    <div className='help-text'>{user.email}</div>
                                                </td>
                                                <td>
                                                    <select
                                                        className='form-control'
                                                        value={assignment.primary_org_unit_id}
                                                        onChange={(e) => updateAssignmentField(user.id, 'primary_org_unit_id', e.target.value)}
                                                    >
                                                        <option value=''>{'부서 미지정'}</option>
                                                        {activeDepartments.map((department) => (
                                                            <option
                                                                key={department.id}
                                                                value={department.id}
                                                            >
                                                                {department.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        className='form-control'
                                                        value={assignment.primary_position_id}
                                                        onChange={(e) => updateAssignmentField(user.id, 'primary_position_id', e.target.value)}
                                                    >
                                                        <option value=''>{'직위 미지정'}</option>
                                                        {activePositions.map((position) => (
                                                            <option
                                                                key={position.id}
                                                                value={position.id}
                                                            >
                                                                {position.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <div className='orgRoleManagement__userSaveCell'>
                                                        <button
                                                            className='btn btn-primary btn-sm'
                                                            onClick={() => saveUserAssignment(user.id)}
                                                            disabled={savingUserId === user.id}
                                                        >
                                                            {savingUserId === user.id ? '저장 중...' : '저장'}
                                                        </button>
                                                        {savedUserId === user.id && (
                                                            <div className='orgRoleManagement__userSaveSuccess'>{'저장되었습니다'}</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className='help-text'>{'필터 조건에 해당하는 사용자가 없습니다.'}</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                            {selectedTeam && (
                                <div className='help-text'>
                                    <FormattedMessage
                                        id='admin.org_roles.selected_team'
                                        defaultMessage='선택된 팀: {teamName}'
                                        values={{teamName: selectedTeam.display_name}}
                                    />
                                </div>
                            )}
                        </div>
                    </AdminPanel>
                </div>
            </div>
            <ConfirmModal
                id='org-role-delete-confirm-modal'
                show={Boolean(deleteConfirmTarget)}
                title={'삭제 확인'}
                message={
                    <div className='orgRoleManagement__deleteConfirmMessage'>
                        {deleteConfirmTarget && (
                            <p>{`'${deleteConfirmTarget.item.name}' 항목을 삭제하시겠습니까?`}</p>
                        )}
                    </div>
                }
                confirmButtonClass='btn btn-danger'
                confirmButtonText={isDeleteConfirming ? '삭제 중...' : '삭제'}
                cancelButtonText={'취소'}
                confirmDisabled={isDeleteConfirming}
                modalClass='orgRoleManagement__deleteConfirmModal'
                onConfirm={() => {
                    void confirmDelete();
                }}
                onCancel={closeDeleteConfirm}
            />
        </div>
    );
};

export default OrgRoleManagement;
