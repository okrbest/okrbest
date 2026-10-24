// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import type {ChangeEvent} from 'react';
import {defineMessages, useIntl} from 'react-intl';

import {useGetPluginsActivationState} from 'plugins/useGetPluginsActivationState';

import RadioSettingItem from 'components/widgets/modals/components/radio_setting_item';
import type {FieldsetRadio} from 'components/widgets/modals/components/radio_setting_item';

import {LandingProducts} from 'utils/constants';

const messages = defineMessages({
    title: {
        id: 'general_tab.landingProduct',
        defaultMessage: 'First screen',
    },
    description: {
        id: 'general_tab.landingProductInfo',
        defaultMessage: 'The screen members land on after signing in. Members can pick their own first screen in Settings > Display, which overrides this default.',
    },
    channels: {
        id: 'general_tab.landingProductChannels',
        defaultMessage: 'Channels',
    },
    boards: {
        id: 'general_tab.landingProductBoards',
        defaultMessage: 'Boards',
    },
    playbooks: {
        id: 'general_tab.landingProductPlaybooks',
        defaultMessage: 'Playbooks',
    },
});

type Props = {
    landingProduct: string;
    handleLandingProductChanges: (value: string) => void;
};

const TeamLandingSection = ({landingProduct, handleLandingProductChanges}: Props) => {
    const {formatMessage} = useIntl();
    const {boardsPlugin, playbooksPlugin, playbooksProductEnabled} = useGetPluginsActivationState();

    const options = [
        {value: '', label: formatMessage(messages.channels)},
    ];
    if (boardsPlugin) {
        options.push({value: LandingProducts.BOARDS, label: formatMessage(messages.boards)});
    }
    if (playbooksPlugin || playbooksProductEnabled) {
        options.push({value: LandingProducts.PLAYBOOKS, label: formatMessage(messages.playbooks)});
    }

    // 저장값의 제품이 비활성이면 표시만 채널(기본)로 떨어뜨린다. 저장값은
    // 관리자가 새로 저장하기 전까지 바뀌지 않는다 (FR-006).
    const effectiveValue = options.some((option) => option.value === landingProduct) ? landingProduct : '';

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleLandingProductChanges(e.target.value);
    }, [handleLandingProductChanges]);

    const inputFieldData: FieldsetRadio = {
        options: options.map((option) => ({
            dataTestId: `teamLandingProduct-${option.value || 'channels'}`,
            title: option.label,
            name: 'teamLandingProduct',
            key: `teamLandingProduct-${option.value || 'channels'}`,
            value: option.value,
        })),
    };

    return (
        <RadioSettingItem
            title={formatMessage(messages.title)}
            description={formatMessage(messages.description)}
            inputFieldData={inputFieldData}
            inputFieldValue={effectiveValue}
            handleChange={handleChange}
        />
    );
};

export default TeamLandingSection;
