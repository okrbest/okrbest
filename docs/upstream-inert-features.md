# 반영했으나 비활성인 upstream 기능

우리가 **제외한 계보** 때문에 코드는 들어왔지만 실제로는 발동하지 않는 upstream 기능을 모은다.
향후 그 계보를 도입하거나 자체 구현할 때 여기서부터 확인한다.

`docs/upstream-master-unmerged-commits.md`와 역할이 다르다 — 그쪽은 **미반영·제외·spec 전환**
커밋의 목록이고, `/speckit-sync`의 `upstream-sync.sh update`가 매번 재생성한다(부록 3종만 보존).
이 문서는 스크립트가 건드리지 않으므로 **반영된 뒤에도 남는 상태**를 기록한다.

Mattermost 비공개 저장소(`github.com/mattermost/enterprise/*`) 의존으로 비활성인 커밋은
여기가 아니라 ledger 하단 **"Mattermost 비공개 사설 모듈 커밋"** 부록에 있다.

코드가 **동작하지만 upstream과 형태가 다른** 지점(adapt로 벌어진 차이)은
`docs/upstream-adapted-divergences.md`에 있다.

| 반영 커밋 | upstream | 비활성 사유 · 활성화 조건 |
|---|---|---|
| `c82b456b` Board channel bookmarks with target_id and readonly bookmark API | [6ef5d58b](https://github.com/mattermost/mattermost/commit/6ef5d58b7f12950def5383e732415755859ed27b) (#36572) | 아래 참조 |
| `52ac8d88` MM-68952: Resolve public channel mentions for non-members under Compliance | [61643e10](https://github.com/mattermost/mattermost/commit/61643e106605134bd88695f3cba206cd641169f0) (#36815) | 아래 참조 |
| `3adb72ee` MM-69612 ABAC 감사 로깅 옵트인 설정 | [f6c1459e](https://github.com/mattermost/mattermost/commit/f6c1459ebf597b2097d07e447eec4300121d1086) (#37322) | 설정을 읽는 코드가 아직 없다 — 아래 참조 |

---

## Board 채널 북마크 (`board` 북마크 타입)

**반영 상태.** 모델(`ChannelBookmarkBoard` 타입, `TargetId` 필드, 타입별 검증), API 읽기전용
강제, 스토어의 `TargetId` 읽기·쓰기, 웹앱 아이콘 분기와 링크 유틸, 그리고 마이그레이션
`000190`(`channel_bookmark_type` enum에 `'board'` 추가 + `channelbookmarks.targetid` 컬럼),
`000191`(`(type, targetid)` 부분 인덱스)까지 전부 들어와 있다. 컴파일·마이그레이션 모두 성립하고
테스트도 통과한다.

**왜 비활성인가.** `board` 북마크는 *externally managed* 다 — 북마크 API로는 만들 수 없고
(`IsExternallyManagedChannelBookmarkType`이 create/update/delete를 400으로 거부한다)
Integrated Boards 서브시스템만 생성한다. 우리는 그 계보(`48f2fd08` Integrated Boards MVP와
후속)를 전부 제외했고, okrbest의 Boards는 focalboard 기반 자체 플러그인
(okrbest-plugin-boards, BlockProp 모델)이 담당하며 Mattermost property/boards API를
호출하지 않는다. 따라서 **우리 트리에서 `board` 타입 북마크가 생성되는 경로가 없다.**
컬럼과 인덱스는 계속 비어 있고, `ProductBoardsIcon` 분기와 board 검증 로직도 실행되지 않는다.

**그럼에도 반영한 이유.** (1) 읽기전용 API 강화와 웹앱 북마크 링크 유틸 추출
(`bookmarkHasLinkUrl`·`shouldOpenBookmarkInNewTab`·`copyBookmarkLink` + 테스트 120줄)은
Boards와 무관하게 link/file 북마크에도 유효하다. (2) 북마크 파일들이 upstream과 벌어지기
시작하면 이 영역의 후속 커밋마다 충돌 비용을 치른다.

**활성화 조건.** okrbest-plugin-boards가 채널 북마크를 만들도록 하려면 `board` 타입과
`target_id`를 쓰는 생성 경로를 자체로 구현하면 된다 — 북마크 API가 아니라 스토어
(`Store().ChannelBookmark().Save()`)를 직접 쓰는 형태여야 한다. 또는 Integrated Boards
계보를 도입한다면 `48f2fd08`의 property 시스템 v2 분할 반영이 선행 과제다(사유는 ledger
부록의 `48f2fd08`·`23b4d827` 항목 참조).

**주의 — 반영하지 않은 인접 조각.** 같은 upstream 커밋의 i18n 문맥에 섞여 있던 board *채널*
관련 4키는 다른 Boards 커밋 소산이라 가져오지 않았다:
`api.channel.board_channel.app_error`,
`model.channel.is_valid_board.{display_name,team_id,type}.app_error`.
board 채널 타입(`BO`/`BP`) 자체가 우리에게 없다.

**마이그레이션 번호.** 우리 최신이 `000188`이고 `000189`는 제외한 `e8632bd4`
(property `permission_level`에 `admin` 추가) 소산이라 비어 있다. 이 커밋이 `000190`부터
쓰면서 그 공백을 처음 실현했다. 앞으로 자체 마이그레이션을 추가할 때도 upstream 번호와
어긋나지 않게 사용 중인 번호를 피해서 매긴다.

---

## 채널 멘션 해석 — board 채널 분기 누락 (`HasPermissionToResolveChannelMention`)

**반영 상태.** 버그 픽스 본체는 전부 들어왔다. `~channel` 멘션 이름 해석이 콘텐츠 읽기
권한(`HasPermissionToReadChannel`)을 재사용한 탓에, Compliance Monitoring이 켜지면 공개
채널 비참여자에게 `channel_mentions` prop이 벗겨져 웹앱이 링크 대신 날 슬러그를 렌더하던
문제다. `HasPermissionToResolveChannelMention`을 신설해 호출부 3곳(`FillInPostProps`,
`sanitizeChannelMentionsForUser`, `channelMentionsBroadcastHook`)을 교체했고, 신규 함수는
공개 채널 이름·링크만 노출하므로 ComplianceSettings와 무관하되 팀 멤버십은 요구한다.
Go 테스트 506줄과 Playwright 스펙 140줄도 그대로 가져왔다.

**무엇을 들어냈나.** upstream 원본은 팀 멤버십 경로를 `ChannelTypeOpen`과
`ChannelTypeOpenBoard` 둘 다에 적용한다. okrbest에는 board 채널 타입(`BO`/`BP`)과
`ChannelTypeSpace`가 없어서(위 board 북마크 항목의 "반영하지 않은 인접 조각" 참조)
`|| channel.Type == model.ChannelTypeOpenBoard` 절을 제거했다. 남겼다면 컴파일이 깨진다.

`authorization_test.go`의 "open board, team member, compliance ON -> resolves" 케이스와
그 switch 분기도 뺐다. 이 분기는 `model.KanbanProps`·`model.View`·`model.ViewTypeKanban`·
`Store().Channel().SaveBoardChannel`을 쓰는데 넷 다 우리 트리에 없다 — Integrated Boards
계보 전체에 딸린 것들이라 한 줄로 대체할 수 없다. 두 자리 모두 소스에 주석으로 표시했다.

**영향.** 없다. 생성될 수 없는 채널 타입에 대한 분기라서, 제거해도 관측 가능한 동작이
달라지지 않는다. 나머지 케이스(공개/비공개/DM/GM × 팀 멤버십 × compliance)는 upstream
그대로 통과한다.

**활성화 조건.** board 채널 타입을 도입하면 두 자리를 되살린다 — 프로덕션은 `||` 절 한 줄,
테스트는 upstream 원본의 switch 분기를 그대로 가져오면 된다.

**보안 메모.** 이 커밋은 권한 검사를 **완화**한다. Compliance Monitoring이 켜진 상태에서
팀 멤버가 자기가 안 들어간 공개 채널의 표시 이름을 멘션 링크로 보게 된다. upstream 논거는
공개 채널 이름이 이미 팀 내 browse/search/autocomplete로 발견 가능하고, 링크를 따라가려면
채널 참여가 필요해 컴플라이언스 기록이 남는다는 것이다. 우리 트리에서도 성립한다 —
`HasPermissionToChannelMemberCount`가 이미 compliance와 무관하게 `PermissionListTeamChannels`로
공개 채널을 노출한다. 비공개·DM·GM과 교차 팀은 여전히 막힌다.

---

## ABAC 감사 로깅 옵트인 설정 (`EnableAccessControlAuditLogging`)

**무엇이 들어왔나.** upstream `f6c1459e`(MM-69612, #37322)로 ABAC 정책 판정을 감사 로그로
남기는 **옵트인 설정**을 받았다(17파일 +360/-1). 구성 — `AccessControlSettings.
EnableAccessControlAuditLogging`(기본 `false`), 신규 `config.IsAuditLoggingActive()`(감사
출력이 실제로 어딘가로 가는지 판정), 설정은 켰는데 감사 싱크가 없을 때의 부팅 경고,
클라이언트 설정 노출(`EnableAccessControlAuditLogging`·`AuditLoggingActive`), 시스템 콘솔 항목.

**왜 비활성인가.** 이 설정을 읽어 **실제로 감사 로그를 발행하는 코드가 우리 트리에 없다.**
upstream에서 소비처는 `server/channels/app/access_control_membership.go`와
`access_control_membership_audit.go` 두 파일인데, 그 둘을 만드는 커밋이

```
de7a2dc759  MM-69614: Add per-user audit logging for ABAC membership sync (#37771)  2026-09-17
```

이고 ledger의 **pending 표에 있다**(제외 아님). 즉 반영 시점(2026-07-28 기준) 기준으로 약 7주
뒤 커밋이다. upstream도 같은 순서로 넣었다 — 설정 먼저(`f6c1459e`), 발행 나중(`de7a2dc759`).

**지금 상태.** 시스템 콘솔에 토글이 보이고, 켜면 감사 싱크가 없을 때 부팅 경고가 뜬다. 그러나
감사 로그는 나오지 않는다. 기본값이 `false`라 사용자 영향은 0이다.

**활성화 조건.** `de7a2dc759`(MM-69614)를 반영하면 발행 경로가 생겨 설정이 실제로 동작한다.
그때 함께 확인할 것 — (1) `ExperimentalAuditSettings.FileEnabled`를 켜거나 advanced logging
타깃을 감사 레벨에 묶어야 출력이 실제로 나간다(`IsAuditLoggingActive`가 그걸 판정하고, 아니면
부팅 경고가 뜬다), (2) 감사 로그에 담기는 사용자 식별 정보가 우리 개인정보 정책과 맞는지,
(3) 콘솔 항목이 Enterprise Advanced 라이선스 티어 아래에서 숨는지(신규 테스트
`admin_definition_abac_audit_logging.test.tsx`가 그 동작을 고정한다).

**adapt 시 버린 것.** 충돌 7파일에서 upstream 블록에 함께 들어 있던
`TrustProxyDeviceIdentityHeader`·`EnforceDeviceIDConsistency` 둘은 받지 않았다 — 이 커밋의
추가분이 아니라 우리 `AccessControlSettings`에 없는 기존 upstream 필드다(세션·기기 속성 계보,
`docs/upstream-adapted-divergences.md`의 `666f5d95` 항목). 결과로 우리 구조체는 기존 3필드 +
신규 1필드다.
