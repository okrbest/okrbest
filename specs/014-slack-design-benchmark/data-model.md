# 데이터 모델: Slack 디자인 벤치마킹

코드로 들어갈 값의 정의다. 색 값은 **1차 후보**다 — 대비 회귀 테스트(R11,
원칙 III)가 전 조합을 계산해 최종 확정하며, 미달이 나오면 색조를 유지한 채
명도만 조정한다. 기준: 글자 4.5:1 (WCAG 1.4.3), 비텍스트 UI 3:1 (1.4.11),
사이드바 글자 8.8:1 이상(slate, SC-002), 활성 항목 7:1 이상.

## 1. 신설 프리셋 `slate`

`Preferences.THEMES`에 추가하는 전체 필드. Slack 라이트(Gray) 실측값을
Mattermost 테마 필드로 옮긴 것이다.

| 필드 | 값 | 근거 (Slack 실측) |
|---|---|---|
| `type` | `'Slate'` | — |
| `sidebarBg` | `#fdfdfd` | 사이드바 `#FDFDFD` |
| `sidebarText` | `#333133` | 선택 항목 배경색을 글자로 재사용 — 대비 12.4:1 |
| `sidebarUnreadText` | `#1d1c1d` | content-pry |
| `sidebarTextHoverBg` | `#e3e2e3` | hover `rgba(51,49,51,0.13)`의 `#FDFDFD` 위 합성값 |
| `sidebarTextActiveBorder` | `#333133` | 활성 반전 배경 (R3 재해석) |
| `sidebarTextActiveColor` | `#f8f8f8` | 활성 글자 — 대비 11.5:1 |
| `sidebarHeaderBg` | `#eaeaea` | 상단 네비 `#EAEAEA` |
| `sidebarHeaderTextColor` | `#1d1c1d` | 대비 14.1:1 |
| `sidebarTeamBarBg` | `#eaeaea` | 탭 레일 `#EAEAEA` |
| `onlineIndicator` | `#38a77b` | 흰 배경 3.01:1 |
| `awayIndicator` | `#bd8b17` | 흰 배경 3.06:1 |
| `dndIndicator` | `#d24b4e` | 흰 배경 4.32:1 (비텍스트 ✓) |
| `mentionBg` | `#c01343` | content-imp — 흰 글자 6.9:1 |
| `mentionBj` | `#c01343` | (upstream 중복 필드 — 동일값 유지) |
| `mentionColor` | `#ffffff` | — |
| `centerChannelBg` | `#ffffff` | 본문 `#FFFFFF` |
| `centerChannelColor` | `#1d1c1d` | content-pry — 16.99:1 |
| `newMessageSeparator` | `#c01343` | 흰 배경 6.9:1 |
| `linkColor` | `#1264a3` | content-hgl-1 — 5.4:1 |
| `buttonBg` | `#1264a3` | 흰 글자 5.4:1 |
| `buttonColor` | `#ffffff` | — |
| `errorTextColor` | `#c01343` | content-imp — 6.9:1 |
| `mentionHighlightBg` | `#fff3c2` | 위에 `#1d1c1d` 글자 14:1 이상 |
| `mentionHighlightLink` | `#1264a3` | — |
| `codeTheme` | `'github'` | 라이트 계열 관례 |

명도 3단 검증: `sidebarTeamBarBg`(234) < `sidebarBg`(253) < `centerChannelBg`(255)
— Slack과 같은 순서·간격 패턴 (SC-003).

## 2. 기존 프리셋 5종 교정 (바뀌는 필드만)

반전 짝(`activeBorder`→활성 배경, `activeColor`→활성 글자)과 의미색 미달분.
적지 않은 필드는 그대로 둔다.

### Denim (sidebarBg `#1e325c`, 본문 흰색)

| 필드 | 현재 | 교정 | 이유 |
|---|---|---|---|
| `sidebarTextActiveBorder` | `#5d89ea` | `#f8f8f8` | 반전 배경 (다크 사이드바 → 밝은 알약) |
| `sidebarTextActiveColor` | `#ffffff` | `#1e325c` | 반전 글자 — 대비 12+ |
| `newMessageSeparator` | `#cc8f00` | `#bd8b17` | 2.80 → 3.06 |
| `onlineIndicator` | `#3db887` | `#38a77b` | 2.50 → 3.01 |
| `awayIndicator` | `#ffbc1f` | `#bd8b17` | 1.68 → 3.06 |
| `errorTextColor` | `#d24b4e` | `#cc494c` | 4.32 → 4.54 |

### Sapphire (sidebarBg `#1543a3`, 본문 흰색)

| 필드 | 현재 | 교정 |
|---|---|---|
| `sidebarTextActiveBorder` | `#57b5f0` | `#f8f8f8` |
| `sidebarTextActiveColor` | `#ffffff` | `#1543a3` |
| `newMessageSeparator` | `#15b7b7` | `#13a5a5` |
| `onlineIndicator` | `#3db887` | `#38a77b` |
| `awayIndicator` | `#ffbc1f` | `#bd8b17` |
| `errorTextColor` | `#d24b4e` | `#cc494c` |

### Quartz (sidebarBg `#f4f4f6` 라이트, 본문 흰색)

