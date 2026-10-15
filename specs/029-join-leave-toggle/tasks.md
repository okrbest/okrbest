---
description: "채널별 입장·퇴장 메시지 끄기 — 작업 목록"
---

# Tasks: 채널별 입장·퇴장 메시지 끄기

**Input**: `specs/029-join-leave-toggle/`의 [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/channel-and-posts-api.md), [quickstart.md](quickstart.md)

**Tests**: 포함한다. 원칙 III(실패를 본 테스트만 인정)과 plan의 구현 순서가 테스트 선행을 요구한다. upstream 테스트는 해당 스토리의 구현 전에 들이고 실패 출력을 남긴다. 포크 결합 테스트는 새로 쓴다.

**Organization**: 사용자 스토리별로 묶었다. upstream 커밋 하나를 스토리 단위로 나눠 들인다.

## upstream 변경을 들이는 방법 (모든 과제 공통)

- 기준 커밋: `U=5de31f8e868f61636ee9d556176cd6ab5f956f2b`
- 파일 단위 diff 보기: `git show $U -- <path>`
- **새 파일**은 그대로 꺼낸다: `git checkout $U -- <path>`
- **기존 파일**은 해당 과제가 말하는 hunk만 손으로 옮긴다. 파일 전체를 `git checkout $U -- <path>`로 덮지 않는다. 포크 변경과 우리가 받지 않은 기능의 문맥이 섞여 있다(research R2·R4).
- 과제가 "upstream 그대로"라고 하면 그 파일의 upstream hunk를 모두 옮긴다. ★가 붙은 과제는 research에 적힌 조정을 함께 한다.
- 버린 upstream 문맥은 T053에서 `docs/upstream-adapted-divergences.md`에 모아 기록한다. 버릴 때마다 위치와 이유를 `specs/029-join-leave-toggle/dropped.md`(작업 메모, 커밋하지 않음)에 한 줄씩 적어 둔다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(다른 파일, 미완료 과제에 의존하지 않음)
- **[Story]**: US1~US4 (spec.md 사용자 스토리)

---

## Phase 1: Setup (기준선과 작업 환경)

**Purpose**: 회귀 판정용 기준선을 저장하고 실행 환경을 맞춘다(원칙 I).

- [X] T001 작업 환경을 확인한다: 브랜치 `029-join-leave-toggle`, `source ~/.nvm/nvm.sh && nvm use 24`, 로컬 Postgres 접속(`mostest_password`), `git log -1 upstream-master`에 `5de31f8e`가 포함되는지 `git merge-base --is-ancestor 5de31f8e upstream-master`로 확인
- [X] T002 [P] server 기준선을 저장한다: `cd server && go test ./public/model ./channels/app ./channels/api4 ./channels/store/sqlstore -count=1 2>&1 | grep -E '^(--- FAIL|FAIL|ok)' | sort > specs/029-join-leave-toggle/baseline/server-tests.txt`. 메모리에 적힌 기준선 실패(파일 검색, 채널 검색, role 백필, 북마크 감사)가 여기 나오는지 확인
- [X] T003 [P] webapp 기준선을 저장한다: `cd webapp && NODE_OPTIONS=--max-old-space-size=8192 npm run check-types`의 `error TS` 목록을 `specs/029-join-leave-toggle/baseline/tc.errs`로, `npm run check`의 error 목록(파일+규칙+메시지, 줄 번호 제거)을 `specs/029-join-leave-toggle/baseline/check.errs`로 저장. 2026-10-15 실측은 13건·105건
- [X] T004 [P] webapp jest 기준선을 저장한다: `cd webapp/channels && npm run test -- src/packages/mattermost-redux/src/reducers/entities src/components/channel_settings_modal src/actions/websocket_actions.test.ts --maxWorkers=4`의 실패 이름을 `specs/029-join-leave-toggle/baseline/jest.txt`로

**Checkpoint**: 기준선 파일 4개가 있다. `baseline/`은 커밋하지 않는다(`.git/info/exclude`에 추가).

---

## Phase 2: Foundational (모든 스토리의 토대)

**Purpose**: 채널 필드·마이그레이션·유형 집합·설정 변경 API. 이것이 없으면 어떤 스토리도 동작하지 않는다.

**⚠️ CRITICAL**: 이 단계를 끝내기 전에는 스토리 작업을 시작하지 않는다.

### Foundational 테스트 (먼저 쓰고 실패를 본다)

