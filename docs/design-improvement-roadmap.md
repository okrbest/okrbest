# 디자인 개선 로드맵 — 세부 항목 분리 계획

**작성일**: 2026-10-15 (같은 날 컴포넌트 전수 대조로 보완)
**근거**: Slack 벤치마크 계측(`/home/sdh/okrbest/okrbest-design`), spec 014~028 진행 내역,
`webapp/channels/src/components/` 전수 대조
**용도**: 앞으로의 디자인 정밀 작업을 항목별로 분리하고, 효과가 큰 순서대로 착수한다.
각 항목은 착수 시점에 CLAUDE.md 규칙대로 분기한다 — 단순하면 바로 `/speckit-specify`,
복잡하면 superpowers `brainstorming`을 먼저 거친다.

---

## 1. 완료 항목 — 작업 단위 분해

끝난 작업도 남은 작업과 같은 단위로 쪼개 둔다. 재작업·회귀 추적·다크 검증(2순위 2b)이
전부 이 단위로 이루어진다. 분량은 추정이 아니라 **실적**이고, 각 단위는 커밋 메시지의
괄호 번호(예: `(020 아이콘 개선 9)`)로 git 이력과 1:1로 이어진다.

### 014 — Slack 시각 체계 (L, 6단위)

시각 기반 전체를 세운 spec이다. 산출물: `specs/014-slack-design-benchmark/`

| 단위 | 내용 | 대상 | 분량 |
|---|---|---|---|
| 014-1 | slate 무채색 명도 3단 프리셋 신설, 기본 테마 지정 | 테마 프리셋 정의, `sass/` | M |
| 014-2 | 파랑 프리셋 5종 의미색·대비 교정 (오류·구분선·상태 점) | 프리셋 값 | S |
| 014-3 | 사이드바 글자 불투명화(알파 0.64 제거), 활성 채널 반전 표시 | `components/sidebar/` | S~M |
| 014-4 | 타이포 6단(12·13·15·18·22·28), 본문 15/22, 제목 18/900, 한글 폰트 번들 | 전역 타이포, 폰트 자산 | M |
| 014-5 | 사이드바 가변폭 (뷰포트 비례 + 드래그 저장값 우선) | `components/resizable_sidebar/` | S |
| 014-6 | 모달 3겹 마감(스크림·그림자·헤어라인)과 전환 모션 기준(80/160ms) | 모달 셸, 전환 규칙 | S |

### 015~016 — 뷰 신설과 테마 운영 (M×2)

| 단위 | 내용 | 대상 | 분량 |
|---|---|---|---|
| 015-1 | 읽지 않은 항목 전용 뷰 신설 (사이드바 정적 링크 + 목록 화면) | `components/unreads_view/` | M |
| 016-1 | 시스템 관리자가 테마를 전체 적용하는 기능 | 관리 콘솔, 테마 배포 경로 | M |

### 017~018 — 레일·헤더 골격 재구성 (M~L×2)

| 단위 | 내용 | 대상 | 분량 |
|---|---|---|---|
| 017-1 | 좌측 네비게이션을 기능 버튼 레일 + 팀 드롭다운으로 재구성 | `components/team_sidebar/`, `global_header/` | M~L |
| 018-1 | 채널 헤더를 콘텐츠 탭 줄 + 우측 운영 아이콘으로 재구성 | `components/channel_header/` | M |
| 018-2 | 북마크 바 제거, 북마크를 RHS 패널로 전환 | `components/channel_bookmarks_rhs/` | S~M |

### 019 — 레이아웃 리듬 토큰 (L, 7단위)

간격·크기·모서리의 정본. 산출물: `specs/019-slack-layout-tokens/usage-guide.md`

| 단위 | 내용 | 대상 | 분량 |
|---|---|---|---|
| 019-1 | 레이아웃 리듬 토큰 기준표 신설 (US1) | 토큰 정의 | M |
| 019-2 | okrbest 커스텀 SCSS 하드코딩을 토큰으로 무변화 치환 (US2) | `sass/` | S~M |
| 019-3 | 사용 가이드 신설, 균형표 검증 (US3) | usage-guide.md | S |
| 019-4 | 파일럿 1 — 좌측 레일을 Slack 탭 레일 문법으로 | `components/team_sidebar/` | S |
| 019-5 | 파일럿 2 — 팀 드롭다운을 Slack 워크스페이스 메뉴 문법으로 | 팀 드롭다운 메뉴 | S |
| 019-6 | 파일럿 3 — 레일 프로필 아바타를 36 r8 리듬으로 정렬 | 레일 아바타 | S |
| 019-7 | 아이콘 규칙 4항 신설, icon-toolbar(18) 강등 | 아이콘 크기 규칙 | S |

