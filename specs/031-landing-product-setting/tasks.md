# Tasks: 첫 화면(로그인 랜딩) 설정

**Input**: Design documents from `/specs/031-landing-product-setting/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md)

**Tests**: constitution 원칙 III이 요구한다 — 테스트 과제는 **구현 전 실패 출력**을
남긴 뒤에만 완료로 표시한다. 첫 실행부터 통과한 테스트는 구현을 되돌려 실패를
확인하거나 과제 옆에 `미검증`으로 적는다.

**Organization**: 사용자 스토리 단위로 묶어 각 스토리를 독립적으로 구현·검증한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (서로 다른 파일, 미완료 과제 의존 없음)
- **[Story]**: 소속 사용자 스토리 (US1, US2, US3)

## Path Conventions

모노레포: `server/`(Go), `webapp/`(React+TS). 구체 경로는 plan.md의 Source Code
배치를 따른다.

---

## Phase 1: Setup — 게이트 기준선 (원칙 I)

**Purpose**: 변경 전 실패 목록을 저장해 마감 때 diff로 회귀를 판정한다.

- [X] T001 [P] server 게이트 기준선 저장 — `cd server && make check-style && make test-server` 출력(실패 목록)을 `specs/031-landing-product-setting/evidence/baseline-server.md`에 기록. Go 테스트는 `TEST_DATABASE_POSTGRESQL_DSN` 필요(컨테이너 비밀번호는 `docker inspect`)
- [X] T002 [P] webapp 게이트 기준선 저장 — `cd webapp && npm run check && npm run check-types && npm run test` 출력(실패 목록)을 `specs/031-landing-product-setting/evidence/baseline-webapp.md`에 기록

---

## Phase 2: Foundational — 판정 엔진 (모든 스토리의 전제)

**Purpose**: 상수·타입·판정 셀렉터·리다이렉트 분기. 이게 없으면 어떤 스토리도
동작하지 않는다.

**⚠️ CRITICAL**: 이 Phase 완료 전에는 사용자 스토리 작업을 시작하지 않는다.

- [X] T003 [P] preference·제품 상수 추가 — `webapp/channels/src/utils/constants.tsx`(기존 Preferences 상수 옆)에 category `landing_product`, 값 상수(`channels`/`boards`/`playbooks`), product 등록 대기 상한 5000ms. 규약은 [data-model.md](data-model.md) 엔티티 2
- [X] T004 [P] Team 타입 확장 — `webapp/platform/types/src/teams.ts`의 `Team`에 `landing_product?: string` 추가(서버 반영 전이므로 optional, 셀렉터는 부재를 `''`로 취급)
- [X] T005 판정 셀렉터 테스트 작성(RED) — `webapp/channels/src/selectors/landing.test.ts` 신규. [data-model.md](data-model.md) 판정 함수 기준으로 우선순위 4단계(팀별 개인 > 공통 개인 > 팀 기본 > 채널) × product 등록/미등록 매트릭스, 알 수 없는 value 무시 케이스. **실패 출력을 과제 완료 증거로 기록**
- [X] T006 판정 셀렉터 구현(GREEN) — `webapp/channels/src/selectors/landing.ts` 신규. `resolveLandingProduct(state, teamId)`. preference 2단 조회는 테마 선례(`getThemePreference`), 가용성은 `selectProducts`. T005 전부 통과
- [X] T007 리다이렉트 분기 테스트 작성(RED) — `webapp/channels/src/actions/global_actions` 기존 테스트 파일 확장. 케이스: ① 설정 없음 → 기존 채널 URL 불변(SC-004 고정) ② 판정 boards + product 등록됨 → `/boards` push ③ 판정 boards + 미등록 + 대기 상한 초과 → 채널로 대체, preference 변형 없음. **실패 출력 기록**
- [X] T008 리다이렉트 분기 구현(GREEN) — `webapp/channels/src/actions/global_actions.tsx`의 `redirectUserToDefaultTeam`: 도착 팀 확정 후 `resolveLandingProduct` 호출, 판정이 제품이면 `root.tsx`의 `initializeProducts`/`initializePlugins` 완료를 기다릴 수 있게 Promise를 노출·대기(상한 5초) 후 재판정, 제품이면 해당 baseURL push, 아니면 기존 채널 경로. 계약은 [contracts/api.md](contracts/api.md) §3. T007 전부 통과

**Checkpoint**: 판정 엔진 완성 — 스토리 구현 시작 가능.

---

## Phase 3: User Story 1 — 구성원이 자기 첫 화면을 정한다 (P1) 🎯 MVP

**Goal**: 디스플레이 설정에서 첫 화면을 고르면 다음 로그인부터 적용된다(공통 설정,
name=`''`).

**Independent Test**: 구성원 계정으로 보드 저장 → 재로그인 → 보드 도착.
팀 기본값 기능 없이 검증 가능.

- [X] T009 [US1] 개인 설정 섹션 테스트 작성(RED) — `webapp/channels/src/components/user_settings/display/landing_product/landing_product.test.tsx` 신규. 케이스: 활성 제품만 라디오 노출(FR-007), "보드" 저장 시 `savePreferences`가 `{category: landing_product, name: '', value: 'boards'}`로 호출, "팀 기본값 따르기" 저장 시 `deletePreferences` 호출, 저장값이 비활성 제품이면 표시 상태는 기본값이되 저장값은 바뀌지 않음(FR-006 UI 측). **실패 출력 기록**
- [X] T010 [US1] 개인 설정 섹션 구현 — `webapp/channels/src/components/user_settings/display/landing_product/{index.ts, landing_product.tsx}` 신규. 라디오 4개(팀 기본값 따르기/채널/보드/플레이북), `SettingItem`/`SettingItemMax` + 독립 서브컴포넌트 선례(`limit_visible_gms_dms`). 노출 판정은 `useGetPluginsActivationState`. 신규 문자열은 `webapp/channels/src/i18n/en.json`·`ko.json` 같은 커밋에 동시 추가(원칙 V). T009 전부 통과
- [X] T011 [US1] 디스플레이 탭 배선 — `webapp/channels/src/components/user_settings/display/user_settings_display.tsx`에 섹션 등록(render 순서 포함), `webapp/channels/src/components/user_settings/display/index.ts`에 props 매핑. 기존 스냅샷 갱신
- [ ] T012 [US1] US1 수용 시나리오 실주행 — [quickstart.md](quickstart.md) 시나리오 1(SC-001·SC-002). 결과를 `specs/031-landing-product-setting/evidence/us1.md`에 기록. webapp dev 번들은 `npm run run`으로만; 재빌드 후 보드·플레이북 404면 플러그인 재활성화. US1 수용 시나리오 3(개인 설정이 팀 기본값을 덮음)은 팀 기본값이 필요하므로 T019에서 함께 검증

**Checkpoint**: US1 단독으로 MVP 성립 — 여기까지만 배포해도 가치가 있다.

---

## Phase 4: User Story 2 — 팀 관리자가 팀 기본 첫 화면을 정한다 (P2)

**Goal**: 팀 설정 정보 탭에서 팀 기본값을 저장하면, 개인 설정 없는 구성원이 그
화면에 도착한다.

**Independent Test**: 팀 기본값=플레이북 저장 → 개인 설정 없는 구성원 로그인 →
플레이북 도착.

- [X] T013 [P] [US2] 서버 모델 테스트 작성(RED) — `server/public/model/team_test.go`: `TeamPatch.LandingProduct` 반영, `IsValid`가 `''`/`boards`/`playbooks` 외 값을 거부. **실패 출력 기록**
- [X] T014 [US2] 서버 모델 구현(GREEN) — `server/public/model/team.go`: `Team.LandingProduct string` (json `landing_product`), `TeamPatch.LandingProduct *string`, `Patch()` 반영, `IsValid()` 검증. `Sanitize()` 변경 없음. T013 전부 통과
- [X] T015 [US2] DB 마이그레이션 — `server/channels/db/migrations/postgres/000235_add_teams_landing_product.{up,down}.sql` + `server/channels/db/migrations/migrations.list` 2줄. 내용은 [data-model.md](data-model.md) 엔티티 1. CODEOWNERS 보호 경로 — PR 설명에 명시
- [X] T016 [US2] 스토어 반영 — `server/channels/store/sqlstore/team_store.go` 명시적 컬럼 목록 3곳(select `:231` 부근, INSERT `:297-300`, UPDATE `:337`)에 `LandingProduct` 추가. `server/channels/store/storetest/team_store.go`에 저장·조회 왕복 테스트(실패 선행 — 모델만 있고 스토어 미반영 상태에서 RED 확인)
- [X] T017 [P] [US2] 팀 설정 섹션 테스트 작성(RED) — `webapp/channels/src/components/team_settings/team_info_tab/team_landing_section.test.tsx` 신규: 활성 제품만 노출, 저장 시 `patchTeam({id, landing_product})` 호출. **실패 출력 기록**
- [X] T018 [US2] 팀 설정 섹션 구현 — `webapp/channels/src/components/team_settings/team_info_tab/team_landing_section.tsx` 신규(`team_name_section` 선례, `SaveChangesPanel` 일괄 저장에 합류), `team_info_tab.tsx` 배선. i18n en/ko 동시 추가(원칙 V). T017 전부 통과
- [ ] T019 [US2] US2 수용 시나리오 실주행 — [quickstart.md](quickstart.md) 시나리오 2 + 권한 확인(일반 구성원은 변경 불가). 결과를 `evidence/us2.md`에 기록

**Checkpoint**: 팀 기본값까지 동작 — 우선순위 전 단계가 실데이터로 검증 가능.

---

## Phase 5: User Story 3 — 구성원이 팀마다 다른 첫 화면을 정한다 (P3)

**Goal**: 개인 설정을 "현재 팀에만 적용"할 수 있다(테마와 같은 UX).

**Independent Test**: A팀에만 보드, 공통은 채널 저장 → 마지막 사용 팀을 바꿔 가며
재로그인해 도착 화면 비교.

- [ ] T020 [US3] 팀별 저장 테스트 확장(RED) — `landing_product.test.tsx`에 추가: "모든 팀에 적용" 해제 시 `name=currentTeamId`로 저장, 체크 시 `name=''` 저장과 동시에 팀별 키 삭제(테마 `deleteTeamSpecificThemes` 의미론). **실패 출력 기록**
- [ ] T021 [US3] 팀별 저장·체크박스 구현 — `landing_product.tsx`에 "모든 팀에 적용" 체크박스 추가(테마 `applyToAllTeams` 선례). i18n en/ko 동시. T020 전부 통과. 판정 셀렉터는 Phase 2에서 이미 2단 조회를 지원하므로 변경 없음
- [ ] T022 [US3] US3 수용 시나리오 실주행 — [quickstart.md](quickstart.md) 시나리오 3. 결과를 `evidence/us3.md`에 기록

---

## Phase 6: Polish — 엣지·회귀·완료 증거

**Purpose**: 스토리 밖 엣지 검증과 원칙 I·III 완료 증거.

- [ ] T023 플러그인 비활성·재설치 실주행 — [quickstart.md](quickstart.md) 시나리오 4(SC-003: 저장값 보존·자동 복원, 설정 UI 선택지 미노출) + 시나리오 5(SC-004 회귀: 미설정 계정, `redirect_to`, 무소속, 팀 전환 불변). 결과를 `evidence/edge.md`에 기록
- [ ] T024 게이트 재실행과 기준선 diff — T001·T002와 같은 명령 재실행, 실패 목록을 기준선과 비교해 **diff 0건**을 `evidence/final-gates.md`에 기록. `make mocks` 재생성 필요 여부와 `go mod tidy` 클린 확인 포함
- [ ] T025 SC 실측값 기록 — SC-001(추가 클릭 수), SC-002(설정 소요 시간), SC-003(재설치 후 추가 설정 수), SC-004(회귀 건수)를 `specs/031-landing-product-setting/evidence/sc-results.md`에 기록 (030 선례: 검증 증거 docs 커밋)

---

## Dependencies & Execution Order

```text
Phase 1 (T001·T002, 병렬)
  └─▶ Phase 2 (T003·T004 병렬 → T005 → T006 → T007 → T008)
        └─▶ Phase 3 US1 (T009 → T010 → T011 → T012)   🎯 MVP
              └─▶ Phase 4 US2 (server: T013 → T014 → T015 → T016
                               webapp: T017 → T018  ← server와 병렬 가능
                               → T019는 양쪽 완료 후)
                    └─▶ Phase 5 US3 (T020 → T021 → T022)
                          └─▶ Phase 6 (T023 → T024 → T025)
