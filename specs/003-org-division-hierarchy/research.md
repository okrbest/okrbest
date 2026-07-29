# Phase 0 Research: 본부-부서 계층 관리

Technical Context에 NEEDS CLARIFICATION 없음. 아래는 설계 확정을 위해 조사한
기존 코드 사실과 결정 사항이다.

## R1. 계층 표현 방식

- **Decision**: 기존 `OrgUnits.ParentID`(varchar 26, default '') + `Type` 컬럼을
  그대로 사용한다. `Type`에 `'division'` 값을 추가하고 스키마는 건드리지 않는다.
- **Rationale**: 마이그레이션 000150이 이미 `ParentID`와
  `idx_orgunits_teamid_parentid` 인덱스를 만들어 뒀다(하위 조회 대비 완료).
  스키마 변경 없음 = CODEOWNERS 보호 경로(`db/migrations/`) 비접촉, 배포 위험 0.
- **Alternatives considered**: ① 별도 Divisions 테이블 — CRUD·감사·권한 중복,
  n단계 확장 시 재통합 필요, 기각. ② closure table/materialized path — 2단계
  고정에 과설계, 기각.

## R2. 깊이 제한 강제 지점

- **Decision**: 모델 검증(`OrgUnit.IsValid`)이 아니라 앱 레이어
  (`CreateOrgUnit`/`UpdateOrgUnit`)에서 강제한다: `division`은 `ParentID == ''`,
  `department`의 `ParentID`는 `''` 또는 같은 팀·활성·`division` 타입 조직의 id.
- **Rationale**: parent의 존재·타입·팀·활성 검사는 DB 조회가 필요해 모델 단독
  검증 불가. 모델 `IsValid`는 타입 화이트리스트(`division|department`)와
  "division이면 ParentID 빈 값" 같은 무상태 규칙만 담당. n단계 전환 시 앱 레이어
  규칙만 완화하면 된다.
- **Alternatives considered**: DB CHECK 제약 — 스키마 변경 필요, 기각.

## R3. 'team' 타입 처리

- **Decision**: 신규 생성·수정 시 `type='team'` 거부(모델 화이트리스트에서 제외).
  기존 데이터 조회는 유지(리스트 API는 타입 무관 반환).
- **Rationale**: 조사 결과 `team` 타입은 UI에서 생성 경로가 없고
  (`org_role_management_body.tsx` 전부 `'department'` 고정), 서버는 code prefix
  매핑에만 등장하는 잔재. 고객사 격리는 Mattermost Team(=`OrgUnits.TeamID`)이
  담당함을 확인. 혼동 방지 위해 입구만 막고 데이터 정리는 범위 외.
- **Alternatives considered**: 완전 제거(데이터 삭제) — 운영 DB 상태 미확인
  상태에서 위험, 기각.

## R4. 삭제·비활성화 가드

- **Decision**: UI의 "삭제"는 실제로 `PUT /org-units/{id}`로 `active=false` 전환
  (soft-delete)임을 확인. 가드는 `UpdateOrgUnit`에서 division을 비활성화하려 할 때
  ① `ParentID == 해당 id`인 활성 부서 존재 ② `primary_org_unit_id == 해당 id`인
  배정 존재 — 둘 중 하나라도 있으면 `409 Conflict` + 이관 안내 메시지로 거부.
- **Rationale**: hard-delete 엔드포인트가 원래 없으므로 비활성화 가드만으로 spec의
  "삭제·비활성화 차단"(FR-006)을 충족한다.
- **Alternatives considered**: cascade 무소속 전환 — 실수 시 조직도 훼손(사용자
  선택으로 기각됨).

## R5. 프로필 계층 표시 데이터 전달

- **Decision**: `UserOrgProfileSummary`에 `DivisionName *string` 필드를 추가하고
  `GetUserOrgProfileSummary`에서 배정 조직이 department이고 parent가 있으면 parent
  이름을, 배정 조직이 division이면 그 이름을 DivisionName에 채운다(부서 배정 시
  DepartmentName 유지). 표시 조합("A > B")은 웹앱이 담당.
- **Rationale**: 기존 summary API(GET .../org-profile-summary)와 프로필 카드
  컴포넌트(`profile_popover_org_role`)를 그대로 확장 — 신규 엔드포인트 불필요,
  권한 로직 재사용.
- **Alternatives considered**: 서버에서 표시 문자열 조립 — i18n·표기 정책이
  클라이언트에 있어야 하므로 기각.

## R6. 본부 필터(직속+하위) 구현 위치

- **Decision**: 웹앱 클라이언트 필터로 구현. 관리 화면은 이미 팀 전체 org unit
  리스트와 전체 배정 리스트를 로드하므로, 본부 선택 시
  `unit.id === 선택 || unit.parent_id === 선택` 집합으로 필터한다.
- **Rationale**: 추가 API·쿼리 없음. 데이터 규모(팀당 조직 단위 수백 이하)에서
  클라이언트 필터로 충분.
- **Alternatives considered**: 서버 필터 파라미터 추가 — 현 규모에 불필요, 기각.

## R7. code prefix

- **Decision**: `orgUnitCodePrefix`에 `division → "div"` 추가. 기존
  `department → "dept"`, `team → "team"` 유지.
- **Rationale**: 기존 자동 코드 생성 규칙(`generateOrgRoleCodeBase`)과 일관.

## R8. i18n

- **Decision**: 신규 문구(본부 추가, 미소속, 이관 안내, 409 에러 메시지 등)는
  webapp `en.json`/`ko.json`, 서버 에러는 `server/i18n/en.json`/`ko.json`에 동시
  추가. 기존 org_role 네임스페이스 규칙을 따른다.
- **Rationale**: constitution V(i18n 동기화) + 기존 커밋 ec2391ce60의 선례
  (신규 메시지 en/ko 동시 반영).