### 020 — 아이콘·상단·팝업 연작 (S×12)

작은 단위 연쇄의 본보기다. 단위마다 커밋 1~2개로 끝났다.

| 단위 | 내용 | 대상 | 분량 |
|---|---|---|---|
| 020-1 | 레일 플러그인 아이콘 획 보강 | 레일 아이콘 | S |
| 020-2 | 상단 검색바·도움말 버튼을 Slack 상단 문법으로 | `global_header/`, `search_bar/` | S |
| 020-3 | 툴팁 Slack 스펙화, 상단 버튼 글리프 SVG 전환 | 툴팁, 상단 버튼 | S |
| 020-4 | 채널 헤더 우측 아이콘 그룹 정렬 | `channel_header/` | S |
| 020-5 | 멤버 스택 카운트 겹침 수리, 카운트 13/700 | 멤버 스택 | S |
| 020-6 | 크롬(레일·상단) 명도를 Slack Gray 재실측값으로 교정 | slate 프리셋 | S |
| 020-8 | 팝업 메뉴 여백·균형을 Slack 스펙으로 | 팝업 공통 여백 | S |
| 020-9 | 메시지 날짜 구분 알약을 Slack 문법으로 | `post_view/` 날짜 줄 | S |
| 020-10 | 메시지 호버 액션 바를 Slack 문법으로 | `post_view/` 액션 바 | S |
| 020-11 | 사이드바 필터를 라벨 알약 + 드롭다운으로 | `sidebar/` 필터 | S |
| 020-12 | 파일 패널 필터를 라벨 알약 + Menu v2로 | 파일 검색 필터 | S |
| 020-13 | 채널 즐겨찾기 별을 Slack 문법으로 | 채널 헤더 별 버튼 | S |

### 021~028 — 표면별 정밀 작업 (S~M×9)

| 단위 | 내용 | 대상 | 분량 |
|---|---|---|---|
| 021-1 | 글로벌 스레드 목록을 Slack 타이포 위계로 | `components/threading/global_threads/` | S~M |
| 022-1 | 사이드바 카테고리 명칭을 Slack 섹션 헤더 서식으로 | `components/sidebar/` 카테고리 | S |
| 022-2 | 카테고리 명칭 앞 특성 아이콘 추가 | 〃 | S |
| 022-3 | 카테고리 토글·아이콘 한 슬롯 전환, 섹션 간격 24 | 〃 | S |
| 022-4 | 빈 즐겨찾기 카테고리 상시 표시 | 〃 | S |
| 023-1 | 멤버 초대 행 이중 들여쓰기 교정 | `components/invitation_modal/` | S |
| 024-1 | 레일에 다크/라이트/시스템 테마 모드 토글 | 레일, 테마 모드 저장 | M |
| 025-1 | 미읽음 수 보조 뱃지 — 사이드바·읽지 않은 항목 페이지 | `sidebar/`, `unreads_view/` | M |
| 026-1 | 프로필 팝오버를 Slack 프로필 문법으로 | `components/profile_popover/` | M |
| 027-1 | 읽지 않은 항목 행에 멘션·일반 미읽음 뱃지 병기 | `unreads_view/` 행 | S~M |
| 028-1 | 레일 제품 아이콘을 비비드 액센트 솔리드로 | 레일 아이콘 | S~M |

### 번호 외 단위 — 독립 커밋과 유지보수 교정 (S×6)

spec 없이 커밋 단위로 끝난 작업이다. 성격은 위 단위들과 같다.

