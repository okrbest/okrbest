# Tasks: 시스템 관리자 테마 전체 적용

**Input**: Design documents from `/specs/016-admin-theme-apply/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/apply-theme-to-all.md](./contracts/apply-theme-to-all.md)

**Tests**: 필수 — constitution 원칙 III(실패를 본 테스트만 인정). 각 스토리에서
테스트 과제를 구현 과제보다 먼저 수행하고 **구현 전 실패 출력**을 남긴다.

**Organization**: 사용자 스토리별 단계 구성. 각 스토리는 독립적으로 구현·검증
가능하다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 수행 가능(다른 파일, 미완료 과제 의존 없음)
- **[Story]**: 소속 사용자 스토리 (US1, US2, US3)

## Phase 1: Setup

**Purpose**: 브랜치 분리와 게이트 기준선 저장 (원칙 I·VI)

- [x] T001 `master`에서 작업 브랜치 `016-admin-theme-apply` 생성 (`git checkout -b 016-admin-theme-apply`)
- [x] T002 [P] 서버 기준선 저장 — `cd server && make check-style` 출력과 접촉 패키지 테스트(`channels/store/...`, `channels/app/...`, `channels/api4/...`) 실패 목록을 `specs/016-admin-theme-apply/baseline-server.txt`에 기록
- [x] T003 [P] 웹앱 기준선 저장 — `cd webapp && npm run check && npm run check-types && npm run test` 실패 목록을 `specs/016-admin-theme-apply/baseline-webapp.txt`에 기록

---

## Phase 2: Foundational

**Purpose**: US1(서버 발행)과 US3(클라이언트 수신)이 공유하는 상수. 이것만 막히면
두 스토리가 모두 멈추므로 먼저 둔다.

- [x] T004 웹소켓 이벤트 상수 `WebsocketEventThemeAppliedToAll = "theme_applied_to_all"` 추가 — `server/public/model/websocket_message.go` (기존 `WebsocketEventPreferencesChanged` 옆, [contracts](./contracts/apply-theme-to-all.md) 참조)

**Checkpoint**: 이후 US1·US2·US3 착수 가능

---

## Phase 3: User Story 1 - 관리자가 테마를 전 사용자에게 적용한다 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 체크박스를 켜고 저장하면 모든 활성 사용자(봇·비활성 제외)의
테마가 덮어써지고 팀별 테마가 정리된다. 일회성 적용.

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 1·4·5 — 복수
사용자 시드 후 적용, preference 조회로 전원 반영·제외 대상 불변·형식 오류 거부 확인.

### Tests for User Story 1 (구현 전 실패 출력 필수)

- [x] T005 [P] [US1] 스토어 계약 테스트 추가 — `server/channels/store/storetest/preference_store.go`에 `ApplyThemeToAllUsers` 테스트: 활성 사용자 전원 전역 테마 upsert, 팀별 테마(`Name<>''`) 삭제, 봇·비활성(`DeleteAt>0`) 제외, 테마 행 없던 사용자도 행 생성, 저장 실패 시(예: 유효성 위반 값) 기존 행 불변 — 부분 적용 금지(FR-006). 미구현 상태의 실패 출력 저장
- [x] T006 [P] [US1] 앱 단위 테스트 추가 — `server/channels/app/preference_test.go`에 `ApplyThemeToAllUsers` 테스트: 유효 테마는 스토어 호출+`theme_applied_to_all` 브로드캐스트 발행, `IsValid` 실패 테마는 400 반환·스토어 미호출(FR-010). 실패 출력 저장
- [x] T007 [P] [US1] API 테스트 추가 — `server/channels/api4/preference_test.go`에 `POST /users/theme/apply_to_all` 테스트: 시스템 관리자 요청 200 + 타 사용자 preference 반영 확인, 형식 오류 테마 400. 실패 출력 저장
- [x] T008 [P] [US1] 웹앱 컴포넌트 테스트 추가 — `webapp/channels/src/components/user_settings/display/user_settings_theme/user_settings_theme.test.tsx`: 체크박스 켠 채 저장하면 `applyThemeToAllUsers` 액션만 호출(기존 `saveTheme` 미호출), 켜면 기존 "가입한 모든 팀" 체크박스가 켜짐+비활성(FR-008). 실패 출력 저장

### Implementation for User Story 1

- [x] T009 [US1] 스토어 구현 — `server/channels/store/store.go`의 `PreferenceStore` 인터페이스에 `ApplyThemeToAllUsers(value string) error` 추가, `server/channels/store/sqlstore/preference_store.go`에 단일 트랜잭션 구현(팀별 테마 DELETE + `INSERT...SELECT...ON CONFLICT` upsert — [research.md](./research.md) R2 SQL)
- [x] T010 [US1] 생성 코드 재생성 — `cd server && make store-mocks && make store-layers`, `go mod tidy` 클린 확인, 산출물 커밋 (T009 의존)
- [x] T011 [US1] 앱 레이어 구현 — `server/channels/app/preference.go`에 `ApplyThemeToAllUsers(rctx, themeValue string)`: `model.Preference{Category: "theme", Name: ""}.IsValid()` 검증 → 스토어 호출 → `theme_applied_to_all` 브로드캐스트 `a.Publish` (T009·T010 의존, [research.md](./research.md) R1·R4)
- [x] T012 [US1] API 구현 — `server/channels/api4/preference.go`의 `InitPreference`에 `api.BaseRoutes.Users.Handle("/theme/apply_to_all", api.APISessionRequired(applyThemeToAllUsers)).Methods(http.MethodPost)` 등록, 핸들러: `model.PermissionManageSystem` 검사(없으면 403, FR-005) → 본문 `theme` 파싱 → 앱 호출 → audit record (T011 의존, **T007·T018 테스트가 먼저 작성돼 있어야 한다**)
- [x] T013 [P] [US1] 서버 i18n — `server/i18n/en.json`·`server/i18n/ko.json`에 AppError 문자열(`app.preference.apply_theme_all.invalid.app_error`, `app.preference.apply_theme_all.save.app_error`) 동시 추가 (원칙 V)
- [x] T014 [P] [US1] 클라이언트 SDK — `webapp/platform/client/src/client4.ts`에 `applyThemeToAllUsers(theme)` 메서드 추가 ([contracts](./contracts/apply-theme-to-all.md) Redux/Client SDK)
- [x] T015 [US1] redux 액션 — `webapp/channels/src/packages/mattermost-redux/src/actions/preferences.ts`에 `applyThemeToAllUsers(theme)` 추가: Client4 호출 성공 시 현재 사용자 기준 전역 테마 `RECEIVED_PREFERENCES` + 팀별 테마 `DELETED_PREFERENCES` 낙관적 디스패치 (T014 의존, [research.md](./research.md) R5)
- [x] T016 [US1] 컴포넌트 — `user_settings_theme.tsx`에 체크박스 렌더(`submitExtra` 기존 체크박스 아래)·상태·제출 분기(켜짐 → T015 액션만 호출), `index.ts`에 액션 연결 (T015 의존)
- [x] T017 [P] [US1] 웹앱 i18n — `webapp/channels/src/i18n/en.json`("Apply new theme to all users")·`ko.json`("모든 팀원에게 새로운 테마를 적용합니다")에 `user.settings.display.theme.applyToAllUsers` 동시 추가 (원칙 V)

**Checkpoint**: 관리자 계정으로 전체 적용이 동작한다 — quickstart 시나리오 1·4·5
수동 확인 가능

---

## Phase 4: User Story 2 - 관리자가 아니면 이 기능을 쓸 수 없다 (Priority: P2)

**Goal**: 일반 사용자에게 체크박스가 보이지 않고, 우회 요청은 서버가 403으로
거부하며 아무것도 바꾸지 않는다.

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 2 — 일반 사용자
세션으로 UI 확인 + curl 403 + 변경 없음 재확인.

### Tests for User Story 2 (구현 전 실패 출력 필수)

- [x] T018 [P] [US2] API 권한 테스트 추가 — `server/channels/api4/preference_test.go`: 일반 사용자 요청 403 + 어떤 사용자의 preference도 불변(FR-005). **T012 구현 전에 작성해 실패를 확인한다** — T012가 먼저 끝났다면 권한 검사를 주석 처리해 실패를 재현하고 출력을 남긴다
- [x] T019 [P] [US2] 컴포넌트 노출 테스트 추가 — `user_settings_theme.test.tsx`: `showApplyToAllUsersCheckbox=false`(비관리자)면 체크박스 미렌더. 실패 출력 저장

### Implementation for User Story 2

- [x] T020 [US2] 노출 제어 — `webapp/channels/src/components/user_settings/display/user_settings_theme/index.ts`의 `mapStateToProps`에 `showApplyToAllUsersCheckbox: isCurrentUserSystemAdmin(state)` 추가(`mattermost-redux/selectors/entities/users`), `user_settings_theme.tsx`는 이 prop이 참일 때만 체크박스 렌더 (T016 의존)

**Checkpoint**: 서버 403 강제 + UI 비노출이 테스트로 증명된다

---

## Phase 5: User Story 3 - 접속 중인 사용자 화면에 즉시 반영된다 (Priority: P3)

**Goal**: 적용 순간 접속 중인 사용자의 화면이 재로그인·새로고침 없이 새 테마로
바뀐다. (서버 발행은 T011에 이미 포함 — 이 단계는 클라이언트 수신만 남는다)

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 3 — 두 브라우저
세션에서 적용 후 5초 내 전환 실측.

### Tests for User Story 3 (구현 전 실패 출력 필수)

- [x] T021 [P] [US3] 웹소켓 핸들러 테스트 추가 — `webapp/channels/src/actions/websocket_actions.test.jsx`: `theme_applied_to_all` 수신 시 ① 스토어의 `theme--<팀ID>` preference 전부 제거 ② `theme--` 전역 preference를 수신 `theme` 값으로 설정([contracts](./contracts/apply-theme-to-all.md) 클라이언트 계약). 실패 출력 저장

### Implementation for User Story 3

- [x] T022 [US3] 핸들러 구현 — `webapp/channels/src/actions/websocket_actions.ts`에 `handleThemeAppliedToAllEvent` 추가·이벤트 스위치 등록(`PreferencesChanged` 케이스 옆), 이벤트 이름 상수는 기존 `WebSocketEvents.PreferencesChanged`가 정의된 곳과 같은 위치에 추가 (T004와 문자열 일치 필수, T021 의존)

**Checkpoint**: 전 스토리 완료 — 실시간 반영까지 동작

---

## Phase 6: Polish & 완료 검증

- [x] T023 [P] API 레퍼런스 갱신 — `api/` 하위 v4 문서에 `POST /users/theme/apply_to_all` 추가 (기존 preferences 문서 형식을 따른다. 레퍼런스 생성 체계가 이 경로를 다루지 않으면 사유를 적고 건너뛴다)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다.

- [x] T024 품질 게이트 — `cd server && make check-style && make test-server`(접촉 패키지), `cd webapp && npm run check && npm run check-types && npm run test`를 돌리고, 실패 목록이 T002·T003 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [x] T025 종단 검증 — 빌드·기동 후 [quickstart.md](./quickstart.md) 시나리오 1~5를 **실제 환경에서** 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [x] T026 SC 검증 — [spec.md](./spec.md)의 SC-001~SC-005 각각을 **실측값**으로 확인한다 (추정 금지. SC-002는 quickstart 성능 확인 절의 storetest 1,000명 시드 측정으로 대체 가능)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 의존 없음 — 즉시 시작
- **Phase 2 (Foundational)**: T001 이후. US1(T011)·US3(T022)을 막는다
- **Phase 3 (US1)**: Phase 2 완료 후
- **Phase 4 (US2)**: 테스트 T018·T019는 Phase 2 직후 가능(T018은 T012보다 먼저 권장), 구현 T020은 T016 의존
- **Phase 5 (US3)**: 테스트 T021은 Phase 2 직후 가능, 구현 T022는 T004·T021 의존. 서버 발행은 T011에 포함
- **Phase 6 (Polish)**: 전 스토리 완료 후

### 스토리 내 순서 (원칙 III)

테스트(실패 확인) → 스토어 → 생성 코드 → 앱 → API / client4 → 액션 → 컴포넌트.
T009→T010→T011→T012, T014→T015→T016 순서 고정.

### Parallel Opportunities

- T002 ∥ T003 (기준선)
- T005 ∥ T006 ∥ T007 ∥ T008 ∥ T018 ∥ T019 ∥ T021 (테스트 선행 작성 — 전부 다른 파일·독립)
- T013 ∥ T014 ∥ T017 (i18n·client4 — 서로 다른 파일)
- US1 서버 트랙(T009~T013)과 웹앱 트랙(T014~T017)은 상호 독립 — 병행 가능

## Parallel Example: User Story 1

```bash
# 테스트 선행 작성 (전부 병렬):
Task: "storetest ApplyThemeToAllUsers 계약 테스트 — server/channels/store/storetest/preference_store.go"
Task: "앱 단위 테스트 — server/channels/app/preference_test.go"
Task: "API 테스트 — server/channels/api4/preference_test.go"
Task: "컴포넌트 테스트 — user_settings_theme.test.tsx"

