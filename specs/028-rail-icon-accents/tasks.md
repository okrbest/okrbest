# Tasks: 레일 제품 아이콘 액센트 색상 상태

**Input**: Design documents from `/specs/028-rail-icon-accents/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/ui-rail-product-button.md, quickstart.md

**Tests**: 원칙 III에 따라 JS 동작 변경(applyTheme dataset)은 RED 출력을
먼저 남긴다. 순수 SCSS 변경은 Jest(jsdom)로 계측 불가 — quickstart 실주행이
검증을 대신하며, 그 사유를 해당 과제 옆에 적었다 ([research R5](./research.md)).

**Organization**: user story별 묶음. 각 story는 독립 구현·독립 검증이 가능하다.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 브랜치와 기준선 — 원칙 I·VI의 전제

- [x] T001 master에서 작업 브랜치 `028-rail-icon-accents` 생성 (`git checkout -b 028-rail-icon-accents master`). **선행 조건**: 작업 트리에 남은 027 관련 미커밋 변경을 먼저 분리한다(027 커밋 마무리 또는 stash) — 무관 변경이 섞이면 원칙 VI(집중 PR) 위반
- [x] T002 구현 전 기준선 저장 — `baseline.txt`(요약) + `baseline-failed-suites.txt`(실패 25 스위트 목록) + `baseline-lint-types.txt`(eslint 104건·tsc 13건 목록) — `webapp/channels`에서 `{ npm run check; npm run check-types; npm run test -- --silent; } 2>&1 | tail -40 > specs/028-rail-icon-accents/baseline.txt` (quickstart.md 명령 그대로, 마감 diff의 비교 대상)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `body[data-theme-type]` 속성 계약(C1) — US3 다크 분기와 US2
다크 아이콘 색이 이 속성에 의존한다

**⚠️ CRITICAL**: US3는 이 phase 없이 구현할 수 없다 (US1·US2의 라이트
규칙은 속성 없이도 동작하지만, 훅을 먼저 깔아 분기 지점을 확정한다)

- [x] T003 applyTheme dataset RED 테스트 — RED 증거: `Expected: "Onyx" / Received: undefined` (기능 부재 실패 확인, 2026-10-14). jsdom(nwsapi)이 changeCss의 중첩 속성 선택자에서 throw하는 한계는 테스트 내 try/catch로 격리(주석 명기) — `webapp/channels/src/utils/utils.test.tsx`에 추가: Onyx 테마로 `applyTheme()` 호출 시 `document.body.dataset.themeType === 'Onyx'`, Slate 시 `'Slate'`. 구현 전 실행해 **실패 출력을 이 과제 옆에 기록**한다 (원칙 III). 구현 노트: 기존 utils.test.tsx에 applyTheme 테스트가 없다 — `applyTheme()`는 jsdom에서 `DesktopApp.updateTheme`·`changeCss`·`cssVars`(ponyfill)를 호출하므로 기존 mock 패턴을 먼저 확인하고, 필요하면 이 과제에서 mock을 함께 추가한다
- [x] T004 applyTheme에 dataset 설정 1줄 추가 — GREEN 증거: utils.test.tsx `Tests: 23 passed, 23 total` (dataset 설정은 applyTheme 첫머리 — 이후 호출 실패와 무관하게 속성 보장) — `webapp/channels/src/utils/utils.tsx`의 `applyTheme()` 안에 `document.body.dataset.themeType = theme.type;` (okrbest 주석 포함). T003 테스트가 GREEN이 되는 출력을 기록한다

**Checkpoint**: `data-theme-type` 계약 성립 — SCSS가 테마를 분기할 수 있다

---

## Phase 3: User Story 1 - 선택된 제품이 한눈에 보인다 (Priority: P1) 🎯 MVP

**Goal**: 선택 알약을 인디고 솔리드(#28427B) + 흰 아이콘으로, 라벨 굵게

**Independent Test**: 라이트 모드에서 채널 선택 시 채널 알약만 인디고
솔리드 + 흰 아이콘인지 DevTools로 확인 (quickstart SC-001 스니펫)

- [x] T005 [US1] 선택 상태 스타일 교체 — `webapp/channels/src/sass/layout/_team-sidebar.scss`의 `.rail-product-button.active` 블록: 알약 배경 `rgba(sidebar-text 0.16)` → `var(--indigo-400)` 솔리드, 아이콘 색 `#fff`(`var(--neutral-0)`), stroke-width 0.8·라벨 700 유지. 검증: Jest 불가(jsdom) — quickstart SC-001 실주행으로 판정, 사유는 research R5
- [x] T006 [US1] 기존 컴포넌트 테스트 회귀 확인 — `Tests: 46 passed, 46 total` (team_sidebar 5개 스위트 + utils) — `npx jest src/components/team_sidebar --silent` 통과 출력 기록 (마크업 불변 계약 C2 — active 클래스·aria-current 유지)

