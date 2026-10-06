# Phase 0 연구: 읽지 않은 항목 모아보기

브레인스토밍 단계에서 코드베이스 전수 탐사(전역 뷰 패턴 1건, unread 데이터
인프라 1건)를 마쳤다. 그 결과를 결정 10건으로 고정한다. 미해결
NEEDS CLARIFICATION 없음.

경로 약칭 — `CS` = `webapp/channels/src`,
`MR` = `webapp/channels/src/packages/mattermost-redux/src`.

## 결정 1 — 화면 골격: 전역 페이지 뷰 패턴

**Decision**: Threads·Drafts·Recaps가 쓰는 전역 페이지 뷰 패턴을 따른다.
`LhsPage.Unreads` 추가(`CS/types/store/lhs.ts`), `center_channel.tsx`에
`/:team/unreads` Route 추가, 사이드바 static 영역에 링크 컴포넌트 추가,
페이지는 마운트 때 `selectLhsItem` + `suppressRHS`, 언마운트 때 `unsuppressRHS`.

**Rationale**: 저장소에 세 번 반복된 검증 패턴이라 추가 설계 비용이 없다.
FR-002(고유 주소, 새로고침·뒤로가기 유지)를 라우터가 그대로 보장한다.

**Alternatives considered**: RHS 패널(멘션·저장됨처럼) — 화면이 좁아 채널별
그룹 + 본문 소비에 부적합, Slack 벤치마크(전용 화면)와도 다르다. 모달 —
메시지 상호작용(스레드 열기 등)과 충돌한다. 기각.

## 결정 2 — 메시지 렌더링: PostComponent 직접 사용

**Decision**: `CS/components/post`(PostComponent)를 `location=SEARCH`로 직접
렌더링한다. search_results(`CS/components/search_results/`)가 선례다.

**Rationale**: `PostList`/`PostView`는 (1) 라우트의 채널 식별자를 전제해
`/unreads` 경로에서 로딩 화면에 갇히고, (2) 마운트 때 `markChannelAsRead`를
자동 호출해 FR-007(보기만으로 읽음 금지)을 위반한다
(`post_list.tsx:273,303`). PostComponent는 부작용 없이 호버 액션(반응·스레드·
저장)까지 제공해 FR-006을 공짜로 충족한다.

**Alternatives considered**: PostList 재사용 + 자동 읽음 비활성 prop 추가 —
upstream 핵심 파일 수정 면적이 커진다. ThreadViewer — 스레드 루트 전제라
일반 채널 메시지 나열에 맞지 않다. 기각.

## 결정 3 — 그룹 카드: Drafts 부품 재사용

**Decision**: 카드 컨테이너는 `Panel`/`PanelHeader`
(`CS/components/drafts/panel/`), 그룹 머리글의 채널 표시는 `DraftTitle`
(`CS/components/drafts/draft_title/`)을 그대로 쓴다. 머리글에 접기 토글,
"읽음으로 표시", "채널 열기" 액션을 단다.

**Rationale**: DraftTitle이 FR-004(공개/비공개 아이콘, DM 아바타, GM 인원수)를
이미 전부 구현했고 props가 `channel`·`userId`뿐이라 그대로 꽂힌다.

**Alternatives considered**: ThreadItem 마크업 복제 — `UserThread` 타입에
결합되어 분리 비용이 더 크다. 신규 카드 작성 — 재사용 원칙 위배. 기각.

## 결정 4 — 리스트: v1은 일반 스크롤, 가상화는 교체 가능 구조로

**Decision**: v1은 search_results처럼 일반 스크롤 컨테이너에 그룹 카드를
나열한다. 그룹 목록 컴포넌트를 분리해 두어, 필요해지면
`VirtualizedDraftList` 패턴(AutoSizer + VariableSizeList + ResizeObserver)으로
내부만 교체할 수 있게 한다.

**Rationale**: 읽지 않은 채널은 실사용에서 수십 개 수준이고, 채널당 표시
메시지도 조회 한도로 바운드된다(결정 5). `data_prefetch`도 20개 이하를
전제한다. 가상화를 먼저 넣으면 접기/펼치기·가변 높이 관리 복잡도만 커진다.

**Alternatives considered**: 처음부터 VirtualizedDraftList — YAGNI. 기각.

## 결정 5 — 포스트 적재: data_prefetch 적중 + loadUnreads 보충

**Decision**: 그룹의 메시지는 멤버십 `last_viewed_at` 이후 포스트로 선별한다.
store 적중분은 그대로 쓰고(`data_prefetch`가 미읽음 채널을 선로딩), 부족한
채널만 `loadUnreads(channelId)`(`CS/actions/views/channel.ts:259` →
`getPostsUnread` API)를 호출한다. 채널당 표시 한도는 `getPostsUnread`의 기존
조회 한도를 따르고, 초과분은 그룹 머리글의 채널 이동으로 잇는다(스펙 Edge).

**Rationale**: 신규 서버 API 없이 기존 적재 경로만으로 SC-002(1초 내 첫
목록)를 달성한다. 대부분 store 적중이라 네트워크 왕복이 적다.

**Alternatives considered**: 전 채널 일괄 재조회 — 중복 호출·낭비. 신규
집계 API — 서버 변경 금지 제약 위배. 기각.

## 결정 6 — 목록 안정성: 진입 시점 스냅샷 + 새 항목 배너

