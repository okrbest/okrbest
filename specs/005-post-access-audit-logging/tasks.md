---

description: "Task list template for feature implementation"
---

# Tasks: 채널 비멤버 컨텐츠 접근 감사 로깅

**Input**: Design documents from `/specs/005-post-access-audit-logging/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Upstream 근거**: `b5a816a657d6f33a96d374b04212685e2b0df77d` — mattermost/mattermost #31266
("Add audits for accessing posts without membership"). 각 태스크는 `git show
b5a816a657d6f33a96d374b04212685e2b0df77d -- <경로>`로 해당 파일의 원본 diff를 확인한 뒤,
okrbest 현재 코드에 맞춰 적용/조정한다(research.md §2 — 충돌은 순수 라인 드리프트).

**Tests**: constitution 원칙 III에 따라 이 spec 경로(upstream 대규모 커밋의 spec 전환)는
cherry-pick 테스트 예외 대상이 아니다 — 테스트를 동반한다. 단, Foundational 단계의 시그니처
전환(§Phase 2)은 컴파일 단위 전체가 한 번에 바뀌어야 하므로 부분적 red-green TDD가 불가능하다
— 시그니처 변경과 관련 upstream 테스트 adapt를 함께 수행하고 직후 테스트로 검증한다. 이후
User Story별 "비멤버 접근 감사 플래그 부착" 로직은 스토리 단위로 독립적으로 테스트 가능하다.

**Organization**: Tasks are grouped by user story (spec.md 기준 P1~P5)로 구성되어 있으며, 각
스토리는 독립적으로 구현·검증 가능하다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1~US5)
- Include exact file paths in descriptions

## Path Conventions

이 기능은 기존 okrbest 모노레포의 `server/` 백엔드만 변경한다(`webapp/` 무관). 모든 경로는
저장소 루트 기준이다.

---

## Phase 1: Setup

**Purpose**: 구현 전용 브랜치 준비 및 베이스라인 확인

- [ ] T001 `master`에서 분기한 전용 feature 브랜치 `005-post-access-audit-logging` 생성/전환
      (constitution 원칙 VI — `master` 직접 커밋 금지, 작업당 브랜치 1개)
- [ ] T002 `cd server && go build ./...`로 리팩터 시작 전 현재 컴파일 상태 베이스라인 확인

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 권한 판정 함수의 반환 시그니처를
`(bool)` → `(bool, bool)`(또는 `(*Post, *AppError)` → `(*Post, bool, *AppError)`)로 확장한다
(research.md §1). 이 단계가 끝나야 이후 스토리에서 "비멤버 접근" 여부를 감사 로그에 실을 수
있다.

**⚠️ CRITICAL**: 이 단계를 완료하기 전에는 어떤 User Story 작업도 시작할 수 없다(Go는 정적
타입이라 시그니처가 코드베이스 전체에서 일관되어야 컴파일된다).

- [ ] T003 [P] `server/public/model/audit_events.go`에 upstream이 추가한 감사 이벤트 상수
      전체(게시물·파일·북마크·알림 관련: `AuditEventGetPinnedPosts`,
      `AuditEventListChannelBookmarksForChannel`, `AuditEventGetFileThumbnail`,
      `AuditEventGetFileInfosForPost`, `AuditEventGetFileInfo`, `AuditEventGetFilePreview`,
      `AuditEventSearchFiles`, `AuditEventCreateEphemeralPost`, `AuditEventGetEditHistoryForPost`,
      `AuditEventGetFlaggedPosts`, `AuditEventGetPostsForChannel`,
      `AuditEventGetPostsForChannelAroundLastUnread`, `AuditEventGetPost`,
      `AuditEventGetPostThread`, `AuditEventGetPostsByIds`, `AuditEventGetThreadForUser`,
      `AuditEventNotificationAck`, `AuditEventWebsocketPost` 등) 추가
- [ ] T004 `server/channels/app/authorization.go`의 `SessionHasPermissionToChannel`,
      `HasPermissionToChannel`, `SessionHasPermissionToReadChannel`,
      `HasPermissionToReadChannel`을 `(hasPermission bool, isMember bool)` 반환으로 확장하고,
      신규 `SessionHasPermissionToReadPost` 헬퍼를 추가; `server/channels/app/authorization_test.go`의
      관련 테스트 케이스를 upstream 기준으로 adapt
- [ ] T005 `server/channels/app/post.go`의 `CreatePostAsUser`, `CreatePostMissingChannel`,
      `CreatePost`, `GetPostIfAuthorized`를 `isMember`/`isMemberForPreviews` bool을 포함한
      반환으로 확장; `server/channels/app/post_test.go`의 관련 테스트 케이스를 adapt
- [ ] T006 `server/channels/app/post_metadata.go`의 `SanitizePostMetadataForUser`,
      `SanitizePostListMetadataForUser`를 `isMemberForPreviews bool` 반환 포함으로 확장;
      `server/channels/app/post_metadata_test.go`의 관련 테스트 케이스를 adapt
- [ ] T007 T004~T006에서 바뀐 시그니처를 사용하는 나머지 모든 호출부를 컴파일되도록 조정
      (`server/channels/app/plugin_api.go`, `channel.go`, `user.go`, `webhook.go`, `command.go`,
      `integration_action.go`, `bot.go`, `job.go`, `notify_admin.go`,
      `platform/web_hub.go`, `platform/mocks/SuiteIFace.go`, `slashcommands/*.go`,
      `platform/services/sharedchannel/service.go`, `platform/services/sharedchannel/sync_recv.go`,
      `channels/wsapi/user.go`, `cmd/mmctl/commands/post_e2e_test.go`, 관련 `*_test.go` 헬퍼)
      — 필요 시 `cd server && make mocks`로 mock 재생성
- [ ] T008 `cd server && go build ./... && go vet ./...`로 컴파일 확인 후,
      `go test ./channels/app/... ./channels/api4/...`로 기존 테스트가 아직 무회귀임을 확인

**Checkpoint**: 이 시점부터 각 User Story는 독립적으로 구현·검증 가능하다.

---

## Phase 3: User Story 1 - 비멤버 채널 게시물 열람 감사 (Priority: P1) 🎯 MVP

**Goal**: 게시물 단건 조회 시 채널 비멤버 접근을 감사 로그에 기록한다(spec FR-001).

**Independent Test**: 채널 비멤버 사용자가 `GET /api/v4/posts/{postId}`로 게시물을 조회하면
감사 로그에 `non_channel_member_access: true`가 남고, 멤버가 조회하면 남지 않는다
(quickstart.md 검증 1).

### Implementation for User Story 1

- [ ] T009 [US1] `server/channels/api4/post.go`의 `getPost()`에서 `GetPostIfAuthorized`의
      `isMember` 반환값을 사용해 `non_channel_member_access` 감사 파라미터를 부착
- [ ] T010 [P] [US1] `server/channels/api4/post_test.go`의 `TestGetPost` 관련 케이스를
      upstream 기준으로 adapt(비멤버 접근 시 감사 파라미터 검증 포함)

**Checkpoint**: `cd server && go test ./channels/api4/... -run TestGetPost` 통과 — User Story 1
독립적으로 완결.

---

## Phase 4: User Story 2 - 목록·스레드·검색 등 대량 조회 감사 (Priority: P2)

**Goal**: 채널별 목록, 마지막 읽지 않은 지점, 스레드, ID 일괄 조회, 신고/고정 게시물 목록,
편집 이력, 검색, 읽음 상태·알림 ack 등 게시물을 반환하는 나머지 API 전반에 동일한 감사를
적용한다(spec FR-002).

**Independent Test**: 멤버 채널과 비멤버 채널의 게시물이 섞인 ID 일괄 조회 요청 시 감사 로그에
"비멤버 접근 포함"이 표시된다(quickstart.md 검증 2).

### Implementation for User Story 2

- [ ] T011 [US2] `server/channels/api4/post.go`의 `getPostsForChannel()`,
      `getPostsForChannelAroundLastUnread()`에 `non_channel_member_access` /
      `non_channel_member_access_on_previews` 감사 파라미터 부착
- [ ] T012 [US2] `server/channels/api4/post.go`의 `getPostThread()`, `getPostsByIds()`,
      `getFlaggedPostsForUser()`, `getEditHistoryForPost()`, `setPostUnread()`에 동일한 감사
      파라미터 부착
- [ ] T013 [US2] `server/channels/api4/post.go`의 `searchPosts()` / `searchPostsInTeam()`에
      검색 결과 중 비멤버 채널 게시물 포함 시 감사 파라미터 부착
- [ ] T014 [US2] `server/channels/api4/channel.go`의 `getPinnedPosts()`에 감사 파라미터 부착
- [ ] T015 [US2] `server/channels/api4/user.go`의 `getThreadForUser()`, `getThreadsForUser()`,
      `updateReadStateThreadByUser()`, `setUnreadThreadByPostId()`와
      `server/channels/api4/system.go`의 `pushNotificationAck()`에 감사 파라미터 부착
- [ ] T016 [P] [US2] `server/channels/api4/post_test.go`, `server/channels/api4/user_test.go`의
      관련 테스트 케이스를 upstream 기준으로 adapt

**Checkpoint**: `cd server && go test ./channels/api4/...`(post·user·system 관련 서브셋) 통과 —
User Story 1·2 모두 독립적으로 동작.

---

## Phase 5: User Story 3 - 비멤버 채널 파일 접근 감사 (Priority: P3)

**Goal**: 파일 원본 다운로드, 썸네일, 링크, 미리보기, 정보 조회, 검색에 비멤버 접근 감사를
적용한다(spec FR-003).

**Independent Test**: 비멤버 채널의 파일을 원본/썸네일/미리보기로 조회하면 감사 로그에
"채널 비멤버 접근"이 기록된다(quickstart.md 검증 3).

### Implementation for User Story 3

- [ ] T017 [US3] `server/channels/api4/file.go`의 `getFile()`, `getFileThumbnail()`,
      `getFileLink()`, `getFilePreview()`, `getFileInfo()`, `getPublicFile()`에
      `non_channel_member_access` 감사 파라미터 부착
- [ ] T018 [US3] `server/channels/api4/file.go`의 `searchFiles()`와
      `server/channels/api4/post.go`의 `getFileInfosForPost()`에 동일한 감사 파라미터 부착
- [ ] T019 [P] [US3] `server/channels/api4/file_test.go`의 관련 테스트 케이스를 upstream 기준으로
      adapt

**Checkpoint**: `cd server && go test ./channels/api4/... -run "TestGetFile|TestSearchFiles"`
통과 — User Story 1~3 모두 독립적으로 동작.

---

## Phase 6: User Story 4 - 비멤버 채널 북마크 접근 감사 (Priority: P4)

**Goal**: 채널 북마크 생성·수정·삭제·목록 조회에 비멤버 접근 감사를 적용한다(spec FR-004).

**Independent Test**: 비멤버 채널의 북마크 목록을 조회하거나 수정·삭제하면 감사 로그에
"채널 비멤버 접근"이 기록된다(quickstart.md 검증 4).

### Implementation for User Story 4

- [ ] T020 [US4] `server/channels/api4/channel_bookmark.go`의 `updateChannelBookmark()`,
      `updateChannelBookmarkSortOrder()`, `deleteChannelBookmark()`에
      `non_channel_member_access` 감사 파라미터 부착
- [ ] T021 [US4] `server/channels/api4/channel_bookmark.go`의
      `listChannelBookmarksForChannel()`에 신규 `AuditEventListChannelBookmarksForChannel`
      감사 레코드와 `non_channel_member_access` 파라미터 부착
- [ ] T022 [P] [US4] `server/channels/api4/channel_bookmark_test.go`에 비멤버 접근 감사 케이스
      추가(upstream에 대응 테스트가 없으면 신규 작성 — constitution 원칙 III)

**Checkpoint**: `cd server && go test ./channels/api4/... -run TestChannelBookmark` 통과 —
User Story 1~4 모두 독립적으로 동작.

---

## Phase 7: User Story 5 - 링크 미리보기·웹소켓 퍼머링크 감사 (Priority: P5)

**Goal**: 게시물 생성 시 첨부되는 링크 미리보기, 신고된 게시물 조회, 알림 생성, 웹소켓 퍼머링크
브로드캐스트에서 비멤버 채널 참조를 감사한다(spec FR-005, FR-006).

**Independent Test**: 비멤버 채널의 게시물을 가리키는 퍼머링크를 포함해 게시물을 생성하면
감사 로그에 `preview_post_id`와 함께 "비멤버 채널 미리보기 접근"이 기록된다(quickstart.md
검증 5).

### Implementation for User Story 5

- [ ] T023 [US5] `server/channels/api4/post.go`의 `createPost()`, `createEphemeralPost()`에서
      미리보기 관련 `isMemberForPreviews` 반환값을 사용해 `preview_post_id` +
      `non_channel_member_access` 감사 파라미터 부착
- [ ] T024 [US5] `server/channels/api4/content_flagging.go`의 `getFlaggedPost()`에 동일한
      미리보기 감사 파라미터 부착
- [ ] T025 [US5] `server/channels/app/notification.go`의 `SendNotifications()`,
      `RemoveNotifications()`가 비멤버 채널 게시물을 참조하는 경우를 감사 가능하도록 조정
- [ ] T026 [US5] `server/channels/app/web_broadcast_hooks.go`의
      `permalinkBroadcastHook.Process()`에서 웹소켓 퍼머링크 이벤트의 비멤버 채널 참조를
      `AuditEventWebsocketPost`로 감사
- [ ] T027 [P] [US5] `server/channels/app/notification_test.go`,
      `server/channels/app/plugin_hooks_test.go`, 웹소켓 브로드캐스트 훅 관련 테스트를
      upstream 기준으로 adapt

**Checkpoint**: 전체 User Story(1~5)가 spec.md의 Acceptance Scenario를 모두 만족.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 품질 게이트 통과 및 ledger 반영 마무리

- [ ] T028 [P] `cd server && make check-style` 통과 확인(constitution 원칙 I)
- [ ] T029 `cd server && make test-server`(또는 최소한 `channels/app`, `channels/api4`,
      `channels/wsapi`, `platform/services/sharedchannel` 대상 `go test`) 전체 통과 확인
- [ ] T030 [P] `cd server && make mocks && go mod tidy`로 생성 mock·모듈 상태가 클린한지 확인
- [ ] T031 quickstart.md의 검증 1~5 및 "회귀 확인" 섹션을 수동으로 실행해 결과 기록
- [ ] T032 구현 완료 커밋 생성 — 본문에
      `Upstream: https://github.com/mattermost/mattermost/commit/b5a816a657d6f33a96d374b04212685e2b0df77d`
      포함(constitution 원칙 VI, speckit-sync ledger 자동 차감 조건)
- [ ] T033 `SYNC_BASE_BRANCH=HEAD .specify/scripts/bash/upstream-sync.sh update` 실행해
      `docs/upstream-master-unmerged-commits.md`에서 `b5a816a`가 정상 차감되는지 확인 후 커밋

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 User Story를 BLOCK
- **User Stories (Phase 3~7)**: 모두 Foundational 완료에 의존
  - 우선순위 순(US1 → US2 → US3 → US4 → US5) 순차 진행을 권장하나, 인력이 있다면 병렬 가능
- **Polish (Phase 8)**: 구현하기로 한 모든 User Story 완료에 의존

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 시작 가능, 다른 스토리에 의존하지 않음
- **US2 (P2)**: Foundational 이후 시작 가능, US1과 같은 파일(`post.go`)을 건드리므로 US1과
  순차 진행 권장(파일 충돌 방지)
- **US3 (P3)**: Foundational 이후 시작 가능, `file.go`가 대상이라 US1·US2와 파일이 겹치지
  않아 병렬 가능
- **US4 (P4)**: Foundational 이후 시작 가능, `channel_bookmark.go`가 대상이라 다른 스토리와
  파일이 겹치지 않아 병렬 가능
- **US5 (P5)**: Foundational 이후 시작 가능하나 `post.go`의 `createPost`/`createEphemeralPost`를
  건드리므로 US1·US2와 순차 진행 권장

### Within Each User Story

- 구현 태스크 이후 해당 스토리의 테스트 adapt 태스크(`[P]` 표시) 수행
- 스토리 완료 후 Checkpoint의 `go test` 명령으로 검증한 뒤 다음 스토리로 이동

### Parallel Opportunities

- T003(감사 이벤트 상수)은 T004~T006과 파일이 겹치지 않아 병렬 가능
- Foundational 완료 후: US3(`file.go`)과 US4(`channel_bookmark.go`)는 US1/US2/US5(`post.go`
  계열)와 파일이 겹치지 않으므로 서로 다른 개발자가 병렬 진행 가능
- 각 스토리의 테스트 adapt 태스크(`[P]`)는 해당 스토리의 구현 태스크 완료 후 독립적으로 진행
  가능

---

## Parallel Example: Foundational + User Story 3/4

```bash
# Foundational 단계에서 상수 추가는 시그니처 변경과 병렬 가능:
Task: "server/public/model/audit_events.go에 감사 이벤트 상수 추가 (T003)"

# Foundational 완료 후, 파일이 겹치지 않는 두 스토리를 병렬로 진행:
Task: "US3 — server/channels/api4/file.go 파일 접근 감사 (T017, T018)"
Task: "US4 — server/channels/api4/channel_bookmark.go 북마크 감사 (T020, T021)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 BLOCK)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 검증 1로 User Story 1 단독 검증
5. 필요 시 여기서 1차 PR로 분리 배포(게시물 단건 조회 감사만 우선 반영)도 가능

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비
2. US1 추가 → 독립 검증 → (선택) 배포/PR
3. US2 추가 → 독립 검증 → (선택) 배포/PR
4. US3 추가 → 독립 검증 → (선택) 배포/PR
5. US4 추가 → 독립 검증 → (선택) 배포/PR
6. US5 추가 → 독립 검증 → Polish(Phase 8) → 최종 PR + ledger 차감

각 스토리는 이전 스토리를 깨지 않고 가치를 더한다. 다만 이 spec의 구현 완료 커밋에
`Upstream:` 링크를 남겨 ledger를 정확히 차감하려면(§Phase 8, T032~T033), 최종적으로는
5개 스토리 전체가 완료된 시점에 완료 커밋을 만드는 것을 권장한다(부분 반영 상태에서
`Upstream:` 링크를 넣으면 ledger가 실제보다 앞서 차감된다).

---

## Notes

- `[P]` 태스크 = 다른 파일, 의존성 없음
- `[Story]` 라벨은 태스크를 특정 User Story에 매핑한다(추적성)
- 각 태스크는 upstream 커밋 `b5a816a`의 해당 파일 diff를 `git show
  b5a816a657d6f33a96d374b04212685e2b0df77d -- <경로>`로 확인한 뒤 적용한다
- Foundational 단계(T004~T006)는 시그니처 전환이므로 관련 upstream 테스트를 함께 adapt하고,
  이후 User Story 단계는 "감사 파라미터 부착" 로직 자체를 독립적으로 테스트한다
- 각 태스크 또는 논리적 그룹 완료 후 커밋
- 체크포인트마다 멈춰 해당 스토리를 독립적으로 검증할 것
- 지양할 것: 모호한 태스크, 같은 파일 동시 수정 충돌, 스토리 간 독립성을 깨는 교차 의존
