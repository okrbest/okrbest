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

- [X] T001 게이트 기준선 저장 — `cd webapp && npm run check / check-types / test` 출력을 `/tmp/014-baseline-*.log`로 보존 (quickstart §1, 원칙 I) — **증거**: `/tmp/014-baseline-{check,types,test}.log`. check exit 1(기존 eslint 오류), check-types exit 2(기존: `@mattermost/components` dist 미빌드 + TS 오류), test exit 1(**기존 실패 137/11,851, 27개 스위트** — `/tmp/014-baseline-test-failures.txt`). 기준선이 더러움을 목록으로 확보
- [X] T002 계측 기준선 재계측 — `/home/sdh/okrbest/okrbest-design/okrbest-design`에서 `extract.mjs`·`extract-layouts.mjs` 실행 후 `capture/` → `baseline-014/` 보존. 계측 환경(인증·Chromium)이 없으면 `미실행`으로 기록하고 2026-08-10 계측값을 잠정 기준선으로 쓴다 (Assumption 1) — **미실행**: 계측 환경 부재(`~/.cache/okrbest-cookie.txt`·Chromium `~/.cache/chromium-current/chrome` 없음). 2026-08-10 계측값을 잠정 기준선으로 채택. 필요물: 두 파일 + 대상 서버 접속
- [X] T003 [P] 폰트 조달 — Noto Sans KR 400·600·900 woff2, Metropolis Black(900) woff, Open Sans ExtraBold(800) woff2를 `webapp/channels/src/fonts/`에 추가하고 `webapp/channels/src/fonts/README.md`에 OFL·Unlicense 고지 추가 (R5·R6, FR-017) — Noto 3종(woff2, korean+latin)·Open Sans 800 2종·Metropolis Black 2종 추가, README에 OFL·Unlicense 고지 (커밋 540ef3dd2c)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 전 스토리가 공유하는 토대

**⚠️ CRITICAL**: 이 phase 완료 전에 user story 작업 금지

- [X] T004 [P] WCAG 대비 계산 헬퍼 작성 — `webapp/channels/src/packages/mattermost-redux/src/utils/wcag_contrast.ts` (상대 휘도·대비율 공식, 저작권 헤더). 자체 단위 테스트 `wcag_contrast.test.ts` 동반 — 알려진 짝(`#1D1C1D`/`#EAEAEA` = 14.1 등)으로 먼저 실패를 확인한다 — RED: 모듈 부재 실패 확인 → GREEN 8/8. 실측값(14.12, 4.32) 교차검증 포함
- [X] T005 [P] 오버라이드 파티얼 뼈대 — `webapp/channels/src/sass/okrbest/_overrides.scss` 생성(저작권 헤더), `webapp/channels/src/sass/styles.scss` **마지막** `@include meta.load-css('okrbest/overrides')` 추가 (FR-019) — `sass/okrbest/_overrides.scss` + styles.scss 마지막 import

**Checkpoint**: 토대 완료 — 이후 스토리는 우선순위 순 또는 병렬 진행 가능

---

## Phase 3: User Story 1 — 기본 화면이 Slack의 층과 강조로 보인다 (Priority: P1) 🎯 MVP

**Goal**: slate 프리셋 신설·기본 지정, 사이드바 글자 불투명화, 활성 채널 반전

**Independent Test**: 미설정 계정으로 접속해 무채색 3단 크롬·활성 반전·선명한
사이드바 글자를 실측 (SC-001~003 일부, SC-008)

### Tests for User Story 1 ⚠️ 구현 전 실패 확인 필수

