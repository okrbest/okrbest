# Implementation Plan: 직책 관리 (직위와 분리된 보직 체계)

**Branch**: `feat/permission` | **Date**: 2026-07-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-org-duty-management/spec.md`

## Summary

직위(직급)와 별개의 직책(보직) 마스터를 도입한다. `PositionDefinitions` 테이블에
`Kind` 컬럼('position'|'duty')을 추가해 한 테이블에서 두 마스터를 구분 관리하고,
`UserOrgProfiles`에 `PrimaryDutyID`를 추가해 사용자당 직책 1개를 배정한다. 기존
CRUD·코드 생성·감사·정렬을 그대로 재사용하며, 표시 형식은 003 계층 위에
"본부 > 부서 · 직책 · 직위"로 확장한다(직책 미지정 시 항목 생략).

## Technical Context

**Language/Version**: Go 1.24.6 (server), TypeScript 5.6 + React (webapp)

**Primary Dependencies**: 003에서 확장한 org_role 모듈 — `server/public/model/org_role.go`,
`server/channels/app/org_role.go`, `server/channels/store/sqlstore/org_role_store.go`,
`server/channels/api4/team.go`(routes), webapp `org_role_management_body.tsx`,
`profile_popover_org_role.tsx`, `user_settings_general.tsx`, `client4.ts`

**Storage**: PostgreSQL — **마이그레이션 1건 신규**(000153, up/down 한 쌍):
`PositionDefinitions.Kind` varchar(32) NOT NULL DEFAULT 'position' +
`UserOrgProfiles.PrimaryDutyID` varchar(26) NOT NULL DEFAULT ''.
`db/migrations/`는 CODEOWNERS 보호 경로 — PR 리뷰 시 명시 필요.
마이그레이션 파일은 `server/channels/db/assets.go`의 go:embed 글롭에 자동 포함

**Testing**: Go colocated `_test.go`(gotestsum), webapp Jest + RTL

**Target Platform**: Mattermost 포크(okrbest) 서버 + 웹앱

**Project Type**: 웹 서비스 모노레포 (server + webapp)

**Performance Goals**: 기존 리스트 API 재사용(kind는 응답 필드 추가일 뿐) — 추가
쿼리·조회 없음

**Constraints**: 기존 직위 데이터 무손실(DEFAULT 'position' 자동 수용), upstream
구조 변경 최소화, 003 커밋(27f7c2e79b) 위에서 작업

**Scale/Scope**: 마이그레이션 2파일(up/down) + 서버 5파일(model·store·app·app_test·
api4_test) + 웹앱 4파일(body·popover·settings·client4) + i18n 4파일

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획 반영) | 003과 동일 게이트 절차를 완료 조건에 포함 |
| II. npm workspaces 전용 | PASS | 신규 의존성 없음 |
| III. 동작 변경 시 테스트 동반 | PASS(계획 반영) | kind 검증·교차 배정 차단·summary·UI 전부 TDD |
| IV. 라이선스·리브랜드 | PASS | 기존 파일 수정 + 마이그레이션 SQL 신규 |
| V. i18n 동기화 | PASS(계획 반영) | 신규 문구 en/ko 동시 (FR-011) |
| VI. 집중 브랜치 + Conventional Commits | PASS(주의 1) | 단일 기능 커밋. **주의: `db/migrations/`는 CODEOWNERS 보호 경로(`@okrbest/okrbest`) — PR 리뷰에서 마이그레이션 명시 검토 필요** |
| VII. Spec 주도 워크플로 | PASS | specify→plan(현재)→tasks→implement |

위반 없음 — Complexity Tracking 불필요. (마이그레이션은 위반이 아니라 보호 경로
접촉 — 리뷰 명시로 충분)

## Project Structure

### Documentation (this feature)

```text
specs/004-org-duty-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── org-duty-api.md
└── tasks.md             # /speckit-tasks 산출물 (이 명령에서 생성 안 함)
```

### Source Code (repository root)

```text
server/
├── channels/db/migrations/postgres/
│   ├── 000153_add_kind_and_primary_duty.up.sql    # 신규: Kind, PrimaryDutyID 컬럼
│   └── 000153_add_kind_and_primary_duty.down.sql  # 신규: 롤백
├── public/model/org_role.go                  # PositionDefinition.Kind, UserOrgProfile.PrimaryDutyID, Summary.DutyName, kind 무상태 검증
├── channels/store/sqlstore/org_role_store.go # SELECT/INSERT/UPDATE에 Kind·PrimaryDutyID 반영 + GetPositionDefinition(단건) 추가
├── channels/app/org_role.go                  # code prefix 'duty', 교차 배정 검증(kind 일치), summary duty_name 채움
├── channels/app/org_role_test.go             # 상기 로직 TDD
├── channels/api4/team_org_roles_test.go      # kind CRUD·교차 배정 400·summary API
└── i18n/{en,ko}.json                         # 교차 배정 에러 문구

webapp/
├── platform/client/src/client4.ts            # UserOrgProfileSummary.duty_name
└── channels/src/
    ├── components/admin_console/org_role_management/
    │   ├── org_role_management_body.tsx      # 직책 리스트 섹션·배정 select 컬럼·필터·일괄 지정
    │   └── org_role_management.test.tsx
    ├── components/profile_popover/profile_popover_org_role.tsx    # "· 직책 · 직위" 표기
    ├── components/user_settings/general/user_settings_general.tsx # 읽기 전용 직책 행
    └── i18n/{en,ko}.json
```

**Structure Decision**: 003과 동일하게 기존 org_role 모듈 내 확장. 신규 파일은
마이그레이션 up/down 2개뿐 — 코드 파일 신설 없음.

## Complexity Tracking

위반 없음 — 해당 없음.