- [X] T005 [P] `server/public/model/channel_test.go`에 upstream 테스트 4개를 옮긴다: `TestShouldChannelExcludeMembershipSystemPosts`, `TestChannelPatchDisableJoinLeaveMessages`, `TestChannelAuditableIncludesDisableJoinLeaveMessages`, `TestChannelPatchAuditableIncludesDisableJoinLeaveMessages`
- [X] T006 [P] `server/public/model/post_test.go`에 upstream 테스트 `TestMembershipSystemPostTypes`, `TestIsMembershipSystemPost`(그리고 같은 hunk의 add-type 테스트)를 옮긴다
- [X] T007 [P] `server/channels/api4/channel_test.go`에 upstream `TestPatchChannelDisableJoinLeaveMessages`(5개 하위 테스트)를 옮긴다
- [X] T008 T005~T007을 실행해 **실패(컴파일 실패 포함) 출력**을 `specs/029-join-leave-toggle/evidence/T008-red.txt`에 남긴다: `cd server && go test ./public/model -run 'ShouldChannelExclude|ChannelPatchDisable|Auditable.*DisableJoin|MembershipSystemPost' ; go test ./channels/api4 -run TestPatchChannelDisableJoinLeaveMessages`

### Foundational 구현

- [X] T009 ★ `server/public/model/channel.go`: `Channel.DisableJoinLeaveMessages`와 `Auditable()` 키, `ChannelPatch.DisableJoinLeaveMessages`와 `ChannelPatch.Auditable()` 키, `Patch()` 분기, `ShouldChannelExcludeMembershipSystemPosts()`를 옮긴다. `ChannelPatch`와 `ChannelPatch.Auditable()`에 upstream 문맥의 `ManagedCategoryName`·`DefaultCategoryName`을 **넣지 않는다**(research R4). gofmt 정렬은 우리 필드 목록 기준으로 다시 맞춘다
- [X] T010 ★ `server/public/model/post.go`: `slices` import, `JoinLeaveMessagePostTypes()`·`MembershipSystemPostTypes()`·`IsMembershipSystemPost()`·`IsAddMembershipSystemPost()`, `GetPostsOptions`·`GetPostsSinceOptions`의 `ExcludeMembershipSystemPosts bool`을 옮긴다. 두 구조체의 포크 필드 `FilterUserIds []string`은 그대로 두고 그 **아래에** 새 필드를 둔다(research R3)
- [X] T011 [P] 마이그레이션을 들인다: `git checkout $U -- server/channels/db/migrations/postgres/000221_add_disable_join_leave_messages_to_channels.up.sql server/channels/db/migrations/postgres/000221_add_disable_join_leave_messages_to_channels.down.sql`. `migrations.list`는 손대지 않는다(T014에서 생성)
- [X] T012 `server/channels/store/sqlstore/channel_store.go`: `channelSliceColumns`·`channelToSlice`에 `DisableJoinLeaveMessages`, `updateChannelT`의 `UPDATE`에 `DisableJoinLeaveMessages=:DisableJoinLeaveMessages`, `CountPostsAfter`의 하드코딩 목록을 `model.JoinLeaveMessagePostTypes()`로 바꾸는 hunk를 upstream 그대로 옮긴다
- [X] T013 ★ `server/channels/api4/channel.go` `patchChannel`: `updatingDisableJoinLeaveMessages` 변수, 빈 patch 판정 조건, DM·GM 거부(400), 권한 검사 두 곳의 `updatingProperties || updatingDisableJoinLeaveMessages`를 옮긴다. 조건식에서 upstream 문맥의 `!updatingManagedCategory`는 **빼고** 우리 식 `!updatingProperties && !updatingAutoTranslation && patch.BannerInfo == nil && !updatingDiscoverable` 뒤에 `&& !updatingDisableJoinLeaveMessages`만 붙인다
- [X] T014 생성물을 다시 만든다: `cd server && make migrations-extract && make store-layers && GOTOOLCHAIN=go1.26.3 make mocks && git status --porcelain`. `migrations.list` 끝에 000221 두 줄이 붙는지 확인
- [X] T015 [P] `webapp/platform/types/src/channels.ts`의 `Channel`에 `disable_join_leave_messages?: boolean;`만 추가한다. upstream 문맥의 `property_values`와 주석은 넣지 않는다
- [X] T016 T005~T007을 다시 실행해 통과 출력을 `specs/029-join-leave-toggle/evidence/T016-green.txt`에 남긴다. `go build ./...`도 통과해야 한다

**Checkpoint**: 채널에 값을 저장하고 patch로 바꿀 수 있다. 아직 아무것도 숨겨지지 않는다.

---

## Phase 3: User Story 1 — 채널 관리자가 입장·퇴장 메시지를 숨긴다 (Priority: P1) 🎯 MVP

**Goal**: 숨김 채널에서 모든 사용자의 타임라인·단건·스레드·퍼머링크·저장 목록에서 멤버십 메시지 12종이 빠진다. 설정 탭에 토글이 생긴다.

**Independent Test**: quickstart 시나리오 1의 1~4단계. 토글을 끄고 다른 계정으로 채널을 열어 멤버십 메시지가 0건인지 본다.

### US1 테스트 (먼저 쓰고 실패를 본다)

