// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useSelector} from 'react-redux';

import {ChevronDownIcon} from '@mattermost/compass-icons/components';

import {getTeamsUnreadStatuses} from 'mattermost-redux/selectors/entities/channels';
import {get} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentTeam, getMyTeams} from 'mattermost-redux/selectors/entities/teams';

import {getCurrentLocale} from 'selectors/i18n';

import * as Menu from 'components/menu';
import TeamIcon from 'components/widgets/team_icon/team_icon';
import TeamListMenu from 'components/widgets/team_list_menu/team_list_menu';

import {Preferences} from 'utils/constants';
import {filterAndSortTeamsByDisplayName} from 'utils/team_utils';
import * as Utils from 'utils/utils';

import type {GlobalState} from 'types/store';

// 레일 최상단의 현재 팀 버튼 — 채널·제품(Boards·Playbooks) 어느 화면에서나
// 보이는 팀 전환 진입점. 클릭하면 팀명 드롭다운과 같은 팀 목록 메뉴가 열린다.
// "여러 팀 중 하나를 보고 있다"를 한눈에 알리기 위해 ① 아바타 우하단 셰브론
// 배지 ② 제품 버튼과 같은 문법의 라벨 ③ 다른 팀 아바타를 뒤에 겹친 스택
// ④ 다른 팀 unread 점 배지를 함께 보여준다.
export default function RailTeamButton() {
    const {formatMessage} = useIntl();
    const currentTeam = useSelector(getCurrentTeam);
    const myTeams = useSelector(getMyTeams);
    const locale = useSelector(getCurrentLocale);
    const teamsOrder = useSelector((state: GlobalState) => get(state, Preferences.TEAMS_ORDER, '', ''));
    const [unreadTeams] = useSelector(getTeamsUnreadStatuses);

    if (!currentTeam) {
        return null;
    }

    const otherTeams = filterAndSortTeamsByDisplayName(myTeams, locale, teamsOrder).
        filter((team) => team.id !== currentTeam.id);
    const stackedTeam = otherTeams[0];
    const hasOtherTeamUnread = otherTeams.some((team) => unreadTeams.has(team.id));

    return (
        <Menu.Container
            menuButton={{
                id: 'railTeamButton',
                class: 'rail-team-button',
                'aria-label': formatMessage({
                    id: 'team_sidebar.railTeamButton.ariaLabel',
                    defaultMessage: 'Current team: {teamName}. Switch teams',
                }, {teamName: currentTeam.display_name}),
                children: (
                    <>
                        <span className='rail-team-button__avatar'>
                            {stackedTeam && (
                                <span
                                    className='rail-team-button__stack'
                                    data-testid='railTeamButton-stack'
                                    aria-hidden='true'
                                >
                                    <TeamIcon
                                        content={stackedTeam.display_name}
                                        url={Utils.imageURLForTeam(stackedTeam)}
                                        size='xxs'
                                    />
                                </span>
                            )}
                            <span className='rail-team-button__current'>
                                <TeamIcon
                                    content={currentTeam.display_name}
                                    url={Utils.imageURLForTeam(currentTeam)}
                                    size='sm'
                                />
                            </span>
                            <span
                                className='rail-team-button__chevron'
                                data-testid='railTeamButton-chevron'
                                aria-hidden='true'
                            >
                                <ChevronDownIcon size={12}/>
                            </span>
                            {hasOtherTeamUnread && (
                                <span
                                    className='rail-team-button__unread'
                                    data-testid='railTeamButton-unreadDot'
                                    aria-hidden='true'
                                />
                            )}
                        </span>
                        <span className='rail-team-button__label'>
                            <FormattedMessage
                                id='team_sidebar.railTeamButton.label'
                                defaultMessage='Teams'
                            />
                        </span>
                    </>
                ),
            }}
            menuButtonTooltip={{
                text: currentTeam.display_name,
            }}
            menu={{
                id: 'railTeamMenu',
                width: '300px',
            }}
        >
            <TeamListMenu/>
        </Menu.Container>
    );
}
