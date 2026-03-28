// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import './team_edition.scss';

const TeamEdition: React.FC = () => {
    const {formatMessage} = useIntl();
    return (
        <div className='TeamEditionLeftPanel'>
            <div className='TeamEditionLeftPanel__Header'>
                <div className='TeamEditionLeftPanel__Title'>{'OKR.BEST'}</div>
            </div>
            <div className='TeamEditionLeftPanel__LicenseNotices'>
                <p>{formatMessage({id: 'admin.licenseSettings.teamEdition.teamEditionDescription', defaultMessage: 'When using OKR.BEST Team Edition, the software is offered under a OKR.BEST MIT Compiled License. See MIT-COMPILED-LICENSE.md in your root install directory for details.'})}</p>
                <p>{formatMessage({id: 'admin.licenseSettings.teamEdition.noticeDescription', defaultMessage: 'See NOTICE.txt for information about open source software used in the system.'})}</p>
            </div>
        </div>
    );
};

export default TeamEdition;
