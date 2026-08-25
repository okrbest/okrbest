# Phase 1 설계: 변경 대상 목록

**작성일**: 2026-08-25 | **명세**: [spec.md](./spec.md) | **조사**: [research.md](./research.md)

이 작업에는 런타임 데이터 모델이 없다. 대신 이행이 다루는 **정적 대상**을 목록화한다. 수치는 2026-08-25 master(`60c2f5a50e`) 실측이다.

---

## 1. 버전 핀 (5)

저장소가 목표하는 Go 버전을 선언하는 파일. CI가 `.go-version`을 읽어 빌드 이미지를 고르고, `go.mod`의 `go` 지시자가 **언어 버전**을 정한다.

| 파일 | 현재 | 목표 |
|---|---|---|
| `server/.go-version` | `1.25.9` | `1.26.2` |
| `server/go.mod` | `go 1.25.9` | `go 1.26.2` |
| `server/public/go.mod` | `go 1.25.9` | `go 1.26.2` |
| `tools/mattermost-govet/go.mod` | `go 1.25.9` | `go 1.26.2` |
| `tools/sharedchannel-test/go.mod` | `go 1.25.9` | `go 1.26.2` |

**불변식**: 다섯 값이 항상 일치한다. 하나라도 어긋나면 로컬과 CI가 다른 컴파일러로 검증한다.

**범위 밖**: `server/go.work`는 gitignore된 개발자 로컬 파일이다(`server/.gitignore:26`). 산출물이 아니지만, 이 머신에서는 이미 `go 1.26.2`를 요구하고 있어 이행 후 저장소 목표와 일치하게 된다.

---

## 2. 변환 대상 (4738 + α)

| 대상 | 건수 | 변환 | 수단 | 게이트 영향 |
|---|---|---|---|---|
| `NewPointer(x)` 호출 | 4678 | `new(x)` | **upstream diff** (잔여 1곳만 `gofmt -r`) | **없음** — 제네릭이라 린터가 인식 못 함 |
| `bToP(x)` | 37 | `new(x)`, 헬퍼 제거 | upstream diff | **있음** — `newexpr` 37건 |
| `boolPtr(x)` | 4 | `new(x)`, 헬퍼 제거 | upstream diff | 있음 |
| `reflect.Ptr` | 19 | `reflect.Pointer` | `go fix` (실증됨) | 없음 |
| 구조체 필드·메서드 순회 | ~6 | `Fields()`/`Methods()` 레인지 | upstream diff | `stditerators` 5건 |

**변환 방향**: `NewPointer(x)` **→** `new(x)`. Go 1.26이 내장 `new()`에 값 표현식을 허용하면서 헬퍼가 불필요해졌다. `NewPointer` 함수는 삭제되지 않으므로 미변환분도 컴파일된다 — 표기 정합 목적이다.

**범위 실측 (파일 단위 전수 대조)**:

| 측정 | 결과 |
|---|---|
| 우리 4678 vs upstream 부모 4915 | upstream 쪽이 **더 많다** |
| 우리에게만 더 있는 줄 | **0** |
| 212개 파일 중 upstream 커밋 범위 밖 | **1개** (`channels/api4/content_flagging_report_test.go`, 1곳) |
| okrbest 고유 Go 파일 18개의 사용 | **0건** — 알림 히스토리·조직 역할·직위 전부 미사용 |
| cherry-pick 후 예상 잔존 | 약 450줄 (upstream과 같은 수준) |

**의존**: 모든 변환은 버전 핀 상승 이후에만 가능하다 (research 결정 1).

---

## 3. 이미지 픽스처 (23)

`server/tests/`에 체크인된 이진 기대값. Go 1.26의 새 `image/jpeg` 인코더가 출력 바이트를 바꾼다.

| 묶음 | 개수 | 파일 |
|---|---|---|
| 방향 보정 미리보기 | 9 | `orientation_test_{1..9}_expected_preview.jpeg` |
| 방향 보정 썸네일 | 9 | `orientation_test_{1..9}_expected_thumb.jpeg` |
| TIFF | 2 | `test_expected_tiff_{preview,thumb}.jpeg` |
| GIF | 2 | `testgif_expected_{preview,thumbnail}.jpg` |
| 미니 미리보기 | 1 | `mini_preview_test_qa_data_graph_16x16_q90.jpg` |

**비교 방식 전환**: 바이트 동일성 → 허용오차 픽셀 비교. 툴체인 패치 버전 상승에 따른 미세 차이를 테스트가 흡수한다.

**알려진 증상**: 현재 이 머신에서 `TestGenerateMiniPreviewImage`가 42/256 픽셀(16.4%) 불일치로 실패한다. 이행이 이를 해소한다.

---

## 4. 충돌 지점 (7)

upstream `e3fbf871` cherry-pick 시 발생. 처리 방침은 [research.md 결정 8](./research.md) 참조.

실물 확인 결과 두 갈래다 — **제외한 `48f2fd08` 계보 5건**(훅 폐기)과 **okrbest 자체 커스터마이즈 2건**(우리 값 보존). 툴체인 미반영으로 인한 충돌은 없다.

| 파일 | 원인 | 처리 |
|---|---|---|
| `api4/properties_test.go` | 파일 없음 | 훅 폐기 |
| `model/view_test.go` | 파일 없음 | 훅 폐기 |
| `api4/post_test.go` | `FeatureFlags.IntegratedBoards` 의존 | 훅 폐기 |
| `storetest/post_store.go` | `model.PostTypeCard` 의존 | 훅 폐기 |
| `model/property_field_test.go` | `ObjectType` 의존 | 훅 폐기 |
| `app/channel_test.go` | **자체 구조** — `DisplayName` 단일 필드 (upstream은 `DefaultCategoryName` 분리) | 우리 구조 보존 |
| `model/config.go` | **자체 기본값** — `AdminNoticesEnabled`, `TeammateNameDisplay` | 우리 값 보존 |

---

## 5. 문서 (1)

| 파일 | 현재 | 문제 |
|---|---|---|
| `.specify/memory/constitution.md` | Go **1.24.6** (2곳: 원칙 I, 기술 스택 절) | 실제(1.25.9)와 **이미 어긋나 있다**. 1.26.2로 갱신 |
