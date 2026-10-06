// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    count: number;
    onRefresh: () => void;
};

// 보는 동안 새로 생긴 미읽음은 목록을 흔들지 않고 이 배너로만 알린다 (FR-013).
// Slack의 동기화 아이콘 벤치마크 — 사용자가 눌렀을 때만 스냅샷을 다시 뜬다.
const NewItemsBanner = ({count, onRefresh}: Props) => {
    if (count <= 0) {
        return null;
    }

    return (
        <div
            className='UnreadsView__newItemsBanner'
            role='status'
        >
            <span>
                <FormattedMessage
                    id='unreads.newItems'
                    defaultMessage='{count, plural, one {# new unread conversation} other {# new unread conversations}}'
                    values={{count}}
                />
            </span>
            <button
                type='button'
                className='btn btn-primary btn-xs'
                onClick={onRefresh}
            >
                <FormattedMessage
                    id='unreads.newItems.show'
                    defaultMessage='Show'
                />
            </button>
        </div>
    );
};

export default NewItemsBanner;
