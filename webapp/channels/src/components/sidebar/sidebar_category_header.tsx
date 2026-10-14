// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {DraggableProvidedDragHandleProps} from '@hello-pangea/dnd';
import classNames from 'classnames';
import React from 'react';

import {
    AccountMultipleOutlineIcon,
    FolderOutlineIcon,
    MessageTextOutlineIcon,
    PoundIcon,
    StarOutlineIcon,
} from '@mattermost/compass-icons/components';

import {wrapEmojis} from 'utils/emoji_utils';

// 022: 카테고리 특성 아이콘 — 채널명 행의 타입 아이콘과 같은 문법.
// 15px 라벨엔 16px 아이콘 (019 균형표).
const CATEGORY_ICONS: Record<string, React.ComponentType<React.ComponentProps<typeof PoundIcon>>> = {
    favorites: StarOutlineIcon,
    channels: PoundIcon,
    direct_messages: AccountMultipleOutlineIcon,
    custom: FolderOutlineIcon,
    unreads: MessageTextOutlineIcon,
};

function CategoryIcon({categoryType}: {categoryType?: string}) {
    const Icon = categoryType ? CATEGORY_ICONS[categoryType] : undefined;
    if (!Icon) {
        return null;
    }
    return (
        <span
            className='SidebarChannelGroupHeader_icon'
            data-testid={`categoryIcon-${categoryType}`}
        >
            <Icon
                size={16}
                color='currentColor'
                aria-hidden={true}
            />
        </span>
    );
}

type StaticProps = {
    children?: React.ReactNode;
    displayName: string;
    categoryType?: string;
};

export const SidebarCategoryHeaderStatic = React.forwardRef((props: StaticProps, ref?: React.Ref<HTMLDivElement>) => {
    return (
        <div className='SidebarChannelGroupHeader SidebarChannelGroupHeader--static'>
            <div
                ref={ref}
                className='SidebarChannelGroupHeader_groupButton'
            >
                <CategoryIcon categoryType={props.categoryType}/>
                <div className='SidebarChannelGroupHeader_text'>
                    {wrapEmojis(props.displayName)}
                </div>
                {props.children}
            </div>
        </div>
    );
});
SidebarCategoryHeaderStatic.displayName = 'SidebarCategoryHeaderStatic';

type Props = StaticProps & {
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    isCollapsed: boolean;
    isCollapsible: boolean;
    isDragging?: boolean;
    isDraggingOver?: boolean;
    muted: boolean;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
};

export const SidebarCategoryHeader = React.forwardRef(({
    children,
    displayName,
    categoryType,
    dragHandleProps,
    isCollapsed,
    isCollapsible = true,
    isDragging = false,
    muted,
    onClick,
}: Props, ref?: React.Ref<HTMLButtonElement>) => {
    // (Accessibility) Ensures interactive controls are not nested as they are not always announced
    // by screen readers or can cause focus problems for assistive technologies.
    if (dragHandleProps && dragHandleProps.role) {
        Reflect.deleteProperty(dragHandleProps, 'role');
    }

    return (
        <div
            className={classNames('SidebarChannelGroupHeader', {
                muted,
                dragging: isDragging,
            })}
        >
            <button
                ref={ref}
                className={classNames('SidebarChannelGroupHeader_groupButton')}
                aria-label={displayName}
                onClick={onClick}
                aria-expanded={!isCollapsed}
            >
                <i
                    className={classNames('icon icon-chevron-down', {
                        'icon-rotate-minus-90': isCollapsed,
                        'hide-arrow': !isCollapsible,
                    })}
                />
                <CategoryIcon categoryType={categoryType}/>
                <div
                    className='SidebarChannelGroupHeader_text'
                    {...dragHandleProps}
                    tabIndex={-1}
                >
                    {wrapEmojis(displayName)}
                </div>
            </button>
            {children}
        </div>
    );
});
SidebarCategoryHeader.displayName = 'SidebarCategoryHeader';
