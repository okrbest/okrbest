# 알림 보기 팝업 패널 개발

## 배경
- 채널에 새 메시지 등록 시 브라우저 알림은 표시되지만 알림 리스트를 볼 수 있는 UI가 없음
- 알림 내용으로 바로 접근할 수 있는 경로 부재
- 사용자가 놓친 알림을 확인하기 어려움

## 목표
- 알림 리스트를 보여주는 팝업 패널 UI 개발
- 알림 클릭 시 해당 메시지/채널로 바로 이동
- 알림 읽음/삭제 관리 기능

## 재활용 가능한 기존 컴포넌트

### UI 컴포넌트

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| `HeaderIconButton` | `components/global_header/header_icon_button/header_icon_button.tsx` | 헤더 아이콘 버튼 (bell 아이콘) |
| `WithTooltip` | `components/with_tooltip/` | 버튼 툴팁 |
| `Menu.Container` | `components/menu/menu.tsx` | 팝업 메뉴 컨테이너 ✅ **권장** |
| `Popover` | `components/actions_menu/popover.tsx` | MuiPopover 래퍼 |
| `CompassDesignProvider` | `components/compass_design_provider/` | 테마 프로바이더 |

### 액션/셀렉터 패턴

| 기존 코드 | 파일 | 재활용 방법 |
|---------|------|-----------|
| `showMentions()` | `actions/views/rhs.ts` | 알림 액션 패턴 참조 |
| `getRhsState()` | `selectors/rhs.ts` | 셀렉터 패턴 참조 |
| `AtMentionsButton` | `components/global_header/right_controls/at_mentions_button/` | 버튼 구조 복사 |
| `UserAccountMenu` | `components/user_account_menu/user_account_menu.tsx` | `Menu.Container` 사용 예시 ✅ |

### 알림 로직

| 기존 코드 | 파일 | 재활용 방법 |
|---------|------|-----------|
| `sendDesktopNotification()` | `actions/notification_actions.tsx` | 알림 저장 로직 삽입 지점 |
| `showNotification()` | `utils/notifications.ts` | 알림 생성 유틸 |
| `getChannelURL()` | `selectors/urls.ts` | URL 생성 재활용 |
| `getPermalinkURL()` | `selectors/urls.ts` | 퍼머링크 생성 재활용 |

## 작업 범위

### 1단계: 상태 관리 (신규 최소화)

| 작업 | 파일 | 재활용 | 상태 |
|------|------|-------|------|
| 알림 타입 정의 | `types/store/notifications.ts` (신규) | - | ⬜ |
| 알림 Reducer | `reducers/views/notifications.ts` (신규) | 기존 reducer 패턴 | ⬜ |
| 알림 Action | `actions/views/notifications.ts` (신규) | `rhs.ts` 패턴 | ⬜ |
| 알림 Selector | `selectors/notifications.ts` (신규) | `rhs.ts` 패턴 | ⬜ |
| 루트 Reducer 등록 | `reducers/views/index.ts` | 기존 파일 수정 | ⬜ |

### 2단계: UI 컴포넌트 (기존 재활용)

| 작업 | 파일 | 재활용 | 상태 |
|------|------|-------|------|
| 알림 버튼 | `global_header/right_controls/notification_button/notification_button.tsx` (신규) | `AtMentionsButton` 복사 후 수정 | ⬜ |
| 알림 패널 | `components/notification_panel/notification_panel.tsx` (신규) | `Menu.Container` + `Popover` 사용 | ⬜ |
| 알림 아이템 | `components/notification_panel/notification_item.tsx` (신규) | 기존 스타일 재활용 | ⬜ |
| 헤더에 추가 | `global_header/right_controls/right_controls.tsx` | 기존 파일 수정 | ⬜ |

### 3단계: 알림 저장 로직 (기존 수정)

| 작업 | 파일 | 재활용 | 상태 |
|------|------|-------|------|
| 알림 dispatch 추가 | `actions/notification_actions.tsx` | 기존 파일 수정 | ⬜ |

## 상세 구현 (기존 재활용)

### 1. 알림 버튼 - `AtMentionsButton` 복사 후 수정

```typescript
// components/global_header/right_controls/notification_button/notification_button.tsx
// AtMentionsButton 패턴 그대로 재활용

import React, {useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useSelector} from 'react-redux';

import {getUnreadNotificationCount} from 'selectors/notifications'; // 신규

import IconButton from 'components/global_header/header_icon_button'; // ✅ 재활용
import WithTooltip from 'components/with_tooltip'; // ✅ 재활용

import NotificationPanel from 'components/notification_panel'; // 신규

const NotificationButton = (): JSX.Element => {
    const {formatMessage} = useIntl();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = useSelector(getUnreadNotificationCount);

    return (
        <>
            <WithTooltip
                title={
                    <FormattedMessage
                        id='global_header.notifications'
                        defaultMessage='Notifications'
                    />
                }
            >
                <IconButton
                    ref={buttonRef}
                    icon={'bell-outline'}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={formatMessage({id: 'global_header.notifications', defaultMessage: 'Notifications'})}
                />
                {unreadCount > 0 && (
                    <span className='notification-badge'>{unreadCount}</span>
                )}
            </WithTooltip>
            <NotificationPanel
                anchorElement={buttonRef.current}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};

export default NotificationButton;
```

