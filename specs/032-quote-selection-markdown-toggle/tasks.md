---

description: "메시지 선택 영역 인용과 Markdown 미리보기·코드 전환 구현 과제"
---

# Tasks: 메시지 선택 영역 인용과 Markdown 미리보기·코드 전환

**Input**: `specs/032-quote-selection-markdown-toggle/`의 [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: constitution 원칙 III이 요구한다. 포크가 새로 쓰는 테스트는 **구현 전 실패 출력**을 `evidence/`에 남긴 뒤에만 완료로 표시한다. upstream에서 그대로 가져온 테스트도 예외가 아니다(adapt 커밋이라 cherry-pick 예외에 해당하지 않음). 통과를 확인한 뒤, 대상 구현 파일만 임시로 되돌려 실패 출력을 남기고 복구한다(사본을 떠 두고 되돌린다. 다른 세션과 공유되는 `git stash`는 쓰지 않는다). 그럴 수 없으면 과제 옆에 `미검증`과 사유를 적는다. 원형에서 바꾼 테스트는 과제 옆에 사유를 적는다(plan.md Constitution Check III).

**Organization**: US1은 caaec8cd, US2~US4는 36ebc1f6이다. 36ebc1f6은 한 번에 cherry-pick하므로 Phase 4에서 공통으로 적용하고, 스토리별 Phase에서 검증한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬로 할 수 있다(다른 파일, 끝나지 않은 과제에 의존하지 않음)
- **[Story]**: 스토리 번호(US1~US4)

## Path Conventions

- webapp 코드: `webapp/channels/src/`
- 증거: `specs/032-quote-selection-markdown-toggle/evidence/`
- 명령은 Node v24(`nvm use 24`)에서, `webapp/channels`에서 실행한다. jest는 `npm run test -- <경로> --maxWorkers=4`로만 부른다(`npx jest` 금지, 전체 실행 금지). `i18n-extract`는 실행하지 않는다.

---

## Phase 1: Setup — 기준선과 명세 커밋

**Purpose**: 변경 전 게이트 기준선을 저장하고 명세를 커밋한다(원칙 I·VII).

- [X] T001 webapp 게이트 기준선 저장 — [quickstart.md](quickstart.md) "게이트" 절의 명령(`check-types` 힙 8GB, `check`, 접촉 영역 jest, `i18n-check-empty`, `i18n-verify-translations`)을 브랜치 생성 직후 상태에서 돌려 `specs/032-quote-selection-markdown-toggle/evidence/baseline-webapp.md`에 실패 목록으로 기록. jest 범위에 `src/components/lexical_editor`를 꼭 넣는다(포크 QUOTE transformer 회귀 판정용). `check-types`가 기준선보다 많이 실패하면 platform/types·client 재빌드부터 확인
- [X] T002 명세 커밋 — `specs/032-quote-selection-markdown-toggle/`(spec·plan·research·data-model·contracts·quickstart·checklists·tasks), `.specify/feature.json`, `CLAUDE.md`·`AGENTS.md`·`.cursor/rules/specify-rules.mdc`의 plan 포인터를 `docs: 032 인용·Markdown 전환 spec` 커밋으로 올린다

**Checkpoint**: 기준선 파일이 있고 작업 트리가 깨끗하다.

---

## Phase 2: Foundational

US1과 US2~US4 사이에 공통 선행 작업은 없다. US2~US4의 선행 작업(compass_shim, 36ebc1f6 적용)은 Phase 4에 둔다.

---

## Phase 3: User Story 1 — 메시지 일부를 골라 인용해 답한다 (P1) 🎯 MVP

**Goal**: caaec8cd를 들이고 포크 Lexical 입력창에 인용을 넣는다(FR-001~FR-009).

**Independent Test**: [quickstart.md](quickstart.md) 시나리오 1~4. 채널·RHS·팝아웃에서 인용 블록이 들어가고, 전송 Markdown이 upstream `appendQuoteToMessage` 결과와 같다(끝 공백 제외).

### upstream 적용

- [X] T003 [US1] caaec8cd 적용 — `git cherry-pick -n caaec8cda5`. 충돌은 [research.md](research.md) R1 표대로 푼다: `advanced_text_editor.tsx` import는 `useOrientationHandler`와 `usePendingQuote`를 둘 다 둔다. `advanced_text_editor.test.tsx`는 theirs의 `composer placeholder` describe(제외 계보 문맥)를 버린다. `types/store/views.ts`는 `PendingQuote`만 남기고 `ProductRailSection`·`ProductRailTab`을 버린다. `wysiwyg_editor/wysiwyg_editor.tsx`·`wysiwyg_editor_interactions.test.tsx`·`e2e-tests/playwright/specs/functional/channels/wysiwyg_editor/quote_selection.spec.ts`는 `git rm`. 아직 커밋하지 않는다
- [X] T004 [US1] 문맥 혼입 점검 — 자동 병합 파일(`channel_layout/channel_controller.tsx`, `utils/constants.tsx`, `utils/paste.test.tsx`, `i18n/en.json`, `popout_controller/popout_controller.tsx`, `selectors/drafts.ts` 등)마다 `git diff --cached --numstat`을 `git show --numstat caaec8cda5`와 비교. 줄 수가 다르면 hunk를 보고 제외 계보 문맥을 걷어 낸다. 결과를 `evidence/us1-apply.md`에 기록
- [X] T005 [US1] upstream 테스트 그대로 통과 확인 — `src/utils/quote.test.ts`, `src/components/quote_selection_button`, `src/selectors/drafts.test.ts`, `src/utils/paste.test.tsx`를 실행해 `evidence/us1-apply.md`에 출력 기록. 실패하면 원인을 적고(포크 차이인지) 테스트를 약화하지 않는다. 원칙 III: 통과 후 대상 구현 파일(`utils/quote.ts`, `quote_selection_button/get_quotable_selection.ts`, `selectors/drafts.ts`의 `canQuoteFromPost`, `utils/turndown.ts`의 멘션 규칙)을 하나씩 임시로 되돌려 실패 출력을 남기고 복구한다. 못 하면 `미검증`과 사유

### Lexical 인용 삽입 (포크 추가, TDD)

- [X] T006 [US1] 직렬화 테스트 작성(RED) — `webapp/channels/src/components/lexical_editor/utils/append_quote.test.ts` 신규. headless Lexical 에디터(`createEditor`, 포크 노드 등록)에서 `$appendQuote(markdown)` 후 `readChannelsMarkdownForSubmit(editor).trimEnd()`가 `appendQuoteToMessage(기존, markdown).trimEnd()`와 같은지 본다. [contracts/lexical-append-quote.md](contracts/lexical-append-quote.md)의 7경우 + "인용 후 인용 노드 끝에 글자 추가" + "공백뿐인 markdown은 무변경" + "빈 에디터는 내용 대체". **실패 출력을 `evidence/us1-red.md`에 기록**
- [X] T007 [US1] 원문 텍스트 노드 — `webapp/channels/src/components/lexical_editor/nodes/quoted_markdown_text_node.ts` 신규(`TextNode` 상속, `getType`·`clone`·`importJSON`·`exportJSON`, `$create…`·`$is…`). 기존 `mention_node.ts` 형식을 따른다. 노드 단위 테스트 `quoted_markdown_text_node.test.ts`를 먼저 써서 실패 출력을 `evidence/us1-red.md`에 추가
- [X] T008 [US1] transformer — `webapp/channels/src/components/lexical_editor/config/markdown_transformers.ts`에 (1) 원문 노드용 text-match transformer(export는 텍스트 그대로, import·shortcut 정규식은 아무것도 잡지 않음) (2) 기본 QUOTE를 대신하는 포크 QUOTE element transformer(export: 빈 줄 `>`, 나머지 `> 줄`. import·replace는 기본과 같음)를 추가하고 `CHANNELS_TRANSFORMERS`·`CHANNELS_SHORTCUT_TRANSFORMERS`·`CHANNELS_MARKDOWN_IMPORT_WITHOUT_TABLE`에서 기본 QUOTE를 바꿔 낀다. 새 노드를 `lexical_text_editor.tsx`의 LexicalComposer `nodes`에 등록
- [X] T009 [US1] `$appendQuote` 구현 — `webapp/channels/src/components/lexical_editor/utils/append_quote.ts` 신규. `formatQuote` 결과를 줄로 나눠 `QuoteNode`(원문 노드 + `LineBreakNode`)와 빈 문단을 만든다. 빈 에디터면 대체, 아니면 끝에 붙이고, 빈 문단에 selection. T006·T007 GREEN 출력을 `evidence/us1-green.md`에 기록
- [X] T010 [US1] 핸들 노출 — `webapp/channels/src/components/lexical_editor/lexical_text_editor.tsx`의 `LexicalTextEditorHandle`에 `appendQuote` 추가. 에디터가 없거나 `disabled`면 무시, 아니면 `editor.update(() => $appendQuote(md))` 후 `focus()`. 기존 lexical_editor 테스트(`src/components/lexical_editor`)를 돌려 T001 기준선과 실패 목록 diff 0을 확인

### 입력창 연결

- [X] T011 [US1] `usePendingQuote` 테스트 조정(RED) — `webapp/channels/src/components/advanced_text_editor/use_pending_quote.test.tsx`(upstream 원형). Textbox 분기 단언(`setCaretPosition`, draft message 변경)은 포크에서 도달하지 않으므로, Lexical ref의 `appendQuote`가 대상 일치 시 1회 불리고 `clearPendingQuote`가 디스패치되는지, 편집 모드·다른 대상·처리 중·사용 불가 경우를 단언하도록 바꾼다. 바꾼 사유를 이 과제 옆에 적는다. **실패 출력 기록** — **바꾼 사유**: upstream 3건(Textbox 경로)은 타입 import 한 줄만 바꿔 그대로 두고, Lexical 분기 3건을 추가했다. 첫 실행부터 통과해(upstream 훅이 에디터 분기를 이미 가짐) 결함 M7로 실패를 확인했다([evidence/us1-green.md](evidence/us1-green.md))
- [X] T012 [US1] `usePendingQuote` 연결 — `webapp/channels/src/components/advanced_text_editor/use_pending_quote.tsx`가 `wysiwygRef` 자리에 `LexicalTextEditorHandle` ref를 받게 하고, `advanced_text_editor.tsx` 호출을 `lexicalEditorRef`로 바꾼다. Textbox 분기를 남길지(다음 sync 충돌 최소화 기준) 정해 결정을 `evidence/us1-green.md`와 T026 divergences 기록에 남긴다. T011 GREEN 출력 기록 — **결정**: Textbox 분기를 남겼다(훅 본문·시그니처 upstream 그대로, 타입만 `QuotableEditorHandle`)
- [X] T013 [US1] 입력창 테스트 조정(RED→GREEN) — `webapp/channels/src/components/advanced_text_editor/advanced_text_editor.test.tsx`의 caaec8cd 추가분(Textbox `toHaveValue` 단언)을 store의 `views.drafts.pendingQuote` 주입 + Lexical 핸들 `appendQuote` 호출 단언으로 옮긴다(메모리: jsdom에서 Lexical 타이핑 불가 → store로 주입). 바꾼 사유를 이 과제 옆에 적는다. 실패·통과 출력 기록. 기존 실패(advanced_text_editor 기준선)와 섞지 않게 T001 목록과 비교 — **바꾼 사유**: 포크 Lexical 입력창은 `data-testid`·textarea `value`가 없어 id·인용 블록·텍스트로 단언하고 Lexical microtask를 `await act`로 기다린다. RED(`ReferenceError: textboxRef`)→GREEN, 결함 M5·M6 확인
- [X] T014 [P] [US1] 번역 — `webapp/channels/src/i18n/ko.json`에 `"quote_selection_button.label": "선택 영역 인용"` 추가(키 정렬 위치 유지)

### 검증과 커밋

- [X] T015 [US1] 좁은 게이트 — `check-types`, `check`, 접촉 영역 jest, `i18n-check-empty`를 돌려 T001 기준선과 실패 목록 diff를 `evidence/us1-gates.md`에 기록
- [X] T016 [US1] 실주행 — [quickstart.md](quickstart.md) 시나리오 1~4와 시나리오 8(입력창 회귀, FR-009)(SC-001·SC-002·SC-005). 전송 원문과 upstream `appendQuoteToMessage` 기대값을 나란히 `evidence/us1.md`에 기록. Playwright `messaging/quote_selection.spec.ts`는 돌리지 않는다(post_textbox testid 부재, research R4)
- [X] T017 [US1] 커밋 — `feat(webapp): 메시지 선택 영역 인용 버튼`. 본문에 Lexical 맞춤 요지와 `Upstream: https://github.com/mattermost/mattermost/commit/caaec8cda5e34866ccb2f7a4eb93e9dee585601c` 기재

**Checkpoint**: US1만으로 배포 가능하다.

---

## Phase 4: US2~US4 공통 기반 — compass_shim과 36ebc1f6 적용

**Purpose**: 36ebc1f6이 빌드되는 상태를 만든다. US2~US4 검증의 선행 조건이다.

- [X] T018 [P] compass_shim 테스트 작성(RED) — `webapp/channels/src/components/compass_shim/icon_button.test.tsx` 신규. [contracts/compass-shim-icon-button.md](contracts/compass-shim-icon-button.md) 기준: size·padding·style 조합별 클래스, `type='button'` 기본값, `aria-*`·`onClick`·`disabled` 전달, ref 전달, `Icon`이 `aria-hidden` span으로 glyph를 감싼다. **실패 출력을 `evidence/shim-red.md`에 기록**
- [X] T019 compass_shim 구현 — `webapp/channels/src/components/compass_shim/icon_button.tsx`, `icon.tsx`, `compass_shim.scss` 신규(Mattermost 저작권 헤더). 크기 28·32·36px, `var(--radius-s)`, hover(default 8%, inverted 16%), inverted 색은 `--sidebar-text`·`--sidebar-text-rgb`, 아이콘 색은 `--icon-button-fg` 우선, `:focus-visible` 포커스 링. GREEN 출력 기록
- [X] T020 커밋 — `webapp/channels/src/components/compass_shim/`를 `feat(webapp): compass-ui 대체 IconButton·Icon`으로 커밋
- [X] T021 36ebc1f6 적용 — `git cherry-pick -n 36ebc1f6fc`. `docs/main/end-user-guide/collaborate/format-messages.mdx`·`share-files-in-messages.mdx`는 `git rm`. compass-ui import 4파일(`markdown_view_toggle/markdown_view_toggle.tsx`, `copy_button.tsx`, `file_preview_modal_main_actions.tsx`, `file_preview_modal_main_nav.tsx`)은 import 경로만 `components/compass_shim/...`로 바꾼다. 아직 커밋하지 않는다
- [X] T022 06ab8d2c 계열 충돌 해소 — `code_preview.tsx`, `code_preview.test.tsx`(add/add), `code_block.test.tsx`. 목표는 upstream 최종형이다: 해소 후 `git diff upstream/master -- webapp/channels/src/components/code_preview.tsx webapp/channels/src/components/code_block webapp/channels/src/utils/syntax_highlighting.tsx`가 포크 고유 차이(제외 계보 문맥, `LoadingSpinner size`)만 남는지 확인. `spec-docs/upstream/upstream-adapted-divergences.md` "코드 블록 구문 강조 처리" 절 "버린 것" 표의 항목이 모두 돌아왔는지 대조. 결과를 `evidence/toggle-apply.md`에 기록
- [X] T023 파일 미리보기 모달 병합 — `file_preview_modal/file_preview_modal.tsx`(2구간)·`.test.tsx`(1구간). 포크 이미지 확대·축소·끌기·휠·키보드·바깥 클릭 닫기 코드(136b14d77b, 86e424498e, 36df58b028)를 그대로 두고 upstream의 전환 버튼·같은 파일 재표시 시 내용 유지를 얹는다. 포크 테스트와 upstream 테스트를 둘 다 남긴다
- [X] T024 문맥 혼입 점검 — 자동 병합 파일(`post_markdown.tsx`, `_modal.scss`, `_modifiers.scss`, `_markdown.scss`, `utils/constants.tsx`, `en.json` 등)의 numstat을 `git show --numstat 36ebc1f6fc`와 비교. `post_markdown.tsx`의 `channelKind` 등 제외 계보 문맥을 걷어 낸다. 결과를 `evidence/toggle-apply.md`에 추가
- [X] T025 [P] 번역 — `webapp/channels/src/i18n/ko.json`에 `markdown_view_toggle.group` "Markdown 보기", `markdown_view_toggle.rendered` "미리보기", `markdown_view_toggle.raw` "코드" 추가. `generic.previous`("이전")는 이미 있다

**Checkpoint**: `check-types`가 기준선 대비 새 실패 없이 통과한다.

---

## Phase 5: User Story 2 — Markdown 코드 블록을 미리보기로 본다 (P2)

**Goal**: FR-010·FR-012~FR-014·FR-016.

**Independent Test**: [quickstart.md](quickstart.md) 시나리오 5.

- [X] T026 [US2] upstream 테스트 확인 — `src/components/code_block`, `src/components/markdown_view_toggle`, `src/utils/is_likely_markdown.test.ts`, `src/utils/turndown.test.ts`, `src/components/wrapped_code_lines.test.tsx`, `src/stores/local_storage_store.test.ts` 실행. 되살린 `ToggleableCodeBlock`·`markdown code blocks` describe 포함(검색 결과 렌더링 금지 테스트 이름을 증거에 남긴다). 출력을 `evidence/us2.md`에 기록(SC-003·SC-004). 원칙 III: 대상 구현(`code_block.tsx` 토글 분기, `utils/is_likely_markdown.ts`, `wrapped_code_lines.tsx`, `local_storage_store.ts`의 보기 메서드)을 임시로 되돌려 실패 출력을 남기거나 `미검증`과 사유
- [X] T027 [US2] 실주행 — 시나리오 5(SC-006), 그리고 미리보기 코드 블록 일부 인용(US2 수용 시나리오 7). 결과를 `evidence/us2.md`에 기록

---

## Phase 6: User Story 3 — .md 파일을 미리보기 모달에서 렌더링해 본다 (P2)

**Goal**: FR-011·FR-012·FR-015.

**Independent Test**: [quickstart.md](quickstart.md) 시나리오 6.

- [X] T028 [US3] upstream 테스트 확인 — `src/components/code_preview.test.tsx`(되살린 `markdown files` describe 8건 포함), `src/components/file_preview_modal/file_preview_modal.test.tsx` 실행. 출력을 `evidence/us3.md`에 기록(SC-004). 원칙 III: `code_preview.tsx`의 Markdown 분기(`isMarkdownFile`·`canToggleMarkdownPreview`)와 `file_preview_modal.tsx`의 전환 버튼 배선을 임시로 되돌려 실패 출력을 남기거나 `미검증`과 사유
- [X] T029 [US3] 실주행 — 시나리오 6(SC-006). 모바일 폭에서 .md가 원문으로 보이는지 포함. 결과를 `evidence/us3.md`에 기록

---

## Phase 7: User Story 4 — 파일 미리보기 헤더와 코드 복사 버튼 새 디자인 (P3)

**Goal**: FR-018~FR-020.

**Independent Test**: [quickstart.md](quickstart.md) 시나리오 7.

- [X] T030 [US4] 스냅샷 재생성 — `src/components/file_preview_modal/file_preview_modal_header`, `file_preview_modal_main_nav`를 `-u`로 갱신. upstream 스냅샷(`git show 36ebc1f6fc:<경로>.snap`)과 diff해 바뀐 줄이 버튼 클래스·구조(compass-ui 해시 클래스 → `compass-shim-*`)뿐인지 확인. 원형에서 바꾼 사유를 이 과제 옆에 적고 diff 요약을 `evidence/us4.md`에 기록 — **바꾼 사유**: upstream 스냅샷에 compass-ui 해시 클래스·`Icon` DOM이 박혀 있어 재생성했다. 차이는 버튼 클래스·아이콘 감싸기뿐([evidence/us4.md](evidence/us4.md))
- [X] T031 [US4] 버튼 테스트 확인 — `file_preview_modal_main_actions.test.tsx`, `copy_button` 관련 테스트 실행. 출력을 `evidence/us4.md`에 기록. 원칙 III: 대상 구현(main_actions·copy_button의 IconButton 교체)을 임시로 되돌려 실패 출력을 남기거나 `미검증`과 사유 — **미검증(단위)**: 닫기 버튼 `onClick`(M15)·다운로드 `asChild`(M14)는 upstream 단위 테스트가 잡지 못한다. upstream 배선 그대로라 테스트를 새로 쓰지 않고 T032 실주행으로 확인했다(둘 다 PASS)
- [X] T032 [US4] 실주행 — 시나리오 7(이미지 조작 회귀, 이전 화살표 툴팁 "이전", 라이트·다크 테마). 결과와 스크린샷 경로를 `evidence/us4.md`에 기록 — 키보드 확대·확대 후 끌기 FAIL은 master 번들에서도 같아 회귀가 아니다([evidence/us4.md](evidence/us4.md))
- [X] T033 커밋 — `feat(webapp): Markdown 미리보기·코드 전환`. 본문에 compass_shim 교체, 06ab8d2c 때 뺀 코드 복원, 버린 mdx 2개, 스냅샷 재생성 요지와 `Upstream: https://github.com/mattermost/mattermost/commit/36ebc1f6fc024e0c15d24e5dd925f7daf2ce88ad` 기재

---

## Phase 8: Polish — 게이트·기록·마감

- [X] T034 게이트 재실행과 기준선 diff — T001과 같은 명령에 새 테스트 경로를 더해 돌린다: `src/components/quote_selection_button`, `src/components/markdown_view_toggle`, `src/components/compass_shim`, `src/components/wrapped_code_lines.test.tsx`, `src/utils/quote.test.ts`, `src/utils/is_likely_markdown.test.ts`, `src/utils/turndown.test.ts`(`lexical_editor`는 T001 범위에 이미 있다). 기준선 경로는 실패 목록을 기준선과 비교해 새 실패 0건, 새 경로는 전부 통과를 `evidence/final-gates.md`에 따로 기록(SC-007)
- [X] T035 SC 실측 — SC-001(선택·클릭 수), SC-002(7경우 일치 수), SC-003·SC-004(통과·예외 목록), SC-005·SC-006(실주행 결과), SC-007(회귀 건수)을 `evidence/sc-results.md`에 기록
- [X] T036 [P] ledger 확인 — 구현 커밋 본문의 `Upstream:` 링크가 `upstream-sync.sh`의 처리 완료 패턴에 잡히는지 확인한다(master 병합 뒤 `update`가 미반영 목록에서 자동 차감). "spec 전환 커밋" 부록 줄은 관례대로 남긴다(구현을 마친 029·007 커밋도 부록에 남아 있고, 부록 줄은 처리 완료 표시 역할도 한다). 처음 과제 문구(두 줄 삭제)는 이 관례와 맞지 않아 고쳤다
- [X] T037 [P] divergences 기록 — `spec-docs/upstream/upstream-adapted-divergences.md`에 두 커밋 요약 행과 절을 추가: Lexical 인용 삽입(원문 노드, 포크 QUOTE transformer, Textbox 분기 결정), compass_shim 교체 4파일, 버린 파일(TipTap 2개, wysiwyg Playwright 스펙, mdx 2개, 제외 계보 문맥), 판정에서 뺀 Playwright 스펙과 이유, 원형에서 바꾼 테스트·스냅샷. "코드 블록 구문 강조 처리" 절 "버린 것" 표에 되살렸다고 적는다(메모리: sync 버린 코드 기록)
- [X] T038 커밋 — `docs: 인용·Markdown 전환 반영 기록`(T034~T037 산출물 포함)
- [X] T039 마무리 — superpowers `finishing-a-development-branch`로 PR 여부를 사용자에게 확인. PR은 rebase merge, 본문에 두 Upstream 링크와 `specs/032-quote-selection-markdown-toggle/evidence/sc-results.md` 요약

---

## Dependencies & Execution Order

```text
Phase 1 (T001 → T002)
  └─▶ Phase 3 US1 (T003 → T004 → T005
                   → T006 → T007 → T008 → T009 → T010
                   → T011 → T012 → T013, T014는 아무 때나
                   → T015 → T016 → T017)            🎯 MVP
        └─▶ Phase 4 (T018 → T019 → T020 → T021 → T022·T023·T024 → T025는 T021 이후 아무 때나)
              ├─▶ Phase 5 US2 (T026 → T027)
              ├─▶ Phase 6 US3 (T028 → T029)
              └─▶ Phase 7 US4 (T030 → T031 → T032) → T033
                    └─▶ Phase 8 (T034 → T035, T036·T037 병렬 → T038 → T039)
```

- 36ebc1f6은 caaec8cd를 적용한 뒤의 `turndown.ts` 위에서만 깨끗하다. Phase 4는 T017 뒤에 온다.
- compass_shim(T019)은 T021 전에 있어야 cherry-pick 직후 빌드된다.
- US2~US4는 같은 커밋(T033)에 들어간다. 검증 Phase 5~7은 서로 독립이라 순서를 바꿔도 된다.

## Parallel Execution Examples

- Phase 3: T014(ko.json)는 T006~T013과 파일이 겹치지 않아 아무 때나 한다.
- Phase 4: T018(compass_shim 테스트)은 Phase 3이 끝나기 전에 미리 써 둘 수 있다(새 디렉터리).
- Phase 5~7: T026·T028·T031의 jest 실행은 경로가 달라 동시에 돌릴 수 있다. 단 메모리 부족을 피하려 각각 `--maxWorkers=4` 이하로 한다.
- Phase 8: T036(ledger)과 T037(divergences)은 다른 문서라 동시에 한다.

## Implementation Strategy

1. **MVP 먼저**: Phase 1 → 3(US1)까지가 배포 가능한 최소 단위다. 커밋 T017에서 멈춰도 인용 기능이 동작한다.
2. **증분 전달**: Phase 4 → 5~7은 36ebc1f6 하나다. compass_shim 커밋(T020)을 먼저 두어 cherry-pick 커밋을 upstream 원문에 가깝게 유지한다.
3. **증거 없으면 완료 아님**: RED 출력(T006·T007·T011·T013·T018), upstream 테스트 통과(T005·T026·T028·T031), 기준선 diff(T015·T034), 실주행(T016·T027·T029·T032), SC 실측(T035)이 완료 선언의 조건이다(원칙 I·III).

---

## 완료 검증 결과 (2026-11-09, 브랜치 032-quote-selection-markdown-toggle)

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| 기준선 | `check-types`·`check:eslint`·`check:stylelint`·접촉 영역 jest·`i18n-check-empty`·`i18n-verify-translations` | ts 13, eslint 106, stylelint 68, jest 31/435, ko ICU 36 | [evidence/baseline-webapp.md](evidence/baseline-webapp.md) |
| 최종 게이트 | 같은 명령 + 새 테스트 경로 7개 | 6개 게이트 모두 목록 diff 0. jest 31/605(실패 이름 같음), 새 스위트 전부 통과 | [evidence/final-gates.md](evidence/final-gates.md) |
| TDD RED→GREEN | 새 테스트 | Lexical 인용 16건(14 RED→GREEN), compass_shim 7건(7 RED→GREEN), 입력창 인용 3건(3 RED→GREEN) | [evidence/us1-red.md](evidence/us1-red.md), [evidence/us1-green.md](evidence/us1-green.md), [evidence/shim-red.md](evidence/shim-red.md) |
| upstream 테스트 결함 심기 | 구현 파일에 결함 16개 | 14개를 테스트가 잡음. 못 잡은 2개(M14 다운로드 asChild, M15 닫기 onClick)는 `미검증(단위)`, 실주행으로 확인 | [evidence/us1-apply.md](evidence/us1-apply.md), [evidence/us2.md](evidence/us2.md), [evidence/us3.md](evidence/us3.md), [evidence/us4.md](evidence/us4.md) |
| 종단 US1 | headless Chromium + 로컬 서버, quickstart 1~4·8 | 20/20 통과 | [evidence/us1.md](evidence/us1.md) |
| 종단 US2 | quickstart 5 | 9/9 통과 | [evidence/us2.md](evidence/us2.md) |
| 종단 US3 | quickstart 6 | 11/11 통과. 관찰: 전환 버튼 포커스 상태에서 Escape 두 번 필요 | [evidence/us3.md](evidence/us3.md) |
| 종단 US4 | quickstart 7 (라이트·다크) | 14/18 통과. 키보드 확대·확대 후 끌기 4건 FAIL은 master 번들에서도 같음(회귀 아님) | [evidence/us4.md](evidence/us4.md) |
| 미실행 | — | 글쓰기 권한 없는 채널(라이선스 필요, 보관 채널로 대신), 비활성 DM·삭제된 루트(단위 테스트로 대신), Playwright·Cypress 스펙(포크 testid 격차) | [evidence/us1.md](evidence/us1.md) |
| SC | SC-001~SC-007 실측 | 7개 모두 충족 | [evidence/sc-results.md](evidence/sc-results.md) |