- [X] T017 [P] [US1] `git checkout $U -- server/channels/app/post_membership_messages_test.go`(신규 파일). 이 파일의 `TestMembershipSystemPostNotificationSuppression`은 US3, `TestGetPostsBeforeAfterSuppression`은 US4 몫이라 지금은 실행 대상에서 뺀다
- [X] T018 [P] [US1] `server/channels/store/storetest/post_store.go`: `testPostStoreGetPostsExcludeMembershipSystemPosts` 함수와 `t.Run("GetPostsExcludeMembershipSystemPosts", …)` 등록 줄을 옮긴다. 함수 안 `GetPostsBefore`·`GetPostsAfter` 하위 테스트는 US4에서 통과한다
- [X] T019 [P] [US1] `server/channels/api4/post_test.go`에 `TestGetPostsExcludeMembershipSystemPosts`를 옮긴다
- [X] T020 [P] [US1] `webapp/channels/src/components/channel_settings_modal/channel_settings_modal.test.tsx`의 upstream hunk(+53)를 옮긴다. Classification을 전제한 단언이 있으면 빼고 `dropped.md`에 적는다
- [X] T021 [US1] T017~T020 실패 출력을 `evidence/T021-red.txt`에 남긴다: `go test ./channels/app -run 'TestDisableJoinLeaveMessagesReadSuppression|TestGetPostsSinceSuppression|TestFlaggedPostsSuppression|TestFilterSuppressedMembershipPostsFromSlice|TestGetPostsByIdsSuppression|TestGetPostThreadSuppression'`, `go test ./channels/store/sqlstore -run 'TestPostStore/GetPostsExcludeMembershipSystemPosts'`, `go test ./channels/api4 -run TestGetPostsExcludeMembershipSystemPosts`, jest `channel_settings_modal`

### US1 구현

- [X] T022 [P] [US1] `git checkout $U -- server/channels/app/post_membership_messages.go`(신규, upstream 그대로)
- [X] T023 [US1] ★ `server/channels/store/sqlstore/post_store.go` — 헬퍼와 기본 조회:
  - 파일 위쪽에 `membershipSystemPostTypesSQLList`·`membershipSystemPostsExcludeSQLClause`·`appendMembershipSystemPostsExcludeCondition`을 추가한다. upstream 충돌 문맥의 `quotedStringsRegex`·`wildCardRegex` 선언은 **넣지 않는다**(포크 LIKE 검색 `6eecf5ee32`가 지웠고 쓰는 곳이 없다)
  - `getPostsCollapsedThreads`·`getPostsSinceCollapsedThreads`에 `appendMembershipSystemPostsExcludeCondition(query, "Posts", options.ExcludeMembershipSystemPosts)`
  - `GetPosts`의 `getRootPosts`·`getParentsPosts` 호출: 우리 `options.FilterUserIds` **뒤에** `options.ExcludeMembershipSystemPosts`를 붙인다
  - `getRootPosts(…, filterUserIds []string, excludeMembershipSystemPosts bool)`: 우리 `userIdCondition` 뒤에 `membershipExcludeP`/`membershipExcludePosts` 문자열을 이어 붙인다. `params` 순서는 그대로 둔다
  - `getParentsPosts(…, filterUserIds []string, excludeMembershipSystemPosts bool)`: `deleteAtQueryCondition+userIdQueryCondition` 뒤에 `membershipExcludeQ2`를 붙인다
  - `GetPostsSince` 원시 SQL: cte의 `WHERE`에서 우리 `userIdFilter` 뒤에 `membershipExcludeClause`, `p1` 서브쿼리 끝에 `membershipExcludeP1`
