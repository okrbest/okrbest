# Phase 0 리서치: role_updated 이벤트 스코프 제한

방향이 "upstream과 최대한 동일하게"로 확정돼 있어, 남은 불확실성은 포크 고유 사정(마이그레이션 번호 충돌, 자체 역할 확장과의 상호작용)뿐이다. 이미 `/speckit-sync` 세션의 signals 분석과 브레인스토밍 단계에서 조사를 마쳤으므로 여기서는 그 결론을 결정 기록으로 정리한다.

## 1. 마이그레이션 번호

- **Decision**: upstream `000156_add_schemeid_to_roles` / `000157_backfill_roles_schemeid` / `000158_add_roles_schemeid_index`를 `000161` / `000162` / `000163`으로 번호만 올려 반영한다. SQL 내용은 upstream과 완전히 동일.
- **Rationale**: 우리 fork가 이미 `000156~000160`을 자체 기능(채널 자동번역)에 써버렸다(`git log` 확인, `server/channels/db/migrations/migrations.list` 현재 최댓값 160). `000161`부터가 다음 빈 번호다.
- **Alternatives considered**: 이미 배포된 우리 자체 마이그레이션(156~160) 쪽을 밀어서 upstream 번호를 그대로 쓰는 방안 — 이미 운영 환경에 적용된 마이그레이션 히스토리를 건드리는 것이라 기각. 번호 재부여가 유일한 안전한 선택.

## 2. MySQL 대응 마이그레이션 필요 여부

- **Decision**: 필요 없음. postgres 마이그레이션 3개만 작성한다.
- **Rationale**: upstream Mattermost는 이 시점 이전에 MySQL 지원을 완전히 제거했다(`MM-63368: Remove MySQL`, upstream 커밋 다수 확인). 우리 fork도 `server/channels/db/migrations/mysql/`의 마지막 항목이 `000153`에서 멈춰 있고 그 이후 마이그레이션(우리 자체 156~160 포함)은 전부 postgres 전용이다. 이 커밋의 upstream 원본도 mysql 디렉터리를 건드리지 않는다.
- **Alternatives considered**: 없음 — 검토할 대안이 없는 명백한 사실 확인.

## 3. 우리 자체 역할 확장과의 상호작용

- **Decision**: 코드 변경 불필요. `shared_channel_manager`/`secure_connection_manager`(`d83f2dff65`, MM-67647) 등 이 저장소가 추가한 역할은 전부 `BuiltIn: true`로 생성되며, `sendUpdatedRoleEvent()`의 첫 분기(`role.BuiltIn` → 즉시 전역 브로드캐스트)에서 처리가 끝나 scheme 조회 로직을 아예 타지 않는다.
- **Rationale**: `server/channels/app/role.go`, 관련 역할 생성 코드 확인 완료(브레인스토밍 단계).
- **Alternatives considered**: 없음 — 상호작용이 원천적으로 발생하지 않음을 코드로 확인했다.

## 4. Backfill 쿼리 전략

- **Decision**: upstream과 동일하게 단일 `UPDATE roles SET schemeid = ... FROM (...) WHERE ...` 쿼리로 처리한다. 배치/페이지네이션 없음.
- **Rationale**: backfill 대상은 `schemes` 테이블(scheme 개수만큼, 통상 수십~수백 행)이지 `posts`/`users` 같은 대용량 테이블이 아니다. 단일 트랜잭션으로도 안전하다.
- **Alternatives considered**: 배치 처리(예: 1000건씩 반복 UPDATE) — 테이블 규모상 불필요한 복잡도라 upstream 방식(단일 쿼리) 그대로 채택.

## 5. 인덱스 생성 전략

- **Decision**: upstream과 동일하게 `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_scheme_id ON roles(schemeid);`를 `-- morph:nontransactional` 지시자와 함께 사용한다.
- **Rationale**: `CONCURRENTLY`는 테이블 락 없이 인덱스를 생성해 마이그레이션 중 서비스 중단을 피한다 — upstream이 이미 검증한 안전한 패턴.
- **Alternatives considered**: 일반 `CREATE INDEX`(트랜잭션 내, 락 발생) — 무중단 요건에 안 맞아 기각.

## 6. 테스트 전략

- **Decision**: upstream이 추가한 테스트(`server/channels/app/role_test.go` scope별 케이스, `storetest`의 `SchemeId` 검증)를 그대로 포팅한다. 추가로 기존 회귀 테스트(`TestCreateScheme`, `TestDeleteScheme`, `PatchRole` 관련)를 재실행해 JOIN 조건 전환(이름 매칭 → SchemeId 매칭)에 따른 회귀가 없는지 확인한다.
- **Rationale**: 원칙 III(실패를 본 테스트만 인정)에 따라, upstream 테스트를 포팅해 먼저 실패(우리 코드엔 아직 `SchemeId`가 없으므로 컴파일조차 안 됨 — "실패"의 한 형태)를 확인한 뒤 구현으로 통과시킨다.
- **Alternatives considered**: 없음 — "upstream과 동일하게" 원칙상 테스트도 동일하게 포팅하는 것이 기본값.

## 결론

모든 NEEDS CLARIFICATION 항목 해소됨. Phase 1(데이터 모델·quickstart)로 진행 가능.