| 단위 | 내용 | 커밋 |
|---|---|---|
| 독립-1 | 상단 검색 바 폭을 Slack 기준 52vw로 확대 | `85d3997581` |
| 독립-2 | 프로필 버튼을 사이드바 좌측 하단으로 이동 | `85a8a9a80c` |
| 교정-1 | 활성 채널 행에서 옵션(⋯) 아이콘이 배경에 묻히는 문제 | `ea20fa2bff` |
| 교정-2 | 보드·플레이북에서 복귀하면 테마가 풀리는 문제 | `aea9506346` |
| 교정-3 | 접힌 채널 사이드바가 센터 이동으로 닫히지 않는 문제 | `d50de65620` |
| 교정-4 | 사이드바 정적 링크 클릭 시 모바일 LHS를 닫는다 | `66e916361e` |

### 연계 기능 spec — 디자인 표면을 함께 세운 것

기능 spec이지만 로드맵의 표면과 맞닿아 있어 참조한다.

| Spec | 표면 | 로드맵 연계 |
|---|---|---|
| 008 검색 RHS 팝아웃 | `rhs_search_popout/`, `popout_controller/` | 4·7순위와 일관성 유지 |
| 012 이미지 미리보기 줌·팬 | `file_preview_modal/` 동작 계층 | 8순위의 선행 산출물 |

### 요약

채널 화면의 **크롬(레일·사이드바·헤더)과 전역 토큰은 사실상 마감됐다.**
완료 단위는 총 47개 — spec 단위 41 + 번호 외 6. 남은 것은 본문 안쪽 표면,
팝업·모달 내부, 다크 테마의 정밀 설계, 그리고 채널 화면 밖 페이지다.

## 2. 컴포넌트 전수 대조 (2026-10-15)

`webapp/channels/src/components/` 최상위 디렉터리 약 270개를 로드맵과 대조했다.
판정 기준은 두 가지다 — ① 포크의 디자인 커밋(014~028)이 닿았는가,
② 사용자가 보는 표면인가. 결과는 네 묶음이다.

| 판정 | 처리 |
|---|---|
| 완료 — 014~028이 이미 마감 | 1절에서 작업 단위로 분해해 기록 |
| 로드맵에 있으나 범위가 좁았다 | 해당 항목의 범위를 컴포넌트 단위로 확대 (5절에 반영) |
| 로드맵에서 누락 | 신규 항목으로 추가 — 마크다운 타이포, 빠른 전환기, 파일 미리보기 모달, 공통 위젯, 사이드바 정적 뷰 |
| 미사용·저효과 표면 | 보류 목록으로 격리 (7절) |

## 3. 분량 기준

과거 실적에 맞춘 단위다.

| 등급 | 기준 | 과거 사례 |
|---|---|---|
| **S** | 커밋 1~3개. 경량 spec 또는 spec 없이 수정 | 023 초대 행 교정, 020 연작의 개별 항목 |
| **M** | spec 1건. 커밋 3~8개 | 026 프로필 팝오버, 027 뱃지 병기, 028 레일 아이콘 |
| **L** | spec 2건 이상으로 분할해야 한다 | 014 시각 체계, 019 토큰 |

L 항목은 그대로 착수하지 않는다. 이 문서에서 미리 쪼개 두었다.

## 4. 진행 원칙

1. **spec 1건 = 표면 1개.** 한 spec이 두 영역을 건드리면 분할한다. (022·027의 교훈 — 작게 쪼갠 작업이 검증도 빨랐다.)
2. **계측이 설계보다 먼저다.** Slack 쪽 실측값이 없는 표면(작성창, 이모지 피커, 다크 테마 등)은 `okrbest-design` 하네스로 Slack을 먼저 계측하고 격차 표를 만든 뒤 spec을 쓴다.
3. **019 토큰을 재사용한다.** 간격·크기·모서리는 `specs/019-slack-layout-tokens/usage-guide.md`의 토큰에서 고른다. 새 값이 필요하면 토큰 기준표를 먼저 갱신한다.
4. **upstream 발산을 기록한다.** upstream 파일과 갈라지는 변경은 `docs/upstream-adapted-divergences.md`에 남긴다 (FR-019와 동일).
5. **구현 증거를 남긴다.** 기준선 게이트 diff, quickstart 실주행, SC 실측값 — constitution 원칙 I·III 그대로.

## 5. 우선순위 요약

효과가 큰 순서다. 효과는 "얼마나 많은 사용자가 얼마나 자주 보는 표면인가"로 매겼다.
★ 표시는 전수 대조에서 새로 추가된 항목이다.

