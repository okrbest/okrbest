# Quickstart: 레이아웃 토큰 체계 종단 검증

구현이 끝난 상태에서 아래를 실주행하면 SC-001~005를 판정할 수 있다.

## 선행 조건

- dev 서버 + webpack watch 가동 (`make run-server`, watch 빌드)
- 로그인 가능한 계정 (admin-e2e 등)
- 기준선: 치환 **전** 실측 JSON이 저장돼 있어야 한다 (구현 과제가 생성)

## 1. 토큰 로드 확인

브라우저 콘솔에서:

```js
getComputedStyle(document.documentElement).getPropertyValue('--okr-space-3')
```

기준표의 값이 나오면 통과. 4계열+1(공간·아이콘·타깃·행·radius-ms) 각 1개씩
표본 확인.

## 2. 무변화 치환 검증 (SC-002)

```bash
# 치환 전 저장해 둔 기준 JSON과 치환 후 실측을 비교
node scripts/okrbest/measure-layout.mjs > /tmp/after.json   # 구현 과제가 만드는 실측 스크립트
diff /tmp/baseline-layout.json /tmp/after.json              # 공란이어야 통과
```

실측 항목: 치환 대상 목록(data-model 7절)의 셀렉터별 해당 속성 computed 값과
bounding box.

## 3. 그리드 전수 검사 (SC-004)

```bash
bash scripts/okrbest/check-layout-tokens.sh      # 위반 0, 종료 코드 0
# RED 증거: 대상 파일에 위반 값(예: 5px)을 임시로 넣고 재실행 → 비0 종료 확인 후 원복
```

## 4. 기준표 완전성 (SC-001)

data-model의 "후속 영역 필요 수치 대조표"를 열고, ②헤더·툴바 ③사이드바
④메시지 각 행이 기준표 토큰으로 채워져 있는지 확인 — 빈칸 0.

## 5. 근거 완전성 (SC-003)

data-model 기준표에서 상태=확정 행 전부에 근거(실측 좌표/Figma 노드/출처)가
있는지 훑는다 — 근거 없는 확정 값 0.

## 6. 가이드 단독 사용성 (SC-005)

사용 가이드만 보고 샘플 3건을 푼다:

1. 13px 라벨 옆 아이콘 버튼 — 아이콘 크기·타깃·간격은?
2. 드롭다운 메뉴 행 — 행 높이·좌우 패딩은?
3. 1px 구분선 — 그리드 위반인가?

답이 기준표와 3/3 일치하면 통과.

## 7. 게이트 (원칙 I)

```bash
cd webapp && npm run check && npm run check-types && npm run test
```

실패 목록이 기준선(plan.md 선행 조건 기록)과 같아야 한다 — diff로 제시.
