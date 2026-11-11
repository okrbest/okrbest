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

- [X] T001 `cd webapp && node -v && npm -v`로 Node `v24.11.1`, npm `11.6.2`를 확인한다(`webapp/package.json` `engines`, `webapp/.npmrc` `engine-strict`). 다르면 멈추고 보고한다
- [X] T002 `git fetch upstream`로 `upstream-master`에 `4ca793bd`·`20c15b9d`·`a28b09d7`이 있는지 `git cat-file -e <hash>`로 확인한다
- [X] T003 [P] 버전 옮기기 스크립트는 이미 있다: `specs/033-webapp-deps-ts7/tools/bump_upstream_deps.py`(1차 시도에서 작성·검증). 사용: 저장소 루트에서 `python3 -I specs/033-webapp-deps-ts7/tools/bump_upstream_deps.py . <upstream-commit> [--dry-run]`. 먼저 `--dry-run`으로 `4ca793bd`를 돌려 `APPLIED 118 / SKIPPED 11 / NEEDS-HUMAN 0 / NON-DEP-FIELD 0`이 나오는지 확인한다. 스크립트가 지키는 규칙은 아래와 같다. 인자로 upstream 커밋을 받아 `webapp/package.json`·`webapp/channels/package.json`·`webapp/platform/*/package.json`의 `dependencies`·`devDependencies`·`peerDependencies`·`overrides`에서 upstream 변경 전→후를 계산하고 data-model §2 규칙으로 포크 파일에 반영한다. 규칙: (1) `fork_current == upstream_before`이면 `upstream_after`로 바꾼다. 이때 `upstream_before`가 없으면 키를 **추가**하고, `upstream_after`가 없으면 키를 **삭제**한다. (2) `@tiptap/*`, `@mattermost/compass-ui`, 포크가 지운 항목(`overrides.@deanwhillier/jest-matchmedia-mock`, `b04f29a892`)은 건너뛴다. (3) 포크 값이 `upstream_after`보다 높으면 건너뛴다. (4) 그 밖에 `fork_current != upstream_before`이면 건너뛰고 "사람 판단 필요"로 출력한다. 의존성 섹션 **밖**의 필드(`scripts`, `targets` 등)가 바뀌었으면 고치지 않고 경고로만 출력한다. 키 순서, 2칸 들여쓰기, 끝 줄바꿈을 보존한다

---

## Phase 2: Foundational (모든 단계의 전제)

**Purpose**: 원칙 I에 따라 변경 전 기준선을 목록으로 남긴다. 이 Phase가 끝나기 전에는 버전을 옮기지 않는다.

- [X] T004 작업용 디렉터리 `specs/033-webapp-deps-ts7/baseline/`을 만든다(커밋하지 않는다). quickstart §1의 `tsc.txt`를 저장하고 5줄인지 확인한다
- [X] T005 [P] `baseline/eslint.txt`(106건·25파일 기대)와 `baseline/stylelint.txt`(68건·12파일 기대)를 **파일 + 규칙 id + 개수** 단위로(줄 번호 없이) 저장한다: 저장소 루트에서 `bash specs/033-webapp-deps-ts7/tools/lint_counts.sh "$(pwd)/specs/033-webapp-deps-ts7/baseline"` → `eslint 106 stylelint 68` 출력 확인(1차 시도 값)
- [X] T006 [P] `cd webapp && npm run test`의 실패 목록을 `baseline/jest.txt`에 저장한다(스위트·테스트 이름 단위)
  - **2차 기준선(2026-11-11, WSL Linux, master `20b20152f5` lockfile로 `npm ci` 뒤)**: platform 4패키지 통과. channels는 `npm run test --workspace=channels -- --ci --maxWorkers=4 --json --outputFile=…`로 53분, 1263 스위트 중 **25 스위트·139 테스트 실패**, 실행 오류 0. 실패 25개만 다시 돌려도 25·139 그대로라 **간헐 실패 0, 전부 확정 실패**다. `--json` 결과에서 뽑은 `baseline/jest.txt`(스위트 :: 테스트 전체 이름)로 비교한다. 워커 4개면 1차 시도의 부하성 시간 초과가 나지 않았다
  - **1차 시도 기록(2026-11-11, 다른 기기)**: channels 전체 실행에서 53 스위트가 실패했고(platform 4패키지는 전부 통과), 실패 53개만 `--ci`로 다시 돌리니 **24 스위트·137 테스트가 다시 실패**, 29 스위트는 통과했다(부하·잠자기로 인한 시간 초과). 이 기기에서도 같은 방식으로 "확정 실패"와 "간헐 실패"를 나눈다. 판정: 단계 후 실패 스위트 − 기준선 실패 스위트 = 후보, 후보만 `--ci`로 다시 돌려 또 실패하면 회귀
  - 기존 결함 1건: `multiselect.test.tsx`의 `MultiSelectList should match state on next page` 스냅샷이 `.snap`에 없다. 로컬 실행(`--ci` 없이)은 이 스냅샷을 **새로 써 버린다** → 기준선 실행 뒤 `git status`로 확인하고 되돌린다
  - jest 전체 실행 중에는 `tsc -b`를 동시에 돌리지 않는다(메모리 경합으로 tsc가 입출력 대기에 빠지고 jest 워커가 SIGSEGV로 죽었다). `cd webapp/channels && npx jest --ci`를 출력 리다이렉트로 돌리면 PASS 줄이 로그에 남지 않아 진행률을 알 수 없다. 진행률이 필요하면 `cd webapp && npm run test`처럼 PASS 줄이 남는 실행을 쓴다. 장시간 실행은 `caffeinate -i`(macOS)로 잠자기를 막는다
