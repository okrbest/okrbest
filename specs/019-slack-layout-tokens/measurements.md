# 실측 기록: Slack 레이아웃 리듬

측정일 2026-10-11. 소스 ① 실제 Slack 데스크톱 웹(app.slack.com, flex
community 워크스페이스, playwright-slack 세션, `getComputedStyle`/
`getBoundingClientRect`) ② Figma Slack UI Kit(`6QkcWynu4O2YwZUov5IP75`)
메타데이터 좌표 분석. 차이 시 ①을 채택한다 (research R1).

## 1. Slack 실측값 (채택 근거)

### 사이드바

| 지점 (셀렉터) | 값 |
|---|---|
| 채널 행 `.p-channel_sidebar__channel` | 높이 **28**, padding 좌24·우8, 내부 gap **8**, radius **6**, 글자 15/행간 28 |
| 채널 아이콘 `.p-channel_sidebar__channel_icon_prefix` | **16×16** |
| 섹션 헤딩 `.p-channel_sidebar__section_heading` | 높이 28, 좌우 패딩 8 |

### 채널 헤더 (view header)

| 지점 | 값 |
|---|---|
| 헤더 `.p-view_header` | 높이 **49**, padding 좌18·우12, 요소 gap **4** |
| 헤더 버튼 `.p-view_header button` | **28×28**, radius **8** |
| 헤더 버튼 글리프 svg | **20×20** |

좌 패딩 18은 Slack 자체의 비그리드 값 — 토큰화하지 않고 기록만 한다.
②헤더·툴바 기능이 16 또는 20을 고른다.

### 검색창·메시지·컴포저

| 지점 | 값 |
|---|---|
| 상단 검색 `.p-top_nav__search` | 높이 **28**, radius 4, 좌 패딩 12 |
| 메시지 거터 `.c-message_kit__gutter` | padding 상하 **8** · 좌우 **20** |
| 본문 아바타 (메시지) | **36×36** (소형 아바타 20) |
| 작성자 이름 `.c-message__sender` | 15px / 행간 22 |

### 드롭다운 메뉴 (채널 작업 더 보기)

| 지점 | 값 |
|---|---|
| 메뉴 `[role="menu"]` | 폭 300, radius **4** |
| 메뉴 행 `[role="menuitem"]` | 높이 **28**, padding 좌우 **24**, 글자 15/행간 28 |
| 구분선 | 총 17px (여백 8+선 1+여백 8) |

### 간격 보강 실측 (2차)

| 지점 | 값 |
|---|---|
| 채널 탭 줄 `channel_tab_bar` | padding-left **16** |
| 채널 머리말 `p-message_pane__foreword` | margin-bottom **16** |
| 32px 간격 | 이 화면에서 미발견 — `--okr-space-7`은 그리드 상한 보간으로 유지 |

### 아이콘 크기 분포 (화면 전체 svg, 채널 화면 1회 표집)

| 크기 | 개수 |
|---|---|
| **16** | 24 |
| **20** | 20 |
| 15 | 5 |
| 18 | 3 |
| 기타(13·24·28) | 각 1 |

→ Slack 아이콘 체계의 양대 축은 **16과 20**이다. 15·18은 소수 예외.

## 2. Figma 킷 보조값과 차이

| 항목 | 킷 값 | 실측 | 처리 |
|---|---|---|---|
| radius 변수 | 4/6/8/100 | 메뉴4·사이드바행6·헤더버튼8 | 일치 — 채택 |
| 타입 변수 | Lato 12/13/15/18 (lh 16/18/22/26) | 15/22(작성자)·15/28(행) | 일치 — 채택(014 기존) |
| 메뉴 행 높이 | 38 빈발 | **28** | 실측 채택 — 킷은 복제본 자의 수치 |
| 아이콘 | 24 빈발(207개) | **16/20** 양대 축 | 실측 채택 — 〃 |

결론: 킷은 **변수(variables)로 등록된 토큰만** 신뢰하고, 프레임 좌표에서
유도한 수치는 쓰지 않는다.

## 3. ui-ux-pro-max 교차 검증 (R6)

| 가이드라인 | 토큰 체계와의 관계 |
|---|---|
| WCAG 2.2 AA 웹 포인터 타깃 최소 24px | `--okr-target-s: 24px`가 하한과 일치 — 24 미만 타깃 금지 근거 |
| 인접 터치 타깃 사이 최소 8px | `--okr-space-2: 8px`를 버튼 사이 기본 간격으로 |
| 일관된 모듈러 타입 스케일 | 014 스케일(12/13/15/18) 유지 타당 |

## 4. 기준표 반영 요약 (T005에서 data-model 갱신)

- 행 높이: **28이 만능 행** — row-sidebar 28, row-menu 32→**28**(수정),
  row-input 40→**28**(수정, 용도=검색·소형 입력).
