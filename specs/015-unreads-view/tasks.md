# Tasks: 읽지 않은 항목 모아보기

**Input**: `specs/015-unreads-view/` 설계 문서 (plan.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md)

**Tests**: 포함 — constitution 원칙 III이 요구한다. 테스트 과제는 **구현 전 실패
출력**을 남긴 뒤에만 완료로 표시한다. 시각 배치 등 단위 테스트가 불가능한
과제는 해당 과제 옆에 사유를 적고 quickstart 실주행이 대신한다.

**Organization**: 사용자 스토리별 단계. 각 스토리는 독립 구현·검증 가능.

경로 약칭 — `CS` = `webapp/channels/src`. i18n을 만지는 과제는 원칙 V에 따라
`CS/i18n/en.json`과 `CS/i18n/ko.json`을 **같은 변경에서** 수정한다.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: 기준선 확보 (원칙 I — 구현 전 필수)

- [X] T001 구현 전 기준선 저장 — `webapp/`에서 `npm run check`·`npm run check-types`·`npm run test`를 돌려 실패 목록을 `specs/015-unreads-view/baseline.md`에 기록한다 (깨끗하면 "실패 0건"으로 기록)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 라우트·LHS 식별자 등 모든 스토리가 딛는 골격

**⚠️ CRITICAL**: 이 단계 전에는 어떤 스토리도 시작할 수 없다

- [X] T002 [P] `LhsPage.Unreads = 'unreads'` 추가 — `CS/types/store/lhs.ts`
- [X] T003 페이지 셸 RTL 테스트 작성(실패 확인) — 마운트 때 `selectLhsItem(Page, Unreads)`·`suppressRHS` 디스패치, 언마운트 때 `unsuppressRHS` 검증. `CS/components/unreads_view/unreads_view.test.tsx`
- [X] T004 페이지 셸 구현으로 T003 통과 — `CS/components/unreads_view/{index.ts,unreads_view.tsx}` (화면 제목 + 빈 본문. 문구 키는 en/ko 동시 추가)
- [X] T005 라우트 등록 — `CS/components/channel_layout/center_channel/center_channel.tsx`에 `/:team/unreads` Route 삽입(drafts 아래), `CS/components/root/root.tsx`의 `doesRouteBelongToTeamControllerRoutes` 정규식에 `unreads` 추가. 접속 확인은 T004 테스트에 라우트 케이스로 포함. `center_channel/index.ts`의 lastChannelPath 복원 대상에 unreads가 포함되지 않음(Drafts와 동일 정책)을 확인만 한다 — 수정 없음

**Checkpoint**: `/:team/unreads` 직접 접속 시 빈 셸이 뜬다

---

## Phase 3: User Story 1 - 읽지 않은 메시지를 한 화면에서 확인한다 (Priority: P1) 🎯 MVP

**Goal**: 사이드바 메뉴 → 채널별 그룹 + 메시지 본문을 한 화면에서 소비.
보기만으로는 아무것도 읽음 처리되지 않는다.

**Independent Test**: 채널 3곳에 미읽음을 만들고, 메뉴 클릭 1번으로 세 그룹과
본문이 나오는지·떠난 뒤에도 배지가 그대로인지 확인 (quickstart SC-001·SC-003).

### Tests for User Story 1 (구현 전 실패 확인 필수)

- [ ] T006 [P] [US1] 스냅샷 훅 테스트 — 진입 시점 `getUnreadChannels`+`sortUnreadChannels` 고정(멘션 우선), `lastViewedAt` 고정, 이후 store 변화에 목록 불변, 부족 채널만 `loadUnreads` 호출. 그룹 유무가 `getUnreadChannels` 결과와 일치함을 단언한다(FR-015 — 사이드바 배지와 같은 원천). `CS/components/unreads_view/use_unreads_snapshot.test.ts`
- [ ] T007 [P] [US1] 그룹 카드 테스트 — 채널 유형별 머리글(DraftTitle), `lastViewedAt` 이후 포스트만 렌더, 본문 적재 실패 시 안내, 채널 이동 동작. `CS/components/unreads_view/unread_channel_group.test.tsx`
- [ ] T008 [P] [US1] 자동 읽음 금지 테스트 — 페이지 마운트~언마운트 동안 `markChannelAsRead`·`readMultipleChannels` 미호출 검증(FR-007). `CS/components/unreads_view/unreads_view.test.tsx`에 추가

### Implementation for User Story 1

