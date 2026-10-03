---
description: "E2E testcontainers 의존 서비스 스택 구현 과제"
---

# 과제: E2E testcontainers 의존 서비스 스택

**입력**: `/specs/013-e2e-testcontainers-stack/`의 설계 문서

**선행**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/](contracts/) · [quickstart.md](quickstart.md)

**테스트**: 포함한다. 단 범위가 좁다 — upstream 원본 파일은 cherry-pick 성격이라 원칙 III 예외이고, **우리가 직접 쓰는 코드는 FR-002 가드 하나뿐**이다. 그 하나를 TDD로 넣는다(T023-T024).

**조직**: 사용자 스토리별로 묶었다. 다만 이 기능은 upstream 반영이라 작업량이 Foundational에 쏠린다 — 스토리 단계는 대부분 **검증 슬라이스**다.

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 가능 (다른 파일, 의존 없음)
- **[Story]**: 해당 사용자 스토리 (US1, US2, US3)
- 경로는 저장소 루트 기준. `e2e-tests/playwright/`를 **PW**로 줄여 쓴다

## 이미 끝난 것

세션에서 선행 작업을 먼저 처리했다. 과제 번호를 부여하되 완료로 표시한다.

- [x] T001 브랜치 `013-e2e-testcontainers-stack` 생성 (원칙 VI — master 직접 커밋 금지)
- [x] T002 의존 복구 — `cd PW && npm install --no-save` (lock 미변경 확인). `node_modules`에 `@mattermost/eslint-plugin` 링크가 빠져 eslint가 기동하지 못했다
- [x] T003 기준선 저장 — `cd PW/lib && npm run build` 후 단계별로 측정. **측정값**: `lint` 통과(경고 12), `prettier` 통과, `tsc` **실패 2건**(`PW/specs/functional/system_console/abac/user_attributes/display_name_in_selector.spec.ts` 63·71행 `TS2353 'managed'`), `lint:test-docs` 통과
- [x] T004 서버 tarball 빌드 — `cd server && make build-client build-linux-arm64 package-linux-arm64` → `server/dist/mattermost-team-linux-arm64.tar.gz` (176MB). `ldflags`가 `BuildHash=ce82c6e877...`로 확장됨을 확인

**T003 주의**: `npm run check`는 `lint && prettier && tsc && lint:test-docs` 체인이라 tsc에서 끊긴다. 하나로 재면 `lint:test-docs` 기준선이 안 잡히는데, 그게 신규 스펙 11건이 통과해야 하는 단계다. 단계별로 따로 재야 한다.

---

## Phase 1: 서버 이미지 (전제 증명)

**목적**: "로컬에서 온전한 okrbest 서버 이미지를 만들 수 있다"를 증명한다. FR-001의 토대이고 **이게 안 되면 계획이 D2부터 다시 짜인다.**

원래 plan.md에서 8단계였는데 앞으로 당겼다. upstream 파일 반영과 독립적이고, 실패하면 뒤 작업이 전부 헛수고가 된다.

- [x] T005 서버 이미지 빌드 — **완료(2026-10-03)**. [quickstart.md](quickstart.md) 1단계 5절차. 처음 레시피가 세 군데 틀려 고쳤다: 빌드 컨텍스트에 `server/build/dist/{server,client}` 수동 구성, `MM_PACKAGE`를 로컬 HTTP(`host.docker.internal:8899`)로 서빙(`file://` 불가), macOS tar 대신 `COPYFILE_DISABLE=1 tar --no-xattrs --exclude '._*'`로 단일 루트 tarball 재생성
- [x] T006 이미지 온전성 검증 — **완료**. distroless라 셸이 없어 `--entrypoint`와 `docker create`+`docker cp`로 검사했다. 결과: `Version: 11.10.0`, `Build Hash: ce82c6e8778db5a3ad070459048aa2b09f37b80b`(우리 master HEAD), `client/root.html`+클라이언트 4491개, `config`·`data`·`logs`·`plugins`·`templates`·`i18n/ko.json` 전부 존재, 433MB
- [ ] T007 이미지 기동 확인 — 컨테이너를 띄워 `/api/v4/system/ping`이 응답하고 **브라우저로 웹 UI가 열리는지** 본다. `ping`만 보면 안 된다 — 웹 UI 없는 이미지가 `ping`에는 답한다. T006은 파일 존재만 봤다
- [ ] T008 `server/.gitignore`에 `/build/dist`를 추가한다 — 빌드 컨텍스트가 지금 ignore되지 않아 **380MB 바이너리가 추적 대상으로 노출된다**. 실수로 커밋하기 쉽다 (검증 중 실제로 `?? server/build/dist/`로 떴다)
- [ ] T009 이미지 생성을 스크립트로 고정 — 5절차를 손으로 반복하면 틀린다. `server/build/` 또는 `PW/script/`에 스크립트로 넣는다. T050 문서화와 묶어도 된다

