# Data Model: 검색 결과 RHS 팝아웃

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

새 DB 스키마·서버 모델 변경은 없다(웹앱 전용 기능). 여기서 다루는 "엔티티"는 클라이언트 상태와 URL에 인코딩되는 값들이다.

## 검색 팝아웃 쿼리 상태 (URL 쿼리 파라미터)

`/_popout/rhs/:team/search?...` URL에 인코딩되는 값. 팝아웃 창을 새로고침해도 이 값들로 검색 상태가 복원된다(spec FR-005, SC-004).

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `q` | string | 아니오(기본 `''`) | 검색어. |
| `type` | `SearchType`(`'messages' \| 'files'`) | 아니오(기본 `'messages'`) | 메시지/파일 검색 구분. |
| `mode` | `RhsState`(`'search' \| 'mention' \| 'flag' \| 'pin' \| 'channel-files'` 등) | 아니오(기본 검색) | 어떤 RHS 화면을 팝아웃했는지(spec User Story 2). |
| `channel` | string(채널 name) | `mode`가 `pin`/`channel-files`일 때 필수 | 고정 메시지·채널 파일 대상 채널. |
| `searchTeamId` | string(팀 ID) | 아니오 | 크로스팀 검색 시 대상 팀(spec Acceptance Scenario 3). |

**검증 규칙**: 서버 측 검증 없음(클라이언트 라우팅 파라미터). `channel`이 필요한 모드인데 값이 없거나 존재하지 않는 채널명이면 해당 채널 종속 데이터(고정 메시지/채널 파일)를 로드하지 않는다(Edge Cases: 빈 결과 상태로 수렴).

**생명주기**: 팝아웃 버튼 클릭 시 원래 창의 현재 검색 상태로부터 생성되어 새 창 URL에 기록됨 → 팝아웃 창 내에서 검색어/필터/팀을 바꾸면 `history.replace`로 같은 URL이 갱신됨(뒤로가기 스택을 어지럽히지 않음) → 새로고침 시 이 URL로부터 redux 상태가 재구성됨.

## RHS 모드 → 팝아웃 제목 매핑

저장되는 데이터는 아니고, `mode` 값에 따라 팝아웃 창 제목(`document.title`)을 결정하는 순수 매핑(spec FR-004).

| mode | 제목 포맷(i18n 키) | 포함 정보 |
|---|---|---|
| `search`(기본) | `rhs_search_popout.title.search` | 검색어, 서버명 |
| `mention` | `rhs_search_popout.title.mentions` | 서버명 |
| `flag` | `rhs_search_popout.title.saved` | 서버명 |
| `pin` | `rhs_search_popout.title.pinned` | 채널명, 서버명 |
| `channel-files` | `rhs_search_popout.title.channel_files` | 채널명, 서버명 |

## Key Entities (spec.md 대응)

| spec.md의 Key Entity | 이 문서의 대응 |
|---|---|
| 검색 팝아웃 쿼리 상태 | 위 "검색 팝아웃 쿼리 상태" 표 |
| RHS 모드 | 위 "RHS 모드 → 팝아웃 제목 매핑" 표 |
