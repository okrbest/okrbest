# Phase 1 Data Model: 채널 비멤버 컨텐츠 접근 감사 로깅

이 기능은 신규 영속 엔티티나 DB 스키마 변경을 도입하지 않는다. 기존 감사 로그 레코드에
파라미터를 추가하는 확장이며, 아래는 spec의 Key Entities를 감사 레코드 관점에서 구체화한
것이다.

## AuditRecord (기존 엔티티 확장)

okrbest가 이미 사용 중인 `model.AuditRecord`(감사 이벤트 단위)에 다음 파라미터를 조건부로
추가한다. 신규 필드는 모두 기존 `EventData.Parameters` 맵에 부착되며, 별도 컬럼/테이블은
없다.

| 파라미터 | 타입 | 부착 조건 | 설명 |
|---|---|---|---|
| `non_channel_member_access` | bool | 응답에 포함된 컨텐츠(게시물/파일/북마크) 중 하나 이상이 요청자가 멤버가 아닌 채널에 속할 때 | 이 요청이 채널 비멤버 접근을 포함했음을 표시 (FR-001~004) |
| `non_channel_member_access_on_previews` | bool | 목록형 응답에서 게시물 자체는 멤버 채널이지만 첨부된 링크 미리보기가 비멤버 채널을 참조할 때 | 본문과 미리보기의 멤버십이 다를 수 있음을 구분 (FR-002 목록 API 한정) |
| `preview_post_id` | string | 링크 미리보기(퍼머링크 프리뷰)가 비멤버 채널의 게시물을 참조할 때 | 어떤 미리보기 게시물이 비멤버 채널에 속했는지 특정 (FR-005) |
| `channel_id` / `post_id` / `post_ids` / `file_id` / `bookmark_id` | string / string[] | 각 엔드포인트가 이미 기록하던 기존 파라미터 | 신규 추가가 아니라 기존 파라미터를 그대로 유지 — "어떤 리소스였는지" 식별 (FR-007) |

## Post (기존 도메인 엔티티, 신규 필드 없음)

- 감사 판정에 사용되는 속성: `ChannelId`(소속 채널). 이 값과 요청자의 `GetAllChannelMembersForUser`
  조회 결과를 대조해 `isMember`를 계산한다(§research.md 1).
- 저장 스키마 변경 없음.

## File (기존 도메인 엔티티, 신규 필드 없음)

- 감사 판정에 사용되는 속성: 파일이 속한 게시물의 `ChannelId`(파일 자체는 채널을 직접 참조하지
  않고 게시물을 경유하거나, 채널에 직접 연결된 경우 `ChannelId`를 사용).
- 저장 스키마 변경 없음.

## ChannelBookmark (기존 도메인 엔티티, 신규 필드 없음)

- 감사 판정에 사용되는 속성: `ChannelId`.
- 저장 스키마 변경 없음.

## ChannelMembership (판정 결과, 영속화되지 않는 파생 값)

- `isMember: bool` — 요청 처리 중 계산되어 함수 반환값으로만 전달되고, DB에 저장되지 않는다.
- 계산 방법: `a.Srv().Store().Channel().GetAllChannelMembersForUser(rctx, session.UserId, true, true)`
  결과 맵에 대상 `channelID`가 존재하는지 여부(§research.md 1, 기존 upstream 로직 그대로).

## 상태 전이

없음 — 이 기능은 읽기 경로에 감사 부착만 추가하는 것으로, 엔티티의 생명주기·상태 전이에 영향을
주지 않는다.