- [X] T007 [P] `cd webapp && npm run build` 결과(성공 여부, `webapp/channels/dist` 크기)를 `baseline/build.txt`에 저장한다
  - 2차 기준선: exit 0, 6분 12초, `channels/dist` 166,902,770바이트(168M)·4504파일
- [X] T008 [P] `grep -c '"peer": true' webapp/package-lock.json` 값과 `"peer": true`가 붙은 패키지 경로 목록을 `baseline/peer.txt`에 저장한다

**Checkpoint**: 기준선 5종이 있다. 이후 판정은 모두 이 목록과의 diff로 한다.

---

## Phase 3: User Story 1 - 2026-10·11 의존성으로 올려도 webapp이 그대로 동작한다 (Priority: P1) 🎯 MVP

**Goal**: S1(`4ca793bd`)과 S2(`20c15b9d`)를 반영한다. TypeScript는 5.9.3이 된다.

**Independent Test**: S2 커밋 시점에서 quickstart §2(lockfile 재현성, peer, 게이트 diff, 스냅샷)와 §3 S1·S2 확인이 모두 통과한다. TS7 없이 단독 병합할 수 있다.

### S1 — 2026-10 의존성 (`4ca793bd`)

- [X] T009 [US1] T003 스크립트를 `4ca793bd`로 돌려 `webapp/package.json`, `webapp/channels/package.json`, `webapp/platform/{client,components,eslint-plugin,mattermost-redux,shared}/package.json`을 고친다. 적용 118건, 건너뜀 11건(`@tiptap/*` 10, `overrides.@deanwhillier/jest-matchmedia-mock` 1), 사람 판단 0건, 비의존성 필드 경고 0건을 확인하고 목록을 남긴다
- [X] T010 [US1] `webapp/patches/@types+react-bootstrap+0.32.35.patch`를 지우고 `git show 4ca793bd:webapp/patches/@types+react-bootstrap+0.32.37.patch`로 새 패치를 만든다(upstream 그대로)
- [X] T011 [US1] `webapp/package-lock.json`을 다시 만든다: **`cd webapp && npm install --package-lock-only --ignore-scripts --no-audit --no-fund` → `npm ci`** 순서로 한다. patch-package가 0.32.37 패치를 적용하는지 출력으로 확인하고, peer·engine 경고를 기록한다(react 19.3과 `@lexical/*` peer 포함). 막히면 멈추고 보고한다
  - **주의(1차 시도에서 확인)**: 기존 `node_modules` 위에서 그냥 `npm install`을 하면 npm이 override가 걸린 하위 트리를 해석에서 빠뜨린다. 실제로 39개 패키지(`@testing-library/jest-dom`, `@giphy/react-components`와 하위 의존성 등)가 lockfile에서 사라져 모든 jest 스위트가 `Cannot find module '@testing-library/jest-dom'`으로 실패했다. 위 순서로 하면 39개가 돌아오고, 재생성을 반복해도 lockfile이 같다(멱등)
  - **원인 확정(2차, 2026-11-11)**: `node_modules` 유무와 상관없다. `--package-lock-only`를 **한 번만** 돌리면 객체형 override 대상(`@testing-library/jest-dom` 6.8.0→6.9.1, `@giphy/react-components` 10.1.0→10.1.2)이 옛 노드만 지워지고 새 노드가 들어가지 않는다(나머지 37개는 그 하위 의존성). 같은 명령을 **두 번째** 돌리면 39개가 채워지고, 세 번째는 바이트 단위로 같다. 1차 시도의 "npm install 뒤 lock-only"도 실제로는 두 번 돌린 효과였다. → 절차: `--package-lock-only`를 **결과가 같아질 때까지(2~3회)** 돌린 뒤 `npm ci`. 첫 `npm ci`가 `EUSAGE … Missing: … from lock file`로 멈추면 이 증상이다
  - peer 표시 52 → 51: 사라진 6개 중 jsdom 3개는 루트 `node_modules/jsdom` 1개로 끌어올려졌고, `@babel/preset-env`·`@swc/helpers`·루트 `postcss-selector-parser`는 표시만 빠졌다(`stylelint/node_modules/postcss-selector-parser`가 새로 peer). **upstream `4ca793bd` lockfile도 같은 다섯 항목이 똑같이 바뀌었다** → 의존성 변화로 설명됨(FR-005)
  - `ts-clone-node`(`rollup-plugin-ts` 하위)의 typescript peer `^3||^4` ERESOLVE 경고는 기존에도 있던 것이다. 1차 시도 결과: TypeScript 5.9.3, React 19.3.1 설치, patch 5개 적용
