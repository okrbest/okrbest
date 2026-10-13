// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type JSX} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import type {MessageDescriptor} from 'react-intl';

import {CheckIcon, ChevronDownIcon, FilterVariantIcon} from '@mattermost/compass-icons/components';

import * as Menu from 'components/menu';
import type {SearchFilterType} from 'components/search/types';

import './files_filter_menu.scss';

type Props = {
    selectedFilter: string;
    onFilter: (filter: SearchFilterType) => void;
};

// Slack 필터 벤치마크 (spec 019 measurements 18절) — 아이콘만으로는 기능이
// 안 읽힌다. "필터" 라벨+체브론 알약과 Menu v2 라디오 리스트로 통일한다
// (사이드바 필터 020-11과 같은 문법).
// defineMessages로 선언해야 i18n-extract가 en.json에 키를 남긴다
// (객체 리터럴로 넣으면 추출기가 못 보고 재생성 때 키가 지워진다).
const filterMessages = defineMessages({
    all: {id: 'channel_info_rhs.menu.files.filter.all_file_types', defaultMessage: 'All file types'},
    documents: {id: 'channel_info_rhs.menu.files.filter.documents', defaultMessage: 'Documents'},
    spreadsheets: {id: 'channel_info_rhs.menu.files.filter.spreadsheets', defaultMessage: 'Spreadsheets'},
    presentations: {id: 'channel_info_rhs.menu.files.filter.presentations', defaultMessage: 'Presentations'},
    code: {id: 'channel_info_rhs.menu.files.filter.code', defaultMessage: 'Code'},
    images: {id: 'channel_info_rhs.menu.files.filter.images', defaultMessage: 'Images'},
    audio: {id: 'channel_info_rhs.menu.files.filter.audio', defaultMessage: 'Audio'},
    video: {id: 'channel_info_rhs.menu.files.filter.videos', defaultMessage: 'Videos'},
});

const FILTER_OPTIONS: Array<{value: SearchFilterType; message: MessageDescriptor}> = [
    {value: 'all', message: filterMessages.all},
    {value: 'documents', message: filterMessages.documents},
    {value: 'spreadsheets', message: filterMessages.spreadsheets},
    {value: 'presentations', message: filterMessages.presentations},
    {value: 'code', message: filterMessages.code},
    {value: 'images', message: filterMessages.images},
    {value: 'audio', message: filterMessages.audio},
    {value: 'video', message: filterMessages.video},
];

export default function FilesFilterMenu(props: Props): JSX.Element {
    const intl = useIntl();

    return (
        <div className='FilesFilterMenu'>
            <Menu.Container
                menuButton={{
                    id: 'filesFilterButton',
                    dataTestId: 'filesFilterButton',
                    class: 'FilesFilterMenu_button',
                    'aria-label': intl.formatMessage({id: 'channel_info_rhs.menu.files.filter', defaultMessage: 'Filter'}),
                    children: (
                        <>
                            <FilterVariantIcon
                                size={16}
                                color='currentColor'
                                aria-hidden={true}
                            />
                            <span className='FilesFilterMenu_label'>
                                {intl.formatMessage({id: 'channel_info_rhs.menu.files.filter', defaultMessage: 'Filter'})}
                            </span>
                            <ChevronDownIcon
                                size={14}
                                aria-hidden={true}
                            />
                            {props.selectedFilter !== 'all' && (
                                <i
                                    className='icon-dot'
                                    data-testid='filesFilter-activeDot'
                                    aria-hidden={true}
                                />
                            )}
                        </>
                    ),
                }}
                menu={{
                    id: 'filesFilterMenu',
                    'aria-label': intl.formatMessage({id: 'channel_info_rhs.menu.files.filter.file_menu', defaultMessage: 'file menu'}),
                }}
            >
                {FILTER_OPTIONS.map(({value, message}) => (
                    <Menu.Item
                        key={value}
                        id={`filesFilter-${value}`}
                        role='menuitemradio'
                        aria-checked={props.selectedFilter === value}
                        onClick={() => props.onFilter(value)}
                        labels={<span>{intl.formatMessage(message)}</span>}
                        trailingElements={props.selectedFilter === value && (
                            <span data-testid={`filesFilter-check-${value}`}>
                                <CheckIcon
                                    size={18}
                                    aria-hidden={true}
                                />
                            </span>
                        )}
                    />
                ))}
            </Menu.Container>
        </div>
    );
}
