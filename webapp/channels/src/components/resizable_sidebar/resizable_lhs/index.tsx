// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {HTMLAttributes} from 'react';
import React, {useRef} from 'react';

import {DEFAULT_LHS_WIDTH, CssVarKeyForResizable, ResizeDirection} from '../constants';
import ResizableDivider from '../resizable_divider';

interface Props extends HTMLAttributes<'div'> {
    children: React.ReactNode;
}

function ResizableLhs({
    children,
    id,
    className,
    onMouseEnter,
    onMouseLeave,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            id={id}
            className={className}
            ref={containerRef}

            // okrbest: 채널 사이드바 접힘(peek)이 컨테이너 호버 이탈로 닫힌다 —
            // sidebar.tsx가 넘기는 마우스 핸들러를 DOM까지 전달해야 한다
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
            <ResizableDivider
                name={'lhsResizeHandle'}
                globalCssVar={CssVarKeyForResizable.LHS}
                defaultWidth={DEFAULT_LHS_WIDTH}
                dir={ResizeDirection.LEFT}
                containerRef={containerRef}
            />
        </div>
    );
}

export default ResizableLhs;
