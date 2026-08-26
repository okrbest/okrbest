---
description: "Task list for Go 1.26.2 툴체인 이행"
---

# Tasks: Go 1.26.2 툴체인 이행

**입력**: `/specs/010-go-1-26-upgrade/` 설계 문서

**선행**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/developer-surface.md), [quickstart.md](./quickstart.md)

**테스트**: 신규 테스트 과제 없음. 이 이행은 동작을 바꾸지 않는다. 대신 **이미 실패 중인 테스트**(`TestGenerateMiniPreviewImage`, 42/256 픽셀 불일치)가 통과로 바뀌는 것이 증거다 — 헌법 원칙 III의 "실패를 본 테스트" 요건을 이 방식으로 충족한다.

**방침**: 사용자 지시 — **"최대한 upstream과 동일하게"**. 아래 모든 과제가 이를 우선한다.

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 가능 (다른 파일, 미완료 과제에 의존하지 않음)
- **[Story]**: 대응 사용자 스토리 (US1/US2/US3)

---

## 이 이행의 구조적 특성 — 먼저 읽을 것

upstream `e3fbf871`은 버전 핀·표기 변환·픽스처·CI 잡을 **하나의 원자적 커밋**으로 수행했다. "최대한 upstream과 동일하게" 진행하므로 우리도 쪼개지 않는다. 그 결과:

- **Phase 2가 세 스토리의 코드를 한꺼번에 들여온다.** 스토리별로 나눠 구현할 수 없다 — 나누면 중간 상태가 컴파일되지 않거나 upstream diff를 인위적으로 찢어야 한다.
- **Phase 3~5는 각 스토리의 인수 기준을 독립적으로 검증한다.** 스토리의 독립성은 "따로 구현"이 아니라 "따로 판정"으로 성립한다.
- Phase 5만 예외적으로 실제 코드 작업이 남는다 — upstream 커밋이 덮지 못한 잔여 2곳과 CI 잡 검증.

---

## Phase 1: Setup (착수 전 상태 고정)

**목적**: 기준선 확보와 선행 조건 확인. 헌법 원칙 I이 요구하는 **실패 목록 diff 판정**의 기준을 여기서 만든다.

- [X] T001 작업 트리 클린 확인 후 `010-go-1-26-upgrade` 브랜치에서 작업 중인지 확인 — `git status --short`가 비어 있고 `git branch --show-current`가 해당 브랜치일 것 — 트리 클린, 브랜치 `010-go-1-26-upgrade` 확인
- [X] T002 [P] 툴체인 가용성 확인 — `go version`이 `go1.26.2` 이상일 것. 아니면 설치 후 진행 — `go version go1.26.2 darwin/arm64` 확인
- [X] T003 [P] 병행 변경 정리 확인 — `gh pr list --repo okrbest/okrbest --state open`으로 Go 파일을 건드리는 열린 PR이 없는지 본다. 있으면 병합·정리 후 착수 (거의 모든 Go 파일을 건드리므로 충돌 비용이 크다) — 열린 PR은 #322 하나이며 Go 파일 **0개** 접촉. 병행 위험 없음
- [X] T004 테스트 기준선 저장 — `cd server && go test ./... -count=1 2>&1 | grep -E '^(ok|FAIL|---)' | sort -u > /tmp/baseline_tests.txt`. 이 파일이 T028의 판정 기준이다 — `/tmp/baseline_tests.txt` 183줄 확보 (ok 46 / FAIL 12 / no-test 82). **`TestGenerateMiniPreviewImage`가 기준선 실패에 포함** — 원칙 III의 구현 전 실패 출력
- [X] T005 [P] 린트 기준선 저장 — `cd server && make check-style > /tmp/baseline_style.txt 2>&1`. 착수 전 `0 issues.`임을 확인 — `0 issues.` (`/tmp/baseline_style.txt`)
- [X] T006 [P] 변환 대상 실측 기록 — `cd server && grep -rc 'NewPointer(' --include='*.go' . | awk -F: '{s+=$2} END{print s}'` 등으로 `NewPointer` 4678, `bToP` 37, `boolPtr` 4, `reflect.Ptr` 19를 기록해 둔다. Phase 5의 잔여 판정에 쓴다 — NewPointer **4678** / bToP **37** / boolPtr **4** / reflect.Ptr **19** / .go-version **1.25.9**