- [X] T012 [P] [US1] `git show 4ca793bd -- <path> | git apply`로 소스 7파일을 upstream 그대로 반영한다: `webapp/channels/src/components/admin_console/custom_plugin_settings/custom_plugin_settings.test.tsx`, `webapp/channels/src/components/advanced_text_editor/send_button/send_post_options/core_menu_options.test.tsx`, `webapp/channels/src/components/advanced_text_editor/use_post_box_indicator.test.tsx`, `webapp/channels/src/components/file_attachment_list/media_gallery/file_archive.ts`, `webapp/channels/src/components/post_emoji/post_emoji.test.tsx`, `webapp/channels/src/components/timestamp/semantic_time.tsx`, `webapp/channels/src/plugins/channel_header_plug/channel_header_plug.tsx`. `wysiwyg_editor/` 4파일(TipTap)은 받지 않는다
- [X] T013 [US1] S1 소스 변경 분류와 증거(원칙 III): `file_archive.ts`(`BlobPart[]` 캐스트)·`semantic_time.tsx`(`?? undefined`)는 **타입 전용**이라 tsc 통과로 확인한다. `channel_header_plug.tsx`(Fragment → `<span>`)는 **동작 변경**이다. `WithTooltip`(`webapp/platform/shared/src/components/tooltip/with_tooltip.tsx`)은 `cloneElement`로 자식에 ref와 hover·focus 핸들러를 붙이는데, 자식이 Fragment면 붙지 않아 플러그인 dropdown 아이콘의 "Plugins" 툴팁이 뜨지 않는다. **기존 테스트와 스냅샷은 이 변경을 잡지 못한다**(1차 시도: 변경 전후 모두 28 스위트·114 테스트 통과) → `webapp/channels/src/plugins/channel_header_plug/channel_header_plug.test.tsx`에 회귀 테스트를 추가한다: 플러그인 `maxComponentsBeforeDropdown + 1`개를 렌더하고 `jest.useFakeTimers()` 아래에서 개수 텍스트를 `userEvent.hover(..., {advanceTimers: jest.advanceTimersByTime})`한 뒤 `waitFor`로 "Plugins"가 보이는지 확인한다(import에 `userEvent`, `waitFor` 추가). 1차 시도 결과: 변경 전 코드에서 `Unable to find an element with the text: Plugins`로 **실패**, upstream 코드에서 6건 **통과**. 포크가 추가한 테스트이므로 T041에 기록한다. 테스트 파일 4개는 upstream 테스트 자체다
  - **2차 결과(React 19.3.1 설치 뒤)**: Fragment 그대로 두고 돌리니 새 테스트가 `Unable to find an element with the text: Plugins`로 실패했고, 기존 `should render more than 15 plugs in a dropdown`도 `Invalid prop \`onPointerDown\` supplied to \`React.Fragment\``(setup_jest의 콘솔 오류 검사)로 실패했다 — React 19.3이 Fragment에 붙는 핸들러를 경고하기 시작해서다. upstream `<span>` 변경을 넣자 6건 모두 통과
- [X] T014 [US1] 스냅샷을 다시 만든다. **전체에 `-u`를 걸지 않는다** — 기준선에서 이미 실패하던 스냅샷(확정 12건)까지 덮어써 기존 결함이 가려진다. 먼저 `cd webapp/channels && npx jest --ci`로 실패 목록을 뽑아 기준선과 비교하고, 새로 실패한 스냅샷 스위트만 diff를 보고 원인을 확인한 뒤 그 스위트만 `-u`로 갱신한다(1차 시도에서 중단 전까지 새 실패 23개가 나왔고 대부분 upstream도 스냅샷을 바꾼 파일: `cluster_settings`, `elasticsearch_settings`, `license_settings`, `marketplace_*`, `latex_block`, `thread_item`, `global_search_nav` 등). 바뀐 `.snap` 목록을 `git show --name-only --format= 4ca793bd -- '*.snap'`과 대조해서 data-model §5 형식으로 원인을 기록한다. upstream 목록 밖 파일은 포크 고유 화면이므로 원인을 따로 확인한다. upstream `.snap` 파일은 가져오지 않는다(포크 마크업 유지)
  - **2차 결과**: jest는 `/tmp` worktree에서 비교했다(아래 "jest 실행 환경"). 새 실패 83건 **전부 스냅샷**, 31 스위트이고 **31개 모두 upstream `4ca793bd`의 `.snap` 목록(37개) 안**이다. 기준선 실패 스위트와 겹치지 않아 그 31개만 `-u`했다(88 updated). 변경은 +473/−473줄로 구조 변화가 없고 두 종류뿐이다: styled-components 클래스 해시(`Label-eJcoMl`→`Label-hkyaVO` 등), katex 0.19(`strut`/`base`/`sizing`→`katex-` 접두어, `margin-right` 소수 반올림 `0.03588em`→`0.0359em`). `latex_inline`은 upstream 스냅샷 diff와 줄 단위로 같다. upstream 목록 중 6개(`custom_terms_of_service_settings`, `channel_header`, `files_filter_menu`(포크에 없음), `messages_or_files_selector`, `sidebar_channel_menu`, `user_profile`)는 포크에서 실패하지 않았다(포크 마크업이 달라 해당 스냅샷이 없거나 맞음)
  - **jest 실행 환경**: `/mnt/d`(NTFS)에서 새 `node_modules`로 jest를 돌리면 워커가 디스크 대기(`D`)에 묶여 8분에 4 스위트만 끝났다(`npm ci`도 14분). 그래서 `git worktree add --detach /tmp/okr033-base HEAD`(기준선)와 `/tmp/okr033-s1`(HEAD + 작업 트리 diff)에서 각각 `npm ci`(43초)를 하고 jest를 같은 조건으로 돌린다(전체 5분). `/tmp` 기준선은 24 스위트·138건으로, `/mnt/d` 기준선과 `access_control_editors` lazy 1건(10초 시간 초과, 디스크 속도 의존)만 다르다. 이후 jest 비교는 `/tmp` 기준선과 한다
