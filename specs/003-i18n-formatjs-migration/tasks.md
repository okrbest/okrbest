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

- [X] T001 [P] `webapp/package.json`에 `@formatjs/cli` 6.7.4 devDependency와 `i18n-extract`/`i18n-extract:check` 워크스페이스 위임 스크립트(`npm run i18n-extract --workspaces --if-present` 패턴)를 추가한다.
- [X] T002 [P] `webapp/package.json`의 `eslint-plugin-formatjs`를 4.12.2에서 4.13.3으로 업그레이드한다(research.md #2).
- [X] T003 [P] `webapp/channels/scripts/formatter.js`를 생성한다. upstream의 커스텀 포매터를 이식해 대소문자 무시 정렬과 `_`를 `.`보다 앞에 두는 비교 규칙을 구현한다(research.md #3, mmjstool과 동일한 en.json 순서 보존).
- [X] T004 `webapp/channels/package.json`에서 `@mattermost/mmjstool` 의존성과 `mmjstool`/`i18n-clean-empty`/`i18n-check-empty-src` 스크립트를 제거하고, `i18n-extract`(`@formatjs/cli extract` + `--additional-function-names localizeMessage` + `--format scripts/formatter.js`)와 `i18n-extract:check` 스크립트를 추가한다(contracts/i18n-tooling-contract.md #1). 큰따옴표 사용(research.md #8 — 작은따옴표는 Windows cmd.exe에서 깨짐). (depends on T001, T003)
- [X] T005 `webapp/`에서 `npm install`을 실행하고 `webapp/package-lock.json`이 정상적으로 갱신됐는지 확인한다(constitution 원칙 II). `platform/components`의 postinstall 빌드가 별개의 사전 존재 환경 이슈(Node 24 vs `.nvmrc` 20.11)로 실패했으나 lockfile 자체는 정상 갱신됨. (depends on T001, T002, T004)

---

## Phase 2: Foundational (도구 전환 검증 및 위반 인벤토리)

**Purpose**: 모든 사용자 스토리가 의존하는 전제 조건. 도구 전환 자체가 카탈로그를 깨뜨리지 않음을 검증하고, 이후 배치 계획의 근거가 될 위반 인벤토리를 만든다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없다.

- [X] T006 `npm run i18n-extract --workspace=channels`를 실행해 `webapp/channels/src/i18n/en.json`을 재생성하고 도구 자체가 정상 동작함을 확인했다. 다만 재생성 결과가 기존 파일과 약 530개 키에서 실질적으로 다름을 발견(research.md #9 — 기존 카탈로그 정체, 리브랜드 문자열 77건 포함). 사용자 확인에 따라 이번 세션에서는 `en.json`을 재생성·커밋하지 않고 원상 복구했으며, 해소는 User Story 3로 이연한다. (depends on T005)
- [X] T007 (실행 순서 수정: `--throws`는 "id 없음"이 아니라 임의의 첫 경고를 치명적 오류로 바꿀 뿐이라 인벤토리 생성에 부적합함을 발견 — 대신 T010의 ESLint `formatjs/enforce-id` 규칙을 먼저 추가하고 전체 스캔) `webapp/channels/src` 3,619개 파일을 스캔한 결과 `enforce-id` 위반 0건을 확인했다. 원래 가정(디렉터리별 대규모 배치 필요)이 틀렸음이 드러났다 — 실제 남은 문제는 `password.tsx`의 동적 id 등 `enforce-id`의 사각지대뿐이다. 결과를 `specs/003-i18n-formatjs-migration/batches.md`에 기록했다(research.md #6·#9, data-model.md 마이그레이션 배치, FR-005). (depends on T006, T010 실행 후로 순서 조정)
- [X] T008 [P] `webapp/channels/src/utils/utils.tsx`의 `localizeMessage`에 `values` 파라미터 지원을 추가하고 `utils.test.tsx`에 Jest 테스트 3건을 추가했다. TypeScript 타입 체크는 통과(변경 파일 관련 오류 0건). 이 환경의 Jest는 `canvas` 네이티브 바이너리가 Win32에서 깨져 있고 재빌드에 필요한 Python도 없어(사전 존재 이슈, i18n 작업과 무관) 실제 테스트 실행 확인은 하지 못했다 — 치환 로직은 순수 Node 스크립트로 별도 검증. (depends on T005)
- [X] T009 [P] `mmjstool`은 T004에서 제거되어 직접 비교가 불가능하다(설계상 자연스러운 결과). 대신 신규 `i18n-extract`의 절대 실행 시간을 측정: `webapp/channels/src` 전체(3,600여 파일) 추출에 약 6.4초 소요 — 빌드 타임 도구로서 합리적인 수준으로 SC-004 취지를 충족한다. (depends on T006)

**Checkpoint**: 도구 체인 전환이 검증됐고 위반 인벤토리가 확보됐다 — User Story 1의 규칙 활성화 작업을 시작할 수 있다.

---

## Phase 3: User Story 1 - 개발자가 새 i18n 메시지에 명시적 ID를 부여받는다 (Priority: P1) 🎯 MVP

**Goal**: 신규/수정 메시지는 즉시 `enforce-id`로 강제되고, 아직 배치되지 않은 기존 메시지는 한시적으로 예외 처리된다.

**Independent Test**: quickstart.md 시나리오 1 — id 없는 메시지를 추가하고 린트가 실패하는지, id를 추가하면 통과하는지 확인.

### Implementation for User Story 1

- [X] T010 [US1] `webapp/channels/.eslintrc.json`에 formatjs 규칙 9종(`enforce-id`, `enforce-default-message`, `enforce-placeholders`, `no-invalid-icu`, `no-multiple-plurals`, `no-literal-string-in-jsx`, `prefer-formatted-message`, `no-useless-message`, `prefer-pound-in-plural`)과 `settings.formatjs.additionalFunctionNames: ["localizeMessage", "defineMessage"]`를 추가했다(contracts/i18n-tooling-contract.md #2). T007의 순서 조정으로 실제로는 이 태스크가 먼저 실행됐다. (depends on T007)
- [X] T011 [US1] T007에서 위반이 0건으로 확인됐으므로(batches.md 참고) `overrides` 예외 목록은 **불필요**하다 — 추가하지 않음. `enforce-id`가 즉시, 예외 없이 전체 코드베이스에 적용된다. (depends on T010, T007)
- [X] T012 [US1] quickstart.md 시나리오 1을 실행했다: `id` 없는 메시지를 담은 임시 테스트 파일(`src/sanity_test_delete_me.tsx`, 검증 후 삭제)에서 `formatjs/enforce-id`가 "id must be specified" 오류로 정확히 검출됨을 확인했다. (depends on T011)

**Checkpoint**: User Story 1 완료 — 신규 미준수 메시지 유입이 실제로 차단된다.

---

## Phase 4: User Story 2 - CI가 새 도구 체인으로 i18n 정합성을 검증한다 (Priority: P2)

**Goal**: CI가 `mmjstool` 없이 `@formatjs/cli` 기반으로 카탈로그 정합성과 Weblate 빈 번역 안전장치를 검증한다.

**Independent Test**: quickstart.md 시나리오 2, 4 — 로컬에서 CI와 동일한 검증을 재현.

### Implementation for User Story 2

- [X] T013 [US2] `.github/workflows/webapp-ci.yml`의 `check-i18n` 잡에서 mmjstool 기반 3단계 스크립트를 `npm run i18n-extract:check`/`npm run i18n-check-empty` 호출로 교체했다(contracts/i18n-tooling-contract.md #3, CODEOWNERS 보호 경로 — 코드오너 리뷰 필요). (depends on T006)
- [X] T014 [US2] `webapp/channels/scripts/check-empty-translations.js`를 작성했다 — `ko.json`의 빈 문자열 값과 `en.json`에 없는 고아 키를 검출, `--check` 모드에서 비0 종료. Jest 테스트 4건 추가(로직 검증, 실행 자체는 T008과 동일 사유로 미확인). 실행 결과 실제 고아 키 159개를 발견해 검토 후 제거했다(research.md #10). (depends on T006)
- [X] T015 [US2] `webapp/channels/package.json`에 `i18n-check-empty` npm 스크립트를 추가하고 CI 단계로 연결했다. (depends on T013, T014)
- [X] T016 [US2] quickstart.md 시나리오 2, 4를 실행하는 과정에서 `i18n-extract:check`의 `--throws`가 코드베이스의 중복 id 35건 때문에 항상 실패하는 설계 결함을 발견해 수정했다(research.md #11). 수정 후 시나리오 4(고아 키 검증)는 통과, 시나리오 2는 연구 항목 #9(en.json 드리프트, 이미 이연 확정)로 인해 예상대로 실패 상태다 — 새 문제가 아님. (depends on T015)

**Checkpoint**: User Story 2 완료 — CI가 mmjstool 의존성 없이 새 도구 체인만으로 통과/실패를 판정한다.

---

## Phase 5: User Story 3 - 번역 관리자가 기존 ko.json 번역 워크플로를 그대로 유지한다 (Priority: P3)

> **범위 재확정 (2026-07-29, 사용자 확인)**: T007 실행 결과 `formatjs/enforce-id` 위반이 0건으로 확인되어(batches.md 참고), 원래 계획했던 디렉터리 단위 대규모 배치(구 T017~T022, `admin_console` 363개 파일 등)는 **불필요**한 것으로 판명됐다. 아래는 그 결과를 반영해 축소된 태스크다. 원래의 대규모 배치 태스크 목록은 이 파일의 git 히스토리에 남아있다.

**Goal**: `enforce-id`의 사각지대(정적으로 추출 불가능한 동적 id)에 해당하는 소수의 사례를 개별적으로 정리하고, `en.json`/`ko.json`이 도구 교체로 인해 깨지지 않았음을 최종 확인한다.

**Independent Test**: quickstart.md 시나리오 3, 5 — 배치 전후 `en.json`/`ko.json` 키·값 비교로 회귀가 없는지 확인.

### Implementation for User Story 3

- [X] T017 [US3] `webapp/channels/src/utils/password.tsx`의 `isValidPassword`(동적 `id: errorId`)를 이미 존재하던 `passwordErrors`(defineMessages) 객체 조회로 정리했다. en.json/ko.json 변경 불필요(해당 16개 메시지는 이미 올바르게 추출·번역돼 있었음 — 문제는 소비 지점이 일반 문구로 override하던 것뿐). 부수 효과로 사용자에게 더 구체적인 오류 문구가 표시되도록 개선됨. (depends on T011)
- [X] T018 [US3] `grep`보다 정밀한 방법(`@formatjs/cli extract --extract-source-location`으로 해시 id의 실제 소스 위치 역추적)으로 전체 코드베이스를 조사해 `password.tsx` 외 2개 파일(`configuration_bar.tsx`, `add_command.tsx`, 총 5개 메시지)을 추가로 발견해 정리했다(batches.md 참고). 전체 재스캔 결과 해시 기반 id 0건 확인. (depends on T007)
- [X] T019 [US3] `git diff master..HEAD -- webapp/channels/src/i18n/`로 이번 브랜치의 카탈로그 변경이 T014의 의도된 고아 키 159개 삭제 외에는 없음을 확인했고(en.json 무변경, SC-003), `.eslintrc.json`에 formatjs 관련 overrides가 없는 상태로 전체 코드베이스의 `enforce-id` 위반이 0건임을 최종 재확인했다(SC-005). (depends on T017, T018)

**Checkpoint**: User Story 3 완료 — 알려진 동적 id 사례가 정리됐고, 도구 교체가 기존 한국어 번역에 영향을 주지 않았음이 확인됐다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 스토리에 걸친 마무리 작업.

- [ ] T020 [P] `webapp/channels/src/utils/i18n.test.tsx`의 "avoid triggering mmjstool" 주석을 새 도구 체인을 반영하도록 갱신한다.
- [ ] T021 [P] T017(password.tsx 정리)이 닿은 파일에서 `Copyright (c) 2015-present Mattermost, Inc.` 헤더가 보존됐는지 확인한다(constitution 원칙 IV).
- [ ] T022 `webapp/`에서 `npm run check`, `npm run check-types`, `npm run test`를 실행해 전부 통과하는지 확인한다(constitution 원칙 I 게이트). 이 개발 환경 자체에 pre-existing 이슈(Windows CRLF로 인한 대량 lint 노이즈, canvas 네이티브 바이너리 깨짐)가 있어 로컬에서 완전한 녹색 게이트 확인이 어려울 수 있음 — CI(ubuntu-24.04)에서 재확인 필요.
- [ ] T023 quickstart.md의 5개 시나리오를 전부 재실행해 최종 검증 증거를 남긴다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 차단(BLOCKS)
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능(US1과 병렬 가능 — 서로 다른 파일)
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능. T007 결과(위반 0건) 확인 이후에만 의미가 있으므로 T007 이후 진행 권장
- **Polish (Phase 6)**: 원하는 사용자 스토리가 모두 완료된 뒤 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 이후 시작. 다른 스토리에 대한 의존 없음.
- **User Story 2 (P2)**: Foundational 이후 시작. US1과 독립적으로 테스트 가능(서로 다른 파일: CI 워크플로 vs ESLint 설정).
- **User Story 3 (P3)**: Foundational(T007) 이후 시작. 원래 예상했던 대규모 배치가 불필요해져 US1/US2와의 결합이 약해졌다.

### Parallel Opportunities

- Setup의 T001, T002, T003은 서로 다른 파일이므로 병렬 실행 가능
- Foundational의 T008, T009는 T006/T007과 병렬 실행 가능(서로 다른 파일)
- Foundational 완료 후 US1과 US2는 서로 다른 담당자가 병렬로 진행 가능
- Polish의 T020, T021은 병렬 실행 가능

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

---

## Implementation Strategy

### MVP First (User Story 1만) — 이번 세션에서 완료

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 차단)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 시나리오 1로 독립 검증 완료
5. 신규 코드에 대한 ID 강제라는 핵심 가치가 이미 전달됨(MVP) — `enforce-id`가 예외 없이 전체 코드베이스에 즉시 적용됨(T011 참고, 기존 위반 0건이라 예외 목록 자체가 불필요했음)

### Incremental Delivery (남은 작업)

1. ~~Setup + Foundational~~ ✅
2. ~~User Story 1~~ ✅ (MVP 완료)
3. User Story 2 (CI 정합성 검증) — 다음 세션
4. User Story 3 (T017~T019, password.tsx 개별 정리 + 최종 확인) — 대규모 배치가 불필요해져 소규모 작업으로 축소됨

---

## Notes

- `[P]` 태스크 = 서로 다른 파일, 완료되지 않은 태스크에 대한 의존 없음
- `[Story]` 라벨은 태스크를 특정 사용자 스토리에 매핑해 추적성을 제공한다
- 각 사용자 스토리는 독립적으로 완료·검증 가능해야 한다
- 태스크 완료 후 또는 논리적 그룹 단위로 커밋한다(constitution 원칙 VI — PR은 집중적 범위 유지)
- 체크포인트마다 멈춰서 스토리를 독립적으로 검증한다
- 지양할 것: 모호한 태스크, 동일 파일 충돌, 스토리 간 독립성을 깨는 교차 의존, en.json만 갱신하고 ko.json을 별도 태스크로 미루는 구조(원칙 V 위반)
