# Research: 좌측 네비게이션 Slack식 재구성

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md)

Technical Context에 NEEDS CLARIFICATION은 없다. 아래는 본체·플러그인 코드를
실제로 읽고 내린 결정이다. 플러그인 탐색은 서브에이전트 조사(파일:줄 근거
포함)로 수행했다.

## R1. 레일 제품 버튼의 데이터 원천

**Decision**: 본체 제품 레지스트리(`useProducts()`가 주는 `ProductComponent[]`)
만 쓴다. 버튼 아이콘은 `switcherIcon`, 라벨은 `switcherText`, 이동은
`switcherLinkURL`. Channels는 레지스트리에 없으므로 고정 버튼으로 앞에 둔다.

**Rationale**: 두 플러그인 모두 이미 등록한다 —
Boards: `registerProduct('/boards', 'product-boards', 'Boards', '/boards', …)`
(okrbest-plugin-boards `webapp/src/index.tsx:313-322`),
Playbooks: `registerProduct('/playbooks', 'product-playbooks', 'Playbooks',
'/playbooks', …)` (okrbest-plugin-playbooks `webapp/src/index.tsx:178-187`).
`switcherIcon`은 compass 아이콘 이름 문자열이고 본체 타입은
`IconGlyphTypes | React.ReactNode`(`types/store/plugins.ts:254`) — 기존
product_menu_item이 문자열이면 `glyphMap[icon]`으로 렌더하는 로직을 재사용한다.
현재 제품 판정은 기존 `useCurrentProductId()`(`utils/products.ts:35`).

**Alternatives considered**:
- 플러그인별 하드코딩 버튼 — 제3의 제품 플러그인이 오면 깨진다. 기각.
- 새 등록 API 추가(플러그인 수정) — SC-005(플러그인 무수정) 위반. 기각.

## R2. 플러그인 쪽 팀 전환 호환성

**Decision**: 플러그인 수정 없이 본체 팀 전환(현재 팀 변경)만으로 충분하다고
판정한다. 제품 화면에서의 팀 전환은 레일 팀 버튼 드롭다운이 담당한다.

**Rationale** (서브에이전트 탐색 근거):
- Boards: MM store를 구독해 팀이 바뀌면 `/boards/team/<id>`로 스스로 이동하고,
  반대 방향도 동기화한다(boards `index.tsx:252-289`). 진입 라우트 `/boards`는
  현재 팀으로 리다이렉트한다(`router.tsx:51,100`).
- Playbooks: 팀 컨텍스트를 URL이 아니라 본체 Redux 현재 팀에서 읽는다
  (`main_body.tsx:34-87`).
- 둘 다 `showTeamSidebar: true`로 제품 화면에서 레일을 띄운다 — 개편된 레일이
  제품 화면에서도 보이므로 팀 버튼·제품 버튼이 항상 접근 가능하다.
- 둘 다 좌측 영역 등록 API(registerLeftSidebar 계열)를 쓰지 않는다 — 레일
  개편이 플러그인 등록과 충돌하지 않는다.

**Alternatives considered**: 제품 화면에서 팀 전환 숨김(채널에서만 전환) —
Boards가 팀별 콘텐츠라 전환 때마다 채널로 나갔다 와야 해 UX 후퇴. 기각.

## R3. 팀 목록 메뉴를 어떻게 공유하나

**Decision**: `components/widgets/team_list_menu/`로 공용 컴포넌트를 신설하고
① 팀명 드롭다운(`sidebar_team_menu.tsx`)의 상단 섹션 ② 레일 팀 버튼의
드롭다운이 같은 컴포넌트를 쓴다. 목록 데이터는 기존 `getMyTeams` 계열 셀렉터 +
저장된 팀 정렬 순서(기존 레일이 쓰던 정렬 로직 `filterAndSortTeamsByDisplayName`
재사용). 전환 동작은 기존 TeamButton이 쓰던 팀 이동 경로를 따른다.

**Rationale**: FR-003/004가 "같은 목록·같은 동작"을 요구한다 — 두 구현이면
갈라진다. 기존 팀명 드롭다운은 Menu(v2) 컴포넌트 기반이므로 공용 컴포넌트는
Menu 하위 항목 형태로 만든다.

**Alternatives considered**: sidebar_team_menu에만 넣고 레일 버튼이 그 메뉴를
원격으로 여는 방식 — 제품 화면에선 sidebar 자체가 없어 불가. 기각.

## R4. product switcher 제거 범위와 관리 메뉴 이전

**Decision**: `global_header/left_controls/product_menu/` 전체를 제거하고,
`product_menu_list.tsx`의 비제품 항목(시스템 콘솔·통합·사용자 그룹(+평가판
안내 모달)·앱 마켓플레이스·앱 다운로드·정보)을 **노출 조건째** 팀명 드롭다운
하단 섹션으로 옮긴다. `left_controls.tsx`에는 history 버튼만 남긴다.

**Rationale**: 스크린샷의 4항목(관리자 도구·통합·사용자 그룹·정보)은 현재
설정에서 보이는 부분집합이고, 실제 목록엔 마켓플레이스·앱 다운로드 등 조건부
항목이 더 있다(`product_menu_list.tsx:124-213`). 4개만 옮기면 설정에 따라
기능이 사라진다 — 전부, 조건 그대로 옮긴다.

**Alternatives considered**: product_menu를 숨기기만 하고 코드 유지 — 죽은
코드와 온보딩 참조가 남는다. 기각.

## R5. 온보딩 투어 정리

**Decision**: product switcher를 가리키는 온보딩 과제/투어 단계를 찾아
(`product_menu.tsx`가 쓰는 `OnboardingTasksName`·`useHandleOnBoardingTaskData`
경로) 해당 단계를 제거한다. 레일로 옮기는 재설계는 하지 않는다(YAGNI —
필요해지면 별도 작업).

**Rationale**: FR-011의 최소 충족. 깨진 포인터만 없으면 된다.

## R6. 기준선·검증 전략 (원칙 I·III)

**Decision**: webapp만 접촉하므로 기준선은 `npm run check-types` 전체 오류
목록(016 때 저장한 30건 목록 재사용 가능 여부는 재측정으로 판정), 접촉 jest
스위트(team_sidebar, sidebar_header, global_header, 신설 컴포넌트) 실행 결과로
잡는다. 삭제되는 `product_menu` 테스트는 "컴포넌트 제거에 따른 삭제"를 tasks에
기록한다(원칙 III의 '조용히 넘어가지 않는다').

**Decision(마감)**: 완료 검증 후 PR을 만들지 않고 멈춘다. 사용자 추가 소기능
요청을 받아 같은 브랜치에서 반영하고, 사용자가 완전 완료를 확인한 뒤 PR을
생성한다(plan.md 마감 절차, 사용자 지시).
