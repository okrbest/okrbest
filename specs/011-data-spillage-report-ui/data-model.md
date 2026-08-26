# 데이터 모델: 신고 메시지 증거 보고서 UI

**Feature**: 011-data-spillage-report-ui
**Date**: 2026-08-26

이 기능은 DB 스키마를 바꾸지 않는다. 새 테이블도, 마이그레이션도 없다. 바뀌는 것은 **요청·응답 형태**, **보고서 안의 기록**, **UI 상태**다.

---

## 1. 처분 요청 (`FlagContentActionRequest`)

`server/public/model/content_flagging.go`

| 필드 | 타입 | 기존/신규 | 설명 |
|---|---|---|---|
| `Comment` | `string` | 기존 | 검토자 댓글. 설정에 따라 필수 |
| `Action` | `string` | **신규** | 검토자의 처분 결정. `keep` 또는 `remove` |

**상수** (신규):

- `ContentFlaggingActionKeep = "keep"`
- `ContentFlaggingActionRemove = "remove"`

**검증 규칙**:

- `Action`은 생략 가능하다(`json:"action,omitempty"`). 처분과 무관한 독립 내려받기가 비워 보낸다(FR-015).
- `Comment` 필수 여부는 기존 `reviewer_comment_required` 설정을 따른다. 이번 작업이 바꾸지 않는다.

---

## 2. 보고서 안의 검토 기록 (`FlaggedPostReportContentReview`)

`server/public/model/content_flagging_report.go` → ZIP 안 `content_review.yaml`

| 필드 | YAML 키 | 기존/신규 |
|---|---|---|
| `ReviewerUsername` | `reviewer_username` | 기존 |
| `ReviewerComment` | `reviewer_comment` | 기존 |
| `ActionTime` | `action_time` | 기존 |
| `ActorDecision` | `actor_decision` | **신규** — `keep`/`remove`, 비어 있으면 처분 없이 생성 |
| `ActorUserId` | `actor_user_id` | **신규** |
| `ActorUsername` | `actor_username` | **신규** |

**규칙**:

- 세 신규 필드는 `omitempty`다. 독립 내려받기(FR-014)는 `Action`을 보내지 않으므로 비어서 나간다.
- 필드 이름에 격리 용어가 없다. 용어 제약(FR-019) 대상이 아니다.

---

## 3. 보고서 묶음 (ZIP)

기존 구조를 바꾸지 않는다. 참고용으로만 적는다.

| 항목 | 내용 |
|---|---|
| 게시물 본문 | 신고된 메시지 원문 |
| 첨부 파일 | 원본 순서 유지 |
| 편집 이력 | 수정 전 버전들 |
| `content_review.yaml` | 위 2번의 검토 기록 |
| `report_metadata.yaml` | 생성자·생성 시각 |

**중요한 성질**: 보고서는 **생성 시점의 상태를 고정**한다. 메시지가 삭제된 뒤에 생성하면 원문이 없다(FR-025·FR-026). 서버는 보고서를 보관하지 않는다 — 요청마다 새로 조립해 내려보내고 임시 파일을 지운다.

---

## 4. 처분 확인 흐름의 상태

웹앱 모달 내부 상태. 서버에 저장되지 않는다.

### 단계 (`Step`)

| 값 | 의미 | 확정 버튼 |
|---|---|---|
| `form` | 댓글 입력, 보고서 받을지 선택 | 활성 (다음 단계로) |
| `skip_confirm` | 보고서 없이 삭제하려는 검토자에게 재확인 | 활성 (처분 실행) |
| `generating` | 보고서 생성 중 | 없음 |
| `generated` | 생성·저장 완료 | 활성 (처분 실행) |
| `error` | 생성 실패 | **비활성** (FR-009) |

### 상태 값

| 이름 | 타입 | 초기값 | 설명 |
|---|---|---|---|
| `step` | `Step` | `form` | 현재 단계 |
| `comment` | `string` | `''` | 검토자 댓글. 단계를 옮겨도 유지한다(FR-011) |
| `commentError` | `string` | `''` | 댓글 검증 오류 |
| `requestError` | `string` | `''` | 처분 API 오류 |
| `downloadReport` | `boolean` | `true` | 보고서를 받을지. 기본은 받는다 |
| `submitting` | `boolean` | `false` | 처분 API 진행 중 |
| `showCommentPreview` | `boolean` | `false` | 기존 값. 이번 작업이 바꾸지 않는다 |

### 전이 규칙

`keep`과 `remove`가 비대칭이다. 유지는 되돌릴 수 있고 삭제는 아니다.

