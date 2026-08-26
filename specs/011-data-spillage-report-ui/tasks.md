# Tasks: 신고 메시지 증거 보고서 UI

**Input**: `/specs/011-data-spillage-report-ui/`의 설계 문서

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: 포함한다. constitution 원칙 III이 요구한다 — 이 작업은 자체 구현이라 sync의 cherry-pick 예외가 적용되지 않는다. **모든 테스트 과제는 구현 전 실패 출력을 남긴 뒤에만 완료로 표시한다.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 과제에 의존하지 않음)
- **[Story]**: 소속 사용자 시나리오 (US1~US4)

---

## upstream 재사용 방침

사용자 지시: **최대한 upstream을 따르되 okrbest가 지킬 것은 지킨다.**

파일별로 실측해 셋으로 나눴다. 이 분류가 아래 모든 과제의 근거다.

### A. 그대로 가져온다 — 11파일 (격리 용어 0건)

```
post_view/data_spillage_report/data_spillage_download_report/{.tsx,.scss,.test.tsx}
properties_card_view/properties_card_view.test.tsx
remove_flagged_message_confirmation_modal/report_notice.{tsx,scss}
remove_flagged_message_confirmation_modal/flagged_message_body.scss
remove_flagged_message_confirmation_modal/error_step/error_step_body.scss
remove_flagged_message_confirmation_modal/form_step/form_step_body.scss
remove_flagged_message_confirmation_modal/form_step/form_step_footer.scss
remove_flagged_message_confirmation_modal/skip_confirm_step/skip_confirm_step_footer.scss
```

서버 6파일도 여기 속한다. `git apply --check` 통과를 확인했다.

### B. 키 네임스페이스만 바꾼다 — 12파일

격리 용어가 **i18n 키 id에만** 나타난다. `keep_remove_quarantined_content_modal.` → `keep_remove_flag_content_modal.` 기계적 치환으로 끝난다. 로직·마크업·구조를 손대지 않는다.

```
body_main_action_text.tsx            error_step/error_step_body.tsx
error_step/error_step_footer.tsx     flagged_message_body.tsx
form_step/form_step_body.tsx         form_step/form_step_footer.tsx
generated_step/generated_step_body.tsx    generated_step/generated_step_footer.tsx
generating_step/generating_step_body.tsx  generating_step/generating_step_footer.tsx
skip_confirm_step/skip_confirm_step_body.tsx
skip_confirm_step/skip_confirm_step_footer.tsx
```

### C. 영문 원문을 다시 쓴다 — 3문자열뿐

| 위치 | upstream 원문 | 우리 처리 |
|---|---|---|
| `body_main_action_text.tsx` `action_remove.body` | "...and **quarantined** for review by..." | 기존 우리 카탈로그 문구 사용 ("flagged for review by") |
| `body_main_action_text.tsx` `action_keep.body` | "...keep a **quarantined** message..." | 기존 우리 카탈로그 문구 사용 ("flagged message") |
| `form_step_footer.tsx` `download_report_checkbox.label` | "Download **quarantined** message report" | 신규 작성 |

**곁들여 얻는 것**: upstream이 개명하면서 오타 `posed` → `posted`를 고쳤다. 우리 `en.json`에는 아직 `posed`가 있다([en.json:5361·5366](../../webapp/channels/src/i18n/en.json)). 용어와 무관한 순수 개선이라 함께 받는다.

**주의 — 가져오면 안 되는 것**: upstream `properties_card_view.tsx`에는 `Quarantined by`·`Quarantined at` defaultMessage가 있다(80·104행). 이는 개명 커밋의 산물이고 우리 파일에는 0건이다. `ActionRow` 관련 훅만 적용하고 그 줄에는 손대지 않는다.

---

## Phase 1: Setup — 기준선 저장

**Purpose**: 원칙 I은 회귀를 실패 목록 diff로 판정하라고 요구한다. 구현 전에 기준선을 남긴다. 이 단계를 건너뛰면 마감에 회귀 판정을 할 수 없다.