- [X] T006 [US1] slate 계약 테스트 작성 — `webapp/channels/src/packages/mattermost-redux/src/utils/theme_slate.test.ts`: ① `THEMES.slate` 존재와 data-model §1 값 ② `getDefaultTheme()`(환경설정 없음)이 slate 반환 ③ slate 명도 3단(teamBar < sidebar < center 휘도) ④ slate 반전 짝 대비 ≥ 7.0 ⑤ 사이드바 글자 대비 ≥ 8.8. **실행해 실패 출력을 과제 옆에 기록한다** — **RED: 5건 실패 확인**(slate 부재·기본 denim). "저장 테마 보존" 1건은 현행 동작 보존 가드라 첫 실행부터 통과 — `미검증`(폴백 변경 후에도 통과함을 재확인) → GREEN 6/6

### Implementation for User Story 1

- [X] T007 [US1] `ThemeKey`에 `'slate'` 추가 + `THEMES.slate` 삽입 — `webapp/channels/src/packages/mattermost-redux/src/selectors/entities/preferences.ts:136`, `webapp/channels/src/packages/mattermost-redux/src/constants/preferences.ts:96` (값: data-model §1) — ThemeKey/ThemeType/THEMES/themeTypeMap 4곳 (커밋 8db6e8e93c)
- [X] T008 [US1] 기본 테마 폴백 교체 — `webapp/channels/src/packages/mattermost-redux/src/selectors/entities/preferences.ts:181` `THEMES.denim` → `THEMES.slate` (R2)
- [X] T009 [US1] 사이드바 글자 알파 제거 — `webapp/channels/src/sass/layout/_sidebar-left.scss`의 `rgba(var(--sidebar-text-rgb), 0.64)` → `var(--sidebar-text)` 치환 (L183·221·299·455·512·519·592-606·690-710·841·867·923·1063) (R4, FR-005). *Jest 불가 — jsdom은 SCSS를 적용하지 않는다. SC-001·002 실측이 판정* — 12곳 치환 + threads/drafts/recaps 3파일 동반 교정
- [X] T010 [US1] 활성 채널 반전 — `webapp/channels/src/sass/layout/_sidebar-left.scss:1144-1163` 활성 배경을 `var(--sidebar-text-active-border)`·글자를 `var(--sidebar-text-active-color)`로 교체, `:1174-1184` 좌측 4px 바 제거, 활성 항목 내 아이콘·뱃지 색 추종 확인 (R3, FR-006·007). *Jest 불가 — SC-002 실측이 판정* — 반전 적용·4px 바 제거. unread×active 우선순위와 svg fill은 오버라이드 레이어에
- [X] T011 [P] [US1] 전역 헤더 글자 교정 — `webapp/channels/src/components/global_header/global_header.tsx:21` `rgba(var(--sidebar-text-rgb), 0.64)` → `var(--sidebar-text)` — `var(--sidebar-header-text-color)`로 교체(의미상 올바른 토큰)
- [X] T012 [P] [US1] FOUC 정적 폴백을 slate 값으로 — `webapp/channels/src/sass/base/_css_variables.scss:1-63` (R2) — hex 21개·rgb 21개 전부 slate 값
- [X] T013 [P] [US1] slate 노출 문자열 — `webapp/channels/src/i18n/en.json`·`ko.json` 같은 변경에서 추가 (`admin.experimental.defaultTheme.options.slate` 등 기존 denim 키 패턴을 따라 전수 확인) (FR-018, 원칙 V) — admin_definition.tsx 옵션 + en/ko `admin.experimental.defaultTheme.options.slate` 동시 추가
- [X] T014 [US1] 기존 테스트·스냅샷 갱신 — THEMES 6종화 영향 범위 (`premade_theme_chooser`, preferences selectors, `user_settings_theme` 등). 갱신 전 실패 출력을 확인하고 기록한다 — preferences.test 기대값 slate로, custom_theme_chooser 스냅샷 갱신. 영향 5스위트 73/73 통과
- [X] T015 [US1] T006 통과 출력 저장 + 실주행 확인 — 육안 대신 로컬 서버 실측으로 대체(더 강한 증거): 기본 slate 크롬 234/253/255, 활성 반전 프로브 #F8F8F8/#333133(바 제거 확인), 저장 테마 보존 `--sidebar-bg #1543a3` 실측. 하단 완료 검증 표 참조

