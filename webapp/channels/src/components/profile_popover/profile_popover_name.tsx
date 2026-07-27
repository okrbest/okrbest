// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {UserProfile} from '@mattermost/types/users';

import BotDescription from 'components/profile_popover/profile_popover_bot_description';
import FullName from 'components/profile_popover/profile_popover_full_name';
import OrgRole from 'components/profile_popover/profile_popover_org_role';
import UserName from 'components/profile_popover/profile_popover_user_name';

import {getUsername} from 'utils/utils';

type Props = {
    haveOverrideProp: boolean;
    user: UserProfile;
    fullname: string;
    currentTeamId: string;
}
const ProfilePopoverName = ({
    user,
    haveOverrideProp,
    fullname,
    currentTeamId,
}: Props) => {
    return (
        <>
            <FullName
                fullname={fullname}
                remoteId={user.remote_id}
                username={user.username}
            />
            {(user.is_bot && !haveOverrideProp) && (
                <BotDescription
                    botDescription={user.bot_description}
                />
            )}
            <UserName
                hasFullName={Boolean(fullname)}
                username={getUsername(user)}
            />
            {(!user.is_bot && !haveOverrideProp) && (
                <OrgRole
                    teamId={currentTeamId}
                    userId={user.id}
                    isBot={user.is_bot}
                />
            )}
        </>
    );
};

export default ProfilePopoverName;
