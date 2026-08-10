# Implementation Plan: 공개 채널 멤버십 없는 검색 허용

**Branch**: `007-public-channel-search-access` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-public-channel-search-access/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

관리자가 켤 수 있는 시스템 전역 설정으로, 켜지면 사용자가 속한 팀 내 공개 채널의 메시지를 그 채널 멤버가 아니어도 검색 결과에서 찾을 수 있게 한다. 비공개 채널·타 팀 채널은 절대 노출되지 않으며, 컴플라이언스 모드가 켜져 있으면 이 기능은 자동으로 무력화된다. Elasticsearch/OpenSearch 색인에 게시물별 채널 유형(`channel_type`) 필드를 추가하고, 기존 색인 데이터는 처리율 제한(초당 10,000요청) 백필로 채운다. upstream 참조 구현(`2ada8d76`, `7e0af2de`)을 그대로 따르며, 새로운 설계 결정을 추가하지 않는다(`/speckit-clarify`에서 확정).

## Technical Context

**Language/Version**: Go 1.24.6(서버), TypeScript 5.6 + React(관리자 콘솔 UI)

**Primary Dependencies**: 기존 `server/enterprise/elasticsearch/{elasticsearch,opensearch,common}` 패키지(ES/OS 클라이언트 래퍼), `server/public/model/config.go`(설정 스키마), `server/channels/app/platform`(검색 엔진 기동/설정 리스너), `server/channels/store/searchlayer`(색인 훅), 관리자 콘솔 기존 Elasticsearch 설정 컴포넌트(`webapp/channels/src/components/admin_console/elasticsearch_settings.tsx`). 신규 외부 의존성 추가 없음.

**Storage**: 신규 DB 스키마 없음. Elasticsearch/OpenSearch 색인에 게시물 문서 필드(`channel_type`) 1개 추가 — 기존 게시물 스토어(Postgres/MySQL)는 변경 없음.

**Testing**: Go `_test.go`(colocated, gotestsum) — 색인 필터·백필·컴플라이언스 오버라이드·채널 유형 변경 시나리오. webapp Jest + React Testing Library — 관리자 콘솔 토글 컴포넌트.

**Target Platform**: 기존 Mattermost 서버(Linux) + 관리자 콘솔 웹 UI. Elasticsearch/OpenSearch가 구성된 엔터프라이즈 환경에서만 동작(FR-009).

**Project Type**: 기존 모놀리식 웹 서비스(server/ + webapp/)에 대한 기능 추가 — 신규 프로젝트/서비스 아님.

**Performance Goals**: 백필 처리율 초당 10,000요청 고정(ES/OS 공통, clarify Q2) — 이 고정값 자체가 검색 엔진 부하 안전장치이며, upstream과 동일하게 별도 성능 벤치마크는 두지 않는다(SC-005).

**Constraints**: 기본값 off로 기존 고객 환경 동작 무변경(FR-001). 컴플라이언스 모드 활성 시 항상 멤버십 기반 검색으로 강제 전환(FR-005). 비공개 채널·비소속 팀 메시지는 어떤 조건에서도 노출 금지(FR-003, FR-004).

**Scale/Scope**: 백필 대상은 조직이 이미 색인해둔 전체 게시물 수(조직마다 상이) — 처리율 제한으로 완료 시점이 가변적임을 전제(Edge Cases 참고).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 게이트 | 판정 |
|---|---|---|
| I. 패키지별 품질 게이트 | `server/` 변경 시 `make check-style`+`make test-server`, `webapp/` 변경 시 `npm run check`+`check-types`+`test` | PASS — tasks 단계에서 접촉 패키지 한정 실행 예정. 신규 mock 필요 시 `make mocks` 재생성 필요(SearchEngineInterface 변경). |
| II. webapp npm workspaces 전용 | 신규 패키지 매니저·경쟁 lockfile 도입 금지 | PASS — 신규 npm 의존성 없음, 기존 admin_console 컴포넌트 재사용. |
| III. 동작 변경 시 테스트 동반 | 동작 변경엔 테스트 필수, 스킵·약화 금지 | PASS — 이 기능은 upstream cherry-pick 예외 대상이 아님(spec 경로로 합류한 신규 개발이므로 예외 미적용, TDD 그대로 적용). |
| IV. 라이선스·리브랜드 충실성 | Copyright 헤더·NOTICE.txt 유지, 라이선스 존 구분 | PASS with note — `server/enterprise/`(제한 라이선스 구역) 기존 파일 수정만 발생, 신규 파일 생성 시 기존 헤더 패턴을 그대로 복제해야 함. |
| V. i18n 동기화 | 신규 사용자 표시 문자열은 en.json+ko.json 동시 갱신 | GATE — 관리자 설정 제목/설명, 백필 실패 에러 메시지 등 신규 문자열 발생 예정. tasks 단계에서 en/ko 동시 커밋 강제. |
| VI. 집중 브랜치+컨벤셔널 커밋+PR | 브랜치 1개, PR 경유, Conventional Commits | PASS — `007-public-channel-search-access` 브랜치, `feat:` 접두사 예정. |
| VII. Spec 주도 개발 워크플로 | constitution→specify→clarify→plan→tasks→(analyze)→implement | PASS — 현재 이 단계(plan)까지 순서대로 진행 중. |

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/007-public-channel-search-access/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

