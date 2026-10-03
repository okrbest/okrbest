# Phase 0 조사: E2E testcontainers 의존 서비스 스택

**기능**: [spec.md](spec.md) | **작성**: 2026-10-03
**upstream**: [`a8c2307b`](https://github.com/mattermost/mattermost/commit/a8c2307bee9bd60a3a0f72a658f32599b44cab0b)

사용자 제약 — **"최대한 upstream을 따라가지만 우리쪽 설정을 변경하지는 말아줘."**
이 문장이 아래 결정 전부의 기준이다. 둘이 부딪히는 자리가 어디인지 먼저 세었다.

## 적용 면적을 파일 상태로 먼저 쟀다

84파일을 git 상태로 갈랐다. 추측이 아니라 측정값이다.

| 분류 | 개수 | 처리 |
|---|---|---|
| 신규 추가(A) | 56 | upstream 그대로. 우리 트리에 **충돌 0건** |
| 수정(M), 우리가 parent와 **동일** | 20 | upstream 훅 그대로 적용. 공짜다 |
| 수정(M), 우리가 **갈라짐** | 7 | 훅별 판단 — 아래 D3~D8 |
| 수정(M), 우리 트리에 **없음** | 1 | 적용 대상 아님 |

측정 명령은 [quickstart.md](quickstart.md)의 "적용 면적 재확인"에 남겼다.

갈라진 7개의 규모:

| 파일 | upstream 변경 | 우리 vs parent |
|---|---|---|
| `.github/workflows/e2e-tests-playwright-template.yml` | +21/-14 | **+471/-243** |
| `lib/src/server/default_config.ts` | +6/-1 | +17/-51 |
| `lib/src/index.ts` | +28/-2 | +0/-8 |
| `package.json` | +13/-1 | +1/-1 |
| `package-lock.json` | +2589/-268 | +13/-3 |
| `specs/.../post_height.spec.ts` | +5/-2 | +5/-2 (내용 다름) |
| `specs/.../mobile_security.spec.ts` | +2/-2 | +40/-55 |

`specs/.../mobile_security.spec.ts`는 갈라짐이 가장 크지만(+40/-55) 처리가 가장
쉽다. upstream 훅의 대상 줄(`const serverUrl = process.env.MM_SERVER_URL || ...`)이
368행에 그대로 있어서 2줄 훅이 그대로 붙는다 — 갈라짐과 훅이 겹치지 않는다.
그래서 별도 결정(D)을 두지 않았다.

`specs/.../file_permissions_download.spec.ts`는 우리 트리에 아예 없다(ABSENT). 이
파일의 +13/-3은 적용 대상이 아니다.

---

## D1. 기본 모드는 건드리지 않는다

**결정**: 기존 `external` 모드 동작을 1바이트도 바꾸지 않는다. testcontainers는
`PW_USE_TESTCONTAINERS=true`로만 켠다.

**근거**: upstream이 이미 그렇게 설계했다. `test_config.ts`에서
`this.useTestContainers = parseBool(process.env.PW_USE_TESTCONTAINERS, false)`로
기본이 꺼짐이고, `internalBaseURL`은 꺼진 상태에서 `this.baseURL`과 같다. 즉
기존 실행 경로가 그대로다.

**이게 사용자 제약을 푸는 열쇠다.** "우리쪽 설정 변경 금지"와 "upstream 충실"이
대부분 부딪히지 않는 이유가 여기 있다 — upstream 변경이 새 모드 안에 갇혀 있다.

**버린 대안**: testcontainers를 기본 모드로 승격. 기존 실행이 전부 영향을 받아
제약 위반이고, 우리 서버 이미지 조달이 안 된 상태에서 켜면 전부 깨진다.

---

## D2. 서버 이미지 — 가드는 `test_config.ts` 한 줄에 둔다

**이 명세에서 가장 중요한 결정이다.**

**사실**: upstream은 두 곳에 나눠 뒀다.

- `lib/src/containers/default_images.ts`(신규): `MATTERMOST_SERVER_IMAGE = 'mattermostdevelopment/mattermost-enterprise-edition:master'`
- `lib/src/test_config.ts`(우리와 동일): `this.serverImage = process.env.SERVER_IMAGE || MATTERMOST_SERVER_IMAGE;`

그대로 두면 `SERVER_IMAGE` 없이 돌릴 때 **upstream 서버를 테스트한다**. 테스트는
초록인데 okrbest를 보지 않는다. 가장 찾기 어려운 실패 양상이다(FR-002, SC-003).

**결정**: `default_images.ts`는 **바이트 단위로 upstream 그대로** 둔다. 가드는
`test_config.ts`의 그 한 줄을 okrbest 블록으로 바꿔 넣는다 — `useTestContainers`가
켜졌는데 `SERVER_IMAGE`가 비면 던진다.

**이 배치를 고른 이유**:

- `default_images.ts`는 "이미지 버전 한 곳에서 관리" 파일이다. upstream이 버전을
  올릴 때마다 우리가 충돌을 받는 자리다. 손대지 않으면 이후 sync가 공짜가 된다.
- `test_config.ts`는 upstream이 이번에 204줄을 **추가**하는 파일이라 어차피 손이
  닿는다. 거기 4줄을 더하는 쪽이 새 충돌면을 만들지 않는다.
- 가드 위치가 대입부와 같아야 우회가 불가능하다. 문서로만 알리면 FR-002를 못 지킨다.

**복원 조건**: okrbest가 서버 이미지를 레지스트리에 발행하면 가드를 그 이미지를
가리키는 기본값으로 바꿀 수 있다. 그때 upstream 형태(`||` 폴백)로 되돌아간다.
`docs/upstream-adapted-divergences.md`에 이 조건과 함께 기록한다.

**이미지 조달**: 로컬 빌드다. **2026-10-03에 실제로 성공시켜 검증했다** — 아래는
돌려본 절차이고, 처음 쓴 레시피는 세 군데가 틀려서 고쳤다.

```bash
# 1) 웹앱 + arm64 바이너리 + dist 트리
cd server
make build-client build-linux-arm64 package-linux-arm64

# 2) 깨끗한 tarball을 손으로 만든다 (make가 만든 것은 쓸 수 없다 — 아래 함정 3)
S=/tmp/okrbest-stage && rm -rf $S && mkdir -p $S/mattermost
cp -R dist/mattermost/. $S/mattermost/
mkdir -p $S/mattermost/bin $S/mattermost/logs
cp bin/linux_arm64/mattermost bin/linux_arm64/mmctl $S/mattermost/bin/
(cd $S && COPYFILE_DISABLE=1 tar --no-xattrs --exclude '._*' -czf okrbest-arm64.tar.gz mattermost)

# 3) 빌드 컨텍스트를 꾸민다 (저장소가 자동화하지 않는다 — 함정 1)
rm -rf build/dist && mkdir -p build/dist/server build/dist/client
cp bin/linux_arm64/mattermost bin/linux_arm64/mmctl build/dist/server/
cp -R ../webapp/channels/dist/. build/dist/client/

# 4) tarball을 HTTP로 서빙한다 (file://는 쓸 수 없다 — 함정 2)
(cd $S && python3 -m http.server 8899 --bind 0.0.0.0 &)

# 5) 빌드
cd build
docker build --build-arg MM_PACKAGE="http://host.docker.internal:8899/okrbest-arm64.tar.gz" \
  -t okrbest/server:local .
```

**검증 결과**: `Version: 11.10.0`, `Build Hash: ce82c6e8778db5a3ad070459048aa2b09f37b80b`
(우리 master HEAD), `client/root.html` + 클라이언트 파일 4491개,
`config`·`data`·`logs`·`plugins` 전부 존재, `templates`·`i18n/ko.json` 포함. 433MB.

### 처음 레시피가 틀린 세 군데

**함정 1 — 빌드 컨텍스트에 `dist/`를 꾸며야 한다.** `server/build/Dockerfile`은
tarball을 받아 스캐폴딩만 쓰고, 39-41행에서 `bin/mattermost`·`bin/mmctl`·`client/*`를
**지운 뒤** 컨텍스트의 `dist/server/{mattermost,mmctl}`·`dist/client/*`에서 새로
복사한다. 이 `rm` + `COPY` 14줄은 **okrbest 자체 수정이다**(upstream Dockerfile에는
없다). 그런데 **저장소 어디에도 `server/build/dist/`를 채우는 절차가 없다** —
Makefile·릴리스 mk·워크플로를 다 뒤져도 `build/dist` 참조가 0건이다. CI는
`server-build-artifact`(= `make build-cmd && make package` 후의 `server/build/` 전체)를
풀어 쓰는데, 그 make 타깃들도 `build/dist`를 만들지 않는다.

→ **okrbest master의 잠재 결함이다.** 우리 Dockerfile을 문서화된 방법으로 빌드할 수
없다. 이 기능이 만든 문제가 아니라 이미 있던 문제다. 범위를 넘으므로 여기서 고치지
않고 사실만 기록한다.

**함정 2 — `MM_PACKAGE`에 `file://`은 통하지 않는다.** 31행의 `curl -L $MM_PACKAGE`는
**빌드 컨테이너 안에서** 돈다. 호스트 경로가 그 안에서 보이지 않는다. 로컬 HTTP로
서빙하고 `host.docker.internal`로 받아야 한다(Docker Desktop에서 동작 확인).

그리고 MM_PACKAGE는 **우리 tarball이어야 한다**. Dockerfile이 바꾸는 건 바이너리와
클라이언트뿐이고 `templates`·`i18n`·`config`·`fonts`는 tarball 것을 그대로 쓴다
(42-43·49-50행이 주석 처리돼 있다). upstream 배포 tarball을 쓰면 리브랜드 템플릿과
한국어 로케일이 upstream 것으로 바뀐다 — 원칙 IV·V 위반이다.

**함정 3 — macOS가 만든 tarball을 컨테이너의 GNU tar가 거부한다.** 두 이유가 겹친다.

| 원인 | 증상 |
|---|---|
| BSD tar의 AppleDouble·확장 헤더 | `._*` 항목, `tar: Ignoring unknown extended header keyword 'LIBARCHIVE.xattr.com.apple.provenance'` |
| Makefile이 멤버로 `../mattermost`를 넘긴다 ([release.mk:310](../../server/build/release.mk#L310)) | `tar: ../mattermost/: Member name contains '..'` → exit 2 |

`make package-linux-arm64`가 만든 `dist/mattermost-team-linux-arm64.tar.gz`로는
빌드가 깨진다. CI는 Linux buildenv 안에서 GNU tar로 만들기 때문에 드러나지 않는다.
→ 위 2단계처럼 `COPYFILE_DISABLE=1 tar --no-xattrs --exclude '._*'`로 단일 루트
tarball을 손으로 만든다.

**함정 4 — 최종 이미지에 셸이 없다.** 마지막 스테이지가
`gcr.io/distroless/base-debian12`다(53행). `docker run ... sh -c`가
`exec: "sh": executable file not found`로 실패한다. 온전성 검사는
`--entrypoint /mattermost/bin/mattermost`와 `docker create` + `docker cp`로 한다.

**레지스트리 발행은 범위 밖**: 우리 PR은 playwright 브라우저 테스트를 돌리지 않는다.
PR이 트리거하는 건 [`e2e-tests-check.yml`](../../.github/workflows/e2e-tests-check.yml#L3-L10)의
타입·린트뿐이다. 원격 러너용 이미지를 지금 요구하는 경로가 없다.
`build-server-image.yml`은 **제품 이미지가 아니라 buildenv(툴체인) 이미지**라 쓸 수 없다.

**arm64를 고른다.** 이 머신이 darwin arm64라 네이티브로 돈다. amd64는 qemu
에뮬레이션이 붙어 SC-004·SC-005 기동 시간이 불리하고 간헐 실패가 늘어난다.

**이미 있는 로컬 이미지는 쓸 수 없다.** 이 머신에 `okrbest-app:local`(2025-07-02,
353MB, arm64)이 남아 있고 `Cmd`가 `/mattermost/bin/mattermost`라 실제 okrbest 서버
제품 이미지다. 그런데 셋 다 막힌다.

| 결함 | 확인 방법 | 영향 |
|---|---|---|
| `/mattermost/client` 없음 | 이미지 안에서 `ls` → No such file | **웹 UI를 서빙하지 못한다.** 브라우저 테스트 불가 |
| `mkdir`을 `sh`로 실행 | `{config,data,logs,plugins,client` 라는 단일 디렉터리가 생겼다 | 중괄호 확장이 안 돼 `config`·`data`·`logs`·`plugins`가 전부 없다 |
| 빌드 메타데이터 미확장 | `mattermost version` → `Build Date: $(date -u)`, `Build Hash: $(git rev-parse HEAD)` | 무엇으로 빌드했는지 되짚을 수 없다 |

빌드 레시피도 저장소에 없다 — `okrbest-app`을 전체 트리에서 grep해도 0건이다.
`server/build/Dockerfile`이 아닌 커스텀 멀티스테이지로 만들었고(`COPY /app/bin/mattermost`),
그 Dockerfile이 트리에 남지 않았다.

**이게 FR-002 가드와 재빌드 규율이 필요한 이유의 실물 증거다.** 15개월 된 이미지가
서버처럼 보이고 `/api/v4/system/ping`에는 답할 수 있지만 웹 UI가 없다. 이런 이미지를
`SERVER_IMAGE`로 집어넣으면 실패가 제품 결함처럼 보인다.

`mattermost-server-leader`·`-follower`·`-follower2`·`-opensearch`와 `server-*` 4개는
서버 제품 이미지가 아니다 — `Cmd: ["bash"]`, `WorkingDir: /go`인 compose 개발
컨테이너다. 역시 쓰지 않는다.

**레지스트리 발행은 범위 밖**: 우리 PR은 playwright 브라우저 테스트를 돌리지 않는다.
PR이 트리거하는 건 [`e2e-tests-check.yml`](../../.github/workflows/e2e-tests-check.yml#L3-L10)의
타입·린트뿐이다. 원격 러너용 이미지를 지금 요구하는 경로가 없다.
`build-server-image.yml`은 **제품 이미지가 아니라 buildenv(툴체인) 이미지**라 쓸 수 없다.

**버린 대안**:

- `default_images.ts`의 기본값을 okrbest 이미지로 교체 → upstream 신규 파일을 고쳐
  버전 범프 충돌을 매번 받는다. 게다가 그 이미지는 레지스트리에 없어 이름만 거짓이 된다.
- 가드 없이 문서로만 안내 → FR-002·SC-003 위반. 조용한 실패를 그대로 둔다.
- `.env`에 `SERVER_IMAGE`를 커밋 → 비밀값은 아니지만 사람마다 다른 로컬 태그를
  저장소에 박는다. 그리고 비어 있을 때 여전히 조용히 폴백한다.

---

## D3. `default_config.ts` — upstream이 바꾸는 건 한 줄뿐이다

**사실**: 우리 파일은 parent 대비 +17/-51로 많이 갈라졌다. 우리 피처 플래그
(`IntegratedBoards: false`·`CJKSearch: false`·`MobileEphemeralMode: true`·
`PermissionPolicies: true`), `TeammateNameDisplay: 'nickname_full_name'`(upstream은
`'username'`), 그리고 우리에게 없는 키 제거(`AttributeValueMasking`,
`ChannelPermissionPolicies`, `ClassificationMarkings`, `DiscoverableChannels`,
`EnableChannelCategorySorting`, `EnableShiftEscapeToMarkAllRead`,
`AggregatePluginMetrics`, Scheduled Recaps 계열 `MaxRecapsPerDay` 등, `FeedbackName`)가
전부 여기 있다. **딱 우리쪽 설정이다.**

*정정*: 처음에 `MobileEphemeralModeSettings` 블록을 "우리가 제거했다"고 적었는데
틀렸다. 양쪽에 다 있고 **위치만 다르다**(우리 888행, parent 703행). 재배치를 제거로
잘못 읽었다. 블록 단위로 사라진 설정은 없다 — 갈라짐은 키 단위다.

upstream의 변경은 `ServiceSettings.SiteURL` **한 줄**이다.
`testConfig.baseURL` → `testConfig.internalBaseURL`, 그리고 주석 5줄.

**결정**: 그 한 줄과 주석만 적용한다. 우리 플래그·값은 **전부 그대로** 둔다.

**근거**: 이 줄은 설정 취향이 아니라 기능이 요구하는 기계적 변경이다. 서버가
자기 자신을 가리키는 주소(플러그인 콜백 URL 등)인데, testcontainers 모드의
`baseURL`은 호스트 매핑 포트라 서버 컨테이너 안에서 닿지 않는다. 그리고 `external`
모드에서 `internalBaseURL === baseURL`이므로 **지금 동작은 바뀌지 않는다**(D1).
"우리 설정 변경 금지"에 걸리지 않는다 — 우리가 고른 값이 아니고, 켜지 않은 모드에서만 달라진다.

---

## D4. `index.ts` — 우리가 뺀 export를 되살리지 않는다

**사실**: 우리는 8줄을 제거했다 — `WysiwygEditor`, `wysiwyg_helpers` 전체,
`TextInputSetting`, `ensureAutotranslationPermissions`, `licenseTier`. 우리에게
없는 기능들이다. upstream의 변경은 +28/-2로, 컨테이너·서비스 헬퍼 export 추가다.

**결정**: 추가분 28줄만 넣는다. 우리가 뺀 것은 건드리지 않는다.

**근거**: 두 변경이 파일 내 다른 위치라 겹치지 않는다. 우리 제거분을 되살리면
없는 모듈을 export해 `tsc -b`가 깨진다.

---

## D5. `package.json` — allowScripts는 3개가 아니라 6개다

**브리프 정정**: 사전 조사에 `cpu-features`·`ssh2`·`protobufjs` 3개로 적혀 있었다.
실제 upstream 훅은 **6개**다.

```
cpu-features@0.0.10, protobufjs@7.6.4, ssh2@1.17.0,
unrs-resolver@1.12.2, @percy/core@1.32.2, fsevents@2.3.2
```

뒤 3개는 testcontainers 때문에 새로 생긴 게 아니라, `allowScripts` 필드를
도입하는 순간 **이미 설치 스크립트를 쓰던 기존 의존**까지 명시해야 해서 들어간다.
우리 트리에 `allowScripts`가 0건이므로 필드 자체가 신규다 — 6개 다 넣어야 기존
설치가 깨지지 않는다.

**우리 설정 보존**: 우리 `package.json`의 유일한 갈라짐은 `tsc` 스크립트 순서다
(`tsc -b && npm run tsc --workspaces`, upstream은 역순). upstream 훅이 그 줄을
건드리지 않으니 **그대로 둔다**.

upstream이 함께 넣는 것: 스크립트 3개(`test:full`, `testcontainers:up`,
`testcontainers:down`), devDependency `chalk@5.6.2`, `glob`/`globals` 정렬 교정.
정렬 교정까지 받는다 — 우리 선택이 아니라 upstream의 알파벳 정렬이다.

---

## D6. 워크플로는 손대지 않는다

**사실**: `.github/workflows/e2e-tests-playwright-template.yml`이 우리 쪽
**+471/-243**로 갈라졌다(`91de3d23` SEC-10179 adapt에서 워크플로 757줄 미반영).
upstream 변경은 +21/-14다.

**결정**: 적용하지 않는다. `docs/upstream-adapted-divergences.md`에 복원 조건과
함께 남긴다.

**근거**: 사용자 제약의 가장 직접적인 적용 대상이다. 그리고 CODEOWNERS 보호
경로라 PR 병합이 막힐 수 있다(원칙 VI). 무엇보다 **지금 검증에 쓰이지 않는다** —
브라우저 테스트는 Argo Events·`workflow_dispatch` 전용이다. 적용해도 돌지 않는
코드를 넣고 갈라짐만 키운다.

**복원 조건**: 원격 CI로 testcontainers 모드를 돌리기로 하면, 그때 D2의 레지스트리
발행과 묶어서 워크플로를 함께 다룬다.

---

## D7. `post_height.spec.ts` — 훅 둘을 갈라 받는다

**사실**: 이 파일은 우리와 upstream이 **서로 다른 방향으로** 갈라졌다. 훅 위치는
겹치지 않는다.

| 위치 | upstream (post-commit) | 우리 |
|---|---|---|
| ~36행 | `AllowedUntrustedInternalConnections`에 `${new URL(fileServerUrl).hostname}` 추가 + testcontainers 모드 주석 | `'localhost 127.0.0.1'` |
| ~280행 | `skipProjects: ['firefox']` + TODO | `skipProjects: ['chrome','firefox','ipad']` + MM-67372 SVG DoS 주석 |

**결정**: 36행 훅은 받고, 280행은 **우리 것을 지킨다**.

**근거**: 36행은 기능이 요구한다 — testcontainers 모드에서 서버가 mock 파일
서버의 메타데이터를 가져오려면 그 호스트가 허용 목록에 있어야 한다. 280행 우리
내용은 MM-67372 완화(SVG를 링크 메타데이터에서 걸러 높이를 미리 확보할 수 없게
된 것)를 반영한 **더 나중 상태**다. upstream 훅으로 덮으면 완화 조치의 근거
주석과 skip 범위가 되돌아간다 — 회귀다.

---

## D8. 의존은 upstream 버전 그대로 5개 + `chalk`

`lib/package.json`에 들어가는 5개(upstream 고정 버전):

```
testcontainers@12.0.4, @testcontainers/postgresql@12.0.4,
@azure/storage-blob@12.33.0, ldapts@9.0.0, minio@8.0.7
```

`package.json`(루트)에 `chalk@5.6.2`가 devDependency로 추가된다.

**Node**: `.nvmrc`가 **24.11**이고 실제 설치본이 v24.11.0이다. testcontainers 12의
Node 요구를 넘긴다. (참고 — constitution "기술·범위 제약"이 `.nvmrc(20.11)`로
적고 있어 실제와 다르다. 이 범위에서 고치지 않되 사실로 적어 둔다.)

**`package-lock.json`**: upstream 훅(+2589/-268)을 그대로 붙이지 않는다. 우리
lock은 +13/-3 갈라졌고 의존 트리가 다르다. `npm install`로 **재생성**해 같은
변경에서 커밋한다(원칙 II).

---

## D9. 검증은 로컬 Docker 실주행이다

**사실**: 이 머신에 Docker가 있고 개발 compose 컨테이너 9개가 가동 중이다
(`mattermost-postgres`·`inbucket`·`minio`·`azurite`·`redis`·`prometheus`·
`grafana`·`loki`·`otel-collector`).

**결정**: 종단 판정은 로컬 실주행. PR 게이트는 `cd e2e-tests/playwright && npm run check`
(eslint + prettier + `tsc -b` + `lint:test-docs`)를 **기준선 대비 실패 목록 diff**로
판정한다(원칙 I).

**주의 — 기준선을 먼저 저장한다.** 이 저장소에서 playwright tsc 기준선을 재려면
`cd e2e-tests/playwright/lib && npm run build`를 먼저 돌려야 한다.
`@mattermost/playwright-lib`가 `package.json`의 `types: "dist/index.d.ts"`로
해석되는데 `lib/dist`는 추적되지 않는다(`.gitignore:15`). 스테일한 `dist`가 남아
있으면 오류 수가 부풀어 기준선이 거짓이 된다 — 전에 333건으로 잘못 읽었고 실제는 10건이었다.

**공짜로 따라오는 검증 자산**: 추가 파일 56개에 **신규 스펙 11건**이 들어 있다
(`feature_flag`, `file_storage` 4건, `ldap_login`, `saml_login`, `mmctl_remote`,
`search` 4건). US3 인수 시나리오를 이 스펙들로 직접 검증할 수 있다. 다만 전부
`lint:test-docs` 형식 검사(`@objective`·`@precondition`·MM-T ID·tag)를 통과해야
PR 게이트가 녹는다 — upstream 파일이므로 통과할 것으로 보지만 측정으로 확인한다.

---

## D10. 서비스 범위는 upstream 전체를 유지한다

**근거(명세 Assumptions의 측정 재확인)**:
[`server/build/docker-compose.common.yml`](../../server/build/docker-compose.common.yml)이
`postgres`·`minio`·`azurite`·`inbucket`·`openldap`·`elasticsearch`·`opensearch`·
`redis`·`keycloak`을 이미 정의한다. 검색 엔진을 `Dockerfile.elasticsearch`·
`Dockerfile.opensearch`로 빌드하는 방식까지 같다(67·86행). upstream이 띄우는
서비스가 전부 우리 개발 환경에 이미 있으니 뺄 근거가 없다.

upstream의 기본 기동 집합은 `minio`·`openldap`·`keycloak`·`elasticsearch`
4종이고 `opensearch`·`azurite`는 옵트인이다(`test_config.ts`의
`DEFAULT_TESTCONTAINERS_SERVICES`). 이 기본값도 그대로 받는다 — 전체를 매번
띄우지 않으므로 SC-005 부담이 애초에 작다.

---

## D11. 받아 두되 알고 있어야 할 것 둘

1. **`.gitignore`의 끊어진 참조**: upstream 훅이 `.env.testcontainers`를 무시 목록에
   넣으면서 주석에 `docs/testcontainers/testcontainers_plan.md`를 가리킨다. 그
   파일은 이 커밋에도, upstream 트리의 `e2e-tests/playwright/docs/`에도 없다
   (거기엔 `accessibility/` 3개만 있다). 주석까지 그대로 받되, 끊어진 참조임을
   알고 둔다. 우리가 새 문서를 쓸 자리이기도 하다.
2. **`.env.testcontainers`는 생성물이다**: `test_config.ts`가 `override: true`로
   읽고 스택이 쓴다(컨테이너 ID·부팅 env 등). 커밋하지 않는다 — `.gitignore` 훅이
   그걸 보장한다.

---

## 미해결 없음

명세의 `[NEEDS CLARIFICATION]` 0건이 유지된다. 이 조사에서 새로 생긴 미결정도 없다.
브리프 대비 정정 2건(allowScripts 6개, Node 24.11)은 위에 반영했다.
