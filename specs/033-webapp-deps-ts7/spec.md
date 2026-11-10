# Feature Specification: webapp 의존성 2026-10·11 갱신과 TypeScript 7.0 전환

**Feature Branch**: `033-webapp-deps-ts7`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "webapp 의존성 월간 유지보수 2026-10·11과 TypeScript 7.0 전환을 upstream에서 반영한다. 대상 upstream 커밋 3개를 순서대로: (1) 4ca793bd Monthly maintenance (2026-10): Update webapp dependencies (#39222), (2) 20c15b9d Monthly maintenance (2026-11): Update webapp dependencies (#39583), (3) a28b09d7 Upgrade the webapp to TypeScript 7.0 (#39697). TipTap과 @mattermost/compass-ui는 버전 옮기기에서 제외한다. package.json 버전만 옮기고 npm install로 package-lock.json을 재생성한다. 검증은 스냅샷 검토, check-types·jest 기준선 비교, npm run check, 빌드. 구현 커밋 본문에 세 커밋의 Upstream: 링크를 넣는다."

## 배경

upstream(mattermost/mattermost)은 webapp 의존성을 매달 올린다. 포크는 2026-10분(`4ca793bd`)과 2026-11분(`20c15b9d`)을 sync에서 spec으로 넘겼고, 그 위에 얹힌 TypeScript 7.0 전환(`a28b09d7`)도 같은 과제로 묶었다(장부 `spec-docs/upstream/upstream-master-unmerged-commits.md` spec 전환 부록).

포크의 TypeScript는 지금 5.6.3이다. upstream은 10월분에서 5.9.3으로, 이어서 7.0.2(네이티브 컴파일러)로 갔다. 이 간격이 벌어진 채로 남으면 앞으로 들어오는 upstream webapp 커밋이 새 타입 문법과 lockfile 때문에 계속 충돌한다.

포크는 upstream과 두 군데에서 의도적으로 갈라져 있다.

- 메시지 입력기로 TipTap 대신 Lexical을 쓴다. TipTap 패키지와 그 테스트는 포크에 없다.
- `@mattermost/compass-ui`를 받지 않는다(2026-10-18 결정, 라이선스 미확인). 장부 `70658e18` 행 참조.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 2026-10·11 의존성으로 올려도 webapp이 그대로 동작한다 (Priority: P1)

포크 개발자가 10월·11월 upstream 의존성 버전으로 webapp을 설치·빌드·테스트한다. 화면 동작과 테스트 결과는 갱신 전과 같다. 달라진 스냅샷은 라이브러리 내부 마크업 변화로 설명이 된다.

**Why this priority**: TypeScript 7 전환은 10월분(TypeScript 5.9.3)을 전제로 한다. 이 단계가 없으면 뒤의 두 단계를 시작할 수 없다.

**Independent Test**: 10월분과 11월분만 반영한 상태에서 설치, 빌드, 타입 검사, 단위 테스트를 돌리고 기준선과 비교한다. TypeScript 7 없이도 독립적으로 병합할 수 있다.

**Acceptance Scenarios**:

1. **Given** 갱신 전 기준선(타입 오류 목록, 단위 테스트 실패 목록, lint 오류 목록)이 기록돼 있고, **When** 10월분 버전을 옮기고 lockfile을 다시 만든 뒤 같은 검사를 돌리면, **Then** 새로 생긴 타입 오류·테스트 실패·lint 오류가 0건이다.
2. **Given** 10월분을 반영한 상태에서, **When** 11월분(편집기 번들 경로, 성능 지표 타입 포함)을 반영하면, **Then** 프로덕션 빌드가 성공하고 앞의 검사에서 새 실패가 0건이다.
3. **Given** 스냅샷 테스트가 라이브러리 갱신으로 바뀌었을 때, **When** 바뀐 스냅샷을 검토하면, **Then** 모든 변경이 의존성의 마크업·속성 변화로 설명되고 포크 고유 화면(Lexical 입력기, Slack식 내비게이션 등)의 구조 변화는 없다.

---

### User Story 2 - TypeScript 7.0으로 타입 검사를 돌린다 (Priority: P2)

포크 개발자와 CI가 webapp 타입 검사를 TypeScript 7.0(네이티브 컴파일러)로 돌린다. 플러그인 개발자가 쓰는 `@mattermost/shared` 패키지의 타입 정의도 새 방식으로 만들어지고, 기존처럼 가져다 쓸 수 있다.

