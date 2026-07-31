<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0 (MINOR — 원칙 V에 upstream 선별 반영 예외 조항 추가)
- Modified principles:
  - V. i18n 동기화 — sync 중 en.json만 변경된 경우 ko.json 반영을 보고 후 별도 작업으로 미루는 예외 추가
- 이전 개정(1.0.0 → 1.1.0)에서 변경된 원칙:
  - III. 동작 변경 시 테스트 동반 — upstream 원본 cherry-pick 예외 + 접촉 패키지 검증 추가
  - VI. 집중 브랜치 + Conventional Commits + PR — upstream 반영 커밋 제목·sync PR 묶음 예외 추가
  - VII. Spec 주도 개발 워크플로 — upstream cherry-pick/adapt의 spec 파이프라인 예외 추가
- Added sections: 없음
- Removed sections: 없음
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check — 범용 게이트, 수정 불필요)
  - ✅ .specify/templates/spec-template.md (수정 불필요)
  - ✅ .specify/templates/tasks-template.md (수정 불필요)
- Follow-up TODOs: 없음
-->

# OKR.BEST (okrbest) Constitution

이 constitution은 okrbest 저장소(Mattermost 포크, OKR.BEST 리브랜드)의 개발 규칙을
규정한다. 기존 관례(`server/Makefile`, `webapp/package.json`, `.github/workflows/`,
`spec-docs/rebrand.md`, CODEOWNERS)에서 도출했으며, Spec Kit으로 생산되는 모든
spec 주도 작업에 적용된다. 문서 언어는 한국어, 코드 식별자·명령·경로는 원형 유지.

## Core Principles

### I. 패키지별 품질 게이트 (NON-NEGOTIABLE)

변경이 닿은 패키지의 게이트를 머지 전에 통과해야 한다.

- `server/` (Go 1.24.6): `make check-style`(golangci-lint + vet) + `make test-server`
  통과. 생성 mock은 `make mocks`로 재생성하여 최신 상태로 커밋하고, `go mod tidy`가
  클린해야 한다. CI 집행: `.github/workflows/server-ci.yml`.
- `webapp/` (React + TypeScript 5.6): `npm run check`(eslint + stylelint) +
  `npm run check-types`(`tsc -b`) + `npm run test`(Jest) 통과. CI 집행:
  `.github/workflows/webapp-ci.yml`.

게이트를 통과하지 못한 변경은 준비되지 않은 것이다. 게이트를 우회하는 커밋·머지 금지.

### II. webapp은 npm workspaces 전용

npm이 유일한 패키지 매니저다 (`webapp/package.json` workspaces: `channels/`,
`platform/*`). `package-lock.json`을 같은 변경에서 함께 커밋하고, yarn·pnpm 및
경쟁 lockfile 도입을 금지한다. 서드파티 패치는 `patch-package`로만 관리하며
`webapp/patches/`에 둔다.

### III. 동작 변경 시 테스트 동반

동작을 바꾸는 변경은 테스트를 동반한다.

- Go: 패키지 옆 colocated `_test.go` (gotestsum 실행).
- webapp: Jest + React Testing Library (`TZ=UTC`, en_US 고정).
- e2e: 신규는 `e2e-tests/playwright/`, 레거시는 `e2e-tests/cypress/`.

버그 수정은 회귀 테스트를 포함한다. 통과를 위해 테스트를 약화·스킵·삭제하는 것을
금지한다.

예외: upstream 선별 반영(`/speckit-sync`)에서 원본 그대로 cherry-pick하는 커밋
(`Upstream:` 참조 포함)은 테스트 동반 요건의 예외다. 대신 반영 직후 접촉 패키지
테스트로 회귀를 검증해야 한다. adapt(프로젝트 맞춤 수정) 커밋은 예외가 아니며 본
원칙을 그대로 따른다.

### IV. 라이선스·리브랜드 충실성 (NON-NEGOTIABLE)

`spec-docs/rebrand.md`의 규칙을 따른다.

- `Copyright (c) 2015-present Mattermost, Inc.` 헤더를 유지한다 — 제거·변경 금지.
- `NOTICE.txt`를 유지한다.
- 라이선스 존을 구분한다: Apache-2.0(`server/templates`, `server/i18n`,
  `server/public`, `webapp/`), AGPL v3(그 외 서버 코드),
  `server/enterprise/`(별도 제한 라이선스 — 임의 수정·재배포 주의).
- AGPL 소스 공개 의무를 준수한다. 상표(Mattermost) 사용에 주의한다.

리브랜드(OKR.BEST) 변경은 위 제약 안에서만 수행한다.

### V. i18n 동기화

사용자에게 표시되는 문자열을 추가·변경하면 `en.json`과 `ko.json`을 같은 변경에서
동시 갱신한다 (server: `server/i18n/`, webapp: `webapp/channels/src/i18n/`).
한국어는 이 포크의 1급 로케일이다. CI 집행: `.github/workflows/i18n-ci-pr.yml`.

