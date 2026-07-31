# Phase 0 Research: 채널 비멤버 컨텐츠 접근 감사 로깅

이 기능은 신규 아키텍처 결정이 필요한 그린필드 기능이 아니라, upstream 커밋
`b5a816a657d6f33a96d374b04212685e2b0df77d`(mattermost/mattermost #31266)를 okrbest에
적용하는 작업이다. 따라서 Phase 0의 초점은 "무엇을 새로 설계할까"가 아니라 "upstream 구현을
okrbest 현재 코드베이스에 안전하게 얹으려면 어떤 지점을 확인해야 하는가"에 맞춘다.

## 1. 권한 판정 함수 시그니처 확장 방식

- **Decision**: upstream이 채택한 패턴을 그대로 따른다 — `SessionHasPermissionToChannel`,
  `HasPermissionToChannel` 등은 `bool` → `(hasPermission bool, isMember bool)`로,
  `CreatePost`/`CreatePostAsUser`/`GetPostIfAuthorized` 등은 반환 튜플에 `isMember`(또는
  `isMemberForPreviews`) bool을 추가로 얹는 방식으로 확장한다.
- **Rationale**: 이미 upstream 메인터이너 리뷰를 거쳐 89개 파일 전역에 일관되게 적용된 패턴이다.
  별도 설계를 새로 고안하면 diff가 더 커지고 회귀 위험만 늘어난다. 기존 검증된 패턴을 그대로
  따르는 것이 가장 낮은 리스크다.
- **Alternatives considered**:
  - 별도 컨텍스트/파라미터 구조체(`type PermissionResult struct{...}`) 도입 — 시그니처는
    더 명확해지지만 89개 호출부 전체를 upstream diff와 다른 방식으로 다시 손봐야 해서 채택하지
    않음.
  - 채널 멤버십 여부를 별도 함수(`a.IsChannelMember(...)`)로 분리해 호출부에서 추가 조회 —
    호출당 DB 조회가 1회 늘어나 성능 저하, 기각.

## 2. okrbest 포크와의 충돌 지점 성격 확인

- **Decision**: `server/channels/api4/post.go`, `server/channels/app/post.go`에서 예측된
  merge 충돌은 **의미적 충돌이 아니라 순수 라인 드리프트**로 판단하고, 표준 3-way 병합(직접
  cherry-pick 재시도 또는 수동 패치 적용)으로 해결한다.
- **Rationale**: 현재 HEAD 기준 `SessionHasPermissionToChannel`(`authorization.go:93`),
  `HasPermissionToChannel`(`authorization.go:290`), `CreatePostAsUser`/`CreatePost`
  (`post.go:41`, `post.go:163`), `GetPostIfAuthorized`(`post.go:2426`)의 시그니처가 모두
  upstream 이 커밋 적용 **이전** 상태와 동일하다 — 즉 okrbest는 이 함수들을 자체적으로
  변경한 적이 없다. `/speckit-sync`의 FORK HISTORY 신호에 뜬 우리 자체 커밋들
  (`b677ff75a7`, `8622381e40`, `cf514e807d` 등)은 모두 이미 반영된 **upstream cherry-pick/adapt
  커밋**이며 okrbest 고유 로직이 아니다. 따라서 충돌은 그 사이 반영된 다른 upstream 커밋들의
  줄 번호 이동 때문이며, 로직을 다시 설계할 필요는 없다.
- **Alternatives considered**: 처음부터 okrbest 전용 권한 판정 로직으로 재작성 — 근거 없음(현재
  로직이 upstream과 동일하므로 불필요), 기각.

## 3. `PluginAPI` 외부 호환성

- **Decision**: `server/channels/app/plugin_api.go`의 `PluginAPI` 메서드(플러그인이 호출하는
  공개 인터페이스) 자체의 시그니처는 변경하지 않는다. 내부에서 `SessionHasPermissionToChannel`
  등을 호출하는 지점만 새 튜플 반환값을 언패킹하도록 조정한다.
- **Rationale**: upstream diff를 확인한 결과 `PluginAPI.SearchPostsInTeamForUser`,
  `PluginAPI.GetReactions`, `PluginAPI.GetPostsForChannel`, `PluginAPI.HasPermissionToTeam` 등
  메서드 시그니처는 그대로이며, 메서드 본문 내부의 언패킹만 바뀐다. 따라서 서드파티 플러그인
  호환성에 영향이 없다.
- **Alternatives considered**: 해당 없음(외부 계약 변경이 필요한 상황이 아님).

## 4. 감사 로그 파라미터 스키마

- **Decision**: 신규 감사 파라미터는 기존 `model.AddEventParameterToAuditRec` /
  `model.AddEventParameterAuditableToAuditRec` 메커니즘으로 부착한다 — `non_channel_member_access`
  (bool), `non_channel_member_access_on_previews`(bool, 목록·리스트형 API 한정),
  `preview_post_id`(string, 미리보기 관련 케이스 한정). 기존 감사 이벤트 상수 목록
  (`server/public/model/audit_events.go`)에 upstream이 추가한 상수(예:
  `AuditEventGetFileThumbnail`, `AuditEventGetPinnedPosts`, `AuditEventListChannelBookmarksForChannel`
  등)를 그대로 채택한다.
- **Rationale**: 신규 저장소·스키마 마이그레이션이 필요 없고, 기존 감사 로그 조회/필터링
  경험과 100% 호환된다.
- **Alternatives considered**: 별도 "채널 비멤버 접근 로그" 테이블 신설 — 기존 감사 인프라
  재사용이라는 spec 요구(FR-009)에 위배되므로 기각.

## 5. i18n·리브랜드 영향

- **Decision**: 사용자 노출 문자열 변경이 없으므로 `en.json`/`ko.json` 동시 갱신(constitution
  원칙 V) 대상이 아니다.
- **Rationale**: 감사 로그는 관리자 전용 백엔드 로그이며, upstream diff에도 신규 UI 문자열
  추가가 없다(콘솔/서버 로그 텍스트뿐).

## 6. 테스트 전략

- **Decision**: upstream이 이미 포함한 테스트(`authorization_test.go` +271줄, `post_test.go`
  +463줄, `file_test.go` +53줄, `channel_test.go`, `notification_test.go`,
  `plugin_hooks_test.go` 등)를 최대한 그대로 adapt해 재사용한다. okrbest 충돌 지점(§2)은
  이미 로직이 upstream과 동일하다고 확인되었으므로 추가 신규 테스트 설계보다는 upstream
  테스트를 정확히 이식하는 데 집중한다.
- **Rationale**: 원칙 III(동작 변경 시 테스트 동반)을 만족시키면서도, upstream 메인터이너가
  이미 검증한 테스트 커버리지를 재발명하지 않는다.

## 미해결 NEEDS CLARIFICATION

없음 — Technical Context의 모든 항목이 확정되었다.
