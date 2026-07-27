# Implementation Plan: 조직/직위 관리 다중 선택 · 일괄 지정 · 일괄 저장

**Branch**: `feature/department-position` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-org-role-bulk-assign/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

관리자 콘솔 "조직/직위 관리" 화면에 체크박스 기반 다중 선택, 일괄 부서/직위 지정 툴바, 그리고 변경된(Dirty) 사용자 전원을 단일 "저장" 클릭으로 순차 저장하는 흐름을 추가한다. 프론트엔드 전용 1차 작업으로, 기존 `PUT /api/v4/teams/{team_id}/users/{user_id}/org-profile` 단건 엔드포인트를 그대로 재사용하며 서버 변경은 없다. 대상 파일은 `webapp/channels/src/components/admin_console/org_role_management/` 하위 4개 파일(`org_role_management.tsx`, `org_role_management_body.tsx`, `.scss`, `.test.tsx`)로 한정된다. 아울러 이번 기능이 신규로 건드리는 두 파일에 남아있던 기존 인라인 한글 리터럴(사용자에게 확인 후 결정: 같은 파일을 이미 수정하는 김에 함께 정리)도 이번 변경 범위에 포함해 `FormattedMessage`/`en.json`/`ko.json`으로 전환한다.

## Technical Context

**Language/Version**: webapp — TypeScript 5.6 (React), constitution 명시 기준. server — Go 1.24.6(이번 기능은 서버 코드 변경 없음; 기존 org-profile 엔드포인트만 재사용).

**Primary Dependencies**: React(기존), 컴포넌트 로컬 `fetch` 기반 `request<T>()` 헬퍼(기존 패턴 유지 — 이 파일은 Client4/redux를 쓰지 않는 예외 영역). 신규 외부 라이브러리 추가 없음. 이번 기능이 새로 추가하는 문자열뿐 아니라, 변경 대상 파일(`org_role_management.tsx`, `org_role_management_body.tsx`)에 기존부터 남아있던 인라인 한글 리터럴도 함께 `react-intl`의 `FormattedMessage`/`defineMessage`(이미 프로젝트 의존성에 포함, 다른 admin_console 컴포넌트에서 표준적으로 사용 중, 예: `admin.team_settings.*`)를 통해 `admin.org_role_management.*` id로 전환한다.

**Storage**: N/A — DB 스키마·마이그레이션 변경 없음. 기존 `user_org_profile`/`org_unit`/`position_definition` 테이블을 기존 단건 upsert 그대로 사용.

**Testing**: webapp — Jest + React Testing Library, `TZ=UTC`/en_US 고정(constitution III). 기존 `org_role_management.test.tsx`의 `global.fetch` mock 패턴(URL substring + method 분기, `renderWithContext`, `TestHelper`, `within(row)`, `fetchMock.mock.calls.filter(...)`)을 그대로 확장.

**Target Platform**: 웹 브라우저 — Mattermost 관리자 콘솔(System Console) 내 팀별 화면.

**Project Type**: 모노레포 웹 애플리케이션(`server/` + `webapp/`) 중 **webapp 프론트엔드 전용 변경**. 이번 기능은 서버 디렉터리를 건드리지 않는다.

**Performance Goals**: 새로운 정량적 성능 목표는 없음. 일괄 저장은 서버 부하(사용자당 `GetUser`+팀 전체 `ListPositionDefinitions` 조회+`PatchUser` 웹소켓 브로드캐스트+감사로그 insert)를 고려해 **순차 처리**로 진행해 동시 부하를 병렬 대비 최소화한다.

**Constraints**: 기존 단건 PUT 엔드포인트만 재사용(신규 서버 배치 API 없음). 일괄 지정 툴바는 값 설정 전용이며 "미지정"으로의 일괄 초기화는 지원하지 않는다. 헤더 "전체 선택"은 현재 필터/검색에 표시된 사용자만 대상으로 한다. 선택 상태는 필터 변경과 무관하게 유지된다.

