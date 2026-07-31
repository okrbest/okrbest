---

description: "Task list template for feature implementation"
---

# Tasks: 오프라인 도움말 페이지

**Input**: Design documents from `/specs/006-offline-help-pages/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**전략**: upstream 커밋 `37ec26b81a0d13c264ffd6afd6370bc83115307d`(MM-61383)을 cherry-pick으로
그대로 반영한 뒤(merge-tree CLEAN 확인됨), 그 위에 리브랜드·번역·콘텐츠 감사를 adapt
후속 작업으로 적용한다. 컴포넌트를 처음부터 새로 작성하지 않는다(research.md #2 참조).

**Tests**: cherry-pick 부분은 constitution 원칙 III의 `/speckit-sync` 예외가 적용된다(접촉
패키지 테스트로 회귀 검증). adapt 후속 작업(리브랜드/번역/콘텐츠 감사)은 예외가 아니므로
각 화면마다 신규 테스트를 동반한다.

**Organization**: 태스크는 spec.md의 User Story(P1/P2/P3)별로 그룹화되어 각 스토리를 독립적으로 adapt·검증할 수 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 선행 의존 없음)
- **[Story]**: 이 태스크가 속한 User Story (US1/US2/US3)
- 모든 경로는 저장소 루트 기준 실제 경로

## Path Conventions

- **Single project**: `webapp/channels/src/` (웹앱 프론트엔드 전용)

---

## Phase 1: Setup

**Purpose**: upstream 원본을 이 포크에 그대로 반입

- [ ] T001 `git cherry-pick -x 37ec26b81a0d13c264ffd6afd6370bc83115307d` 실행 — 6개 도움말 화면(`messaging.tsx` 랜딩 포함 `formatting`/`commands`/`sending`/`mentioning`/`attaching`), 도움말 버튼(`help_button/`), 팝업 래퍼(`help_popout/`), `footer.tsx`/`components/root/root.tsx`/`popout_controller.tsx`/`popout_windows.ts` 수정, `en.json` 134개 키가 함께 반입됨. merge-tree CLEAN 확인됨 — 충돌 발생 시 즉시 보고 후 adapt로 전환
- [ ] T002 cherry-pick 커밋에 `Upstream: https://github.com/mattermost/mattermost/commit/37ec26b81a0d13c264ffd6afd6370bc83115307d` 참조 트레일러 추가(추적성)
- [ ] T003 `cd webapp && npm run check-types` 실행해 cherry-pick 직후 타입 오류 없음 확인(회귀 검증 — constitution 원칙 III `/speckit-sync` 예외 적용 구간)

**Checkpoint**: 6개 도움말 화면이 영어 원문·Mattermost 브랜드 상태로 동작. 이 시점부터 각 화면의 adapt(리브랜드·번역·콘텐츠 감사)를 병렬로 진행 가능.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 진입점(도움말 버튼·팝업·라우팅)과 기본 랜딩 화면(`messaging.tsx`)의 adapt. `messaging.tsx`는 도움말 버튼 클릭 시 모든 사용자가 가장 먼저 보는 화면이므로 특정 User Story에 속하지 않는 공유 기반으로 분류한다.

**⚠️ CRITICAL**: 이 phase 완료 전에는 개별 주제(US1~US3) adapt를 완료로 간주할 수 없음(진입 화면이 아직 리브랜드/번역되지 않은 상태이므로)

- [ ] T004 `webapp/channels/src/components/help/messaging.tsx`의 제품명 언급을 OKR.BEST로 치환(FR-005)
- [ ] T005 `messaging.tsx` 본문을 이 포크의 실제 기능과 대조해 존재하지 않는 기능 언급 제거(FR-007, SC-004)
- [ ] T006 `webapp/channels/src/i18n/ko.json`에 `messaging.tsx` 관련 신규 키 한국어 번역 추가(FR-006)
- [ ] T007 [P] `webapp/channels/src/components/help/messaging.test.tsx` 신규 작성 — 랜딩 렌더링, "Mattermost" 문자열 부재 검증
- [ ] T008 [P] `webapp/channels/src/components/advanced_text_editor/help_button/help_button.tsx` 및 `footer.tsx` 연동이 cherry-pick 그대로 정상 동작하는지 확인(작성 중 메시지 보존 포함, FR-004) — 필요 시 `footer.test.tsx`(cherry-pick으로 이미 존재) 보강
- [ ] T009 [P] `webapp/channels/src/components/help_popout/help_popout.tsx` + `popout_windows.ts` 팝업 차단 폴백이 cherry-pick 그대로 정상 동작하는지 확인(FR-003, SC-003)

**Checkpoint**: 도움말 버튼 클릭 → 리브랜드·번역된 "메시징 기초" 랜딩이 열리고, 여기서 5개 상세 주제로 이동 가능. 이 시점부터 각 User Story(주제별 adapt)를 병렬로 진행 가능.

---

## Phase 3: User Story 1 - 메시지 작성 중 서식 문법 확인 (Priority: P1) 🎯 MVP

