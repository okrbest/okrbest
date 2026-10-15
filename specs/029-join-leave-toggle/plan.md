# Implementation Plan: 채널별 입장·퇴장 메시지 끄기

**Branch**: `029-join-leave-toggle` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Input**: `specs/029-join-leave-toggle/spec.md`, upstream [`5de31f8e`](https://github.com/mattermost/mattermost/commit/5de31f8e868f61636ee9d556176cd6ab5f956f2b)(MM-68909, #37314)

## Summary

채널 관리자가 채널마다 입장·퇴장 시스템 메시지(멤버십 메시지 12종)를 숨길 수 있게 한다. 메시지는 계속 저장하고, 보이는 조회 경로에서만 거른다.

**방침은 "upstream을 그대로 들이고, 포크가 겹치는 곳만 손댄다"이다.**
`git cherry-pick -x --no-commit 5de31f8e`로 upstream 36파일을 올린 뒤, 아래 세 종류만 직접 고친다(research R1).

1. **포크 기능과의 병합**: post_store의 `FilterUserIds`와 upstream 숨김 조건을 나란히 둔다. `getPostsAround`의 컴파일 함정도 여기서 고친다(R3).
2. **제외 계보 걷어내기**: Managed Categories·Integrated Boards·Classification·채널 속성 문맥을 넣지 않는다(R4).
3. **생성물과 i18n**: `migrations.list`·store layers·mocks를 다시 만들고 `ko.json` 2키를 넣는다(R6·R7, 원칙 V).

포크 기능(봇 필터·알림 히스토리·멘션 처리·recent mentions·그룹 메시지 멤버 관리·검색·테마 일괄 적용)은 하나씩 대조했고, 동작이 바뀌지 않는다(R2·R5·R8). 회귀 테스트로 이를 고정한다.

## Technical Context

**Language/Version**: Go 1.26.2(server), TypeScript 5.6 + React 19(webapp)

**Primary Dependencies**: squirrel(SQL 빌더), Mattermost app/store 계층, Redux(mattermost-redux), react-intl

**Storage**: PostgreSQL — `Channels` 열 1개 추가(마이그레이션 `000221`, upstream과 같은 번호와 이름)

**Testing**: Go `testing` + testify(colocated `_test.go`, 로컬 PG 필요), Jest + RTL(`npm run test`, TZ=UTC), Playwright 스펙 1개(upstream에서 받음, 포크 실행 격차는 알려진 문제)

**Target Platform**: Linux 서버 + 웹앱(데스크톱·모바일 웹). 네이티브 모바일 앱은 서버가 거른 결과를 받는다

**Project Type**: 웹 애플리케이션(모노레포 `server/` + `webapp/`)

**Performance Goals**: 숨김을 켜지 않은 채널은 쿼리가 바뀌지 않는다(제외 절이 빈 문자열). 숨김 채널은 `Type NOT IN (…)` 조건 하나가 늘어난다. 조회 요청마다 `GetChannel` 1회가 늘지만 채널 캐시를 탄다(upstream과 같다)

**Constraints**: upstream diff와의 줄 단위 차이를 최소로 둔다. 포크 기능의 기존 결과를 바꾸지 않는다(spec SC-007). 보호 경로(`server/channels/db/migrations/`)를 건드리므로 PR 병합에 `--admin`이 필요하다

**Scale/Scope**: upstream 36파일 +2220/−229. 포크 추가분은 결합 테스트 3종, `ko.json` 2키, divergences 기록

## Constitution Check

*GATE: Phase 0 전에 통과해야 한다. Phase 1 설계 뒤 다시 확인한다.*

| 원칙 | 판정 | 근거·증거 계획 |
|---|---|---|
| I. 패키지별 품질 게이트 | 통과 예정(예외 1건) | 착수 전 기준선 저장: server 접촉 패키지 테스트 실패 목록, webapp check-types 13건·check 105건(2026-10-15). 마감에 `make check-style`(메모리 부족이면 `golangci-lint -j 1`로 재판정)과 webapp `check`·`check-types`·jest를 돌려 목록 diff를 제시한다. `make test-server` 전체 실행은 예외로 두고 Complexity Tracking에 사유를 적는다 |
| II. npm workspaces 전용 | 해당 없음 | 의존성을 추가하지 않는다. `package-lock.json` peer 키 churn이 생기면 버린다 |
| III. 실패를 본 테스트만 인정 | 통과 예정 | spec 구현이라 sync 예외가 적용되지 않는다. **테스트 범위는 upstream을 따른다.** upstream 테스트는 테스트 파일을 먼저 적용해 실패(또는 컴파일 실패) 출력을 남긴 뒤 구현을 적용한다. 포크 결합 테스트 3종(알림 히스토리, FilterUserIds, 봇 필터 빈 페이지)은 포크 기능과 겹치는 곳에만 새로 쓰고 실패를 먼저 본다(R10). upstream에 테스트가 없는 동작 3곳(Etag, 실시간 반영, 추가된 사용자 프로필 로드)은 원칙 III의 "건너뛸 때 사유를 과제 옆에 적는다"에 따라 사유를 남기고 quickstart 실주행으로 검증한다 |
| IV. 라이선스·리브랜드 | 통과 | upstream 파일의 copyright 헤더를 유지한다. 새 문구 2키는 "Join/Leave System Messages"로 브랜드명이 없다 |
| V. i18n 동기화 | 통과 예정 | `en.json` 2키(upstream) + `ko.json` 2키를 같은 변경에 넣는다. sync 예외를 쓰지 않는다 |
| VI. 브랜치·커밋·PR | 통과 예정 | 브랜치 `029-join-leave-toggle`. 커밋은 `feat:` 접두사, 본문에 `Upstream: https://github.com/mattermost/mattermost/commit/5de31f8e868f61636ee9d556176cd6ab5f956f2b`를 넣는다. 마이그레이션은 CODEOWNERS 보호 경로라 리뷰 뒤 `--admin` 병합 |
| VII. Spec 주도 | 통과 | sync에서 spec 전환으로 합류했다. 구현은 `/speckit-implement`의 3-bis에서 TDD·검증 규율을 로드한다 |
| VIII. 문서 언어·문체 | 통과 | 산출물을 한국어로 썼다 |

Phase 1 뒤 재확인: 설계가 새 의존성·새 권한·새 엔드포인트를 만들지 않는다. 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/029-join-leave-toggle/
├── spec.md
├── plan.md              # 이 문서
├── research.md          # Phase 0 — 포크 겹침 조사(R1~R10)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 — 실주행 검증 절차
├── contracts/
│   └── channel-and-posts-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks에서 만든다
```

### Source Code (repository root)

upstream이 건드리는 파일과 이번에 하는 일. ★는 포크 겹침 때문에 손으로 고치는 파일이다.

```text
server/
├── public/model/
│   ├── channel.go                 ★ DisableJoinLeaveMessages 추가, ChannelPatch의 제외 계보 필드 빼기
│   ├── post.go                    ★ 옵션 구조체에 FilterUserIds와 ExcludeMembershipSystemPosts 공존, 유형 집합 함수 3개
│   └── channel_test.go, post_test.go
├── channels/
│   ├── api4/
│   │   ├── channel.go             ★ patchChannel 조건에서 updatingManagedCategory 빼기, DM·GM 거부
│   │   ├── post.go                  GetPostsEtag(channel) 호출 4곳(자동 병합)
│   │   └── channel_test.go, post_test.go
│   ├── app/
│   │   ├── post_membership_messages.go(_test.go)   신규, upstream 그대로
│   │   ├── post.go                ★ GetPostsForView(제외 계보) 빼기, 나머지 populate·filter 호출 유지
│   │   ├── notification.go          upstream 그대로(포크 #167·#170 블록과 자동 병합)
│   │   └── notification_test.go   ＋ 포크 결합 테스트: 알림 히스토리
│   ├── store/
│   │   ├── sqlstore/post_store.go ★ 두 필터 병합 8곳 + getPostsAround 체인 이관
│   │   ├── sqlstore/channel_store.go  열 추가, CountPostsAfter가 JoinLeaveMessagePostTypes() 사용
│   │   ├── store.go                 시그니처 3개
│   │   ├── storetest/post_store.go★ upstream 테스트 + 포크 결합 테스트: FilterUserIds × 숨김
│   │   └── retrylayer/, timerlayer/, storetest/mocks/   생성기로 재생성
│   └── db/migrations/
│       ├── postgres/000221_add_disable_join_leave_messages_to_channels.{up,down}.sql
│       └── migrations.list          make migrations-extract로 재생성
webapp/
├── platform/types/src/channels.ts ★ disable_join_leave_messages만(property_values 빼기)
└── channels/src/
    ├── components/channel_settings_modal/
    │   ├── channel_settings_configuration_tab.tsx  ★ Classification 조건 걷어내기
    │   ├── channel_settings_configuration_tab.scss
    │   ├── channel_settings_modal.tsx(.test.tsx)
    ├── packages/mattermost-redux/src/reducers/entities/
    │   ├── posts.ts(.test.ts)       빈 페이지 경계 플래그
    │   └── channels.ts              mention_count 보존
    ├── actions/websocket_actions.ts, new_post.ts
    └── i18n/en.json, ko.json      ★ ko 2키 추가
e2e-tests/playwright/
├── lib/src/ui/components/channels/channel_settings/configuration_settings.ts  ★ 제외 계보 로케이터 빼기
└── specs/functional/channels/channel_settings/join_leave_messages.spec.ts
docs/upstream-adapted-divergences.md   ★ 버린 문맥 기록(sync 관례)
```

**Structure Decision**: 기존 모노레포 구조를 그대로 쓴다. 새 디렉터리는 upstream 신규 파일 위치뿐이다.

## 구현 순서

tasks.md에서 세분한다. 큰 흐름과 각 단계의 증거는 다음과 같다.

| 단계 | 내용 | 증거 |
|---|---|---|
| 0 | 기준선 저장(server 접촉 패키지 테스트 실패 목록, webapp check-types·check) | 기준선 파일 |
| 1 | `git cherry-pick -x --no-commit 5de31f8e`. 충돌 상태를 기록한 뒤 **테스트 파일만** 먼저 확정하고 실행 | 실패/컴파일 실패 출력(원칙 III) |
| 2 | 포크 결합 테스트 3종 작성(포크 기능과 겹치는 곳에만, upstream 코드는 건드리지 않음): (a) store `FilterUserIds`×숨김, (b) 알림 히스토리 — 숨김 채널 추가 시 당사자 1건·타인 0건, (c) reducer — 봇 필터 빈 페이지(`prev_post_id` 있음)에서 `oldest` 플래그를 세우지 않음 | 실패 출력 |
| 3 | 서버 구현 hunk 적용 + ★ 파일 수동 해소(R3·R4) + `getPostsAround` 체인 이관 | `go build ./...`, 단계 1·2 테스트 통과 |
| 4 | 생성물 재생성(`migrations-extract`·`store-layers`·`mocks`) | `git status --porcelain`에 생성물 외 변경 없음 |
| 5 | 웹앱 hunk 적용 + 설정 탭 Classification 걷어내기 + `ko.json` 2키 | jest 통과, check-types diff 0 |
| 6 | divergences 기록, quickstart 시나리오 1~5 실주행 | SC-001~006 실측값 |
| 7 | 게이트·기준선 diff, PR(`--admin` 필요), 커밋 본문 `Upstream:` 참조 | 게이트 출력, ledger에서 `5de31f8e` 차감(SC-008) |

## 위험과 대응

| 위험 | 대응 |
|---|---|
| `getPostsAround` 텍스트 병합은 통과하지만 컴파일 실패 | 단계 3에서 `go build`로 바로 잡는다. 체인 형태로 옮긴다(R3) |
| 생성물 순서 어긋남으로 CI 3잡 실패 | 단계 4를 커밋 전에 반드시 실행한다(메모리 `sync-adapt-needs-codegen`) |
| 게스트 2종 숨김으로 읽지 않음 표시만 남음 | upstream과 같게 두고 spec에 알려진 차이로 적는다(R9) |
| 웹앱 `receiveChannelMember` 변경이 spec 027 배지에 영향 | 027 관련 테스트를 단계 5에서 함께 돌린다(R8) |
| Playwright 스펙이 포크에서 돌지 않음 | 알려진 격차(메모리 `playwright-e2e-fork-gaps`). 실주행은 quickstart로 대신하고, 스펙은 받아 두기만 한다 |

## Complexity Tracking

| 위반 | 왜 필요한가 | 더 단순한 대안을 버린 이유 |
|---|---|---|
| 원칙 I의 `make test-server` 전체를 로컬에서 돌리지 않는다 | 서버 전체 테스트는 로컬 WSL 환경에서 메모리와 시간 한계를 넘는다(메모리: golangci-lint OOM, jest 전체 ENOMEM 기록). 그리고 master에서도 실패하는 기준선 테스트가 여러 패키지에 퍼져 있다(파일 검색·채널 검색·role 백필·북마크 감사) | 접촉 패키지(`public/model`, `channels/app`, `channels/api4`, `channels/store/sqlstore`) 테스트를 기준선 대비 diff로 판정하고, PR의 CI server 잡 결과를 함께 확인한다. 전체 실행을 강행하면 판정 불가능한 OOM 실패만 쌓인다 |
| upstream에 테스트가 없는 동작 3곳(Etag, 실시간 반영, 추가된 사용자 프로필 로드)에 포크 테스트를 쓰지 않는다 | 사용자 지시가 "최대한 upstream과 동일하게"다. 포크 테스트를 더하면 이후 upstream이 같은 파일 테스트를 고칠 때마다 sync 충돌이 생긴다 | 원칙 III의 건너뜀 사유 기록 규칙을 따르고, quickstart 시나리오 2·3에서 실측해 T056에 기록한다 |