**upstream 선별 반영(sync) 예외**: upstream 커밋에 i18n 파일이 포함되어 충돌이
발생하면 그 커밋을 처리하는 자리에서 해결한다(우리 `ko.json` 문자열 보존). 그
밖에 i18n 동기화가 필요해지는 경우 — upstream이 `en.json`만 변경해 `ko.json`
번역 추가·제거가 필요해진 경우 등 — 에는 sync 진행을 멈추지 않는다. 필요 사실을
사용자에게 보고만 하고 다음 커밋으로 넘어가며, 실제 `ko.json` 반영은 별도 작업으로
처리한다. 이 예외는 sync에만 적용되며, 포크 자체 기능 개발에는 위 원문이 그대로
적용된다.

### VI. 집중 브랜치 + Conventional Commits + PR

`master` 직접 커밋 금지. 작업당 브랜치 1개, PR 경유 머지. 커밋 메시지는
Conventional Commits 접두사(`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)를
사용하며 본문은 한국어 허용(기존 관례). PR은 집중적·최소 범위로 유지하고 무관한
리팩터·설정 변경을 섞지 않는다. DB 마이그레이션 디렉터리와 CI 설정은 CODEOWNERS
보호 경로(`@okrbest/okrbest`)이므로 변경 시 신중히 검토한다.

예외: upstream 선별 반영 커밋(`Upstream:` 참조 포함)은 추적성 보존을 위해 원본
커밋 제목을 유지할 수 있으며(Conventional Commits 접두사 면제), sync PR은 여러
upstream 커밋을 묶을 수 있다. 이때 병합은 커밋별 제목·본문이 보존되는 rebase
merge로 한정한다(squash 금지 — `Upstream:` 참조 소실 방지).

### VII. Spec 주도 개발 워크플로

기능 작업은 Spec Kit 파이프라인을 따른다:
`constitution → specify → (clarify) → plan → tasks → (analyze) → implement`.
명세 정본은 `specs/<NNN-feature>/`에 커밋한다. 기존 `spec-docs/feat-plan/`은
레거시 관례로 보존하되 신규 기능 명세는 `specs/`에 작성한다. 구현 규율은
superpowers 플러그인이 런타임에 집행한다: 실패 테스트 우선
(test-driven-development), 증거 기반 완료 선언(verification-before-completion),
근본 원인 우선 디버깅(systematic-debugging). superpowers는 원칙 I·III을
운영화하고, spec-kit은 spec/plan 산출물을 소유한다.

예외: upstream 선별 반영(`/speckit-sync`)의 cherry-pick/adapt 커밋은 커밋별
의도 분석·대화형 승인을 거치므로 spec 파이프라인 요건의 예외다. 대규모·큰 영향
upstream 커밋은 spec 분기로 본 파이프라인에 합류한다.

## 기술·범위 제약

- 모노레포: `server/`(Go 1.24.6, go workspaces), `webapp/`(React + TS 5.6,
  npm workspaces), `api/`(API 레퍼런스), `e2e-tests/`(Playwright + Cypress),
  `tools/mmgotool/`(i18n 도구).
- Node는 `.nvmrc`(20.11) 기준. webapp engine: Node `>=18.10.0`, npm `^9 || ^10`.
- 비밀값·자격증명은 커밋 금지 (`.env` 등은 .gitignore). `.specify/`에도 금지.
- 이 저장소는 `mattermost/mattermost`의 포크이며 원격은
  `okrbest/okrbest`(GitHub)다. 업스트림 구조 변경은 최소화하여 머지 충돌을 줄인다.

## 개발 워크플로

작은 수정은 브랜치 + PR로 직행. 기능·API 변경은 spec-kit 파이프라인으로 명세를
먼저 만든다. 복잡한 기능은 superpowers `brainstorming`으로 의도를 정리한 뒤
`/speckit-specify`로 넘긴다(핸드오프 규칙은 CLAUDE.md/AGENTS.md 참조). 기본 머지
대상은 `master`이며 리뷰된 PR + CI 통과가 조건이다.

## Governance

이 constitution은 다른 관례·문서보다 우선한다. 개정은 PR로 제안하고 버전을
시맨틱 버저닝으로 올린다(MAJOR: 원칙 제거·재정의, MINOR: 원칙 추가·실질 확장,
PATCH: 문구 명확화). 모든 PR·리뷰는 원칙 준수를 확인해야 하며, 원칙 위반이
필요한 경우 그 근거를 plan의 Complexity Tracking에 문서화한다.
`/speckit-plan`·`/speckit-analyze`가 Constitution Check 게이트로 자동 참조한다.

**Version**: 1.2.0 | **Ratified**: 2026-07-23 | **Last Amended**: 2026-08-01
