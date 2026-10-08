# Research: 시스템 관리자 테마 전체 적용

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md)

Technical Context에 NEEDS CLARIFICATION은 없었다. 아래는 설계 갈림길마다 실제
코드를 확인해 내린 결정이다.

## R1. 접속 중 사용자에게 어떻게 전파하나

**Decision**: 새 브로드캐스트 웹소켓 이벤트
`WebsocketEventThemeAppliedToAll = "theme_applied_to_all"` 1건을 전체 접속자에게
보낸다. 데이터는 테마 JSON 문자열 하나. 웹앱은 새 핸들러에서 ① 자기 스토어의
팀별 테마 preference를 제거(`DELETED_PREFERENCES`)하고 ② 전역 테마
preference를 자기 `user_id`로 주입(`RECEIVED_PREFERENCES`)한다. 테마는
`getTheme` 셀렉터로 파생되므로 스토어 갱신만으로 화면이 바뀐다.

**Rationale**: 기존 `preferences_changed` 이벤트는 사용자 단위로 발행·수신된다
([server/channels/app/preference.go](../../server/channels/app/preference.go)
70행 — `NewWebSocketEvent(..., userID, ...)`). 이를 재사용해 사용자별로 쏘면
사용자 수만큼 이벤트가 발생해 허브에 부담이고, `userId=""`로 브로드캐스트하면
수신자마다 `user_id`가 남의 것인 preference를 자기 스토어에 넣게 되어 기존
핸들러([websocket_actions.ts:1569](../../webapp/channels/src/actions/websocket_actions.ts))
의 의미가 깨진다. 전용 이벤트면 구형 클라이언트(모바일 등)는 모르는 이벤트를
무시하고 다음 접속 때 서버 값을 읽는다 — 안전한 하위 호환.

**Alternatives considered**:
- 사용자별 `preferences_changed` N건 발행 — 수천 접속자면 이벤트 폭주. 기각.
- `preferences_changed`를 broadcast로 재사용 — 이벤트 의미(본인 preference 변경)
  훼손, 타 클라이언트 오동작 위험. 기각.
- 전파 생략(다음 접속 때 반영) — FR-007·SC-003 미충족. 기각.

## R2. 일괄 덮어쓰기 SQL을 어떻게 쓰나

**Decision**: `SqlPreferenceStore`에 `ApplyThemeToAllUsers(value string) error`를
추가하고 한 트랜잭션에서 두 문장을 실행한다.

1. `DELETE FROM Preferences WHERE Category='theme' AND Name<>''` — 팀별 테마 제거
2. `INSERT INTO Preferences (UserId, Category, Name, Value)
   SELECT u.Id, 'theme', '', $value FROM Users u
   WHERE u.DeleteAt = 0 AND u.Id NOT IN (SELECT UserId FROM Bots)
   ON CONFLICT (userid, category, name) DO UPDATE SET Value = excluded.Value`

**Rationale**: 기존 `Save`가 이미 트랜잭션 + `ON CONFLICT` 패턴을 쓴다
([preference_store.go:44-112](../../server/channels/store/sqlstore/preference_store.go)
— MySQL 분기 없음, PostgreSQL 전용). `INSERT ... SELECT`로 서버 왕복 없이
사용자 수와 무관한 상수 횟수의 SQL로 끝나 SC-002(1,000명 10초)를 여유 있게
만족한다. 트랜잭션이 FR-006(원자성)을 보장한다. 활성 판정은 `Users.DeleteAt=0`,
봇 제외는 `Bots` 테이블 서브쿼리 — 코드베이스의 기존 관용구다.

**Alternatives considered**:
- 사용자 목록 조회 후 루프 upsert — N번 왕복, 느리고 원자성 관리가 번거롭다. 기각.
- 테마를 서버 설정(`ThemeSettings.DefaultTheme`)으로 강제 — "기본값"이지 기존
  사용자 덮어쓰기가 아니며, 강제 고정은 브레인스토밍에서 범위 밖으로 확정. 기각.

