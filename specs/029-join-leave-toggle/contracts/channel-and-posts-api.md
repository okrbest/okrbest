# Contract: 채널 설정과 게시물 조회

upstream `5de31f8e`와 같은 외부 계약이다. 새 엔드포인트는 없다. 기존 엔드포인트의 필드와 동작만 바뀐다.

## 1. 채널 설정 변경

`PUT /api/v4/channels/{channel_id}/patch`

요청 본문(일부):

```json
{ "disable_join_leave_messages": true }
```

| 조건 | 응답 |
|---|---|
| 공개 채널 + `manage_public_channel_properties` 권한 | 200, 갱신된 채널(`disable_join_leave_messages: true`) |
| 비공개 채널 + `manage_private_channel_properties` 권한 | 200 |
| 권한 없음 | 403 |
| DM·GM 채널 | 400, `api.channel.patch_update_channel.update_direct_or_group_messages_not_allowed.app_error` |
| 필드 생략 | 값 유지 |

성공하면 `channel_updated` 웹소켓 이벤트가 채널 구성원에게 나간다.

## 2. 채널 객체

`GET /api/v4/channels/{channel_id}` 등 채널을 돌려주는 모든 응답에 다음 필드가 들어간다.

```json
{ "disable_join_leave_messages": false }
```

## 3. 게시물 조회 — 숨김 채널에서의 동작

대상: `GET /api/v4/channels/{channel_id}/posts`(page·since·before·after), `GET /api/v4/users/{user_id}/channels/{channel_id}/posts/unread`, `GET /api/v4/posts/{post_id}`, `GET /api/v4/posts/{post_id}/thread`, 퍼머링크, 저장(flagged) 목록, `POST /api/v4/teams/{team_id}/posts/search`(검색 결과, 포크 LIKE·공개 채널 검색 포함).

| 항목 | 숨김 채널 | 그 밖의 채널 |
|---|---|---|
| 멤버십 시스템 메시지 12종 | 응답에서 빠진다 | 지금과 같다 |
| `prev_post_id`/`next_post_id` | 숨긴 메시지를 건너뛴 값 | 지금과 같다 |
| 단건 조회로 숨긴 메시지 요청 | 404 | 지금과 같다 |
| `ETag` | 끝에 `.true` | 끝에 `.false` |
| 포크 `filterUserIds` 쿼리 | 두 조건을 모두 적용(필터 대상 사용자의 일반 글) | 지금과 같다 |
| 포크 `showBotMessages=false` | 숨김 적용 뒤 봇 글을 메모리에서 제거 | 지금과 같다 |

## 4. 웹소켓

| 이벤트 | 숨김 채널 | 그 밖의 채널 |
|---|---|---|
| `posted` — 추가형이 아닌 멤버십 게시물 | 보내지 않는다 | 지금과 같다 |
| `posted` — 추가형 게시물 | 추가된 사용자에게만 보낸다(`broadcast.user_id`) | 지금과 같다 |
| `channel_updated` | `disable_join_leave_messages` 값을 담는다 | 같음 |

## 5. 푸시·이메일·알림 히스토리

| 게시물 | 숨김 채널 |
|---|---|
| 추가형이 아닌 멤버십 게시물 | 푸시·이메일 없음, 포크 알림 히스토리 기록 없음 |
| 추가형 게시물 | 추가된 사용자에게 푸시·이메일·멘션, 포크 알림 히스토리 1건 |