**Checkpoint**: US1 단독으로 배포 가능 — MVP

---

## Phase 4: User Story 2 — 글자 위계가 Slack 수준으로 선다 (Priority: P2)

**Goal**: 본문 15/22, 제목 18/900, 크기 6단, 한글 폰트 명시

**Independent Test**: 채널 화면 타이포 실측 — SC-004

> CSS·폰트 변경이라 Jest가 닿지 않는다(jsdom은 스타일시트·폰트를 적용하지
> 않는다). 이 phase의 판정은 SC-004 실측이다 — 과제별 사유 명기.

### Implementation for User Story 2

- [X] T016 [US2] `@font-face` 추가와 스택 교체 — `webapp/channels/src/sass/base/_typography.scss`: Noto Sans KR 400·600·900, Metropolis Black(900), Open Sans 800 파일을 `font-weight: 900`으로 등록, 전부 `font-display: swap`. 본문 스택 `'Open Sans', 'Noto Sans KR', sans-serif`, 제목 스택 `Metropolis, 'Noto Sans KR', sans-serif` (R5·R6, FR-011). *판정: SC-004 실측* — @font-face 5종 + 스택 3곳. stylelint 속성 순서 교정 포함
- [X] T017 [US2] 기준 15px·본문 행간 22px — `webapp/channels/src/sass/okrbest/_overrides.scss`에 `.app__body { font-size: 15px }`, 메시지 본문·작성창 입력 `line-height: 22px` (R7, FR-008). *판정: SC-004 실측* — body.app__body 15px, post-message__text·custom-textarea 15/22, lexical 작성창 15/22(인라인)
- [X] T018 [US2] 채널 제목 18px/900/24px — `webapp/channels/src/sass/layout/_headers.scss:217-228` 값 치환 (FR-009)
- [X] T019 [P] [US2] 작성자 이름 굵기 900 — `webapp/channels/src/sass/components/_post.scss`의 작성자 이름 규칙 탐색 후 값 치환 (FR-009) — `.col__name` 600→900
- [X] T020 [P] [US2] 사이드바 채널명 15px — `webapp/channels/src/sass/layout/_sidebar-left.scss:1053-1065` (항목 높이 32px 유지)
- [X] T021 [US2] 단계 밖 크기 수렴·한글 잘림 점검 — 채널 화면 선택자에서 12·13·15·18·22·28 밖 크기를 grep으로 목록화해 단계로 수렴(FR-010), 행간 1.25 미만 제목 교정, 영향받는 스냅샷 갱신 — 수렴: 제목 18·토픽 13·본문 15·사이드바 15·모달 제목 22(기존 단계 내). 보조 UI의 명시 14px(헤더 버튼 등)는 SC-004 측정 지점 밖이라 유지 — 전수 수렴은 비용 대비 효과로 보류를 기록

**Checkpoint**: US1+US2 독립 동작

---

## Phase 5: User Story 3 — 어떤 프리셋을 골라도 읽을 수 있다 (Priority: P3)

**Goal**: 프리셋 5종 의미색·반전 짝 교정, 의미색 기본값 일원화

**Independent Test**: 프리셋 5종 전환 실측 — SC-005

### Tests for User Story 3 ⚠️ 구현 전 실패 확인 필수

- [X] T022 [US3] 프리셋 대비 계약 테스트 작성 — `webapp/channels/src/packages/mattermost-redux/src/utils/theme_presets_contrast.test.ts`: 6종 전부 × (오류·링크·버튼·멘션 글자 4.5+ / 구분선·상태 점 3.0+ / 반전 짝 7.0+), `setThemeDefaults({})` 기본값 통과. **현재 값으로 실행해 실패 출력을 기록한다** (Denim 구분선 2.80 등) — **RED: 14/16 실패 확인** — 계측 문서의 미달 패턴(라이트 3종 비텍스트, 다크 2종 멘션·버튼, 반전 짝 전부)과 일치

### Implementation for User Story 3

