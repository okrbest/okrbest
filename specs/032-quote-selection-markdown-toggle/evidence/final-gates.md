# 최종 게이트와 기준선 diff (T034)

측정: 2026-11-09, HEAD `48c03eee81`(`48c03eee81` 위 문서 변경만), Node v24.11.1, `webapp/channels`. 명령은 [baseline-webapp.md](baseline-webapp.md)와 같고, jest 범위에 새 경로 7개(`src/components/quote_selection_button`, `src/components/markdown_view_toggle`, `src/components/compass_shim`, `src/components/wrapped_code_lines.test.tsx`, `src/utils/quote.test.ts`, `src/utils/is_likely_markdown.test.ts`, `src/utils/turndown.test.ts`)를 더했다. `lexical_editor`·`advanced_text_editor`·`code_block`·`code_preview`·`file_preview_modal`은 기준선 범위에 이미 있다.

| 게이트 | 기준선 | 최종 | 목록 diff | 목록 |
|---|---|---|---|---|
| check-types | 13 | 13 | 0 | [final/final-ts.list](final/final-ts.list) |
| eslint (`check:eslint`) | 106 | 106 | 0 | [final/final-eslint.list](final/final-eslint.list) |
| stylelint (`check:stylelint`) | 68 | 68 | 0 | [final/final-stylelint.list](final/final-stylelint.list) |
| jest 실패 | 31 / 435 (스위트 4/46) | 31 / 605 (스위트 4/57) | 0 — 실패 이름이 같다 | [final/final-jest.list](final/final-jest.list) |
| i18n-check-empty | exit 0 | exit 0 | — | — |
| i18n ICU (ko.json) | 36 | 36 | 0 | [final/final-i18n-ko.list](final/final-i18n-ko.list) |

**기준선 문서 정정**: [baseline-webapp.md](baseline-webapp.md)의 stylelint "69건"은 요약 줄(`✖ 68 problems`)을 파일 항목으로 잘못 센 값이다. 실제 오류는 68건이다([baseline/baseline-stylelint-errors.list](baseline/baseline-stylelint-errors.list)). 비교는 오류 줄끼리 했다.

새 경로와 이번 작업의 새·고친 테스트 스위트는 모두 통과한다:

```
PASS src/components/advanced_text_editor/use_pending_quote.test.tsx (8.986 s)
PASS src/components/code_block/code_block.test.tsx (56.5 s)
PASS src/components/code_preview.test.tsx (84.096 s)
PASS src/components/compass_shim/icon_button.test.tsx
PASS src/components/file_preview_modal/file_preview_modal.test.tsx (83.367 s)
PASS src/components/file_preview_modal/file_preview_modal_footer/file_preview_modal_footer.test.tsx (5.912 s)
PASS src/components/file_preview_modal/file_preview_modal_header/file_preview_modal_header.test.tsx (13.385 s)
PASS src/components/file_preview_modal/file_preview_modal_info/file_preview_modal_info.test.tsx (9.648 s)
PASS src/components/file_preview_modal/file_preview_modal_main_actions/file_preview_modal_main_actions.test.tsx (13.492 s)
PASS src/components/file_preview_modal/file_preview_modal_main_nav/file_preview_modal_main_nav.test.tsx
PASS src/components/file_preview_modal/image_preview.test.tsx (10.518 s)
PASS src/components/file_preview_modal/popover_bar/popover_bar.test.tsx (5.321 s)
PASS src/components/lexical_editor/nodes/quoted_markdown_text_node.test.ts
PASS src/components/lexical_editor/utils/append_quote.test.ts
PASS src/components/markdown_view_toggle/markdown_view_toggle.test.tsx (6.151 s)
PASS src/components/quote_selection_button/get_quotable_selection.test.ts
PASS src/components/quote_selection_button/quote_selection_button.test.tsx (7.266 s)
PASS src/components/wrapped_code_lines.test.tsx
PASS src/stores/local_storage_store.test.ts
PASS src/utils/is_likely_markdown.test.ts
PASS src/utils/quote.test.ts
PASS src/utils/turndown.test.ts
```

jest 실패 31건은 모두 기준선의 기존 실패다: `lexical_editor` 16건(redux Provider 없이 렌더, 테스트 에디터에 MentionNode 미등록), `advanced_text_editor` 15건(jsdom에서 Lexical 타이핑 불가 등, 메모리 advanced-text-editor-test-baseline-timeout).
