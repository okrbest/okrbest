// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';

import type {ProductIdentifier} from '@mattermost/types/products';

import Pluggable from 'plugins/pluggable';
import {isChannels} from 'utils/products';

import NotificationHistoryButton from './notification_history_button/notification_history_button';
import PlanUpgradeButton from './plan_upgrade_button';

const RightControlsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 40px;
    flex-shrink: 0;
    position: relative;
    flex-basis: 30%;
    justify-content: flex-end;

    > * + * {
        margin-left: 8px;
    }
`;

export type Props = {
    productId?: ProductIdentifier;
};

const RightControls = ({productId = null}: Props): JSX.Element => {
    return (
        <RightControlsContainer
            id={'RightControlsContainer'}
        >
            <PlanUpgradeButton/>
            {isChannels(productId) ? (
                <>
                    <NotificationHistoryButton/>
                </>
            ) : (
                <Pluggable
                    pluggableName={'Product'}
                    subComponentName={'headerRightComponent'}
                    pluggableId={productId}
                />
            )}

        </RightControlsContainer>
    );
};

export default RightControls;