**Decision**: 화면 진입 시 `getUnreadChannels` + `sortUnreadChannels` 결과를
컴포넌트 상태로 스냅샷한다. 이후 생기는 새 미읽음 채널은 목록에 즉시 넣지
않고 "새 항목 N개" 배너로 알리며, 배너 클릭 때 스냅샷을 다시 뜬다(FR-013).
읽음 처리된 그룹 제거와 다른 기기 읽음 반영은 스냅샷과 무관하게 즉시 따른다.

**Rationale**: 실시간 store를 그대로 구독하면 새 메시지마다 목록이 재배열돼
소비 흐름이 끊긴다. Slack의 동기화 아이콘과 같은 해법이다. 기존
`lastUnreadChannel`(채널 전환 시 직전 미읽음 채널 유지) 관례와 같은 계열이다.

**Alternatives considered**: store 직결 실시간 목록 — 목록 널뛰기. 전역
상태로 스냅샷 보관 — 화면 생애와 같으므로 로컬 상태로 충분. 기각.

## 결정 7 — 읽음 처리: readMultipleChannels 단일 경로

**Decision**: 그룹별 읽음(FR-008)·전체 읽음(FR-009)·Esc(FR-010) 모두
`readMultipleChannels(ids)`(`MR/actions/channels.ts:764` →
`POST /channels/members/me/mark_read`)로 처리한다.

**Rationale**: 사이드바 UNREADS 그룹·카테고리 메뉴·Recaps가 쓰는 검증된 단일
경로다. 응답이 websocket `MultipleChannelsViewed` 이벤트로 전 클라이언트에
전파되어 FR-008의 배지 즉시 갱신과 US2-4(다른 기기 반영)가 따라온다.

**Alternatives considered**: `markChannelAsRead` 반복 호출 — 채널 수만큼
왕복. 기각.

## 결정 8 — 키보드 진입: 기존 사이드바 내비게이션 편입 (스펙 FR-011 수정 반영)

**Decision**: 전용 전역 단축키를 만들지 않는다. `getVisibleStaticPages`
(`CS/selectors/lhs.ts`)에 unreads 항목을 추가해 기존 Alt+↑/↓ 사이드바 이동과
`switchToLhsStaticPage` 경로에 편입한다. 그룹 간 이동은 ↑/↓, 읽음 처리는
Esc(FR-010)로 SC-006(키보드 전용 완주)을 충족한다.

**Rationale**: Slack 패리티 후보였던 Ctrl+Shift+A는 이 제품에서 **설정
열기**에(`keyboard_shortcuts.ts:189`), Ctrl+Shift+U는 **읽지 않음 필터
토글**에(`channel_filter.tsx:55`) 이미 배정되어 있다. 기존 단축키 재배치는
사용자 습관 파괴라 기각. 남은 조합은 브라우저 예약키와 겹치는 것이 많다.

**Alternatives considered**: Ctrl+Shift+A 탈취(설정 재배치) — 기각.
미사용 조합 신설(예: Ctrl+Shift+G) — 브라우저 충돌 검증 비용 대비 효용이
낮아 v2 후보로 미룬다.

## 결정 9 — 기본 꺼짐(FR-016): 코드 무변경, 확인·기록으로 충족

**Decision**: 코드를 바꾸지 않는다. 근거를 명세 산출물에 기록하고, 운영
서버 설정값 점검을 quickstart 검증 항목에 넣는다.

**Rationale**: 사이드바 UNREADS 그룹 표시는
`shouldShowUnreadsCategory`(`MR/selectors/entities/preferences.ts:220`)가
사용자 preference(`sidebar_settings/show_unread_section`) → 구 preference →
서버 설정 순으로 결정하고, 서버 `ExperimentalGroupUnreadChannels` 기본값은
`disabled`다(`server/public/model/config.go:877-882`). 즉 신규 사용자는 이미
기본 꺼짐이고, 직접 켠 사용자는 preference가 우선이라 그대로 유지된다 —
US4의 세 시나리오가 현행 동작으로 전부 성립한다. admin console에 이 설정
화면이 없으므로 운영 config가 `default_on`으로 바뀌어 있을 가능성만 배포
점검으로 막는다.

**Alternatives considered**: 설정 토글 제거 — 켠 사용자 보호(FR-016) 위배.
서버 기본값 코드 고정 강화 — 이미 기본 `disabled`라 불필요. 기각.

## 결정 10 — upstream 마찰 최소화 전략

**Decision**: 신규 코드는 `components/unreads_view/`와
`components/sidebar/unreads_link/` 두 디렉터리에 격리한다. upstream 파일
수정은 다음 7곳의 삽입으로 한정하고 `docs/upstream-adapted-divergences.md`에
기록한다.

| upstream 접촉 지점 | 수정 |
|---|---|
| `center_channel.tsx` | Route 1개 삽입 |
| `root.tsx` `doesRouteBelongToTeamControllerRoutes` | 정규식에 `unreads` 추가 |
| `sidebar_list.tsx` | 링크 1줄 삽입 (static 영역 최상단) |
| `types/store/lhs.ts` + `selectors/lhs.ts` | enum 값·정적 페이지 항목 추가 |
| `unreads_status_handler` | 탭 제목 분기 추가 |
| `mobile_channel_header` | 제목 분기 추가 |
| `sidebar_mentions_link`·`sidebar_saved_posts_link` (포크 커스텀) | `matchPath`에 unreads 추가 |

스타일은 `sass/okrbest/_overrides.scss`에만 추가한다.

**Rationale**: 014와 같은 전략 — 값 삽입은 충돌 면적이 작고, 신규 구조는
디렉터리 격리로 머지에서 비켜 선다.

**Alternatives considered**: upstream 컴포넌트(Drafts 등) 내부 확장 — 머지
충돌 면적 확대. 기각.
