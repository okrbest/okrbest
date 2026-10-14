# Quickstart: 레일 제품 아이콘 액센트 색상 상태

**Date**: 2026-10-14 | **Plan**: [plan.md](./plan.md)

구현이 끝났을 때 이 문서의 시나리오를 실주행해 SC를 실측한다.

## 준비물

- dev 서버 실행 중 (`server`에서 `set -a; . ./.env; set +a && make run` —
  DEVELOPMENT.md 6절). webpack watch가 함께 떠 있어야 수정이 자동 반영된다.
- 로그인 계정 1개. 레일에 제품 버튼이 2개 이상 보이는 상태
  (채널은 항상 있고, 보드·플레이북 플러그인이 켜져 있으면 3개).
- 테마 토글은 레일 하단(해/달 아이콘)에 있다 — 라이트/다크/시스템.

## 테스트 명령

```bash
cd webapp/channels
# 기준선(구현 전) 저장 — 원칙 I
{ npm run check; npm run check-types; npm run test -- --silent; } 2>&1 \
  | tail -40 > ../../specs/028-rail-icon-accents/baseline.txt
# 대상 테스트 (applyTheme dataset + 기존 레일 버튼 회귀)
npx jest src/utils/utils src/components/team_sidebar --silent
# 게이트 3종 (완료 근거로 출력 제시)
npm run check && npm run check-types && npm run test
```

## 실측 시나리오 (SC 매핑)

색·치수 실측은 브라우저 DevTools 콘솔에서 한다. 공통 스니펫:

```js
const pill = (sel) => getComputedStyle(document.querySelector(sel));
pill('.rail-product-button.active .rail-product-button__icon').backgroundColor;
pill('.rail-product-button:not(.active) .rail-product-button__icon').backgroundColor;
document.querySelector('.rail-product-button svg').getBoundingClientRect();
```

| SC | 시나리오 | 판정 기준 |
|---|---|---|
| SC-001 | 라이트 모드에서 채널 화면을 연다. 레일 스크린샷 | 선택 알약 배경 `rgb(79, 70, 229)`(#4F46E5) + 흰 아이콘, 비선택 알약은 `rgb(8, 102, 255)`(#0866FF) 솔리드 + 흰 아이콘 (2차 확정 — research R2-v3) |
| SC-002 | 선택 상태에서 테마 토글로 다크 전환. 전환 전후 스크린샷 | 알약 색은 공용 고정값(#4F46E5/#0866FF) 그대로, 어두운 레일과 또렷이 구분. 새로고침·끊김 없음 |
| SC-003 | 알약 배경·아이콘 색을 위 스니펫으로 추출해 대비 계산 | 흰색 대 #4F46E5 = 6.29:1, 흰색 대 #0866FF = 4.82:1 (≥ 4.5:1) |
| SC-004 | 채널 → 플레이북 클릭 | 클릭 1회로 솔리드가 플레이북 알약으로 이동, 채널 알약은 틴트로 복귀 |
| SC-005 | 위 스니펫으로 svg rect 측정 | 글리프 28×28 (28/36 ≈ 78%) |

추가 확인(FR 매핑):

- hover: 비선택 알약에 포인터를 올리면 파랑이 어두워진다
  (`rgb(7, 94, 235)` = #075EEB) — FR-006.
- 키보드: Tab으로 버튼에 포커스하면 hover와 같은 반응 + 포커스 표시가
  가려지지 않는다 — FR-006, Edge Case.
- 시스템 모드: 테마 토글을 "시스템"으로 두고 OS 다크를 전환하면 알약
  색이 즉시 따라간다 — FR-008.
- 범위 밖 불변: 팀 전환 버튼·테마 토글·프로필 표시는 변화 없다 — FR-010.

## 완료 근거 묶음

- `baseline.txt` 대비 마감 게이트 출력 diff (원칙 I)
- applyTheme dataset 테스트의 구현 전 RED 출력 (원칙 III)
- SC-001~005 스크린샷·계측값 — tasks.md 종단 과제에 첨부
