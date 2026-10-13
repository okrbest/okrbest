# Tasks: 읽지 않은 항목 행 뱃지 구분 병기

**Input**: Design documents from `/specs/027-unreads-split-badge/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/ui-unreads-link.md, quickstart.md

**Tests**: 포함한다 — constitution 원칙 III(실패를 본 테스트만 인정)이 요구한다.
테스트 과제는 **구현 전 실패(RED) 출력**을 과제 옆에 기록해야 완료다.

**Organization**: user story 단위로 묶는다. 각 story는 독립 검증 가능하다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능 (다른 파일, 미완료 과제 의존 없음)
- **[Story]**: US1(병기) / US2(일반 단독) / US3(회귀 보호)

## Phase 1: Setup

**Purpose**: 브랜치와 기준선 — constitution 원칙 VI·I

- [X] T001 작업 브랜치 생성: `git switch master && git pull --ff-only && git switch -c 027-unreads-split-badge` (master 직접 커밋 금지)
- [X] T002 기준선 저장: `webapp/channels`에서 `npm run check`, `npm run check-types`, `npm run test`를 돌려 실패 목록을 `specs/027-unreads-split-badge/baseline.txt`에 기록 (구현 전 상태 — 마감 때 diff 근거)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 분리 집계 셀렉터 — 세 story 전부가 이 수치에 의존한다

**⚠️ CRITICAL**: 이 phase가 끝나야 story 구현을 시작한다

- [X] T003 셀렉터 단위 테스트 작성(RED): `webapp/channels/src/selectors/unreads.test.ts` — 케이스: ① `mentions`가 upstream `getUnreadStatusInCurrentTeam`의 number 반환값과 일치(DM 멘션 포함) — CRT off/on 두 상태 모두(on이면 스레드 멘션 포함, research R3), ② `messages`에서 DM(`D`)·GM(`G`) 채널 제외, ③ 현재 보는 채널 제외, ④ 뮤트 채널 제외, ⑤ 상대가 비활성화된 DM 제외, ⑥ 채널 없음 → `{mentions: 0, messages: 0}`, ⑦ 같은 state 재호출 시 같은 참조(memoize). **모듈이 없어 전부 실패하는 출력을 기록한다**
- [X] T004 셀렉터 구현(GREEN): `webapp/channels/src/selectors/unreads.ts` — `getSplitUnreadCountsInCurrentTeam`, 입력·경계 규칙은 data-model.md, `// okrbest:` 마커 + 저작권 헤더. T003 전건 통과 출력을 기록한다

**Checkpoint**: 셀렉터 계약(contracts/ui-unreads-link.md §셀렉터) 충족

---

## Phase 3: User Story 1 - 두 수치를 병기한다 (Priority: P1) 🎯 MVP

**Goal**: 멘션·DM·GM 수와 일반 미읽음 수가 행 우측에 나란히 보인다

**Independent Test**: 멘션 ≥1 + 일반 미읽음 ≥1 상태에서 뱃지 2개가 각자의
수로, 일반(왼쪽)→멘션(오른쪽 끝) 순서로 보인다

### Tests for User Story 1

- [X] T005 [US1] 컴포넌트 테스트 추가(RED): `webapp/channels/src/components/sidebar/unreads_link/unreads_link.test.tsx` — `mentions>0 && messages>0`에서 ① testid `unreadMsgBadge`와 멘션 뱃지가 모두 존재, ② DOM 순서가 일반 → 멘션, ③ 일반 뱃지 텍스트 = `Math.min(messages, 99)`(120 → `99`). **구현 전 실패 출력 기록**

### Implementation for User Story 1

