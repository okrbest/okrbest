# 알림 히스토리 API (Notification History)

## 개요

알림 히스토리는 사용자에게 발송된 모든 알림을 저장하고 조회할 수 있는 기능입니다.
Windows 알림 센터처럼 지나간 알림을 다시 확인하고, 해당 콘텐츠로 바로 이동할 수 있습니다.

---

## 저장되는 알림 유형

| 타입 | 상수값 | 설명 | 저장 조건 |
|------|--------|------|-----------|
| 멘션 | `mention` | @username 멘션 | 일반 채널에서 멘션된 경우 |
| DM | `direct_message` | 1:1 다이렉트 메시지 | DM 채널에 메시지가 작성된 경우 |
| 그룹 메시지 | `group_message` | 그룹 DM 메시지 | 그룹 채널에 메시지가 작성된 경우 |
| 스레드 답글 | `thread_reply` | 스레드 내 답글 | 일반 채널에서 스레드에 답글이 달린 경우 |
| 채널 메시지 | `channel_post` | 채널 메시지 | (예약됨) |
| 시스템 | `system` | 시스템 알림 | (예약됨) |

---

## 알림 저장 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    메시지 전송 (Post 생성)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              SendNotifications() 호출                            │
│              server/channels/app/notification.go                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    채널 타입 확인                                 │
│  ┌──────────┬──────────────┬──────────────────────────────────┐ │
│  │ DM       │ Group DM     │ Public/Private Channel           │ │
│  ├──────────┼──────────────┼──────────────────────────────────┤ │
│  │ 상대방   │ 그룹 멤버    │ 멘션된 사용자만                   │ │
│  │ 전원     │ 전원         │                                  │ │
│  │ (발신자  │ (발신자      │                                  │ │
│  │  제외)   │  제외)       │                                  │ │
│  └──────────┴──────────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│           SaveNotificationHistory() 비동기 호출                   │
│           server/channels/app/notification_history.go            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              NotificationHistory 테이블에 저장                    │
└─────────────────────────────────────────────────────────────────┘
```

### 핵심 코드 (notification.go)

```go
switch channel.Type {
case model.ChannelTypeDirect:
    // DM: 상대방에게 알림 (발신자 제외)
    notificationType = model.NotificationHistoryTypeDirectMessage
    for id := range profileMap {
        if id != sender.Id {
            notificationRecipients = append(notificationRecipients, id)
        }
    }
case model.ChannelTypeGroup:
    // 그룹: 모든 멤버에게 알림 (발신자 제외)
    notificationType = model.NotificationHistoryTypeGroupMessage
    for id := range profileMap {
        if id != sender.Id {
            notificationRecipients = append(notificationRecipients, id)
        }
    }
default:
    // 일반 채널: 멘션된 사용자에게만 알림
    if post.RootId != "" {
        notificationType = model.NotificationHistoryTypeThreadReply
    } else {
        notificationType = model.NotificationHistoryTypeMention
    }
    notificationRecipients = mentionedUsersList
}
```

---

## 데이터베이스 스키마

### NotificationHistory 테이블

```sql
CREATE TABLE NotificationHistory (
    Id VARCHAR(26) PRIMARY KEY,
    UserId VARCHAR(26) NOT NULL,      -- 알림 수신자
    SenderId VARCHAR(26),              -- 알림 발신자
    Type VARCHAR(32) NOT NULL,         -- 알림 타입 (mention, direct_message 등)
    PostId VARCHAR(26),                -- 관련 포스트 ID
    ChannelId VARCHAR(26),             -- 관련 채널 ID
    TeamId VARCHAR(26),                -- 관련 팀 ID
    RootId VARCHAR(26),                -- 스레드 루트 포스트 ID
    Title VARCHAR(256),                -- 알림 제목 (채널명 등)
    Message VARCHAR(512),              -- 메시지 미리보기 (최대 100자)
    IsRead BOOLEAN DEFAULT false,      -- 읽음 여부
    IsUrgent BOOLEAN DEFAULT false,    -- 긴급 여부
    CreateAt BIGINT NOT NULL,          -- 생성 시간
    ReadAt BIGINT DEFAULT 0            -- 읽은 시간
);
```

### 인덱스

| 인덱스 | 용도 |
|--------|------|
| `idx_notification_history_user_createat` | 사용자별 알림 조회 (최신순 정렬) |
| `idx_notification_history_user_unread` | 읽지 않은 알림 조회 (부분 인덱스) |
| `idx_notification_history_user_channel` | 채널별 알림 읽음 처리 |
| `idx_notification_history_createat` | 오래된 알림 삭제 |

---

## REST API 엔드포인트

### 기본 URL

```
/api/v4/users/{user_id}/notifications
```

> ⚠️ 본인의 알림만 조회/수정/삭제할 수 있습니다.

### `me` 키워드 사용

`{user_id}` 자리에 **`me`**를 사용하면 현재 로그인한 사용자의 ID로 자동 변환됩니다.

```javascript
// 아래 두 요청은 동일하게 동작합니다
fetch('/api/v4/users/me/notifications')
fetch('/api/v4/users/abc123xyz.../notifications')  // 실제 user_id
```

**동작 원리** (`server/channels/web/context.go`):

```go
func (c *Context) RequireUserId() *Context {
    if c.Params.UserId == model.Me {  // "me"인지 확인
        c.Params.UserId = c.AppContext.Session().UserId  // 세션의 실제 ID로 교체
    }
    // ...
}
```

> 💡 클라이언트가 자신의 user_id를 몰라도 `"me"`를 사용해서 자신의 데이터에 접근할 수 있습니다.

---

### 1. 알림 목록 조회

**GET** `/api/v4/users/{user_id}/notifications`

#### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `page` | int | ❌ | 페이지 번호 (기본값: 0) |
| `per_page` | int | ❌ | 페이지당 개수 (기본값: 60) |
| `unread_only` | bool | ❌ | 읽지 않은 알림만 조회 |
| `types` | string | ❌ | 알림 타입 필터 (콤마 구분, 예: `mention,direct_message`) |
| `team_id` | string | ❌ | 특정 팀 알림만 조회 |
| `since` | int64 | ❌ | 특정 시간 이후 알림만 조회 (Unix milliseconds) |

#### Response

```json
{
  "notifications": [
    {
      "id": "abc123...",
      "user_id": "user123...",
      "sender_id": "sender456...",
      "type": "direct_message",
      "post_id": "post789...",
      "channel_id": "channel012...",
      "team_id": "team345...",
      "root_id": "",
      "title": "홍길동",
      "message": "안녕하세요! 회의 시간 확인 부탁드립니다...",
      "is_read": false,
      "is_urgent": false,
      "create_at": 1707800400000,
      "read_at": 0,
      "sender_username": "gildong",
      "channel_name": "gildong__me",
      "team_name": ""
    }
  ],
  "total_count": 42,
  "unread_count": 5,
  "has_more": true
}
```

#### 사용 예시

```javascript
// 전체 알림 조회
fetch('/api/v4/users/me/notifications?page=0&per_page=20')

