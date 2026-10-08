# Implementation Plan: 시스템 관리자 테마 전체 적용

**Branch**: `016-admin-theme-apply` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-admin-theme-apply/spec.md`

## Summary

화면 설정 > 테마에 시스템 관리자 전용 체크박스를 추가하고, 체크 후 저장하면
서버가 모든 활성 사용자(봇·비활성 제외)의 테마 preference를 단일 트랜잭션으로
덮어쓴다. 새 API 엔드포인트는 `manage_system` 권한을 강제하고, 새 브로드캐스트
웹소켓 이벤트로 접속 중 사용자 화면에 즉시 반영한다. 일회성 적용이므로 이후 각
사용자는 자기 테마를 자유롭게 바꾼다.

## Technical Context

**Language/Version**: Go 1.26.2 (`server/`), TypeScript 5.6 + React (`webapp/`)

**Primary Dependencies**: gorilla/mux(API 라우팅), squirrel(SQL 빌더),
mattermost-redux(웹앱 상태), 기존 웹소켓 허브(`app.Publish`)

**Storage**: PostgreSQL `Preferences` 테이블(기존 스키마 그대로, 마이그레이션
없음). 저장소 코드가 이미 `ON CONFLICT` 등 PostgreSQL 전용 문법을 쓴다 —
MySQL 분기 불필요 ([research.md](./research.md) R2).

**Testing**: 서버 — colocated `_test.go` + `channels/store/storetest`(gotestsum),
API 테스트 `channels/api4/preference_test.go`. 웹앱 — Jest + React Testing
Library. 종단 — quickstart.md 실주행.

**Target Platform**: Linux 서버 + 웹 브라우저(기존 배포 형태 그대로)

**Project Type**: 모노레포 web-service (`server/` Go API + `webapp/` React SPA)

**Performance Goals**: 활성 사용자 1,000명 기준 전체 적용 10초 내 완료(SC-002).
단일 `INSERT ... SELECT ... ON CONFLICT` SQL이라 사용자 수에 선형이며 왕복이
없다. 접속 중 클라이언트 반영 5초 내(SC-003) — 브로드캐스트 이벤트 1건.

**Constraints**: 원자적 적용(FR-006) — 삭제+upsert를 한 트랜잭션에 묶는다.
웹소켓 이벤트는 사용자별 N건이 아니라 브로드캐스트 1건으로 제한(허브 부하).
기존 `Preferences` 스키마·기존 테마 저장 구조(전역 `Name=''`/팀별 `Name=팀ID`)를
변경하지 않는다.

**Scale/Scope**: 서버 — 스토어 메서드 1개(+인터페이스·mock·레이어 재생성), 앱
메서드 1개, API 핸들러 1개, 웹소켓 이벤트 상수 1개, i18n 오류 문자열.
웹앱 — 체크박스 UI, redux 액션 1개, client4 메서드 1개, 웹소켓 핸들러 1개,
i18n 키 1개(en/ko). DB 마이그레이션 없음, 신규 의존성 없음.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획 반영) | server·webapp 둘 다 닿는다. 구현 전 기준선 저장, 마감 때 `make check-style`+`make test-server`, `npm run check`+`check-types`+`test` 출력 제시. 스토어 인터페이스 변경 시 `make store-mocks store-layers` 재생성 커밋 |
| II. npm workspaces 전용 | PASS | 신규 패키지 없음. `platform/client`·`channels` 내 수정만 |
| III. 실패를 본 테스트만 인정 | PASS(계획 반영) | 스토어·앱·API·웹앱 컴포넌트 테스트를 구현 전 작성해 실패 출력을 남긴다. tasks.md에서 테스트 과제를 구현 과제보다 앞에 배치 |
| IV. 라이선스·리브랜드 | PASS | 새 파일에 Mattermost 저작권 헤더 유지. `server/public`(Apache-2.0)·그 외 서버(AGPL)·`webapp/`(Apache-2.0) 존 안에서만 수정 |
| V. i18n 동기화 | PASS(계획 반영) | 체크박스 문구(webapp `en.json`/`ko.json`), 서버 AppError 문자열(`server/i18n/en.json`/`ko.json`)을 같은 변경에서 동시 갱신 |
| VI. 집중 브랜치 + PR | PASS | `016-admin-theme-apply` 브랜치 1개, 이 기능만 담는 PR. DB 마이그레이션·CI 설정 안 건드림(CODEOWNERS 보호 경로 회피) |
| VII. Spec 주도 워크플로 | PASS | specify→plan→tasks→implement 순서 준수 중. 구현 규율은 `/speckit-implement` 3-bis에서 로드 |
| VIII. 문서 언어·문체 | PASS | 본 문서 포함 산출물 전부 한국어, 코드 식별자·명령 원형 유지 |

위반 없음 → Complexity Tracking 불필요.

**Phase 1 재평가**: 설계 산출물(data-model, contracts, quickstart) 작성 후에도
위반 없음. 신규 저장 구조·신규 프로젝트·우회 게이트가 생기지 않았다.

## Project Structure

### Documentation (this feature)

```text
specs/016-admin-theme-apply/
├── spec.md              # 기능 명세 (/speckit-specify)
├── plan.md              # 이 파일 (/speckit-plan)
├── research.md          # Phase 0 (/speckit-plan)
├── data-model.md        # Phase 1 (/speckit-plan)
├── quickstart.md        # Phase 1 (/speckit-plan)
├── contracts/
│   └── apply-theme-to-all.md   # API·웹소켓 계약 (/speckit-plan)
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트
└── tasks.md             # Phase 2 (/speckit-tasks — 이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
server/
├── public/model/
│   └── websocket_message.go              # WebsocketEventThemeAppliedToAll 상수 추가
├── channels/store/
│   ├── store.go                          # PreferenceStore 인터페이스에 ApplyThemeToAllUsers 추가
│   ├── sqlstore/preference_store.go      # 단일 트랜잭션 구현 (삭제 + INSERT...SELECT...ON CONFLICT)
│   ├── storetest/preference_store.go     # 스토어 계약 테스트 추가
│   ├── retrylayer/ · opentracinglayer/ · timerlayer/   # make store-layers 재생성
│   └── searchtest/…                      # (해당 없음)
├── channels/app/
│   ├── preference.go                     # ApplyThemeToAllUsers: 검증→스토어→브로드캐스트 Publish
│   └── preference_test.go                # 앱 단위 테스트
├── channels/api4/
│   ├── preference.go                     # POST /users/theme/apply_to_all 라우트+핸들러(manage_system 강제)
│   └── preference_test.go                # 권한 403·정상 적용 API 테스트
└── i18n/en.json, i18n/ko.json            # AppError 문자열

webapp/
├── platform/client/src/client4.ts        # applyThemeToAllUsers 메서드
├── channels/src/packages/mattermost-redux/src/
│   └── actions/preferences.ts            # applyThemeToAllUsers 액션
├── channels/src/components/user_settings/display/user_settings_theme/
│   ├── index.ts                          # showApplyToAllUsersCheckbox(=isCurrentUserSystemAdmin)·액션 연결
│   ├── user_settings_theme.tsx           # 체크박스 렌더·제출 분기·기존 체크박스 비활성 연동
│   └── user_settings_theme.test.tsx      # 관리자만 노출·제출 분기 테스트
├── channels/src/actions/websocket_actions.ts   # theme_applied_to_all 핸들러
└── channels/src/i18n/en.json, ko.json    # 체크박스 문구
```

**Structure Decision**: 모노레포의 기존 배치를 그대로 따른다. 서버는
model→store→app→api4 계층 순서로, 웹앱은 client4→redux 액션→컴포넌트→웹소켓
핸들러 순서로 수정한다. 새 디렉터리를 만들지 않는다.

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
