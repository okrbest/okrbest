# Tasks: 직책 관리 (직위와 분리된 보직 체계)

**Input**: Design documents from `/specs/004-org-duty-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/org-duty-api.md, quickstart.md. 003 커밋(27f7c2e79b) 위에서 작업.

**Tests**: 포함 — constitution III·VII(TDD, 실패 테스트 우선).

**Organization**: 유저 스토리별 독립 구현·검증.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능 | **[Story]**: US1(직책 마스터), US2(배정·필터·일괄), US3(표시)

## Phase 1: Setup

- [X] T001 기준선 확인: `cd server && go test ./channels/app/ -run 'TestOrgUnit|TestGenerateOrgRole' ./channels/api4/ -run 'TestTeamOrgRoles|TestGetUserOrgProfileSummary|TestTeamOrgUnitHierarchyAPI'` + `cd webapp && npm run test -- org_role_management profile_popover_org_role user_settings_general` 전부 green 확인

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 마이그레이션 + 모델·store 확장 — 전 스토리 차단 요소

**⚠️ CRITICAL**: 이 페이즈 완료 전 스토리 착수 금지

- [X] T002 마이그레이션 신규: `server/channels/db/migrations/postgres/000153_add_kind_and_primary_duty.up.sql`(PositionDefinitions.Kind varchar(32) NOT NULL DEFAULT 'position' + UserOrgProfiles.PrimaryDutyID varchar(26) NOT NULL DEFAULT '') 및 `.down.sql`(두 컬럼 DROP) — data-model.md SQL 그대로. **CODEOWNERS 보호 경로 — 커밋 메시지에 마이그레이션 명시**
- [X] T003 [실패 테스트] `server/public/model/org_role_test.go`에 PositionDefinition kind 케이스 추가: kind ''(허용)·'position'·'duty' 유효, 그 외 무효 — 실패 확인
- [X] T004 `server/public/model/org_role.go`에 `PositionDefinition.Kind`·`UserOrgProfile.PrimaryDutyID`·`UserOrgProfileSummary.DutyName` 필드 + kind 상수(`PositionKindPosition`/`PositionKindDuty`) + 무상태 검증 추가 → T003 통과
- [X] T005 `server/channels/store/sqlstore/org_role_store.go` SELECT/INSERT/UPDATE 컬럼 목록에 Kind·PrimaryDutyID 반영 + `GetPositionDefinition(teamID, id)` 단건 조회 추가. 마이그레이션 적용 후 기존 store 경유 테스트 green 확인(스키마 정합)

**Checkpoint**: 스키마·모델·store가 kind/duty를 알게 됨

---

## Phase 3: User Story 1 - 직책 정의 관리 (Priority: P1) 🎯 MVP

**Goal**: 직책 CRUD(직위와 분리된 리스트) — 기존 직위 무손실

**Independent Test**: quickstart US1 — 직책 2개 생성·정렬·삭제, 직위 리스트 무영향

### 서버

- [X] T006 [US1] [실패 테스트] `server/channels/app/org_role_test.go`에 케이스 추가: duty 생성 시 code prefix 'duty', kind 생략 생성은 'position' 정규화, duty의 full_visibility 강제 false, kind 변경(position↔duty) 400 — 실패 확인
- [X] T007 [US1] `server/channels/app/org_role.go` `CreatePositionDefinition`(kind 정규화·duty prefix·full_visibility 정규화)·`UpdatePositionDefinition`(kind 변경 거부 `app.org_role.kind_change_not_allowed.app_error`) 구현 → T006 통과
- [X] T008 [US1] `server/channels/api4/team_org_roles_test.go`에 API 테스트 추가: POST kind=duty 201(+kind 응답 확인), POST kind 생략 → position, PUT kind 변경 400, 동명 직위·직책 code suffix 분리 (contracts 표 그대로), **직책 생성·수정 시 OrgRoleAuditLogs 기록 assert(FR-010)**
- [X] T009 [P] [US1] `server/i18n/en.json`·`ko.json`에 `kind_change_not_allowed` 에러 문구 추가

### 웹앱

- [X] T010 [US1] [실패 테스트] `webapp/channels/src/components/admin_console/org_role_management/org_role_management.test.tsx`에 추가: "직책 추가" 버튼·직책 리스트 섹션 렌더(직위와 분리), 직책 생성 POST body에 kind='duty', 직책 폼·리스트에 보드 전체보기 없음, 직위 리스트는 kind='duty' 항목 제외 — 실패 확인
- [X] T011 [US1] `org_role_management_body.tsx` 구현: `activeDuties`/`activePositionRanks` 파생(data-model.md), 직책 추가 버튼·폼(이름+rank)·직책 리스트 섹션(이름·정렬순서·상태·관리, full_visibility 컬럼 없음), 직위 리스트·select들은 position kind만 사용 → T010 통과
- [X] T012 [P] [US1] `webapp/channels/src/i18n/en.json`·`ko.json`에 US1 문구(직책 추가·직책 리스트·직책명 등) 동시 추가

**Checkpoint**: 직책 마스터 관리 단독 데모 가능 (MVP)

---

## Phase 4: User Story 2 - 배정·필터·일괄 지정 (Priority: P2)

**Goal**: 직위와 독립인 직책 배정 + 교차 배정 차단 + 필터·일괄

**Independent Test**: quickstart US2 — 직위+직책 동시 배정 유지, 직책 필터 조회, 교차 배정 400

### 서버

- [X] T013 [US2] [실패 테스트] `server/channels/app/org_role_test.go`에 배정 검증 케이스: 활성 duty 배정 성공, duty 자리에 position id 400(`invalid_duty_assignment`), position 자리에 duty id 400(`invalid_position_assignment`), 비활성 duty 400, 직위·직책 동시 배정 상호 독립 저장 — 실패 확인
- [X] T014 [US2] `server/channels/app/org_role.go` `UpsertUserOrgProfile`에 kind 일치 검증 구현(GetPositionDefinition 사용, 003 org unit 검증과 같은 위치) + 감사 AfterState에 primary_duty_id 추가 → T013 통과
- [X] T015 [P] [US2] `server/i18n/en.json`·`ko.json`에 `invalid_duty_assignment`·`invalid_position_assignment` 문구 추가

### 웹앱

- [X] T016 [US2] [실패 테스트] `org_role_management.test.tsx`에 추가: 사용자 행 직책 select 컬럼(활성 직책만), 직위+직책 동시 배정 PUT body 확인, 직책 필터로 보유자만 조회(소속 필터와 AND), 일괄 지정 직책 적용·"변경 안 함" 기본값 — 실패 확인
- [X] T017 [US2] `org_role_management_body.tsx` 구현: AssignmentState에 primary_duty_id(+dirty 판정 포함), 사용자 리스트 직책 컬럼, `filterDutyId`·`bulkDutyId` 상태와 필터·일괄 로직, putUserOrgProfile payload에 primary_duty_id → T016 통과
- [X] T018 [P] [US2] `webapp/channels/src/i18n/en.json`·`ko.json`에 US2 문구(직책 미지정·직책 변경 안 함·전체 직책 등) 동시 추가

**Checkpoint**: 직책 인사 운영 완결

---

## Phase 5: User Story 3 - 프로필·계정 설정 표시 (Priority: P3)

**Goal**: "본부 > 부서 · 직책 · 직위" — 직책 미지정 시 세그먼트 생략

**Independent Test**: quickstart US3 — 표시 매트릭스 4케이스 확인

- [X] T019 [US3] [실패 테스트] `server/channels/api4/team_org_roles_test.go` summary 테스트에 duty_name 케이스 추가: 직책 배정 시 채움, 미배정 null — 실패 확인. **기존 권한 서브테스트(403/404) green 유지 확인(FR-009)**
- [X] T020 [US3] `server/channels/app/org_role.go` `GetUserOrgProfileSummary`에 duty_name 해석(기존 positions 리스트 재사용, 추가 쿼리 없음) 구현 → T019 통과
- [X] T021 [US3] [실패 테스트] `webapp/channels/src/components/profile_popover/profile_popover_org_role.test.tsx`에 표시 매트릭스 케이스 추가: "A > B · 팀장 · 부장", 직책 없음 → 기존 형식, 직책만 → "… · 팀장 · 직위 미지정" — 실패 확인
- [X] T022 [US3] `webapp/platform/client/src/client4.ts` `UserOrgProfileSummary`에 duty_name 추가 + `profile_popover_org_role.tsx` 표시 조립 확장 → T021 통과
- [X] T023 [US3] [실패 테스트→구현] `user_settings_general.test.tsx`에 직책 행 케이스(배정자만 읽기 전용 행 표시) 추가 — 실패 확인 후 `user_settings_general.tsx`에 직책 행(createDutySection, duty 있을 때만 렌더) 구현
- [X] T024 [P] [US3] `webapp/channels/src/i18n/en.json`·`ko.json`에 직책 행 라벨 문구 동시 추가

**Checkpoint**: 전 스토리 완결 — SC-001~SC-005 검증 가능

---

## Phase 6: Polish & Cross-Cutting

- [X] T025 [P] 서버 게이트: `cd server && go vet` + gofmt + golangci-lint(변경 패키지) + `go test ./public/model/ ./channels/app/ ./channels/api4/`(org role 스코프) 통과
- [X] T026 [P] 웹앱 게이트: 변경 파일 eslint 0 에러 + `npx tsc -b`(내 파일 신규 에러 0) + jest 3개 스위트 통과
- [ ] T027 quickstart.md 수동 시나리오(US1~US3 + 교차 배정 400 + 마이그레이션 적용·롤백 확인) 실행
- [X] T028 i18n en/ko 키 쌍 정합 확인 + `git diff` 리뷰

---

## Dependencies

```
Phase 1 (T001)
  └─> Phase 2 (T002 → T003→T004 → T005)      # 마이그레이션·모델·store — 전 스토리 차단
        └─> Phase 3 US1 (T006→T007, T008, T009 / T010→T011, T012)
              ├─> Phase 4 US2 (T013→T014, T015 / T016→T017, T018)   # 배정은 duty 마스터 필요
              └─> Phase 5 US3 (T019→T020 / T021→T022, T023, T024)   # 표시는 배정 데이터 필요(테스트는 독립 구성 가능)
                    └─> Phase 6 (T025 ∥ T026 → T027 → T028)
```

- US2·US3는 US1 완료 후 병렬 가능 (서버 파일 겹침 있으나 함수 단위 분리: T014는 Upsert, T020은 Summary).

## Parallel Execution Examples

- **Phase 3**: T009 ∥ T012 ∥ 서버 트랙(T006~T008) ∥ 웹앱 트랙(T010~T011)
- **US1 후**: US2(T013~T018) ∥ US3(T019~T024)
- **Phase 6**: T025 ∥ T026

## Implementation Strategy

1. **MVP = Phase 1~3 (US1)**: 마이그레이션+직책 마스터 관리 — 기존 직위 무손실 확인까지.
2. **증분 2 = US2**: 배정·교차 차단·필터·일괄.
3. **증분 3 = US3**: 표시 확장.
4. 완료 후 단일 feat 커밋(003 선례), 마이그레이션 포함 사실을 커밋 본문에 명시.
