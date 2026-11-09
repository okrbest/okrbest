# US1 — caaec8cd 적용 (T003·T004·T005)

## T003 cherry-pick과 충돌 해소

`git cherry-pick -n caaec8cda5` (2026-11-09, HEAD d2b0cf9aca)

| 파일 | 충돌 | 해소 |
|---|---|---|
| `advanced_text_editor.tsx` | import 1줄 | `useOrientationHandler`(포크)와 `usePendingQuote`(upstream) 둘 다 둔다 |
| `advanced_text_editor.test.tsx` | 파일 끝 1구간 | theirs의 `composer placeholder` describe(제외 계보 문맥, 60줄)를 버리고 `quoting text from a post` describe만 남긴다 |
| `types/store/views.ts` | 파일 끝 1구간 | theirs의 `ProductRailSection`·`ProductRailTab`(제외 계보 문맥)을 버리고 `PendingQuote`만 남긴다 |
| `wysiwyg_editor/wysiwyg_editor.tsx` | modify/delete | `git rm` (TipTap 없음) |
| `wysiwyg_editor/wysiwyg_editor_interactions.test.tsx` | modify/delete | `git rm` |
| `e2e-tests/.../wysiwyg_editor/quote_selection.spec.ts` | (새 파일) | `git rm -f` (TipTap 전용) |

## T004 문맥 혼입 점검

`git show --numstat caaec8cda5`와 `git diff --cached --numstat`을 파일별로 비교했다.

```
same  e2e-tests/.../messaging/quote_selection.spec.ts            250 0 | 250 0
same  e2e-tests/.../messaging/quote_selection_helpers.ts          64 0 |  64 0
DIFF  e2e-tests/.../wysiwyg_editor/quote_selection.spec.ts         59 0 | (버림)
same  actions/views/drafts.ts                                      37 0 |  37 0
same  advanced_text_editor.test.tsx                                78 1 |  78 1
same  advanced_text_editor.tsx                                      3 0 |   3 0
same  use_pending_quote.test.tsx                                   71 0 |  71 0
same  use_pending_quote.tsx                                        82 0 |  82 0
DIFF  wysiwyg_editor/wysiwyg_editor.tsx                            37 2 | (버림)
DIFF  wysiwyg_editor/wysiwyg_editor_interactions.test.tsx          56 0 | (버림)
same  channel_layout/channel_controller.tsx                         2 0 |   2 0
same  popout_controller/popout_controller.tsx                       2 0 |   2 0
same  quote_selection_button/* (5파일)                        모두 같음
same  i18n/en.json                                                  4 0 |   4 0
same  reducers/views/drafts.ts                                     18 0 |  18 0
same  selectors/drafts.test.ts                                    109 2 | 109 2
same  selectors/drafts.ts                                          37 2 |  37 2
same  types/store/views.ts                                          9 0 |   9 0
same  utils/constants.tsx                                           2 0 |   2 0
same  utils/paste.test.tsx                                         16 2 |  16 2
same  utils/quote.test.ts / quote.ts                          모두 같음
same  utils/turndown.ts                                             6 0 |   6 0
```

다른 것은 일부러 버린 TipTap 파일 3개뿐이다. 문맥 혼입은 없다.

## T005 upstream 테스트 원형 실행

```
$ npm run test -- src/utils/quote.test.ts src/components/quote_selection_button src/selectors/drafts.test.ts src/utils/paste.test.tsx --maxWorkers=4
PASS src/utils/quote.test.ts (11.859 s)
PASS src/selectors/drafts.test.ts (6.39 s)
PASS src/components/quote_selection_button/get_quotable_selection.test.ts (27.523 s)
PASS src/components/quote_selection_button/quote_selection_button.test.tsx (42.451 s)
PASS src/utils/paste.test.tsx (92.645 s)
Test Suites: 5 passed, 5 total
Tests:       131 passed, 131 total
```

### 원칙 III — 결함을 심어 실패 확인

구현 파일에 결함을 하나씩 심고 돌린 뒤 `git checkout --`으로 staged 상태로 되돌렸다.

| # | 심은 결함 | 결과 |
|---|---|---|
| M1 | `utils/quote.ts` `formatQuote`: 빈 줄도 `> `로 낸다 | FAIL quote.test.ts — `should prefix every line and keep blank lines inside the quote`, `should keep every blank line so code blocks stay intact` (2 failed / 11) |
| M2 | `selectors/drafts.ts` `canQuoteFromPost`: burn-on-read 검사 제거 | FAIL drafts.test.ts — `should not allow quoting a burn-on-read post` (1 failed / 14) |
| M3 | `utils/turndown.ts` `mattermostUserMention`: 표시 이름을 그대로 둔다 | FAIL get_quotable_selection.test.ts, paste.test.tsx (2 failed / 106) |
| M4 | `get_quotable_selection.ts` `getQuotableSelection`: 항상 null | FAIL get_quotable_selection.test.ts, quote_selection_button.test.tsx (24 failed / 32) |

복구 후 `git status`에 staged 외 변경 없음.