// 읽지 않은 알림만
fetch('/api/v4/users/me/notifications?unread_only=true')

// DM과 그룹 메시지만
fetch('/api/v4/users/me/notifications?types=direct_message,group_message')

// 특정 팀의 멘션만
fetch('/api/v4/users/me/notifications?types=mention&team_id=team123')
```

---

### 2. 알림 개수 조회

**GET** `/api/v4/users/{user_id}/notifications/counts`

#### Response

```json
{
  "total_count": 42,
  "unread_count": 5,
  "mention_count": 10,
  "dm_count": 20,
  "thread_count": 8,
  "urgent_count": 2
}
```

---

### 3. 단일 알림 읽음 처리

**POST** `/api/v4/users/{user_id}/notifications/{notification_id}/read`

#### Response

```json
{
  "status": "OK"
}
```

---

### 4. 모든 알림 읽음 처리

**POST** `/api/v4/users/{user_id}/notifications/read_all`

#### Response

```json
{
  "status": "OK"
}
```

---

### 5. 알림 삭제

**DELETE** `/api/v4/users/{user_id}/notifications/{notification_id}`

#### Response

```json
{
  "status": "OK"
}
```


---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `server/public/model/notification.go` | NotificationHistory 모델 정의 |
| `server/channels/app/notification.go` | 알림 저장 트리거 (SendNotifications) |
| `server/channels/app/notification_history.go` | 알림 히스토리 비즈니스 로직 |
| `server/channels/api4/notification_history.go` | REST API 핸들러 |
| `server/channels/store/store.go` | NotificationHistoryStore 인터페이스 |
| `server/channels/store/sqlstore/notification_history_store.go` | SQL Store 구현 |
| `server/channels/db/migrations/postgres/000149_*.sql` | 마이그레이션 스크립트 |

---

## 주의사항

1. **성능**: 알림 저장은 `a.Srv().Go()` 비동기로 처리되어 메시지 전송 성능에 영향을 주지 않습니다.
2. **메시지 미리보기**: 최대 100자로 제한되며, UTF-8 안전하게 처리됩니다.
3. **권한**: 본인의 알림만 조회/수정/삭제할 수 있습니다.