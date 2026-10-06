# Implementation Plan: Slack 디자인 벤치마킹

**Branch**: `feat/new-design` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: `specs/014-slack-design-benchmark/spec.md`

## Summary

Slack 채널 화면 계측값(`okrbest-design` 저장소)을 기준으로 OKR.Best 웹앱의
시각 체계를 재구성한다. 무채색 명도 3단 프리셋을 신설해 기본 테마로 지정하고,
사이드바 글자 알파를 걷어내고, 활성 채널을 반전으로 표시하고, 타이포그래피를
Slack 수치(본문 15/22, 제목 18/900, 크기 6단)로 올리고, 의미색을 전 프리셋에서
기준 대비 이상으로 교정한다. 레이아웃 골격은 유지한다. 모든 판정은 계측 하네스
재실측으로 한다.

기술 접근: Mattermost 테마 체계(프리셋 상수 + CSS 커스텀 프로퍼티) 안에서
해결한다. 값 변경은 기존 파일 인라인 수정(최소 diff), 추가 스타일은 포크 전용
오버라이드 파티얼로 격리한다. 신규 npm 의존 없음, 서버 코드 변경 없음(기본
테마는 웹앱 폴백 + 설정으로 지정).

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18), SCSS. 서버(Go) 코드 변경 없음

**Primary Dependencies**: 기존 webapp 스택만 사용. 신규 npm 의존 없음 — 폰트는
정적 파일(woff2)로 번들. `css-vars-ponyfill`(기존)이 테마 변수를 주입

**Storage**: N/A — 테마는 기존 서버측 사용자 환경설정 경로를 그대로 쓴다

**Testing**: Jest + React Testing Library (단위·대비 회귀), okrbest-design
계측 하네스(Playwright 실측)로 종단 판정. 원칙 I에 따라 구현 전 기준선 저장

**Target Platform**: 데스크톱 웹 (계측 기준 뷰포트 1024~1920px, DPR 2)

**Project Type**: 모노레포의 webapp (`webapp/channels`)

**Performance Goals**: 전환 애니메이션 전 구간 500ms 이하. 폰트 추가로 인한
초기 로드 증가는 woff2 + `font-display: swap`으로 완화 (한글 4굵기 합계 약 2MB)

**Constraints**: upstream 선별 머지 마찰 최소화 — 값 변경은 최소 diff, 구조
추가는 오버라이드 파티얼로 격리하고 `docs/upstream-adapted-divergences.md`에
기록. Apache-2.0(webapp) 저작권 헤더 유지. 폰트 라이선스(OFL) 고지 유지

**Scale/Scope**: 채널 화면 1개 영역 — 사이드바·전역 헤더·채널 헤더·메시지
목록·작성창·모달. 테마 상수 1곳, SCSS 6~8곳, 폰트 선언 1곳, i18n 2파일

## Constitution Check

*GATE: Phase 0 연구 전 통과 필수. Phase 1 설계 후 재평가.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| I. 패키지별 품질 게이트 | webapp만 접촉. `npm run check` + `check-types` + `test` 통과 출력을 완료 근거로 남긴다. 구현 전 기준선 실패 목록 저장, 마감 때 diff 판정 (FR-016) | PASS |
| II. npm workspaces 전용 | 신규 npm 의존 없음. 폰트는 정적 파일 추가라 lockfile 변경 없음 | PASS |
| III. 실패를 본 테스트만 인정 | 대비 회귀 테스트(프리셋 의미색 WCAG 계산)를 먼저 작성해 현재 값으로 실패를 확인한 뒤 교정한다. 테마 상수·폴백 변경도 동일. SCSS 시각 변경은 단위 테스트 불가 — 계측 하네스 실측이 그 자리를 맡고, 해당 과제에 사유를 적는다 | PASS |
| IV. 라이선스·리브랜드 충실성 | 신규 파일에 Mattermost 저작권 헤더. 폰트 OFL 고지를 fonts/README에 추가. 리브랜드 범위 밖 변경 없음 | PASS |
| V. i18n 동기화 | 신설 프리셋 이름 문자열을 `en.json`·`ko.json` 같은 변경에서 추가 (FR-018) | PASS |
| VI. 집중 브랜치 + Conventional Commits + PR | `feat/new-design` 브랜치, PR 경유 `master` 머지. 커밋은 `feat:`/`fix:` 접두사 | PASS |
| VII. Spec 주도 워크플로 | 본 파이프라인 진행 중. 구현 규율은 `/speckit-implement` 3-bis에서 로드 | PASS |
| VIII. 명세 문서 언어와 문체 | 본 문서 포함 산출물 전부 한국어 | PASS |

위반 없음 → Complexity Tracking 생략.

**Phase 1 설계 후 재평가**: 설계 산출물(research/data-model/contracts/quickstart)
작성 후 재검토 — 신규 의존 없음, 서버 코드 무변경, 테스트 전략에 실패 확인 절차
포함. 위반 없음 유지. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/014-slack-design-benchmark/
├── spec.md              # 기능 명세
├── plan.md              # 이 파일
├── research.md          # Phase 0 — 결정 11건
├── data-model.md        # Phase 1 — 테마 값·타입 스케일·토큰 정의
├── quickstart.md        # Phase 1 — 실행·검증 가이드
├── contracts/
│   └── measurement-contract.md   # SC ↔ 계측 항목 대응표
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트
└── tasks.md             # Phase 2 (/speckit-tasks 산출 — 이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
webapp/channels/src/
├── packages/mattermost-redux/src/
│   ├── constants/preferences.ts          # THEMES — 프리셋 신설 + 의미색 교정
│   ├── selectors/entities/preferences.ts # ThemeKey 확장, getDefaultTheme 폴백
│   └── utils/theme_utils.ts              # setThemeDefaults 의미색 기본값
├── utils/utils.tsx                       # applyTheme (변경 없음 예상, 검증만)
├── sass/
│   ├── base/
│   │   ├── _css_variables.scss           # FOUC 폴백을 신설 프리셋 값으로
│   │   └── _typography.scss              # 폰트 스택·@font-face 추가
│   ├── layout/
│   │   ├── _sidebar-left.scss            # 알파 0.64 제거, 활성 반전 (인라인 최소 diff)
│   │   └── _headers.scss                 # 채널 제목 18/900/행간
│   ├── components/_modal.scss            # 모달 마감 (그림자·헤어라인·8px)
│   ├── okrbest/_overrides.scss           # 신설 — 타입 스케일·모션 토큰·추가 스타일
│   └── styles.scss                       # 오버라이드 파티얼 마지막 import
├── fonts/                                # Noto Sans KR·Metropolis Black 추가 + README 고지
├── components/resizable_sidebar/         # 사이드바 폭 정책 (기본값 비례화)
└── i18n/{en,ko}.json                     # 프리셋 이름

docs/upstream-adapted-divergences.md      # 발산 기록 (FR-019)
```

**Structure Decision**: 기존 webapp 구조를 그대로 쓴다. 신설은
`sass/okrbest/_overrides.scss`(포크 전용 레이어)와 폰트 파일뿐이다. upstream
파일 수정은 값 변경(최소 diff)으로 한정하고, 선택자 추가·토큰 정의는 오버라이드
파티얼에 몰아 머지 충돌 면적을 줄인다.

## Complexity Tracking

위반 없음 — 해당 없음.
