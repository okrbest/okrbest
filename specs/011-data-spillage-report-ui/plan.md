# Implementation Plan: 신고 메시지 증거 보고서 UI

**Branch**: `011-data-spillage-report-ui` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-data-spillage-report-ui/spec.md`

## Summary

검토자가 신고된 메시지를 유지·삭제하기 전에 증거 보고서(ZIP)를 받도록 처분 확인 창을 다단계 흐름으로 바꾼다. 신고 내역 카드에는 처분과 무관한 독립 내려받기를 붙인다. 서버는 검토자의 처분 결정을 보고서에 기록하도록 계약을 넓힌다.

서버 보고서 조립은 이미 있다(`2e5c23dc8b`). 이번 작업은 그 위의 UI와 계약 확장이다.

**접근**: upstream `f0360a83`을 참조 구현으로 삼는다. 서버 6파일은 그대로 쓴다 — `git apply --check`로 우리 트리에 깨끗이 적용됨을 확인했다. 웹앱은 **용어를 바꿔 다시 쓴다**. 우리가 제외한 개명 커밋 `f1b9aa052e` 때문에 upstream UI가 참조하는 i18n 키 네임스페이스가 우리 트리에 없기 때문이다. 그대로 들이면 `defaultMessage`("quarantined for review by")로 폴백해 제외 결정이 무너진다.

## Technical Context

**Language/Version**: Go 1.26.2 (server), TypeScript 5.6 + React (webapp)

**Primary Dependencies**: 기존 것만 쓴다. 신규 의존성 없음. `GenericModal`(`@mattermost/components`), `AdvancedTextbox`, `PropertiesCardView`, `Client4`, 브라우저 `AbortController`·`Blob`·`URL.createObjectURL`

**Storage**: 스키마 변경 없음. 마이그레이션 없음. 서버는 보고서를 보관하지 않는다 — 요청마다 조립해 내려보내고 임시 파일을 지운다

**Testing**: Go colocated `_test.go` (gotestsum), Jest + React Testing Library (`TZ=UTC`, en_US 고정)

**Target Platform**: 웹앱 전용. 모바일 앱은 okrbest가 포크하지 않았다

**Project Type**: 모노레포 웹 애플리케이션 (`server/` + `webapp/`)

**Performance Goals**: 보고서 생성은 첨부·편집 이력 크기에 비례해 오래 걸린다. 목표 수치를 두지 않고 **진행 표시와 취소 가능성**으로 대응한다(FR-002·FR-012)

**Constraints**:
- 용어 — 사용자 노출 문자열에 격리·데이터 유출 계열 금지(FR-019), 키 네임스페이스 `keep_remove_flag_content_modal.*` 고정(FR-020)
- 라이선스 — Enterprise Advanced 게이트 유지(FR-024). 라이선스 없는 배포에서 기능이 보이지 않는다
- i18n — en/ko 동시 갱신(FR-021, constitution 원칙 V)

**Scale/Scope**: 서버 6파일(upstream 그대로) + 웹앱 약 25파일. 신규 컴포넌트 14개 안팎, i18n 24키. 화면 5단계 + 독립 버튼 1개

## Constitution Check

*GATE: Phase 0 전에 통과해야 하고, Phase 1 설계 후 재확인한다.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| **I. 패키지별 품질 게이트** | `server/`·`webapp/` 둘 다 닿는다. 구현 전 기준선을 저장하고 마감에 목록 diff로 판정한다. 기준선은 [research.md](research.md) 8번에 기록 | 통과 — [quickstart.md](quickstart.md) 0번·5번에 절차 명시 |
| **II. webapp은 npm workspaces 전용** | 신규 의존성이 없다. `package-lock.json` 변경도 없다 | 통과 |
| **III. 실패를 본 테스트만 인정** | 자체 구현이므로 sync의 cherry-pick 예외가 **적용되지 않는다**. 모든 테스트 과제는 구현 전 실패 출력을 남긴다 | 통과 — quickstart 2번에 명시 |
| **IV. 라이선스·리브랜드 충실성** | copyright 헤더 유지. 이 기능의 핵심 제약이 리브랜드 충실성이다 — 제외한 개명 커밋의 용어가 새어 들지 않게 FR-019·FR-020·SC-005로 못박았다 | 통과 |
| **V. i18n 동기화** | 24키 전부 en/ko 동시 갱신. sync 예외는 이 작업에 적용되지 않는다 — 포크 자체 기능 개발이다 | 통과 — FR-021, SC-006 |
| **VI. 집중 브랜치 + PR** | 브랜치 `011-data-spillage-report-ui`. master 직접 커밋 없음. 무관한 리팩터를 섞지 않는다 | 통과 |
| **VII. Spec 주도 워크플로** | `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` 순서를 따른다 | 통과 |
| **VIII. 명세 문서 언어·문체** | 이 디렉터리의 모든 산출물을 한국어로 쓴다 | 통과 |

**보호 경로**: DB 마이그레이션 디렉터리와 CI 설정을 건드리지 않는다. CODEOWNERS 리뷰 요건에 걸리지 않는다.

**위반 없음** — Complexity Tracking 섹션 불필요.

### Phase 1 설계 후 재확인

| 항목 | 결과 |
|---|---|
| 신규 의존성 | 없음. 원칙 II 유지 |
| 스키마·마이그레이션 | 없음. 보호 경로 무접촉 |
| 파괴적 변경 | `PropertiesCardView`의 `actionsRow` → `actionRows` 1건. 호출부가 `data_spillage_report.tsx:192` 한 곳뿐임을 `grep`으로 확인. 파급 통제 가능 |
| 용어 누출 위험 | 신규 24키 중 원문에 격리 용어가 있는 것은 `download_report_checkbox.label` 1건. 재작성 대상으로 [data-model.md](data-model.md) 7번에 명시 |
| 과잉 개명 위험 | `data_spillage_report.*` 네임스페이스는 개명 대상이 **아니다**. 우리 트리에 이미 5키가 있고 개명 커밋 이전부터 존재한다. [research.md](research.md) 2번에 근거 기록 |

**재확인 결과: 통과.**

## Project Structure

### Documentation (this feature)

```text
specs/011-data-spillage-report-ui/
├── plan.md              # 이 파일
├── spec.md              # 명세 (/speckit-specify 산출)
├── research.md          # Phase 0 산출
├── data-model.md        # Phase 1 산출
├── quickstart.md        # Phase 1 산출 — 검증 절차
├── contracts/
│   ├── report-api.md    # 서버 API + 웹앱 클라이언트 계약
│   └── ui-contracts.md  # 컴포넌트 계약
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트
└── tasks.md             # Phase 2 (/speckit-tasks 산출 — 이 명령이 만들지 않는다)
```

### Source Code (repository root)

```text
server/
├── public/model/
│   ├── content_flagging.go              # FlagContentActionRequest.Action + 상수 2개
│   └── content_flagging_report.go       # 검토 기록에 actor_* 3필드
└── channels/
    ├── api4/
    │   ├── content_flagging_report.go       # action 파라미터 수용·감사 기록
    │   └── content_flagging_report_test.go  # 결정 기록 검증
    └── app/
        ├── content_flagging_report.go       # action 전달 + 채널 메시지 용어 수정(FR-022)
        └── content_flagging_report_test.go  # 앱 계층 검증

