# webapp 게이트 기준선 (T001)

측정: 2026-11-09, 브랜치 `032-quote-selection-markdown-toggle` 생성 직후(코드 변경 없음, HEAD 94c2e4d376), Node v24.11.1, `webapp/channels`에서 실행.

| 게이트 | 명령 | exit | 실패 목록 |
|---|---|---|---|
| 타입 | `NODE_OPTIONS=--max-old-space-size=8192 npm run check-types` | 2 | [baseline/baseline-ts.list](baseline/baseline-ts.list) — 13건 (ldap_wizard 6, emoji_node.test 2, markdown_paste_plugin 1, post_view.test 2, resizable_lhs 2) |
| eslint | `npm run check:eslint` (`npm run check` 앞단) | 1 | [baseline/baseline-eslint.list](baseline/baseline-eslint.list) — 106건 (파일·규칙 단위) |
| stylelint | `npm run check:stylelint` (eslint 실패로 `check`가 멈춰 따로 실행) | 2 | [baseline/baseline-stylelint.list](baseline/baseline-stylelint.list) — 69건 |
| jest (접촉 영역) | `npm run test -- <quickstart 경로> --maxWorkers=4` | 1 | [baseline/baseline-jest.list](baseline/baseline-jest.list) — 31건, 스위트 4/46 실패, 테스트 31/435 실패 |
| i18n 빈 번역 | `npm run i18n-check-empty` | 0 | 없음 |
| i18n ICU | `npm run i18n-verify-translations` | 1 | 21개 로케일 10149건. ko.json분: [baseline/baseline-i18n-ko.list](baseline/baseline-i18n-ko.list) — 36건 |

jest 범위를 접촉 영역으로 좁힌 이유: webapp 전체 jest는 기본 워커로 ENOMEM이 난다(메모리 webapp-jest-full-run-enomem). 원칙 I의 `npm run test` 대신 접촉 영역 + 새 테스트 경로로 판정한다(T034).

기존 실패는 메모리의 기준선 기록과 같은 종류다: lexical_editor 스위트(lexical-editor-test-baseline-fail), advanced_text_editor 다수(advanced-text-editor-test-baseline-timeout).
