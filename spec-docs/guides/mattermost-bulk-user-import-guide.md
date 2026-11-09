# Mattermost 사용자 대량 추가 가이드 (Bulk Loading)

참고 문서: [Bulk loading data](https://docs.mattermost.com/administration-guide/onboard/bulk-loading-data.html)

## 1) 개요

Mattermost에서 사용자 대량 추가는 CSV가 아니라 **JSONL 파일 + mmctl import** 방식으로 진행합니다.

- JSONL: 한 줄에 JSON 객체 1개
- import 실행 단위: `data.jsonl`을 zip으로 압축한 `data.zip`
- 재실행 안전: 중단 후 이어서 실행 가능(멱등성)
- 주의: 삭제/동기화 목적 도구가 아니라 **생성 또는 필드 덮어쓰기** 용도
- 주의: 동일 식별자(예: User는 `username`)가 이미 있으면 신규 생성이 아니라 기존 데이터가 업데이트(덮어쓰기)될 수 있음

## 2) 기본 절차

1. `data.jsonl` 작성
2. 압축 파일 생성
   - `zip -r data.zip data.jsonl`
3. `mmctl import` 실행

### 로컬 모드(v9.5+) 권장

```bash
mmctl import process --bypass-upload data.zip --local
```

### 로컬 모드를 사용하지 않는 경우

```bash
mmctl import upload data.zip
mmctl import list available
mmctl import process <upload_session_id>_data.zip
```

> `import process`에는 파일명 자체가 아니라 업로드 세션 ID 기반 이름(`<upload_session_id>_data.zip`)을 사용합니다.

## 3) JSONL 작성 규칙(중요)

- 첫 줄은 반드시 아래 `version` 객체 1회
- 각 객체는 반드시 **한 줄**로 작성
- `user` 객체는 `team`, `channel` 객체 뒤에 위치
- 팀/채널 멤버십을 지정하면 해당 팀/채널이 파일 내에 있거나 서버에 이미 존재해야 함
- 동일 식별자(예: User는 `username`)가 이미 존재하면 생성이 아니라 해당 객체 업데이트(덮어쓰기)로 처리될 수 있음

## 4) 최소 예시(JSONL) - `aaa` 팀 샘플

아래는 `data.jsonl` 샘플입니다. 실제 파일에서는 객체 1개당 한 줄이어야 합니다.

```json
{"type":"version","version":1}
{"type":"user","user":{"username":"aaa_user01","email":"aaa_user01@example.com","password":"Passw0rd!","first_name":"User","last_name":"One","roles":"system_user","teams":[{"name":"aaa","roles":"team_user","channels":[{"name":"town-square","roles":"channel_user"}]}]}}
{"type":"user","user":{"username":"aaa_user02","email":"aaa_user02@example.com","password":"Passw0rd!","nickname":"aaatwo","position":"Engineer","roles":"system_user","teams":[{"name":"aaa","roles":"team_user","channels":[{"name":"off-topic","roles":"channel_user"}]}]}}
{"type":"user","user":{"username":"aaa_admin01","email":"aaa_admin01@example.com","password":"Passw0rd!","first_name":"Team","last_name":"Admin","roles":"system_admin system_user","teams":[{"name":"aaa","roles":"team_admin team_user","channels":[{"name":"town-square","roles":"channel_user channel_admin"}]}]}}
```

## 5) User 객체에서 자주 쓰는 필드

- 필수(실무 기준): `username`, `email`
- 선택:
  - `password` (비밀번호 인증 시 사용, 없으면 자동 생성 가능)
  - `first_name`, `last_name`, `nickname`, `position`
  - `roles` (`system_user`, 필요 시 `system_admin system_user`)
  - `teams` (팀/채널 멤버십 동시 지정 가능)
  - `notify_props` (알림 설정)

## 6) 운영 시 체크포인트

- 운영 중(live) 시스템에서도 실행 가능
- 단, 동일 필드가 JSONL에 있으면 기존 값이 덮어써질 수 있음
- `mmctl` 권한 컨텍스트로 동작하므로 실행 계정 권한과 입력 파일 검증이 중요
- 대량 반영 전 소량 샘플(예: 2~5명)로 먼저 검증 권장

## 7) 빠른 실행 템플릿

```bash
# 1) 파일 준비
vi data.jsonl

# 2) 압축
zip -r data.zip data.jsonl

# 3) 로컬 모드 import (v9.5+)
mmctl import process --bypass-upload data.zip --local
```

필요하면 다음 단계로, 보유한 사용자 목록(CSV/엑셀 기반)을 **JSONL로 자동 변환하는 스크립트 템플릿**까지 추가할 수 있습니다.

## 8) mmctl 설치/준비 방법 (macOS)

`zsh: command not found: mmctl` 오류가 나면, 아래 순서로 준비합니다.

### 소스에서 mmctl 빌드 (이 프로젝트 기준)

```bash
cd server
make mmctl-build
```

빌드 결과물은 `server/bin/mmctl` 입니다.

### 설치 없이 바로 실행

```bash
./server/bin/mmctl version
./server/bin/mmctl import process --bypass-upload data.zip --local
```

### 전역 명령으로 사용하려면 PATH 등록

```bash
# 프로젝트 루트에서 실행
grep -qxF 'export PATH="$PATH:'"$(pwd)"'/server/bin"' ~/.zshrc || echo 'export PATH="$PATH:'"$(pwd)"'/server/bin"' >> ~/.zshrc
source ~/.zshrc
which mmctl
mmctl version
```
