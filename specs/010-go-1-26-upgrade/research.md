# Phase 0 조사: Go 1.26.2 툴체인 이행

**작성일**: 2026-08-25 | **명세**: [spec.md](./spec.md)

방침은 "최대한 upstream을 따라간다"이다. 그래서 조사의 기준 질문은 *"upstream은 실제로 무엇을 어떻게 했는가"*이고, 우리 트리에서 그것이 그대로 통하는지 실증으로 확인했다. 아래 결론은 전부 이 저장소에서 직접 실행해 얻은 것이다.

---

## 결정 1 — 버전 핀을 가장 먼저 올린다

**결정**: 5개 핀(`server/.go-version`, `server/go.mod`, `server/public/go.mod`, `tools/mattermost-govet/go.mod`, `tools/sharedchannel-test/go.mod`)을 1.26.2로 올리는 것이 **다른 모든 작업의 선행 조건**이다.

**근거 (실측)**: 핀을 올리지 않은 채 `go fix`를 돌리면 이렇게 막힌다.

```
public/model/builtin.go:9:41: new(t) requires go1.26 or later (-lang was set to go1.25; check go.mod)
```

`new(x)` 초기값 형태는 **언어 버전 1.26 이상에서만** 유효하다. go.mod의 `go` 지시자가 언어 버전을 정하므로, 핀이 먼저 올라가야 나머지 변환이 성립한다.

**검토한 대안**: 변환을 먼저 하고 핀을 나중에 올리기 → 중간 상태가 컴파일되지 않아 불가.

---

## 결정 2 — `//go:fix inline` + `go fix`로는 `NewPointer`가 변환되지 않는다

**결정**: `NewPointer` 호출(우리 트리 4678곳)의 변환에 `go fix`를 쓸 수 없다. 변환 자체는 upstream diff가 처리하지만, 그 범위 밖에 남는 것과 향후 유입분에는 별도 메커니즘이 필요하다.

**근거 (실증)**: upstream `e3fbf871`은 `builtin.go`에 `//go:fix inline`을 붙이고 본문을 `new(t)`로 바꾼다. 우리 트리에 동일하게 적용하고 핀을 올린 뒤 `go fix ./channels/utils/`를 돌린 결과:

- `reflect.Ptr` → `reflect.Pointer` **변환됨** ✅
- `model.NewPointer(...)` 호출 21곳 **변환 안 됨** ❌

원인은 upstream 자신이 이틀 뒤 커밋에 적어 두었다. `d4fc0ecb`(MM-68150, 2026-05-14, 우리 미반영 목록에 있음)의 메시지:

> Remove `//go:fix inline` from NewPointer, which is a generic function **not yet supported by the inline analyzer**

즉 upstream의 `//go:fix inline`은 **수명이 이틀인 잘못된 시도**였고, e3fbf871의 대량 변환은 `go fix`가 아닌 다른 수단으로 이뤄졌다.

**변환 방향 확인**: 헷갈리기 쉬운 지점이라 못박는다. `NewPointer(x)` **→** `new(x)` 방향이다. Go 1.26이 내장 `new()`에 값 표현식을 허용하면서(`new("abc")` → `*string`) 헬퍼가 불필요해졌다. 헬퍼 자신의 본문도 `return &t` → `return new(t)`로 바뀐다. `NewPointer` 함수는 **삭제되지 않고 남으므로**, 변환하지 않은 호출부도 계속 컴파일된다 — 이 변환은 컴파일 요건이 아니라 upstream과의 표기 정합이다.

**따라서 upstream을 따른다는 것의 의미**: `e3fbf871`의 지시자를 그대로 가져오되, 그것이 변환 수단이라고 기대하지 않는다. 그리고 `d4fc0ecb`를 반영할 때 지시자가 제거된다는 점을 미리 안다.

---

## 결정 3 — 잔여 `NewPointer` 변환은 `gofmt -r` + `goimports`로 한다

**결정**: cherry-pick 후에도 남는 `NewPointer` 호출은 `gofmt -r 'model.NewPointer(a) -> new(a)'`로 치환하고, 이어서 `goimports`로 미사용 임포트를 정리한다.

