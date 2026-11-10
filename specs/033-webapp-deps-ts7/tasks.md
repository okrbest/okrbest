# Tasks: webapp 의존성 2026-10·11 갱신과 TypeScript 7.0 전환

**Input**: `specs/033-webapp-deps-ts7/`의 plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**처리 원칙**: 포크가 의도적으로 갈라 둔 부분은 포크 것을 지킨다. 그 밖에는 upstream과 똑같이 받는다. 손으로 고치는 곳은 둘 사이가 충돌하는 자리뿐이고, 고친 내용은 모두 divergences 문서에 남긴다.

**Tests**: spec이 TDD를 요구하지 않는다. upstream 원본 테스트는 함께 받는다. 원칙 III에 따라 **동작이 바뀌는 upstream 소스 변경**은 단계마다 분류하고(T013·T021·T034) 증거를 남긴다: upstream 테스트가 있으면 코드보다 테스트를 먼저 넣어 실패를 보고, 스냅샷이 잡으면 재생성 전 실패 출력을 남기고, 빌드 설정은 빌드 결과로, 재현할 수 없는 것은 근거와 함께 `미검증`으로 적는다. 포크 코드를 고쳐 동작이 바뀌면 회귀 테스트를 먼저 쓴다(T038).

**Organization**: 단계 S1·S2는 US1, S3는 US2, 장부 차감은 US3에 둔다. 단계 순서가 곧 의존 순서다(S1 → S2 → S3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 다루고 앞 과제에 기대지 않아 동시에 할 수 있다
- **[Story]**: US1·US2·US3
- 경로는 저장소 루트 기준

---

## Phase 1: Setup

**Purpose**: 툴체인을 확인하고 작업 도구를 준비한다.

- [ ] T001 `cd webapp && node -v && npm -v`로 Node `v24.11.1`, npm `11.6.2`를 확인한다(`webapp/package.json` `engines`, `webapp/.npmrc` `engine-strict`). 다르면 멈추고 보고한다
- [ ] T002 `git fetch upstream`로 `upstream-master`에 `4ca793bd`·`20c15b9d`·`a28b09d7`이 있는지 `git cat-file -e <hash>`로 확인한다
- [ ] T003 [P] 버전 옮기기 임시 스크립트(커밋하지 않음, scratchpad)를 만든다. 인자로 upstream 커밋을 받아 `webapp/package.json`·`webapp/channels/package.json`·`webapp/platform/*/package.json`의 `dependencies`·`devDependencies`·`peerDependencies`·`overrides`에서 upstream 변경 전→후를 계산하고 data-model §2 규칙으로 포크 파일에 반영한다. 규칙: (1) `fork_current == upstream_before`이면 `upstream_after`로 바꾼다. 이때 `upstream_before`가 없으면 키를 **추가**하고, `upstream_after`가 없으면 키를 **삭제**한다. (2) `@tiptap/*`, `@mattermost/compass-ui`, 포크가 지운 항목(`overrides.@deanwhillier/jest-matchmedia-mock`, `b04f29a892`)은 건너뛴다. (3) 포크 값이 `upstream_after`보다 높으면 건너뛴다. (4) 그 밖에 `fork_current != upstream_before`이면 건너뛰고 "사람 판단 필요"로 출력한다. 의존성 섹션 **밖**의 필드(`scripts`, `targets` 등)가 바뀌었으면 고치지 않고 경고로만 출력한다. 키 순서, 2칸 들여쓰기, 끝 줄바꿈을 보존한다

---

## Phase 2: Foundational (모든 단계의 전제)

**Purpose**: 원칙 I에 따라 변경 전 기준선을 목록으로 남긴다. 이 Phase가 끝나기 전에는 버전을 옮기지 않는다.

- [ ] T004 작업용 디렉터리 `specs/033-webapp-deps-ts7/baseline/`을 만든다(커밋하지 않는다). quickstart §1의 `tsc.txt`를 저장하고 5줄인지 확인한다
- [ ] T005 [P] quickstart §1대로 `baseline/eslint.txt`(106건·25파일 기대)와 `baseline/stylelint.txt`(68건·12파일 기대)를 **파일 + 규칙 id** 단위로(줄 번호 없이) 저장한다
- [ ] T006 [P] `cd webapp && npm run test`의 실패 목록을 `baseline/jest.txt`에 저장한다(스위트·테스트 이름 단위)
- [ ] T007 [P] `cd webapp && npm run build` 결과(성공 여부, `webapp/channels/dist` 크기)를 `baseline/build.txt`에 저장한다
- [ ] T008 [P] `grep -c '"peer": true' webapp/package-lock.json` 값과 `"peer": true`가 붙은 패키지 경로 목록을 `baseline/peer.txt`에 저장한다

**Checkpoint**: 기준선 5종이 있다. 이후 판정은 모두 이 목록과의 diff로 한다.

---

## Phase 3: User Story 1 - 2026-10·11 의존성으로 올려도 webapp이 그대로 동작한다 (Priority: P1) 🎯 MVP

**Goal**: S1(`4ca793bd`)과 S2(`20c15b9d`)를 반영한다. TypeScript는 5.9.3이 된다.

**Independent Test**: S2 커밋 시점에서 quickstart §2(lockfile 재현성, peer, 게이트 diff, 스냅샷)와 §3 S1·S2 확인이 모두 통과한다. TS7 없이 단독 병합할 수 있다.

### S1 — 2026-10 의존성 (`4ca793bd`)

- [ ] T009 [US1] T003 스크립트를 `4ca793bd`로 돌려 `webapp/package.json`, `webapp/channels/package.json`, `webapp/platform/{client,components,eslint-plugin,mattermost-redux,shared}/package.json`을 고친다. 적용 118건, 건너뜀 11건(`@tiptap/*` 10, `overrides.@deanwhillier/jest-matchmedia-mock` 1), 사람 판단 0건, 비의존성 필드 경고 0건을 확인하고 목록을 남긴다
- [ ] T010 [US1] `webapp/patches/@types+react-bootstrap+0.32.35.patch`를 지우고 `git show 4ca793bd:webapp/patches/@types+react-bootstrap+0.32.37.patch`로 새 패치를 만든다(upstream 그대로)
- [ ] T011 [US1] `cd webapp && npm install`로 `webapp/package-lock.json`을 다시 만든다. patch-package가 0.32.37 패치를 적용하는지 출력으로 확인하고, peer·engine 경고를 기록한다(react 19.3과 `@lexical/*` peer 포함). 막히면 멈추고 보고한다
- [ ] T012 [P] [US1] `git show 4ca793bd -- <path> | git apply`로 소스 7파일을 upstream 그대로 반영한다: `webapp/channels/src/components/admin_console/custom_plugin_settings/custom_plugin_settings.test.tsx`, `webapp/channels/src/components/advanced_text_editor/send_button/send_post_options/core_menu_options.test.tsx`, `webapp/channels/src/components/advanced_text_editor/use_post_box_indicator.test.tsx`, `webapp/channels/src/components/file_attachment_list/media_gallery/file_archive.ts`, `webapp/channels/src/components/post_emoji/post_emoji.test.tsx`, `webapp/channels/src/components/timestamp/semantic_time.tsx`, `webapp/channels/src/plugins/channel_header_plug/channel_header_plug.tsx`. `wysiwyg_editor/` 4파일(TipTap)은 받지 않는다
- [ ] T013 [US1] S1 소스 변경 분류와 증거(원칙 III): `file_archive.ts`(`BlobPart[]` 캐스트)·`semantic_time.tsx`(`?? undefined`)는 **타입 전용**이라 tsc 통과로 확인한다. `channel_header_plug.tsx`(Fragment → `<span>`)는 **마크업 변경**이다. 스냅샷을 다시 만들기 전에 `cd webapp/channels && npx jest src/components/channel_header src/plugins/channel_header_plug`를 돌려 스냅샷 실패 출력을 남긴다. 테스트 파일 4개는 upstream 테스트 자체다
- [ ] T014 [US1] `cd webapp && npm run test -- -u`로 스냅샷을 다시 만든다. 바뀐 `.snap` 목록을 `git show --name-only --format= 4ca793bd -- '*.snap'`과 대조해서 data-model §5 형식으로 원인을 기록한다. upstream 목록 밖 파일은 포크 고유 화면이므로 원인을 따로 확인한다. upstream `.snap` 파일은 가져오지 않는다(포크 마크업 유지)
- [ ] T015 [US1] quickstart §2(a)~(c)를 돌린다: lockfile 재생성 diff 0, peer 목록 비교, tsc·eslint·stylelint·jest 새 항목 0줄. `typescript` 설치 버전이 `5.9.3`인지 확인한다. peer 표시가 기준선보다 줄었으면 해당 패키지를 찾아 원인을 기록하고, 고정 npm으로 다시 만들어도 남으면 멈추고 보고한다(FR-005). 새 실패는 systematic-debugging으로 원인을 찾아 고친다
- [ ] T016 [US1] S1을 커밋한다: 제목 `chore(webapp): 2026-10 의존성 갱신 (upstream #39222)`, 본문에 건너뛴 11건과 받지 않은 파일, 소스 분류(T013), 게이트 비교 요약, `Upstream: https://github.com/mattermost/mattermost/commit/4ca793bd9e78bc5b6055a7e0e4560849792f7dbe`

### S2 — 2026-11 의존성 (`20c15b9d`)

- [ ] T017 [US1] T003 스크립트를 `20c15b9d`로 돌려 `webapp/channels/package.json`, `webapp/platform/{components,eslint-plugin,mattermost-redux,shared}/package.json`을 고친다. 적용 18건, 건너뜀 10건(`@tiptap/*`), 사람 판단 0건, 비의존성 필드 경고 0건을 확인한다
- [ ] T018 [US1] `cd webapp && npm install`로 lockfile을 다시 만든다
- [ ] T019 [US1] 원칙 III 순서로 `reporter`를 반영한다: 먼저 `git apply`로 테스트 `webapp/channels/src/utils/performance_telemetry/reporter.test.ts`만 넣고 `npx jest src/utils/performance_telemetry`의 **실패 출력**을 남긴 뒤, `reporter.ts`를 넣고 통과를 확인한다(동작 변경: `interactionType`이 없으면 `labels`를 비운다)
- [ ] T020 [P] [US1] `webapp/channels/webpack.config.js`를 upstream 그대로 반영한다(`monacoEditorPath` 3줄)
- [ ] T021 [P] [US1] `webapp/channels/src/components/admin_console/access_control/editors/cel_editor/editor.tsx`의 `MONACO_EDITOR_OPTIONS`에서 `contextmenu: false,` 뒤에 upstream과 같은 빈 줄 + 주석 4줄 + `editContext: false,`를 손으로 넣는다. 우리 파일의 나머지(`CELEditorActions` 등)는 그대로 둔다. 원칙 III: upstream도 테스트가 없고, jsdom에 EditContext가 없으며 Monaco가 jest에서 렌더되지 않아 재현할 수 없다 → 과제 옆에 `미검증(jsdom 미지원, upstream 무테스트)`으로 적는다
- [ ] T022 [US1] 스냅샷을 다시 만들고 바뀐 목록의 원인을 기록한다(T014와 같은 방식)
- [ ] T023 [US1] quickstart §2와 §3 S2 확인을 돌린다: `editContext: false` 1줄, `npm run build` 성공(webpack 변경의 증거)과 산출물 크기 기록, 게이트 새 항목 0줄
- [ ] T024 [US1] S2를 커밋한다: 제목 `chore(webapp): 2026-11 의존성 갱신 (upstream #39583)`, 본문에 `cel_editor` 수동 적용과 `미검증` 사유, 건너뛴 10건, `Upstream: https://github.com/mattermost/mattermost/commit/20c15b9d2be5c7409a16b6831b5979de76812d4f`

**Checkpoint**: US1 완료. 여기서 멈춰도 TypeScript 5.9.3 상태로 병합할 수 있다.

---

## Phase 4: User Story 2 - TypeScript 7.0으로 타입 검사를 돌린다 (Priority: P2)

**Goal**: S3(`a28b09d7`)을 반영한다. `tsc`는 7.0.2 네이티브, `typescript`는 6.0.2 API가 된다.

**Independent Test**: S3 커밋 시점에서 quickstart §2와 §3 S3 확인, contracts/shared-package-types.md의 4개 항목이 통과한다.

- [ ] T025 [US2] T003 스크립트를 `a28b09d7`로 돌린다. 21건 모두 적용되는지 확인한다: 추가(`@typescript/native` 7곳, `overrides.react-intl`), 변경(`typescript` → `npm:@typescript/typescript6@6.0.2`, peer 범위 확장), 삭제(components `@rollup/plugin-typescript`, shared `@parcel/packager-ts`·`@parcel/transformer-typescript-types`). 비의존성 필드 경고 6건이 나오는지 확인한다(T026에서 처리)
- [ ] T026 [US2] 비의존성 필드를 옮긴다. 포크 값이 upstream 출발점과 **같은** 5곳은 upstream 값 그대로: `webapp/platform/components/package.json`의 `scripts.build`(`rollup -c && tsc -b`)·`scripts.clean`·`scripts.run`, `webapp/platform/shared/package.json`의 `scripts.build`·`targets`(`{"types": false}`). 포크 값이 **다른** `webapp/channels/package.json`의 `scripts.i18n-extract`는 포크 문자열을 유지하고 upstream이 더한 `--ignore "../**/*.d.ts"`만 포크의 큰따옴표 형식으로 `--ignore "**/*.d.ts"` 뒤에 넣는다
- [ ] T027 [US2] `cd webapp && npm install`로 lockfile을 다시 만든다. quickstart §3 S3의 `node -e` 명령으로 lockfile에 `node_modules/@typescript/typescript-linux-x64`·`-darwin-arm64` 항목이 있는지 확인한다. 없으면 plan 위험 표의 대응을 따른다
- [ ] T028 [P] [US2] `git apply`로 tsconfig 7개를 upstream 그대로 반영한다: `webapp/channels/tsconfig.json`, `webapp/platform/client/tsconfig.json`, `webapp/platform/client/tsconfig.build.json`, `webapp/platform/components/tsconfig.json`, `webapp/platform/mattermost-redux/tsconfig.json`, `webapp/platform/shared/tsconfig.json`, `webapp/platform/types/tsconfig.json`
- [ ] T029 [P] [US2] 신규 파일을 넣는다. `webapp/platform/shared/build/strip_css_imports.mjs`, `webapp/platform/shared/tsconfig.build.json`은 upstream 그대로. `webapp/channels/src/types/external/styles.d.ts`는 `*.scss`·`*.css` 선언만 받고 `@mattermost/compass-ui/styles`·`@mattermost/compass-ui/styles/standalone` 선언 2줄은 뺀다(포크는 compass-ui를 받지 않는다. 선언이 있으면 compass-ui import가 타입 검사를 조용히 통과한다). Mattermost copyright 헤더는 유지한다
- [ ] T030 [P] [US2] `git apply`로 `webapp/channels/src/tests/test_store.tsx`, `webapp/platform/client/src/websocket.test.ts`를 upstream 그대로 반영한다
- [ ] T031 [P] [US2] `webapp/platform/components/rollup.config.js`를 손으로 고친다: `import typescript from '@rollup/plugin-typescript'`를 `import {transform} from '@swc/core'`로 바꾸고, upstream `swc()` 함수(주석 포함)를 `externals` 배열 뒤에 그대로 넣고, 플러그인의 `typescript({outputToFilesystem: true})`를 `swc()`로 바꾼다. 포크의 `external: externals`는 유지한다(upstream의 `isExternal`은 제외한 compass-ui 이관 `e190c0f1` 소속, research R3)
- [ ] T032 [US2] `.github/workflows/webapp-ci.yml`의 `check-types` 잡에서 `needs: check-lint` 한 줄을 지운다(upstream 그대로, CODEOWNERS 보호 경로라 PR에 명시)
- [ ] T033 [US2] `cd webapp && npx tsc -v`가 `Version 7.0.2`, `node -e "console.log(require('typescript/package.json').version)"`가 `6.0.2`인지 확인한다
- [ ] T034 [US2] S3 소스 변경 분류와 증거(원칙 III): `test_store.tsx`(반환 타입 명시)·`websocket.test.ts`(`readyState` 타입)·tsconfig·`styles.d.ts`는 **타입 전용**이라 T035의 tsc 결과로 확인한다. `rollup.config.js`(빌드 도구 교체)는 T038의 components 빌드 결과로 확인한다. `shared` 빌드 방식 변경은 T037의 계약 확인으로 확인한다
- [ ] T035 [US2] `cd webapp && npm run check-types`를 돌리고 오류 목록을 `baseline/tsc.txt`와 diff한다. 새 오류 수를 센다. 20건을 넘으면 멈추고 사용자에게 보고한다(S3 분리 여부 결정, research R8)
- [ ] T036 [US2] T035의 새 오류를 포크 코드에서 고친다(파일별). upstream이 같은 코드를 고친 적이 있으면 그 방식을 따른다. 수정이 동작을 바꾸면 **고치기 전에** 그 동작의 회귀 테스트를 해당 파일 옆 `*.test.ts(x)`에 쓰고 실패 출력을 남긴다(원칙 III). 동작 변경이 없는 타입 수정이면 "타입 전용"으로 적는다. `@ts-ignore`·`@ts-expect-error`로 덮거나 테스트를 약화하지 않는다. 고친 파일과 이유를 기록한다
- [ ] T037 [US2] contracts/shared-package-types.md 확인: `cd webapp && npm run build --workspace=platform/shared` 후 `platform/shared/dist/{components,context,testing,types,utils}/index.d.ts` 5개 존재, `.d.ts`의 CSS import 0건, 테스트 파일 선언 없음, `grep -rn "from '@mattermost/shared'" webapp/channels/src webapp/platform` 0건
- [ ] T038 [US2] `cd webapp && npm run build --workspace=platform/components`가 성공하고 `dist` 산출물(모듈·CSS·선언)이 생기는지 확인한다(`rollup.config.js` 변경의 증거)
- [ ] T039 [US2] 스냅샷을 다시 만들고 원인을 기록한 뒤 quickstart §2 전체를 돌린다(lockfile diff 0, peer 목록, 게이트 새 항목 0줄, `npm run build` 성공·크기 기록). e2e 패키지 타입 검사(`cd e2e-tests/playwright && npx tsc --noEmit -p .`)의 오류 목록이 S3 전과 같은지도 본다
- [ ] T040 [US2] S3를 커밋한다: 제목 `chore(webapp): TypeScript 7.0으로 전환 (upstream #39697)`, 본문에 `rollup.config.js` 수동 적용, `i18n-extract` 포크 유지, `styles.d.ts` compass-ui 2줄 제외, 고친 포크 파일(T036), CI 1줄, `Upstream: https://github.com/mattermost/mattermost/commit/a28b09d787b0697e294c1efe916f4765002a0636`

**Checkpoint**: US2 완료. 타입 검사가 TS7로 돌고 shared 계약이 지켜진다.

---

## Phase 5: User Story 3 - sync 장부에서 세 커밋이 빠진다 (Priority: P3)

**Goal**: 세 커밋이 처리 완료로 집계되고, 포크가 지킨 부분과 받지 않은 부분이 기록으로 남는다.

**Independent Test**: quickstart §4의 grep 3줄과 장부 갱신 결과.

- [ ] T041 [US3] `spec-docs/upstream/upstream-adapted-divergences.md`의 인덱스 표에 세 커밋 행을 넣고, 끝에 단계별 절을 쓴다("우리 맞춤"·"버린 것" 표 형식). S1: 건너뛴 `@tiptap/*` 10건·`jest-matchmedia-mock` override, 받지 않은 `wysiwyg_editor/` 4파일, upstream `.snap`을 쓰지 않고 재생성한 사실. S2: `@tiptap/*` 10건, `cel_editor/editor.tsx` 수동 적용과 `미검증` 사유. S3: `rollup.config.js`의 `isExternal` 대신 `externals` 유지, `i18n-extract` 포크 문자열 유지(`--ignore` 1개만 추가), `styles.d.ts` compass-ui 선언 2줄 제외, T036에서 고친 포크 파일
- [ ] T042 [US3] 저장소 루트에서 `SYNC_BASE_BRANCH=HEAD .specify/scripts/bash/upstream-sync.sh update`를 돌리고, `for h in 4ca793bd 20c15b9d a28b09d7; do git log HEAD --oneline --grep="$(git rev-parse $h)" | head -1; done`가 3줄을 내는지 확인한다(SC-007: spec 미구현 8 → 5건)

---

## Phase 6: Polish & Cross-Cutting

- [ ] T043 `.specify/memory/constitution.md`를 PATCH 개정한다: 원칙 I과 "기술·범위 제약"의 webapp `TypeScript 5.6`을 실제 값(타입 검사 TypeScript 7.0, 도구 API 6.0)으로, `Node는 .nvmrc(20.11) 기준. webapp engine: Node >=18.10.0, npm ^9 || ^10`을 `Node 24.11.1, npm 11.6.2 고정(.nvmrc, engines, packageManager)`으로 고치고 버전·개정 이력을 올린다. 별도 커밋 `docs: constitution의 webapp 툴체인 버전을 실제 값으로 고친다`
- [ ] T044 i18n 영향 확인: `cd webapp/channels && npm run i18n-extract:check`와 `npm run i18n-check-empty`가 통과하는지 본다. `en.json` 변경이 있으면 후속 번역 목록에 올린다(FR-012)
- [ ] T045 깨끗한 체크아웃 재현(SC-005): 별도 worktree(scratchpad)에 브랜치 HEAD를 체크아웃하고 `cd webapp && npm ci && npm run check-types && npm run test && npm run build`가 통과하는지, 같은 lockfile로 `npm ci`를 한 번 더 해도 `git status`가 깨끗한지 본다. 끝나면 worktree를 지운다
- [ ] T046 마감 게이트: quickstart §4를 돌리고 최종 게이트 목록을 기준선과 diff한 결과(새 항목 0)를 PR 본문에 붙인다. PR 본문에 "새 런타임 의존성 없음(추가는 devDependencies뿐)"을 적는다. 브랜치를 push하고 `gh pr create --repo okrbest/okrbest --base master`, CI의 webapp 잡을 master 기준선과 비교한다(SC-008). 보호 경로(`webapp-ci.yml`) 리뷰 요건을 PR에 적는다. 병합은 사용자 확인 뒤 `gh pr merge --rebase`

---

## Dependencies & Execution Order

### Phase 의존

- Phase 1 → Phase 2 → US1(S1 → S2) → US2(S3) → US3 → Phase 6
- 버전 단계는 앞 단계의 lockfile·설치 상태 위에서만 의미가 있어서 **순차**다. US2는 US1이 끝나야 시작한다.
- T041은 단계마다 기록한 내용을 모으는 과제라 US2 뒤에 둔다. 단계마다 초안을 미리 써 둬도 된다.

### 단계 안의 순서

- 버전 옮기기 → `npm install` → 소스 반영 → 소스 분류·증거 → 스냅샷 → 게이트 diff → 커밋
- T013의 스냅샷 실패 출력은 T014(`-u`)보다 먼저 남긴다. T019는 테스트 → 코드 순서다. T036의 회귀 테스트는 수정보다 먼저다
- [P] 표시는 서로 다른 파일이라 동시에 할 수 있다(T012, T020·T021, T028~T031)

### 병렬 예시

```text
# Phase 2 기준선 (T004 뒤)
T005 eslint·stylelint / T006 jest / T007 빌드 / T008 peer

# S3 소스 반영 (T027 뒤)
T028 tsconfig 7개 / T029 신규 3파일 / T030 테스트 2파일 / T031 rollup.config.js
```

---

## Implementation Strategy

### MVP (US1만)

1. Phase 1·2 → 기준선 확보
2. S1 → 게이트 비교 → 커밋, S2 → 게이트 비교 → 커밋
3. 여기서 멈춰도 TypeScript 5.9.3 상태로 PR을 낼 수 있다

### 점진 반영

1. US1 → 검증
2. US2(S3) → T035에서 새 오류 수를 보고 같은 PR로 갈지 결정
3. US3·Phase 6 → 기록, constitution 정정, 마감 게이트, PR

### 멈추고 보고하는 지점

- T001: 툴체인 불일치
- T011·T018·T027: peer 충돌로 설치가 막힐 때(특히 `@lexical/*`와 react 19.3)
- T015: 고정 npm으로 다시 만들어도 peer 표시가 줄어들 때
- T027: lockfile에 Linux 바이너리 항목이 없을 때
- T035: TS7 새 오류 20건 초과
