# adapt로 벌어진 upstream 대비 차이

`/speckit-sync`가 **adapt**로 반영한 커밋 중, 우리 코드가 upstream과 **의도적으로 달라진 채
남는** 지점을 기록한다. 나중에 그 차이를 없앨 조건(선행 커밋 도입, 계보 복원)까지 함께 적는다.

세 문서의 역할이 다르다.

| 문서 | 담는 것 | 갱신 주체 |
|---|---|---|
| `docs/upstream-master-unmerged-commits.md` | 미반영 커밋 목록 + 제외·spec 전환·비공개 모듈 부록 | `upstream-sync.sh update`가 재생성 (부록 3종만 보존) |
| `docs/upstream-inert-features.md` | 코드는 들어왔으나 **발동하지 않는** 기능 | 사람이 작성 |
| **이 문서** | 코드가 **동작하지만 upstream과 형태가 다른** 지점 | 사람이 작성 |

**수록 기준.** adapt 커밋 전부를 적지 않는다 (2026-09-03 기준 166건). 우리에게 없는 파일의
훅을 버리는 식의 기계적 처리는 커밋 본문으로 충분하다. 여기에는 **후속 sync에서 충돌·오해를
부를 수 있는 차이**만 적는다 — 함수 구조가 달라졌거나, 제외한 계보에서 일부만 이식했거나,
설정·필드 이름이 upstream과 어긋난 경우.

**시점.** 2026-09-03부터 기록한다. 그 이전 adapt의 사유는 각 커밋 본문
(`git log --grep="adapted for okrbest"`)에 있다.

| 우리 커밋 | upstream | 차이 요약 |
|---|---|---|
| `9551f53f` [MM-69115] 채널이 두 카테고리에 남는 버그 | [3fc5b942](https://github.com/mattermost/mattermost/commit/3fc5b942927dede596ead4ebfec4f40085365f4b) (#36875) | 제외한 계보에서 함수 블록만 부분 이식 — 아래 참조 |

---

## `addChannelToDefaultCategory` — 제외한 Managed Categories에서 부분 이식

**무엇을 했나.** upstream `3fc5b942`는 `addChannelToDefaultCategory`의 `originalCategory`
탐색·제거 블록을 고치는 커밋인데, **그 블록이 우리 트리에 없었다.** 블록을 넣은 것은
`69fbaece`([MM-68496] Feature flag Managed Categories, #36289)이고 우리는 그 커밋을
제외했다(사유는 ledger 부록 참조 — 제외한 Managed Categories MVF의 후속이라 반영할 토대가
없음). 그래서 고칠 대상이 없는 대신, **블록 자체를 이미 고쳐진 형태로 새로 이식**했다.

**왜 이식했나.** 증상은 우리에게도 있었다. `UpdateSidebarCategories`는 넘겨받은 카테고리의
`SidebarChannels` 행만 지운다 — 스토어 주석이 명시한다: *"moving channels between categories
requires updating both the source and destination categories."* 우리 코드는 목표 카테고리만
넘겨서 원본 카테고리의 행이 남았다. Managed Categories와 무관하게 우리 기능
(`ExperimentalChannelCategorySorting`, 자체 커밋 `25a4839a9e` 계보)에 필요한 규칙이다.

**실제로 깨지던 경로는 upstream과 달랐다.** 조사 결과 세 경로 중 하나만 구멍이었다.

| 경로 | 상태 | 이유 |
|---|---|---|
| 기본 Channels 카테고리에서 이동 | 정상 | `completePopulatingCategoriesT`가 **고아 채널만** 담는다 — 명시적 행이 생기면 저절로 빠진다 |
| 새 카테고리를 만들며 이동 | 정상 | `CreateSidebarCategory`가 이전 카테고리의 행을 스스로 지운다 |
| **이미 존재하는 카테고리로 이동** | **버그** | 이 경로만 `UpdateSidebarCategories`를 타고, 원본 카테고리를 함께 넘기지 않았다 |

수정 전 실패 출력:

```
MovesOutOfPreviousCategory: expected ["Category B"], actual ["Category B", "Category A"]
MovesOutOfFavorites:        expected ["Moved Category"], actual ["Favorites", "Moved Category"]
```

**upstream과 다른 점 세 가지.**

1. **설정 필드.** upstream은 `TeamSettings.EnableChannelCategorySorting`, 우리는
   `ExperimentalSettings.ExperimentalChannelCategorySorting`. upstream이 `69fbaece`에서
   옮기고 개명했는데 우리는 그 커밋을 제외했다.
2. **신규 카테고리 생성 분기에서 조기 반환한다.** `CreateSidebarCategory`가 이전 카테고리를
   스스로 정리하므로 원본 카테고리를 따로 갱신할 필요가 없다. upstream은 이 경우에도 아래로
   흘러 빈 슬라이스로 `UpdateSidebarCategories`를 호출하고, 의미 없는
   `sidebar_category_updated` WS 이벤트를 방송한다.
3. **`slices.Delete` 패닉 수정이 무의미했다.** upstream이 고친 `slices.Delete(s, idx, 1)`
   (두 번째 인자는 개수가 아니라 끝 인덱스라 `idx > 1`이면 패닉) 호출이 우리에겐 없었다.
   이식한 코드에는 처음부터 올바른 `slices.Delete(s, idx, idx+1)`로 넣었다.

**테스트도 다르다.** 우리 `ChannelPatch`에는 `DefaultCategoryName` 필드가 없어서
(`69fbaece` 소산) upstream 테스트를 그대로 못 쓴다. 우리는 `DisplayName`의
`"카테고리 / 이름"` 형식을 `handleChannelCategoryName`이 파싱하는 경로로 재현한다.
회귀 방지 테스트 3개를 `channels/app/channel_test.go`에 뒀다 —
`TestPatchChannelDefaultCategoryMovesOutOfPreviousCategory`,
`...MovesOutOfFavorites`, `...ReapplyIsIdempotent`.

**정렬 조건.** `69fbaece`를 다시 검토하게 되면 세 조각이 함께 들어와야 upstream과 맞는다.

1. `ChannelPatch.DefaultCategoryName` 필드와 `Channel.Patch`의 처리
2. 설정의 `ExperimentalSettings.ExperimentalChannelCategorySorting` →
   `TeamSettings.EnableChannelCategorySorting` 이동·개명
3. Managed Categories 본체

그때 이 이식분은 중복되므로 upstream 형태로 되돌리면 된다. 같은 내용을 ledger 부록의
`69fbaece` 제외 사유에도 남겨 뒀다 — 그쪽에서 이 문서로 오게 된다.
