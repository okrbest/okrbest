# Research: 팀 멤버 프로필 부서/직위 표시 및 계정 설정 직책 관리체계 전환

**Feature**: [spec.md](./spec.md) | **Date**: 2026-07-27

이 문서는 Technical Context의 불확실성을 해소하기 위해 기존 코드베이스를 조사한 결과를 정리한다. 이 기능은 신규 외부 기술 도입 없이 기존 `org_role` 도메인(부서/직위 관리, `specs/001-org-role-bulk-assign`)을 조회 방향으로 확장하는 작업이라, 모든 항목이 코드베이스 내 기존 패턴 조사로 해결된다.

## 1. 서버: 일반 멤버용 부서/직위 조회 권한 분리

**Decision**: 기존 관리자 전용 `GET /teams/{team_id}/users/{user_id}/org-profile`(`requireOrgRoleManagement` = `PermissionSysconsoleReadUserManagementTeams` 또는 `PermissionManageTeamRoles`)는 그대로 두고, 신규 라우트 `GET /teams/{team_id}/users/{user_id}/org-profile-summary`를 추가한다. 신규 핸들러는 `server/channels/api4/team.go`의 기존 `getTeamMember` 핸들러(1039행 근방, `/teams/{team_id}/members/{user_id}`)와 동일한 3단 권한 체크 패턴을 재사용한다:

1. `c.App.Config().FeatureFlags.EnableOrgRoleManagement` — 꺼져 있으면 501(`api.team.org_roles.feature_disabled.app_error`), 기존 관리자 API와 동일 오류 코드 재사용.
2. `c.App.SessionHasPermissionToTeam(session, teamId, model.PermissionViewTeam)` — 열람자가 해당 팀 멤버인지(팀 관리자보다 낮은, 일반 멤버 열람 권한).
3. `c.App.UserCanSeeOtherUser(c.AppContext, session.UserId, targetUserId)` + `c.App.GetTeamMember(c.AppContext, teamId, targetUserId)` — 대상 사용자가 실제로 해당 팀 멤버인지 서버에서도 검증(클라이언트의 "타팀 숨김" 로직과 별개로 서버 측 방어선). 대상이 멤버가 아니면 `GetTeamMember`가 반환하는 404 AppError를 그대로 전달한다.

**Rationale**: 기존 `getTeamMember` 핸들러가 정확히 "일반 멤버가 같은 팀 동료 정보를 조회"하는 동일한 권한 등급을 이미 구현하고 있어, 새 엔드포인트가 이 관례를 따르면 리뷰어에게 익숙하고 검증된 패턴이 된다. 쓰기(`PUT`) 엔드포인트와 목록형 관리자 엔드포인트(`getUserOrgProfile`, `getTeamOrgProfiles`)는 변경하지 않아 기존 관리자 권한 경계가 그대로 유지된다.

**Alternatives considered**: 기존 `getUserOrgProfile`의 권한 체크만 완화하는 방안은 관리자 관리 화면과 일반 조회가 같은 엔드포인트/응답 형태를 공유하게 되어 향후 관리자 전용 필드(예: `effective_from/to`, 감사 관련 메타데이터)를 추가하기 어렵게 만든다는 이유로 기각(브레인스토밍 단계에서 이미 결정).

## 2. 서버: 부서명/직위명 조회(ID → 이름 변환)

**Decision**: `UserOrgProfile`은 `PrimaryOrgUnitID`/`PrimaryPositionID`만 저장하므로, 신규 App 메서드 `App.GetUserOrgProfileSummary(teamID, userID)`가 기존 `App.GetUserOrgProfile` → `App.ListOrgUnits(teamID, true)`/`App.ListPositionDefinitions(teamID, true)`를 조합해 ID를 이름으로 변환한다. `includeInactive=true`로 조회해, 배정 당시엔 유효했으나 이후 비활성화된 부서/직위도 이름이 계속 표시되게 한다.

**Rationale**: `server/channels/app/org_role.go`의 기존 `syncUserOrgProfileToProps` (367~446행)가 이미 정확히 이 패턴(포지션 목록을 불러와 ID→Code 맵을 만들어 조회)으로 구현되어 있어 그대로 재사용 가능. 별도의 단건 조회(`GetOrgUnit(id)`/`GetPositionDefinition(id)`) 스토어 메서드는 존재하지 않으며, 이번 범위에서 신규로 추가할 필요는 없다(목록 조회 + 맵 변환으로 충분).

**Alternatives considered**: 스토어에 단건 조회 메서드를 신규 추가하는 방안은 이번 기능 규모에 비해 과함(YAGNI) — 팀당 부서/직위 개수가 일반적으로 적어 전체 목록 조회 비용이 낮음.

## 3. 웹앱: 프로필 팝오버 데이터 연동

**Decision**: `profile_popover.tsx`는 이미 팝오버가 열릴 때 `useEffect`(144~152행)에서 `dispatch(getMembershipForEntities(currentTeamId, userId, channelId))`를 호출하고 있고, 이 액션(`actions/views/profile_popover.ts`)은 내부적으로 `mattermost-redux`의 `getTeamMember(teamId, userId)` 액션을 dispatch해 `TeamMembership`을 redux에 채운다. 신규 컴포넌트는:

1. `getTeamMember(state, currentTeamId, userId)` 셀렉터(`mattermost-redux/selectors/entities/teams`)로 대상이 현재 팀 멤버인지 확인.
2. 멤버인 경우에만 신규 `Client4.getUserOrgProfileSummary(teamId, userId)`를 별도 redux 액션(예: `actions/views/profile_popover.ts`에 추가하거나 `mattermost-redux/actions/teams.ts`에 대응 액션 추가)으로 호출.
3. 팀 멤버가 아니거나(`undefined`) `currentTeamId`가 없으면 부서/직위 라인 자체를 렌더링하지 않는다(User Story 3).

**Rationale**: 이미 로드되는 팀 멤버십 데이터를 재사용하면 "타팀 사용자 숨김" 로직을 프론트엔드에서 별도 API 호출 없이 구현할 수 있다. `Client4`(`webapp/platform/client/src/client4.ts`)의 `getTeamMember`(1436행)처럼 `doFetch<T>` 기반 표준 패턴을 그대로 따른다 — `team_org_role_management_modal.tsx`/`org_role_management_body.tsx`가 쓰는 로컬 `fetch` 헬퍼는 관리자 콘솔 전용 예외 패턴이므로 신규 사용자 대면 컴포넌트에서는 채택하지 않는다.

**Alternatives considered**: 팝오버가 열릴 때마다 별도의 팀 멤버십 확인 API를 새로 호출하는 방안은 이미 존재하는 `getMembershipForEntities` 흐름과 중복되므로 기각.

## 4. 웹앱: 계정 설정 "직책" 섹션의 읽기 전용 전환 방법

**Decision**: `user_settings_general.tsx`의 `createPositionSection`(1309~1419행)을 제거하고, 부서/직위 각각에 대해 `SettingItem`(`components/setting_item.tsx` → `SettingItemMin`)을 `isDisabled={true}`로 렌더링하는 두 개의 행으로 교체한다. `SettingItemMin`(`components/setting_item_min.tsx`)은 이미 `isDisabled` prop을 지원하며, `true`일 때 "Edit" 버튼을 아예 렌더링하지 않고(73행), 대신 `collapsedEditButtonWhenDisabled`로 대체 안내문(예: "팀 관리자가 관리합니다")을 넣을 수 있는 슬롯을 제공한다. `max`(펼침/편집 폼)는 전달하지 않아 클릭해도 편집 모드로 전환되지 않는다.

**Rationale**: 이 컴포넌트가 정확히 "표시는 하되 편집은 막는" 이번 요구사항(FR-005/FR-006/FR-007)을 위해 이미 존재하는 옵션이라, 신규 CSS나 별도 읽기전용 컴포넌트를 만들 필요가 없다(YAGNI). 계정 설정 화면의 다른 필드(사용자 이름, 사용자 ID 등)와 동일한 시각적 언어를 유지한다.

**Alternatives considered**: 완전히 새로운 읽기 전용 표시 컴포넌트를 만드는 방안은 기존 `SettingItem`/`SettingItemMin`이 이미 지원하는 기능을 중복 구현하는 것이라 기각.

## 5. 테스트 패턴

**Decision**:
- 서버: `server/channels/api4/team_org_roles_test.go`에 이미 있는 `Setup(t).InitBasic(t)` + `th.SystemAdminClient`/`th.Client`/`th.BasicTeam` + `DoAPIGet` 패턴(`TestTeamOrgRolesFeatureFlag`, `TestTeamOrgRolesTeamAdminPermission`)을 그대로 확장해 신규 엔드포인트의 권한 매트릭스(같은 팀 일반 멤버 200, 타팀 멤버 403/404, 관리자 기존 동작 불변)를 검증한다.
- 웹앱: 신규 팝오버 컴포넌트는 Jest + RTL로 렌더링(값 있음/부분/전체 미지정/타팀 숨김) 테스트, `user_settings_general.test.tsx`(존재 시)에 읽기전용 전환(입력창 미노출, `isDisabled` 렌더 확인) 테스트를 추가한다.

**Rationale**: constitution III(동작 변경 시 테스트 동반)과 기존 `team_org_roles_test.go`의 정착된 컨벤션을 따르는 것이 리뷰 비용이 가장 낮다.

## 해결된 NEEDS CLARIFICATION 항목

Technical Context에 명시된 언어/스택(Go 1.24 + Makefile, React/TypeScript + npm workspaces)은 사용자가 `/speckit-plan` 인자로 직접 지정했으므로 별도 조사가 필요 없었다. 그 외 불확실성(권한 모델, ID→이름 변환, 팝오버 데이터 연동, 읽기전용 UI 패턴, 테스트 패턴)은 위 1~5절에서 모두 해결되었다 — 미해결 NEEDS CLARIFICATION 없음.