**Why this priority**: 앞으로 들어올 upstream webapp 커밋이 TypeScript 7을 전제로 작성된다. 다만 기능 변화는 없으므로 P1 다음이다.

**Independent Test**: TypeScript 7 전환만 얹은 상태에서 워크스페이스 전체 타입 검사, `@mattermost/shared` 패키지 빌드, 단위 테스트를 돌리고 P1 완료 시점과 비교한다.

**Acceptance Scenarios**:

1. **Given** P1이 끝난 상태에서, **When** TypeScript 7로 전환하고 워크스페이스 전체 타입 검사를 돌리면, **Then** 오류가 기준선 5건 이하이고 새 오류는 0건이다.
2. **Given** `@mattermost/shared`의 타입 정의 생성 방식이 바뀌었을 때, **When** 패키지를 빌드하면, **Then** 타입 정의 파일이 만들어지고 CSS import 구문이 타입 정의에 남지 않는다.
3. **Given** CI 워크플로가 바뀌었을 때, **When** 브랜치에서 webapp CI를 돌리면, **Then** 타입 검사 단계가 TypeScript 7로 실행되고 master 기준선보다 새로 실패하는 잡이 없다.

---

### User Story 3 - sync 장부에서 세 커밋이 빠진다 (Priority: P3)

포크 관리자가 다음 upstream sync를 돌리면, 세 커밋이 처리 완료로 집계돼 미반영 목록과 spec 대기 목록에서 빠진다.

**Why this priority**: 추적 정확성의 문제이고, 구현이 끝나야 의미가 있다.

**Independent Test**: 구현 브랜치에서 장부 갱신 스크립트를 브랜치 기준으로 돌려 세 해시가 처리 완료로 잡히는지 본다.

**Acceptance Scenarios**:

1. **Given** 구현 커밋 본문에 세 upstream 커밋 링크가 들어 있고, **When** 장부를 브랜치 기준으로 갱신하면, **Then** spec 대기 중 미구현 항목이 8건에서 5건으로 줄어든다.

---

### Edge Cases

- upstream이 올린 패키지 중 포크에 없는 것(TipTap 계열 `@tiptap/*`, `@mattermost/compass-ui`)은 옮기지 않는다. upstream이 같은 커밋에서 고친 TipTap 전용 소스·테스트(`wysiwyg_editor/*`)도 받지 않는다.
- 포크가 upstream과 다른 버전을 이미 쓰는 패키지가 있다(포크 자체 업그레이드나 다른 sync 결과). upstream의 "변경 전" 값과 포크 현재 값이 다르면 upstream의 "변경 후" 값으로 맞추되, 포크 값이 더 높으면 낮추지 않는다.
- lockfile을 다시 만들 때 peer 표시가 사라지거나 바뀌는 드리프트가 생길 수 있다(선례 `726a47b7fe`, `0ea2ddce54`). 재생성 후 peer 표시 변화를 따로 검토한다.
- 스냅샷 변경 중에 compass-ui를 전제로 한 upstream 스냅샷은 포크 마크업과 맞지 않는다. upstream 스냅샷 파일을 그대로 가져오지 않고, 포크에서 다시 생성한 뒤 검토한다.
- `.github/workflows/webapp-ci.yml`은 CODEOWNERS 보호 경로다. 병합할 때 code owner 리뷰가 필요할 수 있다.
- 기존 타입 오류 5건 중 일부는 버전 갱신으로 사라지거나 형태가 바뀔 수 있다. 줄어드는 것은 허용하고, 바뀐 오류는 원인을 기록한다.
- 패키지 패치 파일(`patches/@types+react-bootstrap+*.patch`)처럼 버전에 묶인 파일은 버전과 함께 옮긴다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 반영 순서는 `4ca793bd` → `20c15b9d` → `a28b09d7`이다. 각 단계는 따로 검증할 수 있는 커밋으로 남긴다.
- **FR-002**: 각 단계에서 upstream이 바꾼 `package.json` 의존성 버전을 포크의 해당 `package.json`에 옮긴다. 대상은 `webapp/package.json`, `webapp/channels/package.json`, `webapp/platform/*/package.json`이다.
- **FR-003**: TipTap 계열 패키지와 `@mattermost/compass-ui`는 옮기지 않는다. upstream이 이들에 맞춰 고친 소스·테스트·스냅샷도 받지 않는다.
- **FR-004**: `package-lock.json`은 upstream 파일을 가져오지 않고, 옮긴 버전으로 설치해 다시 만든다.
- **FR-005**: 재생성한 lockfile의 peer 표시 변화를 검토하고, 의도하지 않은 변화는 되돌린다.
- **FR-006**: upstream이 의존성 갱신에 맞춰 고친 소스 코드(예: 편집기 번들 경로, 성능 지표 타입, 날짜·시간 표시 컴포넌트)는 포크에 같은 파일이 있으면 받고, 없으면 받지 않은 이유를 기록한다.
- **FR-007**: 스냅샷은 포크에서 다시 생성하고, 변경마다 의존성 변화로 설명이 되는지 검토한다.
- **FR-008**: TypeScript 7 전환에서 upstream의 tsconfig 변경, 컴파일러 별칭, 라이브러리 override, `@mattermost/shared` 타입 정의 생성 방식, components 번들 설정, CI 워크플로 변경을 받는다.
- **FR-009**: 세 단계 모두 끝난 뒤 워크스페이스 전체 타입 검사, 단위 테스트, lint, 프로덕션 빌드를 돌리고 기준선과 비교한 결과를 남긴다.
- **FR-010**: 구현 커밋 본문에 각 upstream 커밋 링크(`Upstream: https://github.com/mattermost/mattermost/commit/<full-hash>`)를 넣는다.
- **FR-011**: 받지 않은 부분(TipTap·compass-ui 관련 버전·소스·테스트, 포크에 없는 파일)은 `spec-docs/upstream/upstream-adapted-divergences.md`에 커밋별로 기록한다.
- **FR-012**: 번역 파일(`ko.json`)은 바꾸지 않는다. 의존성 갱신으로 영문 카탈로그(`en.json`)가 바뀌면 후속 번역 목록에 올린다.

