# 구현 계획: 서버 배포물에서 포크 플러그인의 공식판을 뺀다

**브랜치**: `034-unbundle-forked-plugins` | **작성일**: 2026-11-18 | **명세**: [spec.md](spec.md)

**입력**: `specs/034-unbundle-forked-plugins/spec.md`

## 요약

서버를 재시작할 때마다 배포물에 실린 Playbooks·Boards·Agents 공식판이 같은 ID의 우리
포크를 덮어쓴다. 공식판은 두 경로로 들어온다. 운영 이미지는 upstream 최신 릴리스 tarball의
`prepackaged_plugins/`를 그대로 물려받고, `make` 배포물은 `server/Makefile`의
`PLUGIN_PACKAGES`로 내려받는다. 두 경로에서 모두 세 플러그인을 뺀다. 서버의 설치 로직은
건드리지 않는다. 배포물에 공식판이 없으면 비교할 상대가 없어서 파일 저장소의 포크가 그대로
남는다. 근거는 [research.md](research.md)에 있다.

## 기술 맥락

**언어/버전**: GNU Make(`server/Makefile`), Dockerfile(BuildKit, `SHELL` bash). Go·TS 코드는 바뀌지 않는다

**주요 의존성**: upstream 릴리스 tarball `https://latest.mattermost.com/mattermost-enterprise-linux`
(2026-11-18 기준 12.1.0), `plugins.releases.mattermost.com`

**저장소**: 해당 없음. 플러그인 파일 저장소의 내용은 바꾸지 않는다

**테스트**: 단위 테스트 체계가 닿지 않는다. 고치기 전과 고친 뒤의 명령 출력을 비교한다
([quickstart.md](quickstart.md) Q1·Q2). 종단 검증은 로컬 서버 재시작으로 한다(Q3)

**대상 플랫폼**: 운영 이미지 linux/amd64(`okrbest-deploy`의 dev·prd·starter 워크플로가 같은 Dockerfile을 쓴다)

**프로젝트 유형**: 웹 서비스 서버의 빌드·이미지 정의

**성능 목표**: 해당 없음. 다음 이미지 빌드에서 `/mattermost` 레이어 push가 한 번 커진다(R2)

**제약**: FIPS 빌드는 일반 목록으로 대체되면 안 된다(R3). upstream 파일이라 sync 충돌 면적을
최소로 한다

**규모/범위**: 2개 파일 수정(`server/Makefile`, `server/build/Dockerfile`) + 문서 1건(divergence) + 메모리 정정

## 헌법 점검

*게이트: Phase 0 전에 통과해야 한다. Phase 1 설계 뒤 다시 점검한다.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | 예외 기록 | Go 코드가 바뀌지 않아 `make check-style`·`make test-server`가 이 변경을 검사하지 않는다. 대신 `make -n prepackaged-plugins`(일반·FIPS)와 builder 이미지 목록으로 확인한다. 아래 복잡도 추적에 사유를 적었다 |
| II. webapp npm workspaces | 해당 없음 | webapp을 건드리지 않는다 |
| III. 실패를 본 테스트만 인정 | 통과(방식 조정) | 검사 명령을 고치기 전에 돌려 세 플러그인이 **나오는** 출력을 남긴다(2026-11-18 Makefile 출력 확보: 일반 13개, FIPS 3개). 고친 뒤 0건을 확인한다 |
| IV. 라이선스·리브랜드 | 통과 | 공식 플러그인 번들을 빼기만 한다. 저작권 헤더·NOTICE는 건드리지 않는다 |
| V. i18n 동기화 | 해당 없음 | 사용자 문자열이 없다 |
| VI. 집중 브랜치 + PR | 통과 | 첫 편집 전에 `034-unbundle-forked-plugins`를 만들었다. `.github/CODEOWNERS`에 `server/build/` 항목이 없다(2026-11-18 확인) |
| VII. Spec 주도 | 통과 | specify → plan 순서를 따른다 |
| VIII. 명세 문체 | 통과 | 한국어, 식별자·경로 원형 유지 |

**Phase 1 뒤 재점검**: 설계가 바뀌지 않았다. 판정은 같다.

## 설계

### D1. `server/build/Dockerfile` — 운영 이미지에서 세 공식판을 지운다 (FR-001, FR-005)

builder 단계에서 tarball을 푼 `RUN`(31-35행) **뒤에** 별도 `RUN`을 하나 둔다. 위치는
"Remove mattermost server and client"(41-44행) 다음이 자연스럽다.

- `/mattermost/prepackaged_plugins/` 안에서 `mattermost-plugin-{playbooks,boards,agents}-v*`
  파일(`.tar.gz`·`.sig`)을 지운다.
