---

description: "Task list for 공개 채널 멤버십 없는 검색 허용"

---

# Tasks: 공개 채널 멤버십 없는 검색 허용

**Input**: Design documents from `/specs/007-public-channel-search-access/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (모두 존재)

**Tests**: constitution 원칙 III(동작 변경 시 테스트 동반)에 따라 각 사용자 스토리에 테스트 태스크를 포함한다 — upstream cherry-pick 예외가 아닌 spec 경로 신규 개발이므로 TDD를 그대로 적용한다.

**Organization**: 태스크는 spec.md의 사용자 스토리(P1/P2/P3)별로 그룹화되어 독립적으로 구현·검증할 수 있다.

> **2026-08-10 `/speckit-analyze` 반영**: upstream 참조 커밋(`2ada8d76`)은 `interface.go`(4줄)와 `mocks/SearchEngineInterface.go`(50줄)를 한 커밋 안에서 한 번에 바꿨다 — 통짜 커밋이라 mock 재생성 시점 문제가 없었다. 이 tasks.md는 spec-kit 관례대로 User Story별 독립 체크포인트를 두기 위해 같은 인터페이스 변경을 Foundational/US1/US2 세 단계로 나눴고, 그 결과 각 단계가 끝날 때마다 mock을 다시 최신화해야 한다(T015, T025 신규 추가 — upstream에 없던 우리 쪽 태스크 분할이 만든 필요). 또한 upstream 커밋 메시지의 `add tests for compliance mode override and P channel post leakage` 문구에 맞춰 T009/T010에 비공개 채널 비노출 전담 검증을 명시했다(C2). SC-005는 upstream이 별도 성능 벤치마크 없이 고정 처리율 값으로만 안전을 보장한 것과 동일하게 서술을 낮췄다(spec.md 참고, 새 태스크 추가하지 않음).
>
> **2026-08-10 `/speckit-implement` 반영 — "upstream과 최대한 동일하게" 지시에 따른 실제 실행 편차**:
> - test_suite.go(ES/OS 공용 테스트 스위트)에 upstream 신규 테스트 전체(`TestUpdatePostsChannelTypeByChannelId`, `TestBackfillPostsChannelType`, `TestSearchPublicChannelsWithoutMembership`)를 한 번에 작성했더니, `interface.go`에 `UpdatePostsChannelTypeByChannelId`·`BackfillPostsChannelType` 시그니처가 즉시 필요해짐(Go는 패키지 전체를 한 번에 컴파일). 그 결과 T004·T014·T023의 인터페이스 변경을 upstream처럼 한 번에 적용하고 `make mocks`도 **1회만** 실행 — T015·T025는 별도 실행 없이 T008에 흡수됨(구조는 표로 남겨두되 실행은 통합).
> - T011(searchlayer 레벨 재색인 테스트, `layer_test.go`)은 **건너뜀** — upstream이 실제로 추가하지 않은 우리 쪽 자체 안전망이라 "upstream과 최대한 동일하게" 지시에 따라 제외. `channel_layer.go`의 `reindexChannelPosts`는 구현되었고 ES 레벨 테스트(`TestUpdatePostsChannelTypeByChannelId`)로 하위 로직은 커버됨.
> - T020~T022(US2 테스트)는 upstream의 실제 파일명 `server/channels/app/platform/search_backfill_test.go`(신규, mock 기반이라 이 환경에서 실행 가능·`go vet` 통과 확인)로 대체 — "searchengine_test.go"라는 내 초기 추정 파일명은 사용하지 않음. 백필 처리율(초당 10,000) 자체는 코드에 하드코딩되어 있고 별도 값 검증 테스트는 upstream에도 없어 추가하지 않음.
> - T033/T034(컴플라이언스 오버라이드)는 별도 커밋으로 나뉘지 않고, T012/T013 필터 구현 시점에 처음부터 `!ComplianceSettings.Enable` 조건을 포함해 upstream 원본 diff와 동일하게 한 번에 작성됨.
> - upstream диff 재확인 과정에서 애초 tasks.md에 없던 3개 파일이 추가로 필요함을 발견해 함께 반영: `server/public/model/system.go`(`SystemPostChannelTypeBackfillComplete` 상수), `server/channels/store/sqlstore/post_store.go`(`GetPostsBatchForIndexing`에 `Channels.Type AS ChannelType` 컬럼 추가), `webapp/platform/types/src/config.ts`(`ElasticsearchSettings` 타입에 필드 추가).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 사용자 스토리(US1/US2/US3)
- 모든 태스크에 정확한 파일 경로를 포함한다

## Path Conventions

기존 Mattermost 모놀리식 구조를 그대로 사용한다: `server/`(Go), `webapp/`(React + TS). 신규 프로젝트 디렉터리 없음 — plan.md의 Project Structure 참고.

---

## Phase 1: Setup

**Purpose**: 로컬 검증 환경 준비(코드 변경 없음)

- [ ] T001 로컬 개발 환경에 Elasticsearch를 포함해 서버 기동: `cd server && ENABLED_DOCKER_SERVICES="postgres elasticsearch" make start-docker && make run-server` (quickstart.md 사전 준비 확인) — **미실행**: 이 세션 환경에 Docker/Postgres/ES가 연결되어 있지 않음(구현 세션 내내 확인된 환경 제약). 코드는 `go build`/`go vet`으로 컴파일 정합성만 검증했고, 실제 quickstart.md 시나리오는 ES가 연결된 환경에서 별도로 실행 필요(T037 참고).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공유하는 데이터 모델·색인 배관(plumbing). 실제 검색 동작 변경은 아직 없음.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없다.

- [x] T002 [P] `ElasticsearchSettings`에 `EnableSearchPublicChannelsWithoutMembership *bool` 필드 추가, `SetDefaults()`에 기본값 `false` 설정 — server/public/model/config.go
- [x] T003 [P] 색인 매핑에 `channel_type`(keyword) 필드 추가 — server/enterprise/elasticsearch/common/templates.go
- [x] T004 [P] `SearchEngineInterface.IndexPost` 시그니처에 `channelType string` 파라미터 추가 — server/platform/services/searchengine/interface.go (실제로는 T014·T023의 인터페이스 메서드도 이 시점에 upstream과 동일하게 함께 추가됨 — 상단 편차 안내 참고)
- [x] T005 [P] `ElasticsearchInterfaceImpl.IndexPost`가 `channelType`을 받아 색인 문서의 `channel_type`에 기록하도록 수정 — server/enterprise/elasticsearch/elasticsearch/elasticsearch.go (depends on T003, T004). `common.go`(`ESPost`/`ESPostFromPost`)·`public/model/post.go`(`PostForIndexing.ChannelType`)도 함께 수정, 기존 호출부(test_suite.go, aggregation_job_test.go, bulk_client_req_test.go/bulk_test.go) 시그니처 정합 처리.
- [x] T006 [P] `OpensearchInterfaceImpl.IndexPost`가 `channelType`을 받아 색인 문서의 `channel_type`에 기록하도록 수정 — server/enterprise/elasticsearch/opensearch/opensearch.go (depends on T003, T004)
- [x] T007 `indexPost`가 채널 조회 결과의 `channel.Type`을 `IndexPost` 호출에 전달하도록 수정 — server/channels/store/searchlayer/post_layer.go (depends on T005, T006)
- [x] T008 변경된 `SearchEngineInterface`에 맞춰 목 재생성(constitution 원칙 I) — `cd server && make mocks` (depends on T004). **T004+T014+T023의 인터페이스 변경을 한 번에 반영한 뒤 1회만 실행**(T015·T025 통합, 상단 편차 안내 참고). `make mocks`가 무관한 파일(`storetest/mocks/Store.go`, `einterfaces/mocks/OAuthProvider.go`)까지 재정렬해 되돌림(diff 오염 방지).

**Checkpoint**: 설정 필드·색인 스키마·색인 쓰기 경로 준비 완료 — 사용자 스토리 구현 시작 가능.

---

## Phase 3: User Story 1 - 가입하지 않은 공개 채널의 메시지 검색 (Priority: P1) 🎯 MVP

**Goal**: 검색 확장 설정이 켜져 있을 때(관리자 UI는 아직 없어도 설정값을 직접 채워 넣어) 사용자가 속한 팀의 공개 채널 메시지가 멤버가 아니어도 검색 결과에 나타난다. 비공개 채널·타 팀 채널은 절대 노출되지 않으며, 채널 유형이 바뀌면 색인도 즉시 갱신된다.

**Independent Test**: quickstart.md 시나리오 2, 3, 5 — 설정 필드를 직접 켠 상태(관리자 UI 없이도)에서 공개 채널 메시지가 검색되는지, 비공개 채널 메시지는 검색되지 않는지, 채널 유형 전환 후 색인이 갱신되는지 확인.

### Tests for User Story 1 ⚠️

> 아래 테스트를 먼저 작성하고 구현 전에 반드시 실패하는지 확인한다(constitution 원칙 III).

- [x] T009 [P] [US1] `SearchPosts` 채널 접근 필터 테스트 작성 — server/enterprise/elasticsearch/common/test_suite.go(`TestSearchPublicChannelsWithoutMembership`, ES/OS 공용 스위트라 elasticsearch_test.go/opensearch_test.go 양쪽에서 `suite.Run`으로 함께 실행됨). 포함 내용: ① 설정 꺼짐=기존 동작, ② 설정 켜짐=멤버 OR 공개+같은팀 채널 포함(백필 전/후), ③ 팀 범위 제한, ④ 컴플라이언스 오버라이드, ⑤ **`Should not return private channel posts from non-member channels`로 비공개 채널 비노출을 전담 단언**(upstream "P channel post leakage" 테스트 그대로 반영 — spec FR-003/FR-004, C2)
- [x] T010 [P] [US1] 동일 시나리오 OpenSearch 커버 — T009와 같은 공용 스위트 파일이라 별도 파일 작성 없이 `TestOpensearchInterfaceTestSuite`(opensearch_test.go)가 동일 테스트를 실행
- [ ] T011 [P] [US1] ~~채널 유형 변경 시 재색인 테스트~~ — **건너뜀**(상단 편차 안내 참고, upstream에 대응 테스트 없음)

### Implementation for User Story 1

- [x] T012 [US1] `SearchPosts`에 `includePublicChannels` 계산과 Bool/Should 채널 필터 분기 구현 — server/enterprise/elasticsearch/elasticsearch/elasticsearch.go (depends on T009). **컴플라이언스 조건(`&& !ComplianceSettings.Enable`)도 upstream 원본과 동일하게 이 시점에 함께 포함**(T033 참고 — 별도 커밋으로 나누지 않음).
- [x] T013 [P] [US1] 동일 필터 로직 OpenSearch 구현 — server/enterprise/elasticsearch/opensearch/opensearch.go (depends on T010)
- [x] T014 [US1] `UpdatePostsChannelTypeByChannelId`(단일 채널 재색인) 인터페이스·양쪽 구현체 추가 — server/platform/services/searchengine/interface.go, server/enterprise/elasticsearch/elasticsearch/elasticsearch.go, server/enterprise/elasticsearch/opensearch/opensearch.go (depends on T012, T013)
- [x] T015 ~~목 재생성~~ — **T008로 통합**(상단 편차 안내 참고, 별도 실행 없음)
- [x] T016 [US1] `SearchChannelStore.Update`에서 채널 유형 변경 감지 후 `reindexChannelPosts` 호출 — server/channels/store/searchlayer/channel_layer.go (depends on T014)
- [x] T017 [US1] 검색 결과에 비멤버 공개 채널 정보를 함께 로드하도록 검색 액션 수정 — webapp/channels/src/packages/mattermost-redux/src/actions/search.ts (`getMissingChannelsFromPosts`/`getMissingChannelsFromFiles`에서 `getChannel`을 `getChannelAndMyMember`와 분리 호출)
- [x] T018 [P] [US1] `Post` 컴포넌트에서 채널 정보 미로딩 시 방어적으로 렌더링을 건너뛰는 null 가드 추가 — webapp/channels/src/components/post/index.tsx
- [x] T019 [US1] `ent.elasticsearch.update_posts_channel_type.error` 문자열을 en.json+ko.json 동시 추가(constitution 원칙 V) — server/i18n/en.json, server/i18n/ko.json (depends on T014)

**Checkpoint**: User Story 1이 독립적으로 완전히 동작·검증 가능(quickstart.md 시나리오 2, 3, 5).

---

## Phase 4: User Story 2 - 관리자의 기능 켜기/끄기 (Priority: P2)

**Goal**: 관리자가 System Console에서 설정을 켜고 끌 수 있고, 기본값(꺼짐)에서는 기존 동작이 100% 유지되며, 설정을 켜면 기존에 색인된 게시물도 처리율 제한(초당 10,000요청) 백필로 점차 새 검색 범위에 포함된다.

**Independent Test**: quickstart.md 시나리오 1, 2 — 기본값 상태에서 회귀 없음을 확인하고, 관리자 콘솔에서 설정을 켠 뒤 백필이 트리거되는지 확인.

### Tests for User Story 2 ⚠️

- [x] T020 [P] [US2] 백필 오케스트레이션 테스트 — server/channels/app/platform/search_backfill_test.go(신규, upstream 실제 파일명. mock 기반 — 이미 완료된 백필 스킵, 성공 백필, 채널 조회 오류 시 중단, 공개/비공개 분리, 백필 오류 시 완료 플래그 미기록 5개 시나리오). Postgres 없이도 `go vet` 컴파일 검증 완료(패키지 `TestMain`이 DB를 요구해 실제 실행은 이 환경에서 불가 — 상단 편차 안내 참고).
- [ ] T021 [P] [US2] ~~`StartSearchEngine` 트리거 전담 테스트~~ — **작성 안 함**: upstream도 `searchengine.go`의 config listener 트리거 분기 자체를 별도로 유닛테스트하지 않음(T020의 `search_backfill_test.go`가 오케스트레이션 로직만 검증). config.go SetDefaults 기본값 `false`는 코드 확인으로 대체.
- [ ] T022 [P] [US2] ~~처리율 값 전담 테스트~~ — **작성 안 함**: upstream도 처리율(초당 10,000) 자체를 별도로 단위 테스트하지 않고 코드에 고정값으로만 반영. `elasticsearch.go`/`opensearch.go`의 `BackfillPostsChannelType` 구현에 `"10000"`이 하드코딩되어 있음을 코드로 확인.

### Implementation for User Story 2

- [x] T023 [US2] `BackfillPostsChannelType`(throttled UpdateByQuery, 초당 10,000요청 고정) 인터페이스·구현 추가 — server/platform/services/searchengine/interface.go, server/enterprise/elasticsearch/elasticsearch/elasticsearch.go. ES는 `7e0af2de` 정렬값(10,000)을 clarify Q2 결정대로 채택(원본 upstream 커밋은 1,000이었으나 후속 커밋에서 10,000으로 통일됨).
- [x] T024 [P] [US2] 동일 로직 OpenSearch 구현 — server/enterprise/elasticsearch/opensearch/opensearch.go (OS는 원본부터 10,000)
- [x] T025 ~~목 재생성~~ — **T008로 통합**(상단 편차 안내 참고, 별도 실행 없음)
- [x] T026 [US2] `StartSearchEngine`에 백필 트리거 로직 추가 — server/channels/app/platform/searchengine.go + 신규 server/channels/app/platform/search_backfill.go(`backfillPostsChannelType` 오케스트레이션 함수, upstream 실제 파일 분리 구조 반영) + server/public/model/system.go(`SystemPostChannelTypeBackfillComplete` 상수, 애초 tasks.md에 없었으나 upstream diff 확인 중 발견)
- [x] T027 [US2] 관리자 콘솔에 "멤버십 없이 공개 채널 메시지 검색 허용" 토글 추가 — webapp/channels/src/components/admin_console/elasticsearch_settings.tsx (depends on T002)
- [x] T028 [P] [US2] 관리자 설정 제목/설명 문자열(`admin.elasticsearch.enableSearchPublicChannelsWithoutMembershipTitle/Description`) en.json+ko.json 동시 추가(constitution 원칙 V) — webapp/channels/src/i18n/en.json, webapp/channels/src/i18n/ko.json (depends on T027)
- [x] T029 [P] [US2] 백필 실패 에러 메시지(`ent.elasticsearch.backfill_posts_channel_type.error`) en.json+ko.json 동시 추가 — server/i18n/en.json, server/i18n/ko.json (depends on T023)
- [x] T030 [P] [US2] 관리자 콘솔 스냅샷 갱신 — webapp/channels/src/components/admin_console/__snapshots__/elasticsearch_settings.test.tsx.snap(실제 경로, `__snapshots__/` 하위) — `npx jest ... -u`로 재생성, 3개 테스트 전부 통과 확인 (depends on T027)

**Checkpoint**: User Story 2가 독립적으로 완전히 동작·검증 가능(quickstart.md 시나리오 1, 2).

---

## Phase 5: User Story 3 - 컴플라이언스 모드에서 자동으로 기존 동작 유지 (Priority: P3)

**Goal**: 컴플라이언스 모드가 켜진 조직에서는 검색 확장 설정이 켜져 있어도 시스템이 자동으로 멤버십 기반 검색으로 되돌아간다.

**Independent Test**: quickstart.md 시나리오 4 — 컴플라이언스 모드와 검색 확장 설정을 모두 켠 상태에서 검색 결과가 비어 있는지, 컴플라이언스 모드를 끄면 다시 나타나는지 확인.

### Tests for User Story 3 ⚠️

- [x] T031 [P] [US3] 컴플라이언스 모드가 켜져 있으면 검색 확장 설정이 무시되는지 테스트 — server/enterprise/elasticsearch/common/test_suite.go의 `TestSearchPublicChannelsWithoutMembership` 내 `Should not return public channel posts when compliance mode is enabled` 서브테스트(T009와 같은 파일, 함께 작성됨)
- [x] T032 [P] [US3] 동일 시나리오 OpenSearch 커버 — T031과 같은 공용 스위트 파일이라 opensearch_test.go의 `suite.Run`으로 함께 실행

### Implementation for User Story 3

- [x] T033 [US3] ~~`includePublicChannels` 계산에 컴플라이언스 조건 추가~~ — **T012에 흡수**: upstream 원본처럼 처음부터 `&& !ComplianceSettings.Enable`을 포함해 한 번에 작성(상단 편차 안내 참고, 별도 커밋/단계 없음)
- [x] T034 [P] [US3] ~~동일 조건 OpenSearch 구현~~ — **T013에 흡수** (위와 동일한 이유)

**Checkpoint**: 3개 사용자 스토리 모두 독립적으로 동작·검증 가능. `SearchEngineInterface` 자체는 US3에서 바뀌지 않으므로(기존 메서드 내부 조건만 추가) 추가 mock 재생성 불필요.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 스토리에 걸친 품질 게이트 및 최종 검증

- [x] T035 [P] server 접촉 패키지 품질 게이트 — `make check-style`은 `vet` 단계에서 이번 세션과 무관한 기존 결함(`NotificationHistoryStore`가 `storetest.Store`에 미구현 — 우리 자체 커밋 `d429d6f78 feat: 알림 히스토리 기능 추가 (#167)`이 원인, `channels/jobs/*`·`enterprise/message_export/shared` 등 우리가 건드리지 않은 패키지)로 전체가 중단됨. 대신 `golangci-lint run`을 접촉 패키지에 한정 실행 → 발견된 3건(`post_store.go:777` gofmt, `notification.go:101/155` gofmt·revive) 모두 우리 변경(단 1줄, 2527번째 줄)과 무관한 기존 결함으로 확인(git diff로 직접 대조). `go build ./...`, `go vet ./...`는 별도로 전체 실행해 컴파일 정합성 확인 — 신규 오류 0건.
- [x] T036 [P] webapp 접촉 패키지 품질 게이트 — eslint(변경 파일 4개: elasticsearch_settings.tsx, post/index.tsx, search.ts, config.ts) 전부 클린. `tsc -b`(전체 모노레포)는 15건 오류가 있으나 전부 우리가 건드리지 않은 파일(admin_definition_ldap_wizard.tsx, license_settings.test.tsx, channel_header.test.tsx, emoji_node.test.ts, markdown_paste_plugin.tsx, post_view.test.tsx)에서만 발생 — 기존 결함. `npm run test`는 관련 4개 스위트(user_settings_security, dialog_conversion, search.test.ts, post/index.test.tsx) + admin 콘솔 스냅샷 테스트 전부 통과.
- [ ] T037 quickstart.md 5개 시나리오 전체 수동 검증 실행 및 결과 기록(시나리오 3 비공개 채널 비노출이 최우선) — **미실행**: 이 환경에 라이브 Elasticsearch가 없어 수동 시나리오 검증 불가(T001과 동일한 환경 제약). ES가 연결된 환경에서 별도 실행 필요.
- [x] T038 [P] `cd server && go mod tidy` 클린 상태 확인(constitution 원칙 I) — 실행 후 `go.mod`/`go.sum` 변경 없음 확인.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 막음(BLOCKS)
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능. 다른 스토리에 의존하지 않음.
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능. `includePublicChannels`/필터 골격은 US1(T012, T013)에서 만들어지므로 실질적으로 US1 완료 후 진행 권장(백필이 채우는 대상이 US1의 필터 로직이 참조하는 `channel_type`이기 때문).
- **User Story 3 (Phase 5)**: US1의 `includePublicChannels` 계산(T012, T013)을 확장하므로 US1 완료 후 시작.
- **Polish (Phase 6)**: 구현하기로 한 모든 사용자 스토리 완료 후.

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 이후 독립적으로 시작 가능 — MVP 핵심.
- **User Story 2 (P2)**: 코드상 US1의 필터 골격(T012/T013)에 의존하지만, US1의 나머지 부분(웹앱 표시, 재색인)과는 독립적으로 검증 가능.
- **User Story 3 (P3)**: US1의 필터 계산식을 확장하는 작은 추가 — US1 완료 후 가장 빠르게 붙일 수 있는 스토리.

### `SearchEngineInterface` 변경과 mock 재생성 (analyze 반영)

이 인터페이스는 세 단계에 걸쳐 누적 변경된다 — upstream은 한 커밋으로 끝냈지만, 스토리별 독립 체크포인트를 지키려면 매번 재생성해야 한다.

| 단계 | interface.go 변경 | mock 재생성 태스크 |
|---|---|---|
| Foundational | `IndexPost` 시그니처에 `channelType` 추가 (T004) | T008 |
| US1 | `UpdatePostsChannelTypeByChannelId` 추가 (T014) | T015 |
| US2 | `BackfillPostsChannelType` 추가 (T023) | T025 |
| US3 | 없음(기존 메서드 내부 조건만 확장) | 불필요 |

### Within Each User Story

- 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다(constitution 원칙 III).
- 데이터 모델(Foundational) → 서비스/필터 로직 → UI/i18n 순서.
- 각 스토리는 완료 후 다음 우선순위로 넘어간다.

### Parallel Opportunities

- Foundational 내 T002, T003, T004는 서로 다른 파일이라 병렬 가능. T005/T006도 T003·T004 완료 후 병렬 가능.
- US1의 T009/T010/T011(테스트)은 서로 다른 파일이라 병렬 가능.
- US1의 T012(ES)와 T013(OS)는 각자의 테스트(T009/T010) 완료 후 병렬 가능.
- US2의 T023(ES)/T024(OS), T028/T029/T030(i18n·스냅샷)은 서로 다른 파일이라 병렬 가능.
- US3의 T031/T032(테스트), T033/T034(구현)은 각각 병렬 가능.
- 목 재생성 태스크(T008, T015, T025)는 해당 인터페이스 변경을 완료한 뒤에만 실행 가능 — 병렬 대상 아님.

---

## Parallel Example: User Story 1

```bash
# US1 테스트를 함께 작성:
Task: "SearchPosts 채널 접근 필터(비공개 채널 비노출 포함) 테스트 in server/enterprise/elasticsearch/elasticsearch/elasticsearch_test.go"
Task: "동일 시나리오 OpenSearch 테스트 in server/enterprise/elasticsearch/opensearch/opensearch_test.go"
Task: "채널 유형 변경 시 재색인 테스트 in server/channels/store/searchlayer/layer_test.go"

# 테스트 실패 확인 후 ES/OS 구현을 함께 진행:
Task: "SearchPosts 필터 분기 구현 in server/enterprise/elasticsearch/elasticsearch/elasticsearch.go"
Task: "동일 필터 로직 OpenSearch 구현 in server/enterprise/elasticsearch/opensearch/opensearch.go"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 막음)
3. Phase 3: User Story 1 완료(T015 mock 재생성 포함)
4. **중단하고 검증**: quickstart.md 시나리오 2·3·5로 User Story 1을 독립적으로 테스트
5. 준비되면 배포/데모(설정은 관리자 UI 없이 config API로 직접 켠 상태로 시연)

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비
2. User Story 1 추가 → 독립 검증 → 배포/데모(MVP!)
3. User Story 2 추가(관리자 UI + 백필, mock 재생성 포함) → 독립 검증 → 배포/데모
4. User Story 3 추가(컴플라이언스 오버라이드) → 독립 검증 → 배포/데모
5. 각 스토리는 이전 스토리를 깨지 않고 가치를 더한다

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음
- [Story] 라벨은 태스크를 사용자 스토리에 추적 가능하게 연결한다
- 각 사용자 스토리는 독립적으로 완료·검증 가능해야 한다
- 구현 전 테스트가 실패하는지 반드시 확인한다
- 태스크 단위 또는 논리적 묶음 단위로 커밋한다
- 각 체크포인트에서 멈춰 스토리를 독립적으로 검증할 수 있다
- 피해야 할 것: 모호한 태스크, 같은 파일 충돌, 스토리 독립성을 깨는 교차 의존성
- `SearchEngineInterface`를 추가로 변경하는 태스크를 새로 넣을 때는 반드시 같은 스토리 안에 mock 재생성 태스크를 함께 추가한다(F2 재발 방지)