`contracts/`는 생성하지 않는다 — 이 기능은 신규 REST 엔드포인트나 응답 스키마 변경을 도입하지 않는다. 검색 API(`/api/v4/posts/search` 등)는 기존 응답 형태를 그대로 유지한 채 결과 범위만 넓어지고, 관리자 설정은 기존 System Console 설정 PATCH 엔드포인트가 이미 일반적으로 처리하는 새 필드 1개를 추가하는 것뿐이라 별도 계약 문서화 대상이 없다.

### Source Code (repository root)

기존 Mattermost 모놀리식 구조(`server/` + `webapp/`)에 대한 기능 추가이며, 새 프로젝트/디렉터리를 만들지 않는다.

```text
server/
├── public/model/
│   └── config.go                          # ElasticsearchSettings에 EnableSearchPublicChannelsWithoutMembership 필드 추가
├── platform/services/searchengine/
│   └── interface.go                       # SearchEngineInterface: IndexPost 시그니처에 channelType 추가, BackfillPostsChannelType/UpdatePostsChannelTypeByChannelId 추가
├── channels/
│   ├── app/platform/
│   │   └── searchengine.go                # StartSearchEngine 리스너에 백필 오케스트레이션 훅 추가
│   └── store/searchlayer/
│       ├── channel_layer.go               # Update: 채널 유형 변경 감지 → reindexChannelPosts
│       └── post_layer.go                  # indexPost: IndexPost 호출에 channelType 전달
└── enterprise/elasticsearch/              # 제한 라이선스 구역(LICENSE.enterprise) — 기존 파일 수정만, 헤더 유지
    ├── common/
    │   ├── common.go
    │   └── templates.go                   # 색인 매핑에 channel_type 필드 추가
    ├── elasticsearch/
    │   └── elasticsearch.go               # SearchPosts 필터 분기, BackfillPostsChannelType, UpdatePostsChannelTypeByChannelId
    └── opensearch/
        └── opensearch.go                  # 위와 동일 로직의 OpenSearch 백엔드 구현

webapp/channels/src/
├── components/admin_console/
│   └── elasticsearch_settings.tsx         # 신규 토글 UI (제목/설명 i18n 키)
└── i18n/
    ├── en.json                            # 신규 문자열 (관리자 설정, 에러 메시지)
    └── ko.json                            # 동시 갱신 (constitution 원칙 V)
```

**Structure Decision**: 기존 서버/웹앱 모놀리스 구조를 그대로 사용한다. 서버 쪽은 검색 설정 스키마(`config.go`) → 검색 엔진 인터페이스(`searchengine/interface.go`) → 두 백엔드 구현(ES/OS) → 색인 훅(searchlayer) → 기동/설정 리스너(app/platform) 순서로 계층을 관통하는 변경이며, 신규 패키지를 만들지 않고 기존 계층 구조에 끼워 넣는다. 웹앱 쪽은 기존 admin_console 컴포넌트에 토글 하나를 추가하는 최소 변경이다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

해당 없음 — Constitution Check 위반 없음(위 표 참고).

## Post-Design Constitution Re-check

Phase 1 산출물(data-model.md, quickstart.md, Project Structure)을 반영해 Constitution Check를 재검토했다: 새 패키지·신규 외부 의존성·신규 DB 마이그레이션이 설계 단계에서 추가로 발생하지 않았으므로 위 표의 판정은 그대로 유효하다. 유일한 GATE(원칙 V, i18n 동시 갱신)는 tasks.md에서 구체적 태스크로 강제한다.
