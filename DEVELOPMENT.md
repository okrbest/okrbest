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

### 이메일 테스트 (Inbucket)

```
MM_EMAILSETTINGS_ENABLESMTPAUTH=false
MM_EMAILSETTINGS_SMTPUSERNAME=
MM_EMAILSETTINGS_SMTPPASSWORD=
MM_EMAILSETTINGS_SMTPSERVER=localhost
MM_EMAILSETTINGS_SMTPPORT=10025
```

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
