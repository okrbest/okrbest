---

description: "Task list for 검색 결과 RHS 팝아웃"

---

# Tasks: 검색 결과 RHS 팝아웃

**Input**: Design documents from `/specs/008-search-rhs-popout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (모두 존재)

**Tests**: constitution 원칙 III(동작 변경 시 테스트 동반)에 따라 각 단계에 테스트 태스크를 포함한다 — upstream cherry-pick/adapt 예외가 아닌 spec 경로 신규 개발이므로 TDD를 그대로 적용한다.

**Organization**: 태스크는 spec.md의 사용자 스토리(P1/P2/P3)별로 그룹화되어 독립적으로 구현·검증할 수 있다.

> **"최대한 upstream과 동일하게" 지시에 따른 구조 설명**: 참조 upstream 커밋(`2bd143ce`)은 5개 RHS 모드(검색/멘션/저장됨/고정됨/채널파일)를 하나의 컴포넌트(`rhs_search_popout.tsx`)와 하나의 제목 매핑 함수(`title.ts`)로 한 PR에서 동시에 구현했다 — 모드별 스위치 분기가 원래 한 몸이다. 이를 spec.md의 User Story 경계(P1 검색/P2 나머지 모드/P3 팝아웃 내 상호작용)에 맞춰 코드 레벨까지 인위적으로 쪼개면, 007에서 겪었던 것처럼(`SearchEngineInterface`를 스토리마다 나눠 mock을 3번 재생성한 사례) upstream diff와의 대조가 어려워지고 없던 오버헤드가 생긴다. 그래서 이 tasks.md는 **모드 스위치를 포함한 핵심 컴포넌트·라우팅·제목 매핑 구현을 upstream 원본처럼 Foundational 단계에서 한 번에 작성**하고, User Story 단계(P1/P2/P3)는 그 위에서 **해당 모드/상호작용에 대한 검증(테스트 케이스·quickstart 시나리오)과 나머지 소비 측 배선(search_results.tsx의 트리거 지점, post 컴포넌트의 팝아웃 분기 등 실제로 파일이 분리되어 있는 부분)**에 집중한다. 단, **테스트 커버리지 자체는 스토리 경계를 따라 점진적으로 확장**한다 — `rhs_search_popout.test.tsx`는 Foundational(T005)에서 기본(검색) 모드만 다루고, 나머지 4개 모드 테스트는 US2(T019)에서 추가해 최종적으로 upstream과 동일한 5개 모드 커버리지(221줄 규모)에 도달한다. 구현과 테스트의 이 비대칭(구현은 한 번에, 테스트는 점진적으로)이 자연스럽다 — 코드는 upstream처럼 모드 스위치 하나로 두되, 검증은 스토리 우선순위에 맞춰 단계적으로 쌓는 것이 spec-kit의 "스토리별 독립 검증" 취지에 부합한다.
>
> **2026-08-10 `/speckit-analyze` 반영**: 최초 초안에서 T005가 "5개 모드 케이스 전부 포함"이라고 서술하면서 동시에 T019가 같은 파일에 "4개 모드 케이스 보강"이라고 적어 서로 모순됐다(analyze 발견 F1) — 위 문단과 T005/T019 설명을 "Foundational은 검색 모드만, US2가 나머지 4개 모드를 추가"로 정정했다. 또한 검색어 변경·팀 변경·새로고침 후 상태 복원 같은 팝아웃 창 내 상호작용(FR-005, FR-006, SC-003, SC-004)이 어느 자동화 테스트에도 명시적으로 걸려 있지 않았던 공백(E1)을 T005 설명에 채워 넣었고, FR-007(채널명 클릭)이 spec.md에서는 User Story 3 시나리오로 적혀 있으나 실제로는 Phase 3(US1)에서 구현·검증된다는 불일치(C1)를 Phase 5 서두에 각주로 명시했다.
>
> **2026-08-10 `/speckit-implement` 반영 — "최대한 upstream 대로 반영해줘" 지시에 따른 실제 실행 편차**:
> - 계획은 파일별로 테스트→구현을 단계마다 손으로 작성하는 것이었으나, 실제로는 `git merge-file`을 이용한 **3-way 병합**(base=upstream 부모 커밋 `5aefff30`, ours=fork HEAD, theirs=`2bd143ce`)으로 27개 파일 전부를 한 번에 반영했다. upstream diff를 그대로 재현하면서 포크 자체 기능(멘션 필터, `NOTIFICATION_HISTORY` RHS 상태, 알림 히스토리 등)과의 충돌만 골라 수동 해결(4개 파일: `search/index.tsx`, `search/search.tsx`, `search/types.ts`, `search_results/types.ts` — 전부 "포크가 유지해야 할 필드 vs upstream이 제거한 필드"류의 단순 충돌)하는 방식이 손으로 다시 타이핑하는 것보다 upstream과의 일치도·정확성이 훨씬 높아 이 방법을 택했다. 그 결과 T005/T019(테스트), T002~T014(Foundational 구현), T015~T018(US1), T021~T025(US3)가 사실상 파일 단위로 동시에 반영됨 — 태스크 구분은 아래 체크박스와 커밋 메시지로 추적성만 유지.
> - T021: 계획 시점에는 `post_component.test.tsx`를 "신규 파일(61줄)"로 잘못 가정했으나, 실제로는 포크에 이미 663줄짜리 파일이 존재했고 upstream이 61줄을 추가한 것(724줄 결과). fork가 그 파일을 base 이후 전혀 건드리지 않았음을 확인(`diff` 결과 동일)했으므로 3-way 병합 결과는 안전하게 upstream 버전과 일치.
> - **계획에 없던 추가 작업**: `search_results/types.ts` 병합 후 `mentionFilter`/`onMentionFilterChange`가 `OwnProps` 필수 필드로 남았는데, upstream의 `rhs_search_popout.tsx`는 이 포크 전용 기능을 모른 채 작성되어 `tsc` 오류(TS2739)가 발생했다. `rhs_search_popout.tsx`에 `getMentionFilter` 셀렉터 + `showMentions` 디스패치를 배선해 팝아웃 창에서도 멘션 필터가 동작하도록 보강했다(그렇지 않으면 멘션 모드 팝아웃에서 필터 버튼이 죽은 링크가 됨 — SC-002 "100% 동일 재현"에 위배). 같은 이유로 `search_results.test.tsx`의 `baseProps`에도 두 필드를 추가했다.
> - T001(webapp 개발 서버 기동), T020/T028(quickstart.md 수동 브라우저 시나리오 검증)은 **미실행** — 이 세션 환경에서 대화형 브라우저 조작이 불가능한 제약(007의 라이브 Elasticsearch 미실행과 동일한 성격의 환경 제약). 대신 `tsc -b`(0 errors), `eslint`(0 errors), 관련 jest 스위트 실행으로 대체 검증했다.
> - jest 실행: `rhs_popout.test.tsx`(37개), `popout_windows.test.ts`, `use_browser_popout.test.ts`는 통과. `post_component.test.tsx`, `rhs_search_popout.test.tsx`, `use_search_results_actions.test.ts`, `search_results.test.tsx` 4개는 이 환경의 `RegExp.escape is not a function`(jsdom 전역이 Node 24의 `RegExp.escape`를 노출하지 않는 사전 존재 환경 결함 — `git stash`로 이번 변경을 전부 되돌려도 동일하게 실패함을 확인) 때문에 실행 자체가 차단됨. 코드는 tsc/eslint 통과 + upstream 원본과의 3-way 병합 정확성으로 간접 검증.

## 실행 결과 요약 (2026-08-10)

| Phase | 상태 | 비고 |
|---|---|---|
| Setup (T001) | 미실행 | 환경 제약 — 브라우저 대화형 조작 불가 |
| Foundational (T002-T014) | 반영 완료 | 3-way 병합, tsc/eslint 통과 |
| US1 (T015-T018) | 반영 완료 | 병합으로 이미 포함, `search_results.test.tsx`에 테스트 존재 확인 |
| US2 (T019-T020) | 반영 완료 / 수동검증 미실행 | 5개 모드 테스트 파일에 모두 존재 확인(코드 리뷰), 브라우저 수동 검증은 환경 제약으로 미실행 |
| US3 (T021-T025) | 반영 완료 | 병합으로 이미 포함, `returnTo` 배선 확인 |
| Polish (T026-T028) | e2e 반영 완료 / 품질게이트 통과(접촉 파일 한정) / quickstart 미실행 | 아래 "품질 게이트 결과" 참고 |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 사용자 스토리(US1/US2/US3)
- 모든 태스크에 정확한 파일 경로를 포함한다

## Path Conventions

기존 webapp 컴포넌트 구조를 그대로 사용한다: `webapp/channels/src/`(React + TS). server 변경 없음. plan.md의 Project Structure 참고.

---

## Phase 1: Setup

**Purpose**: 로컬 검증 환경 준비(코드 변경 없음)

- [ ] T001 webapp 개발 서버 기동 확인: `cd webapp && npm run run`(quickstart.md 사전 준비) — 브라우저 팝업 차단 해제 확인.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 팝아웃 라우팅·핵심 컴포넌트·제목 매핑 — 모든 사용자 스토리가 공유하는 배관(plumbing). upstream 원본과 동일하게 5개 모드를 한 번에 다루는 단위로 작성한다(상단 구조 설명 참고).

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없다.

### Tests for Foundational ⚠️

> 아래 테스트를 먼저 작성하고 구현 전에 반드시 실패하는지 확인한다(constitution 원칙 III).

- [x] T002 [P] `use_search_results_actions` 훅 테스트 작성 — webapp/channels/src/components/common/hooks/use_search_results_actions.test.ts (upstream 실제 파일, 155줄). `updateSearchTerms`/`updateSearchTeam`/`getMorePostsForSearch`/`getMoreFilesForSearch`/`setSearchFilterType` 각 액션이 올바른 redux 액션을 dispatch하는지 검증 — 특히 `getMorePostsForSearch`/`getMoreFilesForSearch`(FR-006 추가 로드/페이지네이션 배선)와 `setSearchFilterType`(메시지/파일 필터 전환 배선)을 명시적으로 포함한다.
- [x] T003 [P] `rhs_popout` 라우팅 테스트 갱신(신규 `/search` 서브라우트, channel query-param 파싱) — webapp/channels/src/components/rhs_popout/rhs_popout.test.tsx
- [x] T004 [P] `popout_windows` 테스트 갱신(`popoutRhsSearch` 신규, `popoutRhsPlugin` 시그니처 변경 — channelName optional) — webapp/channels/src/utils/popouts/popout_windows.test.ts
- [x] T005 [P] `rhs_search_popout` 컴포넌트 테스트 작성 — webapp/channels/src/components/rhs_search_popout/rhs_search_popout.test.tsx (신규, 이 단계에서는 **기본(검색) 모드만** 다룬다 — 나머지 4개 모드는 US2의 T019에서 추가해 upstream 실제 파일과 동일한 최종 규모(221줄)에 도달한다). 검색 모드 기준으로 다음을 포함: URL 쿼리(`q`/`type`/`searchTeamId`) → redux 상태 초기 동기화, 검색어 변경 시 URL 갱신(FR-005), `handleUpdateSearchTeam` 호출 시 대상 팀 변경 반영(FR-005), 새로고침(재마운트) 후 URL로부터 상태 복원(SC-004).

### Implementation for Foundational

- [x] T006 [P] `use_search_results_actions` 훅 구현(검색어 갱신·팀 변경·추가 로드·필터 전환을 `search/index.tsx`에서 추출) — webapp/channels/src/components/common/hooks/use_search_results_actions.ts (depends on T002)
- [x] T007 [P] `search/index.tsx`, `search/search.tsx`, `search/types.ts`를 훅 사용 구조로 축소 리팩터 — 현재 `search.tsx` 574줄에서 대폭 축소 (depends on T006)
- [x] T008 [P] `plugins/registry.ts`의 `registerRHSPluginPopoutListener` 타입에서 `channelName`을 optional로 변경 — webapp/channels/src/plugins/registry.ts. `popoutRhsPlugin`이 채널 없는 팝아웃도 허용하도록 T009에서 시그니처가 바뀌므로, 그 타입과 일관되게 이 시점에 함께 넓힌다(T009와 동시 진행 가능, 독립적인 파일이라 별도 선행 의존성 없음)
- [x] T009 `popout_windows.ts`에 `popoutRhsSearch` 함수 추가, `popoutRhsPlugin` 시그니처를 query-param 방식으로 조정, `use_browser_popout.ts` 연동 타입 조정 — webapp/channels/src/utils/popouts/popout_windows.ts, webapp/channels/src/utils/popouts/use_browser_popout.ts (depends on T004, T008)
- [x] T010 [P] `rhs_search_popout/title.ts` 작성 — RHS 모드(search/mention/flag/pin/channel-files) → 팝아웃 제목 매핑 5종 (data-model.md 참고) — webapp/channels/src/components/rhs_search_popout/title.ts (신규, depends on T005)
- [x] T011 `rhs_search_popout/rhs_search_popout.tsx` + `index.ts` 작성 — URL 쿼리(`q`/`type`/`mode`/`channel`/`searchTeamId`) ↔ redux 검색 상태(`actions/views/rhs`) 동기화, 기존 `SearchResults` 프레젠테이션 컴포넌트 재사용, 5개 모드 분기 — webapp/channels/src/components/rhs_search_popout/rhs_search_popout.tsx, index.ts (신규, depends on T006, T010)
- [x] T012 `popout_controller.tsx` 라우트 패턴 단순화(`/_popout/rhs/:team/:identifier` → `/_popout/rhs/:team`) — webapp/channels/src/components/popout_controller/popout_controller.tsx (depends on T003)
- [x] T013 `rhs_popout.tsx`에 `/search` 서브라우트 추가, channel identifier를 query param(`?channel=`)으로 파싱하도록 수정 — webapp/channels/src/components/rhs_popout/rhs_popout.tsx (depends on T003, T011, T012)
- [x] T014 [P] `en.json` + `ko.json`에 `rhs_search_popout.title.*` 5개 키 동시 추가(constitution 원칙 V — 이 기능은 sync 예외 미적용, 정식 en/ko 동시 갱신) — webapp/channels/src/i18n/en.json, webapp/channels/src/i18n/ko.json (depends on T010)

**Checkpoint**: 팝아웃 라우팅·핵심 화면·제목 인프라 준비 완료 — 사용자 스토리 구현 시작 가능. `search_results_header.tsx`는 이미 `newWindowHandler`/`PopoutButton`을 지원하므로(이전 sync `#34692`로 반영됨) 이 단계에서 변경하지 않는다.

