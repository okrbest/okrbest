---

description: "Task list for 012-image-preview-zoom-pan"
---

# Tasks: 이미지 프리뷰 확대·이동 조작 확장

**Input**: `/specs/012-image-preview-zoom-pan/`의 설계 문서

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: 포함한다. 동작을 바꾸는 변경이므로 constitution 원칙 III가 테스트를 요구한다. 테스트 과제는 **구현 전 실패 출력을 남긴 뒤에만** 완료로 표시한다.

**Organization**: 사용자 스토리별로 묶어 각각 독립적으로 만들고 검증할 수 있게 했다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능 (다른 파일, 선행 의존 없음)
- **[Story]**: 대응하는 사용자 스토리 (US1, US2, US3)
- 파일 경로를 정확히 적는다

## Path Conventions

이 기능은 webapp 프론트엔드 단독 변경이다. 서버를 건드리지 않는다. 모든 경로는 저장소 루트 기준이다.

```
webapp/channels/src/components/file_preview_modal/
webapp/channels/src/utils/constants.tsx   ← 건드리지 않는다
```

---

## Phase 1: Setup

**Purpose**: 작업 환경을 맞추고 기준선이 여전히 유효한지 확인한다

- [ ] T001 Node 버전을 `.nvmrc`(24.11)에 맞춘다 — `node --version`이 `v24.11.x`가 아니면 `nvm use`로 전환한다. 버전이 어긋나면 webapp 테스트가 로드 단계에서 실패한다
- [ ] T002 기준선이 여전히 깨끗한지 확인한다 — `cd webapp/channels && npm run test -- src/components/file_preview_modal`를 돌려 [baseline-tests.txt](./baseline-tests.txt)의 `8 suites / 42 tests / 24 snapshots, 실패 0건`과 일치하는지 본다. 어긋나면 구현을 시작하기 전에 원인을 밝힌다

**Checkpoint**: 환경이 맞고 기준선이 깨끗하다 — 회귀 판정 기준이 "실패 0건 유지"로 확정된다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 파일별 상태 관리 기반을 세운다. 이동 위치와 파일 식별자가 없으면 US1의 이동 위치가 파일 사이로 샌다

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리도 시작할 수 없다

**여기서 잠복 버그도 잡힌다** — 메시지 수정으로 같은 자리의 첨부가 교체되면 이전 파일의 배율이 새 파일에 남는 문제([research.md](./research.md) 사실 6)

- [ ] T003 실패 테스트를 먼저 쓴다 — `webapp/channels/src/components/file_preview_modal/file_preview_modal.test.tsx`에 (a) `getFileIdentity`가 파일 id에는 `id:` 접두사를, 외부 링크에는 `link:` 접두사를 붙이는지, (b) 파일 **개수가 같은데 내용만 바뀐 교체**에서 그 자리만 배율·맞춤 배율·이동 위치가 초기화되고 다른 자리는 유지되는지, (c) 목록이 길어질 때 새 자리가 기본값으로 채워지는지 확인하는 테스트를 추가한다. **실행해 실패 출력을 기록한다**
- [ ] T004 `getFileIdentity` 정적 도우미를 `webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx`에 구현한다 — 파일 id가 있으면 `id:<id>`, 없으면 `link:<link>`. 접두사로 두 종류를 갈라 우연한 문자열 일치를 막는다 ([contracts/component-contracts.md](./contracts/component-contracts.md))
- [ ] T005 `State`에 `panOffset: Record<number, {x: number; y: number}>`와 `fileIdentities: string[]`를 더하고 생성자에서 초기화한다 — `webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx` ([data-model.md](./data-model.md))
- [ ] T006 `getDerivedStateFromProps`의 초기화 조건을 파일 개수 비교에서 **자리별 식별자 비교**로 바꾼다 — `webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx:151`의 `props.fileInfos.length !== state.prevFileInfosCount` 분기. 달라진 자리만 초기화하고 같은 자리는 그대로 둔다 (FR-018). T003이 실패에서 통과로 바뀌는지 확인한다

**Checkpoint**: 파일별 상태 기반이 섰다. 사용자 스토리를 시작할 수 있다

---

## Phase 3: User Story 1 - 확대한 이미지를 끌어서 본다 (Priority: P1) 🎯 MVP

