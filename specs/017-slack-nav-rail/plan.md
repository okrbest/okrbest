# Implementation Plan: 좌측 네비게이션 Slack식 재구성

**Branch**: `017-slack-nav-rail` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-slack-nav-rail/spec.md`

## Summary

팀 레일을 기능 버튼 레일(현재 팀 버튼 + Channels·Boards·Playbooks 제품 버튼)로
바꾸고, 팀 전환을 팀명 드롭다운(+레일 팀 버튼)으로 옮기며, 상단 product
switcher를 제거하고 그 관리 메뉴를 팀명 드롭다운으로 이전한다. 서버·플러그인
변경 없음 — webapp 전용 작업이다. 제품 버튼은 플러그인이 이미 등록해 둔
`ProductComponent`(아이콘·이름·`switcherLinkURL`)만 사용한다.

**마감 절차(사용자 지시)**: 구현·검증 완료 후 **PR을 바로 만들지 않는다**.
사용자가 추가 소기능을 요청할 예정이므로, 완료 보고 → 추가 작업 접수·반영 →
사용자가 "완전 완료"를 확인한 뒤에 PR 생성·머지를 진행한다. 그동안 커밋은
`017-slack-nav-rail` 브랜치에 쌓는다.

## Technical Context

**Language/Version**: TypeScript 5.6 + React (`webapp/channels` 중심, 서버 변경 없음)

**Primary Dependencies**: 기존 webapp 구성만 사용 — `useProducts()`/
`ProductComponent`(플러그인 제품 레지스트리), compass-icons(제품 아이콘
문자열 렌더), 기존 Menu 컴포넌트(팀명 드롭다운), react-router(제품 이동)

**Storage**: 없음. 팀 정렬 순서 등 기존 preference를 읽기만 한다(새 저장 없음)

**Testing**: Jest + React Testing Library(컴포넌트), quickstart.md 실주행(종단).
접근성은 기존 테스트 유틸의 role/name 쿼리로 검증

**Target Platform**: 데스크톱 폭 웹 브라우저(모바일 분기·데스크톱 앱 동작은
기존 그대로)

**Project Type**: 모노레포 중 webapp SPA 단독 변경

**Performance Goals**: 레일 버튼은 정적 렌더(제품 수 ≤ 수 개) — 성능 쟁점 없음.
제품 전환 체감은 기존 product switcher 경로와 동일(라우팅 재사용)

**Constraints**: 플러그인 저장소 무수정(SC-005). 레일의 peek·프로필 버튼·플러그인
슬롯 유지(FR-009). 제거되는 UI(product switcher)를 참조하는 온보딩 투어 정리
(FR-011). i18n ko/en 동시 갱신(원칙 V)

**Scale/Scope**: webapp 컴포넌트 신설 2개(레일 제품 버튼, 공용 팀 목록 메뉴),
개편 3곳(team_sidebar, sidebar_team_menu, global_header left_controls),
제거 1곳(product_menu), i18n 키 수 개. 서버·DB·플러그인 변경 없음

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획 반영) | webapp만 닿는다. 구현 전 기준선(`npm run check`·`check-types`·접촉 jest) 저장, 마감 때 목록 diff 제시. 서버 게이트는 접촉 없음(변경 0) |
| II. npm workspaces 전용 | PASS | 신규 의존성·패키지 없음 |
| III. 실패를 본 테스트만 인정 | PASS(계획 반영) | 신설·개편 컴포넌트마다 테스트 선행 작성, 구현 전 실패 출력. 제거되는 product_menu의 기존 테스트는 삭제 사유를 과제에 기록 |
| IV. 라이선스·리브랜드 | PASS | `webapp/`(Apache-2.0) 존 내 수정. 저작권 헤더 유지 |
| V. i18n 동기화 | PASS(계획 반영) | 새 문구(레일 라벨·팀 목록 섹션 제목 등) en/ko 동시 추가. 이전되는 기존 메뉴 문구는 키 재사용 |
| VI. 집중 브랜치 + PR | PASS | `017-slack-nav-rail` 브랜치. **PR은 사용자 추가 작업 반영·완전 완료 확인 후 생성**(사용자 지시 — 위 마감 절차) |
| VII. Spec 주도 워크플로 | PASS | specify→plan 진행 중, 구현 규율은 `/speckit-implement` 3-bis에서 로드 |
| VIII. 문서 언어·문체 | PASS | 산출물 전부 한국어 |

위반 없음 → Complexity Tracking 불필요.

**Phase 1 재평가**: 설계 산출물 작성 후에도 위반 없음. 신규 저장 구조·서버
계약 변경이 생기지 않았다.

## Project Structure

### Documentation (this feature)

```text
specs/017-slack-nav-rail/
├── spec.md              # 기능 명세 (/speckit-specify)
├── plan.md              # 이 파일 (/speckit-plan)
├── research.md          # Phase 0 (/speckit-plan)
├── data-model.md        # Phase 1 (/speckit-plan)
├── quickstart.md        # Phase 1 (/speckit-plan)
├── contracts/
│   └── nav-ui.md        # UI·내비게이션 계약 (/speckit-plan)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — 이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
webapp/channels/src/
├── components/team_sidebar/
│   ├── team_sidebar.tsx                  # 레일 개편: 팀 버튼 나열 제거, 팀 버튼 1개+제품 버튼 나열
│   ├── index.ts                          # props 정리(useProducts 연계는 컴포넌트 내 훅)
│   └── components/
│       ├── rail_product_button.tsx       # 신설: 제품 버튼(아이콘+라벨, 활성 강조, 이동)
│       ├── rail_team_button.tsx          # 신설: 현재 팀 버튼(드롭다운 트리거)
│       └── team_button.tsx               # 기존 — 레일에서는 미사용으로 전환(삭제 여부 tasks에서 판단)
├── components/widgets/team_list_menu/    # 신설: 공용 "내 팀" 목록 메뉴(레일·팀명 드롭다운 공유)
├── components/sidebar/sidebar_header/
│   └── sidebar_team_menu.tsx             # "내 팀" 섹션 + 이전된 관리 메뉴 섹션 추가
├── components/global_header/left_controls/
│   ├── left_controls.tsx                 # product_menu 제거, history 버튼만 유지
│   └── product_menu/                     # 제거(관리 항목은 sidebar_team_menu로 이전)
├── components/onboarding_tasks|tours/    # product switcher 참조 단계 정리
└── i18n/en.json, ko.json                 # 신규 문구
```

**Structure Decision**: 레일 버튼과 팀 목록 메뉴를 독립 컴포넌트로 신설해
team_sidebar와 sidebar_team_menu가 같은 팀 목록 메뉴를 공유한다(FR-003/004의
"같은 목록·같은 동작"을 코드 공유로 보장). product_menu 디렉터리는 관리 항목
이전이 끝난 뒤 제거한다.

## Complexity Tracking

Constitution Check 위반 없음 — 해당 없음.