- [X] T006 [US1] `webapp/channels/src/components/sidebar/unreads_link/unreads_link.tsx` 수정 — `getSplitUnreadCountsInCurrentTeam` 사용, `ChannelMentionBadge` 바로 앞에 `span.badge.unreadMsgBadge`(testid `unreadMsgBadge`, 99 캡) 조건부 렌더. 기존 행 클릭·아이콘·라벨은 그대로. T005 통과 출력 기록
- [X] T007 [P] [US1] 병기 간격 확인: dev 서버 실제 렌더로 두 뱃지 사이 여백을 보고, 필요할 때만 `webapp/channels/src/components/sidebar/unreads_link/unreads_link.scss`에 최소 간격 규칙 추가 (색 규칙은 `sass/okrbest/_overrides.scss` 025 규칙을 재사용 — 신규 색 규칙 금지, research.md R4). 사이드바를 최소 폭으로 줄여 뱃지 2개가 유지되고 행 제목이 말줄임되는지도 확인

**Checkpoint**: US1 단독 검증 가능 — quickstart 시나리오 1

---

## Phase 4: User Story 2 - 일반 미읽음만 있어도 수치를 보여준다 (Priority: P2)

**Goal**: 멘션 0일 때 일반 뱃지 단독 표시

**Independent Test**: 멘션 0 + 일반 미읽음 n 상태에서 일반 뱃지 `n` 하나만 보인다

### Tests for User Story 2

- [X] T008 [P] [US2] 테스트 추가: `unreads_link.test.tsx` — `mentions=0 && messages=5`에서 일반 뱃지 `5` 단독, 멘션 뱃지 DOM 부재. T006 구현이 이미 커버해 첫 실행에 통과하면 **구현 조건을 임시로 뒤집어 실패를 확인한 뒤 복원**하고 그 출력을 기록한다 — 못 했으면 과제 옆에 `미검증` 표기 (원칙 III)

**Checkpoint**: US1·US2 모두 독립 검증 가능 — quickstart 시나리오 2

---

## Phase 5: User Story 3 - 멘션만 있으면 기존과 같다 (Priority: P3)

**Goal**: 회귀 보호 — 멘션 단독 상태의 DOM이 변경 전과 동일

**Independent Test**: 멘션 m + 일반 0 상태에서 멘션 뱃지 `m` 하나만, 일반
뱃지 DOM 부재

### Tests for User Story 3

- [X] T009 [US3] 회귀 테스트 추가: `unreads_link.test.tsx` — ⓐ `mentions=2 && messages=0`에서 `unreadMsgBadge` 부재 + 멘션 뱃지 수치 `2`, ⓑ `mentions=0 && messages=0`에서 두 뱃지 모두 DOM 부재 (FR-005). RED 확인은 T008과 같은 요령(조건 임시 반전) — 안 되면 `미검증` 표기

**Checkpoint**: 세 story 모두 독립 검증 가능

---

## Phase 6: Polish & 완료 검증

**Purpose**: 증거 수집과 마감

- [X] T010 실측 기록 작성: SC-001~005를 quickstart.md 절차로 실주행하고 상태별 스크린샷·대비 측정값을 `specs/027-unreads-split-badge/measurements.md`에 기록

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [X] T011 품질 게이트 — `webapp/channels`에서 `npm run check` + `npm run check-types` + `npm run test`를 돌리고, 실패 목록이 T002 기준선(`baseline.txt`)과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [X] T012 종단 검증 — webpack watch 반영 상태에서 quickstart.md 시나리오를 **dev 서버 실주행으로** 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [X] T013 SC 검증 — spec.md의 SC-001~SC-005 각각을 **실측값**으로 확인한다 (추정 금지) — T010의 measurements.md가 근거

- [X] T014 커밋·PR: Conventional Commits(`feat(webapp): …`)로 커밋을 정리하고, 사용자 확인 후 push + PR 생성 (rebase merge, 원칙 VI)

---

## 증거 기록 (진행 중)