**Goal**: 확대한 이미지를 마우스로 끌어 원하는 영역으로 옮긴다. 이동을 끝내며 배경 위에서 버튼을 떼도 모달이 닫히지 않는다

**Independent Test**: 이미지를 확대한 뒤 끌어서 화면 밖에 있던 영역을 화면 안으로 가져온다. 휠·키보드 없이도 완결된 개선이다 ([quickstart.md](./quickstart.md) 시나리오 1)

### Tests for User Story 1 ⚠️

> 구현 전에 써서 **실패하는 것을 먼저 확인한다** (constitution 원칙 III)

- [ ] T007 [P] [US1] 끌기 입력 테스트를 `webapp/channels/src/components/file_preview_modal/image_preview.test.tsx`에 추가한다 — (a) 맞춤 배율에서 `mousedown` 시 이동이 시작되지 않고 확대 상태에서는 시작하는지 (FR-002), (b) 오른쪽·가운데 버튼으로는 시작되지 않는지 (FR-003), (c) 5px 넘게 움직인 뒤의 `click`이 `onBackgroundClick`을 부르지 않고 2px만 움직이면 부르는지 (FR-005). **실패 출력을 기록한다**
- [ ] T008 [P] [US1] 이동 위치 상태 테스트를 `webapp/channels/src/components/file_preview_modal/file_preview_modal.test.tsx`에 추가한다 — (a) 파일 A를 이동해 두고 B로 갔다 돌아오면 A의 위치가 복원되는지 (FR-017), (b) 리셋이 배율을 맞춤 배율로, 이동 위치를 `{0,0}`으로 되돌리는지 (FR-016, FR-020), (c) 배율을 줄여 이미지가 화면에 다 들어오면 이동 위치가 `{0,0}`으로 잘리는지 ([data-model.md](./data-model.md) 불변 조건 2·3). **실패 출력을 기록한다**

### Implementation for User Story 1

- [ ] T009 [US1] 끌기 감지를 `webapp/channels/src/components/file_preview_modal/image_preview.tsx`에 구현한다 — `mousedown`/`mousemove`/`mouseup`을 ref에 담은 끌기 상태(`active`, `startX/Y`, `startScrollLeft/Top`, `moved`)로 관리하고, 스크롤은 리액트 상태를 거치지 않고 `containerRef.current.scrollLeft/scrollTop`에 직접 쓴다. 재렌더를 일으키지 않는 것이 목적이다 ([research.md](./research.md) 결정 1)
- [ ] T010 [US1] 끌기 시작 조건을 건다 — 왼쪽 버튼이고 현재 배율이 `fitScale`보다 클 때만 시작한다. `webapp/channels/src/components/file_preview_modal/image_preview.tsx` (FR-002, FR-003)
- [ ] T011 [US1] 끌기와 배경 클릭을 가른다 — 이동 거리가 5px을 넘으면 `moved`를 세우고, 뒤따르는 `click`에서 `onBackgroundClick`을 부르지 않고 `moved`를 되돌린다. `webapp/channels/src/components/file_preview_modal/image_preview.tsx` (FR-005, [research.md](./research.md) 결정 3). **이 과제가 US1에서 가장 깨지기 쉬운 지점이다**
- [ ] T012 [P] [US1] 끌기 중 커서 모양을 바꾼다 — `webapp/channels/src/components/file_preview_modal/image_preview.scss`에 `&--dragging &__image { cursor: grabbing; }`를 더하고, 확대 상태의 기본 커서를 `grab`으로 둔다 (FR-004). 다른 파일이라 T009~T011과 병렬 가능
- [ ] T013 [US1] `panOffset` prop을 받아 렌더 뒤 스크롤 위치로 복원하고, 끌기가 끝날 때 `onPanChange`를 한 번 부른다 — `webapp/channels/src/components/file_preview_modal/image_preview.tsx`. 기존 "확대 시 스크롤을 중앙으로" `useLayoutEffect`를 저장된 위치 복원으로 바꾼다 (FR-017, [contracts/component-contracts.md](./contracts/component-contracts.md))
- [ ] T014 [US1] 부모 쪽 배선을 넣는다 — `webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx`에서 `ImagePreview`에 `fitScale`·`panOffset`·`onPanChange`를 넘기고, `handleZoomReset`이 이동 위치도 `{0,0}`으로 되돌리게 고친다 (FR-016). T007·T008이 통과로 바뀌는지 확인한다

