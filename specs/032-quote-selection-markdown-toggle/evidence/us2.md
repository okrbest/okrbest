# US2 — Markdown 코드 블록 미리보기·코드 전환 (T026·T027)

## T026 upstream 테스트

```
$ npm run test -- src/components/code_block src/components/markdown_view_toggle src/utils/is_likely_markdown.test.ts src/utils/turndown.test.ts src/components/wrapped_code_lines.test.tsx src/stores/local_storage_store.test.ts src/components/code_preview.test.tsx src/components/file_preview_modal src/components/compass_shim --maxWorkers=4
PASS src/components/markdown_view_toggle/markdown_view_toggle.test.tsx
PASS src/components/wrapped_code_lines.test.tsx
PASS src/utils/turndown.test.ts
PASS src/stores/local_storage_store.test.ts
PASS src/utils/is_likely_markdown.test.ts
PASS src/components/code_block/code_block.test.tsx (105.307 s)
… (US3·US4 스위트 포함 16스위트)
Tests:       179 passed, 179 total
Snapshots:   24 passed, 24 total
```

되살린 `code_block.test.tsx` `markdown code blocks` describe(`ToggleableCodeBlock` 사용)가 통과한다. 검색 결과에서 렌더링하지 않는 경우는 이 describe 안의 테스트가 확인한다(FR-013).

### 원칙 III — 결함 심기

| # | 심은 결함 | 결과 |
|---|---|---|
| M8 | `utils/is_likely_markdown.ts` 항상 false | FAIL is_likely_markdown.test.ts, code_block.test.tsx (12 failed / 53) |
| M9 | `code_block.tsx` 렌더링 보기 끔(`showRendered` 항상 false) | FAIL code_block.test.tsx 6건 — `should render the markdown when toggled and switch back to raw`, `should keep every markdown block on the same view when one is toggled`, `should apply the remembered choice to later code blocks` 등 |
| M10 | `local_storage_store.ts` 저장된 보기 무시 | FAIL local_storage_store.test.ts, code_block.test.tsx (8 failed / 35) |
| M11 | `turndown.ts` 줄바꿈 코드의 줄 합치기 깨짐 | FAIL turndown.test.ts — `should rejoin the rows of a raw markdown code block, which have no line breaks between them` |

모두 복구 후 원본과 같음.

## T027 실주행 — quickstart 시나리오 5 (9/9 통과)

환경: [us1.md](us1.md)와 같다. 36ebc1f6 적용 후 번들 재빌드(서빙 해시 `main.f9db18676189c2b4b1e7.js`, `markdown_view_toggle` 청크 포함). 스크립트 [us234-run/us234_run.js](us234-run/us234_run.js).

| 항목 | 결과 | 실측 |
|---|---|---|
| ```` ```markdown ```` 블록에 전환 버튼 | PASS | `group "Markdown view"` 1개 |
| 기본은 코드 | PASS | `Preview:false,Code:true`, [s5-raw.png](us234-run/s5-raw.png) |
| 미리보기로 렌더링 | PASS | 블록 안 `h2` 1, `strong` 1, 체크박스 1. [s5-rendered.png](us234-run/s5-rendered.png) |
| 미리보기에서도 복사는 원문 | PASS | 클립보드 `## 배포 체크리스트\n- [ ] DB 백업\n- **릴리스 노트** 공유` |
| 미리보기 블록 일부 인용(US2 수용 7) | PASS | 굵은 글씨만 선택해도 블록 원문 전체가 언어 펜스와 함께 인용된다: ```` ```markdown\n## 배포 체크리스트\n…\n``` ````(렌더링된 블록은 원문 속성으로 인용하는 36ebc1f6 turndown 동작) |
| 새로고침 후에도 미리보기 유지 | PASS | `Preview:true,Code:false` |
| 언어 표시 없는 `##` 블록에 전환 버튼 | PASS | 1개 |
| 같은 선택을 다른 블록도 따름 | PASS | `Preview:true,Code:false` |
| `python` 블록에는 전환 버튼 없음 | PASS | 0개 |
