// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {DockWindowIcon} from '@mattermost/compass-icons/components';
import {WithTooltip} from '@mattermost/shared/components/tooltip';

import {canPopout} from 'utils/popouts/popout_windows';

type Props = {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
};

export default function PopoutButton({
    onClick,
    className,
}: Props) {
    const intl = useIntl();

    if (!canPopout()) {
        return null;
    }

    return (
        <WithTooltip
            title={
                <FormattedMessage
                    id='new_window_button.tooltip'
                    defaultMessage='Open in new window'
                />
            }
        >
            <button
                type='button'
                className={classNames('btn btn-icon btn-sm', 'PopoutButton', className)}
                aria-label={intl.formatMessage({id: 'new_window_button.tooltip', defaultMessage: 'Open in new window'})}
                onClick={onClick}
            >
                <DockWindowIcon
                    size={20}
                    color='currentColor'
                    aria-hidden={true}
                />
            </button>
        </WithTooltip>
    );
}