**Checkpoint**: US1이 단독으로 동작한다. 확대한 이미지를 끌 수 있고, 끌고 나서 배경에서 손을 떼도 모달이 닫히지 않으며, 파일별 이동 위치가 유지된다

---

## Phase 4: User Story 2 - 커서가 가리키는 곳을 기준으로 확대한다 (Priority: P2)

**Goal**: 휠로 확대·축소하되 커서가 가리키던 지점이 화면상 제자리에 남는다. 조작 중 뒤쪽 페이지가 스크롤되지 않는다

**Independent Test**: 이미지의 특정 지점에 커서를 두고 휠을 굴려 그 지점이 같은 자리에 남는지 확인한다 ([quickstart.md](./quickstart.md) 시나리오 2)

### Tests for User Story 2 ⚠️

- [ ] T015 [P] [US2] 커서 기준 계산 테스트를 `webapp/channels/src/components/file_preview_modal/file_preview_modal.test.tsx`에 추가한다 — 주어진 커서 위치·기존 스크롤·배율 변화에 대해 새 스크롤 목표값이 `newScroll = (oldScroll + cursorOffset) × (newRatio / oldRatio) − cursorOffset`과 일치하는지, 결과가 `[0, scaledSize − clientSize]`로 잘리는지 확인한다 (FR-008, [research.md](./research.md) 결정 2). **실패 출력을 기록한다**
- [ ] T016 [P] [US2] 휠 경계·세기 테스트를 `webapp/channels/src/components/file_preview_modal/image_preview.test.tsx`에 추가한다 — (a) 상한 `MAX_SCALE 3.0`에서 더 확대해도 상한을 유지하고 하한 `MIN_SCALE 0.25`에서 더 축소해도 하한을 유지하는지 (FR-015), (b) `deltaY = 0`이면 아무 일도 없는지 (FR-011), (c) 큰 `deltaY`가 작은 `deltaY`보다 배율을 더 바꾸는지 (FR-009). **실패 출력을 기록한다**

### Implementation for User Story 2

- [ ] T017 [US2] 휠 배율·이동 위치 계산을 `webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx`에 구현한다 — 배율 변화 폭을 `deltaY` 세기에 비례시키고, 새 이동 위치를 결정 2의 식으로 구한다. **DOM을 되읽지 않는다** — `scaledSize = baseSize × ratio`로 이미 알고 있으므로 `scrollWidth`·`getBoundingClientRect`를 크기 변경 뒤에 읽지 않는다. 되읽으면 강제 동기 레이아웃이 걸려 SC-006이 깨진다
- [ ] T018 [US2] 비수동 휠 리스너를 `webapp/channels/src/components/file_preview_modal/image_preview.tsx`에 단다 — 리액트 합성 이벤트의 휠은 기본이 수동(passive)이라 `preventDefault()`가 듣지 않는다. ref로 `addEventListener('wheel', handler, {passive: false})`를 걸고 정리 함수에서 떼어 낸다. 커서 위치와 컨테이너 크기를 `onWheelZoom`으로 부모에 넘긴다 (FR-010, [contracts/component-contracts.md](./contracts/component-contracts.md))
- [ ] T019 [US2] 연속 입력을 rAF로 묶는다 — `webapp/channels/src/components/file_preview_modal/image_preview.tsx`에서 한 프레임에 한 번만 반영해 휠을 빠르게 굴려도 끊기지 않게 한다 (SC-006). T015·T016이 통과로 바뀌는지 확인한다

**Checkpoint**: US1과 US2가 각각 독립적으로 동작한다

---

## Phase 5: User Story 3 - 키보드로 확대·축소한다 (Priority: P3)

**Goal**: `+`/`=` 확대, `-` 축소, `0` 리셋. 입력 칸·조합키·PDF에서는 동작하지 않는다

**Independent Test**: 프리뷰를 열고 `+`, `-`, `0`을 눌러 배율이 바뀌는지 확인한다 ([quickstart.md](./quickstart.md) 시나리오 3)

### Tests for User Story 3 ⚠️