**T005-T006에서 드러난 okrbest master의 잠재 결함** (이 기능이 만든 게 아니다):
`server/build/Dockerfile` 39-48행의 `rm` + `COPY dist/server/...` 14줄은 okrbest 자체
수정인데, **저장소 어디에도 `server/build/dist/`를 채우는 절차가 없다**(Makefile·
릴리스 mk·워크플로에서 `build/dist` 참조 0건). 즉 우리 Dockerfile을 문서화된 방법으로
빌드할 수 없다. CI의 `server-build-artifact`도 그 디렉터리를 담지 못한다. 범위를
넘으므로 여기서 고치지 않고 사실만 기록한다 (research.md D2 함정 1).

**Checkpoint**: okrbest 서버 이미지가 실재하고 우리 master HEAD로 빌드됐음이 확인됐다. T007로 웹 UI 서빙까지 확인하면 스택이 테스트할 대상이 준비된다.

---

## Phase 2: Foundational (upstream 반영 — 모든 스토리를 막는다)

**목적**: upstream 파일을 트리에 넣고 `tsc -b`를 녹색으로 만든다.

**⚠️ 이 단계가 끝나기 전에는 어떤 스토리도 시작할 수 없다.**

### 2-1. 의존 (D5·D8)

- [ ] T010 `PW/lib/package.json`에 의존 5개 추가 — `testcontainers@12.0.4`, `@testcontainers/postgresql@12.0.4`, `@azure/storage-blob@12.33.0`, `ldapts@9.0.0`, `minio@8.0.7`
- [ ] T011 `PW/package.json`에 `chalk@5.6.2`를 devDependency로 추가하고 `glob`/`globals` 정렬을 upstream에 맞춘다
- [ ] T012 `PW/package.json`에 `allowScripts` 필드 신설 — **6개 전부**: `cpu-features@0.0.10`, `protobufjs@7.6.4`, `ssh2@1.17.0`, `unrs-resolver@1.12.2`, `@percy/core@1.32.2`, `fsevents@2.3.2`
- [ ] T013 `PW/package.json`의 `tsc` 스크립트 순서(`tsc -b && npm run tsc --workspaces`)를 **그대로 둔다**. upstream은 역순이지만 이번 훅이 그 줄을 건드리지 않는다 (D5 — 우리 설정 보존)
- [ ] T014 `cd PW && npm install`로 `package-lock.json` **재생성**. upstream의 +2589/-268 훅을 붙이지 않는다 — 우리 의존 트리가 다르다. lock을 같은 변경에서 커밋한다 (원칙 II, D8)

**T010이 6개인 이유**: 뒤 3개는 testcontainers가 끌고 온 게 아니라, `allowScripts` 필드를 도입하는 순간 **이미 설치 스크립트를 쓰던 기존 의존**까지 명시해야 해서다. 우리 트리에 이 필드가 0건이므로 3개만 넣으면 기존 설치가 깨진다. (사전 조사에 3개로 적혀 있던 것을 정정했다.)

### 2-2. 신규 파일 56개 (충돌 0건 — 기계적)

전부 upstream 그대로 넣는다. copyright 헤더를 유지한다 (원칙 IV).

