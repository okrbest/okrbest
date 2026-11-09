# Research: 메시지 선택 영역 인용과 Markdown 미리보기·코드 전환

작성일: 2026-11-09. 실측은 `master`(94c2e4d376)에서 했다.

## R1. 두 커밋을 어떻게 들일까?

**Decision**: 커밋별로 `git cherry-pick -n`으로 적용하고 충돌을 푼 뒤, 포크에 맞춘 부분을 같은 커밋에서 고친다. 순서는 caaec8cd → 36ebc1f6이다.

**Rationale**: scratch worktree에서 시험 적용해 충돌을 셌다. 충돌이 작아 cherry-pick이 upstream 원문을 가장 많이 보존한다.

| 커밋 | 충돌 파일 | 구간 수 | 성격 |
|---|---|---|---|
| caaec8cd | `advanced_text_editor.tsx` | 1 | import 줄 하나(`useOrientationHandler`와 나란히). `usePendingQuote` 호출 줄은 자동 병합됐다 |
| caaec8cd | `advanced_text_editor.test.tsx` | 1 | theirs 쪽에 제외 계보의 `composer placeholder` describe가 문맥으로 끼어든다. 버린다 |
| caaec8cd | `types/store/views.ts` | 1 | theirs 쪽에 제외 계보의 `ProductRailSection`·`ProductRailTab`이 끼어든다. `PendingQuote`만 남긴다 |
| caaec8cd | `wysiwyg_editor.tsx`, `wysiwyg_editor_interactions.test.tsx` | modify/delete | 포크에 없다. 삭제 유지 |
| 36ebc1f6 | `code_preview.tsx` | 1 | 포크가 06ab8d2c를 먼저 받아 생긴 차이. upstream 최종형(두 커밋 모두 적용)을 기준으로 푼다 |
| 36ebc1f6 | `code_preview.test.tsx` | add/add 1 | 06ab8d2c 반영 때 뺀 `markdown files` describe를 되살린다 |
| 36ebc1f6 | `code_block.test.tsx` | 1 | 06ab8d2c 반영 때 뺀 `ToggleableCodeBlock`·`markdown code blocks` describe를 되살린다 |
| 36ebc1f6 | `file_preview_modal.tsx` | 2 | 포크의 이미지 확대·끌기·바깥 클릭 닫기 코드와 겹친다. 포크 코드를 살리고 upstream 변경을 얹는다 |
| 36ebc1f6 | `file_preview_modal.test.tsx` | 1 | 양쪽 테스트 유지 |
| 36ebc1f6 | `docs/main/...` mdx 2개 | modify/delete | 문서 사이트 제외. 삭제 유지 |

자동 병합된 파일(`channel_controller.tsx`, `constants.tsx`, `paste.test.tsx`, `en.json` 등)도 3-way 문맥 혼입 가능성이 있다. 파일별 `git diff --numstat`을 upstream 커밋의 numstat과 비교해 확인한다(메모리: "3-way 충돌의 theirs에 문맥 코드 섞임").

**Alternatives considered**:
- 파일별 수동 이식: 충돌이 작아 얻는 것이 없고 upstream 원문과 어긋날 위험만 커진다.
- 두 커밋을 한 번에 적용: 36ebc1f6은 caaec8cd 위에서만 깨끗하다. 커밋 이력에서 Upstream 링크를 커밋별로 남기기 어렵다.

## R2. Lexical에서 인용 블록이 upstream과 같은 Markdown을 내보내려면?

**측정**: headless Lexical(`@lexical/markdown` 0.40.0, 기본 `TRANSFORMERS`)에서 `QuoteNode` 안에 텍스트 노드와 줄바꿈 노드로 `first para`, 빈 줄, `- item`, ```` ``` ````, `code`, ```` ``` ````, `**bold**`를 넣고 `$convertToMarkdownString`을 돌렸다.

```
"existing\n\n> first para\n> \n> - item\n> \\`\\`\\`\n> code\n> \\`\\`\\`\n> \\*\\*bold\\*\\*\n"
```

