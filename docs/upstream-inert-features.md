# 반영했으나 비활성인 upstream 기능

우리가 **제외한 계보** 때문에 코드는 들어왔지만 실제로는 발동하지 않는 upstream 기능을 모은다.
향후 그 계보를 도입하거나 자체 구현할 때 여기서부터 확인한다.

`docs/upstream-master-unmerged-commits.md`와 역할이 다르다 — 그쪽은 **미반영·제외·spec 전환**
커밋의 목록이고, `/speckit-sync`의 `upstream-sync.sh update`가 매번 재생성한다(부록 3종만 보존).
이 문서는 스크립트가 건드리지 않으므로 **반영된 뒤에도 남는 상태**를 기록한다.

Mattermost 비공개 저장소(`github.com/mattermost/enterprise/*`) 의존으로 비활성인 커밋은
여기가 아니라 ledger 하단 **"Mattermost 비공개 사설 모듈 커밋"** 부록에 있다.

| 반영 커밋 | upstream | 비활성 사유 · 활성화 조건 |
|---|---|---|
| `c82b456b` Board channel bookmarks with target_id and readonly bookmark API | [6ef5d58b](https://github.com/mattermost/mattermost/commit/6ef5d58b7f12950def5383e732415755859ed27b) (#36572) | 아래 참조 |

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