| 순위 | 항목 | 효과 | 분량 | 선행 조건 |
|---|---|---|---|---|
| 1 | 메시지 작성창(컴포저) | **상** | M~L | Slack 작성창 계측 |
| 2 | 다크 테마 정밀 설계 | **상** | L (2분할) | Slack 다크 계측 |
| 3 | 메시지 표면 마감 (리액션·첨부·마크다운 타이포★) | **상** | M×3~4 | 없음 |
| 4 | RHS 패널 전체 (스레드·채널 정보·멤버·북마크·핀/저장) | 중상 | M×2 | 없음 |
| 5 | 팝업 계층 통일 (피커·자동완성·컨텍스트 메뉴★) | 중상 | M×2~3 | 이모지 피커 계측 |
| 6 | ★ 빠른 전환기 (Ctrl+K) | 중상 | S~M | Slack 전환기 계측 |
| 7 | 검색 결과 화면 (파일 검색 포함) | 중 | S~M | 없음 |
| 8 | ★ 파일 미리보기 모달·업로드 오버레이 | 중 | M | 없음 |
| 9 | 설정·운영 모달군 | 중 | L (5분할) | 환경설정 모달 계측 |
| 10 | ★ 공통 위젯·폼 프리미티브 정렬 | 간접(기반) | M | 9a와 연계 |
| 11 | ★ 사이드바 정적 뷰 — 임시 저장·예약(drafts)·리캡 | 중 | S~M | 없음 |
| 12 | 빈 상태·로딩 스켈레톤 | 중 | S~M | 없음 |
| 13 | 토스트·배너·메시지 소품 | 중하 | S×2 | 없음 |
| 14 | 로그인·가입·주변 페이지 + 온보딩 플로우 | 중하 | M~L (2분할) | 브랜드 결정 |
| 15 | 모바일웹 드로어 마감 | 중하 | S~M | 드로어 열린 상태 계측 |
| 16 | 접근성 재감사 | 게이트 | S (반복) | 각 물결 종료 시 |
| — | System Console·과금 표면·통합 관리·플러그인 | 하 | L | **보류** (7절) |

## 6. 항목별 상세

### 1순위 — 메시지 작성창(컴포저)를 Slack 문법으로

- **왜 1순위인가**: 모든 사용자가 매일, 화면 중앙 하단에서 상호작용하는 유일한 입력 표면이다. 크롬이 마감된 지금, 체감 격차가 가장 크게 남은 곳이다.
- **범위**: 입력창 테두리·포커스 링, 포매팅 툴바 아이콘·간격, 전송/예약 버튼, 플레이스홀더 타이포, 첨부·이모지 버튼 배치, 스레드 답글 입력창과의 일관성.
- **비범위**: 에디터 기능(마크다운 처리, 멘션 로직) 변경. 시각 문법만 다룬다.
- **대상**: `components/advanced_text_editor/`, `components/advanced_create_post/`, `components/advanced_create_comment/`(스레드 답글), `components/textbox/`
- **분량**: M~L. 메인 작성창(M)과 스레드·편집 모드 입력창(S)으로 나눌 수 있다.
- **진행**: 복잡 — brainstorming 선행. Slack 작성창을 하네스로 먼저 계측한다 (현재 미계측).
- **검증**: 테두리·포커스·툴바 아이콘 크기 실측, 게이트 diff.

### 2순위 — 다크 테마를 정밀 설계한다

- **왜 지금인가**: 024에서 모드 토글을 노출해 다크 테마 사용이 늘었는데, Indigo·Onyx는 014에서 "대비 교정만" 했다 (014 비범위: "다크 모드 신규 설계는 하지 않는다"). 무채색 3단 크롬의 다크 대응이 없어서 라이트와 완성도 격차가 크다.
- **범위**: ① Slack 다크 테마 계측 → 다크 무채색 3단 프리셋 신설(라이트 slate의 짝) ② 의미색·반전 활성 표시·뱃지(025·027·028 산출물)의 다크 검증과 교정.
- **분량**: L — 두 spec으로 분할한다: **2a. 다크 프리셋 신설**(M), **2b. 다크에서 기존 산출물 전수 교정**(M).
- **진행**: 복잡 — brainstorming 선행. 다크 테마는 미계측 영역이다 (`okrbest-design` "남은 범위" 표).
- **검증**: 다크에서 SC-001~003 상당 항목 재실측 — 명도 3단 역순, 활성 반전 7:1, AA 0건.

