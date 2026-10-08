// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';

import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import * as Menu from 'components/menu';
import TeamIcon from 'components/widgets/team_icon/team_icon';
import TeamListMenu from 'components/widgets/team_list_menu/team_list_menu';

import * as Utils from 'utils/utils';

// 레일 최상단의 현재 팀 버튼 — 채널·제품(Boards·Playbooks) 어느 화면에서나
// 보이는 팀 전환 진입점. 클릭하면 팀명 드롭다운과 같은 팀 목록 메뉴가 열린다.
export default function RailTeamButton() {
    const {formatMessage} = useIntl();
    const currentTeam = useSelector(getCurrentTeam);

    if (!currentTeam) {
        return null;
    }

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
                    <TeamIcon
                        content={currentTeam.display_name}
                        url={Utils.imageURLForTeam(currentTeam)}
                        size='sm'
                    />
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