**Checkpoint**: 기준선 3종(테스트·린트·수치) 확보. 이게 없으면 회귀를 판정할 수 없다.

---

## Phase 2: Foundational (upstream 커밋 반영 — 모든 스토리의 전제)

**목적**: upstream `e3fbf871`을 원자적으로 반영한다. 버전 핀, 표기 변환, 픽스처, CI 잡이 **함께** 들어온다.

**⚠️ 차단**: 이 단계가 끝나기 전에는 어떤 스토리도 검증할 수 없다.

**충돌 처리 원칙** ([research.md 결정 8](./research.md)): 제외한 `48f2fd08` 계보 의존 5건은 **훅 폐기**, okrbest 자체 커스터마이즈 2건은 **우리 값 보존 + 표기 변환만 수용**.

- [X] T007 cherry-pick 착수 — `git cherry-pick -x e3fbf8711f73ac1266ebc943f88999175c2594ef`. 충돌 7건이 예상대로 나오는지 `git diff --name-only --diff-filter=U`로 확인 — 충돌 7건이 예상과 정확히 일치
- [X] T008 [P] 충돌 해소 — `server/channels/api4/properties_test.go` 훅 폐기 (`git checkout --ours`). 우리 트리에 파일 자체가 없다 — `DU`(deleted by us) 충돌 → `git rm`으로 삭제 유지
- [X] T009 [P] 충돌 해소 — `server/public/model/view_test.go` 훅 폐기. 동일 사유 — `DU` 충돌 → `git rm`으로 삭제 유지
- [X] T010 [P] 충돌 해소 — `server/channels/api4/post_test.go` 훅 폐기. upstream이 추가하는 `TestUpdateCardPostByNonOwner`가 `FeatureFlags.IntegratedBoards`에 의존하는데 우리에겐 그 플래그가 없다 — 훅 폐기. **주의** — `checkout --ours`가 표기 변환까지 버려 `25a1199c9b`에서 복원
- [X] T011 [P] 충돌 해소 — `server/channels/store/storetest/post_store.go` 훅 폐기. `testGetPostsSinceForSyncExcludedPostTypes`가 `model.PostTypeCard`에 의존 — 훅 폐기. 동일하게 `25a1199c9b`에서 변환 복원
- [X] T012 [P] 충돌 해소 — `server/public/model/property_field_test.go` 훅 폐기. upstream이 추가하는 검증 케이스가 `ObjectType`에 의존 — 훅 폐기. 동일하게 `25a1199c9b`에서 변환 복원
- [X] T013 충돌 해소 — `server/public/model/config.go`. **okrbest 기본값 2건을 반드시 보존**: `AdminNoticesEnabled`는 `false`(우리 커밋 `c14c66a1b2`), `TeammateNameDisplay`는 `ShowNicknameFullName`(우리 커밋 `d832dacbc4`). upstream 값(`true` / `ShowUsername`)으로 되돌리지 않는다. 표기만 `NewPointer(x)` → `new(x)`로 수용 — `AdminNoticesEnabled = new(false)`, `TeammateNameDisplay = new(ShowNicknameFullName)` 보존. `EnableChannelCategorySorting` 훅은 제외한 `69fbaece` 소산(우리 0건)이라 폐기
- [X] T014 충돌 해소 — `server/channels/app/channel_test.go`. **okrbest 구조 보존**: 우리는 `DisplayName` 한 필드에 값을 넣고 upstream은 `DisplayName` + `DefaultCategoryName`으로 분리한다. 우리 구조를 유지하고 표기 변환만 수용 — `ChannelPatch`에 `DefaultCategoryName` 없음 확인 → 슬래시 파싱 구조 유지 + `new()` 표기 수용
- [X] T015 빌드 확인 후 커밋 — `cd server && go build ./...`가 통과하면 `git add -A && git cherry-pick --continue`. 커밋 본문에 okrbest 맞춤 수정 요지와 `Upstream: https://github.com/mattermost/mattermost/commit/e3fbf8711f73ac1266ebc943f88999175c2594ef`를 넣는다 (SC-007의 자동 차감 조건) — `go build ./...` EXIT=0 → 커밋 `51f7817e20` (258파일)

**Checkpoint**: 버전 핀 5개가 1.26.2, 서버 전체 빌드 통과. 세 스토리의 코드가 트리에 들어왔다.

---

## Phase 3: User Story 1 — 개발자가 upstream 커밋을 계속 반영할 수 있다 (P1) 🎯 MVP