- [X] T001 [P] `server/`에서 `make check-style` 출력을 저장한다 — 결과를 [quickstart.md](quickstart.md) 0번 형식으로 `specs/011-data-spillage-report-ui/baseline-server.txt`에 기록
- [X] T002 [P] `webapp/`에서 `npm run check`와 `webapp/channels`의 `tsc --noEmit` 오류 **파일 목록**을 `specs/011-data-spillage-report-ui/baseline-webapp.txt`에 기록
- [X] T003 [P] `e2e-tests/playwright`에서 `npx tsc -b` 오류 파일 목록을 `specs/011-data-spillage-report-ui/baseline-e2e.txt`에 기록
- [X] T004 T001~T003 결과를 [research.md](research.md) 8번의 2026-08-26 측정값과 대조하고, 차이가 있으면 research.md를 현재 값으로 갱신

**Checkpoint**: 기준선 3개 파일이 존재한다. 이후 모든 게이트 판정이 이것을 기준으로 삼는다.

---

## Phase 2: Foundational — 서버 계약과 공용 배관

**Purpose**: 모든 사용자 시나리오가 여기에 의존한다. 이 단계가 끝나기 전에는 어떤 UI도 동작하지 않는다.

⚠️ **US1~US4 착수 전에 완료해야 한다.**

### 서버 계약 (분류 A — upstream 그대로)

- [X] T005 upstream `f0360a83`의 `server/public/model/content_flagging.go` 훅을 적용한다 — `FlagContentActionRequest.Action` 필드와 `ContentFlaggingActionKeep`/`ContentFlaggingActionRemove` 상수 추가
- [X] T006 [P] upstream `f0360a83`의 `server/public/model/content_flagging_report.go` 훅을 적용한다 — `FlaggedPostReportContentReview`에 `ActorDecision`·`ActorUserId`·`ActorUsername` 추가
- [X] T007 upstream `f0360a83`의 `server/channels/app/content_flagging_report.go` 훅을 적용한다 — `GenerateFlaggedPostReport`·`writeFlaggedPostReport`·`writeContentReviewEntry`에 `action` 인자 전달
- [X] T008 upstream `f0360a83`의 `server/channels/api4/content_flagging_report.go` 훅을 적용한다 — `action`을 감사 레코드에 기록하고 앱 계층에 전달
- [X] T009 upstream `f0360a83`의 서버 테스트 2파일을 적용한다 — `server/channels/api4/content_flagging_report_test.go`, `server/channels/app/content_flagging_report_test.go`. **적용 전에 먼저 실행해 실패를 확인하고 출력을 남긴다**
- [X] T010 `cd server && go build ./... && go test ./channels/api4/ ./channels/app/ -run TestGenerateFlaggedPostReport -count=1 -v` 통과를 확인하고 출력을 기록

### 서버 용어 정리 (okrbest 고유 — FR-022)

- [X] T011 `server/channels/app/content_flagging_report.go:458`의 `"@%s generated a report for the quarantined message."`를 우리 용어로 고친다. i18n 카탈로그로 옮길지 여기서 정하고, 옮기면 `server/i18n/en.json`·`ko.json`에 키를 함께 추가한다(FR-021)
- [X] T012 `grep -rn "quarantin" server/channels/app/content_flagging_report.go`로 사용자 노출 문자열에 격리 용어가 0건임을 확인한다 (코드 주석은 판정 대상 아님)

### 웹앱 클라이언트 (분류 A — upstream 그대로)

- [X] T013 `webapp/platform/client/src/client4.test.ts`에 ZIP 응답과 취소를 검증하는 테스트를 추가한다 — upstream `f0360a83`의 client4 테스트 19줄 기반. **구현 전 실패 출력을 남긴다**
- [X] T014 `webapp/platform/client/src/client4.ts`의 `doFetch`에 `application/zip` → `response.blob()` 분기를 추가한다 ([contracts/report-api.md](contracts/report-api.md) 참조)
- [X] T015 `webapp/platform/client/src/client4.ts`에 `getFlaggedPostReportUrl`과 `generateFlaggedPostReport(postId, comment, action?, signal?)`을 추가한다 — upstream 시그니처 그대로
- [X] T016 `cd webapp/platform/client && npx jest src/client4.test.ts` 통과를 확인하고 출력을 기록
- [X] T017 `doFetch` 변경이 기존 호출에 미치는 영향을 확인한다 — `application/zip`을 반환하는 다른 엔드포인트가 없음을 `grep`으로 확인하고 결과를 과제 옆에 적는다 — **결과: 서버에 zip 반환 핸들러 4개(content_flagging_report·export·job·system)가 있으나 webapp client4에는 이들을 부르는 메서드가 없다. 유일한 zip 소비자 `commercial_support_modal.tsx`는 raw `fetch()`를 쓴다. 기존 `doFetch` 소비자 0건 — 회귀 위험 없음.**

