// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import type {UserProfile} from '@mattermost/types/users';

import ConfirmModal from 'components/confirm_modal';

import './org_role_management.scss';

type PositionDefinition = {
    id: string;
    team_id: string;
    code: string;
    name: string;
    rank: number;
    active: boolean;
    full_visibility: boolean;
    kind?: 'position' | 'duty';
};

type OrgUnit = {
    id: string;
    team_id: string;
    code: string;
    name: string;
    type: 'department' | 'team' | 'division';
    parent_id: string;
    active: boolean;
};

type UserOrgProfile = {
    team_id: string;
    user_id: string;
    primary_position_id: string;
    primary_duty_id: string;
    primary_org_unit_id: string;
    extra_positions: string[];
    effective_from: number;
    effective_to: number;
};

type AssignmentState = {
    primary_position_id: string;
    primary_duty_id: string;
    primary_org_unit_id: string;
};

const emptyAssignmentState: AssignmentState = {
    primary_position_id: '',
    primary_duty_id: '',
    primary_org_unit_id: '',
};

type BulkSaveSummary = {
    successCount: number;
    failCount: number;
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
    type: 'department' | 'team' | 'division';
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

type Props = {
    teamId: string;
};

const OrgRoleManagementBody = ({teamId}: Props) => {
    const SUCCESS_MESSAGE_DURATION_MS = 2500;

    const intl = useIntl();

    const [positions, setPositions] = useState<PositionDefinition[]>([]);
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserOrgProfile>>({});
    const [assignments, setAssignments] = useState<Record<string, AssignmentState>>({});

    const [showPositionForm, setShowPositionForm] = useState(false);
    const [showDepartmentForm, setShowDepartmentForm] = useState(false);
    const [showDivisionForm, setShowDivisionForm] = useState(false);
    const [showDutyForm, setShowDutyForm] = useState(false);
    const [positionForm, setPositionForm] = useState({name: '', rank: 0, full_visibility: false});
    const [departmentForm, setDepartmentForm] = useState({name: '', parent_id: ''});
    const [divisionForm, setDivisionForm] = useState({name: ''});
    const [dutyForm, setDutyForm] = useState({name: '', rank: 0, full_visibility: false});
    const [positionSearchKeyword, setPositionSearchKeyword] = useState('');
    const [departmentSearchKeyword, setDepartmentSearchKeyword] = useState('');
    const [userSearchKeyword, setUserSearchKeyword] = useState('');
    const [editingPosition, setEditingPosition] = useState<PositionEditor | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentEditor | null>(null);

    const [filterOrgUnitId, setFilterOrgUnitId] = useState('');
    const [filterDutyId, setFilterDutyId] = useState('');
    const [filterPositionId, setFilterPositionId] = useState('');
    const [processingActionKey, setProcessingActionKey] = useState('');
    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteConfirmTarget | null>(null);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const successMessageTimerRef = useRef<number>();

    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [bulkOrgUnitId, setBulkOrgUnitId] = useState('');
    const [bulkDutyId, setBulkDutyId] = useState('');
    const [bulkPositionId, setBulkPositionId] = useState('');
    const [isBulkSaving, setIsBulkSaving] = useState(false);
    const [bulkSaveSummary, setBulkSaveSummary] = useState<BulkSaveSummary | null>(null);
    const bulkSaveSummaryTimerRef = useRef<number>();
    const teamIdRef = useRef(teamId);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        teamIdRef.current = teamId;
    }, [teamId]);

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

    const clearBulkSaveSummaryTimer = useCallback(() => {
        if (bulkSaveSummaryTimerRef.current) {
            window.clearTimeout(bulkSaveSummaryTimerRef.current);
            bulkSaveSummaryTimerRef.current = undefined;
        }
    }, []);

    const showBulkSaveSummary = useCallback((summary: BulkSaveSummary) => {
        clearBulkSaveSummaryTimer();
        setBulkSaveSummary(summary);
        if (summary.failCount === 0) {
            bulkSaveSummaryTimerRef.current = window.setTimeout(() => {
                setBulkSaveSummary(null);
                bulkSaveSummaryTimerRef.current = undefined;
            }, SUCCESS_MESSAGE_DURATION_MS);
        }
    }, [clearBulkSaveSummaryTimer]);

    const toggleDepartmentForm = useCallback(() => {
        setShowDepartmentForm((prev) => !prev);
        setShowPositionForm(false);
        setShowDivisionForm(false);
        setShowDutyForm(false);
    }, []);

    const togglePositionForm = useCallback(() => {
        setShowPositionForm((prev) => !prev);
        setShowDepartmentForm(false);
        setShowDivisionForm(false);
        setShowDutyForm(false);
    }, []);

    const toggleDivisionForm = useCallback(() => {
        setShowDivisionForm((prev) => !prev);
        setShowDepartmentForm(false);
        setShowPositionForm(false);
        setShowDutyForm(false);
    }, []);

    const toggleDutyForm = useCallback(() => {
        setShowDutyForm((prev) => !prev);
        setShowDepartmentForm(false);
        setShowPositionForm(false);
        setShowDivisionForm(false);
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

    const loadTeamData = useCallback(async (currentTeamId: string) => {
        if (!currentTeamId) {
            return;
        }

        const [positionsData, orgUnitsData, users, profiles] = await Promise.all([
            request<unknown>(`/api/v4/teams/${currentTeamId}/positions?include_inactive=true`),
            request<unknown>(`/api/v4/teams/${currentTeamId}/org-units?include_inactive=true`),
            request<unknown>(`/api/v4/users?in_team=${currentTeamId}&page=0&per_page=200`),
            request<unknown>(`/api/v4/teams/${currentTeamId}/org-profiles`),
        ]);

        if (teamIdRef.current !== currentTeamId) {
            // The admin switched teams while these requests were in flight;
            // applying them would populate the new team's view (division groups
            // included) with stale data.
            return;
        }

        const safePositions = ensureArray<PositionDefinition>(positionsData);
        const safeOrgUnits = ensureArray<OrgUnit>(orgUnitsData);
        const safeUsers = ensureArray<UserProfile>(users);
        const safeProfiles = ensureArray<UserOrgProfile>(profiles);

        setPositions(safePositions);
        setOrgUnits(safeOrgUnits);

        const activeUsers = safeUsers.filter((user) => !user.delete_at && !user.is_bot);
        setTeamUsers(activeUsers);

        const profileMap: Record<string, UserOrgProfile> = {};
        for (const profile of safeProfiles) {
            profileMap[profile.user_id] = profile;
        }

        const assignmentMap: Record<string, AssignmentState> = {};
        for (const user of activeUsers) {
            const profile = profileMap[user.id];
            assignmentMap[user.id] = {
                primary_position_id: profile?.primary_position_id || '',
                primary_duty_id: profile?.primary_duty_id || '',
                primary_org_unit_id: profile?.primary_org_unit_id || '',
            };
        }
        setUserProfiles(profileMap);
        setAssignments(assignmentMap);

        setSelectedUserIds(new Set());
        setBulkOrgUnitId('');
        setBulkDutyId('');
        setBulkPositionId('');
        setIsBulkSaving(false);
        clearBulkSaveSummaryTimer();
        setBulkSaveSummary(null);
    }, [clearBulkSaveSummaryTimer]);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError('');
                await loadTeamData(teamId);
            } catch (e) {
                setError(parseApiError(e));
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [loadTeamData, teamId]);

    useEffect(() => {
        setEditingPosition(null);
        setEditingDepartment(null);
        setPositionSearchKeyword('');
        setDepartmentSearchKeyword('');
        setUserSearchKeyword('');
        setDeleteConfirmTarget(null);
        clearSuccessMessageTimer();
        setSuccessMessage('');
        setSelectedUserIds(new Set());
        setBulkOrgUnitId('');
        setBulkDutyId('');
        setBulkPositionId('');
        setIsBulkSaving(false);
        clearBulkSaveSummaryTimer();
        setBulkSaveSummary(null);
    }, [clearSuccessMessageTimer, clearBulkSaveSummaryTimer, teamId]);

    useEffect(() => {
        return () => {
            clearSuccessMessageTimer();
            clearBulkSaveSummaryTimer();
        };
    }, [clearSuccessMessageTimer, clearBulkSaveSummaryTimer]);

    const createPosition = async () => {
        if (!teamId || !positionForm.name) {
            return;
        }

        try {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            await request(`/api/v4/teams/${teamId}/positions`, 'POST', {
                name: positionForm.name,
                rank: positionForm.rank,
            });
            setPositionForm({name: '', rank: 0, full_visibility: false});
            setShowPositionForm(false);
            await loadTeamData(teamId);
            setError('');
            showSuccessMessage(intl.formatMessage({id: 'admin.org_roles.saved', defaultMessage: '저장되었습니다'}));
        } catch (e) {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            setError(parseApiError(e));
        }
    };

    const createDepartment = async () => {
        if (!teamId || !departmentForm.name) {
            return;
        }

        try {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            await request(`/api/v4/teams/${teamId}/org-units`, 'POST', {
                name: departmentForm.name,
                type: 'department',
                parent_id: departmentForm.parent_id,
            });
            setDepartmentForm({name: '', parent_id: ''});
            setShowDepartmentForm(false);
            await loadTeamData(teamId);
            setError('');
            showSuccessMessage(intl.formatMessage({id: 'admin.org_roles.saved', defaultMessage: '저장되었습니다'}));
        } catch (e) {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            setError(parseApiError(e));
        }
    };

    const createDivision = async () => {
        if (!teamId || !divisionForm.name) {
            return;
        }

        try {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            await request(`/api/v4/teams/${teamId}/org-units`, 'POST', {
                name: divisionForm.name,
                type: 'division',
                parent_id: '',
            });
            setDivisionForm({name: ''});
            setShowDivisionForm(false);
            await loadTeamData(teamId);
            setError('');
            showSuccessMessage(intl.formatMessage({id: 'admin.org_roles.saved', defaultMessage: '저장되었습니다'}));
        } catch (e) {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            setError(parseApiError(e));
        }
    };

    const createDuty = async () => {
        if (!teamId || !dutyForm.name) {
            return;
        }

        try {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            await request(`/api/v4/teams/${teamId}/positions`, 'POST', {
                name: dutyForm.name,
                rank: dutyForm.rank,
                kind: 'duty',
                full_visibility: dutyForm.full_visibility,
            });
            setDutyForm({name: '', rank: 0, full_visibility: false});
            setShowDutyForm(false);
            await loadTeamData(teamId);
            setError('');
            showSuccessMessage(intl.formatMessage({id: 'admin.org_roles.saved', defaultMessage: '저장되었습니다'}));
        } catch (e) {
            clearSuccessMessageTimer();
            setSuccessMessage('');
            setError(parseApiError(e));
        }
    };

    // 부서 행의 소속 본부 select에서 바로 이관한다. 배정은 서버가 그대로 유지한다.
    const transferDepartment = async (department: OrgUnit, newParentId: string) => {
        if (!teamId || department.parent_id === newParentId) {
            return;
        }

        try {
            setProcessingActionKey(`department-transfer-${department.id}`);
            await request(`/api/v4/teams/${teamId}/org-units/${department.id}`, 'PUT', {
                code: department.code,
                name: department.name,
                type: department.type,
                parent_id: newParentId,
                active: department.active,
            });
            await loadTeamData(teamId);
            setError('');
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const updateAssignmentField = (userId: string, key: 'primary_position_id' | 'primary_duty_id' | 'primary_org_unit_id', value: string) => {
        setAssignments((prev) => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || emptyAssignmentState),
                [key]: value,
            },
        }));
    };

    const putUserOrgProfile = useCallback(async (userId: string, startedForTeamId: string) => {
        const assignment = assignments[userId];
        if (!assignment) {
            return;
        }

        const current = userProfiles[userId] || {
            team_id: startedForTeamId,
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
            primary_duty_id: assignment.primary_duty_id,
            primary_org_unit_id: assignment.primary_org_unit_id,
        };
        const savedProfile = await request<UserOrgProfile>(`/api/v4/teams/${startedForTeamId}/users/${userId}/org-profile`, 'PUT', payload);

        if (teamIdRef.current !== startedForTeamId) {
            // The admin switched teams while this request was in flight; discard the stale result.
            return;
        }

        setUserProfiles((prev) => ({...prev, [userId]: savedProfile}));
    }, [assignments, userProfiles]);

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
        if (!teamId || !editingPosition) {
            return;
        }

        try {
            setProcessingActionKey(`position-save-${editingPosition.id}`);
            await request(`/api/v4/teams/${teamId}/positions/${editingPosition.id}`, 'PUT', {
                code: editingPosition.code,
                name: editingPosition.name,
                rank: editingPosition.rank,
                active: editingPosition.active,
                full_visibility: editingPosition.full_visibility,
            });
            setEditingPosition(null);
            await loadTeamData(teamId);
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const deactivatePosition = async (position: PositionDefinition) => {
        if (!teamId || !position.active) {
            return;
        }

        try {
            setProcessingActionKey(`position-deactivate-${position.id}`);
            await request(`/api/v4/teams/${teamId}/positions/${position.id}`, 'PUT', {
                code: position.code,
                name: position.name,
                rank: position.rank,
                active: false,
                full_visibility: position.full_visibility,
            });
            if (editingPosition?.id === position.id) {
                setEditingPosition(null);
            }
            await loadTeamData(teamId);
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
        if (!teamId || !editingDepartment) {
            return;
        }

        try {
            setProcessingActionKey(`department-save-${editingDepartment.id}`);
            await request(`/api/v4/teams/${teamId}/org-units/${editingDepartment.id}`, 'PUT', {
                code: editingDepartment.code,
                name: editingDepartment.name,
                type: editingDepartment.type,
                parent_id: editingDepartment.parent_id,
                active: editingDepartment.active,
            });
            setEditingDepartment(null);
            await loadTeamData(teamId);
        } catch (e) {
            setError(parseApiError(e));
        } finally {
            setProcessingActionKey('');
        }
    };

    const deactivateDepartment = async (department: OrgUnit) => {
        if (!teamId || !department.active) {
            return;
        }

        try {
            setProcessingActionKey(`department-deactivate-${department.id}`);
            await request(`/api/v4/teams/${teamId}/org-units/${department.id}`, 'PUT', {
                code: department.code,
                name: department.name,
                type: department.type,
                parent_id: department.parent_id,
                active: false,
            });
            if (editingDepartment?.id === department.id) {
                setEditingDepartment(null);
            }
            await loadTeamData(teamId);
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

    // 직위(kind 미지정 포함)와 직책을 분리 — 기존 데이터는 kind 없음 = 직위
    const activePositions = useMemo(() => ensureArray<PositionDefinition>(positions).filter((position) => position.active && position.kind !== 'duty'), [positions]);
    const activeDuties = useMemo(() => ensureArray<PositionDefinition>(positions).filter((position) => position.active && position.kind === 'duty'), [positions]);
    const activeOrgUnits = useMemo(() => ensureArray<OrgUnit>(orgUnits).filter((orgUnit) => orgUnit.active), [orgUnits]);
    const activeDepartments = useMemo(() => activeOrgUnits.filter((orgUnit) => orgUnit.type === 'department'), [activeOrgUnits]);
    const activeDivisions = useMemo(() => activeOrgUnits.filter((orgUnit) => orgUnit.type === 'division'), [activeOrgUnits]);

    const divisionNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const division of activeDivisions) {
            map[division.id] = division.name;
        }
        return map;
    }, [activeDivisions]);

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

    // 부서를 본부별 그룹으로 묶는다. 활성 본부에 속하지 않은 부서는 미소속 그룹.
    const groupedDepartmentList = useMemo(() => {
        const groups: Array<{divisionId: string; divisionName: string | null; departments: OrgUnit[]}> = [];
        for (const division of activeDivisions) {
            const members = filteredDepartmentList.filter((department) => department.parent_id === division.id);
            groups.push({divisionId: division.id, divisionName: division.name, departments: members});
        }

        const unassigned = filteredDepartmentList.filter((department) => !divisionNameById[department.parent_id]);
        groups.push({divisionId: '', divisionName: null, departments: unassigned});
        return groups;
    }, [activeDivisions, divisionNameById, filteredDepartmentList]);

    // 필터에서 본부를 고르면 본부 직속 + 하위 부서 인원까지 묶어서 조회한다.
    const filterOrgUnitIdSet = useMemo(() => {
        if (!filterOrgUnitId) {
            return null;
        }

        const ids = new Set<string>([filterOrgUnitId]);
        if (divisionNameById[filterOrgUnitId]) {
            for (const department of activeDepartments) {
                if (department.parent_id === filterOrgUnitId) {
                    ids.add(department.id);
                }
            }
        }
        return ids;
    }, [activeDepartments, divisionNameById, filterOrgUnitId]);

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
                return !filterOrgUnitId && !filterDutyId && !filterPositionId;
            }

            const orgUnitMatched = !filterOrgUnitIdSet || filterOrgUnitIdSet.has(assignment.primary_org_unit_id);
            const dutyMatched = !filterDutyId || assignment.primary_duty_id === filterDutyId;
            const positionMatched = !filterPositionId || assignment.primary_position_id === filterPositionId;
            return orgUnitMatched && dutyMatched && positionMatched;
        });
    }, [assignments, filterDutyId, filterOrgUnitId, filterOrgUnitIdSet, filterPositionId, teamUsers, userSearchKeyword]);

    const dirtyUserIds = useMemo(() => {
        const result = new Set<string>();
        for (const user of teamUsers) {
            const current = assignments[user.id] || emptyAssignmentState;
            const saved = userProfiles[user.id];
            const savedPositionId = saved?.primary_position_id || '';
            const savedDutyId = saved?.primary_duty_id || '';
            const savedOrgUnitId = saved?.primary_org_unit_id || '';
            if (current.primary_position_id !== savedPositionId || current.primary_duty_id !== savedDutyId || current.primary_org_unit_id !== savedOrgUnitId) {
                result.add(user.id);
            }
        }
        return result;
    }, [assignments, userProfiles, teamUsers]);

    const toggleUserSelected = (userId: string) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const allVisibleSelected = filteredUsers.length > 0 && filteredUsers.every((user) => selectedUserIds.has(user.id));
    const someVisibleSelected = filteredUsers.some((user) => selectedUserIds.has(user.id));

    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
        }
    }, [someVisibleSelected, allVisibleSelected]);

    const toggleSelectAllVisible = () => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                filteredUsers.forEach((user) => next.delete(user.id));
            } else {
                filteredUsers.forEach((user) => next.add(user.id));
            }
            return next;
        });
    };

    const canApplyBulk = selectedUserIds.size > 0 && Boolean(bulkOrgUnitId || bulkDutyId || bulkPositionId);

    // 소속 선택지: 본부(직속 배정)와 부서를 optgroup으로 구분해 렌더링
    const renderOrgUnitGroupedOptions = () => (
        <>
            {activeDivisions.length > 0 && (
                <optgroup label={intl.formatMessage({id: 'admin.org_roles.assign_division_group', defaultMessage: '본부 직속'})}>
                    {activeDivisions.map((division) => (
                        <option
                            key={division.id}
                            value={division.id}
                        >
                            {division.name}
                        </option>
                    ))}
                </optgroup>
            )}
            <optgroup label={intl.formatMessage({id: 'admin.org_roles.assign_department_group', defaultMessage: '부서'})}>
                {activeDepartments.map((department) => (
                    <option
                        key={department.id}
                        value={department.id}
                    >
                        {department.name}
                    </option>
                ))}
            </optgroup>
        </>
    );

    const applyBulkToSelection = () => {
        if (!canApplyBulk) {
            return;
        }

        setAssignments((prev) => {
            const next = {...prev};
            selectedUserIds.forEach((userId) => {
                const current = next[userId] || emptyAssignmentState;
                next[userId] = {
                    primary_org_unit_id: bulkOrgUnitId || current.primary_org_unit_id,
                    primary_duty_id: bulkDutyId || current.primary_duty_id,
                    primary_position_id: bulkPositionId || current.primary_position_id,
                };
            });
            return next;
        });
    };

    const saveAllDirty = async () => {
        if (!teamId || dirtyUserIds.size === 0 || isBulkSaving) {
            return;
        }

        const startedForTeamId = teamId;
        setIsBulkSaving(true);
        clearBulkSaveSummaryTimer();
        setBulkSaveSummary(null);

        let successCount = 0;
        let failCount = 0;

        for (const userId of dirtyUserIds) {
            if (teamIdRef.current !== startedForTeamId) {
                break;
            }

            try {
                // eslint-disable-next-line no-await-in-loop -- sequential by design, see research.md decision #1
                await putUserOrgProfile(userId, startedForTeamId);
                successCount += 1;
                setError('');
            } catch (e) {
                failCount += 1;
                setError(parseApiError(e));
            }
        }

        if (teamIdRef.current === startedForTeamId) {
            setIsBulkSaving(false);
            showBulkSaveSummary({successCount, failCount});
        }
    };

    return (
        <div className='orgRoleManagement'>
            <div className='orgRoleManagement__contentBody'>
                {error && <div className='form-group has-error'>{error}</div>}
                {loading && (
                    <div className='form-group'>
                        <FormattedMessage
                            id='admin.org_roles.loading'
                            defaultMessage='불러오는 중...'
                        />
                    </div>
                )}

                <div className='form-group orgRoleManagement__buttonRow'>
                    <button
                        className='btn btn-primary'
                        onClick={toggleDivisionForm}
                    >
                        <FormattedMessage
                            id='admin.org_roles.add_division'
                            defaultMessage='본부 추가'
                        />
                    </button>
                    <button
                        className='btn btn-primary'
                        onClick={toggleDepartmentForm}
                    >
                        <FormattedMessage
                            id='admin.org_roles.add_department'
                            defaultMessage='부서 추가'
                        />
                    </button>
                    <button
                        className='btn btn-primary'
                        onClick={toggleDutyForm}
                    >
                        <FormattedMessage
                            id='admin.org_roles.add_duty'
                            defaultMessage='직책 추가'
                        />
                    </button>
                    <button
                        className='btn btn-primary'
                        onClick={togglePositionForm}
                    >
                        <FormattedMessage
                            id='admin.org_roles.add_position'
                            defaultMessage='직위 추가'
                        />
                    </button>
                </div>

                {successMessage && (
                    <div className='alert alert-success orgRoleManagement__successInline'>
                        <i className='fa fa-check'/>
                        {successMessage}
                    </div>
                )}

                {showDivisionForm && (
                    <div className='form-group orgRoleManagement__inlineForm'>
                        <input
                            className='form-control'
                            placeholder={intl.formatMessage({id: 'admin.org_roles.division_name_placeholder', defaultMessage: '본부명'})}
                            value={divisionForm.name}
                            onChange={(e) => setDivisionForm({name: e.target.value})}
                        />
                        <button
                            className='btn btn-primary'
                            onClick={createDivision}
                        >
                            <FormattedMessage
                                id='admin.org_roles.save_division'
                                defaultMessage='본부 저장'
                            />
                        </button>
                    </div>
                )}

                {showDepartmentForm && (
                    <div className='form-group orgRoleManagement__inlineForm'>
                        <input
                            className='form-control'
                            placeholder={intl.formatMessage({id: 'admin.org_roles.department_name_placeholder', defaultMessage: '부서명'})}
                            value={departmentForm.name}
                            onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                        />
                        <select
                            className='form-control'
                            aria-label={intl.formatMessage({id: 'admin.org_roles.department_parent_aria', defaultMessage: '소속 본부'})}
                            value={departmentForm.parent_id}
                            onChange={(e) => setDepartmentForm({...departmentForm, parent_id: e.target.value})}
                        >
                            <option value=''>{intl.formatMessage({id: 'admin.org_roles.division_none_option', defaultMessage: '소속 본부 없음'})}</option>
                            {activeDivisions.map((division) => (
                                <option
                                    key={division.id}
                                    value={division.id}
                                >
                                    {division.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className='btn btn-primary'
                            onClick={createDepartment}
                        >
                            <FormattedMessage
                                id='admin.org_roles.save_department'
                                defaultMessage='부서 저장'
                            />
                        </button>
                    </div>
                )}

                {showPositionForm && (
                    <div className='form-group orgRoleManagement__inlineForm'>
                        <input
                            className='form-control'
                            placeholder={intl.formatMessage({id: 'admin.org_roles.position_name_placeholder', defaultMessage: '직위명'})}
                            value={positionForm.name}
                            onChange={(e) => setPositionForm({...positionForm, name: e.target.value})}
                        />
                        <input
                            className='form-control'
                            type='number'
                            placeholder={intl.formatMessage({id: 'admin.org_roles.rank_placeholder', defaultMessage: '정렬 순서(rank)'})}
                            value={positionForm.rank}
                            onChange={(e) => setPositionForm({...positionForm, rank: Number(e.target.value)})}
                        />
                        <button
                            className='btn btn-primary'
                            onClick={createPosition}
                        >
                            <FormattedMessage
                                id='admin.org_roles.save_position'
                                defaultMessage='직위 저장'
                            />
                        </button>
                    </div>
                )}

                {showDutyForm && (
                    <div className='form-group orgRoleManagement__inlineForm'>
                        <input
                            className='form-control'
                            placeholder={intl.formatMessage({id: 'admin.org_roles.duty_name_placeholder', defaultMessage: '직책명'})}
                            value={dutyForm.name}
                            onChange={(e) => setDutyForm({...dutyForm, name: e.target.value})}
                        />
                        <input
                            className='form-control'
                            type='number'
                            placeholder={intl.formatMessage({id: 'admin.org_roles.rank_placeholder', defaultMessage: '정렬 순서(rank)'})}
                            value={dutyForm.rank}
                            onChange={(e) => setDutyForm({...dutyForm, rank: Number(e.target.value)})}
                        />
                        <label>
                            <input
                                type='checkbox'
                                checked={dutyForm.full_visibility}
                                onChange={(e) => setDutyForm({...dutyForm, full_visibility: e.target.checked})}
                            />
                            <FormattedMessage
                                id='admin.org_roles.full_visibility_label'
                                defaultMessage=' 보드 전체보기 권한'
                            />
                        </label>
                        <button
                            className='btn btn-primary'
                            onClick={createDuty}
                        >
                            <FormattedMessage
                                id='admin.org_roles.save_duty'
                                defaultMessage='직책 저장'
                            />
                        </button>
                    </div>
                )}

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.division_list_heading'
                        defaultMessage='본부 리스트'
                    />
                </h4>
                <div className='orgRoleManagement__tableWrap'>
                    <table
                        className='table table-striped orgRoleManagement__table orgRoleManagement__table--division'
                    >
                        <thead>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.division_name_column'
                                        defaultMessage='본부명'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.status_column'
                                        defaultMessage='상태'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.management_column'
                                        defaultMessage='관리'
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeDivisions.map((division) => {
                                const isEditing = editingDepartment?.id === division.id;
                                const isSaving = processingActionKey === `department-save-${division.id}`;
                                const isDeactivating = processingActionKey === `department-deactivate-${division.id}`;

                                return (
                                    <tr key={division.id}>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    className='form-control'
                                                    value={editingDepartment?.name || ''}
                                                    onChange={(e) => setEditingDepartment({...editingDepartment!, name: e.target.value})}
                                                />
                                            ) : (
                                                division.name
                                            )}
                                        </td>
                                        <td>
                                            {division.active ? (
                                                <FormattedMessage
                                                    id='admin.org_roles.status_active'
                                                    defaultMessage='활성'
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    id='admin.org_roles.status_inactive'
                                                    defaultMessage='비활성'
                                                />
                                            )}
                                        </td>
                                        <td className='orgRoleManagement__actionCell'>
                                            {isEditing ? (
                                                <div className='orgRoleManagement__actionButtons'>
                                                    <button
                                                        className='btn btn-primary btn-sm'
                                                        onClick={saveEditedDepartment}
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving ? (
                                                            <FormattedMessage
                                                                id='admin.org_roles.saving'
                                                                defaultMessage='저장 중...'
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                id='admin.org_roles.save'
                                                                defaultMessage='저장'
                                                            />
                                                        )}
                                                    </button>
                                                    <button
                                                        className='btn btn-tertiary btn-sm'
                                                        onClick={() => setEditingDepartment(null)}
                                                    >
                                                        <FormattedMessage
                                                            id='admin.org_roles.cancel'
                                                            defaultMessage='취소'
                                                        />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='orgRoleManagement__actionButtons'>
                                                    <button
                                                        className='btn btn-tertiary btn-sm'
                                                        onClick={() => startEditDepartment(division)}
                                                        disabled={isDeactivating}
                                                    >
                                                        <FormattedMessage
                                                            id='admin.org_roles.edit'
                                                            defaultMessage='수정'
                                                        />
                                                    </button>
                                                    <button
                                                        className='btn btn-danger btn-sm'
                                                        onClick={() => openDeleteConfirmForDepartment(division)}
                                                        disabled={isDeactivating}
                                                    >
                                                        {isDeactivating ? (
                                                            <FormattedMessage
                                                                id='admin.org_roles.deleting'
                                                                defaultMessage='삭제 중...'
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                id='admin.org_roles.delete'
                                                                defaultMessage='삭제'
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {activeDivisions.length === 0 && (
                                <tr>
                                    <td colSpan={3}>
                                        <div className='help-text'>
                                            <FormattedMessage
                                                id='admin.org_roles.no_division_results'
                                                defaultMessage='등록된 본부가 없습니다.'
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.department_list_heading'
                        defaultMessage='부서 리스트'
                    />
                </h4>
                <div className='form-group'>
                    <input
                        className='form-control'
                        placeholder={intl.formatMessage({id: 'admin.org_roles.department_search_placeholder', defaultMessage: '부서 검색 (이름)'})}
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
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.department_name_column'
                                        defaultMessage='부서명'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.division_column'
                                        defaultMessage='소속 본부'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.status_column'
                                        defaultMessage='상태'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.management_column'
                                        defaultMessage='관리'
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedDepartmentList.map((group) => (
                                <React.Fragment key={group.divisionId || 'unassigned'}>
                                    <tr className='orgRoleManagement__groupHeader'>
                                        <td colSpan={4}>
                                            {group.divisionName ?? intl.formatMessage({id: 'admin.org_roles.division_unassigned_group', defaultMessage: '미소속'})}
                                        </td>
                                    </tr>
                                    {group.departments.map((department, departmentIndex) => {
                                        const isEditing = editingDepartment?.id === department.id;
                                        const isSaving = processingActionKey === `department-save-${department.id}`;
                                        const isDeactivating = processingActionKey === `department-deactivate-${department.id}`;
                                        const isTransferring = processingActionKey === `department-transfer-${department.id}`;

                                        return (
                                            <tr
                                                key={department.id}
                                                className={departmentIndex % 2 === 1 ? 'orgRoleManagement__rowAlt' : ''}
                                            >
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
                                                <td>
                                                    <select
                                                        className='form-control'
                                                        aria-label={intl.formatMessage({id: 'admin.org_roles.department_parent_aria', defaultMessage: '소속 본부'})}
                                                        value={divisionNameById[department.parent_id] ? department.parent_id : ''}
                                                        disabled={isTransferring}
                                                        onChange={(e) => transferDepartment(department, e.target.value)}
                                                    >
                                                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.division_none_option', defaultMessage: '소속 본부 없음'})}</option>
                                                        {activeDivisions.map((division) => (
                                                            <option
                                                                key={division.id}
                                                                value={division.id}
                                                            >
                                                                {division.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    {department.active ? (
                                                        <FormattedMessage
                                                            id='admin.org_roles.status_active'
                                                            defaultMessage='활성'
                                                        />
                                                    ) : (
                                                        <FormattedMessage
                                                            id='admin.org_roles.status_inactive'
                                                            defaultMessage='비활성'
                                                        />
                                                    )}
                                                </td>
                                                <td className='orgRoleManagement__actionCell'>
                                                    {isEditing ? (
                                                        <div className='orgRoleManagement__actionButtons'>
                                                            <button
                                                                className='btn btn-primary btn-sm'
                                                                onClick={saveEditedDepartment}
                                                                disabled={isSaving}
                                                            >
                                                                {isSaving ? (
                                                                    <FormattedMessage
                                                                        id='admin.org_roles.saving'
                                                                        defaultMessage='저장 중...'
                                                                    />
                                                                ) : (
                                                                    <FormattedMessage
                                                                        id='admin.org_roles.save'
                                                                        defaultMessage='저장'
                                                                    />
                                                                )}
                                                            </button>
                                                            <button
                                                                className='btn btn-tertiary btn-sm'
                                                                onClick={() => setEditingDepartment(null)}
                                                            >
                                                                <FormattedMessage
                                                                    id='admin.org_roles.cancel'
                                                                    defaultMessage='취소'
                                                                />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className='orgRoleManagement__actionButtons'>
                                                            <button
                                                                className='btn btn-tertiary btn-sm'
                                                                onClick={() => startEditDepartment(department)}
                                                                disabled={isDeactivating}
                                                            >
                                                                <FormattedMessage
                                                                    id='admin.org_roles.edit'
                                                                    defaultMessage='수정'
                                                                />
                                                            </button>
                                                            <button
                                                                className='btn btn-danger btn-sm'
                                                                onClick={() => openDeleteConfirmForDepartment(department)}
                                                                disabled={isDeactivating}
                                                            >
                                                                {isDeactivating ? (
                                                                    <FormattedMessage
                                                                        id='admin.org_roles.deleting'
                                                                        defaultMessage='삭제 중...'
                                                                    />
                                                                ) : (
                                                                    <FormattedMessage
                                                                        id='admin.org_roles.delete'
                                                                        defaultMessage='삭제'
                                                                    />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                            {filteredDepartmentList.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <div className='help-text'>
                                            <FormattedMessage
                                                id='admin.org_roles.no_department_results'
                                                defaultMessage='검색 조건에 해당하는 부서가 없습니다.'
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.duty_list_heading'
                        defaultMessage='직책 리스트'
                    />
                </h4>
                <div className='orgRoleManagement__tableWrap'>
                    <table
                        className='table table-striped orgRoleManagement__table orgRoleManagement__table--duty'
                    >
                        <thead>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.duty_name_column'
                                        defaultMessage='직책명'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.rank_column'
                                        defaultMessage='정렬순서'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.status_column'
                                        defaultMessage='상태'
                                    />
                                </th>
                                <th title={intl.formatMessage({id: 'admin.org_roles.full_visibility_column_title', defaultMessage: '체크된 직위를 가진 사용자는 부서/직위 구분 없이 모든 보드를 봅니다'})}>
                                    <FormattedMessage
                                        id='admin.org_roles.full_visibility_column'
                                        defaultMessage='보드 전체보기'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.management_column'
                                        defaultMessage='관리'
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeDuties.map((duty) => {
                                const isEditing = editingPosition?.id === duty.id;
                                const isSaving = processingActionKey === `position-save-${duty.id}`;
                                const isDeactivating = processingActionKey === `position-deactivate-${duty.id}`;

                                return (
                                    <tr key={duty.id}>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    className='form-control'
                                                    value={editingPosition?.name || ''}
                                                    onChange={(e) => setEditingPosition({...editingPosition!, name: e.target.value})}
                                                />
                                            ) : (
                                                duty.name
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
                                                duty.rank
                                            )}
                                        </td>
                                        <td>
                                            {duty.active ? (
                                                <FormattedMessage
                                                    id='admin.org_roles.status_active'
                                                    defaultMessage='활성'
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    id='admin.org_roles.status_inactive'
                                                    defaultMessage='비활성'
                                                />
                                            )}
                                        </td>
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
                                                    checked={duty.full_visibility}
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
                                                        {isSaving ? (
                                                            <FormattedMessage
                                                                id='admin.org_roles.saving'
                                                                defaultMessage='저장 중...'
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                id='admin.org_roles.save'
                                                                defaultMessage='저장'
                                                            />
                                                        )}
                                                    </button>
                                                    <button
                                                        className='btn btn-tertiary btn-sm'
                                                        onClick={() => setEditingPosition(null)}
                                                    >
                                                        <FormattedMessage
                                                            id='admin.org_roles.cancel'
                                                            defaultMessage='취소'
                                                        />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='orgRoleManagement__actionButtons'>
                                                    <button
                                                        className='btn btn-tertiary btn-sm'
                                                        onClick={() => startEditPosition(duty)}
                                                        disabled={isDeactivating}
                                                    >
                                                        <FormattedMessage
                                                            id='admin.org_roles.edit'
                                                            defaultMessage='수정'
                                                        />
                                                    </button>
                                                    <button
                                                        className='btn btn-danger btn-sm'
                                                        onClick={() => openDeleteConfirmForPosition(duty)}
                                                        disabled={isDeactivating}
                                                    >
                                                        {isDeactivating ? (
                                                            <FormattedMessage
                                                                id='admin.org_roles.deleting'
                                                                defaultMessage='삭제 중...'
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                id='admin.org_roles.delete'
                                                                defaultMessage='삭제'
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {activeDuties.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className='help-text'>
                                            <FormattedMessage
                                                id='admin.org_roles.no_duty_results'
                                                defaultMessage='등록된 직책이 없습니다.'
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.position_list_heading'
                        defaultMessage='직위 리스트'
                    />
                </h4>
                <div className='form-group'>
                    <input
                        className='form-control'
                        placeholder={intl.formatMessage({id: 'admin.org_roles.position_search_placeholder', defaultMessage: '직위 검색 (이름)'})}
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
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.position_name_column'
                                        defaultMessage='직위명'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.rank_column'
                                        defaultMessage='정렬순서'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.status_column'
                                        defaultMessage='상태'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.management_column'
                                        defaultMessage='관리'
                                    />
                                </th>
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
                                        <td>
                                            {position.active ? (
                                                <FormattedMessage
                                                    id='admin.org_roles.status_active'
                                                    defaultMessage='활성'
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    id='admin.org_roles.status_inactive'
                                                    defaultMessage='비활성'
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
                                                        {isSaving ? (
                                                            <FormattedMessage
                                                                id='admin.org_roles.saving'
                                                                defaultMessage='저장 중...'
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                id='admin.org_roles.save'
                                                                defaultMessage='저장'
                                                            />
                                                        )}
                                                    </button>
                                                    <button
                                                        className='btn btn-tertiary btn-sm'
                                                        onClick={() => setEditingPosition(null)}
                                                    >
                                                        <FormattedMessage
                                                            id='admin.org_roles.cancel'
                                                            defaultMessage='취소'
                                                        />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='orgRoleManagement__actionButtons'>
                                                    <button
                                                        className='btn btn-tertiary btn-sm'
                                                        onClick={() => startEditPosition(position)}
                                                        disabled={isDeactivating}
                                                    >
                                                        <FormattedMessage
                                                            id='admin.org_roles.edit'
                                                            defaultMessage='수정'
                                                        />
                                                    </button>
                                                    <button
                                                        className='btn btn-danger btn-sm'
                                                        onClick={() => openDeleteConfirmForPosition(position)}
                                                        disabled={isDeactivating}
                                                    >
                                                        {isDeactivating ? (
                                                            <FormattedMessage
                                                                id='admin.org_roles.deleting'
                                                                defaultMessage='삭제 중...'
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                id='admin.org_roles.delete'
                                                                defaultMessage='삭제'
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPositionList.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <div className='help-text'>
                                            <FormattedMessage
                                                id='admin.org_roles.no_position_results'
                                                defaultMessage='검색 조건에 해당하는 직위가 없습니다.'
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.filter_heading'
                        defaultMessage='필터'
                    />
                </h4>
                <div className='form-group orgRoleManagement__filterRow'>
                    <select
                        className='form-control'
                        value={filterOrgUnitId}
                        onChange={(e) => setFilterOrgUnitId(e.target.value)}
                    >
                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.filter_all_departments', defaultMessage: '전체 부서'})}</option>
                        {renderOrgUnitGroupedOptions()}
                    </select>
                    <select
                        className='form-control'
                        value={filterDutyId}
                        onChange={(e) => setFilterDutyId(e.target.value)}
                    >
                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.filter_all_duties', defaultMessage: '전체 직책'})}</option>
                        {activeDuties.map((duty) => (
                            <option
                                key={duty.id}
                                value={duty.id}
                            >
                                {duty.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className='form-control'
                        value={filterPositionId}
                        onChange={(e) => setFilterPositionId(e.target.value)}
                    >
                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.filter_all_positions', defaultMessage: '전체 직위'})}</option>
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
                            setFilterDutyId('');
                            setFilterPositionId('');
                        }}
                    >
                        <FormattedMessage
                            id='admin.org_roles.filter_reset'
                            defaultMessage='초기화'
                        />
                    </button>
                </div>

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.bulk_heading'
                        defaultMessage='일괄 지정'
                    />
                </h4>
                <div className='form-group orgRoleManagement__bulkApplyRow'>
                    <select
                        className='form-control'
                        value={bulkOrgUnitId}
                        onChange={(e) => setBulkOrgUnitId(e.target.value)}
                    >
                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.bulk_department_no_op', defaultMessage: '부서 변경 안 함'})}</option>
                        {renderOrgUnitGroupedOptions()}
                    </select>
                    <select
                        className='form-control'
                        value={bulkDutyId}
                        onChange={(e) => setBulkDutyId(e.target.value)}
                    >
                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.bulk_duty_no_op', defaultMessage: '직책 변경 안 함'})}</option>
                        {activeDuties.map((duty) => (
                            <option
                                key={duty.id}
                                value={duty.id}
                            >
                                {duty.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className='form-control'
                        value={bulkPositionId}
                        onChange={(e) => setBulkPositionId(e.target.value)}
                    >
                        <option value=''>{intl.formatMessage({id: 'admin.org_roles.bulk_position_no_op', defaultMessage: '직위 변경 안 함'})}</option>
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
                        onClick={applyBulkToSelection}
                        disabled={!canApplyBulk}
                    >
                        <FormattedMessage
                            id='admin.org_roles.bulk_apply'
                            defaultMessage='선택 적용'
                        />
                    </button>
                    <span className='help-text'>
                        <FormattedMessage
                            id='admin.org_roles.bulk_selected_count'
                            defaultMessage='선택된 사용자: {count}명'
                            values={{count: selectedUserIds.size}}
                        />
                    </span>
                </div>

                <div className='form-group orgRoleManagement__bulkSaveRow'>
                    <button
                        className='btn btn-primary'
                        onClick={() => {
                            saveAllDirty();
                        }}
                        disabled={dirtyUserIds.size === 0 || isBulkSaving}
                    >
                        {isBulkSaving ? (
                            <FormattedMessage
                                id='admin.org_roles.saving'
                                defaultMessage='저장 중...'
                            />
                        ) : (
                            <FormattedMessage
                                id='admin.org_roles.save'
                                defaultMessage='저장'
                            />
                        )}
                    </button>
                    {bulkSaveSummary && (
                        <span className='orgRoleManagement__bulkSaveSummary'>
                            {bulkSaveSummary.failCount === 0 ? (
                                <FormattedMessage
                                    id='admin.org_roles.save_summary_success'
                                    defaultMessage='{count}명 저장되었습니다'
                                    values={{count: bulkSaveSummary.successCount}}
                                />
                            ) : (
                                <FormattedMessage
                                    id='admin.org_roles.save_summary_with_failures'
                                    defaultMessage='{successCount}명 저장 완료, {failCount}명 실패'
                                    values={{successCount: bulkSaveSummary.successCount, failCount: bulkSaveSummary.failCount}}
                                />
                            )}
                        </span>
                    )}
                </div>

                <h4>
                    <FormattedMessage
                        id='admin.org_roles.user_list_heading'
                        defaultMessage='사용자 리스트'
                    />
                </h4>
                <div className='form-group'>
                    <input
                        className='form-control'
                        placeholder={intl.formatMessage({id: 'admin.org_roles.user_search_placeholder', defaultMessage: '사용자 검색 (이름/username)'})}
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
                                <th>
                                    <input
                                        ref={headerCheckboxRef}
                                        type='checkbox'
                                        aria-label={intl.formatMessage({id: 'admin.org_roles.select_all_aria', defaultMessage: '전체 선택'})}
                                        checked={allVisibleSelected}
                                        onChange={toggleSelectAllVisible}
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.user_column'
                                        defaultMessage='사용자'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.department_column'
                                        defaultMessage='부서'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.duty_column'
                                        defaultMessage='직책'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='admin.org_roles.position_column'
                                        defaultMessage='직위'
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => {
                                const assignment = assignments[user.id] || emptyAssignmentState;
                                const displayName = getOrgRoleUserDisplayName(user);
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <input
                                                type='checkbox'
                                                aria-label={intl.formatMessage({id: 'admin.org_roles.select_user_aria', defaultMessage: '{name} 선택'}, {name: displayName})}
                                                checked={selectedUserIds.has(user.id)}
                                                onChange={() => toggleUserSelected(user.id)}
                                            />
                                        </td>
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
                                                <option value=''>{intl.formatMessage({id: 'admin.org_roles.department_unassigned', defaultMessage: '부서 미지정'})}</option>
                                                {renderOrgUnitGroupedOptions()}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className='form-control'
                                                value={assignment.primary_duty_id}
                                                onChange={(e) => updateAssignmentField(user.id, 'primary_duty_id', e.target.value)}
                                            >
                                                <option value=''>{intl.formatMessage({id: 'admin.org_roles.duty_unassigned', defaultMessage: '직책 미지정'})}</option>
                                                {activeDuties.map((duty) => (
                                                    <option
                                                        key={duty.id}
                                                        value={duty.id}
                                                    >
                                                        {duty.name}
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
                                                <option value=''>{intl.formatMessage({id: 'admin.org_roles.position_unassigned', defaultMessage: '직위 미지정'})}</option>
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
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className='help-text'>
                                            <FormattedMessage
                                                id='admin.org_roles.no_user_results'
                                                defaultMessage='필터 조건에 해당하는 사용자가 없습니다.'
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <ConfirmModal
                    id='org-role-delete-confirm-modal'
                    show={Boolean(deleteConfirmTarget)}
                    title={
                        <FormattedMessage
                            id='admin.org_roles.delete_confirm_title'
                            defaultMessage='삭제 확인'
                        />
                    }
                    message={
                        <div className='orgRoleManagement__deleteConfirmMessage'>
                            {deleteConfirmTarget && (
                                <p>
                                    <FormattedMessage
                                        id='admin.org_roles.delete_confirm_message'
                                        defaultMessage="''{name}'' 항목을 삭제하시겠습니까?"
                                        values={{name: deleteConfirmTarget.item.name}}
                                    />
                                </p>
                            )}
                        </div>
                    }
                    confirmButtonClass='btn btn-danger'
                    confirmButtonText={
                        isDeleteConfirming ? (
                            <FormattedMessage
                                id='admin.org_roles.deleting'
                                defaultMessage='삭제 중...'
                            />
                        ) : (
                            <FormattedMessage
                                id='admin.org_roles.delete'
                                defaultMessage='삭제'
                            />
                        )
                    }
                    cancelButtonText={
                        <FormattedMessage
                            id='admin.org_roles.cancel'
                            defaultMessage='취소'
                        />
                    }
                    confirmDisabled={isDeleteConfirming}
                    modalClass='orgRoleManagement__deleteConfirmModal'
                    onConfirm={() => {
                        confirmDelete();
                    }}
                    onCancel={closeDeleteConfirm}
                />
            </div>
        </div>
    );
};

export default OrgRoleManagementBody;