**적용 규모 정정**: 이 결정의 초판은 대상을 "okrbest 자체 코드 약 1200곳"으로 잡았다. 실측 결과 **그런 범위는 없다**.

| 측정 | 결과 |
|---|---|
| 우리 트리 `NewPointer(` 포함 줄 | 4678 |
| upstream 부모(`e3fbf871^`) 같은 값 | 4915 (우리보다 많다) |
| 파일 단위 전수 대조 — 우리에게만 더 있는 줄 | **0** |
| 212개 파일 중 upstream 커밋 범위 밖 | **1개** (`channels/api4/content_flagging_report_test.go`, 호출 1곳) |
| okrbest 고유 Go 파일 18개의 `NewPointer` 사용 | **0건** |

즉 알림 히스토리·조직 역할·직위 등 okrbest 자체 기능 코드는 이 표기를 아예 쓰지 않는다. 이 메커니즘은 **잔여 1곳 처리와 향후 유입분 대비**용으로 남긴다.

**근거 (실증)**: `channels/utils` 패키지에 적용해 확인했다.

1. `gofmt -r 'model.NewPointer(a) -> new(a)' -w channels/utils/` → 대상 3파일 치환, 잔존 **0건**
2. 치환 직후 빌드 실패: `"...public/model" imported and not used` — **호출을 전부 없앤 파일에서 `model` 임포트가 미사용으로 남는다**
3. `goimports -w channels/utils/` → 임포트 정리
4. `go test ./channels/utils/` → 실패 1건(`TestUpdateAssetsSubpath/no_client_dir`)이 남았으나, 실험을 되돌린 기준선에서도 **동일하게 실패**. 즉 이 변환과 무관한 기존 결함이다.

**검토한 대안**:

| 대안 | 기각 사유 |
|---|---|
| `go fix` | 결정 2 — 제네릭 미지원으로 동작하지 않음 |
| 손수 대량 수정 | 재현 불가·검토 불가. FR-004 위반 |
| 변환 생략 | 게이트는 통과하지만(결정 5) upstream 최종 상태와 어긋나 이후 sync 충돌이 계속 쌓인다 |

**주의**: `server/public/model` 패키지 내부 호출은 수식자가 없으므로 규칙이 하나 더 필요하다 — `NewPointer(a) -> new(a)`.

---

## 결정 4 — golangci-lint v2.11.4를 그대로 쓴다 (버전 상승 불필요)

**결정**: FR-011의 답은 "지원한다"이다. 현재 버전으로 이행을 완료할 수 있다.

**근거 (실증)**: 핀을 1.26.2로 올린 상태에서 `make check-style`을 실행했다. golangci-lint v2.11.4가 **정상 기동해 Go 1.26 문법을 파싱하고 분석을 마쳤다**. 도구 자체의 비호환은 없다.

upstream이 `d4fc0ecb`에서 v2.12.2로 올린 것은 Go 1.26 호환 때문이 아니다. 그 커밋 메시지가 밝히듯 목적은 (1) 린터 기본값을 opt-in에서 opt-out으로 전환, (2) 신규 린터 지적 해소다. **별도 sync 항목**이며 이 이행의 선행 조건이 아니다.

---

## 결정 5 — 진짜 게이트는 린터 지적 58건이고, 전부 upstream diff가 해결한다

**결정**: 언어 버전을 올리면 `modernize` 계열 검사가 새로 활성화돼 `make check-style`이 **58건으로 실패**한다. 이것이 이 이행의 실질적 관문이다. 그리고 이 58건은 **upstream 커밋을 반영하는 것만으로 전부 사라진다**.

**근거 (실측)**: 핀 상승 상태에서 측정한 지적 분포.

| 유형 | 건수 | 내용 |
|---|---|---|
| `modernize / newexpr` | 45 | `bToP(x)`·유사 래퍼를 `new(x)`로 단순화하라 |
| `modernize / stditerators` | 5 | 표준 반복자 표기로 바꾸라 |
| `govet / printf` | 7 | 포맷 문자열·가변인자 불일치 |
| **합계** | **58** | |