- [X] T015 [US1] quickstart §2(a)~(c)를 돌린다: lockfile 재생성 diff 0, peer 목록 비교, tsc·eslint·stylelint·jest 새 항목 0줄. `typescript` 설치 버전이 `5.9.3`인지 확인한다. peer 표시가 기준선보다 줄었으면 해당 패키지를 찾아 원인을 기록하고, 고정 npm으로 다시 만들어도 남으면 멈추고 보고한다(FR-005). 새 실패는 systematic-debugging으로 원인을 찾아 고친다
  - **2차 결과**: (a) `/tmp/okr033-s1`에서 lockfile을 다시 만들어 S1 lockfile과 `cmp` 동일. (b) peer는 T011 메모대로 upstream과 같은 변화. (c) tsc 5건 새 0, eslint 106·stylelint 68 새 0, platform 5패키지 lint·4패키지 jest 통과, channels jest(스냅샷 갱신 뒤) 24 스위트·138건으로 **기준선과 목록이 같다**(새 0, 사라짐 0, 테스트 수 13711→13712는 T013 회귀 테스트). `typescript` 5.9.3, `react` 19.3.1
- [X] T016 [US1] S1을 커밋한다: 제목 `chore(webapp): 2026-10 의존성 갱신 (upstream #39222)`, 본문에 건너뛴 11건과 받지 않은 파일, 소스 분류(T013), 게이트 비교 요약, `Upstream: https://github.com/mattermost/mattermost/commit/4ca793bd9e78bc5b6055a7e0e4560849792f7dbe`

### S2 — 2026-11 의존성 (`20c15b9d`)

- [X] T017 [US1] T003 스크립트를 `20c15b9d`로 돌려 `webapp/channels/package.json`, `webapp/platform/{components,eslint-plugin,mattermost-redux,shared}/package.json`을 고친다. 적용 18건, 건너뜀 10건(`@tiptap/*`), 사람 판단 0건, 비의존성 필드 경고 0건을 확인한다
- [X] T018 [US1] lockfile을 다시 만든다: T011과 같이 `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`를 결과가 같아질 때까지(2~3회) → `npm ci`
  - **2차 결과**: 2회째에 변화 없음. monaco-editor 0.57.0, web-vitals 6.2.3, `channels/node_modules/yargs` 18.2.0(루트 `yargs`는 하위 의존성 17.x, upstream도 같은 배치). peer 51 → 50: `monaco-editor` 표시가 빠졌고 upstream `20c15b9d`도 같다(그 밖의 upstream 변화는 TipTap뿐)
- [X] T019 [US1] 원칙 III 순서로 `reporter`를 반영한다: 먼저 `git apply`로 테스트 `webapp/channels/src/utils/performance_telemetry/reporter.test.ts`만 넣고 `npx jest src/utils/performance_telemetry`의 **실패 출력**을 남긴 뒤, `reporter.ts`를 넣고 통과를 확인한다(동작 변경: `interactionType`이 없으면 `labels`를 비운다)
  - **2차 결과**: `reporter.ts`를 바꾸기 전 `should not add labels to INP when attribution is missing`·`… when interactionType is undefined` 2건이 `Received: {"interaction": undefined}`로 **실패**, upstream `reporter.ts`를 넣은 뒤 39 통과·0 실패(skip 10은 기존)
- [X] T020 [P] [US1] `webapp/channels/webpack.config.js`를 upstream 그대로 반영한다(`monacoEditorPath` 3줄)
- [X] T021 [P] [US1] `webapp/channels/src/components/admin_console/access_control/editors/cel_editor/editor.tsx`의 `MONACO_EDITOR_OPTIONS`에서 `contextmenu: false,` 뒤에 upstream과 같은 빈 줄 + 주석 4줄 + `editContext: false,`를 손으로 넣는다. 우리 파일의 나머지(`CELEditorActions` 등)는 그대로 둔다. 원칙 III: upstream도 테스트가 없고, jsdom에 EditContext가 없으며 Monaco가 jest에서 렌더되지 않아 재현할 수 없다 → 과제 옆에 `미검증(jsdom 미지원, upstream 무테스트)`으로 적는다
  - **2차 결과**: 추가 6줄이 upstream diff와 글자 단위로 같다. `미검증(jsdom 미지원, upstream 무테스트)`
- [X] T022 [US1] 스냅샷을 다시 만들고 바뀐 목록의 원인을 기록한다(T014와 같은 방식)
- [X] T023 [US1] quickstart §2와 §3 S2 확인을 돌린다: `editContext: false` 1줄, `npm run build` 성공(webpack 변경의 증거)과 산출물 크기 기록, 게이트 새 항목 0줄
  - **2차 결과(`/tmp` worktree)**: `/tmp` 기준선의 tsc·eslint·stylelint 목록이 `/mnt/d` 기준선과 같다(diff 0). S2: tsc 5건 새 0, eslint 106·stylelint 68 새 0, platform lint·jest 통과, channels jest 목록이 기준선과 같다(새 0·사라짐 0) → **T022 스냅샷 변경 없음**. `editContext: false` 1줄. `npm run build` 성공 82초, `channels/dist` 166,902,758 → 199,601,980바이트(+32.7MB: JS +8.6MB, 소스맵 +24.0MB), 파일 4504 → 4436, 경고 61 그대로. 커진 이유: monaco 0.57이 `esm/vs/languages/features/typescript/`(`ts.worker.js`, `typescriptServices.js` 9.1MB, `lib.js` 3.2MB)를 워커 청크로 넣는다. `languages: []`와 상관없이 들어가고, monaco 메인 청크가 필요할 때만 부르는 청크다