- [ ] T020 [US3] 키보드 테스트를 `webapp/channels/src/components/file_preview_modal/file_preview_modal.test.tsx`에 추가한다 — (a) `+`/`=`/`-`/`0` 각각의 대응 동작 (FR-012), (b) `INPUT`·`TEXTAREA`·`contentEditable`에 포커스가 있으면 배율이 안 바뀌는지 (FR-013), (c) `Ctrl`·`Meta`·`Alt`와 함께 눌리면 안 바뀌는지 (FR-014), (d) **PDF를 보는 중에는 안 바뀌는지** (spec.md 범위 밖). **실패 출력을 기록한다**

### Implementation for User Story 3

- [ ] T021 [US3] `keydown` 처리기를 `webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx`에 구현한다 — 모달이 열려 있는 동안 문서 수준에서 듣고, 세 조건(파일 형식이 이미지·SVG가 아님 / 조합키 눌림 / 입력 칸 포커스)에서 무시한다. 처리한 입력은 `preventDefault()`한다. 컴포넌트가 사라질 때 리스너를 떼어 낸다 ([contracts/component-contracts.md](./contracts/component-contracts.md) 키보드 계약)

> **주의**: 이미지와 PDF가 `state.scale`을 공유하고 `handleZoomIn`/`Out`/`Reset`이 파일 형식을 가리지 않는다. 파일 형식 조건을 빼면 PDF에서도 그냥 동작해 명세의 범위 밖 선을 넘는다 ([research.md](./research.md) 사실 4)

**Checkpoint**: 세 스토리가 모두 독립적으로 동작한다

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 계약 준수와 성능을 확인한다

- [ ] T022 스냅샷 24건이 **갱신 없이** 통과하는지 확인한다 — 감싸는 요소를 `<div class="image_preview">`로 유지하는 것이 마크업 계약이다 ([contracts/component-contracts.md](./contracts/component-contracts.md)). 깨졌다면 `-u`로 갱신하기 전에 왜 마크업이 바뀌었는지부터 밝힌다
- [ ] T023 되읽기 회피가 지켜졌는지 확인한다 — 브라우저 개발자 도구 성능 탭에서 휠·끌기 연속 조작 중 강제 동기 레이아웃(forced reflow) 경고가 뜨지 않는지 본다 ([research.md](./research.md) 결정 2)
- [ ] T024 [P] 손대지 않기로 한 것을 확인한다 — `webapp/channels/src/utils/constants.tsx`(`ZoomSettings` 현행 유지)와 `webapp/channels/src/components/file_preview_modal/popover_bar/`가 이번 브랜치의 diff에 없는지 `git diff master... --stat`으로 본다 ([plan.md](./plan.md) 범위 밖 재확인)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다.

- [ ] T025 품질 게이트 — `cd webapp/channels && npm run test -- src/components/file_preview_modal`, `cd webapp && npm run check`, `cd webapp && npm run check-types`를 돌리고 **출력을 제시한다**. 실패 목록을 구현 전 기준선([baseline-tests.txt](./baseline-tests.txt))과 **diff로 비교**한다. 기준선이 깨끗하므로 판정은 "실패 0건 유지"다. 개수 비교로 대신하지 않는다
- [ ] T026 종단 검증 — 앱을 띄우고 [quickstart.md](./quickstart.md)의 실주행 시나리오 1~7을 **실제 브라우저에서** 훑어 시나리오별 통과·실패를 기록한다. 특히 시나리오 1-5(끌고 배경에서 떼기)와 시나리오 5(첨부 교체)를 빠뜨리지 않는다. 환경이 없어 못 돌리면 `미실행`으로 적는다
- [ ] T027 SC 검증 — [spec.md](./spec.md)의 SC-001~SC-007 각각을 **실측값**으로 확인한다 (추정 금지). 특히 SC-002(커서 기준점이 이미지 짧은 변의 2% 이내)와 SC-005(파일별 복원 100%)는 숫자를 적는다. SC-007(처음 보는 사용자 90% 성공)은 이번 범위에서 측정할 수 없으면 `미측정`으로 적는다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음
- **Foundational (Phase 2)**: Setup 완료 후. **모든 사용자 스토리를 막는다**
- **US1 (Phase 3)**: Foundational 완료 후
- **US2 (Phase 4)**: Foundational 완료 후. US1과 독립이나 같은 파일을 건드려 실무상 순차 진행이 낫다
- **US3 (Phase 5)**: Foundational 완료 후. US1·US2와 독립
- **Polish (Phase 6)**: 원하는 스토리가 모두 끝난 뒤

