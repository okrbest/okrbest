# US1 RED (T006·T007)

뼈대(`$appendQuote`가 false만 반환, 노드 타입·판별 함수 미구현) 상태에서 새 테스트를 실행했다. 모듈 부재 오류가 아니라 기능 부재로 실패하게 하려고 뼈대를 먼저 두었다.

```
$ npm run test -- src/components/lexical_editor/utils/append_quote.test.ts src/components/lexical_editor/nodes/quoted_markdown_text_node.test.ts --maxWorkers=4
FAIL src/components/lexical_editor/nodes/quoted_markdown_text_node.test.ts (9.257 s)
FAIL src/components/lexical_editor/utils/append_quote.test.ts (9.305 s)
Tests:       14 failed, 2 passed, 16 total
```

통과 2건은 뼈대에서도 맞는 동작이다(일반 노드 판별 false, 공백뿐인 인용은 무변경). 빈 줄 export 테스트는 `> first\n> \n> third`(기본 QUOTE transformer)로 실패한다.

실패한 테스트:

```
● $appendQuote › should put the caret in an empty paragraph after the quote
● $appendQuote › should replace the content of an empty message box
● $appendQuote › should send text added to the end of the quote without escaping it
● $appendQuote › should send the same Markdown as upstream for a fenced code block
● $appendQuote › should send the same Markdown as upstream for a single line
● $appendQuote › should send the same Markdown as upstream for an existing draft
● $appendQuote › should send the same Markdown as upstream for inline formatting and links
● $appendQuote › should send the same Markdown as upstream for lists
● $appendQuote › should send the same Markdown as upstream for paragraphs separated by a blank line
● $appendQuote › should send the same Markdown as upstream for user and channel mentions
● $appendQuote › should show the quote as one blockquote
● Console
● QuotedMarkdownTextNode › should hold the quoted Markdown as plain text
● QuotedMarkdownTextNode › should survive a JSON round trip
● blockquote Markdown export › should write a blank line of a typed blockquote as a bare ">"
```
