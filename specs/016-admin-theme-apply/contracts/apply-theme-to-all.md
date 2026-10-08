# Contract: 테마 전체 적용 API · 웹소켓

**Date**: 2026-10-08 | **Plan**: [../plan.md](../plan.md) | **Data model**: [../data-model.md](../data-model.md)

## REST API

### POST /api/v4/users/theme/apply_to_all

세션 사용자의 선택 테마를 모든 활성 사용자(봇·비활성 제외)에게 적용한다.

**인증**: 세션 필수 (`APISessionRequired`)

**권한**: `manage_system` (`model.PermissionManageSystem`). 없으면 403, 어떤
변경도 하지 않는다.

**Request body**:

```json
{
  "theme": "{\"type\":\"Denim\",\"sidebarBg\":\"#1e325c\", ...}"
}
```

- `theme`: 테마 JSON 문자열. `model.Preference`(Category=`theme`, Name=`""`)로
  구성해 `IsValid()` 검증을 통과해야 한다.

**Responses**:

| 상태 | 조건 | 본문 |
|---|---|---|
| 200 | 적용 완료 | `{"status": "OK"}` |
| 400 | `theme` 누락·형식 오류(IsValid 실패) | AppError (`app.preference.apply_theme_all.invalid.app_error`) |
| 401 | 세션 없음 | AppError (기존 관용구) |
| 403 | `manage_system` 권한 없음 | AppError (기존 `api.context.permissions.app_error`) |
| 500 | 저장 실패(트랜잭션 롤백 완료 후) | AppError (`app.preference.apply_theme_all.save.app_error`) |

**부수 효과**:

- `Preferences`: 팀별 테마 행 전체 삭제 + 대상 사용자 전역 테마 upsert (원자적).
- 웹소켓 `theme_applied_to_all` 브로드캐스트 1건 발행.
- audit record: 기존 api4 관용구(`c.MakeAuditRecord`)로 남긴다.

## WebSocket Event

### theme_applied_to_all (서버 → 전체 접속 세션)

```json
{
  "event": "theme_applied_to_all",
  "data": {
    "theme": "{\"type\":\"Denim\", ...}"
  },
  "broadcast": {"omit_users": null, "user_id": "", "channel_id": "", "team_id": ""}
}
```

**클라이언트(webapp) 계약**:

1. `myPreferences`에서 `theme--<팀ID>` 항목을 모두 제거한다.
2. `theme--`(전역)를 수신한 `theme` 값으로 설정한다 (`user_id`는 수신자 자신).
3. 추가 네트워크 요청 없이 스토어 갱신만으로 테마가 전환된다.

이벤트를 모르는 클라이언트(모바일·구버전)는 무시한다. 다음 접속 때 서버 값을
읽어 같은 상태에 도달한다.

## Redux / Client SDK

- `Client4.applyThemeToAllUsers(theme: Theme): Promise<StatusOK>` —
  위 엔드포인트 호출 (`webapp/platform/client/src/client4.ts`).
- 액션 `applyThemeToAllUsers(theme: Theme)`
  (`mattermost-redux/src/actions/preferences.ts`) — 호출 성공 시 현재 사용자
  기준 `RECEIVED_PREFERENCES`(전역 테마)·`DELETED_PREFERENCES`(팀별 테마)를
  낙관적으로 디스패치한다.

## UI 계약 (화면 설정 > 테마)

| 조건 | 동작 |
|---|---|
| 시스템 관리자 아님 | 체크박스 미노출 (기존 화면 그대로) |
| 시스템 관리자 | 기존 "가입한 모든 팀" 체크박스 아래에 "모든 팀원에게 새로운 테마를 적용합니다" 체크박스 노출 |
| 새 체크박스 켬 | "가입한 모든 팀" 체크박스는 켜짐+비활성 표시(전역 적용에 포함) |
| 새 체크박스 켠 채 저장 | `applyThemeToAllUsers` 액션만 호출 (기존 saveTheme 경로 미사용) |
| 새 체크박스 끈 채 저장 | 기존 동작 그대로 |

i18n 키: `user.settings.display.theme.applyToAllUsers`
(en: "Apply new theme to all users" / ko: "모든 팀원에게 새로운 테마를 적용합니다")
