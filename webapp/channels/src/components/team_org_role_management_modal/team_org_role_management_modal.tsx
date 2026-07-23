// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';

import {GenericModal} from '@mattermost/components';
import type {Team} from '@mattermost/types/teams';

import OrgRoleManagementBody from 'components/admin_console/org_role_management/org_role_management_body';

import {focusElement} from 'utils/a11y_utils';

import './team_org_role_management_modal.scss';

type Props = {
    currentTeam?: Team;
    onExited: () => void;
    focusOriginElement?: string;
}

type State = {
    show: boolean;
}

export default class TeamOrgRoleManagementModal extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            show: true,
        };
    }

    handleHide = () => {
        this.setState({show: false});
    };

    handleExit = () => {
        if (this.props.focusOriginElement) {
            focusElement(this.props.focusOriginElement, true);
        }
        this.props.onExited();
    };

    render() {
        const teamId = this.props.currentTeam?.id;
        if (!teamId) {
            return null;
        }

        const teamDisplayName = this.props.currentTeam?.display_name || '';

        return (
            <GenericModal
                id='teamOrgRoleManagementModal'
                className='more-modal'
                compassDesign={true}
                show={this.state.show}
                onHide={this.handleHide}
                onExited={this.handleExit}
                modalHeaderTextId='teamOrgRoleManagementModalLabel'
                modalHeaderText={
                    <FormattedMessage
                        id='team_org_role_management_modal.title'
                        defaultMessage='{team} 부서/직위 관리'
                        values={{
                            team: teamDisplayName,
                        }}
                    />
                }
                ariaLabelledby='teamOrgRoleManagementModalLabel'
                enforceFocus={false}
                modalLocation='top'
                bodyPadding={false}
            >
                <OrgRoleManagementBody teamId={teamId}/>
            </GenericModal>
        );
    }
}
