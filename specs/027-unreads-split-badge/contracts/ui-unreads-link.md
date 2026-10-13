# UI Contract: UnreadsLink 행 뱃지

**Date**: 2026-10-13 | **Plan**: [../plan.md](../plan.md)

이 기능의 외부 인터페이스는 UI 한 곳이다. 테스트와 실측이 이 계약을 검증한다.

## 셀렉터 계약

```ts
// webapp/channels/src/selectors/unreads.ts
getSplitUnreadCountsInCurrentTeam(state: GlobalState): {
    mentions: number;   // 멘션·DM·GM 합계 — 기존 멘션 뱃지 수치와 동일
    messages: number;   // 일반 채널(공개·비공개) 미읽음 메시지 합계
}
```

- memoize: 입력 셀렉터가 모두 같으면 같은 객체를 반환한다.
- `mentions`는 `getUnreadStatusInCurrentTeam`이 number를 반환하는 모든
  상태에서 그 값과 같다.

## DOM 계약 (UnreadsLink 행)

| 요소 | 셀렉터/testid | 조건 |
|---|---|---|
| 멘션 뱃지 | 기존 `ChannelMentionBadge` 산출 DOM | `mentions > 0`일 때만. 행 우측 끝 위치·모양 모두 기존과 동일 |
| 일반 뱃지 | `span.badge.unreadMsgBadge`, testid `unreadMsgBadge` | `messages > 0`일 때만. 멘션 뱃지의 바로 왼쪽 |
| 일반 뱃지 내용 | 텍스트 | `Math.min(messages, 99)` |

- 두 뱃지가 함께 보일 때 DOM 순서: 일반 뱃지 → 멘션 뱃지.
- `mentions === 0 && messages === 0`이면 두 뱃지 모두 DOM에 없다.
- 색: 일반 뱃지는 `rgba(var(--button-bg-rgb), 0.14)` 배경 +
  `var(--link-color)` 글자 (025 규칙, `_overrides.scss` 기존 셀렉터
  `#SidebarContainer .SidebarChannel .unreadMsgBadge.badge`가 적용).

## 회귀 보호 계약

- `mentions > 0 && messages === 0` 상태의 렌더 결과는 변경 전과 DOM이
  동일하다 (일반 뱃지 미존재, 멘션 뱃지 동일).
- 행 클릭 동작(`/:team/unreads` 이동), 아이콘, 라벨 문자열은 바꾸지 않는다.