**Goal**: `formatting.tsx`를 리브랜드·번역·콘텐츠 감사하여 실사용 가능한 상태로 만듦

**Independent Test**: 도움말에서 "서식" 페이지로 이동 → 본문에 "Mattermost" 언급이 없고, 존재하지 않는 기능 언급이 없으며, 한국어로 표시되는지 확인

### Tests for User Story 1 ⚠️

- [ ] T010 [P] [US1] `webapp/channels/src/components/help/formatting.test.tsx` 신규 작성 — 서식 예시 렌더링, "Mattermost" 문자열 부재 검증

### Implementation for User Story 1

- [ ] T011 [US1] `formatting.tsx`의 제품명 언급을 OKR.BEST로 치환(FR-005)
- [ ] T012 [US1] `formatting.tsx` 본문을 이 포크의 실제 서식 지원 범위와 대조해 존재하지 않는 기능 언급 제거(FR-007, SC-004)
- [ ] T013 [US1] `webapp/channels/src/i18n/ko.json`에 `formatting.tsx` 관련 신규 키 한국어 번역 추가(FR-006) (depends on T011, T012)

**Checkpoint**: User Story 1 단독으로 완전히 동작·검증 가능(MVP) — Foundational(Phase 2)과 함께.

---

## Phase 4: User Story 2 - 슬래시 명령어 목록 확인 (Priority: P2)

**Goal**: `commands.tsx`를 리브랜드·번역·콘텐츠 감사(특히 이 포크에 실제 존재하는 명령어만 나열)하여 실사용 가능한 상태로 만듦

**Independent Test**: 도움말에서 "명령어" 페이지로 이동 → 나열된 명령어가 이 포크 서버가 실제 지원하는 명령어와 100% 일치하는지 확인(SC-004)

### Tests for User Story 2 ⚠️

- [ ] T014 [P] [US2] `webapp/channels/src/components/help/commands.test.tsx` 신규 작성 — 명령어 목록 렌더링, "Mattermost" 문자열 부재 검증

### Implementation for User Story 2

- [ ] T015 [US2] `commands.tsx`의 제품명 언급을 OKR.BEST로 치환(FR-005)
- [ ] T016 [US2] `commands.tsx`에 나열된 명령어를 `server/channels/app/slashcommands`(또는 실제 등록된 슬래시 명령어 목록)와 대조해 이 포크에 없는 명령어 제거(FR-007, SC-004 — 가장 엄격한 검증이 필요한 페이지)
- [ ] T017 [US2] `webapp/channels/src/i18n/ko.json`에 `commands.tsx` 관련 신규 키 한국어 번역 추가(FR-006) (depends on T015, T016)

**Checkpoint**: User Story 1과 2가 함께 독립적으로 동작.

---

## Phase 5: User Story 3 - 멘션·파일첨부·전송 방법 확인 (Priority: P3)

**Goal**: `mentioning.tsx`, `sending.tsx`, `attaching.tsx` 3개 화면을 리브랜드·번역·콘텐츠 감사

**Independent Test**: 도움말에서 "멘션"/"파일 첨부"/"전송" 각 페이지로 이동해 리브랜드·번역·콘텐츠 정확성을 확인

### Tests for User Story 3 ⚠️

- [ ] T018 [P] [US3] `webapp/channels/src/components/help/mentioning.test.tsx` 신규 작성 — 렌더링, "Mattermost" 문자열 부재 검증
- [ ] T019 [P] [US3] `webapp/channels/src/components/help/sending.test.tsx` 신규 작성 — 렌더링, "Mattermost" 문자열 부재 검증
- [ ] T020 [P] [US3] `webapp/channels/src/components/help/attaching.test.tsx` 신규 작성 — 렌더링, "Mattermost" 문자열 부재 검증

### Implementation for User Story 3

- [ ] T021 [P] [US3] `mentioning.tsx`의 제품명 언급을 OKR.BEST로 치환(FR-005) 및 콘텐츠 감사(FR-007)
- [ ] T022 [P] [US3] `sending.tsx`의 제품명 언급을 OKR.BEST로 치환(FR-005) 및 콘텐츠 감사(FR-007)
- [ ] T023 [P] [US3] `attaching.tsx`의 제품명 언급을 OKR.BEST로 치환(FR-005) 및 콘텐츠 감사(FR-007)
- [ ] T024 [US3] `webapp/channels/src/i18n/ko.json`에 멘션/전송/파일첨부 관련 신규 키 한국어 번역 추가(FR-006, 134개 신규 키 전체 완료 지점) (depends on T021, T022, T023)

**Checkpoint**: 6개 도움말 화면(랜딩 1 + 상세 5) 모두 리브랜드·번역·콘텐츠 감사 완료.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능에 걸친 품질 확인(constitution 원칙 I)

