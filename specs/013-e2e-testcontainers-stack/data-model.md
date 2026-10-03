# Phase 1 데이터 모델: E2E testcontainers 의존 서비스 스택

**기능**: [spec.md](spec.md) | **조사**: [research.md](research.md) | **작성**: 2026-10-03

DB 스키마가 없는 기능이다. 마이그레이션도 없고 `server/` 변경도 없다. 여기서
모델링하는 건 **테스트 실행이 들고 다니는 상태**다 — 어떤 서비스가 떠 있고, 그
서비스에 어떻게 닿고, 서버가 어떤 env로 부팅했는지.

상태가 프로세스 경계를 넘는다는 점이 이 모델의 핵심이다. global setup이 컨테이너를
띄우고, worker 프로세스는 **다른 OS 프로세스**다. 그래서 in-process 객체 핸들로는
안 되고, 파일(`.env.testcontainers`)로 넘긴다.

## 엔티티

### 서비스 스택 (Stack)

한 테스트 실행이 쓰는 컨테이너 묶음. `lib/src/containers/stack.ts`가 소유한다.

| 속성 | 뜻 | 비고 |
|---|---|---|
| network | 컨테이너들이 서로 닿는 Docker 브리지 네트워크 | 이름을 `testcontainersNetworkName`으로 내보낸다 |
| mattermost | 테스트 대상 서버 컨테이너 | **okrbest 이미지여야 한다** (FR-001) |
| postgres | 관계형 DB 컨테이너 | 매핑 포트를 `postgresUrl`에 되써 넣는다 |
| inbucket | 메일 수신 | 항상 뜬다 |
| webhook | 웹훅 사이드카 | 항상 뜬다 |
| additional | 선택 서비스 집합 | `testcontainersServices`가 고른다 |

수명: `startStack()` → 테스트 → `stopStack()`. 중단·타임아웃에서도 거둬야 한다(FR-006).

**불변 규칙**

- 모든 서비스가 준비 판정을 통과한 뒤에만 테스트가 시작한다(FR-005).
- 거두는 대상은 스택이 띄운 컨테이너로 한정한다. 개발 compose 컨테이너를 건드리지 않는다(FR-008).
- `external` 모드에서는 스택이 아예 만들어지지 않는다(D1).

### 서비스 컨테이너 (ServiceContainer)

스택을 이루는 단위. 서비스마다 `*_container.ts` 하나씩, 그리고 선택 서비스는
`requirements.ts`의 `ADDITIONAL_SERVICE_STARTERS` 한 곳에 등록된다.

| 속성 | 뜻 |
|---|---|
| image | 이미지 또는 Dockerfile 빌드 입력 |
| alias | 같은 네트워크 안에서 쓰는 이름 |
| readiness | 준비 판정 조건 |
| mappedPort | 호스트에서 닿는 포트 (testcontainers가 **임의 할당**) |

**임의 할당이 개발 compose와의 공존을 보장한다**(FR-011, SC-007). 고정 포트를 쓰는
compose와 다툴 자리가 없다.

서버 컨테이너의 준비 판정만 두 겹이다 — `/api/v4/system/ping` 헬스체크 **그리고**
권한 마이그레이션 완료 로그(`All migrations are complete.`). 마이그레이션이 덜
끝난 서버에 붙으면 권한 관련 스펙이 간헐 실패한다.

### 서버 이미지 (ServerImage)

테스트 대상 okrbest 서버를 담은 이미지. **이 모델에서 가장 민감한 값이다.**

| 출처 | 값 |
|---|---|
| 지정 | `SERVER_IMAGE` 환경변수 |
| 미지정 | **실패해야 한다** (FR-002) — upstream 기본값으로 폴백 금지 |

upstream은 `process.env.SERVER_IMAGE || MATTERMOST_SERVER_IMAGE`로 폴백한다.
우리는 그 자리에 가드를 넣는다(D2). `default_images.ts`는 그대로 둔다.

