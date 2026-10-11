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

## 12. 멤버 스택 카운트 겹침 수리 (020 아이콘 개선 5)

### Slack 아바타 스택 실측 (`[data-qa="avatar_stack"]`)

| 항목 | 값 |
|---|---|
| 버튼 | **내용 폭**(18,738명 기준 112), 높이 28, 패딩 3, radius 8 |
| 아바타 | 20, radius 3 |
| 카운트 | **13px / 700 / lh 20**, `#454447` |

### okrbest — 원인과 조치

| 항목 | 전 | 후 (실측) |
|---|---|---|
| 버튼 폭 | **32 고정** — `.btn.btn-icon.btn-sm`의 고정 폭(0,3,0)이 `.channel-member-stack`(0,1,0)의 `width: auto`를 이겨 카운트가 버튼 밖으로 넘쳐 벨과 겹침 | `&.btn.btn-icon.btn-sm` 병기(0,4,0)로 **width auto** — 내용 폭 77, 카운트 버튼 안, 벨과 4px 분리 |
| 카운트 | 12px/600 | **13px/700** (Slack 실측) |

## 13. Slate 크롬 명도 재검증 (020 아이콘 개선 6 — 사용자 요청)

Slack Gray의 상단·레일은 반투명 유리 레이어라 단일 픽셀이 흔들린다 —
영역 중앙값(순수 파이썬 PNG 디코드, step 3 표집)으로 대표색을 산출했다.

| 영역 | Slack Gray (중앙값) | okrbest Slate (기존) | 판정 |
|---|---|---|---|
| 탭 레일 / 팀 레일 | **#D8D8DA** | #EAEAEA | **우리가 과하게 밝음** |
| 상단(top nav) | #D8~E7 띠 (합성 변동) | #EAEAEA | 〃 |
| 사이드바 | #FCFCFC | #FDFDFD | 근사 일치 |
| 본문 | #FFFFFF | #FFFFFF | 일치 |
| 사이드바 글자 | rgba(29,28,29,0.8) | #474647 | 근사 일치 (014) |
| 선택 행 반전 | #333133 / #F8F8F8 | 동일 | 일치 (014) |

**원인 진단**: 크롬↔사이드바 명도 단차가 Slack 36(D8→FC)인데 우리는
19(EA→FD) — 3단 위계의 간격이 절반이라 화면이 "들떠" 보였다. 014 당시
#EAEAEA 실측은 반투명 레이어의 밝은 지점을 잡은 오측으로 판단.

**조치**: slate의 `sidebarHeaderBg`·`sidebarTeamBarBg` #EAEAEA → **#D8D8DA**.
가드 테스트(theme_slate.test.ts) 선갱신 RED→GREEN, 대비 재검증 —
`#1d1c1d` on `#D8D8DA` ≈ 11.7:1, 014 대비 회귀 스위트(theme_presets_contrast
포함 41/41)·theme_provider 18/18 통과. 브라우저 실측 `--sidebar-teambar-bg
= #d8d8da` 확인, 3단 위계 복원.

## 14. 레일 제품 글리프 상향 (020 아이콘 개선 7 — 사용자 결정)

글리프 20(Slack 동일값)이 알약 36 대비 왜소하다는 사용자 판단으로 **24**
(알약의 2/3 광학 비율)로 상향 — `--okr-icon-rail` 단계 신설. 실측: 세 버튼
svg 24·알약 36 유지, 획 보강(0.6/0.8)은 24에서도 유효.

## 15. 팝업 메뉴 여백·균형 (020 아이콘 개선 8)

Slack 메뉴 실측(1·6절): 폭 300, 좌우 패딩 24, 글자 15, 구분선 8+1+8.

| 항목 | okrbest (전) | 후 (실측) |
|---|---|---|
| 행 좌우 패딩 | 20 | **24** (`--okr-space-6`) |
| 글자 | 14/16 | **15/22** (base), 부제 13/18 |
| 메뉴 폭 하한 | 186 (내용 폭) | **240** |
| 모서리 | 4 | **8** (`--radius-m`) |
| 구분선 | 8+1+8 | 유지 (이미 일치) |

Menu v2 전역(`menu_menuStyled`) 적용 — 채널 메뉴·팀 드롭다운·계정 메뉴
공통. MUI styled가 min-width 114를 (0,4,0)으로 주입해 (0,5,0)으로 덮었다
(특이도 추적 기록 — 6절과 같은 패턴).

## 16. 메시지 날짜 구분 알약 (020 아이콘 개선 9)

### Slack 실측 (`.c-message_list__day_divider__label__pill`)

| 항목 | 값 |
|---|---|
| 알약 | 높이 **28**, padding **0 16**, radius 24, bg #FFF |
| 윤곽 | 보더 대신 **box-shadow 헤어라인**: `0 0 0 1px rgba(29,28,29,.13), 0 1px 3px rgba(0,0,0,.08)` (014 모달과 같은 문법) |
| 글자 | 13/700 |
| 포맷 | **요일 병기** — "10월 8일 목요일" |

### okrbest — 개선 전 → 후 (실측)

| 항목 | 전 | 후 |
|---|---|---|
| 윤곽 | 없음 (bg만) — 흰 본문에서 알약이 안 보임 | Slack 헤어라인+드롭섀도 그대로 |
| 크기 | lh 26, pad 0 13 | **lh 28, pad 0 16** (`--okr-space-4`) |
| 포맷 | "5월 22일" (요일 없음) | **"3월 9일 월요일"** — 요일 병기, 당해 연도 생략 (TDD RED→GREEN 2건) |

비고: post_time 스위트 실패 8건은 변경 stash 후에도 동일 실패 — 기존 결함
(12h 포맷 기대 불일치), 본 변경과 무관.

## 17. 메시지 호버 액션 바 (020 아이콘 개선 10)

### Slack 정의 (DOM 비노출로 CSS 원본에서 추출)

| 항목 | 값 |
|---|---|
| 패널 `.c-message_actions__group` | padding **4**, radius **12**, bg 흰색, **헤어라인 0 0 0 1px (29,28,29,.13) + 0 1px 3px #00000014** — 보더 없음 |
| 버튼 `.c-message_actions__button` | 높이 **32**, radius **8**, font-size 18 |

### okrbest — 개선 전 → 후 (실측)

| 항목 | 전 | 후 |
|---|---|---|
| 패널 | radius 4, **보더 0.2 + elevation-1** (탁한 윤곽) | radius **12**, 보더 투명 + **Slack 헤어라인·드롭섀도** |
| 아이콘 버튼 | 28, radius 4 | **32, radius 8** |
| 빠른 반응 이모지 | 버튼 **16×16** (WCAG 타깃 하한 24 미달), 간격 12 혼재 | 래퍼 **32 타깃** + 글리프 **20**, 간격 균일 |

특이도 기록: upstream은 `.post:hover .post-menu`(0,2,1)로 hover 시
보더 0.2·elevation을 덧씌운다 — 같은 hover 체인에 `.post-menu.post-menu`
병기(0,3,1)로 덮었다.