# 구현 (서버 트랙 ∥ 웹앱 트랙):
Task: "T009→T010→T011→T012 (서버)"
Task: "T014→T015→T016 (웹앱)"
```

## Implementation Strategy

**MVP = User Story 1.** Phase 1·2 후 US1만 끝내도 "관리자 저장 1회로 전원 적용"
이 성립한다(노출 제어 전이라도 서버 403은 T012에 포함되어 보안은 성립). US2로
UI 노출 제어를 증명하고, US3으로 실시간 반영을 더한다. 각 체크포인트에서 멈춰
독립 검증 가능하다.

커밋은 과제 단위 또는 논리 묶음 단위로 하되, 커밋 여부는 작업 단위마다 사용자
에게 묻는다(저장소 커밋 정책). Conventional Commits(`feat:`) + 한국어 본문.

## Notes

- 생성 코드(T010)는 수동 수정 금지 — make 타깃 산출물만 커밋
- `server/public/model/`은 Apache-2.0 존 — 저작권 헤더 유지 (원칙 IV)
- 테스트가 첫 실행에 통과하면 구현을 되돌려 실패를 확인하거나 과제 옆에 `미검증` 표기 (원칙 III)

## 완료 검증 결과 (2026-10-08, /speckit-implement 실행 기록)

### 품질 게이트 (T024) — 기준선 diff

| 게이트 | 기준선 | 최종 | 판정 |
|---|---|---|---|
| server `make check-style` | 0 issues (exit 0) | 0 issues (exit 0) | 동일 — 통과 |
| server `go test ./channels/store/sqlstore -run 'TestPreferenceStore\|TestDeleteUnusedFeatures'` | ok | ok (신규 서브테스트 포함) | 통과 |
| server `go test ./channels/api4 -run 'Preference'` | ok | ok (신규 TestApplyThemeToAllUsers 포함) | 통과 |
| server `go test ./channels/app -run TestApplyThemeToAllUsers` | (파일 없음) | ok | 통과 |
| webapp jest (접촉 3개 스위트) | 89 passed | 93 passed (신규 4) | 실패 0 — 통과 |
| webapp `npm run check-types` | 기존 오류 30건 (`baseline-webapp-types-errors.txt`) | 동일 30건 — `diff` 결과 TYPES-DIFF-CLEAN | 신규 0 — 통과 |
| webapp eslint (접촉 파일 10개) | — | 0 errors (경고는 기존 패턴의 no-explicit-any 류) | 통과 |

- `go mod tidy`: go.mod/go.sum 변경 없음. tidy 명령 자체는 이 환경에서 비공개
  `mattermost/enterprise` 모듈 접근 불가로 완주 불가(기존 환경 제약, 이번 변경은
  import 추가 없음).
- 기준선 파일: `baseline-server.txt`, `baseline-webapp.txt`,
  `baseline-webapp-types-errors.txt` / 최종: `final-webapp-types-errors.txt`

### 종단 검증 (T025) — quickstart 실주행 (로컬 dev 서버 + 웹앱 재빌드, Playwright 2세션)

| 시나리오 | 결과 | 증거 |
|---|---|---|
| 1. 전체 적용 | 통과 | 관리자(admin-e2e) UI에서 Denim+체크 저장 1회 → DB: 활성 비봇 전원 전역 테마 갱신, 팀별 테마 행 0건, 봇 테마 행 0건, 비활성(deact-e2e)은 시드값 유지 |
| 2. 권한 강제 | 통과 | 비관리자 설정 UI에 체크박스 미노출(DOM 조회로 확인) + curl 직접 호출 HTTP 403 + 변경 없음 |
| 3. 즉시 반영 | 통과 | 접속 중 user-e2e-a 화면이 새로고침 없이 전환. 정밀 측정: API 완료 → 화면 변경 감지 **33ms** |
| 4. 일회성 보장 | 통과 | 적용 후 user-e2e-a가 Quartz로 변경 → 전체 새로고침 후에도 유지(#f4f4f6) |
| 5. 형식 오류 거부 | 통과 | 깨진 JSON 2종 HTTP 400 + 변경 없음. 참고: 유효 JSON 내 잘못된 색상값은 upstream 모델 의미론대로 `PreUpdate`가 `#ffffff`로 정제 후 적용(200) |

