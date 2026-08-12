// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FormattedMessage, defineMessage, useIntl} from 'react-intl';

import type {Team} from '@mattermost/types/teams';

import AdminHeader from 'components/widgets/admin_console/admin_header';
import AdminPanel from 'components/widgets/admin_console/admin_panel';

import OrgRoleManagementBody from './org_role_management_body';

import './org_role_management.scss';

async function request<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(await response.text() || response.statusText);
    }

    return response.json() as Promise<T>;
}

function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? value : [];
}

const OrgRoleManagement = () => {
    const intl = useIntl();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');

    const selectedTeam = useMemo(() => teams.find((team) => team.id === selectedTeamId), [teams, selectedTeamId]);

    const loadTeams = useCallback(async () => {
        const list = ensureArray<Team>(await request<unknown>('/api/v4/teams?page=0&per_page=200'));
        setTeams(list);
        if (list.length > 0) {
            setSelectedTeamId((currentTeamId) => currentTeamId || list[0].id);
        }
    }, []);

    useEffect(() => {
        loadTeams();
    }, [loadTeams]);

    return (
        <div className='wrapper--fixed orgRoleManagement'>
            <AdminHeader>
                <FormattedMessage
                    id='admin.org_roles.title'
                    defaultMessage='Department/Position Management'
                />
            </AdminHeader>
            <div className='admin-console__wrapper'>
                <div className='admin-console__content'>
                    <AdminPanel
                        id='org_roles'
                        title={defineMessage({id: 'admin.org_roles.panel_title', defaultMessage: 'Department/Position Assignment'})}
                        subtitle={defineMessage({id: 'admin.org_roles.panel_subtitle', defaultMessage: 'Add positions and departments, and assign them to users.'})}
                    >
                        <div className='orgRoleManagement__contentBody'>
                            <div className='form-group'>
                                <label htmlFor='org-role-team'>
                                    <FormattedMessage
                                        id='admin.org_roles.team'
                                        defaultMessage='Team'
                                    />
                                </label>
                                <select
                                    id='org-role-team'
                                    className='form-control'
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                >
                                    <option value=''>{intl.formatMessage({id: 'admin.org_roles.select_team_placeholder', defaultMessage: 'Select a team'})}</option>
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
                        </div>

                        {selectedTeamId && (
                            <OrgRoleManagementBody teamId={selectedTeamId}/>
                        )}

                        {selectedTeam && (
                            <div className='orgRoleManagement__contentBody help-text'>
                                <FormattedMessage
                                    id='admin.org_roles.selected_team'
                                    defaultMessage='Selected team: {teamName}'
                                    values={{teamName: selectedTeam.display_name}}
                                />
                            </div>
                        )}
                    </AdminPanel>
                </div>
            </div>
        </div>
    );
};

export default OrgRoleManagement;
