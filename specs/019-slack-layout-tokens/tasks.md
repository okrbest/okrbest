# Tasks: Slack 레이아웃 리듬 공통 토큰 체계

**Input**: Design documents from `/specs/019-slack-layout-tokens/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/layout-tokens.md, quickstart.md

**Tests**: 동작 코드가 없는 기능이라 Jest 신규 테스트는 없다. 대신 원칙 III을
지키는 증거 축이 둘 있다 — 검사 스크립트는 **위반 샘플 RED**를 먼저 보고,
치환은 **치환 전 실측 JSON**을 먼저 뜬다.

**Organization**: US1 기준표 수립 → US2 무변화 치환 → US3 사용 가이드.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 기준선 저장 — 깨끗한 트리에서 `cd webapp && npm run check`,
      `npm run check-types`, `npm run test`의 실패 목록을
      `/tmp/019-baseline-{lint,types,jest}.txt`로 저장하고 요지를 tasks.md
      하단에 기록 (원칙 I; 018 마감 기록과 대조: types 11건,
      channel.test.js 23건)
- [x] T002 선행 분석 노트 커밋 준비 — 미커밋
      `specs/014-slack-design-benchmark/figma-token-audit.md`를 이 브랜치
      스테이징에 포함 (spec Assumptions)

---

## Phase 2: Foundational

**Purpose**: 실측 없이는 기준표(US1)도 치환(US2)도 못 간다.

- [x] T003 Slack 데스크톱 실측 — playwright-slack 프로파일로 app.slack.com에서
      data-model 1·2·3·4절의 `후보` 값 전부 **및 `확정` 행의 Slack 대응값**
      (target-s/l, icon-aux — 근거가 MM 관례뿐인 행의 실측 보강, FR-005)을
      `getComputedStyle`/`getBoundingClientRect`로 실측하고, 측정 지점
      (셀렉터·화면)과 값을 `specs/019-slack-layout-tokens/measurements.md`에
      기록
- [x] T004 [P] Figma 킷 보조 실측 — Figma MCP `get_design_context`로 킷
      (`6QkcWynu4O2YwZUov5IP75`)의 대응 노드 Auto Layout 수치를 추출해
      measurements.md에 병기, 실측과 차이 나는 항목은 차이 기록 (R1)
- [x] T005 data-model.md 기준표 확정 — T003·T004 결과로 `후보` → `확정` 전환,
      값이 바뀐 행은 근거 갱신. **아이콘↔폰트 균형표 4행(12→14, 13→16,
      15→18, 18→20)을 이 단계에서 확정해 data-model에 표로 추가**
      (US1 AC2의 전제 — T014는 가이드 서술만 담당). `--okr-space-1`에는
      Slack 실측 예시 지점을 근거로 병기 (SC-003). ui-ux-pro-max로
      간격·타깃·균형 가이드라인 교차 검증 결과를 근거 란에 병기 (R6)

---

## Phase 3: User Story 1 — 레이아웃 기준표가 한곳에 있다 (P1) 🎯 MVP

**Goal**: 실측 근거가 붙은 토큰 정본 파일과 완전성 대조표.

**Independent Test**: 후속 세 영역의 필요 수치 대조표가 빈칸 0 (SC-001),
브라우저에서 토큰 값 로드 확인 (quickstart 1절).

- [x] T006 [US1] 토큰 파일 신설 — `webapp/channels/src/sass/okrbest/_tokens.scss`
      에 확정 기준표를 `:root` CSS 변수로 정의 (`--okr-space-1..7`,
      `--okr-icon-*`, `--okr-target-*`, `--okr-row-*`, `--okr-radius-ms`),
      Mattermost 저작권 헤더 포함, 토큰마다 근거 주석 1줄
- [x] T007 [US1] 엔트리 연결 — okrbest 스타일 엔트리(기존 `_overrides.scss`
      로드 지점)에서 `_tokens.scss`를 로드하도록 `webapp/channels/src/sass/`
      의 import 체계에 추가하고, 브라우저에서
      `getComputedStyle(document.documentElement).getPropertyValue('--okr-space-3')`
      로 로드를 실측 확인 (quickstart 1절)
- [x] T008 [US1] 완전성 대조표 작성 — ②헤더·툴바 ③사이드바 ④메시지가 필요로
      하는 수치 유형을 나열하고 각 행에 기준표 토큰을 대응시킨 표를
      `specs/019-slack-layout-tokens/coverage.md`로 작성 — 빈칸이 나오면
      기준표에 단계를 추가하고 measurements.md에 근거를 보강 (SC-001)

**Checkpoint**: 토큰 정본 + 근거 + 완전성 증명 — MVP.

---

## Phase 4: User Story 2 — 기존 임의 수치가 기준표 값으로 바뀐다 (P2)

**Goal**: okrbest 커스텀 SCSS의 하드코딩을 무변화 치환하고 전수 검사를 상설화.

**Independent Test**: 치환 전후 실측 JSON diff 공란 (SC-002), 검사 스크립트
위반 0 + RED 증거 (SC-004).

- [x] T009 [US2] 치환 대상 전수 조사 — `sass/okrbest/*.scss`,
      `channel_header_tabs.scss`, `channel_member_stack.scss`,
      `channel_bookmarks_rhs.scss` + grep 스캔(포크 신설 SCSS 전체)에서 px
      리터럴을 전수 목록화해 data-model 7절 표를 완성 (위치·현재 값·대응
      토큰/예외)
- [x] T010 [US2] 치환 전 실측 — 치환 대상별 셀렉터로
      `scripts/okrbest/measure-layout.mjs`(신설)를 만들어 computed 값·bounding
      box를 `/tmp/baseline-layout.json`으로 저장 (원칙 III의 "전" 증거, R5).
      실행 형태: 로그인 세션이 필요하므로 Playwright 기반(로그인 포함)으로
      작성 — quickstart 2절의 `node` 호출은 이 스크립트의 래퍼 실행이다
- [x] T011 [US2] 무변화 치환 — 목록 전 항목을 동일 렌더 값의 토큰 참조로
      교체 (`var(--okr-…)`), 값 변경 금지. 비그리드 값은 data-model 6절
      예외 표에 등록 (7px 포함)
- [x] T012 [US2] 치환 후 실측 — measure-layout.mjs 재실행 →
      `/tmp/baseline-layout.json`과 diff 공란 확인, 결과를 tasks.md 하단에
      기록 (SC-002)
- [x] T013 [US2] 전수 검사 스크립트 — `scripts/okrbest/check-layout-tokens.sh`
      신설: 대상 SCSS의 px 리터럴을 허용값(토큰 값 ∪ 예외 목록)과 대조해
      위반을 파일:줄로 보고, 비0 종료. **RED 먼저**: 위반 샘플(5px)을 임시
      삽입해 비0 종료를 확인·기록한 뒤 원복 (원칙 III, SC-004)

**Checkpoint**: 코드가 기준표를 실제로 소비하며, 위반은 기계가 잡는다.

---

## Phase 5: User Story 3 — 사용 규칙이 문서로 남는다 (P3)

**Goal**: 후속 작업자가 가이드만으로 수치를 결정할 수 있다.

**Independent Test**: 샘플 3건을 가이드만 보고 풀어 기준표와 3/3 일치 (SC-005).

- [x] T014 [US3] 사용 가이드 작성 —
      `specs/019-slack-layout-tokens/usage-guide.md`: 기준표 요약,
      아이콘↔폰트 균형표(12→14, 13→16, 15→18, 18→20 — T005 확정값 기준),
      간격 단계 선택 절차, 예외 등록 절차, 검사 스크립트 사용법
- [x] T015 [US3] 가이드 단독 사용성 검증 — quickstart 6절의 샘플 3건을
      가이드만 참조해 풀고 기준표와 대조, 3/3 일치를 기록. 불일치가 나오면
      가이드를 고치고 재검 (SC-005)

---

## Phase 6: Polish & 완료 검증

- [x] T016 [P] stylelint — 신설·수정 SCSS에 `npx stylelint` 0 에러
- [x] T017 CLAUDE.md 참조 확인 — agent 컨텍스트 3면이 019 plan을 가리키는지
      재확인 (plan 단계에서 갱신됨 — 드리프트만 점검)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [ ] T018 품질 게이트 — 접촉 패키지 게이트를 돌리고, 실패 목록이 구현 전 기준선과
      같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [ ] T019 종단 검증 — 빌드·배포 후 quickstart.md 시나리오를 **실제 환경에서** 훑고
      절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [ ] T020 SC 검증 — spec.md의 SC-### 각각을 **실측값**으로 확인한다 (추정 금지)
- [ ] T021 PR 보류 게이트 — T018~T020 증거와 함께 완료를 보고하고, 사용자가
      확인하면 PR 생성 → rebase 머지로 마감한다 (원칙 VI)

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup(P1·2) → Foundational(T003~T005) → US1(T006~T008) → US2(T009~T013)
  → US3(T014~T015) → Polish·완료 검증
- US2는 US1의 토큰 파일(T006)에 의존한다. US3는 T005 확정값에 의존한다 —
  스토리 순차 진행.

### Parallel Opportunities

- T003 ∥ T004 (실측 소스가 다름 — 실제 Slack vs Figma)
- T016은 T011 이후 아무 때나

### Independent Test Criteria

- US1: coverage.md 빈칸 0 + 브라우저 토큰 로드 실측
- US2: baseline-layout diff 공란 + 검사 스크립트 RED→GREEN
- US3: 샘플 3/3 일치

### Implementation Strategy

MVP = US1 (기준표 정본). US2가 코드 소비 증명, US3가 전파 장치다. 전부 같은
브랜치·단일 PR로 마감하되(T021 보류 게이트), 스토리 경계마다 커밋을 나눈다.