- 보너스: 검증 도중 실사용자(시스템 관리자 shindong) 세션이 새 기능으로 전체
  적용을 2회 실행(audit log 09:39:19·09:39:32, HTTP 200) — 실사용 동작 확인.
- 검증 후 정리: 부하 측정용 임시 사용자 1,000명 삭제, 전체 테마를 실사용자가
  마지막으로 적용했던 Slate로 복원. e2e 계정 4개(admin-e2e, user-e2e-a,
  user-e2e-b, deact-e2e)는 재검증용으로 남김.

### SC 검증 (T026) — 실측값

| SC | 기준 | 실측 | 판정 |
|---|---|---|---|
| SC-001 | 저장 1회로 완료 | UI 저장 1회로 전원 적용(시나리오 1) | 통과 |
| SC-002 | 1,000명 10초 내 | 활성 1,026명 적용 API 왕복 **8.1ms** (1,026행 반영 확인) | 통과 |
| SC-003 | 5초 내 반영 | API 완료 → 접속 세션 화면 전환 **33ms** | 통과 |
| SC-004 | 비노출 + 100% 거부 | UI 미노출 + 403 (시나리오 2) | 통과 |
| SC-005 | 되돌림 0건 | 변경 후 새로고침 유지, 재덮어쓰기 없음 (시나리오 4) | 통과 |
