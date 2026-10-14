# Research: 레일 제품 아이콘 액센트 색상 상태

**Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

Technical Context에 NEEDS CLARIFICATION은 없다. 아래는 설계 분기마다
무엇을 골랐고 왜 골랐는지의 기록이다.

## R1. 다크 분기 방식 — body 데이터 속성

**Decision**: `applyTheme()`([utils.tsx:359](../../webapp/channels/src/utils/utils.tsx#L359))
끝에 `document.body.dataset.themeType = theme.type;` 한 줄을 추가하고,
SCSS에서 `body[data-theme-type='Onyx'] ...`로 다크 전용 색을 건다.

**Rationale**: 테마는 `cssVars()`의 CSS 변수 치환으로만 적용되고, CSS가
테마 종류를 알 방법(클래스·속성)이 지금은 없다. 이 포크는 라이트=Slate,
다크=Onyx 고정 매핑(spec 024)이라 `theme.type` 문자열이 곧 모드다.
applyTheme는 모든 테마 적용(초기 로드·토글·시스템 추종·관리자 강제)이
지나는 단일 길목이라 한 줄로 전 경로를 덮는다.

**Alternatives considered**:
- `prefers-color-scheme` 미디어 쿼리 — 기각. 테마는 OS가 아니라 사용자
  토글로도 바뀐다(수동 light/dark). OS 다크 + 앱 라이트 조합이 깨진다.
- 테마별로 달라지는 기존 변수(`--button-bg` 등) 재활용 — 기각. Slate
  버튼색(#1264a3)과 Onyx 버튼색(#3c66c4)은 우리가 원하는 "라이트 인디고 /
  다크 밝은 인디고" 쌍이 아니다. 색 의미가 어긋난 변수를 빌려 쓰면 추후
  테마 조정 때 같이 끌려간다.
- cssVars에 신규 변수(`--okr-rail-*`)를 테마별 값으로 주입 — 기각.
  applyTheme의 변수 테이블은 upstream 코드라 수정 표면이 커진다. dataset
  1줄이 더 작다.

## R2-v3. 색 값 — 레퍼런스 실측 고정색 (최종)

**Decision** (2026-10-14 2차 확정 — 사용자 피드백 "배경색 느낌이 완전
다르다" + 레퍼런스 이미지 픽셀 실측):

| 용도 | 값 | 근거 |
|---|---|---|
| 평상시 배경 | `#0866FF` 솔리드 | 레퍼런스 이미지 배경 픽셀 실측값 |
| 평상시 아이콘 | `#fff` (`--neutral-0`) | 흰 아이콘 대비 4.82:1 |
| hover/focus 배경 | `#075EEB` | #0866FF를 살짝 어둡게, 대비 5.51:1 |
| 선택 배경 | `#4F46E5` 솔리드 | 같은 채도감의 비비드 인디고(사용자 선택), 대비 6.29:1 |
| 선택 아이콘 | `#fff` | 동일 |

세 색 모두 어두운 레일(#292c33) 위에서도 선명해 **라이트·다크 공용**이다 —
Onyx 전용 SCSS 분기를 제거했다. `body[data-theme-type]` 훅(R1)은 테마 분기
기반 시설로 유지한다(현재 레일 소비자는 없음, 계약 C1 유효).

v1(틴트 + denim 변수)·v2(틴트 + 테마 button-bg 변수)는 폐기 — 기록으로만
남긴다. 테마 변수는 Slate에서 탁한 남색(#1264A3)이라 레퍼런스의 채도감과
어긋났다.

---

### (폐기) R2-v2. 색 값 — 기존 토큰 변수만 사용

**Decision** (2026-10-14 구현 중 갱신 — 아래 "갱신 사유" 참조):

| 용도 | 값 | 출처 |
|---|---|---|
| 평상시 틴트 배경 | `rgba(var(--button-bg-rgb), 0.14)` | 테마 버튼 파랑 (Slate #1264A3 · Onyx #3C66C4) |
| hover/focus 틴트 | `rgba(var(--button-bg-rgb), 0.2)` | 같은 변수, 투명도만 상승 |
| 평상시 아이콘 (라이트) | `var(--button-bg)` (#1264A3) | 테마 변수 |
| 평상시 아이콘 (다크) | `var(--link-color)` (Onyx #5D89EA) | Onyx 테마 변수 — 어두운 레일 위 밝은 파랑 |
| 선택 배경 (라이트) | `var(--indigo-400)` (#28427B) | 기존 변수 ([_css_variables.scss:112](../../webapp/channels/src/sass/base/_css_variables.scss#L112)) |
| 선택 배경 (다크) | `var(--indigo-300)` (#32539A) | 기존 변수 |
| 선택 아이콘 | `#fff` (`--neutral-0`) | 기존 변수 |

**갱신 사유**: 애초 결정은 `--denim-button-bg(-rgb)`(#1C58D9 고정)였으나,
stylelint 게이트가 이 변수를 **deprecated로 금지**한다
(`declaration-property-value-disallowed-list`: "--button-bg를 쓰라").
게이트가 정본이므로(원칙 I) 테마 연동 `--button-bg`로 바꿨다. 부수 효과로
틴트가 테마를 따라가 다크에서 자동 보정된다.

**Rationale**: 전부 저장소에 이미 선언된 변수다 — 새 hex를 심지 않아
팔레트 정본이 갈라지지 않는다. 틴트 14%는 spec 025의 보조 뱃지 틴트
(`rgba(var(--button-bg-rgb), 0.14)`)와 같은 변수·농도 관례를 그대로 따른다.

**대비 검증(사전 계산)**: 흰 아이콘 대비 — #28427B 위 약 9.7:1, #32539A
위 약 7.4:1. 둘 다 WCAG AA(4.5:1)를 넉넉히 넘는다 (FR-009, SC-003).
실측은 quickstart에서 한다.

**Alternatives considered**: Onyx 선택 배경으로 `--button-bg`(#3C66C4) —
기각(브레인스토밍에서 사용자가 #32539A 선택, 2026-10-14). 평상시 다크
아이콘으로 라이트와 같은 #1C58D9 — 기각. 어두운 레일(#292c33) 위에서
대비가 약 1.9:1로 식별이 어렵다.

## R3. 아이콘 확대·굵기 — CSS 치수 + 기존 획 보강 유지

**Decision**: `.rail-product-button__icon svg`의 치수를
`var(--okr-icon-rail)`(24px) 참조에서 28px로 올린다. 토큰 자체는 건드리지
않고 이 블록에서만 오버라이드한다(주석으로 사유 명기). 획 보강은 기존
규칙 유지 — 평상시 `stroke-width: 0.6`, 선택 시 `0.8`.

**Rationale**: `--okr-icon-rail`은 spec 019 기준표의 정본 토큰이라 값을
바꾸면 기준표 갱신 의무가 생긴다(\_tokens.scss 머리말). 이번 요구는 "이
알약에서 꽉 차 보이게"라는 국소 요구이므로 블록 한정 오버라이드가 맞다.
28/36 ≈ 78%로 "꽉 차 보이는" 비율이 되고, 0.8 초과 stroke는 글리프 안쪽
투명부를 잠식한다는 기존 주석 제약(1.0 이상 금지)을 지킨다.

**Alternatives considered**: `--okr-icon-rail`을 28로 변경 — 기각(기준표
갱신 의무 + 토큰 공유처 파급). `<Glyph size={28}/>`로 TSX 수정 — 기각.
치수는 이미 CSS가 지배하고 있어(TSX의 size=20은 CSS에 덮임) CSS 한 곳이
정본이다.

## R4. 반투명 제거 범위 — 버튼 전체 opacity만 걷는다

**Decision**: `.rail-product-button`의 `opacity: 0.73`과 hover/active의
opacity 복원 규칙을 제거한다. 라벨 명도 위계(600/700)는 유지한다.

**Rationale**: 버튼 전체 반투명은 틴트·솔리드 색을 설계값과 다르게
보이게 한다(FR-005). 비선택 라벨을 살짝 눌러 보이게 하던 효과는 틴트 대
솔리드의 배경 대비가 대신한다.

## R5. 테스트 전략 — JS 훅만 Jest, 스타일은 실주행

**Decision**: Jest로 검증하는 것은 applyTheme의 dataset 설정(신규 동작)
뿐이다. 기존 `utils.test.tsx`에 케이스를 추가한다 — Onyx 테마 적용 시
`document.body.dataset.themeType === 'Onyx'`, Slate 적용 시 `'Slate'`.
SCSS 상태별 색은 Jest(jsdom)로 계측 불가 — quickstart의 실주행 스크린샷
+ 대비 계측으로 SC-001~005를 판정한다.

**Rationale**: 원칙 III은 "동작을 바꾸는 변경"에 테스트를 요구한다. JS
동작 변경은 dataset 1줄이 전부고, 순수 CSS는 jsdom이 스타일시트를
적용하지 않아 테스트가 공허하다. 검증 공백은 quickstart 실주행으로 메우고
tasks에 사유를 적는다(조용히 넘어가지 않는다).