### 카드 행 리팩터 (분류 A + 주의)

- [X] T018 `webapp/channels/src/components/properties_card_view/properties_card_view.test.tsx`를 upstream에서 **그대로** 가져온다(격리 용어 0건). **먼저 실행해 실패를 확인한다**
- [X] T019 `webapp/channels/src/components/properties_card_view/properties_card_view.tsx`에 `ActionRow` 타입을 추가하고 `actionsRow?: React.ReactNode`를 `actionRows?: ActionRow[]`로 바꾼다. ⚠️ upstream 파일의 `Quarantined by`·`Quarantined at` defaultMessage(80·104행)는 **가져오지 않는다** — 우리 파일에는 없고 개명 커밋 산물이다
- [X] T020 `webapp/channels/src/components/post_view/data_spillage_report/data_spillage_report.tsx:192`의 호출부를 `actionRows`로 전환한다. 호출부는 이곳 하나뿐임을 `grep -rn "actionsRow" webapp/channels/src/`로 재확인
- [X] T021 `cd webapp/channels && npx jest src/components/properties_card_view src/components/post_view/data_spillage_report` 통과를 확인하고 출력을 기록

**Checkpoint**: 서버가 처분 결정을 보고서에 기록한다. 웹앱이 ZIP을 받을 수 있다. 카드에 라벨 있는 행을 여럿 놓을 수 있다. 이제 UI를 붙일 수 있다.

---

## Phase 3: User Story 1 — 삭제 전에 증거를 확보한다 (P1) 🎯 MVP

**Goal**: 검토자가 처분 확인 창에서 보고서를 받고 처분을 확정한다.

**Independent Test**: 신고된 메시지의 삭제 흐름에서 보고서를 받고, ZIP 안에 원문과 `actor_decision: remove`가 있는지 확인한다.

### 테스트 (구현 전)

- [X] T022 [US1] `webapp/channels/src/components/remove_flagged_message_confirmation_modal/remove_flagged_message_confirmation_modal.test.tsx`에 `form → generating → generated → 확정` 경로 테스트를 추가한다 — upstream 테스트 기반, 키 네임스페이스만 우리 것으로. **실패 출력을 남긴다**
- [X] T023 [P] [US1] 같은 파일에 댓글 보존 테스트를 추가한다 — `generated`에서 뒤로 눌러 `form`으로 와도 댓글이 남는다 (FR-011). **실패 출력을 남긴다**
- [X] T024 [P] [US1] 같은 파일에 취소 테스트를 추가한다 — `generating` 중 창을 닫거나 뒤로 누르면 요청이 취소되고 파일이 저장되지 않는다 (FR-012·FR-013). **실패 출력을 남긴다**
- [X] T025 [P] [US1] 같은 파일에 포커스 테스트를 추가한다 — 각 단계의 기본 포커스가 파괴적 버튼에 있지 않다 (FR-017). **실패 출력을 남긴다**

### 공용 하위 컴포넌트 (분류 A·B·C)

- [X] T026 [P] [US1] `report_notice.tsx`와 `report_notice.scss`를 upstream에서 **그대로** 가져온다 (분류 A) → `webapp/channels/src/components/remove_flagged_message_confirmation_modal/`
- [X] T027 [P] [US1] `flagged_message_body.scss`를 upstream에서 **그대로** 가져온다 (분류 A)
- [X] T028 [US1] `flagged_message_body.tsx`를 가져오고 키 네임스페이스를 `keep_remove_flag_content_modal.*`로 치환한다 (분류 B)
- [X] T029 [US1] `body_main_action_text.tsx`를 가져오고 키를 치환한다. ⚠️ `action_remove.body`·`action_keep.body`의 `defaultMessage`는 upstream 문구가 아니라 **우리 카탈로그 기존 문구**를 쓴다("flagged for review by") — 단, 오타 `posed` → `posted`는 함께 고친다 (분류 C)

### 단계 컴포넌트

