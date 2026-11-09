# US1 좁은 게이트 (T015)

caaec8cd 적용 + Lexical 인용 삽입 후, T001과 같은 명령에 새 테스트 경로(`src/components/quote_selection_button`, `src/utils/quote.test.ts`)를 더해 실행했다. 비교는 [baseline-webapp.md](baseline-webapp.md)의 목록과 한다.

| 게이트 | 기준선 | US1 | 목록 diff |
|---|---|---|---|
| check-types | 13건 | 13건 | 0 |
| eslint | 106건 | 110건 → 고친 뒤 106건 | 처음 +4(`quoted_markdown_text_node.ts` no-underscore-dangle 2, `append_quote.test.ts` import/order 2). 고친 뒤 해당 6파일 `npx eslint` exit 0 |
| stylelint | 69건 | 69건 | 0 |
| jest | 31건 실패 / 435 | 31건 실패 / 511 (스위트 52) | 0 — 새 테스트 76건(인용 버튼·quote·use_pending_quote·append_quote·노드·입력창 3건) 모두 통과 |
| i18n-check-empty | exit 0 | exit 0 | — |
| i18n ICU (ko.json) | 36건 | 36건 | 0 |

eslint 고친 내용: `clone`에서 `node.__text`·`node.__key` 대신 `getTextContent()`·`getKey()`를 쓴다. 테스트 import 순서를 `./` → `../`로 바꿨다. 고친 뒤 `append_quote.test.ts`·`quoted_markdown_text_node.test.ts` 16건 재통과.
