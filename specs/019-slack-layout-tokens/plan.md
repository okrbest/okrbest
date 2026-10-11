# Implementation Plan: Slack 레이아웃 리듬 공통 토큰 체계

**Branch**: `019-slack-layout-tokens` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-slack-layout-tokens/spec.md`

## Summary

Slack 실측(실제 데스크톱 + Figma Slack UI Kit)에서 간격·아이콘 크기·버튼
타깃·행 높이의 기준표를 뽑아 CSS 변수 토큰으로 정본화하고, okrbest 커스텀
스타일의 하드코딩을 무변화 치환한다. 색·폰트·브랜드는 손대지 않는다
(014 체계 유지). 산출물은 토큰 SCSS 파일, 사용 가이드, 치환 diff, 전수
검사 스크립트다. 후속 영역 기능(헤더·툴바 → 사이드바 → 메시지)이 이
토큰을 소비한다.

## Technical Context

**Language/Version**: TypeScript 5.6 / SCSS (webapp 전용 — server 변경 없음)

**Primary Dependencies**: 기존 webapp 빌드 체계(webpack + sass), Playwright
MCP(실측·시각 회귀), Figma MCP(킷 수치 추출), `ui-ux-pro-max` 스킬(가이드라인
교차 검증)

**Storage**: 없음 — CSS 변수와 문서 파일

**Testing**: stylelint(`npm run check`), Jest(기존 스위트 회귀),
Playwright 실측 스크립트(치환 전후 computed px 비교)

**Target Platform**: 데스크톱 웹(≥769px). 모바일 반응형 수치는 범위 밖

**Project Type**: web (webapp/channels SCSS + specs 문서)

**Performance Goals**: 해당 없음 (정적 CSS 변수 — 런타임 비용 없음)

**Constraints**: 시각 회귀 0 (치환 전후 실측 px 동일), 색·폰트 변경 금지
(FR-007), upstream 파일 치환 금지 (okrbest 커스텀 파일로 한정)

**Scale/Scope**: 토큰 ~25개(간격 7 + 아이콘 4 + 타깃 3 + 행 높이 ~5 + 예외
~3), 치환 대상 okrbest 커스텀 SCSS 5~7개 파일, 신규 코드 없음(스타일·문서·
검사 스크립트만)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| I. 품질 게이트 | webapp만 접촉: `npm run check` + `check-types` + `test` — 기준선 실패 목록을 구현 전 저장, 마감 때 diff 제시 | 통과 가능 |
| II. npm workspaces | 의존성 추가 없음 — lockfile 변경 없어야 함 | 해당 없음 |
| III. 실패를 본 테스트만 | 동작 변경 없음(스타일 치환) — 단, 시각 회귀 측정은 "치환 전 실측 저장 → 치환 → 재실측 동일" 절차로 증거를 남긴다. 검사 스크립트(비그리드 값 탐지)는 위반 샘플로 RED를 먼저 본다 | 계획 반영 |
| IV. 라이선스·리브랜드 | 신규 파일에 Mattermost 저작권 헤더 유지, 상표 불사용 | 통과 가능 |
| V. i18n | 사용자 표시 문자열 없음(개발 문서·토큰뿐) | 해당 없음 |
| VI. 브랜치+PR | `019-slack-layout-tokens` 브랜치, rebase 머지 | 통과 가능 |
| VII. Spec 주도 | 이 파이프라인 자체 | 통과 |
| VIII. 문서 언어 | 본 문서 포함 전 산출물 한국어 | 통과 |

위반·우회 없음 → Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/019-slack-layout-tokens/
├── plan.md              # 이 파일
├── research.md          # Phase 0 — 실측 방법·토큰 형식 결정
├── data-model.md        # Phase 1 — 토큰 기준표(1차 후보값 + 확정 절차)
├── quickstart.md        # Phase 1 — 종단 검증 절차
├── contracts/
│   └── layout-tokens.md # 토큰 이름 규칙·불변 조건 계약
├── tasks.md             # Phase 2 (/speckit-tasks)
├── measurements.md      # 구현 산출 — Slack·Figma 실측 기록 (T003·T004)
├── coverage.md          # 구현 산출 — 후속 영역 완전성 대조표 (T008)
└── usage-guide.md       # 구현 산출 — 사용 가이드 (T014)
```

