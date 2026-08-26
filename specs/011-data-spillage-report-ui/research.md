# Phase 0 조사: 신고 메시지 증거 보고서 UI

**Feature**: 011-data-spillage-report-ui
**Date**: 2026-08-26

명세의 미확정 항목은 `/speckit-specify` 단계에서 사용자 결정으로 모두 해소됐다. 이 문서는 계획을 세우는 데 필요한 **현재 코드 상태**와 **upstream 참조 구현과의 차이**를 확정한다. 추측을 남기지 않는 것이 목적이다.

---

## 1. 서버 계약을 새로 설계할 것인가

**결정**: 설계하지 않는다. upstream `f0360a83`의 서버 6파일을 그대로 쓴다.

**근거**: `git apply --check`로 우리 트리에 깨끗이 적용됨을 확인했다(오프셋 조정도 없음). 변경 내용은 좁고 명확하다.

| 파일 | 변경 |
|---|---|
| `server/public/model/content_flagging.go` | `FlagContentActionRequest`에 `Action string` 추가, `ContentFlaggingActionKeep`/`Remove` 상수 |
| `server/public/model/content_flagging_report.go` | `FlaggedPostReportContentReview`에 `ActorDecision`·`ActorUserId`·`ActorUsername` 추가 |
| `server/channels/app/content_flagging_report.go` | `GenerateFlaggedPostReport`·`writeFlaggedPostReport`·`writeContentReviewEntry`에 `action` 전달 |
| `server/channels/api4/content_flagging_report.go` | 감사 기록에 `action` 파라미터 추가, 앱 호출에 전달 |
| `server/channels/api4/content_flagging_report_test.go` | 검토자 결정이 `content_review.yaml`에 기록되는지 검증 |
| `server/channels/app/content_flagging_report_test.go` | 앱 계층 검증 |

**대안 검토**: 자체 설계 — 기각. 계약이 다르면 이후 upstream 커밋마다 변환 비용이 든다. 이 계약에는 격리 용어가 섞여 있지 않다(필드명 `actor_decision`은 중립).

---

## 2. 용어 제약이 정확히 어디까지 미치는가

**결정**: `keep_remove_quarantined_content_modal.*` → `keep_remove_flag_content_modal.*`만 바꾼다. **`data_spillage_report.*` 네임스페이스는 건드리지 않는다.**

**근거**: 이 구분을 흐리면 과잉 개명으로 기존 키를 깨뜨린다.

- 우리 트리에는 이미 `data_spillage_report.*` 키 5개가 en/ko 양쪽에 있다 — `keep_message.button_text`, `remove_message.button_text`, `view_details.button_text`, `data_spillage_report_post.title`, `data_spillage_report_post.reporting_comment.placeholder`. 컴포넌트 디렉터리 `components/post_view/data_spillage_report/`도 있다. 이 이름들은 제외한 개명 커밋 `f1b9aa052e` **이전부터** 있던 것이고, 사용자에게 노출되는 문자열은 이미 우리 용어다("메시지 삭제", "{user} 검토를 위해 메시지에 플래그 지정").
- 우리가 거부한 것은 **개명 커밋이 도입한 사용자 노출 용어**(quarantine/격리)와 그 키 네임스페이스다. 내부 식별자로서의 `data_spillage_report`는 대상이 아니다.

**추가할 키**: 24개.

| 네임스페이스 | 개수 | 처리 |
|---|---|---|
| `keep_remove_flag_content_modal.*` | 19 | upstream의 quarantined 네임스페이스에서 이름만 바꿔 추가 |
| `data_spillage_report.*` | 5 | upstream 그대로 (`download_report.button_text`, `.failed.button_text`, `.generating.button_text`, `row.actions.label`, `row.report.label`) |

기존 `keep_remove_flag_content_modal.*` 12키는 en/ko 동기 상태다. 새 19키도 en/ko를 함께 채운다(FR-021).

**문구 하나는 반드시 다시 쓴다**: upstream `download_report_checkbox.label` = "Download quarantined message report" → 우리 용어로. 나머지 18개 영문 원문에는 격리 용어가 없다.

**대안 검토**: 두 네임스페이스를 모두 개명 — 기각. 기존 5키와 컴포넌트 경로가 깨지고, 실익이 없다.

---

## 3. 우리 모달과 upstream 모달의 거리

**결정**: upstream의 단계 구성을 채택하되, 파일은 우리 것을 확장한다.

**현재 우리 모달** (`remove_flagged_message_confirmation_modal.tsx`, 229줄):