- [X] T030 [P] [US1] `form_step/form_step_body.scss`와 `form_step/form_step_footer.scss`를 **그대로** 가져온다 (분류 A)
- [X] T031 [US1] `form_step/form_step_body.tsx`를 가져오고 키를 치환한다 (분류 B)
- [X] T032 [US1] `form_step/form_step_footer.tsx`를 가져오고 키를 치환한다. ⚠️ `download_report_checkbox.label`의 `defaultMessage` "Download quarantined message report"는 **새로 쓴다** (분류 C)
- [X] T033 [P] [US1] `generating_step/generating_step_body.tsx`와 `generating_step/generating_step_footer.tsx`를 가져오고 키를 치환한다 (분류 B)
- [X] T034 [P] [US1] `generated_step/generated_step_body.tsx`와 `generated_step/generated_step_footer.tsx`를 가져오고 키를 치환한다 (분류 B)

### 모달 본체

- [X] T035 [US1] `remove_flagged_message_confirmation_modal.tsx`를 단계 기계로 확장한다 — `Step` 타입, `step`·`downloadReport` 상태 추가, `useEffect`로 `generating`에서 보고서 요청과 `AbortController` cleanup. 전이 규칙은 [data-model.md](data-model.md) 4번 표를 따른다. 외부 props는 바꾸지 않는다
- [X] T036 [US1] `remove_flagged_message_confirmation_modal.scss`에 upstream 변경분을 반영한다 (분류 A — 격리 용어 없음)
- [X] T037 [US1] 파일 저장 규약을 구현한다 — 이름 `flagged-post-<postId>-<timestamp>.zip`, 저장 후 객체 URL 해제, 취소된 요청은 저장 안 함 ([contracts/ui-contracts.md](contracts/ui-contracts.md) 4번)

### i18n (US1 사용분)

- [X] T038 [US1] `webapp/channels/src/i18n/en.json`에 US1이 쓰는 키를 추가한다 — `generating.title`, `generated.title`, `action_keep.generating.body`, `action_keep.generated.body`, `action_remove.generating.body`, `action_remove.generated.body`, `action_keep.permanent_button_text`, `action_remove.permanent_button_text`, `back.button_text`, `continue.button_text`, `download_again.button_text`, `download_report_checkbox.label`
- [X] T039 [US1] `webapp/channels/src/i18n/ko.json`에 T038과 **같은 키를** 한국어로 채운다 (FR-021, 원칙 V). 용어는 `콘텐츠 신고`/`신고`/`메시지 유지`/`메시지 삭제` 계열
- [X] T040 [US1] `en.json`의 `keep_remove_flag_content_modal.action_keep.body`·`action_remove.body`의 오타 `posed`를 `posted`로 고친다. `ko.json`은 해당 없음(한국어 문구에 대응 오타 없음)

### 검증

- [X] T041 [US1] `cd webapp/channels && npx jest src/components/remove_flagged_message_confirmation_modal` 통과를 확인하고 출력을 기록

**Checkpoint**: User Story 1이 독립적으로 동작한다. 보고서를 받고 처분을 확정할 수 있다. **여기까지가 MVP다.**

---

## Phase 4: User Story 2 — 보고서 없이 삭제하려면 한 번 더 확인한다 (P1)

**Goal**: 보고서를 포기하고 삭제하려는 검토자에게 결과를 명시하고 재확인한다.

**Independent Test**: 보고서 받기를 해제하고 삭제를 시도해 추가 확인 단계가 뜨는지, 유지에서는 뜨지 않는지 확인한다.

**Dependencies**: Phase 3(모달 단계 기계)이 있어야 한다.

### 테스트 (구현 전)

- [X] T042 [US2] `remove_flagged_message_confirmation_modal.test.tsx`에 비대칭 테스트를 추가한다 — 보고서 없이 **삭제**하면 `skip_confirm`을 거치고(FR-006), 보고서 없이 **유지**하면 바로 처리된다(FR-008). **실패 출력을 남긴다**
- [X] T043 [P] [US2] 같은 파일에 `skip_confirm`에서 뒤로 눌렀을 때 댓글이 유지되는지 테스트를 추가한다 (FR-011). **실패 출력을 남긴다**

### 구현

