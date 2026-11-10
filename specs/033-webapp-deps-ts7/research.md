# Research: webapp 의존성 2026-10·11 갱신과 TypeScript 7.0 전환

조사 기준: 브랜치 `033-webapp-deps-ts7`(master `20b20152f5`), upstream 커밋 `4ca793bd`·`20c15b9d`·`a28b09d7`.
버전 대조는 각 커밋의 부모(upstream "변경 전"), 커밋(upstream "변경 후"), 포크 HEAD를 `package.json` 9개에서 비교했다.

## R1. 포크와 upstream의 출발점이 같은가?

**결론**: 10월분(`4ca793bd`)의 출발점은 TipTap과 override 1건을 빼면 포크와 같다.

- `4ca793bd`가 바꾼 의존성 129건 중 포크 값이 upstream "변경 전"과 다른 것은 11건이다.
  - `@tiptap/*` 10건: 포크에 패키지가 없다(Lexical 사용).
  - 루트 `overrides`의 `@deanwhillier/jest-matchmedia-mock`: 포크는 `b04f29a892`로 이 패키지를 로컬 matchMedia mock으로 바꿨다.
- 나머지 118건은 출발점이 같아서 upstream "변경 후" 값을 그대로 쓰면 된다.
- `20c15b9d`(28건)와 `a28b09d7`(21건)는 앞 단계가 끝난 뒤를 출발점으로 한다. 앞 단계를 반영하면 TipTap 10건만 빼고 맞는다.
- 세 커밋 모두 `@mattermost/compass-ui` 버전은 건드리지 않는다. compass-ui 버전 올림은 별도 커밋(`922a900b` 등, 이미 제외)이었다.

**Alternatives considered**: upstream `package.json`을 통째로 가져오는 방식은 TipTap·compass-ui 항목과 포크 고유 의존성(Lexical 등)을 덮어쓰므로 버린다.

## R2. 포크에 없는 파일은 무엇이고, 어떻게 처리하나?

| 커밋 | 파일 | 포크 | 처리 |
|---|---|---|---|
| `4ca793bd` | `advanced_text_editor/wysiwyg_editor/` 4파일(`wysiwyg_editor_interactions.test.tsx`, `wysiwyg_image.test.ts`, `wysiwyg_markdown.test.ts`, `wysiwyg_markdown.ts`) | 없음(TipTap) | 받지 않는다. 문서에 기록 |
| `4ca793bd` | `webapp/patches/@types+react-bootstrap+0.32.37.patch` | 없음(신규) | 받는다. 0.32.35 패치를 지우고 0.32.37 패치를 넣는다(버전과 묶임) |
| `4ca793bd` | `search_results/__snapshots__/files_filter_menu.test.tsx.snap` | 없음 | upstream 스냅샷은 받지 않는다. 포크 스냅샷은 재생성으로만 갱신 |
| `a28b09d7` | `channels/src/types/external/styles.d.ts` | 없음(신규) | `*.scss`·`*.css` 선언만 받는다. `@mattermost/compass-ui/styles`·`/styles/standalone` 선언 2줄은 뺀다(포크는 compass-ui를 받지 않는다. 선언이 있으면 compass-ui import가 타입 검사를 조용히 통과한다) |
| `a28b09d7` | `channels/package.json` `scripts.i18n-extract` | 있음(포크와 upstream 출발점이 다름: components 경로 없음, `localizeAndFormatMessage` 추가, 큰따옴표) | 포크 문자열을 유지하고 upstream이 더한 `--ignore "../**/*.d.ts"`만 넣는다 |
| `a28b09d7` | components `scripts.build`·`clean`·`run`, shared `scripts.build`·`targets` | 있음(포크 = upstream 출발점) | upstream 값 그대로 받는다 |
| `a28b09d7` | `platform/shared/build/strip_css_imports.mjs`, `platform/shared/tsconfig.build.json` | 없음(신규) | 받는다 |

## R3. 포크에 있는 소스 파일은 그대로 적용되나?

