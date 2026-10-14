# Implementation Plan: 레일 제품 아이콘 액센트 색상 상태

**Branch**: `028-rail-icon-accents` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-rail-icon-accents/spec.md`

## Summary

좌측 레일 제품 버튼(채널·보드·플레이북)의 36×36 아이콘 알약을 평상시
Accents Blue 틴트 + 파랑 아이콘으로, 선택 시 인디고 솔리드 + 흰 아이콘으로
바꾼다. 다크(Onyx)에서는 선택 배경을 밝은 인디고로 올려 어두운 레일과
구분한다. 아이콘 글리프는 24→28px로 키우고, 버튼 전체 반투명(0.73)을
걷어낸다.

기술 접근: 마크업([rail_product_button.tsx](../../webapp/channels/src/components/team_sidebar/components/rail_product_button.tsx))은
그대로 두고 **스타일만** 바꾼다. 테마는 CSS 변수 치환으로만 적용되고 CSS가
"지금 Onyx다"를 알 방법이 없으므로, `applyTheme()`(utils.tsx)에
`document.body.dataset.themeType = theme.type` 한 줄을 추가해
`[data-theme-type]` 속성 선택자로 다크 분기를 연다. 색 값은 전부 기존 CSS
변수(`--denim-button-bg-rgb`, `--indigo-400`, `--indigo-300`)를 재사용한다.

## Technical Context

**Language/Version**: TypeScript 5.6 + React (webapp/channels, npm workspaces),
SCSS

**Primary Dependencies**: 기존 것만 — css-vars-ponyfill(`cssVars`, applyTheme
경유), compass-icons 글리프. 신규 외부 의존성 없음

**Storage**: N/A — 시각 상태는 라우팅(`active` prop)과 테마 상태에서 파생

**Testing**: Jest + React Testing Library (`TZ=UTC`, en_US 고정).
applyTheme의 dataset 설정 단위 테스트 + 기존 rail_product_button 렌더 테스트
유지 확인

**Target Platform**: 웹 브라우저 (데스크톱 앱은 동일 webapp을 공유하는
범위까지 자동 적용)

**Project Type**: web application (모노레포의 `webapp/` 패키지)

**Performance Goals**: CSS 전환은 기존 transition 유지. JS 추가는 테마 적용
시 dataset 대입 1회 — 측정 가능한 비용 없음

**Constraints**: upstream 충돌 표면 최소화 — SCSS는 이 포크가 이미 소유한
`_team-sidebar.scss` 블록만 수정, utils.tsx는 1줄 추가. 사용자 노출 문자열
추가 없음. 색·치수는 기존 토큰 변수만 사용(새 hex 하드코딩 금지, 틴트
투명도 제외)

**Scale/Scope**: SCSS 1곳(`.rail-product-button` 블록), utils.tsx 1줄,
테스트 1~2벌. 컴포넌트 마크업 변경 없음

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획) | webapp만 접촉. `npm run check` + `npm run check-types` + `npm run test` 출력을 완료 근거로 제시한다. 구현 전 기준선 실패 목록을 저장하고 마감 때 diff로 판정한다 |
| II. npm workspaces 전용 | PASS | 의존성 추가 없음, lockfile 변경 없음 |
| III. 실패를 본 테스트만 인정 | PASS(계획) | applyTheme dataset 테스트를 구현 전에 작성해 RED 출력을 기록한 뒤 구현한다. 순수 CSS 변경분은 Jest로 검증 불가 — quickstart 실주행·대비 계측으로 판정하고, tasks에 그 사유를 적는다 |
| IV. 라이선스·리브랜드 | PASS | 기존 파일 헤더 유지. webapp은 Apache-2.0 존 |
| V. i18n 동기화 | PASS | 신규 사용자 노출 문자열 없음. en.json/ko.json 변경 없음 |
| VI. 집중 브랜치 + PR | PASS(계획) | 브랜치 `028-rail-icon-accents`, Conventional Commits, PR 경유 머지. master 직접 커밋 금지 |
| VII. Spec 주도 워크플로 | PASS | 본 파이프라인으로 진행 중. 구현은 `/speckit-implement`의 3-bis에서 TDD·verification 규율을 로드한 뒤 시작한다 |
| VIII. 명세 문서 언어·문체 | PASS | 본 plan 포함 산출물을 한국어로 작성 |

Phase 1 설계 후 재점검: 위반 없음 — 신규 추상화·신규 의존성·upstream 파일
수정이 모두 없다. Complexity Tracking 비움.

## Project Structure

### Documentation (this feature)

```text
specs/028-rail-icon-accents/
├── plan.md              # 이 파일
├── research.md          # Phase 0 — 색·분기 방식 결정 기록
├── data-model.md        # Phase 1 — 알약 시각 상태 모델
├── quickstart.md        # Phase 1 — 실주행 검증 가이드
├── contracts/
│   └── ui-rail-product-button.md   # Phase 1 — 알약 UI 계약
└── tasks.md             # Phase 2 (/speckit-tasks 산출 — 이 명령은 만들지 않음)
```

### Source Code (repository root)

```text
webapp/channels/src/
├── utils/
│   ├── utils.tsx                          # applyTheme에 dataset.themeType 1줄
│   └── utils.test.tsx                     # dataset 설정 단위 테스트 추가
├── sass/layout/
│   └── _team-sidebar.scss                 # .rail-product-button 블록 재작업
└── components/team_sidebar/components/
    ├── rail_product_button.tsx            # 변경 없음 (마크업 유지)
    └── rail_product_button.test.tsx       # 변경 없음 (회귀 확인만)
```

**Structure Decision**: 기존 webapp 구조를 그대로 쓴다. 신규 파일 없음 —
스타일은 포크 소유 블록(`_team-sidebar.scss`), JS 훅은 applyTheme 한 곳.

## Complexity Tracking

위반 없음 — 비움.