- [X] T044 [P] [US2] `skip_confirm_step/skip_confirm_step_footer.scss`를 upstream에서 **그대로** 가져온다 (분류 A)
- [X] T045 [US2] `skip_confirm_step/skip_confirm_step_body.tsx`와 `skip_confirm_step/skip_confirm_step_footer.tsx`를 가져오고 키를 치환한다 (분류 B)
- [X] T046 [US2] 모달 본체에 `skip_confirm` 전이를 배선한다 — `form`에서 보고서 미선택 + `remove`, `generating`에서 보고서 포기 + `remove`. 두 경로 모두 [data-model.md](data-model.md) 4번 표를 따른다

### i18n

- [X] T047 [US2] `en.json`에 US2 키를 추가한다 — `action_remove_without_report.title`, `action_remove_without_report.button_text`, `action_remove.skip_confirm.body`, `skip_report_download.button_text`
- [X] T048 [US2] `ko.json`에 T047과 같은 키를 채운다. `action_remove.skip_confirm.body`는 **이후 생성하는 보고서에 원문이 담기지 않는다**는 사실을 반드시 담아야 한다 (FR-007)

### 검증

- [X] T049 [US2] `npx jest src/components/remove_flagged_message_confirmation_modal` 통과를 확인하고 출력을 기록

**Checkpoint**: 보고서 없는 삭제가 재확인을 거친다. 유지는 그대로 빠르다.

---

## Phase 5: User Story 3 — 생성이 실패해도 막다른 길에 갇히지 않는다 (P2)

**Goal**: 보고서 생성 실패 시 재시도·포기·되돌아가기를 제공하되, 실패를 모른 채 확정하지 못하게 막는다.

**Independent Test**: 생성을 실패시키고 세 경로가 모두 동작하는지, 확정 버튼이 비활성인지 확인한다.

**Dependencies**: Phase 3(모달 단계 기계)이 있어야 한다.

### 테스트 (구현 전)

- [X] T050 [US3] `remove_flagged_message_confirmation_modal.test.tsx`에 실패 경로 테스트를 추가한다 — `error`에서 확정 버튼이 **비활성**이다 (FR-009). **실패 출력을 남긴다**
- [X] T051 [P] [US3] 같은 파일에 재시도 테스트를 추가한다 — `error`에서 다시 시도하면 `generating`으로 간다. **실패 출력을 남긴다**
- [X] T052 [P] [US3] 같은 파일에 포기 테스트를 추가한다 — `error`에서 보고서를 포기하면 `skip_confirm`으로 간다 (FR-010). **실패 출력을 남긴다**

### 구현

- [X] T053 [P] [US3] `error_step/error_step_body.scss`를 upstream에서 **그대로** 가져온다 (분류 A)
- [X] T054 [US3] `error_step/error_step_body.tsx`와 `error_step/error_step_footer.tsx`를 가져오고 키를 치환한다 (분류 B)
- [X] T055 [US3] 모달 본체에 `error` 전이를 배선한다 — 생성 실패 시 진입, 재시도·포기·뒤로 세 경로. 확정 버튼은 이 단계에서 비활성

### i18n

- [X] T056 [US3] `en.json`에 US3 키를 추가한다 — `error.title`, `error.body`, `try_again.button_text`
- [X] T057 [US3] `ko.json`에 T056과 같은 키를 채운다

### 검증

- [X] T058 [US3] `npx jest src/components/remove_flagged_message_confirmation_modal` 통과를 확인하고 출력을 기록

**Checkpoint**: 실패해도 검토자가 신고 처리를 끝낼 수 있고, 실패를 모른 채 확정하지는 못한다.

---

## Phase 6: User Story 4 — 처분과 무관하게 보고서만 받는다 (P3)

**Goal**: 신고 내역 화면에서 처분 없이 보고서만 내려받는다.

**Independent Test**: 신고 내역의 보고서 버튼을 눌러 처분 상태가 그대로인지, ZIP에 `actor_decision`이 **없는지** 확인한다.

**Dependencies**: Phase 2만 있으면 된다. **Phase 3~5와 독립이다** — 먼저 착수해도 된다.

### 테스트 (구현 전)

- [X] T059 [US4] `data_spillage_download_report.test.tsx`를 upstream에서 **그대로** 가져온다 (분류 A — 격리 용어 0건). **실패 출력을 남긴다**
- [X] T060 [P] [US4] `data_spillage_report.test.tsx`에 보고서 행이 카드에 나타나는지 테스트를 추가한다 — upstream 33줄 기반. **실패 출력을 남긴다**

