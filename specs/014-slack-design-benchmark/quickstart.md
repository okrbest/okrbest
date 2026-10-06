# Quickstart: Slack 디자인 벤치마킹 검증 가이드

이 문서는 구현을 실제로 돌려 보고 판정하는 절차다. 판정 기준의 정본은
[contracts/measurement-contract.md](contracts/measurement-contract.md)다.

## 사전 조건

- Node 20.11 (`.nvmrc`), npm 워크스페이스 설치: `cd webapp && npm install`
- 로컬 서버: `cd server && make run-server` (또는 운영 환경 접속 권한)
- 계측 하네스: `/home/sdh/okrbest/okrbest-design` 체크아웃, Chromium 경로와
  인증 쿠키(`~/.cache/okrbest-cookie.txt`)는 하네스 README 절차대로
- 계측 대상을 로컬로 돌리려면 `okrbest-design/target.config.mjs`의
  `origin`/`target`/`cookieDomain`을 로컬 서버(`http://localhost:8065`)로 바꾼
  사본을 쓴다

## 1. 기준선 저장 (구현 전, 1회)

```bash
# 게이트 기준선 — 실패 목록을 저장한다 (원칙 I)
cd webapp
npm run check        2>&1 | tee /tmp/014-baseline-check.log
npm run check-types  2>&1 | tee /tmp/014-baseline-types.log
npm run test         2>&1 | tee /tmp/014-baseline-test.log

# 계측 기준선 — 변경 없는 트리에서 실측
cd /home/sdh/okrbest/okrbest-design/okrbest-design
node scripts/verify-auth.mjs          # AUTH_OK 확인
node scripts/extract.mjs 1920 900
node scripts/extract-layouts.mjs 1920 900
cp -r capture baseline-014            # 기준선 보존
```

2026-08-10 계측 문서와 기준선이 다른 항목은 기준선을 정본으로 삼는다
(spec Assumption 1).

## 2. 대비 회귀 테스트 (구현 중, TDD)

```bash
cd webapp
npm run test -- --watchAll=false \
  channels/src/packages/mattermost-redux/src/constants/theme_contrast.test.ts
```

기대 순서: **먼저 실패**(현재 프리셋 값이 기준 미달 — 출력 보존) → 값 교정 후
통과. 첫 실행부터 통과하면 테스트가 기준을 안 보고 있는 것이다 (원칙 III).

## 3. 육안 확인 (구현 중)

```bash
cd webapp && npm run dev-server    # webpack dev server
```

확인 지점:

1. 미설정 계정으로 접속 → slate 테마 (무채색 3단 크롬)
2. 채널 전환 → 활성 항목이 어두운 알약으로 반전
3. 설정 → 테마 → 프리셋 6종 썸네일과 전환 동작
4. 한글 메시지 렌더링 (Noto Sans KR), 채널 제목 굵기
5. 채널 설정 모달 → 그림자·모서리
6. 창 폭 1024px로 축소 → 사이드바 비례 축소, 본문 확보
7. 저장된 테마가 있는 계정 → 테마 유지 (SC-008)

## 4. 마감 판정 (구현 후)

```bash
# 게이트 — 기준선과 실패 목록 diff (신규 실패 0건이어야 한다)
cd webapp
npm run check        2>&1 | tee /tmp/014-final-check.log
npm run check-types  2>&1 | tee /tmp/014-final-types.log
npm run test         2>&1 | tee /tmp/014-final-test.log

# 실측 — 같은 명령, 같은 뷰포트
cd /home/sdh/okrbest/okrbest-design/okrbest-design
node scripts/extract.mjs 1920 900
node scripts/extract-layouts.mjs 1920 900
node scripts/theme-diff.mjs            # 프리셋 5종 전환 대조 (SC-005)
```

판정: `capture/`의 결과를 `baseline-014/` 및
`../slack-design/design.md` 기준값과 대조해 measurement-contract의 판정표
전 행을 채운다. SC-006은 `extract-layouts.mjs 1024 900` 재실행으로 잰다.

## 완료 선언 조건

- 게이트 3종 출력 + 기준선 대비 신규 실패 0건
- 대비 회귀 테스트의 "실패 → 통과" 출력 2벌
- measurement-contract 판정표 SC-001~008 전 행 통과 (실측 파일 첨부)
- `docs/upstream-adapted-divergences.md`에 발산 기록 추가