**목표**: 저장소가 Go 1.26.2를 목표로 하고, Go 1.26 문법을 쓰는 코드가 빌드된다.

**독립 테스트**: 버전 핀이 1.26.2이고 `go build ./...`가 통과하면 이 스토리는 그것만으로 가치를 낸다 — 이후 upstream 커밋이 `new(x)` 문법을 써도 막히지 않는다.

- [X] T016 [US1] 버전 핀 5개 일치 확인 — `cat server/.go-version`과 `grep '^go ' server/go.mod server/public/go.mod tools/mattermost-govet/go.mod tools/sharedchannel-test/go.mod`가 모두 `1.26.2`. 이어서 `git grep -n '1\.25\.9' -- server tools`가 **출력 없음**일 것 (quickstart 1절) — 5개 핀 모두 `1.26.2`, `1.25.9` 잔존 **0건**
- [X] T017 [US1] 빌드 검증 — `cd server && go build ./...` 오류 0건 (quickstart 2절, SC-001) — `go build ./...` EXIT=0
- [X] T018 [US1] Go 1.26 문법 수용 확인 — 임시 파일에 `x := new("test")` 형태를 작성해 `go build`가 통과함을 보이고 파일을 삭제한다. 언어 버전이 실제로 올라갔음을 직접 확인하는 과제다 — `new("go1.26 initializer form")` 테스트 통과 후 임시 파일 삭제
- [X] T019 [US1] 품질 게이트 — `cd server && make check-style`이 **`0 issues.`**. 핀만 올린 중간 상태에서는 58건(modernize 51 + govet 7)이 나오므로, upstream diff가 그것을 해소했는지 판정하는 과제다 ([research.md 결정 5](./research.md)) — **`0 issues.`** — 중간 상태의 58건을 upstream diff가 전부 해소(조사 결정 5 확인)

**Checkpoint**: US1 독립 완결. 이 시점에서 멈춰도 툴체인 상승의 핵심 가치는 확보된다.

---

## Phase 4: User Story 2 — 이미지 픽스처가 툴체인 변경에 흔들리지 않는다 (P2)

**목표**: 픽스처 23개가 새 인코더 출력과 맞고, 허용오차 비교가 향후 드리프트를 흡수하며, 개발자가 정해진 절차로 픽스처를 갱신할 수 있다.

**독립 테스트**: 이미지 패키지 테스트가 전부 통과하고, 픽스처를 일부러 훼손했다가 갱신 절차로 복구할 수 있으면 통과.

- [X] T020 [US2] 이미지 패키지 테스트 — `cd server && go test ./channels/app/imaging/... -count=1`이 `ok`. 실패하면 T021로 (quickstart 4절) — `ok ...channels/app/imaging 0.715s`
- [X] T021 [US2] 픽스처 불일치 시 재생성 — `cd server && go test ./channels/app/imaging/ -update-fixtures -count=1` 후 플래그 없이 재실행해 통과 확인. 갱신된 `server/tests/*.jpg|jpeg`를 **반드시 커밋**한다 ([contracts/developer-surface.md 계약 1](./contracts/developer-surface.md)). T020이 이미 통과하면 이 과제는 `불필요`로 적는다 — **불필요** — T020이 통과. upstream 픽스처가 우리 툴체인 출력과 일치
- [X] T022 [US2] 회귀 해소 확인 — `cd server && go test ./channels/app/imaging/ -run TestGenerateMiniPreviewImage -count=1 -v`가 **PASS**. 착수 전 이 머신에서 `42 / 256 pixels differ (16.41%); first at (3, 8)`로 실패하던 테스트다 (SC-003, 헌법 원칙 III의 증거) — 기준선 `--- FAIL` → 현재 `--- PASS`. 원칙 III의 RED→GREEN 증거
- [X] T023 [US2] 갱신 절차 실주행 — quickstart 5절 그대로: 픽스처 하나를 훼손 → 실패 확인 → `-update-fixtures` → 통과 확인 → `git diff`가 비어 있음(원래 내용 복원) 확인 (SC-006) — 훼손→**FAIL**→`-update-fixtures`→**ok**→커밋본과 완전 동일 복원. **문서 결함 발견** — 바이트 덧붙이기 훼손은 무효(JPEG가 EOI 뒤를 무시)라 quickstart 5절 정정

**Checkpoint**: US1 + US2 각각 독립 검증 완료.