**Scale/Scope**: 팀 단위 사용자 목록(현재 `GET /api/v4/users?in_team=...&per_page=200` 페이지네이션 상한) 규모. 그 이상 대규모 팀에 대한 서버 배치 처리 성능은 이번 범위 밖(가정 사항으로 spec.md에 명시).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 (NON-NEGOTIABLE) | PASS | webapp만 변경 — `npm run check`, `npm run check-types`, `npm run test` 통과가 게이트. server 변경 없으므로 `make check-style`/`make test-server`는 영향 없음(회귀 확인 목적으로만 무변경 확인). |
| II. webapp은 npm workspaces 전용 | PASS | 신규 패키지·lockfile 변경 없음. 기존 `webapp/channels` workspace 내 파일만 수정. |
| III. 동작 변경 시 테스트 동반 | PASS | spec.md 테스트 계획(체크박스, 전체선택 범위, 일괄지정 필드 병합, 저장 호출 수, 부분 실패, 회귀) 전부를 `org_role_management.test.tsx`에 추가. |
| IV. 라이선스·리브랜드 충실성 (NON-NEGOTIABLE) | PASS | 기존 파일의 라이선스 헤더·존(webapp = Apache-2.0) 변경 없음. 신규 파일 추가 없음. |
| V. i18n 동기화 | PASS | `org_role_management_body.tsx`(기존 `FormattedMessage` 0건, 한글 리터럴 약 63건)와 `org_role_management.tsx`(일부는 이미 `FormattedMessage` 사용 중, 잔여 리터럴 약 6건)에서 **이번 변경으로 건드리는 두 파일 전체**의 사용자 노출 문자열을 `FormattedMessage`/`defineMessage`로 전환하고 `admin.org_role_management.*` id를 부여해 `webapp/channels/src/i18n/en.json`·`ko.json`에 같은 변경으로 동시 반영한다(원칙 V 완전 준수). 사용자 확인에 따라 최초 계획(신규 문자열만 전환)에서 범위를 넓혀, 이미 수정 중인 두 파일의 기존 리터럴까지 포함하기로 결정함. |
| VI. 집중 브랜치 + Conventional Commits + PR | PASS (범위 확장을 사용자가 명시적으로 승인) | 현재 `feature/department-position` 브랜치에서 작업 중이며 PR은 이번 기능으로 범위를 한정한다. i18n 전면 전환은 diff 크기를 키우지만, **이미 이번 PR에서 수정 중인 동일 두 파일 내부**에 한정되어 있어 "무관한 리팩터·설정 변경을 섞지 않는다"는 원칙의 취지(다른 파일/기능을 끌어들이지 않음)는 유지된다. |
| VII. Spec 주도 개발 워크플로 | PASS | `specify → plan`(현재 단계) → `tasks` 순서를 따르는 중. |

## Project Structure

### Documentation (this feature)

```text
specs/001-org-role-bulk-assign/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
webapp/channels/src/components/admin_console/org_role_management/
├── index.ts                          # 변경 없음 (재수출만)
├── org_role_management.tsx           # 잔여 인라인 리터럴(약 6건) FormattedMessage 전환
├── org_role_management_body.tsx      # 주 변경 대상: 선택 state, dirty 계산, 일괄지정 툴바,
│                                      #   순차 일괄 저장, 행별 저장 버튼/컬럼 제거,
│                                      #   기존 인라인 리터럴(약 63건) 전체 FormattedMessage 전환
├── org_role_management.scss          # 체크박스 열 + 일괄 지정 툴바 스타일 추가
└── org_role_management.test.tsx      # 신규/회귀 테스트 추가 (기존 fetch mock 패턴 확장),
                                       #   FormattedMessage 전환에 따른 쿼리 방식 조정 포함

webapp/channels/src/i18n/
├── en.json                           # 신규 admin.org_role_management.* 메시지 id 추가 (npm run i18n-extract로 추출)
└── ko.json                           # 동일 id의 한국어 번역 동시 추가
```

서버(`server/channels/api4/team.go`, `server/channels/app/org_role.go`, `server/public/model/org_role.go`, `server/channels/store/sqlstore/org_role_store.go`)는 이번 변경에서 수정하지 않는다 — 기존 단건 GET/PUT 엔드포인트를 그대로 재사용한다.

**Structure Decision**: 기존 모노레포 구조(`server/` + `webapp/`)를 그대로 사용하며, 이번 기능은 `webapp/channels` 내 단일 컴포넌트 디렉터리로 범위가 완전히 국한된다. 별도의 신규 디렉터리·모듈·공유 패키지는 만들지 않는다(공유 프론트엔드 모델 파일 부재는 기존 이슈로, Risks에 기록하되 이번 범위에서 해결하지 않음).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| 해당 없음 | Constitution Check 7개 원칙 모두 PASS — 정당화가 필요한 위반 항목 없음 | — |

**참고**: 원칙 V(i18n 동기화)는 이번에 수정하는 두 파일(`org_role_management.tsx`, `org_role_management_body.tsx`) 전체의 사용자 노출 문자열(신규 + 기존 리터럴 약 69건)을 `FormattedMessage`/`en.json`/`ko.json`으로 정상 전환하기로 결정되어 위반이 아닌 정상 준수 사례다. 이 결정으로 diff 크기가 커지지만(신규 기능 로직 변경 + 문자열 전환이 같은 커밋/PR에 포함), 범위는 여전히 이번 기능이 원래 수정하던 두 파일 내부로 한정되어 있다. `org_role_management` 디렉터리 밖(부서/직위 CRUD를 포함해 이번 변경이 손대지 않는 다른 admin_console 컴포넌트)의 i18n 미적용 사례는 이번 스펙 범위 밖이며 후속 과제로 남긴다.
