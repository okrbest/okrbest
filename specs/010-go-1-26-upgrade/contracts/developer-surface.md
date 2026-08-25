# 계약: 개발자·CI 표면

**작성일**: 2026-08-25 | **명세**: [spec.md](../spec.md)

이 이행은 외부 API를 만들지 않는다. 다만 개발자와 CI가 직접 쓰는 표면이 둘 생긴다. 그 계약을 여기 고정한다. 둘 다 upstream `e3fbf871`의 정의를 그대로 따른다.

---

## 계약 1 — 픽스처 갱신 플래그 `-update-fixtures`

**소유**: `server/channels/app/imaging` 테스트 패키지

**정의** (upstream 원문):

```go
var updateImagingFixtures = flag.Bool("update-fixtures", false, "overwrite imaging fixture files with actual output")
```

**동작**:

| 입력 | 결과 |
|---|---|
| 플래그 없음 (기본) | 기대 픽스처와 실제 출력을 **허용오차 픽셀 비교**. 불일치하면 실패하며 어긋난 픽셀 수·비율·첫 지점을 보고 |
| `-update-fixtures` | 실제 출력을 기대 파일에 **덮어쓰고** 비교 없이 반환 |

**호출 방법**:

```bash
cd server && go test ./channels/app/imaging/ -update-fixtures
```

**계약 조건**:

- 덮어쓰기는 `server/tests/`의 해당 픽스처 파일만 건드린다 (권한 `0600`).
- 갱신 후에는 플래그 없이 다시 돌려 통과를 확인해야 한다. 갱신과 검증을 한 번에 하지 않는다.
- 갱신된 픽스처는 **반드시 커밋한다**. 커밋하지 않으면 CI가 옛 픽스처로 검증해 실패한다.

**언제 쓰는가**: 툴체인 상승으로 인코더 출력이 바뀌어 픽스처가 어긋났을 때. 코드 결함으로 출력이 바뀐 경우에 쓰면 **결함을 기대값으로 굳혀 버린다** — 실패 원인이 툴체인인지 먼저 확인해야 한다.

---

## 계약 2 — CI 잡 `check-go-fix`

**소유**: `.github/workflows/server-ci.yml` (**CODEOWNERS 보호 경로**)

**정의** (upstream 원문 그대로 도입):

```yaml
check-go-fix:
  name: Check go fix
  needs: go
  runs-on: ubuntu-22.04
  container: mattermost/mattermost-build-server:${{ needs.go.outputs.version }}
  defaults:
    run:
      working-directory: server
  steps:
    - name: Checkout mattermost project
      uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
    - name: Run setup-go-work
      run: make setup-go-work
    - name: Run go fix
      run: go fix ./...
    - name: Check go fix
      run: if [[ -n $(git status --porcelain) ]]; then echo "Please run 'go fix ./...' and commit the changes"; git diff; exit 1; fi
```

**계약**:

| 조건 | 결과 |
|---|---|
| `go fix ./...` 후 작업 트리가 깨끗하다 | **통과** |
| 변경 파일이 하나라도 생긴다 | **실패**. 실행할 명령을 안내하고 `git diff`를 출력 |

**개발자가 실패를 만났을 때**: `cd server && go fix ./... && git add -A && git commit`

**이 잡이 잡는 것**: `reflect.Ptr` 같은 제거된 별칭, 표준 반복자 표기 등 `go fix`가 자동 변환할 수 있는 현대화 항목.

**이 잡이 잡지 못하는 것**: `model.NewPointer` 호출. 제네릭 함수라 인라인 분석기가 인식하지 못한다([research.md 결정 2](../research.md)). `//go:fix inline` 지시자를 붙여도 마찬가지다 — upstream도 이 사실을 확인하고 `d4fc0ecb`에서 지시자를 제거했다. 이 표기의 일관성은 CI가 아니라 **코드 리뷰**로 지킨다.

**도입 시점**: 이행의 **마지막 단계**. 앞 단계가 끝나기 전에 켜면 CI가 막힌다.
