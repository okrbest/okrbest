// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch} from 'react-redux';

import {SettingsOutlineIcon} from '@mattermost/compass-icons/components';

import {openModal} from 'actions/views/modals';

import * as Menu from 'components/menu';
import UserSettingsModal from 'components/user_settings/modal';

import {ModalIdentifiers} from 'utils/constants';

// OKR.BEST (Slack 벤치마크): 글로벌 헤더의 설정 버튼을 대체한다.
// 프로필 메뉴에서 제품 설정 모달을 연다.
export default function UserAccountSettingsMenuItem() {
    const dispatch = useDispatch();

    function handleClick() {
        dispatch(openModal({
            modalId: ModalIdentifiers.USER_SETTINGS,
            dialogType: UserSettingsModal,
            dialogProps: {
                isContentProductSettings: true,
                focusOriginElement: 'userAccountMenuButton',
            },
        }));
    }

    return (
        <Menu.Item
            leadingElement={
                <SettingsOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            }
            labels={
                <FormattedMessage
                    id='userAccountMenu.settingsMenuItem.label'
                    defaultMessage='Settings'
                />
            }
            aria-haspopup={true}
            onClick={handleClick}
        />
    );
}
