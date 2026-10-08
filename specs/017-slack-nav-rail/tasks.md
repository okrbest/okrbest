# Tasks: 좌측 네비게이션 Slack식 재구성

**Input**: Design documents from `/specs/017-slack-nav-rail/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/nav-ui.md](./contracts/nav-ui.md)

**Tests**: 필수 — constitution 원칙 III. 각 스토리에서 테스트 과제를 구현보다
먼저 수행하고 구현 전 실패 출력을 남긴다.

**Organization**: 스토리별 단계. **US1·US2는 같은 변경에서 함께 배포한다**(팀
버튼 제거와 대체 수단이 분리 불가) — 단계는 나누되 둘 다 끝나기 전에는 중간
상태(팀 버튼·제품 버튼 공존)를 허용한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 수행 가능(다른 파일, 미완료 과제 의존 없음)
- **[Story]**: 소속 사용자 스토리 (US1, US2, US3)

## Phase 1: Setup

- [x] T001 `master`에서 작업 브랜치 `017-slack-nav-rail` 생성. 워킹트리에 대기 중인 `.gitignore` 변경(.playwright-mcp/ 추가)을 이 기능 첫 커밋에 포함한다(사용자 지시)
- [x] T002 [P] 웹앱 기준선 저장 — `cd webapp && npm run check-types` 오류 목록과 접촉 jest 스위트(`src/components/team_sidebar/`, `src/components/sidebar/sidebar_header/`, `src/components/global_header/`) 결과를 `specs/017-slack-nav-rail/baseline-webapp.txt`(+`baseline-webapp-types-errors.txt`)에 기록. 서버 기준선은 불필요(서버 변경 0)

---

## Phase 2: Foundational

**Purpose**: 레일(US2)과 팀명 드롭다운(US2)이 공유하는 팀 목록 메뉴. 공유
컴포넌트라 먼저 만든다.

- [x] T003 공용 팀 목록 메뉴 테스트 추가 — `webapp/channels/src/components/widgets/team_list_menu/team_list_menu.test.tsx`(신설): 내 팀 목록 렌더(저장된 정렬 순서), 현재 팀 체크 표시, 팀 클릭 시 전환 액션 호출, 가입/생성 항목의 권한 조건 노출([contracts](./contracts/nav-ui.md) 팀 목록 메뉴 계약). 구현 전 실패 출력 저장
- [x] T004 공용 팀 목록 메뉴 구현 — `webapp/channels/src/components/widgets/team_list_menu/`(신설): Menu 위젯 기반, `getMyTeams`+기존 정렬 로직(`filterAndSortTeamsByDisplayName`) 재사용, 전환은 기존 TeamButton의 팀 이동 경로 재사용 (T003 의존)
- [x] T005 [P] 신규 i18n 키 — `webapp/channels/src/i18n/en.json`·`ko.json`: 팀 목록 섹션 제목(`sidebarLeft.teamMenu.myTeams` 등) 동시 추가 (원칙 V)

**Checkpoint**: TeamListMenu 단독 렌더·전환 검증 가능

---

## Phase 3: User Story 1 - 레일에서 제품을 한 번에 오간다 (Priority: P1)

**Goal**: 레일에 Channels+등록 제품 버튼 세로 나열, 현재 제품 강조, 1클릭 이동.

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 1 — 플러그인
켜짐/꺼짐 서버에서 버튼 구성·강조·이동 확인.

### Tests for User Story 1 (구현 전 실패 출력 필수)

- [x] T006 [P] [US1] 제품 버튼 테스트 — `webapp/channels/src/components/team_sidebar/components/rail_product_button.test.tsx`(신설): 문자열 아이콘(glyphMap)·ReactNode 아이콘 렌더, `switcherText` 라벨, 활성 강조 클래스, 클릭 시 `switcherLinkURL` 이동, aria-label 존재. 실패 출력 저장
- [x] T007 [P] [US1] 레일 개편 테스트 — `webapp/channels/src/components/team_sidebar/team_sidebar.test.tsx`: 제품 레지스트리에 Boards·Playbooks가 있으면 [Channels, Boards, Playbooks] 순 렌더 + 현재 제품 강조, 레지스트리 비면 Channels만, 하단 프로필 버튼·플러그인 슬롯 유지(FR-009). 실패 출력 저장

### Implementation for User Story 1

- [x] T008 [US1] 제품 버튼 구현 — `webapp/channels/src/components/team_sidebar/components/rail_product_button.tsx`(신설): [data-model](./data-model.md) `RailProductButton` 계약대로 (T006 의존)
- [x] T009 [US1] 레일 개편 1차 — `team_sidebar.tsx`에 제품 버튼 섹션 추가(`useProducts()` 연계, Channels 고정 버튼 — 목적지는 기존 product switcher의 Channels 항목이 쓰던 계산 로직을 그대로 재사용해 동작 변화 0), 레일 스타일(아이콘+라벨 세로 나열) 갱신. 팀 버튼 나열은 이 시점엔 유지(US2에서 제거) (T007·T008 의존)
- [x] T010 [P] [US1] i18n — Channels 버튼 라벨·레일 영역 aria 문구 en/ko 동시 추가 (원칙 V)

**Checkpoint**: 레일에서 제품 1클릭 전환 동작 (팀 버튼은 아직 공존)

---

## Phase 4: User Story 2 - 팀을 드롭다운에서 고른다 (Priority: P1)

**Goal**: 레일 상단 현재 팀 버튼 + 팀명 드롭다운 "내 팀" 섹션으로 팀 전환.
팀 버튼 나열 제거 — **이 단계가 끝나야 US1과 함께 배포 가능 상태가 된다.**

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 2 — 두 진입점
전환, 제품 화면에서 팀 전환, 권한별 가입/생성 노출.

### Tests for User Story 2 (구현 전 실패 출력 필수)

- [x] T011 [P] [US2] 레일 팀 버튼 테스트 — `webapp/channels/src/components/team_sidebar/components/rail_team_button.test.tsx`(신설): 현재 팀 아바타/이니셜 표시, aria-label에 팀 이름, 클릭 시 팀 목록 메뉴 오픈. 실패 출력 저장
- [x] T012 [P] [US2] 팀명 드롭다운 섹션 테스트 — `webapp/channels/src/components/sidebar/sidebar_header/sidebar_team_menu.test.tsx`: 상단 "내 팀" 섹션 렌더(TeamListMenu), 기존 팀 관리 항목 유지. 실패 출력 저장

### Implementation for User Story 2

- [x] T013 [US2] 레일 팀 버튼 구현 + 팀 버튼 나열 제거 — `rail_team_button.tsx`(신설, TeamListMenu 연결), `team_sidebar.tsx`에서 팀 버튼 나열·드래그 정렬 제거(react-beautiful-dnd 제거 범위는 team_sidebar.tsx 내 import·사용부로 한정 — 다른 사용처 불변 확인), 미사용이 된 `team_button.tsx` 처리(다른 사용처 없으면 테스트와 함께 삭제, 사유 기록). 완료 조건: Boards·Playbooks 화면에서 레일 팀 버튼으로 팀 전환 수동 확인(FR-008, quickstart 시나리오 2.3–2.4 선행 점검) (T004·T011 의존)
- [x] T014 [US2] 팀명 드롭다운 확장 — `sidebar_team_menu.tsx` 상단에 TeamListMenu 섹션 추가 (T004·T012 의존)

**Checkpoint**: US1+US2 동반 완성 — 배포 가능한 최소 단위. quickstart 시나리오
1·2·4 수동 확인 가능

---

## Phase 5: User Story 3 - 관리 메뉴가 팀명 드롭다운으로 옮겨진다 (Priority: P2)

**Goal**: product switcher 제거, 관리 항목을 노출 조건째 팀명 드롭다운으로 이전.

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 3 — 관리자/일반
계정 노출 비교, 상단 좌측에서 버튼 부재 확인.

### Tests for User Story 3 (구현 전 실패 출력 필수)

- [x] T015 [P] [US3] 관리 섹션 테스트 — `sidebar_team_menu.test.tsx`: 관리자에게 시스템 콘솔·통합·사용자 그룹·정보 항목 노출, 일반 사용자에게 권한 항목 미노출, 각 항목의 이동 대상이 기존과 동일([contracts](./contracts/nav-ui.md) ③ 섹션). 실패 출력 저장
- [x] T016 [P] [US3] 상단 좌측 테스트 — `webapp/channels/src/components/global_header/left_controls/left_controls.test.tsx`(없으면 신설): product_menu 미렌더(`#product_switch_menu` 부재), history 버튼 유지. 실패 출력 저장