- 간격: space-1 4(헤더 gap 실측), space-2 8, space-3 12, space-5 20
  (메시지 좌우), space-6 24(메뉴 좌우·사이드바 들여쓰기) — 실측 확정.
  space-4 16·space-7 32는 실측 지점 없음 — 그리드 보간 단계로 유지하고
  근거 란에 그렇게 적는다.
- 아이콘: aux 16·main 20 실측 확정. inline 14·toolbar 18은 MM 관례 유지
  (Slack에선 15·18이 소수 존재 — 차이 기록).
- 타깃: m 28 실측 확정(헤더 버튼). s 24(WCAG 하한+MM btn-xs)·l 32(MM
  btn-sm·018 통일 결과) 유지.
- radius-ms 6: 사이드바 행 실측으로 근거 강화.
- 균형표: 15 글자 옆 인라인 아이콘은 **16**(사이드바 실측 — 후보 18에서
  수정), 독립 버튼 글리프는 20(28버튼 실측).

## 5. 좌측 레일 실측·개선 (사용자 요청 추가 작업)

### Slack 탭 레일 실측

| 지점 | 값 |
|---|---|
| 레일 | 폭 70, 상단 패딩 8 |
| 버튼 `.p-tab_rail__button` | **52×68**, radius 4, 버튼 간격 0 |
| 아이콘 알약 `__icon` | **36×36, radius 8** — active 배경 rgba(29,28,29,0.13). 활성 신호는 버튼 전체가 아니라 알약 |
| 글리프 | 20×20 |
| 라벨 | **11px / lh 12 / weight 700** — 활성 시 bold |
| 워크스페이스 아이콘 radius | `clamp(4px, min(22.222%, 12px), 12px)` → 36px 기준 8 |

### okrbest 레일 — 개선 전 → 후 (실측)

| 항목 | 전 | 후 |
|---|---|---|
| 제품 버튼 | 56×48, active=버튼 전체 배경 | 56×**64**, active=**36×36 radius-8 알약** 배경 + 라벨 bold, hover도 알약 |
| 글리프 | 20 (리터럴) | 20 = `--okr-icon-main` |
| 라벨 | 10px/400 | **11px/600, 활성 700** (Slack 실측 타입 — 말줄임 0 실측 확인) |
| 팀 버튼 | 56×71, 아이콘 40 | 56×**64**(제품과 동일 리듬), 아이콘 **36×36 radius 8** |
| 간격 | gap 2~4, pad 혼재 | `--okr-space-1/2` 토큰 |

### 부수 수리 — boards 플러그인 크래시

실측 전제(플러그인 설치 상태)가 깨져 있었다: upstream이 서버 모델에서
`DataRetentionSettings.BoardsRetentionDays`를 제거해 boards 플러그인이
OnActivate·OnConfigurationChange에서 nil 역참조 SIGSEGV → 반복 크래시 후
자동 비활성. okrbest-plugin-boards에 nil 가드 2곳을 넣고 서버 바이너리만
재빌드·재패킹해 복구 ("Boards product successfully started" 확인, 플러그인
리포 커밋 2건).

## 6. 팀 드롭다운 실측·개선 (사용자 요청 추가 작업 2)

### Slack 워크스페이스 전환 메뉴 실측

| 지점 | 값 |
|---|---|
| 메뉴 | 폭 360, 행 높이 **52**, 행 좌우 패딩 16 |
| 워크스페이스 아이콘 | **36**, radius clamp(4px, 22.222%, 12px) → 36px 기준 **8** |
| 이름 | **15px / 700 / lh 22** |
| 부제(워크스페이스 URL) | **13px / 400 / lh 18** — 2줄 구성 |

### okrbest 팀 드롭다운 — 개선 전 → 후 (실측)

| 항목 | 전 | 후 |
|---|---|---|
| 아이콘 | 24, radius 6 | **36, radius 8** (레일·Slack 동일 리듬) |
| 이름 | 14/600 1줄 | **15/700** + **부제 `/{팀핸들}` 13px muted** 2줄 (Slack의 URL 부제 대응) |
| 행 높이 | ~36 | **56** (Slack 52 대응 — 2줄 자연 높이) |
| leading 간격 | 10px | `--okr-space-3`(12) |

구현 메모: Menu.Item(styled-components)이 `.hash.MuiMenuItem-root` 셀프
더블로 라벨 타이포(14/12)·leading 18px을 (0,4,0) 특이도로 주입한다 —
`.teamListMenuItem.MuiMenuItem-root …` 병기로 (0,4,1) 확보해 덮었다
(순서로는 못 이김 — 런타임 주입).

## 7. 레일 프로필 버튼 실측·검증 (사용자 요청 추가 작업 3)

### Slack 프로필 버튼 실측 (`.p-ia__nav__user__button`)

| 지점 | 값 |
|---|---|
| 버튼 = 아바타 | **36×36**, radius clamp → **8** (팀 아이콘·탭 알약과 동일 리듬) |
| 배치 | 레일 수평 중앙, 하단 여백 24 |
| presence 점 | 우하단 겹침 (래퍼 20, +6/+6) |

