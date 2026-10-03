# 계약: npm 명령

**기능**: [spec.md](../spec.md) | **작성**: 2026-10-03

전부 `e2e-tests/playwright/`에서 실행한다. upstream이 추가하는 3개와 기존 1개의 관계다.

## 추가되는 명령 3개

| 명령 | 하는 일 | 대응 스토리 |
|---|---|---|
| `npm run test:full` | 스택을 띄워 전체 테스트를 돌리고 끝나면 거둔다 | US1 |
| `npm run testcontainers:up` | 스택만 띄우고 **떠 있는 채로 둔다** | US2 |
| `npm run testcontainers:down` | 스택을 거둔다 | US2 |

`test:full`은 `PW_USE_TESTCONTAINERS=true PW_SNAPSHOT_ENABLE=true playwright test`다.

`testcontainers:up`은 전용 설정(`playwright.testcontainers-up.config.ts`)으로
no-op 스펙 하나(`script/testcontainers_up.spec.ts`)를 돌린다. 스택을 띄우는 게
목적이고 테스트는 핑계다. 전용 global setup이 기동만 하고 거두지 않는다.

`testcontainers:down`은 `node script/testcontainers_down.mjs`다. playwright를 거치지 않는다.

## 기존 명령 (바뀌지 않는다)

| 명령 | 상태 |
|---|---|
| `npm run test` | 그대로 — `external` 모드. 서버가 이미 떠 있다고 가정 |
| `npm run check` | 그대로 — eslint + prettier + `tsc -b` + `lint:test-docs` |
| `npm run build` | 그대로 |

`npm run tsc`의 실행 순서(`tsc -b && npm run tsc --workspaces`)는 **우리 설정이고
유지한다**. upstream은 역순이지만 이번 훅이 그 줄을 건드리지 않는다.

## 호출 순서 계약

```
# US1 — 한 번 돌리고 거둔다
SERVER_IMAGE=<okrbest 이미지> npm run test:full

# US2 — 띄워 두고 반복
SERVER_IMAGE=<okrbest 이미지> npm run testcontainers:up
npm run test -- <스펙 경로>      # 2회, 3회...
npm run testcontainers:down
```

`testcontainers:up` 없이 `test:full`을 두 번 돌리면 매번 컨테이너를 다시 띄운다.
그게 US2가 존재하는 이유다(SC-008).

## PR 게이트

PR이 트리거하는 건 `e2e-tests-check.yml`의 타입·린트뿐이다. 즉 이 명령들 중
**CI에서 도는 건 `npm run check` 하나**다. 브라우저 실행은 Argo Events·
`workflow_dispatch` 전용이고 이번 범위에서 배선하지 않는다(D6).

판정은 기준선 대비 실패 목록 diff다(원칙 I). 기준선을 재기 전에
`cd lib && npm run build`를 먼저 돌린다 — `lib/dist`가 추적되지 않아 스테일한
산출물이 오류 수를 부풀린다.
