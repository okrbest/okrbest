# Tasks: 팀 멤버 직접 등록

**Input**: Design documents from `/specs/030-direct-member-register/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/register-members-api.md

**Tests**: 포함한다 — constitution 원칙 III이 요구한다. 테스트 과제는 **구현 전
실패 출력**을 남긴 뒤에만 완료로 표시한다. 첫 실행부터 통과하면 구현을 되돌려
실패를 확인하거나 과제 옆에 `미검증`으로 적는다.

**Organization**: user story 단위로 묶어 각 스토리를 독립적으로 구현·검증한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(다른 파일, 미완료 과제에 의존하지 않음)
- **[Story]**: 소속 user story (US1, US2, US3)

## Path Conventions

plan.md의 모노레포 구조를 따른다: `server/`(Go), `webapp/`(React + TS).

---

## Phase 1: Setup (기준선 확보)

**Purpose**: 원칙 I의 회귀 판정에 쓸 기준선을 구현 시작 전에 저장한다.

- [ ] T001 [P] server 게이트 기준선 저장 — `cd server && make check-style; make test-server` 실행 결과의 실패 목록을 `specs/030-direct-member-register/baseline-server.txt`로 저장
- [ ] T002 [P] webapp 게이트 기준선 저장 — `cd webapp && npm run check; npm run check-types; npm run test` 실행 결과의 실패 목록을 `specs/030-direct-member-register/baseline-webapp.txt`로 저장

**Checkpoint**: 기준선 2개 파일 존재. 이후 모든 게이트 판정은 이 목록과의 diff로 한다.

---

## Phase 2: Foundational (설정·권한 기반)

**Purpose**: 모든 user story가 의존하는 서버 설정과 권한을 만든다. US1~US3 어느
것도 이 phase 완료 전에는 시작할 수 없다.

### 서버 설정 (D1)

- [ ] T003 `server/public/model/config.go`의 `TeamSettings`에 `EnableDirectMemberRegistration *bool` 추가(access 태그 `authentication_signup`) + `SetDefaults`에 기본값 `false` 추가
- [ ] T004 `server/config/client.go`의 `GenerateClientConfig`에 `EnableDirectMemberRegistration` 노출 추가 (limited config에는 추가하지 않음)
- [ ] T005 [P] `server/tests/test-config.json`과 `server/channels/app/platform/testdata/support_packet/sanitized_config.json`에 새 설정 항목 반영
- [ ] T006 [P] `webapp/platform/types/src/config.ts`의 `TeamSettings`(boolean)와 `ClientConfig`(문자열) 두 곳에 `EnableDirectMemberRegistration` 타입 추가

### 권한 (D2) — 실패 테스트 먼저

- [ ] T007 권한 기대 테스트 선행 갱신 — `server/channels/app/app_test.go`의 `TestDoAdvancedPermissionsMigration` team_admin 기대 목록과 `server/public/model/role_test.go`에 `register_team_members`를 추가하고, **실패 출력을 저장**
- [ ] T008 `server/public/model/permission.go`에 `PermissionRegisterTeamMembers`("register_team_members", `PermissionScopeTeam`) 정의 + `TeamScopedPermissions`에 추가, `server/public/model/role.go`의 team_admin 기본 권한에 추가
- [ ] T009 권한 마이그레이션 — `server/public/model/migration.go`에 키 상수 추가, `server/channels/app/permissions_migrations.go`에 `getAddTeamAccessRulesPermissionMigration`(:1249) 패턴으로 마이그레이션 추가·등록, `server/channels/testlib/store.go:97` 근처에 mock 추가, `server/channels/app/permissions_migrations_test.go` 갱신 → T007 테스트 통과 확인
- [ ] T010 [P] `webapp/channels/src/packages/mattermost-redux/src/constants/permissions.ts`에 `REGISTER_TEAM_MEMBERS` 상수 추가

**Checkpoint**: 설정·권한 존재. `make test-server` 권한 관련 테스트 통과(T007의 실패 → 통과 전환 기록).

---

## Phase 3: User Story 1 - 입사자 한 명을 직접 등록한다 (Priority: P1) 🎯 MVP

**Goal**: 팀 관리자가 초대 모달의 "직접 등록"에서 이메일·이름·임시 비밀번호로
계정을 만들어 팀에 바로 추가하고, 멤버는 그 정보로 로그인한다.

**Independent Test**: quickstart.md 시나리오 1 — 등록 → 결과 확인 → 해당
이메일+임시 비밀번호로 로그인 → 팀 채널 도달.

### 서버 — 실패 테스트 먼저

- [ ] T011 [P] [US1] `server/public/model/team_member.go`에 `MemberRegistration`(email·name·password)과 `MemberRegistrationResult`(email·status·user_id·member·error) 타입 추가, `server/public/model/audit_events.go`에 `AuditEventRegisterTeamMembers` 추가 (data-model.md 참조)
- [ ] T012 [US1] app 계층 테스트 선행 — `server/channels/app/team_test.go`에 `RegisterTeamMembers` 테스트 작성(신규 생성, 기존 계정 팀 추가, 이미 멤버, 게스트 거부, 비밀번호 정책 미달, username 충돌 suffix, 행 단위 독립 처리, 팀 추가 실패 시 생성 계정이 남지 않는 보상 처리), **실패 출력을 저장**
- [ ] T013 [US1] `server/channels/app/team.go`에 `RegisterTeamMembers(rctx, teamID, requestorId, rows)` 구현 — 행별로: 입력 검증 → `GetUserByEmail` 분기 → 신규면 username 자동 생성(`CleanUsername` + suffix, app/user.go:185-203 패턴) 후 `CreateUser`(EmailVerified=true, 메일 발송 없음) → `JoinUserToTeam`; 신규 생성 직후 팀 추가가 실패하면 생성 계정을 삭제(보상 처리)해 반쪽 상태를 남기지 않고 failed로 보고(FR-003); 팀 `AllowedDomains`는 `users.CheckUserDomain`으로 검사 (research.md D3·D4) → T012 통과 확인
- [ ] T014 [US1] api4 테스트 선행 — `server/channels/api4/team_test.go`에 엔드포인트 테스트 작성(설정 꺼짐 501, 일반 멤버 403, 팀 관리자 201 + 행별 결과, 0행 400, 257행 400), **실패 출력을 저장**
- [ ] T015 [US1] `server/channels/api4/team.go`에 `POST /teams/{team_id}/members/register` 라우트와 핸들러 구현 — 설정 검사 → `PermissionRegisterTeamMembers` 검사 → `RegisterTeamMembers` 호출 → 감사 기록(`AuditEventRegisterTeamMembers`, 비밀번호 제외) → 201 응답 (contracts/register-members-api.md) → T014 통과 확인
- [ ] T016 [P] [US1] 서버 i18n — `server/i18n/en.json`·`ko.json`에 `api.team.register_members.*` 키(disabled, no_rows, too_many_rows, name_required, guest_account) 동시 추가 (D10)

### 웹앱 — 실패 테스트 먼저

- [ ] T017 [P] [US1] `webapp/platform/types/src/teams.ts`에 `MemberRegistration`·`MemberRegistrationResult` 타입 추가, `webapp/platform/client/src/client4.ts` Team Routes 섹션(:1688 근처)에 `registerTeamMembers(teamId, members)` 추가 (D8)
- [ ] T018 [US1] `webapp/channels/src/packages/mattermost-redux/src/actions/teams.ts`에 `registerTeamMembers` 래퍼를 `bindClientFunc` 패턴으로 추가
- [ ] T019 [US1] 액션 테스트 선행 — `webapp/channels/src/actions/invite_actions.test.ts`에 `registerMembersDirectly` 테스트 작성(상태별 sent/notSent 매핑, 서버 오류 처리; mockStore + jest.mock 패턴), **실패 출력을 저장**
- [ ] T020 [US1] `webapp/channels/src/actions/invite_actions.ts`에 `registerMembersDirectly(teamId, rows)` 구현 — `registerTeamMembers` 호출 결과를 `InviteResults{sent, notSent}`로 변환(created_and_added·existing_added·already_member → sent, failed → notSent) → T019 통과 확인
- [ ] T021 [US1] 컴포넌트 테스트 선행 — `webapp/channels/src/components/invitation_modal/direct_register_view.test.tsx`(한 명 등록 폼: 입력·자동 생성·제출)와 `index.test.tsx`(mapStateToProps: 설정 꺼짐/권한 없음이면 비노출) 작성, **실패 출력을 저장**
- [ ] T022 [US1] `webapp/channels/src/components/invitation_modal/direct_register_view.tsx` 신규 작성 — 한 명 등록 폼(이메일·이름·임시 비밀번호 + 자동 생성 버튼; 비밀번호 사전 검증은 `utils/password.tsx`의 `isValidPassword` + `getPasswordConfig`; 자동 생성은 `getPasswordConfig`의 최소 길이와 요구 문자군을 모두 충족하는 난수 비밀번호를 만든다) (D7)
- [ ] T023 [US1] `invitation_modal.tsx`에 방식 선택(초대 보내기/직접 등록, 기존 `RadioGroup` 재사용) 통합 + `getBackdrop()`에 직접 등록 입력 상태 반영, `index.tsx` `mapStateToProps`에 노출 조건(`EnableDirectMemberRegistration === 'true'` && `haveICurrentTeamPermission(REGISTER_TEAM_MEMBERS)`) 추가, `result_view.tsx`에 직접 등록용 헤더 문구 분기 → T021 통과 확인
- [ ] T024 [US1] 웹앱 i18n — `npm run i18n-extract`로 `en.json` 갱신 + `webapp/channels/src/i18n/ko.json`에 `invite_modal.direct_register.*`·`invite.members.*` 신규 키 동시 추가 (원칙 V)

**Checkpoint**: quickstart.md 시나리오 1을 실주행으로 통과 — US1 단독으로 MVP.

---

## Phase 4: User Story 2 - CSV로 팀 멤버를 일괄 등록한다 (Priority: P2)

**Goal**: CSV 템플릿 작성 → 업로드 → 행별 검증 미리보기 → 통과 행만 등록 →
결과 CSV(임시 비밀번호 포함) 내려받기.

**Independent Test**: quickstart.md 시나리오 2 — 정상·오류 행이 섞인 CSV로
미리보기·부분 등록·결과 CSV를 확인.

- [ ] T025 [US2] CSV 파서 테스트 선행 — `webapp/channels/src/utils/csv.test.ts` 작성(UTF-8 BOM, 따옴표 필드, 헤더 행, 빈 행, 열 수 불일치), **실패 출력을 저장**
- [ ] T026 [US2] `webapp/channels/src/utils/csv.ts` 신규 작성 — 소형 CSV 파서(외부 의존성 금지, 해석할 수 없는 파일은 파일 단위 오류로 반환) + 결과 CSV 직렬화(Blob용 문자열 생성) (D6) → T025 통과 확인
- [ ] T027 [US2] 사전 검증 테스트 선행 — `direct_register_view.test.tsx`에 CSV 탭 테스트 추가(행별 검증 표시: 이메일 형식·필수 값·비밀번호 정책·파일 내 중복·행 상한, 통과 행만 제출), **실패 출력을 저장**
- [ ] T028 [US2] `direct_register_view.tsx`에 CSV 일괄 등록 탭 구현 — 템플릿 내려받기(열: 이메일, 이름, 임시비밀번호), 파일 선택(`admin_console/file_upload_setting.tsx`의 숨긴 input 패턴), 파싱(파일 단위 오류는 안내 문구로 표시) → 행별 검증 미리보기 표 → 통과 행만 `registerMembersDirectly` 호출 → T027 통과 확인
- [ ] T029 [US2] 결과 CSV 내려받기 — `result_view.tsx`에 직접 등록 결과일 때 "결과 CSV 내려받기" 버튼 추가(열: 이메일, 이름, 임시비밀번호, 결과, 사유; 원본 요청 행을 컴포넌트 상태로 보존해 이메일 기준으로 서버 결과와 병합한 뒤 클라이언트 Blob으로 생성). 버튼 동작 테스트를 `result_view.test.tsx`에 추가하고 **실패 출력을 저장**한 뒤 구현
- [ ] T030 [P] [US2] CSV 관련 i18n 키 추가 — `npm run i18n-extract` + `ko.json` 동시 갱신

**Checkpoint**: quickstart.md 시나리오 2를 실주행으로 통과. US1 동작 불변.

---

## Phase 5: User Story 3 - 시스템 콘솔에서 기능을 켜고 끈다 (Priority: P3)

**Goal**: 시스템 관리자가 시스템 콘솔 Authentication > Signup에서 설정을 켜고
끈다. 꺼짐이면 UI·API 모두 차단된다(차단 자체는 Phase 2·3에서 구현됨).

**Independent Test**: quickstart.md 시나리오 3 — 설정 끔/켬 전환에 따른 노출·
차단을 UI와 curl로 확인.

- [ ] T031 [US3] admin console 테스트 선행 — `webapp/channels/src/components/admin_console/admin_definition_direct_member_registration.test.tsx` 작성(설정 항목 존재, 권한 없는 콘솔 사용자에게 비활성), **실패 출력을 저장**
- [ ] T032 [US3] `webapp/channels/src/components/admin_console/admin_definition.tsx`의 `SignupSettings` 섹션(EnableOpenServer :4178 근처)에 `TeamSettings.EnableDirectMemberRegistration` bool 항목 추가(`isDisabled: it.not(it.userHasWritePermissionOnResource(...AUTHENTICATION.SIGNUP))`) (D9) → T031 통과 확인
- [ ] T033 [P] [US3] admin 설정 i18n — `admin.team.directMemberRegistrationTitle`·`...Description`을 `en.json`(i18n-extract)·`ko.json`에 동시 추가

**Checkpoint**: 세 스토리 모두 독립 동작. quickstart.md 시나리오 3 실주행 통과.

---

## Phase 6: Polish & 완료 검증

**Purpose**: 교차 관심사 정리와 증거 수집.

- [ ] T034 [P] 신규 파일 저작권 헤더(`Copyright (c) 2015-present Mattermost, Inc.`) 확인 — `direct_register_view.tsx`, `csv.ts` 등 (원칙 IV)
- [ ] T035 [P] i18n 정합 검증 — `cd server && make i18n-check` 통과 출력 + `cd webapp && npm run i18n-extract` 후 diff 클린 확인 (원칙 V)
- [ ] T036 server 부수 정리 — mock 변경이 있으면 `make mocks` 재생성 커밋, `go mod tidy` 클린 확인 (원칙 I)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [ ] T037 품질 게이트 — server(`make check-style`, `make test-server`)와 webapp(`npm run check`, `npm run check-types`, `npm run test`) 게이트를 돌리고, 실패 목록이 T001·T002 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [ ] T038 종단 검증 — 빌드·배포 후 quickstart.md 시나리오 1~4를 **실제 환경에서** 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [ ] T039 SC 검증 — spec.md의 SC-001~SC-006 각각을 **실측값**으로 확인한다 (추정 금지)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 의존 없음 — 즉시 시작, T001·T002 병렬.
- **Phase 2 (Foundational)**: Phase 1 완료 후. 모든 user story를 막는다.
  내부 순서: T003 → T004 → (T005·T006 병렬), T007 → T008 → T009, T010은 독립.
- **Phase 3 (US1)**: Phase 2 완료 후. 서버 트랙(T011→T012→T013→T014→T015)과
  웹앱 트랙(T017→T018→T019→T020, T021→T022→T023)은 사람이 둘이면 병렬 가능.
  T023은 T020에 의존. T016·T024는 각 트랙 말미.
- **Phase 4 (US2)**: US1 완료 후(직접 등록 뷰·액션·엔드포인트를 재사용).
  T025→T026, T027→T028, T029는 T028 이후. T030 독립.
- **Phase 5 (US3)**: Phase 2 완료 후 언제든 가능 — US1·US2와 독립.
  T031→T032, T033 병렬.
- **Phase 6 (Polish)**: 원하는 모든 스토리 완료 후.

### User Story Dependencies

- **US1 (P1)**: Foundational만 필요. 다른 스토리 의존 없음 — MVP.
- **US2 (P2)**: US1의 뷰·액션·엔드포인트를 확장하므로 US1 뒤에 온다.
- **US3 (P3)**: Foundational만 필요. US1·US2와 독립적으로 검증 가능.

### Parallel Opportunities

- Phase 1: T001 ∥ T002
- Phase 2: T005 ∥ T006 ∥ T010 (각자 다른 파일)
- Phase 3: 서버 트랙 ∥ 웹앱 타입·클라이언트 트랙(T011 ∥ T017), T016 ∥ T024
- Phase 5는 Phase 3·4와 병렬 진행 가능
- Phase 6: T034 ∥ T035

---

## Parallel Example: User Story 1

```bash
# 서버·웹앱 트랙 동시 착수 (Foundational 완료 후):
Task: "T011 server/public/model/team_member.go 타입 추가"
Task: "T017 webapp/platform types + client4 registerTeamMembers 추가"

