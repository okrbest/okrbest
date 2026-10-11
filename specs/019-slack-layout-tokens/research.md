# Research: Slack 레이아웃 리듬 공통 토큰 체계

작성: 2026-10-11. Technical Context에 NEEDS CLARIFICATION은 없다 — 방법 결정
5건을 확정한다.

## R1. 실측 소스와 우선순위

- **Decision**: 1순위 실제 Slack 데스크톱 웹(app.slack.com, playwright-slack
  브라우저 프로파일)에서 `getBoundingClientRect`·`getComputedStyle` 실측.
  2순위 Figma Slack UI Kit(`6QkcWynu4O2YwZUov5IP75`)의 Auto Layout 수치
  (`get_design_context`). 두 소스가 다르면 실측을 채택하고 차이를 근거 란에
  남긴다.
- **Rationale**: 킷은 커뮤니티 복제본이라 제품 최신값과 어긋날 수 있다.
  014도 실측 우선 원칙으로 성공했다. 킷은 노드 단위 수치가 깔끔해 보조
  검증·누락 보완에 적합하다.
- **Alternatives considered**: 킷 단독(제품과 불일치 위험), 스크린샷 픽셀
  측정 단독(배율·안티앨리어싱 오차) — 모두 기각.

## R2. 토큰 형식과 위치

- **Decision**: `webapp/channels/src/sass/okrbest/_tokens.scss` 신설,
  `:root`의 CSS 변수로 정의. 네임스페이스 4계열 —
  `--okr-space-{1..7}`(4/8/12/16/20/24/32), `--okr-icon-{inline,aux,toolbar,main}`,
  `--okr-target-{s,m,l}`(24/28/32), `--okr-row-{sidebar,menu,...}`.
  radius 보강은 upstream `--radius-*`를 침범하지 않고 `--okr-radius-ms: 6px`
  하나만 추가한다.
- **Rationale**: 기존 `--okr-anim-*`(014)과 같은 패턴 — SCSS·JS 양쪽 소비
  가능, 테마 엔진과 무관, upstream 변수와 충돌 없음. SCSS 변수($)는 JS에서
  못 읽고 빌드 시점에 고정되므로 기각.
- **Alternatives considered**: upstream `_css_variables.scss`에 직접 추가
  (sync 충돌 비용), JSON 토큰 + 빌드 파이프(과설계) — 기각.

## R3. 치환 대상 전수 조사 방법

- **Decision**: 치환 범위는 포크 신설 SCSS로 한정 — `sass/okrbest/*.scss`,
  `channel_header_tabs.scss`, `channel_member_stack.scss`,
  `channel_bookmarks_rhs.scss`(+ 스캔으로 추가 발견분). px 리터럴을 grep으로
  전수 목록화하고, 각 항목에 "현재 렌더 값과 같은 토큰"을 대응시킨다. 대응
  토큰이 없는 값(1px 선, 2px 등)은 예외 목록에 등록한다. **값을 바꾸는 치환은
  금지** — 이 단계는 이름 붙이기다.
- **Rationale**: upstream 파일을 건드리면 sync 충돌 비용이 토큰 이득을
  넘어선다. 무변화 원칙이 시각 회귀 0(SC-002)을 구조적으로 보장한다.
- **Alternatives considered**: upstream 포함 전면 치환(충돌 폭탄),
  수동 선별(전수성 보장 불가) — 기각.

## R4. 비그리드 값 전수 검사 집행 방법

- **Decision**: `scripts/okrbest/check-layout-tokens.sh` — 대상 SCSS에서 px
  리터럴을 추출해 허용값(그리드 단계 ∪ 예외 목록 파일)과 대조, 위반을
  파일:줄로 보고하고 비0 종료. 예외 목록은 `_tokens.scss` 주석 블록이 아닌
  별도 허용 목록(스크립트 내 또는 인접 파일)으로 둬 diff 리뷰가 쉽게 한다.
- **Rationale**: stylelint 커스텀 플러그인은 작성·유지 비용이 크고 upstream
  설정과 얽힌다. grep 스크립트는 CI·로컬 어디서든 즉시 돌고 SC-004를 그대로
  기계 판정한다. 검사 자체도 원칙 III을 따른다 — 위반 샘플을 심어 RED를 먼저
  본다.
- **Alternatives considered**: stylelint declaration-property-value-allowed-list
  (okrbest 파일만 스코프하기 번거로움, 예외 표현력 부족), 리뷰 수칙만(집행력
  없음) — 기각.

## R5. 시각 회귀(무변화) 측정 방법

- **Decision**: 치환 대상 요소별 Playwright 실측 스크립트 — 셀렉터 목록을
  고정하고 `getComputedStyle`(해당 속성)과 `getBoundingClientRect`를 JSON으로
  덤프. 치환 전 1회(기준), 치환 후 1회 떠서 diff가 비어야 통과. 스크린샷
  픽셀 diff는 보조로만 쓴다(폰트 렌더 노이즈).
- **Rationale**: SC-002가 "실측 px 차이 0"이므로 computed 값 비교가 판정
  기준과 1:1로 맞는다. 018에서 같은 방식(실측 geometry)으로 겹침을 판정한
  전례가 있다.
- **Alternatives considered**: 전체 화면 스크린샷 diff(안티앨리어싱 오탐),
  육안 비교(증거 부적격) — 기각.

## R6. 아이콘↔폰트 균형표 근거 확보

- **Decision**: Slack 실측(글자 크기별 인접 아이콘의 실제 렌더 크기)을
  1차 근거로, `ui-ux-pro-max`의 typography/spacing 가이드라인 검색 결과를
  교차 검증으로 쓴다. 둘이 어긋나면 실측을 채택하고 가이드라인 항목을 근거
  란에 병기한다.
- **Rationale**: 균형표는 감각이 아니라 근거가 필요한 표다. 스킬 DB는 일반
  원칙(터치 타깃 최소값 등)의 안전망 역할을 한다.
- **Alternatives considered**: 스킬 DB 단독(Slack 리듬과 무관한 일반값),
  자체 판단(근거 부재) — 기각.
