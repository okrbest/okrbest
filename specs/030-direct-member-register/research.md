# Phase 0 조사: 팀 멤버 직접 등록

**Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

코드베이스 패턴 조사(서버·웹앱 병렬 탐색) 결과를 결정 단위로 정리한다.
모든 NEEDS CLARIFICATION은 해소되었다.

## D1. 서버 설정 추가 방식

- **Decision**: `TeamSettings`에 `EnableDirectMemberRegistration *bool`을 추가한다.
  기본값 `false`, access 태그는 기존 유효 태그인 `authentication_signup`을 쓴다.
  로그인 사용자용 client config(`GenerateClientConfig`)에만 노출하고, 비로그인
  limited config에는 노출하지 않는다.
- **Rationale**: `EnableUserCreation`·`EnableOpenServer`가 같은 자리에 같은
  방식으로 정의되어 있다(`server/public/model/config.go:2619-2738`). access
  태그는 `TestConfigAccessTagsMapToValidPermissions`(config_test.go:4950)가
  검증하므로 기존 태그만 쓸 수 있다. 직접 등록 UI는 로그인한 팀 관리자에게만
  보이므로 limited config 노출이 필요 없다.
- **함께 고칠 파일**: `server/config/client.go`(GenerateClientConfig),
  `server/tests/test-config.json`,
  `server/channels/app/platform/testdata/support_packet/sanitized_config.json`,
  `webapp/platform/types/src/config.ts`(`TeamSettings`와 `ClientConfig` 두 곳).
- **Alternatives considered**: `ServiceSettings` 배치 — 팀 가입 통제라는 의미상
  `TeamSettings`(EnableUserCreation·EnableOpenServer와 동류)가 맞아 기각.
  feature flag — 운영자가 서버별로 끄고 켜는 영구 설정이므로 config가 맞다.

## D2. 권한 모델

- **Decision**: 팀 범위 권한 `register_team_members`
  (`PermissionRegisterTeamMembers`, `PermissionScopeTeam`)를 신설하고
  `team_admin` 역할에 기본 부여한다. 기존 설치본 반영은
  `permissions_migrations.go`에 마이그레이션을 추가한다
  (`On: permissionOr(isRole(team_admin), isRole(system_admin))`,
  `Add: [register_team_members]`). 마이그레이션 키는
  `server/public/model/migration.go`에 상수로 둔다.
- **Rationale**: 최근 선례 `getAddTeamAccessRulesPermissionMigration`
  (permissions_migrations.go:1249-1261)이 같은 구조다. `isRole`은 팀 스킴
  역할에도 매칭되므로 커스텀 스킴 팀의 팀 관리자도 함께 받는다. system_admin은
  `AllPermissions` 전체를 받으므로 별도 처리가 필요 없다.
- **함께 고칠 파일**: `permission.go`(정의 + `TeamScopedPermissions`),
  `role.go`(team_admin), `migration.go`(키), `permissions_migrations.go`(등록),
  테스트 4곳(`app_test.go`의 역할별 기대 권한, `testlib/store.go:97` mock,
  `permissions_migrations_test.go`, `role_test.go`),
  웹앱 `mattermost-redux/src/constants/permissions.ts`.
- **Alternatives considered**: 기존 `add_user_to_team` 재사용 — 그 권한은
  team_user 전원이 갖고 있어 계정 생성까지 허용하면 통제 목적이 무너진다.
  시스템 권한 스코프 — 팀 관리자에게 팀 범위로 줘야 하므로 기각.

## D3. 서버 API 설계

- **Decision**: 엔드포인트 하나를 신설한다 —
  `POST /api/v4/teams/{team_id}/members/register`. 요청 본문은 행 배열
  `[{email, name, password}]`(상한 256행, `MaxAddMembersBatch`와 동일), 응답은
  행별 결과 배열(graceful 방식, HTTP 201)이다. 한 명 등록은 행 1개짜리 같은
  호출이다. 핸들러 순서: 설정 검사 → `SessionHasPermissionToTeam(...,
  PermissionRegisterTeamMembers)` → 행별 처리. 행별 처리는 app 계층 신규 함수
  `RegisterTeamMembers`가 맡는다: 이메일·비밀번호 정책 검증 →
  `GetUserByEmail`로 분기(게스트면 오류, 이미 팀 멤버면 `already_member`,
  기존 계정이면 팀 추가만) → 신규면 username 자동 생성 후 `CreateUser`
  (EmailVerified=true, AuthService 빈 값) → `JoinUserToTeam`. 행 단위 독립
  처리이고 한 행의 실패가 다른 행을 되돌리지 않는다.