- 단일 화면. 상태 5개(`comment`, `commentError`, `requestError`, `submitting`, `showCommentPreview`).
- `GenericModal`의 `handleConfirm`으로 `Client4.removeFlaggedPost`/`keepFlaggedPost`를 바로 호출한다.
- 하위 컴포넌트가 없다. `.tsx` 1개 + `.scss` + `.test.tsx`.

**upstream 모달** (재작성 후 358줄 + 하위 컴포넌트 14개 파일):

- 상태 기계 `Step = 'form' | 'skip_confirm' | 'generating' | 'generated' | 'error'`, 상태 7개(`downloadReport`, `step` 추가).
- 단계별 body/footer를 하위 컴포넌트로 분리. `GenericModal`의 `footerContent`로 직접 렌더한다.
- `useEffect`가 `step === 'generating'`일 때 보고서 요청을 띄우고, cleanup에서 `AbortController.abort()`를 부른다.

**단계 전이 규칙** (upstream 코드에서 확정):

| 현재 | 사건 | 다음 |
|---|---|---|
| form | 진행 + 보고서 받기 선택됨 | generating |
| form | 진행 + 보고서 안 받음 + `keep` | 즉시 API 호출 (확인 없음) |
| form | 진행 + 보고서 안 받음 + `remove` | skip_confirm |
| form | 진행 + 댓글 검증 실패 | form (오류 표시, 요청 없음) |
| skip_confirm | 뒤로 | form |
| skip_confirm | 확정 | API 호출 |
| generating | 성공 | generated (+ 파일 저장) |
| generating | 실패 | error |
| generating | 보고서 포기 | 요청 취소 → `keep`이면 API 호출, `remove`면 skip_confirm |
| generating | 뒤로 | 요청 취소 → form |
| generated | 다시 받기 | generating |
| generated | 확정 | API 호출 |
| generated | 뒤로 | form |
| error | 다시 시도 | generating |
| error | 보고서 포기 | skip_confirm |
| error | 확정 | **불가 — 버튼 비활성** |

`keep`과 `remove`의 비대칭이 핵심이다. 유지는 되돌릴 수 있어 추가 확인이 없고, 삭제는 되돌릴 수 없어 skip_confirm을 강제한다(FR-006·FR-008).

**대안 검토**: 우리 모달을 그대로 두고 별도 모달을 새로 만들기 — 기각. 신고 처분 진입점이 둘로 갈라져 검토자가 혼란스럽고, 댓글 검증·설정 연동이 중복된다.

---

## 4. 웹앱 클라이언트가 ZIP을 어떻게 받는가

**결정**: `doFetch`에 `application/zip` 분기를 추가하고 `generateFlaggedPostReport`를 새로 만든다.

**근거**: 현재 `doFetch`는 [client4.ts:4649-4658](../../webapp/platform/client/src/client4.ts)에서 `application/json`과 `application/x-ndjson`만 분기하고 나머지를 `response.text()`로 읽는다. ZIP을 텍스트로 읽으면 바이너리가 깨진다.

추가할 것:

```
} else if (contentType === 'application/zip') {
    data = await response.blob();
}
```

그리고 `Client4.generateFlaggedPostReport(postId, comment, action?, signal?) → Promise<Blob>`. `signal`을 `doFetch` 옵션으로 흘려 취소를 지원한다.

**주의**: 우리 `client4.ts`에는 이 메서드가 없다. Go 클라이언트(`server/public/model/client4.go`)에만 `#36339` adapt로 들어와 있다. 웹앱 쪽은 신규 작성이다.

**대안 검토**: 링크 이동(`window.location`)으로 내려받기 — 기각. 진행 상태 표시와 취소가 불가능하고, 오류를 잡을 수 없다(FR-002·FR-009·FR-012).

---

## 5. 신고 내역 화면에 버튼을 어떻게 붙이는가

**결정**: `PropertiesCardView`의 `actionsRow` prop을 `actionRows: ActionRow[]`로 바꾸는 upstream 리팩터를 함께 받는다.

**근거**: 현재 `PropertiesCardView`는 `actionsRow?: React.ReactNode` 하나만 받는다. 보고서 내려받기 버튼은 처분 버튼과 **다른 행**에 라벨과 함께 놓여야 하는데(각각 `row.actions.label`="Actions", `row.report.label`="Report"), 단일 노드로는 라벨 있는 행을 둘 만들 수 없다.

upstream 변경:

```
export type ActionRow = { label: React.ReactNode; content: React.ReactNode; testId?: string };
actionsRow?: React.ReactNode  →  actionRows?: ActionRow[]
```

호출부는 `data_spillage_report.tsx` 한 곳뿐이라 파급이 좁다. `grep`으로 확인 대상이다.

