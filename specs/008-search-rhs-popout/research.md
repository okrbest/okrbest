# Research: 검색 결과 RHS 팝아웃

**Feature**: [spec.md](./spec.md)

spec.md에 `[NEEDS CLARIFICATION]` 마커가 없어 정책적 불확실성은 없다. 이 문서는 기존 코드베이스 조사를 바탕으로 한 기술적 접근 결정을 기록한다(참조 upstream 구현: [`2bd143ce`](https://github.com/mattermost/mattermost/commit/2bd143ced747794d40e17bae5654ebc837d085fa)).

## 결정 1: 기존 popout 인프라를 그대로 재사용

- **Decision**: 새로운 창 관리 체계를 만들지 않고, 기존 `rhs_popout`/`popout_windows`/`use_browser_popout`/`popout_controller` 인프라를 확장한다.
- **Rationale**: 이미 thread popout([MM-64749] 등)과 plugin RHS popout([MM-66875][MM-66876], `#34692`)이 동일 인프라 위에 구현돼 있다. 특히 `search_results_header.tsx`는 `#34692`에서 이미 `newWindowHandler` prop과 `PopoutButton`을 지원하도록 반영되어 있음을 현재 코드에서 확인했다 — 이번 기능은 그 prop을 실제로 채워 넣는 첫 소비자가 된다. 즉 헤더 UI 쪽은 변경이 필요 없다.
- **Alternatives considered**: 독립적인 새 창 컴포넌트 체계 — 기각. 부모-자식 postMessage 통신·데스크톱 앱 API 연동(`use_browser_popout`, `DesktopApp`)을 다시 구현해야 해 중복.

## 결정 2: 라우팅 — 채널 식별자를 path param에서 query param으로 전환

- **Decision**: 현재 `/_popout/rhs/:team/:identifier` 단일 라우트를 `/_popout/rhs/:team` 하위의 `/plugin/:pluginId`, `/search` 두 서브라우트로 분리하고, 채널 식별자는 `?channel=` 쿼리 파라미터로 옮긴다.
- **Rationale**: 검색 팝아웃은 채널 컨텍스트가 없을 수도(전역/팀 검색) 있을 수도(고정 메시지·채널 파일) 있어, path param 필수 구조로는 표현할 수 없다. upstream 리팩터를 그대로 채택.
- **Alternatives considered**: 채널 없는 경우를 위한 별도 라우트 추가 — 기각(라우트 조합이 늘어나 유지보수 부담 증가).
- **영향 범위**: `popout_controller.tsx`(최상위 라우트 패턴 단순화), `rhs_popout.tsx`(서브라우트 추가 + query param 파싱), `plugins/registry.ts`(플러그인 팝아웃 리스너 타입에서 `channelName` optional화 — 채널 없는 팝아웃도 유효해졌으므로).

## 결정 3: `SearchResults` 프레젠테이션 컴포넌트를 그대로 재사용

- **Decision**: 새 `rhs_search_popout` 컴포넌트는 기존 `components/search_results`의 `SearchResults`를 그대로 사용하고, URL 쿼리 파라미터 ↔ redux 검색 상태(`updateSearchTerms`, `updateSearchTeam`, `updateRhsState` 등 기존 `actions/views/rhs` 액션) 동기화만 담당하는 얇은 wrapper로 작성한다.
- **Rationale**: 검색 결과 렌더링·페이지네이션·필터 로직 중복 방지 — 팝아웃 창과 원래 RHS가 동일한 하위 컴포넌트를 공유해 동작이 어긋나지 않게 한다.

## 결정 4: 검색 액션을 `use_search_results_actions` 훅으로 추출

- **Decision**: 현재 `search/index.tsx`의 `mapDispatchToProps`에 있는 검색 결과 조작 액션(검색어 갱신, 대상 팀 변경, 추가 결과 로드, 메시지/파일 필터 전환)을 재사용 가능한 훅(`components/common/hooks/use_search_results_actions`)으로 추출한다.
- **Rationale**: 기존 RHS 내장 검색과 신규 팝아웃 검색이 동일한 액션 구현을 공유하도록 해 코드 중복과 동작 불일치를 방지한다.
- **영향 범위**: `search/index.tsx`, `search/search.tsx`, `search/types.ts`가 훅 추출에 맞춰 축소된다(현재 574줄인 `search.tsx`의 상당 부분이 이 리팩터 대상).

## 결정 5: 우리 자체 "공개 채널 멤버십 없이 검색" 기능(007)과의 관계

- **Decision**: [007](../007-public-channel-search-access/spec.md)에서 추가한 검색 접근 범위 확장은 서버 API(`SearchPosts`) 레벨에서 처리된다. 이 기능(008)은 서버가 반환한 결과를 그대로 렌더링하기만 하며, 팝아웃 전용 접근 검증 로직을 별도로 추가하지 않는다.
- **Rationale**: 관심사 분리 — 검색 접근 범위는 서버가 단일하게 결정하고, 팝아웃은 순수 클라이언트 UI 기능이다. 코드 레벨 조사 결과 두 기능이 건드리는 파일도 겹치지 않는다(007은 `mattermost-redux/actions/search.ts`, `post/index.tsx`의 null 가드; 008은 `search/*`, `search_results/*`, `rhs_search_popout/*` 신규 컴포넌트 — `post/index.tsx`만 공통 접촉하나 서로 다른 코드 영역).
- **Alternatives considered**: 팝아웃에서 별도 접근 재검증 — 기각(중복 로직, 서버·클라이언트 정합성이 깨질 위험).

## 결정 6: i18n — en/ko 동시 반영

- **Decision**: upstream이 추가한 5개 영문 메시지 키(`rhs_search_popout.title.channel_files/mentions/pinned/saved/search`)를 `en.json`에 원문 그대로 반영하고, 대응하는 한국어 번역을 같은 구현 커밋에서 `ko.json`에 함께 추가한다.
- **Rationale**: 이 기능은 `/speckit-sync`의 cherry-pick/adapt가 아니라 spec 파이프라인으로 진행되는 신규 개발이므로 constitution 원칙 V의 sync 예외가 적용되지 않고, 원문 그대로(en/ko 동시 갱신)가 적용된다.

## 결정 7: 라이선스/리브랜드 영향 없음

- **Decision**: 이 기능이 접촉하는 모든 파일은 `webapp/channels/`(Apache-2.0 라이선스 존)에 속하며 `server/enterprise/` 등 제한 라이선스 구역을 건드리지 않는다. 신규 파일에는 upstream과 동일한 `Copyright (c) 2015-present Mattermost, Inc.` 헤더를 그대로 유지한다.
- **Rationale**: constitution 원칙 IV 준수 확인.