- [ ] T015 [P] `PW/lib/src/containers/` 코드 21파일 — `stack.ts`(657줄 오케스트레이터), `default_images.ts`, `requirements.ts`, `mattermost_container.ts`, `postgres_container.ts`, `inbucket_container.ts`, `openldap_container.ts`, `keycloak_container.ts`, `minio_container.ts`, `azurite_container.ts`, `elasticsearch_container.ts`, `opensearch_container.ts`, `webhook_container.ts`, `mmctl_container.ts`, `network.ts`, `retry.ts`, `log.ts`, `paths.ts`, `constants.ts`, `env_baseline.ts`, `index.ts`
- [ ] T016 [P] `PW/lib/src/containers/assets/` 9파일 — `Dockerfile.elasticsearch`, `Dockerfile.opensearch`, `keycloak-realm-export.json`(2333줄), `postgres.conf`, `README.md`, `webhook/Dockerfile.webhook`, `webhook/webhook_serve.js`, `webhook/utils/webhook_utils.js`, `webhook/tests/plugins/post_message_as.js`
- [ ] T017 [P] `PW/lib/src/server/` 서비스 헬퍼 10파일 — `keycloak.ts`, `openldap.ts`, `minio.ts`, `azurite.ts`, `filestore.ts`, `elasticsearch.ts`, `opensearch.ts`, `postgres_search.ts`, `feature_flags.ts`, `mmctl.ts`
- [ ] T018 [P] 실행 진입점 4파일 — `PW/playwright.testcontainers-up.config.ts`, `PW/script/testcontainers_up.spec.ts`, `PW/script/testcontainers_up_global_setup.ts`, `PW/script/testcontainers_down.mjs`
- [ ] T019 [P] 신규 스펙 12파일 — `PW/specs/functional/system_console/`의 `feature_flag.spec.ts`, `ldap/ldap_login.spec.ts`, `saml/saml_login.spec.ts`, `mmctl/mmctl_remote.spec.ts`, `search/{elasticsearch,opensearch,postgres}_search.spec.ts` + `search/search_helpers.ts`, `file_storage/{local,minio,azurite}_file_storage.spec.ts` + `file_storage/file_storage_helpers.ts`

**T015-T017은 병렬이다.** 서로 다른 파일이고 우리 트리에 **단 하나도 존재하지 않는다**(충돌 0건 측정 완료).

**T016 주의**: `default_images.ts`(T015)를 **바이트 단위로 upstream 그대로** 둔다. `MATTERMOST_SERVER_IMAGE`를 okrbest 이미지로 바꾸지 않는다 — 그 파일은 upstream이 이미지 버전을 올릴 때마다 충돌을 주는 자리라, 손대지 않으면 이후 sync가 공짜다 (D2).

### 2-3. 우리와 동일한 수정 20개 (훅 그대로)

- [ ] T020 [P] `PW/lib/src/test_config.ts` — upstream +204줄 적용 (`useTestContainers`, `internalBaseURL`, `serverImage`, `TESTCONTAINERS_SERVICE_NAMES`, `bootEnvOverrides` 등). `.env.testcontainers` dotenv 로드 포함
- [ ] T021 [P] `PW/lib/src/test_fixture.ts`(+73/-1), `PW/global_setup.ts`(+17/-7), `PW/lib/src/file_server.ts`, `PW/lib/src/server/{client,email,index}.ts`, `PW/lib/src/ui/pages/login.ts`, `PW/mock_file_server.js`, `PW/lib/rollup.config.js`, `PW/lib/package.json`, `PW/eslint.config.mjs`, `PW/.gitignore` — upstream 훅 그대로
- [ ] T022 [P] 문서·기존 스펙 — `e2e-tests/README.md`, `PW/README.md`, `PW/CLAUDE.OPTIONAL.md`, `PW/lib/README.md`, `PW/specs/functional/channels/interactive_messages/mm_blocks_{ephemeral,incoming_webhook}.spec.ts`, `PW/specs/functional/system_console/abac/masking/masking_db_setup.ts` — upstream 훅 그대로

### 2-4. FR-002 가드 (우리가 직접 쓰는 유일한 코드 — TDD)

> **실패를 먼저 본다.** 원칙 III — 첫 실행부터 통과한 테스트는 아무것도 잡지 못한다.

- [ ] T023 **실패 확인** — T020 직후 가드 없는 상태에서 `SERVER_IMAGE`를 비우고 `PW_USE_TESTCONTAINERS=true`로 스택을 기동해, upstream 기본 이미지(`mattermostdevelopment/mattermost-enterprise-edition:master`)를 당기기 시작하는 것을 **출력으로 남긴다**. 이 증거 없이 T022를 완료로 표시하지 않는다
- [ ] T024 `PW/lib/src/test_config.ts`의 `this.serverImage = process.env.SERVER_IMAGE || MATTERMOST_SERVER_IMAGE;`를 okrbest 가드로 교체 — `useTestContainers`가 켜졌는데 `SERVER_IMAGE`가 비면 던진다. 메시지에 이미지 생성 방법(quickstart 1단계 경로)을 담는다. `default_images.ts`는 건드리지 않는다