**Checkpoint**: 라이트 모드에서 선택 식별이 성립 — MVP

---

## Phase 4: User Story 2 - 평상시에도 제품 영역이 구분된다 (Priority: P2)

**Goal**: 비선택 알약에 파랑 틴트 + 파랑 아이콘, hover/focus 반응, 글리프
확대, 버튼 반투명 제거

**Independent Test**: 아무 조작 없는 레일에서 비선택 알약 배경이
`rgba(28, 88, 217, 0.14)`이고 아이콘이 또렷한지 확인 (quickstart 스니펫)

- [x] T007 [US2] 평상시·hover 스타일 교체 — **색 변수 변경**: `--denim-button-bg(-rgb)`가 stylelint deprecated 규칙에 걸려 테마 연동 `--button-bg(-rgb)`로 구현 (research R2 갱신, spec FR-001 갱신) — `_team-sidebar.scss` `.rail-product-button`: ① 알약 기본 배경 `rgba(var(--denim-button-bg-rgb), 0.14)`, 아이콘 색 `var(--denim-button-bg)` ② hover/focus 배경 `rgba(var(--denim-button-bg-rgb), 0.2)` (기존 `rgba(sidebar-text 0.08)` 대체) ③ 버튼 전체 `opacity: 0.73` 및 hover opacity 복원 규칙 제거 (FR-005) ④ 라벨 명도 위계(600/700)는 유지. 구현 노트: `.rail-product-button`의 `color`는 라벨·아이콘이 공유(currentColor)하므로 아이콘 색은 `__icon` 한정 선택자로 건다 — 버튼 레벨에 걸면 라벨까지 파랗게 샌다 (FR-005 라벨 위계 유지). 검증: quickstart FR-006 실주행 — Jest 불가 사유는 research R5
- [x] T008 [US2] 글리프 확대 — 같은 블록 `.rail-product-button__icon svg` 치수 `var(--okr-icon-rail)` → `28px` 오버라이드 (토큰 불변 사유 주석 — research R3). 검증: quickstart SC-005 rect 실측
- [x] T009 [US2] 스타일 게이트 확인 — `_team-sidebar.scss` 단독 stylelint exit 0. 저장소 전체 stylelint는 기존 결함 68건으로 실패(전부 미접촉 파일 — `stylelint-preexisting.txt` 목록 + 변경 파일 목록 비교로 증명; 기준선에선 eslint가 먼저 실패해 stylelint 미실행) — `webapp/channels`에서 `npm run check` (stylelint 포함) 통과 출력 기록

**Checkpoint**: 라이트 모드 표시가 설계 표(data-model.md)와 일치

---

## Phase 5: User Story 3 - 다크모드에서도 선택 상태가 또렷하다 (Priority: P3)