### 구현

- [X] T061 [P] [US4] `post_view/data_spillage_report/data_spillage_download_report/data_spillage_download_report.tsx`와 `.scss`를 upstream에서 **그대로** 가져온다 (분류 A). `action`을 보내지 않는 호출임을 확인한다 (FR-015)
- [X] T062 [US4] `data_spillage_report.tsx`의 `actionRows`에 보고서 행을 추가한다 — 라벨 `data_spillage_report.row.report.label`, 처분 버튼 행 라벨은 `row.actions.label`

### i18n

- [X] T063 [US4] `en.json`에 US4 키 5개를 추가한다 — `data_spillage_report.download_report.button_text`, `.failed.button_text`, `.generating.button_text`, `data_spillage_report.row.actions.label`, `.row.report.label`. ⚠️ 이 네임스페이스는 **개명 대상이 아니다** ([research.md](research.md) 2번)
- [X] T064 [US4] `ko.json`에 T063과 같은 키를 채운다

### 검증

- [X] T065 [US4] `npx jest src/components/post_view/data_spillage_report` 통과를 확인하고 출력을 기록

**Checkpoint**: 처분과 무관한 보고서 내려받기가 동작한다.

---

## Phase 7: Polish — 용어 검증·i18n·게이트

**Purpose**: okrbest가 지킬 것을 지켰는지 기계적으로 확인하고, 회귀가 없음을 기준선 대비로 증명한다.

### 용어 검증 (okrbest 고유)

- [ ] T066 [P] 이 기능이 추가·수정한 모든 파일에서 `grep -rn "quarantin"`을 돌려 **i18n 키 id·사용자 노출 문자열에 0건**임을 확인한다 (SC-005). 코드 주석은 판정 대상 아님
- [ ] T067 [P] `grep -rn "keep_remove_quarantined_content_modal" webapp/`으로 잔존 0건을 확인한다 (FR-020)
- [ ] T068 `data_spillage_report.*` 네임스페이스의 기존 5키가 그대로 살아 있는지 확인한다 — 과잉 개명으로 깨뜨리지 않았음을 증명 ([research.md](research.md) 2번)

### i18n

- [ ] T069 `cd webapp/channels && npm run i18n-sync-report -- --since master`로 이 기능이 추가한 24키 중 `ko.json` 미번역이 0건임을 확인한다 (SC-006)
- [ ] T070 `npm run i18n-check-empty`가 exit 0이고 `orphaned` 신규 발생이 0건임을 확인한다
- [ ] T071 서버 i18n을 건드렸다면(T011) `server/i18n/en.json`·`ko.json` 동시 갱신을 확인한다

### 선택 과제

- [ ] T072 [P] `data_spillage_report.keep_message.button_text`의 한국어 "메시지 보관"이 모달의 "메시지 유지"와 어긋난다. 맞출지 결정하고, 맞추면 `ko.json`을 고친다. **필수 아님** — 안 하면 이 과제 옆에 사유를 적는다

### 품질 게이트

- [ ] T073 타입을 바꿨으면 `cd webapp/platform/types && npm run build`로 dist를 먼저 다시 빌드한다. 건너뛰면 Playwright `tsc`가 우리 변경 탓처럼 보이는 오류를 낸다 ([quickstart.md](quickstart.md) 선행 조건)
- [ ] T074 `cd server && make check-style && make test-server` — T001 기준선과 **목록 diff**로 판정. 신규 실패 0건
- [ ] T075 `cd webapp && npm run check && npm run check-types && npm run test` — T002 기준선과 목록 diff로 판정. 신규 실패 0건
- [ ] T076 `cd e2e-tests/playwright && npx tsc -b` — T003 기준선과 목록 diff로 판정

### 종단 검증

- [ ] T077 [quickstart.md](quickstart.md) 3번 실주행을 수행한다. **라이선스(Enterprise Advanced)가 없으면 미검증으로 표기하고 통과했다고 적지 않는다** (FR-024의 귀결)
- [ ] T078 SC-001~SC-008 실측값을 기록한다 — 특히 SC-001(90초), SC-002(확인 건너뛴 경로 0건), SC-003(실패 상태 확정 0건), SC-005(격리 용어 0건), SC-006(미번역 0건)

---

## Dependencies

