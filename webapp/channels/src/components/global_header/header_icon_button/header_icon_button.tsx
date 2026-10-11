// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';

import {BellOutlineIcon, HelpCircleOutlineIcon} from '@mattermost/compass-icons/components';

import './header_icon_button.scss';

// okrbest 아이콘 규칙 4항 — 폰트 글리프 대신 SVG(선명도). 글리프 20은
// Slack 상단 버튼 실측 (019 measurements 9절). 매핑에 없는 아이콘은
// 기존 폰트 렌더로 후방 호환한다.
const SVG_GLYPHS: Record<string, React.ComponentType<React.ComponentProps<typeof HelpCircleOutlineIcon>>> = {
    'help-circle-outline': HelpCircleOutlineIcon,
    'bell-outline': BellOutlineIcon,
};

type HeaderIconButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
    icon: string;

    active?: boolean;
    toggled?: boolean;
};

const HeaderIconButton = React.forwardRef<HTMLButtonElement, HeaderIconButtonProps>(({
    icon = 'mattermost',
    active,
    toggled,
    ...otherProps
}, ref) => {
    const SvgGlyph = SVG_GLYPHS[icon];

    return (
        <button
            ref={ref}
            className={classNames('HeaderIconButton', {
                'HeaderIconButton--toggled': toggled,
                'HeaderIconButton--active': active,
            })}
            {...otherProps}
        >
            {SvgGlyph ? (
                <SvgGlyph
                    size={20}
                    color='currentColor'
                    aria-hidden={true}
                />
            ) : (
                <i className={`icon-${icon}`}/>
            )}
        </button>
    );
});
HeaderIconButton.displayName = 'HeaderIconButton';
export default HeaderIconButton;
