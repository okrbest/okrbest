# OKRBest 개발 환경 구성 가이드

## 사전 요구사항

### Windows 사용자

Windows 환경에서는 WSL(Windows Subsystem for Linux)을 사용하는 것을 권장합니다. Go와 Node.js는 WSL 내에서 실행해야 합니다.

1. PowerShell을 관리자 권한으로 실행하여 WSL 설치:
   ```sh
   wsl --install
   ```
2. [Docker Desktop for Windows](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers#install-docker-desktop) 설치
3. Docker 설치를 제외한 나머지 작업은 WSL 환경 내에서 수행

### 공통 요구사항

- **make**: Ubuntu의 경우 `build-essential` 패키지로 설치
  ```sh
  sudo apt install build-essential
  ```
- **Docker**: [Docker](https://www.docker.com/) 설치 및 실행 (Docker 없이 개발하려면 [Docker 없이 개발하기](#docker-없이-개발하기) 참고)
- **Go**: 버전 1.21 이상 ([https://go.dev/](https://go.dev/))
- **Node.js**: NVM을 통해 설치 ([https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm))
- **libpng**: 패키지 매니저를 통해 설치

### 파일 디스크립터 제한 증가

셸 초기화 스크립트(`.bashrc` 또는 `.zshrc`)에 다음을 추가합니다:

```sh
ulimit -n 8096
```

---

## 서버 설정 (Docker 사용)

> 웹앱은 서버를 통해 노출됩니다. 서버와 웹앱이 모두 실행 중이면 `localhost:8065`로 접근할 수 있습니다.

### 1. 저장소 클론

```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/okrbest.git
cd okrbest
```

### 2. Node.js 설치

`webapp` 디렉토리에서 NVM을 사용하여 올바른 버전의 Node.js를 설치합니다:

```sh
cd webapp
nvm install
cd ..
```

> NVM이 인식되지 않는 경우 `~/.zshrc` 또는 `~/.bashrc`에 다음을 추가하세요:
> ```sh
> export NVM_DIR="$HOME/.nvm"
> [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
> [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
> ```

### 3. 서버 실행

```sh
cd server
make run-server
```

### 4. 서버 동작 확인

```sh
curl http://localhost:8065/api/v4/system/ping
```

정상 응답:
```json
{"AndroidLatestVersion":"","AndroidMinVersion":"","DesktopLatestVersion":"","DesktopMinVersion":"","IosLatestVersion":"","IosMinVersion":"","status":"OK"}
```

### 5. 관리자 계정 생성

```sh
bin/mmctl user create --local --email ADMIN_EMAIL --username ADMIN_USERNAME --password ADMIN_PASSWORD --system-admin
```

샘플 데이터 추가(선택):
```sh
bin/mmctl sampledata
```

### 6. 웹앱 실행

```sh
cd webapp
make run
```

### 7. 브라우저에서 확인

http://localhost:8065 접속

### 8. 서버 중지

```sh
cd server
make stop-server
make stop-docker
```

---

## Docker 없이 개발하기

### 1. PostgreSQL 설치 및 설정

[PostgreSQL](https://www.postgresql.org/download/)을 설치한 후 데이터베이스를 구성합니다:

```sh
psql postgres
```

```sql
CREATE ROLE mmuser WITH LOGIN PASSWORD 'mostest';
ALTER ROLE mmuser CREATEDB;
\q
```

```sh
psql postgres -U mmuser
```

```sql
CREATE DATABASE mattermost_test;
\q
```

```sh
psql postgres
```

```sql
GRANT ALL PRIVILEGES ON DATABASE mattermost_test TO mmuser;
\q
```

### 2. Docker 비활성화 설정

`server/config.mk`를 `server/config.override.mk`로 복사한 후 `MM_NO_DOCKER`를 `true`로 설정합니다:

```sh
cp server/config.mk server/config.override.mk
```

이후 서버 실행 및 웹앱 실행 절차는 Docker 사용 시와 동일합니다.

---

## Docker 서비스

기본적으로 최소한의 Docker 서비스만 시작됩니다:

```
ENABLED_DOCKER_SERVICES="postgres mysql inbucket"
```

추가 서비스를 활성화하려면 환경 변수를 설정하거나 `server/config.override.mk`를 수정합니다:

```
ENABLED_DOCKER_SERVICES="postgres mysql inbucket minio openldap dejavu keycloak elasticsearch grafana prometheus promtail loki"
```

### 주요 서비스

| 서비스 | 설명 | URL |
|--------|------|-----|
| **postgres** | 기본 권장 데이터베이스 | `localhost:5432` |
| **inbucket** | 이메일 테스트 서비스 | http://localhost:9001 |
| **grafana** | 메트릭/로그 시각화 대시보드 | http://localhost:3000 |
| **prometheus** | 메트릭 수집 및 시계열 DB | http://localhost:9090 |
| **keycloak** | SAML ID 제공자 | - |
| **minio** | 오브젝트 스토리지 | - |
| **openldap** | LDAP 디렉토리 서비스 | - |
| **elasticsearch** | 검색 엔진 | - |

### 데이터베이스 설정

**PostgreSQL** (기본):
```
MM_SQLSETTINGS_DRIVERNAME=postgres
MM_SQLSETTINGS_DATASOURCE=postgres://mmuser:mostest@localhost:5432/mattermost_test?sslmode=disable&connect_timeout=10
```

**MySQL** (대체):
```
MM_SQLSETTINGS_DRIVERNAME=mysql
MM_SQLSETTINGS_DATASOURCE=mmuser:mostest@tcp(localhost:3306)/mattermost_test?charset=utf8mb4,utf8&readTimeout=30s&writeTimeout=30s
```

### pgvector 이미지 사용

기본 postgres 이미지(`postgres:14`)에는 [pgvector](https://github.com/pgvector/pgvector) 확장이 포함되어 있지 않습니다. vector 컬럼·임베딩 검색이 필요하거나 `CREATE EXTENSION vector` 구문이 포함된 덤프를 복원하려면 pgvector 지원 이미지로 전환합니다.

`MM_USE_PGVECTOR=true`로 설정하면 `make start-docker` 시 Makefile이 `docker-compose.pgvector.yml` 오버라이드를 적용하여 `pgvector/pgvector:pg14` 이미지를 사용합니다(`server/Makefile`의 `MM_USE_PGVECTOR` 분기 참고).

설정 방법은 두 가지입니다.

**일회성** — 환경 변수로 지정:

```sh
MM_USE_PGVECTOR=true make start-docker
```

**영구 설정(권장)** — `server/config.override.mk`에 추가(git 추적 제외):

```make
MM_USE_PGVECTOR = true
```

주의 사항:

- `make start-docker`, `make stop-docker`, `make update-docker` 등 docker compose를 사용하는 모든 make 타겟에 동일하게 적용해야 합니다. 환경 변수 방식이라면 매번 붙여야 하므로 `config.override.mk` 등록을 권장합니다.
- 이미 일반 이미지로 생성된 컨테이너가 있는 상태에서 값만 바꾸면 이미지가 교체되면서 컨테이너가 재생성되고, postgres 데이터는 컨테이너 내부에 저장되므로 기존 DB 데이터가 삭제됩니다. 데이터 보존이 필요하면 전환 전에 `pg_dump`로 백업 후 [백업 DB 복원하여 개발하기](#백업-db-복원하여-개발하기) 절차로 복원하세요.
- 확장은 이미지 전환만으로 활성화되지 않습니다. 복원할 덤프에 `CREATE EXTENSION` 구문이 없다면 직접 실행합니다:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### 이메일 테스트 (Inbucket)

```
MM_EMAILSETTINGS_ENABLESMTPAUTH=false
MM_EMAILSETTINGS_SMTPUSERNAME=
MM_EMAILSETTINGS_SMTPPASSWORD=
MM_EMAILSETTINGS_SMTPSERVER=localhost
MM_EMAILSETTINGS_SMTPPORT=10025
```

---

## 백업 DB 복원하여 개발하기

운영 서버 등에서 `pg_dump`로 백업한 SQL 파일을 로컬 개발 DB로 복원하는 절차입니다. 덤프 파일은 git이 추적하지 않는 `data/` 디렉토리에 둡니다(예: `data/mattermost_2026-07-28.sql`).

> 덤프의 원본 DB명이 `mattermost_test`가 아니어도 무방합니다. `-C` 옵션 없이 만든 일반 덤프에는 DB명이 포함되지 않으므로 어떤 이름의 DB로도 복원할 수 있습니다. 단, 덤프에 `OWNER TO mmuser` 구문이 포함되므로 DB 유저명은 `mmuser`를 유지하는 것을 권장합니다.

### 1. 사전 확인

**Docker 실행 확인** — Windows에서는 Docker Desktop이 실행 중이어야 합니다.

```sh
docker ps
```

**Node 버전 확인** — 저장소 루트의 `.nvmrc`에 지정된 버전을 사용합니다. `webapp/package.json`의 `engines`가 `node ^24`, `npm ^11`을 요구하므로 버전이 낮으면 웹앱 실행 단계에서 실패합니다.

```sh
cd /path/to/okrbest
nvm use          # 루트 .nvmrc 기준. 해당 버전이 없으면 nvm install
node -v          # v24.x
npm -v           # 11.x
```

> `webapp/`에는 `.nvmrc`가 없습니다. `webapp` 디렉토리에서 `nvm use`를 실행해도 nvm이 상위 디렉토리로 올라가 루트 `.nvmrc`를 사용하므로 결과는 같습니다.

### 2. 접속 정보 파일 생성 (git 추적 제외)

비밀번호를 저장소에 커밋하지 않도록 `server/.env` 파일을 생성합니다(`.gitignore`에 이미 등록됨):

```sh
# server/.env
POSTGRES_USER=mmuser
POSTGRES_PASSWORD=원하는비밀번호
POSTGRES_DB=mattermost_test
MM_SQLSETTINGS_DATASOURCE=postgres://mmuser:원하는비밀번호@localhost:5432/mattermost_test?sslmode=disable&connect_timeout=10
```

기본값(`mmuser`/`mostest`)을 덮어쓰려면 `server/docker-compose.override.yaml`도 생성합니다(역시 git 추적 제외, Makefile이 자동 인식):

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
```

### 3. pgvector 이미지 사용 (선택)

덤프에 `CREATE EXTENSION vector` 구문이 있는 경우 pgvector 지원 이미지를 사용합니다. 설정 방법과 주의 사항은 [pgvector 이미지 사용](#pgvector-이미지-사용)을 참고하세요. 실제 vector 컬럼이 없는 덤프라면 일반 이미지에서도 확장 생성 에러 1건만 남기고 복원은 정상 진행됩니다.

### 4. postgres 컨테이너 기동

`.env`의 `MM_SQLSETTINGS_DATASOURCE` 값에는 `&`가 포함되어 있으므로 반드시 아래 방식으로 로드합니다. **새 셸을 열 때마다 다시 로드해야 합니다.**

```sh
cd server
set -a; . ./.env; set +a
make start-docker
```

`config.mk`의 `ENABLED_DOCKER_SERVICES` 기본값에 따라 postgres 외에 inbucket·redis·prometheus·grafana·loki·promtail이 함께 올라갑니다.

**컨테이너 재생성이 필요한 경우** — `POSTGRES_*` 환경 변수는 initdb 최초 실행 시에만 적용됩니다. 접속 정보를 새로 바꿨거나 pgvector 이미지로 전환하는 경우에만 재생성합니다. 이미 같은 접속 정보로 쓰던 컨테이너가 있다면 재생성 없이 5번으로 넘어가면 됩니다(덤프 교체는 DB만 다시 만들면 되므로 컨테이너를 건드릴 필요가 없습니다).

> **주의:** 아래 명령은 기존 로컬 DB 데이터를 삭제합니다.

```sh
cd server
docker rm -f mattermost-postgres

set -a; . ./.env; set +a
make start-docker
```

### 5. DB 초기화 및 덤프 복원

서버가 실행 중이면 DB 접속이 남아 있어 `DROP DATABASE`가 실패합니다. 먼저 중지합니다.

```sh
make stop-server
```

```sh
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" mattermost-postgres \
  psql -U "$POSTGRES_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS mattermost_test;" \
  -c "CREATE DATABASE mattermost_test OWNER $POSTGRES_USER;"

docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" mattermost-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < ../data/mattermost_2026-07-28.sql
```

복원 확인:

```sh
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" mattermost-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT count(*) FROM users;"
```

### 6. 서버·웹앱 실행 (watcher 모드)

서버가 `.env`의 `MM_SQLSETTINGS_DATASOURCE`로 접속하도록 같은 셸에서 실행합니다. 새 셸을 열었다면 env 로드부터 다시 합니다:

```sh
cd server
set -a; . ./.env; set +a
make run
```

`make run`은 `run-server`와 `run-client`를 순서대로 실행합니다.

- **`run-server`** — 의존 타겟으로 `start-docker`(docker 기동)와 `client`(`server/client` → `webapp/channels/dist` 심볼릭 링크 생성)를 먼저 처리한 뒤 서버를 띄웁니다. `config.mk`의 `RUN_SERVER_IN_BACKGROUND ?= true` 때문에 서버는 백그라운드로 빠지고 곧바로 다음 타겟으로 넘어갑니다.
- **`run-client`** — `webapp`의 `make run` → `npm run run`. `concurrently`로 `channels`(`webpack --progress --watch`)와 `platform/{types,client,components,shared}` 서브패키지를 동시에 watch합니다. 이 프로세스는 포그라운드에 남으므로 터미널을 계속 열어둡니다.

첫 실행이면 `webapp/node_modules` 설치와 webpack 초기 번들링에 수 분이 걸립니다.

**watcher 동작 방식** — 소스를 수정하면 webpack이 `webapp/channels/dist`를 다시 빌드하고, 서버가 심볼릭 링크를 통해 그 결과물을 서빙합니다. HMR(Hot Module Replacement)이 아니므로 **리빌드가 끝난 뒤 브라우저를 수동으로 새로고침**해야 합니다.

터미널을 나눠 쓰려면:

```sh
# 터미널 A — 서버
cd server
set -a; . ./.env; set +a
make run-server

# 터미널 B — 웹앱 watcher
cd webapp
make run
```

자동 새로고침(HMR)이 필요하면 서버는 `make run-server`로 따로 띄우고 웹앱만 dev-server로 실행합니다:

```sh
cd webapp
npm run dev-server      # webpack serve --mode development
```

watcher 없이 한 번만 빌드하려면:

```sh
cd webapp && npm run build      # NODE_ENV=production
cd ../server && make run-server
```

### 7. 브라우저에서 확인

서버 응답 확인:

```sh
curl http://localhost:8065/api/v4/system/ping
```

**webpack 초기 번들링이 끝나기 전에는 화면이 뜨지 않습니다.** 터미널에 webpack 완료 로그가 출력된 뒤 접속합니다.

http://localhost:8065

로그인은 복원한 덤프에 들어 있는 기존 계정으로 합니다. 새 관리자 계정이 필요하면:

```sh
cd server
bin/mmctl user create --local --email ADMIN_EMAIL --username ADMIN_USERNAME --password ADMIN_PASSWORD --system-admin
```

이메일 발송 확인이 필요하면 Inbucket을 사용합니다: http://localhost:9001

### 8. 중지

```sh
cd server
make stop            # 서버 + 웹앱 + docker 일괄 중지
```

개별 중지는 `make stop-server`, `make stop-client`, `make stop-docker`를 사용합니다.

### 문제 해결

- **`\restrict` 관련 에러**: 컨테이너의 psql 버전이 오래된 경우입니다. `\restrict`/`\unrestrict`는 PostgreSQL 14.19(2025-08 보안 릴리스) 이상의 psql만 인식합니다. `docker exec mattermost-postgres psql --version`으로 확인한 뒤, 낮으면 이미지를 갱신하고 4번(컨테이너 재생성)부터 다시 진행합니다.
  ```sh
  docker rm -f mattermost-postgres && docker pull pgvector/pgvector:pg14
  ```
- **첨부 파일이 보이지 않음**: SQL 덤프에는 DB만 포함됩니다. 업로드 파일은 원본 서버의 파일 저장소 디렉토리(`data/`)를 별도로 복사해야 합니다.
- **`invalid value for parameter "default_text_search_config": "pg_catalog.korean"` 로그 반복**: `server/build/docker/postgres.conf`가 한국어 텍스트 검색 설정을 기본값으로 지정하지만 공식 postgres/pgvector 이미지에는 해당 설정이 없어 접속마다 에러가 남습니다. init 스크립트(`server/build/docker/postgres_node_database.sql`)가 `simple` 복사본으로 `pg_catalog.korean`을 생성하므로 볼륨을 새로 만들면 자동 해결됩니다. 기존 볼륨이라면 수동 생성합니다:
  ```sh
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" mattermost-postgres \
    psql -U "$POSTGRES_USER" -d template1 \
    -c "CREATE TEXT SEARCH CONFIGURATION pg_catalog.korean (COPY = pg_catalog.simple);"
  ```
  (`template1` 외에 사용 중인 DB에도 각각 실행. 이후 생성되는 DB는 `template1`에서 상속.)
- **`.env` source 시 `[1]+ Done ...` 메시지**: `MM_SQLSETTINGS_DATASOURCE` 값의 `&`가 셸에서 백그라운드 실행으로 해석된 것입니다. 값 전체를 작은따옴표로 감싸세요.
- **`DROP DATABASE` 실패 (`is being accessed by other users`)**: 서버가 아직 DB에 붙어 있습니다. `make stop-server`로 중지한 뒤 다시 시도합니다. 그래도 남아 있으면 접속을 강제로 끊습니다:
  ```sh
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" mattermost-postgres \
    psql -U "$POSTGRES_USER" -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'mattermost_test';"
  ```
- **브라우저에서 화면이 뜨지 않음**: webpack 초기 번들링이 아직 끝나지 않은 경우입니다. `curl .../api/v4/system/ping`이 `status: OK`를 반환하는데 화면만 안 뜬다면 webpack 로그를 기다립니다.
- **소스를 고쳤는데 화면에 반영되지 않음**: `make run`은 watcher이지 HMR이 아닙니다. webpack 리빌드 로그를 확인한 뒤 브라우저를 새로고침하세요. 자동 반영이 필요하면 `npm run dev-server`를 사용합니다.
- **`engines` 관련 npm 에러 (`Unsupported engine`)**: `webapp/package.json`이 `node ^24`, `npm ^11`을 요구합니다. 저장소 루트에서 `nvm use`로 `.nvmrc` 버전을 적용한 뒤 다시 실행하세요.
- **`docker` 명령이 응답하지 않음**: Windows에서 Docker Desktop이 실행 중인지 확인합니다.

---

## 빌드

서버 바이너리 빌드 후 배포 패키지를 생성합니다:

```sh
cd server
make build
make package
```

빌드 결과물은 `./dist` 디렉토리에 생성됩니다.

---

## 추가 설정

서버 동작을 커스터마이징하려면 `server/config.mk` 파일을 참고하세요. 포그라운드 실행 등 다양한 옵션을 설정할 수 있습니다.
