# Quickstart: 읽지 않은 항목 행 뱃지 구분 병기

**Date**: 2026-10-13 | **Plan**: [plan.md](./plan.md)

구현이 끝났을 때 이 문서의 시나리오를 실주행해 SC를 실측한다.

## 준비물

- dev 서버 실행 중 (`server`에서 `set -a; . ./.env; set +a && make run` —
  DEVELOPMENT.md 6절). webpack watch가 함께 떠 있어야 수정이 자동 반영된다.
- 로컬 모드 소켓(`/var/tmp/mattermost_local.socket`) — 테스트 데이터 주입용.
- 테스트 계정 2개와 팀 1개 (없으면 아래처럼 만든다):

```bash
SOCK=/var/tmp/mattermost_local.socket
# 수신자(관찰 대상)와 발신자
curl -s --unix-socket $SOCK -X POST http://localhost/api/v4/users \
  -d '{"email":"sc-viewer@example.com","username":"sc-viewer","password":"Viewer123!"}'
curl -s --unix-socket $SOCK -X POST http://localhost/api/v4/users \
  -d '{"email":"sc-sender@example.com","username":"sc-sender","password":"Sender123!"}'
# 팀 생성·가입과 채널 구성은 UI 또는 API로 — 일반 채널 2개에 두 계정 모두 가입
```

## 상태 만들기

sc-sender로 로그인(또는 그 토큰으로 API 호출)해 상태를 만든다. sc-viewer는
해당 채널을 "보고 있지 않아야" 수치에 잡힌다 (다른 채널에 머문다).

| 상태 | 만드는 방법 |
|---|---|
| 일반 미읽음 n건 | sc-sender가 일반 채널에 메시지 n건 작성 |
| 멘션 m건 | sc-sender가 일반 채널에 `@sc-viewer` 포함 메시지 m건 작성 |
| DM 미읽음 | sc-sender가 sc-viewer에게 DM 발송 |
| 100건 이상 | 메시지 100건 루프 작성 (API 루프) |

## 테스트 명령

```bash
cd webapp/channels
# 기준선(구현 전) 저장 — 원칙 I, T002와 같은 파일
{ npm run check; npm run check-types; npm run test -- --silent; } 2>&1 \
  | tail -40 > ../../specs/027-unreads-split-badge/baseline.txt
# 대상 테스트
npx jest src/selectors/unreads src/components/sidebar/unreads_link --silent
# 게이트 3종 (완료 근거로 출력 제시)
npm run check && npm run check-types && npm run test
```

## 실측 시나리오 (SC 매핑)

브라우저에서 sc-viewer로 로그인해 확인한다. 각 항목은 스크린샷을 남긴다.

1. **SC-001**: 멘션 3건 + 일반 미읽음 12건 상태 → "읽지 않은 항목" 행에
   일반 뱃지 `12`(왼쪽)와 멘션 뱃지 `3`(오른쪽 끝)이 나란히 보인다.
2. **SC-002**: 멘션 0건 + 일반 미읽음 5건 → 일반 뱃지 `5` 단독.
3. **SC-003**: 멘션 2건 + 일반 0건 → 변경 전과 동일한 멘션 뱃지 `2` 단독
   (일반 뱃지 DOM 부재를 devtools로 확인).
4. **SC-004**: Slate·Onyx 왕복(레일 하단 테마 토글) — 두 뱃지 글자 대비를
   실측해 3:1 이상 기록 (getComputedStyle로 색 추출 후 대비 계산).
5. **SC-005**: 일반 미읽음 100건 이상 → 일반 뱃지가 `99`로 표시.

예상 결과가 하나라도 다르면 완료가 아니다 — 원인 규명 후 재실측한다
(constitution 원칙 I·III).
