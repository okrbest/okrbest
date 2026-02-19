// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {closeRightHandSide, showNotificationHistory} from 'actions/views/rhs';
import {getRhsState} from 'selectors/rhs';

import IconButton from 'components/global_header/header_icon_button';
import WithTooltip from 'components/with_tooltip';

import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

const NotificationHistoryButton = (): JSX.Element => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const rhsState = useSelector((state: GlobalState) => getRhsState(state));

    const notificationButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (rhsState === RHSStates.NOTIFICATION_HISTORY) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showNotificationHistory());
        }
    };

    return (
        <WithTooltip
            title={
                <FormattedMessage
                    id='channel_header.notificationHistory'
                    defaultMessage='Notification history'
                />
            }
        >
            <IconButton
                icon={'bell-outline'}
                toggled={rhsState === RHSStates.NOTIFICATION_HISTORY}
                onClick={notificationButtonClick}
                aria-expanded={rhsState === RHSStates.NOTIFICATION_HISTORY}
                aria-controls='searchContainer'
                aria-label={formatMessage({id: 'channel_header.notificationHistory', defaultMessage: 'Notification history'})}
            />
        </WithTooltip>
    );
};

export default NotificationHistoryButton;
