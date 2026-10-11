// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import React from 'react';

import HeaderIconButton from './header_icon_button';

describe('components/global_header/header_icon_button', () => {
    // okrbest 아이콘 규칙 4항: 폰트 글리프 대신 SVG — 선명도 (019 usage-guide)
    it('매핑된 아이콘은 SVG로 렌더한다 (help-circle-outline)', () => {
        const {container} = render(<HeaderIconButton icon='help-circle-outline'/>);

        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelector('i')).not.toBeInTheDocument();
    });

    it('매핑된 아이콘은 SVG로 렌더한다 (bell-outline)', () => {
        const {container} = render(<HeaderIconButton icon='bell-outline'/>);

        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('매핑에 없는 아이콘은 기존 폰트 글리프로 렌더한다 (후방 호환)', () => {
        const {container} = render(<HeaderIconButton icon='mattermost'/>);

        expect(container.querySelector('i.icon-mattermost')).toBeInTheDocument();
    });

    it('toggled/active 클래스가 유지된다', () => {
        render(
            <HeaderIconButton
                icon='bell-outline'
                toggled={true}
                aria-label='bell'
            />,
        );

        expect(screen.getByRole('button', {name: 'bell'})).toHaveClass('HeaderIconButton--toggled');
    });
});