### User Story Dependencies

세 스토리는 기능상 독립이다. 하나만 넣어도 그 자체로 쓸 만하다.

- **US1 (P1)**: Foundational의 `panOffset`에 기댄다. 이것만 넣으면 끌기가 되는 MVP
- **US2 (P2)**: Foundational에만 기댄다. US1 없이도 휠 확대는 동작한다(다만 이동 수단이 스크롤바뿐이라 값어치가 준다)
- **US3 (P3)**: Foundational에만 기댄다. 단독으로 완결된다

### Within Each User Story

- 테스트를 먼저 쓰고 **실패를 확인한 뒤** 구현한다
- 상태 → 입력 감지 → 배선 순서
- 스토리를 끝내고 다음 우선순위로 넘어간다

### Parallel Opportunities

**이 기능은 병렬 여지가 적다.** 변경이 `image_preview.tsx`와 `file_preview_modal.tsx` 두 파일에 몰려 있어, 같은 파일을 건드리는 과제는 병렬로 돌릴 수 없다. [P]를 붙인 것만 실제로 병렬 가능하다.

| 병렬 가능 | 이유 |
|---|---|
| T007 ∥ T008 | `image_preview.test.tsx` vs `file_preview_modal.test.tsx` |
| T012 ∥ T009~T011 | `image_preview.scss` vs `image_preview.tsx` |
| T015 ∥ T016 | `file_preview_modal.test.tsx` vs `image_preview.test.tsx` |
| T024 ∥ T022·T023 | 확인 대상이 겹치지 않는다 |

---

## Parallel Example: User Story 1

```bash
# US1의 테스트 둘은 파일이 달라 함께 쓸 수 있다:
Task: "끌기 입력 테스트를 image_preview.test.tsx에 추가 (T007)"
Task: "이동 위치 상태 테스트를 file_preview_modal.test.tsx에 추가 (T008)"

# 구현 중에는 SCSS만 떼어 병렬로 갈 수 있다:
Task: "끌기 중 커서 모양을 image_preview.scss에 추가 (T012)"
```

`image_preview.tsx`를 건드리는 T009·T010·T011·T013은 같은 파일이라 순차로 간다.

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료 — **여기서 잠복 버그가 잡힌다**
3. Phase 3 US1 완료
4. **멈추고 검증**: quickstart 시나리오 1과 4를 훑는다
5. 쓸 만하면 배포·시연

MVP만으로도 값어치가 있다. 확대해 놓고 원하는 곳으로 못 가던 답답함이 사라진다.

### Incremental Delivery

1. Setup + Foundational → 기반 완성 (잠복 버그 해소가 여기서 딸려 온다)
2. US1 추가 → 시나리오 1·4 검증 → 배포 (MVP)
3. US2 추가 → 시나리오 2 검증 → 배포
4. US3 추가 → 시나리오 3 검증 → 배포
5. 각 단계가 앞 단계를 깨지 않는다

### 중간에 멈춘다면

US1까지만 하고 멈춰도 명세의 보존 요구(FR-019~022)는 지켜진다. US2·US3를 빼도 기존 버튼 조작이 그대로라 사용자가 잃는 것은 없다.

---

## Notes

- [P] = 다른 파일, 선행 의존 없음. 이 기능은 두 파일에 변경이 몰려 병렬 여지가 적다
- [Story] 표는 과제를 사용자 스토리에 이어 추적성을 만든다
- **테스트가 실패하는 것을 먼저 본다.** 첫 실행부터 통과한 테스트는 구현을 되돌려 실패를 확인하거나 그 과제 옆에 `미검증`으로 적는다 (constitution 원칙 III)
- 과제나 논리 단위마다 커밋한다
- 체크포인트에서 멈춰 스토리를 단독으로 검증할 수 있다
- 손대지 않기로 한 것: `utils/constants.tsx`, `popover_bar/`, 서버 전체, i18n 카탈로그
- **i18n 작업이 없다.** 사용자에게 보이는 새 문자열을 넣지 않는다 ([plan.md](./plan.md) Constitution Check 원칙 V)
