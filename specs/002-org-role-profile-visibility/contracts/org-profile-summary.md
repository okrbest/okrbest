# Contract: 팀 멤버 부서/직위 요약 조회

**Feature**: [spec.md](../spec.md) | 관련 FR: FR-001, FR-002, FR-002a, FR-003, FR-008, FR-009

## `GET /api/v4/teams/{team_id}/users/{user_id}/org-profile-summary`

같은 팀에 속한 임의의 멤버가, 팀 관리자가 배정한 대상 사용자의 주 부서/주 직위 이름을 조회한다. 기존 관리자 전용 `GET .../org-profile`과 별도의 엔드포인트이며, 이 계약은 오직 조회(읽기)만 다룬다 — 쓰기 계약은 이번 기능 범위 밖(`specs/001-org-role-bulk-assign`의 기존 `PUT .../org-profile` 계약 그대로 유지).

### 경로 파라미터

| 이름 | 타입 | 설명 |
|---|---|---|
| `team_id` | string (26자 ID) | 조회 기준 팀 |
| `user_id` | string (26자 ID) | 조회 대상 사용자 |

### 권한

| 조건 | 결과 |
|---|---|
| `EnableOrgRoleManagement` 기능 플래그 꺼짐 | `501 Not Implemented` — `api.team.org_roles.feature_disabled.app_error` (기존 관리자 API와 동일 오류) |
| 세션이 `team_id`에 대해 `PermissionViewTeam`(팀 멤버 열람 권한) 없음 | `403 Forbidden` |
| `UserCanSeeOtherUser(session, user_id)`가 false(가시성 제한 등 기존 정책) | `403 Forbidden` |
| `user_id`가 `team_id`의 멤버가 아님(대상이 팀 소속 아님) | `404 Not Found` |
| 위 조건 모두 통과 | `200 OK` |

관리자(`PermissionManageTeamRoles`/시스템 콘솔 팀 관리 권한 보유자)는 `PermissionViewTeam`도 함께 만족하므로 이 엔드포인트도 그대로 호출 가능 — 별도 상위 권한 분기 불필요.

### 응답 (200)

```json
{
  "team_id": "<team_id>",
  "user_id": "<user_id>",
  "department_name": "개발팀",
  "position_name": null
}
```

- `department_name`/`position_name`은 각각 주 부서/주 직위가 배정되지 않았거나, 배정된 ID가 더 이상 존재하지 않으면 `null`이다.
- 겸직(`extra_positions`)은 이 응답에 포함하지 않는다(spec Clarifications, 배정 UI 부재로 표시 범위 제외).

### 예시: 미지정

```json
{
  "team_id": "<team_id>",
  "user_id": "<user_id>",
  "department_name": null,
  "position_name": null
}
```

### 오류 응답 형식

기존 Mattermost `model.AppError` JSON 포맷(`id`, `message`, `status_code` 등)을 그대로 따른다. 이 계약에서 신규로 정의하는 오류 `id`는 없다 — 기존 `api.team.org_roles.feature_disabled.app_error`(501), 표준 권한 오류(403), 표준 not-found 오류(404)를 재사용한다.

## 변경하지 않는 기존 계약

- `GET /api/v4/teams/{team_id}/users/{user_id}/org-profile` — 관리자 전용, 응답 필드(`primary_position_id`, `primary_org_unit_id`, `extra_positions` 등 ID 원본) 그대로 유지.
- `PUT /api/v4/teams/{team_id}/users/{user_id}/org-profile` — 배정/수정, 변경 없음.
- `GET /api/v4/teams/{team_id}/org-profiles` — 관리자 전용 팀 전체 목록, 변경 없음.
