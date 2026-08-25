# 구현 계획: Go 1.26.2 툴체인 이행

**브랜치**: `010-go-1-26-upgrade` | **작성일**: 2026-08-25 | **명세**: [spec.md](./spec.md)

**입력**: `specs/010-go-1-26-upgrade/spec.md`

**방침**: 사용자 지시 — **"최대한 upstream을 따라간다"**. 이 계획의 모든 선택은 이 방침을 우선한다.

## 요약

저장소 Go 목표 버전을 1.25.9 → 1.26.2로 올린다. 참조 구현은 upstream `e3fbf871`(MM-68149, #36418, 262파일 +4680/-4586)이다.

Phase 0 조사에서 방침을 그대로 밀고 나갈 근거를 얻었다. **언어 버전을 올리면 `make check-style`이 58건으로 실패하는데, 그 58건이 걸린 파일 11개가 전부 upstream 커밋 범위 안에 있다.** 즉 upstream diff를 충실히 반영하는 것만으로 품질 게이트가 해결된다 — 우리가 독자적으로 고칠 지적이 하나도 없다.

동시에 **upstream을 그대로 따라가면 안 되는 지점 하나**도 실증으로 확인했다. upstream이 `builtin.go`에 넣은 `//go:fix inline`은 `go fix`로 `NewPointer` 호출을 변환하려는 시도인데, 제네릭 함수라 인라인 분석기가 인식하지 못해 **동작하지 않는다**. upstream 자신도 이틀 뒤 `d4fc0ecb`에서 그 지시자를 제거했다. 따라서 잔여 4678곳 변환은 `gofmt -r` + `goimports`로 하고, 지시자는 upstream 원문대로 받되 변환 수단으로 기대하지 않는다.

## 기술 맥락

**언어/버전**: Go 1.25.9 → **1.26.2** (서버 전용, webapp 범위 밖)

**주요 의존**: golangci-lint v2.11.4 (**버전 상승 불필요** — 실증), goimports (일회성), morph(무관)

**저장소**: 해당 없음 — 스키마·데이터 변경 없음

**테스트**: `go test` + gotestsum. 검증 절차는 [quickstart.md](./quickstart.md) 9절

**대상 플랫폼**: Linux 서버 (CI: `mattermost/mattermost-build-server` 컨테이너)

**프로젝트 유형**: 모노레포의 서버 모듈 — `server/`, `server/public/`, `tools/*`

**성능 목표**: 해당 없음 — 동작 무변경 이행

**제약**: 이행 중 다른 대규모 Go 변경 병행 불가(거의 모든 Go 파일 접촉). 보호 경로 3곳 접촉

**규모**: Go 파일 2042개, `NewPointer` 호출 4678곳, 픽스처 23개, 신규 린터 지적 58건

## Constitution Check

*게이트: Phase 0 이전 통과, Phase 1 이후 재확인*

| 원칙 | 판정 | 근거 |
|---|---|---|
| **I. 패키지별 품질 게이트** | 통과 | `server/` 변경이므로 `make check-style` + 서버 테스트가 게이트다. quickstart 6절이 **기준선 diff 판정**을 강제한다. 이 저장소에는 이행과 무관한 기존 실패가 있어(`TestUpdateAssetsSubpath/no_client_dir` 등) 개수 비교는 무의미하다 — 착수 전 기준선 저장을 quickstart 사전 준비에 못 박았다 |
| **II. webapp npm workspaces** | 해당 없음 | webapp 무접촉 |
| **III. 실패를 본 테스트만 인정** | **주의** | 이 작업은 동작을 바꾸지 않으므로 신규 테스트가 없다. 대신 **이미 실패 중인 테스트**가 통과로 바뀌는 것이 증거다 — `TestGenerateMiniPreviewImage`가 현재 42/256 픽셀 불일치로 실패한다(실패 출력 확보 완료). SC-005는 위반을 일부러 주입해 검사가 잡는지 확인한다(quickstart 7절) |
| **IV. 라이선스·리브랜드 충실성** | 통과 | copyright 헤더·NOTICE 무변경. `server/enterprise/` 2파일을 건드리나 upstream diff의 기계적 변환만 수용 |
| **V. i18n 동기화** | 통과 | upstream 커밋에 i18n 변경 없음 |
| **VI. 브랜치 + PR** | 통과 | `010-go-1-26-upgrade` 브랜치, PR 경유. **보호 경로 3곳 접촉** → code owner 리뷰 필요 가능 |
| **VII. Spec 주도 워크플로** | 통과 | specify → plan(현재) → tasks → implement. 구현 규율은 `/speckit-implement`의 3-bis에서 로드 |
| **VIII. 명세 문서 한국어** | 통과 | 산출물 전부 한국어, 식별자·경로·명령은 원형 유지 |

**위반 없음.** Complexity Tracking 절 불필요.

**Phase 1 이후 재확인**: 설계 산출물([research](./research.md), [data-model](./data-model.md), [contracts](./contracts/developer-surface.md), [quickstart](./quickstart.md))을 낸 뒤에도 위반 없음. 오히려 원칙 I의 기준선 diff 요구가 quickstart에 절차로 고정돼 게이트가 강화됐다.

## 프로젝트 구조

### 문서 (이 기능)

```text
specs/010-go-1-26-upgrade/
├── spec.md                        # 명세 (완료)
├── plan.md                        # 이 파일
├── research.md                    # Phase 0 — 결정 8건, 전부 실증
├── data-model.md                  # Phase 1 — 변경 대상 목록
├── contracts/
│   └── developer-surface.md       # Phase 1 — -update-fixtures, check-go-fix 계약
├── quickstart.md                  # Phase 1 — 검증 9절
├── checklists/
│   └── requirements.md            # 명세 품질 체크리스트 (완료)
└── tasks.md                       # Phase 2 — /speckit-tasks 산출, 아직 없음
```

### 소스 코드 (저장소 루트)

```text
server/
├── .go-version                    # 핀 ①
├── go.mod                         # 핀 ②
├── Makefile                       # golangci-lint v2.11.4 (변경 없음 — 조사 결정 4)
├── public/
│   ├── go.mod                     # 핀 ③
│   ├── model/
│   │   ├── builtin.go             # //go:fix inline + new(t) (upstream 원문)
│   │   ├── config.go              # ⚠ 충돌 — okrbest 자체 설정 보존
│   │   └── property_field_test.go # 충돌 — property v2 훅 폐기
│   ├── pluginapi/
│   │   └── license_test.go        # 린터 지적 37건 — bToP 헬퍼 제거
│   └── plugin/, shared/           # 변환 대상
├── channels/
│   ├── api4/post_test.go          # 충돌 — 줄 밀림
│   ├── app/
│   │   ├── channel_test.go        # 충돌 — 줄 밀림
│   │   └── imaging/preview_test.go # -update-fixtures + 허용오차 비교
│   ├── store/storetest/post_store.go # 충돌 — 변환 수용
│   ├── utils/merge.go             # reflect.Ptr → Pointer
│   └── web/params_test.go         # 린터 지적 4건
├── enterprise/elasticsearch/common/ # ⚠ 보호 경로 2파일
├── config/                        # 변환 대상
├── cmd/mmctl/                     # 변환 대상
└── tests/                         # 픽스처 23개 재생성

tools/
├── mattermost-govet/go.mod        # 핀 ④
└── sharedchannel-test/go.mod      # 핀 ⑤

.github/workflows/server-ci.yml    # ⚠ 보호 경로 — check-go-fix 잡 신규
.specify/memory/constitution.md    # Go 1.24.6 → 1.26.2 (2곳)
```

**구조 결정**: 신규 디렉터리·모듈 없음. 기존 서버 모듈 구조를 그대로 두고 **툴체인 선언과 코드 표기만** 바꾼다. 위 트리는 실제 접촉 지점만 표시했다.

## 구현 순서

조사 결정 7의 근거에 따라 5단계로 나눈다. **각 단계가 독립적으로 검증 가능하고, 앞 단계가 실패해도 뒤 단계가 그 성과를 무너뜨리지 않는다.**

| 단계 | 내용 | 완료 판정 | 왜 이 순서인가 |
|---|---|---|---|
| **1** | 버전 핀 5개 상승 | `go build ./...` 통과 | **선행 필수**. `new(x)`가 언어 버전 1.26 이상을 요구해, 핀 없이는 어떤 변환도 컴파일되지 않는다(실증) |
| **2** | upstream `e3fbf871` cherry-pick + 충돌 7건 해소 | `make check-style` **0 issues** | 린터 지적 58건이 전부 이 diff로 해결된다. 게이트가 여기서 닫힌다 |
| **3** | 픽스처 23개 검증·필요 시 재생성 | imaging 테스트 통과 | 2단계에서 픽스처가 함께 들어온다. 우리 툴체인에서 통과하는지 확인 |
| **4** | 잔여 `NewPointer` 변환 (`gofmt -r` + `goimports`) | 잔존 0건, 신규 FAIL 0건 | **게이트와 무관**(제네릭이라 린터가 인식 못 함). 위험을 뒤로 분리 — 여기서 문제가 생겨도 1~3단계 성과는 남는다 |
| **5** | `check-go-fix` CI 잡 도입 + constitution 갱신 | CI 통과, 위반 주입 시 실패 | `go fix` 잔여물이 없어야 통과하므로 2·4단계 이후여야 한다 |

**되돌리기**: 각 단계가 별도 커밋이므로 문제 발생 시 해당 커밋만 `git revert`한다. 특히 4단계는 4678곳을 건드리므로 단독 커밋으로 분리한다.

**완료 커밋 요건**: 본문에 `Upstream: https://github.com/mattermost/mattermost/commit/e3fbf8711f73ac1266ebc943f88999175c2594ef`를 넣어야 미반영 목록에서 자동 차감된다(SC-007).

## upstream 추종 방침의 구체적 적용

사용자 지시가 "최대한 upstream을 따라간다"이므로, 갈림길마다 무엇을 따르고 무엇을 따르지 않는지 명시한다.

| 항목 | 판단 | 근거 |
|---|---|---|
| 린터 지적 58건 해소 | **upstream diff 그대로** | 11개 파일 전부 커밋 범위 안 (조사 결정 5) |
| `-update-fixtures` 플래그 | **upstream 원문 그대로** | 계약 문서에 원문 고정 |
| `check-go-fix` CI 잡 | **upstream 원문 그대로** | YAML 전문을 계약 문서에 고정 |
| `//go:fix inline` 지시자 | **원문대로 받되 수단으로 쓰지 않음** | 제네릭 미지원으로 무효. upstream도 `d4fc0ecb`에서 제거 |
| `NewPointer` 잔여 변환 수단 | **upstream과 다름** (`gofmt -r`) | upstream에는 우리 1200곳이 존재하지 않아 참조할 방법이 없다 |
| golangci-lint 버전 | **올리지 않음** | v2.11.4로 충분(실증). upstream의 v2.12.2 상승은 별도 sync 항목 `d4fc0ecb` |
| property v2 계보 훅 | **폐기** | 우리 트리에 대상 파일·심볼이 없음 (제외한 `48f2fd08` 계보) |

## 위험과 대응

| 위험 | 영향 | 대응 |
|---|---|---|
| `model/config.go` 충돌 해소 실수 | okrbest 자체 설정(`EnableWatermark` 등) 유실 | quickstart 6절이 `TestConfig` 실행과 `EnableWatermark` 잔존을 지목 검증 |
| 자체 코드 1200곳 변환의 의미 변화 | 조용한 동작 변화 | `gofmt -r`은 AST 기반 치환. 4단계를 단독 커밋으로 두고 `git diff --stat`으로 예상 밖 파일 확인 + 패키지별 테스트 |
| 임포트 미사용 잔존 | 빌드 실패 | 실증됨 — `gofmt -r` 직후 반드시 `goimports` (조사 결정 3) |
| 보호 경로 3곳 | PR 즉시 병합 거부 | 예상된 결과. PR을 열어둔 채 code owner 리뷰 요청 |
| 이행 중 병행 Go 변경 | 대규모 충돌 | 착수 전 열린 Go PR 정리. 이행 PR을 우선 병합 |
| 픽스처가 우리 환경에서도 어긋남 | imaging 테스트 실패 | `-update-fixtures`로 재생성 후 커밋 (계약 1) |

## 범위 밖

- webapp — Go 툴체인만 다룬다
- golangci-lint v2.12.2 상승 — 별도 sync 항목(`d4fc0ecb`)
- `server/go.work` — gitignore된 개발자 로컬 파일
- 린터 정책 개편(opt-in → opt-out) — `d4fc0ecb`에 속한다
