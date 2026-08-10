# Implementation Plan: 검색 결과 RHS 팝아웃

**Branch**: `008-search-rhs-popout` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-search-rhs-popout/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

검색 결과·최근 멘션·저장된 메시지·고정된 메시지·채널 파일 RHS를 별도 브라우저(또는 데스크톱 앱) 창으로 팝아웃할 수 있게 한다. 기존 thread popout·plugin RHS popout 인프라(`rhs_popout`, `popout_windows`, `use_browser_popout`, `popout_controller`)를 그대로 재사용하며, `search_results_header.tsx`에 이미 반영되어 있던 `newWindowHandler` prop을 실제로 채워 넣는다. 검색 액션을 `use_search_results_actions` 훅으로 추출해 원래 RHS와 팝아웃 창이 동일 로직을 공유하게 한다. upstream 참조 구현(`2bd143ce`)을 그대로 따르며, 새로운 설계 결정을 추가하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5.6 + React 18(webapp 전용 — 서버 변경 없음)

**Primary Dependencies**: 기존 `components/rhs_popout`, `components/thread_popout`, `components/popout_controller`, `utils/popouts/{popout_windows,use_browser_popout}`(팝아웃 창 인프라), `components/search`, `components/search_results`, `components/search_results_header`(기존 검색 RHS), `actions/views/rhs`(RHS 상태 액션), `react-router-dom`(서브라우팅). 신규 외부 의존성 추가 없음.

**Storage**: N/A — 클라이언트 전용 기능. 서버 API·DB 스키마 변경 없음.

**Testing**: webapp Jest + React Testing Library(`TZ=UTC`, en_US 고정, `npm run test`) — 신규 `rhs_search_popout` 컴포넌트, `use_search_results_actions` 훅, 라우팅 변경(`rhs_popout.tsx`, `popout_controller.tsx`) 단위 테스트. e2e: `e2e-tests/playwright/`에 검색 팝아웃 시나리오 추가(upstream이 `search_popout.spec.ts`를 추가한 것과 동일 범위).

**Target Platform**: 기존 Mattermost 웹앱(브라우저) + 데스크톱 앱(Electron, `desktop-api`를 통한 팝아웃 창 연동). 서버는 변경 없음.

**Project Type**: 기존 모놀리식 웹 서비스(webapp/)에 대한 UI 기능 추가 — 신규 프로젝트/서비스 아님.

**Performance Goals**: 팝아웃 버튼 클릭 후 3초 이내 결과 창 표시(spec SC-001). 별도 성능 벤치마크는 두지 않는다 — 기존 RHS 렌더링 성능과 동일한 컴포넌트를 재사용하므로 추가 성능 리스크 없음.

**Constraints**: 팝아웃은 기존 RHS와 동일한 서버 API·권한 체계를 그대로 사용한다(FR-009) — 검색 접근 범위·권한 로직을 팝아웃 전용으로 재구현하지 않는다. 라우팅 변경(`/_popout/rhs/:team/:identifier` → `/_popout/rhs/:team` + 서브라우트)은 기존 plugin RHS popout(`RhsPluginPopout`)과 하위 호환을 유지해야 한다(FR-009, research 결정 2).

**Scale/Scope**: 27개 파일(신규 7 + 수정 20) 규모의 upstream diff를 참조 구현으로 삼는다(research.md 결정 1~6). webapp 전용, server 변경 없음.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 게이트 | 판정 |
|---|---|---|
| I. 패키지별 품질 게이트 | `webapp/` 변경 시 `npm run check`+`check-types`+`test` | PASS — tasks 단계에서 실행 예정. server 변경 없으므로 server 게이트 해당 없음. |
| II. webapp npm workspaces 전용 | 신규 패키지 매니저·경쟁 lockfile 도입 금지 | PASS — 신규 npm 의존성 없음, 기존 `react-router-dom`·redux 재사용. |
| III. 동작 변경 시 테스트 동반 | 동작 변경엔 테스트 필수, 스킵·약화 금지 | PASS — spec 경로로 합류한 신규 개발이므로 sync cherry-pick 예외 미적용, TDD 그대로 적용(Jest + Playwright). |
| IV. 라이선스·리브랜드 충실성 | Copyright 헤더·NOTICE.txt 유지, 라이선스 존 구분 | PASS — 접촉 파일 전부 `webapp/`(Apache-2.0 존), 제한 라이선스 구역(`server/enterprise/`) 미접촉(research 결정 7). |
| V. i18n 동기화 | 신규 사용자 표시 문자열은 en.json+ko.json 동시 갱신 | GATE — 팝아웃 창 제목 5개 신규 키(`rhs_search_popout.title.*`) 발생 예정(research 결정 6). tasks 단계에서 en/ko 동시 커밋 강제. |
| VI. 집중 브랜치+컨벤셔널 커밋+PR | 브랜치 1개, PR 경유, Conventional Commits | PASS — `008-search-rhs-popout` 브랜치, `feat:` 접두사 예정. |
| VII. Spec 주도 개발 워크플로 | constitution→specify→clarify→plan→tasks→(analyze)→implement | PASS — `/speckit-sync`가 규모 기준(>15 files, >500줄)으로 이 upstream 커밋을 spec 분기로 전환 — 현재 이 단계(plan)까지 순서대로 진행 중. |

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/008-search-rhs-popout/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

