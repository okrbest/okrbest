# Implementation Plan: 오프라인 도움말 페이지

**Branch**: `sync/upstream-20260731` (spec은 `specs/006-offline-help-pages`에서 독립 관리) | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-offline-help-pages/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

메시지 작성창(composer) 하단에 도움말 버튼을 추가하고, "메시징 기초"(기본 랜딩
개요) + 서식/명령어/전송/멘션/파일첨부(상세 주제 5개), 총 6개 화면의 정적 안내
페이지를 제공한다. 가능하면 별도 팝업 창으로, 팝업이 차단된 환경에서는 인앱 화면으로
대체 표시한다.

**구현 전략(cherry-pick + adapt)**: upstream 커밋 `37ec26b81a0d13c264ffd6afd6370bc83115307d`
(MM-61383, #34756)의 merge-tree가 CLEAN임을 확인했으므로, 컴포넌트를 spec-kit
태스크로 새로 작성하지 않고 **해당 커밋을 그대로 cherry-pick**한다. 그 위에 도움말
본문의 제품명 전면 OKR.BEST 치환(FR-005), 신규 i18n 문자열 134개의 전체 한국어
번역(FR-006), 이 포크에 없는 기능 언급 제거(FR-007)를 **adapt 후속 커밋**으로
적용한다(spec.md 확정 사항, research.md #2 참조 — `/speckit-analyze`에서 처음
"5개 주제 재구현" 접근이 6번째 화면 `messaging.tsx` 누락을 유발한 것을 확인하고
cherry-pick 기반으로 전환). 서버 변경·DB 마이그레이션 없이 webapp(React+TS)
프론트엔드만으로 구현 가능하다.

## Technical Context

**Language/Version**: TypeScript 5.6 / React (기존 `webapp/channels` 스택 그대로)

**Primary Dependencies**: 기존 webapp 의존성만 사용 — `react-intl`(i18n), `react-router-dom`(라우팅), Redux(팝업/윈도우 상태 관리). 신규 npm 의존성 추가 없음(upstream 원본 커밋도 package.json 변경 없음).

**Storage**: N/A — 도움말 콘텐츠는 정적 React 컴포넌트로 구현하며 서버 API·DB 저장 없음.

**Testing**: Jest + React Testing Library (`TZ=UTC`, en_US 고정) — constitution 원칙 III.

**Target Platform**: 데스크톱 브라우저 우선(웹). 모바일 최적화는 spec.md Assumptions에 따라 범위 밖.

**Project Type**: web-service(프론트엔드 전용 — `webapp/channels` 워크스페이스 내 신규 컴포넌트 추가)

**Performance Goals**: 도움말 버튼 클릭 후 원하는 주제 화면 도달까지 3초 이내(spec SC-001).

**Constraints**: 팝업 차단 시 인앱 화면으로 100% 대체(SC-003), 도움말 화면 전환이 작성 중이던 메시지 내용을 보존해야 함(SC-002), 이 포크에 없는 기능에 대한 언급 0건(SC-004).

**Scale/Scope**: 신규 파일 약 21개(도움말 페이지 6종 — `messaging.tsx` 포함 + 목록/타이틀 훅 + 팝업 컨트롤러 연동 + 작성창 도움말 버튼), 기존 파일 수정 4곳(`footer.tsx`, `components/root/root.tsx`, `popout_controller.tsx`, `popout_windows.ts`), 신규 i18n 문자열 134개(en 원본 cherry-pick + ko 전체 번역).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **원칙 I (패키지별 품질 게이트)**: `webapp/`만 변경 — `npm run check` + `npm run check-types` + `npm run test` 통과 필요. PASS(계획상 충족 가능).
- **원칙 II (npm workspaces 전용)**: 신규 의존성 없음, `package-lock.json` 변경 없음. PASS.
- **원칙 III (동작 변경 시 테스트 동반)**: upstream 원본을 그대로 cherry-pick하는 부분은 `/speckit-sync` 예외(원본 그대로 반영 시 테스트 동반 면제, 대신 접촉 패키지 테스트로 회귀 검증)가 적용된다. 그 위에 올리는 adapt 후속 커밋(리브랜드 치환, ko.json 번역, FR-007 콘텐츠 감사)은 예외 대상이 아니므로 원칙을 그대로 따라 테스트를 동반한다(신규 리브랜드/번역 검증 테스트 포함). PASS(Phase 2 tasks에서 반영 예정).
- **원칙 IV (라이선스·리브랜드 충실성)**: 도움말 본문의 "Mattermost" 언급을 OKR.BEST로 치환(spec FR-005) — Copyright 헤더는 그대로 유지. PASS.
- **원칙 V (i18n 동기화)**: 신규 134개 문자열을 en.json/ko.json 동시 작성(spec FR-006). PASS.
- **원칙 VI (집중 브랜치 + Conventional Commits + PR)**: 이 기능은 upstream cherry-pick 예외가 아닌 신규 spec 구현이므로 `feat:` 접두사의 일반 커밋 규칙을 따른다. PASS(구현 단계에서 준수).
- **원칙 VII (Spec 주도 개발 워크플로)**: 이미 spec→plan 단계를 진행 중 — 파이프라인 정상 적용. PASS.

Gate 위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/006-offline-help-pages/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output — 이 기능은 외부 API 계약이 없어 생략(내부 UI 컴포넌트만)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Option 1: Single project (webapp 프론트엔드 전용 — 이 기능에 해당)
webapp/channels/src/
├── components/
│   ├── advanced_text_editor/
│   │   ├── footer.tsx                      # 기존 파일 수정 — 도움말 버튼 삽입 지점
│   │   ├── footer.test.tsx                 # 신규 — 버튼 렌더링/클릭 테스트
│   │   └── help_button/
│   │       ├── help_button.tsx             # 신규 — 도움말 진입 버튼
│   │       ├── help_button.scss            # 신규
│   │       └── index.ts                    # 신규
│   ├── help/
│   │   ├── help.tsx                        # 신규 — 도움말 라우팅 진입점(기본값 messaging)
│   │   ├── help_links.tsx                  # 신규 — 6개 화면 간 이동 링크
│   │   ├── messaging.tsx                   # 신규 — "메시징 기초" 개요(기본 랜딩)
│   │   ├── formatting.tsx                  # 신규 — 서식 안내
│   │   ├── commands.tsx                    # 신규 — 명령어 안내
│   │   ├── sending.tsx                     # 신규 — 전송 안내
│   │   ├── mentioning.tsx                  # 신규 — 멘션 안내
│   │   ├── attaching.tsx                   # 신규 — 파일첨부 안내
│   │   ├── avatar.svg.tsx                  # 신규 — 안내용 아바타 아이콘
│   │   ├── use_help_page_title.ts          # 신규 — 팝업/탭 제목 설정 훅
│   │   ├── help.scss                       # 신규
│   │   └── index.ts                        # 신규
│   ├── help_popout/
│   │   ├── help_popout.tsx                 # 신규 — 팝업 창 래퍼
│   │   ├── help_popout.scss                # 신규
│   │   └── index.ts                        # 신규
│   ├── popout_controller/
│   │   └── popout_controller.tsx           # 기존 파일 수정 — 도움말 팝업 라우팅 등록
│   └── root/
│       └── root.tsx                        # 기존 파일 수정 — 도움말 인앱 라우트 등록
├── utils/popouts/
│   └── popout_windows.ts                   # 기존 파일 수정 — 팝업 차단 시 인앱 대체 로직 연동
└── i18n/
    ├── en.json                             # 기존 파일 수정 — 신규 134개 키 추가
    └── ko.json                             # 기존 파일 수정 — 위 134개 키 한국어 번역 추가

webapp/channels/src/components/help/*.test.tsx   # 신규 — 각 도움말 페이지 렌더링 테스트
```

**Structure Decision**: 기존 `webapp/channels` 워크스페이스 내에 upstream(MM-61383) 커밋을
cherry-pick하여 그 디렉터리 구조(`components/help/`, `components/help_popout/`,
`components/advanced_text_editor/help_button/`)를 그대로 채택한다. "신규"로 표시된 파일은
cherry-pick으로 생성되는 파일이며, adapt 후속 커밋에서 내용(리브랜드·번역·콘텐츠 감사)만
수정한다. 서버·DB 변경이 없으므로 backend/frontend 분리 구조나 별도 API 계약(`contracts/`)은
필요 없다 — 프론트엔드 단일 프로젝트 구조로 충분하다.

## Complexity Tracking

> Constitution Check에 위반 사항 없음 — 이 섹션은 해당 없음.
