# Phase 1 데이터 모델: 읽지 않은 항목 모아보기

새 저장소를 만들지 않는다. 화면은 기존 redux 상태를 읽어 뷰 모델을 조립하고,
쓰기는 기존 읽음 처리 액션 하나로 끝낸다. 여기서 정의하는 구조는 전부
화면(컴포넌트) 계층의 파생 모델이다.

## 뷰 모델

### UnreadChannelGroup (파생, 화면 전용)

채널 하나와 그 채널의 읽지 않은 메시지 묶음. spec의 "읽지 않은 메시지 그룹"에
해당한다.

| 필드 | 원천 | 비고 |
|---|---|---|
| `channel` | `state.entities.channels.channels[id]` | 이름·유형(O/P/D/G)·표시 정보. DraftTitle에 그대로 전달 |
| `mentionCount` | 멤버십 `mention_count` (CRT 켜짐이면 root 계열) | 그룹 정렬·배지 |
| `lastViewedAt` | 멤버십 `last_viewed_at` | 본문 선별 기준. **진입 시 스냅샷에 고정** — 읽음 처리로 갱신돼도 소비 중 본문이 사라지지 않게 한다 |
| `postIds` | posts store에서 `create_at > lastViewedAt`인 해당 채널 포스트 | 적재 부족 시 `loadUnreads` 보충. 삭제·시스템 메시지 처리 규칙은 기존 포스트 목록 유틸을 따른다 |
| `isCollapsed` | 컴포넌트 로컬 상태 | 세션 한정, 저장 안 함 (FR-012) |
| `isMarkedRead` | 컴포넌트 로컬 상태 | 읽음 처리 후 목록 제거 연출용 |

### UnreadsSnapshot (파생, 화면 전용)

진입(또는 배너 갱신) 시점에 고정하는 그룹 목록 (research 결정 6).

| 필드 | 원천 | 비고 |
|---|---|---|
| `channelIds` | `getUnreadChannels` → `sortUnreadChannels` 결과의 id 배열 | 멘션 우선 → 최근 활동순 (FR-003) |
| `lastViewedAtByChannel` | 스냅샷 시점 멤버십 | 그룹별 본문 선별 기준 고정 |
| `takenAt` | 클라이언트 시각 | 배너 신규 판정 참조 |

**신규 항목 판정**: 현재 `getUnreadChannels` 결과 − 스냅샷 `channelIds` −
읽음 처리된 id = 배너에 세는 "새 항목 N개" (FR-013).

## 상태 원천 (기존, 변경 없음)

| 상태 | 위치 | 쓰임 |
|---|---|---|
| 채널 메시지 수 | `entities.channels.messageCounts` | 읽지 않음 판정(`calculateUnreadCount`) |
| 내 멤버십 | `entities.channels.myMembers` | `msg_count`·`mention_count`·`last_viewed_at` |
| 수동 안읽음 | `entities.channels.manuallyUnread` | 판정 포함 (spec Edge) |
| 포스트 | `entities.posts` | 그룹 본문 |
| 사이드바 배지 | 기존 셀렉터 체인 | FR-015 — 화면과 같은 원천이므로 어긋날 수 없다 |

## 상태 전이

```text
[미읽음 채널 존재]
   │ 화면 진입 (라우트 /:team/unreads)
   ▼
[스냅샷 고정] ──────────────────────────────┐
   │ 그룹별 포스트 적재(적중분 즉시, 부족분 loadUnreads)   │ 새 미읽음 발생
   ▼                                        ▼
[소비 중] ◄──────────────── [배너 "새 항목 N개"] — 클릭 시 스냅샷 재고정
   │ 읽음 동작 (그룹 버튼 / Esc / 전체 버튼)
   ▼
readMultipleChannels(ids)  → 서버 반영 + websocket 전파
   │ 성공: 그룹 제거, 배지 갱신 (FR-008)
   │ 실패: 그룹 유지 + 오류 안내 (spec Edge)
   ▼
[모든 그룹 소진] → 빈 상태 (FR-014)
```

다른 기기 읽음(websocket `MultipleChannelsViewed`)은 기존 리듀서가 멤버십을
갱신하므로, 화면은 해당 그룹을 다음 갱신 때 제거한다 (US3-3).

## 검증 규칙

- 읽지 않음 판정은 `calculateUnreadCount`(뮤트 채널은 멘션 없으면 제외) 하나만
  쓴다. 화면 자체 판정 로직을 만들지 않는다 (FR-015).
- 스냅샷의 채널이라도 현재 멤버십이 아니게 되면(추방·보관) 갱신 때 제거한다.
- 포스트가 비어 있는 그룹(본문 적재 실패)은 머리글 + 실패 안내만 그린다.
