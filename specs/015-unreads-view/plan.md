# Implementation Plan: 읽지 않은 항목 모아보기

**Branch**: `feat/015-unreads-view` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: `specs/015-unreads-view/spec.md`

## Summary

Slack의 Unreads 화면을 벤치마킹해, 읽지 않은 메시지를 채널별 그룹으로 모아 보는
전용 화면과 사이드바 메뉴를 신설한다. 이 저장소에 세 번 반복된 전역 페이지 뷰
패턴(Threads·Drafts·Recaps)을 그대로 따르고, 데이터·읽음 처리·카드 UI는 전부
기존 부품을 재사용한다. 신규 서버 API는 없다. 기존 사이드바 UNREADS 그룹은
서버 기본값(`disabled`)이 이미 기본 꺼짐을 보장하므로 코드 변경 없이 현상을
명세로 고정한다.

기술 접근 — 신규 작성은 페이지 컴포넌트 1벌(`components/unreads_view/`)과
사이드바 링크 1개(`components/sidebar/unreads_link/`)뿐이다. upstream 파일
수정은 라우트·enum·정규식 등 1~3줄짜리 삽입 7곳으로 한정하고, 스타일은
`sass/okrbest/_overrides.scss`에 격리한다. 핵심 제약: `PostList`는 마운트 시
자동 읽음 처리하므로 쓰지 않고 `PostComponent`를 직접 렌더링한다(FR-007).

## Technical Context

**Language/Version**: TypeScript 5.6 (React 18), SCSS. 서버(Go) 코드 변경 없음

**Primary Dependencies**: 기존 webapp 스택만 사용, 신규 npm 의존 없음.
재사용 대상 — `getUnreadChannels`/`sortUnreadChannels`(채널 선별·정렬),
`loadUnreads`·`data_prefetch`(포스트 적재), `readMultipleChannels`(읽음 처리),
`Panel`/`PanelHeader`/`DraftTitle`(카드), `PostComponent`(메시지 렌더링),
`ChannelMentionBadge`(배지)

**Storage**: N/A — 새 저장소 없음. 읽음 상태는 기존 채널 멤버십
(`last_viewed_at`/`msg_count`)을 그대로 읽고 쓴다. 접힘 상태는 컴포넌트
로컬 상태(세션 한정)

**Testing**: Jest + React Testing Library (`TZ=UTC`, en_US). 종단 판정은
quickstart.md 실주행. 원칙 I에 따라 구현 전 기준선 저장

**Target Platform**: 데스크톱 웹. 모바일 앱·전용 반응형 화면은 범위 밖 (spec Assumptions)

**Project Type**: 모노레포의 webapp (`webapp/channels`)

**Performance Goals**: 읽지 않은 채널 20개 이하에서 화면 진입 후 1초 안에 첫
목록 표시 (SC-002). `data_prefetch`가 미읽음 채널 포스트를 이미 선로딩하므로
대부분 store 적중, 부족분만 `loadUnreads` 보충

**Constraints**: upstream 선별 머지 마찰 최소화 — 신규 디렉터리 2곳으로 격리,
upstream 파일 수정은 삽입 위주 7곳, `docs/upstream-adapted-divergences.md`에
기록. 보기만으로 읽음 처리 금지(FR-007). Apache-2.0 저작권 헤더 유지

**Scale/Scope**: 화면 1개, 사이드바 링크 1개, 라우트 1개. 신규 컴포넌트 5~7개,
upstream 접촉 7곳, i18n 키 10~15개 (en/ko)

## Constitution Check