---

## Phase 5: User Story 3 — 포인터·현대화 표기가 트리 전체에서 일관된다 (P3)

**목표**: `go fix`가 더 고칠 것이 없고, 옛 표기가 남지 않으며, CI가 그 일관성을 자동으로 지킨다.

**독립 테스트**: `go fix ./...` 후 변경 파일이 0개이고, 위반을 일부러 주입하면 검사가 잡아내면 통과.

> **여기서 실제 코드 작업이 남는다.** upstream 커밋이 덮지 못한 잔여가 실측으로 확인됐다 — `server/public/model/utils_test.go:1090`의 `reflect.Ptr`(upstream은 이 파일을 이 커밋에서 고치지 않았고, 나중 커밋에서 고쳤다)와 `server/channels/api4/content_flagging_report_test.go`의 `NewPointer` 1곳. 이 둘을 처리하지 않으면 `check-go-fix` CI 잡이 **실패한다**.

- [X] T024 [US3] `go fix` 잔여 처리 — `cd server && go fix ./...` 실행 후 `git status --porcelain`으로 변경 확인. 최소 `public/model/utils_test.go`의 `reflect.Ptr` → `reflect.Pointer`가 잡힐 것. 변경분을 검토 후 커밋 — `go fix ./public/...`로 `reflect.Ptr`→`reflect.Pointer` 5곳 → 커밋 `c18e01d4c3`. **발견** — `server/public`은 별도 모듈이라 `./...`에 안 잡힌다
- [X] T025 [US3] `NewPointer` 잔여 실측 — `cd server && grep -rn 'NewPointer(' --include='*.go' . | wc -l`로 현재 값을 재고 upstream 수준(약 450줄)인지 확인한다. 범위 밖으로 확인된 `channels/api4/content_flagging_report_test.go` 1곳을 `gofmt -r 'model.NewPointer(a) -> new(a)' -w` 로 처리하고, **반드시 `goimports`를 뒤따라** 미사용 임포트를 정리한다 ([research.md 결정 3](./research.md) — 실증된 부작용) — 잔여 실측 310 → 원인 규명 후 3파일 복원(`25a1199c9b`) + 범위 밖 1곳 변환(`76ef0e61d5`) → **246**
- [X] T026 [US3] 옛 표기 소거 확인 — `cd server`에서 `grep -rn 'bToP(\|boolPtr(' --include='*.go' . | wc -l`과 `grep -rn 'reflect\.Ptr\b' --include='*.go' . | wc -l`이 모두 **0**. 착수 전에는 41 / 19였다 (quickstart 3절, SC-002) — bToP 37→**0**, boolPtr 4→**0**, reflect.Ptr 19→**0**, NewPointer 4678→**246**. `go fix` 두 모듈 모두 변경 **0개**
- [X] T027 [US3] CI 검사 작동 확인 — quickstart 7절 그대로: `sed`로 `reflect.Pointer`를 `reflect.Ptr`로 되돌려 위반을 주입하고 `go fix` 후 `git status --porcelain`에 변경이 뜨는지 본다(CI라면 exit 1). 확인 후 `git checkout`으로 원복 (SC-005) — 위반 **커밋** 후 재현 → `git status`에 변경 발생 = CI exit 1 확인. **문서 결함 발견** — 작업 트리에만 주입하면 무효라 quickstart 7절 정정(+ public 모듈 사각지대 명시)

**Checkpoint**: 세 스토리 모두 독립 검증 완료. `go fix ./...` 후 변경 0개.

---

## Phase 6: Polish & 마감

**목적**: 문서 정합과 추적성. 코드 변경은 없다.

- [X] T028 [P] 규범 문서 갱신 — `.specify/memory/constitution.md`의 Go 버전 표기 2곳(원칙 I, 기술 스택 절)을 **1.24.6 → 1.26.2**로 고친다. 현재 값은 실제(1.25.9)와도 이미 어긋나 있었다 (FR-012, quickstart 8절) — `Go 1.24.6` → `Go 1.26.2` 2곳(원칙 I 37줄, 기술 스택 173줄)
- [X] T029 [P] 에이전트 컨텍스트 확인 — `CLAUDE.md`·`AGENTS.md`·`.cursor/rules/specify-rules.mdc`의 plan 참조가 `specs/010-go-1-26-upgrade/plan.md`인지 확인 (이미 갱신돼 있으면 `불필요`로 적는다) — **불필요** — 3파일 모두 이미 `specs/010-go-1-26-upgrade/plan.md` 참조
- [X] T030 미반영 목록 차감 확인 — `.specify/scripts/bash/upstream-sync.sh update` 후 `status`로 남은 커밋이 **1 줄어들고** `e3fbf871`이 목록에서 사라졌는지 확인. 안 줄면 커밋 본문의 `Upstream:` 참조를 점검한다 (SC-007, quickstart 9절) — 본문 미반영 표 0건, spec 부록 기록 1건, 커밋 본문 `Upstream:` 참조 1건. **남은 커밋 수는 감소하지 않음** — spec 전환 시점에 이미 차감됨(아래 SC-007 참조)