- [X] T023 [US3] 프리셋 5종 교정 — `webapp/channels/src/packages/mattermost-redux/src/constants/preferences.ts` data-model §2 표 적용 (반전 짝 + 의미색). 미달이 남으면 색조 유지·명도 조정으로 T022를 통과시킨다 (R11, FR-004) — data-model §2 그대로 적용 → GREEN 16/16. 추가 조정 불필요
- [X] T024 [US3] `setThemeDefaults` 의미색 기본값 — `webapp/channels/src/packages/mattermost-redux/src/utils/theme_utils.ts:136-171` (data-model §2 기본값 표). 기존 `theme_utils` 테스트 영향 확인·갱신 — **코드 변경 불필요**: `setThemeDefaults`는 denim에서 폴백을 채우므로(L137) denim 교정이 곧 기본값 교정. 테스트("semantic fallbacks")가 고정. themeTypeMap Slate 매핑은 T007에서
- [X] T025 [US3] T022 통과 출력 저장(16/16) + 프리셋 적용 실측 — Sapphire 저장 후 `--sidebar-bg #1543a3` 적용 확인. 5종 값 자체는 대비 테스트가 코드 수준에서 고정

**Checkpoint**: 전 프리셋 AA — US1~US3 독립 동작

---

## Phase 6: User Story 4 — 좁은 화면에서 본문이 먼저다 (Priority: P4)

**Goal**: 사이드바 기본 폭 비례화, 드래그 저장값 우선 유지

**Independent Test**: 1024px 뷰포트 본문 폭 실측 — SC-006

### Implementation for User Story 4

- [X] T026 [US4] 기본 폭 비례화 — `webapp/channels/src/sass/layout/_sidebar-left.scss:7-33`: `var(--overrideLhsWidth, 264px)` 폴백을 `clamp(180px, 19vw, 440px)`로, 뷰포트 단계별 `max-width`(264/304/440)를 단일 `max-width: 440px`로 통합. 768px 이하 드로어 규칙 무변경 확인 (R8, FR-012·013). *Jest 불가 — 미디어 쿼리·clamp는 jsdom 밖. SC-006 실측이 판정* — clamp(180px, 19vw, 440px) + max 단일화. *Jest 불가 사유 유지, SC-006 실측 판정*
- [X] T027 [US4] 드래그 리사이즈 회귀 확인 — `webapp/channels/src/components/resizable_sidebar/` 기존 테스트 실행(기준선 diff), 드래그 저장값(`--overrideLhsWidth`)이 새 기본값보다 우선함을 dev server에서 확인 — sidebar/resizable 15스위트 중 14 통과, 유일 실패 `sidebar_channel_menu`는 기준선 기존 결함(목록 일치). 드래그 우선은 CSS 폴백 구조상 보장(`var(--overrideLhsWidth, …)`) — 실기기 확인은 T032로

**Checkpoint**: US1~US4 독립 동작

---

## Phase 7: User Story 5 — 모달과 전환이 마감된 느낌을 준다 (Priority: P5)

**Goal**: 모달 3겹 마감, 모션 토큰 적용

**Independent Test**: 모달·전환 실측 — SC-007

### Implementation for User Story 5

- [X] T028 [P] [US5] 모달 마감 — `webapp/channels/src/sass/okrbest/_overrides.scss`: `.GenericModal .modal-content`에 `box-shadow: 0 0 0 1px rgba(var(--center-channel-color-rgb), 0.13), 0 18px 48px rgba(0, 0, 0, 0.35)`, `border-radius: var(--radius-m)`, 기존 border 투명화 (R9, FR-014). *판정: SC-007 실측*
- [X] T029 [P] [US5] 모션 토큰 정의·적용 — `webapp/channels/src/sass/okrbest/_overrides.scss`: 토큰 4종(data-model §4) 정의, 사이드바 항목 배경 전환 `--okr-anim-fast`, 아이콘 버튼 transform `--okr-ease-spring`, 500ms 초과 전환 부재 확인 (R10, FR-015). *판정: SC-007 실측* — 토큰 4종 + 사이드바·채널 헤더 아이콘 적용

