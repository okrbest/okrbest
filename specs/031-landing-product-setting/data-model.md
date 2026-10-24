# Data Model: 첫 화면(로그인 랜딩) 설정

**Date**: 2026-10-25 | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)

## 엔티티 1 — 팀 기본 첫 화면 (Team.LandingProduct)

Teams 테이블의 신규 컬럼. 팀의 모든 구성원이 읽고, `MANAGE_TEAM` 권한으로만 쓴다.

| 항목 | 내용 |
|---|---|
| 컬럼 | `Teams.LandingProduct VARCHAR(32) NOT NULL DEFAULT ''` |
| Go 모델 | `Team.LandingProduct string` + `TeamPatch.LandingProduct *string` (`server/public/model/team.go`) |
| JSON | `landing_product` |
| webapp 타입 | `Team.landing_product?: string` (`webapp/platform/types/src/teams.ts`, optional — 컬럼 미반영 구서버 응답과의 호환) |
| 허용 값 | `''`(채널, 기본) · `boards` · `playbooks` |
| 검증 | `Team.IsValid()`에서 허용 값 외 거부 → patchTeam이 400 반환 |
| Sanitize | 민감 정보 아님 — `Team.Sanitize()` 변경 없음, 모든 구성원에게 노출 |

**수정 지점(스토어)** — `server/channels/store/sqlstore/team_store.go`의 명시적
컬럼 목록 3곳에 `LandingProduct`를 추가한다:

- select 컬럼 목록 (`:231` 부근, `prefix + ".LastTeamIconUpdate"` 옆)
- INSERT 문 (`:297-300`)
- UPDATE 문 (`:337`)

**마이그레이션** — `000235_add_teams_landing_product.up.sql`:

- up: `ALTER TABLE teams ADD COLUMN IF NOT EXISTS landingproduct varchar(32) NOT NULL DEFAULT '';`
- down: `ALTER TABLE teams DROP COLUMN IF EXISTS landingproduct;`
- `migrations.list`에 postgres 2줄 추가. 선례: `000086_add_cloud_limits_archived`.

## 엔티티 2 — 개인 첫 화면 설정 (Preference)

기존 Preferences 테이블을 쓴다. 서버 스키마·API 변경 없음.

| 항목 | 내용 |
|---|---|
| category | `landing_product` (신규 상수, 32자 제한 내) |
| name | 팀 ID(26자, 팀별 설정) 또는 `''`(모든 팀 공통) |
| value | `channels` · `boards` · `playbooks` |
| 부재 의미 | "팀 기본값 따르기" (기본 상태) |
| 상수 위치 | `webapp/channels/src/utils/constants.tsx` 또는 `packages/mattermost-redux/src/constants/preferences.ts` — 기존 카테고리 상수 옆 |

**상태 전이** — UI에서 "팀 기본값 따르기"를 선택하면 해당 키의 preference를
삭제한다(`deletePreferences`). "모든 팀에 적용"을 켜고 저장하면 name=`''`로
저장하면서 팀별 키들을 삭제한다(테마의 `deleteTeamSpecificThemes` 선례와 동일).

## 판정 함수 (webapp 셀렉터)

```text
resolveLandingProduct(state, teamId):
  후보 순서 =
    1. preference(landing_product, teamId)      # 팀별 개인 설정
    2. preference(landing_product, '')          # 모든 팀 공통 개인 설정
    3. team.landing_product                     # 팀 기본값
    4. 'channels'                               # 기존 동작
  위에서 아래로 내려가며:
    - 값이 channels 면 → channels 확정
    - 값이 boards/playbooks 면 → 해당 product가 등록되어 있으면 확정,
      없으면 다음 후보로 (저장값은 건드리지 않는다)
  반환: 'channels' | 'boards' | 'playbooks'
```

- 구현 위치: `webapp/channels/src/selectors/landing.ts` (신규).
- preference 2단 조회는 테마 선례(`getThemePreference`,
  `packages/mattermost-redux/src/selectors/entities/preferences.ts:116-134`)를
  따른다.
- product 등록 여부는 `selectProducts`(`selectors/products.ts`)로 판정한다.
  manifest가 아니라 등록된 product를 보는 이유는 [research.md D4](research.md).

## 관계 요약

```text
User ──(preference: landing_product/{teamId|''})──▶ 선택값
Team ──(landing_product 컬럼)─────────────────────▶ 팀 기본값
로그인 리다이렉트(redirectUserToDefaultTeam)
  └─ 도착 팀 확정 → resolveLandingProduct(state, teamId) → 이동 URL
       channels  → /{team}/channels/{lastChannel|town-square}  (기존 그대로)
       boards    → /boards     (플러그인이 팀 경로로 자체 이동)
       playbooks → /playbooks
```
