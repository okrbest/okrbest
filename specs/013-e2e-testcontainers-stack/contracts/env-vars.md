# 계약: 환경변수

**기능**: [spec.md](../spec.md) | **작성**: 2026-10-03

이 기능이 외부에 노출하는 주 인터페이스다. 사람과 CI가 스택을 조종하는 유일한 손잡이다.

`PW_` 접두사는 기존 관례를 따른다(`sample.env` 참조). `SERVER_IMAGE`만 접두사가
없는데, Compose 기반 CI가 이미 쓰는 이름이라 upstream이 그대로 재사용한다.

## 모드 선택

| 변수 | 기본 | 뜻 |
|---|---|---|
| `PW_USE_TESTCONTAINERS` | `false` | `true`면 testcontainers 모드. **기본이 꺼짐이라 기존 실행이 바뀌지 않는다** |

## 서버 이미지 (필수)

| 변수 | 기본 | 뜻 |
|---|---|---|
| `SERVER_IMAGE` | **없음 — 미지정이면 실패** | 테스트 대상 okrbest 서버 이미지 |

upstream은 미지정 시 `mattermostdevelopment/mattermost-enterprise-edition:master`로
폴백한다. okrbest는 **폴백하지 않고 던진다**(FR-002).

```
# testcontainers 모드에서 SERVER_IMAGE 없이 기동하면
Error: SERVER_IMAGE가 지정되지 않았다. testcontainers 모드는 okrbest 서버
이미지를 요구한다. upstream 기본 이미지로 폴백하지 않는다 —
그러면 okrbest가 아닌 서버를 테스트한다.
이미지 생성: specs/013-e2e-testcontainers-stack/quickstart.md
```

문구는 구현에서 확정한다. 계약은 **던진다**는 것과 **이미지 생성 방법을 알린다**는 것이다.

## 서비스 선택

| 변수 | 기본 | 뜻 |
|---|---|---|
| `PW_TESTCONTAINERS_SERVICES` | `minio,openldap,keycloak,elasticsearch` | 띄울 선택 서비스. 쉼표 구분 |

허용 값(닫힌 집합): `openldap`, `keycloak`, `elasticsearch`, `opensearch`, `minio`, `azurite`.

- 미설정 → 기본 4종
- 빈 문자열 → 아무것도 안 띄운다
- 집합 밖 이름 → 검증 실패

`postgres`·`inbucket`·`webhook`·서버는 선택 대상이 아니다. 항상 뜬다.

## 스택 수명·환경

| 변수 | 기본 | 뜻 |
|---|---|---|
| `PW_TESTCONTAINERS_REUSE` | `false` | 반복 실행에서 컨테이너를 재사용한다(US2) |
| `PW_CONTAINER_RUNNER` | `false` | Playwright 자신이 컨테이너 안에서 돈다. 매핑 포트 대신 네트워크에 합류 |
| `MM_*` (via `serverEnv`) | — | 서버 설정 덮어쓰기. `KEY=VALUE` 쉼표 구분 |

## 스택이 되써 넣는 값

스택이 알아낸 뒤 `.env.testcontainers`에 기록해 worker 프로세스로 넘긴다.
**사람이 설정하는 값이 아니다. 읽기 전용으로 본다.**

| 키 | 누가 쓰나 |
|---|---|
| `postgresUrl` | DB 직접 접근이 필요한 스펙 |
| `testcontainersNetworkName` | worker가 네트워크에 컨테이너를 붙일 때 |
| `mattermostContainerId` | worker가 서버를 재기동할 때 |
| `bootEnvOverrides` | 서버의 **현재 실제** 부팅 env |
| `testcontainersNetworkGatewayIp` | 브라우저와 서버 양쪽이 쓰는 mock 파일 서버 주소 |

`.env.testcontainers`는 생성물이다. 커밋하지 않는다.

## 기존 변수와의 관계

`external` 모드에서 쓰던 변수는 전부 그대로다. `PW_BASE_URL`,
`PW_ADMIN_USERNAME`/`PASSWORD`/`EMAIL`, `PW_HEADLESS`, `PW_WORKERS`,
`PW_SNAPSHOT_ENABLE` 등이 영향받지 않는다.

`testcontainers` 모드에서 `PW_BASE_URL`은 스택이 결정한다 — 사람이 준 값은 의미가 없다.