### okrbest — 검증 결과와 조치

| 항목 | 전 | 후 |
|---|---|---|
| 배치 | 수평 중앙·하단 고정 — **이미 Slack과 동일** (레일 전 요소 중심 33px 일치) | 유지 |
| 아바타 | 32, radius 6 — 레일 36 리듬에서 혼자 이탈 | **36, radius 8** (`--radius-m`) |
| 버튼 래퍼 | padding 2 + radius 7(예외 값) | padding 0 + radius 8 — **7px 예외 소멸** (data-model 예외 표에서 제거) |
| 상태 점 | 우하단 -4/-4 겹침 | 유지 (Slack과 같은 취지) |

## 8. 아이콘 실태 스캔 (채널 화면 1회 표집, 2026-10-11)

| 소스 | okrbest 분포 | Slack 분포 (1절) |
|---|---|---|
| 폰트(i.icon) | 12×2 · 16×2 · **18×12** · 30×1 | — (폰트 아이콘 없음) |
| SVG | 12×2 · 14×4 · 16×5 · **18×17** · 20×4 · 32×1 | **16×24 · 20×20** (+15×5 · 18×3) |

판정: Slack은 16/20 두 단계 집중 + 단일 SVG 소스, okrbest는 다섯 단계
분산 + 폰트/SVG 이중 소스. 최빈 18은 Slack 리듬에 없는 크기다 →
usage-guide "아이콘 규칙" 신설, `--okr-icon-toolbar`(18) 강등.

## 9. 상단 검색바·도움말 버튼 (020 아이콘 개선 2)

### Slack 상단(top nav) 실측

| 지점 | 값 |
|---|---|
| 검색바 | 높이 28, radius 4, **글자 15px** |
| 도움말 버튼 | 26×26, radius 4, **글리프 20** — **화면 우측 끝**(rightGap 8), 검색바와 분리 |
| 상단 내비 버튼 공통 | 26×26 · 글리프 20 |

### okrbest — 개선 전 → 후 (실측)

| 항목 | 전 | 후 |
|---|---|---|
| 도움말 위치 | 중앙 그룹(검색바 바로 옆, left 951) | **우측 끝 그룹**(알림 히스토리 왼쪽, left 1212) — center_controls→right_controls 이동 |
| 도움말 글리프 | 16 (폰트 i) | **20** (`#RightControlsContainer .HeaderIconButton i`) — 버튼 28 유지 |
| 검색바 글자 | 12/500 | **15/400** (base 단계) — 높이 28·radius 4는 이미 Slack과 일치해 유지 |

## 10. 툴팁·상단 버튼 글리프 선명도 (020 아이콘 개선 3)

### Slack 툴팁 실측 (`.c-tooltip__tip`)

| 항목 | 값 |
|---|---|
| 배경 | `#1D1C1D`, radius **8** |
| 패딩 | **8px 12px** |
| 글자 | **13px / 700 / lh 18**, 흰색 |
| 버튼과 간격 | 8 (okrbest OFFSET 8과 이미 일치) |
| 화살표 | 있음 (작음) |

### okrbest — 개선 전 → 후 (실측)

| 항목 | 전 | 후 |
|---|---|---|
| 툴팁 | radius 4, pad 4/8, 12px/600, bg #000 | **radius 8, pad 8/12, 13px/700, bg #1D1C1D** (화살표 fill 동기) — 전역 적용 |
| 상단 버튼 글리프 | 폰트 i (흐릿) | **compass SVG 20** (help·bell — HeaderIconButton에 SVG 매핑, 미등록 아이콘은 폰트 후방 호환) |

툴팁 원본은 platform/shared의 전역 CSS — upstream 파일 대신 okrbest
레이어에서 `div.tooltipContainer` 특이도로 덮었다.

## 11. 채널 헤더 우측 운영 그룹 (020 아이콘 개선 4)

Slack view_header 기준(버튼 radius 8·글리프 svg 20·gap 4 — 1절 실측).

| 항목 | 전 | 후 (실측) |
|---|---|---|
| 글리프 | 폰트 i fs18 ×3(벨·팝아웃·정보) + svg 18(케밥) 혼재 | **compass SVG 20 통일** (BellOutline/BellOffOutline·DockWindow·InformationOutline·DotsVertical) |
| 버튼 간격 | 8/8/4/4 혼재 | **4 균일** (`--okr-space-1`, flex-parent gap + margin 제거) |
| 버튼 radius | 4 | **8** (`--radius-m`) |

멤버 스택(아바타 콘텐츠)은 글리프 규칙 대상 아님 — 크기 32·radius 8만 공유.
PopoutButton은 공용 컴포넌트라 스레드 패널·검색 헤더의 같은 버튼도 함께
개선된다.