- [ ] T009 [US1] 스냅샷 훅 구현으로 T006 통과 — `CS/components/unreads_view/use_unreads_snapshot.ts` (data-model의 UnreadsSnapshot)
- [ ] T010 [US1] 그룹 카드 구현으로 T007 통과 — `CS/components/unreads_view/unread_channel_group.tsx` (`Panel`+`PanelHeader`+`DraftTitle`+`PostComponent location=SEARCH`, 채널 열기 액션)
- [ ] T011 [US1] 페이지 조립으로 T008 통과 — `CS/components/unreads_view/unreads_view.tsx`에 그룹 목록·빈 상태(`NoResultsIndicator`)·로딩 연결. 그룹 목록은 교체 가능하게 별도 컴포넌트로 분리(research 결정 4)
- [ ] T012 [US1] 사이드바 링크 — `CS/components/sidebar/unreads_link/{index.ts,unreads_link.tsx}` 신설(GlobalThreadsLink 패턴, `ChannelMentionBadge`+`getUnreadStatusInCurrentTeam`, 항상 표시), `CS/components/sidebar/sidebar_list/sidebar_list.tsx` static 최상단에 삽입, 링크 문구 en/ko 동시 추가. 링크 렌더·배지 RTL 테스트 포함(선실패)
- [ ] T013 [P] [US1] 키보드 진입 — `CS/selectors/lhs.ts` `getVisibleStaticPages`에 unreads 편입(FR-011). 기존 셀렉터 테스트에 케이스 추가(선실패)
- [ ] T014 [P] [US1] 주변 분기 보완 — `CS/components/unreads_status_handler/`(탭 제목), `CS/components/mobile_channel_header/`(제목), `CS/components/sidebar/sidebar_mentions_link/`·`sidebar_saved_posts_link/`(matchPath에 unreads). 문구 en/ko 동시
- [ ] T015 [P] [US1] 사이드바 링크·카드 스타일 — `CS/sass/okrbest/_overrides.scss`에 추가. 단위 테스트 불가(시각 배치) — quickstart 실주행으로 대체, 사유 여기 기록

**Checkpoint**: US1 Independent Test 통과 — MVP 성립

---

## Phase 4: User Story 2 - 화면 안에서 읽음 처리한다 (Priority: P2)

**Goal**: 그룹별/전체/Esc 읽음 처리. 처리된 그룹은 사라지고 배지가 즉시 갱신.

**Independent Test**: 그룹 하나 읽음 처리 → 그룹 제거 + 사이드바 배지 소거,
"모든 메시지 읽음" → 빈 상태 (quickstart SC-004).

### Tests for User Story 2 (구현 전 실패 확인 필수)

- [ ] T016 [P] [US2] 읽음 처리 테스트 — 그룹 버튼 → `readMultipleChannels([id])` 호출·그룹 제거, 전체 버튼 → 전 그룹 id 일괄 호출·빈 상태 전환, 실패 응답 시 그룹 유지+오류 안내, Esc → 포커스 그룹 읽음. `CS/components/unreads_view/unread_channel_group.test.tsx`·`unreads_view.test.tsx`에 추가

### Implementation for User Story 2

- [ ] T017 [US2] 그룹 "읽음으로 표시" 액션 구현으로 T016 일부 통과 — `unread_channel_group.tsx` PanelHeader 액션 + 제거 처리, 문구 en/ko 동시
- [ ] T018 [US2] 화면 머리글 "모든 메시지 읽음으로 표시" 버튼 — `unreads_view.tsx`, 문구 en/ko 동시
- [ ] T019 [US2] Esc 키 처리 — 포커스 그룹 읽음(FR-010), a11y 포커스 관리 포함. 열린 팝오버·메뉴·모달이 있으면 Esc는 그것부터 닫고 그룹 읽음을 실행하지 않는다. `unreads_view.tsx`
- [ ] T020 [US2] 실패 처리 — 네트워크 오류 시 그룹 유지 + 오류 안내(기존 토스트/알림 관례), 문구 en/ko 동시

**Checkpoint**: US1+US2로 Slack 벤치마크의 핵심 루프(모아 보기 → 읽음 처리) 완성

---

## Phase 5: User Story 3 - 그룹을 접고, 새 메시지 유입에 흔들리지 않는다 (Priority: P3)

**Goal**: 그룹 접기/펼치기, 새 미읽음은 배너로만 알리고 클릭 시 갱신.

**Independent Test**: 화면을 열어 둔 채 다른 계정이 새 메시지 발신 → 목록 불변
+ 배너 표시 → 클릭 시 갱신 (quickstart FR-013 시나리오).

### Tests for User Story 3 (구현 전 실패 확인 필수)

- [ ] T021 [P] [US3] 접기/배너 테스트 — 접기 토글 시 본문 숨김·머리글 유지, 새 미읽음 발생 시 목록 불변+배너 "새 항목 N개", 배너 클릭 시 스냅샷 재고정, 타 기기 읽음(멤버십 갱신) 시 다음 갱신에서 그룹 제거, 멤버십 상실(추방·보관) 채널도 갱신 때 제거. `CS/components/unreads_view/new_items_banner.test.tsx`·기존 테스트 파일에 추가

### Implementation for User Story 3