생성: `make package-linux-amd64` → tarball → `server/build/Dockerfile`의
`MM_PACKAGE`(file:// URL) → 로컬 이미지. 자세한 명령은 [quickstart.md](quickstart.md).

**스테일 위험**: 서버 코드를 고치고 이미지를 다시 안 만들면 옛 바이너리를 테스트한다.
이미지 재생성은 사람 책임이고, quickstart가 그 순서를 명시한다.

### 테스트 설정 (TestConfig)

`lib/src/test_config.ts`의 단일 객체. 스택이 알아낸 값을 테스트에 전달한다.
upstream이 이번에 204줄을 추가한다.

주소 관련 필드가 셋인데, **누가 그 주소로 닿는지**가 다르다. 헷갈리면 버그가 난다.

| 필드 | 누가 쓰나 | `external` 모드 | `testcontainers` 모드 |
|---|---|---|---|
| `baseURL` | 테스트 프로세스·브라우저 | `http://localhost:8065` | 호스트 매핑 포트 |
| `internalBaseURL` | **다른 컨테이너**(서버 자신 포함) | `baseURL`과 같다 | Docker 네트워크 별칭 |
| `testcontainersNetworkGatewayIp` | 브라우저와 서버 컨테이너 **양쪽** | 빈 값 | 브리지 게이트웨이 IP |

`internalBaseURL`이 D3의 `SiteURL` 변경 이유다. 서버가 자기 자신을 가리키는
주소라 호스트 매핑 포트로는 자기 컨테이너 안에서 닿지 않는다.

프로세스 경계를 넘는 필드:

| 필드 | 왜 파일로 넘기나 |
|---|---|
| `postgresUrl` | 스택이 실제 매핑 포트를 알아낸 뒤 덮어쓴다 |
| `testcontainersNetworkName` | worker가 같은 네트워크에 컨테이너를 붙이려면 필요 |
| `mattermostContainerId` | worker가 서버를 재기동(스토리지 백엔드 전환 등)하려면 필요 |
| `bootEnvOverrides` | 컨테이너가 자기를 띄운 프로세스보다 오래 산다. 현재 실제 상태를 알아야 한다 |

전달 매체는 `.env.testcontainers`다. `dotenv`가 `override: true`로 읽는다.
생성물이므로 커밋하지 않는다(`.gitignore` 훅이 보장).

### 서비스 이름 (TestContainersServiceName)

선택 서비스의 닫힌 집합. `test_config.ts`의 `TESTCONTAINERS_SERVICE_NAMES`가
정본이고 `requirements.ts`가 같은 타입으로 기동 함수를 등록한다 — 둘이 갈라지면
타입 에러로 잡힌다.

```
openldap | keycloak | elasticsearch | opensearch | minio | azurite
```

기본 기동: `minio`, `openldap`, `keycloak`, `elasticsearch`.
옵트인: `opensearch`, `azurite`.
`PW_TESTCONTAINERS_SERVICES`로 바꾸고, 빈 문자열이면 아무것도 안 띄운다.

## 상태 전이

```
[없음]
  │  startStack()  (PW_USE_TESTCONTAINERS=true 일 때만)
  ▼
[네트워크 생성] → [postgres·inbucket·webhook·선택 서비스 기동]
  ▼
[서버 컨테이너 기동] ──ping + 마이그레이션 완료 로그──▶ [준비됨]
  │                                                      │
  │ 서비스 기동 실패                                      │ 테스트 실행
  ▼                                                      │ (worker가 ensure*()로
[실패 보고 + 거둠]                                        │  필요시 서버 재기동)
                                                          ▼
                                                   [stopStack() → 거둠]
```

`reuse`가 켜지면 `[준비됨]`에서 프로세스가 끝나도 컨테이너가 남고, 다음 실행이
그 상태로 재진입한다(US2). 그래서 `bootEnvOverrides`를 파일에서 읽어야 한다 —
기본값을 가정하면 틀린다.

## 검증 규칙 요약

| 규칙 | 근거 FR | 어디서 걸리나 |
|---|---|---|
| `SERVER_IMAGE` 미지정이면 던진다 | FR-002 | `test_config.ts` 가드 (D2) |
| 선택 서비스 이름은 닫힌 집합 | FR-009 | `TESTCONTAINERS_SERVICE_NAMES` 검증 |
| 준비 전 테스트 시작 금지 | FR-005 | 컨테이너별 readiness |
| 종료·중단에서 누수 0 | FR-006 | `stopStack()` + `testcontainers:down` |
| 개발 compose 무접촉 | FR-008 | 스택이 띄운 것만 거둔다 |