### Implementation for User Story 3

- [x] T017 [US3] 관리 항목 이전 — `product_menu_list.tsx`의 비제품 항목(시스템 콘솔·통합·사용자 그룹(+평가판 모달)·마켓플레이스·앱 다운로드·정보)을 `sidebar_team_menu.tsx` 하단 섹션으로 이식. 노출 조건·이동 대상·`navbar_dropdown.*` i18n 키 그대로 (T015 의존, [research.md](./research.md) R4)
- [x] T018 [US3] product switcher 제거 — `left_controls.tsx`에서 ProductMenu 제거, `product_menu/` 디렉터리·테스트·스냅샷 삭제(원칙 III: 컴포넌트 제거에 따른 테스트 삭제 사유를 커밋에 기록), 온보딩 투어의 product switcher 참조(`OnboardingTasksName` 관련 단계) 정리(FR-011) (T016·T017 의존)
- [x] T019 [US3] 잔존 참조 정리 — `product_switch_menu`·`setProductMenuSwitcherOpen`·`isSwitcherOpen` 등 전역 검색으로 죽은 액션/셀렉터(`actions/views/product_menu`, `selectors/views/product_menu`)와 import 제거 (T018 의존)

**Checkpoint**: 전 스토리 완료

---

## Phase 6: Polish & 완료 검증

