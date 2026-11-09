# 계약: `LexicalTextEditorHandle.appendQuote`

위치: `webapp/channels/src/components/lexical_editor/lexical_text_editor.tsx`

upstream `WysiwygEditorHandle.appendQuote`(caaec8cd)와 이름·의미를 맞춘다.

```ts
export type LexicalTextEditorHandle = {
    // ...기존 멤버 그대로
    // 선택 Markdown을 인용 블록으로 문서 끝에 붙이고, 그 뒤 빈 문단에 커서를 둔다.
    appendQuote: (markdown: string) => void;
};
```

## 동작

| 조건 | 결과 |
|---|---|
| 에디터가 없거나 읽기 전용(`disabled`) | 아무것도 하지 않는다 |
| `formatQuote(markdown)`이 빈 문자열(공백뿐) | 아무것도 하지 않는다 |
| 에디터가 비어 있다 | 내용을 [인용 블록, 빈 문단]으로 바꾼다 |
| 에디터에 내용이 있다 | 끝에 [인용 블록, 빈 문단]을 붙인다 |
| 모든 경우(삽입했을 때) | 마지막 빈 문단에 커서를 두고 에디터에 포커스한다 |

## 직렬화 불변식

`readMarkdownForSubmit()` 결과를 `trimEnd()`한 값이 `appendQuoteToMessage(기존 draft, markdown).trimEnd()`와 같다.

시험할 경우(research R2):
1. 단문
2. 빈 줄이 낀 여러 문단
3. 목록(`- item`, `1. item`)
4. 코드 블록(```` ```lang ```` 펜스)
5. 서식(`**bold**`, `_it_`, `` `code` ``, 링크)
6. 멘션(`@username`)과 채널 링크(`~channel`)
7. 기존 draft가 있다

## 호출자

`components/advanced_text_editor/use_pending_quote.tsx`. upstream 시그니처의 `wysiwygRef` 자리에 `lexicalEditorRef`를 넘긴다. Textbox 분기(`appendQuoteToMessage` + `handleDraftChange`)는 포크에서 도달하지 않는다. 남길지는 구현 때 정한다(기준: 다음 sync 충돌을 줄이는 쪽).
