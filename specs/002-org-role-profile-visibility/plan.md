# Implementation Plan: 팀 멤버 프로필 부서/직위 표시 및 계정 설정 직책 관리체계 전환

**Branch**: `feature/department-position` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-org-role-profile-visibility/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

같은 팀 멤버가 프로필 카드에서 팀 관리자가 지정한 동료의 부서/직위를 확인할 수 있도록, 일반 멤버용 읽기 전용 조회 엔드포인트(`GET .../org-profile-summary`)를 신규 추가하고, 프로필 카드에는 기존 자유 텍스트 `user.position` 대신 "부서명 · 직위명" 결합 표시를, 계정 설정 화면에는 기존 편집 가능한 "직책" 섹션 대신 읽기 전용 "부서"/"직위" 두 행을 추가한다. 기존 관리자 전용 조회/쓰기 API(`specs/001-org-role-bulk-assign`)는 변경하지 않는다.

## Technical Context

**Language/Version**: server — Go 1.24(constitution 명시 `server/` 기준, 신규 라우트/App 메서드 추가). webapp — React + TypeScript 5.6, npm workspaces(신규 컴포넌트 + 기존 컴포넌트 수정).

**Primary Dependencies**: server — 기존 `org_role` 도메인(`server/public/model/org_role.go`, `server/channels/app/org_role.go`, `server/channels/store/sqlstore/org_role_store.go`) 재사용, 신규 외부 의존성 없음. webapp — 기존 `Client4`(`webapp/platform/client/src/client4.ts`)에 `doFetch` 기반 메서드 추가, `mattermost-redux` 액션/셀렉터(`getTeamMember`) 재사용, `react-intl`(`FormattedMessage`)로 i18n. 신규 npm 패키지 없음.

**Storage**: N/A — DB 스키마·마이그레이션 변경 없음. 기존 `UserOrgProfile`/`OrgUnit`/`PositionDefinition` 테이블을 읽기 전용으로 조회만 한다(research.md §2).

**Testing**: server — `go test`(gotestsum), `server/channels/api4/team_org_roles_test.go`의 기존 `Setup(t).InitBasic(t)` + `DoAPIGet` 패턴 확장(research.md §5). webapp — Jest + React Testing Library, `TZ=UTC`/en_US 고정(constitution III).

**Target Platform**: 웹 브라우저(Mattermost 채널 뷰의 프로필 팝오버, 계정 설정 모달) + 서버는 Linux 컨테이너/바이너리(기존 배포 대상과 동일).

**Project Type**: 모노레포 웹 애플리케이션(`server/` + `webapp/`) — 이번 기능은 두 패키지 모두를 건드리는 풀스택 변경(서버: 신규 조회 API, webapp: 팝오버·계정 설정 UI).

**Performance Goals**: 신규 정량적 목표 없음. 팝오버 오픈 시 요청 1건 추가(팀당 부서/직위 개수가 적어 `ListOrgUnits`/`ListPositionDefinitions` 조회 비용은 무시할 수준) — 별도 캐싱 계층 없이 redux 스토어 재사용 수준으로 충분(research.md §3).

**Constraints**: 기존 관리자 전용 API·권한 모델 변경 금지(FR-008). 신규 엔드포인트는 조회 전용(GET)만 추가하며 쓰기 계약은 손대지 않는다. 겸직(`ExtraPositions`) 데이터는 조회 응답에 포함하지 않는다(spec Clarifications §3).

