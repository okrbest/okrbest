# API Contract: 팀 멤버 직접 등록

**Date**: 2026-10-23 | **Data model**: [../data-model.md](../data-model.md)

## POST /api/v4/teams/{team_id}/members/register

팀 관리자가 멤버 계정을 만들어(또는 기존 계정을 찾아) 팀에 등록한다.
행 단위 graceful 처리 — 일부 행이 실패해도 나머지 행은 처리된다.

### 인증·인가

| 검사 | 실패 응답 | 에러 id |
|---|---|---|
| 세션 필수 (`APISessionRequired`) | 401 | 표준 |
| `TeamSettings.EnableDirectMemberRegistration == true` | 501 | `api.team.register_members.disabled.app_error` |
| `SessionHasPermissionToTeam(team_id, register_team_members)` | 403 | 표준 권한 오류 (`SetPermissionError`) |

### 요청

```json
[
  {"email": "hong@company.co.kr", "name": "홍길동", "password": "Abcd!234"},
  {"email": "kim@company.co.kr",  "name": "김철수", "password": "Qwer!234"}
]
```

| 제약 | 실패 응답 | 에러 id |
|---|---|---|
| 1행 이상 | 400 | `api.team.register_members.no_rows.app_error` |
| 최대 256행 | 400 | `api.team.register_members.too_many_rows.app_error` (params: `{"Max": 256}`) |
| JSON 형식 | 400 | 표준 invalid param |

### 응답 — 201 Created

행별 결과 배열. 요청 행 순서를 유지한다.

```json
[
  {
    "email": "hong@company.co.kr",
    "status": "created_and_added",
    "user_id": "abc123...",
    "member": {"team_id": "...", "user_id": "abc123...", "roles": "team_user"}
  },
  {
    "email": "kim@company.co.kr",
    "status": "existing_added",
    "user_id": "def456...",
    "member": {"team_id": "...", "user_id": "def456...", "roles": "team_user"}
  },
  {
    "email": "lee@company.co.kr",
    "status": "failed",
    "error": {"id": "model.user.is_valid.pwd_min_length.app_error", "message": "..."}
  }
]
```

| status | 뜻 |
|---|---|
| `created_and_added` | 계정을 새로 만들어 팀에 추가했다 |
| `existing_added` | 기존 계정을 팀에 추가만 했다 |
| `already_member` | 이미 팀 멤버라 할 일이 없었다 |
| `failed` | 행 처리 실패 — `error`에 사유 |

### 행별 failed 사유 (대표)

| 경우 | 에러 id |
|---|---|
| 이메일 형식 오류 | `model.user.is_valid.email.app_error` |
| 비밀번호 정책 미달 | `model.user.is_valid.pwd_*.app_error` (기존 조합 id) |
| name 누락 | `api.team.register_members.name_required.app_error` |
| 게스트 계정 이메일 | `api.team.register_members.guest_account.app_error` |
| 도메인 제한 위반 (서버 `RestrictCreationToDomains` 또는 팀 `AllowedDomains`) | `api.user.create_user.accepted_domain.app_error` |
| 사용자 수 한도 초과 | 기존 사용자 한도 에러 id |

### 서버 처리 규칙

- 신규 계정: `EmailVerified=true`, `AuthService=""`(이메일/비밀번호 인증),
  roles는 `system_user`(UserService가 강제). 환영·인증 메일을 보내지 않는다.
- username: 이메일 local-part → `CleanUsername` → 충돌 시 숫자 suffix(D4).
- 보상 처리: 신규 생성 직후 팀 추가가 실패하면 생성 계정을 삭제하고 해당 행을
  `failed`로 보고한다 — 반쪽 상태를 남기지 않는다(FR-003). 기존 계정은 삭제하지
  않는다.
- 감사 기록: `AuditEventRegisterTeamMembers` — team, 행 수, 실패 요약.
  비밀번호는 기록하지 않는다.
- 기존 초대 엔드포인트(`/teams/{id}/members/batch`, `/teams/{id}/invite/email`
  등)는 변경하지 않는다(FR-014).

## 웹앱 계약 (client4)

```ts
// webapp/platform/client/src/client4.ts — Team Routes 섹션
registerTeamMembers(teamId: string, members: MemberRegistration[]): Promise<MemberRegistrationResult[]>
// POST ${getTeamRoute(teamId)}/members/register
```

타입 `MemberRegistration`, `MemberRegistrationResult`는
`webapp/platform/types/src/teams.ts`에 둔다. redux 래퍼는
`mattermost-redux/src/actions/teams.ts`에 `bindClientFunc` 패턴으로 추가한다(D8).
