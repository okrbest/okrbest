// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {OkrBestFeatures} from './constants';

// eslint-disable-next-line @typescript-eslint/ban-types
export function mapFeatureIdToTranslation(id: string, formatMessage: Function): string {
    switch (id) {
    case OkrBestFeatures.GUEST_ACCOUNTS:
        return formatMessage({id: 'webapp.mattermost.feature.guest_accounts', defaultMessage: 'Guest Accounts'});
    case OkrBestFeatures.CUSTOM_USER_GROUPS:
        return formatMessage({id: 'webapp.mattermost.feature.custom_user_groups', defaultMessage: 'Custom User groups'});
    case OkrBestFeatures.CREATE_MULTIPLE_TEAMS:
        return formatMessage({id: 'webapp.mattermost.feature.create_multiple_teams', defaultMessage: 'Create Multiple Teams'});
    case OkrBestFeatures.START_CALL:
        return formatMessage({id: 'webapp.mattermost.feature.start_call', defaultMessage: 'Start call'});
    case OkrBestFeatures.PLAYBOOKS_RETRO:
        return formatMessage({id: 'webapp.mattermost.feature.playbooks_retro', defaultMessage: 'Playbooks Retrospective'});
    case OkrBestFeatures.UNLIMITED_MESSAGES:
        return formatMessage({id: 'webapp.mattermost.feature.unlimited_messages', defaultMessage: 'Unlimited Messages'});
    case OkrBestFeatures.UNLIMITED_FILE_STORAGE:
        return formatMessage({id: 'webapp.mattermost.feature.unlimited_file_storage', defaultMessage: 'Unlimited File Storage'});
    case OkrBestFeatures.ALL_PROFESSIONAL_FEATURES:
        return formatMessage({id: 'webapp.mattermost.feature.all_professional', defaultMessage: 'All Professional features'});
    case OkrBestFeatures.ALL_ENTERPRISE_FEATURES:
        return formatMessage({id: 'webapp.mattermost.feature.all_enterprise', defaultMessage: 'All Enterprise features'});
    case OkrBestFeatures.UPGRADE_DOWNGRADED_WORKSPACE:
        return formatMessage({id: 'webapp.mattermost.feature.upgrade_downgraded_workspace', defaultMessage: 'Revert the workspace to a paid plan'});
    case OkrBestFeatures.HIGHLIGHT_WITHOUT_NOTIFICATION:
        return formatMessage({id: 'webapp.mattermost.feature.highlight_without_notification', defaultMessage: 'Keywords Highlight Without Notification'});
    default:
        return '';
    }
}