`package.json`·lockfile·스냅샷·TipTap·patches를 뺀 소스 변경을 `git apply --check`로 확인했다.

- `4ca793bd`: 7파일 전부 적용된다(`custom_plugin_settings.test.tsx`, `core_menu_options.test.tsx`, `use_post_box_indicator.test.tsx`, `file_archive.ts`, `post_emoji.test.tsx`, `semantic_time.tsx`, `channel_header_plug.tsx`).
- `20c15b9d`: 3파일은 적용되고 1파일이 실패한다.
  - 실패: `access_control/editors/cel_editor/editor.tsx`. 포크 파일은 upstream 부모와 +41/-91만큼 다르다(뒤쪽 `CELEditorActions` 등). 넣을 자리(`MONACO_EDITOR_OPTIONS`의 `contextmenu: false,` 뒤)는 같으므로 `editContext: false`와 주석 5줄을 손으로 넣는다.
- `a28b09d7`: 13파일은 적용되고 1파일이 실패한다.
  - tsconfig 7개(`channels`, `platform/client`·`client/tsconfig.build`·`components`·`mattermost-redux`·`shared`·`types`)는 포크와 upstream 부모가 **완전히 같다**.
  - 실패: `platform/components/rollup.config.js`. upstream 문맥에는 `isExternal()` 함수가 있는데, 이 함수는 제외한 compass-ui 이관 `e190c0f1`(#38903)이 넣은 것이다. 포크는 `external: externals`를 유지하고, upstream 변경 중 `@rollup/plugin-typescript` → `@swc/core` `transform` 기반 `swc()` 플러그인 교체만 받는다.

## R4. TypeScript 7에서 `tsc`는 무엇을 가리키나?

upstream `a28b09d7`의 lockfile을 확인했다.

- `@typescript/native` = `npm:typescript@7.0.2`. `bin: {tsc: bin/tsc}`. 플랫폼별 네이티브 바이너리 20개를 `optionalDependencies`로 둔다(`@typescript/typescript-darwin-arm64`, `-linux-x64` 등).
- `typescript` = `npm:@typescript/typescript6@6.0.2`. `bin: {tsc6: bin/tsc6}`. eslint(`@typescript-eslint`)·jest·`react-intl` 같은 도구가 쓰는 **JS API**용이다.
- 그래서 `npm run check-types`(`tsc -b`)는 TypeScript 7 네이티브 컴파일러로 돈다. 스크립트 문자열은 바뀌지 않는다.
- `react-intl`의 typescript peer는 루트 `overrides`(`"react-intl": {"typescript": "$typescript"}`)로 6.0.2 별칭에 묶는다.

**위험**: macOS에서 lockfile을 다시 만들 때 Linux용 optional 바이너리 항목이 빠지면 CI(`ubuntu-24.04`)에서 `tsc`가 없다. npm 11은 모든 플랫폼의 optional 항목을 lockfile에 기록하지만, 재생성 뒤 `node_modules/@typescript/typescript-linux-x64` 항목이 있는지 반드시 확인한다(SC-005 검증 항목).

## R5. lockfile을 어떻게 다시 만드나?

- 툴체인이 고정돼 있다: `webapp/package.json` `engines` = Node `24.11.1`, npm `11.6.2`, `packageManager` = `npm@11.6.2`. `webapp/.npmrc`의 `engine-strict=true`가 다른 npm을 거부한다. 로컬 환경(Node v24.11.1, npm 11.6.2)이 일치한다.
- CI(`webapp-ci.yml`)는 `npm install --package-lock-only --ignore-scripts`로 lockfile을 다시 만들어 diff가 있으면 실패한다(`726a47b7fe`, upstream #38265). 따라서 lockfile은 반드시 이 npm으로 만들고, 다시 만들어도 diff가 없어야 한다.
- 절차: 단계마다 `package.json`을 고친 뒤 `cd webapp && npm install`. 이어서 `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`를 한 번 더 돌려 diff가 없는지 본다.
- peer 표시 검토: 재생성 전후 lockfile에서 `"peer": true` 항목 수를 세어 비교한다. 줄어든 항목은 원인을 확인한다.

**Alternatives considered**: upstream lockfile을 가져와 TipTap 항목만 지우는 방식은 포크 고유 의존성(Lexical 등) 항목이 빠지고, CI 재생성 검사에서 diff가 난다. 버린다.

## R6. 스냅샷은 어떻게 다루나?

- `4ca793bd`는 스냅샷 40여 개를 바꾼다. 원인은 라이브러리 마크업 변화다(react 19.3, react-select 5.10, @testing-library 등).
- upstream 스냅샷 파일은 가져오지 않는다. 포크 스냅샷 중 일부는 포크 마크업 기준이다(compass_shim, Slack식 내비게이션, Lexical).
- 단계마다 `npm run test -- -u`로 재생성하고, 바뀐 스냅샷 파일 목록을 upstream이 바꾼 목록과 대조한다.
  - upstream 목록에 있는 파일: 같은 종류의 변화인지 본다.
  - upstream 목록에 없는 파일: 포크 고유 화면이 바뀐 것이므로 원인을 따로 기록한다.

## R7. 기준선은 무엇이고 어떻게 남기나?

원칙 I에 따라 구현 전에 기준선 목록을 저장한다(spec 기준 숫자는 2026-11-10 측정).

| 게이트 | 명령 | 현재 기준선 |
|---|---|---|
| 타입 | `cd webapp && npm run check-types` | 5건(`admin_definition_ldap_wizard.tsx`, `lexical_editor/nodes/emoji_node.test.ts`, `lexical_editor/plugins/markdown_paste_plugin.tsx`, `post_view/post_view.test.tsx`, `resizable_sidebar/resizable_lhs/index.tsx`) |
| eslint | `cd webapp/channels && npm run check:eslint` | 106건, 25파일 |
| stylelint | `cd webapp/channels && npm run check:stylelint` | 68건, 12파일 |
| jest | `cd webapp && npm run test` | 구현 첫 과제에서 실패 목록을 저장한다 |
| 빌드 | `cd webapp && npm run build` | 구현 첫 과제에서 성공 여부와 산출물 크기를 저장한다 |

목록은 파일·규칙 단위로 저장하고 diff로 비교한다(개수 비교만으로 판정하지 않는다).

## R8. TypeScript 7이 포크 고유 코드에서 새 오류를 낼 수 있나?

**결론**: 가능하다. 미리 알 수 없으므로 단계 3에서 판정한다.

- upstream은 `a28b09d7`에서 자기 코드 두 곳(`test_store.tsx`, `client/websocket.test.ts`)만 고쳤다. 포크 고유 코드(Lexical 입력기, Slack식 내비게이션, compass_shim, 조직 역할 등)는 upstream이 검사하지 않았다.
- 대응: 단계 3 직후 `tsc -b` 오류 목록을 기준선과 비교한다. 새 오류는 포크 코드를 고쳐 없앤다. 테스트를 약화하거나 `@ts-ignore`로 덮지 않는다(원칙 III). 고친 내용은 문서에 기록한다.
- 고칠 범위가 커지면(새 오류 20건 초과 등) 사용자에게 보고하고, 단계 3을 별도 PR로 나눌지 결정한다.

## R9. constitution을 고쳐야 하나?

**결론**: 그렇다. 문구가 현실과 어긋난다.

- 원칙 I과 "기술·범위 제약"은 webapp을 "React + TypeScript 5.6"이라고 쓴다. 단계 3 뒤에는 TypeScript 7.0(타입 검사기)과 6.0(도구용 API)이 된다.
- 같은 절의 "Node는 `.nvmrc`(20.11) 기준. webapp engine: Node `>=18.10.0`, npm `^9 || ^10`"은 이미 틀렸다(실제는 Node 24.11.1, npm 11.6.2 고정).
- 사실 문구만 고치는 변경이라 PATCH 개정이다. 별도 커밋(`docs:`)으로 같은 PR에 넣는다.