**대안 검토**: `actionsRow` 안에 두 행을 직접 조립 — 기각. 카드 레이아웃(라벨/값 격자)이 컴포넌트 내부 규칙인데 호출부가 그 마크업을 복제하게 된다.

---

## 6. 서버 문자열의 용어 오염을 언제 고치는가

**결정**: 이 기능 범위 안에서 고친다(FR-022).

**대상**: `server/channels/app/content_flagging_report.go:458`

```
message := fmt.Sprintf("@%s generated a report for the quarantined message.", generator.Username)
```

**근거**: `#36339`(`2e5c23dc8b`) adapt 때 딸려 들어왔다. 이 기능이 바로 이 메시지를 만들어내는 흐름을 UI로 노출하므로, 여기서 고치지 않으면 검토자가 보고서를 받을 때마다 "quarantined message"라는 채널 메시지를 보게 된다.

**주의**: 이 문자열은 하드코딩이며 i18n 카탈로그를 거치지 않는다. 고칠 때 i18n으로 옮길지는 계획 단계에서 정한다 — 옮기면 en/ko 키가 추가되고(FR-021), 그대로 두면 영문 고정이다.

---

## 7. 테스트를 어디까지 가져오는가

**결정**: upstream 테스트를 기반으로 삼되, 용어 개명분을 반영해 다시 쓴다.

upstream이 추가하는 테스트:

| 파일 | 줄 | 성격 |
|---|---|---|
| `remove_flagged_message_confirmation_modal.test.tsx` | +278 | 단계 전이·취소·오류 경로 |
| `data_spillage_download_report.test.tsx` | 111 (신규) | 독립 버튼 상태 |
| `properties_card_view.test.tsx` | 99 (신규) | `actionRows` 렌더 |
| `data_spillage_report.test.tsx` | +33 | 행 구성 |
| `content_flagging_report_test.go` (api4) | +41 | `content_review.yaml`의 결정 기록 |
| `content_flagging_report_test.go` (app) | +95 | 앱 계층 |

서버 테스트 2개는 그대로 쓴다(용어 무관). 웹앱 테스트 4개는 키 이름이 바뀌므로 그에 맞춰 조정한다.

**원칙 III 적용**: 이 작업은 cherry-pick이 아니라 자체 구현이다. 테스트 예외가 적용되지 않는다. 각 테스트 과제는 **구현 전 실패 출력**을 남긴 뒤에 완료로 표시한다.

---

## 8. 품질 게이트 기준선

**결정**: 구현 시작 전에 기준선을 저장한다(원칙 I).

현재 알려진 기존 실패 — 이번 작업과 무관하며, 마감 때 목록 diff의 기준이 된다:

| 게이트 | 기준선 상태 |
|---|---|
| `server/` `make check-style` | **0 issues** (2026-08-26 측정) |
| `webapp/` `npm run check` | 오류 46파일 (lexical_editor 계열 다수). 이번 작업 접촉 예정 파일은 `admin_definition.tsx` 1건뿐이며 그마저 무관한 기존 오류다 |
| `webapp/` `tsc -b` | 오류 5파일 — `admin_definition_ldap_wizard.tsx`, `channel_header.test.tsx`, `emoji_node.test.ts`, `markdown_paste_plugin.tsx`, `post_view.test.tsx` |
| `e2e-tests/playwright` `tsc -b` | 오류 5파일 — `abac_public_channels.spec.ts`, `deletion-report.spec.ts`, `group_message_profiles.spec.ts`, `display_name_in_selector.spec.ts`, `user_attributes.spec.ts` |

**함정 기록**: `webapp/platform/types`의 빌드 산출물(`lib/`)이 낡으면 Playwright `tsc -b`가 우리 변경 탓처럼 보이는 오류를 낸다. 타입을 바꾼 뒤에는 `npm run build`로 `types` 패키지를 먼저 다시 빌드한다. 2026-08-26 sync 세션에서 실제로 겪었다.

---

## 9. 라이선스 게이트를 어떻게 다루는가

**결정**: 건드리지 않는다(FR-024). 기존 `requireContentFlaggingAvailable`·`requireContentFlaggingEnabled` 검사를 그대로 통과하는 경로에만 UI를 붙인다.

**결과**: Enterprise Advanced 라이선스가 없는 배포에서 이 기능은 화면에 나타나지 않는다. 명세 Assumptions에 감수 사실을 적었다.

**검증에 미치는 영향**: quickstart 실주행에는 라이선스가 필요하다. 라이선스 없이 확인할 수 있는 범위는 단위 테스트와 서버 계약 테스트로 한정된다. 이 제약을 quickstart에 명시한다.
