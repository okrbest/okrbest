---

description: "Task list template for feature implementation"
---

# Tasks: 조직/직위 관리 다중 선택 · 일괄 지정 · 일괄 저장

**Input**: Design documents from `/specs/001-org-role-bulk-assign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (모두 존재)

**Tests**: 포함함 — constitution 원칙 III("동작 변경 시 테스트 동반")과 spec.md의 테스트 계획 섹션이 명시적으로 요구.

**Organization**: 작업은 spec.md의 User Story(P1/P2/P3)별로 그룹화되어 있으며, 각 스토리는 독립적으로 구현·검증 가능하다.

> `/speckit-analyze` 1차 실행에서 발견된 커버리지 갭(팀 전환 중 저장 경합, FR-013 미검증, "선택 적용" 활성화 조건 미검증, 중복 클릭 방지 미검증)을 반영해 태스크를 보강함 — 관련 신규 작업: T012, T013, T016, T018, T019 (기존 순번 T012 이후 전체가 뒤로 밀림).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(서로 다른 파일, 의존성 없음). **같은 파일을 수정하는 작업끼리는 [P]를 붙이지 않는다**(편집 충돌 방지) — 이번 기능은 대부분의 작업이 `org_role_management_body.tsx`/`org_role_management.test.tsx` 두 파일에 집중되어 있어 실제로 [P]가 붙는 작업은 적다.
- **[Story]**: 이 작업이 속한 User Story(US1/US2/US3)
- 파일 경로는 저장소 루트 기준

## Path Conventions

이번 기능은 단일 프론트엔드 컴포넌트 디렉터리로 범위가 국한된 모노레포 웹앱 변경이다.

- `webapp/channels/src/components/admin_console/org_role_management/` — 주 변경 대상
- `webapp/channels/src/i18n/` — `en.json`/`ko.json` 메시지 카탈로그
- 서버(`server/`)는 이번 기능에서 변경하지 않는다.

---

## Phase 1: Setup

**Purpose**: 본격적인 변경 전 베이스라인 확인

- [X] T001 [P] `webapp/channels/src/i18n/en.json`에서 `admin.org_role_management.` 접두 id가 아직 존재하지 않는지 grep으로 확인해 신규 id와 충돌하지 않음을 검증
- [X] T002 [P] `npm run i18n-check-empty-src`(webapp/channels)를 변경 전 베이스라인에서 한 번 실행해 현재 상태가 깨끗함을 확인(이후 회귀 비교 기준점 확보)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 3개 User Story 모두가 의존하는 공용 기반 작업 — 이 단계가 끝나기 전에는 어떤 User Story도 시작할 수 없음

**⚠️ CRITICAL**: 아래 작업은 순서대로(같은 파일을 반복 수정하므로) 진행한다

- [X] T003 `webapp/channels/src/components/admin_console/org_role_management/org_role_management_body.tsx`에 남아있는 기존 인라인 한글 리터럴(약 63건, T005에서 제거될 행별 저장 버튼 관련 문구는 제외)을 `FormattedMessage`/`defineMessage`로 전환하고 `admin.org_role_management.*` id 부여
- [X] T004 [P] `webapp/channels/src/components/admin_console/org_role_management/org_role_management.tsx`에 남아있는 잔여 인라인 리터럴(약 6건)을 `FormattedMessage`로 전환 (T003과 다른 파일이므로 병렬 가능)
- [X] T005 `org_role_management_body.tsx`에서 행별 "저장" 버튼/컬럼과 관련 상태(`savingUserId`, `savedUserId`, 기존 `saveUserAssignment`, 그 타이머)를 제거하고, 기존 병합 로직(마지막 저장값 + 편집 중 값 병합 후 PUT)을 공용 헬퍼 `putUserOrgProfile(userId)`로 추출 (T003 이후 진행)
- [X] T006 `org_role_management_body.tsx`에 `selectedUserIds`(`Set<string>`) state와, `assignments` vs `userProfiles`를 비교하는 memoized `dirtyUserIds`(`Set<string>`) 파생 값을 추가 (T005 이후 진행)
- [X] T007 `org_role_management_body.tsx`의 팀 변경/데이터 재조회 시 상태 초기화 effect를 확장해 `selectedUserIds`, `bulkOrgUnitId`/`bulkPositionId`, 저장 요약 상태까지 함께 초기화 (T006 이후 진행)
- [X] T008 [P] `npm run i18n-extract` 실행 후 T003/T004에서 도입한 id들(이번 Foundational 단계에서 전환한 기존 리터럴 분)의 `webapp/channels/src/i18n/en.json` 항목을 확인하고 `webapp/channels/src/i18n/ko.json`에 대응하는 한국어 번역을 채움

**Checkpoint**: 여기까지 완료되면 선택 상태·Dirty 판정·공용 저장 헬퍼·i18n 기반이 갖춰져 각 User Story 구현을 시작할 수 있음

---

## Phase 3: User Story 1 - 여러 사용자에게 부서/직위 일괄 지정 (Priority: P1) 🎯 MVP

**Goal**: 체크박스로 여러 사용자를 선택 → 일괄 지정 툴바로 부서/직위 중 원하는 필드만 적용 → 단일 "저장" 버튼으로 변경된 사용자 전원을 한 번에 저장

**Independent Test**: 서로 다른 직위를 가진 사용자 2명 이상을 체크박스로 선택하고, 일괄 부서만 선택해 "선택 적용" 후 "저장"을 클릭하면 두 사용자의 부서만 변경되고 각자의 직위는 유지된 채 서버에 저장됨을 확인

### Tests for User Story 1 ⚠️

> 구현 전에 먼저 작성하고 실패하는 것을 확인한다

- [X] T009 [US1] `org_role_management.test.tsx`에 테스트 추가: 각 사용자 행에 체크박스가 렌더링되고 개별 클릭으로 선택/해제된다
- [X] T010 [US1] `org_role_management.test.tsx`에 테스트 추가: 서로 다른 기존 직위를 가진 사용자 2명을 선택하고 일괄 "부서"만 지정해 "선택 적용" 클릭 시, 두 사용자의 부서만 바뀌고 직위는 각자 기존 값 그대로 유지된다. **또한 "선택 적용" 클릭 직후에는 어떤 `org-profile` PUT 요청도 발생하지 않았음을 함께 확인한다(네트워크 호출은 이후 "저장" 클릭 시에만 발생)**
- [X] T011 [US1] `org_role_management.test.tsx`에 테스트 추가: 일부 사용자만 선택한 상태에서 "선택 적용"을 클릭하면 선택되지 않은 사용자의 배정은 변경되지 않는다. **또한 이 시점까지 PUT 요청이 전혀 발생하지 않았음을 함께 확인한다**
- [X] T012 [US1] `org_role_management.test.tsx`에 테스트 추가: 사용자를 선택하지 않았거나, 선택은 했지만 일괄 부서/직위를 아무것도 지정하지 않은 경우 "선택 적용" 버튼이 비활성화된다
- [X] T013 [US1] (선택) `org_role_management.test.tsx`에 테스트 추가: 일괄 지정 툴바의 부서/직위 select에 "미지정"으로 설정하는 옵션이 없고 첫 옵션이 "변경 안 함"뿐임을 확인한다
- [X] T014 [US1] `org_role_management.test.tsx`에 테스트 추가: 3명 중 2명만 변경(Dirty)한 뒤 "저장" 클릭 시 정확히 2건의 PUT만 발생하고(대상 userId 검증), 변경하지 않은 1명에 대해서는 PUT이 발생하지 않는다
- [X] T015 [US1] `org_role_management.test.tsx`에 테스트 추가: 변경(Dirty)된 사용자가 없으면 "저장" 버튼이 비활성화되고, 클릭해도 추가 PUT이 발생하지 않는다
- [X] T016 [US1] `org_role_management.test.tsx`에 테스트 추가: 저장이 진행 중인 동안(`isBulkSaving`) "저장" 버튼이 비활성화되어, 빠르게 두 번 클릭해도 두 번째 클릭으로 인한 추가 PUT 라운드가 발생하지 않는다
- [X] T017 [US1] `org_role_management.test.tsx`에 회귀 테스트 추가/대체: 단일 사용자만 변경 후 저장 시 정확히 1건의 PUT과 성공 메시지가 표시됨을 확인 (기존 행별 저장 버튼 기준 테스트를 신규 전역 저장 버튼 기준으로 재작성)
- [X] T018 [US1] `org_role_management.test.tsx`에 테스트 추가: 여러 사용자를 Dirty 상태로 만들고 저장을 시작한 직후(첫 PUT 응답이 오기 전) `teamId`가 바뀌면, 이후 남은 사용자에 대한 상태 갱신이 새 화면에 반영되지 않는다(이전 팀의 `userProfiles` 갱신 결과가 새 teamId 렌더 결과에 나타나지 않음을 확인)
- [X] T019 [US1] `org_role_management.test.tsx`에 테스트 추가: 사용자를 선택하고 일괄 지정 값을 설정한 뒤 `teamId`가 바뀌면, `selectedUserIds`/`bulkOrgUnitId`/`bulkPositionId`가 초기화되어 모든 체크박스가 해제되고 일괄 지정 select가 기본값("변경 안 함")으로 돌아간다

### Implementation for User Story 1

- [X] T020 [US1] `org_role_management_body.tsx`의 사용자 테이블에 체크박스 열 추가(각 행 `selectedUserIds`와 연동, T005에서 제거된 저장 컬럼 자리를 대체)
- [X] T021 [US1] `org_role_management_body.tsx`에 일괄 지정 툴바 UI 추가 — 필터 행 아래·"사용자 리스트" 제목 위에 배치: "일괄 부서"/"일괄 직위" select(첫 옵션은 행별 select의 "미지정"과 구분되는 "변경 안 함" no-op), "선택 적용" 버튼(`selectedUserIds.size > 0`이고 `bulkOrgUnitId` 또는 `bulkPositionId` 중 하나 이상이 설정된 경우에만 활성화), "선택된 사용자: N명" 텍스트. 신규 라벨은 모두 `admin.org_role_management.*` id의 `FormattedMessage`로 작성
- [X] T022 [US1] `applyBulkToSelection` 핸들러 구현: `selectedUserIds`의 각 사용자에 대해 `bulkOrgUnitId`/`bulkPositionId` 중 값이 설정된 필드만 덮어쓰고 나머지 필드는 사용자별 기존 값 유지, `assignments`만 갱신하고 네트워크 호출 없음
- [X] T023 [US1] `saveAllDirty` 구현: 호출 시작 시점의 `teamId`를 캡처하고, `dirtyUserIds`를 순서대로(순차, `for...of`) 순회하며 `putUserOrgProfile(userId)` 호출. 각 반복에서 `setUserProfiles`/`setBulkSaveSummary` 등 상태 갱신 직전에 캡처한 `teamId`가 현재 `teamId`(prop)와 여전히 같은지 확인하고, 다르면(팀이 전환됨) 남은 순회를 중단하고 더 이상 상태를 갱신하지 않음. 개별 실패는 `try/catch`로 잡아 나머지 순회는 계속 진행, 저장 중(`isBulkSaving`)이거나 Dirty가 없으면 버튼 비활성화
- [X] T024 [US1] 제거된 저장 컬럼을 대체하는 전역 "저장" 버튼을 추가해 `saveAllDirty`에 연결하고, 전원 성공 시 기존 `SUCCESS_MESSAGE_DURATION_MS` 자동 숨김 방식의 기본 성공 메시지를 표시
- [X] T025 [P] [US1] `org_role_management.scss`에 체크박스 열 및 일괄 지정 툴바 스타일 추가 (T020/T021에서 사용하는 클래스명과 일치시킬 것)

**Checkpoint**: 이 시점에 User Story 1은 독립적으로 완전히 동작하고 테스트 가능해야 함 — 최소 기능(MVP)

---

## Phase 4: User Story 2 - 필터/검색 화면에서 표시된 사용자 전체 선택 (Priority: P2)

**Goal**: 헤더 "전체 선택" 체크박스는 현재 필터/검색에 표시된 사용자만 대상으로 하고, 필터가 바뀌어도 이미 선택한 사용자의 선택 상태는 유지된다

**Independent Test**: 검색어로 목록을 2명으로 좁힌 뒤 "전체 선택"을 클릭하면 그 2명만 선택되고, 검색어를 지웠을 때 나머지 사용자는 선택되어 있지 않으며, 검색으로 숨겨졌던 선택 사용자는 검색 해제 후에도 계속 선택되어 있음을 확인

### Tests for User Story 2 ⚠️

- [X] T026 [US2] `org_role_management.test.tsx`에 테스트 추가: 필터 미적용 상태에서 헤더 "전체 선택" 클릭 시 모든 행이 선택되고, 다시 클릭하면 모두 해제된다
- [X] T027 [US2] `org_role_management.test.tsx`에 테스트 추가: 검색/필터로 일부 사용자만 표시된 상태에서 헤더 "전체 선택" 클릭 시 **표시된 사용자만** 선택되고, 숨겨진 사용자의 선택 상태는 영향받지 않는다
- [X] T028 [US2] `org_role_management.test.tsx`에 테스트 추가: 특정 사용자를 선택한 뒤 필터를 바꿔 화면에서 사라지게 해도 선택 상태는 유지되며, 필터를 해제하면 여전히 체크되어 있다
- [X] T029 [US2] `org_role_management.test.tsx`의 기존 검색/필터 테스트(회귀)가 선택 레이어 추가 이후에도 그대로 통과하는지 확인 (필요 시 최소 수정)

### Implementation for User Story 2

- [X] T030 [US2] `org_role_management_body.tsx`의 테이블 헤더에 "전체 선택" 체크박스 추가: `checked`/`indeterminate` 상태를 `filteredUsers` 기준으로 계산하고, 클릭 시 `filteredUsers`의 id만 `selectedUserIds`에 추가/제거(전체를 비우지 않음 — 필터를 바꿔가며 여러 번 선택하면 누적됨)

**Checkpoint**: User Story 1과 2가 모두 독립적으로 동작해야 함

---

## Phase 5: User Story 3 - 일괄 저장 결과(성공/실패) 확인 (Priority: P3)

**Goal**: 일괄 저장 후 성공/실패 건수를 요약해 보여주고, 실패가 있으면 자동으로 사라지지 않는다

**Independent Test**: 특정 사용자의 저장 요청만 실패하도록 설정한 상태에서 다수 사용자를 일괄 저장하면, 성공 건수와 실패 건수가 함께 표시되고 메시지가 자동으로 사라지지 않음을 확인

### Tests for User Story 3 ⚠️

- [X] T031 [US3] `org_role_management.test.tsx`에 테스트 추가: 한 사용자의 PUT은 실패, 다른 사용자는 성공하도록 mock한 뒤 저장 시, 요약 메시지에 성공/실패 건수가 정확히 표시되고 자동으로 사라지지 않는다
- [X] T032 [US3] `org_role_management.test.tsx`에 테스트 추가: 모든 사용자가 성공하면 요약 메시지가 `SUCCESS_MESSAGE_DURATION_MS` 이후 자동으로 사라진다(기존 실시간 타이머 대기 패턴 재사용)

### Implementation for User Story 3

- [X] T033 [US3] `org_role_management_body.tsx`에서 T024의 단순 성공 메시지를 구조화된 `bulkSaveSummary {successCount, failCount}` 상태로 대체하고, 성공/실패 건수를 함께 표시하는 메시지로 렌더링 — `failCount === 0`일 때만 자동 숨김, 그 외에는 다음 저장 시도 전까지 유지

**Checkpoint**: 3개 User Story 모두 독립적으로 동작해야 함

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T034 [P] `npm run i18n-extract` + `npm run i18n-check-empty-src`(webapp/channels) 실행해 T021~T033(US1~US3에서 신규로 추가된 UI 문자열)에서 추가한 신규 문자열의 `en.json`/`ko.json` 누락 여부 확인 및 보완
- [X] T035 `npm run check-types` + `npm run check`(webapp/channels)로 타입/린트 통과 확인
- [X] T036 `npm run test -- org_role_management`(webapp/channels)로 전체 테스트(기존 회귀 + 신규) 통과 확인
- [ ] T037 `quickstart.md`의 수동 검증 시나리오 1~4를 실제 관리자 콘솔에서 실행해 확인
- [X] T038 [P] `savingUserId`/`savedUserId`/원래의 `saveUserAssignment` 등 T005에서 제거 대상이었던 잔재가 `org_role_management_body.tsx`/`org_role_management.test.tsx`에 남아있지 않은지 grep으로 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행 — 모든 User Story를 블로킹함
- **User Stories (Phase 3+)**: 모두 Foundational 완료에 의존
  - US1은 다른 스토리 의존성 없음(우선 구현 대상)
  - US2는 US1의 체크박스 열(T020)이 먼저 있어야 헤더 체크박스를 붙일 자리가 생김(사실상 T020 이후)
  - US3는 US1의 저장 버튼/성공 메시지(T024)를 확장하므로 US1 이후에 진행
- **Polish (Phase 6)**: 원하는 모든 User Story 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 가능, 다른 스토리에 의존하지 않음
- **User Story 2 (P2)**: Foundational 완료 후 시작 가능하나, 체크박스 열이 이미 있어야 하므로 실질적으로 US1의 T020 이후 진행 권장
- **User Story 3 (P3)**: Foundational 완료 후 시작 가능하나, 저장 흐름(T023/T024)을 확장하므로 실질적으로 US1 완료 후 진행 권장

### Within Each User Story

- 테스트를 먼저 작성하고 실패를 확인한 뒤 구현
- 대부분의 작업이 `org_role_management_body.tsx`/`org_role_management.test.tsx` 두 파일에 집중되어 있어 순차 진행이 원칙(같은 파일 동시 편집 충돌 방지)
- 스타일(`.scss`)과 i18n(`en.json`/`ko.json`) 작업만 실제 병렬 가능

### Parallel Opportunities

- T001/T002 (Setup, 서로 다른 확인 작업)
- T003(body.tsx)과 T004(shell.tsx) — 서로 다른 파일
- T025(scss)은 관련 tsx 작업과 병렬 가능
- T034/T038(Polish) — 서로 다른 관심사, 병렬 가능

---

## Parallel Example: Foundational

```bash
# T003(org_role_management_body.tsx 리터럴 전환)과 T004(org_role_management.tsx 리터럴 전환)는 서로 다른 파일이므로 동시 진행 가능:
Task: "org_role_management_body.tsx의 기존 인라인 리터럴을 FormattedMessage로 전환"
Task: "org_role_management.tsx의 잔여 인라인 리터럴을 FormattedMessage로 전환"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료 (필수 — 모든 스토리를 블로킹)
3. Phase 3 User Story 1 완료
4. **중단 후 검증**: User Story 1을 독립적으로 테스트(체크박스 선택 → 일괄 지정 → 저장)
5. 준비되면 배포/데모

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비 완료
2. User Story 1 추가 → 독립 테스트 → 배포/데모 (MVP!)
3. User Story 2 추가(전체 선택 범위·선택 유지) → 독립 테스트 → 배포/데모
4. User Story 3 추가(부분 실패 요약) → 독립 테스트 → 배포/데모
5. 각 스토리는 이전 스토리를 깨지 않고 가치를 더함

---

## Notes

- [P] 작업 = 서로 다른 파일, 의존성 없음 — 이번 기능은 대부분 같은 2개 파일에 집중되어 실제 [P] 대상은 적음
- [Story] 라벨은 추적성을 위해 작업을 특정 User Story에 매핑함
- 각 User Story는 독립적으로 완료·테스트 가능해야 함
- 구현 전 테스트가 실패하는지 반드시 확인
- 작업 단위 또는 논리적 그룹 단위로 커밋
- 체크포인트마다 멈춰서 스토리 단독 동작을 검증
- 지양할 것: 모호한 작업, 동일 파일 동시 수정 충돌, 스토리 간 독립성을 해치는 교차 의존