| 현재 | 사건 | 조건 | 다음 |
|---|---|---|---|
| `form` | 진행 | 댓글 검증 실패 | `form` (오류 표시, 요청 없음) |
| `form` | 진행 | `downloadReport` | `generating` |
| `form` | 진행 | `!downloadReport` && `keep` | — (처분 API 즉시 호출) |
| `form` | 진행 | `!downloadReport` && `remove` | `skip_confirm` |
| `skip_confirm` | 뒤로 | | `form` |
| `skip_confirm` | 확정 | | — (처분 API 호출) |
| `generating` | 성공 | | `generated` (파일 저장) |
| `generating` | 실패 | | `error` |
| `generating` | 보고서 포기 | `keep` | — (요청 취소 후 처분 API 호출) |
| `generating` | 보고서 포기 | `remove` | `skip_confirm` (요청 취소) |
| `generating` | 뒤로 | | `form` (요청 취소) |
| `generated` | 다시 받기 | | `generating` |
| `generated` | 확정 | | — (처분 API 호출) |
| `generated` | 뒤로 | | `form` |
| `error` | 다시 시도 | | `generating` |
| `error` | 보고서 포기 | | `skip_confirm` |
| `error` | 확정 | | **불가** — 버튼 비활성 |

**취소 규칙**(FR-012·FR-013): `generating`에서 벗어나는 모든 경로가 진행 중인 요청을 취소한다. 창을 닫는 경우도 포함한다. 취소된 요청의 결과는 화면에 반영하지 않고 파일도 저장하지 않는다.

---

## 5. 독립 내려받기 버튼의 상태

신고 내역 화면(`data_spillage_report`)에 붙는다. 모달과 상태를 공유하지 않는다.

| 값 | 의미 |
|---|---|
| `idle` | 대기. 누르면 생성 시작 |
| `generating` | 생성 중. 중복 요청을 막는다(FR-016) |
| `error` | 실패. 다시 누르면 재시도 |

성공하면 파일을 저장하고 `idle`로 돌아온다. 별도 완료 상태를 두지 않는다 — 처분을 바꾸지 않으므로 남길 결과가 없다(FR-015).

---

## 6. 카드 행 (`ActionRow`)

`properties_card_view`가 노출하는 형태. 기존 `actionsRow?: React.ReactNode`를 대체한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `label` | `React.ReactNode` | 행 왼쪽 라벨 |
| `content` | `React.ReactNode` | 행 오른쪽 내용. 비어 있으면 행을 그리지 않는다 |
| `testId` | `string?` | 테스트 선택자 |

**왜 바꾸는가**: 신고 내역 카드에 라벨 있는 행이 둘 필요하다 — 처분 버튼 행("Actions")과 보고서 내려받기 행("Report"). 단일 노드로는 카드의 라벨/값 격자를 호출부가 복제해야 한다.

**파급 범위**: 호출부는 `data_spillage_report.tsx:192` **한 곳뿐**이다(`grep` 확인).

---

## 7. i18n 키

| 네임스페이스 | 기존 | 추가 | 비고 |
|---|---|---|---|
| `keep_remove_flag_content_modal.*` | 12 | **19** | upstream의 `keep_remove_quarantined_content_modal.*`에서 이름만 바꿔 가져온다 |
| `data_spillage_report.*` | 5 | **5** | upstream 그대로. 이 네임스페이스는 개명 대상이 아니다 |

**추가 19키** (모달):

`action_keep.generated.body`, `action_keep.generating.body`, `action_keep.permanent_button_text`, `action_remove.generated.body`, `action_remove.generating.body`, `action_remove.permanent_button_text`, `action_remove.skip_confirm.body`, `action_remove_without_report.button_text`, `action_remove_without_report.title`, `back.button_text`, `continue.button_text`, `download_again.button_text`, `download_report_checkbox.label`, `error.body`, `error.title`, `generated.title`, `generating.title`, `skip_report_download.button_text`, `try_again.button_text`

**추가 5키** (신고 내역):

`download_report.button_text`, `download_report.failed.button_text`, `download_report.generating.button_text`, `row.actions.label`, `row.report.label`

**문구 재작성 대상**: `download_report_checkbox.label`의 upstream 원문은 "Download quarantined message report"다. 격리 용어를 쓰므로 우리 용어로 다시 쓴다. 나머지 23개 원문에는 격리 용어가 없다.

**en/ko 동시 갱신**(FR-021): 24키 모두 양쪽 카탈로그를 채운다. 기존 12키는 이미 동기 상태다.

**기존 번역 불일치 하나**: `data_spillage_report.keep_message.button_text`의 한국어가 "메시지 보관"인데 모달은 "메시지 유지"를 쓴다. 같은 동작을 다르게 부른다. 이번 범위에서 맞출지는 계획의 선택 과제로 둔다 — 필수는 아니다.
