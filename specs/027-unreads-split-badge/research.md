# Research: 읽지 않은 항목 행 뱃지 구분 병기

**Date**: 2026-10-13 | **Plan**: [plan.md](./plan.md)

Technical Context에 NEEDS CLARIFICATION은 없다. 아래는 설계 결정 5건이다.

## R1. 분리 수치를 어디서 공급하나

- **Decision**: 앱 레벨 memoized 셀렉터 `getSplitUnreadCountsInCurrentTeam`
  (가칭)을 `webapp/channels/src/selectors/unreads.ts`에 신설한다. 반환형은
  `{mentions: number; messages: number}`.
- **Rationale**: upstream `getUnreadStatusInCurrentTeam`
  ([channels.ts:808](../../webapp/channels/src/packages/mattermost-redux/src/selectors/entities/channels.ts#L808))은
  reduce 내부에서 `messages`·`mentions`를 이미 모두 계산하지만, 반환형
  `BasicUnreadStatus = boolean | number`가 messages를 버린다. 입력 셀렉터
  (`getMyChannels`, `getMyChannelMemberships`, `getChannelMessageCounts` 등)와
  `calculateUnreadCount` 유틸은 모두 export되어 있어 앱 레벨에서 같은 규칙으로
  재구성할 수 있다.
- **Alternatives considered**:
  - upstream 셀렉터의 반환형 확장 — `BasicUnreadStatus` 소비처 전부에
    파급되고, sync 충돌 표면(upstream 핵심 파일)이 커진다. 기각.
  - 컴포넌트에서 직접 reduce — memoization이 없어 스토어 변경마다 전 채널
    순회가 돈다. 기각.

## R2. "일반 미읽음"에서 DM·GM을 어떻게 다루나

- **Decision**: ②(일반 뱃지)는 DM(`D`)·GM(`G`) 타입 채널을 집계에서 뺀다.
  ①(멘션 뱃지)은 upstream 집계 규칙을 그대로 쓴다 — DM·GM 새 메시지는
  `mention_count`로 이미 ①에 들어간다.
- **Rationale**: upstream의 `messages`는 DM·GM 메시지도 포함한다. 그대로
  쓰면 DM 메시지 1건이 ①과 ②에 동시에 올라 "구분 병기"라는 요구와 어긋난다.
  채널 멘션 메시지(일반 채널에서 @멘션)는 성격이 다른 두 수치(멘션 횟수 vs
  미읽음 메시지 수)라 중복을 허용한다 (spec Assumptions).
- **Alternatives considered**: ②에서 멘션 메시지 수까지 빼는 정밀 중복 제거 —
  멤버십 카운터로는 채널별 "멘션이 달린 메시지 수"를 알 수 없어 불가능하다.
  기각.

## R3. 집계 경계 규칙은 upstream과 어디까지 맞추나

- **Decision**: upstream reduce의 경계 규칙을 그대로 따른다 — 현재 보고 있는
  채널 제외, 삭제된 채널(DM 상대 비활성 포함) 제외, `calculateUnreadCount`의
  `showUnread`(뮤트 등) 판정 준수. CRT(collapsed threads) 활성 시 스레드
  멘션을 ①에 더하는 규칙도 유지한다.
- **Rationale**: 행 하나에 두 집계가 다른 경계 규칙을 쓰면 수치가 서로
  모순돼 보인다. 기존 멘션 뱃지와 숫자가 달라지면 회귀다 (spec SC-003).
- **Alternatives considered**: 현재 채널 포함 — upstream 뱃지와 수치가
  어긋난다. 기각.

## R4. 뱃지 표기를 어떻게 재사용하나

- **Decision**: spec 025의 `span.badge.unreadMsgBadge`(testid
  `unreadMsgBadge`) 마크업과 `_overrides.scss`의 색 규칙(파랑 틴트
  `rgba(var(--button-bg-rgb), 0.14)` + `var(--link-color)` 글자)을 그대로
  쓴다. 캡은 025와 동일하게 **`Math.min(x, 99)` — 표시 최대 99**다.
  멘션 뱃지는 기존 `ChannelMentionBadge`를 손대지 않는다.
- **Rationale**: 기존 scss 셀렉터 `#SidebarContainer .SidebarChannel
  .unreadMsgBadge.badge`는 `UnreadsLink`의 DOM(`ul.SidebarUnreads >
  li.SidebarChannel`)에도 그대로 적용된다 — 추가 색 규칙 없이 동작할
  가능성이 높고, 간격(뱃지 2개 병기 시 마진)만 확인한다.
- **Spec 정정**: spec.md의 FR-004·SC-005가 "99+"로 적혀 있었다. 025의 실제
  규칙은 "100 이상이면 99 표시"다. spec을 99로 정정한다.
- **Alternatives considered**: 전용 뱃지 컴포넌트 신설 — 표기 규칙이 025와
  갈라질 통로를 만든다. 기각.

## R5. 뱃지 순서와 자리

- **Decision**: 일반 뱃지(파랑 틴트)가 왼쪽, 멘션 뱃지(강조색)가 오른쪽 끝.
  멘션 뱃지의 기존 DOM 위치를 유지하고 일반 뱃지를 그 앞(before)에 둔다.
- **Rationale**: 멘션 뱃지는 사용자가 이미 익힌 위치다. 채널 행(025)에서는
  두 뱃지가 상호 배타(멘션 있으면 멘션만)지만, 이 행은 병기가 요구라 순서
  규칙이 새로 필요하다 — 긴급한 것을 끝에 고정해 시선 기준점을 지킨다.
- **Alternatives considered**: 멘션 왼쪽·일반 오른쪽 — 멘션 뱃지 위치가
  상태에 따라 움직여 기준점이 흔들린다. 기각.
