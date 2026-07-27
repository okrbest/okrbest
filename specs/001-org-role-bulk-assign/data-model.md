# Phase 1 Data Model: 조직/직위 관리 다중 선택 · 일괄 지정 · 일괄 저장

이번 기능은 서버 스키마·모델을 변경하지 않는다. 아래는 spec.md의 Key Entities를 프론트엔드 구현 관점에서 구체화한 것으로, 기존 서버 모델(`server/public/model/org_role.go`)과 컴포넌트 로컬 타입(`org_role_management_body.tsx` 12-78줄)을 그대로 참조/재사용한다.

## 기존 엔티티 (변경 없음, 참조용)

### PositionDefinition (직위)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | string | 직위 식별자 |
| team_id | string | 소속 팀 |
| code | string | 팀 내 유니크 코드 |
| name | string | 표시 이름 |
| rank | number | 정렬/우선순위 |
| active | boolean | 활성 여부 |
| full_visibility | boolean | (기존 기능, 이번 변경과 무관) |

### OrgUnit (부서)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | string | 부서 식별자 |
| team_id | string | 소속 팀 |
| code | string | 팀 내 유니크 코드 |
| name | string | 표시 이름 |
| type | 'department' \| 'team' | 조직 유형 |
| parent_id | string \| null | 상위 조직 |
| active | boolean | 활성 여부 |

### UserOrgProfile (사용자 배정)
| 필드 | 타입 | 설명 |
|---|---|---|
| team_id | string | 팀 |
| user_id | string | 사용자 |
| primary_position_id | string | 주 직위(빈 값 = 미지정) |
| primary_org_unit_id | string | 주 부서(빈 값 = 미지정) |
| extra_positions | string[] | (기존 기능, 이번 변경에서 건드리지 않고 그대로 보존/전달) |
| effective_from / effective_to | number | (기존 기능, 이번 변경에서 건드리지 않고 그대로 보존/전달) |

## 신규 클라이언트 전용 상태 (서버에 저장되지 않는 UI 상태)

이번 기능이 추가하는 것은 서버 엔티티가 아니라, 화면에서만 존재하는 **일시적(ephemeral) UI 상태**다. 컴포넌트 언마운트/새로고침 시 사라지며, 별도 영속화 대상이 아니다.

### SelectionState (선택 상태)
| 필드 | 타입 | 설명 |
|---|---|---|
| selectedUserIds | Set\<string\> | 일괄 작업 대상으로 체크된 사용자 id 집합. 필터/검색 결과와 독립적으로 유지됨(FR-003). 팀 전환/재조회 시 초기화(FR-013). |

### BulkApplyState (일괄 지정 입력값)
| 필드 | 타입 | 설명 |
|---|---|---|
| bulkOrgUnitId | string | 일괄 적용할 부서. 빈 값 = "변경 안 함"(no-op) — 행별 select의 "미지정"과 의미가 다름(FR-015). |
| bulkPositionId | string | 일괄 적용할 직위. 빈 값 = "변경 안 함"(no-op). |

### DirtyState (변경 판정, 파생 값)
`assignments[userId]`(편집 중 값)와 `userProfiles[userId]`(마지막 저장된 값)를 비교해 파생되는 값으로, 별도 state가 아니라 memoized 계산 결과다.

| 항목 | 타입 | 설명 |
|---|---|---|
| dirtyUserIds | Set\<string\> | `primary_position_id` 또는 `primary_org_unit_id`가 저장된 값과 다른 사용자 id 집합. 일괄 저장 대상이자 저장 버튼 활성화 조건(FR-007, FR-009). |

### BulkSaveSummary (저장 결과 요약)
| 필드 | 타입 | 설명 |
|---|---|---|
| successCount | number | 이번 저장 시도에서 성공한 사용자 수 |
| failCount | number | 이번 저장 시도에서 실패한 사용자 수 |

## 상태 전이 (State Transition)

```
[초기 로드]
  loadTeamData() 완료
    → userProfiles = 서버 값, assignments = userProfiles 복제, selectedUserIds = ∅, dirtyUserIds = ∅

[체크박스 선택/해제] (사용자 조작)
  selectedUserIds에 추가/제거 — 필터와 무관, assignments/dirtyUserIds에는 영향 없음

[선택 적용] (bulkOrgUnitId/bulkPositionId 중 하나 이상 설정 + selectedUserIds ≠ ∅)
  selectedUserIds의 각 사용자 assignments를, 설정된 필드만 덮어써 갱신
    → dirtyUserIds가 파생 재계산됨 (해당 사용자들이 새로 dirty가 되거나 이미 dirty였을 수 있음)
  네트워크 호출 없음

[저장] (dirtyUserIds ≠ ∅)
  dirtyUserIds를 순서대로 순회하며 PUT 호출
    성공: userProfiles[userId] ← 응답 값 (dirtyUserIds에서 자동으로 제외됨, 파생 재계산)
    실패: userProfiles[userId] 변경 없음 (계속 dirty로 남아 재시도 가능)
  종료 후 bulkSaveSummary = {successCount, failCount} 설정

[팀 전환 / 데이터 재조회]
  selectedUserIds = ∅, bulkOrgUnitId = '', bulkPositionId = '', bulkSaveSummary = null로 초기화 후 loadTeamData() 재실행
```