### 3순위 — 메시지 표면을 마감한다

- **왜 지금인가**: 메시지 열람은 사용 시간의 대부분이다. 호버 액션 바(020-10)·날짜 알약(020-9)은 끝났지만 메시지에 붙는 나머지 요소가 구식 문법으로 남아 있다.
- **범위**: 분할해서 각각 M으로 진행한다.
  - **3a. 리액션 알약·리액션 추가 버튼** — 모양·간격·hover·내가 누른 상태 표시. `components/post_view/reaction*`, `components/post_emoji/`
  - **3b. 첨부 파일 카드·이미지 썸네일** — 카드 테두리·모서리·파일 아이콘·메타 타이포. `components/file_attachment/`, `components/file_attachment_list/`, `components/single_image_view/`
  - **3c. 링크 미리보기(OG 카드)·시스템 메시지(입장·퇴장 등) 톤 다운** — `components/post_view/embedded_bindings` 외. 필요 시 S로 축소.
  - **3d. ★ 마크다운 타이포** — 코드 블록(배경·모서리·고정폭 폰트), 인라인 코드, 인용 블록, 표, 목록 들여쓰기, 구분선. 본문 15px/22px(014)은 잡혔지만 블록 요소는 미정렬이다. `components/code_block/`, `components/markdown/`, `components/post_markdown/`, `sass/` 마크다운 규칙.
- **진행**: 각 항목 단순 — 바로 `/speckit-specify` 가능. Slack 쪽 수치는 메시지 영역 계측(완료분)에 일부 있고, 부족하면 해당 요소만 추가 계측한다. 3d는 Slack의 코드 블록·인용 실측을 추가한다.
- **검증**: 요소별 실측 + 게이트 diff.

### 4순위 — RHS 패널 전체를 마감한다

- **왜 지금인가**: 스레드 사용 빈도가 높다. 018(헤더)·021(스레드 목록)이 끝나 좌·상단은 Slack 문법인데, 우측 패널 내부는 격차가 남았다.
- **범위**: 전수 대조로 대상을 확정했다. 두 spec으로 나눈다.
  - **4a. 스레드 패널** — 패널 헤더·닫기 버튼, 루트 메시지와 답글의 구분선·들여쓰기. `components/rhs_thread/`, `components/threading/`, `components/rhs_header_post/`, `components/root_post_divider/`
  - **4b. 채널 정보·멤버·북마크·핀/저장 패널** — 섹션 위계, 행 서식, 카드형 목록. `components/channel_info_rhs/`, `components/channel_members_rhs/`, `components/channel_bookmarks_rhs/`, `components/rhs_card/`, 핀·저장 메시지 목록, `components/permalink_view/`(점프 하이라이트 포함).
- **분량**: M×2. **진행**: 단순 — 바로 specify. 008(검색 RHS 팝아웃)·thread_popout 산출물과 일관성 유지.
- **검증**: 우측 패널 계측(완료분)과 대조 재실측.

### 5순위 — 팝업 계층을 통일한다

- **왜 지금인가**: 이모지 피커·자동완성·컨텍스트 메뉴는 하루에도 수십 번 열린다. 020-8에서 팝업 여백의 기본은 잡았지만 개별 팝업은 미계측·미적용이다 (014 비범위: "이모지 피커·프로필 카드 등 미계측 팝업").
- **범위**: 분할한다.
  - **5a. 이모지 피커 + GIF 피커** — 그리드 간격, 카테고리 탭, 검색창, 스킨톤 선택. `components/emoji_picker/`, `components/gif_picker/` (M).
  - **5b. 자동완성 팝업** — 멘션·채널·슬래시 명령·이모지 자동완성의 행 높이·하이라이트·아바타 배치. `components/suggestion/`, `components/at_mention/` (S~M).
  - **5c. ★ 컨텍스트 메뉴 전수** — 메시지 ⋯ 메뉴, 메시지 액션 메뉴, 채널 헤더 메뉴, 계정 메뉴, 채널 이동 서브메뉴. 020-8은 여백만 잡았고 아이콘·구분선·위험 동작(빨강) 서식이 메뉴마다 다르다. `components/dot_menu/`, `components/actions_menu/`, `components/channel_header_menu/`, `components/user_account_menu/`, `components/widgets/menu/` (M — 공통 메뉴 위젯에서 한 번에 해결되면 S).
