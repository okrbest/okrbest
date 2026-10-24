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
    applyToAllTeams: {
        id: 'user.settings.display.landingProduct.applyToAllTeams',
        defaultMessage: 'Apply to all my teams',
    },
});

type Props = {
    userId: string;
    active: boolean;
    areAllSectionsInactive: boolean;
    updateSection: (section: string) => void;

    // 공통(name='') 저장값. ''는 "팀 기본값 따르기".
    globalValue: string;

    // 현재 팀(name=팀 ID) 저장값. ''는 팀별 설정 없음.
    currentTeamId: string;
    teamValue: string;

    // 이 카테고리의 팀별(name!=='') preference 전부 — "모든 팀에 적용" 시 삭제 대상
    teamSpecificPreferences: PreferenceType[];

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

    // 현재 팀 기준의 저장값: 팀별 값이 있으면 그 값, 없으면 공통 값.
    // 저장값의 제품이 비활성이면 표시만 기본값으로 떨어뜨린다. 저장값 자체는
    // 사용자가 새로 저장하기 전까지 바꾸지 않는다 (FR-006).
    const storedValue = props.teamValue === '' ? props.globalValue : props.teamValue;
    const effectiveValue = options.some((option) => option.value === storedValue) ? storedValue : '';
    const storedApplyToAll = props.teamValue === '';

    const [selected, setSelected] = useState(effectiveValue);
    const [applyToAll, setApplyToAll] = useState(storedApplyToAll);
    const [isSaving, setIsSaving] = useState(false);

    const {active, areAllSectionsInactive} = props;
    useEffect(() => {
        if (active) {
            setSelected(effectiveValue);
            setApplyToAll(storedApplyToAll);
        } else if (areAllSectionsInactive) {
            minRef.current?.focus();
        }
        // 저장값 파생치는 active 전환 시점의 값으로 고정한다
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

        const category = Preferences.CATEGORY_LANDING_PRODUCT;
        const toSave: PreferenceType[] = [];
        const toDelete: PreferenceType[] = [];

        if (applyToAll || !props.currentTeamId) {
            if (selected === '') {
                if (props.globalValue !== '') {
                    toDelete.push({user_id: props.userId, category, name: '', value: props.globalValue});
                }
            } else {
                toSave.push({user_id: props.userId, category, name: '', value: selected});
            }
            toDelete.push(...props.teamSpecificPreferences);
        } else if (selected === '') {
            if (props.teamValue !== '') {
                toDelete.push({user_id: props.userId, category, name: props.currentTeamId, value: props.teamValue});
            }
        } else {
            toSave.push({user_id: props.userId, category, name: props.currentTeamId, value: selected});
        }

        if (toSave.length > 0) {
            await props.actions.savePreferences(props.userId, toSave);
        }
        if (toDelete.length > 0) {
            await props.actions.deletePreferences(props.userId, toDelete);
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
            {props.currentTeamId !== '' && (
                <div className='checkbox'>
                    <label>
                        <input
                            type='checkbox'
                            checked={applyToAll}
                            onChange={(e) => setApplyToAll(e.target.checked)}
                        />
                        <FormattedMessage {...messages.applyToAllTeams}/>
                    </label>
                </div>
            )}
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