- [X] T024 [US1] S2를 커밋한다: 제목 `chore(webapp): 2026-11 의존성 갱신 (upstream #39583)`, 본문에 `cel_editor` 수동 적용과 `미검증` 사유, 건너뛴 10건, `Upstream: https://github.com/mattermost/mattermost/commit/20c15b9d2be5c7409a16b6831b5979de76812d4f`

**Checkpoint**: US1 완료. 여기서 멈춰도 TypeScript 5.9.3 상태로 병합할 수 있다.

---

## Phase 4: User Story 2 - TypeScript 7.0으로 타입 검사를 돌린다 (Priority: P2)

**Goal**: S3(`a28b09d7`)을 반영한다. `tsc`는 7.0.2 네이티브, `typescript`는 6.0.2 API가 된다.

**Independent Test**: S3 커밋 시점에서 quickstart §2와 §3 S3 확인, contracts/shared-package-types.md의 4개 항목이 통과한다.

- [X] T025 [US2] T003 스크립트를 `a28b09d7`로 돌린다. 21건 모두 적용되는지 확인한다: 추가(`@typescript/native` 7곳, `overrides.react-intl`), 변경(`typescript` → `npm:@typescript/typescript6@6.0.2`, peer 범위 확장), 삭제(components `@rollup/plugin-typescript`, shared `@parcel/packager-ts`·`@parcel/transformer-typescript-types`). 비의존성 필드 경고 6건이 나오는지 확인한다(T026에서 처리)
  - **2차 결과**: 적용 21·건너뜀 0·사람 판단 0. 비의존성 필드 경고는 **필드 4개**(channels `scripts`, components `scripts`, shared `scripts`·`targets`)로 나오고, 키로 세면 6개라 기대값과 같다
- [X] T026 [US2] 비의존성 필드를 옮긴다. 포크 값이 upstream 출발점과 **같은** 5곳은 upstream 값 그대로: `webapp/platform/components/package.json`의 `scripts.build`(`rollup -c && tsc -b`)·`scripts.clean`·`scripts.run`, `webapp/platform/shared/package.json`의 `scripts.build`·`targets`(`{"types": false}`). 포크 값이 **다른** `webapp/channels/package.json`의 `scripts.i18n-extract`는 포크 문자열을 유지하고 upstream이 더한 `--ignore "../**/*.d.ts"`만 포크의 큰따옴표 형식으로 `--ignore "**/*.d.ts"` 뒤에 넣는다
  - **2차 결과**: 5곳 upstream 그대로, `i18n-extract`는 `--ignore \"../**/*.d.ts\"`만 추가. shared `package.json`은 upstream과 완전히 같고, components는 `@mattermost/compass-ui`(제외)와 `@mattermost/compass-icons` 0.1.61(upstream 0.1.64, 이 세 커밋 밖의 변경)만 다르다. `run`이 쓰는 `concurrently`는 루트 devDependencies에 있다
- [X] T027 [US2] lockfile을 다시 만든다: T011과 같이 `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`를 결과가 같아질 때까지(2~3회) → `npm ci`. quickstart §3 S3의 `node -e` 명령으로 lockfile에 `node_modules/@typescript/typescript-linux-x64`·`-darwin-arm64` 항목이 있는지 확인한다. 없으면 plan 위험 표의 대응을 따른다
  - **2차 결과**: 2회째에 변화 없음. linux-x64 true, darwin-arm64 true. `@typescript/native` 7.0.2, `typescript` 6.0.2(`@typescript/typescript6`). peer 50 그대로이고 목록도 같다. `ts-clone-node` ERESOLVE 경고가 사라졌다(S1에서 `rollup-plugin-ts` 제거)
- [X] T028 [P] [US2] `git apply`로 tsconfig 7개를 upstream 그대로 반영한다: `webapp/channels/tsconfig.json`, `webapp/platform/client/tsconfig.json`, `webapp/platform/client/tsconfig.build.json`, `webapp/platform/components/tsconfig.json`, `webapp/platform/mattermost-redux/tsconfig.json`, `webapp/platform/shared/tsconfig.json`, `webapp/platform/types/tsconfig.json`
- [X] T029 [P] [US2] 신규 파일을 넣는다. `webapp/platform/shared/build/strip_css_imports.mjs`, `webapp/platform/shared/tsconfig.build.json`은 upstream 그대로. `webapp/channels/src/types/external/styles.d.ts`는 `*.scss`·`*.css` 선언만 받고 `@mattermost/compass-ui/styles`·`@mattermost/compass-ui/styles/standalone` 선언 2줄은 뺀다(포크는 compass-ui를 받지 않는다. 선언이 있으면 compass-ui import가 타입 검사를 조용히 통과한다). Mattermost copyright 헤더는 유지한다
  - **2차 결과**: `styles.d.ts`는 `*.scss`·`*.css` 2줄 + 헤더만 넣었다