- 같은 `RUN` 끝에서 세 접두어 파일이 하나라도 남으면 빌드를 실패시킨다.
- 바로 위 주석에 사유를 적는다: 같은 ID의 포크를 서버 시작 때 덮어쓴다. spec 034를 가리킨다.

별도 `RUN`으로 두는 이유는 R2에 있다. 캐시된 tarball 레이어를 다시 받지 않고 이 단계만 다시
실행된다.

### D2. `server/Makefile` — `make` 배포물에서 세 공식판을 뺀다 (FR-002, FR-003, FR-005)

- 일반 목록에서 `mattermost-plugin-playbooks-v2.11.1`, `mattermost-plugin-agents-v2.4.2`,
  `mattermost-plugin-boards-v9.3.0` 세 줄을 지운다. 나머지 10줄은 순서와 버전을 그대로 둔다.
- FIPS `ifeq ($(FIPS_ENABLED),true)` 블록은 남긴다. 세 줄을 `PLUGIN_PACKAGES =` 한 줄로
  바꾼다. 블록을 지우면 FIPS 빌드가 일반 목록을 받는다(R3).
- 두 자리 위에 사유 주석을 단다. upstream의 기존 주석 문단은 고치지 않는다.

### D3. 문서와 메모리 (FR-006, FR-007)

- `spec-docs/upstream/upstream-adapted-divergences.md` 끝에 절을 하나 더한다. 담을 내용:
  - 무엇을 뺐나(두 경로)
  - 왜 뺐나
  - ledger 제외 13건의 재검토 조건("번들 정책이 정해지면")이 이 절로 확정됐다는 사실
  - 이후 sync 규칙: 세 플러그인 번들 버전 올림은 계속 exclude한다. upstream이 이 자리 주변을
    바꾸면 줄 없이 문맥만 맞춘다.
  - 되살릴 조건: 포크 ID를 분리하거나 공식 번들로 돌아갈 때
- 같은 문서의 "user-survey 플러그인 번들 제거" 절 표가 "포크 값을 유지했다"고 적었다. 이번 절을
  가리키는 한 줄을 덧붙인다.
- ledger 행은 고치지 않는다(R4).
- 메모리 `official-plugin-bundle-overwrites-fork`를 정정한다. 운영 경로는 Dockerfile의
  upstream tarball이고, 이 작업으로 두 경로 모두 막았다는 내용이다.

### 하지 않는 것

- `server/channels/app/plugin*.go` 수정 (FR-008)
- `server/build/Dockerfile.fips` 등 운영에 쓰지 않는 다른 Dockerfile
- `okrbest-deploy` 워크플로 검사 단계, 포크 저장소 버전 고정, MS Teams Meetings 제거

## 프로젝트 구조

### 문서 (이 기능)

```text
specs/034-unbundle-forked-plugins/
├── spec.md
├── plan.md              # 이 파일
├── research.md          # Phase 0
├── quickstart.md        # Phase 1 검증 가이드
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks가 만든다
```

`data-model.md`와 `contracts/`는 만들지 않는다. 데이터 모델이 없고, 외부 인터페이스(API·설정
스키마)도 바뀌지 않는다. 핵심 개체는 spec의 "핵심 개체" 절로 충분하다.

### 소스 코드

```text
server/
├── Makefile                 # D2: PLUGIN_PACKAGES 일반 3줄 삭제, FIPS 블록 비움
└── build/
    └── Dockerfile           # D1: builder 단계에 공식판 삭제 RUN 추가
spec-docs/upstream/
└── upstream-adapted-divergences.md   # D3: 정책 절 추가
```

**구조 결정**: 기존 빌드 정의 두 파일만 고친다. 새 파일을 만들지 않는다.

## 복잡도 추적

| 예외 | 필요한 이유 | 더 단순한 대안을 기각한 이유 |
|---|---|---|
| 원칙 I의 서버 게이트(`check-style`·`test-server`) 대신 명령 출력 비교 | 바뀌는 것이 Makefile 변수와 Dockerfile 단계뿐이다. Go 게이트는 이 변경을 검사하지 않는다 | 게이트를 돌려도 통과·실패가 이 변경과 무관하다. 대신 Q1·Q2 출력과 Q3 재시작 결과를 증거로 남긴다 |
| 원칙 III의 테스트 파일 대신 고치기 전·뒤 명령 출력 | 두 파일을 시험하는 테스트 체계가 저장소에 없다 | Dockerfile·Makefile용 테스트 하네스를 새로 만드는 것은 두 줄 변경에 비해 과하다. 고치기 전 출력으로 "실패를 먼저 본다"를 지킨다 |