### Source Code (repository root)

```text
webapp/channels/src/sass/okrbest/
├── _tokens.scss             # 신설 — 레이아웃 토큰 정본 (:root CSS 변수)
├── _overrides.scss          # 치환 대상 (radius 6px·7px 등)
└── (기존 구조 유지)

webapp/channels/src/components/   # 포크 신설 컴포넌트 SCSS 치환 대상
├── channel_header/channel_header_tabs/channel_header_tabs.scss
├── channel_header/channel_member_stack/channel_member_stack.scss
└── channel_bookmarks_rhs/channel_bookmarks_rhs.scss

scripts/okrbest/
└── check-layout-tokens.sh   # 신설 — 비그리드 값 전수 검사 (SC-004)

specs/014-slack-design-benchmark/
└── figma-token-audit.md     # 선행 분석 노트 — 이 브랜치에서 커밋
```

**Structure Decision**: webapp 단독. 토큰은 기존 `--okr-*` 네임스페이스
관례(`_overrides.scss`의 `--okr-anim-*`)를 따라 `sass/okrbest/_tokens.scss`
한 파일에 모은다. upstream 파일은 수정하지 않는다 — 치환 범위는 포크가
만든 okrbest 커스텀 SCSS로 한정한다 (sync 충돌 비용 방지).

## Phase 0 → research.md 핵심 결정 (요약)

- **R1 실측 소스 우선순위**: 실제 Slack 데스크톱(playwright-slack 프로파일)
  실측 > Figma 킷 수치. 차이는 근거 기록에 남긴다.
- **R2 토큰 형식**: `:root` CSS 변수(`--okr-space-*`, `--okr-icon-*`,
  `--okr-target-*`, `--okr-row-*`) — 기존 `--okr-anim-*` 패턴과 일치,
  JS·SCSS 양쪽에서 소비 가능.
- **R3 치환 대상 전수 조사**: okrbest 커스텀 SCSS 한정 grep 스캔으로 목록화,
  치환은 "현재 렌더 값과 같은 토큰"으로만 (무변화 원칙).
- **R4 전수 검사 집행**: stylelint 커스텀 룰 대신 grep 기반 검사 스크립트 —
  예외 목록 파일과 대조해 비그리드 값을 보고.
- **R5 시각 회귀 측정**: Playwright `getBoundingClientRect`/`getComputedStyle`
  로 치환 지점별 전후 실측 JSON 비교.

상세와 대안 검토는 research.md에 기록한다.

## Phase 1 산출물 (요약)

- **data-model.md**: 토큰 기준표 — 분류·이름·1차 후보값·실측 근거·확정 상태.
  Figma 킷에서 이미 확정된 값(radius 4/6/8, 타입 12/13/15/18 lh 16/18/22/26)과
  실측으로 확정할 값(간격·행 높이)을 구분해 적는다.
- **contracts/layout-tokens.md**: 이름 규칙, 네임스페이스, 불변 조건
  (색 불변·치환 px 동일·비그리드 값은 예외 등록 필수), 소비자(후속 기능) 계약.
- **quickstart.md**: 종단 검증 — 토큰 로드 확인, 치환 전후 실측 비교 실행법,
  SC-001~005 확인 절차.

## 선행 조건

- 깨끗한 작업 트리에서 webapp 게이트 기준선 저장 (원칙 I). 현재 알려진 기준선:
  check-types 11건, `src/actions/views/channel.test.js` 23건 (018 마감 때 기록).
- webpack watch 가동 상태에서 치환 전 실측을 먼저 뜬다 (US2의 "전" 값).