**Goal**: Onyx에서 선택 알약 밝은 인디고(#32539A), 비선택 아이콘 밝은 파랑

**Independent Test**: 테마 토글로 다크 전환 시 선택 알약 배경이
`rgb(50, 83, 154)`로 바뀌는지 확인 (quickstart SC-002)

- [x] T010 [US3] 다크 분기 스타일 — `_team-sidebar.scss`에 `body[data-theme-type='Onyx']` 한정 규칙 추가: ① `.rail-product-button.active .rail-product-button__icon` 배경 `var(--indigo-300)` ② 비선택 아이콘 색 `var(--link-color)` (Onyx #5D89EA — research R2). 속성 부재 시 라이트 기본값이 적용되는 구조(계약 C1 비보장 조항)를 지킨다. 검증: quickstart SC-002·FR-008 실주행 — Jest 불가 사유는 research R5

**Checkpoint**: 세 user story 모두 독립 검증 가능

---

## Phase 6: Polish & 완료 검증

**Purpose**: 범위 밖 불변 확인과 증거 수집

- [x] T011 [P] 범위 밖 불변 확인 — `git diff master`로 SCSS 변경이 rail-product 블록 + 신규 Onyx 블록에 한정됨을 확인, 스크린샷에서 팀 버튼·토글 표시 동일 (measurements.md) — 팀 전환 버튼·테마 토글·프로필 표시가 변하지 않았는지 실주행으로 확인하고 기록 (FR-010). `.fa` 공용 opacity 규칙 등 `_team-sidebar.scss`의 다른 블록을 건드리지 않았는지 diff로 확인
- [x] T012 [P] 접근성 확인 — focus 틴트 `rgba(18,100,163,0.2)` 실측, 대비 9.74:1(라이트)/7.40:1(다크) ≥ 4.5:1, 포커스 링은 공용 a11y 시스템 소관으로 미간섭 (measurements.md) — Tab 포커스 시 틴트 반응 + 포커스 표시 가림 없음 (Edge Case), 두 모드 대비 실측값 기록 (FR-009)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [x] T013 품질 게이트 — eslint·tsc 실패 목록 diff 기준선과 완전 일치, Jest 실패 25 스위트 목록 diff 일치(통과 +1 = 신규 applyTheme 테스트), stylelint는 접촉 파일 exit 0 + 기존 결함 68건 목록화. 증거: `final-gates.txt`, `final-lint-types.txt`, `final-failed-suites.txt`, `stylelint-preexisting.txt` — `webapp/channels`에서 `npm run check && npm run check-types && npm run test`를 돌리고, 실패 목록이 T002 기준선(`baseline.txt`)과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다. 결과는 `specs/028-rail-icon-accents/final-gates.txt`로 저장
- [x] T014 종단 검증 — 로컬 dev 서버 실주행(Playwright): 로그인 → 레일 계측 → 테마 왕복 전환 → (플러그인 복구 후) 보드·플레이북 포함 3버튼 재계측. 전 절 통과 (measurements.md) — dev 서버 실주행으로 quickstart.md 시나리오를 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [x] T015 SC 검증 — SC-001~005 전부 실측 통과 (SC-004는 플러그인 복구 후 실제 클릭 이동으로 확인). 실측값·스크린샷: `measurements.md`, `screenshots/` — spec.md의 SC-001~005 각각을 **실측값**(스크린샷·DevTools 계측·대비 계산)으로 확인한다 (추정 금지). 측정값을 quickstart.md 표 옆 또는 별도 `measurements.md`에 기록

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 선행 없음
- **Foundational (Phase 2)**: T001 뒤. T003(RED) → T004(GREEN) 순서 고정
- **US1 (Phase 3)**: T002 뒤면 시작 가능 (다크 분기와 무관 — Phase 2와 병행 가능하지만, 같은 SCSS 파일을 만지므로 순차 권장)
- **US2 (Phase 4)**: US1 뒤 권장 (같은 `.rail-product-button` 블록 — 파일 충돌 방지)
- **US3 (Phase 5)**: **Phase 2 완료 필수** (data-theme-type 속성 의존) + US1·US2 뒤 (덮어쓸 기본 규칙이 먼저 있어야 함)
- **Polish (Phase 6)**: 전 story 완료 뒤. T011·T012는 [P] 병행 가능

### Parallel Opportunities

- T003(utils.test.tsx)과 T005(_team-sidebar.scss)는 파일이 달라 병행 가능
- T011·T012는 서로 병행 가능
- 그 외 SCSS 과제(T005·T007·T008·T010)는 같은 파일이라 순차 실행

## 2차 색 확정 (2026-10-14)

사용자 피드백으로 색을 레퍼런스 실측값(#0866FF 솔리드 / #4F46E5 솔리드,
두 테마 공용)으로 교체 — research R2-v3, measurements.md v2 절. 변경 파일은
`_team-sidebar.scss` 1곳(Onyx 분기 제거 포함). stylelint exit 0, 접촉 Jest
46/46 재확인. T005·T007·T010의 색 서술은 R2-v3가 정본이다.

## 완료 검증 결과 (2026-10-14)

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| TDD RED→GREEN | `npx jest src/utils/utils.test.tsx -t "applyTheme"` | RED(`Received: undefined`) → GREEN(23/23) | T003·T004 기록 |
| eslint | `npx eslint ./src eslint.config.mjs --quiet --cache` | 실패 104건 — 기준선 목록과 diff 일치 | baseline/final-lint-types.txt |
| check-types | `npx tsc -b` | 실패 13건 — 기준선 목록과 diff 일치 | 〃 |
| Jest 전체 | `npm run test -- --silent` | 25 스위트 실패 — 기준선 목록과 diff 일치, 통과 12159→12160(+1 신규) | baseline/final-failed-suites.txt, final-gates.txt |
| stylelint | `npx stylelint "**/*.{css,scss}" --cache` | 접촉 파일 exit 0, 기존 결함 68건(미접촉 파일) | stylelint-preexisting.txt |
| 종단(quickstart) | dev 서버 실주행 + Playwright 계측 | 전 절 통과 (보드·플레이북 플러그인 번들 복구 후 3버튼 재계측 포함) | measurements.md, screenshots/ |
| SC 실측 | quickstart 스니펫 + WCAG 계산 | SC-001~005 전부 ✅ | measurements.md |

## Implementation Strategy

**MVP = Phase 1~3** (Setup + Foundational + US1): 라이트 모드 선택 식별만으로
가치가 성립한다. 이후 US2(평상시 틴트) → US3(다크) 순으로 증분 전달하고,
각 checkpoint에서 quickstart 해당 절을 실주행한다.