---

## Phase 3: User Story 1 - 검색 결과를 별도 창으로 팝아웃 (Priority: P1) 🎯 MVP

**Goal**: 검색 결과 RHS 헤더의 팝아웃 버튼으로 현재 검색 결과(메시지/파일, 크로스팀 컨텍스트 포함)를 별도 창에서 동일하게 볼 수 있다.

**Independent Test**: quickstart.md 시나리오 1 — 검색 후 팝아웃 버튼 클릭 시 3초 이내 동일 결과가 표시된 새 창이 열리는지, 필터 전환이 동일하게 동작하는지 확인.

### Tests for User Story 1 ⚠️

- [x] T015 [P] [US1] `search_results.tsx`의 `newWindowHandler`/채널명 클릭 동작 테스트 갱신 — webapp/channels/src/components/search_results/search_results.test.tsx (upstream 실제 파일, 183줄 변경 규모)

### Implementation for User Story 1

- [x] T016 [US1] `search_results.tsx`에 `newWindowHandler` 구현 — 현재 모드(검색/멘션/저장됨/고정됨/채널파일)를 판별해 `popoutRhsSearch` 호출 — webapp/channels/src/components/search_results/search_results.tsx (depends on T015, T009)
- [x] T017 [US1] `search_results.tsx`에 `handleChannelNameClick` 구현 — 검색 결과 채널명 클릭 시 원래 창을 해당 채널로 이동(FR-007) — depends on T015
- [x] T018 [P] [US1] `search_results/types.ts`에 팝아웃 관련 신규 props 타입 추가 — webapp/channels/src/components/search_results/types.ts (depends on T016)

