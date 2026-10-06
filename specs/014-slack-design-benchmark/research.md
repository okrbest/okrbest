# Phase 0 연구: Slack 디자인 벤치마킹

spec의 불확정 지점과 Technical Context의 미지수를 코드 확인으로 해소했다.
근거 위치는 전부 현재 작업 트리(`feat/new-design`, 기준 커밋 95b10f3907)다.

## R1. 신설 프리셋의 키와 이름

**Decision**: 테마 키 `slate`, 표시 이름 "Slate"(ko: "슬레이트").

**Rationale**: 기존 키(denim·sapphire·quartz·indigo·onyx)와 같은 "재질·색" 계열
명명이다. Slack의 해당 테마 이름(Gray)을 그대로 쓰면 상표 연상이 있고, 무채색
계열임을 드러내는 중립 단어가 필요하다.

**Alternatives considered**: `gray`(Slack 이름과 동일해 혼동), `okrbest`(테마
이름이 아니라 브랜드명이라 테마 추가 시 확장 불가).

## R2. 기본 테마 지정 방식

**Decision**: 두 곳을 함께 바꾼다 — ① `getDefaultTheme`의 폴백을
`THEMES.denim` → `THEMES.slate`로 변경
(`mattermost-redux/selectors/entities/preferences.ts:181`),
② FOUC 방지용 정적 폴백(`sass/base/_css_variables.scss:1-63`)을 slate 값으로
갱신. 서버 `ThemeSettings.DefaultTheme`(config)은 건드리지 않는다 — 폴백 변경만으로
미설정 사용자 전원이 slate를 받는다.

