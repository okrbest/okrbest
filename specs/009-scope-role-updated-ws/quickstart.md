# Quickstart 검증 가이드: role_updated 이벤트 스코프 제한

이 기능은 서버 전용(webapp 변경 없음)이라, 검증은 서버 로그·DB 조회·API/WS 클라이언트로 수행한다.

## 사전 준비

```bash
cd server
make run-server   # 또는 기존 로컬 개발 서버 기동 방식
```

PostgreSQL 인스턴스가 로컬에 떠 있어야 하며, 마이그레이션이 자동 적용된다(서버 기동 시).

## 시나리오 1 — 마이그레이션 적용 확인 (SC-003 관련)

```sql
-- schemeid 컬럼 존재 확인
\d roles

-- 기존 team/channel scheme 역할이 backfill로 채워졌는지 확인
SELECT r.name, r.schemeid, s.scope
FROM roles r
JOIN schemes s ON r.schemeid = s.id
LIMIT 20;
```

**기대 결과**: 기존에 생성돼 있던 team/channel scheme 소속 역할 전부가 `schemeid`를 갖고 있다(NULL이 아님). 빌트인 역할(`system_admin` 등)은 `schemeid`가 NULL로 남아 있어야 한다.

## 시나리오 2 — team-scheme 역할 변경이 해당 team에만 도달 (SC-001)

1. 서로 다른 team(X, Y)에 각각 속한 사용자 A, B로 두 개의 웹소켓 세션을 연다(`wscat` 또는 브라우저 개발자 도구 Network 탭에서 `/api/v4/websocket` 확인).
2. team X에 커스텀 team scheme을 만들고 A를 그 team 멤버로 둔다.
3. 시스템 콘솔 또는 API(`PUT /api/v4/roles/{role_id}`)로 team X scheme의 team_user 역할 권한을 변경한다.
4. A의 세션 로그에서 `role_updated` 이벤트 수신을 확인하고, B의 세션 로그에서는 수신되지 않았는지 확인한다.

**기대 결과**: A만 이벤트를 받는다. B는 받지 않는다.

## 시나리오 3 — 시스템 전역 빌트인 역할 변경은 전원에게 도달 (SC-002)

1. 두 세션(A, B, 서로 다른 team)을 유지한 채 `system_user` 역할의 권한을 변경한다.
2. 두 세션 모두에서 `role_updated` 이벤트 수신을 확인한다.

**기대 결과**: A, B 둘 다 수신.

## 시나리오 4 — scheme 조회 실패 시에도 역할 변경 자체는 성공 (SC-004)

이 시나리오는 자동화 테스트(`role_test.go`)로만 검증한다 — 실제 scheme 조회 실패를 로컬 환경에서 재현하기 어렵다(정상 DB 상태에서는 발생하지 않음). `TestSendUpdatedRoleEvent`류 테스트에서 store mock으로 조회 실패를 주입해 `PatchRole` 자체는 에러 없이 성공하는지 확인한다.

## 검증 완료 기준

- 시나리오 1: SQL 조회로 즉시 확인 가능.
- 시나리오 2, 3: 로컬에서 두 브라우저 세션(또는 두 계정) + 개발자 도구로 수동 검증 필요. **이 세션 환경에는 대화형 브라우저가 없어 실행 불가** — 별도 브라우저 환경에서 실행해야 한다(spec 008과 동일한 제약).
- 시나리오 4: 자동화 테스트로 대체 검증(`go test ./channels/app/ -run TestSendUpdatedRoleEvent -v`).

## 실행 결과 (2026-08-12)

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 1. 마이그레이션 적용 확인 | **통과(대체 검증)** | 이 세션에는 지속되는 로컬 dev 서버가 없어 `\d roles`/수동 SQL을 직접 돌리진 못했다. 대신 `go test ./channels/store/sqlstore/ -run TestRoleStore -v`가 실제 임시 PostgreSQL에 `000161~163` 마이그레이션을 적용하는 로그(`add_schemeid_to_roles`, `backfill_roles_schemeid`, `add_roles_schemeid_index` 전부 migrated)를 남겼고, 신규 `BackfillSchemeId` 서브테스트가 시나리오 1과 동일한 조회(스키마 이전 데이터의 schemeid가 backfill로 채워지는지)를 SQL로 직접 수행해 통과했다. `.evidence/T021_backfill_test.txt` 참고. |
| 2. team-scheme 스코프 전달 | **미실행** | 대화형 브라우저 필요 — 이 세션 환경 제약. 별도 브라우저 환경에서 실행 필요. `TestSendUpdatedRoleEvent/Team_scheme_role_calls_GetTeamsByScheme_and_emits_per-team_events`(단위 테스트)로 로직 자체는 검증됨(`.evidence/T016-T020_final_green.txt`). |
| 3. 전역 빌트인 역할 전달 | **미실행** | 시나리오 2와 동일 제약. `TestSendUpdatedRoleEvent/BuiltIn_role_broadcasts_globally_without_a_DB_lookup`로 로직 검증됨. |
| 4. scheme 조회 실패 시 정상 동작 | **통과** | `go test ./channels/app/ -run TestSendUpdatedRoleEvent -v` — `Scheme_store_error_is_logged_and_skips_broadcast` PASS. |
