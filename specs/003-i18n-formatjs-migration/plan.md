# Implementation Plan: i18n 추출 도구 마이그레이션 (mmjstool → @formatjs/cli)

**Branch**: `003-i18n-formatjs-migration` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-i18n-formatjs-migration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

`webapp/channels`의 i18n 메시지 추출 도구를 커스텀 `mmjstool`에서 `@formatjs/cli`로 교체하고, ESLint `formatjs/enforce-id` 규칙으로 명시적 메시지 ID를 강제한다. Clarifications에서 확정한 하이브리드 롤아웃(신규/수정 메시지는 즉시 강제, 기존 메시지는 파일·디렉터리 단위 배치로 순차 전환)에 따라, ESLint `overrides`로 아직 전환되지 않은 파일을 한시적으로 예외 처리하는 방식을 채택한다. `en.json` 포맷은 upstream이 추가한 커스텀 `scripts/formatter.js`(mmjstool과 동일한 대소문자 무시 정렬)를 그대로 적용해 diff 노이즈를 최소화하고, upstream이 제거한 Weblate 빈 번역 정리 기능(구 `clean-empty`/`check-empty-src`)은 okrbest의 `ko.json` 번역 자산 보호(constitution 원칙 V)를 위해 경량 스크립트로 대체 유지한다.

## Technical Context

**Language/Version**: TypeScript 5.6.3 (webapp), Node.js 20.11(`.nvmrc`) / 엔진 요구사항 `>=18.10.0`, ESM 빌드 스크립트(`.mjs`)

**Primary Dependencies**: 신규 도입 `@formatjs/cli`(webapp 루트 devDependency, 6.7.4부터 시작); 업그레이드 대상 `eslint-plugin-formatjs`(현재 webapp 루트 4.12.2 → upstream 실측 diff 기준 4.13.3); 변경 불필요 `babel-plugin-formatjs`(10.5.1, 이미 최신), `react-intl`

**Storage**: N/A — 파일 기반 JSON 카탈로그(`webapp/channels/src/i18n/en.json`, `ko.json`)

**Testing**: Jest + React Testing Library(`webapp/channels`, 기존 `npm run test`), ESLint(`npm run check`)로 `formatjs/*` 규칙 회귀 검증, CI `check-i18n` 잡의 추출 diff 검증

**Target Platform**: 로컬 개발 환경(Node) 및 GitHub Actions `ubuntu-24.04`(`check-i18n` 잡)

**Project Type**: 기존 웹 애플리케이션(webapp) 내 빌드/린트 도구 체인 교체 — 신규 서비스·프로젝트 생성 없음

**Performance Goals**: 로컬 `i18n-extract` 실행 시간이 기존 `mmjstool` 기반 추출 대비 동등하거나 단축(SC-004). 별도의 런타임 성능 요구사항 없음(빌드 타임 도구)

**Constraints**:
- `.github/workflows/webapp-ci.yml`은 CODEOWNERS 보호 경로 — 변경 시 코드오너 리뷰 필요.
- `en.json` 재정렬로 인한 diff 노이즈를 최소화해야 함(기존 mmjstool 정렬 방식 보존).
- Weblate가 빈 문자열 번역을 완전히 제거하지 않는 특성에 대한 안전장치(구 `clean-empty`/`check-empty-src`)를 반드시 대체 확보해야 함 — upstream처럼 단순 제거 불가.
- 단일 대규모 PR 금지(Clarifications 결정, FR-008) — 파일/디렉터리 단위 배치로 순차 진행.
- `en.json` 변경은 같은 변경에서 `ko.json`과 동시 반영(constitution 원칙 V).

