// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import UnreadChannelGroup from './unread_channel_group';
import type {UnreadChannelGroupData} from './use_unreads_snapshot';

type Props = {
    groups: UnreadChannelGroupData[];
    renderGroupActions?: (group: UnreadChannelGroupData) => React.ReactNode;
};

// 그룹 목록 컨테이너. 미읽음 채널 수는 data_prefetch 전제(20개 수준)로 바운드되어
// v1은 일반 스크롤로 충분하다. 필요해지면 이 컴포넌트 내부만 가상화로 바꾼다
// (research 결정 4).
const UnreadChannelGroupList = ({groups, renderGroupActions}: Props) => {
    return (
        <div className='UnreadChannelGroupList'>
            {groups.map((group) => (
                <UnreadChannelGroup
                    key={group.channel.id}
                    channel={group.channel}
                    lastViewedAt={group.lastViewedAt}
                    mentionCount={group.mentionCount}
                    postIds={group.postIds}
                    hasLoadFailed={group.hasLoadFailed}
                    actions={renderGroupActions?.(group)}
                />
            ))}
        </div>
    );
};

export default UnreadChannelGroupList;
