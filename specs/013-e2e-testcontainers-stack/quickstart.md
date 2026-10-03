# Quickstart 검증 가이드: E2E testcontainers 의존 서비스 스택

**기능**: [spec.md](spec.md) | **조사**: [research.md](research.md) | **작성**: 2026-10-03

구현이 끝났다고 선언하기 전에 이 문서를 **실제로 주행한다**. 출력이 증거다
(원칙 I·III). 서술로 대신하지 않는다.

## 사전 조건

- Docker 데몬 가동
- Node 24.11 (`.nvmrc`)
- 개발 compose 컨테이너 9개가 돌고 있어도 된다 — 오히려 그 상태가 SC-007의 전제다

## 0. 기준선을 먼저 저장한다

구현 전에 해야 한다. 나중에 재면 우리 변경과 기존 결함이 섞인다.

```bash
cd e2e-tests/playwright
npm install --no-save                  # lock을 건드리지 않고 의존 복구
cd lib && npm run build && cd ..       # 먼저! lib/dist가 추적되지 않는다

# 단계별로 따로 잡는다 — check는 체인이라 먼저 깨진 단계에서 끊긴다
npm run lint            > /tmp/bl-lint.txt      2>&1; echo "lint=$?"
npm run prettier        > /tmp/bl-prettier.txt  2>&1; echo "prettier=$?"
npm run tsc             > /tmp/bl-tsc.txt       2>&1; echo "tsc=$?"
npm run lint:test-docs  > /tmp/bl-testdocs.txt  2>&1; echo "testdocs=$?"
```

**`npm run check` 하나로 잡으면 안 된다.** `lint && prettier && tsc && lint:test-docs`
체인이라 tsc가 깨지면 `lint:test-docs`가 **실행조차 되지 않는다**. 그게 신규 스펙
11건이 통과해야 하는 바로 그 단계라서, 기준선이 없으면 SC-009를 판정할 수 없다.

`lib/dist`를 먼저 빌드하지 않으면 스테일 산출물이 `tsc` 오류 수를 부풀린다 —
전에 333건으로 잘못 읽었고 실제는 10건이었다.

### 2026-10-03 실측 기준선

| 단계 | 결과 | 내용 |
|---|---|---|
| `lint` | **통과** (0 errors) | 경고 12건 — `max-lines` 4건, `no-warning-comments` 7건, 불필요한 eslint-disable 1건 |
| `prettier` | **통과** | All matched files use Prettier code style |
| `tsc` | **실패 2건** | 둘 다 `specs/functional/system_console/abac/user_attributes/display_name_in_selector.spec.ts` (63,25)·(71,25) — `error TS2353: 'managed' does not exist in type`. CI가 보고하는 그 2건과 같다 |
| `lint:test-docs` | **통과** | Linter passed — 전체 스펙이 형식을 지킨다 |

판정 기준이 여기서 나온다.

- `tsc`는 **2건이 유지**되어야 한다. 3건이 되면 우리가 깼다.
- `lint`·`prettier`·`lint:test-docs`는 **녹색이 유지**되어야 한다. 기준선이 깨끗하므로
  신규 실패는 전부 우리 책임이다. 특히 `lint:test-docs`는 신규 스펙 11건의
  `@objective`·`@precondition`·MM-T ID·tag 형식을 검사한다.

## 1. okrbest 서버 이미지를 만든다

**이 단계가 FR-001의 전부다.** 빼먹으면 upstream 서버를 테스트하게 된다.

**2026-10-03에 실제로 성공시킨 절차다.** 함정 넷이 있어 순서를 지켜야 한다
(근거: [research.md](research.md) D2).

