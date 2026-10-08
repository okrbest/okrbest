// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {Link} from 'react-router-dom';

import glyphMap from '@mattermost/compass-icons/components';
import type {IconGlyphTypes} from '@mattermost/compass-icons/IconGlyphs';

type Props = {
    id: string;
    icon: IconGlyphTypes | React.ReactNode;
    text: React.ReactNode;
    destination: string;
    active: boolean;
};

// 레일의 제품 버튼 (Slack의 기능 버튼 위치) — 아이콘과 라벨을 세로로 쌓고,
// 현재 제품이면 active 표시를 한다. 아이콘·라벨·목적지는 제품 레지스트리
// (ProductComponent) 등록값을 그대로 쓴다.
export default function RailProductButton({id, icon, text, destination, active}: Props) {
    let iconElement: React.ReactNode;
    if (typeof icon === 'string') {
        const Glyph = glyphMap[icon as IconGlyphTypes];
        iconElement = Glyph ? <Glyph size={20}/> : null;
    } else {
        iconElement = icon;
    }

    return (
        <Link
            id={id}
            to={destination}
            className={classNames('rail-product-button', {active})}
            aria-current={active ? 'page' : undefined}
        >
            <span
                className='rail-product-button__icon'
                aria-hidden='true'
            >
                {iconElement}
            </span>
            <span className='rail-product-button__label'>
                {text}
            </span>
        </Link>
    );
}