webapp/
├── platform/client/src/
│   ├── client4.ts                       # doFetch에 application/zip 분기 + generateFlaggedPostReport
│   └── client4.test.ts                  # ZIP 응답·취소 검증
└── channels/src/
    ├── components/
    │   ├── remove_flagged_message_confirmation_modal/
    │   │   ├── remove_flagged_message_confirmation_modal.tsx   # 단계 기계로 확장
    │   │   ├── remove_flagged_message_confirmation_modal.scss
    │   │   ├── remove_flagged_message_confirmation_modal.test.tsx
    │   │   ├── form_step/            # 신규 — body·footer
    │   │   ├── skip_confirm_step/    # 신규
    │   │   ├── generating_step/      # 신규
    │   │   ├── generated_step/       # 신규
    │   │   ├── error_step/           # 신규
    │   │   ├── flagged_message_body.tsx   # 신규 — 단계 공통 본문
    │   │   ├── body_main_action_text.tsx  # 신규
    │   │   └── report_notice.tsx          # 신규
    │   ├── post_view/data_spillage_report/
    │   │   ├── data_spillage_report.tsx         # actionRows로 전환
    │   │   └── data_spillage_download_report/   # 신규 — 독립 버튼
    │   └── properties_card_view/
    │       ├── properties_card_view.tsx     # ActionRow 타입 + actionRows prop
    │       └── properties_card_view.test.tsx # 신규
    └── i18n/
        ├── en.json                      # 24키 추가
        └── ko.json                      # 24키 추가 (동시)
