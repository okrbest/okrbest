# 검증 가이드: Go 1.26.2 툴체인 이행

**작성일**: 2026-08-25 | **명세**: [spec.md](./spec.md) | **조사**: [research.md](./research.md)

이행이 실제로 끝났는지 판정하는 실주행 절차다. 각 절이 명세의 SC-### 하나에 대응하며, **명령과 기대 출력**으로만 판정한다. 서술로 대신하지 않는다.

---

## 사전 준비

```bash
cd /Users/shin-yebin/Project/okrbest/okrbest
go version          # go1.26.2 이상이어야 한다
docker ps | grep postgres   # 서버 테스트에 DB가 필요하다
```

**착수 전 기준선 저장** (헌법 원칙 I — 회귀는 실패 목록 diff로 판정한다):

```bash
cd server
go test ./... -count=1 2>&1 | grep -E '^(ok|FAIL|---)' | sort -u > /tmp/baseline_tests.txt
make check-style > /tmp/baseline_style.txt 2>&1
```

> 이 저장소의 서버 테스트에는 이행과 무관한 기존 실패가 있다(예: `channels/utils`의 `TestUpdateAssetsSubpath/no_client_dir`, `config`의 `TestValidateLogFilePath`, `sqlstore`의 `TestChannelStore/SearchMore`). 기준선 없이 개수만 비교하면 판정이 무의미하다.

---

## 1. 버전 핀이 일치한다 (SC-001 선행)

```bash
cat server/.go-version
grep '^go ' server/go.mod server/public/go.mod tools/mattermost-govet/go.mod tools/sharedchannel-test/go.mod
```

**기대**: 다섯 값 모두 `1.26.2`.

```bash
git grep -n '1\.25\.9' -- server tools | grep -v docs/
```

**기대**: 출력 없음.

---

## 2. 서버 전체가 빌드된다 (SC-001)

```bash
cd server && go build ./...
```

**기대**: 출력 없음, 종료 코드 0.

---

## 3. 포인터 표기가 트리 전체에서 일관된다 (SC-002)

```bash
cd server
grep -rn 'model\.NewPointer(' --include='*.go' . | wc -l
grep -rn 'bToP(\|boolPtr(' --include='*.go' . | wc -l
grep -rn 'reflect\.Ptr\b' --include='*.go' . | wc -l
```

**기대**: 세 값 모두 **0**. (착수 전에는 각각 4678 / 41 / 19)

`go fix`가 더 고칠 것이 없는지 확인:

```bash
cd server && go fix ./... && git status --porcelain
```

**기대**: 출력 없음 — 변경 파일 0개.

---

## 4. 이미지 픽스처 테스트가 통과한다 (SC-003)

```bash
cd server && go test ./channels/app/imaging/... -count=1
```

**기대**: `ok  github.com/mattermost/mattermost/server/v8/channels/app/imaging`

특히 이행 전 이 머신에서 실패하던 테스트를 지목해 확인한다:

```bash
cd server && go test ./channels/app/imaging/ -run TestGenerateMiniPreviewImage -count=1 -v 2>&1 | grep -E '^(--- |ok|FAIL)'
```

**기대**: `--- PASS: TestGenerateMiniPreviewImage`
**이행 전 실측**: `42 / 256 pixels differ (16.41%); first at (3, 8)` 로 실패

---

## 5. 픽스처 갱신 절차가 동작한다 (SC-006)

계약은 [contracts/developer-surface.md](./contracts/developer-surface.md) 참조.

```bash
cd server
# 픽스처 하나를 일부러 훼손
cp tests/mini_preview_test_qa_data_graph_16x16_q90.jpg /tmp/fixture.bak
printf '\x00\x00' >> tests/mini_preview_test_qa_data_graph_16x16_q90.jpg

go test ./channels/app/imaging/ -run TestGenerateMiniPreviewImage -count=1   # 실패해야 정상
go test ./channels/app/imaging/ -run TestGenerateMiniPreviewImage -update-fixtures -count=1
go test ./channels/app/imaging/ -run TestGenerateMiniPreviewImage -count=1   # 통과해야 정상

git diff --stat tests/mini_preview_test_qa_data_graph_16x16_q90.jpg
```