```bash
cd server

# (1) 웹앱 + arm64 바이너리 + dist 트리
make build-client build-linux-arm64 package-linux-arm64

# (2) 깨끗한 tarball을 손으로 만든다 — make 산출물은 쓸 수 없다
S=/tmp/okrbest-stage && rm -rf $S && mkdir -p $S/mattermost
cp -R dist/mattermost/. $S/mattermost/
mkdir -p $S/mattermost/bin $S/mattermost/logs
cp bin/linux_arm64/mattermost bin/linux_arm64/mmctl $S/mattermost/bin/
(cd $S && COPYFILE_DISABLE=1 tar --no-xattrs --exclude '._*' -czf okrbest-arm64.tar.gz mattermost)
tar -tzf $S/okrbest-arm64.tar.gz | grep -cE '^\.\./|/\._|^\._'    # 0 이어야 한다

# (3) 빌드 컨텍스트를 꾸민다 — 저장소가 자동화하지 않는다
rm -rf build/dist && mkdir -p build/dist/server build/dist/client
cp bin/linux_arm64/mattermost bin/linux_arm64/mmctl build/dist/server/
cp -R ../webapp/channels/dist/. build/dist/client/

# (4) tarball을 HTTP로 서빙 — file:// 는 컨테이너 안에서 안 보인다
(cd $S && python3 -m http.server 8899 --bind 0.0.0.0 > /tmp/tarball.log 2>&1 &)

# (5) 빌드
cd build
docker build --build-arg MM_PACKAGE="http://host.docker.internal:8899/okrbest-arm64.tar.gz" \
  -t okrbest/server:local .

kill %1   # HTTP 서버 정리
```

### 왜 이 네 단계인가

| 함정 | 증상 | 대처 |
|---|---|---|
| 컨텍스트에 `dist/`가 없다 | `failed to compute cache key: "/dist/server/mmctl": not found` | (3)단계. `server/build/Dockerfile` 39-48행은 okrbest 자체 수정이고 저장소가 `build/dist`를 만들지 않는다 |
| `file://`을 못 받는다 | `curl`이 호스트 경로를 못 본다 | (4)단계. `curl`은 빌드 컨테이너 안에서 돈다 |
| macOS tar를 GNU tar가 거부 | `Member name contains '..'`, `LIBARCHIVE.xattr...` → exit 2 | (2)단계. `make`가 멤버로 `../mattermost`를 넘기고 BSD tar가 `._*`를 넣는다 |
| 최종 이미지에 셸이 없다 | `exec: "sh": executable file not found` | 아래 검증을 `--entrypoint`와 `docker cp`로 한다 |

`MM_PACKAGE`는 **반드시 우리 tarball**이어야 한다. Dockerfile이 바꾸는 건 바이너리와
클라이언트뿐이고 `templates`·`i18n`·`config`·`fonts`는 tarball 것을 쓴다. upstream
배포본을 쓰면 리브랜드 템플릿과 한국어 로케일이 upstream 것으로 바뀐다(원칙 IV·V).

### 이미지가 온전한지 확인한다

웹 UI 번들이 빠진 이미지는 `/api/v4/system/ping`에는 답하면서 브라우저 테스트만
깨뜨린다 — 실패가 제품 결함처럼 보인다. **distroless라 셸이 없으므로** 이렇게 한다.

```bash
docker images okrbest/server:local                                  # 생성 시각이 방금인지
docker run --rm --entrypoint /mattermost/bin/mattermost okrbest/server:local version
CID=$(docker create okrbest/server:local)
for p in /mattermost/client/root.html /mattermost/config /mattermost/data \
         /mattermost/logs /mattermost/plugins /mattermost/templates /mattermost/i18n/ko.json; do
  docker cp "$CID:$p" - >/dev/null 2>&1 && echo "OK      $p" || echo "MISSING $p"
done
docker rm -f "$CID" >/dev/null
```

**2026-10-03 실측**: `Version: 11.10.0`, `Build Hash: ce82c6e8778db5a3ad070459048aa2b09f37b80b`
(우리 master HEAD), 7개 경로 전부 OK, 클라이언트 파일 4491개, 이미지 433MB.

`Build Hash`가 리터럴(`$(git rev-parse HEAD)`)이면 ldflags가 확장되지 않은 것이다.
이 머신에 남아 있던 `okrbest-app:local`(2025-07-02)이 바로 그 상태이고 `client/`도
없다 — **그 이미지를 재사용하지 않는다.**

**서버 코드나 웹앱을 고치면 이 단계를 다시 한다.** 안 하면 옛 산출물을 테스트한다.

## 2. SC-003 — 이미지 미지정이면 실패한다

**가장 먼저 검증할 요건이다.** 이게 통과하지 않으면 나머지 초록은 의미가 없다.

```bash
cd e2e-tests/playwright
unset SERVER_IMAGE
npm run testcontainers:up ; echo "exit=$?"
```