- [X] T024 [US1] ★ `server/channels/store/sqlstore/post_store.go` `getPostsAround` — upstream이 `conditions` 변수를 `query.Where` 체인으로 바꾼다. 그 hunk를 옮기면서 우리 FilterUserIds 블록을 `query = query.Where(sq.Eq{"p.UserId": options.FilterUserIds}).Where(sq.NotLike{"p.Type": model.PostSystemMessagePrefix + "%"})`로 바꾼다(research R3 컴파일 함정). `rootQuery`에도 제외 조건을 붙인다. 바로 `go build ./channels/store/...`로 확인
- [X] T025 [US1] ★ `server/channels/app/post.go` 읽기 경로: `GetPostsPage`·`GetPostsSince`·`GetPostsBeforePost`·`GetPostsAfterPost`·`GetPostsAroundPost`·`GetPostsForChannelAroundLastUnread` 경로의 `populate…MembershipFilter` 호출, `GetSinglePost`·`GetPostThread`·`GetFlaggedPosts*` 3종·`GetPermalinkPost`·`GetPostsByIds`·`SearchPostsForUser` 쪽 `filterSuppressedMembershipPosts*` 호출(검색은 포크 LIKE·공개 채널 검색 결과 뒤에 그대로 붙인다, research R8), 채널 게시물 조회의 options 구성 hunk를 옮긴다. 충돌 문맥의 `GetPostsForView` 함수는 **넣지 않는다**(제외 계보 48f2fd08). `GetPostsForChannelAroundLastUnread`의 포크 인자 `filterUserIds`는 유지
- [X] T026 [US1] `server/channels/app/post.go` `GetPostsEtag(channel *model.Channel, …)`로 시그니처를 바꾸고 끝에 `.%t`(DisableJoinLeaveMessages)를 붙인다. `server/channels/api4/post.go`의 호출 4곳(우리 `getPostsForChannelAroundLastUnread` 포함)을 `channel` 인자로 바꾼다. **테스트 건너뜀(원칙 III 사유 기록)**: upstream에 Etag 테스트가 없다. upstream과 같게 두려고 포크 테스트를 쓰지 않는다. T056 시나리오 2에서 설정 변경 뒤 응답 `ETag` 끝이 `.true`/`.false`로 바뀌는지 실측한다
- [X] T027 [US1] 생성물 재생성: `make store-layers && GOTOOLCHAIN=go1.26.3 make mocks`. `store.go` 인터페이스는 이 단계에서 바뀌지 않았는지 확인(시그니처 변경은 US4)
- [X] T028 [P] [US1] ★ `webapp/channels/src/components/channel_settings_modal/channel_settings_modal.tsx`: `canManageChannelProperties`를 위로 옮기고 `canManageJoinLeaveMessages`, `shouldShowConfigurationTab` 조건, prop 전달을 upstream 그대로 옮긴다
- [X] T029 [US1] ★ `webapp/channels/src/components/channel_settings_modal/channel_settings_configuration_tab.tsx`: `canManageJoinLeaveMessages` prop, `disableJoinLeaveMessages` 상태·변경 감지·저장(`updated.disable_join_leave_messages`)·리셋·토글 렌더(`id='channelJoinLeaveMessagesToggle'`)를 옮긴다. Classification 관련(`hasClassificationChanges`·`canManageClassification`·`selectedClassificationId`·`initialClassificationState`·배너 덮어쓰기 블록)은 모두 빼고, 구분선 조건은 `(canManageSharedChannels || canManageBanner) && canManageJoinLeaveMessages`로 줄인다
- [X] T030 [P] [US1] `webapp/channels/src/components/channel_settings_modal/channel_settings_configuration_tab.scss` hunk(+4/−2)를 옮긴다
- [X] T031 [P] [US1] i18n: `webapp/channels/src/i18n/en.json`에 `channel_settings.join_leave_messages.label.name`·`.label.subtext`를 upstream 문구로, `webapp/channels/src/i18n/ko.json`에 같은 키를 "입장/퇴장 시스템 메시지", "켜면 이 채널의 모든 사용자에게 입장·퇴장 시스템 메시지가 보입니다. 끄면 각자의 고급 설정과 관계없이 숨겨집니다. 다시 켜면 저장된 메시지가 다시 나타납니다."로 넣는다(원칙 V). 키 정렬 위치를 지킨다
- [X] T032 [US1] T017~T020을 다시 실행해 통과 출력을 `evidence/T032-green.txt`에 남긴다(US3·US4 몫 하위 테스트는 제외)

**Checkpoint**: MVP. 토글로 숨기고 다시 켜면 보인다(서버 기준). 실시간 반영·알림·페이지 경계는 아직이다.

---

## Phase 4: User Story 2 — 다시 켜면 숨겼던 메시지가 돌아온다 (Priority: P2)

**Goal**: 해제하면 전체 이력이 보이고, 채널을 열어 둔 다른 사용자 화면이 새로고침 없이 바뀐다.

**Independent Test**: quickstart 시나리오 1의 5단계와 시나리오 2.

### US2 테스트

- [X] T033 [US2] 복원은 upstream 테스트가 맡는다: T017의 `two-way door restores visibility when disabled`, `visible in flagged posts when re-enabled`. US1 구현 전 실패는 T021에서 이미 봤다. 이 두 하위 테스트의 통과 출력을 `evidence/T033-restore.txt`에 남긴다
- [X] T034 [US2] **실시간 반영 테스트 건너뜀(원칙 III 사유 기록)**: upstream에 `handleChannelUpdatedEvent` 테스트가 없다. upstream과 같게 두려고 포크 테스트를 쓰지 않는다. `evidence/T034-skip.txt`에 이 사유와 "T056 시나리오 2로 검증"을 적는다

### US2 구현

- [X] T035 [US2] `webapp/channels/src/actions/websocket_actions.ts` `handleChannelUpdatedEvent`에 upstream 4줄(`existingChannel.disable_join_leave_messages !== channel.disable_join_leave_messages`이면 `doDispatch(resetReloadPostsInChannel(channel.id))`)을 옮긴다. 포크의 테마 일괄 적용 핸들러(`handleThemeAppliedToAllEvent`)는 건드리지 않는다
- [X] T036 [US2] 기존 `webapp/channels/src/actions/websocket_actions.test.ts`를 돌려 기준선(T004) 대비 새 실패가 없는지 확인하고 출력을 `evidence/T036-regress.txt`에 남긴다

