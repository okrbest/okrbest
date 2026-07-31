# Quickstart: 채널 비멤버 컨텐츠 접근 감사 로깅 검증

이 문서는 구현 완료 후 각 사용자 스토리(spec.md)가 실제로 동작하는지 확인하는 절차다. 상세
파라미터 이름은 [data-model.md](data-model.md), 요구사항 번호는 [spec.md](spec.md#requirements)를
참고한다.

## 사전 준비

- 로컬 okrbest 서버 실행(`make run-server` 또는 기존 개발 워크플로).
- 감사 로그 파일이 활성화되어 있어야 한다(`config.json`의 `ExperimentalAuditSettings` 또는
  기존 audit 로그 설정 — 이미 다른 감사 기능에서 사용 중인 설정을 그대로 사용).
- 다음 테스트 데이터가 필요하다:
  - 팀 T, 채널 A(테스트 사용자가 멤버), 채널 B(테스트 사용자가 **비멤버**).
  - 채널 B에 게시물 P, 파일 F(P에 첨부), 북마크 K가 존재.
  - 채널 B에 대해 `manage_system` 권한(또는 공개 채널 브라우징 권한)으로 접근 가능한 테스트
    사용자 U.

## 검증 1 — 게시물 단건 조회 (User Story 1, FR-001)

1. 사용자 U로 로그인해 `GET /api/v4/posts/{P}`를 호출한다(채널 B의 멤버가 아닌 상태).
2. 응답이 200으로 성공하는지 확인한다(권한상 허용된 경로 사용).
3. 감사 로그에서 해당 요청의 레코드를 찾아 `non_channel_member_access: true`가 기록되었는지
   확인한다.
4. 대조군: 사용자 U를 채널 B의 멤버로 추가한 뒤 동일 요청을 다시 호출하고, 이번에는
   `non_channel_member_access` 파라미터가 기록되지 않음(또는 `false`)을 확인한다.

**기대 결과**: 비멤버 상태에서만 표시가 남고, 멤버 상태에서는 남지 않는다 — spec Acceptance
Scenario 1·2 충족.

## 검증 2 — 목록·스레드·검색 (User Story 2, FR-002)

1. 사용자 U가 멤버인 채널 A와 비멤버인 채널 B의 게시물 ID를 섞어
   `POST /api/v4/posts/ids`(게시물 ID 일괄 조회)로 요청한다.
2. 감사 로그에서 `non_channel_member_access: true`가 기록되는지 확인한다.
3. `GET /api/v4/posts/{P}/thread`(스레드 조회), 팀 내 게시물 검색 API에 대해서도 동일하게
   반복해 각각 감사 로그에 표시가 남는지 확인한다.

**기대 결과**: 목록/스레드/검색 결과에 비멤버 채널 게시물이 하나라도 포함되면 요청 단위로
표시된다 — spec Acceptance Scenario 1·2·3 충족.

## 검증 3 — 파일 접근 (User Story 3, FR-003)

1. 사용자 U로 파일 F를 원본 다운로드(`GET /api/v4/files/{F}`), 썸네일(`.../thumbnail`),
   미리보기(`.../preview`) 각각 호출한다.
2. 각 호출에 대응하는 감사 로그 레코드에 `non_channel_member_access: true`가 기록되는지
   확인한다.
3. 파일 검색 API로 채널 B의 파일이 결과에 포함되는 검색을 수행하고 동일하게 확인한다.

**기대 결과**: 파일 원본·썸네일·미리보기·검색 모두 비멤버 접근이 감사된다 — spec Acceptance
Scenario 1·2 충족.

## 검증 4 — 채널 북마크 (User Story 4, FR-004)

1. 사용자 U로 채널 B의 북마크 목록을 조회한다.
2. 감사 로그에 `non_channel_member_access: true`가 기록되는지 확인한다.
3. (권한이 있다면) 채널 B의 북마크를 생성·수정·삭제하고 각각 감사 로그를 확인한다.

**기대 결과**: 북마크 CRUD 및 목록 조회 전부에서 비멤버 접근이 감사된다 — spec Acceptance
Scenario 1·2 충족.

## 검증 5 — 미리보기·웹소켓 퍼머링크 (User Story 5, FR-005·006)

1. 사용자 U가 멤버인 채널 A에, 채널 B의 게시물 P를 가리키는 퍼머링크를 포함한 새 게시물을
   작성한다(`POST /api/v4/posts`).
2. 응답 및 감사 로그에서 `preview_post_id: P`와 `non_channel_member_access: true`(미리보기
   전용 표시)가 함께 기록되는지 확인한다.
3. 웹소켓 클라이언트를 연결한 상태에서 위 게시물 생성을 트리거해, 퍼머링크 브로드캐스트 훅
   경유 이벤트에도 동일한 감사 레코드가 남는지 확인한다.

**기대 결과**: 링크 미리보기와 웹소켓 퍼머링크 이벤트 모두에서 비멤버 채널 참조가 감사된다 —
spec Acceptance Scenario 1·2 충족.

## 회귀 확인 (SC-003, SC-004)

1. 사용자 U를 채널 A·B 모두의 정상 멤버로 설정한 뒤 검증 1~5를 반복한다.
2. 모든 응답의 상태 코드·바디 스키마가 이 기능 적용 전과 동일한지 확인한다(SC-004).
3. 감사 로그에 `non_channel_member_access` 계열 파라미터가 전혀 추가되지 않는지 확인한다
   (SC-003 — 정상 멤버 흐름은 감사 볼륨 변화 없음).

## 자동화 테스트

수동 검증 후, 아래 Go 테스트 스위트로 회귀를 고정한다(§research.md "6. 테스트 전략"):

```bash
cd server
go test ./channels/app/... -run TestSessionHasPermissionToChannel
go test ./channels/app/... -run TestGetPostIfAuthorized
go test ./channels/api4/... -run "TestGetPost|TestGetPostsForChannel|TestGetPostThread"
go test ./channels/api4/... -run "TestGetFile|TestSearchFiles"
go test ./channels/api4/... -run "TestChannelBookmark"
```

(정확한 테스트 함수명은 tasks.md 작성 시 upstream 테스트 파일을 기준으로 확정한다.)
