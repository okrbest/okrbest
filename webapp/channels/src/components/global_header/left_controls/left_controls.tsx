// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';

import {isDesktopApp} from '@mattermost/shared/utils/user_agent';

import HistoryButtons from './history_buttons';
import ProductMenu from './product_menu';

const LeftControlsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 40px;
    flex-shrink: 0;
    /* OKR.BEST (Slack 벤치마크): 사이드 영역은 내용 폭만 — 중앙 검색 바가 52vw까지 확장 */
    flex: 0 0 auto;

    > * + * {
        margin-left: 12px;
    }
`;

const LeftControls = (): JSX.Element => (
    <LeftControlsContainer>
        <ProductMenu/>
        {isDesktopApp() && <HistoryButtons/>}
    </LeftControlsContainer>
);

export default LeftControls;