**Checkpoint**: 설정을 바꾸면 열린 화면이 다시 불러온다.

---

## Phase 5: User Story 3 — 숨김 채널에서는 입장·퇴장 알림이 울리지 않는다 (Priority: P2)

**Goal**: 추가형이 아닌 멤버십 게시물은 알림을 만들지 않고, 추가형은 당사자에게만 알린다. 포크 알림 히스토리도 같은 규칙을 따른다.

**Independent Test**: quickstart 시나리오 3.

### US3 테스트

- [X] T037 [P] [US3] `server/channels/app/notification_test.go`에 upstream `TestSendNotifications_SuppressedAddToChannel_TargetedWS`를 옮긴다
- [X] T038 [P] [US3] 포크 결합 테스트를 **새 파일** `server/channels/app/notification_history_join_leave_test.go`에 쓴다(upstream `notification_test.go`는 upstream hunk 외에 손대지 않는다 — 이후 sync 충돌 방지): 숨김 채널에서 (a) 사용자가 스스로 입장하면 다른 구성원의 알림 히스토리(`NotificationHistory` 저장소) 0건, (b) 관리자가 사용자 B를 추가하면 B의 히스토리에 `NotificationHistoryTypeMention` 1건·다른 구성원 0건. 기존 포크 테스트 `notification_history_send_test.go`의 헬퍼를 재사용한다
- [X] T039 [US3] T037·T038과 T017의 `TestMembershipSystemPostNotificationSuppression` 실패 출력을 `evidence/T039-red.txt`에 남긴다

### US3 구현

- [X] T040 [US3] `server/channels/app/notification.go` hunk를 upstream 그대로 옮긴다: `SendNotifications` 맨 앞의 숨김 반환, 추가형 푸시 우회(`suppressedAddPost`), 추가형 WS 대상 한정, `publishWebsocketEventForPost` 정리, `getExplicitMentionsAndKeywords`의 추가된 사용자 프로필 로드. 포크 #167 히스토리 블록과 #170 멘션 수 블록은 그대로 둔다(research R5). **프로필 로드 경로(FR-015) 테스트 건너뜀(원칙 III 사유 기록)**: upstream에 이 경로의 테스트가 없다. upstream과 같게 두고 T056 시나리오 3에서 확인한다
- [X] T041 [P] [US3] `webapp/channels/src/packages/mattermost-redux/src/reducers/entities/channels.ts` `receiveChannelMember`의 `mention_count` 보존 분기와 `webapp/channels/src/actions/new_post.ts`의 `collapsedThreadsEnabled`·`isCRTReply` 선언 이동을 upstream 그대로 옮긴다
- [X] T042 [US3] T037~T039를 다시 실행해 통과 출력을 `evidence/T042-green.txt`에 남긴다. spec 027(읽지 않음 분리 배지) 관련 jest도 같이 돌려 기준선 대비 새 실패가 없는지 확인(research R8)

**Checkpoint**: 알림 규칙이 spec FR-013~015와 일치한다.

---

## Phase 6: User Story 4 — 우리 자체 필터와 함께 써도 결과가 맞다 (Priority: P2)

**Goal**: FilterUserIds·봇 필터와 숨김이 함께 맞게 동작하고, 숨긴 메시지 때문에 페이지 이동이 막히거나 되풀이되지 않는다.

**Independent Test**: quickstart 시나리오 4.

### US4 테스트

- [X] T043 [P] [US4] 포크 결합 테스트를 **새 파일** `server/channels/store/sqlstore/post_store_filter_user_ids_membership_test.go`에 쓴다. `StoreTest(t, fn)` 하네스로 등록해 upstream `storetest/post_store.go`는 upstream hunk 외에 손대지 않는다(이후 sync 충돌 방지): 같은 채널에 사용자 A 일반 글·A의 입장 메시지·B 일반 글을 만들고, `FilterUserIds=[A]`+`ExcludeMembershipSystemPosts=true`로 `GetPosts`·`GetPostsBefore`·`GetPostsAfter`·`GetPostsSince`를 부르면 A의 일반 글만 나온다. 각 필터를 하나만 켠 결과가 반영 전과 같다(spec FR-016) — **증거**: 구현 전 패키지 컴파일 실패(`evidence/server-red.txt`), 통과 6건(`evidence/T043-green.txt`), 헬퍼를 무력화한 변형에서 실패(`evidence/T043-mutation-red.txt`). GetPosts 사례는 웹앱이 쓰는 CRT 경로로 검증한다 — CRT 꺼짐 + FilterUserIds 경로에는 포크 기존 버그가 있다(`evidence/fork-bug-getParentsPosts.txt`, 이번 범위 밖)
- [X] T044 [P] [US4] `webapp/channels/src/packages/mattermost-redux/src/reducers/entities/posts.test.ts`에 upstream 테스트 hunk(+130)를 옮긴다. 포크 결합 테스트는 **새 파일** `webapp/channels/src/packages/mattermost-redux/src/reducers/entities/posts_bot_filter_boundary.test.ts`에 쓴다(이후 sync 충돌 방지): `RECEIVED_POSTS_BEFORE`가 빈 `order`로 오고 `oldest=false`(봇 필터로 비었지만 `prev_post_id`가 있는 경우)면 블록에 `oldest` 플래그를 세우지 않는다(research R8) — **증거**: upstream 4건 구현 전 실패(`evidence/web-red.txt`). 포크 가드 3건은 변경 전 통과가 정상이라 upstream 조건을 일부러 깨뜨려 확인: 2건 실패(`evidence/T044-mutation-red.txt`). 세 번째(페이지 단위 빈 응답) 사례는 이 변형으로 동작이 달라지지 않는 경로라 `미검증`
- [X] T045 [US4] T043·T044와 T017의 `TestGetPostsBeforeAfterSuppression`, T018의 Before/After 하위 테스트 실패 출력을 `evidence/T045-red.txt`에 남긴다

