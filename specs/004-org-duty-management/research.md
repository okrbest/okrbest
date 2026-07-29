# Phase 0 Research: 직책 관리

Technical Context에 NEEDS CLARIFICATION 없음. 설계 확정을 위한 기존 코드 사실과
결정 사항.

## R1. 직위/직책 저장 구조

- **Decision**: `PositionDefinitions` 테이블 재사용 + `Kind` varchar(32) NOT NULL
  DEFAULT 'position' 컬럼. 허용값 `'position'`(직위) | `'duty'`(직책).
- **Rationale**: 두 마스터는 구조가 동일(이름·rank·active·code·팀 스코프). 별도
  테이블이면 store/app/API CRUD·감사·유니크 인덱스 전부 복제해야 함. DEFAULT
  'position'으로 기존 행 무손실 수용(SC-002). 브레인스토밍에서 확정.
- **Alternatives considered**: ① DutyDefinitions 신설 — CRUD 중복, 기각.
  ② Props 저장 — 무결성·감사 없음, 기각.

## R2. 마이그레이션

- **Decision**: `000153_add_kind_and_primary_duty` up/down 한 쌍.
  - up: `ALTER TABLE PositionDefinitions ADD COLUMN IF NOT EXISTS Kind varchar(32) NOT NULL DEFAULT 'position';`
    + `ALTER TABLE UserOrgProfiles ADD COLUMN IF NOT EXISTS PrimaryDutyID varchar(26) NOT NULL DEFAULT '';`
  - down: 두 컬럼 DROP.
- **Rationale**: 000152(full_visibility 컬럼 추가)와 동일 패턴. 파일은
  `server/channels/db/assets.go`의 go:embed 글롭에 자동 포함되어 별도 등록 불요.
  최신 번호 000152 → 000153.
- **주의**: `db/migrations/`는 CODEOWNERS 보호 경로 — PR에서 명시 검토.

## R3. code 자동 생성

- **Decision**: `orgRoleCodePrefix` 매핑에 duty용 fallback prefix `"duty"` 추가.
  기존 `generateOrgRoleCodeBase` 재사용. 유니크 제약은 기존
  `idx_positiondefinitions_teamid_code` 그대로(직위·직책이 같은 이름이면 code
  충돌 → 기존 collision suffix 로직이 `-2`를 붙여 해결).
- **Rationale**: Edge case "직책과 직위 이름이 같아도 독립 존재"를 기존 충돌 처리
  로직이 자연 커버.

## R4. 교차 배정 차단 지점

- **Decision**: 앱 레이어 `UpsertUserOrgProfile`에서 검증(003의 org unit 활성 검증과
  같은 위치). `primary_position_id` → 존재+활성+kind='position',
  `primary_duty_id` → 존재+활성+kind='duty'. 위반 시 400
  `app.org_role.invalid_position_assignment.app_error` /
  `app.org_role.invalid_duty_assignment.app_error`.
  store에 `GetPositionDefinition(teamID, id)` 단건 조회 추가.
- **Rationale**: 003과 동일 패턴 — 모델은 무상태 검증만, DB 조회 필요한 검증은
  앱 레이어. 참고: 기존 코드는 primary_position_id의 존재·활성도 검증하지 않았음
  (003의 org unit 검증 보강과 같은 구멍) — 이번에 함께 막는다.
- **호환성 주의**: 기존 배정 데이터에 비활성 직위를 참조하는 행이 있어도 재저장
  시에만 검증이 걸림. UI는 항상 전체 객체를 보내므로, 비활성 직위를 그대로 재저장
  하는 경로가 깨지지 않도록 "변경 없는 필드는 기존 값 유지 시 통과" 규칙은 두지
  않고, 대신 비활성 참조 재저장도 400으로 통일한다(관리자가 즉시 정리하도록).
  스펙 FR-005(선택지에서 비활성 제외)와 정합.

## R5. 직위 CRUD의 kind 처리

- **Decision**: `CreatePositionDefinition`/`UpdatePositionDefinition`에 kind 통과.
  생성 시 kind 미지정('')이면 'position'으로 정규화(기존 클라이언트 호환).
  수정 시 kind 변경(직위↔직책 전환)은 400 거부 — 003의 유형 변경 거부와 동일 정책.
- **Rationale**: 기존 API 소비자(구 웹앱 번들)가 kind 없이 POST해도 동작 유지.
  전환 허용 시 배정 정합(교차 배정 규칙)이 깨지므로 거부.

## R6. summary 확장

- **Decision**: `UserOrgProfileSummary`에 `DutyName *string` 추가.
  `GetUserOrgProfileSummary`가 이미 팀 전체 직위 리스트를 조회하므로(positions
  루프) 같은 리스트에서 PrimaryDutyID를 해석 — 추가 쿼리 없음.
- **Rationale**: 003 division_name과 동일 패턴.

## R7. 표시 규칙 (웹앱 조립)

- **Decision**: "본부 > 부서 · 직책 · 직위" — 소속 라벨(003 로직 그대로), 직책은
  duty_name 있을 때만 세그먼트 삽입(미지정 라벨 없음), 직위는 기존 "직위 미지정"
  fallback 유지. popover와 user_settings 모두 동일 규칙. user_settings의 직책 행은
  duty 있을 때만 렌더(스펙 US3-4).
- **Rationale**: 사용자 확정 사항(직책 우선 순서, 미지정 생략).

## R8. 관리 UI 배치

- **Decision**: 직책 리스트 섹션은 직위 리스트 아래(본부→부서→직위→직책 순).
  구성은 직위 리스트에서 full_visibility 컬럼만 제외(이름·정렬순서·상태·관리).
  사용자 리스트에 직책 select 컬럼(직위 컬럼 옆), 필터·일괄 지정에 직책 select
  추가. 모든 select는 활성 직책만.
- **Rationale**: 기존 패턴 최대 재사용. 콘솔·팀 모달이 body 공용이므로 1곳 수정.

## R9. 003 의존

- **Decision**: 003 커밋(27f7c2e79b) 위에서 구현. 표시 조립 로직은 003의
  divisionName 분기를 확장.
- **Rationale**: 표시 순서 "본부 > 부서 · 직책 · 직위"가 003 산출물에 직접 얹힘.
