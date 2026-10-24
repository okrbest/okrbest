# Implementation Plan: 첫 화면(로그인 랜딩) 설정

**Branch**: `031-landing-product-setting` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/031-landing-product-setting/spec.md`

## Summary

목적지 없이 로그인한 사용자의 도착 화면을 "도착 팀의 팀별 개인 설정 > 모든 팀 공통
개인 설정 > 팀 기본값 > 채널" 순서로 정한다. 팀 기본값은 Teams 테이블에
`LandingProduct` 컬럼을 추가하고 기존 `patchTeam` API·`MANAGE_TEAM` 권한을
재사용한다. 개인 설정은 테마와 같은 패턴(preference name=팀 ID, 공통은 `''`)으로
서버 preference에 저장한다. 판정과 이동은 로그인 리다이렉트가 수렴하는
`redirectUserToDefaultTeam` 한 곳에서 수행하고, 제품(보드·플레이북)이 선택된
경우에만 플러그인 초기화 완료를 기다린 뒤 이동한다. 저장값은 플러그인 상태와
무관하게 보존해서, 재설치 시 설정이 자동으로 되살아난다.

## Technical Context

**Language/Version**: Go 1.26.2 (server), TypeScript 5.6 + React (webapp)

**Primary Dependencies**: 기존 메커니즘만 재사용 — `patchTeam` API(서버·webapp),
preferences API(`savePreferences`), plugin registry의 product 등록
(`selectProducts`), `SettingItemMax`/`SaveChangesPanel` UI 패턴. 신규 외부 의존성
없음 (원칙 II: lockfile 변경 없음).

**Storage**: PostgreSQL — Teams 테이블 컬럼 1개 추가(`LandingProduct VARCHAR(32)
NOT NULL DEFAULT ''`, 마이그레이션 000235). 개인 설정은 기존 Preferences 테이블
(category `landing_product`, name=팀 ID 또는 `''`). MySQL 마이그레이션은 000153
이후 동결 관례를 따라 추가하지 않는다.

**Testing**: server — gotestsum(`make test-server`), 접촉 패키지 단위 테스트
colocated. webapp — Jest + React Testing Library(`TZ=UTC`). 게이트:
`make check-style`, `npm run check`, `npm run check-types`, `npm run test`.

**Target Platform**: 웹앱(브라우저·데스크톱 앱). 모바일 네이티브 앱 범위 밖.

**Project Type**: 모노레포 web application (`server/` Go + `webapp/` React).

**Performance Goals**: 설정이 채널(기본)인 사용자의 로그인 경로에 추가 지연 0.
제품 설정 사용자는 플러그인 초기화 대기 상한 5초, 초과 시 채널로 대체.

**Constraints**: preference category·name 각 32자 제한(팀 ID 26자라 name에 접두사
불가 → category를 신규로 만들고 name=팀 ID). DB 마이그레이션 디렉터리는 CODEOWNERS
보호 경로. 라이선스 존: `server/public`(Apache-2.0), 그 외 서버 코드(AGPL),
`webapp/`(Apache-2.0) — 기존 저작권 헤더 유지.

**Scale/Scope**: 전체 로그인 사용자의 공통 경로를 건드린다. 회귀 위험이 기능
크기보다 크므로 미설정 사용자 경로의 불변(SC-004)을 테스트로 고정한다.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| I. 패키지별 품질 게이트 | server·webapp 둘 다 닿는다. 구현 전 기준선(실패 목록) 저장, 마감 때 diff 제시 | PASS (계획에 반영) |
| II. npm workspaces 전용 | 신규 의존성 없음, lockfile 변경 없음 | PASS |
| III. 실패를 본 테스트만 인정 | 판정 로직·설정 UI·서버 모델 모두 실패 출력 선행. tasks 단계에서 테스트 과제를 구현 과제 앞에 배치 | PASS (계획에 반영) |
| IV. 라이선스·리브랜드 | 기존 파일 수정 위주, 신규 파일은 Mattermost 저작권 헤더 유지 | PASS |
| V. i18n 동기화 | 신규 표시 문자열을 `en.json`·`ko.json` 같은 변경에서 추가 | PASS (계획에 반영) |
| VI. 집중 브랜치 + PR | 브랜치 `031-landing-product-setting`를 파일 편집 전에 생성함. rebase merge 전용. 마이그레이션·CODEOWNERS 경로는 PR에서 명시 | PASS |
| VII. Spec 주도 워크플로 | specify → plan(본 문서) → tasks → implement 순서 준수. 구현 규율은 implement의 3-bis에서 로드 | PASS |
| VIII. 명세 문서 언어·문체 | 본 산출물 전부 한국어, 식별자·경로·명령 원형 유지 | PASS |

위반 없음 — Complexity Tracking 비움.

**Post-Design Re-check (Phase 1 후)**: 설계가 기존 API·권한·테이블을 재사용하고
신규 엔드포인트·권한·의존성을 만들지 않으므로 위 판정 유지. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/031-landing-product-setting/
├── spec.md              # 기능 명세 (/speckit-specify 산출)
├── plan.md              # 본 문서 (/speckit-plan 산출)
├── research.md          # Phase 0 산출
├── data-model.md        # Phase 1 산출
├── quickstart.md        # Phase 1 산출 — 종단 검증 가이드
├── contracts/
│   └── api.md           # Phase 1 산출 — patchTeam 확장·preference 계약
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트 (통과)
└── tasks.md             # Phase 2 산출 (/speckit-tasks — 본 명령이 만들지 않음)
```