파일별 분포와 upstream 커밋 포함 여부:

| 파일 | 건수 | upstream `e3fbf871` 포함 |
|---|---|---|
| `public/pluginapi/license_test.go` | 37 | ✅ (`bToP` 헬퍼 제거) |
| `public/model/product_notices.go` | 4 | ✅ |
| `channels/web/params_test.go` | 4 | ✅ |
| `public/pluginapi/experimental/panel/panel.go` | 4 | ✅ |
| `public/pluginapi/experimental/oauther/oauth2_complete.go` | 2 | ✅ |
| 나머지 6파일 (각 1건) | 6 | ✅ 전부 |

**11개 파일 전부가 upstream 커밋 범위 안에 있다.** 따라서 "최대한 upstream을 따라간다"는 방침이 여기서 그대로 효력을 낸다 — 우리가 독자적으로 고칠 지적이 하나도 없다.

**따름 정리**: `NewPointer` 호출은 몇 곳이 남든 린터 지적을 **내지 않는다**(제네릭이라 `newexpr` 분석기가 인식하지 못한다 — 결정 2와 같은 이유). 즉 결정 3의 변환은 **게이트 통과에 필수가 아니고**, 목적은 upstream 최종 상태와의 정합과 이후 sync 충돌 감소다.

---

## 결정 6 — 픽스처는 upstream 파일을 쓰지 않고 우리 툴체인으로 재생성한다

**결정**: JPEG 픽스처 23개는 upstream이 커밋한 이진 파일을 그대로 받되, **우리 환경에서 재검증**한다. 불일치하면 `-update-fixtures`로 재생성한다.

**근거**: 픽스처는 인코더 출력이므로 이론상 같은 Go 버전이면 동일해야 한다. 다만 지난 sync에서 확인했듯 툴체인이 1.25/1.26으로 갈리면 42/256 픽셀이 어긋난다. upstream 파일을 받은 뒤 우리 1.26.2에서 테스트가 통과하는지가 판정 기준이고, 이때 함께 들어오는 허용오차 비교(FR-008)가 패치 버전 차이를 흡수한다.

`e3fbf871`이 도입하는 갱신 수단(FR-009):

```go
var updateImagingFixtures = flag.Bool("update-fixtures", false, "overwrite imaging fixture files with actual output")
```

테스트가 `-update-fixtures`를 받으면 기대 파일을 실제 출력으로 덮어쓰고 반환한다. 절차는 `go test ./channels/app/imaging/ -update-fixtures`.

---

## 결정 7 — cherry-pick을 먼저, 자체 변환을 나중에

**결정**: 작업 순서를 이렇게 둔다.

1. 버전 핀 상승 (결정 1 — 선행 필수)
2. upstream `e3fbf871` cherry-pick + 충돌 7건 해소 (결정 5·8 — 게이트 해결)
3. 픽스처 검증·필요 시 재생성 (결정 6)
4. 잔여 `NewPointer` 실측·처리 (결정 3 — 예상 1곳, 게이트와 무관)
5. `check-go-fix` CI 잡 도입 (마지막 — 앞 단계가 끝나야 통과)

**근거**: 2번이 끝나면 게이트(SC-004)가 이미 통과하고, `NewPointer`도 4678 → 약 450줄(upstream이 남기는 잔여와 같은 수준)로 정리된다. 4번은 그 뒤 **실측으로 잔여를 확인하는 단계**이지 대량 작업이 아니다 — 현재 예상 대상은 `content_flagging_report_test.go` 1곳이다. 반대로 4번을 먼저 하면 대량 변환된 트리 위에서 cherry-pick 충돌을 풀어야 해 훨씬 어렵다.

**5번을 마지막에 두는 이유**: `check-go-fix`는 `go fix ./...` 후 diff가 없어야 통과한다. `reflect.Ptr` 등이 남아 있으면 실패하므로 2번 이후여야 한다.

---

## 결정 8 — 충돌 7건 처리 방침

**결정**: upstream diff를 최대한 그대로 받고, 우리 쪽 고유 내용만 보존한다.

