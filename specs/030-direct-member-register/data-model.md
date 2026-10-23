# Data Model: 팀 멤버 직접 등록

**Date**: 2026-10-23 | **Plan**: [plan.md](plan.md)

DB 스키마 변경은 없다. 기존 Users·TeamMembers 테이블을 그대로 쓰고, 아래는
요청·응답 모델과 설정·권한 항목이다.

## 요청 모델

### MemberRegistration (등록 요청 행)

서버 요청 본문의 행 하나. `server/public/model/team_member.go`에 둔다.

| 필드 | 타입 | 제약 | 비고 |
|---|---|---|---|
| `email` | string | 필수, `IsValidEmail`, 소문자 정규화(`NormalizeEmail`) | 로그인 아이디 |
| `name` | string | 필수, 공백 제거 후 1자 이상, 표시 이름 상한(64자) | 표시 이름. 저장은 `User.FirstName`에 넣고 `LastName`은 비운다 — 입력한 그대로 보이게 하는 가장 단순한 배치(설계 결정) |
| `password` | string | 필수, 서버 비밀번호 정책(`IsPasswordValidWithSettings`) | 임시 비밀번호. 로그·감사 기록에 싣지 않는다 |

- 요청 단위 제약: 1행 이상, 최대 256행(`MaxAddMembersBatch`). 초과 시 요청
  전체를 거부한다(FR-015).
- 파생 값: `username` = 이메일 local-part에 `CleanUsername` 적용, 충돌 시 숫자
  suffix 재시도(D4). 요청에는 포함되지 않는다.

## 응답 모델

### MemberRegistrationResult (행별 결과)

행 단위 graceful 결과. `TeamMemberWithError`(team_member.go:65)와 같은 계열로
정의한다.

| 필드 | 타입 | 비고 |
|---|---|---|
| `email` | string | 요청 행 식별자 |
| `status` | string (enum) | 아래 상태 참조 |
| `member` | *TeamMember | 성공 시 팀 멤버십 |
| `user_id` | string | 성공 시 계정 id |
| `error` | *AppError | `status == "failed"`일 때 사유 |

### 상태 전이

```text
요청 행
 ├─ 검증 실패(이메일 형식·비밀번호 정책·name 누락) ──────────→ failed
 ├─ GetUserByEmail: 없음 → CreateUser + JoinUserToTeam ──────→ created_and_added
 ├─ GetUserByEmail: 게스트 계정 ─────────────────────────────→ failed (guest)
 ├─ GetUserByEmail: 있음 + 팀 멤버 아님 → JoinUserToTeam ────→ existing_added
 └─ GetUserByEmail: 있음 + 이미 팀 멤버 ─────────────────────→ already_member
```

- `created_and_added` / `existing_added` / `already_member`는 성공으로
  집계하고, `already_member`는 "할 일 없음"으로 구분 표시한다(FR-010).
- `failed`는 행 단위로만 실패하며 다른 행에 영향을 주지 않는다(FR-009).
- 신규 계정 생성 직후 팀 추가가 실패하면 **보상 처리로 생성 계정을 삭제**하고
  그 행을 `failed`로 보고한다. 반쪽 상태(계정만 생성되고 팀 미소속)를 남기지
  않아 FR-003을 지킨다. 기존 계정(`existing_added` 경로)은 삭제 대상이 아니다.

## 웹앱 모델

### CSV 행 (클라이언트 전용)

열 순서 고정: `이메일, 이름, 임시비밀번호` (헤더 행 포함 템플릿 제공).
파싱 결과 타입(utils/csv.ts):

| 필드 | 비고 |
|---|---|
| `lineNumber` | 원본 행 번호 (오류 안내용) |
| `email`, `name`, `password` | 열 값 |
| `validationError` | 사전 검증 실패 사유 (이메일 형식, 필수 값, 비밀번호 정책 `isValidPassword`, 파일 내 중복) |

- 사전 검증을 통과한 행만 서버로 보낸다. 서버가 최종 검증자다(D6).
- 결과 CSV 열: `이메일, 이름, 임시비밀번호, 결과, 사유`. 클라이언트에서 Blob으로
  생성한다(FR-011).

### InviteResults 재사용

`registerMembersDirectly` 액션은 기존 `InviteResults{sent, notSent}` 형태로
변환해 반환한다(D7). `sent`에는 `created_and_added`·`existing_added`·
`already_member`를 상태별 사유 문구와 함께 넣고, `notSent`에는 `failed`를 넣는다.

## 설정·권한 항목

| 항목 | 위치 | 값 |
|---|---|---|
| `TeamSettings.EnableDirectMemberRegistration` | server config (D1) | `*bool`, 기본 `false`, access 태그 `authentication_signup` |
| `ClientConfig.EnableDirectMemberRegistration` | client config (D1) | `'true'`/`'false'` 문자열, 로그인 사용자용 config에만 노출 |
| `register_team_members` | 팀 범위 권한 (D2) | team_admin 기본 부여, 권한 마이그레이션으로 기존 설치본 반영 |
| `AuditEventRegisterTeamMembers` | 감사 이벤트 (D5) | 행 수·실패 요약 메타 포함, 비밀번호 제외 |
