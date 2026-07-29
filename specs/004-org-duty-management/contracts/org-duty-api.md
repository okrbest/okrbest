# API Contract: 직책 관리 (기존 엔드포인트 확장)

신규 엔드포인트 0. 기존 positions·org-profile 계약의 필드 확장만 기술.
라우트 등록 변경 없음 (`server/channels/api4/team.go`).

## GET /api/v4/teams/{team_id}/positions

- 응답 항목에 `kind` 필드 추가 (`"position"` | `"duty"`). 기존 클라이언트는 미지의
  필드 무시 — 호환.

## POST /api/v4/teams/{team_id}/positions

```json
{
  "name": "팀장",
  "rank": 1,
  "kind": "duty"              // 신규. 생략/빈 값 = "position" (기존 호환)
}
```

| 케이스 | 응답 |
|---|---|
| kind="duty" 정상 생성 | 201 + code는 `duty` prefix, full_visibility 요청값 유지(보드 전체보기는 직책에서 관리) |
| kind 생략 | 201 + kind="position" (기존 동작 불변) |
| kind에 그 외 값 | 400 |
| position + full_visibility=true 요청 | 201이되 full_visibility=false로 정규화(보드 전체보기는 직책 전용) |

## PUT /api/v4/teams/{team_id}/positions/{position_id}

| 케이스 | 응답 |
|---|---|
| 직책 이름·rank·active 수정 | 200 |
| kind 변경(직위↔직책 전환) | 400 `app.org_role.kind_change_not_allowed.app_error` |

## PUT /api/v4/teams/{team_id}/users/{user_id}/org-profile

```json
{
  "primary_position_id": "...",   // 기존 — 검증 강화: 활성 kind='position'만
  "primary_duty_id": "...",       // 신규 — ''(해제) 또는 활성 kind='duty'
  "primary_org_unit_id": "..."
}
```

| 케이스 | 응답 |
|---|---|
| 직위+직책 동시 배정 | 200 — 상호 독립 저장 |
| duty 자리에 position id (또는 반대) | 400 `app.org_role.invalid_duty_assignment.app_error` / `invalid_position_assignment` |
| 비활성 직책 배정 | 400 |
| primary_duty_id 생략 | 기존 값... **아님** — 전체 객체 계약(기존과 동일): 생략은 ''로 해제됨. 클라이언트는 전체 객체 전송 |

## GET /api/v4/teams/{team_id}/users/{user_id}/org-profile-summary

```json
{
  "team_id": "...",
  "user_id": "...",
  "division_name": "경영지원본부",
  "department_name": "인사팀",
  "duty_name": "팀장",            // 신규. null 가능
  "position_name": "부장"
}
```

- 권한·채움 규칙: [data-model.md](../data-model.md) 표시 매트릭스.

## GET /api/v4/teams/{team_id}/org-profiles

- 응답 항목에 `primary_duty_id` 포함(모델 직렬화 자동). 클라이언트 그룹핑·필터는
  로컬 처리.
