// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
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
const FILTER_OPTIONS: Array<{value: SearchFilterType; message: MessageDescriptor}> = [
    {value: 'all', message: {id: 'channel_info_rhs.menu.files.filter.all_file_types', defaultMessage: 'All file types'}},
    {value: 'documents', message: {id: 'channel_info_rhs.menu.files.filter.documents', defaultMessage: 'Documents'}},
    {value: 'spreadsheets', message: {id: 'channel_info_rhs.menu.files.filter.spreadsheets', defaultMessage: 'Spreadsheets'}},
    {value: 'presentations', message: {id: 'channel_info_rhs.menu.files.filter.presentations', defaultMessage: 'Presentations'}},
    {value: 'code', message: {id: 'channel_info_rhs.menu.files.filter.code', defaultMessage: 'Code'}},
    {value: 'images', message: {id: 'channel_info_rhs.menu.files.filter.images', defaultMessage: 'Images'}},
    {value: 'audio', message: {id: 'channel_info_rhs.menu.files.filter.audio', defaultMessage: 'Audio'}},
    {value: 'video', message: {id: 'channel_info_rhs.menu.files.filter.videos', defaultMessage: 'Videos'}},
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
