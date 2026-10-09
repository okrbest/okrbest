# Implementation Plan: Slack식 채널 헤더 재구성

**Branch**: `018-slack-channel-header` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-slack-channel-header/spec.md`

## Summary

채널 헤더를 두 층으로 재구성한다 — 채널명 아래 탭 줄(메시지·파일·북마크·
고정)과 우측 운영 아이콘(멤버 아바타 스택·알림벨·⋮). 탭은 기존 RHS·북마크
바를 재배선하고, 탭 활성은 기존 `rhsState` 관례에서 파생한다. 서버 변경
없음 — 북마크 바 접기 상태도 기존 사용자 preference 저장 경로를 재사용한다.

**선행 조건**: 직전 upstream sync의 React Bootstrap 업그레이드 이후 로컬
`webapp/node_modules`가 재설치되지 않아 화면이 뜨지 않는 상태다. 구현 착수
전에 `cd webapp && npm ci`를 먼저 실행한다(tasks Setup 단계에 과제로 둔다).

## Technical Context

**Language/Version**: TypeScript 5.6 + React (`webapp/channels` 단독, 서버 변경 없음)

**Primary Dependencies**: 기존 webapp 구성만 — RHS 액션/셀렉터
(`showPinnedPosts`·`showChannelFiles`·`closeRightHandSide`·`rhsState`),
ChannelBookmarks 바, 채널 메뉴(ChannelHeaderDropdown), `updateChannelNotifyProps`
(뮤트), compass-icons, savePreferences(북마크 접기 상태)

**Storage**: 신규 사용자 preference 1종 — 채널 북마크 바 접기 상태
(category `channel_bookmarks_bar`, name=채널 ID, value `collapsed`). 기존
preference 저장 API 재사용이라 서버·DB 변경 없음. 기본값은 펼침(기존 동작 유지)

**Testing**: Jest + React Testing Library(헤더 탭·우측 버튼·북마크 바),
quickstart.md 실주행(종단)

**Target Platform**: 데스크톱 폭 웹 브라우저 (모바일 분기 기존 그대로)

**Project Type**: 모노레포 중 webapp SPA 단독 변경

**Performance Goals**: 탭 활성은 기존 `rhsState` 셀렉터 파생 — 추가 구독 없음.
아바타 스택은 이미 로드된 채널 프로필에서 상위 3명만 취하고, 미로드 시 기존
프로필 로드 액션을 1회만 호출

**Constraints**: 기존 기능 동작 변화 0(SC-006 — 진입점만 변경). 탭-상태 불일치
0(SC-003 — 파생 상태만 사용, 탭 전용 상태 저장 금지). 014 색·타이포 체계 준수.
i18n ko/en 동시 갱신(원칙 V)

**Scale/Scope**: webapp 신설 2개(채널 탭 줄, 멤버 아바타 스택), 개편 2곳
(channel_header.tsx — 기존 파일·핀 버튼 제거/벨·⋮ 추가, channel_view·
channel_bookmarks — 접기 연동), i18n 키 수 개. 서버·플러그인 변경 없음

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획 반영) | webapp만 접촉. `npm ci` 후 기준선(check-types 목록·접촉 jest) 저장, 마감 때 diff 제시 |
| II. npm workspaces 전용 | PASS | 신규 의존성 없음. `npm ci`는 lock 그대로 재설치 |
| III. 실패를 본 테스트만 인정 | PASS(계획 반영) | 탭·스택·벨 테스트 선행 작성, 구현 전 실패 출력. 제거되는 기존 버튼의 테스트는 사유 기록 후 갱신 |
| IV. 라이선스·리브랜드 | PASS | `webapp/`(Apache-2.0) 존 내 수정 |
| V. i18n 동기화 | PASS(계획 반영) | 탭 라벨·벨 aria 등 신규 문구 en/ko 동시 추가, `i18n-extract:check` 통과 확인 |
| VI. 집중 브랜치 + PR | PASS | `018-slack-channel-header` 브랜치 1개. PR·머지는 완료 검증 후 사용자 확인 시 |
| VII. Spec 주도 워크플로 | PASS | specify→plan 진행 중, 구현 규율은 implement 3-bis에서 로드 |
| VIII. 문서 언어·문체 | PASS | 산출물 전부 한국어 |

위반 없음 → Complexity Tracking 불필요.

**Phase 1 재평가**: 설계 산출물 작성 후에도 위반 없음 — 신규 저장은 기존
preference 체계 재사용 1종뿐, 서버 계약 변경 없음.

## Project Structure

### Documentation (this feature)

```text
specs/018-slack-channel-header/
├── spec.md              # 기능 명세 (/speckit-specify)
├── plan.md              # 이 파일 (/speckit-plan)
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── channel-header-ui.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
webapp/channels/src/
├── components/channel_header/
│   ├── channel_header.tsx                # 우측 재구성: 파일·핀 버튼 제거, 벨·⋮ 추가, 스택 교체
│   ├── channel_header_tabs/              # 신설: 탭 줄 (메시지·파일·북마크·고정)
│   │   ├── channel_header_tabs.tsx
│   │   └── channel_header_tabs.test.tsx
│   └── channel_member_stack/             # 신설: 멤버 아바타 스택 버튼
│       ├── channel_member_stack.tsx
│       └── channel_member_stack.test.tsx
├── components/channel_bookmarks/         # 접기 상태 연동 (바 렌더 조건)
├── components/channel_view/channel_view.tsx  # 탭 줄 배치(헤더 아래)·북마크 바 접기 반영
├── sass/ (채널 헤더 관련 scss)           # 탭 줄·스택·벨 스타일 (014 체계)
└── i18n/en.json, ko.json                 # 탭 라벨·벨·스택 문구
```

**Structure Decision**: 탭 줄과 아바타 스택을 독립 컴포넌트로 신설해
channel_header는 조립만 한다. 탭 활성은 props(rhsState·북마크 접기 preference)
파생으로 컴포넌트 내부 상태를 두지 않는다 — SC-003의 구조적 보장.

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