- [x] T020 [P] 스냅샷·주변 테스트 정리 — 레일 변경으로 갱신이 필요한 기존 스냅샷(`team_sidebar`, `global_header` 계열)을 의도 확인 후 갱신. 무관 스냅샷 변경이 없음을 diff로 확인

### 완료 검증 (고정 — 지우지 않는다)

- [x] T021 품질 게이트 — `cd webapp && npm run check && npm run check-types && npm run test`(접촉 스위트)를 돌리고 실패 목록이 T002 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [x] T022 종단 검증 — 빌드·기동 후 [quickstart.md](./quickstart.md) 시나리오 1~5를 **실제 환경에서**(플러그인 활성 서버, 두 계정) 훑고 절별 통과·실패를 기록한다. 못 돌리면 `미실행`으로 적는다
- [x] T023 SC 검증 — [spec.md](./spec.md) SC-001~SC-006 각각을 **실측값**으로 확인한다 (추정 금지)
- [ ] T024 **PR 보류 게이트 (사용자 지시 — 지우지 않는다)** — T021~T023 증거와 함께 완료를 보고하되 **PR을 생성하지 않는다**. 사용자의 추가 소기능 요청을 접수해 같은 브랜치에서 반영(필요 시 테스트·게이트 재실행)하고, 사용자가 "완전 완료"를 확인한 뒤에만 PR 생성 → 리뷰 → rebase 머지로 진행한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 즉시 시작
- **Phase 2 (TeamListMenu)**: T001 이후. US2(T013·T014)를 막는다
- **Phase 3 (US1)**: Phase 1 이후 (Phase 2와 병행 가능 — 서로 다른 파일)
- **Phase 4 (US2)**: Phase 2 완료 + T009(레일 1차) 이후. **US1+US2가 모두 끝나야 배포 가능**
- **Phase 5 (US3)**: Phase 4 이후 권장(팀명 드롭다운 구조가 T014로 확정된 뒤 T017 이식)
- **Phase 6**: 전 스토리 완료 후. T024는 항상 마지막

### Parallel Opportunities

- T002 ∥ (T003, T006, T007 테스트 선행 작성)
- T003 ∥ T006 ∥ T007 ∥ T011 ∥ T012 ∥ T015 ∥ T016 (전부 다른 파일의 테스트)
- Phase 2(T003→T004)와 Phase 3(T006→T008→T009)은 트랙 병행 가능
- T005 ∥ T010 (i18n — 같은 파일이므로 실제로는 순차 권장, 충돌 주의)

## Parallel Example: US1 + Foundational 병행

```bash
# 테스트 선행 (병렬):
Task: "TeamListMenu 테스트 — widgets/team_list_menu/team_list_menu.test.tsx"
Task: "RailProductButton 테스트 — team_sidebar/components/rail_product_button.test.tsx"
Task: "TeamSidebar 개편 테스트 — team_sidebar/team_sidebar.test.tsx"

# 구현 (트랙 병행):
Task: "T004 TeamListMenu (widgets 트랙)"
Task: "T008→T009 레일 제품 버튼 (team_sidebar 트랙)"
```

## Implementation Strategy

**배포 최소 단위 = US1+US2 묶음.** US1만으로는 팀 버튼 공존의 과도기 UI라
체크포인트 검증용이지 배포 상태가 아니다. US3(switcher 제거)까지가 이 기능의
완성형이고, 그 뒤 T024에서 멈춰 사용자 추가 작업을 기다린다.

커밋은 작업 단위로 쌓되(브랜치 내 자유), **PR은 T024 게이트를 통과한 뒤에만**
만든다. Conventional Commits(`feat:`) + 한국어 본문.

## Notes

- 서버·플러그인 저장소는 건드리지 않는다 (SC-005)
- 삭제하는 테스트(product_menu 계열)는 "대상 컴포넌트 제거"를 사유로 기록 — 조용히 지우지 않는다 (원칙 III)
- 이전되는 관리 항목은 기존 `navbar_dropdown.*` i18n 키 재사용 — 신규 번역 금지(문구 변경은 범위 밖)
- 테스트가 첫 실행에 통과하면 구현을 되돌려 실패를 확인하거나 `미검증` 표기 (원칙 III)

## 완료 검증 결과 (2026-10-08, /speckit-implement 실행 기록)

### 품질 게이트 (T021) — 기준선 diff

