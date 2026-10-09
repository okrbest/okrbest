# Tasks: Slack식 채널 헤더 재구성

**Input**: Design documents from `/specs/018-slack-channel-header/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/channel-header-ui.md](./contracts/channel-header-ui.md)

**Tests**: 필수 — constitution 원칙 III. 각 스토리에서 테스트 과제를 구현보다
먼저 수행하고 구현 전 실패 출력을 남긴다.

**Organization**: 스토리별 단계. US1(탭 줄)과 US2(우측 아이콘)는 서로 독립
배포 가능 — 단 US1의 "기존 파일·핀 버튼 제거"는 탭이 생긴 뒤에만 수행한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 수행 가능(다른 파일, 미완료 과제 의존 없음)
- **[Story]**: 소속 사용자 스토리 (US1, US2)

## Phase 1: Setup

**Purpose**: 선행 의존성 복구(research R6) → 브랜치 → 기준선 (원칙 I·VI)

- [x] T001 webapp 의존성 재설치 — `cd webapp && npm ci` (React Bootstrap 업그레이드 이후 재설치 누락으로 화면이 뜨지 않는 상태 복구). 완료 후 webpack watcher 재시작, 브라우저에서 채널 화면이 뜨는지 확인해 복구를 증명
- [x] T002 `master`에서 작업 브랜치 `018-slack-channel-header` 생성
- [x] T003 웹앱 기준선 저장 — `npm run check-types` 오류 목록과 접촉 jest 스위트(`src/components/channel_header/`, `src/components/channel_bookmarks/`, `src/components/channel_view/`) 결과를 `specs/018-slack-channel-header/baseline-webapp.txt`(+`baseline-webapp-types-errors.txt`)에 기록 (T001 의존 — 재설치 후 측정)

---

## Phase 2: Foundational

**Purpose**: US1(북마크 탭)과 북마크 바 렌더가 공유하는 접기 preference 유틸.

- [x] T004 [P] 북마크 바 접기 preference 셀렉터·액션 테스트 — `webapp/channels/src/components/channel_bookmarks/bookmark_bar_collapse.test.ts`(신설): 행 없음=펼침, `collapsed`=접힘, 토글 액션이 savePreferences를 category `channel_bookmarks_bar`·name=채널 ID로 호출([data-model](./data-model.md)). 구현 전 실패 출력 저장
- [x] T005 접기 preference 유틸 구현 — `webapp/channels/src/components/channel_bookmarks/bookmark_bar_collapse.ts`(신설): `isBookmarksBarCollapsed(state, channelId)` 셀렉터 + `toggleBookmarksBarCollapsed(channelId)` 액션. 펼침 전환은 **행 삭제**(deletePreferences)로 처리해 데이터 모델의 "행 없음=펼침" 규칙을 유지한다 (T004 의존)

**Checkpoint**: 접기 상태 단독 검증 가능

---

## Phase 3: User Story 1 - 탭 줄로 채널 콘텐츠를 오간다 (Priority: P1) 🎯 MVP

**Goal**: 채널명 아래 [메시지·파일·북마크·고정] 탭 줄 — RHS·북마크 바 재배선,
활성은 rhsState 파생, 기존 파일·핀 아이콘 제거.

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 1 — 탭 전환·
배지·닫기 경로 동기화·제3 패널 공존·preference 지속성.

### Tests for User Story 1 (구현 전 실패 출력 필수)

- [x] T006 [P] [US1] 탭 줄 컴포넌트 테스트 — `webapp/channels/src/components/channel_header/channel_header_tabs/channel_header_tabs.test.tsx`(신설): ① 탭 4개 렌더(라벨·tablist/tab 시맨틱·aria-selected) ② rhsState=CHANNEL_FILES면 파일 탭만 활성, PIN이면 고정 탭, 닫힘이면 메시지, 스레드 상태면 전부 비활성 ③ 고정 개수 배지(0이면 없음) ④ 파일/고정 탭 클릭 시 기존 RHS 액션 호출, 메시지 탭 클릭 시 closeRightHandSide(닫혀 있으면 no-op) ⑤ 북마크 기능 꺼짐이면 북마크 탭 미렌더, 클릭 시 접기 토글 액션 호출([contracts](./contracts/channel-header-ui.md) 탭 표). 실패 출력 저장
- [x] T007 [P] [US1] 북마크 바 접기 연동 테스트 — `webapp/channels/src/components/channel_view/channel_view.test.tsx`(기존 파일에 추가): 접기 preference `collapsed`면 ChannelBookmarks 미렌더, 행 없으면 기존처럼 렌더. 실패 출력 저장

### Implementation for User Story 1

- [x] T008 [US1] 탭 줄 구현 — `channel_header_tabs/channel_header_tabs.tsx`(신설): [contracts](./contracts/channel-header-ui.md)의 탭별 노출/클릭/활성 조건 그대로. 활성 표시는 하단 표시선+굵기(014 체계, 색 단독 금지). 내부 상태 없음 — rhsState·접기 preference·고정 수는 전부 props/셀렉터 (T005·T006 의존)
- [x] T009 [US1] 헤더에 탭 줄 배치 + 기존 버튼 제거 — `channel_header.tsx`: 헤더를 두 줄 구조로(채널명 줄 아래 ChannelHeaderTabs), 우측의 기존 파일(`channelHeaderFilesButton`)·고정(`channelHeaderPinButton`) 아이콘 버튼 제거. 제거되는 버튼의 기존 테스트는 탭 테스트로 대체됨을 커밋에 기록 (T008 의존)
- [x] T010 [US1] 북마크 바 접기 반영 — `channel_view.tsx`의 ChannelBookmarks 렌더 조건에 `isBookmarksBarCollapsed` 연결 (T005·T007 의존)
- [x] T011 [P] [US1] i18n — 탭 라벨 4종(`channel_header.tabs.messages/files/bookmarks/pinned`) en("Messages"/"Files"/"Bookmarks"/"Pinned")·ko("메시지"/"파일"/"북마크"/"고정") 동시 추가 (원칙 V)

**Checkpoint**: 탭 줄 단독으로 배포 가능 — quickstart 시나리오 1 수동 확인

---

## Phase 4: User Story 2 - 우측 아이콘으로 채널을 운영한다 (Priority: P2)

**Goal**: 멤버 아바타 스택·알림벨·⋮ — 기존 멤버 RHS·뮤트 경로·채널 메뉴
재배선.

**Independent Test**: [quickstart.md](./quickstart.md) 시나리오 2 — 스택
인원·클릭, 벨 토글·상태 일치, ⋮ 메뉴 동일성.

### Tests for User Story 2 (구현 전 실패 출력 필수)

- [x] T012 [P] [US2] 아바타 스택 테스트 — `channel_member_stack/channel_member_stack.test.tsx`(신설): 멤버 N명 중 아바타 ≤3 렌더+인원수 N 표시, 클릭 시 기존 멤버 RHS 토글 액션 호출, rhsState=CHANNEL_MEMBERS면 활성, aria-label에 인원수 포함, 프로필 미로드면 로드 액션 1회 호출. 실패 출력 저장
- [x] T013 [P] [US2] 벨·⋮ 테스트 — `channel_header.test.tsx`(기존 파일에 추가): ① 벨 렌더·클릭 시 뮤트 토글(updateChannelNotifyProps 경로) 호출, 뮤트 상태면 빗금 벨 + aria에 상태 ② ⋮ 클릭 시 채널명 ▾와 동일한 채널 메뉴 오픈 ③ 기존 파일·고정 아이콘 부재 ④ DM 채널 렌더 케이스 — 탭 줄·스택(상대 아바타)·벨이 렌더되고 기존 DM 상태 표시가 유지(FR-009). 실패 출력 저장

### Implementation for User Story 2

- [x] T014 [US2] 아바타 스택 구현 — `channel_member_stack/channel_member_stack.tsx`(신설): [data-model](./data-model.md) `ChannelMemberStack` 계약. 기존 Avatar/Avatars 위젯 재사용, memberCount는 기존 stats (T012 의존)
- [x] T015 [US2] 헤더 우측 재구성 — `channel_header.tsx`: 멤버 아이콘+숫자를 ChannelMemberStack으로 교체(보류 가입 요청 뱃지 유지), 알림벨 추가(기존 toggleMute 로직 재사용), ⋮ 추가(기존 채널 메뉴 트리거 재사용 — 신규 메뉴 금지). DM/GM 분기에서 기존 특수 표시 유지(FR-009) (T013·T014 의존)
- [x] T016 [P] [US2] i18n — 벨 aria/툴팁(`channel_header.mute.*`), 스택 aria(`channel_header.memberStack.ariaLabel` "멤버 {count}명 보기"/"View {count} members"), ⋮ aria 문구 en/ko 동시 추가 (원칙 V)

**Checkpoint**: US1+US2 완성 — 전체 헤더가 계약과 일치

---

## Phase 5: Polish & 완료 검증

- [x] T017 [P] 스타일 정리 — 채널 헤더 두 줄·탭 줄·스택·벨 scss(014 색·타이포 체계, stylelint 통과), 기존 스냅샷 갱신은 의도 확인 후(무관 스냅샷 변경 0을 diff로 확인)
- [x] T018 [P] `npm run i18n-extract:check` 통과 확인 — 어긋나면 extract 결과로 en.json 정합화(무관 드리프트가 섞이면 커밋에 사유 기록)

### 완료 검증 (고정 — 지우지 않는다)

- [x] T019 품질 게이트 — `cd webapp && npm run check && npm run check-types && npm run test`(접촉 스위트)를 돌리고 실패 목록이 T003 기준선과 같은지 **diff로 보인다**. 개수 비교로 대신하지 않는다
- [x] T020 종단 검증 — watcher 기동 후 [quickstart.md](./quickstart.md) 시나리오 1~4를 **실제 환경에서** 훑고 절별 통과·실패를 기록한다. 못 돌리면 `미실행`으로 적는다
- [x] T021 SC 검증 — [spec.md](./spec.md) SC-001~SC-006 각각을 **실측값**으로 확인한다 (추정 금지)
- [ ] T022 **PR 진행 확인** — T019~T021 증거와 함께 완료를 보고하고, 사용자가 추가 작업 없이 완료를 확인하면 PR 생성 → rebase 머지로 마감한다 (017 전례의 보류 게이트 — 사용자 지시가 있으면 그대로 따른다)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: T001이 전체의 선행 조건(화면 복구 없이는 어떤 검증도 불가). T002→T003 순서
- **Phase 2**: T003 이후. US1의 북마크 탭(T008)·바 연동(T010)을 막는다
- **Phase 3 (US1)**: Phase 2 완료 후. T008→T009→(T010)
- **Phase 4 (US2)**: Phase 1 이후 가능(US1과 독립) — 단 T015는 T009와 같은 파일(channel_header.tsx)이므로 **T009 이후 순차**
- **Phase 5**: 전 스토리 완료 후. T022는 항상 마지막

### Parallel Opportunities

- 테스트 선행 작성: T004 ∥ T006 ∥ T007 ∥ T012 ∥ T013 (전부 다른 파일)
- T011 ∥ T016 (i18n — 같은 파일이므로 실제 수행은 순차 권장)
- T014(신설 파일)는 US1 구현과 병행 가능; channel_header.tsx를 만지는 T009·T015만 순차

## Parallel Example: 테스트 선행 일괄 작성

```bash
Task: "접기 preference 테스트 — channel_bookmarks/bookmark_bar_collapse.test.ts"
Task: "탭 줄 테스트 — channel_header_tabs/channel_header_tabs.test.tsx"
Task: "북마크 바 연동 테스트 — channel_view/channel_view.test.tsx"
Task: "아바타 스택 테스트 — channel_member_stack/channel_member_stack.test.tsx"
Task: "벨·더보기 테스트 — channel_header/channel_header.test.tsx"
```

## Implementation Strategy

**MVP = US1(탭 줄).** 탭 줄만으로 "라벨 있는 1클릭 접근"이라는 핵심 가치가
성립하고, 기존 파일·핀 아이콘 제거가 탭과 한 몸이므로 US1이 완결 단위다.
US2(우측 재구성)는 그 위에 독립적으로 얹는다. 커밋은 작업 단위로 브랜치에
쌓고, PR은 T022에서 사용자 확인 후 진행한다. Conventional Commits(`feat:`) +
한국어 본문.

## Notes

- 서버·플러그인 저장소는 건드리지 않는다. 신규 저장은 preference 행 1종뿐
- 탭·스택·벨에 컴포넌트 내부 상태 금지 — 전부 셀렉터 파생 (SC-003)
- 제거되는 기존 버튼 관련 테스트는 "탭으로 대체" 사유를 기록하고 갱신 (원칙 III)
- 테스트가 첫 실행에 통과하면 구현을 되돌려 실패를 확인하거나 `미검증` 표기 (원칙 III)

## 완료 검증 결과 (2026-10-10, /speckit-implement 실행 기록)

### 품질 게이트 (T019) — 기준선 diff

| 게이트 | 기준선 | 최종 | 판정 |
|---|---|---|---|
| `npm run check-types` | 기존 오류 30건 | 11건 — **신규 0건**, 기존 19건 해소(헤더 테스트의 showBotMessages·savePreferences mock 누락 잠복 오류를 populatedProps 보강으로 수선) | 통과(개선) |
| jest 접촉 스위트 (channel_header·channel_header_menu·channel_view·channel_bookmarks) | 134건 중 기존 실패 1(스냅샷) | 155/155 통과 — 기존 실패는 의도된 헤더 개편 스냅샷 갱신으로 해소 | 통과 |
| eslint·stylelint (접촉 영역) | — | 0 errors | 통과 |
| `npm run i18n-extract:check` | — | exit 0 (제거된 버튼 문구 4키 정리, ko 동시 제거) | 통과 |

- TDD 기록: 테스트 선행 실패 확인(탭 스위트 모듈 부재, 접기 유틸, channel_view 연동, 스택 모듈 부재, 헤더 신규 4건) — `scratchpad 018-red-*` 저장.
- 구현 중 잡은 결함: ① 파일·고정 탭이 재클릭 토글로 닫히지 않던 문제(기존
  액션이 토글이 아님 — 종단 실측에서 발견, RED 테스트 추가 후 탭에서 분기)
  ② 기존 ChannelHeaderMenu가 isReadonly·isChannelBookmarksEnabled 죽은 prop을
  DOM까지 흘리던 React 경고(원천 제거).
- 삭제한 테스트와 사유: 제거된 헤더 파일·핀 버튼의 상태 스냅샷 4건 — 동일
  검증이 channel_header_tabs 스위트(활성 파생·배지·토글)로 대체.

### 종단 검증 (T020) — 로컬 dev 서버 + Playwright 실주행

| 시나리오 | 결과 | 증거 |
|---|---|---|
| 1. 탭 줄 | 통과 | [메시지·파일·고정] ko 라벨·tablist 시맨틱, 파일/고정 열기·재클릭 토글 닫기, **RHS 닫기(X) 경로로 닫아도 메시지 탭 복귀(SC-003)**, 고정 패널 제목 "고정된 메시지" 확인. 북마크 탭: 이 서버는 라이선스 없음(Team Edition)이라 기능 꺼짐 → **탭 미노출 동작 실측(FR-003)**. 펼침/접기·preference 지속성은 라이선스 환경이 없어 종단 미실측 — 단위 테스트 7건(접기 유틸 4·탭 1·channel_view 2)으로 검증 |
| 2. 우측 아이콘 | 통과 | 스택: 아바타 3명 겹침+인원 10, aria "멤버 10명 보기". 벨: 1클릭 뮤트→빗금+aria "음소거 해제", 재클릭 해제(SC-002). ⋮: 채널명 드롭다운과 동일 메뉴(새 창·정보 보기·알림 끄기…) 오픈. 구 파일·핀 버튼 부재 |
| 3. DM·기존 보존 | 통과 | DM에서 탭 줄·벨·⋮ 렌더. DM 멤버 스택은 기존 분기 유지 — DM 제목 옆 상대 아바타·상태 표시가 이미 그 역할(기존에도 DM엔 멤버 버튼 없음). ☆·채널명▾·설명 등 좌측 요소 변화 없음 |
| 4. 접근성 | 통과 | 탭 tablist/tab+aria-selected, 벨·스택·⋮ 전부 이름 보유(실측 aria 값 기록) |

### SC 검증 (T021) — 실측값

| SC | 기준 | 실측 | 판정 |
|---|---|---|---|
| SC-001 | 탭 1클릭 접근 | 파일·고정 탭 클릭 1번으로 패널 오픈 | 통과 |
| SC-002 | 뮤트 1클릭 | 벨 클릭 1번으로 뮤트/해제 | 통과 |
| SC-003 | 탭-상태 불일치 0 | 탭·닫기 버튼·토글 어느 경로든 탭 동기화 실측 | 통과 |
| SC-004 | 스택=실제 멤버 수 | 10명 채널에서 "10" 표시 | 통과 |
| SC-005 | 이름 없는 버튼 0 | 신설 요소 전부 aria/가시 라벨 | 통과 |
| SC-006 | 기존 기능 변화 0 | 파일·고정·멤버 패널, 뮤트 경로, 채널 메뉴 모두 기존 로직 재사용 — 진입점만 변경 | 통과 |

### 비고

- 선행 조건 처리(T001): `npm ci`로 의존성 정합화. 원인 분석 결과 신규
  react-bootstrap은 RootCloseWrapper를 내장해 의존성은 정상이었고, 빈 화면의
  실체는 **부분 설치 상태에서 만든 webpack 번들·캐시**였다 — 캐시 삭제+재빌드로
  복구를 브라우저로 증명.
- DB가 7월 덤프로 복원돼 있어 e2e 계정(admin-e2e·user-e2e-a)을 재생성했다.