- T003 RED: `Cannot find module './unreads'` — 스위트 전건 실패 (모듈 부재)
- T004 GREEN: `Tests: 8 passed, 8 total`
- T005 RED: 신규 5케이스 중 3건 실패 (병기·캡·US2 — unreadMsgBadge 부재), US3·FR-005는 첫 실행 통과
- T006 GREEN: 컴포넌트 8 + 셀렉터 8 = `16 passed`
- T008·T009 RED 검증: 구현 조건을 `messages >= 0`으로 임시 반전 → US3 `1 failed`, FR-005 `1 failed` 확인 후 복원 → `8 passed` (원칙 III 충족, 미검증 아님)
- 변경 4개 파일 eslint CLEAN, unreads_link.scss stylelint CLEAN
- T007: 간격 8px(기존 .badge 마진, scss 추가 불필요), 180px 좁은 폭에서 뱃지 유지 — measurements.md
- T010·T012·T013: quickstart 시나리오 1~5를 dev 서버 실주행으로 완료, SC-001~005 전건 실측 통과 — measurements.md (websocket 지연 비고 포함)
- 기준선(T002, baseline.txt): eslint 104건·check-types 8건(TS2307 @mattermost/components)·jest 164건/50스위트 — 전부 기존 결함

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1(Setup) → Phase 2(Foundational) → Phase 3~5(Story) → Phase 6(Polish)
- Phase 2가 끝나기 전에는 어떤 story도 시작하지 않는다 (셀렉터 의존)

### User Story Dependencies

- US1(P1): Phase 2 완료 후 시작. 다른 story 의존 없음
- US2(P2): 렌더 조건이 T006 구현에 포함되므로 US1 뒤에 검증한다
- US3(P3): US1 뒤에 검증한다 (회귀 비교 대상이 T006 구현)

### Within Each Story

- 테스트(RED) → 구현(GREEN) → 확인 순서를 지킨다
- T005~T009는 같은 테스트 파일을 만지므로 순서대로 진행한다 (T008·T009는
  서로 다른 describe 블록이면 이어서 작성 가능)

### Parallel Opportunities

- T007(scss 확인)과 T008(US2 테스트)은 다른 파일이라 병렬 가능
- 그 외에는 단일 구현자 기준 직렬이 자연스럽다 — 과제가 작고 파일이 겹친다

---

## Implementation Strategy

**MVP = Phase 1~3 (US1)**. T006까지 끝나면 병기 표시가 동작하고, US2·US3은
같은 구현의 다른 상태를 검증만 한다. 중단 지점은 각 Checkpoint다.

1. Setup + Foundational → 셀렉터 완성 (T001~T004)
2. US1 → 병기 렌더 (T005~T007) → quickstart 시나리오 1로 검증 (MVP)
3. US2·US3 → 상태별 검증 보강 (T008~T009)
4. Polish → 실측·게이트 diff·SC 기록 후 커밋·PR (T010~T014)

---

## Notes

- 모든 테스트 과제는 실패 출력을 과제 옆에 기록해야 완료다 (원칙 III)
- upstream 파일(`packages/mattermost-redux/`) 수정 금지 — research.md R1
- 사용자 노출 문자열 추가 금지 상태 유지 — 생기면 원칙 V(i18n 동시 갱신) 발동
- 커밋은 과제 묶음 단위로, master 직접 커밋 금지 (원칙 VI)

---

## 완료 검증 결과 (T011~T013)

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| 품질 게이트 | `npm run check` / `check-types` / `test` | 기준선과 실패 목록 동일 — eslint 104건·TS2307 8건·jest 50스위트/164건(우리 파일 0개), 통과 +13은 신규 테스트 | baseline.txt ↔ final-gates.txt diff |
| 종단 검증 | quickstart 시나리오 1~5 실주행 | 전 절 통과 (websocket 지연 비고 1건) | measurements.md + 스크린샷 6장 |
| SC 검증 | SC-001~005 실측 | 전건 실측 통과 — 대비 최저 4.16:1(Onyx 일반) | measurements.md 표 |