- [X] T030 [P] [US2] `git apply`로 `webapp/channels/src/tests/test_store.tsx`, `webapp/platform/client/src/websocket.test.ts`를 upstream 그대로 반영한다
- [X] T031 [P] [US2] `webapp/platform/components/rollup.config.js`를 손으로 고친다: `import typescript from '@rollup/plugin-typescript'`를 `import {transform} from '@swc/core'`로 바꾸고, upstream `swc()` 함수(주석 포함)를 `externals` 배열 뒤에 그대로 넣고, 플러그인의 `typescript({outputToFilesystem: true})`를 `swc()`로 바꾼다. 포크의 `external: externals`는 유지한다(upstream의 `isExternal`은 제외한 compass-ui 이관 `e190c0f1` 소속, research R3)
  - **2차 결과**: 바뀐 줄이 upstream diff와 줄 단위로 같고, `external: externals`가 남았다
- [X] T032 [US2] `.github/workflows/webapp-ci.yml`의 `check-types` 잡에서 `needs: check-lint` 한 줄을 지운다(upstream 그대로, CODEOWNERS 보호 경로라 PR에 명시)
- [X] T033 [US2] `cd webapp && npx tsc -v`가 `Version 7.0.2`, `node -e "console.log(require('typescript/package.json').version)"`가 `6.0.2`인지 확인한다
  - **2차 결과**: `npm ci` 40초(postinstall에서 새 shared·components 빌드 통과), `tsc -v` → `Version 7.0.2`, `typescript` → 6.0.2
- [X] T034 [US2] S3 소스 변경 분류와 증거(원칙 III): `test_store.tsx`(반환 타입 명시)·`websocket.test.ts`(`readyState` 타입)·tsconfig·`styles.d.ts`는 **타입 전용**이라 T035의 tsc 결과로 확인한다. `rollup.config.js`(빌드 도구 교체)는 T038의 components 빌드 결과로 확인한다. `shared` 빌드 방식 변경은 T037의 계약 확인으로 확인한다
- [X] T035 [US2] `cd webapp && npm run check-types`를 돌리고 오류 목록을 `baseline/tsc.txt`와 diff한다. 새 오류 수를 센다. 20건을 넘으면 멈추고 사용자에게 보고한다(S3 분리 여부 결정, research R8)
  - **2차 결과**: TS7 첫 실행 6건. 실질 새 오류는 `admin_definition_ldap_wizard.tsx`의 TS2353(`help_text_more_info` does not exist in type `AdminDefinitionSettingInput`) 6건(103·306·332·349·392·577행)이다. 원인은 기준선 TS2322와 같다: 포크 `f2513ec08f`가 섹션 `subtitle`·`sectionTitle`을 `defineMessage(...)`로 바꿨는데 타입이 `string`이다. TS5는 TS2322가 난 객체 안의 초과 속성 검사를 건너뛰었고 TS7은 이어서 보고한다. `emoji_node.test.ts`는 같은 오류의 유니온 출력 순서만 바뀌었다(`LexicalNode | LexicalNode[]` → `LexicalNode[] | LexicalNode`). 20건 미만이라 같은 PR로 진행
- [X] T036 [US2] T035의 새 오류를 포크 코드에서 고친다(파일별). upstream이 같은 코드를 고친 적이 있으면 그 방식을 따른다. 수정이 동작을 바꾸면 **고치기 전에** 그 동작의 회귀 테스트를 해당 파일 옆 `*.test.ts(x)`에 쓰고 실패 출력을 남긴다(원칙 III). 동작 변경이 없는 타입 수정이면 "타입 전용"으로 적는다. `@ts-ignore`·`@ts-expect-error`로 덮거나 테스트를 약화하지 않는다. 고친 파일과 이유를 기록한다
  - **2차 결과**: 타입만 넓히면 감춰진 결함이 남는다. `SettingsGroup`(`webapp/channels/src/components/admin_console/settings_group.tsx`)이 `subtitle`을 `<div>{subtitle}</div>`로 그려서, 포크의 descriptor subtitle이 들어오면 React가 던진다. 회귀 테스트 `settings_group.test.tsx`를 먼저 썼다: 고치기 전 `Objects are not valid as a React child (found: object with keys {id, defaultMessage})`로 **실패**. 수정: `SettingsGroup`이 `title`처럼 `isMessageDescriptor`면 `FormattedMessage`로 그리고(`subtitle?: React.ReactNode | MessageDescriptor`), `AdminDefinitionConfigSchemaSection.subtitle`과 `LDAPAdminDefinitionConfigSchemaSection.sectionTitle`을 `string | MessageDescriptor`로 넓혔다. 테스트 통과(settings_group·ldap_wizard 5건). tsc 4건: 기준선의 ldap TS2322와 TS7의 TS2353이 모두 사라졌고, 남은 4건은 기준선 4파일 그대로(emoji_node는 표기만 바뀜). 새 오류 0
