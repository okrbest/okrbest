---

description: "Task list template for feature implementation"
---

# Tasks: role_updated 이벤트 스코프 제한

**Input**: `specs/009-scope-role-updated-ws/`의 설계 문서(plan.md, spec.md, research.md, data-model.md, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (전부 존재. contracts/ 없음 — API 계약 변경 없음)

**Tests**: 포함한다. 이번 변경은 동작 변경(이벤트 스코프 로직)이라 constitution 원칙 III(실패를 본 테스트만 인정)이 적용되며, upstream이 제공하는 테스트를 그대로 포팅해 먼저 실패를 확인한다.

**Organization**: 사용자 스토리별로 묶는다(spec.md P1/P2/P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 의존성 없음)
- **[Story]**: 어느 사용자 스토리에 속하는지(US1/US2/US3)
- 파일 경로는 저장소 루트 기준 상대 경로

## Path Conventions

이 기능은 server 전용 단일 프로젝트 변경이다(webapp 없음). 모든 경로는 `server/` 하위.

---

## Phase 1: Setup

**목적**: 구현 전 기준선 확보(constitution 원칙 I — 회귀는 실패 목록 diff로 판정)

- [x] T001 [P] 접촉 패키지 품질 게이트 기준선 저장 — `cd server && make check-style` 및
      `go test ./channels/app/... ./channels/store/... ./public/model/...` 실행 결과를
      파일로 저장해둔다(구현 전 상태의 실패 목록 — 마감 시 diff 비교용).

---

## Phase 2: Foundational (모든 사용자 스토리의 선행 조건)

**목적**: `Role.SchemeId` 스키마·모델·스토어 배선을 완성한다. 이 단계 없이는 어떤 사용자 스토리도 동작하지 않는다.

**⚠️ CRITICAL**: 이 단계 완료 전에는 사용자 스토리 작업을 시작할 수 없다.

- [x] T002 [P] 마이그레이션 000161 작성 —
      `server/channels/db/migrations/postgres/000161_add_schemeid_to_roles.up.sql`
      (`ALTER TABLE roles ADD COLUMN IF NOT EXISTS schemeid VARCHAR(26);`) 및
      `.down.sql`. upstream 156과 SQL 동일, 번호만 재부여.
- [x] T003 [P] 마이그레이션 000162 작성 —
      `server/channels/db/migrations/postgres/000162_backfill_roles_schemeid.up.sql`
      (schemes의 `default*Role` 컬럼과 역할 이름을 매칭해 `schemeid` 채우는 단일
      `UPDATE ... FROM` 쿼리) 및 `.down.sql`(`UPDATE roles SET schemeid = NULL;`).
      upstream 157과 SQL 동일, 번호만 재부여.
- [x] T004 [P] 마이그레이션 000163 작성 —
      `server/channels/db/migrations/postgres/000163_add_roles_schemeid_index.up.sql`
      (`-- morph:nontransactional` + `CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_roles_scheme_id ON roles(schemeid);`) 및 `.down.sql`. upstream 158과 SQL
      동일, 번호만 재부여.
- [x] T005 마이그레이션 등록 — `server/channels/db/migrations/migrations.list`에
      000161~163 up/down 파일 6개를 순서대로 추가(depends: T002, T003, T004).
- [x] T006 [P] `Role` 모델에 `SchemeId` 필드 추가 —
      `server/public/model/role.go`: 구조체 필드(`SchemeId *string`,
      `json:"scheme_id"`), `Auditable()`, `MarshalYAML()`, `UnmarshalYAML()`에 반영.
- [x] T007 `role_store.go`에 SchemeId read/write 반영 —
      `server/channels/store/sqlstore/role_store.go`: `Role`(DB용 struct),
      `NewRoleFromModel`/`ToModel`, `tableSelectQuery`, `Save`, `createRole`,
      `GetByNames`에 `SchemeId` 컬럼 추가(depends: T006).
- [x] T008 `role_store.go`의 scheme 매칭 쿼리를 이름 매칭에서 SchemeId 매칭으로 전환 —
      `AllChannelSchemeRoles()`, `ChannelRolesUnderTeamRole()`의 JOIN 조건을
      `Roles.SchemeId = Schemes.Id` 기준으로 변경(depends: T007).
- [x] T009 `scheme_store.go`의 `createScheme()`에서 역할 생성 시 SchemeId 저장 —
      `server/channels/store/sqlstore/scheme_store.go`: `scheme.Id` 생성 시점을
      함수 시작부로 옮기고, team/channel/playbook/run 각 역할 생성 시
      `SchemeId: &scheme.Id` 전달(depends: T006).
- [x] T010 `scheme_store.go`의 `Delete()` 역할 삭제 조건을 SchemeId 매칭으로 전환 —
      role name 목록 매칭 대신 `WHERE SchemeId = schemeId`(depends: T009).
- [x] T011 [P] storetest 포팅 — `server/channels/store/storetest/role_store.go`에
      SchemeId 저장/조회 검증 케이스 추가(upstream 포팅, depends: T007).
- [x] T012 [P] storetest 포팅 — `server/channels/store/storetest/scheme_store.go`에
      역할 생성 시 SchemeId가 채워지는지, 삭제 시 SchemeId 기준으로 역할이
      삭제되는지 검증 케이스 추가(upstream 포팅, depends: T009, T010).

**Checkpoint**: 스키마·모델·스토어 배선 완료 — 사용자 스토리 구현 시작 가능.

---

## Phase 3: User Story 1 - 무관한 사용자에게 역할 변경 정보가 새지 않는다 (Priority: P1) 🎯 MVP

**Goal**: team-scheme/channel-scheme 역할이 변경되면 해당 team/channel 소속 사용자에게만 실시간 갱신 이벤트가 전달된다.

**Independent Test**: 서로 다른 team의 사용자 세션 두 개를 열고, 한 team의 channel 역할 권한을 변경했을 때 그 team 세션에만 이벤트가 도착하는지 확인(quickstart.md 시나리오 2).

### Tests for User Story 1 ⚠️

> 먼저 작성해 실패를 확인한다(SchemeId 배선은 끝났지만 스코프 분기 로직이 아직 없어 실패해야 정상)

- [x] T013 [P] [US1] `role_test.go`에 team-scheme 역할 변경 시 해당 team에만 이벤트가
      발행되는지 검증하는 테스트 포팅 —
      `server/channels/app/role_test.go`(upstream 포팅).
- [x] T014 [P] [US1] `role_test.go`에 channel-scheme 역할 변경 시 해당 channel에만
      이벤트가 발행되는지 검증하는 테스트 포팅 —
      `server/channels/app/role_test.go`(upstream 포팅).

### Implementation for User Story 1

- [x] T015 [US1] `sendUpdatedRoleEvent()` 재작성 —
      `server/channels/app/role.go`: `role.SchemeId`로 scheme 조회 → `Scope`가
      `team`이면 `GetTeamsByScheme`로 팀별 발행, `channel`이면
      `GetChannelsByScheme`로 채널별 발행(둘 다 pageSize=1000, 상한 100,000건,
      FR-006/SC-005). depends: T008(쿼리 배선), T013, T014(실패 확인 완료 후).
- [x] T016 [US1] T013·T014 테스트가 통과하는지 확인하고, 실패했던 지점을 기록한다
      (구현 전 실패 → 구현 후 통과 근거, 원칙 III).

**Checkpoint**: US1 독립적으로 완결·검증 가능(MVP).

---

## Phase 4: User Story 2 - 시스템 전역 역할 변경은 기존과 동일하게 전달된다 (Priority: P2)

**Goal**: 빌트인 역할·소속 없는 커스텀 역할·playbook/run-scheme 역할의 변경은 여전히 모든 접속 사용자에게 전달된다(회귀 없음).

**Independent Test**: 시스템 전역 빌트인 역할의 권한을 변경하고 모든 활성 세션에 이벤트가 도착하는지 확인(quickstart.md 시나리오 3).

### Tests for User Story 2 ⚠️

- [x] T017 [P] [US2] `role_test.go`에 빌트인 역할(`BuiltIn: true`) 변경 시 전역
      브로드캐스트되는지 검증하는 회귀 테스트 포팅 —
      `server/channels/app/role_test.go`(upstream 포팅). T015 구현에 이미 해당
      분기가 포함되므로, 이 테스트가 처음부터 통과하면 실패를 보지 못한 것이니
      해당 분기를 일시적으로 되돌려 실패를 확인한 뒤 복원하거나 `미검증`으로
      표시한다(원칙 III).
- [x] T018 [P] [US2] `role_test.go`에 소속 없는 커스텀 역할(`SchemeId == nil`) 및
      playbook/run-scheme 역할의 전역 전달을 검증하는 테스트 포팅 —
      `server/channels/app/role_test.go`(upstream 포팅). T017과 동일한 검증 방식
      적용.

### Implementation for User Story 2

- [x] T019 [US2] scheme 조회 실패 시 에러를 반환하지 않고 로그만 남기는 처리 확인 —
      `server/channels/app/role.go`의 `sendUpdatedRoleEvent()`에서 scheme 조회
      실패 경로가 `PatchRole`/`UpdateRole`을 실패시키지 않는지 코드 검토 및 필요
      시 보완(FR-005/SC-004, depends: T015).
- [x] T020 [US2] T017·T018 테스트 결과와 원칙 III 처리 방식(되돌려 확인 또는
      미검증 표시)을 기록한다.

**Checkpoint**: US1·US2 둘 다 독립적으로 검증 가능, 회귀 없음 확인.

---

## Phase 5: User Story 3 - 기존 역할 데이터가 스코프 제한 적용 전환 시 유실 없이 이어진다 (Priority: P3)

**Goal**: 기능 도입 이전부터 존재하던 team/channel 역할도 backfill 직후 올바르게 스코프된 이벤트를 전달한다.

**Independent Test**: 마이그레이션 적용 후 SQL로 기존 역할의 `schemeid`가 채워졌는지 확인(quickstart.md 시나리오 1), 그 역할의 권한을 변경해 정상 스코프 전달을 확인.

### Tests for User Story 3 ⚠️

- [x] T021 [P] [US3] backfill 마이그레이션(000162) 검증 테스트 —
      `server/channels/store/storetest/role_store.go` 또는 마이그레이션 자체
      테스트에, 마이그레이션 전 생성된(schemeid 없는) team/channel scheme 역할이
      마이그레이션 후 올바른 `schemeid`를 갖는지 확인하는 케이스 추가(depends:
      T003, T011).

### Implementation for User Story 3

- [x] T022 [US3] quickstart.md 시나리오 1(SQL 조회)을 로컬 환경에서 실행하고 결과를
      `specs/009-scope-role-updated-ws/quickstart.md`에 기록한다(depends: T005).

**Checkpoint**: 세 사용자 스토리 모두 독립적으로 검증 가능.

---

## Phase 6: Polish & Cross-Cutting Concerns

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [x] T023 품질 게이트 — `cd server && make check-style` +
      `go test ./channels/app/... ./channels/store/... ./public/model/...`를 돌리고,
      실패 목록이 T001의 구현 전 기준선과 같은지 **diff로 보인다**. 개수 비교로
      대신하지 않는다.
- [x] T024 종단 검증 — 로컬 서버 기동 후 `quickstart.md`의 시나리오 1~4를 **실제
      환경에서** 훑고 절별 통과·실패를 기록한다. 시나리오 2·3은 대화형 브라우저가
      필요해 이 세션 환경에서 못 돌리면 `미실행`으로 적는다.
- [x] T025 SC 검증 — `spec.md`의 SC-001~SC-005 각각을 **실측값**으로 확인한다
      (추정 금지). SC-001·SC-002는 quickstart 시나리오 2·3 결과, SC-003은
      quickstart 시나리오 1 SQL 결과, SC-004는 T020 테스트 결과, SC-005는
      100,000건 상한 관련 코드/테스트 결과로 확인한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작.
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 막는다.
- **User Stories (Phase 3~5)**: 전부 Foundational 완료를 전제한다.
  - US1(P1)은 다른 스토리에 의존하지 않는다.
  - US2(P2)는 US1이 구현한 `sendUpdatedRoleEvent()`의 다른 분기를 검증하므로
    코드 의존은 없지만 같은 함수를 다루기 때문에 US1 이후 진행을 권장한다.
  - US3(P3)는 Foundational의 backfill(T003)에 의존하며, US1 구현과는 독립적으로
    검증 가능하다.
- **Polish (Phase 6)**: 진행하기로 한 사용자 스토리가 모두 끝난 뒤.

### Within Each User Story

- 테스트를 먼저 작성해 실패를 확인한 뒤 구현한다.
- 모델/스토어(Foundational) → 이벤트 로직(US1) → 회귀 검증(US2) → 데이터 이관
  검증(US3) 순서.

### Parallel Opportunities

- T002, T003, T004(마이그레이션 3개, 서로 다른 파일)는 병렬 작성 가능.
- T011, T012(storetest 포팅)는 병렬 가능.
- T013, T014(US1 테스트)는 병렬 가능.
- T017, T018(US2 테스트)는 병렬 가능.

---

## Parallel Example: Foundational

```bash
Task: "마이그레이션 000161 작성 (server/channels/db/migrations/postgres/000161_*.sql)"
Task: "마이그레이션 000162 작성 (server/channels/db/migrations/postgres/000162_*.sql)"
Task: "마이그레이션 000163 작성 (server/channels/db/migrations/postgres/000163_*.sql)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1(Setup) 완료 — 기준선 저장.
2. Phase 2(Foundational) 완료 — 스키마·모델·스토어 배선(CRITICAL, 모든 스토리를 막음).
3. Phase 3(US1) 완료 — team/channel 스코프 전달.
4. **STOP & VALIDATE**: quickstart 시나리오 1·2로 US1 독립 검증.

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 완성.
2. US1 추가 → 독립 검증 → MVP.
3. US2 추가 → 회귀 없음 확인.
4. US3 추가 → 기존 데이터 이관 확인.
5. Polish(완료 검증 3종)로 마감.

---

## Notes

- [P] 과제 = 서로 다른 파일, 의존성 없음.
- upstream(`7425c681`)을 마이그레이션 번호 재부여만 거쳐 그대로 포팅하는 것이
  원칙이다 — 새 설계 판단이 필요하면 그 자리에서 멈추고 upstream 원본을 다시
  확인한다.
- `server/channels/db/migrations/`는 CODEOWNERS 보호 경로다 — PR 리뷰 시 별도
  승인 필요할 수 있음을 인지한다.
- 각 과제 또는 논리적 묶음 완료 후 커밋한다.

---

## 완료 검증 결과 (2026-08-12)

증거 파일은 `.evidence/`에 보존.

### 품질 게이트 (T023)

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| 전체 `make check-style` | `cd server && make check-style` | exit 2 — `channels/jobs/*`, `enterprise/message_export/shared`의 `storetest.Store`에 `NotificationHistory` 메서드 누락으로 인한 **사전 존재하는 무관 실패**. 기준선(T001)과 정렬 후 diff 결과 **완전 동일**(신규 실패 0건) | `.evidence/T023_final_check_style.txt`, `diff` exit 0 |
| 접촉 패키지 `go vet` (app/sqlstore/storetest/model) | `go vet ./channels/app/... ./channels/store/sqlstore/... ./channels/store/storetest/... ./public/model/...` | exit 0, 기준선과 완전 동일(diff 없음) | `.evidence/T023_final_vet_scoped.txt` |
| `public/model` 역할 테스트 | `go test ./public/model/... -run "TestRole\|TestMakeDefaultRoles" -v` | 전부 PASS, 기준선과 동일 목록 | `.evidence/T023_final_test_model.txt` |
| `channels/app` 역할 테스트(기존+신규) | `go test ./channels/app/ -run "TestGetRolesByNames\|TestGetRoleByName\|TestGetRoleByID\|TestGetAllRoles\|TestAppUpdateChannelScheme\|TestAppUpdateTeamScheme\|TestSendUpdatedRoleEvent" -v` | 7개 전부 PASS(기존 6개 + 신규 `TestSendUpdatedRoleEvent`) | `.evidence/T023_final_test_app.txt` |
| `sqlstore` Role/Scheme storetest(실제 PostgreSQL, 마이그레이션 000161~163 적용됨) | `go test ./channels/store/sqlstore/ -run "TestRoleStore\|TestSchemeStore" -v` | 전부 PASS(`BackfillSchemeId` 포함 신규 케이스 포함) | `.evidence/T021_backfill_test.txt`, `.evidence/T021_scheme_store_test.txt` |

**결론**: 우리 변경과 무관한 사전 결함 1건(전체 저장소 범위, 접촉 패키지 밖)을 제외하면 신규 실패 없음.

### 종단 검증 (T024, quickstart.md 참고)

| 시나리오 | 결과 |
|---|---|
| 1. 마이그레이션 적용 확인 | 통과(대체 검증 — 실제 PostgreSQL에 마이그레이션 적용 로그 + `BackfillSchemeId` 테스트로 SQL 결과 확인. 지속 dev 서버가 없어 수동 `\d roles` 조회는 미실행) |
| 2. team-scheme 스코프 전달 | 미실행(대화형 브라우저 필요 — 이 세션 환경 제약) |
| 3. 전역 빌트인 역할 전달 | 미실행(동일 제약) |
| 4. scheme 조회 실패 시 정상 동작 | 통과(`TestSendUpdatedRoleEvent/Scheme_store_error_is_logged_and_skips_broadcast`) |

### SC 검증 (T025, 실측값)

| SC | 실측 결과 |
|---|---|
| SC-001 (무관 세션 이벤트 수신 0건) | **부분 검증**. `TestSendUpdatedRoleEvent/Team_scheme_role_calls_GetTeamsByScheme...`/`Channel_scheme_role...`가 `publishEvent`를 매칭되는 team/channel ID에만 호출함을 mock 단위에서 확인(구조적 보장). 실제 두 브라우저 세션 간 "무관 세션 0건 수신"의 종단 실측은 미실행(브라우저 환경 필요). |
| SC-002 (전역 빌트인 100% 수신) | **부분 검증**. `TestSendUpdatedRoleEvent/BuiltIn_role_broadcasts_globally_without_a_DB_lookup` PASS — 기존과 동일한 전역 브로드캐스트 메커니즘(teamID="", channelID="") 호출 확인. 실제 세션 100% 수신 종단 실측은 미실행. |
| SC-003 (기존 역할 100% 이관) | **실측 완료**. `TestRoleStore/PostgreSQL/BackfillSchemeId`: 마이그레이션 전 상태(schemeid NULL)를 시뮬레이션한 역할에 000162 백필 쿼리를 실행한 뒤 `schemeid`가 scheme.Id와 정확히 일치함을 `assert.Equal`로 확인(실제 PostgreSQL). |
| SC-004 (조회 실패해도 100% 성공) | **실측 완료**. `TestSendUpdatedRoleEvent/Scheme_store_error_is_logged_and_skips_broadcast`: `require.Nil(t, appErr)` PASS. |
| SC-005 (100,000건 상한 안정성) | **부분 검증**. `Team_scheme_paginates_across_multiple_pages`/`Channel_scheme_paginates_across_multiple_pages`가 페이지네이션 메커니즘(1000건 단위, 여러 페이지)은 실측 확인. 정확히 100,000건 경계 도달 시나리오는 upstream 테스트에도 없으며(대규모 mock 데이터 필요) 이번에도 별도로 구성하지 않음 — 코드상 `const maxBroadcasts = 100000` 상한 로직 존재만 정적 확인. |

**분석 단계(U1) 후속 조치**: `/speckit-analyze`에서 지적한 FR-006/SC-005 테스트 근거 약함 문제는, upstream 테스트를 그대로 포팅한 페이지네이션 테스트로 메커니즘은 검증했으나 정확한 100,000건 경계 테스트는 (upstream도 갖고 있지 않아) 추가하지 않았음을 여기 명시한다.
