# Research: 채널별 입장·퇴장 메시지 끄기

**입력**: [spec.md](spec.md), upstream [`5de31f8e`](https://github.com/mattermost/mattermost/commit/5de31f8e868f61636ee9d556176cd6ab5f956f2b)(#37314)
**조사일**: 2026-10-15 (`master` = `9c3cfd1396`)
**방침**: upstream 구조와 코드를 최대한 그대로 받는다. 포크가 직접 고친 코드는 하나씩 대조해 영향이 없게 한다.

## R1. 반영 방식을 어떻게 정하나?

- **Decision**: `git cherry-pick -x --no-commit 5de31f8e`로 upstream 변경 전체를 올린다. 그다음 충돌과 의미 충돌만 손으로 고친다. 새로 짜지 않는다.
- **Rationale**: 사용자 요구가 "최대한 upstream과 비슷하게"다. 같은 diff를 들이면 이후 upstream이 이 코드를 고친 커밋(예: `d4d4e42a`)도 sync에서 그대로 적용된다. 손으로 다시 쓰면 줄 단위로 어긋나 매번 충돌한다.
- **Alternatives considered**:
  - 기능을 포크 방식으로 새로 구현: upstream과 갈라져 이후 sync 비용이 커진다. 기각.
  - 서버만 먼저 받고 웹앱은 나중: 설정 UI 없이 API만 열리게 된다. 한 PR로 받는다.

## R2. 어느 파일에 포크 자체 변경이 겹치나?

upstream이 건드리는 36파일마다 포크 전용 커밋(upstream PR 번호 5자리가 아닌 커밋)을 뽑았다. 겹치는 파일과 판정은 다음과 같다.

| 파일 | 포크 커밋 | 겹침 내용 | 판정 |
|---|---|---|---|
| `server/channels/store/sqlstore/post_store.go` | `1ed781bb96`·`9dd43c541d`(FilterUserIds), `888f6d7837`(#203 recent mentions), `7caba9abe3`(공개 채널 검색), `6eecf5ee32`(LIKE 검색), `78e4bc2935`(lint) | `getRootPosts`·`getParentsPosts` 시그니처, `GetPosts`·`GetPostsSince` 쿼리, `getPostsAround` 조건 구성 | **충돌 8곳 + 의미 충돌 1곳**. R3에서 다룬다 |
| `server/public/model/post.go` | `1ed781bb96`(FilterUserIds), `7caba9abe3`(검색) | `GetPostsOptions`·`GetPostsSinceOptions` 필드 블록 | 충돌 2곳. 두 필드를 함께 둔다 |
| `server/channels/api4/post.go` | FilterUserIds, `5595582533`·`1b158c5a50`(#149·#151 봇 필터), #203, `98cccec2d0`, `78e4bc2935` | `GetPostsEtag(channelId→channel)` 호출 4곳 | 자동 병합. 호출 지점 수가 upstream과 같고(5), 핸들러마다 `channel` 변수가 이미 있다. 봇 필터는 api4에서 조회 뒤 메모리로 거르므로 숨김(app·SQL)과 순서가 겹치지 않는다 |
| `server/channels/app/post.go` | FilterUserIds, #203 | `GetPostsForChannelAroundLastUnread`의 FilterUserIds 인자. upstream 충돌 1곳은 `GetPostsForView` | `GetPostsForView`는 제외 계보(48f2fd08 Integrated Boards)라 버린다. 나머지 `populate…MembershipFilter` 호출은 자동 병합 |
| `server/channels/app/notification.go` | `d429d6f781`(#167 알림 히스토리), `ca787f8461`(#170 멘션 처리) | `SendNotifications` 중간의 멘션 수 증가·히스토리 저장 블록 | 자동 병합. upstream의 숨김 반환은 함수 맨 앞이라 우리 블록보다 먼저 실행된다. 결과는 R5 |
| `server/channels/api4/channel.go` | `a6e6c0bda3`(그룹 메시지 멤버 관리) | 새 라우트 `/members/group`만 추가했고 `patchChannel`은 건드리지 않았다 | upstream 충돌 1곳은 `updatingManagedCategory`(제외 계보) 문맥이다. 그 조건만 빼고 `updatingDisableJoinLeaveMessages`를 넣는다 |
| `server/public/model/channel.go` | 없음(포크 전용 변경 없음) | `ChannelPatch`·`Auditable` 블록의 `ManagedCategoryName`·`DefaultCategoryName` | 충돌 2곳. 두 필드는 제외 계보라 우리 쪽에 없다. `DisableJoinLeaveMessages`만 추가한다. 단 `Channel` 구조체의 `DefaultCategoryName`·`ManagedCategoryName` 필드는 우리에게 있다(자동 병합 구간) |
| `server/channels/store/store.go`, `retrylayer`, `timerlayer`, `storetest/mocks/PostStore.go` | `f35a1449a9`(테마 일괄 적용), #203, #167 | 인터페이스 메서드 목록 | 손으로 고치지 않고 생성기로 다시 만든다(R7) |
| `server/channels/db/migrations/migrations.list` | 포크 마이그레이션 등록 커밋 여럿 | 목록 끝 | 생성기로 다시 만든다(R6) |
| `webapp/channels/src/actions/websocket_actions.ts` | `f35a1449a9`(테마 일괄 적용) | `handleChannelUpdatedEvent` 안 4줄 추가 | 자동 병합. 테마 핸들러와 다른 함수 |
| `webapp/channels/src/i18n/en.json` | 레이아웃·북마크 등 포크 키 다수 | 키 2개 추가 | 자동 병합. `ko.json`에 같은 키 2개를 우리가 직접 넣는다(원칙 V) |
| `webapp/platform/types/src/channels.ts`, `reducers/entities/channels.ts`, `channel_settings_configuration_tab.scss` | `fb225177e6`·`a997ec95cd`(upstream #37078을 포크가 쪼개 반영한 커밋) | `property_values` 타입(제외 계보) 문맥 | `types/channels.ts`는 `disable_join_leave_messages?: boolean`만 넣는다 |

포크 전용 커밋이 **없는** 파일: posts reducer(`reducers/entities/posts.ts`), `channel_settings_modal.tsx`, `channel_settings_configuration_tab.tsx`, `new_post.ts`, `channel_store.go`, `post_membership_messages.go`(신규), 테스트 파일 대부분. 이 파일들은 upstream 그대로 받되, 설정 탭은 R4의 제외 계보만 걷어낸다.

## R3. post_store의 두 필터를 어떻게 합치나?

- **Decision**: 함수 시그니처에 두 인자를 나란히 둔다. 순서는 upstream 인자를 우리 인자 **뒤**에 붙인다. 예: `getRootPosts(channelId, offset, limit, skipFetchThreads, includeDeleted, filterUserIds []string, excludeMembershipSystemPosts bool)`.
  - upstream의 제외 절(`membershipSystemPostsExcludeSQLClause`)은 플레이스홀더가 없는 리터럴(`AND p.Type NOT IN ('system_join_channel', …)`)이다. 그래서 우리 동적 `params` 순서를 건드리지 않고, 우리 `userIdCondition` 옆에 문자열로 이어 붙인다.
  - `GetPostsSince`의 원시 SQL도 같은 방식으로 `userIdFilter` 뒤에 `membershipExcludeClause`를 붙인다.
- **의미 충돌(텍스트 병합은 통과, 컴파일 실패)**: upstream이 `getPostsAround`에서 `conditions := sq.And{…}`를 없애고 `query = query.Where(…)` 체인으로 바꿨다. 우리 FilterUserIds 블록(`conditions = append(conditions, sq.Eq{"p.UserId": …})`, `sq.NotLike{"p.Type": "system_%"}`)은 그대로 남아 `undefined: conditions`가 난다. 이 블록을 `query = query.Where(sq.Eq{"p.UserId": options.FilterUserIds}).Where(sq.NotLike{"p.Type": model.PostSystemMessagePrefix + "%"})`로 옮긴다. upstream과 같은 체인 형태다.
- **결과 의미**: FilterUserIds가 켜지면 우리 필터가 이미 `system_%` 전체를 뺀다. 그래서 숨김 조건과 함께 써도 결과는 "필터 대상 사용자의 일반 글"이다(spec FR-016). 숨김 조건은 이때 중복이지만 무해하다.
- **Alternatives considered**:
  - 두 필터를 하나의 옵션 구조체로 묶기: upstream 시그니처와 갈라진다. 기각.
  - upstream 인자를 앞에 두기: 우리 기존 호출부와 테스트를 모두 고쳐야 한다. 기각.

## R4. 제외 계보 문맥을 어떻게 걷어내나?

| 위치 | upstream 충돌 문맥 | 처리 |
|---|---|---|
| `model/channel.go` `ChannelPatch`·`ChannelPatch.Auditable` | `ManagedCategoryName`·`DefaultCategoryName` | 넣지 않는다. 우리 필드 목록에 `DisableJoinLeaveMessages`만 붙인다 |
| `api4/channel.go` `patchChannel` 조건 | `!updatingManagedCategory` | 빼고 `!updatingDisableJoinLeaveMessages`만 붙인다 |
| `app/post.go` | `GetPostsForView` 함수 전체 | 넣지 않는다(제외 계보 `48f2fd08`) |
| `types/channels.ts` | `property_values` 필드와 주석 | 넣지 않는다(채널 속성, 제외 계보 `75a26632`) |
| `channel_settings_configuration_tab.tsx` 충돌 5곳 | `hasClassificationChanges`·`canManageClassification`·`selectedClassificationId`·`initialClassificationState` | Classification 조건을 모두 빼고 JoinLeave 조건만 남긴다. 토글 렌더 블록(`canManageJoinLeaveMessages && …`)의 구분선 조건 `(canManageSharedChannels \|\| canManageClassification \|\| canManageBanner)`은 `(canManageSharedChannels \|\| canManageBanner)`로 줄인다 |
| e2e `configuration_settings.ts` | 제외 계보 로케이터 문맥 | JoinLeave 로케이터만 넣는다. 스펙 `join_leave_messages.spec.ts`는 받는다(포크 Playwright 실행 격차는 알려진 문제) |

버린 문맥은 sync 관례대로 `docs/upstream-adapted-divergences.md`에 남긴다.

## R5. 알림 히스토리(#167)·멘션 처리(#170)와 어떻게 맞물리나?

- upstream은 `SendNotifications` **맨 앞**에서 `shouldSuppressMembershipSystemPost`가 참이면 `return []string{}, nil`로 끝낸다. 대상은 숨김 채널의 추가형이 **아닌** 멤버십 게시물이다.
- 우리 #167 히스토리 저장과 #170 멘션 수 증가는 함수 중간(멘션 계산 뒤)에 있다. 그래서 숨김 대상은 히스토리·멘션 수 갱신 없이 끝난다. 이 게시물들은 원래 멘션을 만들지 않으므로 잃는 기록은 없다.
- 추가형(`system_add_to_channel` 등)은 반환되지 않는다. upstream은 추가된 사용자를 `mentions.addMention(addedUserId, KeywordMention)`로 넣고, 프로필 캐시가 없으면 저장소에서 읽는다. 그러면 우리 히스토리 분기(`default` → 일반 포스트 → `NotificationHistoryTypeMention`, 수신자 `mentionedUsersList`)가 당사자 1명에게 히스토리를 남긴다. spec Edge Case와 일치한다.
- 푸시: upstream은 숨김 채널의 추가형 게시물에 한해 `ShouldSendPushNotification`을 건너뛰고 푸시를 보낸다. 우리 #170은 이 줄을 고치지 않았다(자동 병합 확인).
- **Decision**: upstream 그대로 받는다. 대신 포크 결합 테스트를 하나 추가한다: "숨김 채널에서 사용자 추가 시 당사자에게 알림 히스토리 1건, 기존 구성원 0건".

## R6. 마이그레이션 번호는?

- 우리 최신은 `000220`(`000216`·`000218`은 비어 있음). upstream은 같은 이름의 `000221_add_disable_join_leave_messages_to_channels`를 갖고 이후 `000234`까지 있다.
- **Decision**: upstream과 같은 `000221`과 같은 파일명을 쓴다. 이후 sync에서 번호가 어긋나지 않는다. 포크 재번호 도구(`.specify/scripts/bash/renumber-migration.sh`)는 쓰지 않는다.
- SQL은 `ADD COLUMN IF NOT EXISTS … boolean NOT NULL DEFAULT false`라 기존 행이 모두 false가 된다(spec FR-001).
- `migrations.list`는 upstream 커밋 내용을 믿지 않고 `make migrations-extract`로 다시 만든다.
- `server/channels/db/migrations/`는 CODEOWNERS 보호 경로다. PR 병합에 `--admin`이 필요하다.

## R7. 생성물은 무엇을 다시 만드나?

- 메모리 기록(`sync-adapt-needs-codegen`)에 따라 커밋 전에 실행한다:
  ```bash
  cd server
  make migrations-extract
  make store-layers
  GOTOOLCHAIN=go1.26.3 make mocks
  git status --porcelain   # 생성물 외 변경이 없어야 한다
  ```
- 대상: `migrations.list`, `retrylayer.go`, `timerlayer.go`, `storetest/mocks/PostStore.go`. 시그니처가 바뀌는 메서드는 `GetPostIdBeforeTime`·`GetPostIdAfterTime`·`GetVisiblePostIdAroundTime` 셋이다.

## R8. 다른 포크 기능에 영향이 없나?

| 포크 기능 | 확인 결과 |
|---|---|
| 봇 필터(#149·#151) | api4에서 조회 뒤 메모리로 거른다. `prev_post_id`/`next_post_id`는 거르기 전 기준으로 계산되므로, 봇 글만 있는 페이지에서도 `oldest`·`recent`가 false다. upstream의 새 reducer는 이 경우 지금처럼 state를 유지한다. **동작 변화 없음** |
| recent mentions(#203) | `SearchRecentMentions`가 이미 `Type NOT LIKE 'system_%'`로 시스템 메시지를 모두 뺀다. **영향 없음** |
| 공개 채널 검색(`7caba9abe3`)·LIKE 검색(`6eecf5ee32`) | upstream은 `SearchPostsForUser` 끝에서 `filterSuppressedMembershipPosts`로 결과를 한 번 더 거른다. 검색 쿼리(store)는 건드리지 않고 app 계층에서 조회 뒤 거르므로, 포크 LIKE 검색·비구성원 공개 채널 검색 결과 위에 그대로 얹힌다. 숨김 채널이 아니면 결과가 같다. **동작 변화 없음(숨김 채널의 멤버십 메시지만 검색에서 빠짐)**. 덧붙여 `6eecf5ee32`가 `quotedStringsRegex`·`wildCardRegex` 선언을 지웠으므로, upstream post_store 충돌 문맥에 보이는 이 선언은 넣지 않는다 |
| 그룹 메시지 멤버 관리(`a6e6c0bda3`) | GM은 숨김 대상이 아니다(`ShouldChannelExcludeMembershipSystemPosts`가 GM·DM에 false). GM 추가 메시지는 그대로 보인다. **영향 없음** |
| 테마 일괄 적용(`f35a1449a9`) | 웹소켓·store 인터페이스에 메서드를 추가했다. 다른 함수라 자동 병합되고, 생성물은 재생성한다. **영향 없음** |
| 읽지 않음 분리 배지(spec 027) | upstream이 `receiveChannelMember`에서 "`last_viewed_at`이 같은데 `mention_count`가 줄면 큰 값을 유지"하도록 바꾼다. 포크 전용 커밋이 없는 파일이지만, 027이 멘션 수를 읽으므로 회귀 테스트 대상에 넣는다 |

## R9. 숨긴 메시지가 읽지 않음 표시에 영향을 주나? (spec Edge Case 확인)

- 채널 메시지 수 집계는 `Post.ExcludesFromChannelMessageCount()`가 `IsJoinLeaveMessage()` 10종을 이미 뺀다. 그래서 10종은 숨겨도 읽지 않음 표시에 영향이 없다.
- 게스트 입장(`system_guest_join_channel`)·게스트 추가(`system_add_guest_to_chan`) 2종은 `IsJoinLeaveMessage()`에 없다. 지금도 메시지 수에 들어간다. 숨김 채널에서는 보이지 않는 글 때문에 채널이 읽지 않음으로 표시될 수 있다.
- **Decision**: upstream과 같게 두고 바꾸지 않는다(FR-017 범위 유지). 알려진 차이로 spec에 적고, 문제가 되면 별도 과제로 연다.

## R10. 증거는 어떻게 남기나? (원칙 I·III)

- 이 작업은 sync의 cherry-pick 예외가 아니라 spec 구현이다. 원칙 III을 그대로 따른다.
- upstream 테스트(약 1,100줄)는 구현과 함께 들어온다. 구현 전 실패를 보이려면 **테스트 파일만 먼저** 적용하고, 컴파일 실패 또는 실패 출력을 남긴 뒤 구현 hunk를 적용한다. 순서는 tasks에서 정한다.
- 포크 결합 테스트(R3의 필터 결합, R5의 알림 히스토리, R8의 봇 필터 페이지)는 우리가 새로 쓰고, 실패를 먼저 본다.
- 기준선: 착수 전에 아래 실패 목록을 저장하고 마감 때 diff한다.
  - `server`: `go test ./channels/app ./channels/api4 ./channels/store/... ./public/model` (메모리에 적힌 기준선 실패: 파일 검색·채널 검색·role 백필 등)
  - `webapp`: check-types 13건, check 105건(2026-10-15 실측)
