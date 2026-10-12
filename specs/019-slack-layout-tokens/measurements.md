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

## 18. 사이드바 필터 버튼·리스트 (020 아이콘 개선 11)

Slack 필터 버튼 벤치마크: 아이콘만으로는 기능이 안 읽힌다 — **아이콘 +
"필터" 라벨 + 체브론** 알약으로 기능을 명시하고, 옵션은 드롭다운 리스트.

| 항목 | okrbest (전) | 후 (실측) |
|---|---|---|
| 버튼 | 28×28 아이콘 토글(라벨 없음, 기능 비가시) | **알약 88×28 r14** — `≡ 필터 ⌄`, 라벨 13/600 |
| 동작 | 클릭=토글 (상태 비가시) | **드롭다운 라디오**: 모든 채널 보기 / 읽지 않은 항목으로 필터링 + 현재 상태 체크 (menuitemradio, TDD 5건 RED→GREEN) |
| 리스트 디자인 | — | Menu v2라 020-8 전역 메뉴 개선(15px·24 패딩·r8) 자동 적용 |
| 단축키 | Cmd/Ctrl+Shift+U 토글 | 유지 |

특이도: upstream `#SidebarContainer …`(ID 체인)가 28 고정 폭을 줘 같은
ID 체인으로 덮었다.

## 19. 파일 패널 필터 (020 아이콘 개선 12)

사이드바 필터(18절)와 같은 Slack 문법을 파일 RHS 필터에 적용.

| 항목 | 전 | 후 (실측) |
|---|---|---|
| 버튼 | 32 아이콘만 + 우상단 점 | **`≡ 필터 ⌄` 알약 78×28 r14**, 활성 점 유지 |
| 리스트 | 구형 widgets/menu (파란 글자·좌측 체크·좁은 여백) | **Menu v2 라디오** 8개 유형 + trailing 체크 — 020-8 전역 메뉴 디자인 자동 적용 |
| 시맨틱 | ItemAction | menuitemradio + aria-checked (TDD 5건 RED→GREEN) |

## 20. 채널 제목 즐겨찾기 별 (020 아이콘 개선 13)

Slack view_header 별 버튼 실측: **28×28 r8, 글리프 svg 20** (우측 그룹과
동일 문법). okrbest: 24×24 r4·폰트 i 18 → 동일 스펙으로. 글리프는
StarOutline/Star SVG 전환(TDD 3건 RED→GREEN — 상태 단언은 testid로),
크기 override는 upstream `.btn.channel-header__favorites`(24 고정)를
okrbest 레이어에서 덮음.

## 020 병합 게이트 (기준선 diff)

lint 목록 동일 · Jest 실패 138 동일(통과 +6 = 020 신규 테스트) · types는
게이트에서 신규 2건(IconComponentProps 미존재 import, menuButtonTooltip
shortcut 미지원)을 적발해 수정 후 기준선 11건과 동일 목록 복원.

## 21. 글로벌 스레드 목록 (021 스레드 목록 개선)

Slack 스레드 뷰 실측 (OKR.Best 워크스페이스, `.p-threads_view` 계열):

