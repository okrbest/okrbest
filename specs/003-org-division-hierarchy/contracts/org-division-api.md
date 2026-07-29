# API Contract: 본부-부서 계층 (기존 엔드포인트 확장)

신규 엔드포인트 없음. 기존 org-units·org-profile 계약의 값 공간 확장만 기술한다.
라우트 등록: `server/channels/api4/team.go:76-82` (변경 없음).

## GET /api/v4/teams/{team_id}/org-units

- 변경 없음. 응답에 `type: "division"` 항목이 추가로 나타날 수 있다.
- 기존 클라이언트 호환: `type`·`parent_id` 필드는 원래 응답에 있었음 — 값만 확장.

## POST /api/v4/teams/{team_id}/org-units

요청 본문 (기존 OrgUnit JSON):

```json
{
  "name": "경영지원본부",
  "type": "division",          // 신규 허용값. "department"는 기존대로
  "parent_id": ""              // division이면 반드시 ""
}
```

| 케이스 | 응답 |
|---|---|
| division 정상 생성 | 201 + OrgUnit(code는 `div` prefix 자동 생성) |
| department + 유효 parent(같은 팀·활성 division) | 201 |
| department + parent가 타 팀/비활성/division 아님/미존재 | 400 `api.team.org_unit.invalid_parent` |
| type="division" && parent_id != "" | 400 (2단계 초과) |
| type="team" | 400 (신규 생성 차단) |

## PUT /api/v4/teams/{team_id}/org-units/{org_unit_id}

| 케이스 | 응답 |
|---|---|
| division 이름 변경·재활성화 | 200 |
| department의 parent_id 변경(이관) — 유효 division | 200. 소속 사용자 배정 불변 |
| division 비활성화, 활성 하위 부서 존재 | 409 `api.team.org_unit.division_has_children` |
| division 비활성화, 직속 배정 사용자 존재 | 409 `api.team.org_unit.division_has_members` |
| type 변경(department↔division) | 400 |

409 응답 메시지는 "하위 부서/직속 인원을 먼저 이관" 안내 문구를 포함한다
(server/i18n en·ko 동시 등록).

## PUT /api/v4/teams/{team_id}/users/{user_id}/org-profile

- 변경 없음. `primary_org_unit_id`에 활성 division id 허용(기존 활성 검사 로직
  그대로 통과). 비활성 조직 배정 거부는 기존과 동일.

## GET /api/v4/teams/{team_id}/users/{user_id}/org-profile-summary

응답 (필드 추가):

```json
{
  "team_id": "...",
  "user_id": "...",
  "division_name": "경영지원본부",   // 신규. null 가능
  "department_name": "인사팀",       // 기존. 본부 직속이면 null
  "position_name": "팀장"
}
```

- 권한: 기존과 동일(같은 팀 멤버 열람).
- 채움 규칙: [data-model.md](../data-model.md) 표시 매트릭스 참조.

## GET /api/v4/teams/{team_id}/org-profiles

- 변경 없음(배정 리스트). 클라이언트가 org-units 리스트와 조합해 그룹핑·필터.