### Source Code (repository root)

```text
server/
├── public/model/
│   ├── team.go                          # Team·TeamPatch에 LandingProduct 추가, 값 검증
│   └── team_test.go                     # Patch·검증 테스트
├── channels/
│   ├── db/migrations/postgres/
│   │   ├── 000235_add_teams_landing_product.up.sql
│   │   └── 000235_add_teams_landing_product.down.sql
│   ├── db/migrations/migrations.list    # 신규 2줄 추가
│   └── store/sqlstore/
│       └── team_store.go                # 컬럼 목록 3곳(select/insert/update) 반영
└── channels/store/storetest/team_store.go  # 저장·조회 왕복 테스트

webapp/
├── platform/types/src/teams.ts          # Team 타입에 landing_product 추가
├── channels/src/
│   ├── utils/constants.tsx              # Preferences 카테고리·값 상수, LandingProducts 상수
│   ├── packages/mattermost-redux/src/
│   │   └── selectors/entities/preferences.ts  # getLandingPreference 셀렉터(테마 패턴)
│   ├── selectors/landing.ts             # 최종 판정 셀렉터(개인>공통>팀>채널 + 가용성)
│   ├── actions/global_actions.tsx       # redirectUserToDefaultTeam에 판정·이동 분기
│   ├── components/root/root.tsx         # 제품 초기화 Promise 노출(리다이렉트 대기 배선)
│   ├── components/user_settings/display/
│   │   ├── index.ts                     # props 매핑
│   │   ├── user_settings_display.tsx    # 섹션 등록
│   │   └── landing_product/             # 신규 섹션(라디오 + 모든 팀 적용 체크박스)
│   ├── components/team_settings/team_info_tab/
│   │   └── team_landing_section.tsx     # 팀 기본값 섹션(드롭다운, patchTeam 경유)
│   └── i18n/{en.json, ko.json}          # 신규 문자열 동시 추가
```

**Structure Decision**: 모노레포의 기존 배치를 그대로 따른다. 서버는 모델·스토어·
마이그레이션 세 층만 닿고 API 층은 변경하지 않는다(기존 `patchTeam`이 TeamPatch를
그대로 통과시키므로). webapp은 판정 로직을 셀렉터로 분리해 `global_actions.tsx`
변경을 최소화하고, 설정 UI 두 곳은 각 모달의 기존 섹션 패턴을 복제한다.

## 구현 단계 개요 (Phase 2 준비)

1. **server 모델·마이그레이션** — `LandingProduct` 필드·검증·Patch, 마이그레이션
   000235, 스토어 컬럼 반영. 테스트 선행.
2. **webapp 판정 로직** — preference 상수·셀렉터, 최종 판정 셀렉터,
   `redirectUserToDefaultTeam` 분기와 플러그인 초기화 대기. 테스트 선행.
3. **개인 설정 UI** — 디스플레이 탭 신규 섹션(활성 제품만 노출, 모든 팀 적용).
4. **팀 설정 UI** — 정보 탭 신규 섹션(`patchTeam` 저장, 활성 제품만 노출).
5. **i18n·게이트·종단 검증** — en/ko 동시, 기준선 diff, quickstart 실주행,
   SC-001~004 실측.

위험과 결정 근거는 [research.md](research.md), 데이터 구조는
[data-model.md](data-model.md), 계약은 [contracts/api.md](contracts/api.md),
검증 절차는 [quickstart.md](quickstart.md)에 있다.

## Complexity Tracking

위반 없음 — 비움.
