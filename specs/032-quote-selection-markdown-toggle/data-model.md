# Data Model: 메시지 선택 영역 인용과 Markdown 미리보기·코드 전환

서버 데이터는 바뀌지 않는다. 모두 webapp 클라이언트 상태다. upstream 정의를 그대로 쓴다.

## PendingQuote (Redux `state.views.drafts.pendingQuote`)

upstream `types/store/views.ts` 그대로.

| 필드 | 타입 | 뜻 |
|---|---|---|
| `channelId` | string | 인용문이 들어갈 채널 |
| `rootId` | string | 들어갈 스레드의 루트 글 ID. 가운데 채널 입력창이면 `''` |
| `text` | string | 선택 영역을 바꾼 Markdown. `> ` 접두를 붙이기 전 |

- 값은 `null` 또는 하나뿐이다.
- 상태 변화:
  - `QUOTE_TEXT_IN_DRAFT` → 새 값으로 바꾼다(이전 대기 인용은 버린다).
  - `CLEAR_PENDING_QUOTE` → `null`. 입력창이 인용을 넣었거나, 입력창을 쓸 수 없어 버릴 때 보낸다.
  - `UserTypes.LOGOUT_SUCCESS` → `null`.
- 입력창은 `channelId`·`rootId`가 자기와 같고 편집 모드가 아닐 때만 받는다. 처리 중(재작성)이면 끝날 때까지 기다린다.
- `quoteTextFromPost(postId, isRHS, text)`: RHS·스레드 화면이면 `rootId = post.root_id || post.id`, 아니면 `''`.
- `canQuoteFromPost(state, postId, isRHS)`: 글 없음, burn-on-read, 채널 없음·보관됨·비활성 DM, (RHS면) 루트 삭제, `CREATE_POST` 권한 없음 → `false`.

## Markdown 보기 선택 (LocalStorage)

upstream `stores/local_storage_store.ts` 그대로.

| 항목 | 값 |
|---|---|
| 키 | `markdown_${surface}_view:${userId}` |
| `surface` | `file_preview` 또는 `code_block` |
| 값 | `MarkdownViews.RENDERED` 또는 `MarkdownViews.RAW` |
| 기본값 | `file_preview` → RENDERED, `code_block` → RAW |

- 저장값이 둘 중 하나가 아니거나 저장소 접근이 실패하면 기본값을 쓴다.
- 같은 창의 다른 컴포넌트는 리스너로, 다른 탭은 `storage` 이벤트로 따라간다.

## Lexical 인용 노드 (포크 추가)

research R2의 결정. upstream에는 없다.

| 노드 | 부모 | 내보내기 |
|---|---|---|
| `QuoteNode`(기존 `@lexical/rich-text`) | 루트 | 포크 QUOTE transformer: 빈 줄은 `>`, 나머지는 `> 줄` |
| `QuotedMarkdownTextNode`(새 `TextNode` 상속, 이름은 구현 때 확정) | `QuoteNode` | text-match transformer: 텍스트를 이스케이프 없이 그대로 |
| `LineBreakNode`(기존) | `QuoteNode` | 줄 사이 |

- 새 노드는 LexicalComposer `nodes`와 headless 테스트 에디터에 등록한다. `exportJSON`·`importJSON`을 구현해 draft 복원(JSON 직렬화가 있다면)에서도 유지한다.
- 이 노드는 import·shortcut으로 만들어지지 않는다. `appendQuote`만 만든다.