**기대**: 훼손 후 실패 → 갱신 후 통과 → 파일이 원래 내용으로 복원돼 `git diff`가 비어 있다.

---

## 6. 품질 게이트가 기준선을 넘지 않는다 (SC-004)

```bash
cd server && make check-style
```

**기대**: `0 issues.`
**주의**: 버전 핀만 올리고 upstream diff를 반영하지 않은 중간 상태에서는 **58건**(modernize 51 + govet 7)이 나온다. 이것이 이 이행의 실질 관문이다([research.md 결정 5](./research.md)).

```bash
cd server
go test ./... -count=1 2>&1 | grep -E '^(ok|FAIL|---)' | sort -u > /tmp/after_tests.txt
diff /tmp/baseline_tests.txt /tmp/after_tests.txt
```

**기대**: 신규 `FAIL` 항목 **0건**. 기준선에 있던 실패가 그대로 남는 것은 허용하되, 없던 실패가 생기면 안 된다.

`model/config.go` 충돌 해소가 okrbest 자체 설정을 유실시키지 않았는지 지목해 확인:

```bash
cd server && go test ./public/model/ -run 'TestConfig' -count=1
grep -c 'EnableWatermark' public/model/config.go
```

**기대**: 테스트 통과, `EnableWatermark` 잔존(0이 아님).

---

## 7. CI 검사가 실제로 작동한다 (SC-005)

`check-go-fix` 잡이 옛 표기를 잡는지 확인한다. 로컬에서 잡의 판정 로직을 그대로 재현한다:

```bash
cd server
# reflect.Pointer 를 옛 별칭으로 되돌려 일부러 위반을 만든다
sed -i '' 's/reflect\.Pointer/reflect.Ptr/' channels/utils/merge.go
go fix ./channels/utils/
git status --porcelain channels/utils/    # 변경이 잡혀야 정상 → CI라면 실패
git checkout channels/utils/merge.go
```

**기대**: `go fix`가 파일을 되돌려 `git status`에 변경이 뜬다. CI에서는 이 상태가 exit 1이다.

---

## 8. 문서가 갱신됐다 (FR-012)

```bash
grep -n 'Go 1\.' .specify/memory/constitution.md
```

**기대**: `1.24.6` 잔존 없음, 두 곳 모두 `1.26.2`.

---

## 9. 미반영 목록에서 차감된다 (SC-007)

완료 커밋 본문에 upstream 참조가 있어야 한다.

```bash
git log --grep='e3fbf8711f73ac1266ebc943f88999175c2594ef' --oneline | head
.specify/scripts/bash/upstream-sync.sh update
.specify/scripts/bash/upstream-sync.sh status
```

**기대**: 커밋이 검색되고, 남은 커밋 수가 이행 전보다 **1 줄어든다**. `e3fbf871`이 목록에서 사라진다.

---

## 판정 요약

| 절 | 대응 | 통과 조건 |
|---|---|---|
| 1–2 | SC-001 | 핀 5개 일치, 빌드 오류 0 |
| 3 | SC-002 | 옛 표기 0건, `go fix` 변경 0개 |
| 4 | SC-003 | imaging 테스트 통과 |
| 5 | SC-006 | 훼손→실패→갱신→통과 |
| 6 | SC-004 | `0 issues.` + 신규 FAIL 0건 |
| 7 | SC-005 | 위반 주입 시 검사가 잡아냄 |
| 8 | FR-012 | constitution 1.26.2 |
| 9 | SC-007 | 남은 커밋 −1 |

**아홉 절이 모두 통과해야 완료다.** 하나라도 미통과면 그 사실과 출력을 그대로 보고한다.
