# Data Model: 읽지 않은 항목 행 뱃지 구분 병기

**Date**: 2026-10-13 | **Plan**: [plan.md](./plan.md)

서버·스토리지 변경은 없다. redux 스토어의 기존 엔티티에서 파생하는 읽기
전용 수치 하나를 정의한다.

## SplitUnreadCounts (파생 상태)

현재 팀의 미읽음을 두 수치로 나눈 집계. 셀렉터
`getSplitUnreadCountsInCurrentTeam`이 계산한다.

| 필드 | 타입 | 뜻 |
|---|---|---|
| `mentions` | number | 멘션·DM·GM 수. upstream `getUnreadStatusInCurrentTeam`의 멘션 합계와 항상 같다 (CRT 활성 시 스레드 멘션 포함) |
| `messages` | number | 일반 채널(공개·비공개)의 미읽음 메시지 수 합계. DM(`D`)·GM(`G`) 타입 채널은 제외한다 |

### 집계 규칙 (두 필드 공통)

- 현재 보고 있는 채널은 제외한다.
- 삭제된 채널, 상대가 비활성화된 DM은 제외한다.
- `calculateUnreadCount`의 `showUnread` 판정(뮤트 등)을 따른다.
- 입력: `getMyChannels`, `getMyChannelMemberships`, `getChannelMessageCounts`,
  `getUsers`, `getCurrentUserId`, `getCurrentChannelId`, `getCurrentTeamId`,
  `isCollapsedThreadsEnabled`, `getThreadCountsIncludingDirect`.

### 불변 조건

- `mentions`는 기존 멘션 뱃지 수치와 항상 일치한다 (불일치 = 회귀, SC-003).
- 두 필드는 독립 수치다 — 합산하거나 서로 빼지 않는다. 멘션이 달린 일반
  채널 메시지는 양쪽에 모두 기여할 수 있다 (spec Assumptions).
- 음수 불가. 채널 0개면 `{mentions: 0, messages: 0}`.

## 표시 규칙 (UnreadsLink 행)

| mentions | messages | 표시 |
|---|---|---|
| 0 | 0 | 뱃지 없음, 행 굵게 없음 (기존 동작) |
| >0 | 0 | 멘션 뱃지 단독 (기존 동작과 동일) |
| 0 | >0 | 일반 뱃지 단독 — `Math.min(messages, 99)` |
| >0 | >0 | 일반 뱃지(왼쪽) + 멘션 뱃지(오른쪽 끝) 병기 |

상태 전이는 없다 — 스토어 변경 시 셀렉터가 재계산하고 표가 그대로 적용된다.