**가드를 `test_config.ts`에 두는 이유**: 대입부와 같은 자리여야 우회가 불가능하다. 문서로만 알리면 FR-002를 못 지킨다. 그리고 이 파일은 upstream이 어차피 204줄을 추가하는 자리라 새 충돌면이 생기지 않는다 (D2).

### 2-5. 갈라진 7개 (훅별 판단 — 판단이 필요한 유일한 구간)

**T015-T022 뒤에 온다.** 앞의 76개를 넣고 `tsc -b`를 돌리면 갈라진 파일이 무엇을 요구하는지 타입 에러로 드러난다. 먼저 손대면 추측으로 고치게 된다.

- [ ] T025 `PW/lib/src/server/default_config.ts` — upstream이 바꾸는 **한 줄만** 적용: `ServiceSettings.SiteURL`을 `testConfig.baseURL` → `testConfig.internalBaseURL`로, 주석 5줄 포함. 우리 피처 플래그(`IntegratedBoards`·`CJKSearch`·`MobileEphemeralMode`·`PermissionPolicies` 등)와 `TeammateNameDisplay: 'nickname_full_name'`, 우리가 제거한 설정 블록은 **전부 그대로 둔다** (D3)
- [ ] T026 `PW/lib/src/index.ts` — upstream 추가분 +28줄만 넣는다(`startStack`/`stopStack`, `testConfig`, `TESTCONTAINERS_SERVICE_NAMES`, `ensure*` 11개, LDAP·Keycloak·스토리지·검색 헬퍼, 타입 4개). 우리가 제거한 8줄(`WysiwygEditor`, `wysiwyg_helpers`, `TextInputSetting`, `ensureAutotranslationPermissions`, `licenseTier`)을 **되살리지 않는다** — 없는 모듈을 export하면 `tsc -b`가 깨진다 (D4)
- [ ] T027 `PW/specs/functional/system_console/mobile_security.spec.ts` — upstream 2줄 훅 적용(`import {... testConfig}`, 368행 `const serverUrl = testConfig.baseURL`). 갈라짐(+40/-55)과 훅 위치가 겹치지 않는다
- [ ] T028 `PW/specs/functional/channels/post_list/post_height.spec.ts` — 훅 **둘을 갈라** 받는다. ~36행은 적용(`AllowedUntrustedInternalConnections`에 `${new URL(fileServerUrl).hostname}` 추가 + testcontainers 모드 주석). ~280행은 **우리 것을 지킨다**(`skipProjects: ['chrome','firefox','ipad']` + MM-67372 SVG DoS 근거 주석) — upstream 훅으로 덮으면 완화 조치가 되돌아가 회귀다 (D7)
- [ ] T029 `.github/workflows/e2e-tests-playwright-template.yml` — **적용하지 않는다**. 우리 쪽 +471/-243 갈라짐(`91de3d23` SEC-10179 adapt에서 워크플로 757줄 미반영)이고, CODEOWNERS 보호 경로이며, 브라우저 테스트가 Argo Events·`workflow_dispatch` 전용이라 지금 돌지 않는다. 적용하면 돌지 않는 코드를 넣고 갈라짐만 키운다 (D6)
- [ ] T030 `PW/specs/functional/system_console/abac/file_access/file_permissions_download.spec.ts` — 우리 트리에 **없는 파일**이다. upstream의 +13/-3은 적용 대상이 아니다. 건너뛴다

`PW/package-lock.json`(갈라진 7번째)은 T012에서 재생성으로 처리했다.

### 2-6. 타입·린트 녹색화

- [ ] T031 `cd PW/lib && npm run build && cd .. && npm run tsc` — 오류가 T003 기준선의 **2건만** 남는지 확인. 3건 이상이면 우리가 깼다. 늘어난 오류를 추적해 T025-T026으로 되돌아간다
- [ ] T032 `cd PW && npm run lint:test-docs` — 신규 스펙 12파일(T019)이 형식 검사(`@objective`·`@precondition`·MM-T ID·tag)를 통과하는지 확인. **기준선이 녹색이라 신규 실패는 전부 우리 책임이다**
- [ ] T033 `cd PW && npm run lint && npm run prettier` — `lint`는 error 0(경고는 늘어도 된다), `prettier`는 통과

