# Implementation Plan: 메시지 선택 영역 인용과 Markdown 미리보기·코드 전환

**Branch**: `032-quote-selection-markdown-toggle` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: `specs/032-quote-selection-markdown-toggle/spec.md`

## Summary

upstream 두 커밋을 차례로 들인다. caaec8cd(#39237, 메시지 선택 영역 인용)를 먼저, 36ebc1f6(#39378, Markdown 미리보기·코드 전환)을 다음에 cherry-pick한다. 충돌은 포크 코드를 살려 푼다(research R1).

포크에 위치가 없는 두 부분은 같은 역할을 포크 구조에 만든다.
- **Lexical 인용 삽입**: `LexicalTextEditorHandle.appendQuote`를 만든다. 인용 내용은 원문 그대로 내보내는 전용 텍스트 노드에 담는다. 포크 QUOTE transformer는 빈 줄을 `>`로 내보낸다. 그래서 전송 Markdown이 upstream과 같다(R2).
- **compass-ui 대체**: compass-ui와 같은 API의 `components/compass_shim`을 둔다. upstream 파일은 import 경로만 바꾼다(R3).

06ab8d2c 반영 때 뺀 토글 코드와 테스트도 함께 되살린다.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18 (webapp). Node v24.

**Primary Dependencies**: Lexical 0.40.0(`lexical`, `@lexical/markdown`, `@lexical/rich-text`), Redux, react-intl, turndown, highlight.js, `@mattermost/compass-icons`. compass-ui는 쓰지 않는다.

**Storage**: Redux(`views.drafts.pendingQuote`), 브라우저 LocalStorage(보기 선택). 서버·DB 변경 없음.

**Testing**: Jest + React Testing Library(`npm run test`, TZ=UTC). Lexical 직렬화는 headless 에디터 테스트로 본다. 브라우저 실주행(quickstart). Playwright·Cypress는 들이되 판정에 쓰지 않는다(R4).

**Target Platform**: 웹앱(데스크톱 브라우저, 데스크톱 앱 팝아웃 창 포함). 모바일 화면은 upstream 동작(.md는 원문)을 따른다.

**Project Type**: 웹 애플리케이션(모노레포의 `webapp/channels`).

**Performance Goals**: 긴 코드 강조 제한·태스크 분할은 06ab8d2c 동작을 유지한다. 새 목표는 없다.

**Constraints**: upstream 새 파일 본문을 바꾸지 않는다(import 경로 제외). 포크 기능(Lexical 입력, 파일 미리보기 이미지 조작, Slack식 내비게이션 등)을 유지한다. compass-ui 금지.

**Scale/Scope**: upstream 기준 caaec8cd 27파일 +2013, 36ebc1f6 49파일 +2096. 포크 추가분은 Lexical 노드·transformer·`appendQuote`, compass_shim 2파일, 테스트, 문서다.

## Constitution Check

*GATE: Phase 0 전에 확인하고, Phase 1 설계 후 다시 확인했다.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 게이트·기준선 diff | 통과(계획) | quickstart "게이트"에 기준선 저장 명령을 적었다. 마감 때 실패 목록 diff로 판정한다 |
| II. npm workspaces | 해당 없음 | 의존성을 추가하지 않는다. `package-lock.json` 변경 없음 |
| III. 실패를 본 테스트 | 통과(계획) | cherry-pick이지만 adapt를 포함하므로 예외가 아니다. 새 테스트(Lexical 직렬화, `usePendingQuote`의 Lexical 분기, compass_shim)는 구현 전 실패 출력을 남긴다. upstream에서 가져온 테스트도 예외가 아니다. 대상 구현 파일만 되돌려 실패 출력을 남기거나, 그럴 수 없으면 해당 과제 옆에 `미검증`과 사유를 적는다. 원형에서 바꾼 테스트는 사유를 tasks에 적는다 |
| IV. 라이선스·리브랜드 | 통과 | upstream 파일의 Mattermost 저작권 헤더를 유지한다. 새 파일도 같은 헤더를 쓴다. compass-ui(라이선스 없음)를 들이지 않는다 |
| V. i18n 동기화 | 통과(계획) | 포크 기능 개발이므로 sync 예외를 쓰지 않는다. en.json 키 4개와 ko.json 번역을 같은 커밋에 넣는다(R6) |
| VI. 브랜치·Conventional Commits·PR | 통과 | `032-quote-selection-markdown-toggle` 브랜치에서 시작했다. 커밋은 `feat:`·`docs:`. 커밋 본문에 `Upstream:` 링크를 넣는다. rebase merge |
| VII. Spec 주도 | 통과 | brainstorming → specify → clarify → plan 순서. 구현 때 `/speckit-implement` 3-bis에서 TDD·verification 스킬을 불러온다 |
| VIII. 문서 언어·문체 | 통과 | 산출물을 한국어로 썼다 |

위반 없음. Complexity Tracking은 비운다.

## Project Structure

### Documentation (this feature)

```text
specs/032-quote-selection-markdown-toggle/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── lexical-append-quote.md
│   └── compass-shim-icon-button.md
├── checklists/requirements.md
├── evidence/            # 구현 때 만든다 (기준선, 실패 출력, 실주행 결과)
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
webapp/channels/src/
├── actions/views/drafts.ts                         # upstream 그대로 (quoteTextInDraft 등)
├── reducers/views/drafts.ts                        # upstream 그대로 (pendingQuote)
├── selectors/drafts.ts                             # upstream 그대로 (getPendingQuote, canQuoteFromPost)
├── types/store/views.ts                            # PendingQuote만 추가 (ProductRail 문맥 버림)
├── utils/
│   ├── quote.ts                                    # upstream 새 파일
│   ├── turndown.ts                                 # 두 커밋 그대로
│   ├── is_likely_markdown.ts                       # upstream 새 파일
│   ├── syntax_highlighting.tsx                     # 06ab8d2c 반영분 + 36ebc1f6 hunk
│   └── constants.tsx                               # 포크 상수 유지 + upstream 상수 추가
├── stores/local_storage_store.ts                   # upstream 그대로
├── components/
│   ├── quote_selection_button/                     # upstream 새 디렉터리
│   ├── markdown_view_toggle/                       # upstream 새 디렉터리 (import 경로만 compass_shim)
│   ├── compass_shim/                               # 포크 추가: IconButton, Icon
│   ├── advanced_text_editor/
│   │   ├── advanced_text_editor.tsx                # usePendingQuote를 lexicalEditorRef에 연결
│   │   └── use_pending_quote.tsx                   # upstream 새 파일, Lexical ref 사용
│   ├── lexical_editor/
│   │   ├── lexical_text_editor.tsx                 # appendQuote 추가, 새 노드 등록
│   │   ├── nodes/quoted_markdown_text_node.ts      # 포크 추가 (이름은 구현 때 확정)
│   │   └── config/markdown_transformers.ts         # 포크 QUOTE transformer + 원문 text-match transformer
│   ├── channel_layout/channel_controller.tsx       # <QuoteSelectionButton/> 한 줄
│   ├── popout_controller/popout_controller.tsx     # upstream 그대로
│   ├── code_block/code_block.tsx                   # 06ab8d2c 때 뺀 토글 코드 복원
│   ├── code_preview.tsx / .scss                    # 06ab8d2c 때 뺀 Markdown 분기 복원
│   ├── copy_button.tsx                             # compass_shim 사용
│   ├── wrapped_code_lines.tsx                      # upstream 새 파일
│   ├── post_markdown/post_markdown.tsx             # Provider 두 개만 (channelKind 문맥 버림)
│   └── file_preview_modal/                         # 포크 이미지 조작 유지 + 전환 버튼·헤더 버튼
├── sass/                                           # _markdown·_modal·_modifiers·_mixins hunk
└── i18n/en.json, ko.json                           # 키 4개
e2e-tests/playwright/specs/functional/channels/messaging/quote_selection*.ts  # 들이되 판정 제외
e2e-tests/cypress/...                               # 36ebc1f6 변경 그대로
docs/upstream-master-unmerged-commits.md            # 두 커밋 삭제
docs/upstream-adapted-divergences.md                # 갈라진 지점 기록, 06ab8d2c 절 갱신
```

**Structure Decision**: webapp 단일 워크스페이스(`webapp/channels`) 변경이다. 서버·platform 패키지는 건드리지 않는다.

## 커밋 단위 (tasks에서 세분화)

1. `feat(webapp): 메시지 선택 영역 인용 버튼` — caaec8cd cherry-pick, 충돌 해소, TipTap 파일 삭제, Lexical `appendQuote`·노드·transformer, `usePendingQuote` 연결, ko.json 1키. 본문에 `Upstream: caaec8cd 링크`.
2. `feat(webapp): compass-ui 대체 IconButton·Icon` — compass_shim과 테스트. 36ebc1f6보다 먼저 들어가야 cherry-pick 직후 빌드된다.
3. `feat(webapp): Markdown 미리보기·코드 전환` — 36ebc1f6 cherry-pick, import 경로 교체, 06ab8d2c 때 뺀 코드·테스트 복원, file_preview_modal 병합, 스냅샷 재생성, ko.json 3키. 본문에 `Upstream: 36ebc1f6 링크`.
4. `docs: 인용·Markdown 전환 반영 기록` — ledger 삭제, divergences 갱신.

## 위험과 대응

| 위험 | 대응 |
|---|---|
| 자동 병합된 파일에 제외 계보 문맥이 섞인다 | 파일별 numstat을 upstream 커밋과 비교한다(R1) |
| 원문 텍스트 노드가 사용자 편집·붙여넣기와 섞일 때 이스케이프가 어긋난다 | headless 테스트에 "인용 후 인용 안에 글자 추가" 경우를 넣는다 |
| 포크 QUOTE transformer가 사용자가 직접 친 인용의 전송 결과를 바꾼다 | 빈 줄 `> ` → `>`만 바뀐다. 렌더링 결과는 같다. 기존 Lexical 테스트 기준선과 diff로 확인한다 |
| compass_shim 스냅샷이 upstream과 다르다 | 다시 생성하고 diff가 버튼 클래스·구조뿐인지 확인한다(R3) |
| webapp tsc가 기준선보다 늘어난다 | platform/types·client 재빌드부터 확인한다(메모리) |

## Complexity Tracking

위반 없음.