**Checkpoint**: User Story 1이 독립적으로 완전히 동작·검증 가능(quickstart.md 시나리오 1). 이 시점에 검색 팝아웃은 실사용 가능한 MVP다.

---

## Phase 4: User Story 2 - 멘션 · 저장된 메시지 · 고정된 메시지 · 채널 파일을 팝아웃 (Priority: P2)

**Goal**: 검색 외 4개 RHS 모드(최근 멘션/저장된 메시지/고정된 메시지/채널 파일)도 동일하게 팝아웃되며, 각 모드에 맞는 제목이 표시된다.

**Independent Test**: quickstart.md 시나리오 2 — 4개 모드 각각을 열고 팝아웃해 제목·내용이 올바른지 확인.

### Tests for User Story 2 ⚠️

- [x] T019 [US2] `rhs_search_popout.test.tsx`에 mention/flag/pin/channel-files 4개 모드 케이스 신규 작성 — Foundational(T005)은 검색(기본) 모드만 다뤘으므로, 이 단계에서 나머지 4개 모드(제목 매핑 포함)를 추가해 upstream 실제 파일과 동일한 5개 모드 커버리지(221줄 규모)에 도달한다 — webapp/channels/src/components/rhs_search_popout/rhs_search_popout.test.tsx (depends on T005, T011)