### US4 구현

- [X] T046 [US4] `server/channels/store/store.go`에서 `GetPostIdAfterTime`·`GetPostIdBeforeTime`·`GetVisiblePostIdAroundTime`에 `excludeMembershipSystemPosts bool` 인자를 추가하고, `server/channels/store/sqlstore/post_store.go`의 세 함수와 `getPostIdAroundTime` hunk(조건 체인 이관 포함)를 upstream 그대로 옮긴다
- [X] T047 [US4] `server/channels/app/post.go`의 커서 hunk를 upstream 그대로 옮긴다: `GetPostIdAfterTime`이 `channelExcludeMembershipSystemPostsByID`로 `exclude`를 구해 넘기고, 새 app 함수 `GetPostIdBeforeTime`을 추가하고, `getCursorPostId`가 `exclude`를 구해(실패 시 경고 로그) `GetVisiblePostIdAroundTime`·`GetPostIdBeforeTime`·`GetPostIdAfterTime`에 넘긴다. 나머지 호출부(`git grep -n "GetPostIdBeforeTime\|GetPostIdAfterTime\|GetVisiblePostIdAroundTime" server/channels`)도 upstream처럼 인자를 맞춘다. 호출부 수는 upstream 직전과 같다(research: 6·9·3)
- [X] T048 [US4] 생성물 재생성: `make store-layers && GOTOOLCHAIN=go1.26.3 make mocks && git status --porcelain`. retrylayer·timerlayer·`storetest/mocks/PostStore.go`의 세 메서드가 바뀌는지 확인
- [X] T049 [US4] `webapp/channels/src/packages/mattermost-redux/src/reducers/entities/posts.ts`: `postsInChannel`의 세 분기(빈 응답에서 경계 플래그), `markChannelBoundaryReached`, `markExtremeBlockReached`를 upstream 그대로 옮긴다
- [X] T050 [US4] T043~T045를 다시 실행해 통과 출력을 `evidence/T050-green.txt`에 남긴다. 이어서 `post_membership_messages_test.go` 전체와 `TestPostStore/GetPostsExcludeMembershipSystemPosts` 전체를 `-run` 제한 없이 한 번 돌린다

**Checkpoint**: 모든 스토리가 동작한다.

---

## Phase 7: Polish & Cross-Cutting

- [X] T051 [P] e2e를 들인다: `git checkout $U -- e2e-tests/playwright/specs/functional/channels/channel_settings/join_leave_messages.spec.ts`, ★ `e2e-tests/playwright/lib/src/ui/components/channels/channel_settings/configuration_settings.ts`에는 JoinLeave 로케이터만 옮긴다. 포크 Playwright 실행 격차로 스펙이 돌지 않을 수 있다(메모리 `playwright-e2e-fork-gaps`) — 실행하면 결과를, 못 돌리면 `미실행`을 적는다 — **결과**: 두 파일 반영(배너 토큰 헬퍼는 제외 계보라 버림), Playwright 타입 검사 오류 0. 스펙 실행은 `미실행`(포크 Playwright 실행 격차)
- [X] T052 upstream diff와의 차이를 점검한다: `git diff $U -- <upstream 36파일>`을 훑어, 차이가 research R3·R4와 `dropped.md`에 적힌 것뿐인지 확인한다. 설명 못 하는 차이가 있으면 고친다
- [X] T053 [P] `docs/upstream-adapted-divergences.md`에 항목을 추가한다(표 1줄 + 절 1개): 받은 것, `dropped.md`의 버린 것(위치·upstream 코드·이유·되살릴 조건), 포크 조정(FilterUserIds 병합, `getPostsAround` 체인, 포크 테스트 4개), 검증 결과
- [X] T054 [P] `git diff --stat`에서 `webapp/package-lock.json`이 바뀌었으면 peer 키 churn인지 확인하고 버린다(메모리 `package-lock-peer-key-churn`)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [X] T055 품질 게이트 — 접촉 패키지 게이트를 돌리고, 실패 목록이 구현 전 기준선과
      같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다.
      server: `make check-style`(golangci-lint + vet). 메모리 부족으로 lint가 죽으면 `./bin/golangci-lint run -j 1 ./... ./public/...`로 다시 돌려 판정한다. `make test-server` 대신 T002와 같은 접촉 패키지 `go test` 목록 diff를 보이고, PR의 CI server 잡 결과를 함께 확인한다(사유는 plan Complexity Tracking). 생성물 `git status --porcelain` 빈 출력.
      webapp: T003·T004 기준선 대비 check-types·check·jest diff, `npm run i18n-check-empty` orphaned가 기준선(8)과 같음