기대: **0이 아닌 종료 코드**, 그리고 okrbest 이미지를 만들라는 메시지.
`mattermostdevelopment/...`를 당기기 시작하면 **실패다** — 즉시 멈추고 D2 가드를 고친다.

```bash
docker ps -a --format '{{.Image}}' | grep mattermostdevelopment && echo "FAIL: upstream 이미지를 띄웠다"
```

## 3. SC-001 — 준비 없이 한 번에 돈다

개발 서버와 compose를 내린 상태에서 시작한다(FR의 "사람이 띄우는 서비스 0개" 확인).

```bash
cd server && make stop-docker && cd ../e2e-tests/playwright

SERVER_IMAGE=okrbest/server:local \
  npm run test:full -- specs/functional/channels/post_list/post_height.spec.ts
```

기대: 스택이 뜨고 스펙이 통과한다. 사람이 Postgres·메일·서버를 띄운 적 없다.

## 4. SC-002 — 테스트 대상이 우리 제품이다

**이 검증이 이 기능의 존재 이유다.** 초록만 보고 넘어가면 안 된다.

```bash
# 스택을 띄운 채로
SERVER_IMAGE=okrbest/server:local npm run testcontainers:up

# 서버가 보고하는 버전·빌드를 우리 트리와 대조
curl -s http://localhost:$(docker port $(docker ps -qf ancestor=okrbest/server:local) 8065 | cut -d: -f2)/api/v4/system/ping?get_server_status=true
docker ps --format '{{.Image}}\t{{.Names}}' | grep -i mattermost
```

기대: 이미지가 `okrbest/server:local`이다. `mattermostdevelopment/...`가 보이면 실패다.

## 5. SC-008 / US2 — 띄워 두고 반복이 더 빠르다

```bash
# 4단계에서 스택이 떠 있는 상태
time npm run test -- specs/functional/channels/post_list/post_height.spec.ts   # 1회차
time npm run test -- specs/functional/channels/post_list/post_height.spec.ts   # 2회차
docker ps -q | wc -l    # 재기동되지 않았는지: 개수가 그대로
```

기대: 2회차가 더 빠르고, 컨테이너 개수가 변하지 않는다.

## 6. SC-006 — 누수 0

세 경우를 각각 확인한다. 하나라도 빠지면 검증이 아니다.

```bash
BEFORE=$(docker ps -aq | sort)

# (a) 정상 종료
npm run testcontainers:down
# (b) 중단 — 실행 중 Ctrl-C
SERVER_IMAGE=okrbest/server:local npm run test:full -- specs/... &
sleep 60 && kill -INT %1
# (c) 타임아웃 — 짧은 타임아웃으로 강제
SERVER_IMAGE=okrbest/server:local npm run test:full -- specs/... --timeout=1

AFTER=$(docker ps -aq | sort)
diff <(echo "$BEFORE") <(echo "$AFTER") && echo "누수 0" || echo "FAIL: 잔존 컨테이너"
```

## 7. SC-007 — 개발 compose와 공존한다

```bash
cd server && make start-docker && docker ps -q | wc -l    # 9개 가동 확인
cd ../e2e-tests/playwright
SERVER_IMAGE=okrbest/server:local npm run testcontainers:up    # 포트 충돌 없이 떠야 한다
npm run testcontainers:down
docker ps --format '{{.Names}}' | grep '^mattermost-' | wc -l  # 여전히 9개
```

기대: 충돌 0, 종료 후 개발 compose 컨테이너 9개가 **그대로** 남는다(FR-008).

## 8. SC-004 / SC-005 — 기동 시간

이미지가 캐시된 상태에서 잰다. 최초 실행은 ES/OpenSearch Dockerfile 빌드 때문에
느리므로 기준이 아니다.

```bash
# SC-004: 최소 구성 90초 이내
PW_TESTCONTAINERS_SERVICES= SERVER_IMAGE=okrbest/server:local \
  bash -c 'time npm run testcontainers:up'
npm run testcontainers:down

# SC-005: 전체 구성 5분 이내
PW_TESTCONTAINERS_SERVICES=openldap,keycloak,elasticsearch,opensearch,minio,azurite \
  SERVER_IMAGE=okrbest/server:local bash -c 'time npm run testcontainers:up'
npm run testcontainers:down
```

실측값을 적는다. 못 지키면 D10의 재검토 조건을 발동해 기본 구성을 줄인다.

