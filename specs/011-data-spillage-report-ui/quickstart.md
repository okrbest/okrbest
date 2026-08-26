# 검증 안내: 신고 메시지 증거 보고서 UI

**Feature**: 011-data-spillage-report-ui

이 문서는 기능이 끝났는지 판정하는 절차다. 구현 코드는 담지 않는다.

---

## 선행 조건

| 항목 | 값 |
|---|---|
| Node | v24 (webapp 작업 전 `nvm use 24`. 하지 않으면 테스트가 로드에 실패한다) |
| Go | 1.26.2 |
| DB | 로컬 Postgres (`mattermost-postgres` 컨테이너, 5432) |
| 라이선스 | **Enterprise Advanced** — 3번 실주행에 필요 |

**라이선스 없이 확인 가능한 범위**: 1번(서버 계약)과 2번(웹앱 단위)까지다. 3번 실주행은 라이선스가 있어야 한다. FR-024로 게이트를 유지하기로 했기 때문이다. 라이선스가 없으면 그 사실을 결과에 적고 1·2번 증거로 판정한다 — 통과했다고 적지 않는다.

**타입 패키지 함정**: `webapp/platform/types`를 고쳤으면 `cd webapp/platform/types && npm run build`를 먼저 돌린다. 빌드 산출물(`lib/`)이 낡으면 Playwright `tsc -b`가 우리 변경 탓처럼 보이는 오류를 낸다.

---

## 0. 기준선 저장 (구현 시작 전)

원칙 I은 회귀를 **실패 목록 diff**로 판정하라고 요구한다. 구현을 시작하기 전에 기준선을 남긴다.

```bash
cd server && make check-style 2>&1 | tail -5
cd webapp && npm run check 2>&1 | grep -E "^/.*\.(ts|tsx|scss)$" | sort -u
cd webapp/channels && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "^src/.*error TS" | sed 's/(.*//' | sort -u
cd e2e-tests/playwright && npx tsc -b 2>&1 | grep "error TS" | sed 's/(.*//' | sort -u
```

[research.md](research.md) 8번에 2026-08-26 측정값이 있다. 시작 시점에 다시 재서 그 목록과 비교한다.

---

## 1. 서버 계약

### 1-1. 검토자 결정이 보고서에 기록되는가

```bash
cd server
go test ./channels/api4/ -run TestGenerateFlaggedPostReport -count=1 -v
```

**기대**: `action: "remove"`로 요청한 보고서의 `content_review.yaml`에서 `actor_decision == "remove"`, `actor_user_id`·`actor_username`이 호출자와 일치.

### 1-2. 앱 계층

```bash
go test ./channels/app/ -run TestGenerateFlaggedPostReport -count=1
```

### 1-3. 처분 없는 생성

**기대**: `action`을 생략하면 `content_review.yaml`에 `actor_decision`·`actor_user_id`·`actor_username`이 나타나지 않는다 (FR-015).

### 1-4. 서버 문구에 격리 용어가 없는가

```bash
grep -rn "quarantin" server/channels/app/content_flagging_report.go
```

**기대**: 사용자 노출 문자열에 격리 용어 0건 (FR-022). 코드 주석은 판정 대상이 아니다.

---

## 2. 웹앱 단위

```bash
cd webapp/channels
npx jest src/components/remove_flagged_message_confirmation_modal \
         src/components/post_view/data_spillage_report \
         src/components/properties_card_view
cd ../platform/client && npx jest src/client4.test.ts
```

**단계 전이 판정** — [data-model.md](data-model.md) 4번의 표 전체가 테스트로 덮여야 한다. 특히:

| 확인 | 근거 요구사항 |
|---|---|
| 보고서 없이 **삭제**하면 `skip_confirm`을 거친다 | FR-006 |
| 보고서 없이 **유지**하면 추가 확인이 없다 | FR-008 |
| `error`에서 확정 버튼이 비활성이다 | FR-009 |
| `generating`에서 뒤로·포기·창 닫기가 요청을 취소한다 | FR-012 |
| 취소된 요청은 파일을 저장하지 않는다 | FR-013 |
| 어느 단계에서 `form`으로 돌아와도 댓글이 남는다 | FR-011 |
| 독립 버튼이 `generating` 중 중복 요청을 내지 않는다 | FR-016 |
| 독립 버튼이 `action`을 보내지 않는다 | FR-015 |
| 파괴적 버튼에 기본 포커스가 없다 | FR-017 |