- [X] T056 종단 검증 — 빌드·배포 후 quickstart.md 시나리오 1~5를 **실제 환경에서** 훑고
      절별 통과·실패를 `evidence/quickstart.md`에 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [X] T057 SC 검증 — spec.md의 SC-001~SC-008 각각을 **실측값**으로 확인한다(추정 금지).
      SC-008은 병합 뒤 `.specify/scripts/bash/upstream-sync.sh update`에서 `5de31f8e`가 목록과 spec 전환 부록에서 차감되는지로 확인한다

### 커밋과 PR

- [X] T058 커밋한다. 제목 `feat: 채널별 입장·퇴장 시스템 메시지 끄기 (upstream MM-68909 반영)`, 본문에 포크 조정 요지 3줄과 `(cherry picked from commit 5de31f8e868f61636ee9d556176cd6ab5f956f2b, adapted for okrbest)`, `Upstream: https://github.com/mattermost/mattermost/commit/5de31f8e868f61636ee9d556176cd6ab5f956f2b`. spec 디렉터리는 별도 `docs:` 커밋으로 나눈다. `baseline/`·`evidence/`·`dropped.md`는 커밋하지 않는다
- [ ] T059 PR을 연다(사용자 확인 후). 마이그레이션이 CODEOWNERS 보호 경로라 병합에 `--admin`이 필요하다는 점을 본문에 적고, 병합 방식은 rebase merge로 한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 바로 시작
- **Foundational (Phase 2)**: Setup 뒤. 모든 스토리를 막는다
- **US1 (Phase 3)**: Foundational 뒤
- **US2 (Phase 4)**: US1 뒤. 숨김 자체가 있어야 복원·실시간 반영을 확인할 수 있다
- **US3 (Phase 5)**: Foundational 뒤. US1과 독립(알림 경로만 건드림). 다만 T017 파일이 US1에서 들어오므로 순서상 US1 다음이 편하다
- **US4 (Phase 6)**: US1 뒤(T023·T024의 post_store 병합 위에 얹는다)
- **Polish (Phase 7)**: 모든 스토리 뒤

### 스토리 안의 순서

- 테스트를 먼저 들이고 실패 출력을 남긴다 → 구현 → 통과 출력
- 생성물 재생성(T014·T027·T048)은 store 인터페이스가 바뀐 직후 한다
- `post_store.go`는 T023 → T024 → T046 순서로만 고친다(같은 파일)

### Parallel Opportunities

- Setup: T002·T003·T004
- Foundational 테스트: T005·T006·T007. 구현: T011·T015는 T009·T010과 병렬
- US1 테스트: T017~T020. 구현: T022·T028·T030·T031
- US3와 US4는 US1 뒤 병렬 가능(다른 파일). 단 둘 다 `make mocks`를 돌리므로 생성 단계는 차례로 한다

---

## Parallel Example: User Story 1

```bash
# US1 테스트를 한꺼번에 들인다
Task: "T017 post_membership_messages_test.go 꺼내기"
Task: "T018 storetest/post_store.go에 GetPostsExcludeMembershipSystemPosts 옮기기"
Task: "T019 api4/post_test.go에 TestGetPostsExcludeMembershipSystemPosts 옮기기"
Task: "T020 channel_settings_modal.test.tsx hunk 옮기기"

# US1 구현 중 서로 다른 파일
Task: "T022 post_membership_messages.go 꺼내기"
Task: "T028 channel_settings_modal.tsx"
Task: "T030 configuration_tab.scss"
Task: "T031 en.json·ko.json 2키"
```

---

## Implementation Strategy

### MVP 먼저 (US1)

1. Phase 1 → Phase 2 → Phase 3
2. **멈추고 검증**: quickstart 시나리오 1(1~4단계)과 T032 통과 출력
3. 이 상태로도 숨김 기능은 쓸 수 있다. 다만 알림(US3)과 페이지 경계(US4)가 없으므로 **PR은 모든 스토리를 마친 뒤 한 번에 연다.** upstream 한 커밋을 반영하는 작업이라 `Upstream:` 참조를 한 커밋에 모은다

