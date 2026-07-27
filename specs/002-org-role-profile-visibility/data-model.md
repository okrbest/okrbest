# Data Model: 팀 멤버 프로필 부서/직위 표시 및 계정 설정 직책 관리체계 전환

**Feature**: [spec.md](./spec.md) | **Date**: 2026-07-27

이번 기능은 기존 `org_role` 도메인(`specs/001-org-role-bulk-assign`에서 도입)의 저장 스키마를 변경하지 않는다. DB 마이그레이션은 없다. 아래는 이번 기능이 **조회 목적으로 참조/파생**하는 기존 엔티티와, 조회 응답을 위해 새로 도입하는 파생(비영속) 뷰 모델이다.

## 기존 엔티티 (변경 없음, 참조만)

### PositionDefinition (`server/public/model/org_role.go`)

| 필드 | 타입 | 설명 |
|---|---|---|
| ID | string | 직위 정의 ID |
| TeamID | string | 소속 팀 |
| Code | string | 팀 내 고유 코드 |
| Name | string | 표시용 이름(예: "팀장") — 이번 기능이 조회하는 값 |
| Active | bool | 비활성화된 정의도 이름 조회에는 사용(연구 §2) |

### OrgUnit (`server/public/model/org_role.go`)

| 필드 | 타입 | 설명 |
|---|---|---|
| ID | string | 부서(조직 단위) ID |
| TeamID | string | 소속 팀 |
| Name | string | 표시용 이름(예: "개발팀") — 이번 기능이 조회하는 값 |
| Type | string | `department` \| `team` |
| Active | bool | 비활성화된 정의도 이름 조회에는 사용 |

### UserOrgProfile (`server/public/model/org_role.go`)

| 필드 | 타입 | 설명 |
|---|---|---|
| TeamID | string | 팀 ID (복합키 일부) |
| UserID | string | 사용자 ID (복합키 일부) |
| PrimaryPositionID | string | 주 직위 — 이번 기능이 표시하는 유일한 직위 값(겸직 `ExtraPositions`는 표시 범위 제외, spec Clarifications 참고) |
| PrimaryOrgUnitID | string | 주 부서 |
| ExtraPositions | StringArray | 겸직(현재 배정 UI 없음) — 이번 기능에서 읽지 않음 |

행이 없으면(`sql.ErrNoRows`) `App.GetUserOrgProfile`이 빈 값의 기본 객체를 반환하는 기존 동작(org_role.go:299-318)을 그대로 활용해 "미지정" 판정에 사용한다.

## 신규 파생 뷰 모델 (비영속, API 응답 전용)

### UserOrgProfileSummary

이번 기능이 신규로 정의하는, DB에 저장되지 않는 응답 전용 구조체. `server/public/model/org_role.go`에 추가한다.

| 필드 | 타입 | 설명 | FR 매핑 |
|---|---|---|---|
| TeamID | string | 조회 대상 팀 | — |
| UserID | string | 조회 대상 사용자 | — |
| DepartmentName | *string | 주 부서 이름. 미배정 시 `null` | FR-001, FR-002 |
| PositionName | *string | 주 직위 이름. 미배정 시 `null` | FR-001, FR-002 |

**파생 규칙**:
- `UserOrgProfile.PrimaryOrgUnitID`가 비어있거나, 해당 ID로 `OrgUnit`을 찾을 수 없으면 `DepartmentName = null`.
- `UserOrgProfile.PrimaryPositionID`가 비어있거나, 해당 ID로 `PositionDefinition`을 찾을 수 없으면 `PositionName = null`.
- 이 구조체는 저장되지 않으며, 매 요청마다 `UserOrgProfile` + `ListOrgUnits`/`ListPositionDefinitions`로부터 계산된다(연구 §2).

**표시 변환(클라이언트, 저장하지 않음)**:
- 프로필 카드: `DepartmentName ?? "부서 미지정"` + `" · "` + `PositionName ?? "직위 미지정"` (FR-002a)
- 계정 설정: `DepartmentName`/`PositionName` 각각을 "부서"/"직위" 행의 값으로, `null`이면 "미지정" (FR-002b)

## 상태 전이

없음 — 이번 기능은 읽기 전용 조회만 추가한다. `UserOrgProfile`의 쓰기(배정/변경)는 `specs/001-org-role-bulk-assign`에서 이미 구현된 관리자 전용 경로(`PUT .../org-profile`)를 그대로 사용하며 이번 기능에서 변경하지 않는다(FR-008).

## 검증 규칙

이번 기능은 신규 입력을 받지 않으므로(읽기 전용) 별도의 입력 검증 규칙이 없다. 기존 `UserOrgProfile.IsValid()`(TeamID/UserID가 유효한 ID)는 쓰기 경로에서만 적용되며 변경하지 않는다.
