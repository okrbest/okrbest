# Implementation Plan: 팀 멤버 직접 등록

**Branch**: `030-direct-member-register` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/030-direct-member-register/spec.md`

## Summary

팀 관리자가 초대 코드 없이 멤버 계정(이메일·이름·임시 비밀번호)을 직접 만들어
팀에 등록한다. 기존 "구성원 초대" 모달에 "직접 등록" 방식을 추가하고(한 명 등록
+ CSV 일괄 등록), 서버에는 신규 설정 `EnableDirectMemberRegistration`(기본
꺼짐), 신규 팀 권한 `register_team_members`(team_admin 기본 부여 + 권한
마이그레이션), 신규 엔드포인트 `POST /teams/{team_id}/members/register`(행별
graceful 결과)를 더한다. CSV 파싱·사전 검증·결과 CSV 생성은 웹앱이 맡고, 서버가
최종 검증자다. 기존 초대 경로는 바꾸지 않는다. 기술 결정의 근거는
[research.md](research.md)에 있다.

## Technical Context

**Language/Version**: Go 1.26.2 (`server/`), TypeScript 5.6 + React (`webapp/`)

**Primary Dependencies**: 기존 의존성만 사용한다. CSV 파서는 외부 라이브러리
없이 소형 유틸로 작성한다(D6) — lockfile 변경 없음.

**Storage**: 기존 Users·TeamMembers 테이블을 그대로 쓴다. DB 스키마 변경 없음.
Roles에는 권한 마이그레이션(`permissions_migrations.go`)으로
`register_team_members`를 추가한다(D2).

**Testing**: server는 gotestsum(`make test-server`) + colocated `_test.go`,
webapp은 Jest + React Testing Library(`npm run test`). 원칙 III에 따라 구현 전
실패 출력을 남긴다(D11).

**Target Platform**: Linux 서버 + 웹 클라이언트 (Mattermost 포크 모노레포)

**Project Type**: web-service(`server/`) + web frontend(`webapp/`)

**Performance Goals**: 등록 요청 1회당 최대 256행(`MaxAddMembersBatch`와 동일
상한)을 행 단위 독립 처리. SC-002: 100행 CSV를 업로드→미리보기→등록→결과
확인까지 5분 이내.

**Constraints**: 기존 초대 경로(이메일 초대·초대 링크)의 동작·화면 불변(FR-014).
upstream 구조 변경 최소화(머지 충돌 축소). 임시 비밀번호는 감사 기록에 싣지
않는다(D5). 설정 꺼짐이면 UI와 API 양쪽을 막는다(FR-001, FR-012).

**Scale/Scope**: 팀당 수십~수백 명 규모 온보딩. 화면은 초대 모달 내 방식
선택 + 직접 등록 뷰(두 탭) + 결과 화면, 시스템 콘솔 설정 1건.

## Constitution Check

*GATE: Phase 0 전에 통과해야 하고, Phase 1 설계 후 재평가한다.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS | server·webapp 둘 다 닿는다. 구현 시작 전 두 게이트의 기준선(실패 목록)을 저장하고, 마감 때 diff로 회귀를 판정한다. mock 변경 시 `make mocks` 재생성, `go mod tidy` 클린 유지. |
| II. webapp npm workspaces 전용 | PASS | 새 의존성 없음(D6). lockfile 변경 없음. |
| III. 실패를 본 테스트만 인정 | PASS | D11의 테스트 각각에 대해 구현 전 실패 출력을 tasks에서 증거로 남긴다. |
| IV. 라이선스·리브랜드 충실성 | PASS | 신규 파일에 Mattermost 저작권 헤더를 유지한다. 라이선스 존: `server/public`(Apache-2.0), 그 외 서버 코드(AGPL), `webapp/`(Apache-2.0) — 기존 존 안에서만 수정한다. |
| V. i18n 동기화 | PASS | 서버 `en.json`/`ko.json`, 웹앱 `en.json`(i18n-extract)/`ko.json`을 같은 변경에서 갱신한다(D10). |
| VI. 집중 브랜치 + Conventional Commits | PASS | 브랜치 `030-direct-member-register`를 spec 작성 전에 생성했다. PR은 이 기능만 담는다. |
| VII. Spec 주도 개발 워크플로 | PASS | brainstorming → specify → plan 경로를 따르는 중. 구현 규율은 `/speckit-implement` 3-bis에서 로드한다. |
| VIII. 명세 문서 언어·문체 | PASS | 산출물을 한국어로 작성, 코드 식별자·경로·명령은 원형 유지. |

Phase 1 설계 후 재평가: 위반 없음. Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/030-direct-member-register/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물 (D1~D11)
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
├── contracts/
│   └── register-members-api.md   # REST 계약
└── tasks.md             # Phase 2 산출물 (/speckit-tasks가 생성)
```

### Source Code (repository root)

```text
server/
├── public/model/
│   ├── config.go                  # TeamSettings.EnableDirectMemberRegistration (D1)
│   ├── permission.go              # PermissionRegisterTeamMembers (D2)
│   ├── role.go                    # team_admin 기본 권한 (D2)
│   ├── migration.go               # 권한 마이그레이션 키 (D2)
│   ├── audit_events.go            # AuditEventRegisterTeamMembers (D5)
│   └── team_member.go             # 행별 결과 타입 (D3)
├── config/client.go               # client config 노출 (D1)
├── channels/
│   ├── api4/team.go               # POST /teams/{team_id}/members/register (D3)
│   ├── app/team.go                # RegisterTeamMembers app 함수 (D3, D4)
│   ├── app/permissions_migrations.go  # 마이그레이션 등록 (D2)
│   └── testlib/store.go           # 마이그레이션 키 mock (D2)
├── i18n/en.json, ko.json          # api.team.register_members.* (D10)
└── tests/test-config.json         # 설정 기본값 (D1)

webapp/
├── platform/
│   ├── client/src/client4.ts      # registerTeamMembers (D8)
│   └── types/src/
│       ├── config.ts              # TeamSettings·ClientConfig 타입 (D1)
│       └── teams.ts               # 요청·응답 타입 (D8)
└── channels/src/
    ├── packages/mattermost-redux/src/
    │   ├── constants/permissions.ts   # REGISTER_TEAM_MEMBERS (D2)
    │   └── actions/teams.ts           # redux 래퍼 (D8)
    ├── actions/invite_actions.ts      # registerMembersDirectly (D7, D8)
    ├── components/invitation_modal/
    │   ├── invitation_modal.tsx       # 방식 선택 통합 (D7)
    │   ├── index.tsx                  # 노출 조건 mapStateToProps (D7)
    │   ├── direct_register_view.tsx   # 신규: 한 명/CSV 두 탭 (D7)
    │   ├── result_view.tsx            # 직접 등록 결과 문구·CSV 다운로드 (D7)
    │   └── *.test.tsx                 # 컴포넌트 테스트 (D11)
    ├── utils/csv.ts                   # 신규: 소형 CSV 파서 (D6)
    ├── components/admin_console/admin_definition.tsx  # 설정 토글 (D9)
    └── i18n/en.json, ko.json          # invite_modal.direct_register.* (D10)
```

**Structure Decision**: 모노레포의 기존 배치를 그대로 따른다. 신규 파일은
`direct_register_view.tsx`(초대 모달 폴더 내)와 `utils/csv.ts` 둘뿐이고,
나머지는 기존 파일에 기존 패턴대로 덧붙인다. upstream 충돌 면적을 줄이기 위해
기존 파일 수정은 추가 위주로 한다.

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