- [X] T037 [US2] contracts/shared-package-types.md 확인: `cd webapp && npm run build --workspace=platform/shared` 후 `platform/shared/dist/{components,context,testing,types,utils}/index.d.ts` 5개 존재, `.d.ts`의 CSS import 0건, 테스트 파일 선언 없음, `grep -rn "from '@mattermost/shared'" webapp/channels/src webapp/platform` 0건
  - **2차 결과**: shared 빌드 성공. 계약 1번의 "5개 디렉터리 바로 아래 `index.d.ts`"는 실제 구조와 다르다 — 기준선도 `dist/components/tooltip/index.d.ts`처럼 하위 모듈 단위다. 기준선이 만들던 진입점 `index.d.ts` 9개를 S3도 모두 만든다(빠짐 0·추가 0). 전체 `.d.ts`는 9 → 26(tsc가 파일마다 낸다). CSS import 0, 테스트 선언 0, 루트 import 0, peer `^4.3.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`
- [X] T038 [US2] `cd webapp && npm run build --workspace=platform/components`가 성공하고 `dist` 산출물(모듈·CSS·선언)이 생기는지 확인한다(`rollup.config.js` 변경의 증거)
  - **2차 결과**: components 빌드 성공, `dist`에 `index.esm.js`·`index.esm.css`·`index.d.ts` 등 `.d.ts` 20개
- [X] T039 [US2] 스냅샷을 다시 만들고 원인을 기록한 뒤 quickstart §2 전체를 돌린다(lockfile diff 0, peer 목록, 게이트 새 항목 0줄, `npm run build` 성공·크기 기록). e2e 패키지 타입 검사(`cd e2e-tests/playwright && npx tsc --noEmit -p .`)의 오류 목록이 S3 전과 같은지도 본다
- [X] T040 [US2] S3를 커밋한다: 제목 `chore(webapp): TypeScript 7.0으로 전환 (upstream #39697)`, 본문에 `rollup.config.js` 수동 적용, `i18n-extract` 포크 유지, `styles.d.ts` compass-ui 2줄 제외, 고친 포크 파일(T036), CI 1줄, `Upstream: https://github.com/mattermost/mattermost/commit/a28b09d787b0697e294c1efe916f4765002a0636`

**Checkpoint**: US2 완료. 타입 검사가 TS7로 돌고 shared 계약이 지켜진다.

---

## Phase 5: User Story 3 - sync 장부에서 세 커밋이 빠진다 (Priority: P3)

**Goal**: 세 커밋이 처리 완료로 집계되고, 포크가 지킨 부분과 받지 않은 부분이 기록으로 남는다.

**Independent Test**: quickstart §4의 grep 3줄과 장부 갱신 결과.

- [X] T041 [US3] `spec-docs/upstream/upstream-adapted-divergences.md`의 인덱스 표에 세 커밋 행을 넣고, 끝에 단계별 절을 쓴다("우리 맞춤"·"버린 것" 표 형식). S1: 건너뛴 `@tiptap/*` 10건·`jest-matchmedia-mock` override, 받지 않은 `wysiwyg_editor/` 4파일, upstream `.snap`을 쓰지 않고 재생성한 사실, 포크가 추가한 `channel_header_plug.test.tsx`의 "Plugins" 툴팁 회귀 테스트(T013). S2: `@tiptap/*` 10건, `cel_editor/editor.tsx` 수동 적용과 `미검증` 사유. S3: `rollup.config.js`의 `isExternal` 대신 `externals` 유지, `i18n-extract` 포크 문자열 유지(`--ignore` 1개만 추가), `styles.d.ts` compass-ui 선언 2줄 제외, T036에서 고친 포크 파일
  - **2차 결과**: 인덱스 표에 3행, 끝에 절 "webapp 의존성 2026-10·11과 TypeScript 7.0"("버린 것" 6행·"우리 맞춤" 5행, monaco 산출물 크기와 compass-icons 0.1.61 메모)
- [X] T042 [US3] 저장소 루트에서 `SYNC_BASE_BRANCH=HEAD .specify/scripts/bash/upstream-sync.sh update`를 돌리고, `for h in 4ca793bd 20c15b9d a28b09d7; do git log HEAD --oneline --grep="$(git rev-parse $h)" | head -1; done`가 3줄을 내는지 확인한다(SC-007: spec 미구현 8 → 5건)
  - **2차 결과**: `git log HEAD --grep` 3줄 모두 나옴. spec 부록 16행 중 미구현이 `master` 8 → HEAD 5(SC-007). `update`는 오늘 받은 upstream 새 커밋 15개도 목록에 올려서, 이 과제 범위 밖이라 장부 파일 변경은 되돌렸다(다음 sync에서 다룬다)

---

## Phase 6: Polish & Cross-Cutting

- [X] T043 `.specify/memory/constitution.md`를 PATCH 개정한다: 원칙 I과 "기술·범위 제약"의 webapp `TypeScript 5.6`을 실제 값(타입 검사 TypeScript 7.0, 도구 API 6.0)으로, `Node는 .nvmrc(20.11) 기준. webapp engine: Node >=18.10.0, npm ^9 || ^10`을 `Node 24.11.1, npm 11.6.2 고정(.nvmrc, engines, packageManager)`으로 고치고 버전·개정 이력을 올린다. 별도 커밋 `docs: constitution의 webapp 툴체인 버전을 실제 값으로 고친다`
  - **2차 결과**: v1.4.1로 개정·커밋. 압축본(CLAUDE.md·AGENTS.md·SPEC_KIT_GUIDE.md·.cursor/rules)에는 해당 문구가 없다. 배선 검사 37 통과·0 실패
