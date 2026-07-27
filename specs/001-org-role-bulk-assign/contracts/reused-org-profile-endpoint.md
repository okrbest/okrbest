# Contract: 기존 엔드포인트 재사용 (신규 서버 계약 없음)

이번 기능은 **새로운 API 계약을 만들지 않는다**. 기존에 존재하는 아래 단건 엔드포인트를, 일괄 저장 시 Dirty 사용자 수만큼 **순차적으로 반복 호출**하는 방식으로 재사용한다. 서버 라우팅·핸들러·권한 검증·요청/응답 스키마는 변경되지 않는다.

## 재사용 엔드포인트

`PUT /api/v4/teams/{team_id}/users/{user_id}/org-profile`

- 구현 위치(변경 없음): `server/channels/api4/team.go`(라우트/핸들러 `updateUserOrgProfile`), `server/channels/app/org_role.go`(`UpsertUserOrgProfile`), `server/channels/store/sqlstore/org_role_store.go`(단건 upsert).
- 권한 게이트(변경 없음): `requireOrgRoleWrite` — `PermissionSysconsoleWriteUserManagementTeams` 또는 `PermissionManageTeamRoles`.
- 요청 본문: 클라이언트가 보관 중인 `UserOrgProfile` 전체 객체(`extra_positions`/`effective_from`/`effective_to` 등 기존 값 포함)에서 `primary_position_id`/`primary_org_unit_id`만 새 값으로 교체해 전송 — 기존 `saveUserAssignment` 로직과 동일한 병합 방식을 그대로 재사용(`putUserOrgProfile` 공용 헬퍼로 추출).
- 응답: 서버가 저장 후 echo하는 `UserOrgProfile` — 응답으로 클라이언트 `userProfiles[userId]`를 갱신한다.
- `team_id`/`user_id`는 서버가 URL 파라미터 기준으로 강제 덮어쓰므로, 요청 본문의 해당 필드 값은 무시된다(기존 동작).

## 호출 방식 (클라이언트 측, 신규)

- 다중 사용자 저장 시, `dirtyUserIds`를 순서대로(순차, 병렬 아님) 순회하며 위 엔드포인트를 1회씩 호출한다.
- 각 호출은 독립적으로 성공/실패를 판정하며, 실패해도 다음 사용자 호출은 계속 진행한다(`Promise.allSettled` 의미론을 순차 루프 + 개별 try/catch로 구현).
- 신규 서버 배치 엔드포인트(예: `POST /teams/{team_id}/org-profiles/batch`)는 이번 범위에 포함하지 않는다 — 향후 대규모 팀 성능 이슈가 확인되면 별도 스펙으로 분리한다(spec.md Assumptions 참조).

## 변경되지 않는 관련 엔드포인트 (참조용, 이번 기능이 호출만 하고 계약은 그대로)

- `GET /api/v4/teams/{team_id}/positions?include_inactive=true`
- `GET /api/v4/teams/{team_id}/org-units?include_inactive=true`
- `GET /api/v4/users?in_team={team_id}&page=0&per_page=200`
- `GET /api/v4/teams/{team_id}/org-profiles`

이상 4개 GET은 기존 `loadTeamData()`가 이미 사용 중이며, 이번 기능에서 추가 호출 패턴 변경 없음.