**Checkpoint**: upstream 파일이 트리에 있고 게이트가 기준선과 같다. 스토리 검증을 시작할 수 있다.

---

## Phase 3: User Story 1 — 준비 없이 e2e를 돌린다 (P1) 🎯 MVP

**목표**: 개발자가 명령 하나로 의존 서비스와 okrbest 서버를 띄우고 스펙을 돌린다. 사람이 띄우는 서비스는 0개다.

**독립 검증**: 개발 compose와 서버를 모두 내린 상태에서 스모크 스펙 1건이 통과하면 끝. US2·US3 없이도 값이 나온다.

- [ ] T034 [US1] **SC-003 먼저** — `unset SERVER_IMAGE`로 `npm run testcontainers:up`을 돌려 0이 아닌 종료 코드와 안내 메시지를 확인한다. `docker ps -a --format '{{.Image}}' | grep mattermostdevelopment`가 **비어야** 한다. 이게 통과하지 않으면 나머지 초록은 의미가 없다 (quickstart 2단계)
- [ ] T035 [US1] **SC-001** — `cd server && make stop-docker` 후 `SERVER_IMAGE=okrbest/server:local npm run test:full -- specs/functional/channels/post_list/post_height.spec.ts`. 스택이 뜨고 스펙이 통과해야 한다 (quickstart 3단계)
- [ ] T036 [US1] **SC-002** — 스택이 띄운 서버의 이미지가 `okrbest/server:local`인지 `docker ps --format '{{.Image}}'`로 확인하고, `/api/v4/system/ping`으로 버전·빌드를 우리 트리와 대조한다. **이 검증이 이 기능의 존재 이유다** — 초록만 보고 넘어가지 않는다 (quickstart 4단계)
- [ ] T037 [US1] **SC-004** — `PW_TESTCONTAINERS_SERVICES=`(빈 값)로 최소 구성 기동 시간을 잰다. 캐시 상태에서 90초 이내. 실측값을 적는다 (quickstart 8단계)
- [ ] T038 [US1] **FR-012** — Docker 데몬을 끄고 기동해, Docker 상태가 원인임을 알리고 멈추는지 확인한다. 서비스 접속 실패로 위장되면 안 된다

**Checkpoint**: US1이 독립적으로 동작한다. 여기서 멈춰도 MVP다.

---

## Phase 4: User Story 2 — 띄워 두고 반복 실행한다 (P2)

**목표**: 스택을 한 번 띄워 두고 테스트만 반복한다. 매 실행마다 컨테이너를 다시 띄우면 기다리는 시간이 테스트 시간을 넘는다.

**독립 검증**: 스택 기동 → 같은 스펙 2회 → 스택 종료. 2회차가 더 빠르고 둘 다 통과하면 된다.

- [ ] T039 [US2] **SC-008** — `testcontainers:up` 후 같은 스펙을 연달아 두 번 돌려 2회차가 더 빠른지, `docker ps -q | wc -l`이 변하지 않는지(재기동 없음) 확인한다 (quickstart 5단계)
- [ ] T040 [US2] **SC-006** — 누수 0을 **세 경우 각각** 확인한다: (a) `testcontainers:down` 정상 종료, (b) 실행 중 `kill -INT`, (c) `--timeout=1` 강제 타임아웃. `docker ps -aq` 전후 diff로 판정한다. 하나라도 빠지면 검증이 아니다 (quickstart 6단계)
- [ ] T041 [US2] **SC-007 / FR-008** — `make start-docker`로 개발 compose 9개를 띄운 상태에서 스택을 기동해 포트 충돌 0건을 확인하고, 종료 후 `mattermost-*` 컨테이너 **9개가 그대로** 남는지 센다 (quickstart 7단계)

**Checkpoint**: US1·US2가 각각 독립적으로 동작한다.

---

## Phase 5: User Story 3 — 서비스별 테스트가 전용 서비스를 받는다 (P3)

**목표**: SSO·LDAP·전문검색·파일 스토리지 테스트가 각자 필요한 서비스를 받는다.

**독립 검증**: upstream이 함께 넣은 스펙 11건으로 직접 검증한다. 우리가 새로 쓸 필요가 없다.