- [X] T044 i18n 영향 확인: `cd webapp/channels && npm run i18n-extract:check`와 `npm run i18n-check-empty`가 통과하는지 본다. `en.json` 변경이 있으면 후속 번역 목록에 올린다(FR-012)
  - **2차 결과**: 기준선·S3 worktree 모두 `i18n-extract:check` exit 0(`en.json` 변경 없음), `i18n-check-empty` exit 0, missing 59건으로 같다(후속 번역 목록 변화 없음)
- [X] T045 깨끗한 체크아웃 재현(SC-005): 별도 worktree(scratchpad)에 브랜치 HEAD를 체크아웃하고 `cd webapp && npm ci && npm run check-types && npm run test && npm run build`가 통과하는지, 같은 lockfile로 `npm ci`를 한 번 더 해도 `git status`가 깨끗한지 본다. 끝나면 worktree를 지운다
  - **2차 결과**: `/tmp/okr033-final`(HEAD `8edf0c66b1`)에서 `npm ci` 성공 후 `git status` 깨끗, tsc 4건(S3와 같음), jest 1264 스위트 중 24·138건 실패로 기준선과 목록이 같다, build 성공, `npm ci` 두 번째도 성공하고 `git status` 깨끗
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

---

## 구현 결과 (2026-11-11, 2차 시도·WSL Linux)

커밋: `chore(webapp): 2026-10 의존성 갱신 (upstream #39222)`(S1), `… 2026-11 의존성 갱신 (upstream #39583)`(S2), `… TypeScript 7.0으로 전환 (upstream #39697)`(S3), `docs: constitution의 webapp 툴체인 버전을 실제 값으로 고친다`. 본문의 해시(`4d058f52c0` 등)는 rebase 전 값이다. jest·tsc·빌드 비교는 `/tmp` worktree 기준선(`bc67f485ab`, master와 같은 webapp)과 같은 조건으로 했다.

### 품질 게이트 (기준선 대비)

| 항목 | 명령 | 기준선 | 결과 | 증거 |
|---|---|---|---|---|
| 타입 | `npm run check-types` | 5건(5파일) | S1 5·S2 5·S3 **4** — 새 0. ldap TS2322 해소, emoji_node는 출력 순서만 다름 | T015·T023·T035·T036 |
| eslint | `lint_counts.sh` | 106 | 단계마다 목록 diff 0 | T015·T023·T039 |
| stylelint | 같음 | 68 | 단계마다 목록 diff 0 | 같음 |
| platform lint | `npm run check --workspace=…` 5개 | 모두 0 | 단계마다 모두 0 | 같음 |
| jest | `npm run test` (channels `--maxWorkers=4`) | 24 스위트·138건 | 단계마다 목록 diff 0(새 0·사라짐 0) | T015·T023·T039·T045 |
| 빌드 | `npm run build` | 성공 166.9MB | S2부터 199.6MB(monaco TS 워커 청크), 경고 61 그대로 | T023 |
| e2e 타입 | `e2e-tests/playwright && npm run tsc` | 7건 | 7건, 목록 같음 | T039 |
| i18n | `i18n-extract:check`, `i18n-check-empty` | exit 0, missing 59 | 같음 | T044 |

### SC 실측

| SC | 기준 | 실측 | 판정 |
|---|---|---|---|
| SC-001 | 타입 오류 ≤5, 새 0 | 4건, 새 0 | 통과 |
| SC-002 | jest 새 실패 0 | 0 | 통과 |
| SC-003 | lint 새 항목 0 | eslint 0·stylelint 0 | 통과 |
| SC-004 | 빌드 성공·크기 기록 | 성공, 166,902,758 → 199,602,335바이트(+32.7MB) | 통과(기록) |
| SC-005 | `npm ci` 성공·반복 시 같음 | 깨끗한 worktree에서 두 번 모두 성공·`git status` 깨끗, lockfile 재생성 `cmp` 동일 | 통과 |
| SC-006 | 바뀐 스냅샷 100% 검토 | S1 31개 전부 원인 기록(T014), S2·S3 변경 0 | 통과 |
| SC-007 | spec 미구현 8 → 5 | master 8 → HEAD 5 | 통과 |
| SC-008 | 브랜치 CI 새 실패 잡 0 | 미실행 — PR 생성 뒤 CI 결과로 판정한다(T046) | 미실행 |

### quickstart 절별

| 절 | 결과 |
|---|---|
| §1 기준선 저장 | 통과(`/mnt/d`와 `/tmp` 양쪽, 차이는 디스크 속도 의존 1건) |
| §2 단계별 검증 (a)~(d) | 통과(S1·S2·S3) |
| §3 S1·S2·S3 확인 | 통과(S3 `ls`는 실제 진입점 구조로 고쳤다) |
| §4 마감 확인 | `npm ci`·check-types·test·build 통과, 장부 grep 3줄. CI 비교(SC-008)는 미실행 |
| 화면 실주행 | 미실행 — spec Assumptions대로 Playwright e2e는 판정에 쓰지 않는다. LDAP 마법사 subtitle 수정은 `settings_group.test.tsx` 단위 테스트로만 확인했다. 화면 확인에는 로컬 서버 + LDAP 마법사 화면 진입이 필요하다 |
