# Tasks: 본부-부서 계층 관리 (조직 계층 구조)

**Input**: Design documents from `/specs/003-org-division-hierarchy/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/org-division-api.md, quickstart.md

**Tests**: 포함 — constitution III(동작 변경 시 테스트 동반)·VII(TDD, 실패 테스트 우선)에 따라 각 동작 변경은 실패 테스트를 먼저 작성한다.

**Organization**: 유저 스토리별 독립 구현·검증 가능하도록 그룹핑.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(서로 다른 파일, 미완료 태스크 의존 없음)
- **[Story]**: US1(본부 생성·부서 소속), US2(직속 배정·필터), US3(프로필 표시)

## Phase 1: Setup

**Purpose**: 기준선 확인 — 신규 프로젝트 초기화 없음(기존 모듈 확장)

- [X] T001 기존 org_role 테스트 기준선 통과 확인: `cd server && go test ./channels/app/ -run TestOrgRole ./channels/api4/ -run TestOrgUnit` 및 `cd webapp && npm run test -- org_role_management` 전부 green인지 확인 후 시작

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모델 값 공간 확장 — 모든 스토리가 의존하는 무상태 검증 규칙

**⚠️ CRITICAL**: 이 페이즈 완료 전 유저 스토리 착수 금지

- [X] T002 [실패 테스트] `server/public/model/org_role_test.go`(없으면 신규)에 OrgUnit.IsValid 케이스 추가: `division` 허용, `division`+`parent_id≠''` 거부, `team` 거부, `department` 기존 동작 유지 — 실패 확인
- [X] T003 `server/public/model/org_role.go` OrgUnit.IsValid 확장: type 화이트리스트 `{division, department}`, division이면 ParentID='' 강제 → T002 통과
- [X] T004 [실패 테스트] `server/channels/app/org_role_test.go`에 `orgUnitCodePrefix("division") == "div"` 케이스 추가 — 실패 확인 후 `server/channels/app/org_role.go` `orgUnitCodePrefix`·`Create/UpdateOrgUnit`의 타입 허용 경로에 `division` 반영해 통과

**Checkpoint**: 모델이 division을 알고, team 신규 생성이 막힘 — 스토리 착수 가능

---

## Phase 3: User Story 1 - 본부 생성과 부서 소속 지정 (Priority: P1) 🎯 MVP

**Goal**: 본부 CRUD(soft-delete 가드 포함) + 부서-본부 연결·이관 + 리스트 그룹핑

**Independent Test**: quickstart.md US1 시나리오 — 본부 2개 생성, 부서 소속·이관, 그룹 표시 확인

### 서버

- [X] T005 [US1] [실패 테스트] `server/channels/app/org_role_test.go`에 parent 검증 케이스 추가: department+유효 division parent 성공, 타 팀 parent 거부, 비활성 division parent 거부, department를 parent로 지정 거부, 미존재 parent 거부, type 변경(department↔division) 거부 — 실패 확인
- [X] T006 [US1] `server/channels/app/org_role.go` `CreateOrgUnit`/`UpdateOrgUnit`에 parent 유효성 검사(같은 팀·division 타입·활성) + type 변경 거부 구현 → T005 통과. 에러 id `api.team.org_unit.invalid_parent`
- [X] T007 [US1] [실패 테스트] `server/channels/app/org_role_test.go`에 비활성화 가드 케이스 추가: 활성 하위 부서 존재 시 409, 직속 배정 존재 시 409, 하위·직속 없으면 성공, 재활성화는 무가드 — 실패 확인
- [X] T008 [US1] `server/channels/app/org_role.go` `UpdateOrgUnit`에 division 비활성화 가드 구현(활성 하위 부서 조회 + UserOrgProfiles 직속 배정 조회) → T007 통과. 에러 id `api.team.org_unit.division_has_children`/`division_has_members`
- [X] T009 [US1] `server/channels/api4/team_org_roles_test.go`에 API 레벨 테스트 추가: POST division 201, POST team 400, POST division+parent 400, PUT 이관 200 **+ 이관 후 해당 부서 배정 사용자의 primary_org_unit_id 불변 assert(FR-004)**, PUT 비활성화 가드 409, **각 변경에 OrgRoleAuditLogs 행 기록 assert(FR-012)** (contracts/org-division-api.md 표 그대로)
- [X] T010 [P] [US1] `server/i18n/en.json`·`server/i18n/ko.json`에 신규 에러 메시지 3종(invalid_parent, division_has_children, division_has_members) 동시 추가

### 웹앱

- [X] T011 [US1] [실패 테스트] `webapp/channels/src/components/admin_console/org_role_management/org_role_management.test.tsx`에 본부 리스트 섹션·"본부 추가" 버튼 렌더 테스트 추가 — 실패 확인
- [X] T012 [US1] `org_role_management.tsx`에 "본부 추가" 버튼 + 본부 리스트 섹션(검색·상태·관리 컬럼, 기존 부서 리스트 패턴 재사용) 구현 → T011 통과
- [X] T013 [US1] [실패 테스트] `org_role_management.test.tsx`에 부서 리스트 본부별 그룹핑(+"미소속" 그룹)·부서 행 소속 본부 select·이관 동작 테스트 추가 — 실패 확인
- [X] T014 [US1] `org_role_management_body.tsx`에 `departmentsByDivision` 파생 상태(data-model.md), 그룹 헤더 렌더, 부서 생성·수정 폼 소속 본부 select(비활성 본부 제외), 이관 시 배정 유지 확인 로직 구현 → T013 통과. **본부 리스트·그룹 상태도 기존 팀 전환 가드(001 기능의 stale 응답 차단)에 포함되는지 회귀 테스트 추가(spec Edge Case)**
- [X] T015 [US1] 본부 비활성화 시도 409 응답의 이관 안내 표시(기존 삭제 확인 모달 재사용) 구현 in `org_role_management_body.tsx`
- [X] T016 [P] [US1] `webapp/channels/src/i18n/en.json`·`ko.json`에 US1 신규 문구(본부 추가, 본부 리스트, 미소속, 소속 본부, 이관 안내 등) FormattedMessage 키 동시 추가

**Checkpoint**: 본부 생성→부서 소속→그룹 표시→가드까지 US1 단독 데모 가능 (MVP)

---

## Phase 4: User Story 2 - 본부 직속 배정과 본부 단위 필터 (Priority: P2)

**Goal**: 사용자 주 소속을 본부로 지정 + 필터에서 본부 선택 시 직속+하위 부서 인원 조회

**Independent Test**: quickstart.md US2 시나리오 — 직속 1명·부서 1명 배정 후 본부 필터로 둘 다 조회

- [X] T017 [US2] [실패 테스트] `server/channels/app/org_role_test.go`에 배정 케이스 추가: 활성 division 배정 성공, 비활성 division 배정 거부(기존 활성 검사 경로 통과 확인) — 실패 시 UpsertUserOrgProfile 보완, 이미 통과하면 회귀 테스트로 유지
- [X] T018 [US2] [실패 테스트] `org_role_management.test.tsx`에 배정 select optgroup(본부 직속/부서 구분, 비활성 제외) 렌더 테스트 추가 — 실패 확인
- [X] T019 [US2] `org_role_management_body.tsx` 사용자 배정 select를 optgroup 구조(본부/부서)로 변경 → T018 통과
- [X] T020 [US2] [실패 테스트] `org_role_management.test.tsx`에 본부 필터 테스트 추가: 본부 선택 시 직속+하위 부서 인원 표시, 부서 선택 시 그 부서만 — 실패 확인
- [X] T021 [US2] `org_role_management_body.tsx` 필터에 `divisionFilterSet`(선택 본부 ∪ 하위 부서 id) 로직 구현 → T020 통과
- [X] T022 [P] [US2] `webapp/channels/src/i18n/en.json`·`ko.json`에 US2 신규 문구(본부 직속 그룹 라벨 등) 동시 추가

**Checkpoint**: US1+US2로 계층 기반 인사 배치·조회 완결

---

## Phase 5: User Story 3 - 프로필 카드·계정 설정 계층 표시 (Priority: P3)

**Goal**: "본부명 > 부서명" / "본부명" / "부서명" 3케이스 표시

**Independent Test**: quickstart.md US3 시나리오 — 배정 유형별 사용자 3명의 프로필 카드 표기 확인

- [X] T023 [US3] [실패 테스트] `server/channels/api4/team_org_roles_test.go` `TestGetUserOrgProfileSummary`에 division_name 케이스 추가: 부서(parent 있음) 배정→division+department 채움, 직속 배정→division만, 무소속 부서→department만 — 실패 확인
- [X] T024 [US3] `server/public/model/org_role.go` `UserOrgProfileSummary`에 `DivisionName *string` 추가 + `server/channels/app/org_role.go` `GetUserOrgProfileSummary`에 채움 규칙(data-model.md 매트릭스) 구현 → T023 통과
- [X] T025 [US3] [실패 테스트] `webapp/channels/src/components/profile_popover_org_role/` 테스트에 3케이스 표시 형식("A > B"/"A"/"C") 추가 — 실패 확인
- [X] T026 [US3] `profile_popover_org_role` 컴포넌트에 division_name 반영 표시 구현 → T025 통과
- [X] T027 [US3] `webapp/channels/src/components/user_settings/general/`의 읽기 전용 부서 행에 동일 계층 표기 적용(+ 해당 컴포넌트 테스트 갱신)
- [X] T028 [P] [US3] `webapp/channels/src/i18n/en.json`·`ko.json`에 US3 신규 문구 동시 추가

**Checkpoint**: 전 스토리 완결 — 스펙 SC-001~SC-005 검증 가능

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: 품질 게이트(constitution I) + 종단 검증

- [X] T029 [P] 서버 게이트: `cd server && make check-style && go test ./channels/app/ ./channels/api4/ ./public/model/` 통과
- [X] T030 [P] 웹앱 게이트: `cd webapp && npm run check && npm run check-types && npm run test -- org_role_management profile_popover_org_role` 통과
- [ ] T031 quickstart.md 수동 시나리오 전체 실행(US1~US3 + 가드·엣지 + 회귀 SC-002) — 백업 DB 복원 환경에서 기존 데이터 무손실 확인
- [X] T032 i18n 정합 확인: en.json/ko.json 키 쌍 누락 없음(`npm run i18n-extract` 또는 기존 CI 기준), 커밋 전 `git diff` 리뷰

---

## Dependencies

```
Phase 1 (T001)
  └─> Phase 2 (T002→T003, T004)          # 모델 기반 — 전 스토리 차단
        └─> Phase 3 US1 (T005→T006, T007→T008, T009, T010 / T011→T012, T013→T014→T015, T016)
              ├─> Phase 4 US2 (T017 / T018→T019, T020→T021, T022)   # UI가 US1 그룹핑 위에 얹힘
              └─> Phase 5 US3 (T023→T024, T025→T026, T027, T028)    # 서버 summary는 US1의 parent 데이터 필요
                    └─> Phase 6 (T029, T030 병렬 → T031 → T032)
```

- US2·US3는 US1 완료 후 서로 병렬 진행 가능(파일 겹침: `org_role_management_body.tsx`는 US2 전용, US3는 profile 계열 — 충돌 없음).

## Parallel Execution Examples

- **Phase 3**: T010(server i18n) ∥ T016(webapp i18n) ∥ 서버 트랙(T005~T009) ∥ 웹앱 트랙(T011~T015)
- **US1 완료 후**: US2 트랙(T017~T022) ∥ US3 트랙(T023~T028) 동시 진행
- **Phase 6**: T029 ∥ T030

## Implementation Strategy

1. **MVP = Phase 1~3 (US1)**: 본부 생성·부서 소속·그룹핑·가드까지만으로 배포 가능한 증분. 기존 데이터는 미소속 그룹으로 무손실 수용.
2. **증분 2 = US2**: 직속 배정·본부 필터 — 관리 운영 완결.
3. **증분 3 = US3**: 프로필 노출 — 팀 전체 가시성.
4. 각 증분 종료 시 quickstart 해당 시나리오로 검증 후 커밋(작업 단위 커밋, 사용자 확인 후).