`contracts/`는 생성하지 않는다 — 이 기능은 신규 REST 엔드포인트나 서버 응답 스키마 변경을 도입하지 않는다. 검색 API는 기존 동작을 그대로 사용하며, 이 기능이 정의하는 유일한 "계약"은 팝아웃 창 URL의 쿼리 파라미터 구조로, data-model.md에 이미 문서화했다.

### Source Code (repository root)

기존 Mattermost 모놀리식 구조(`webapp/`)에 대한 UI 기능 추가이며, 새 프로젝트/디렉터리를 만들지 않는다. server 변경 없음.

```text
webapp/channels/src/
├── components/
│   ├── common/hooks/
│   │   └── use_search_results_actions.ts        # 신규: search/index.tsx의 검색 액션을 재사용 가능한 훅으로 추출
│   ├── popout_controller/
│   │   └── popout_controller.tsx                # 수정: /_popout/rhs/:team 라우트 패턴 단순화(채널 identifier를 서브라우트로 이동)
│   ├── rhs_popout/
│   │   └── rhs_popout.tsx                       # 수정: /search 서브라우트 추가, channel을 query param으로 파싱
│   ├── rhs_search_popout/                        # 신규 디렉터리
│   │   ├── index.ts
│   │   ├── rhs_search_popout.tsx                # 신규: URL 쿼리 ↔ redux 검색 상태 동기화 wrapper, SearchResults 재사용
│   │   └── title.ts                             # 신규: RHS 모드 → 팝아웃 제목 매핑(data-model.md 참고)
│   ├── search/
│   │   ├── index.tsx                            # 수정: use_search_results_actions 훅 추출에 맞춰 축소
│   │   ├── search.tsx                           # 수정: 상동(현재 574줄 → 대폭 축소 예상)
│   │   └── types.ts                             # 수정: 액션 타입이 훅으로 이동
│   ├── search_results/
│   │   ├── search_results.tsx                   # 수정: newWindowHandler 콜백 구현(popoutRhsSearch 호출), 채널명 클릭 핸들러
│   │   └── types.ts                             # 수정: 신규 props(팝아웃 관련)
│   ├── post/
│   │   ├── index.tsx                            # 수정: isPopoutWindow 기반 canReply 분기(007의 null 가드와 별개 라인)
│   │   └── post_component.tsx                   # 수정: 팝아웃 창에서 댓글 클릭 시 스레드 팝아웃으로 라우팅(FR-008)
│   ├── thread_popout/
│   │   └── thread_popout.tsx                    # 수정: 검색 팝아웃에서 열리는 스레드 팝아웃과의 연동(returnTo 파라미터)
│   └── threading/global_threads/thread_pane/
│       └── thread_pane.tsx                      # 수정: 팝아웃 관련 정리(upstream 리팩터 범위)
├── plugins/
│   └── registry.ts                              # 수정: registerRHSPluginPopoutListener 타입에서 channelName optional화
├── utils/popouts/
│   ├── popout_windows.ts                        # 수정: popoutRhsSearch 함수 추가, popoutRhsPlugin 시그니처 조정
│   └── use_browser_popout.ts                    # 수정: 상동 리팩터 범위
└── i18n/
    ├── en.json                                  # 신규 문자열 5개(rhs_search_popout.title.*)
    └── ko.json                                  # 동시 갱신(constitution 원칙 V)

e2e-tests/playwright/specs/functional/channels/search/
└── search_popout.spec.ts                        # 신규 e2e 시나리오
```

**Structure Decision**: 기존 webapp 컴포넌트 구조를 그대로 사용한다. 핵심은 (1) `rhs_search_popout`이라는 신규 얇은 wrapper 컴포넌트를 추가해 기존 `SearchResults` 프레젠테이션 컴포넌트를 재사용하고, (2) `search/*`에 흩어져 있던 검색 액션을 `use_search_results_actions` 훅으로 추출해 원래 RHS와 팝아웃 창이 공유하며, (3) 기존 팝아웃 라우팅(`popout_controller`, `rhs_popout`)에 서브라우트 하나만 추가하는 것이다. server 변경이 없어 백엔드 계층은 이 구조에 등장하지 않는다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

해당 없음 — Constitution Check 위반 없음(위 표 참고).

## Post-Design Constitution Re-check

Phase 1 산출물(data-model.md, quickstart.md, Project Structure)을 반영해 Constitution Check를 재검토했다: 신규 서버 변경·신규 외부 의존성·신규 DB 마이그레이션이 설계 단계에서 추가로 발생하지 않았으므로 위 표의 판정은 그대로 유효하다. 유일한 GATE(원칙 V, i18n 동시 갱신)는 tasks.md에서 구체적 태스크로 강제한다.
