# Data Model: 채널별 입장·퇴장 메시지 끄기

upstream `5de31f8e`와 같은 모델을 쓴다. 새 테이블은 없다.

## Channels 테이블 — 열 1개 추가

| 열 | 타입 | 제약 | 기본값 | 마이그레이션 |
|---|---|---|---|---|
| `DisableJoinLeaveMessages` | `boolean` | `NOT NULL` | `false` | `000221_add_disable_join_leave_messages_to_channels` (up: `ADD COLUMN IF NOT EXISTS`, down: `DROP COLUMN IF EXISTS`) |

- 기존 행은 모두 `false`가 된다(spec FR-001).
- 채널 조회·저장 열 목록(`channelSliceColumns`, `channelToSlice`, `updateChannelT`의 `UPDATE`)에 함께 들어간다.

## model.Channel

| 필드 | JSON | 설명 |
|---|---|---|
| `DisableJoinLeaveMessages bool` | `disable_join_leave_messages` | 참이면 이 채널에서 멤버십 시스템 메시지를 숨긴다 |

- `Auditable()`에 `disable_join_leave_messages`로 들어간다(FR-004).
- `ShouldChannelExcludeMembershipSystemPosts(channel)`: `channel`이 nil이거나 DM·GM이면 false, 아니면 `DisableJoinLeaveMessages`.

## model.ChannelPatch

| 필드 | JSON | 규칙 |
|---|---|---|
| `DisableJoinLeaveMessages *bool` | `disable_join_leave_messages` | nil이면 변경하지 않는다. DM·GM 채널이면 400 `api.channel.patch_update_channel.update_direct_or_group_messages_not_allowed.app_error`. 권한은 채널 속성 관리(공개/비공개) |

- `ChannelPatch.Auditable()`에 포함한다.
- 우리 포크에는 upstream 문맥의 `ManagedCategoryName`·`DefaultCategoryName` patch 필드를 넣지 않는다(제외 계보, research R4).

## 조회 옵션

| 구조체 | 추가 필드 | 채우는 곳 |
|---|---|---|
| `model.GetPostsOptions` | `ExcludeMembershipSystemPosts bool` | app 계층 `populateGetPostsOptionsMembershipFilter`. 클라이언트가 직접 보내지 않는다 |
| `model.GetPostsSinceOptions` | `ExcludeMembershipSystemPosts bool` | app 계층 `populateGetPostsSinceOptionsMembershipFilter` |

포크 필드 `FilterUserIds []string`은 두 구조체에 그대로 남는다(research R3).

## 멤버십 시스템 메시지 유형

| 집합 | 유형 | 용도 |
|---|---|---|
| `JoinLeaveMessagePostTypes()` (10) | `system_join_leave`, `system_add_remove`, `system_join_channel`, `system_leave_channel`, `system_join_team`, `system_leave_team`, `system_add_to_channel`, `system_remove_from_channel`, `system_add_to_team`, `system_remove_from_team` | 기존 `CountPostsAfter`의 하드코딩 목록을 이 함수로 바꾼다 |
| `MembershipSystemPostTypes()` (12) | 위 10종 + `system_guest_join_channel`, `system_add_guest_to_chan` | 숨김 대상(spec FR-005) |
| 추가형 `IsAddMembershipSystemPost()` (3) | `system_add_to_channel`, `system_add_guest_to_chan`, `system_add_to_team` | 숨김 채널에서도 당사자에게 알린다(FR-014) |

## 상태 변화

```text
DisableJoinLeaveMessages: false ──(관리자 patch true)──▶ true
                          ◀──(관리자 patch false)──
```

- 바뀔 때마다 `channel_updated` 웹소켓 이벤트가 나간다. 웹앱은 값이 바뀌었으면 `resetReloadPostsInChannel(channel.id)`로 타임라인을 다시 불러온다(FR-011).
- 게시물 Etag 끝에 `.<true|false>`를 붙여 캐시를 나눈다(FR-012).

## 웹앱 타입

`webapp/platform/types/src/channels.ts`의 `Channel`에 `disable_join_leave_messages?: boolean`을 추가한다. upstream 문맥의 `property_values`는 넣지 않는다.