- **Rationale**: `addTeamMembers`(api4/team.go:1139-1277)의 graceful 패턴
  (`TeamMemberWithError`)과 `CreateUserWithInviteId`(app/user.go:227)의 가입
  흐름이 직접적인 선례다. `CreateUserAsAdmin`은 설정 검사를 건너뛰므로 재사용하지
  않고, 신규 함수에서 `EnableDirectMemberRegistration`을 명시적으로 검사한다.
  사용자 한도·도메인 제한(`RestrictCreationToDomains`)·비밀번호 정책·중복 검사는
  `CreateUser` 경유로 자동 적용되고, 팀 `AllowedDomains` 검사는
  `CreateUserWithInviteId`처럼 `users.CheckUserDomain`을 직접 호출한다.
- **Alternatives considered**: 기존 `POST /users` 확장 — 비세션 핸들러에 팀
  관리자 분기를 섞으면 보안 경계가 흐려져 기각. 행마다 별도 요청 — 100행이면
  요청 100번이라 감사 기록과 결과 집계가 조각나 기각.

## D4. username·이메일 인증 처리

- **Decision**: username은 이메일 local-part에 `model.CleanUsername`을 적용해
  만들고, 충돌 시 숫자 suffix를 붙여 재시도한다(최대 10회, 이후 `NewId()[0:8]`
  suffix). 생성 계정은 `EmailVerified=true`로 두고 환영 메일을 보내지 않는다.
- **Rationale**: 같은 자동 생성 선례가 둘 있다 — guest magic link
  (app/user.go:185-203)와 `CreateOAuthUser`(:471-478,
  `userService.IsUsernameTaken` + 숫자 suffix). 관리자가 신원을 확인하고 만드는
  계정이므로 이메일 인증을 다시 요구할 이유가 없고(spec Assumptions), 임시
  비밀번호는 시스템 밖에서 전달하므로 메일 발송도 하지 않는다.
- **Alternatives considered**: username을 CSV 입력으로 받기 — spec이 항목을
  이메일·이름·임시 비밀번호로 확정해 기각.

## D5. 감사 기록

- **Decision**: `audit_events.go`에 `AuditEventRegisterTeamMembers`를 추가하고,
  핸들러에서 `MakeAuditRecord` + `AddEventParameterAuditableToAuditRec`(team),
  행별 결과 요약(`AddMeta("count")`, `AddMeta("errors")`)을 남긴다. 임시
  비밀번호는 감사 기록에 싣지 않는다.
- **Rationale**: `addTeamMembers`(team.go:1164-1180)와 `createUser`
  (user.go:251-296)의 감사 패턴 결합이다. FR-013을 충족한다.

## D6. CSV 처리 위치와 방식

- **Decision**: CSV는 웹앱(클라이언트)에서 파싱한다. 외부 라이브러리 없이 소형
  파서 유틸을 새로 작성한다 — UTF-8 BOM 수용, 따옴표 필드, 헤더 행 인식. 파싱
  결과로 행별 사전 검증(이메일 형식, 필수 값, 비밀번호 정책, 파일 내 중복)을
  수행해 미리보기를 그리고, 등록 실행 시 검증 통과 행만 신규 엔드포인트로
  보낸다. 결과 CSV도 클라이언트에서 Blob으로 생성해 내려받게 한다.
- **Rationale**: 웹앱에 CSV 파싱 선례와 라이브러리가 없음을 확인했다. 필요한
  문법이 3열 고정이라 소형 파서로 충분하고, 의존성 추가를 피하면 원칙 II의
  lockfile 변경도 없다. 비밀번호 사전 검증은 기존
  `utils/password.tsx`의 `isValidPassword` + `getPasswordConfig`를 재사용한다.
  서버가 최종 검증자이므로 클라이언트 검증은 UX용이다.
- **Alternatives considered**: papaparse 도입 — 3열 템플릿에 과하고 의존성이
  늘어 기각. 서버 CSV 업로드 — 파일 전송·임시 저장·인코딩 처리가 서버에 생기고
  미리보기 왕복이 필요해져 기각. 파일 선택 UI는
  `admin_console/file_upload_setting.tsx`의 숨긴 input 패턴을 참고한다.

## D7. 초대 모달 통합 방식

