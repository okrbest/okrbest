# Data Model: Slack식 채널 헤더 재구성

**Date**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

서버·DB 변경이 없다. 신규 저장은 기존 preference 체계의 행 1종뿐이다.

## 신규 preference (기존 저장 경로 재사용)

| 필드 | 값 | 의미 |
|---|---|---|
| Category | `channel_bookmarks_bar` | 북마크 바 접기 상태 분류 |
| Name | 채널 ID | 채널별 상태 |
| Value | `collapsed` | 접힘. 행이 없으면 펼침(기본, 기존 동작) |

저장·동기화는 기존 savePreferences + preference 웹소켓 이벤트 그대로.

## 읽는 데이터 (전부 기존)

| 데이터 | 원천 | 쓰임 |
|---|---|---|
| RHS 상태 | `rhsState` 셀렉터 | 탭 활성 파생 (파일=CHANNEL_FILES, 고정=PIN, 메시지=닫힘) |
| 고정 개수 | 기존 pinned count | 고정 탭 배지 |
| 북마크 존재·기능 활성 | 채널 북마크 셀렉터·서버 설정 | 북마크 탭 노출 조건 |
| 멤버 수 | 채널 stats (`memberCount`) | 스택 인원수 |
| 채널 프로필 | 기존 프로필 셀렉터(+미로드 시 1회 로드) | 스택 아바타 3명 |
| 뮤트 상태 | 채널 멤버 notify props | 벨 아이콘 상태·토글 |

## 파생 상태 규칙 (저장 없음)

```text
rhsState = CHANNEL_FILES → 파일 탭 활성
rhsState = PIN           → 고정 탭 활성
RHS 닫힘                  → 메시지 탭 활성
그 외(스레드·검색 등)      → 활성 탭 없음
북마크 탭 활성 = 바 펼침(= 접기 preference 행 없음) && 북마크 기능 켜짐
```

## 컴포넌트 단위

| 단위 | 하는 일 | 입력 | 의존 |
|---|---|---|---|
| `ChannelHeaderTabs` (신설) | 탭 4개 렌더·활성 표시·클릭 디스패치 | rhsState, 고정 수, 북마크 노출/접기 | RHS 액션, savePreferences |
| `ChannelMemberStack` (신설) | 아바타 3명+인원수, 클릭=멤버 RHS | 멤버 수·프로필 | 기존 멤버 RHS 액션 |
| `ChannelHeader` (개편) | 두 줄 조립, 벨·⋮ 추가, 파일·핀 버튼 제거 | 기존 props | 위 두 컴포넌트 |
| `ChannelBookmarks`/`ChannelView` (개편) | 접기 preference 반영해 바 렌더 | 접기 preference | — |