### 완료 검증 (고정 — 지우지 않는다)

증거를 남기는 과제다. 셋 다 없으면 게이트를 통과해도 결함이 남는다.

- [X] T031 품질 게이트 — `cd server && make check-style`(`0 issues.`)와 `go test ./... -count=1`을 돌리고, 실패 목록을 T004의 `/tmp/baseline_tests.txt`와 **`diff`로 비교해 보인다**. 신규 `FAIL` 0건. 개수 비교로 대신하지 않는다 (SC-004) — 린트 `0 issues.`, **신규 FAIL 0건**(duration 정규화 후 diff), 패키지 수준 차이는 `channels/app/imaging` 해소 하나뿐
- [X] T032 종단 검증 — [quickstart.md](./quickstart.md) 9개 절을 **실제로 훑고** 절별 통과·실패를 기록한다. 환경이 없어 못 돌린 절은 `미실행`으로 적는다 — quickstart 9개 절 전부 실주행. 8절 통과 / 9절 부분(SC-007 기준 미성립). 5절·7절은 절차 자체를 정정한 뒤 재검증
- [X] T033 SC 검증 — spec.md의 SC-001~SC-007 각각을 **실측값**으로 확인해 표로 남긴다. 추정 금지 — SC-001~SC-006 **전부 실측 통과**. SC-007은 기준 자체가 성립하지 않아 ⚠️ (추적성 실질 요건은 충족)

---

## 의존성과 실행 순서

### Phase 의존

- **Phase 1 (Setup)**: 의존 없음. 즉시 착수
- **Phase 2 (Foundational)**: Phase 1 완료 후. **모든 스토리를 차단**
- **Phase 3~5 (스토리)**: Phase 2 완료 후. 서로 독립적으로 **검증** 가능
- **Phase 6 (Polish)**: Phase 3~5 완료 후

### 스토리 의존

- **US1 (P1)**: Phase 2 직후 검증 가능. 다른 스토리에 의존하지 않음
- **US2 (P2)**: Phase 2 직후 검증 가능. US1과 독립 — 픽스처는 빌드와 무관
- **US3 (P3)**: Phase 2 직후 착수 가능하나, **T019(US1 게이트) 이후에 하는 편이 낫다**. T024의 `go fix`가 트리를 건드리므로 게이트 판정이 흐려지지 않게 순서를 둔다

### 순서를 강제하는 근거

| 제약 | 근거 |
|---|---|
| 버전 핀이 표기 변환보다 먼저 | `new(x)`가 언어 버전 1.26 이상 요구 — 실증: `new(t) requires go1.26 or later (-lang was set to go1.25)` |
| `gofmt -r` 직후 `goimports` 필수 | 호출을 전부 없앤 파일에서 `model` 임포트가 미사용으로 남아 빌드 실패 — 실증 |
| `check-go-fix` 확인이 마지막 | `go fix` 잔여물이 없어야 통과. T024·T025 이후여야 한다 |

### 병렬 기회

- **Phase 1**: T002·T003·T005·T006 병렬 가능 (T001 이후, T004는 시간이 오래 걸리므로 먼저 걸어둔다)
- **Phase 2**: T008~T012 병렬 가능 — 서로 다른 파일의 훅 폐기라 독립적. T013·T014는 판단이 필요하므로 순차 권장
- **Phase 3~5**: 서로 다른 스토리의 검증이라 병렬 가능. 단 T024가 트리를 바꾸므로 T019와 겹치지 않게 한다
- **Phase 6**: T028·T029 병렬 가능

---

## 구현 전략

### MVP 범위

