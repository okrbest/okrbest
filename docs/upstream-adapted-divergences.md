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
| `da70dcce` Mattermost Blocks | [1c801690](https://github.com/mattermost/mattermost/commit/1c801690a06a39ad5ad467a621196c19229295bb) (#36338) | 제외한 property v2·분류 표시 계보의 문맥을 걷어내고 수용, 선택자·헬퍼 이름은 우리 것 유지 — 아래 참조 |

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

---

## Mattermost Blocks — 제외한 두 계보에서 문맥만 걷어내고 수용

**무엇을 했나.** upstream `1c801690`(Mattermost Blocks, #36338)을 패치 그대로 받았다.
155파일 +20,930/−1,485 규모이나 재설계하지 않았고, 충돌 9곳(126줄)만 우리 트리 사정에
맞게 풀었다. 그중 **지속적 차이로 남는 것이 넷**이다.

**1. `FeatureFlags.SetDefaults`에서 `PropertyFieldRank`를 뺐다.**
upstream은 `f.PropertyFieldRank = false`와 `f.MmBlocksEnabled = true`를 나란히 넣는데,
`PropertyFieldRank`는 제외한 property v2 계보(`48f2fd08` → `9f1fe90b`) 소산이라 우리
`FeatureFlags` 구조체에 **필드 자체가 없다**. 그대로 받으면 없는 필드에 대입해 컴파일이
깨진다. `MmBlocksEnabled`만 취했다.
→ **이 줄은 다음에 건드리는 커밋과 또 충돌한다.** property v2를 도입하면 함께 정리된다.

**2. `feature_flags_test.go`의 `TestFeatureFlagsSetDefaults`에서 `ClassificationMarkings`
서브테스트 둘을 뺐다.** 제외한 분류 표시 계보(`2b7b398a`·`6083cc22`) 소산이라 해당 필드가
없다. `MmBlocksEnabled` 검사만 남겼다.

**3. `post_message_preview/index.ts`의 autotranslation 선택자 이름을 유지했다.**
upstream은 `isChannelAutotranslated` → `isMyChannelAutotranslated` 개명을 반영한 상태지만
그 커밋이 우리에겐 미반영이다. 우리 이름을 지키고 upstream의 `getFeatureFlagValue`만 받았다.
같은 줄을 `7bbb063b9a`(MM-69172)에서 이미 한 번 풀었다 — **세 번째로 또 만날 줄이다.**

**4. `actions/command.ts`가 `localizeMessage`를 계속 쓴다.**
upstream은 이 파일을 `getIntl` 기반으로 이관한 뒤였으나(우리 미반영 선행 커밋) 우리 본문은
여전히 `localizeMessage`를 3곳에서 쓴다. `applyIntegrationGotoLocation`(upstream 신규, 본문
사용)만 더하고 `getIntl`·`getSiteURL`은 미사용이라 넣지 않았다.

**동작 변화 하나 — 첨부 클릭.** upstream이 `makeIsEligibleForClick` 셀렉터에 `.attachment`를
추가한다(결정: 그대로 수용). 우리 첨부 래퍼가 `className={'attachment ...'}`이고 자체 커밋
`152f848078`(봇 슬랙 부분 클릭시 이동 가능하게)이 그 안쪽 `.attachment__container`에 클릭
핸들러를 달아 둔 상태다. 결과:
- `title_link` 있음 → 우리 핸들러가 링크를 열고 `stopPropagation` (변화 없음)
- `title_link` 없음 → 이전엔 게시물 클릭이 발동해 스레드가 열렸으나 **이제 아무 일도 없다**

upstream이 `.attachment`를 넣은 이유가 블록·드롭다운·자동완성이 첨부 안으로 들어오면서
의도치 않은 스레드 열림을 막으려는 것이라, 블록을 도입하는 이상 같은 필요가 우리에게도 있다.
우리 커스터마이즈의 원래 목적(`title_link` 이동)은 그대로 살아 있다.

**차이를 없앨 조건.** (1) property v2 계보를 도입하면 `PropertyFieldRank`와
`ClassificationMarkings`가 함께 들어와 1·2가 해소된다. (2) upstream의
`isMyChannelAutotranslated` 개명 커밋을 반영하면 3이 해소된다. (3) `command.ts`의 `getIntl`
이관 커밋을 반영하면 4가 해소된다.
