# Phase 1 Data Model: 직책 관리

마이그레이션 1건(000153): 컬럼 2개 추가. 테이블 신설 없음.

## PositionDefinition (기존 모델 확장)

| 필드 | 타입 | 변경 | 규칙 |
|---|---|---|---|
| id/team_id/code/name/rank/active | 기존 | 없음 | |
| full_visibility | boolean | 의미 이전 | **직책 전용** — kind='position'이면 항상 false로 정규화, 직위 UI 미노출. 보드 전체보기(isCEO) 판정에 primary_duty_id 포함 |
| kind | string | **신규** | `'position'`(기본) \| `'duty'`. 생성 시 빈 값은 'position' 정규화. 수정 시 kind 변경 400 거부 |

### 검증 배치

- **모델 `IsValid*`** (무상태): kind ∈ {'', 'position', 'duty'} (빈 값은 앱에서
  정규화 전 단계 허용).
- **앱 레이어**:
  - Create: kind 정규화('' → 'position'), position이면 full_visibility=false 강제
    (보드 전체보기는 직책 전용), duty는 code prefix `duty`.
  - Update: 저장된 kind와 다르면 400 `app.org_role.kind_change_not_allowed.app_error`.

## UserOrgProfile (컬럼 추가)

| 필드 | 타입 | 변경 | 규칙 |
|---|---|---|---|
| primary_position_id | string | 검증 강화 | ''(미지정) 또는 같은 팀·활성·kind='position' 정의 id. 위반 400 |
| primary_duty_id | string | **신규** | ''(미지정) 또는 같은 팀·활성·kind='duty' 정의 id. 위반 400 |
| 기타 | | 없음 | |

- 직위·직책 배정은 상호 독립 — 한쪽 변경이 다른 쪽을 건드리지 않음(FR-003).
- 교차 배정(직위 id를 duty 자리에, 반대 포함)은 400 (FR-004, SC-005).

## UserOrgProfileSummary (필드 추가)

| 필드 | 변경 | 채움 규칙 |
|---|---|---|
| division_name / department_name / position_name | 없음 | 003 규칙 유지 |
| duty_name | **신규** | primary_duty_id 해석(같은 팀 정의 리스트에서). 미지정 → null |

### 표시 매트릭스 (웹앱 조립, 003 확장)

| 배정 상태 | 표시 |
|---|---|
| 본부A>부서B, 직책=팀장, 직위=부장 | "A > B · 팀장 · 부장" |
| 부서B, 직책 없음, 직위=부장 | "B · 부장" (기존 동일) |
| 부서B, 직책=팀장, 직위 없음 | "B · 팀장 · 직위 미지정" |
| 소속·직책·직위 전부 없음 | "부서 미지정 · 직위 미지정" (기존 동일) |

- 직책 세그먼트는 duty_name 있을 때만 삽입 — "직책 미지정" 라벨 없음.
- 계정 설정: 직책 행은 duty_name 있을 때만 렌더, 읽기 전용 + 관리자 관리 안내.

## 마이그레이션 000153

```sql
-- up
ALTER TABLE PositionDefinitions ADD COLUMN IF NOT EXISTS Kind varchar(32) NOT NULL DEFAULT 'position';
ALTER TABLE UserOrgProfiles ADD COLUMN IF NOT EXISTS PrimaryDutyID varchar(26) NOT NULL DEFAULT '';

-- down
ALTER TABLE PositionDefinitions DROP COLUMN IF EXISTS Kind;
ALTER TABLE UserOrgProfiles DROP COLUMN IF EXISTS PrimaryDutyID;
```

- 기존 행: Kind='position', PrimaryDutyID='' — 무손실(SC-002).
- code 유니크 인덱스는 kind 무관 팀 단위 유지 — 동명 직위·직책은 code suffix로
  분리(R3).

## 웹앱 파생 상태

| 항목 | 설명 |
|---|---|
| activePositionRanks | `positions.filter(p => p.active && p.kind !== 'duty')` — 직위 select·리스트용 |
| activeDuties | `positions.filter(p => p.active && p.kind === 'duty')` — 직책 select·리스트용 |
| assignments[userId].primary_duty_id | 배정 편집 상태에 필드 추가 — dirty 판정에 포함 |
| filterDutyId / bulkDutyId | 필터·일괄 지정 상태 추가. 필터는 기존 조건과 AND |

## 감사 로그 (변경 없음)

기존 경로 자동 기록: 직책 CRUD는 position 경로(kind 포함 AfterState), 배정 변경은
user_org_profile.upsert AfterState에 primary_duty_id 추가.