**Phase 1 + Phase 2 + Phase 3 (US1)** 까지가 최소 가치 단위다. 여기까지면 툴체인이 올라가고 빌드·게이트가 통과해, 이후 upstream 커밋 반영이 막히지 않는다. US2·US3는 품질과 일관성을 더한다.

다만 **Phase 5(US3)를 빼고 병합하면 `check-go-fix` CI 잡이 실패한다** — 그 잡이 Phase 2에서 함께 들어오기 때문이다. 부분 병합을 원한다면 CI 잡만 별도 커밋으로 분리해 마지막에 넣어야 한다.

### 증분 전달

1. **T001~T006** → 기준선 확보. 되돌릴 것 없음
2. **T007~T015** → upstream 커밋 반영 (커밋 1개). 문제 시 `git revert`
3. **T016~T019** → US1 검증. 실패하면 T013·T014 충돌 해소를 재검토
4. **T020~T023** → US2 검증·필요 시 픽스처 커밋
5. **T024~T027** → US3 잔여 처리 (커밋 1~2개)
6. **T028~T033** → 문서·검증 마감

### 커밋 구성 (예상)

| 커밋 | 내용 | 규모 |
|---|---|---|
| 1 | upstream `e3fbf871` 반영 (adapted) | 약 255파일 |
| 2 | `go fix` 잔여 (`utils_test.go`) | 1파일 |
| 3 | `NewPointer` 잔여 (`content_flagging_report_test.go`) | 1파일 |
| 4 | 픽스처 재생성 (필요 시) | 최대 23파일 |
| 5 | constitution 갱신 | 1파일 |

### 위험 신호

- **T013·T014에서 우리 기본값이 upstream 값으로 되돌아가면** — SC-004의 `TestConfig` 검증에서 잡힌다. quickstart 6절이 `AdminNoticesEnabled`·`TeammateNameDisplay`를 지목 확인한다
- **T025의 잔여가 예상(1곳)보다 많으면** — 충돌 해소가 upstream 변환을 일부 버렸을 가능성이 있다. T013·T014 해소 내용을 재검토한다
- ~~보호 경로 3곳 접촉~~ → **해소**. 2026-08-26 실측 결과 CODEOWNERS 보호 경로 **무접촉**이다. `server-ci.yml`·`server/enterprise/`는 보호 목록에 없다(보호 대상은 `channels-ci.yml`·webapp 패키지 파일·`db/migrations`·`app/authentication.go`·`app/authorization.go`)

---

## 완료 검증 결과 (2026-08-26 실측)

### T031 품질 게이트 — 기준선 대비 diff

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| 린트 | `cd server && make check-style` | **`0 issues.`** | 착수 전 기준선도 `0 issues.` (`/tmp/baseline_style.txt`) |
| 테스트 | `go test ./... -count=1` 후 기준선 diff | **신규 FAIL 0건** | duration 정규화 후 `comm -13` 결과 비어 있음 |
| 패키지 수준 차이 | FAIL 패키지 목록 diff | **`channels/app/imaging` 하나 사라짐** | 그 외 차이 없음 |

**판정 주의**: 두 실행 모두 `channels/api4`·`channels/app` 2개 패키지가 **10분 테스트 타임아웃**에 걸린다(`panic: test timed out after 10m0s`, 기준선·현재 동일). 그래서 두 패키지의 개별 테스트 목록은 잘려 비교가 불완전하다. duration을 지우지 않고 비교하면 같은 테스트가 다른 줄로 잡혀 diff가 192줄로 부풀었다 — 정규화가 필요하다.

타임아웃 절단 때문에 diff에 "해소된 것처럼" 보였던 `TestAutocompleteChannels`·`ForSearch`·`ForSearchGuestUsers` 3건은 **실제로는 여전히 실패한다**(지목 재실행으로 확인). 기준선과 같은 상태이며 이 이행과 무관하다.

### T032 종단 검증 — quickstart 9개 절