| 항목 | Slack 실측 |
|---|---|
| 캔버스 배경 | #F8F8F8, 카드 흰색 r12 + 1px #DDD |
| 카드 머리글 | 채널명 **15/700/22** #1D1C1D + 작성자 부제 12/400/17.6 #616061 |
| 카드 내부 패딩 | gutter 20px 20px 8px |
| 작성자(sender) | **15/900/22**, 타임스탬프 12/400 #616061 |
| 본문 | 15/400/**22** |
| 아바타 | 36 (루트 메시지) |

우리 목록(좌측 열) 개선 — Slack은 목록이 아닌 카드 스택이라 구조는
유지하고 타이포 위계·간격·신호색만 이식:

| 항목 | 전 | 후 (실측) |
|---|---|---|
| 행 패딩 | 18px/28px (비그리드) | **20px 24px** (space-5/6) |
| 작성자 | 14/600/20 | **15/700/22** (Slack sender) |
| 채널 칩 | 10/600 h16 (한글 저가독) | **12/600/16**, pad 1 6, r4 |
| 미리보기 | lh 21.43·높이 40 (클램프 어긋남) | **lh 22·높이 44** (22×2줄 정합), 블록 여백 0 — 다중 단락 메시지의 둘째 블록이 반 줄 잘리던 것을 22px 격자 정렬로 수리 |
| 답글 메타 | 12/600/15 | **13/600/20** |
| 읽지않음 색 | sidebar-text-active-border (slate에선 **회색** — 신호 사망) | **var(--button-bg)** #1264A3 (dot + 새 답글 N개) |
| 선택 행 | button-bg 0.04 | **0.08**, hover 0.12 |
| 탭 버튼 | h31 pad 4 10 r4 14px | **h28 r14 pad 0 12, 13/600** (사이드바·파일 필터 알약 문법) |
| 모두 읽음 아이콘 | 18 | **20** (주요 축) |

행 높이: FixedSizeList itemSize 133 → **148** (패딩 20×2 + 헤더 22+8 +
미리보기 44+12 + 메타 20 + 보더 1). 세로 리듬은 virtualized 상수와 CSS가
한 쌍이다 — 둘 중 하나만 고치면 행이 겹치거나 뜬다.

탭 교정 (사용자 피드백 2차): 탭 쌍을 **"전체 / 읽지 않음"**으로
("팔로우한 스레드/읽지 않음"은 필터 쌍으로 안 읽힘 — `threading.filters.all`
신설, 모바일 헤더의 globalThreads.heading은 유지). 읽지않음 점은
absolute(top 6/right 6)가 알약 패딩과 겹쳐 글자를 침범 → 라벨 뒤 플렉스
흐름의 superscript(6px, button-bg, align-self flex-start)로. 인라인
vertical-align 방식은 줄 상자를 키워 알약 안 글자가 아래로 밀렸다 —
버튼·라벨을 inline-flex 중앙 정렬로 바꿔 두 탭 기준선을 맞췄다
(실측: 라벨 중심 오프셋 0, 기준선 일치). 미리보기의 제목 마크다운
(h1~h6)은 15/700/22로 평탄화 — 원래 크기로 커지면 목록 리듬이 깨진다.

부수 수리: 020-12 파일 필터 라벨 8종을 defineMessages로 감쌌다 — 객체
리터럴은 i18n-extract가 못 봐서 en.json 재생성 때 키가 지워졌다.

특이도: upstream thread_item.scss와 번들 순서가 엇갈리므로 전 규칙에
`.ThreadList` 병기(+1 클래스)로 승급. 테스트 데이터는 로컬 서버에
thread-alice/thread-bob 사용자와 hr-chatbot 스레드 4건을 시드했다.

## 22. 사이드바 카테고리 명칭 (022)

Slack 섹션 헤더 실측 (flex community, `.p-channel_sidebar__section_heading`):
행 28 (pad 0 8, margin 0 8), 라벨 **15/500** rgba(29,28,29,0.8),
**text-transform none·letter-spacing normal**, 토글 16×16 r4.

| 항목 | 전 | 후 (실측) |
|---|---|---|
| 라벨 | **12/600 UPPERCASE ls 0.6px** (한글 저가독) | **15/500**, 변형·자간 없음 |
| 행·버튼 높이 | 32 | **28** (--okr-row-sidebar) |
| 카테고리 메뉴 버튼 | 28 + margin 2 (32행 센터) | margin 0 16 0 0 (28행 정합) |
| 색 | var(--sidebar-text) | 유지 (서식만 이식) |

위계: 채널명(15/600 진한 색) vs 카테고리(15/500 흐린 색) — Slack과 같은
"같은 크기, 굵기·명도로 구분" 문법. upstream `#SidebarContainer` 체인과
특이도 동률을 피하려고 클래스 병기(1,3,0)/(1,2,0 병기)/(1,4,0 병기).

카테고리 특성 아이콘 (022 후속): 체브론·라벨 사이 16px 글리프(15px 라벨
균형표), gap 4. 매핑 — 즐겨찾기 star-outline, 채널 pound(#), 개인 메시지
account-multiple-outline, 사용자 카테고리 folder-outline, 읽지 않은 항목
message-text-outline. 아이콘이 끼면 upstream "체브론+라벨" 인접 선택자가
깨져 라벨 패딩 16이 되살아난다 — 아이콘 뒤 라벨 패딩을 병기 특이도로 0.
정적 헤더(읽지 않은 항목)는 체브론이 없어 아이콘이 들여쓰기 16을 맡는다.
TDD: 테스트 6건 신설(RED 5건 확인 후 GREEN), sidebar_category 스냅샷 5건
갱신. 실측 — svg 16, gap 4, 수직 중앙 오프셋 0.

토글·아이콘 한 슬롯 전환 + 카테고리 간격 (022 후속 2): Slack 섹션 헤더의
expandContainer 실측 — 한 16px 슬롯에 이모지(opacity 1)와 체브론(opacity 0)이
겹쳐 있고 호버 시 전환된다. 같은 문법으로 특성 아이콘(평소)↔체브론
(호버·focus-visible·접힘)을 opacity 전환, margin -16으로 겹침. 접기 불가
(hide-arrow)면 아이콘만 상시. 카테고리 사이 간격은 Slack 섹션 스페이서
실측 24px(우리 현행 0) — `.SidebarChannelGroup + .SidebarChannelGroup`
margin-top space-6. 실측: 간격 24, 평소 체브론 0/아이콘 1(left 동일 66),
접힘 시 체브론 1(회전)/아이콘 0, 펼침 복귀 정상.

들여쓰기 교정 (사용자 피드백): 토글·아이콘 슬롯이 사이드바 경계에 밀착
(x=0) → groupButton padding-left space-4로 채널 행 아이콘 열(x=17)과 정렬
(실측 x=16). 정적 헤더의 아이콘 margin-left 16 규칙은 공통 패딩으로 대체.

계단 들여쓰기 (사용자 피드백 2차): Slack 실측 — 섹션 토글 x16·라벨 x40,
채널 아이콘 x32·채널명 x56. 리스트가 카테고리보다 **한 단(+16) 더
들어간다**. 우리는 아이콘 열이 평행(16/17)이라 계층이 안 읽혔다.
적용 — 카테고리 아이콘 gap 4→8(라벨 x40, Slack 일치), 카테고리 콘텐츠
안 행 padding-left 19→32(아이콘 x30), CTA(채널 추가·멤버 초대) 15→32.
상단 고정 메뉴(스레드 등)는 카테고리 밖이라 제외(x18 유지).
실측 — 카테고리 16/40, 채널 30/61, CTA 32.

고정 메뉴↔카테고리 경계 (사용자 피드백 3차): Slack 실측 — 고정 리스트와
첫 섹션 사이 24px 스페이서 안에 헤어라인 구분선(위 12/선 1/아래 11,
rgba(29,28,29,0.13)). 섹션끼리는 선 없이 24px만. 적용 — SidebarNavContainer
border-top 1px rgba(sidebar-text,0.13) + margin-top 12 + 첫 그룹 래퍼
padding-top 12. 실측: 고정 메뉴 bottom→선 12, 선→첫 카테고리 13.

빈 즐겨찾기 상시 표시 (022 후속 3): Slack은 즐겨찾기 섹션을 항상 보여주고
빈 상태엔 "중요한 사항은 여기로 끌어 놓으세요" 안내를 둔다. upstream은
빈 favorites를 return null로 숨겼다 — 조기 반환을 제거하고 새 카테고리용
드롭 안내(newDropBox)를 빈 favorites에도 재사용. TDD: 기존 "미표시" 고정
테스트를 새 기대(헤더+드롭 안내 표시)로 교체해 RED 확인 후 GREEN,
스냅샷 2건 갱신(1건은 rbd 자동 id 카운터 밀림의 부수 효과).

CTA 정렬 점검 (023): 멤버 초대 버튼 안 래퍼(__inviteMembersLhsButton)가
자체 padding 15를 더해 아이콘이 이중으로 밀렸다(32+15=47). 내부 패딩 0으로
교정. 실측 — 채널 추가·멤버 초대 모두 아이콘 x32/텍스트 x65 일치,
채널 행(30/61)과 같은 열 리듬.

## 23. 테마 모드 토글 (024)

레일 하단 프로필 바로 위, 라이트=Slate / 다크=Onyx 고정 매핑 +
시스템 모드(prefers-color-scheme 추종). 버튼 36 r8(레일 리듬), 글리프
20(해·달·모니터 — compass에 없어 MDI 24×24 패스 인라인). Menu v2
menuitemradio 3항목 + 체크. 모드는 display_settings/okr_theme_mode
preference로 저장, 테마 적용은 기존 saveTheme('' = 전팀) 경로 재사용.
시스템 모드일 때만 matchMedia change 리스너가 살아 있고, 마운트 시
불일치도 한 번 교정한다.

버튼 디자인 (사용자 피드백): Slack "집중 모드 켜기" 버튼 실측 —
**36×36 완전 원형(r18), 상시 배경 rgba(29,28,29,0.13), 글리프 20**,
버튼 리듬 52(36+16). 상시 원형 배경으로 교정 (hover 0.2). 선택 후 메뉴가
안 닫히던 것은 Menu v2가 menuitemradio를 기본 유지하기 때문 —
forceCloseOnSelect로 즉시 닫기 (TDD RED→GREEN). 글리프는 019 획 보강
기법(stroke 0.8 — 강조 단계)으로 굵힘, 메뉴가 포털이라 글리프 클래스에
직접 걸었다. 라이트 모드 해는 사용자 지정으로 중앙 원 + 8개 라운드
광선의 stroke 기반(Lucide sun 문법, strokeWidth 2)으로 교체 — fill 보강
규칙에서 제외.

검증 — TDD 6건 RED→GREEN, 브라우저 실주행: 다크 선택 → Onyx 전면 적용,
시스템 선택 후 OS 에뮬레이션 다크/라이트 왕복 → sidebar-bg #202228(Onyx)
↔ #fdfdfd(Slate) 자동 전환, 토글은 프로필 위 8px 간격 세로 스택.

## 24. 미읽음 수 보조 뱃지 (025)

멘션 수만 숫자로 보여주는 upstream 규칙에 더해, 멘션이 없을 때 일반
미읽음 수를 **파랑 틴트 뱃지**로 표시한다 — 글자 var(--link-color)
(Slate #1264A3 / Onyx 밝은 #5D89EA: 두 테마 모두 "읽기 좋은 파랑"으로
설계된 변수), 틴트 rgba(--button-bg-rgb, 0.14). link-color-rgb는 테마
유틸이 hex 문자열로 넣어 rgba()가 깨지므로 트리플 보장 변수만 rgba에
쓴다. 활성 행은 반전색 유지. 멘션 뱃지(Slate 빨강 #C01343 / Onyx 파랑
#3C66C4 불투명 필)와는 색상(라이트)·필/틴트 명도(다크)로 구분.
실측 — Slate: bg rgba(18,100,163,.14)+#1264A3, Onyx: bg
rgba(60,102,196,.14)+#5D89EA (양 테마 전환 왕복 확인). 100건 이상은 99로 캡. 멘션이 생기면
기존 강조색 멘션 뱃지가 우선하고 회색 뱃지는 사라진다(두 뱃지 동시 노출
금지). 데이터는 calculateUnreadCount의 messages — sidebar_channel_link
connector에 이미 연결돼 있던 unreadMsgs를 렌더에 연결만 했다.
TDD 4건(RED 2 양성 케이스 확인→GREEN 17/17), 실측 — 미읽음 3건 채널에
회색 "3" 뱃지 + 굵은 채널명, 멘션 뱃지 부재.

읽지 않은 항목 페이지 일관성 (사용자 피드백): 중앙 뷰(unreads_view)의
채널 그룹 머리글에도 같은 뱃지 — 멘션 0이면 파랑 틴트 미읽음 수(99 캡),
멘션 있으면 기존 멘션 뱃지. makeGetChannelUnreadCount를 컴포넌트에서
직접 구독. TDD 3건(RED 2→GREEN 8/8). 실측 — 머리글 뱃지
rgba(18,100,163,.14)+#1264A3, 사이드바와 표기 일치.

멘션 뱃지 색 통일 (사용자 피드백): 중앙 영역에선 부트스트랩 .badge
기본색(회색)이 새어 나와 멘션 뱃지가 사이드바(테마 mention-bg)와
달랐다 — `.UnreadChannelGroup #unreadMentions.badge`에 var(--mention-bg)/
var(--mention-color). 실측 — 페이지·사이드바 멘션 뱃지 모두
rgb(192,19,67)+흰 글자(Slate), 변수 기반이라 Onyx(#3C66C4)도 자동.