**원칙 III**: 이 작업은 cherry-pick이 아니라 자체 구현이다. 테스트 예외가 없다. 각 테스트는 **구현 전 실패 출력**을 남긴 뒤에만 완료로 표시한다.

---

## 3. 실주행 (라이선스 필요)

### 3-1. 삭제 전에 증거를 확보한다 (User Story 1)

1. 검토자로 로그인해 신고된 메시지의 처분 창을 연다.
2. 보고서 받기가 선택된 상태에서 댓글을 넣고 진행한다.
3. 생성 중 표시를 확인하고, 완료되면 ZIP이 기기에 저장되는지 본다.
4. ZIP을 풀어 `content_review.yaml`의 `actor_decision`이 `remove`인지, 댓글이 실렸는지 확인한다.
5. 삭제를 확정하고 메시지가 채널에서 사라지는지 본다.

**측정**: 1번부터 5번까지 **90초 이내** (SC-001).

### 3-2. 보고서 없이 삭제하면 한 번 더 묻는다 (User Story 2)

1. 보고서 받기를 해제하고 삭제를 진행한다.
2. 추가 확인 단계가 뜨는지, 문구가 "이후 생성하는 보고서에 원문이 담기지 않는다"는 사실을 밝히는지 본다 (FR-007).
3. 뒤로를 눌러 처음 화면으로 돌아왔을 때 댓글이 남아 있는지 확인한다.
4. **유지**로 같은 절차를 밟아 추가 확인이 **뜨지 않는지** 확인한다.

**측정**: 보고서 없는 삭제 시도 중 확인 단계를 건너뛴 경로 **0건** (SC-002).

### 3-3. 생성 실패에서 빠져나온다 (User Story 3)

서버를 멈추거나 네트워크를 끊어 생성을 실패시킨다.

1. 실패 화면에서 확정 버튼이 **비활성**인지 본다 (SC-003).
2. 다시 시도가 동작하는지 본다.
3. 보고서 포기가 `skip_confirm`으로 넘어가는지 본다.

### 3-4. 처분 없이 보고서만 받는다 (User Story 4)

1. 신고 내역에서 보고서 내려받기를 누른다.
2. 메시지 처분 상태가 그대로인지 확인한다.
3. ZIP의 `content_review.yaml`에 `actor_decision`이 **없는지** 확인한다.
4. 생성 중 같은 버튼을 다시 눌러 중복 요청이 없는지 본다 (SC-004 관련).

### 3-5. 삭제 후 보고서 (FR-025)

메시지를 삭제한 뒤 신고 내역에서 보고서를 받는다.

**기대**: 내려받아진다. 처분 결정과 검토 기록이 들어 있고 원문은 없다 (SC-008).

### 3-6. 용어 (FR-019·SC-005)

이 기능이 그리는 모든 화면과 채널 알림 메시지를 훑는다.

**기대**: `격리`·`quarantine`·`데이터 유출` 계열 용어 **0건**. 한국어 로케일과 영어 로케일 양쪽에서 확인한다.

---

## 4. i18n

```bash
cd webapp/channels
npm run i18n-sync-report -- --since master
npm run i18n-check-empty
```

**기대**:

- 이 기능이 추가한 24키 중 `ko.json` 번역이 빈 것 **0건** (SC-006, FR-021).
- `i18n-check-empty` exit 0.
- `orphaned` 신규 발생 0건.

---

## 5. 품질 게이트 (마감)

```bash
cd server && make check-style && make test-server
cd webapp && npm run check && npm run check-types && npm run test
```

**판정**: 0번에서 저장한 기준선 목록과 비교한다. 실패 **개수**가 아니라 **목록 diff**로 판정한다. 기준선에 없던 항목이 하나라도 늘면 회귀다. 기존 실패로 게이트가 중단되면 그 사실을 기준선 목록으로 보인다 — 서술로 대신하지 않는다.

---

## 완료 판정

아래를 모두 채워야 완료다.

- [ ] 1번 서버 계약 테스트 통과 (출력 첨부)
- [ ] 2번 웹앱 단위 테스트 통과, 각 테스트의 **구현 전 실패 출력** 보유
- [ ] 3번 실주행 완료 — 또는 라이선스 부재를 명시하고 미검증으로 표기
- [ ] 4번 i18n 0건
- [ ] 5번 게이트 목록 diff에 신규 실패 없음
- [ ] SC-001~SC-008 실측값 기록