| 게이트 | 기준선 | 최종 | 판정 |
|---|---|---|---|
| `npm run check-types` | 기존 오류 31건 (`baseline-webapp-types-errors.txt`) | 동일 31건 — diff 결과 TYPES-DIFF-CLEAN | 신규 0 — 통과 |
| jest 접촉 스위트 (team_sidebar·sidebar_header·global_header·team_list_menu·onboarding_tasks) | 15스위트 92건 통과 | 14스위트 55건 통과 (product_menu 4스위트·team_button 1스위트 삭제, 신규 4스위트 추가) | 실패 0 — 통과 |
| eslint (접촉 영역 전체) | — | 0 errors (경고 12건은 기존 패턴 any·todo) | 통과 |
| `npm run i18n-extract:check` | — | exit 0 | 통과 |

- 삭제한 테스트와 사유: product_menu 계열 전부(대상 컴포넌트 제거),
  team_button.test(레일 팀 버튼 나열 제거로 컴포넌트 삭제), sidebar_team_menu의
  클라우드 요금제 "팀 생성 제한 표시" 테스트 1건(공용 항목으로 대체하며 클라우드
  전용 UI를 의도적으로 미이식 — 셀프호스트 포크에서 죽은 기능).
- TDD 중 잡은 결함: 공용 팀 목록이 제품 화면에서 URL 이동으로 전환해 Boards를
  이탈 — `useCurrentProduct()`로 팀 객체 전달 분기(RED 테스트 추가 후 수정,
  브라우저 재실측으로 확인).

### 종단 검증 (T022) — 로컬 dev 서버 + Playwright 2세션 실주행

| 시나리오 | 결과 | 증거 |
|---|---|---|
| 1. 제품 전환 | 통과 | 레일 [팀 버튼, Channels, Boards] 렌더·활성 강조, Boards 1클릭 이동(실보드 렌더), Channels 복귀(전환된 팀 유지), product switcher 부재. 플러그인 없는 상태(활성화 전)에서 Channels만 렌더도 실측 |
| 2. 팀 전환 | 통과 | 팀명 드롭다운·레일 팀 버튼 모두 "내 팀"(현재 팀 체크)+가입/생성, **Boards 안에서 팀 전환 시 Boards에 머문 채 새 팀 보드 렌더**(FR-008, 플러그인 무수정) |
| 3. 관리 메뉴 이전 | 통과 | 관리자: 관리자 도구·통합·플러그인 마켓플레이스·정보 노출(사용자 그룹은 서버 설정상 비활성 — 조건부 정상). 일반 사용자: 관리 항목 0건, 정보만 노출 |
| 4. 기존 동작 보존 | 통과 | 프로필 버튼 최하단 유지, peek 동작은 단위 테스트(기존 2건) 통과로 확인 |
| 5. 접근성 | 통과(범위 내) | 신설 요소 전원 이름 보유(팀 버튼 aria-label ko 적용 "현재 팀: 샘플. 팀 전환", 제품 버튼 가시 라벨). 이름 없는 버튼 3개는 기존 todo 플러그인 슬롯 산출물 — 범위 밖, 기록만 |

- Playbooks는 이 dev 서버에 미설치(빌드 산출물 없음)라 종단은 Boards로
  실측했다. 두 플러그인은 동일한 registerProduct 경로를 쓰며, 2개 제품 나열은
  team_sidebar 단위 테스트로 검증했다.
- 검증 중 focalboard 번들 404(기존 환경 문제)는 플러그인 재활성화로 해소.

### SC 검증 (T023) — 실측값

| SC | 기준 | 실측 | 판정 |
|---|---|---|---|
| SC-001 | 제품 전환 1클릭 | 레일 Boards 버튼 클릭 1번 → 이동 | 통과 |
| SC-002 | 팀 전환 2클릭 | 팀 버튼 → 팀 항목 (채널·Boards 양쪽) | 통과 |
| SC-003 | 강조=현재 제품 100% | 채널에서 Channels active, Boards에서 Boards active 실측 | 통과 |
| SC-004 | 권한 없는 노출 0건 | 일반 사용자 드롭다운에 관리 항목 0건 | 통과 |
| SC-005 | 플러그인 무수정 | okrbest-plugin-boards·playbooks `git status` 변경 0건 | 통과 |
| SC-006 | 이름 없는 버튼 0건 | 신설 요소 0건 (기존 플러그인 슬롯 3건은 범위 밖 기록) | 통과 |

### 남긴 보고 (별도 작업)

- i18n extract가 upstream sync 잔재(en.json 드리프트)를 함께 정리했다 —
  문구가 바뀐 en 키 2건(keep_remove_flag_content_modal.*)과 신규 en 키 2건
  (texteditor.rewrite.placeholder.rewriting, webapp.mattermost.feature.start_call)
  의 ko 번역이 필요하다(원칙 V sync 예외에 따라 보고로 남김).
