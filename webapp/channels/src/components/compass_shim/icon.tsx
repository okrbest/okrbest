// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

/**
 * okrbest: stands in for @mattermost/compass-ui's Icon (see icon_button.tsx). Sized by the button it is in.
 */
export const Icon = ({glyph, size}: {glyph: React.ReactElement; size?: number}) => (
    <span
        className='compass-shim-icon'
        aria-hidden='true'
        style={size ? {width: size, height: size} : undefined}
    >
        {glyph}
    </span>
);