- [ ] T022 [US3] 접기/펼치기 구현으로 T021 일부 통과 — `unread_channel_group.tsx` 로컬 상태 + 머리글 토글(FR-012)
- [ ] T023 [US3] 새 항목 배너 — `CS/components/unreads_view/new_items_banner.tsx` 신설 + `use_unreads_snapshot.ts`에 신규 판정·재고정 추가(FR-013), 문구 en/ko 동시

**Checkpoint**: 모든 화면 동작 완성

---

## Phase 6: User Story 4 - 사이드바는 기본 상태를 유지한다 (Priority: P3)

**Goal**: 기존 UNREADS 그룹 기본 꺼짐 확인·고정. **코드 변경 없음** (research 결정 9).

**Independent Test**: 설정 무변경 신규 계정에서 UNREADS 그룹 비표시, 토글 동작
유지 (quickstart SC-005).

- [ ] T024 [US4] 무변경 검증 — 신규 계정으로 사이드바 UNREADS 그룹 비표시·설정 토글 동작·켠 계정 유지(US4 시나리오 3종)를 실주행으로 확인하고 결과를 `specs/015-unreads-view/verification.md`에 기록. 단위 테스트 없음(기존 동작 확인이라 신규 테스트 대상 아님 — 사유 기록)
- [ ] T025 [P] [US4] 배포 점검 항목 확정 — `mmctl config get ServiceSettings.ExperimentalGroupUnreadChannels` 확인 절차가 quickstart.md에 있는지 점검, 운영 적용 시점 기록란 추가

**Checkpoint**: 모든 사용자 스토리 완료

---

## Phase 7: Polish & 완료 검증

- [ ] T026 [P] upstream 발산 기록 — 접촉 7곳(ui-contract §5)을 `docs/upstream-adapted-divergences.md`에 추가
- [ ] T027 코드 정리 — 신규 파일 저작권 헤더(원칙 IV), 미사용 import, 주석 밀도 점검

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다
(근거: WORKFLOW_PORTING_GUIDE.md 4-3·4-4절).

- [ ] T028 품질 게이트 — `webapp/`에서 `npm run check`·`npm run check-types`·`npm run test`를 돌리고, 실패 목록이 T001 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [ ] T029 종단 검증 — 빌드·배포 후 quickstart.md 시나리오를 **실제 환경에서** 훑고 절별 통과·실패를 기록한다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [ ] T030 SC 검증 — spec.md의 SC-001~006 각각을 **실측값**으로 확인한다 (추정 금지)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 선행 없음. T001은 모든 구현 과제 전에 끝나야 한다
- **Phase 2 (Foundational)**: T001 뒤. 모든 스토리를 막는다. 내부 순서 T002 → T003 → T004 → T005
- **Phase 3 (US1)**: Phase 2 뒤. 내부: T006~T008(테스트, 병렬) → T009 → T010 → T011 → T012, T013~T015는 T011 뒤 병렬
- **Phase 4 (US2)**: US1의 그룹 카드(T010)·페이지(T011)에 쌓인다. T016 → T017~T020
- **Phase 5 (US3)**: T010·T009에 쌓인다. T021 → T022~T023. **Phase 4와 병렬 가능** (접촉 파일이 겹치는 T019/T022는 순차)
- **Phase 6 (US4)**: 코드 의존 없음 — Phase 2 뒤 언제든. T024·T025 병렬
- **Phase 7**: 원하는 스토리 완료 뒤. T028~T030은 맨 마지막

### Parallel Opportunities

- T006·T007·T008 (테스트 파일 상이)
- T013·T014·T015 (T011 뒤, 파일 상이)
- Phase 5와 Phase 4 (팀 분담 시), Phase 6은 어느 시점이든
- T024·T025·T026

## Parallel Example: User Story 1

```text
# 테스트 선행(동시):
Task: T006 use_unreads_snapshot.test.ts
Task: T007 unread_channel_group.test.tsx
Task: T008 unreads_view.test.tsx (자동 읽음 금지)

# T011 완료 후(동시):
Task: T013 selectors/lhs.ts 편입
Task: T014 주변 분기 보완
Task: T015 _overrides.scss
```

## Implementation Strategy

**MVP = Phase 1~3 (US1)**. 이 시점에 "한 곳에서 모아 본다"가 성립하고 배포
가능하다. 이후 US2(읽음 처리) → US3(접기·배너) → US4(확인)를 증분 배포한다.
각 체크포인트에서 Independent Test를 돌려 앞 스토리가 깨지지 않았음을 확인한다.

## Notes

- 테스트 과제(T003·T006·T007·T008·T016·T021)는 구현 전 **실패 출력**을 과제
  완료 근거로 남긴다 (원칙 III)
- 문자열을 추가하는 모든 과제는 en.json·ko.json을 같은 커밋에서 수정 (원칙 V)
- 커밋은 과제 또는 논리 단위마다. Conventional Commits (원칙 VI)
- upstream 접촉은 ui-contract §5의 7곳을 넘지 않는다. 넘어야 하면 멈추고 보고
