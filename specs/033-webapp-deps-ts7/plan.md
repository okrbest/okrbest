# Implementation Plan: webapp 의존성 2026-10·11 갱신과 TypeScript 7.0 전환

**Branch**: `033-webapp-deps-ts7` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/033-webapp-deps-ts7/spec.md`

## Summary

upstream webapp 유지보수 커밋 3개를 순서대로 반영한다: 10월 의존성(`4ca793bd`, TypeScript 5.6.3 → 5.9.3 포함), 11월 의존성(`20c15b9d`), TypeScript 7.0 전환(`a28b09d7`).

방식: 단계마다 upstream이 바꾼 버전을 포크 `package.json`에 옮기고, 고정된 npm(11.6.2)으로 lockfile을 다시 만든다. 소스 변경은 적용 가능한 것만 받고, 스냅샷은 포크에서 다시 생성해 검토한다. 게이트 목록을 기준선과 diff해서 새 실패가 0건일 때만 커밋한다.

TipTap 계열과 compass-ui는 옮기지 않는다. 조사 결과 10월분 출발점은 TipTap 10건과 override 1건을 빼면 포크와 같고, 손으로 맞출 소스는 두 파일(`cel_editor/editor.tsx`, `components/rollup.config.js`)뿐이다.

## Technical Context

**Language/Version**: TypeScript 5.6.3 → 5.9.3(S1) → 7.0.2 네이티브 타입 검사기 + 6.0.2 도구용 API(S3). Node 24.11.1, npm 11.6.2(고정)

**Primary Dependencies**: React 19.2.8 → 19.3.1, react-redux, react-select, styled-components, monaco-editor(webpack 플러그인), web-vitals 5 → 6, jest 30.1 → 30.5, @testing-library/*, @typescript-eslint 8.61 → 8.72, Parcel(shared), Rollup + @swc/core(components)

**Storage**: N/A

**Testing**: Jest + React Testing Library(`npm run test`), `tsc -b`(`npm run check-types`), eslint + stylelint(`npm run check`)

**Target Platform**: 브라우저 web app, 개발 macOS(arm64) + CI `ubuntu-24.04`(x64)

**Project Type**: npm workspaces 모노레포 webapp(`webapp/channels`, `webapp/platform/*`)

**Performance Goals**: 기능 변화 없음. 프로덕션 빌드 산출물 크기 변화를 기록만 한다(SC-004)

**Constraints**: lockfile은 고정 npm으로만 만든다(`engine-strict`, CI 재생성 diff 검사). 버전을 낮추지 않는다. `ko.json`을 바꾸지 않는다. CODEOWNERS 보호 경로 `.github/workflows/webapp-ci.yml`이 포함된다

**Scale/Scope**: 버전 변경 178건(apply 157·skip 21), 소스 파일 31개(clean 23·manual 2·skip 4·patch 교체 2, research R2·R3), 스냅샷 약 40개

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | 통과 | 단계마다 `check-types`·`check`·`test`를 돌리고 **기준선 목록 diff**로 판정한다(quickstart §1·§2). 기준선이 더럽다(tsc 5, eslint 106, stylelint 68)는 사실을 목록으로 남긴다 |
| II. npm workspaces 전용 | 통과 | npm만 쓴다. lockfile을 같은 커밋에 넣는다. patch-package 패치(`@types+react-bootstrap`)를 `webapp/patches/`에서 버전과 함께 교체한다 |
| III. 실패를 본 테스트만 | 조건부 통과 | 동작을 바꾸는 포크 쪽 수정이 생기면(R8: TS7 새 오류 수정 등) 테스트를 동반한다. upstream이 넣은 테스트는 원본 반영이다. 테스트 약화·`@ts-ignore` 덮기 금지(R8) |
| IV. 라이선스·리브랜드 | 통과 | 새 파일(`strip_css_imports.mjs`, `styles.d.ts`, `tsconfig.build.json`)의 Mattermost 헤더를 유지한다. 새 npm 의존성(@typescript/native 등)은 다음 NOTICE.txt 자동 갱신 대상이다 |
| V. i18n 동기화 | 통과 | 사용자 문자열을 바꾸지 않는다. `en.json`이 바뀌면 후속 목록에 올린다(FR-012) |
| VI. 브랜치·Conventional Commits·PR | 통과 | 작업 브랜치 `033-webapp-deps-ts7`에서 시작했다. 커밋은 `chore(webapp):` 접두사 + 본문에 `Upstream:` 링크. rebase merge. 보호 경로 변경은 리뷰 요건을 PR에 명시 |
| VII. Spec 주도 | 통과 | sync에서 spec으로 넘긴 과제를 파이프라인으로 처리한다 |
| VIII. 문서 문체 | 통과 | 산출물을 한국어로 썼다 |

**Post-design 재확인**: 통과. 다만 **constitution 문구 자체가 바뀌어야 한다**(R9). 원칙 I과 "기술·범위 제약"의 "TypeScript 5.6", "Node 20.11 / npm ^9||^10"을 실제 값으로 고친다. 사실 정정이라 PATCH 개정이며 같은 PR에 `docs:` 커밋으로 넣는다.

## Project Structure

### Documentation (this feature)

```text
specs/033-webapp-deps-ts7/
├── plan.md              # 이 파일
├── research.md          # Phase 0: 출발점 대조, 적용 가능성, tsc 바이너리, lockfile 절차
├── data-model.md        # Phase 1: 단계·버전 변경·소스 변경·기준선·스냅샷 기록 단위
├── quickstart.md        # Phase 1: 기준선 저장과 단계별 검증 명령
├── contracts/
│   └── shared-package-types.md   # @mattermost/shared 타입 산출물 계약
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 산출물(아직 없음)
```

### Source Code (repository root)

```text
webapp/
├── package.json                      # S1·S2·S3: 버전, overrides(react-intl), typescript 별칭
├── package-lock.json                 # 단계마다 재생성
├── patches/@types+react-bootstrap+*.patch   # S1: 0.32.35 → 0.32.37
├── channels/
│   ├── package.json                  # S1·S2·S3
│   ├── tsconfig.json                 # S3
│   ├── webpack.config.js             # S2: monaco 0.57 경로
│   └── src/
│       ├── components/…              # S1 소스 7파일, S2 cel_editor(manual)
│       ├── utils/performance_telemetry/   # S2: web-vitals 6
│       ├── tests/test_store.tsx      # S3
│       └── types/external/styles.d.ts     # S3 신규
└── platform/
    ├── client/        package.json·tsconfig(.build).json·src/websocket.test.ts   # S1·S3
    ├── components/    package.json·tsconfig.json·rollup.config.js(manual)        # S1·S2·S3
    ├── eslint-plugin/ package.json                                                # S1·S2
    ├── mattermost-redux/ package.json·tsconfig.json                               # S1·S2·S3
    ├── shared/        package.json·tsconfig.json·tsconfig.build.json(신규)·build/strip_css_imports.mjs(신규)   # S1·S2·S3
    └── types/         package.json·tsconfig.json                                  # S3

.github/workflows/webapp-ci.yml       # S3: check-types의 needs: check-lint 제거 (보호 경로)
.specify/memory/constitution.md       # 마감: TypeScript·Node·npm 문구 정정 (PATCH)
spec-docs/upstream/upstream-adapted-divergences.md   # 단계별 skip·manual 기록
```

**Structure Decision**: 기존 webapp workspaces 구조를 그대로 쓴다. 새 디렉터리는 upstream이 만든 `platform/shared/build/`(이미 존재)와 `channels/src/types/external/`(이미 존재) 안의 파일 추가뿐이다.

## 실행 순서

1. **기준선 저장**(quickstart §1). jest 실패 목록과 빌드 결과는 여기서 처음 측정한다.
2. **S1** 버전 118건 apply → `npm install` → 소스 7파일·patch 교체 → 스냅샷 재생성·검토 → 게이트 diff → 커밋.
3. **S2** 버전 18건 → `npm install` → 소스 3파일 + `cel_editor` 수동 → 게이트 diff·빌드 → 커밋.
4. **S3** 버전 21건(+ overrides) → `npm install` → tsconfig 7개·신규 3파일·`rollup.config.js` 수동·CI 1줄 → `tsc -b` 새 오류 처리(R8) → shared 계약 확인 → 게이트 diff → 커밋.
5. **문서**: divergences 기록, constitution PATCH, 장부 갱신 확인.

단계마다 lockfile 재생성 diff 0(quickstart §2a)과 Linux optional 바이너리 존재(S3)를 확인한다.

## 위험과 대응

| 위험 | 대응 |
|---|---|
| TS7이 포크 고유 코드에서 새 오류를 낸다(R8) | 포크 코드를 고친다. 새 오류가 20건을 넘으면 멈추고 보고, S3를 별도 PR로 나눌지 결정 |
| macOS에서 만든 lockfile에 Linux 바이너리 항목이 빠진다(R4) | S3 확인 명령으로 `@typescript/typescript-linux-x64` 항목을 검사. 빠지면 `npm install --os=linux --cpu=x64` 계열 옵션 또는 CI에서 재생성 |
| peer 표시가 빠진다(R5) | 고정 npm만 쓴다. `"peer": true` 개수 비교 |
| React 19.3·react-select 5.10 등으로 포크 고유 화면 스냅샷이 바뀐다 | upstream 목록 밖 스냅샷은 원인을 따로 기록(data-model §5) |
| Lexical(`@lexical/*`)의 react peer 범위가 19.3을 허용하지 않는다 | `npm install` 경고를 확인하고, 막히면 S1에서 react만 보류하고 보고 |

## Complexity Tracking

위반 없음. 기록할 항목 없음.
