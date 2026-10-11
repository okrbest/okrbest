# Figma Slack UI Kit 토큰 감사 — 014 실측·현재 코드 3자 대조

작성: 2026-10-11. 소스:

- **Figma A** (아이콘·목업): `x8d7P93GaWQnbhXJRmtEzc` — Figma variables 없음.
  아이콘 심볼 ~300개 — 비주얼 레퍼런스 전용.
- **Figma B** (컴포넌트·토큰): `6QkcWynu4O2YwZUov5IP75` — 프레임 5곳
  (01_login, 19_Threads, 22_DM, 15_Dropdown, 25_All Channels)에서
  `get_variable_defs`로 추출. 프레임 간 토큰 세트가 동일하게 반복 — 어휘 수렴 확인.
- **014**: `data-model.md` 실측값 (코드 반영 완료 — slate 프리셋, 타입 스케일,
  모션 토큰).
- **코드**: `sass/base/_css_variables.scss`, `sass/okrbest/_overrides.scss`,
  `constants/preferences.ts`.

## 1. 색 — 브랜드·크롬 (가장 큰 격차)

| Figma B 토큰 | 값 | 014/코드 대응 | 판정 |
|---|---|---|---|
| Core/core_primary_brand | `#4A154B` | 없음 | **갭** — Slack 시그니처 aubergine |
| Core/core_primary | `#3A123E` | 없음 | 갭 |
| Background/top_nav_bg | `#301034` | 없음 | 갭 |
| Background/top_search_bg | `#4F3452` | 없음 | 갭 |
| Background/divider_line_nav | `#522653` | 없음 | 갭 |
| Text/unselected_text | `#C4B8C5` | 없음 | 갭 |
| icon/default_icon | `#C4B8C5` | 없음 | 갭 |

014의 slate는 Slack **라이트(Gray) 테마** 실측이고, Figma 킷은 Slack 기본
**Aubergine 다크 크롬** 기준이다. 둘은 상보적 — slate가 있으니 다음 후보는
**aubergine 프리셋 신설**이다. 위 7색이 사이드바·레일·검색창 크롬을 그대로
구성한다. 대비 검증은 014의 대비 회귀 테스트 체계를 재사용한다
(`#C4B8C5` on `#301034` ≈ 7.8:1로 출발점 양호).

## 2. 색 — 그레이 스케일

| Figma B | 값 | 014/코드 | 판정 |
|---|---|---|---|
| Text/primary_text_black | `#1D1C1D` | centerChannelColor `#1d1c1d` | 일치 |
| Text/darker_text_gray · icon/gray | `#616061` | 본문 보조색은 rgba 알파(0.56~0.75) 합성 | **방식 차이** |
| Background/high_contrast_gray | `#868686` | 〃 | 〃 |
| Text/medium_text_gray · BG/medium | `#BBBBBB` | 〃 | 〃 |
| Background/light_contrast_gray | `#DDDDDD` | border는 rgba 0.08~0.16 | 〃 |
| Background/superlight_contrast_gray | `#F8F8F8` | slate sidebarTextActiveColor `#f8f8f8` | 부분 일치 |

Slack은 **불투명 그레이 6단**, Mattermost는 **centerChannelColor 알파 합성**.
014가 사이드바에서는 알파를 금지했지만(FR-005) 본문은 알파 방식 그대로다.
전면 교체는 테마 엔진(사용자 지정 색) 특성상 비용 대비 효과가 낮다 —
**현행 유지, 화면 단위 개선 시 명도 단계만 Slack 6단에 맞춰 선택** 권장.

## 3. 색 — 의미색 (의도적 차이, 유지)

| Figma B | 값 | 014 확정값 | 사유 |
|---|---|---|---|
| Core/core_logo_green | `#2EB67D` | onlineIndicator `#38a77b` | 흰 배경 3:1 교정 (2.1→3.01) |
| Core/core_logo_red | `#E01E5A` | mentionBg·error `#c01343` | 흰 글자 6.9:1 교정 |
| Hover/hover | `#1364A3` | linkColor `#1264a3` | 실측 라운딩 차 1 — 동일 취급 |
| Secondary/secondary_evergreen | `#185F34` | 없음 | 용처 좁음(배지) — 보류 |

014 값이 WCAG 재교정본이므로 **014 우선**. 킷 값으로 되돌리지 않는다.

## 4. radius

| Figma B | 값 | 코드 (`--radius-*`) | 판정 |
|---|---|---|---|
| radius_small | 4 | `--radius-s: 4px` | 일치 |
| radius_medium | 6 | 없음 — `_overrides.scss`에 `6px`·`7px` 하드코딩 3곳 | **갭(소)** |
| radius_large | 8 | `--radius-m: 8px` | 일치 |
| radius_xxlarge | 100 | `--radius-full: 50%` | 동등 |

조치: `--radius-ms: 6px`(또는 기존 s/m 중 택일) 정의하고 하드코딩 3곳 변수화.

## 5. 타입 스케일 (일치 — 폰트만 의도적 대체)

| Figma B (Lato) | 014/코드 | 판정 |
|---|---|---|
| 12 Regular/SemiBold/Bold (lh16) | micro 12px | 일치 |
| 13 Regular/SemiBold (lh18) | caption 13px | 일치 |
| 15 Regular/SemiBold/Bold/Black (lh22) | base 15px lh22 | 일치 |
| 18 SemiBold/Black (lh26) | subtitle 18px 900 | 일치 (lh24 vs 26 — 미세) |
| 48 Black (lh68) | headline 28px | 마케팅 히어로용 — 앱에선 불필요 |

폰트는 Lato(한글 미지원) 대신 Open Sans+Metropolis+Noto KR — 014 R5·R6
결정 유지. 굵기 체계(400/600/900)는 킷과 동일.

## 6. 모션·기타

Figma 킷에는 모션·간격 토큰이 없다. 014의 `--okr-anim-*`·`--okr-ease-*` 유지.
간격은 킷이 Auto Layout 수치로만 가져서 토큰화돼 있지 않음 — 필요 시 프레임
실측으로 보강.

## 결론 — 개선 후보 우선순위

1. **Aubergine 테마 프리셋 신설** (효과 최대): 1절 크롬 7색 + 014 대비 회귀
   체계 재사용. slate(라이트)와 짝을 이루는 Slack 시그니처 다크 크롬.
2. **radius 6px 변수화** (소규모 정리): 하드코딩 3곳.
3. **화면 단위 그레이 단계 정렬** (점진): 개선 대상 화면 작업 때 Slack 6단
   그레이에서 명도 선택. 전면 교체는 하지 않는다.

Figma A 아이콘 심볼은 compass-icons와 모양 대조용 레퍼런스로만 쓴다
(라이선스·일관성 때문에 아이콘 교체는 범위 밖).