**실물 확인 (2026-08-25)**: 시험 cherry-pick(`--no-commit` 후 abort)으로 충돌 7건의 내용을 직접 열어 원인을 확인했다. 결과는 두 갈래로 갈린다 — **제외한 `48f2fd08` 계보 5건**과 **okrbest 자체 커스터마이즈 2건**이다. 툴체인 관련 미반영 커밋 때문에 생긴 충돌은 **하나도 없다**.

| 파일 | 원인 | 처리 |
|---|---|---|
| `api4/properties_test.go` | 파일 자체 없음 (`48f2fd08` 계보) | **훅 폐기** |
| `model/view_test.go` | 파일 자체 없음 (동상) | **훅 폐기** |
| `api4/post_test.go` | upstream이 `TestUpdateCardPostByNonOwner`를 추가하는데 `FeatureFlags.IntegratedBoards` 의존 | **훅 폐기** — 우리에게 그 플래그가 없다 |
| `storetest/post_store.go` | upstream이 `testGetPostsSinceForSyncExcludedPostTypes`를 추가하는데 `model.PostTypeCard` 의존 | **훅 폐기** — 동상 |
| `model/property_field_test.go` | upstream이 `ObjectType` 검증 케이스 추가 | **훅 폐기** — 우리 `PropertyField`에 `ObjectType` 없음 |
| `app/channel_test.go` | **okrbest 자체 구조 차이** — 우리는 `DisplayName` 한 필드에 값을 넣고, upstream은 `DisplayName` + `DefaultCategoryName`으로 분리 | **우리 구조 보존**, 변환(`NewPointer`→`new`)만 수용 |
| `model/config.go` | **okrbest 자체 기본값 변경 2건** — `AdminNoticesEnabled` true→false(`c14c66a1b2`), `TeammateNameDisplay`→`ShowNicknameFullName`(`d832dacbc4`) | **우리 기본값 보존**, 변환만 수용 |

> **정정 이력**: 이 표의 초판은 `api4/post_test.go`·`app/channel_test.go` 충돌을 "2026-08-25 sync 커밋들로 줄이 밀렸을 뿐"이라고 적었다. 실물 확인 결과 틀렸다 — 전자는 제외 계보 의존이라 **폐기** 대상이고, 후자는 우리 자체 구조 차이라 **보존**이 필요하다. 해소 방법이 정반대이므로 바로잡는다.

**따름 정리 — 실질 충돌은 2건뿐이다.** 7건 중 5건은 우리 트리에 대상이 없어 훅을 버리면 끝난다. 사람의 판단이 필요한 것은 `app/channel_test.go`와 `model/config.go` 둘뿐이고, 둘 다 "okrbest 값을 지키면서 표기 변환만 받는다"는 같은 원칙으로 처리한다.

---

## 미해결 위험

1. **`model/config.go` 충돌** — okrbest 자체 설정 필드가 있는 유일한 실질 충돌이다. 변환(`NewPointer`→`new`)은 기계적이지만 우리 필드가 섞인 구역에서 잘못 해소하면 설정이 유실된다. 해소 후 `TestConfigDefaults` 계열로 검증해야 한다.
2. **cherry-pick 후 잔여 실측** — 2단계 후 실제로 몇 곳이 남는지는 충돌 해소 방식에 따라 달라진다. 예상은 1곳이지만, 4단계에서 `grep`으로 확인한 뒤 `gofmt -r`을 적용할지 판단한다. 적용한다면 `goimports`를 반드시 뒤따르고(결정 3), `git diff --stat`으로 예상 밖 파일이 바뀌지 않았는지 본다.
3. **보호 경로 3곳** — `.github/workflows/server-ci.yml`(CODEOWNERS), `enterprise/elasticsearch/common/templates.go`, `indexing_job_test.go`. 병합 시 code owner 리뷰가 필요할 수 있다.
4. **작업 기간의 병행 변경** — 거의 모든 Go 파일을 건드리므로, 이행 중 다른 Go 변경이 병합되면 대규모 충돌이 난다. 착수 전 열린 PR을 정리해야 한다.