**Scale/Scope**: 팀 단위 조회(요청당 사용자 1명). 대량 사용자에 대한 배치 조회(예: 멤버 목록 화면에서 N명 동시 표시)는 이번 범위 밖 — 필요 시 후속 기능에서 다룬다.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 (NON-NEGOTIABLE) | PASS | `server/`와 `webapp/` 모두 변경 — `make check-style` + `make test-server`, `npm run check` + `npm run check-types` + `npm run test` 전부 게이트로 적용. 신규 mock 발생 시 `make mocks` 재생성. |
| II. webapp은 npm workspaces 전용 | PASS | 신규 npm 패키지·lockfile 변경 없음. 기존 `webapp/channels` workspace 내 파일만 수정/추가. |
| III. 동작 변경 시 테스트 동반 | PASS | 서버 권한 매트릭스 테스트(`team_org_roles_test.go` 확장) + 웹앱 팝오버/계정설정 렌더링 테스트를 tasks 단계에서 추가한다. |
| IV. 라이선스·리브랜드 충실성 (NON-NEGOTIABLE) | PASS | 신규 파일에도 기존 `Copyright (c) 2015-present Mattermost, Inc.` 헤더 유지. 라이선스 존 변경 없음(`server/public`, `webapp/` = Apache-2.0 유지). |
| V. i18n 동기화 | PASS | 신규 표시 문구(부서/직위 결합 표시, 미지정 라벨, 계정 설정 "부서"/"직위" 행, 안내 문구)를 `FormattedMessage`로 작성하고 `webapp/channels/src/i18n/en.json`·`ko.json`에 같은 변경으로 동시 추가한다. |
| VI. 집중 브랜치 + Conventional Commits + PR | PASS | 현재 `feature/department-position` 브랜치(`specs/001-org-role-bulk-assign`과 동일 계열 작업)에서 진행. 이번 PR은 조회 전용 신규 API + 표시 UI로 범위를 한정하고, 무관한 관리자 화면 리팩터는 포함하지 않는다. |
| VII. Spec 주도 개발 워크플로 | PASS | `specify → clarify → plan`(현재 단계) → `tasks` 순서를 따르는 중. |

## Project Structure

### Documentation (this feature)

```text
specs/002-org-role-profile-visibility/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── org-profile-summary.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

기존 모노레포 구조(`server/` + `webapp/`)를 그대로 사용하는 웹 애플리케이션(Option 2 계열이나, 이 저장소는 `backend/`/`frontend/`가 아닌 `server/`/`webapp/` 명명을 쓴다). 신규 디렉터리는 만들지 않고 기존 `org_role` 관련 파일에 추가/수정만 한다.

```text
server/
├── public/model/
│   └── org_role.go                       # 신규: UserOrgProfileSummary 구조체 추가
├── channels/app/
│   ├── org_role.go                       # 신규: GetUserOrgProfileSummary(teamID, userID) 추가
│   └── org_role_test.go                  # 신규 App 메서드 단위 테스트 추가
└── channels/api4/
    ├── team.go                           # 신규 라우트 + getUserOrgProfileSummary 핸들러 추가
    └── team_org_roles_test.go            # 신규 엔드포인트 권한 매트릭스 테스트 추가

webapp/channels/src/
├── packages/mattermost-redux/src/        # (workspace: mattermost-redux)
│   └── selectors/entities/teams.ts       # 변경 없음 — 기존 getTeamMember 셀렉터는 US3의 "타팀 멤버 숨김" 가드에만 재사용, org-role 요약 데이터 자체는 redux에 저장하지 않음
├── components/profile_popover/
│   ├── profile_popover.tsx               # 신규 org-role 요약 fetch 연동(useEffect)
│   ├── profile_popover_name.tsx          # 기존 user.position 표시(Position) 제거
│   ├── profile_popover_position.tsx      # 대체: 신규 결합 표시 컴포넌트로 교체 또는 재작성
│   └── profile_popover.scss              # 필요 시 신규 표시 줄 스타일 추가
├── components/user_settings/general/
│   └── user_settings_general.tsx         # createPositionSection → 읽기 전용 "부서"/"직위" 두 행으로 교체
└── i18n/
    ├── en.json                           # 신규 메시지 id 추가
    └── ko.json                           # 동일 id 한국어 번역 동시 추가

webapp/platform/client/src/
└── client4.ts                            # 신규: getUserOrgProfileSummary(teamId, userId) 메서드 추가 — 컴포넌트가 직접 호출(redux 액션 계층 없음)
```

**Structure Decision**: 기존 모노레포 구조를 그대로 사용하며, 신규 최상위 디렉터리나 공유 패키지를 만들지 않는다. 서버는 기존 `org_role` 3파일(모델/앱/api4) + 테스트에 조회 전용 코드를 추가하고, 웹앱은 기존 `profile_popover`/`user_settings_general` 컴포넌트 트리와 `client4.ts`에 최소 변경을 가한다. 관리자 전용 화면(`admin_console/org_role_management`, `team_org_role_management_modal`)과 그 테스트는 이번 기능에서 수정하지 않는다(FR-008, 기존 관리자 경로 불변).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| 해당 없음 | Constitution Check 7개 원칙 모두 PASS — 정당화가 필요한 위반 항목 없음 | — |
