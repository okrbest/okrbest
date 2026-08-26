# 계약: UI 컴포넌트

**Feature**: 011-data-spillage-report-ui

---

## 1. `PropertiesCardView` — 파괴적 prop 변경

`webapp/channels/src/components/properties_card_view/properties_card_view.tsx`

**변경 전**

```ts
actionsRow?: React.ReactNode;
```

**변경 후**

```ts
export type ActionRow = {
    label: React.ReactNode;
    content: React.ReactNode;
    testId?: string;
};

actionRows?: ActionRow[];
```

**렌더 규약**

- 배열 순서대로 행을 그린다.
- `content`가 falsy면 그 행을 그리지 않는다.
- 각 행은 카드의 기존 라벨/값 격자를 따른다 (`.row > .field` + `.row > .value`).
- `mode === 'full'`일 때만 그린다. 기존 `actionsRow`와 같은 조건이다.

**호출부**: `data_spillage_report.tsx:192` **한 곳뿐**이다. `grep -rn "actionsRow" webapp/channels/src/`로 확인했다.

**왜 파괴적 변경을 감수하는가**: 신고 내역 카드에 라벨 있는 행이 둘 필요하다 — 처분 버튼("Actions")과 보고서 내려받기("Report"). 단일 노드로는 호출부가 카드 내부 마크업 규칙을 복제해야 한다.

---

## 2. `KeepRemoveFlaggedMessageConfirmationModal` — 단계 흐름

`webapp/channels/src/components/remove_flagged_message_confirmation_modal/`

**외부 인터페이스는 바뀌지 않는다.** 호출부가 넘기는 props(`action`, `flaggedPost`, `onExited` 등)를 그대로 유지한다. 바뀌는 것은 내부 흐름이다.

**단계별 화면 규약**

| 단계 | 본문 | 왼쪽 버튼 | 오른쪽 버튼 |
|---|---|---|---|
| `form` | 처분 안내 + 댓글 입력 + 보고서 받기 선택 | — | 취소 · 진행 |
| `skip_confirm` | 보고서 없이 진행하면 원문이 남지 않는다는 경고 | — | 뒤로 · 확정(위험) |
| `generating` | 생성 중 안내 + 진행 표시 | 보고서 포기 | 뒤로 · 확정(비활성) |
| `generated` | 생성 완료 안내 | 다시 받기 | 뒤로 · 확정 |
| `error` | 생성 실패 안내 | 보고서 포기(위험) | 뒤로 · 확정(**비활성**) |

**포커스 규약**(FR-017): 파괴적 동작에 기본 포커스를 두지 않는다. Enter만 눌러서 삭제가 확정되거나 보고서가 포기되면 안 된다. 각 단계에서 기본 포커스는 비파괴적 버튼(취소·뒤로·다시 받기)에 둔다.

**제목 규약**(FR-018): 단계가 바뀌면 모달 제목이 현재 단계를 나타낸다. `generating`은 "보고서 생성 중", `generated`는 "보고서 생성 완료", `error`는 "보고서를 만들지 못했습니다", `skip_confirm`은 "보고서 없이 삭제할까요?" 계열.

**댓글 보존**(FR-011): 어느 단계에서 `form`으로 돌아오든 입력한 댓글이 남아 있다.

**전이 규칙 전체**: [data-model.md](../data-model.md)의 4번 참조.

---

## 3. 독립 내려받기 버튼

`webapp/channels/src/components/post_view/data_spillage_report/` 아래 신규 컴포넌트.

**Props**

```ts
type Props = {
    flaggedPostId: string;
};
```

**동작 규약**

- 누르면 `Client4.generateFlaggedPostReport(flaggedPostId, '', undefined, signal)`를 호출한다. `action`을 보내지 않는다(FR-015).
- 상태 `idle | generating | error`. 상태별 라벨은 i18n 키 `data_spillage_report.download_report.*`를 쓴다.
- `generating` 중에 다시 누르면 아무 일도 하지 않는다(FR-016).
- 컴포넌트가 언마운트되면 진행 중인 요청을 취소한다.
- 성공하면 파일을 저장하고 `idle`로 돌아온다.

**신고 내역 카드에서의 위치**: `PropertiesCardView`의 `actionRows` 두 번째 행. 라벨은 `data_spillage_report.row.report.label`.

---

## 4. 파일 저장 규약

모달과 독립 버튼이 공유한다.

- 파일 이름은 `flagged-post-<postId>-<timestamp>.zip` 형태를 유지한다. 이미 우리 용어에 맞는다.
- 저장 후 생성한 객체 URL을 해제한다.
- 취소된 요청은 저장하지 않는다(FR-013).

---

## 5. 서버 채널 메시지 문구

`server/channels/app/content_flagging_report.go`

보고서를 생성하면 검토 채널에 알림 메시지가 올라간다. 현재 문구가 격리 용어를 쓴다:

```
@%s generated a report for the quarantined message.
```

우리 용어로 고친다(FR-022). 이 문자열은 하드코딩이며 i18n 카탈로그를 거치지 않는다 — 고치면서 i18n으로 옮길지는 계획의 선택지로 둔다. 옮기면 en/ko 키가 하나 늘고(FR-021), 그대로 두면 영문 고정으로 남는다.