- **진행**: 5a는 Slack 이모지 피커 계측 선행. 5b·5c는 단순 — 바로 specify.
- **검증**: 팝업별 실측 + 토큰 준수 확인.

### 6순위 — ★ 빠른 전환기(Ctrl+K)를 Slack 문법으로

- **왜 이 순위인가**: Slack 사용 경험의 상징적 표면이고 파워 유저가 가장 자주 여는 모달인데 로드맵에서 빠져 있었다. 디자인 커밋이 한 번도 닿지 않았다.
- **범위**: 입력창 크기·타이포, 결과 행(아이콘·채널명·팀명·미읽음 표시), 선택 하이라이트, 하단 힌트 줄. 025의 뱃지 문법과 일관성.
- **대상**: `components/quick_switch_modal/`
- **분량**: S~M. **진행**: Slack 전환기(Cmd+K) 계측 선행, 이후 단순.
- **검증**: 행 높이·하이라이트 대비 실측.

### 7순위 — 검색 결과 화면을 마감한다

- **왜 지금인가**: 검색바(020-2)와 RHS 팝아웃(008)은 끝났고, 결과 목록의 타이포 위계·매치 하이라이트·필터 칩만 남았다. 021(스레드 목록)과 같은 성격의 작업이라 패턴 재사용으로 분량이 작다.
- **대상**: `components/search_results/`, `components/search_results_header/`, `components/file_search_results/`(파일 탭), `components/search_hint/`, `components/new_search/`
- **분량**: S~M. **진행**: 단순 — 바로 specify.

### 8순위 — ★ 파일 미리보기 모달·업로드 오버레이

- **왜 이 순위인가**: 012에서 이미지 줌·팬 기능은 넣었지만 미리보기 모달의 셸(헤더·툴바·배경)과 드래그 업로드 오버레이는 기본 스타일 그대로다. 파일 공유가 잦은 팀일수록 체감이 크다.
- **범위**: 미리보기 모달 헤더(파일명·다운로드·공개 링크 버튼), 하단 썸네일 스트립, 코드·문서 미리보기 타이포, 드래그 앤 드롭 오버레이, 업로드 진행 표시.
- **대상**: `components/file_preview_modal/`, `components/file_preview/`, `components/file_info_preview/`, `components/file_upload_overlay/`, `components/file_upload/`, `components/audio_video_preview/`
- **분량**: M. **진행**: 단순 — 바로 specify. 3b(첨부 카드)와 같은 물결에 두면 토큰을 공유한다.

### 9순위 — 설정·운영 모달군의 내부를 통일한다

- **왜 이 순위인가**: 모달 셸(스크림·그림자·모서리)은 014에서 마감했지만, 내부 폼·탭·행 구조는 Mattermost 기본 그대로다. 전수 대조 결과 모달 컴포넌트가 40여 개라 한 공통 패턴으로 묶어 푸는 것이 유일한 현실적 경로다.
- **범위**: L이므로 다섯으로 분할한다. 공통 폼 패턴(섹션 헤더·행·버튼 배치)을 9a에서 세우고 나머지가 따른다.
  - **9a. 환경설정 모달** — 공통 패턴 수립 포함. `components/user_settings/`, `components/settings_sidebar/` (M).
  - **9b. 채널 설정·알림 모달군** — `components/channel_settings_modal/`, `channel_notifications_modal/`, `rename_channel_modal/`, `edit_channel_header_modal/`, `edit_channel_purpose_modal/`, `channel_members_modal/` (S~M).
  - **9c. 프로필 편집·상태 설정** — 026(팝오버)과 일관성. `components/custom_status/`, 프로필 이미지 편집 (S).
  - **9d. 팀 설정·멤버 관리 모달군** — `components/team_settings_modal/`, `team_members_modal/`, `invitation_modal/`(023은 들여쓰기만 고쳤다), `channel_invite_modal/`, `more_direct_channels/` (S~M).
  - **9e. 메시지 동작 모달군** — 전달(`forward_post_modal/`), 스레드 이동(`move_thread_modal/`), 삭제 확인(`delete_post_modal/`), 리마인더·예약 시간 선택(`post_reminder_custom_time_picker_modal/`, `dnd_custom_time_picker_modal/`, `date_time_picker_modal/`, `edit_scheduled_post/`) (S~M).