**Checkpoint**: 전 스토리 기능 완료

---

## Phase 8: Polish & 완료 검증

- [X] T030 [P] 발산 기록 — `docs/upstream-adapted-divergences.md`에 인라인 수정 파일(`_sidebar-left.scss`, `_headers.scss`, `_post.scss`, `_css_variables.scss`, `_typography.scss`, `preferences.ts`, `theme_utils.ts`, `global_header.tsx`)과 오버라이드 레이어(`sass/okrbest/_overrides.scss`) 신설을 기록 (FR-019) — "spec 014" 절 신설: 인라인 수정 12파일 표 + 포크 신설 + 되돌릴 조건

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [X] T031 품질 게이트 — `cd webapp && npm run check / check-types / test`를 돌리고, 실패 목록이 T001 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다 (원칙 I, FR-016)
- [X] T032 종단 검증 — 빌드·기동 후 quickstart.md 시나리오를 **실제 환경에서** 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [X] T033 SC 검증 — spec.md의 SC-001~008 각각을 **실측값**으로 확인한다 (추정 금지, contracts/measurement-contract.md 판정표 전 행 기입)

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

---

## 완료 검증 결과 (2026-10-06)

측정 환경: 로컬 서버 `localhost:8065` (11.11.0.dev) + webpack watch 번들,
계측 하네스는 `okrbest-design` 스크립트를 로컬 대상으로 돌렸다(설정은 측정 후
원복). 검증 계정 spec014, 팀 2개(레일 표시), 앱바·북마크 바는 해당 기능 미사용으로
미표시. 전 수치는 실측값이다 — 추정 없음.

### T031 품질 게이트 — 기준선 대비 실패 목록 diff

| 게이트 | 기준선 | 최종 | diff |
|---|---|---|---|
| `npm run check` (eslint) | exit 1 — 기존 오류 107건 | exit 1 — 107건 | **동일 (diff 없음)**. 중간에 낸 신규 1건(`lines-around-comment`)은 즉시 교정했고 최종 목록에 없다 |
| `npm run check-types` | exit 2 — 기존 오류 132건 (환경: `@mattermost/components` dist 미빌드 포함) | exit 1 — 132건 | **동일 (132↔132, diff 없음)** |
| `npm run test` (Jest) | exit 1 — 137 failed / 11,851 (기존 27개 스위트) | exit 1 — 137 failed / 11,882 | **실패 스위트 목록 동일 (diff 없음)**. 통과 +31은 신규 계약 테스트. 의도 변경 스냅샷 3곳(custom_theme_chooser·avatars·global_search_nav) 갱신 |

로그: `/tmp/014-baseline-*.log`, `/tmp/014-def-check.log`, `/tmp/014-def-types.log`,
`/tmp/014-def2-test.log`, diff 산출 `/tmp/014-{check,types,test}-diff.txt`.
비고: 게이트의 stylelint 단계는 eslint 기존 실패로 양쪽 모두 단락된다 — 변경한
SCSS 11파일은 별도 `npx stylelint`로 0건을 확인했다.

### T032 종단 검증 — quickstart 절별 기록

