# US1 실주행 (T016) — quickstart 시나리오 1~4, 8

**환경**: 2026-11-09, 로컬 서버 `localhost:8065`(사용자 실행 중), webapp dev 번들을 직접 재빌드(`npm_lifecycle_event=run node ../node_modules/webpack-cli/bin/cli.js`, 서빙 해시 `main.e44bca041462e2b19928.js`, `quote_selection_button` 청크 포함 확인). headless Chromium(Playwright, `e2e-tests/playwright`의 라이브러리)으로 실제 화면을 조작했다. 스크립트는 [us1-run/us1_run.js](us1-run/us1_run.js), [us1-run/us1_popout.js](us1-run/us1_popout.js).

**데이터**: mmctl 로컬 모드로 dev DB에 만들었다 — 사용자 `qa032a`(김민수), `qa032b`(이지은), `qa032admin`, 팀 `qa032`, 채널 `quote-test`·`readonly-test`(보관됨)·실행마다 `quote-run-*`·`quote-popout-*`. 원본 메시지(B 작성): 문단 2개, `@qa032a` 멘션, `**굵게**`, 목록 2줄, ```` ```python ```` 코드 블록.

**기대값 계산**: 선택 영역의 Markdown을 upstream `formatQuote`·`appendQuoteToMessage`(caaec8cd `utils/quote.ts`를 그대로 옮긴 함수)에 넣었다.

## 결과 — 20/20 통과

| 시나리오 | 항목 | 결과 | 실측 |
|---|---|---|---|
| 1 | 선택하면 인용 버튼이 뜬다 | PASS | [s1-button.png](us1-run/s1-button.png) |
| 1 | 입력창에 인용 블록 1개 | PASS | blockquote 1 |
| 1 | 커서가 인용 아래 빈 문단 | PASS | 마지막 자식이 빈 `P`, selection anchor가 그 안 |
| 1 | 전송 원문 = upstream 기대값 | PASS | `> 두 번째 문단입니다. @qa032a 님이 롤백 담당이고 **굵게** 표시합니다.\n\n확인했습니다` (기대값과 글자 단위로 같음) |
| 2 | 인용 블록 1개(빈 줄에서 안 쪼개짐) | PASS | [s2-editor.png](us1-run/s2-editor.png) |
| 2 | 전송 원문 = upstream 기대값(끝 공백 제외) | PASS | `쓰던 글\n\n> 첫 번째 …\n>\n> 두 번째 …\n>\n> -   DB 백업\n> -   릴리스 노트 공유\n>\n> ```python\n> print("hi")\n> ```` |
| 2 | 전송된 메시지에 인용 하나로 렌더링 | PASS | 렌더링된 `blockquote` 1개, [s2-sent.png](us1-run/s2-sent.png) |
| 3 | RHS 메시지 인용 → 스레드 답글창 | PASS | 답글창 blockquote 1, 채널 입력창 0. [s3-rhs.png](us1-run/s3-rhs.png) |
| 3 | 스레드 팝아웃 창 입력창으로 인용 | PASS | `/_popout/thread/qa032/…`, [s3-popout-thread.png](us1-run/s3-popout-thread.png) |
| 3 | 채널 팝아웃 창 입력창으로 인용 | PASS | `/_popout/channel/qa032/…`, [s3-popout-channel.png](us1-run/s3-popout-channel.png) |
| 4 | 두 메시지에 걸친 선택 → 버튼 없음 | PASS | 버튼 0 |
| 4 | 편집 중 인용 → 편집 입력에 안 들어감 | PASS | 편집창 내용 `편집할 내 글` 그대로 |
| 4 | 편집을 끝내면 대기 인용이 채널 입력창에 | PASS | Escape 후 채널 입력창에 `두 번째 메시지입니다` 인용. [s4-after-edit.png](us1-run/s4-after-edit.png) |
| 4 | 보관된 채널 → 버튼 없음 | PASS | 버튼 0 |
| 8-1 | 직접 친 인용 전송 | PASS | `> 첫 줄\n\n둘째 줄` — 포크 키보드 플러그인은 Shift+Enter가 새 문단이다(`keyboard_plugin.tsx:49`, 이번 작업에서 바뀌지 않음). 인용 안 빈 줄 `>` 내보내기는 단위 테스트(`append_quote.test.ts` `blockquote Markdown export`)가 확인 |
| 8-2 | 멘션 자동완성 후 전송 | PASS | `@qa032a 안녕하세요` |
| 8-3 | Markdown 붙여넣기 | PASS | `## 제목\n\n- 하나\n- 둘\n\n```js\nconst a = 1;\n```` |
| 8-4 | 해시태그 링크 붙여넣기(실제 클립보드 Ctrl+V) | PASS | `#release` |
| 8-6 | 인용 끝에 덧붙인 글자 원문 유지 | PASS | `> **굵게** **더**` — 굵은 글씨 안쪽만 선택해도 upstream은 서식을 살려 `**굵게**`로 인용한다 |
| (FR-007) | 프로그램으로 범위 지정(키보드·화면 낭독기 경로) | PASS | 팝아웃 두 항목이 이 경로로 버튼을 띄웠다 |

## 실주행 중 고친 것 (모두 테스트 스크립트 쪽)

- 데스크톱 앱 안내 화면에서 멈춤 → `__landingPageSeen__`을 미리 넣었다.
- 시나리오 2의 끝 문구 `print("hi")`가 구문 강조로 여러 텍스트 노드에 나뉘어 있어 `)`로 바꿨다.
- 시나리오 2·8-6 기대값을 잘못 적었다(upstream turndown의 목록 표기 `-   `, 굵은 글씨 안쪽 선택 시 `**굵게**`). 실제 전송값이 upstream 규칙과 맞다.
- 합성 paste 이벤트에서 해시태그가 두 번 들어갔다 → 실제 클립보드(Ctrl+V)로 바꾸자 정상. 합성 이벤트에서 생긴 일이라 제품 결함으로 보지 않는다.
- 자동완성 선택 직후 친 글자 일부가 사라졌다 → 기다림을 넣자 정상. 같은 이유로 제품 결함으로 보지 않는다.
- 포크에서 빈 입력창의 ArrowUp은 편집을 열지 않는다 → 메시지 메뉴의 Edit로 열었다.
- 편집창이 열리며 스크롤이 바뀌어 여러 메시지에 걸친 선택이 됐다 → 화면 아래쪽 메시지를 선택했다.
- 앞선 실행의 글이 쌓여 원본이 화면 밖으로 밀렸다 → 실행마다 새 채널을 만든다.

## 하지 않은 것

- 글쓰기 권한이 없는 채널: 채널 권한 조정 API가 라이선스를 요구해(`api.channel.patch_channel_moderations.license.error`) 보관된 채널로 대신했다. 권한 판정 자체는 `selectors/drafts.test.ts`(upstream, `CREATE_POST` 권한 단언 포함)가 확인한다.
- 비활성 사용자와의 DM, 루트가 삭제된 스레드: 실주행하지 않았다. `selectors/drafts.test.ts`의 upstream 테스트가 확인한다.
- Playwright `messaging/quote_selection.spec.ts`: 돌리지 않았다(포크에 `post_textbox` testid가 없다, research R4).