| 절 | 대응 | 결과 | 실측값 |
|---|---|---|---|
| 1. 버전 핀 | SC-001 선행 | **통과** | 5개 핀 모두 `1.26.2`, `1.25.9` 잔존 0건 |
| 2. 빌드 | SC-001 | **통과** | `go build ./...` EXIT=0 |
| 3. 표기 일관성 | SC-002 | **통과** | bToP 0 / boolPtr 0 / reflect.Ptr 0, `go fix` 두 모듈 변경 0개 |
| 4. 이미지 테스트 | SC-003 | **통과** | `ok ...channels/app/imaging 0.763s` |
| 5. 픽스처 갱신 절차 | SC-006 | **통과** | 훼손→FAIL→`-update-fixtures`→ok→커밋본과 완전 동일 복원 |
| 6. 품질 게이트 | SC-004 | **통과** | `0 issues.` + 신규 FAIL 0건 + okrbest 기본값 2건 보존 확인 |
| 7. CI 검사 작동 | SC-005 | **통과** | 위반 커밋 후 `go fix` → `git status`에 변경 발생 = CI exit 1 |
| 8. 문서 | FR-012 | **통과** | constitution `Go 1.26.2` 2곳, `Go 1.24.6` 0곳 |
| 9. 추적성 | SC-007 | **부분** | 아래 SC-007 항목 참조 |

**5절·7절은 문서의 절차 자체가 무효였다** — 실주행에서 드러나 quickstart를 정정했다(커밋 `567951670a`). 정정된 절차로 재검증해 통과를 확인했다.

### T033 SC 실측

| SC | 기준 | 실측값 | 판정 |
|---|---|---|---|
| SC-001 | 빌드 오류 0건 | `go build ./...` EXIT=**0** | ✅ |
| SC-002 | 옛 표기 0건, `go fix` 변경 0개 | bToP **0**(←37), boolPtr **0**(←4), reflect.Ptr **0**(←19), `go fix` 변경 **0개** | ✅ |
| SC-003 | 이미지 테스트 통과 | `ok 0.763s`. `TestGenerateMiniPreviewImage` 기준선 `--- FAIL` → 현재 **`--- PASS`** | ✅ |
| SC-004 | 린트 0건 + 신규 FAIL 0건 | `0 issues.` / 신규 FAIL **0건** | ✅ |
| SC-005 | 위반 주입 시 검사 실패 | 위반 커밋 후 `git status`에 변경 발생 → CI exit 1 | ✅ |
| SC-006 | 갱신 절차 1회 실행 | 훼손→FAIL→갱신→ok→`git status` 비어 있음 | ✅ |
| SC-007 | 남은 커밋 **1 감소** | 감소 **없음**. 아래 사유 | ⚠️ **기준 자체가 성립하지 않음** |

**SC-007 판정 사유**: 이 기준은 "이행 완료 시 목록에서 차감돼 남은 커밋이 1 줄어든다"였으나, `e3fbf871`은 **spec 전환 시점에 이미 차감됐다**(670→669). 그래서 구현 완료로 추가 감소가 일어날 수 없다. 명세를 쓸 때 놓친 점이다.

추적성이라는 **실질 요건은 충족된다**:

- 본문 미반영 표에 `e3fbf871` **0건**
- spec 전환 부록에 기록 **1건** (전환 사실의 정본)
- 커밋 `51f7817e20` 본문에 `Upstream: https://github.com/mattermost/mattermost/commit/e3fbf871...` **1건**

측정 중 `SYNC_BASE_BRANCH=HEAD update`가 663→666으로 **늘었는데**, 이는 2026-08-25에 upstream에 새 커밋 3건이 들어온 것으로 우리 작업과 무관하다. PR 범위를 흐리지 않게 그 갱신은 되돌렸다.

### 구현 중 발견해 고친 것

| 발견 | 조치 | 커밋 |
|---|---|---|
| `git checkout --ours`가 계보 훅만이 아니라 **해당 파일의 upstream 변경 전체**를 버림 (3파일, NewPointer 65곳) | 원인 규명 후 `gofmt -r`로 복원. upstream이 남긴 2줄은 원형 유지해 upstream 상태와 일치 | `25a1199c9b` |
| `server/public`이 별도 모듈이라 `go fix ./...`에 안 잡힘 → `reflect.Ptr` 5곳 잔존 | `go fix ./public/...` 추가 실행. **CI 잡(upstream 원문)도 같은 사각지대**를 가짐을 quickstart에 명시 | `c18e01d4c3` |
| quickstart 5절 훼손 방법 무효 (JPEG가 EOI 뒤 바이트 무시) | 픽셀이 실제로 달라지는 훼손으로 교체 | `567951670a` |
| quickstart 7절 무효 (작업 트리 주입 시 `go fix`가 되돌려 `git status`가 빔) | 위반을 커밋한 뒤 재현하도록 정정 + `git reset --hard` 경고 추가 | `567951670a` |
