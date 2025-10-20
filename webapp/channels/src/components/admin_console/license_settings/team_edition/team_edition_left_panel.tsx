// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import './team_edition.scss';
export interface TeamEditionProps {
    openEELicenseModal: () => void;
}

const TeamEdition: React.FC<TeamEditionProps> = ({openEELicenseModal}: TeamEditionProps) => {
    const {formatMessage} = useIntl();
    const title = 'Team Edition';
    return (
        <div className='TeamEditionLeftPanel'>
            <div className='TeamEditionLeftPanel__Header'>
                <div className='TeamEditionLeftPanel__Title'>{title}</div>
            </div>
            <div className='TeamEditionLeftPanel__LicenseNotices'>
                <p>{formatMessage({id: 'admin.licenseSettings.teamEdition.teamEditionDescription', defaultMessage: 'When using OKR.BEST Team Edition, the software is offered under a OKR.BEST MIT Compiled License. See MIT-COMPILED-LICENSE.md in your root install directory for details.'})}</p>
                <p>
                    {formatMessage({id: 'admin.licenseSettings.teamEdition.enterpriseEditionDescription', defaultMessage: 'When using OKR.BEST Enterprise Edition, the software is offered under a commercial license. See '})}
                    <a
                        role='button'
                        onClick={openEELicenseModal}
                        className='openEELicenseModal'
                    >
                        {formatMessage({id: 'admin.licenseSettings.teamEdition.enterpriseEditionLink', defaultMessage: 'here'})}
                    </a>
                    {formatMessage({id: 'admin.licenseSettings.teamEdition.enterpriseEditionEnd', defaultMessage: ' for "Enterprise Edition License" for details.'})}
                </p>
                <p>{formatMessage({id: 'admin.licenseSettings.teamEdition.noticeDescription', defaultMessage: 'See NOTICE.txt for information about open source software used in the system.'})}</p>
            </div>
        </div>
    );
};

export default TeamEdition;
