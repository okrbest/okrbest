// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';

import './compass_shim.scss';

/**
 * okrbest: stands in for @mattermost/compass-ui's IconButton, which we don't ship (no license). It takes the
 * props upstream passes to it (36ebc1f6) so that upstream files only change their import path.
 */
export type IconButtonProps = {
    icon: React.ReactNode;
    size?: 'small' | 'medium';
    padding?: 'default' | 'compact';

    // 'inverted' is for surfaces that stay dark, colored from --sidebar-text like Compass
    style?: 'default' | 'inverted';

    // Renders the only child (such as a link) as the button, with the icon inside it
    asChild?: boolean;
    children?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'children'>;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
    icon,
    size = 'small',
    padding = 'default',
    style = 'default',
    asChild = false,
    className,
    children,
    type = 'button',
    ...rest
}, ref) => {
    const classes = classNames(
        'compass-shim-icon-button',
        `compass-shim-icon-button--size-${size}`,
        `compass-shim-icon-button--padding-${padding}`,
        `compass-shim-icon-button--style-${style}`,
        className,
    );

    if (asChild && React.isValidElement<{className?: string}>(children)) {
        return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            ...rest,
            ref,
            className: classNames(children.props.className, classes),
            children: icon,
        });
    }

    return (
        <button
            {...rest}
            ref={ref}
            type={type}
            className={classes}
        >
            {icon}
        </button>
    );
});
IconButton.displayName = 'IconButton';
