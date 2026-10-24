// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import type {MessageDescriptor} from 'react-intl';

import type {PreferenceType} from '@mattermost/types/preferences';

import type {ActionResult} from 'mattermost-redux/types/actions';

import {useGetPluginsActivationState} from 'plugins/useGetPluginsActivationState';

import SettingItemMax from 'components/setting_item_max';
import SettingItemMin from 'components/setting_item_min';
import type SettingItemMinComponent from 'components/setting_item_min';

import {LandingProducts, Preferences} from 'utils/constants';

const messages = defineMessages({
    title: {
        id: 'user.settings.display.landingProduct.title',
        defaultMessage: 'First screen',
    },
    description: {
        id: 'user.settings.display.landingProduct.description',
        defaultMessage: 'Choose which screen opens first after you log in.',
    },
    followTeamDefault: {
        id: 'user.settings.display.landingProduct.followTeamDefault',
        defaultMessage: 'Team default',
    },
    channels: {
        id: 'user.settings.display.landingProduct.channels',
        defaultMessage: 'Channels',
    },
    boards: {
        id: 'user.settings.display.landingProduct.boards',
        defaultMessage: 'Boards',
    },
    playbooks: {
        id: 'user.settings.display.landingProduct.playbooks',
        defaultMessage: 'Playbooks',
    },
});

type Props = {
    userId: string;
    active: boolean;
    areAllSectionsInactive: boolean;
    updateSection: (section: string) => void;
    globalValue: string;
    actions: {
        savePreferences: (userId: string, preferences: PreferenceType[]) => Promise<ActionResult>;
        deletePreferences: (userId: string, preferences: PreferenceType[]) => Promise<ActionResult>;
    };
};

type Option = {
    value: string;
    label: MessageDescriptor;
};

export default function LandingProductSection(props: Props) {
    const intl = useIntl();
    const minRef = useRef<SettingItemMinComponent>(null);

    const {boardsPlugin, playbooksPlugin, playbooksProductEnabled} = useGetPluginsActivationState();

    const options: Option[] = [
        {value: '', label: messages.followTeamDefault},
        {value: LandingProducts.CHANNELS, label: messages.channels},
    ];
    if (boardsPlugin) {
        options.push({value: LandingProducts.BOARDS, label: messages.boards});
    }
    if (playbooksPlugin || playbooksProductEnabled) {
        options.push({value: LandingProducts.PLAYBOOKS, label: messages.playbooks});
    }

    // 저장값의 제품이 비활성이면 표시만 기본값으로 떨어뜨린다. 저장값 자체는
    // 사용자가 새로 저장하기 전까지 바꾸지 않는다 (FR-006).
    const effectiveValue = options.some((option) => option.value === props.globalValue) ? props.globalValue : '';

    const [selected, setSelected] = useState(effectiveValue);
    const [isSaving, setIsSaving] = useState(false);

    const {active, areAllSectionsInactive} = props;
    useEffect(() => {
        if (active) {
            setSelected(effectiveValue);
        } else if (areAllSectionsInactive) {
            minRef.current?.focus();
        }
        // effectiveValue는 active 전환 시점의 저장값으로 고정한다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, areAllSectionsInactive]);

    const title = <FormattedMessage {...messages.title}/>;
    const effectiveOption = options.find((option) => option.value === effectiveValue) ?? options[0];

    if (!props.active) {
        return (
            <SettingItemMin
                title={title}
                describe={<FormattedMessage {...effectiveOption.label}/>}
                section='landingProduct'
                updateSection={props.updateSection}
                ref={minRef}
            />
        );
    }

    const handleSubmit = async () => {
        setIsSaving(true);

        if (selected === '') {
            if (props.globalValue !== '') {
                await props.actions.deletePreferences(props.userId, [{
                    user_id: props.userId,
                    category: Preferences.CATEGORY_LANDING_PRODUCT,
                    name: '',
                    value: props.globalValue,
                }]);
            }
        } else {
            await props.actions.savePreferences(props.userId, [{
                user_id: props.userId,
                category: Preferences.CATEGORY_LANDING_PRODUCT,
                name: '',
                value: selected,
            }]);
        }

        setIsSaving(false);
        props.updateSection('');
    };

    const inputs = (
        <fieldset key='landingProductSetting'>
            <legend className='form-legend hidden-label'>
                {title}
            </legend>
            {options.map((option) => (
                <div
                    className='radio'
                    key={`landingProduct-${option.value || 'default'}`}
                >
                    <label>
                        <input
                            type='radio'
                            name='landingProduct'
                            checked={selected === option.value}
                            onChange={() => setSelected(option.value)}
                        />
                        <FormattedMessage {...option.label}/>
                    </label>
                    <br/>
                </div>
            ))}
            <div className='mt-5'>
                <FormattedMessage {...messages.description}/>
            </div>
        </fieldset>
    );

    return (
        <SettingItemMax
            title={intl.formatMessage(messages.title)}
            inputs={[inputs]}
            submit={handleSubmit}
            saving={isSaving}
            updateSection={props.updateSection}
        />
    );
}