# 각 트랙 안에서는 테스트 선행 → 구현 순서를 지킨다 (원칙 III)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 기준선 → Phase 2 설정·권한 → Phase 3 US1.
2. **멈추고 검증**: quickstart.md 시나리오 1 실주행 + T037 게이트 diff.
3. 이 상태로 배포하면 "입사자 한 명 등록" 요구가 충족된다.

### Incremental Delivery

1. US1 배포(MVP) → US2(CSV 일괄) 추가 배포 → US3(콘솔 토글 UI) 추가 배포.
2. 각 증분은 이전 스토리를 깨지 않는다 — 매 checkpoint에서 기존 초대 경로
   불변(SC-006)을 함께 확인한다.

---

## Notes

- 커밋은 과제 단위 또는 논리적 묶음 단위로 한다. 커밋 전 사용자에게 의사를
  확인한다(저장소 커밋 정책). Conventional Commits 접두사 사용(원칙 VI).
- 테스트 과제(T007, T012, T014, T019, T021, T025, T027, T029, T031)는 실패
  출력을 과제 완료 증거로 tasks.md 옆이나 PR 본문에 남긴다.
- 기존 초대 경로 파일을 수정할 때는 추가 위주로 바꿔 upstream 충돌 면적을
  줄인다(plan.md Structure Decision).