- [ ] T025 [P] 6개 도움말 화면 전체를 대상으로 "Mattermost" 문자열 잔존 여부 재확인(FR-005 — 0건이어야 함, T007/T010/T014/T018-T020의 개별 테스트를 종합 재확인)
- [ ] T026 [P] `webapp/channels/src/i18n/en.json`/`ko.json`의 신규 134개 키가 1:1 대응하는지(누락 키 없음) 확인
- [ ] T027 `cd webapp && npm run check` 실행 및 통과 확인(eslint + stylelint)
- [ ] T028 `cd webapp && npm run check-types` 실행 및 통과 확인
- [ ] T029 `cd webapp/channels && npm run test -- src/components/help src/components/help_popout src/components/advanced_text_editor/help_button src/components/advanced_text_editor/footer.test.tsx` 전체 통과 확인
- [ ] T030 quickstart.md의 5개 시나리오(서식/명령어/멘션·파일첨부·전송/팝업 차단 폴백/리브랜드·번역) 수동 검증

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음 — cherry-pick으로 즉시 시작 가능
- **Foundational (Phase 2)**: Setup(cherry-pick) 완료 후 시작 — 모든 User Story의 "완료" 판정을 BLOCK함(진입 화면 adapt 필요)
- **User Stories (Phase 3~5)**: Setup 완료 후 시작 가능(각 주제 파일은 cherry-pick으로 이미 존재하므로 Foundational과 병렬 진행 가능), 우선순위(P1→P2→P3) 순 또는 병렬 진행
- **Polish (Phase 6)**: 구현하기로 한 모든 User Story + Foundational 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: Setup 이후 시작 가능, 다른 스토리에 의존하지 않음
- **User Story 2 (P2)**: Setup 이후 시작 가능, US1과 독립적으로 검증 가능
- **User Story 3 (P3)**: Setup 이후 시작 가능, US1/US2와 독립적으로 검증 가능

### Parallel Opportunities

- Setup은 단일 cherry-pick 커밋이라 순차적(T001→T002→T003)
- Foundational 완료 후 US1/US2/US3는 서로 다른 파일이므로 병렬 진행 가능
- 각 스토리 내 `.test.tsx` 작성은 해당 adapt 구현 전 병렬로 먼저 작성 가능
- US3 내 3개 화면(T018-T020, T021-T023)은 서로 다른 파일이라 완전 병렬

---

## Parallel Example: User Story 3

```bash
# US3의 3개 화면 테스트를 동시에 작성:
Task: "mentioning.test.tsx 렌더링/리브랜드 검증 테스트 작성"
Task: "sending.test.tsx 렌더링/리브랜드 검증 테스트 작성"
Task: "attaching.test.tsx 렌더링/리브랜드 검증 테스트 작성"

# US3의 3개 화면 adapt(리브랜드+콘텐츠 감사)를 동시에 진행:
Task: "mentioning.tsx 리브랜드 치환 및 콘텐츠 감사"
Task: "sending.tsx 리브랜드 치환 및 콘텐츠 감사"
Task: "attaching.tsx 리브랜드 치환 및 콘텐츠 감사"
```

---

## Implementation Strategy

### MVP First (Setup + Foundational + User Story 1만)

1. Phase 1: Setup(cherry-pick) 완료 — 6개 화면 전부 코드상 존재(영어/Mattermost 브랜드 상태)
2. Phase 2: Foundational(랜딩 화면 + 진입점 adapt) 완료 — 필수
3. Phase 3: User Story 1(서식 안내 adapt) 완료
4. **중단 후 검증**: quickstart.md 시나리오 1 + 5(리브랜드·번역)로 US1 단독 검증
5. 필요 시 이 시점에서 배포/데모 가능(단, 명령어/멘션/전송/파일첨부 페이지는 아직 영어·Mattermost 브랜드 상태로 남아 있음에 유의)

### Incremental Delivery

1. Setup(cherry-pick) + Foundational(랜딩 adapt) 완료 → 기반 준비 완료
2. User Story 1 adapt 추가 → 독립 검증 → 배포/데모(MVP)
3. User Story 2 adapt 추가 → 독립 검증 → 배포/데모
4. User Story 3 adapt 추가 → 독립 검증 → 배포/데모
5. Phase 6(Polish)으로 전체 품질 게이트 확인 후 최종 완료

---

## Notes

- [P] 태스크 = 서로 다른 파일, 의존 없음
- [Story] 라벨은 추적성을 위한 것 — 태스크를 특정 User Story에 매핑
- 각 User Story는 독립적으로 완료·검증 가능해야 함(단, Foundational의 랜딩 화면 adapt는 공유 전제 조건)
- cherry-pick(Setup)은 constitution 원칙 III의 `/speckit-sync` 예외 적용 — adapt 작업(Phase 2~5)은 예외 아님, 테스트 동반 필수
- 태스크 완료 또는 논리적 묶음 단위로 커밋
- 각 체크포인트에서 멈춰 스토리 단독 동작을 검증
- 피해야 할 것: 모호한 태스크, 동일 파일 충돌, 스토리 간 독립성을 깨는 교차 의존