### Key Entities

- **upstream 커밋 묶음**: 반영할 세 커밋. 각각 의존성 버전 변경, 맞춤 소스 변경, 스냅샷 변경으로 이루어진다.
- **기준선**: 갱신 전 상태의 검사 결과. 타입 오류 목록(현재 5건: `admin_definition_ldap_wizard.tsx`, `lexical_editor/nodes/emoji_node.test.ts`, `lexical_editor/plugins/markdown_paste_plugin.tsx`, `post_view/post_view.test.tsx`, `resizable_sidebar/resizable_lhs/index.tsx`), 단위 테스트 실패 목록, lint 오류 목록(eslint 106건, stylelint 68건).
- **제외 목록**: 포크가 받지 않는 패키지와 파일. TipTap 계열, compass-ui, 포크에 없는 소스·테스트.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 세 단계를 마친 뒤 워크스페이스 전체 타입 오류는 5건 이하이고, 기준선에 없던 오류는 0건이다.
- **SC-002**: 단위 테스트 실패 목록이 기준선 대비 새 항목 0건이다.
- **SC-003**: lint 오류 목록(eslint·stylelint)이 기준선 대비 새 항목 0건이다.
- **SC-004**: 프로덕션 빌드가 성공하고, 산출물 크기 변화를 기록한다.
- **SC-005**: 깨끗한 체크아웃에서 lockfile 기준 설치(`npm ci`)가 성공한다. 같은 lockfile로 두 번 설치해도 결과가 같다.
- **SC-006**: 바뀐 스냅샷 100%가 검토 기록(의존성 변화로 설명)을 가진다.
- **SC-007**: 장부를 브랜치 기준으로 갱신하면 spec 전환 미구현 항목이 8건에서 5건으로 줄어든다.
- **SC-008**: 브랜치 CI에서 master 기준선보다 새로 실패하는 webapp 잡이 0개다.

## Assumptions

- 세 단계를 한 PR로 묶되, 커밋은 upstream 커밋별로 나눈다. 리뷰와 되돌리기를 단계 단위로 할 수 있다.
- 포크가 이미 upstream보다 높은 버전을 쓰는 패키지는 낮추지 않는다.
- TipTap·compass-ui를 빼도 다른 패키지의 peer 의존이 깨지지 않는다. 깨지면 plan 단계에서 그 패키지를 함께 보류하고 사유를 기록한다.
- Playwright e2e는 이 과제의 판정에 쓰지 않는다. 포크의 브라우저 스펙이 아직 통과하지 못하는 상태라서다(장부 `a8c2307b` 결정 메모). 다만 e2e 패키지의 타입 검사가 새로 깨지지 않는지는 본다.
- macOS 로컬에서 재현되지 않는 Linux 전용 문제는 CI 결과로 판정한다.
- 서버(`server/`) 코드는 이 과제의 범위가 아니다.
