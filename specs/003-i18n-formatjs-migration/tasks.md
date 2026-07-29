---

description: "Task list for i18n 추출 도구 마이그레이션 (mmjstool → @formatjs/cli)"
---

# Tasks: i18n 추출 도구 마이그레이션 (mmjstool → @formatjs/cli)

**Input**: Design documents from `/specs/003-i18n-formatjs-migration/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/i18n-tooling-contract.md](./contracts/i18n-tooling-contract.md), [quickstart.md](./quickstart.md)

**Tests**: spec.md는 TDD를 명시적으로 요구하지 않았지만, 이 기능은 `/speckit-sync`가 spec 분기로 전환한 항목이라 constitution 원칙 III의 cherry-pick 전용 테스트 면제(원칙 VII)가 적용되지 않는다. 따라서 실제 함수/스크립트 동작을 바꾸는 태스크(T008 `localizeMessage`, T014 빈 번역 검출 스크립트)는 Jest 단위 테스트를 동반한다. 순수 ESLint 설정 변경(T010, T011)과 CI 워크플로 변경(T013)은 `quickstart.md` 시나리오 실행을 완료 기준으로 삼는다.

**Organization**: 태스크는 `spec.md`의 사용자 스토리(P1/P2/P3)별로 그룹화되어 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 대한 의존 없음)
- **[Story]**: 이 태스크가 속한 사용자 스토리(US1/US2/US3)
- 모든 설명에 정확한 파일 경로를 포함한다

## Path Conventions

경로는 기존 모노레포 구조를 그대로 사용한다: `webapp/package.json`(루트 워크스페이스), `webapp/channels/**`(채널 워크스페이스), `.github/workflows/webapp-ci.yml`(CI, CODEOWNERS 보호 경로).

---

## Phase 1: Setup (도구 설치)

**Purpose**: 새 도구 체인을 설치하되 아직 어떤 검증 동작도 활성화하지 않는다.

- [ ] T001 [P] `webapp/package.json`에 `@formatjs/cli` 6.7.4 devDependency와 `i18n-extract`/`i18n-extract:check` 워크스페이스 위임 스크립트(`npm run i18n-extract --workspaces --if-present` 패턴)를 추가한다.
- [ ] T002 [P] `webapp/package.json`의 `eslint-plugin-formatjs`를 4.12.2에서 4.13.3으로 업그레이드한다(research.md #2).
- [ ] T003 [P] `webapp/channels/scripts/formatter.js`를 생성한다. upstream의 커스텀 포매터를 이식해 대소문자 무시 정렬과 `_`를 `.`보다 앞에 두는 비교 규칙을 구현한다(research.md #3, mmjstool과 동일한 en.json 순서 보존).
- [ ] T004 `webapp/channels/package.json`에서 `@mattermost/mmjstool` 의존성과 `mmjstool`/`i18n-clean-empty`/`i18n-check-empty-src` 스크립트를 제거하고, `i18n-extract`(`@formatjs/cli extract` + `--additional-function-names localizeMessage` + `--format scripts/formatter.js`)와 `i18n-extract:check` 스크립트를 추가한다(contracts/i18n-tooling-contract.md #1). (depends on T001, T003)
- [ ] T005 `webapp/`에서 `npm install`을 실행하고 `webapp/package-lock.json`이 정상적으로 갱신됐는지 확인한다(constitution 원칙 II). (depends on T001, T002, T004)

---

## Phase 2: Foundational (도구 전환 검증 및 위반 인벤토리)

**Purpose**: 모든 사용자 스토리가 의존하는 전제 조건. 도구 전환 자체가 카탈로그를 깨뜨리지 않음을 검증하고, 이후 배치 계획의 근거가 될 위반 인벤토리를 만든다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없다.

- [ ] T006 `npm run i18n-extract --workspace=channels`를 실행해 `webapp/channels/src/i18n/en.json`을 재생성하고, 마이그레이션 이전 파일과 비교해 실질적인 문구 변경 없이(포맷터 적용 후) 동일함을 확인한다(research.md #3 검증). (depends on T005)
- [ ] T007 위 추출을 `--throws` 옵션으로 재실행해 명시적 `id`가 없는 메시지를 모두 찾아내고, 이를 디렉터리 단위로 그룹화해 `specs/003-i18n-formatjs-migration/batches.md`에 배치 목록(각 항목에 `scope`, `status: pending` 필드 포함)으로 기록한다. `batches.md`에는 이후 각 배치가 완료될 때마다 그 배치에서 새로 부여되거나 이름이 바뀐 id 목록을 기록할 "변경된 키" 섹션도 함께 마련한다(research.md #6 정량화, data-model.md 마이그레이션 배치, FR-005). (depends on T006)
- [ ] T008 [P] `webapp/channels/src/utils/utils.tsx`의 `localizeMessage`에 `values` 파라미터 지원을 추가해 `formatMessage` API와 완전히 호환되도록 하고, 인접 테스트 파일(예: `webapp/channels/src/utils/utils.test.tsx`)에 플레이스홀더 치환을 검증하는 Jest 단위 테스트를 동반한다(constitution 원칙 III). (depends on T005)
- [ ] T009 [P] 기존 `mmjstool` 기반 추출과 신규 `i18n-extract`(`@formatjs/cli`) 실행 시간을 비교 측정해 SC-004("동등하거나 단축") 충족 여부를 기록한다. (depends on T006)

**Checkpoint**: 도구 체인 전환이 검증됐고 위반 인벤토리가 확보됐다 — User Story 1의 규칙 활성화 작업을 시작할 수 있다.

---

## Phase 3: User Story 1 - 개발자가 새 i18n 메시지에 명시적 ID를 부여받는다 (Priority: P1) 🎯 MVP

**Goal**: 신규/수정 메시지는 즉시 `enforce-id`로 강제되고, 아직 배치되지 않은 기존 메시지는 한시적으로 예외 처리된다.

**Independent Test**: quickstart.md 시나리오 1 — id 없는 메시지를 추가하고 린트가 실패하는지, id를 추가하면 통과하는지 확인.

### Implementation for User Story 1

- [ ] T010 [US1] `webapp/channels/.eslintrc.json`에 formatjs 규칙 9종(`enforce-id`, `enforce-default-message`, `enforce-placeholders`, `no-invalid-icu`, `no-multiple-plurals`, `no-literal-string-in-jsx`, `prefer-formatted-message`, `no-useless-message`, `prefer-pound-in-plural`)과 `settings.formatjs.additionalFunctionNames: ["localizeMessage", "defineMessage"]`를 추가한다(contracts/i18n-tooling-contract.md #2). (depends on T007)
- [ ] T011 [US1] T007에서 식별된 모든 디렉터리를 `webapp/channels/.eslintrc.json`의 `overrides`에 등재해 해당 경로에서만 `formatjs/enforce-id`를 한시적으로 완화한다. 이 목록은 배치가 완료될 때마다 줄어드는 방향으로만 갱신된다(FR-002, FR-008). (depends on T010, T007)
- [ ] T012 [US1] quickstart.md 시나리오 1을 실행한다: 예외 목록에 없는 파일에 id 없는 메시지를 추가해 `npm run check --workspace=channels`가 실패하는지 확인하고, id 추가 후 통과하는지 확인한 뒤 결과를 기록한다. (depends on T011)

**Checkpoint**: User Story 1 완료 — 신규 미준수 메시지 유입이 실제로 차단된다.

---

## Phase 4: User Story 2 - CI가 새 도구 체인으로 i18n 정합성을 검증한다 (Priority: P2)

**Goal**: CI가 `mmjstool` 없이 `@formatjs/cli` 기반으로 카탈로그 정합성과 Weblate 빈 번역 안전장치를 검증한다.

**Independent Test**: quickstart.md 시나리오 2, 4 — 로컬에서 CI와 동일한 검증을 재현.

### Implementation for User Story 2

- [ ] T013 [US2] `.github/workflows/webapp-ci.yml`의 `check-i18n` 잡에서 mmjstool 기반 3단계 스크립트를 `npm run i18n-extract:check --workspace=channels` 호출로 교체한다(contracts/i18n-tooling-contract.md #3). 이 파일은 CODEOWNERS 보호 경로이므로 PR에 코드오너 리뷰가 필요함을 명시한다. (depends on T006)
- [ ] T014 [US2] Weblate 빈 번역 정리 대체 스크립트를 작성한다(예: `webapp/channels/scripts/check-empty-translations.js`) — `ko.json`의 빈 문자열 값과 `en.json`에 없는 고아 키를 검출하고, `--check` 모드에서 비0 종료 코드를 반환하며, 검출 로직에 대한 Jest 단위 테스트를 동반한다(research.md #5, constitution 원칙 III). (depends on T006)
- [ ] T015 [US2] `webapp/channels/package.json`에 T014 스크립트를 실행하는 `i18n-check-empty` npm 스크립트를 추가하고, `.github/workflows/webapp-ci.yml`의 `check-i18n` 잡에 해당 단계를 추가한다. (depends on T013, T014)
- [ ] T016 [US2] quickstart.md 시나리오 2, 4를 로컬에서 실행해 CI와 동일한 결과가 재현되는지 확인하고 기록한다. (depends on T015)

**Checkpoint**: User Story 2 완료 — CI가 mmjstool 의존성 없이 새 도구 체인만으로 통과/실패를 판정한다.

---

## Phase 5: User Story 3 - 번역 관리자가 기존 ko.json 번역 워크플로를 그대로 유지한다 (Priority: P3)

**Goal**: 기존 메시지에 파일/디렉터리 단위 배치로 id를 부여하면서 `en.json`/`ko.json`을 **같은 변경에서** 동시 갱신하고, 번역 회귀 0건을 달성한다.

**Independent Test**: quickstart.md 시나리오 3, 5 — 배치 전후 `en.json`/`ko.json` 키·값 비교로 회귀가 없는지 확인.

### Implementation for User Story 3

- [ ] T017 [US3] 배치 적용 전 `en.json`/`ko.json`의 키 집합과 값을 회귀 비교 기준선으로 스냅샷한다. (depends on T007)
- [ ] T018 [P] [US3] 배치: `webapp/channels/src/components/admin_console/**`(약 363개 파일)의 기존 메시지에 명시적 id를 부여하고 `en.json`을 갱신하며, **같은 변경에서** `webapp/channels/src/i18n/ko.json`에 대응 키를 동시 반영(신규 키는 미번역 상태, 이름이 바뀐 키는 기존 번역 값 이관 — constitution 원칙 V)한다. `webapp/channels/.eslintrc.json`의 overrides 예외 목록에서 `admin_console`을 제거하고, `batches.md`의 해당 항목 `status`를 `completed`로 갱신하며 변경된 키 목록을 기록한다(FR-005). (depends on T011, T017)
- [ ] T019 [P] [US3] 배치: `webapp/channels/src/components/widgets/**`에 동일하게 적용한다(id 부여 + en.json/ko.json 동시 갱신 + 예외 목록 제거 + batches.md 갱신). (depends on T011, T017)
- [ ] T020 [P] [US3] 배치: `webapp/channels/src/components/integrations/**`, `post_view/**`, `user_settings/**`에 동일하게 적용한다. (depends on T011, T017)
- [ ] T021 [P] [US3] 배치: T007 인벤토리에 남아 있는 `webapp/channels/src/components/**`의 나머지 하위 디렉터리(예: `sidebar`, `channel_header_menu`, `advanced_text_editor`, `drafts` 등)를 필요한 만큼의 추가 하위 배치로 나누어 순차 적용한다(각 하위 배치도 동일하게 en.json/ko.json 동시 갱신 + 예외 목록 제거 + batches.md 갱신). (depends on T011, T017)
- [ ] T022 [P] [US3] 배치: `webapp/channels/src/actions/`, `utils/`, `selectors/`, `plugins/`, `packages/`에 동일하게 적용한다. (depends on T011, T017)
- [ ] T023 [US3] 모든 배치가 반영된 뒤 `webapp/channels/.eslintrc.json`의 overrides 예외 목록이 비어 있는지, `batches.md`의 모든 항목이 `completed`인지 확인한다(SC-005). (depends on T018, T019, T020, T021, T022)
- [ ] T024 [US3] quickstart.md 시나리오 3, 5를 실행해 배치 전후 `en.json`/`ko.json` 키·값을 비교하고 번역 회귀 0건을 확인한다(SC-003). (depends on T023)

**Checkpoint**: User Story 3 완료 — 전체 메시지가 명시적 id를 가지며 기존 한국어 번역이 보존됐다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 스토리에 걸친 마무리 작업.

- [ ] T025 [P] `webapp/channels/src/utils/i18n.test.tsx`의 "avoid triggering mmjstool" 주석을 새 도구 체인을 반영하도록 갱신한다.
- [ ] T026 [P] 배치 작업(T018~T022)이 닿은 파일들에서 `Copyright (c) 2015-present Mattermost, Inc.` 헤더가 보존됐는지 표본 확인한다(constitution 원칙 IV).
- [ ] T027 `webapp/`에서 `npm run check`, `npm run check-types`, `npm run test`를 실행해 전부 통과하는지 확인한다(constitution 원칙 I 게이트).
- [ ] T028 quickstart.md의 5개 시나리오를 전부 재실행해 최종 검증 증거를 남긴다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 차단(BLOCKS)
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능(US1과 병렬 가능 — 서로 다른 파일)
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능하나, `.eslintrc.json`의 overrides 목록을 다루므로 US1(T011)이 먼저 목록을 만들어 둔 뒤 진행하는 것을 권장
- **Polish (Phase 6)**: 원하는 사용자 스토리가 모두 완료된 뒤 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 이후 시작. 다른 스토리에 대한 의존 없음.
- **User Story 2 (P2)**: Foundational 이후 시작. US1과 독립적으로 테스트 가능(서로 다른 파일: CI 워크플로 vs ESLint 설정).
- **User Story 3 (P3)**: Foundational 이후 시작 가능하나, US1이 만든 overrides 예외 목록(T011)을 전제로 각 배치가 그 목록에서 항목을 제거하므로 US1과 순서상 얕은 결합이 있다.

### Within Each User Story

- US3의 배치 태스크(T018~T022)는 서로 다른 디렉터리를 다루므로 병렬 실행 가능
- 각 배치 태스크는 en.json과 ko.json을 **같은 변경(같은 PR/커밋)**에서 함께 갱신해야 한다(constitution 원칙 V) — ko.json 갱신을 별도 후속 태스크로 미루지 않는다

### Parallel Opportunities

- Setup의 T001, T002, T003은 서로 다른 파일이므로 병렬 실행 가능
- Foundational의 T008, T009는 T006/T007과 병렬 실행 가능(서로 다른 파일)
- Foundational 완료 후 US1과 US2는 서로 다른 담당자가 병렬로 진행 가능
- US3의 배치 태스크 T018~T022는 서로 다른 디렉터리이므로 여러 담당자가 병렬로 진행 가능
- Polish의 T025, T026은 병렬 실행 가능

---

## Parallel Example: Setup + Foundational

```bash
# Setup 단계에서 함께 실행 가능한 태스크:
Task: "webapp/package.json에 @formatjs/cli 6.7.4 추가"
Task: "webapp/package.json의 eslint-plugin-formatjs를 4.13.3으로 업그레이드"
Task: "webapp/channels/scripts/formatter.js 생성"

# Foundational 단계에서 함께 실행 가능한 태스크:
Task: "localizeMessage에 values 파라미터 지원 추가 + Jest 테스트 (utils.tsx)"
Task: "mmjstool vs i18n-extract 실행 시간 비교 측정"
```

## Parallel Example: User Story 3 배치

```bash
Task: "배치: components/admin_console/** id 부여 + en.json/ko.json 동시 갱신 + 예외 목록 제거"
Task: "배치: components/widgets/** id 부여 + en.json/ko.json 동시 갱신 + 예외 목록 제거"
Task: "배치: components/integrations/**, post_view/**, user_settings/** id 부여 + en.json/ko.json 동시 갱신 + 예외 목록 제거"
Task: "배치: actions/, utils/, selectors/, plugins/, packages/ id 부여 + en.json/ko.json 동시 갱신 + 예외 목록 제거"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 차단)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 시나리오 1로 독립 검증
5. 이 시점에서 신규 코드에 대한 ID 강제라는 핵심 가치가 이미 전달됨(MVP)

### Incremental Delivery

1. Setup + Foundational 완료 → 도구 체인 전환 및 위반 인벤토리 확보
2. User Story 1 추가 → 독립 검증 → 신규 미준수 코드 유입 차단(MVP!)
3. User Story 2 추가 → 독립 검증 → CI가 mmjstool 없이 자립
4. User Story 3 추가(배치 단위로 여러 PR에 걸쳐 점진 진행) → 매 배치마다 독립 검증 → 최종적으로 100% ID 커버리지와 번역 무손실 달성

### Batch(User Story 3) 진행 전략

- 각 배치(T018~T022)는 constitution 원칙 VI("PR은 집중적·최소 범위로 유지")에 따라 별도의 작은 PR로 나누어 병합하며, 각 PR은 en.json과 ko.json을 함께 포함해야 원칙 V를 만족한 상태로 병합된다.
- 배치 순서는 우선순위가 없으므로 담당자 가용성에 따라 병렬·순차 어느 쪽으로도 진행 가능하다.
- 모든 배치가 끝나기 전까지 User Story 1(T011)의 예외 목록은 계속 존재하며, 이는 정상 상태다.

---

## Notes

- `[P]` 태스크 = 서로 다른 파일, 완료되지 않은 태스크에 대한 의존 없음
- `[Story]` 라벨은 태스크를 특정 사용자 스토리에 매핑해 추적성을 제공한다
- 각 사용자 스토리는 독립적으로 완료·검증 가능해야 한다
- 태스크 완료 후 또는 논리적 그룹 단위로 커밋한다(constitution 원칙 VI — PR은 집중적 범위 유지)
- 체크포인트마다 멈춰서 스토리를 독립적으로 검증한다
- 지양할 것: 모호한 태스크, 동일 파일 충돌, 스토리 간 독립성을 깨는 교차 의존, en.json만 갱신하고 ko.json을 별도 태스크로 미루는 구조(원칙 V 위반)
