# Phase 1 Data Model: 본부-부서 계층 관리

DB 스키마 변경 없음. 기존 테이블·모델의 값 공간과 검증 규칙만 확장한다.

## OrgUnit (기존 모델 확장 — `server/public/model/org_role.go`)

| 필드 | 타입 | 변경 | 규칙 |
|---|---|---|---|
| id | string | 없음 | |
| team_id | string | 없음 | 고객사 격리 경계 |
| code | string | 없음 | 자동 생성 prefix에 `div` 추가 |
| name | string | 없음 | 1~128자 |
| type | string | **값 추가** | 허용: `'division'` \| `'department'`. `'team'`은 신규 생성·수정 거부(기존 행 조회만 유지) |
| parent_id | string | **의미 부여** | division: `''` 고정. department: `''`(미소속) 또는 같은 팀·활성 division의 id |
| active | boolean | 없음 | division 비활성화는 가드 통과 시에만 |

### 검증 규칙 배치

- **모델 `IsValid`** (무상태): type ∈ {division, department}; type=division이면
  parent_id=''; name 길이.
- **앱 레이어** (`CreateOrgUnit`/`UpdateOrgUnit`, DB 조회 필요):
  - department의 parent_id ≠ '' 이면: parent 존재 + 같은 team_id + type=division
    + active=true 검사. 위반 시 400.
  - division 비활성화(active true→false) 시: 활성 하위 부서(`parent_id=자기 id,
    active=true`) 또는 직속 배정(`UserOrgProfiles.primary_org_unit_id=자기 id`)
    존재하면 409 + 이관 안내.
  - type 변경(department↔division) 요청은 400 (유형 변경 미제공).

### 상태 전이 (division)

```
활성 ──(하위 부서 0 AND 직속 배정 0)──> 비활성
활성 ──(하위 존재)──> 409 거부
비활성 ──(제한 없음)──> 활성
```

## UserOrgProfile (변경 없음)

`primary_org_unit_id`가 division id도 가리킬 수 있게 되는 것뿐, 필드·검증 변경
없음. 배정 시 대상 조직 활성 검사는 기존 로직 그대로.

## UserOrgProfileSummary (필드 추가)

| 필드 | 타입 | 변경 | 채움 규칙 |
|---|---|---|---|
| team_id | string | 없음 | |
| user_id | string | 없음 | |
| division_name | *string | **신규** | 배정=department & parent 있음 → parent 이름. 배정=division → 그 이름. 그 외 → null |
| department_name | *string | 없음 | 배정=department → 그 이름. 배정=division → null |
| position_name | *string | 없음 | |

### 표시 매트릭스 (웹앱 조립)

| 배정 상태 | division_name | department_name | 프로필 카드 표시 |
|---|---|---|---|
| 본부 A > 부서 B | "A" | "B" | "A > B" |
| 본부 A 직속 | "A" | null | "A" |
| 미소속 부서 C | null | "C" | "C" |
| 미지정 | null | null | (기존과 동일 — 미표시) |

## 웹앱 파생 상태 (클라이언트 전용)

| 항목 | 설명 |
|---|---|
| divisions | `orgUnits.filter(u => u.type === 'division')` |
| departmentsByDivision | division id → 하위 department 배열. 키 `''` = 미소속 그룹 |
| divisionFilterSet | 필터에서 본부 선택 시 `{선택 id} ∪ {parent_id=선택 id인 부서 id}` — 배정의 primary_org_unit_id가 집합에 속하면 표시 |

## 감사 로그 (변경 없음)

기존 `OrgRoleAuditLogs` 기록 경로(CreateOrgUnit/UpdateOrgUnit/Upsert 배정)를 그대로
타므로 division 생성·수정·이관·비활성화 시도 모두 자동 기록된다(FR-012).