- **진행**: 9a만 brainstorming 선행(공통 패턴 결정이 걸려 있다), 이후는 단순. 환경설정 모달은 미계측이므로 9a 착수 시 Slack 환경설정을 먼저 계측한다.

### 10순위 — ★ 공통 위젯·폼 프리미티브를 토큰에 정렬한다

- **왜 이 순위인가**: 버튼·입력·배지·태그·로딩 같은 프리미티브는 모든 모달과 패널에 깔린다. 효과는 간접적이지만, 9순위 모달군 작업의 비용을 절반으로 줄이는 기반 투자다.
- **범위**: 공통 위젯의 크기·모서리·포커스 링·disabled 상태를 019 토큰과 014 타이포 단계에 정렬. 개별 화면은 건드리지 않는다.
- **대상**: `components/widgets/`(badges·inputs·tag·menu·modals·popover·loading 등 20종), `components/quick_input/`, `components/outlined_input/`, `components/multiselect/`, `components/date_picker/`, `components/datetime_input/`, `components/confirm_modal_redux/`
- **분량**: M. **진행**: 복잡 — 위젯별 영향 범위 조사가 필요하므로 brainstorming 선행. 9a와 같은 물결에 두거나 직전에 끝낸다.
- **검증**: 위젯 스토리 단위 실측 + 전역 회귀는 게이트 diff와 주요 화면 스크린샷 대조.

### 11순위 — ★ 사이드바 정적 뷰를 마감한다 (임시 저장·예약·리캡)

- **왜 이 순위인가**: 015(읽지 않은 항목)·021(스레드 목록)과 같은 좌측 정적 뷰 계열인데 임시 저장/예약 메시지(drafts)와 리캡(recaps) 화면이 남았다. 이미 세운 목록 행 패턴을 재사용하므로 분량이 작다.
- **범위**: 목록 행 타이포·간격, 예약 시각 표시, 패널 헤더·탭을 015·021·027 산출물과 통일.
- **대상**: `components/drafts/`, `components/recaps/`, `components/edit_scheduled_post/`(9e와 경계 조율)
- **분량**: S~M. **진행**: 단순 — 바로 specify.

### 12순위 — 빈 상태와 로딩 스켈레톤

- **범위**: 채널 첫 화면(메시지 없음), 검색 결과 없음, 스레드 없음, 미읽음 없음 등의 빈 상태 카피·일러스트 자리·여백, 로딩 통일.
- **대상**: `components/no_results_indicator/`, `components/initial_loading_screen/`, `components/widgets/loading/`, 각 뷰의 빈 상태 분기.
- **분량**: 표면당 S. 묶어서 M 하나로 진행해도 된다.
- **진행**: 단순 — 바로 specify. 카피 추가 시 `en.json`·`ko.json` 동시 갱신 (원칙 V).

### 13순위 — 토스트·배너·메시지 소품

- **범위**: 전수 대조로 대상을 확대했다. 두 S로 나눈다.
  - **13a. 토스트·배너** — 새 메시지 토스트, 연결 끊김·공지 배너, 채널 상단 배너, 섹션 공지. `components/toast/`, `toast_wrapper/`, `scroll_to_bottom_toast/`, `hint-toast/`, `info_toast/`, `feature_toast/`, `announcement_bar/`, `alert_banner/`, `channel_banner/`, `system_notice/`, `section_notice/`, `notification_box/`
  - **13b. 메시지 주변 소품** — 입력 중 표시(`msg_typing/`), 새 답글 배너(`new_replies_banner/`), 타임스탬프(`timestamp/`), 우선순위 라벨(`post_priority/`).
- **분량**: S×2. **진행**: 단순.

### 14순위 — 로그인·가입·주변 페이지와 온보딩 플로우

