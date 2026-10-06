// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import UserAccountMenu from 'components/user_account_menu';

// OKR.BEST (Slack 벤치마크): 프로필·상태 관리 버튼을 글로벌 헤더 우측 상단 대신
// 항상 표시되는 채널 사이드바 좌측 하단에 둔다. 메뉴는 위로 열린다.
const SidebarFooter = () => {
    return (
        <div className='SidebarFooter'>
            <UserAccountMenu openUp={true}/>
        </div>
    );
};

export default SidebarFooter;