## R3. API 엔드포인트를 어디에 두나

**Decision**: `POST /api/v4/users/theme/apply_to_all`. 등록은
`api4/preference.go`의 `InitPreference`에서 `api.BaseRoutes.Users.Handle(...)`로
한다. 핸들러는 본문 `{"theme": "<테마 JSON 문자열>"}`을 받고
`model.PermissionManageSystem`이 없으면 403을 반환한다.

**Rationale**: 기존 preference 라우트는 전부 `/users/{user_id}/preferences`
아래라 특정 사용자에게 묶인다. 이 작업은 전 사용자 대상 관리 작업이므로
사용자 경로 밖에 둔다. `/users` 아래 리터럴 경로(`/ids`, `/usernames` 등)와
`{user_id}` 패턴이 공존하는 기존 관례와 충돌하지 않는다 —
`/users/{user_id}/apply_to_all` 형태의 기존 라우트가 없어 모호성이 없다.
권한은 세션 검사 후 `SessionHasPermissionTo(session, PermissionManageSystem)`
관용구를 쓴다(UI 숨김은 보안이 아니므로 서버 강제가 정본, FR-005).

**Alternatives considered**:
- `PUT /users/{user_id}/preferences` 재사용 + 플래그 — 본인 preference 갱신
  계약(403 조건: `userID != preference.UserId`)과 의미 충돌. 기각.
- `/system` 아래 신설 — system 라우트는 핑·상태 점검 용도라 어울리지 않음. 기각.

## R4. 테마 값 검증을 어떻게 하나

**Decision**: 앱 레이어 `ApplyThemeToAllUsers`에서 요청 테마로
`model.Preference{Category: "theme", Name: "", Value: ...}`를 구성해 기존
`IsValid()`를 호출한다. 실패 시 400을 반환하고 아무 변경도 하지 않는다(FR-010).

**Rationale**: `model/preference.go`(157행~)에 테마 전용 검증(허용 키 필터링,
hex 색상 검사)이 이미 있다. 같은 규칙을 재사용해야 일반 저장 경로와 판정이
갈라지지 않는다.

**Alternatives considered**: 핸들러에서 자체 JSON 검사 — 검증 로직 중복. 기각.

## R5. 웹앱 제출 흐름을 어떻게 나누나

**Decision**: 체크박스(관리자 전용, `isCurrentUserSystemAdmin` 셀렉터로 노출
제어)가 켜져 있으면 `submitTheme`가 기존 `saveTheme`/`deleteTeamSpecificThemes`
대신 새 redux 액션 `applyThemeToAllUsers(theme)` 하나만 호출한다. 서버가
관리자 본인을 포함한 전원을 갱신하고, 브로드캐스트 이벤트가 관리자 자신의
스토어도 갱신한다. 액션은 응답 성공 시 본인 preference를 낙관적으로 디스패치해
이벤트 지연과 무관하게 즉시 반영한다.

**Rationale**: 저장 경로를 하나로 유지해야 "관리자 본인 저장 + 전체 적용"이
이중 쓰기로 갈라지지 않는다. 기존 체크박스("가입한 모든 팀")는 전역 적용에
의미가 포함되므로 켜짐+비활성으로 표시한다(FR-008) — 상태 모순을 UI에서
차단한다.

**Alternatives considered**: saveTheme과 전체 적용을 둘 다 호출 — 같은 행을 두
번 쓰고 실패 시 상태가 갈라질 수 있다. 기각.

## R6. 생성 코드(mock·레이어) 갱신 범위

**Decision**: `PreferenceStore` 인터페이스에 메서드를 추가하므로
`make store-mocks`와 `make store-layers`(retrylayer·opentracinglayer·timerlayer)
를 돌려 산출물을 함께 커밋한다. `go mod tidy` 클린 확인.

**Rationale**: constitution 원칙 I — 생성 mock은 재생성해 최신 상태로 커밋.
Makefile 360·371행에 두 타깃이 있다.