```

**Structure Decision**: 기존 모노레포 배치를 그대로 따른다. 새 최상위 디렉터리를 만들지 않는다. 모달 하위 컴포넌트를 단계별 디렉터리로 나누는 것은 upstream 구조를 따른 것이며, 현재 단일 파일 229줄이 5단계를 담으면 읽기 어려워지기 때문이다.

## 작업 순서

의존 관계상 아래 순서를 지킨다. 앞 단계가 끝나야 뒤 단계를 검증할 수 있다.

1. **서버 계약** — upstream 서버 6파일 적용. 이 단계만으로 `content_review.yaml`에 결정이 기록되는 것을 테스트로 확인할 수 있다.
2. **서버 용어 수정** — FR-022. 1번과 같은 파일을 건드리므로 함께 처리한다.
3. **웹앱 클라이언트** — `doFetch` ZIP 분기 + `generateFlaggedPostReport`. 이후 UI가 전부 이것에 의존한다.
4. **`PropertiesCardView` 리팩터** — `actionRows`. 독립 버튼을 붙일 자리를 만든다.
5. **독립 내려받기 버튼** — User Story 4. 3·4번 위에서 독립적으로 완결된다.
6. **모달 단계 흐름** — User Story 1·2·3. 가장 크다. 3번에 의존한다.
7. **i18n** — 24키 en/ko. 5·6번에서 쓰는 키가 확정된 뒤에 채운다.

**독립 검증 가능 지점**: 5번이 끝나면 User Story 4가 단독으로 동작한다. 6번이 끝나면 1·2·3이 동작한다. 명세의 우선순위(P1 둘, P2, P3)와 어긋나 보이지만, 5번이 6번보다 훨씬 작고 3·4번 위에서 바로 완결되므로 먼저 두는 편이 검증 주기를 짧게 만든다.

## 위험과 대응

| 위험 | 대응 |
|---|---|
| 용어가 새어 든다 | SC-005를 `grep`으로 기계 검증한다. quickstart 3-6번에서 en/ko 양쪽 화면을 훑는다 |
| 과잉 개명으로 기존 키가 깨진다 | `data_spillage_report.*`는 대상이 아님을 research 2번·data-model 7번에 못박았다 |
| `doFetch` 분기가 기존 호출에 영향 | 현재 `application/zip`을 반환하는 엔드포인트가 이 API뿐임을 확인하고 진행한다 |
| 타입 패키지 dist가 낡아 무관한 오류가 뜬다 | 타입 변경 후 `webapp/platform/types`를 먼저 빌드한다. quickstart 선행 조건에 명시 |
| 라이선스가 없어 실주행을 못 한다 | 1·2번 증거로 판정하고 3번을 **미검증으로 표기**한다. 통과했다고 적지 않는다 |
| 취소 처리가 새어 부분 파일이 저장된다 | FR-013을 테스트로 덮는다. quickstart 2번 표에 항목으로 넣었다 |
