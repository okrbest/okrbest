# 구현 계획: E2E testcontainers 의존 서비스 스택

**Branch**: `013-e2e-testcontainers-stack` (아직 없음 — 구현 착수 시 생성) | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: `/specs/013-e2e-testcontainers-stack/spec.md`

**사용자 제약**: 최대한 upstream을 따라가되 **우리 쪽 설정은 바꾸지 않는다.**

## Summary

upstream [`a8c2307b`](https://github.com/mattermost/mattermost/commit/a8c2307bee9bd60a3a0f72a658f32599b44cab0b)을
반영해 Playwright e2e가 의존 서비스와 서버를 컨테이너로 직접 띄우게 한다. 지금은
`test_config.ts:33`이 `PW_BASE_URL || 'http://localhost:8065'`를 읽을 뿐 아무것도
준비하지 않아, 사람이 compose와 서버를 맞춰 둬야 테스트가 돈다.

**접근은 파일 상태로 갈라진다.** 84파일을 측정했다 — 신규 추가 56개(충돌 0건),
우리가 upstream parent와 동일한 수정 20개(훅이 그대로 붙는다), 갈라진 수정 7개,
우리 트리에 없는 수정 1개(적용 대상 아님). 앞의 76개는 upstream 그대로 받고,
갈라진 7개만 훅별로 판단한다. 판단 결과는 [research.md](research.md)의 D3~D8이다.

**제약이 대부분 부딪히지 않는 이유**: upstream이 전체를
`PW_USE_TESTCONTAINERS`(기본 `false`) 안에 갇아 뒀다. 기존 `external` 모드 동작이
그대로이고, `internalBaseURL`은 꺼진 상태에서 `baseURL`과 같다. 즉 "upstream 충실"과
"우리 설정 보존"이 같은 답을 낸다.

**부딪히는 자리는 하나다 — 서버 이미지.** upstream은 `SERVER_IMAGE` 미지정 시
`mattermostdevelopment/mattermost-enterprise-edition:master`로 폴백한다. 그대로 두면
테스트가 초록인데 okrbest를 보지 않는다. 그래서 `test_config.ts`의 그 한 줄에
가드를 넣고(FR-002), `default_images.ts`는 바이트 단위로 upstream 그대로 둔다.
이미지는 `make package-linux-amd64` → `server/build/Dockerfile`(`MM_PACKAGE=file://`)로
로컬 빌드한다. 레지스트리 발행은 범위 밖이다.

## Technical Context

**Language/Version**: TypeScript 6.0.3, Node 24.11 (`.nvmrc`). Go 변경 없음.

**Primary Dependencies**: `testcontainers@12.0.4`, `@testcontainers/postgresql@12.0.4`,
`@azure/storage-blob@12.33.0`, `ldapts@9.0.0`, `minio@8.0.7` (전부 `lib/package.json`),
그리고 루트에 `chalk@5.6.2`(dev). `@playwright/test@1.61.1`는 기존.

**Storage**: 해당 없음. DB 스키마 변경·마이그레이션 0건. 컨테이너가 띄우는 Postgres 14는
테스트 대상 서버의 저장소이고 우리 스키마가 아니다.

**Testing**: Playwright. upstream이 신규 스펙 11건을 함께 넣어 US3 검증이 따라온다.
PR 게이트는 `cd e2e-tests/playwright && npm run check`(eslint + prettier + `tsc -b` + `lint:test-docs`).

**Target Platform**: Docker가 있는 개발 머신(이 머신은 darwin arm64). 서버 이미지는
**linux/amd64**로 만든다 — 스택이 `mattermost_container.ts:80`·`mmctl_container.ts:97`에서
`.withPlatform('linux/amd64')`로 고정하고, 그 고정을 풀면 후속 커밋 cherry-pick이
충돌하므로 이미지를 맞춘다. Apple Silicon에서는 에뮬레이션으로 돈다.

**Project Type**: 테스트 인프라. `server/` 무변경, `webapp/` 무변경. 변경 면적은
`e2e-tests/playwright/` 안이다.

**Performance Goals**: 캐시 상태에서 최소 구성 기동 90초 이내(SC-004), 전체 구성
5분 이내(SC-005). 반복 실행 2회차가 1회차보다 빠르다(SC-008).

**Constraints**:
- 기존 `external` 모드 동작 무변경 (D1)
- 우리 설정 파일 무변경 — 워크플로·`default_config.ts` 플래그·`package.json` tsc 순서 (D3·D5·D6)
- 개발 compose 컨테이너 9개 가동 중에도 동작, 종료 후 그 9개 보존 (SC-007·FR-008)
- 잔존 컨테이너 0 (SC-006)

**Scale/Scope**: 84파일 = 그대로 받는 76 + 갈라진 7 + 우리에게 없는 1. upstream 총 +10064/-377.
`package-lock.json`은 붙이지 않고 재생성한다.

## Constitution Check

*GATE: Phase 0 전에 통과해야 한다. Phase 1 후 재확인.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| **I. 패키지별 품질 게이트** | `webapp/`·`server/` 게이트는 해당 없음(무변경). e2e 게이트는 `npm run check` | **통과 예정** — [quickstart.md](quickstart.md) 0단계에서 기준선 저장, 10단계에서 목록 diff. 개수 비교 금지 |
| **II. npm workspaces 전용** | 의존 5개 + `chalk` 추가 | **통과** — `package-lock.json`을 같은 변경에서 재생성·커밋. yarn·pnpm 미도입 |
| **III. 실패를 본 테스트만 인정** | 동작 변경 있음 — FR-002 가드 | **통과 예정** — 가드는 TDD로 넣는다. 가드 없는 상태에서 "upstream 이미지를 당긴다"를 먼저 실패로 확인한 뒤 구현한다(quickstart 2단계). upstream 원본 파일 56개는 cherry-pick 성격이라 원칙 III 예외(원칙 III 단서) |
| **IV. 라이선스·리브랜드 충실성** | upstream 파일 56개에 Mattermost copyright 헤더 포함 | **통과** — 헤더 그대로 유지. 제거·변경 금지. 리브랜드 문자열 손대지 않는다 |
| **V. i18n 동기화** | 사용자 노출 문자열 변경 없음 | **해당 없음** — e2e 테스트 인프라다. `en.json`·`ko.json` 무변경 |
| **VI. 집중 브랜치 + Conventional Commits + PR** | master 직접 커밋 금지 | **조치 필요** — 현재 master 위다(`setup-plan.sh`가 `BRANCH:""`를 반환). 구현 착수 전 `013-e2e-testcontainers-stack` 브랜치를 만든다. 완료 커밋 본문에 `Upstream:` 링크 필수(FR-018) |
| **VII. Spec 주도 워크플로** | spec → plan → tasks → implement | **통과** — 이 계획이 그 경로다. `/speckit-implement`의 3-bis에서 `test-driven-development`·`verification-before-completion`을 `Skill`로 호출한다 |
| **VIII. 명세 문서 언어·문체** | 산출물 전부 | **통과** — spec·research·data-model·contracts·quickstart 모두 한국어. 코드 식별자·경로·명령·FR/SC·Given/When/Then 원형 유지 |

**CODEOWNERS 주의**: `.github/workflows/`는 보호 경로다. D6으로 워크플로를 건드리지
않으므로 **보호 경로 무접촉**이다. PR이 code owner 리뷰로 막히지 않는다.

**게이트 결과: 통과.** 정당화가 필요한 위반 없음 → Complexity Tracking 비움.

### Phase 1 후 재확인

설계를 끝낸 뒤 같은 게이트를 다시 봤다. 판정이 바뀐 항목 없음. 설계가 새로 끌어온 사실 둘:

- **원칙 III의 적용 지점이 좁아졌다.** 신규 파일 56개는 upstream 원본이라 예외이고,
  `tsc -b`로 검증된다. 우리가 **직접 쓰는 코드는 FR-002 가드 하나뿐**이다. 그래서
  TDD 대상도 그 하나다 — 가드 없는 상태에서 upstream 이미지를 당기는 것을 먼저 실패로 본다.
- **원칙 I의 게이트가 줄었다.** `server/`·`webapp/` 무변경이 설계로 확정됐다
  ([Project Structure](#source-code-repository-root) 참조). 돌릴 게이트는
  `e2e-tests/playwright`의 `npm run check` 하나다. 대신 그 기준선을 재는 절차에
  함정이 있어 [quickstart.md](quickstart.md) 0단계에 못박았다 — `lib/dist`가
  추적되지 않아 먼저 빌드하지 않으면 기준선이 거짓이 된다.

Complexity Tracking은 여전히 비어 있다.

## Project Structure

### Documentation (this feature)

```text
specs/013-e2e-testcontainers-stack/
├── plan.md              # 이 파일
├── spec.md              # 기능 명세
├── research.md          # Phase 0 — 결정 D1~D11
├── data-model.md        # Phase 1 — 실행 상태 모델
├── quickstart.md        # Phase 1 — 검증 주행 가이드
├── contracts/           # Phase 1
│   ├── env-vars.md      #   환경변수 계약
│   ├── commands.md      #   npm 명령 계약
│   └── lib-exports.md   #   라이브러리 공개 표면
├── checklists/
│   └── requirements.md  # 명세 품질 체크리스트 (통과)
└── tasks.md             # Phase 2 — /speckit-tasks 산출물 (아직 없음)
```

### Source Code (repository root)

변경은 `e2e-tests/playwright/` 안에 갇힌다. `server/`·`webapp/`는 손대지 않는다.

```text
e2e-tests/playwright/
├── lib/src/
│   ├── containers/                  # 신규 30파일 — 스택의 본체
│   │   ├── stack.ts                 #   오케스트레이터 (657줄)
│   │   ├── default_images.ts         #   이미지 버전 단일 지점 — upstream 그대로 (D2)
│   │   ├── requirements.ts           #   선택 서비스 기동 함수 등록부
│   │   ├── mattermost_container.ts   #   서버 컨테이너 (ping + 마이그레이션 로그 대기)
│   │   ├── postgres_container.ts     #   이하 서비스별 컨테이너
│   │   ├── inbucket_container.ts
│   │   ├── openldap_container.ts
│   │   ├── keycloak_container.ts
│   │   ├── minio_container.ts
│   │   ├── azurite_container.ts
│   │   ├── elasticsearch_container.ts
│   │   ├── opensearch_container.ts
│   │   ├── webhook_container.ts
│   │   ├── mmctl_container.ts
│   │   ├── network.ts, retry.ts, log.ts, paths.ts, constants.ts, env_baseline.ts, index.ts
│   │   └── assets/                   #   Dockerfile 2종, Keycloak realm, postgres.conf, webhook 서버
│   ├── server/                       # 신규 10파일 — ensure*() 서비스 헬퍼
│   │   ├── keycloak.ts, openldap.ts, minio.ts, azurite.ts, filestore.ts
│   │   ├── elasticsearch.ts, opensearch.ts, postgres_search.ts
│   │   ├── feature_flags.ts, mmctl.ts
│   │   └── default_config.ts         #   [수정] SiteURL 한 줄만 (D3)
│   ├── test_config.ts               # [수정] +204줄 + okrbest 가드 (D2)
│   ├── test_fixture.ts              # [수정] upstream 그대로 (+73/-1)
│   ├── index.ts                     # [수정] 추가분만 (D4)
│   └── file_server.ts, server/{client,email,index}.ts, ui/pages/login.ts   # [수정] 그대로
├── specs/functional/system_console/ # 신규 스펙 11건 (ldap·saml·search 4·file_storage 4·feature_flag)
├── script/
│   ├── testcontainers_up.spec.ts          # 신규 — no-op 스펙
│   ├── testcontainers_up_global_setup.ts  # 신규 — 띄우고 거두지 않는다
│   └── testcontainers_down.mjs            # 신규
├── playwright.testcontainers-up.config.ts # 신규 — US2 전용 설정
├── global_setup.ts                  # [수정] upstream 그대로 (+17/-7)
├── package.json                     # [수정] 스크립트 3 + allowScripts 6 + chalk. tsc 순서는 우리 것 유지 (D5)
├── package-lock.json                # [재생성] 붙이지 않는다 (D8)
└── .gitignore, eslint.config.mjs, README.md, CLAUDE.OPTIONAL.md, mock_file_server.js  # [수정] 그대로

# 적용하지 않음
.github/workflows/e2e-tests-playwright-template.yml   # 우리 +471/-243 (D6)
```

**Structure Decision**: upstream 레이아웃을 그대로 쓴다. `lib/src/containers/`가
통째로 신규라 우리 트리와 겹치지 않고, `lib/src/server/`의 `ensure*()` 헬퍼도 전부
신규 파일이다. 우리 구조를 바꿀 이유가 없고, 바꾸면 후속 커밋 5건이 전부 충돌한다.

## 실행 순서

`/speckit-tasks`가 과제로 쪼갤 입력이다. 순서에 이유가 있다.

1. **기준선 저장** — `lib` 빌드 후 `npm run check`. 이걸 먼저 안 하면 SC-009를 판정할 수 없다.
2. **브랜치 생성** — `013-e2e-testcontainers-stack` (원칙 VI).
3. **의존 추가 + lock 재생성** — 신규 파일이 import하므로 먼저 와야 한다. `allowScripts` 6개 포함.
4. **신규 파일 56개 투입** — upstream 그대로. 충돌 0건이라 기계적이다.
5. **동일 파일 20개 훅 적용** — upstream 그대로.
6. **갈라진 7개 처리** — D3~D8. 여기가 판단이 필요한 유일한 구간이다.
7. **FR-002 가드** — TDD. 가드 없는 상태의 실패(upstream 이미지를 당긴다)를 먼저 본다.
8. **서버 이미지 빌드** — quickstart 1단계.
9. **종단 검증** — quickstart 2~11단계 실주행. 실측값을 적는다.
10. **갈라짐 기록** — `docs/upstream-adapted-divergences.md`에 D2·D6·D7의 복원 조건.
11. **ledger 차감 확인** — 커밋 본문 `Upstream:` 링크가 있어야 자동 차감된다(FR-018).

6단계를 4·5단계 뒤로 둔 이유: 앞의 76개를 넣어 `tsc -b`를 돌리면 갈라진 7개가
무엇을 요구하는지 타입 에러로 드러난다. 먼저 손대면 추측으로 고치게 된다.

## 위험

| 위험 | 신호 | 대응 |
|---|---|---|
| 서버 이미지가 조용히 upstream으로 폴백 | 테스트는 초록인데 `docker ps`에 `mattermostdevelopment/...` | FR-002 가드 + quickstart 2·4단계. **가장 먼저 검증한다** |
| 이미지가 스테일 | 서버 코드·웹앱 수정이 테스트에 반영되지 않는다 | quickstart 1단계 — `make build package`로 묶는다. `package`만 돌리면 낡은 `webapp/channels/dist`가 담긴다 |
| 이미지에 웹 UI 번들이 없다 | `ping`은 답하는데 브라우저 테스트만 깨진다 | quickstart 1단계에서 `client/root.html` 존재를 확인. 이 머신의 `okrbest-app:local`이 실제로 이 상태다 |
| `lint:test-docs`가 신규 스펙 11건을 막는다 | `npm run check` 신규 실패 | upstream 파일이라도 형식을 맞춘다. 10단계에서 측정 |
| 네이티브 빌드 실패(darwin arm64) | `npm install` 중 `ssh2`·`cpu-features` 오류 | D8 재검토 조건 — 해당 의존을 쓰는 기능 범위 축소 |
| ES/OpenSearch 최초 빌드가 SC-005 초과 | 8단계 실측 초과 | 캐시 상태로 재측정. 그래도 초과면 D10 발동 — 기본 구성 축소 |
| `post_height.spec.ts` 훅 오적용 | MM-67372 skip 범위가 되돌아간다 | D7 — 36행만 받고 280행은 우리 것 유지 |

## Complexity Tracking

> Constitution Check에 정당화가 필요한 위반이 있을 때만 채운다.

위반 없음. 비움.