### Implementation for User Story 2

- [ ] T020 [US2] 4개 모드별 팝아웃 동작 수동 검증 및 발견된 회귀 수정 — 모드 분기 자체는 T010(title.ts)·T011(rhs_search_popout.tsx)에서 이미 구현되어 있으므로(상단 구조 설명 참고), 이 단계는 quickstart.md 시나리오 2 실행과 T019 테스트 통과 확인에 집중한다. 회귀 발견 시 T010/T011 파일을 수정.

**Checkpoint**: 5개 RHS 모드 전부 독립적으로 팝아웃·검증 가능(quickstart.md 시나리오 1, 2).

---

## Phase 5: User Story 3 - 팝아웃 창에서 검색 결과 상호작용 (Priority: P3)

**Goal**: 팝아웃 창 안에서도 검색어 수정·필터 전환·페이지네이션·채널 이동뿐 아니라, 결과 게시물의 댓글(스레드) 열기가 팝아웃 창 자체를 바꾸지 않고 별도 스레드 팝아웃으로 열린다.

**Independent Test**: quickstart.md 시나리오 3 — 팝아웃 창에서 검색어 변경, 추가 로드, 채널명 클릭, 댓글 열기(별도 스레드 팝아웃), 새로고침 후 상태 복원을 확인.