- **Decision**: `invitation_modal.tsx`의 `View` enum에 의존하지 않고, INVITE
  뷰 상단에 "초대 보내기 / 직접 등록" 방식 선택(기존 `RadioGroup` 재사용)을
  추가한다. "직접 등록" 선택 시 신규 `DirectRegisterView`(한 명 등록 / CSV 일괄
  등록 두 탭, 기존 `components/tabs` 래퍼 사용)를 그린다. 결과 화면은 기존
  `ResultView`/`result_table`을 재사용하되 직접 등록용 헤더 문구 분기를
  추가하고, 결과 CSV 내려받기 버튼을 덧붙인다. 노출 조건은
  `ClientConfig.EnableDirectMemberRegistration === 'true'` &&
  `haveICurrentTeamPermission(state, Permissions.REGISTER_TEAM_MEMBERS)`로
  `index.tsx`의 `mapStateToProps`에서 계산한다. 입력 중 모달 배경 클릭 방지는
  기존 `getBackdrop()` 로직에 직접 등록 입력 상태를 포함시킨다.
- **Rationale**: `invite_as.tsx`가 이미 RadioGroup으로 member/guest를 고르는
  구조라 같은 문법의 방식 선택이 자연스럽다. 액션을
  `ActionFuncAsync<InviteResults>` 형태(신규 `registerMembersDirectly`)로
  만들면 `sendMembersInvites`와 같은 반환 모양이 되어 결과 화면을 그대로 쓸 수
  있다. 브레인스토밍에서 사용자가 "초대 모달 통합" 시안을 확정했다.
- **Alternatives considered**: `View.DIRECT_REGISTER` 신설 — 결과/재시도 전환
  로직을 중복 구현하게 되어 기각. 별도 모달 — 사용자가 통합안을 선택해 기각.

## D8. client4·redux 계층

- **Decision**: `client4.ts`의 Team Routes 섹션
  (`sendEmailInvitesToTeamGracefully` 근처)에
  `registerTeamMembers(teamId, members)`를 추가한다. 요청·응답 타입은
  `webapp/platform/types/src/teams.ts`에 둔다. redux 래퍼는
  `mattermost-redux/src/actions/teams.ts`에 `bindClientFunc` 패턴으로 추가하고,
  UI 액션 `registerMembersDirectly`는 `channels/src/actions/invite_actions.ts`에
  둔다.
- **Rationale**: `addUsersToTeamGracefully`·`sendEmailInvitesToTeamGracefully`가
  정확히 같은 계층 구조를 쓴다.

## D9. 시스템 콘솔 설정 UI

- **Decision**: `admin_definition.tsx`의 Authentication > Signup 섹션
  (`SignupSettings`, EnableUserCreation·EnableOpenServer 옆)에 bool 항목
  `TeamSettings.EnableDirectMemberRegistration`을 추가한다. 라벨·도움말 키는
  `admin.team.directMemberRegistrationTitle`/`...Description`.
- **Rationale**: 가입 통제 설정들이 모여 있는 자리라 운영자가 찾기 쉽다.
  `isDisabled: it.not(it.userHasWritePermissionOnResource(...AUTHENTICATION.SIGNUP))`
  패턴을 그대로 쓴다.

## D10. i18n 키 설계

- **Decision**:
  - 서버: `api.team.register_members.*` (설정 꺼짐, 권한 없음, 행 상한 초과,
    게스트 계정 등 AppError 메시지)를 `server/i18n/en.json`·`ko.json`에 동시
    추가한다.
  - 웹앱: UI 라벨은 `invite_modal.direct_register.*`, 행별 결과 사유는
    `invite.members.*` 네임스페이스를 따른다. `en.json`은
    `npm run i18n-extract`로 생성·검증하고 `ko.json`은 같은 변경에서 수동
    추가한다.
- **Rationale**: 기존 네임스페이스 관례(웹앱 조사 §7)와 원칙 V(en/ko 동시
  갱신, 한국어 1급 로케일)를 따른다.

## D11. 테스트 전략

- **Decision**:
  - 서버: `api4/team_test.go`에 엔드포인트 테스트(설정 꺼짐 403, 권한 없음 403,
    행별 graceful 결과, 기존 계정 분기), app 계층 함수 테스트, 권한
    마이그레이션 테스트(`permissions_migrations_test.go`, `app_test.go` 기대
    목록 갱신). gotestsum으로 실행.
  - 웹앱: CSV 파서 유틸 단위 테스트, `invite_actions.test.ts`에
    `registerMembersDirectly` 테스트(mockStore + jest.mock 패턴),
    `DirectRegisterView` 컴포넌트 테스트(renderWithContext), `index.test.tsx`에
    mapStateToProps 노출 조건 테스트.
  - 원칙 III에 따라 각 테스트는 구현 전 실패 출력을 남긴다.
- **Rationale**: 기존 테스트 배치 관례(컴포넌트 옆 `*.test.tsx`, colocated
  `_test.go`)를 그대로 따른다.