### 점진 진행

1. Setup + Foundational → 값 저장·변경 가능
2. US1 → 숨김(MVP)
3. US2 → 복원·실시간 반영
4. US3 → 알림 규칙
5. US4 → 포크 필터 결합·페이지 경계
6. Polish → divergences, 게이트, 종단 검증, PR

---

## Notes

- [P] = 다른 파일, 미완료 과제에 의존하지 않음
- ★ = research R3·R4의 포크 조정이 필요한 과제
- 테스트는 먼저 실패를 본다. 처음부터 통과하면 구현을 되돌려 실패를 확인하거나 과제 옆에 `미검증`을 적는다(원칙 III)
- **upstream 파일에는 upstream hunk만 넣는다.** 포크 테스트는 포크 전용 새 파일에 둔다. 나중 sync에서 upstream이 같은 파일을 고쳐도 충돌하지 않는다
- **테스트 범위는 upstream을 따른다.** upstream이 가진 테스트만 들인다. 포크 테스트는 포크 기능과 겹치는 곳(T038 알림 히스토리, T043 FilterUserIds, T044 봇 필터 빈 페이지)에만 쓴다. upstream에 테스트가 없는 동작(Etag T026, 실시간 반영 T034, 프로필 로드 T040)은 사유를 과제에 적고 quickstart 실주행으로 검증한다
- 예상 밖 실패는 `systematic-debugging`으로 원인부터 찾는다. 테스트를 약화·스킵하지 않는다
- 기준선 실패(메모리: 파일 검색·채널 검색·role 백필·북마크 감사·access_control_editors·channel view actions)는 이름으로 대조해 판정한다


---

## 완료 검증 결과 (2026-10-15)

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| server 게이트 diff | `baseline/server-gate.sh` (model 전체, sqlstore Post·Channel, app·api4 관련 테스트) | 기준선과 **diff 없음**. 실패 2건(`TestChannelStoreCategories`, `TestListChannelBookmarksForChannelAuditsNonMemberAccess`)은 둘 다 기준선 실패 | `baseline/server-tests.txt` ↔ `evidence/server-gate-after.txt` |
| server lint | `make check-style` | vet 통과, golangci-lint `0 issues`, `go fix -diff` 출력 없음 | `evidence/check-style.txt` |
| 생성물 | `make migrations-extract`·`make store-layers`·`GOTOOLCHAIN=go1.26.7 make mocks` | `migrations.list` +2줄(000221), retrylayer·timerlayer·PostStore mock만 변경 | `git diff --cached --stat` |
| webapp check-types | `NODE_OPTIONS=--max-old-space-size=8192 npm run check-types` | 13 = 13, diff 없음 | `baseline/tc.errs` ↔ `evidence/tc.errs` |
| webapp check | `npm run check` | 105 = 105, diff 없음 | `baseline/check.errs` ↔ `evidence/check.errs` |
| webapp jest | reducers/entities·channel_settings_modal·websocket_actions·new_post | 38스위트 948건 통과(기준선 37스위트 938건, 실패 0) | `evidence/web-green.txt` |
| i18n | `npm run i18n-check-empty` | orphaned 8건 = 기준선 8건(같은 키). 새 키 2개는 ko 번역 포함 | `evidence/i18n.log` |
| 종단 검증 | 격리 인스턴스(8066, DB mm_spec029) API·WebSocket 실주행 | API 19/19, WS 4/4 통과. 브라우저 UI 조작·게스트 2종·Playwright는 `미실행` | `evidence/quickstart.md` |

### SC 실측

| SC | 실측값 | 판정 |
|---|---|---|
| SC-001 | 숨김 채널 타임라인(admin·A·B) 멤버십 0종, 단건 404, 스레드 미노출(400), 검색 0건. 저장 목록은 app 테스트 `TestFlaggedPostsSuppression` 통과. 12종 전부는 store 테스트 `all membership post types are excluded` 통과 | 통과 |
| SC-002 | 숨김 전 6건 + 숨김 중 3건 → 복원 후 9건(100%) | 통과 |
| SC-003 | 스스로 입장: 다른 구성원 posted 0·히스토리 0. 추가: C posted 1·히스토리 1, B 0 | 통과 |
| SC-004 | `channel_updated` 1건에 새 값 실림. 화면 재그리기는 브라우저로 확인하지 못함 | 부분(UI `미실행`) |
| SC-005 | 일반1·멤버십60·일반1 채널에서 `before` 요청 1회로 첫 글 도달, 반복 없음 | 통과 |
| SC-006 | FilterUserIds=A → 사용자 1명, 일반 글 1건(기대 1건), 멤버십 0 | 통과 |
| SC-007 | server·webapp 게이트 기준선 diff 0건, 숨김 해제 채널 WS 대조군 정상 | 통과 |
| SC-008 | 병합 뒤 `upstream-sync.sh update`로 확인 | 병합 전 — 미확인 |
