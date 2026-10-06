# Tasks: Slack 디자인 벤치마킹

**Input**: `specs/014-slack-design-benchmark/` 설계 문서 (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: 포함한다 — constitution 원칙 III(실패를 본 테스트만 인정)이 요구한다.
단위 테스트가 닿지 않는 CSS 시각 변경은 각 과제 옆에 사유를 적고 계측 하네스
실측(SC)으로 판정한다.

**Organization**: user story 단위로 묶어 각 스토리를 독립 구현·독립 검증한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능 (다른 파일, 미완료 과제 의존 없음)
- **[Story]**: 소속 user story (US1~US5)
- 경로는 저장소 루트 기준

## Phase 1: Setup

**Purpose**: 기준선 확보와 자산 조달 — 증거의 출발점

- [ ] T001 게이트 기준선 저장 — `cd webapp && npm run check / check-types / test` 출력을 `/tmp/014-baseline-*.log`로 보존 (quickstart §1, 원칙 I)
- [ ] T002 계측 기준선 재계측 — `/home/sdh/okrbest/okrbest-design/okrbest-design`에서 `extract.mjs`·`extract-layouts.mjs` 실행 후 `capture/` → `baseline-014/` 보존. 계측 환경(인증·Chromium)이 없으면 `미실행`으로 기록하고 2026-08-10 계측값을 잠정 기준선으로 쓴다 (Assumption 1)
- [ ] T003 [P] 폰트 조달 — Noto Sans KR 400·600·900 woff2, Metropolis Black(900) woff, Open Sans ExtraBold(800) woff2를 `webapp/channels/src/fonts/`에 추가하고 `webapp/channels/src/fonts/README.md`에 OFL·Unlicense 고지 추가 (R5·R6, FR-017)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 전 스토리가 공유하는 토대

**⚠️ CRITICAL**: 이 phase 완료 전에 user story 작업 금지

- [ ] T004 [P] WCAG 대비 계산 헬퍼 작성 — `webapp/channels/src/packages/mattermost-redux/src/utils/wcag_contrast.ts` (상대 휘도·대비율 공식, 저작권 헤더). 자체 단위 테스트 `wcag_contrast.test.ts` 동반 — 알려진 짝(`#1D1C1D`/`#EAEAEA` = 14.1 등)으로 먼저 실패를 확인한다
- [ ] T005 [P] 오버라이드 파티얼 뼈대 — `webapp/channels/src/sass/okrbest/_overrides.scss` 생성(저작권 헤더), `webapp/channels/src/sass/styles.scss` **마지막** `@include meta.load-css('okrbest/overrides')` 추가 (FR-019)

**Checkpoint**: 토대 완료 — 이후 스토리는 우선순위 순 또는 병렬 진행 가능

---

## Phase 3: User Story 1 — 기본 화면이 Slack의 층과 강조로 보인다 (Priority: P1) 🎯 MVP

**Goal**: slate 프리셋 신설·기본 지정, 사이드바 글자 불투명화, 활성 채널 반전

**Independent Test**: 미설정 계정으로 접속해 무채색 3단 크롬·활성 반전·선명한
사이드바 글자를 실측 (SC-001~003 일부, SC-008)

### Tests for User Story 1 ⚠️ 구현 전 실패 확인 필수

- [ ] T006 [US1] slate 계약 테스트 작성 — `webapp/channels/src/packages/mattermost-redux/src/utils/theme_slate.test.ts`: ① `THEMES.slate` 존재와 data-model §1 값 ② `getDefaultTheme()`(환경설정 없음)이 slate 반환 ③ slate 명도 3단(teamBar < sidebar < center 휘도) ④ slate 반전 짝 대비 ≥ 7.0 ⑤ 사이드바 글자 대비 ≥ 8.8. **실행해 실패 출력을 과제 옆에 기록한다**

### Implementation for User Story 1

- [ ] T007 [US1] `ThemeKey`에 `'slate'` 추가 + `THEMES.slate` 삽입 — `webapp/channels/src/packages/mattermost-redux/src/selectors/entities/preferences.ts:136`, `webapp/channels/src/packages/mattermost-redux/src/constants/preferences.ts:96` (값: data-model §1)
- [ ] T008 [US1] 기본 테마 폴백 교체 — `webapp/channels/src/packages/mattermost-redux/src/selectors/entities/preferences.ts:181` `THEMES.denim` → `THEMES.slate` (R2)
- [ ] T009 [US1] 사이드바 글자 알파 제거 — `webapp/channels/src/sass/layout/_sidebar-left.scss`의 `rgba(var(--sidebar-text-rgb), 0.64)` → `var(--sidebar-text)` 치환 (L183·221·299·455·512·519·592-606·690-710·841·867·923·1063) (R4, FR-005). *Jest 불가 — jsdom은 SCSS를 적용하지 않는다. SC-001·002 실측이 판정*
- [ ] T010 [US1] 활성 채널 반전 — `webapp/channels/src/sass/layout/_sidebar-left.scss:1144-1163` 활성 배경을 `var(--sidebar-text-active-border)`·글자를 `var(--sidebar-text-active-color)`로 교체, `:1174-1184` 좌측 4px 바 제거, 활성 항목 내 아이콘·뱃지 색 추종 확인 (R3, FR-006·007). *Jest 불가 — SC-002 실측이 판정*
- [ ] T011 [P] [US1] 전역 헤더 글자 교정 — `webapp/channels/src/components/global_header/global_header.tsx:21` `rgba(var(--sidebar-text-rgb), 0.64)` → `var(--sidebar-text)`
- [ ] T012 [P] [US1] FOUC 정적 폴백을 slate 값으로 — `webapp/channels/src/sass/base/_css_variables.scss:1-63` (R2)
- [ ] T013 [P] [US1] slate 노출 문자열 — `webapp/channels/src/i18n/en.json`·`ko.json` 같은 변경에서 추가 (`admin.experimental.defaultTheme.options.slate` 등 기존 denim 키 패턴을 따라 전수 확인) (FR-018, 원칙 V)
- [ ] T014 [US1] 기존 테스트·스냅샷 갱신 — THEMES 6종화 영향 범위 (`premade_theme_chooser`, preferences selectors, `user_settings_theme` 등). 갱신 전 실패 출력을 확인하고 기록한다
- [ ] T015 [US1] T006 통과 출력 저장 + 육안 확인 — quickstart §3의 1·2·7 (기본 slate, 활성 반전, 저장 테마 보존)

**Checkpoint**: US1 단독으로 배포 가능 — MVP

---

## Phase 4: User Story 2 — 글자 위계가 Slack 수준으로 선다 (Priority: P2)

**Goal**: 본문 15/22, 제목 18/900, 크기 6단, 한글 폰트 명시

**Independent Test**: 채널 화면 타이포 실측 — SC-004

> CSS·폰트 변경이라 Jest가 닿지 않는다(jsdom은 스타일시트·폰트를 적용하지
> 않는다). 이 phase의 판정은 SC-004 실측이다 — 과제별 사유 명기.

### Implementation for User Story 2

- [ ] T016 [US2] `@font-face` 추가와 스택 교체 — `webapp/channels/src/sass/base/_typography.scss`: Noto Sans KR 400·600·900, Metropolis Black(900), Open Sans 800 파일을 `font-weight: 900`으로 등록, 전부 `font-display: swap`. 본문 스택 `'Open Sans', 'Noto Sans KR', sans-serif`, 제목 스택 `Metropolis, 'Noto Sans KR', sans-serif` (R5·R6, FR-011). *판정: SC-004 실측*
- [ ] T017 [US2] 기준 15px·본문 행간 22px — `webapp/channels/src/sass/okrbest/_overrides.scss`에 `.app__body { font-size: 15px }`, 메시지 본문·작성창 입력 `line-height: 22px` (R7, FR-008). *판정: SC-004 실측*
- [ ] T018 [US2] 채널 제목 18px/900/24px — `webapp/channels/src/sass/layout/_headers.scss:217-228` 값 치환 (FR-009)
- [ ] T019 [P] [US2] 작성자 이름 굵기 900 — `webapp/channels/src/sass/components/_post.scss`의 작성자 이름 규칙 탐색 후 값 치환 (FR-009)
- [ ] T020 [P] [US2] 사이드바 채널명 15px — `webapp/channels/src/sass/layout/_sidebar-left.scss:1053-1065` (항목 높이 32px 유지)
- [ ] T021 [US2] 단계 밖 크기 수렴·한글 잘림 점검 — 채널 화면 선택자에서 12·13·15·18·22·28 밖 크기를 grep으로 목록화해 단계로 수렴(FR-010), 행간 1.25 미만 제목 교정, 영향받는 스냅샷 갱신

**Checkpoint**: US1+US2 독립 동작

---

## Phase 5: User Story 3 — 어떤 프리셋을 골라도 읽을 수 있다 (Priority: P3)

**Goal**: 프리셋 5종 의미색·반전 짝 교정, 의미색 기본값 일원화

**Independent Test**: 프리셋 5종 전환 실측 — SC-005

### Tests for User Story 3 ⚠️ 구현 전 실패 확인 필수

- [ ] T022 [US3] 프리셋 대비 계약 테스트 작성 — `webapp/channels/src/packages/mattermost-redux/src/utils/theme_presets_contrast.test.ts`: 6종 전부 × (오류·링크·버튼·멘션 글자 4.5+ / 구분선·상태 점 3.0+ / 반전 짝 7.0+), `setThemeDefaults({})` 기본값 통과. **현재 값으로 실행해 실패 출력을 기록한다** (Denim 구분선 2.80 등)

### Implementation for User Story 3

- [ ] T023 [US3] 프리셋 5종 교정 — `webapp/channels/src/packages/mattermost-redux/src/constants/preferences.ts` data-model §2 표 적용 (반전 짝 + 의미색). 미달이 남으면 색조 유지·명도 조정으로 T022를 통과시킨다 (R11, FR-004)
- [ ] T024 [US3] `setThemeDefaults` 의미색 기본값 — `webapp/channels/src/packages/mattermost-redux/src/utils/theme_utils.ts:136-171` (data-model §2 기본값 표). 기존 `theme_utils` 테스트 영향 확인·갱신
- [ ] T025 [US3] T022 통과 출력 저장 + 프리셋 전환 육안 확인 — quickstart §3-3

**Checkpoint**: 전 프리셋 AA — US1~US3 독립 동작

---

## Phase 6: User Story 4 — 좁은 화면에서 본문이 먼저다 (Priority: P4)

**Goal**: 사이드바 기본 폭 비례화, 드래그 저장값 우선 유지

**Independent Test**: 1024px 뷰포트 본문 폭 실측 — SC-006

### Implementation for User Story 4

- [ ] T026 [US4] 기본 폭 비례화 — `webapp/channels/src/sass/layout/_sidebar-left.scss:7-33`: `var(--overrideLhsWidth, 264px)` 폴백을 `clamp(180px, 19vw, 440px)`로, 뷰포트 단계별 `max-width`(264/304/440)를 단일 `max-width: 440px`로 통합. 768px 이하 드로어 규칙 무변경 확인 (R8, FR-012·013). *Jest 불가 — 미디어 쿼리·clamp는 jsdom 밖. SC-006 실측이 판정*
- [ ] T027 [US4] 드래그 리사이즈 회귀 확인 — `webapp/channels/src/components/resizable_sidebar/` 기존 테스트 실행(기준선 diff), 드래그 저장값(`--overrideLhsWidth`)이 새 기본값보다 우선함을 dev server에서 확인

**Checkpoint**: US1~US4 독립 동작

---

## Phase 7: User Story 5 — 모달과 전환이 마감된 느낌을 준다 (Priority: P5)

**Goal**: 모달 3겹 마감, 모션 토큰 적용

**Independent Test**: 모달·전환 실측 — SC-007

### Implementation for User Story 5

- [ ] T028 [P] [US5] 모달 마감 — `webapp/channels/src/sass/okrbest/_overrides.scss`: `.GenericModal .modal-content`에 `box-shadow: 0 0 0 1px rgba(var(--center-channel-color-rgb), 0.13), 0 18px 48px rgba(0, 0, 0, 0.35)`, `border-radius: var(--radius-m)`, 기존 border 투명화 (R9, FR-014). *판정: SC-007 실측*
- [ ] T029 [P] [US5] 모션 토큰 정의·적용 — `webapp/channels/src/sass/okrbest/_overrides.scss`: 토큰 4종(data-model §4) 정의, 사이드바 항목 배경 전환 `--okr-anim-fast`, 아이콘 버튼 transform `--okr-ease-spring`, 500ms 초과 전환 부재 확인 (R10, FR-015). *판정: SC-007 실측*

**Checkpoint**: 전 스토리 기능 완료

---

## Phase 8: Polish & 완료 검증

- [ ] T030 [P] 발산 기록 — `docs/upstream-adapted-divergences.md`에 인라인 수정 파일(`_sidebar-left.scss`, `_headers.scss`, `_post.scss`, `_css_variables.scss`, `_typography.scss`, `preferences.ts`, `theme_utils.ts`, `global_header.tsx`)과 오버라이드 레이어(`sass/okrbest/_overrides.scss`) 신설을 기록 (FR-019)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [ ] T031 품질 게이트 — `cd webapp && npm run check / check-types / test`를 돌리고, 실패 목록이 T001 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다 (원칙 I, FR-016)
- [ ] T032 종단 검증 — 빌드·기동 후 quickstart.md 시나리오를 **실제 환경에서** 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [ ] T033 SC 검증 — spec.md의 SC-001~008 각각을 **실측값**으로 확인한다 (추정 금지, contracts/measurement-contract.md 판정표 전 행 기입)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음 — 즉시 시작. T002는 계측 환경 없으면 `미실행` 기록 후 진행
- **Foundational (Phase 2)**: Setup 뒤 — 전 스토리를 막는다
- **US1 (Phase 3)**: Foundational 뒤. T006(테스트) → T007·T008(테마) → T009·T010(SCSS) 순. T011~T013은 T007 뒤 병렬
- **US2 (Phase 4)**: Foundational + T003(폰트) 뒤. US1과 파일 겹침은 `_sidebar-left.scss`(T009·T010 vs T020) 하나 — US1 먼저 권장
- **US3 (Phase 5)**: Foundational 뒤. T022는 T004(헬퍼) 의존. `preferences.ts`를 US1(T007)과 공유하므로 US1 뒤 권장
- **US4 (Phase 6)**: Foundational 뒤, 독립
- **US5 (Phase 7)**: Foundational(T005 파티얼) 뒤, 독립
- **Polish (Phase 8)**: 전 스토리 뒤

### Parallel Opportunities

- Phase 1: T003 ∥ T001·T002
- Phase 2: T004 ∥ T005
- US1 내: T011 ∥ T012 ∥ T013 (T007 뒤)
- US2 내: T019 ∥ T020 (T016·T017 뒤)
- US4·US5는 서로 병렬 가능 (다른 파일)
- Phase 8: T030 ∥ T031

## Implementation Strategy

**MVP = US1** (Phase 1→2→3). 이 지점에서 멈추고 독립 검증 — 기본 테마만으로
외관·접근성 효과가 난다. 이후 US2(타이포) → US3(프리셋) → US4(폭) → US5(마감)
순으로 증분 배포. 각 checkpoint마다 커밋하고, upstream 파일을 고치는 과제는
diff를 최소로 유지한다.

## Notes

- 색 값은 data-model의 1차 후보 — 대비 테스트(T006·T022)가 최종 판정자다
- SCSS 과제의 "Jest 불가" 사유는 원칙 III의 예외 기록이다. 해당 판정은 T033 실측이 맡는다
- 커밋 단위: phase checkpoint마다 1커밋 권장 (Conventional Commits)