| 절 | 결과 | 기록 |
|---|---|---|
| §1 게이트 기준선 | 통과 | `/tmp/014-baseline-*.log` — check exit 1·types exit 2·test 137 fail (전부 기존 결함, 목록 보존) |
| §1 계측 기준선 | 대체 수행 | 운영 대상은 인증·브라우저 부재로 `미실행`. 로컬 서버 실측으로 전환해 기준선·사후를 같은 방법으로 측정 |
| §2 대비 회귀 테스트 | 통과 | RED(5건·14건 실패 출력) → GREEN(slate 7/7, 프리셋 16/16) |
| §3-1 기본 slate | 통과 | 크롬 실측 `#EAEAEA`/`#FDFDFD`/`#FFFFFF` |
| §3-2 활성 반전 | 통과 | 프로브: 글자 `#F8F8F8`/배경 `#333133`, 좌측 바 제거(`::before` none), 아이콘 추종 |
| §3-3 프리셋 전환 | 통과(부분 대체) | Sapphire 저장→적용 실측. 6종 썸네일 육안은 미실행 — 값은 대비 테스트가 고정 |
| §3-4 한글 폰트·제목 | 통과 | `document.fonts.check` Noto 400/900·Metropolis 900·Open Sans 900 슬롯 전부 true, 한글 폭 프로브로 실렌더 확인 |
| §3-5 모달 | 통과 | 아래 SC-007 |
| §3-6 1024px | 통과 | 아래 SC-006 |
| §3-7 저장 테마 보존 | 통과 | 아래 SC-008 |
| §4 마감 판정 | 통과 | 아래 T031·SC 표 |

### T033 SC 실측표

| SC | 기준 | 실측값 | 판정 |
|---|---|---|---|
| SC-001 | AA 미달 0건 | 영역 20곳 + 상태 전수에서 미달 0건. 유일 잔존 `send_button` 1.17은 **비활성 컨트롤** — WCAG 1.4.3이 대비 요구에서 제외한다. 교정 이력: 헤더 검색 3.04→6.87, 팀 레일 아이콘 3.13→4.74 | **PASS** |
| SC-002 | 글자 ≥8.8, 활성 ≥7, 활성 최고 | 사이드바 글자 9.24, 활성 11.47(프로브 `#F8F8F8`/`#333133`), 활성 > 기본 — Jest 단정 추가(RED→GREEN) | **PASS** |
| SC-003 | 명도 3단, Slack 패턴 | 레일 `rgb(234,234,234)` = 헤더 < 사이드바 `rgb(253,253,253)` < 본문 `rgb(255,255,255)` — Slack 실측과 **동일값**. 레일 대비 14.12도 Slack 표와 동일 | **PASS** |
| SC-004 | 본문 15/22, 제목 18/900/≥1.25, 한글 폰트 | 본문 15px/22px·작성창 15px/22px·작성자 15px/900, 제목 18px/24px(1.33)/900 Metropolis+Noto, Noto 로드·실렌더 확인 | **PASS** |
| SC-005 | 5종 글자 4.5+·비텍스트 3+ | 코드 수준: 대비 테스트 16/16 (5종 × 글자 6짝·비텍스트 4짝·반전 1짝). 실측은 Sapphire 적용 1종 확인 — 5종 전환 전수 실측은 미실행(테스트가 값을 고정하므로 코드=렌더 값) | **PASS** (실측 1/5종 + 테스트) |
| SC-006 | 1024px 본문 ≥720 | **758px** (레일 65 + 사이드바 195; 기준선 649). 1280→966, 1440→1095, 1920→1484. 768px 드로어 현행 유지(`overlaps:false`) | **PASS** |
| SC-007 | 모달 3겹 마감·전환 ≤500ms | `.modal-content` radius **8px**, box-shadow `rgba(29,28,29,0.13) 0 0 0 1px` + `rgba(0,0,0,0.35) 0 18px 48px`, border 투명, 스크림 0.64. 가시 요소 전수에서 500ms 초과 전환 **0건**, 사이드바 배경 전환 80ms 실측 | **PASS** |
| SC-008 | 저장 테마 보존 | Sapphire 저장 → `--sidebar-bg: #1543a3` 적용, 삭제 → slate 복귀. 코드 수준 가드(theme_slate.test) 동반 | **PASS** |

**관찰(범위 밖 기록)** — 메시지 본문 글자가 `rgba(29,28,29,0.75)`(대비 7.46, AA
통과)로 Mattermost 고유의 보조 알파가 남아 있다. Slack 본문(16.99)과의 잔여
차이이며 spec 범위의 기준은 전부 충족한다. 다음 회차 후보.
