---

description: "Task list template for feature implementation"
---

# Tasks: 팀 멤버 프로필 부서/직위 표시 및 계정 설정 직책 관리체계 전환

**Input**: Design documents from `/specs/002-org-role-profile-visibility/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/org-profile-summary.md, quickstart.md (모두 존재)

**Tests**: 포함함 — constitution 원칙 III("동작 변경 시 테스트 동반")과 spec.md의 각 User Story Acceptance Scenario가 명시적으로 검증 대상을 요구.

**Organization**: 작업은 spec.md의 User Story(P1/P2/P3)별로 그룹화되어 있으며, 각 스토리는 독립적으로 구현·검증 가능하다. 세 User Story 모두가 공유하는 신규 서버 조회 API는 Foundational(Phase 2)에 배치했다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(서로 다른 파일, 의존성 없음). 같은 파일을 순차 수정하는 작업끼리는 [P]를 붙이지 않는다.
- **[Story]**: 이 작업이 속한 User Story(US1/US2/US3)
- 파일 경로는 저장소 루트 기준

## Path Conventions

이번 기능은 `server/`와 `webapp/` 양쪽을 모두 변경하는 모노레포 풀스택 변경이다(plan.md Project Structure 참고).

- `server/public/model/org_role.go`, `server/channels/app/org_role.go`, `server/channels/api4/team.go`, `server/channels/api4/team_org_roles_test.go` — 신규 조회 API
- `webapp/platform/client/src/client4.ts` — 신규 Client4 메서드
- `webapp/channels/src/components/profile_popover/` — 프로필 카드 표시(US1, US3)
- `webapp/channels/src/components/user_settings/general/user_settings_general.tsx` — 계정 설정 읽기 전용 전환(US2)
- `webapp/channels/src/i18n/en.json`, `ko.json` — 메시지 카탈로그
- 관리자 전용 화면(`admin_console/org_role_management/`, `team_org_role_management_modal/`)과 그 테스트는 이번 기능에서 변경하지 않는다(FR-008).

---

## Phase 1: Setup

**Purpose**: 본격적인 변경 전 베이스라인 확인

- [X] T001 [P] `server/channels/api4/team.go`와 `team_org_roles_test.go`에 `org-profile-summary` 경로/심볼이 아직 존재하지 않는지 grep으로 확인해 신규 라우트와 충돌하지 않음을 검증
- [X] T002 [P] `npm run i18n-check-empty-src`(webapp/channels)를 변경 전 베이스라인에서 한 번 실행해 현재 상태가 깨끗함을 확인(이후 회귀 비교 기준점 확보) — 로컬 환경에 형제 저장소(`../mattermost-mobile`)가 없어 스크립트 자체가 ENOENT로 실패(기존 환경 제약, 이번 기능과 무관); en.json/ko.json 키 동기화는 수동으로 확인

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: US1·US2·US3 모두가 의존하는 신규 조회 API(서버) + 클라이언트 메서드 — 이 단계가 끝나기 전에는 어떤 User Story의 UI 작업도 실제 데이터로 검증할 수 없음

**⚠️ CRITICAL**: 아래 서버 작업은 순서대로 진행한다(모델 → App → 라우트)

- [X] T003 [P] `server/channels/api4/team_org_roles_test.go`에 신규 엔드포인트에 대한 실패 테스트를 먼저 추가: (a) 기능 플래그 꺼짐 → 501, (b) 같은 팀 일반 멤버 → 200 + `department_name`/`position_name` 정상 반환, (c) 팀 소속이 아닌 세션 → 403, (d) 대상 사용자가 `team_id` 멤버가 아님 → 404 (contracts/org-profile-summary.md 기준). 라우트 미등록 상태이므로 현재는 실패해야 한다.
- [X] T004 `server/public/model/org_role.go`에 `UserOrgProfileSummary` 구조체(`TeamID`, `UserID`, `DepartmentName *string`, `PositionName *string`) 추가 (data-model.md)
- [X] T005 `server/channels/app/org_role.go`에 `App.GetUserOrgProfileSummary(teamID, userID string) (*model.UserOrgProfileSummary, *model.AppError)` 추가: 기존 `GetUserOrgProfile` + `ListOrgUnits(teamID, true)`/`ListPositionDefinitions(teamID, true)`로 ID→이름 변환(연구 §2, `syncUserOrgProfileToProps`의 맵 구성 패턴 재사용) (depends on T004)
- [X] T006 `server/channels/api4/team.go`에 `GET /teams/{team_id}/users/{user_id}/org-profile-summary` 라우트 등록 및 `getUserOrgProfileSummary` 핸들러 추가: 기존 `getTeamMember` 핸들러(631행 근방)와 동일한 3단 체크(기능 플래그 → `SessionHasPermissionToTeam(..., PermissionViewTeam)` → `UserCanSeeOtherUser` + `GetTeamMember` 404) 후 T005 호출 (depends on T005; T003의 테스트가 통과해야 함)
- [X] T007 [P] `webapp/platform/client/src/client4.ts`에 `getUserOrgProfileSummary(teamId, userId)` 메서드를 기존 `getTeamMember`(1436행)와 동일한 `doFetch` 패턴으로 추가 (depends on T006으로 계약이 확정된 이후 진행, 파일은 독립적이라 병렬 착수 가능)

**Checkpoint**: 여기까지 완료되면 신규 조회 API가 서버·클라이언트 양쪽에서 동작하며, 각 User Story의 UI 작업을 시작할 수 있음

---

## Phase 3: User Story 1 - 프로필 카드에서 동료의 부서/직위 확인 (Priority: P1) 🎯 MVP

**Goal**: 같은 팀 멤버의 프로필 카드에 팀 관리자가 지정한 부서/직위를 "부서명 · 직위명" 한 줄로 표시하고, 기존 자유 텍스트 `user.position` 표시를 대체한다.

**Independent Test**: 팀 관리자가 멤버 C에게 부서/직위(또는 그 중 하나)를 지정한 뒤, 같은 팀의 멤버 B가 멤버 C의 프로필 카드를 열어 지정된 값(또는 결합된 미지정 라벨)이 표시되는지 확인한다(quickstart.md 시나리오 1).

### Tests for User Story 1 ⚠️

> 구현 전에 먼저 작성하고 실패하는 것을 확인한다

- [X] T008 [P] [US1] 신규 팝오버 org-role 표시 컴포넌트에 대한 Jest 테스트 추가: 부서/직위 모두 지정 → "개발팀 · 팀장"; 부서만 지정 → "개발팀 · 직위 미지정"; 둘 다 미지정 → "부서 미지정 · 직위 미지정"(spec Clarifications §1, FR-002a); 기능 플래그가 꺼져 있어 API가 501을 반환하면 아무것도 렌더링하지 않음(FR-009); 대상이 봇 계정(`user.is_bot`)이면 아무것도 렌더링하지 않음(spec Edge Cases)

### Implementation for User Story 1

- [X] T009 [US1] `webapp/channels/src/components/profile_popover/profile_popover_org_role.tsx` 신규 생성: `currentTeamId`+대상 `userId`로 T007의 Client4 메서드를 호출해 "부서명 · 직위명" 결합 문자열을 렌더링. 대상 사용자가 봇(`user.is_bot`)이면 렌더링하지 않고, API가 501/403/404를 반환하면(기능 비활성화 또는 권한 없음) 조용히 아무것도 렌더링하지 않음(T008 테스트를 통과시킴)
- [X] T010 [US1] `webapp/channels/src/components/profile_popover/profile_popover_name.tsx`에서 기존 `user.position` 기반 `<Position>` 렌더링 블록(41~45행)을 제거하고 T009의 신규 컴포넌트로 교체(FR-004) — `currentTeamId`는 `profile_popover.tsx`에서 prop으로 전달
- [X] T011 [US1] 기존 `webapp/channels/src/components/profile_popover/profile_popover_position.tsx`의 다른 사용처가 남아있는지 확인 후, 없으면 파일을 제거하고 있으면 T009 컴포넌트로 흡수 정리
- [X] T012 [P] [US1] `webapp/channels/src/i18n/en.json`/`ko.json`에 팝오버 결합 표시용 메시지 id(예: "부서 미지정", "직위 미지정" 라벨 — 기존 `admin.org_roles.department_unassigned`/`position_unassigned`과 문구 통일) 추가

**Checkpoint**: 이 시점에서 User Story 1은 독립적으로 완전히 동작하며 검증 가능해야 한다

---

## Phase 4: User Story 2 - 계정 설정에서 자신의 부서/직위를 읽기 전용으로 확인 (Priority: P2)

**Goal**: 계정 설정의 편집 가능한 "직책" 섹션을 제거하고, 팀 관리자 지정값을 "부서"/"직위" 두 개의 읽기 전용 행으로 대체한다.

**Independent Test**: 팀 관리자가 사용자 본인에게 부서 또는 직위 중 하나만 지정한 뒤, 해당 사용자가 계정 설정을 열어 지정된 행에는 값이, 나머지 행에는 "미지정"과 안내 문구가 표시되며 입력창이 없는지 확인한다(quickstart.md 시나리오 2).

### Tests for User Story 2 ⚠️

- [X] T013 [P] [US2] `user_settings_general` 테스트에 추가: "부서"/"직위" 두 행이 읽기 전용으로 렌더링되고 입력창(`<input id='position'>`)이 존재하지 않으며, 값이 없는 행은 "미지정" + 관리자 안내 문구가 표시되고, 행 클릭 시 편집 모드로 전환되지 않는다(FR-005~FR-007); 활성화된(현재) 팀이 없으면 두 행 자체가 렌더링되지 않는다(FR-005a); 기능 플래그가 꺼져 있으면 두 행 자체가 렌더링되지 않는다(FR-009)

### Implementation for User Story 2

- [X] T014 [US2] `webapp/channels/src/components/user_settings/general/user_settings_general.tsx`의 `createPositionSection`(1309~1419행)과 관련 편집 로직(`submitPosition`, `updatePosition`, `position` state)을 제거하고, `SettingItemMin`을 `isDisabled={true}`로 사용하는 "부서" 행 + "직위" 행 두 개로 교체(연구 §4)
- [X] T015 [US2] T014의 두 행에 T007의 Client4 메서드로 조회한 본인의 부서/직위 요약값을 연결하고, 활성화된(현재) 팀이 없거나 API가 501(기능 비활성화)을 반환하는 경우 두 행 자체를 렌더링하지 않도록 처리(FR-005a, FR-009, T013 테스트를 통과시킴)
- [X] T016 [P] [US2] `en.json`/`ko.json`에 "부서"/"직위" 섹션 라벨과 "이 값은 팀 관리자가 관리합니다" 안내 문구 메시지 id 추가

**Checkpoint**: User Story 1과 2가 모두 독립적으로 동작해야 한다

---

## Phase 5: User Story 3 - 소속되지 않은 팀 맥락에서의 안전한 표시 (Priority: P3)

**Goal**: 열람자의 현재 팀에 속하지 않은 사용자의 프로필 카드에서는 부서/직위 영역 자체를 숨겨, "미지정"과 시각적으로 구분한다.

**Independent Test**: 서로 다른 팀에 속한 두 사용자가 다이렉트 메시지로 대화하며 상대방의 프로필 카드를 열어, 부서/직위 영역이 표시되지 않는지 확인한다(quickstart.md 시나리오 3).

### Tests for User Story 3 ⚠️

- [X] T017 [P] [US3] 팝오버 테스트에 추가: 대상 사용자가 `currentTeamId`의 팀 멤버가 아닌 경우(기존 `getTeamMember` 셀렉터가 `undefined`) T009 컴포넌트가 아무것도 렌더링하지 않고, org-profile-summary API도 호출되지 않는다(FR-003)

### Implementation for User Story 3

- [X] T018 [US3] T009 컴포넌트(또는 이를 감싸는 `profile_popover.tsx`)에서 `mattermost-redux`의 `getTeamMember(state, currentTeamId, userId)` 셀렉터 값이 존재할 때만 T007 API를 호출하도록 가드 추가(연구 §3, 기존 `getMembershipForEntities` 흐름이 이미 채워주는 멤버십 데이터 재사용) (T017 테스트를 통과시킴)

**Checkpoint**: User Story 1, 2, 3 모두 독립적으로 동작해야 한다

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 변경에 대한 품질 게이트 및 회귀 확인

- [X] T019 [P] `npm run i18n-extract` 대신(로컬 환경에 `../mattermost-mobile` 형제 저장소가 없어 스크립트 실패) en.json/ko.json을 수동으로 대조해 T012/T016 id 5개가 양쪽에 모두 존재하고, 제거한 3개 구 id(`emptyPosition`/`mobile.emptyPosition`/`positionExtra`)가 양쪽에서 완전히 제거됐음을 grep으로 확인. 두 JSON 파일 모두 `python3 -m json.tool`로 유효성 검증 완료(constitution V)
- [X] T020 [P] `make check-style`(vet+golangci-lint)과 `make test-server`는 이 로컬 환경 자체의 사전 존재 이슈(무관한 `storetest.Store`에 `NotificationHistory` 메서드 누락으로 인한 vet 컴파일 오류, DB 미연결로 인한 org-role 테스트 스킵)로 리포 전체 기준 완주는 불가하지만, 변경한 패키지(`channels/api4`, `channels/app`, `public/model`)만 golangci-lint v2로 스코프 실행해 실제 이슈 1건(team.go의 govet shadow 경고) 발견 후 수정 완료, 이후 재실행 결과 0건. `go build ./...` 전체 성공. 회귀 없음을 git stash로 이중 확인(constitution I)
- [X] T021 [P] `npm run check:eslint`는 변경 파일 기준 0 error(경고만, 전부 손대지 않은 기존 코드 라인). `npm run check-types`(tsc -b)에서 내가 만든 이슈 1건 발견(`user_settings_general.tsx`의 `setupInitialState` 반환 타입 미명시로 인한 타입 오류) 후 `: State` 반환 타입 추가로 수정, 재실행 시 변경 파일 관련 오류 0건(나머지는 손대지 않은 파일의 기존 오류 43건, git stash로 pre-existing 확인). 영향받는 Jest 스위트(`profile_popover`, `user_settings/general`, `admin_console/org_role_management`) 전부 실행 — 103+28건 전부 통과(constitution I)
- [X] T022 실제 브라우저·구동 중인 서버가 없는 이 샌드박스 환경 특성상 수동 브라우저 시나리오는 실행 불가 — 대신 quickstart.md의 3개 시나리오를 각각 동등한 자동화 테스트로 커버해 검증: 시나리오1→`profile_popover_org_role.test.tsx`, 시나리오2→`user_settings_general.test.tsx`(활성 팀 없음/기능 비활성화 케이스 포함), 시나리오3→`profile_popover_org_role.test.tsx`의 타팀 숨김 테스트. API curl 검증은 실서버 부재로 미실행(문서화된 한계로 남김)
- [X] T023 `org_role_management.test.tsx`(28건) + `team_org_roles_test.go`의 기존 관리자 전용 테스트가 이번 변경 전후로 동일한 pass/skip/fail 패턴을 보임을 git stash 비교로 확인 — 회귀 없음(FR-008)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행 — US1/US2/US3 모든 UI 작업을 블로킹
- **User Stories (Phase 3+)**: 모두 Foundational 완료에 의존
  - US1(P1) → US2(P2) → US3(P3) 순으로 진행 권장(우선순위 순)하되, Foundational 완료 후에는 병렬 착수도 가능
- **Polish (Phase 6)**: 원하는 User Story가 모두 완료된 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 이후 시작 가능 — 다른 스토리에 의존하지 않음
- **User Story 2 (P2)**: Foundational 이후 시작 가능 — US1과 같은 서버 API(T003~T007)를 재사용하지만 UI 구현(T013~T016)은 US1과 독립적으로 검증 가능
- **User Story 3 (P3)**: Foundational과 US1의 팝오버 컴포넌트(T009~T010)가 존재해야 가드를 추가할 수 있음 — US1 완료 후 진행 권장

### Within Each User Story

- 테스트를 먼저 작성해 실패를 확인한 뒤 구현
- 컴포넌트/섹션 교체 전 기존 로직 제거
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- Setup의 T001, T002는 병렬 가능
- Foundational의 T003(서버 테스트)과 T007(Client4, 계약 확정 후)은 파일이 달라 병렬 가능. T004→T005→T006은 같은 흐름(모델→App→라우트)이라 순차 진행
- US1의 T008(테스트)과 T012(i18n)는 T009~T011과 다른 파일이라 병렬 가능
- US2의 T013(테스트)과 T016(i18n)은 T014~T015와 다른 파일이라 병렬 가능
- US3의 T017(테스트)은 구현(T018)과 분리해 먼저 작성 가능
- Polish의 T019~T021은 서로 다른 명령/파일이라 병렬 가능

---

## Parallel Example: Foundational

```bash
# 계약이 확정된 후 함께 진행 가능한 작업:
Task: "server/channels/api4/team_org_roles_test.go에 실패하는 신규 엔드포인트 테스트 추가"
Task: "webapp/platform/client/src/client4.ts에 getUserOrgProfileSummary 메서드 추가"
```

## Parallel Example: User Story 1

```bash
Task: "profile_popover_org_role 컴포넌트에 대한 Jest 테스트 추가"
Task: "en.json/ko.json에 팝오버 결합 표시용 미지정 라벨 메시지 추가"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational(신규 조회 API) — CRITICAL, 모든 스토리를 블로킹
3. Complete Phase 3: User Story 1(프로필 카드 표시)
4. **STOP and VALIDATE**: quickstart.md 시나리오 1로 독립 검증
5. 필요 시 이 상태로 배포/데모(계정 설정은 여전히 기존 자유 텍스트 편집 가능 상태로 남아있음에 유의)

### Incremental Delivery

1. Setup + Foundational 완료 → 신규 API 준비 완료
2. User Story 1 추가 → 독립 검증 → 배포/데모(MVP)
3. User Story 2 추가 → 독립 검증 → 배포/데모(이 시점부터 FR-006 완전 충족 — 개인 직접 입력 경로 제거)
4. User Story 3 추가 → 독립 검증 → 배포/데모(타팀 숨김까지 완비)
5. Polish로 마무리(i18n 동기화, 품질 게이트, 회귀 확인)

---

## Notes

- [P] 작업 = 서로 다른 파일, 의존성 없음
- [Story] 라벨은 추적성을 위해 작업을 특정 User Story에 매핑
- 각 User Story는 독립적으로 완료·검증 가능해야 함
- 구현 전 테스트가 실패하는지 확인
- 각 작업 또는 논리적 그룹 단위로 커밋
- 체크포인트마다 멈춰 스토리를 독립적으로 검증
- 지양할 것: 모호한 작업, 같은 파일 충돌, 스토리 간 독립성을 해치는 교차 의존성