> **참고(`/speckit-analyze` C1 반영)**: spec.md의 User Story 3는 검색어 변경·팀 변경·필터 전환·추가 로드·채널명 클릭·댓글 열기를 함께 시나리오로 서술하지만, 이 중 검색어 변경·팀 변경·새로고침 복원(FR-005/SC-004)은 Foundational(T005), 추가 로드·필터 전환(FR-006)은 Foundational(T002), **채널명 클릭(FR-007)은 User Story 1(T015/T017)에서 이미 구현·검증된다** — `search_results.tsx`는 파일 하나라 US1에서 한 번에 작성됐기 때문이다. 이 Phase 5에서 **신규로 추가되는 것은 댓글 열기 → 별도 스레드 팝아웃 라우팅(FR-008)뿐**이며, 나머지는 이미 완료된 항목의 재확인이다.

### Tests for User Story 3 ⚠️

- [x] T021 [P] [US3] `post_component.test.tsx` 신규 작성 — 팝아웃 창 내 댓글 클릭 시 스레드 팝아웃(`/_popout/thread/...`)으로 라우팅되는지 검증 — webapp/channels/src/components/post/post_component.test.tsx (신규, upstream 실제 파일 61줄)

### Implementation for User Story 3

- [x] T022 [US3] `post/index.tsx`에 `isPopoutWindow` 기반 `canReply` 분기 추가(검색 팝아웃 안에서도 댓글 가능하도록) — webapp/channels/src/components/post/index.tsx (depends on T021). 007의 `channel null` 가드(같은 파일, 다른 라인)와 충돌 없음 — research.md 결정 5 참고.
- [x] T023 [US3] `post_component.tsx`에서 검색 팝아웃 안의 댓글 클릭을 감지해 스레드 팝아웃으로 라우팅(`returnTo` 파라미터 포함) — webapp/channels/src/components/post/post_component.tsx (depends on T021)
- [x] T024 [P] [US3] `thread_popout.tsx`에 `returnTo` 파라미터 처리 추가(스레드 팝아웃에서 검색 팝아웃 컨텍스트로 복귀) — webapp/channels/src/components/thread_popout/thread_popout.tsx
- [x] T025 [P] [US3] `thread_pane.tsx`/`.scss` 정리(upstream 리팩터 범위, 팝아웃 관련 정합성) — webapp/channels/src/components/threading/global_threads/thread_pane/thread_pane.tsx, thread_pane.scss