**Rationale**: 테마를 저장한 사용자는 저장값을 읽으므로 영향이 없다(FR-002,
SC-008). 폴백은 "저장 안 한 사용자"에게만 작동한다. 정적 폴백을 함께 바꾸지
않으면 첫 페인트에 옛 파랑(#145dbf)이 번쩍인다.

**Alternatives considered**: 서버 config `ThemeSettings.DefaultTheme`으로 지정 —
배포 환경 설정에 의존하게 되어 코드만으로 기본값이 보장되지 않는다. 운영 중
config로 다른 프리셋을 기본으로 바꾸는 길은 그대로 열려 있다.

## R3. 활성 채널 반전 구현

**Decision**: 활성 항목을 `배경 = var(--sidebar-text-active-border)`,
`글자 = var(--sidebar-text-active-color)`로 칠한다. slate는
`sidebarTextActiveBorder: #333133`, `sidebarTextActiveColor: #F8F8F8`로 Slack과
같은 반전이 되고, 파랑·다크 프리셋은 각자의 보색 짝으로 반전된다. 현재 활성
표시인 8% 알파 배경(`_sidebar-left.scss:1144-1163`)과 좌측 4px 바
(`:1174-1184`)는 제거한다.

**Rationale**: Mattermost 테마 모델에는 "활성 배경" 필드가 없다. 새 필드를
추가하면 커스텀 테마 호환과 upstream 머지가 깨진다. 기존 두 필드를 재해석하면
모델 변경 없이 모든 테마(커스텀 포함)에서 반전이 성립한다.
`sidebarTextActiveColor`는 현재 사이드바에서 아예 쓰이지 않음을 확인했다
(유일한 소비처는 `_post.scss:2175`) — 라벨 그대로 "활성 글자색"으로 살린다.

**Alternatives considered**: ① Theme 타입에 `sidebarTextActiveBg` 신설 — 모델
발산, 커스텀 테마 마이그레이션 필요, 기각. ② `배경 = var(--sidebar-text)` 직접
반전 — 테마 작성자가 활성색을 조정할 수 없게 된다, 기각.

**주의**: 기존 프리셋 5종의 `sidebarTextActiveBorder`는 가는 표시선용 밝은 색
(#57b5f0 등)이라 그대로 배경이 되면 어색하다. 5종의 두 필드 값도 반전 짝으로
교정한다(data-model.md 표). 커스텀 테마 사용자는 두 필드를 스스로 정한 값이
그대로 반전 짝으로 쓰인다 — 라벨 의미("활성 항목 테두리/글자")와 어긋나지 않는다.

## R4. 사이드바 알파 0.64 제거 방식

**Decision**: `_sidebar-left.scss`의 `rgba(var(--sidebar-text-rgb), 0.64)`를
`var(--sidebar-text)`로 인라인 치환한다(주 대상: L923, L1063, 카테고리 라벨
L592-606·L690-710, 기타 L183·221·299·455·512·519·841·867). 전역 헤더 텍스트
(`global_header.tsx:21`)도 같이 교정한다. 오버라이드 파티얼로 덮지 않는다.

**Rationale**: 값 치환은 diff가 줄 단위라 upstream 머지 충돌이 작다. 오버라이드
파티얼로 같은 선택자를 재선언하면 특이도 경쟁이 생기고 upstream이 선택자를 바꾸면
조용히 풀린다. FR-019의 "인라인 수정 최소화"는 구조 변경에 대한 규칙이고, 값
치환은 기록만 남기면 된다(`docs/upstream-adapted-divergences.md`).

**Alternatives considered**: 테마 값에 알파를 미리 섞은 밝은 회색을 넣는 방법 —
글자색 토큰의 의미가 깨지고 반전 구현(R3)과 충돌, 기각.

## R5. 한글 폰트 조달

**Decision**: Noto Sans KR을 woff2 정적 파일로 자체 호스팅한다. 굵기 3종 —
400(본문)·600(보조 강조)·900(제목·이름). `channels/src/fonts/`에 두고
`_typography.scss`에 `@font-face` 추가, 본문 스택을
`'Open Sans', 'Noto Sans KR', sans-serif`로 바꾼다. `font-display: swap`.
OFL 라이선스 고지를 `fonts/README.md`에 추가한다.

**Rationale**: 기존 폰트(Open Sans v18, Metropolis)와 같은 조달 방식이다(자체
호스팅, 외부 CDN 없음 — Assumption 4). 라틴은 Open Sans가 먼저 잡고 한글만
Noto로 떨어지므로 영문 자형은 바뀌지 않는다. Slack도 ko 로케일에서 NotoSansKR을
쓴다.

**Alternatives considered**: ① Pretendard — 품질은 좋으나 Slack 벤치마킹 취지
(NotoSansKR)와 다르고 Open Sans와 라틴 혼용 시 이질감. ② 가변 폰트 1파일 —
구간 전체(100-900)를 실어 3종 정적보다 커질 수 있고 기존 선언 방식과 다름. 기각.

## R6. 900 굵기 확보

**Decision**: ① 채널 제목(Metropolis 스택, `_headers.scss:217-228`)용으로
Metropolis Black(900) woff를 추가 번들한다(Metropolis는 Unlicense라 재배포
자유). ② 작성자 이름 등 본문 스택의 900은 Noto Sans KR 900(한글)이 맡고,
라틴은 Open Sans ExtraBold(800) woff2를 추가해 `@font-face`에서
`font-weight: 900`으로 등록한다 — 요청 900에 실파일 800이 매칭되어 합성 볼드
없이 렌더링된다.

**Rationale**: 현재 번들에는 900이 없다(Metropolis 300/400/600, Open Sans
300/400/600). 900을 선언만 하면 브라우저가 600을 집어 위계가 서지 않는다.
Open Sans에는 900이 없으므로(최대 800) 800을 900 슬롯에 등록하는 것이 가장
가볍다. 실측은 computed `font-weight: 900`을 확인하므로 SC-004를 만족한다.

**Alternatives considered**: Lato 900 추가(Slack 원본 폰트) — 폰트 패밀리가
하나 늘고 Open Sans와 혼재, 기각.

## R7. 본문 15px/22px 적용 지점

**Decision**: `.app__body`에 `font-size: 15px`를 선언해 채널 앱 전역 기준을
15px로 올리고(오버라이드 파티얼), 메시지 본문·작성창 입력의 행간을 22px로
명시한다. 사이드바 채널명도 15px로 올린다(`_sidebar-left.scss:1053-1065` 값
치환, 항목 높이 32px 유지). System Console(`--sys` 체계)은 범위 밖 그대로.

**Rationale**: 현재 14px은 Bootstrap 전역값에서 온다
(`bootstrap.css:1084-1087`). 요소별로 15px를 흩뿌리면 단계가 다시 갈라진다.
Slack도 기준 자체가 15px다. 명시 크기를 가진 컴포넌트는 영향을 받지 않으므로
확산 범위는 기준값을 상속하는 본문 계열로 한정된다.

**Alternatives considered**: 메시지 영역에만 15px — 작성창·RHS와 어긋나 한
화면에 14/15가 섞인다, 기각.

## R8. 사이드바 폭 정책

**Decision**: 기본 폭을 `clamp(180px, 19vw, 440px)`로 바꾼다
(`_sidebar-left.scss:7-33`의 `var(--overrideLhsWidth, 264px)` 폴백 교체,
뷰포트 단계별 max-width 264/304/440을 단일 `max-width: 440px`로 통합).
사용자가 드래그로 저장한 `--overrideLhsWidth`는 그대로 우선한다
(`resizable_sidebar` 체계 무변경). 768px 이하 드로어는 그대로.

**Rationale**: 19vw는 1024px에서 195px — 본문 1024−65−44−195 = 720px로 SC-006을
정확히 만족한다. 1920px에서는 365px로 Slack(443)보다 좁지만 본문 비율은
Slack과 거의 같다(OKR.Best는 앱바 44px가 추가로 있어 사이드바 비율을 Slack의
23%보다 낮춰야 본문이 같아진다). 드래그 리사이즈가 이미 구현돼 있으므로
기본값 공식만 바꾸면 된다.

**Alternatives considered**: Slack과 같은 23vw — 1024px에서 본문 680px로 SC
미달, 기각. 고정 240px — 비례 정책이 아니라 기각.

## R9. 모달 마감

**Decision**: `.GenericModal .modal-content`에
`box-shadow: 0 0 0 1px rgba(var(--center-channel-color-rgb), 0.13), 0 18px 48px rgba(0, 0, 0, 0.35)`
2겹과 `border-radius: var(--radius-m)`(8px)를 오버라이드 파티얼에서 선언하고
기존 `border`는 투명 처리한다. 스크림은 현행 0.64 유지(Slack 실효 0.61과 사실상
동일).

**Rationale**: Slack 방식 그대로다 — 헤어라인을 border가 아니라 spread 1px
그림자로 만들어 레이아웃을 밀지 않고, 큰 그림자를 겹친다. 현재 코드는
`--radius-l`(12px)에 그림자 없음(Bootstrap 기본만)이라 세 겹 중 두 겹이 없다.

**Alternatives considered**: 계측 문서의 "모서리 0px" 그대로 받기 — 재확인 결과
현재 코드는 이미 12px를 선언하고 있어 계측 시점과 다르다. 기준선 재계측으로
해소한다(Assumption 1).

## R10. 모션 토큰

**Decision**: 오버라이드 파티얼에 토큰 4개를 정의하고 사이드바 항목·아이콘
버튼·모달 전환에 적용한다.

```
--okr-anim-fast: 80ms        (배경·색 전환)
--okr-anim-base: 160ms       (레이아웃성 전환)
--okr-ease-out: cubic-bezier(0.36, 0.19, 0.29, 1)
--okr-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  (아이콘 transform 전용)
```

**Rationale**: Slack 실측 그대로다 — 배경 80ms 즉각, 레이아웃 160ms 감속,
스프링 느낌은 제어점 1.56 베지어. 500ms 초과 전환은 계측 하네스가 잡는다.

**Alternatives considered**: Slack의 7단 duration 토큰 전부 이식 — 쓰는 곳이
없는 토큰은 장식이다. 실제 쓰는 2단 + 커브 2종만 가져온다.

## R11. 의미색 교정 전략

**Decision**: 프리셋 5종의 의미색 값을 교정하고(`preferences.ts` THEMES),
테마에 값이 없을 때의 기본값을 `setThemeDefaults`(`theme_utils.ts:136-171`)
한 곳에서 기준 통과 값으로 정한다. 커스텀 테마 필드 구조는 바꾸지 않고 사용자
저장값도 건드리지 않는다(Assumption 3). **최종 hex는 대비 회귀 테스트가
판정한다** — 프리셋 전 조합(의미색 × 해당 배경)의 WCAG 대비를 계산하는 Jest
테스트를 먼저 작성해 현재 값으로 실패를 확인하고(원칙 III), 통과할 때까지 값을
조정한다. data-model.md의 값은 1차 후보다.

**Rationale**: "테마마다 의미색을 새로 조율해야 하는 구조"가 미달의 원인이므로,
기본값을 한 곳에 두면 앞으로 프리셋을 추가해도 재조율이 없다(FR-004). 테스트가
값을 고정하므로 이후 upstream 머지로 값이 되돌아가면 즉시 잡힌다.

**Alternatives considered**: 의미색을 테마 체계 밖 고정 CSS 변수로 분리 —
Mattermost 테마 모델(커스텀 테마 편집기 필드)과 충돌하고 upstream 발산이 큼,
기각. 교정 범위가 프리셋+기본값이면 같은 효과를 모델 변경 없이 얻는다.

## R12. 검증 전략 (기준선·종단)

**Decision**: 3층 검증.

1. **게이트 기준선** — 구현 전 `npm run check`·`check-types`·`test` 실패 목록을
   저장하고 마감 때 diff (원칙 I, FR-016).
2. **대비 회귀 테스트(Jest)** — 프리셋 6종(기존 5 + slate)의 의미색·사이드바
   대비를 WCAG 공식으로 계산해 단정. 구현 전 실패 출력 확보 (원칙 III).
3. **계측 하네스 실측** — `okrbest-design` 하네스의 대상(origin)을 로컬 개발
   서버로 돌려 구현 전 기준선을 재계측하고, 구현 후 같은 항목을 재서
   `slack-design` 기준값과 대조. SC 전 항목의 정본 판정이다
   (contracts/measurement-contract.md).

**Rationale**: SCSS 시각 변경은 단위 테스트가 닿지 않는다 — 하네스 실측이 그
자리를 맡는다는 사유를 해당 과제에 적는다(원칙 III). 하네스 대상은
`target.config.mjs`의 `origin`/`target`/`cookieDomain`만 로컬로 바꾸면 된다.

**Alternatives considered**: 운영(team.okrbest.com) 재계측만 — 배포 전 판정이
불가능하므로 로컬 실측을 정본으로, 운영 재계측을 배포 후 확인으로 둔다.