*GATE: Phase 0 연구 전 통과 필수. Phase 1 설계 후 재평가.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| I. 패키지별 품질 게이트 | webapp만 접촉. `npm run check` + `check-types` + `test` 통과 출력을 완료 근거로 남긴다. 구현 전 기준선 실패 목록 저장, 마감 때 diff 판정 | PASS |
| II. npm workspaces 전용 | 신규 npm 의존 없음, lockfile 변경 없음 | PASS |
| III. 실패를 본 테스트만 인정 | 신규 컴포넌트(스냅샷 선별·읽음 처리·배너)는 RTL 테스트를 먼저 작성해 실패를 확인한다. 셀렉터 재사용부는 기존 테스트가 커버하므로 신규 조합 로직만 대상. 시각 배치는 단위 테스트 불가 — quickstart 실주행이 맡고 과제에 사유를 적는다 | PASS |
| IV. 라이선스·리브랜드 충실성 | 신규 파일에 Mattermost 저작권 헤더. 리브랜드 범위 밖 변경 없음 | PASS |
| V. i18n 동기화 | 신설 문구를 `en.json`·`ko.json` 같은 변경에서 추가 (FR-017) | PASS |
| VI. 집중 브랜치 + Conventional Commits + PR | `feat/015-unreads-view` 브랜치, PR 경유 `master` 머지 | PASS |
| VII. Spec 주도 워크플로 | 본 파이프라인 진행 중. 구현 규율은 `/speckit-implement` 3-bis에서 로드 | PASS |
| VIII. 명세 문서 언어와 문체 | 본 문서 포함 산출물 전부 한국어 | PASS |

위반 없음 → Complexity Tracking 생략.

**Phase 1 설계 후 재평가**: research/data-model/contracts/quickstart 작성 후
재검토 — 신규 의존 없음, 서버 코드 무변경, 신규 저장소 없음, 테스트 전략에
실패 확인 절차 포함. 위반 없음 유지. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/015-unreads-view/
├── spec.md              # 기능 명세
├── plan.md              # 이 파일
├── research.md          # Phase 0 — 결정 10건
├── data-model.md        # Phase 1 — 뷰 모델·상태 원천·전이
├── quickstart.md        # Phase 1 — 실행·검증 가이드
├── contracts/
│   └── ui-contract.md   # FR ↔ 동작·기존 API 대응, upstream 접촉 지점
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트
└── tasks.md             # Phase 2 (/speckit-tasks 산출 — 이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
webapp/channels/src/
├── components/
│   ├── unreads_view/                     # 신설 — 페이지 본체
│   │   ├── index.ts                      #   connect/셀렉터 배선
│   │   ├── unreads_view.tsx              #   페이지 (헤더 + 그룹 목록 + 빈 상태)
│   │   ├── unread_channel_group.tsx      #   채널 그룹 카드 (Panel+DraftTitle+PostComponent)
│   │   ├── new_items_banner.tsx          #   "새 항목" 갱신 배너
│   │   └── *.test.tsx                    #   RTL 테스트
│   ├── sidebar/
│   │   ├── unreads_link/                 # 신설 — 사이드바 메뉴 (GlobalThreadsLink 패턴)
│   │   └── sidebar_list/sidebar_list.tsx # 수정 — 링크 1줄 삽입 (static 영역 최상단)
│   ├── channel_layout/center_channel/
│   │   ├── center_channel.tsx            # 수정 — Route 1개 추가
│   │   └── index.ts                      # 수정 — (필요 시) 복원 경로 제외 확인만
│   ├── root/root.tsx                     # 수정 — 라우트 정규식에 unreads 추가
│   ├── unreads_status_handler/           # 수정 — 탭 제목 분기
│   ├── mobile_channel_header/            # 수정 — 모바일 헤더 제목 분기
│   └── sidebar/sidebar_mentions_link·sidebar_saved_posts_link  # 수정 — matchPath에 unreads 추가
├── types/store/lhs.ts                    # 수정 — LhsPage.Unreads 추가
├── selectors/lhs.ts                      # 수정 — getVisibleStaticPages에 항목 추가
├── sass/okrbest/_overrides.scss          # 수정 — 사이드바 링크·카드 스타일 추가
└── i18n/{en,ko}.json                     # 수정 — 신설 문구

docs/upstream-adapted-divergences.md      # 발산 기록
```

**Structure Decision**: 기존 webapp 구조를 그대로 쓴다. 신설은
`components/unreads_view/`와 `components/sidebar/unreads_link/` 두 디렉터리뿐이다.
upstream 파일 수정은 삽입 위주(라우트·enum·정규식·분기 각 1~3줄)로 한정해 머지
충돌 면적을 줄이고, 스타일은 포크 전용 오버라이드 파티얼에 몰아 넣는다.

## Complexity Tracking

위반 없음 — 해당 없음.