- **왜 이 순위인가**: 첫인상을 만들지만 한 번 보고 지나가는 화면이다. 014 비범위였고 전역 토큰도 닿지 않는 영역이라 독립 작업으로 적합하다.
- **범위**: 둘로 나눈다.
  - **14a. 인증 페이지** — 로그인·가입·비밀번호 재설정·MFA·약관·오류 페이지의 타이포·버튼·여백을 채널 화면 토큰과 정렬. `components/login/`, `signup/`, `password_reset_form/`, `password_reset_send_link/`, `mfa/`, `terms_of_service/`, `error_page/`, `header_footer_template/` (M).
  - **14b. 온보딩 플로우** — 팀 선택·생성, 워크스페이스 준비, 온보딩 체크리스트, 투어 말풍선. `components/select_team/`, `create_team/`, `preparing_workspace/`, `onboarding_tasklist/`, `onboarding_tasks/`, `tours/` (M).
- **진행**: 복잡 — 리브랜딩(REBRAND.md) 방향이 걸려 있어 brainstorming 선행.

### 15순위 — 모바일웹 드로어 마감

- **범위**: 768px 이하 드로어가 열린 상태의 명도 층·간격 검증과 교정. 드로어 열린 상태는 미계측이다 (`okrbest-design` "남은 범위").
- **대상**: `components/sidebar/`의 모바일 분기, `components/mobile_channel_header/`, `components/mobile_sidebar_right/`
- **분량**: S~M (계측 포함). **진행**: 계측 → 격차가 있으면 specify.

### 상시 — 접근성 재감사 (게이트)

- 물결 하나가 끝날 때마다 계측 하네스로 AA 전수 재실측하고 미달 0건을 유지한다. 새 표면이 생길 때 역전(활성 항목이 더 안 읽히는 현상)이 재발하기 쉽다.
- **분량**: 회당 S.

## 7. 보류·제외 판정

전수 대조에서 사용자 노출이 없거나 효과 대비 분량이 과한 표면이다. 로드맵에 넣지 않고,
위 항목이 소진되거나 해당 기능을 실사용하게 될 때 재평가한다.

| 묶음 | 대상 | 판정 근거 |
|---|---|---|
| System Console | `components/admin_console/`, `widgets/admin_console/`, `analytics/`, `audit_table/` | 운영자 전용. upstream 변경이 잦아 머지 비용이 크다 |
| 과금·구독·트라이얼 | `cloud_*`, `purchase_modal/`, `seats_calculator/`, `start_trial_form_modal/`, `trial_benefits_modal/`, `learn_more_trial_modal/`, `downgrade_modal/`, `payment_form/` 등 | 자가 호스팅 포크에서 노출되지 않는 SaaS 표면 |
| 통합 관리 | `backstage/`, `integrations/`, `plugin_marketplace/`, `apps_form/` | 관리자·개발자 표면. 사용 빈도 낮음 |
| 플러그인 제품 | 보드·플레이북 화면 자체 | 별도 저장소 소관. 테마 연동 버그만 이 저장소에서 대응 (완료) |
| 기능 결합 표면 | `burn_on_read/`, `show_translation_modal/`, `request_join_channel_modal/` 등 upstream 신기능 UI | 해당 기능을 켜서 쓰게 될 때 그 기능 spec에 디자인을 포함 |

## 8. 물결(wave) 단위 묶음

한 물결은 spec 2~4건 분량이다. 물결이 끝나면 접근성 재감사를 돌리고 다음 물결로 간다.

| 물결 | 항목 | 내용 |
|---|---|---|
| **1차** | 1, 3a, 3b, 3d | 작성창 + 메시지 표면 — 본문 체감 완성 |
| **2차** | 2a, 2b | 다크 테마 — 모드 토글의 품질 완성 |
| **3차** | 4a, 4b, 5a, 5b, 6 | RHS·피커·전환기 — 보조 표면 통일 |
| **4차** | 10, 9a, 5c, 8 | 위젯 기반 → 모달 공통 패턴 → 메뉴·파일 모달 |
| **5차** | 9b, 9e, 11, 3c, 7 | 모달군 확산 + 잔여 마감 |
| **6차** | 12, 13a, 13b, 9c, 9d | 가장자리 — 빈 상태·토스트·소형 모달 |
| **7차** | 14a, 14b, 15 | 채널 밖 — 인증·온보딩·모바일 |

순서는 고정이 아니다. 사용자 피드백으로 특정 표면의 불만이 크면 그 항목을 앞당긴다.
4차 물결만 순서가 중요하다 — 공통 위젯(10)과 모달 공통 패턴(9a)이 뒤 물결의 비용을 줄인다.