### 2. 알림 패널 - `Popover` 재활용

```typescript
// components/notification_panel/notification_panel.tsx
// Popover 컴포넌트 재활용

import React from 'react';
import {useSelector, useDispatch} from 'react-redux';

import Popover from 'components/actions_menu/popover'; // ✅ 재활용
import {getNotifications} from 'selectors/notifications'; // 신규
import {markAllAsRead} from 'actions/views/notifications'; // 신규
import {getHistory} from 'utils/browser_history'; // ✅ 재활용

import NotificationItem from './notification_item';

type Props = {
    anchorElement: Element | null;
    isOpen: boolean;
    onClose: () => void;
};

const NotificationPanel = ({anchorElement, isOpen, onClose}: Props) => {
    const dispatch = useDispatch();
    const notifications = useSelector(getNotifications);

    const handleItemClick = (notification) => {
        getHistory().push(notification.url); // ✅ 기존 유틸 재활용
        onClose();
    };

    return (
        <Popover
            anchorElement={anchorElement}
            isOpen={isOpen}
            onToggle={(open) => !open && onClose()}
            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            transformOrigin={{vertical: 'top', horizontal: 'right'}}
        >
            <div className='notification-panel'>
                <div className='notification-panel__header'>
                    <h3>알림</h3>
                    <button onClick={() => dispatch(markAllAsRead())}>
                        모두 읽음
                    </button>
                </div>
                <div className='notification-panel__body'>
                    {notifications.length === 0 ? (
                        <p className='notification-panel__empty'>알림이 없습니다</p>
                    ) : (
                        notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onClick={handleItemClick}
                            />
                        ))
                    )}
                </div>
            </div>
        </Popover>
    );
};

export default NotificationPanel;
```

### 3. 알림 저장 - `notification_actions.tsx` 수정

```typescript
// actions/notification_actions.tsx
// 기존 sendDesktopNotification() 함수 내부 수정

// 기존 showNotification() 호출 이후에 추가:
import {addNotification} from 'actions/views/notifications'; // 신규 import

// ... 기존 코드 ...

// showNotification() 호출 후 아래 추가
dispatch(addNotification({
    id: `notification_${Date.now()}_${post.id}`,
    postId: post.id,
    channelId: post.channel_id,
    teamId: msgProps.team_id,
    senderId: post.user_id,
    senderName: title,
    title,
    body,
    url,  // ✅ 기존 getPermalinkURL() 결과 재활용
    timestamp: Date.now(),
    isRead: false,
}));
```

### 4. 헤더 버튼 추가 - `right_controls.tsx` 수정

```typescript
// components/global_header/right_controls/right_controls.tsx

import NotificationButton from './notification_button/notification_button'; // 추가

// ... 기존 코드 ...

return (
    <RightControlsContainer id={'RightControlsContainer'}>
        <PlanUpgradeButton/>
        {isChannels(productId) ? (
            <>
                <NotificationButton/>  {/* ✅ 추가 */}
                <AtMentionsButton/>
                <SavedPostsButton/>
            </>
        ) : (
            // ...
        )}
        // ...
    </RightControlsContainer>
);
```

## 재활용 요약

| 구분 | 신규 작성 | 기존 재활용 |
|-----|---------|-----------|
| **타입** | `types/store/notifications.ts` | - |
| **Reducer** | `reducers/views/notifications.ts` | 패턴만 참조 |
| **Action** | `actions/views/notifications.ts` | `rhs.ts` 패턴 |
| **Selector** | `selectors/notifications.ts` | `rhs.ts` 패턴 |
| **버튼** | 신규 파일 | `AtMentionsButton` 복사, `IconButton`, `WithTooltip` 재활용 |
| **패널** | 신규 파일 | `Popover` 컴포넌트 재활용 |
| **URL 생성** | - | `getPermalinkURL()` 재활용 |
| **네비게이션** | - | `getHistory()` 재활용 |
| **알림 발생** | 수정 | `notification_actions.tsx` 기존 함수에 추가 |

## 범위 외
- 알림 히스토리 서버 저장 (세션 종료 시 초기화)
- 푸시 알림 설정 변경 UI (기존 설정 페이지 사용)
- 알림 필터링/검색 기능

## 참고 파일

### 재활용 대상 (복사/수정)
- `webapp/channels/src/components/global_header/right_controls/at_mentions_button/at_mentions_button.tsx` - 버튼 구조 복사
- `webapp/channels/src/components/actions_menu/popover.tsx` - Popover 재활용
- `webapp/channels/src/components/user_account_menu/user_account_menu.tsx` - Menu.Container 사용 예시
- `webapp/channels/src/actions/views/rhs.ts` - 액션 패턴
- `webapp/channels/src/selectors/rhs.ts` - 셀렉터 패턴

### 수정 대상
- `webapp/channels/src/actions/notification_actions.tsx` - 알림 저장 로직 추가
- `webapp/channels/src/components/global_header/right_controls/right_controls.tsx` - 버튼 추가
- `webapp/channels/src/reducers/views/index.ts` - reducer 등록