문제가 둘이다.
1. **이스케이프**: 일반 `TextNode`의 Markdown 기호가 이스케이프된다(`\*\*bold\*\*`, ```` \`\`\` ````). 인용 내용을 일반 텍스트로 넣으면 서식이 깨진다.
2. **빈 줄**: 기본 QUOTE transformer는 모든 줄에 `> `를 붙인다. 빈 줄이 upstream `formatQuote`의 `>`가 아니라 `> `로 나간다.

또 upstream 인용 Markdown(`> a\n>\n> b`)을 `$convertFromMarkdownString`에 넘기면 `"> a\n> >\n> b"`가 된다. `QUOTE_REGEX`(`/^>\s/`)가 `>` 한 글자 줄을 인식하지 못하기 때문이다. 붙여넣기 플러그인의 변환 경로는 쓸 수 없다.

**Decision**:
- 인용 내용은 **원문 Markdown 텍스트 노드**(`TextNode`를 상속한 포크 노드, 예: `QuotedMarkdownTextNode`)에 줄 단위로 담는다. `QuoteNode` 안에서 줄 사이는 `LineBreakNode`로 잇는다. 멘션은 이미 `@username` 텍스트로 들어온다(upstream turndown 규칙).
- `CHANNELS_TRANSFORMERS`에 이 노드용 text-match transformer를 넣는다. export는 노드 텍스트를 이스케이프 없이 그대로 돌려준다. import·shortcut 정규식은 아무것도 잡지 않게 한다.
- 기본 QUOTE를 대신하는 포크 QUOTE element transformer를 `CHANNELS_TRANSFORMERS`에 넣는다. export는 빈 줄을 `>`로, 나머지는 `> 줄`로 낸다. import·shortcut 동작은 기본 QUOTE와 같다.
- 사용자가 인용 노드 안에서 글자를 고치면 그 글자도 원문으로 나간다. 같은 노드 타입이 유지되기 때문이다. 이 동작은 TipTap 경로와 다르지만 전송 결과가 일관된다.
- `appendQuote`는 문서 끝에 `QuoteNode`와 빈 문단 하나를 붙이고 그 빈 문단에 커서를 둔다. 에디터가 비어 있으면 내용을 대체한다. 읽기 전용이면 아무것도 하지 않는다. 변경은 Lexical update로 일어나므로 기존 `OnChangePlugin` → `handleLexicalChange` 경로가 draft를 저장한다.

**같음의 정의**: 전송 Markdown(`readMarkdownForSubmit()`)이 upstream `appendQuoteToMessage(기존, text)` 결과와 **끝 공백·빈 줄을 뺀 뒤** 글자 단위로 같다. upstream `appendQuoteToMessage`는 끝에 `\n\n`을 붙여 커서 줄을 만든다. 이 꼬리는 에디터 구조에서 오는 차이라 판정에서 뺀다. spec FR-004·SC-002에 같은 정의를 반영했다.

**Alternatives considered**:
- `$convertFromMarkdownString` 재사용(붙여넣기 플러그인 방식): 위 측정대로 빈 줄과 서식이 깨진다.
- 인용 줄을 평문 문단(`> ...`)으로 넣기: 사용자가 인용 블록 표시를 골랐다(2026-11-09 brainstorming).
- 기본 `TextNode` 이스케이프를 전역으로 끄기: 사용자가 직접 친 `*`·`_`가 서식으로 바뀌어 전송된다. 포크 기존 동작이 바뀐다(FR-009 위반).

## R3. compass-ui `IconButton`·`Icon`을 무엇으로 대신할까?

**측정**: upstream `master`의 `webapp/channels/src`에서 compass-ui 참조가 548줄이다. 36ebc1f6에서 쓰는 API는 `IconButton`(props `size: 'small'|'medium'`, `padding: 'default'|'compact'`, `style: 'default'|'inverted'`, `icon`, `aria-*`, `className`, `onClick`, `disabled`, ref), `Icon`(prop `glyph`), 타입 `IconButtonProps`다. 포크 `@mattermost/shared`에는 IconButton이 없다. 이전 adapt들은 compass-ui를 `btn` 버튼이나 `@mattermost/shared` `Button`으로 바꿨다(divergences: Calls 전화 걸기 메뉴, 서버 로그 등).

**Decision**: 포크 내부에 compass-ui와 같은 이름·props의 대체 컴포넌트를 둔다: `webapp/channels/src/components/compass_shim/icon_button.tsx`(`IconButton`, `IconButtonProps`), `components/compass_shim/icon.tsx`(`Icon`). 36ebc1f6의 네 파일은 **import 경로만** 바꾼다. 클래스 이름은 compass-ui 클래스와 겹치지 않는 고정 이름(`compass-shim-icon-button`, `--size-medium` 등)으로 하고, 크기(28·32·36px)·둥근 모서리·hover 16%·inverted 색은 포크 CSS 변수로 그린다. inverted 스타일은 compass-ui처럼 `--sidebar-text`·`--sidebar-text-rgb`로 색을 정한다. 그래야 36ebc1f6이 `_modifiers.scss`에 넣는 `.icon-buttons-on-dark`(두 변수를 흰색으로 고정) 규칙이 그대로 효과를 낸다. 전환 버튼 scss가 쓰는 `--icon-button-fg`도 대체 컴포넌트가 아이콘 색으로 읽는다.

**Rationale**: upstream 파일 본문을 그대로 두면 다음 sync에서 compass-ui를 쓰는 후속 커밋이 import 줄에서만 충돌한다. 컴포넌트 하나로 디자인을 한곳에서 맞출 수 있다.

**Alternatives considered**:
- 파일마다 `btn` 버튼으로 바꾸기(이전 관례): 버튼 4종에 같은 스타일을 네 번 쓰고, upstream 본문과 크게 갈라진다.
- `HeaderIconButton`(글로벌 헤더용) 재사용: props 체계가 달라 결국 본문을 고쳐야 한다.

**스냅샷**: header·main_nav 스냅샷은 대체 컴포넌트 클래스로 다시 생성한다. 바뀐 줄이 버튼 클래스·구조뿐인지 upstream 스냅샷과 diff로 확인한다.

## R4. 테스트는 어떻게 판정할까?

**Decision**:
- upstream 단위 테스트는 그대로 들인다. 예외: TipTap 전용(`wysiwyg_editor_interactions.test.tsx`), Textbox `toHaveValue` 단언 기반의 `advanced_text_editor.test.tsx` 추가분과 `use_pending_quote.test.tsx`의 Textbox 분기.
- Textbox 단언은 Lexical에서 재현할 수 없다(jsdom에서 Lexical 입력 불가, 메모리: 에디터 테스트 기준선). 그 자리를 두 종류의 새 테스트로 채운다. (1) headless Lexical에서 `appendQuote` 후 `readChannelsMarkdownForSubmit` 결과를 `appendQuoteToMessage` 결과와 비교한다(R2의 7경우). (2) `usePendingQuote`가 Lexical ref의 `appendQuote`를 부르는지 mock ref로 확인한다.
- 원칙 III에 따라 새 테스트는 구현 전 실패 출력을 남긴다.
- Playwright `messaging/quote_selection.spec.ts`와 헬퍼는 들이되 판정에 쓰지 않는다. 스펙이 `post_textbox` testid의 `toHaveValue`를 단언하는데 포크에는 그 testid가 없다(메모리: Playwright 포크 격차). 이 사실을 divergences 문서에 남긴다.
- Cypress 변경(36ebc1f6의 7파일)은 들이되 실행하지 않는다.

## R5. 게이트 기준선은 어떻게 잴까?

**Decision**: 구현 전 같은 디렉터리(`/mnt/d/okrbest/okrbest`)에서 Node v24로 기준선을 잰다(메모리: webapp 게이트 기준선, Node 버전).
- `cd webapp/channels && npm run check-types` (힙 8GB: `NODE_OPTIONS=--max-old-space-size=8192`). 기준선보다 늘면 platform lib 재빌드부터 확인한다.
- `npm run check` (eslint + stylelint)
- 접촉 파일 범위 jest: `npm run test -- <경로들> --maxWorkers=4` (전체 실행은 ENOMEM, `npx jest` 직접 호출은 KST라 금지)
- i18n: `npm run i18n-check-empty`, `npm run i18n-verify-translations`. `i18n-extract`는 실행하지 않는다(메모리: 조직 역할 i18n 역전). en.json 키는 손으로 넣는다.
- 판정은 실패 목록 diff로 한다(원칙 I).

## R6. 문구와 번역

**Decision**: en.json 키 4개는 upstream 원문 그대로 둔다. ko.json에 같은 키를 추가한다: `quote_selection_button.label` = "선택 영역 인용", `markdown_view_toggle.rendered` = "미리보기", `markdown_view_toggle.raw` = "코드", `markdown_view_toggle.group` = "Markdown 보기". 이전 파일 화살표 툴팁은 upstream이 `generic.close`를 `generic.previous`로 바꾼다. ko.json에 `"generic.previous": "이전"`이 이미 있어 번역을 더할 필요가 없다.