```
Phase 1 (기준선)
   ↓
Phase 2 (서버 계약 + client4 + ActionRow)  ← 모든 스토리의 전제
   ├──────────────┬──────────────┐
   ↓              ↓              ↓
Phase 3 (US1)   Phase 6 (US4)   (US4는 Phase 2만 있으면 됨)
   ↓
Phase 4 (US2) ─┐
Phase 5 (US3) ─┤ 둘 다 Phase 3의 단계 기계에 의존, 서로는 독립
   ↓           ↓
Phase 7 (Polish)
```

**스토리 간 의존**:

- US1은 Phase 2만 있으면 된다.
- US2·US3은 US1의 모달 단계 기계를 전제한다. 서로는 독립이라 병렬 가능하다.
- **US4는 US1~US3과 완전히 독립이다.** Phase 2 직후 언제든 착수할 수 있다.

---

## Parallel Execution

### Phase 1 — 전부 병렬

```
T001, T002, T003 동시 실행 → T004
```

### Phase 2 — 세 갈래 병렬

```
갈래 A (서버):     T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012
갈래 B (클라이언트): T013 → T014 → T015 → T016 → T017
갈래 C (카드):      T018 → T019 → T020 → T021
```

갈래 간 의존이 없다. 세 사람이면 동시에 간다.

### Phase 3 — 테스트와 SCSS 병렬

```
T022~T025 (테스트 4개) 병렬 작성
T026, T027, T030 (SCSS·분류 A) 병렬
T033, T034 (단계 컴포넌트) 병렬
```

### Phase 4·5 — 서로 병렬

US2와 US3은 다른 단계 컴포넌트를 건드리고 모달 본체에서만 만난다. 배선(T046·T055) 시점만 조율하면 병렬 가능하다.

### Phase 7 — 검증 병렬

```
T066, T067, T072 병렬
T074, T075, T076 병렬 (다른 패키지)
```

---

## Implementation Strategy

### MVP 범위

**Phase 1 + Phase 2 + Phase 3 (US1)**. 여기까지면 검토자가 삭제 전에 증거를 확보할 수 있다. 이 기능의 존재 이유가 충족된다.

### 권장 실행 순서

계획([plan.md](plan.md) 작업 순서)은 US4를 US1보다 먼저 두라고 적었다. 이유는 US4가 훨씬 작고 Phase 2 위에서 바로 완결돼 검증 주기가 짧기 때문이다. 우선순위(P1 > P3)와 어긋나 보이지만 **위험을 먼저 줄이는 선택**이다 — Phase 2의 배관(ZIP 수신·취소·카드 행)이 실제로 동작하는지를 작은 표면에서 먼저 확인한다.

두 선택지 모두 유효하다:

| 순서 | 장점 | 단점 |
|---|---|---|
| Phase 2 → **US4** → US1 → US2 → US3 | Phase 2 배관을 작은 표면에서 먼저 검증. 실패해도 손실이 작다 | 가장 중요한 시나리오가 뒤로 밀린다 |
| Phase 2 → **US1** → US2 → US3 → US4 | MVP를 가장 빨리 세운다 | Phase 2 배관 문제를 큰 표면에서 만난다 |

착수 시점에 하나를 고르고 그 사실을 적는다.

### 증분 인도

1. Phase 1~2 완료 → 서버가 결정을 기록한다. 서버 테스트로 증명 가능
2. + US1 → **MVP**. 삭제 전 증거 확보가 동작한다
3. + US2 → 보고서 없는 삭제에 안전장치가 붙는다
4. + US3 → 실패해도 막히지 않는다
5. + US4 → 처분 없는 감사 경로가 열린다
6. + Phase 7 → 용어·i18n·게이트 증명 완료

---

## 요약

| 항목 | 값 |
|---|---|
| 전체 과제 | **78** |
| Phase 1 (기준선) | 4 |
| Phase 2 (Foundational) | 17 |
| US1 (P1) | 20 |
| US2 (P1) | 8 |
| US3 (P2) | 9 |
| US4 (P3) | 7 |
| Phase 7 (Polish) | 13 |
| 테스트 과제 | 14 (전부 실패 출력 선행) |
| upstream 그대로 | 11파일 + 서버 6파일 |
| 키 치환만 | 12파일 |
| 원문 재작성 | 3문자열 |