**Scale/Scope**: `en.json` 약 6,858줄, `ko.json` 약 6,803줄. 코드 조사 결과 `localizeMessage` 호출부 98건이 이미 `{id, defaultMessage}` 객체 형태와 명시적 id를 사용 중 — upstream 대비 실제 리팩터링 범위가 좁을 가능성. 정확한 미표시 ID 메시지 수(배치 크기 산정 기준)는 `/speckit-tasks` 실행 시 `@formatjs/cli extract --throws` 실행 결과로 정량화한다.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 적용 | 평가 |
|---|---|---|
| I. 패키지별 품질 게이트 | 예 | webapp 변경 → 배치 PR마다 `npm run check` + `npm run check-types` + `npm run test` 통과 필요. |
| II. webapp은 npm workspaces 전용 | 예 | `@formatjs/cli`/`eslint-plugin-formatjs`는 npm으로만 설치, `package-lock.json` 동반 커밋. 경쟁 lockfile 없음. |
| III. 동작 변경 시 테스트 동반 | 예 | ESLint 규칙 활성화는 동작 변경 — 규칙별 fixture 또는 CI 검증 스크립트로 회귀 확인. 이 작업은 spec 분기 기능이며 원칙 III 예외(cherry-pick 전용)에 해당하지 않으므로 그대로 적용. |
| IV. 라이선스·리브랜드 충실성 | 예 | 배치 작업이 다수 파일을 건드리므로 Copyright 헤더가 보존되는지 배치별로 확인. |
| V. i18n 동기화 | 예(핵심 게이트) | `en.json`을 건드리는 배치는 같은 배치에서 `ko.json`도 함께 갱신. Weblate 빈 번역 정리 기능을 CI에서 대체 유지해 회귀를 차단. |
| VI. 집중 브랜치 + Conventional Commits + PR | 예 | 배치별로 별도 PR·좁은 범위 유지(대규모 단일 diff 금지, FR-008). CI/eslint 설정 변경은 CODEOWNERS 보호 경로이므로 리뷰 필요. |
| VII. Spec 주도 개발 워크플로 | 예 | 본 기능은 `/speckit-sync`에 의해 spec 분기로 전환되었으며, 표준 파이프라인(`specify → clarify → plan → tasks → implement`)을 그대로 따른다. |

**결과**: 위반 없음. Complexity Tracking 불필요(하이브리드 롤아웃 설계로 원칙 VI의 "집중 범위"와 대규모 리팩터 필요성 간 긴장을 이미 해소함).

## Project Structure

### Documentation (this feature)

```text
specs/003-i18n-formatjs-migration/
├── plan.md              # 이 파일 (/speckit-plan 명령 출력)
├── research.md          # Phase 0 출력
├── data-model.md         # Phase 1 출력
├── quickstart.md         # Phase 1 출력
├── contracts/
│   └── i18n-tooling-contract.md   # Phase 1 출력
├── tasks.md              # Phase 2 출력 (/speckit-tasks 명령 — 이 명령에서 생성하지 않음)
└── batches.md            # tasks.md 실행(T007) 중 생성되는 배치 인벤토리 — 이 명령에서 생성하지 않음
```

### Source Code (repository root)

```text
webapp/
├── package.json                      # devDependency: @formatjs/cli 추가, eslint-plugin-formatjs 버전 조정,
│                                      # i18n-extract / i18n-extract:check 워크스페이스 위임 스크립트 추가
├── channels/
│   ├── package.json                  # @mattermost/mmjstool 및 mmjstool 관련 스크립트 제거,
│   │                                  # i18n-extract / i18n-extract:check 스크립트를 @formatjs/cli 기반으로 교체
│   ├── .eslintrc.json                # formatjs 규칙 9종 추가(enforce-id 등) + additionalFunctionNames 설정,
│   │                                  # 배치 미완료 파일에 대한 한시적 overrides 예외 목록
│   ├── scripts/
│   │   └── formatter.js              # (신규) en.json 정렬을 기존 mmjstool과 동일하게 유지하는 커스텀 포매터
│   └── src/
│       ├── i18n/
│       │   ├── en.json               # 배치별로 갱신되는 영어 원본 카탈로그
│       │   └── ko.json               # 같은 배치에서 함께 갱신되는 한국어 카탈로그(Weblate 관리)
│       └── utils/utils.tsx           # localizeMessage — 이미 {id, defaultMessage} 객체 형태 사용 중
└── (platform/* 워크스페이스는 이번 마이그레이션 범위 밖)

.github/workflows/webapp-ci.yml        # check-i18n 잡을 mmjstool 기반에서 i18n-extract:check +
                                        # Weblate 빈 번역 정리 대체 스크립트 기반으로 교체 (CODEOWNERS 보호 경로)
```

**Structure Decision**: 기존 모노레포 구조를 그대로 사용하며 새로운 디렉터리·프로젝트를 만들지 않는다. 변경은 webapp 루트/`channels` 워크스페이스의 기존 파일들과 `.github/workflows/webapp-ci.yml`에 국한된다.

## Complexity Tracking

> 원칙 위반 없음 — 이 표는 비워둔다.