## 9. US3 — 서비스별 스펙

upstream이 함께 넣는 스펙 11건으로 검증한다. 우리가 새로 쓸 필요가 없다.

```bash
SERVER_IMAGE=okrbest/server:local npm run test:full -- \
  specs/functional/system_console/ldap/ldap_login.spec.ts \
  specs/functional/system_console/saml/saml_login.spec.ts \
  specs/functional/system_console/search/elasticsearch_search.spec.ts \
  specs/functional/system_console/search/postgres_search.spec.ts \
  specs/functional/system_console/file_storage/minio_file_storage.spec.ts \
  specs/functional/system_console/file_storage/local_file_storage.spec.ts \
  specs/functional/system_console/feature_flag.spec.ts
```

결과를 그대로 적는다. 실패가 있으면 환경 문제인지 제품 문제인지 가려 기록한다.

## 10. SC-009 — 게이트가 기준선과 같다

0단계와 **같은 방식으로** 단계별로 잰다. `check` 하나로 재면 `lint:test-docs`가 빠진다.

```bash
cd e2e-tests/playwright/lib && npm run build && cd ..
npm run lint            > /tmp/af-lint.txt      2>&1; echo "lint=$?"
npm run prettier        > /tmp/af-prettier.txt  2>&1; echo "prettier=$?"
npm run tsc             > /tmp/af-tsc.txt       2>&1; echo "tsc=$?"
npm run lint:test-docs  > /tmp/af-testdocs.txt  2>&1; echo "testdocs=$?"

for s in lint prettier tsc testdocs; do echo "=== $s ==="; diff /tmp/bl-$s.txt /tmp/af-$s.txt; done
```

기대: 신규 실패 0건. 개수 비교가 아니라 **목록 diff**로 판정한다(원칙 I).

- `tsc`: `display_name_in_selector.spec.ts` 2건만 남아야 한다
- `lint:test-docs`: 녹색 유지. 신규 스펙 11건이 형식 검사를 통과해야 한다 —
  걸리면 upstream 파일이라도 형식을 맞춘다
- `lint`: 경고는 늘어도 된다(기준선도 12건). **error가 0인지**가 기준이다

## 11. SC-010 — 후속 커밋이 올라간다

```bash
git show --stat 0785004b   # MM-65803 strict E2E tests for post list scrolling
```

이 커밋이 요구하는 인프라가 다 들어왔는지 대조한다. 추가 인프라 작업이 필요하면
무엇이 빠졌는지 적는다.

## 적용 면적 재확인

구현 중 판단이 흔들리면 이 측정으로 돌아온다. research.md의 분류 근거다.

```bash
cd /Users/shin-yebin/Project/okrbest/okrbest
H=a8c2307bee9bd60a3a0f72a658f32599b44cab0b
# 추가 vs 수정 개수
git show --format="" --name-status $H | awk '{print $1}' | sort | uniq -c
# 수정 파일별로 우리가 parent와 갈라졌는지
for f in $(git show --format="" --name-status $H | awk '$1=="M"{print $2}'); do
  if [ -f "$f" ]; then
    d=$(git diff --numstat "${H}^" -- "$f" | awk '{print "+"$1"/-"$2}')
    printf "%-70s %s\n" "$f" "${d:-IDENTICAL}"
  else
    printf "%-70s %s\n" "$f" "ABSENT"
  fi
done
```

주의: zsh에서 `$H:e2e-...` 형태는 `:e` 수정자로 먹힌다. `git show` 경로 지정은
해시를 따옴표 안에 직접 넣는다.

## 완료 판정

아래가 **전부** 증거와 함께 채워져야 완료다.

| 항목 | 증거 |
|---|---|
| SC-001 준비 없이 통과 | 3단계 출력 |
| SC-002 우리 제품을 본다 | 4단계 이미지 이름 |
| SC-003 미지정 시 실패 | 2단계 종료 코드 |
| SC-004/005 기동 시간 | 8단계 실측값 |
| SC-006 누수 0 | 6단계 (a)(b)(c) diff |
| SC-007 공존 | 7단계 컨테이너 개수 |
| SC-008 2회차가 빠름 | 5단계 time |
| SC-009 게이트 | 10단계 목록 diff |
| SC-010 후속 반영 가능 | 11단계 대조 |