**Checkpoint**: 3개 사용자 스토리 모두 독립적으로 동작·검증 가능(quickstart.md 시나리오 1~4 전체).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 스토리에 걸친 e2e 검증 및 품질 게이트

- [x] T026 [P] e2e 검색 팝아웃 시나리오 작성 — e2e-tests/playwright/specs/functional/channels/search/search_popout.spec.ts (신규, upstream 실제 파일 237줄 — 검색/멘션/저장됨/고정됨/채널파일 팝아웃 + 창 내 상호작용 포괄). Playwright는 이 세션 환경에서 실행하지 않음(브라우저 구동 불가) — 파일 내용은 upstream 그대로.
- [x] T027 [P] webapp 접촉 패키지 품질 게이트(constitution 원칙 I) — 아래 "품질 게이트 결과" 참고. `npm run check`(전체 repo 실행)는 이 fork에 이미 존재하는 무관한 결함(303 eslint errors, 66 stylelint errors — 전부 우리가 건드리지 않은 파일)으로 통과하지 못하지만, 접촉 파일 한정 실행은 전부 클린.
- [ ] T028 quickstart.md 4개 시나리오 전체 수동 검증 실행 및 결과 기록 — **미실행**: 이 세션 환경에 대화형 브라우저가 없어 수동 시나리오 검증 불가(T001과 동일한 환경 제약). 브라우저 환경에서 별도 실행 필요.

### 품질 게이트 결과 (T027)

- **`tsc -b`(전체 monorepo)**: 접촉 파일 0 errors. 나머지 12건은 전부 우리가 건드리지 않은 기존 결함(`admin_definition_ldap_wizard.tsx`, `license_settings.test.tsx`, `channel_header.test.tsx`, `emoji_node.test.ts`, `markdown_paste_plugin.tsx`, `post_view.test.tsx`) — 007의 T036에서 이미 동일하게 확인된 기존 결함군과 일치.
- **`eslint`(접촉 파일 24개 한정)**: 0 errors(경고만, `--quiet` 기준 통과). **`eslint`(전체 `src/` 실행)**: 303 errors — 전부 `lexical_editor/*`, `more_direct_channels`, `new_search/recent_searches.tsx`, `textbox.tsx`, `user_settings_display.tsx`, `types/store/draft.ts`, `utils/local_storage.ts` 등 우리가 전혀 건드리지 않은 파일에서 발생(grep으로 접촉 파일 0건 확인) — fork에 누적된 기존 결함, 이번 세션 범위 밖.
- **`stylelint`(접촉 scss 파일 2개 한정: `thread_pane.scss`, `rhs_popout.scss`)**: 0 errors. **`stylelint`(전체 `**/*.{css,scss}}`)**: 66 errors — 전부 무관한 기존 파일(`notification_history_panel.scss`, `suggestion_list.scss` 등), 우리가 만든/수정한 scss 라인은 0건 포함.
- **jest(접촉 스위트 7개)**: `rhs_popout.test.tsx`(37개 통과), `popout_windows.test.ts`, `use_browser_popout.test.ts` 통과. `post_component.test.tsx`, `rhs_search_popout.test.tsx`, `use_search_results_actions.test.ts`, `search_results.test.tsx`는 이 환경의 사전 존재 결함(`RegExp.escape is not a function` — jsdom 전역에 Node 24의 신규 API가 노출되지 않음, `git stash`로 변경 전체를 되돌려도 동일하게 실패함을 확인)으로 실행 자체가 차단됨. 브라우저 기반 CI 환경에서는 정상 실행될 것으로 예상되나 이 세션에서는 직접 확인 불가.
- **`go mod tidy` 등 server 게이트**: 해당 없음 — 이 기능은 webapp 전용, server 변경 없음.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 막음(BLOCKS)
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능. MVP 핵심.
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능. 코드는 이미 Foundational에 포함되어 있어(상단 구조 설명) 실질적으로 검증 중심 — US1과 병행 가능.
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능. `post`/`thread_popout` 파일은 US1/US2와 무관한 별도 파일이라 독립적으로 진행 가능.
- **Polish (Phase 6)**: 구현하기로 한 모든 사용자 스토리 완료 후.

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 이후 독립적으로 시작 가능 — MVP.
- **User Story 2 (P2)**: 모드 스위치 코드 자체는 Foundational에 포함되므로 US1과 병렬로 검증 가능하나, `search_results.tsx`의 `newWindowHandler`(US1, T016)가 모든 모드의 트리거 지점이므로 US1 완료 후 검증하는 편이 자연스럽다.
- **User Story 3 (P3)**: `post/index.tsx`, `post_component.tsx`, `thread_popout.tsx`는 US1/US2와 다른 파일이라 병렬 진행 가능.

