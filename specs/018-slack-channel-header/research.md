# Research: Slack식 채널 헤더 재구성

**Date**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

NEEDS CLARIFICATION은 없다. 아래는 코드를 읽고 내린 결정이다.

## R1. 탭 활성을 무엇에서 파생하나

**Decision**: 기존 `rhsState` 셀렉터 값으로 판정한다 — 파일 탭 활성 =
`RHSStates.CHANNEL_FILES`, 고정 탭 = `RHSStates.PIN`, 메시지 탭 = RHS 닫힘.
스레드 등 다른 `rhsState`면 어떤 탭도 활성 아님.

**Rationale**: 현재 헤더 아이콘이 이미 같은 방식으로 활성 클래스를 계산한다
([channel_header.tsx:285-330](../../webapp/channels/src/components/channel_header/channel_header.tsx)
— `'channel-header__icon--active': rhsState === RHSStates.CHANNEL_FILES` 등).
기존 관례를 탭으로 옮기면 SC-003(탭-상태 불일치 0)이 구조적으로 보장된다 —
닫기 버튼·ESC 등 어떤 경로로 닫혀도 rhsState가 바뀌므로 탭이 따라온다.

**Alternatives considered**: 탭 자체 상태 보관 — 패널을 다른 경로로 닫으면
어긋난다. 기각.

## R2. 북마크 바 "펼침/접기"를 어떻게 만드나

**Decision**: 채널별 사용자 preference를 신설한다 — category
`channel_bookmarks_bar`, name=채널 ID, value `collapsed`(기본: 값 없음=펼침).
저장·웹소켓 동기화는 기존 `savePreferences` 경로 그대로라 서버 변경이 없다.
`channel_view.tsx`의 북마크 바 렌더 조건에 접기 preference를 연결하고,
북마크 탭이 이 preference를 토글한다.

**Rationale**: 현재 북마크 바는 접기 기능이 없다(`channel_bookmarks/`에 collapse
관련 코드 없음 — 상시 렌더, [channel_view.tsx:225](../../webapp/channels/src/components/channel_view/channel_view.tsx)).
preference는 임의 category를 허용하므로(`model.Preference.IsValid`는 길이만
검사) 서버 코드 추가 없이 기기 간 동기화까지 얻는다. 기본값 펼침으로 기존
동작 변화 0(SC-006).

**Alternatives considered**:
- localStorage — 기기 간 불일치, 테스트 어려움. 기각.
- 전역(채널 무관) 접기 — 채널마다 북마크 중요도가 달라 채널별이 맞다. 기각.

## R3. 멤버 아바타 스택의 데이터

**Decision**: 인원수는 기존 `memberCount` prop(채널 stats), 아바타는 채널
프로필 셀렉터에서 상위 3명. 프로필이 로드 안 된 채널에서는 마운트 시 기존
프로필 로드 액션을 1회 호출하고, 로드 전에는 인원수만 표시한다(아바타 자리
비움 허용 — FR-006 "최대 3명").

**Rationale**: 멤버 RHS·멘션 자동완성이 쓰는 기존 데이터 경로 재사용. 스택
전용 API를 만들지 않는다.

**Alternatives considered**: 서버에 스택 전용 엔드포인트 — 과잉. 기각.

## R4. ⋮ 더보기와 알림벨의 연결

**Decision**: ⋮는 기존 채널 메뉴(채널명 드롭다운이 여는 ChannelHeaderDropdown
계열)를 그대로 여는 두 번째 트리거다 — 신규 메뉴 없음. 알림벨은 기존 뮤트
경로(`updateChannelNotifyProps`, 현재 뮤트 상태 표시·toggleMute 로직이 헤더에
이미 존재)를 재사용해 토글 버튼으로 노출한다.

**Rationale**: FR-007·FR-008이 "기존과 동일 메뉴·동일 상태"를 요구한다. 로직
중복을 만들지 않아야 두 진입점의 상태가 어긋나지 않는다.

## R5. 탭 줄의 배치 위치

**Decision**: 탭 줄은 헤더 컴포넌트 하단 줄로 channel_header 내부에 둔다
(channel_view가 아니라). 북마크 바는 기존 위치(헤더 아래) 유지.

**Rationale**: 헤더가 "채널명 줄 + 탭 줄" 두 줄 구조가 되는 것이 spec의 그림
그대로이고, DM·GM 분기(FR-009)도 헤더 한 곳에서 처리된다.

## R6. 선행 조건 — webapp 의존성 재설치

**Decision**: 구현 Setup 단계 첫 과제로 `cd webapp && npm ci`를 둔다. 이후
기준선 측정(check-types·접촉 jest)을 수행한다.

**Rationale**: 직전 upstream sync의 React Bootstrap 업그레이드(react-overlays
5.2.1 + patch) 이후 재설치가 누락되어, 현재 로컬은 구 react-bootstrap이
`react-overlays/lib/RootCloseWrapper`를 찾지 못해 앱 전체가 빈 화면이다
(2026-10-09 디버깅으로 확정). 재설치 없이는 어떤 화면 검증도 불가능하다.
