# UI Contract: 레일 제품 버튼 알약

**Date**: 2026-10-14 | **Plan**: [../plan.md](../plan.md)

이 기능이 다른 코드와 맺는 계약 두 가지.

## C1. `body[data-theme-type]` 속성

- **제공자**: `applyTheme()`([utils.tsx](../../../webapp/channels/src/utils/utils.tsx)).
  테마를 적용할 때마다 `document.body.dataset.themeType = theme.type`을
  설정한다. 값은 테마 정의의 `type` 문자열 그대로 (`'Slate'`, `'Onyx'`,
  커스텀 테마는 그 type 값).
- **소비자**: SCSS 속성 선택자. 2차 색 확정(공용 고정색) 이후 레일 스타일은
  이 속성을 소비하지 않는다 — 속성은 향후 다크 분기용 기반 시설로 유지한다
  (research R2-v3).
- **보장**: 모든 테마 적용 경로(초기 로드, 토글, 시스템 추종, 관리자
  강제)가 applyTheme를 지나므로 속성은 테마와 항상 일치한다.
- **비보장**: 속성이 없을 수 있다(applyTheme 이전의 첫 페인트). 향후
  소비자는 속성 부재를 라이트 기본값으로 처리해야 한다 — 다크 전용 규칙만
  속성에 걸고, 기본 규칙은 속성 없이 쓴다.

## C2. `.rail-product-button` 마크업과 상태 클래스 (기존 유지)

[rail_product_button.tsx](../../../webapp/channels/src/components/team_sidebar/components/rail_product_button.tsx)의
구조는 바뀌지 않는다:

```text
a.rail-product-button[.active][aria-current=page]
├── span.rail-product-button__icon > svg
└── span.rail-product-button__label
```

- 선택 상태의 유일한 신호는 `.active` 클래스 + `aria-current='page'`
  (기존 테스트가 이를 고정한다).
- 시각 사양은 [data-model.md](../data-model.md)의 상태 표가 정본이다.
- 치수: 알약 36×36 · radius 8 · 글리프 28×28. 글리프 28은 이 블록 한정
  오버라이드이며 `--okr-icon-rail`(24) 토큰 자체는 바꾸지 않는다
  ([research R3](../research.md)).
