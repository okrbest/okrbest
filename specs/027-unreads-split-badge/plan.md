# Implementation Plan: 읽지 않은 항목 행 뱃지 구분 병기

**Branch**: `027-unreads-split-badge` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-unreads-split-badge/spec.md`

## Summary

사이드바 "읽지 않은 항목" 행(`UnreadsLink`)에 뱃지를 2종으로 병기한다 —
멘션·DM·GM 수(기존 강조색 멘션 뱃지, 오른쪽 끝 유지)와 일반 채널 미읽음
메시지 수(spec 025의 파랑 틴트 `unreadMsgBadge` 표기, 그 왼쪽).

기술 접근: upstream 셀렉터 `getUnreadStatusInCurrentTeam`은 내부에서
`messages`와 `mentions`를 모두 계산하지만 반환형(`boolean | number`)이
messages를 버린다. upstream 파일을 고치는 대신 **앱 레벨 memoized 셀렉터를
신설**해 두 수치를 분리 공급하고, 컴포넌트는 `UnreadsLink` 한 곳만 고친다.
뱃지 마크업과 색 규칙은 spec 025 산출물을 재사용한다.

## Technical Context

**Language/Version**: TypeScript 5.6 + React (webapp/channels, npm workspaces)

**Primary Dependencies**: reselect(`createSelector`, mattermost-redux 경유),
react-redux `useSelector`. 신규 외부 의존성 없음

**Storage**: N/A — redux 스토어의 기존 엔티티(`channels`, `myMembers`,
`messageCounts`)에서 파생하는 읽기 전용 수치

**Testing**: Jest + React Testing Library (`TZ=UTC`, en_US 고정),
셀렉터 단위 테스트 + 컴포넌트 렌더 테스트

**Target Platform**: 웹 브라우저 (데스크톱 앱·모바일 웹은 동일 컴포넌트를
공유하는 범위까지 자동 적용)

**Project Type**: web application (모노레포의 `webapp/` 패키지)

**Performance Goals**: 셀렉터는 memoize하여 스토어 변경 없는 리렌더에서
재계산 0회. 행 1곳의 뱃지 추가라 렌더 비용 변화는 무시 가능 수준

**Constraints**: upstream 파일(`packages/mattermost-redux/`) 수정 금지 —
sync 충돌 표면을 늘리지 않는다. 신규 코드는 `// okrbest:` 마커.
사용자 노출 문자열 추가 없음(숫자만 표시)

**Scale/Scope**: 컴포넌트 1곳(`unreads_link.tsx`), 앱 레벨 셀렉터 1개 신설,
scss 0~1곳(025 규칙 재사용 확인에 따라), 테스트 2벌

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS(계획) | webapp만 접촉. `npm run check` + `npm run check-types` + `npm run test` 출력을 완료 근거로 제시한다. 구현 전 기준선 실패 목록을 저장하고 마감 때 diff로 판정한다 |
| II. npm workspaces 전용 | PASS | 의존성 추가 없음, lockfile 변경 없음 |
| III. 실패를 본 테스트만 인정 | PASS(계획) | 셀렉터·컴포넌트 테스트를 구현 전에 작성해 RED 출력을 기록한 뒤 구현한다 (tasks에 RED 증거 과제를 둔다) |
| IV. 라이선스·리브랜드 | PASS | 기존 파일 헤더 유지, 신규 파일에 표준 헤더. webapp은 Apache-2.0 존 |
| V. i18n 동기화 | PASS | 신규 사용자 노출 문자열 없음 — 뱃지는 숫자만 표시. en.json/ko.json 변경 없음 |
| VI. 집중 브랜치 + PR | PASS(계획) | 브랜치 `027-unreads-split-badge`, Conventional Commits, PR 경유 머지. master 직접 커밋 금지 |
| VII. Spec 주도 워크플로 | PASS | 본 파이프라인으로 진행 중. 구현은 `/speckit-implement`의 3-bis에서 TDD·verification 규율을 로드한 뒤 시작한다 |
| VIII. 명세 문서 언어·문체 | PASS | 본 plan 포함 산출물을 한국어로 작성 |

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/027-unreads-split-badge/
├── spec.md
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
├── contracts/
│   └── ui-unreads-link.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks 산출물 (이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
webapp/channels/src/
├── selectors/
│   └── unreads.ts                          # 신설 — 분리 집계 셀렉터
├── components/sidebar/unreads_link/
│   ├── unreads_link.tsx                    # 수정 — 뱃지 병기
│   ├── unreads_link.test.tsx               # 수정 — 표시 매트릭스 테스트
│   └── unreads_link.scss                   # 필요 시 수정 — 뱃지 간격
├── sass/okrbest/_overrides.scss            # 확인 — 025 규칙이 이 행을 덮는지
└── selectors/unreads.test.ts               # 신설 — 셀렉터 단위 테스트
```

**Structure Decision**: 기존 webapp 구조를 그대로 쓴다. 셀렉터는 앱 레벨
`webapp/channels/src/selectors/`에 신설한다 — upstream
`packages/mattermost-redux/`를 수정하면 반환형 변경이 모든 소비처에
파급되고 sync 충돌 표면이 커진다 (research.md R1).

## Complexity Tracking

위반 없음 — 해당 없음.