```

- 스토리 간 코드 의존은 없다(판정 엔진이 Phase 2에 있으므로). 순서는 우선순위와
  실주행 검증 편의 기준이다. US2의 server 묶음(T013~T016)과 webapp 묶음
  (T017~T018)은 병렬로 진행할 수 있다.
- US1 없이 US2만 구현해도 동작하지만, 실주행 검증(T019)은 "개인 설정이 팀
  기본값을 덮는다" 확인을 위해 US1 이후가 편하다.

## Parallel Execution Examples

- Phase 1: T001과 T002를 동시에.
- Phase 2 진입: T003(constants)과 T004(Team 타입)를 동시에.
- Phase 4: T013(서버 모델 테스트)과 T017(팀 설정 UI 테스트)을 동시에 — 서로 다른
  패키지라 충돌 없음.

## Implementation Strategy

1. **MVP 먼저**: Phase 1 → 2 → 3까지가 배포 가능한 최소 단위다(개인 설정만으로
   핵심 가치 성립).
2. **증분 전달**: 각 Phase Checkpoint에서 실주행 증거를 남기고 작업 단위로
   커밋한다(커밋 정책: 작업 단위마다 커밋 의사 확인).
3. **증거 없으면 완료 아님**: RED 출력(T005·T007·T009·T013·T016·T017·T020),
   기준선 diff(T024), SC 실측(T025)이 완료 선언의 조건이다(원칙 I·III).
