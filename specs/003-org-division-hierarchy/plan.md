# Implementation Plan: 본부-부서 계층 관리 (조직 계층 구조)

**Branch**: `feat/permission` | **Date**: 2026-07-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-org-division-hierarchy/spec.md`

## Summary

기존 부서/직위 관리(OrgUnits·PositionDefinitions·UserOrgProfiles)에 본부(division)
계층을 추가한다. DB 스키마 변경 없이 `OrgUnit.Type`에 `division` 값을 추가하고
기존 `ParentID` 컬럼을 활용한다. v1은 본부-부서 2단계 고정이며, 깊이 제한은 저장
시 검증 규칙으로만 강제해 향후 n단계 확장 시 검증 완화만으로 대응한다. 사용자
주 소속은 본부·부서 모두 허용하고, 프로필 카드는 "본부명 > 부서명" 계층으로
표시한다. 기존 무소속 부서는 마이그레이션 없이 "미소속" 그룹으로 수용한다.

## Technical Context

**Language/Version**: Go 1.24.6 (server), TypeScript 5.6 + React (webapp)

**Primary Dependencies**: 기존 org_role 모듈 재사용 — `server/public/model/org_role.go`,
`server/channels/app/org_role.go`, `server/channels/api4/team.go`(routes 76-82),
webapp `components/admin_console/org_role_management/`,
`components/profile_popover_org_role/`

**Storage**: PostgreSQL — 기존 `OrgUnits` 테이블(Type·ParentID 컬럼·인덱스 기존재,
마이그레이션 000150). **신규 마이그레이션 없음**

**Testing**: Go colocated `_test.go`(gotestsum), webapp Jest + RTL(`TZ=UTC`)

**Target Platform**: Mattermost 포크(okrbest) 서버 + 웹앱

**Project Type**: 웹 서비스 모노레포 (server + webapp)

**Performance Goals**: 조직 단위 수백 개·사용자 수천 명 규모 팀에서 관리 화면 조회
체감 지연 없음(기존 리스트 API 재사용, 추가 쿼리 없음)

**Constraints**: DB 스키마·마이그레이션 변경 금지(CODEOWNERS 보호 경로 회피),
기존 무소속 부서 무마이그레이션 수용, upstream 구조 변경 최소화

**Scale/Scope**: 서버 파일 3개(model/app/api4 검증·가드·summary 확장), 웹앱
컴포넌트 2곳(관리 화면·프로필 카드) + i18n 2파일(en/ko)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획 반영) | server: `make check-style`+`test-server`, webapp: `npm run check`+`check-types`+`test`를 완료 조건에 포함 |
| II. npm workspaces 전용 | PASS | 신규 의존성 없음 |
| III. 동작 변경 시 테스트 동반 | PASS(계획 반영) | 검증·가드·summary·그룹핑·필터 각각 테스트 추가. TDD로 진행 |
| IV. 라이선스·리브랜드 | PASS | 기존 파일 수정만, 헤더 유지. `server/public`(Apache-2.0)·기타 서버(AGPL)·webapp(Apache-2.0) 존 준수 |
| V. i18n 동기화 | PASS(계획 반영) | 신규 문구 en.json·ko.json 동시 갱신 (FR-014) |
| VI. 집중 브랜치 + Conventional Commits | PASS | 단일 기능 브랜치, `feat:` 커밋. 마이그레이션 디렉터리 비접촉 |
| VII. Spec 주도 워크플로 | PASS | specify→plan(현재)→tasks→implement 순서 준수 |

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/003-org-division-hierarchy/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
├── contracts/
│   └── org-division-api.md
└── tasks.md             # /speckit-tasks 산출물 (이 명령에서 생성 안 함)
```

### Source Code (repository root)

```text
server/
├── public/model/org_role.go                 # OrgUnit 검증 확장(division), Summary 필드 추가
├── channels/app/org_role.go                 # code prefix 'div', parent 검증, 비활성화 가드, summary 계층 조회
├── channels/app/org_role_test.go            # 상기 로직 단위 테스트
├── channels/api4/team.go                    # 라우트 변경 없음(기존 org-units CRUD 재사용)
└── channels/api4/team_org_roles_test.go     # API 레벨 가드·summary 테스트

webapp/channels/src/
├── components/admin_console/org_role_management/
│   ├── org_role_management.tsx              # 본부 추가 버튼·본부 리스트 섹션
│   ├── org_role_management_body.tsx         # 부서 그룹핑·이관 select·배정 optgroup·본부 필터
│   └── org_role_management.test.tsx         # 컴포넌트 테스트
├── components/profile_popover_org_role/     # "본부 > 부서" 표시
├── components/user_settings/general/        # 계정 설정 읽기 전용 소속 행 계층 표기 (FR-010)
└── i18n/{en,ko}.json                        # 신규 문구
```

**Structure Decision**: 기존 org_role 모듈 구조를 그대로 따른다. 신규 파일은
만들지 않는 것을 원칙으로 하되, 웹앱 그룹핑 로직이 body 컴포넌트를 과도하게
키우면 하위 컴포넌트 분리를 허용한다(기존 파일 118줄/대형 body 파일 상황 고려).

## Complexity Tracking

위반 없음 — 해당 없음.
