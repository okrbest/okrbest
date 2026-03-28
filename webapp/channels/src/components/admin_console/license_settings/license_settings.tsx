// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';

import type {ClientLicense} from '@mattermost/types/config';

import AdminHeader from 'components/widgets/admin_console/admin_header';

import TeamEditionLeftPanel from './team_edition/team_edition_left_panel';

import './license_settings.scss';

type Props = {
    license: ClientLicense;
}

const messages = defineMessages({
    title: {id: 'admin.license.title', defaultMessage: 'Edition and License'},
});

export const searchableStrings = [
    messages.title,
];

export default class LicenseSettings extends React.PureComponent<Props> {
    render() {
        return (
            <div className='wrapper--fixed'>
                <AdminHeader>
                    <FormattedMessage {...messages.title}/>
                </AdminHeader>
                <div className='admin-console__wrapper'>
                    <div className='admin-console__content'>
                        <div className='top-wrapper'>
                            <div className='left-panel'>
                                <div className='panel-card'>
                                    <TeamEditionLeftPanel/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