### Within Each Phase

- 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다(constitution 원칙 III).
- Foundational: 훅/라우팅/컴포넌트 순서(위 의존성 참고) → i18n.
- User Story: 테스트 → 구현 → 검증.

### Parallel Opportunities

- Foundational 테스트(T002~T005)는 서로 다른 파일이라 병렬 가능.
- T006(훅), T008(registry 타입)은 서로 다른 파일이라 병렬 가능. T007은 T006 완료 후.
- T010(title.ts)은 T005 완료 후 다른 태스크와 병렬 가능.
- US1의 T018(types.ts)은 T016 완료 후 병렬 가능.
- US3의 T024(thread_popout), T025(thread_pane)는 T021~T023과 다른 파일이라 병렬 가능.
- Polish의 T026(e2e), T027(품질 게이트)은 병렬 가능.

---

## Parallel Example: Foundational

```bash
# Foundational 테스트를 함께 작성:
Task: "use_search_results_actions 훅 테스트 in webapp/channels/src/components/common/hooks/use_search_results_actions.test.ts"
Task: "rhs_popout 라우팅 테스트 갱신 in webapp/channels/src/components/rhs_popout/rhs_popout.test.tsx"
Task: "popout_windows 테스트 갱신 in webapp/channels/src/utils/popouts/popout_windows.test.ts"
Task: "rhs_search_popout 컴포넌트 테스트 in webapp/channels/src/components/rhs_search_popout/rhs_search_popout.test.tsx"

# 테스트 실패 확인 후 훅·타입 구현을 함께 진행:
Task: "use_search_results_actions 훅 구현 in webapp/channels/src/components/common/hooks/use_search_results_actions.ts"
Task: "plugins/registry.ts 타입 조정 in webapp/channels/src/plugins/registry.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 막음, upstream 컴포넌트·라우팅 전체 포함)
3. Phase 3: User Story 1 완료
4. **중단하고 검증**: quickstart.md 시나리오 1로 User Story 1을 독립적으로 테스트
5. 준비되면 배포/데모(이 시점에 이미 나머지 4개 모드도 코드상 동작하지만, 공식 검증은 US2에서)

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비(라우팅·핵심 컴포넌트 전체)
2. User Story 1 추가 → 독립 검증 → 배포/데모(MVP!)
3. User Story 2 추가(4개 모드 검증) → 독립 검증 → 배포/데모
4. User Story 3 추가(팝아웃 내 상호작용 — 댓글/스레드 팝아웃) → 독립 검증 → 배포/데모
5. 각 스토리는 이전 스토리를 깨지 않고 가치를 더한다

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음
- [Story] 라벨은 태스크를 사용자 스토리에 추적 가능하게 연결한다
- 각 사용자 스토리는 독립적으로 완료·검증 가능해야 한다
- 구현 전 테스트가 실패하는지 반드시 확인한다
- 태스크 단위 또는 논리적 묶음 단위로 커밋한다
- 각 체크포인트에서 멈춰 스토리를 독립적으로 검증할 수 있다
- 피해야 할 것: 모호한 태스크, 같은 파일 충돌, 스토리 독립성을 깨는 교차 의존성
- Foundational 단계가 upstream 원본처럼 5개 모드를 한 번에 구현하므로, US2 단계에서 "새 코드가 없는데 왜 태스크가 있나" 싶다면 상단 구조 설명과 T020을 참고 — 검증 전담 단계다.