- [ ] T042 [P] [US3] 인증 — `ldap/ldap_login.spec.ts`, `saml/saml_login.spec.ts`를 `test:full`로 돌린다. OpenLDAP·Keycloak이 준비 상태에 도달하고 미리 정의된 테스트 사용자로 로그인되는지 확인한다
- [ ] T043 [P] [US3] 검색 — `search/{postgres,elasticsearch,opensearch}_search.spec.ts`. `opensearch`는 옵트인이므로 `PW_TESTCONTAINERS_SERVICES`에 넣어 돌린다
- [ ] T044 [P] [US3] 스토리지 — `file_storage/{local,minio,azurite}_file_storage.spec.ts`. `azurite`는 옵트인이다
- [ ] T045 [P] [US3] 나머지 — `feature_flag.spec.ts`, `mmctl/mmctl_remote.spec.ts`
- [ ] T046 [US3] **FR-009** — 서비스를 구성에서 빼면 그 서비스를 띄우지 않고 기동 시간이 줄어드는지 확인한다
- [ ] T047 [US3] **SC-005** — 전체 구성(`openldap,keycloak,elasticsearch,opensearch,minio,azurite`) 기동이 캐시 상태에서 5분 이내인지 잰다. 실측값을 적는다. 못 지키면 D10 재검토 조건을 발동해 기본 구성을 줄인다 (quickstart 8단계)

**T042-T045 실패 처리**: 환경 문제인지 제품 문제인지 **가려서** 기록한다. 뭉뚱그리면 다음 사람이 다시 판별해야 한다.

**Checkpoint**: 세 스토리가 모두 독립적으로 동작한다.

---

## Phase 6: Polish & 교차 관심사

- [ ] T048 [P] `docs/upstream-adapted-divergences.md`에 갈라짐 기록 — D2(서버 이미지 가드, 복원 조건: okrbest가 레지스트리에 이미지를 발행하면 upstream `||` 폴백 형태로 되돌린다), D6(워크플로 미반영, 복원 조건: 원격 CI로 testcontainers를 돌리기로 하면 레지스트리 발행과 묶어 처리), D7(`post_height.spec.ts` 280행 보존)
- [ ] T049 [P] `PW/sample.env`에 신규 환경변수 문서화 — `PW_USE_TESTCONTAINERS`, `SERVER_IMAGE`(필수), `PW_TESTCONTAINERS_SERVICES`, `PW_TESTCONTAINERS_REUSE`, `PW_CONTAINER_RUNNER`. 계약은 [contracts/env-vars.md](contracts/env-vars.md)
- [ ] T050 [P] okrbest 서버 이미지 생성 절차를 문서로 남긴다 (FR-004). `make build-client build-linux-arm64 package-linux-arm64` → `docker build`와 T006 온전성 검사 셋을 포함한다. `.gitignore` 주석이 가리키는 `PW/docs/testcontainers/`가 upstream에도 없는 끊어진 참조라, 그 자리를 쓸 수 있다 (D11)
- [ ] T051 커밋 본문에 `Upstream: https://github.com/mattermost/mattermost/commit/a8c2307bee9bd60a3a0f72a658f32599b44cab0b`를 넣는다. **없으면 미반영 목록에서 자동 차감되지 않는다** (FR-018)
- [ ] T052 PR 생성·병합 — `gh pr create --repo okrbest/okrbest --base master`. 보호 경로 무접촉(T029)이라 code owner 리뷰로 막히지 않는다

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다.

- [ ] T053 품질 게이트 — `cd PW/lib && npm run build && cd ..` 후 `lint`·`prettier`·`tsc`·`lint:test-docs`를 **단계별로** 돌려 T003 기준선과 **diff로 비교**한다. 개수 비교로 대신하지 않는다. `npm run check` 하나로 재면 체인이 끊겨 `lint:test-docs`가 빠진다 (원칙 I)
- [ ] T054 종단 검증 — [quickstart.md](quickstart.md) 1~11단계를 **실제 Docker 환경에서** 훑고 절별 통과·실패를 기록한다. 못 돌린 절은 `미실행`으로 적는다
- [ ] T055 SC 검증 — SC-001~SC-010 각각을 **실측값**으로 확인한다. 추정 금지. SC-010은 `git show --stat 0785004b`로 후속 커밋이 요구하는 인프라가 다 들어왔는지 대조한다

---

## 의존 관계 & 실행 순서

### 단계 의존

