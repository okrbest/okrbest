// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {useHistory} from 'react-router-dom';

import {
    CheckIcon,
    MessagePlusOutlineIcon,
    PlusIcon,
} from '@mattermost/compass-icons/components';
import type {Team} from '@mattermost/types/teams';

import {Permissions} from 'mattermost-redux/constants';
import {getTeamsUnreadStatuses} from 'mattermost-redux/selectors/entities/channels';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {get} from 'mattermost-redux/selectors/entities/preferences';
import {haveISystemPermission} from 'mattermost-redux/selectors/entities/roles_helpers';
import {getCurrentTeamId, getJoinableTeamIds, getMyTeams} from 'mattermost-redux/selectors/entities/teams';

import {switchTeam} from 'actions/team_actions';
import {getCurrentLocale} from 'selectors/i18n';

import * as Menu from 'components/menu';
import TeamIcon from 'components/widgets/team_icon/team_icon';

import {Preferences} from 'utils/constants';
import {useCurrentProduct} from 'utils/products';
import {filterAndSortTeamsByDisplayName} from 'utils/team_utils';
import * as Utils from 'utils/utils';

import './team_list_menu.scss';

import type {GlobalState} from 'types/store';

// 레일의 현재 팀 버튼과 채널 사이드바의 팀명 드롭다운이 공유하는 "내 팀" 목록.
// 두 진입점이 같은 목록·같은 전환 동작을 갖도록 한 곳에서 렌더한다.
export default function TeamListMenu() {
    const dispatch = useDispatch();
    const {formatMessage} = useIntl();

    const myTeams = useSelector(getMyTeams);
    const currentTeamId = useSelector(getCurrentTeamId);
    const locale = useSelector(getCurrentLocale);
    const teamsOrder = useSelector((state: GlobalState) => get(state, Preferences.TEAMS_ORDER, '', ''));
    const [unreadTeams] = useSelector(getTeamsUnreadStatuses);

    const config = useSelector(getConfig);
    const experimentalPrimaryTeam = config.ExperimentalPrimaryTeam;
    const joinableTeams = useSelector(getJoinableTeamIds);
    const canJoinAnotherTeam = !experimentalPrimaryTeam && joinableTeams?.length > 0;
    const canCreateTeam = useSelector((state: GlobalState) => haveISystemPermission(state, {permission: Permissions.CREATE_TEAM}));

    const sortedTeams = filterAndSortTeamsByDisplayName(myTeams, locale, teamsOrder);

    // Boards 등 제품 화면에서는 URL이 팀에 묶여 있지 않으므로 팀 객체를 넘겨
    // 현재 팀만 바꾼다(제품에 머문다). 채널에서는 URL 이동으로 전환한다.
    const currentProduct = useCurrentProduct();

    const handleTeamClick = useCallback((team: Team) => {
        if (team.id !== currentTeamId) {
            dispatch(switchTeam(`/${team.name}`, currentProduct ? team : undefined));
        }
    }, [dispatch, currentTeamId, currentProduct]);

    return (
        <>
            <Menu.Title>
                <FormattedMessage
                    id='sidebarLeft.teamMenu.myTeams'
                    defaultMessage='My teams'
                />
            </Menu.Title>
            {sortedTeams.map((team) => (
                <Menu.Item
                    key={team.id}
                    id={`teamListMenuItem-${team.id}`}
                    className='teamListMenuItem'
                    aria-current={team.id === currentTeamId ? 'true' : undefined}
                    onClick={() => handleTeamClick(team)}
                    leadingElement={(
                        <span
                            className='teamListMenuItem__icon'
                            aria-hidden='true'
                        >
                            <TeamIcon
                                content={team.display_name}
                                url={Utils.imageURLForTeam(team)}
                                size='xxs'
                            />
                            {team.id !== currentTeamId && unreadTeams.has(team.id) && (
                                <span
                                    className='teamListMenuItem__unread'
                                    data-testid={`teamListMenuItem-unread-${team.id}`}
                                />
                            )}
                        </span>
                    )}
                    labels={<span className='teamListMenuItem__name'>{team.display_name}</span>}
                    trailingElements={team.id === currentTeamId && (
                        <CheckIcon
                            size={18}
                            data-testid={`teamListMenuItem-check-${team.id}`}
                            aria-label={formatMessage({
                                id: 'sidebarLeft.teamMenu.currentTeam',
                                defaultMessage: 'Current team',
                            })}
                        />
                    )}
                />
            ))}
            {(canJoinAnotherTeam || canCreateTeam) && <Menu.Separator/>}
            {canJoinAnotherTeam && <JoinAnotherTeamMenuItem/>}
            {canCreateTeam && <CreateTeamMenuItem/>}
        </>
    );
}

export function JoinAnotherTeamMenuItem() {
    const history = useHistory();

    const handleClick = useCallback(() => {
        history.push('/select_team');
    }, [history]);

    return (
        <Menu.Item
            leadingElement={(
                <MessagePlusOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.joinAnotherTeamMenuItem.primaryLabel'
                    defaultMessage='Join another team'
                />
            )}
        />
    );
}

export function CreateTeamMenuItem() {
    const history = useHistory();

    const handleClick = useCallback(() => {
        history.push('/create_team');
    }, [history]);

    return (
        <Menu.Item
            leadingElement={(
                <PlusIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.createTeamMenuItem.primaryLabel'
                    defaultMessage='Create a team'
                />
            )}
        />
    );
}
