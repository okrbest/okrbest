# Data Model: 시스템 관리자 테마 전체 적용

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md)

새 테이블·컬럼·마이그레이션은 없다. 기존 `Preferences` 테이블의 행 의미만 쓴다.

## 테마 preference (기존 구조, 변경 없음)

| 필드 | 값 | 의미 |
|---|---|---|
| `UserId` | 사용자 ID | 테마 소유자 |
| `Category` | `"theme"` (`model.PreferenceCategoryTheme`) | 테마 분류 |
| `Name` | `""` 또는 팀 ID | `""`=전역 테마, 팀 ID=그 팀 한정 테마 |
| `Value` | 테마 JSON 문자열 | 색상 키·hex 값. `model.Preference.IsValid()`가 검증 |

### 전체 적용이 행에 가하는 변화

한 트랜잭션에서 (연산 순서 고정):

1. **삭제**: `Category='theme' AND Name<>''`인 모든 행 — 팀별 테마 제거.
2. **upsert**: 적용 대상 사용자마다 `(UserId, 'theme', '', <관리자 테마 JSON>)`
   — 전역 테마 덮어쓰기. 기존 행이 없던 사용자(기본 테마 사용자)도 행이 생긴다.

### 적용 대상 판정

| 조건 | 판정 근거 |
|---|---|
| `Users.DeleteAt = 0` | 활성 사용자만 (비활성 제외) |
| `Users.Id NOT IN (SELECT UserId FROM Bots)` | 봇 제외 |
| 게스트·관리자 본인 | 포함 (spec Assumptions) |

## 상태 전이

```text
[사용자별 테마 상태]
  전역 테마 보유  ──┐
  팀별 테마 보유  ──┼─ 전체 적용 ──▶ 전역 테마 = 관리자 테마 (팀별 행 없음)
  테마 행 없음    ──┘                    │
                                        └─ 이후 사용자 개별 변경 자유 (일회성, FR-004)
```

실패 시(권한 없음·테마 형식 오류·DB 오류) 어떤 행도 바뀌지 않는다 —
트랜잭션 롤백(FR-006, FR-010).

## 웹소켓 이벤트 (신규)

| 항목 | 값 |
|---|---|
| 상수 | `model.WebsocketEventThemeAppliedToAll = "theme_applied_to_all"` |
| 범위 | 브로드캐스트 (모든 접속 세션 1건) |
| 데이터 | `theme`: 적용된 테마 JSON 문자열 |

웹앱 수신 시 스토어 반영: 자기 `myPreferences`에서 ① `theme--<팀ID>` 키 전부
제거 ② `theme--` 키를 수신 값으로 설정. 화면 테마는 `getTheme` 셀렉터가
스토어에서 파생하므로 별도 렌더 경로가 필요 없다.

## 인터페이스 추가 (저장 구조 아님)

- `store.PreferenceStore.ApplyThemeToAllUsers(value string) error` — 위 두 연산을
  단일 트랜잭션으로 수행. mock·retry/opentracing/timer 레이어 재생성 필요.
