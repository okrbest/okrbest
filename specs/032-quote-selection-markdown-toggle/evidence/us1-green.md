# US1 GREEN (T006~T010)

## 새 테스트 (T006·T007 → T008·T009 구현 후)

```
$ npm run test -- src/components/lexical_editor/utils/append_quote.test.ts src/components/lexical_editor/nodes/quoted_markdown_text_node.test.ts --maxWorkers=4
PASS src/components/lexical_editor/nodes/quoted_markdown_text_node.test.ts (9.799 s)
PASS src/components/lexical_editor/utils/append_quote.test.ts (10.552 s)
Tests:       16 passed, 16 total
```

RED 때 14건 실패 → 16건 모두 통과([us1-red.md](us1-red.md)).

## T010 lexical_editor 전체 — 기준선 diff

```
$ npm run test -- src/components/lexical_editor --maxWorkers=4
Test Suites: 3 failed, 11 passed, 14 total
Tests:       16 failed, 63 passed, 79 total
$ diff <기준선의 LexicalTextEditor·apply_mention 실패 16건> <이번 실패 목록>
DIFF 0
```

실패 16건은 모두 기준선의 기존 실패다(redux Provider 없이 렌더, 테스트 에디터에 MentionNode 미등록). 새로 생긴 실패는 없다.

## T011·T012 usePendingQuote

**결정 — Textbox 분기를 남긴다.** 훅 본문과 시그니처는 upstream 원형 그대로 두고, TipTap 핸들 타입(`WysiwygEditorHandle`, 포크에 없음)만 `QuotableEditorHandle = Pick<LexicalTextEditorHandle, 'appendQuote'>`로 바꿨다. 포크 Lexical 핸들에 같은 이름의 `appendQuote`를 만들었으므로 upstream의 `wysiwygRef.current.appendQuote(...)` 분기가 그대로 Lexical을 부른다. 다음 sync에서 upstream이 이 훅 본문을 고쳐도 깨끗하게 붙는다. `advanced_text_editor.tsx`는 Textbox ref 자리에 항상 비어 있는 `noTextboxRef`를 넘긴다.

**테스트 — 원형 유지 + Lexical 분기 3건 추가.** upstream 3건(Textbox 경로)은 타입 import 한 줄만 바꿨다. 추가: 에디터가 있으면 `appendQuote`로 넣고 draft는 바꾸지 않는다, 다른 스레드 대상은 무시, 편집 모드는 무시.

```
$ npm run test -- src/components/advanced_text_editor/use_pending_quote.test.tsx --maxWorkers=4
PASS src/components/advanced_text_editor/use_pending_quote.test.tsx (50.053 s)
Tests:       6 passed, 6 total
```

첫 실행부터 통과했다(upstream 훅이 에디터 분기를 이미 갖고 있고, Babel이 타입 import를 지운다). 원칙 III에 따라 결함을 심어 확인했다.

| # | 심은 결함 | 결과 |
|---|---|---|
| M7 | `use_pending_quote.tsx`: `wysiwygRef.current.appendQuote(...)` 호출 제거 | FAIL — `with the Lexical editor › should insert the quote with the editor instead of rewriting the draft` (1 failed / 6) |

## T013 advanced_text_editor 인용 테스트 (원형에서 바꿈)

**바꾼 이유.** upstream 3건은 Textbox의 `getByTestId('post_textbox')` + `toHaveValue('...> ...')`로 단언한다. 포크 Lexical 입력창은 id만 있고 `data-testid`가 없으며, 값이 textarea `value`가 아니라 contenteditable DOM이다. 그래서 id로 찾고, 인용 블록(`.markdown__quote`)과 텍스트 내용으로 단언한다. 전송 Markdown은 `append_quote.test.ts`가 맡는다. Lexical은 저장된 draft를 microtask에서 그리므로, 내용을 비교하는 두 테스트는 `await act(async ...)`로 기다린다(기다리지 않으면 빈 내용끼리 비교해 그냥 통과한다).

RED — 입력창 연결 전(upstream 호출 줄이 포크에 없는 `textboxRef`·`wysiwygRef`를 가리킴):

```
$ npm run test -- src/components/advanced_text_editor/advanced_text_editor.test.tsx -t "quoting text from a post" --maxWorkers=4
      ✕ should append the quote to the draft of the matching channel (97 ms)
      ✕ should ignore a quote meant for another channel or thread (6 ms)
      ✕ should not quote into a message being edited (5 ms)
    ReferenceError: textboxRef is not defined
Tests:       3 failed, 23 skipped, 26 total
```

GREEN — `lexicalEditorRef` 연결 후:

```
      ✓ should append the quote to the draft of the matching channel (575 ms)
      ✓ should ignore a quote meant for another channel or thread (100 ms)
      ✓ should not quote into a message being edited (79 ms)
Tests:       23 skipped, 3 passed, 26 total
```

결함 심기:

| # | 심은 결함 | 결과 |
|---|---|---|
| M5 | 훅의 채널·스레드 대상 비교 제거 | FAIL — `should ignore a quote meant for another channel or thread` |
| M6 | 훅의 편집 모드 조건 제거 | FAIL — `should not quote into a message being edited` |
