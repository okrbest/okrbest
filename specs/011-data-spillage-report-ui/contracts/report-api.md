# 계약: 보고서 생성 API

**Feature**: 011-data-spillage-report-ui

기존 엔드포인트를 확장한다. 새 엔드포인트를 만들지 않는다.

---

## `POST /api/v4/content_flagging/post/{post_id}/report`

신고된 게시물의 증거 보고서를 조립해 ZIP으로 내려보낸다. 서버는 보고서를 보관하지 않는다.

### 접근 조건

기존 규칙을 그대로 따른다. 이번 작업이 바꾸지 않는다.

1. Enterprise Advanced 라이선스 (`requireContentFlaggingAvailable`)
2. 콘텐츠 신고 기능 활성화 (`requireContentFlaggingEnabled`)
3. 호출자가 해당 팀의 콘텐츠 검토자 (`requireTeamContentReviewer`)

셋 중 하나라도 어긋나면 기존 오류를 그대로 반환한다.

### 요청 본문

```json
{
  "comment": "조사 메모",
  "action": "remove"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `comment` | string | 설정에 따름 | 검토자 댓글. `reviewer_comment_required`가 켜져 있으면 필수 |
| `action` | string | 아니오 | **신규**. `keep` 또는 `remove`. 생략하면 처분 결정을 기록하지 않는다 |

**`action` 생략의 의미**: 처분과 무관하게 보고서만 받는 경우다(FR-014·FR-015). 신고 내역의 독립 내려받기 버튼이 이 형태로 호출한다.

**`action` 값이 `keep`/`remove`가 아니면**: 기존 검증 흐름을 따른다. 이번 작업이 새 검증을 추가하지 않는다.

### 응답

**성공 — `200 OK`**

```
Content-Type: application/zip
```

본문은 ZIP 바이트다. 구성은 [data-model.md](../data-model.md)의 3번 참조.

`action`을 보냈으면 ZIP 안 `content_review.yaml`에 다음이 실린다:

```yaml
actor_decision: remove
actor_user_id: <호출자 사용자 ID>
actor_username: <호출자 사용자명>
```

`action`을 생략했으면 세 키가 나타나지 않는다(`omitempty`).

**실패**

| 상태 | 조건 |
|---|---|
| `400` | 댓글이 필수인데 비어 있음 |
| `403` | 호출자가 해당 팀의 검토자가 아님 |
| `501` | 라이선스 없음 또는 기능 꺼짐 |
| `500` | 보고서 조립 실패 |

### 감사 기록

기존 항목에 더해 `action`을 감사 레코드 파라미터로 남긴다.

---

## 웹앱 클라이언트

`webapp/platform/client/src/client4.ts`. 현재 이 메서드가 **없다** — 신규 작성이다.

```ts
getFlaggedPostReportUrl(postId: string): string

generateFlaggedPostReport(
    postId: string,
    comment: string,
    action?: 'keep' | 'remove',
    signal?: AbortSignal,
): Promise<Blob>
```

**동작 규약**

- 성공하면 ZIP `Blob`으로 resolve한다.
- `signal`로 취소할 수 있다. 취소되면 요청이 중단되고 호출부는 결과를 무시한다(FR-012·FR-013).
- 실패하면 기존 `ClientError`로 reject한다.

**`doFetch` 확장이 선행 조건이다.** 현재 `doFetch`는 `application/json`과 `application/x-ndjson`만 분기하고 나머지를 `response.text()`로 읽는다. ZIP을 텍스트로 읽으면 바이너리가 깨진다. 다음 분기를 추가한다:

```ts
} else if (contentType === 'application/zip') {
    data = await response.blob();
}
```

이 분기는 `doFetch`를 쓰는 모든 호출에 영향을 준다. 현재 `application/zip`을 반환하는 엔드포인트는 이 보고서 API뿐이므로 회귀 위험은 낮지만, 기존 호출이 ZIP을 텍스트로 받아 처리하던 곳이 없는지 확인한다.

---

## Go 클라이언트

`server/public/model/client4.go`. `#36339`(`2e5c23dc8b`) adapt로 이미 있다. `action`을 실을 수 있도록 요청 구조체 변경분만 따라간다 — 별도 시그니처 변경은 필요 없다. 요청 본문이 `FlagContentActionRequest`이기 때문이다.
