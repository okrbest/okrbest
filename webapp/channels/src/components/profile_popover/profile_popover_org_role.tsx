// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';

import {Client4} from 'mattermost-redux/client';
import {getTeamMember} from 'mattermost-redux/selectors/entities/teams';

import type {GlobalState} from 'types/store';

type Props = {
    teamId: string;
    userId: string;
    isBot?: boolean;
}

type Summary = {
    divisionName: string | null;
    departmentName: string | null;
    dutyName: string | null;
    positionName: string | null;
}

// Shows the admin-assigned department/position for a teammate, replacing the
// old free-text user.position display (FR-004). Deliberately fetches via
// Client4 directly instead of a redux action/selector: this is
// presentation-only derived data with a single consumer per surface, so a
// dedicated redux slice would be premature (see research.md §3).
const ProfilePopoverOrgRole = ({teamId, userId, isBot}: Props) => {
    const {formatMessage} = useIntl();

    // Only a team member can see the "is this teammate hidden because they
    // aren't on this team" distinction (FR-003) — reuses the membership data
    // profile_popover.tsx already loads via getMembershipForEntities, so no
    // extra fetch is needed just to decide whether to show this line.
    const teamMember = useSelector((state: GlobalState) => getTeamMember(state, teamId, userId));

    const [summary, setSummary] = useState<Summary | null>(null);

    useEffect(() => {
        setSummary(null);

        if (!teamId || !userId || isBot || !teamMember) {
            return undefined;
        }

        let isMounted = true;

        Client4.getUserOrgProfileSummary(teamId, userId).then((result) => {
            if (!isMounted) {
                return;
            }
            setSummary({
                divisionName: result.division_name,
                departmentName: result.department_name,
                dutyName: result.duty_name,
                positionName: result.position_name,
            });
        }).catch(() => {
            // Feature disabled (501), no permission (403), or target isn't a
            // team member (404): nothing to show, no error UI (FR-009).
        });

        return () => {
            isMounted = false;
        };
    }, [teamId, userId, isBot, teamMember]);

    if (!summary) {
        return null;
    }

    // 계층 표기: 본부 소속 부서는 "본부 > 부서", 본부 직속은 "본부", 무소속 부서는 "부서"
    let departmentLabel: string;
    if (summary.divisionName && summary.departmentName) {
        departmentLabel = `${summary.divisionName} > ${summary.departmentName}`;
    } else if (summary.divisionName) {
        departmentLabel = summary.divisionName;
    } else {
        departmentLabel = summary.departmentName || formatMessage({
            id: 'profile_popover.org_role.department_unassigned',
            defaultMessage: '부서 미지정',
        });
    }
    const positionLabel = summary.positionName || formatMessage({
        id: 'profile_popover.org_role.position_unassigned',
        defaultMessage: '직위 미지정',
    });

    // 직책은 배정된 경우에만 세그먼트를 끼워 넣는다(미지정 라벨 없음).
    const segments = [departmentLabel];
    if (summary.dutyName) {
        segments.push(summary.dutyName);
    }
    segments.push(positionLabel);

    return (
        <p className='user-profile-popover__non-heading'>
            {segments.join(' · ')}
        </p>
    );
};

export default ProfilePopoverOrgRole;