- **T001-T004 (완료)**: 선행 작업
- **Phase 1 (T005-T009)**: T004에 의존. **다른 모든 것과 독립** — upstream 반영과 병렬 가능
- **Phase 2 (T010-T033)**: T001-T003에 의존. **모든 스토리를 막는다**
- **Phase 3-5**: Phase 1 **그리고** Phase 2 완료에 의존 (서버 이미지와 스택 코드가 둘 다 필요)
- **Phase 6**: 원하는 스토리가 끝나야 한다

### Phase 2 내부 순서 (중요)

```
T010-T014 (의존)
    ↓
T015-T022 (파일 투입, 병렬)
    ↓
T023 → T024 (가드 TDD — 실패를 먼저 본다)
    ↓
T025-T030 (갈라진 7개 — 타입 에러가 요구사항을 드러낸 뒤)
    ↓
T031-T033 (녹색화)
```

**T025-T030을 뒤에 둔 이유**: 앞의 76개를 넣고 `tsc -b`를 돌리면 갈라진 파일이 무엇을 요구하는지 타입 에러로 드러난다. 먼저 손대면 추측으로 고친다.

### 스토리 의존

- **US1 (P1)**: Phase 1 + Phase 2 후 시작. 다른 스토리에 의존하지 않는다
- **US2 (P2)**: Phase 1 + Phase 2 후 시작. US1과 독립적으로 검증 가능
- **US3 (P3)**: Phase 1 + Phase 2 후 시작. US1·US2와 독립

### 병렬 기회

- **Phase 1과 Phase 2는 병렬이다.** 서버 이미지 빌드(길다)를 걸어 두고 파일 반영을 진행한다
- T015-T019 (신규 파일 56개) — 전부 다른 파일, 충돌 0건
- T020-T022 (동일 수정 20개) — 서로 다른 파일
- T042-T045 (US3 서비스별 스펙) — 서로 다른 스펙
- T048-T050 (문서) — 서로 다른 파일

---

## 병렬 예시: Phase 2 파일 투입

```bash
# 신규 파일 56개를 한꺼번에 (충돌 0건이 측정으로 확인됨)
Task: "PW/lib/src/containers/ 코드 21파일"
Task: "PW/lib/src/containers/assets/ 9파일"
Task: "PW/lib/src/server/ 서비스 헬퍼 10파일"
Task: "실행 진입점 4파일"
Task: "신규 스펙 12파일"

# 동일 수정 20개도 함께
Task: "PW/lib/src/test_config.ts +204줄"
Task: "test_fixture.ts·global_setup.ts 등 코드 11파일"
Task: "문서·기존 스펙 8파일"
```

---

## 구현 전략

### MVP 먼저 (US1만)

1. Phase 1 (서버 이미지) — 전제 증명. **실패하면 여기서 멈추고 D2를 다시 짠다**
2. Phase 2 (upstream 반영) — Phase 1과 병렬
3. Phase 3 (US1) — T034(SC-003)를 **가장 먼저**
4. **멈추고 검증**: US1을 독립적으로 확인
5. 여기까지가 MVP다

### 증분 인도

1. Phase 1 + 2 → 토대 준비
2. US1 → 독립 검증 → **MVP**
3. US2 → 독립 검증 → 반복 실행이 쓸 만해진다
4. US3 → 독립 검증 → 후속 커밋 5건의 토대 완성
5. Phase 6 → 문서·ledger·PR

### 위험 순서

가장 위험한 것을 가장 먼저 한다.

| 순위 | 위험 | 어느 과제 |
|---|---|---|
| 1 | 서버 이미지를 만들 수 없다 | T005-T007 |
| 2 | 이미지가 조용히 upstream으로 폴백 | T023-T024, T034 |
| 3 | 이미지에 웹 UI가 없다 | T006-T007 |
| 4 | `lint:test-docs`가 신규 스펙을 막는다 | T032 |
| 5 | 네이티브 빌드 실패(darwin arm64) | T014 |

---

## 비고

- [P] = 다른 파일, 의존 없음
- 경로의 **PW**는 `e2e-tests/playwright/`
- upstream 원본 파일은 원칙 III 예외다. 우리가 쓰는 코드(T024)만 TDD 대상이다
- 과제 또는 논리 묶음마다 커밋한다
- Checkpoint에서 멈춰 스토리를 독립 검증할 수 있다
- 피해야 할 것: 모호한 과제, 같은 파일 충돌, 스토리 독립성을 깨는 교차 의존