| 필드 | 현재 | 교정 |
|---|---|---|
| `sidebarTextActiveBorder` | `#32a4ec` | `#1f2228` (반전 배경 — 라이트 사이드바 → 어두운 알약) |
| `sidebarTextActiveColor` | `#1f2228` | `#f8f8f8` |
| `newMessageSeparator` | `#15b7b7` | `#13a5a5` |
| `onlineIndicator` | `#3db887` | `#38a77b` |
| `awayIndicator` | `#f5ab07` | `#bd8b17` |
| `errorTextColor` | `#d24b4e` | `#cc494c` |

### Indigo (sidebarBg `#151e32`, 본문 `#111827` 다크)

| 필드 | 현재 | 교정 | 이유 |
|---|---|---|---|
| `sidebarTextActiveBorder` | `#4a7ce8` | `#f8f8f8` | 반전 배경 |
| `sidebarTextActiveColor` | `#ffffff` | `#151e32` | 반전 글자 |
| `mentionBg` / `mentionBj` | `#4a7ce8` | `#3c66c4` | 흰 글자 3.93 → 4.5+ |
| `buttonBg` | `#4a7ce8` | `#3c66c4` | 흰 글자 3.93 → 4.5+ |
| `errorTextColor` | `#d24b4e` | `#da6c6e` | 다크 본문 위 4.10 → 5.2 (Onyx 값 재사용) |

### Onyx (sidebarBg `#202228`, 본문 `#191b1f` 다크)

| 필드 | 현재 | 교정 |
|---|---|---|
| `sidebarTextActiveBorder` | `#4a7ce8` | `#f8f8f8` |
| `sidebarTextActiveColor` | `#ffffff` | `#202228` |
| `mentionBg` / `mentionBj` | `#4b7ce7` | `#3c66c4` |
| `buttonBg` | `#4a7ce8` | `#3c66c4` |

### `setThemeDefaults` 기본값 (테마에 값이 없을 때)

`theme_utils.ts`의 폴백도 같은 기준으로: `onlineIndicator #38a77b`,
`awayIndicator #bd8b17`, `dndIndicator #d24b4e`, `errorTextColor #cc494c`,
`newMessageSeparator #13a5a5`. 이후 프리셋 추가 시 재조율이 필요 없는 지점이다
(FR-004).

## 3. 타입 스케일

| 단계 | 크기 | 용도 (채널 화면) |
|---|---|---|
| micro | 12px | 타임스탬프, 카테고리 라벨, 북마크 |
| caption | 13px | 채널 토픽(헤더 설명), 검색 플레이스홀더 |
| base | **15px** | 메시지 본문(행간 22px), 작성창, 사이드바 채널명, 작성자 이름 |
| subtitle | **18px** | 채널 제목 (굵기 900, 행간 24px = 1.33) |
| title | 22px | 모달 제목 (기존 값 유지 — 이미 단계 안) |
| headline | 28px | 온보딩·빈 상태 표제 |

굵기: 400 본문 / 600 보조 강조(기존 유지) / **900 제목·작성자 이름**.

폰트 스택:

| 자리 | 스택 | 비고 |
|---|---|---|
| 본문 | `'Open Sans', 'Noto Sans KR', sans-serif` | 라틴 Open Sans, 한글 Noto (R5) |
| 제목(h1-h3·채널 제목) | `Metropolis, 'Noto Sans KR', sans-serif` | 라틴 Metropolis Black, 한글 Noto 900 (R6) |

`@font-face` 추가분: Noto Sans KR 400·600·900 (woff2),
Metropolis Black(900, woff), Open Sans ExtraBold(800 파일을
`font-weight: 900`으로 등록). 전부 `font-display: swap`.

## 4. 모션 토큰

| 토큰 | 값 | 적용 |
|---|---|---|
| `--okr-anim-fast` | 80ms | 배경·색 전환 (hover, 버튼) |
| `--okr-anim-base` | 160ms | 레이아웃성 전환 (패딩, 이동) |
| `--okr-ease-out` | `cubic-bezier(0.36, 0.19, 0.29, 1)` | 감속 — 레이아웃성 전환 기본 |
| `--okr-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 아이콘 버튼 transform 전용 |

제약: 어떤 전환도 500ms를 넘지 않는다 (SC-007).

## 5. 사이드바 항목 상태 전이

| 상태 | 배경 | 글자 | 규칙 |
|---|---|---|---|
| 기본 | 투명 | `var(--sidebar-text)` **불투명** | 알파 덧씌움 금지 (FR-005) |
| hover | `var(--sidebar-text-hover-bg)` | 변화 없음 | 약한 신호 — 활성과 혼동 금지 (FR-007) |
| 활성 | `var(--sidebar-text-active-border)` | `var(--sidebar-text-active-color)` | 완전 반전, 좌측 바 제거 (R3) |
| 읽지 않음 | 상태 무관 | `var(--sidebar-unread-text)` + 600 | 기존 유지 |

전이 애니메이션: 배경 `--okr-anim-fast`, 그 외 즉시.

## 6. 사이드바 폭

| 항목 | 값 |
|---|---|
| 기본 폭 | `clamp(180px, 19vw, 440px)` (뷰포트 769px 이상) |
| 사용자 드래그 값 | `--overrideLhsWidth` — 기본 폭보다 우선 (기존 체계) |
| 768px 이하 | off-canvas 드로어 — 현행 유지 |

검산: 1024px → 195px → 본문 720px (SC-006 ✓). 1440px → 274px → 본문 1022px.
1920px → 365px → 본문 1446px.
