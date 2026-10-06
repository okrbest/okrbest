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
| `b5236f98` Playwright 1.61 업그레이드 | [d85da5ce](https://github.com/mattermost/mattermost/commit/d85da5ce2c7bf9a8718b2bba620ba0992043ef3d) (#37277) | e2e 기본 설정·워크플로·ABAC 스펙이 우리 쪽에서 갈라져 upstream 훅 넷을 버렸다 — 아래 참조 |
| `020de7a6` ABAC 플래그 기본 활성 | [939afca4](https://github.com/mattermost/mattermost/commit/939afca46faeec7b65bbd02de8b11911935c515e) (#37265) | 플래그 다섯 중 넷만 뒤집었다 — PropertyFieldRank는 우리에게 필드가 없다 — 아래 참조 |
| `41cec566` 공유 채널 플래그 제거 | [9e3d8efc](https://github.com/mattermost/mattermost/commit/9e3d8efc1a62b53e883a5a08ce3552c7c9fc896d) (#37154) | 충돌 넷이 전부 우리 Lexical 개명·자체 프로퍼티에서 왔다 — 아래 참조 |
| `469e1e26` 권한 정책 편집기 Simple 모드 | [be8f7fe0](https://github.com/mattermost/mattermost/commit/be8f7fe02f65a506b1734e13eb68e44902d8bd80) (#37267) | 랭크 연산자 테스트 넷을 버렸다 — 우리 shared.tsx에 랭크 계보가 없다 — 아래 참조 |
| `2bfb351e` 플러그인이 코어 모달을 id로 연다 | [379959ba](https://github.com/mattermost/mattermost/commit/379959ba32abf832be77195e4a72789a923f1f99) (#37339) | squash에 섞인 에디터 공개(#37514)를 뺐다 — Tiptap 에디터가 우리에게 없다 — 아래 참조 |
| `666f5d95` 채널 접근 표시 끄기 설정 | [8d10e91d](https://github.com/mattermost/mattermost/commit/8d10e91d3899f35ed8272f1c0d4a88f352ad8be6) (#37519) | `AccessControlSettings`의 세션 속성 필드 둘이 없어 충돌 7파일 — 복원 체크리스트 포함 — 아래 참조 |
| `7f77ce32` 이메일 사용자 프로필 잠금·초대 이름 지정 | [2851af05](https://github.com/mattermost/mattermost/commit/2851af059d62cb3eebe73debdaa812d5fa440a94) (#37458) | 직위는 우리 조직 역할 읽기 전용 유지, 가입 화면의 우리 이름·성 입력칸을 미리 채우고 잠갔다 — 아래 참조 |
| `8b87a1b0` 팀 ABAC 멤버십 동기화·사용자 화면 | [3a820143](https://github.com/mattermost/mattermost/commit/3a820143a1a5384172386a6c728e65825696a1e0) (#37054) | 120파일을 받으며 제외 계보에 걸린 7곳을 우리 트리에 맞췄다. 잡 policy_id 필터 2줄은 버렸다 — 복원 체크리스트 포함 — 아래 참조 |
| `097a9330` Playwright T1434·T4023·T1987 이관 | [f110574b](https://github.com/mattermost/mattermost/commit/f110574b559df9bc121b4239d03f524a9bdb8cd2) (#37533) | 새 스펙이 우리 포크에서 돌지 않는다. 분석 중 db55f9fa43 문구 누락 2건을 찾아 `ad603577`로 복원 — 아래 참조 |
| `a67e917f` ABAC 에디터 플러그인 공개 | [7bc3bbfd](https://github.com/mattermost/mattermost/commit/7bc3bbfd0c94b2a9577f40815d4fb25955c8ea38) (#37510) | 노출·주입 훅은 받고 Session Attributes·native 필드에 묶인 셋을 버렸다. 테스트 파일 하나는 새로 작성 — 아래 참조 |
| `f7c10ac5` e2e 플레이크 안정화 | [10b780cb](https://github.com/mattermost/mattermost/commit/10b780cb097b2ec94ab0f9df7ebcbd5b7850f13f) (#37614) | Cypress 수정과 AI bridge 락 fixture는 받고, 보류 제외한 Scheduled Recaps 스펙 하나를 버렸다 — 아래 참조 |
| `8dab2f66` 포스트 편집이 초안을 만드는 버그 | [0fed2262](https://github.com/mattermost/mattermost/commit/0fed2262813c57bec6f47088efcbfe9e4335b5c4) (#37658) | 수정은 그대로, 신규 테스트의 요소 조회를 Lexical에 맞췄다. 파일 전체 실행에선 여전히 타임아웃 — 아래 참조 |
| `1f79143b` discoverable 비공개 채널 가입 요청 UX (4커밋) | [99bc7bd8](https://github.com/mattermost/mattermost/commit/99bc7bd886c97d33149a839b29a59b8301242d7e) (#37078) | 59파일 +3957을 네 단계로 나눠 받았다. 충돌 9파일에서 제외 계보(MBE 8a/8b/8c·Managed Categories·classification) 부분을 버렸다 — 아래 참조 |
| 팀 ABAC 플래그 기본 활성 | [7130ae59](https://github.com/mattermost/mattermost/commit/7130ae598f8291bd5d5e39473bd2df370b69c3d8) (#37781) | 서버 기본값은 받고 PropertyFieldRank 테스트와 e2e 플래그 한 줄을 버렸다. 비활성 근거에서 플래그가 빠졌다 — 아래 참조 |
| 플러그인 ABAC API | [c7eff700](https://github.com/mattermost/mattermost/commit/c7eff70026ee233a5163fde42f5082134e66b795) (#37509) | API 표면 8개는 받고 네이티브 속성·PSAv2 계보에 걸린 셋을 걷어냈다. 정책 엔진이 없어 비활성 — 아래 참조 |
| UserStore.Get을 request context로 | [9f0ae6a2](https://github.com/mattermost/mattermost/commit/9f0ae6a220f5da8f4303ee80f2237f395ff9bed4) (#37646) | 56파일 중 제외한 Integrated Boards의 `app/board.go` 1줄만 못 받았다. 단독으로는 빌드되지 않아 `523292f0`과 짝으로 받았다 — 아래 참조 |
| ABAC 편집기 아포스트로피 값 Simple 모드 복귀 | [7a06c7ae](https://github.com/mattermost/mattermost/commit/7a06c7ae5263a37e4916149b029619f1d7fd4b67) (#37819) | 판정 정규식을 우리 패턴 7개에만 적용했다. session·rank·네이티브 패턴과 테스트 셋을 버렸다 — 아래 참조 |

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

---

## Playwright e2e — 갈라진 네 갈래에서 upstream 훅을 버렸다

**무엇을 했나.** upstream `d85da5ce`(Playwright 1.61 업그레이드, #37277)는 의존성 범프에
default_config 재생성·ABAC 스펙 수정·Azure 타입 추가가 섞여 있다. 의존성과 타입은 그대로
받았고, 나머지 넷은 **적용 대상이 우리 트리에 없어** 버렸다. 넷 다 다음 sync에서 같은
자리를 또 만난다.

**1. `.github/workflows/e2e-tests-playwright-template.yml` — 우리 워크플로는 자체 버전.**
upstream은 `mcr.microsoft.com/playwright:v1.59.1-noble` → `v1.61.0-noble` 핀을 올리는데,
우리 파일은 upstream 부모와 99/87줄 다르고 **그 이미지 핀 자체가 없다**. 이미지 범프는
`e2e-tests/.ci/server.generate.sh`와 `README.md`에만 적용했다.
→ 부수 효과로 이 커밋은 CODEOWNERS 보호 경로를 건드리지 않는다. upstream이 워크플로에
버전을 더 박아 넣을수록 이 간극은 벌어진다.

**2. `abac/support.ts` — 우리 파일이 110/303줄 다른 옛 계보.**
upstream이 고치는 `waitForPolicySyncJob`(타임아웃 매개변수화)이 **우리에겐 없는 함수**다.
우리 `support.ts`는 `expect.poll` 도입 전 형태이고 `assertAccessControlAutocompleteContains`
같은 우리 쪽 헬퍼를 따로 들고 있다.

**3. ABAC 스펙 3개가 우리에게 없다.**
`ldap/ldap_sync_removal_bidirectional.spec.ts`, `policies/advanced_policies_operators.spec.ts`,
`policy_management/edit_policies_rules.spec.ts`. 해당 스펙을 들여온 upstream 커밋이
미반영이다.

**4. `default_config.ts`의 `FeatureFlags` 블록 — 우리 플래그 집합이 다르다.**
upstream의 재생성분을 받지 않았다. 다만 **우리 블록도 우리 서버와 어긋나 있다.**
`server/public/model/feature_flags.go`의 `SetDefaults()`와 대조한 결과:

| 어긋난 지점 | e2e default_config | 우리 서버 |
|---|---|---|
| `AutoTranslation` | `true` | `false` (비공개 모듈이라 꺼 둠) |
| `PermissionPolicies` | `true` | `false` |
| `MobileEphemeralMode` | `true` | `false` |
| `CJKSearch`, `IntegratedBoards` | 있음 | **구조체에 필드 없음** |
| `AttributeValueMasking`, `ChannelPermissionPolicies`, `PolicySimulation`, `TeamMembershipAccessControl`, `EnableOrgRoleManagement`, `EnableShiftEscapeToMarkAllRead`, `AggregatePluginMetrics`, `SessionAttributes`, `DiscoverableChannels`, `EnableLexicalEditor` | 없음 | 있음 |

이번 커밋 범위를 넘어서므로 손대지 않았다. 파일 주석이 명시한 계약(*"Should be based only
from the generated default config from ./server via `make config-reset`"*)을 지키려면 별도
작업으로 블록 전체를 우리 서버 기준으로 다시 생성해야 한다.

**값 셋은 반대로 upstream 쪽이 옳아서 받았다.** upstream이 자기 서버 기준으로 고친 값 중
셋은 **우리 서버 기본값과도 일치**했다 — 우리 파일이 낡았던 것이다.

| 값 | 고치기 전 | 우리 서버 `SetDefaults()` |
|---|---|---|
| `PasswordSettings.MinimumLength` | 14 | **8** (`config.go:1783`) |
| `ServiceSettings.AllowedUntrustedInternalConnections` | `'localhost,127.0.0.1'` | **`''`** (`config.go:564`) |
| `ElasticsearchSettings.EnableSearchPublicChannelsWithoutMembership` | `false` | **`true`** (`config.go:3403`) |

`AllowedUntrustedInternalConnections`는 기본값에서 빠지면 테스트가 깨지므로 upstream처럼
onPrem 오버라이드(`'localhost 127.0.0.1'`)로 되살렸다.

**버린 값 하나 더 — `EmailSettings.FeedbackName`.** upstream은 onPrem 오버라이드로
`'Mattermost'`를 넣지만 리브랜드 대상 문자열이고, 우리 서버 기본값은 `''`이라 그대로 뒀다.
`FeedbackName`을 검증하는 스펙은 `notifications/system_console.spec.ts` 하나뿐이고
자기 값(`'Mattermost Test Team'`)을 직접 설정한다.

**차이를 없앨 조건.** (1) upstream의 워크플로 계보를 다시 맞추면 1이 해소된다.
(2) ABAC 스펙 계보를 반영하면 2·3이 함께 해소된다. (3) `make config-reset` 기반으로
`FeatureFlags` 블록을 재생성하면 4가 해소된다 — 이건 upstream과 무관한 우리 숙제다.

---

## ABAC 플래그 기본 활성 — 다섯 중 넷만 뒤집었다

**무엇을 했나.** upstream `939afca4`([MM-69528], #37265)는 ABAC 하위 기능 플래그 **다섯**을
기본 활성으로 뒤집는다. 우리는 **넷만** 받았다.

| 플래그 | 우리 기본값 | 상태 |
|---|---|---|
| `AttributeValueMasking` | `true` | 받음 |
| `PermissionPolicies` | `true` | 받음 (우산 플래그) |
| `ChannelPermissionPolicies` | `true` | 받음 |
| `PolicySimulation` | `true` | 받음 |
| **`PropertyFieldRank`** | — | **필드 자체가 없다** |

`PropertyFieldRank`는 제외한 property v2 계보(`48f2fd08` → `9f1fe90b`) 소산이다. 같은 이유로
`da70dcce`(Mattermost Blocks) adapt에서도 이 필드를 뺐다 — 위 항목 1번과 같은 줄이다.
**세 번째로 만난 자리다.**

**그래서 셋을 버렸다.**

1. `feature_flags.go`의 `f.PropertyFieldRank = true`. 없는 필드에 대입하면 컴파일이 깨진다.
2. `server/channels/app/property_field.go`의 `rankPropertyFieldGate` 주석 수정
   (*"which is the default"* 구절 삭제). 우리 파일은 upstream 부모와 **42/385줄** 다르고
   그 함수가 아예 없다 — `propertyFieldOptionsEqual`, `propertyFieldBroadcastParams`,
   `publishPropertyFieldEvent`도 마찬가지다. 3-way 머지가 블록 전체를 되살리려 해 충돌했고
   HEAD 쪽으로 풀었다.
3. `feature_flags_test.go`에 새로 들어온 `TestFeatureFlagsSetDefaults_PropertyFieldRank`.
   테스트 파일은 자동 병합돼 이 함수가 딸려 들어왔고 `flags.PropertyFieldRank`를 참조하므로
   제거했다.

**테스트 파일 둘은 갈라져 있는데도 자동 병합됐다.** `app/access_control_test.go`가 upstream
부모와 **59/182줄** 다른데도 충돌이 없었다 — upstream이 손대는 함수 여섯
(`TestCreateOrUpdateAccessControlPolicy`, `TestDeleteAccessControlPolicy`,
`TestHasPermissionToFileAction`, `TestPublishChannelPolicyEnforcedUpdateHydratesBroadcastPayload`,
`TestUpdateAccessControlPoliciesActive_MaskingGuard`,
`TestMaskPolicyExpressions_FailClosedUsesDenyAllSentinel`)이 우리 파일에 전부 있었기 때문이다.
`api4/access_control_test.go`는 우리 것이 부모와 동일해 그대로 붙었다.

**blast radius를 커밋 전에 실측했다.** 플래그만 뒤집고 돌린 결과:

| 패키지 | 플립만 | upstream 테스트 패치 적용 후 |
|---|---|---|
| `public/model` | 2건 실패 | 0건 |
| `channels/api4` | **20개 서브테스트 실패** | **0건** |
| `channels/app` | 1건 실패 | 0건 |

api4 실패에는 **우리 팀 ABAC 계보 테스트**가 셋 끼어 있었다 —
`TestCreateAccessControlPolicyTeamAdmin`, `TestGetAccessControlPolicyTeamAdmin`,
`TestDeleteAccessControlPolicyTeamAdmin`(자체 커밋 `530f684f`·`cd7d9c32` 계보). 이들도 같은
파일의 `setupTeamAdminABAC` 헬퍼를 공유해서, upstream이 그 헬퍼에 마스킹 끄기와
`SetReadOnlyFF(false)`를 넣자 함께 풀렸다. **우리 팀 ABAC 테스트가 upstream 헬퍼에 묶여 있다는
뜻이므로, 앞으로 그 헬퍼를 건드리는 upstream 커밋은 우리 테스트에도 직접 영향을 준다.**

**동작 영향은 라이선스가 완충한다.** 넷 다 Enterprise Advanced 라이선스 게이트 뒤에 있다
(테스트가 `model.NewTestLicenseSKU(model.LicenseShortSkuEnterpriseAdvanced)`를 심어야 경로가
열린다). 플래그는 허용 층이고 라이선스가 문지기다. 다만 라이선스가 있는 환경에서는
`AttributeValueMasking`이 켜지면서 **마스킹된 값을 가진 호출자의 정책 비활성화를 막는 가드**가
살아난다 — 관리자가 체감하는 변화다.

**차이를 없앨 조건.** property v2 계보를 도입하면 `PropertyFieldRank` 필드와
`rankPropertyFieldGate`가 함께 들어와 셋이 한꺼번에 해소된다. 그때 upstream 형태로 되돌리면 된다.

---

## 공유 채널 플래그 제거 — 충돌 넷이 전부 우리 자체 변경에서 왔다

**무엇을 했나.** upstream `9e3d8efc`(#37154)가 공유 채널 플래그 셋
(`EnableRemoteClusterService`, `EnableSharedChannelsPlugins`,
`EnableSharedChannelsMemberSync`)을 제거한다. 32파일 +76/−452를 그대로 받았고,
충돌 넷만 우리 형태에 맞춰 풀었다. **버린 upstream 코드는 없다** — 네 충돌 모두
"우리 이름/프로퍼티 vs upstream 이름/프로퍼티"였지 기능 취사선택이 아니다.

| 파일 | 우리가 지킨 것 | 왜 충돌했나 |
|---|---|---|
| `advanced_text_editor.tsx` | `lexicalEditorRef` 이름, `useOrientationHandler` 호출 | Lexical 에디터 계보(`9fae0052`)에서 `textboxRef`를 개명했다. upstream 쪽의 `wysiwygRef`는 제외한 TipTap 커밋(`0fa2713b`) 소산이라 받지 않았다 |
| `use_plugin_items.tsx` | `LexicalTextEditorHandle` 타입 임포트 | 같은 계보. upstream은 `TextboxClass`를 쓴다 |
| `channel_header/index.ts` | `showBotMessages` 프로퍼티, `getMyChannelAutotranslation` 이름 | autotranslation 선택자 개명 미반영 |
| `channel_header_menu.tsx` | `getChannelAutotranslation` 이름 | 〃 |

**autotranslation 선택자 이름은 이제 네 번째로 만난 줄이다.** upstream의
`isChannelAutotranslated` → `isMyChannelAutotranslated` 개명 커밋이 미반영이라
계속 우리 이름을 지키고 있다 — 위 "Mattermost Blocks" 항목 3번과 같은 지점이고,
`7bbb063b9a`(MM-69172) → `da70dcce`(Blocks) → 이번이 세 번째·네 번째다.
**그 개명 커밋을 반영하면 한꺼번에 정리된다.**

**동작 영향은 커넥티드 워크스페이스를 켤 때만 드러난다.**

| 플래그 | 우리 기본값 | 제거 전 실제 동작 | 제거 후 |
|---|---|---|---|
| `EnableSharedChannelsPlugins` | `true` | 훅이 `!channel.shared \|\| flag`라 항상 true | 변화 없음 |
| `EnableSharedChannelsMemberSync` | `false` | 멤버 동기화가 **항상 꺼짐** | 원격 클러스터 서비스 유무로만 판정 |
| `EnableRemoteClusterService` | `false` | 관리자가 설정을 켜도 클라이언트엔 **항상 "false"** | `ConnectedWorkspacesSettings`를 그대로 따름 |

뒤 둘은 `ConnectedWorkspacesSettings.EnableSharedChannels`와
`EnableRemoteClusterService`가 모두 기본 `false`라(`config.go:1270`·`1274`)
관리자가 커넥티드 워크스페이스를 켜지 않는 한 잠들어 있다. 켠다면 **설정이 실제로
작동하는 쪽이 옳고**, 그것이 이 커밋의 목적이다.

---

## 권한 정책 편집기 — 랭크 연산자 테스트 넷을 버렸다

**무엇을 했나.** upstream `be8f7fe0`(#37267)은 권한 정책 규칙 편집기가 들고 있던
낡은 `isSimpleExpression` 로컬 복사본을 지우고 공유 헬퍼를 쓰게 한다. 소스 수정은
그대로 받고, **랭크 연산자를 검증하는 테스트 넷을 제거**했다.

- `opens a ranked-operator rule in Simple mode (MM-69527)`
- 표 케이스 셋: `ranked is at most (<=)`, `ranked greater than (>)`,
  `ranked less than (<)`

**왜 버렸나.** 우리 `access_control/editors/shared.tsx`가 upstream 대비 **44줄
부족한데 그게 전부 랭크 계보**다.

| 지점 | upstream | 우리 |
|---|---|---|
| `OPERATOR_CONFIG` | `IS_EXACTLY`·`IS_AT_LEAST`·`IS_GREATER_THAN`·`IS_AT_MOST`·`IS_LESS_THAN` 있음 | **없음** |
| `isSimpleCondition` 첫 정규식 | `(==\|!=\|>=\|<=\|>\|<)` | `(==\|!=)` |

그래서 랭크 표현식(`user.attributes.level >= "Senior"`)이 우리에게서 Advanced
모드로 열리는 것은 **버그가 아니라 정상 동작**이다. 제외한 property v2 /
`PropertyFieldRank` 계보와 같은 뿌리이며, 위 "ABAC 플래그 기본 활성" 항목에 이어
이 격차를 **네 번째**로 만났다.

**랭크 없이도 이 수정은 실익이 있다.** 로컬 복사본이 못 잡던 괄호 multiselect
"has any of" OR 그룹을 우리 공유 헬퍼의 `isMultiselectOrGroup`이 처리하고, 해당
테스트가 통과한다. 로컬 복사본에 있던 `((\[.*?\])||['"]...)` 빈 대안 오타도 함께
사라진다 — 공유 헬퍼 ⊇ 로컬 복사본이고 랭크만 빠진다. 제거 전 12/16이었고
실패 4건이 전부 랭크였다. 제거 후 12/12.

**`AccessControlSettings` 필드 둘도 같이 걸렸다.** upstream이 새로 넣은 테스트가
`accessControlSettings` 리터럴에 `TrustProxyDeviceIdentityHeader`와
`EnforceDeviceIDConsistency`를 심는데, 우리 `AccessControlSettings` 타입에는 **둘 다
없다** — 위 "ABAC 플래그 기본 활성" 항목에서 버린 것과 같은 필드다. jest는 통과하지만
`npm run check-types`가 TS2353으로 잡는다(`permission_policy_details.test.tsx(47,9)`).
두 줄을 지워 기준선 29건을 유지했다. **jest 통과만으로는 이 부류를 못 걸러낸다 —
adapt 후 반드시 check-types를 함께 돌려야 한다.**

**차이를 없앨 조건.** property v2 / 랭크 속성 계보를 도입하면 `shared.tsx`의 44줄이
들어오고, 그때 이 테스트 넷을 upstream 형태로 되살리면 된다. 같은 도입으로
`PropertyFieldRank` 플래그와 `rankPropertyFieldGate`도 함께 해소된다.
`TrustProxyDeviceIdentityHeader`·`EnforceDeviceIDConsistency`가 들어오면 위 테스트
리터럴도 upstream 형태로 되돌린다.

---

## 플러그인 공개 API — 모달은 받고 에디터 공개는 뺐다

**무엇을 했나.** upstream `379959ba`(#37339)는 squash 커밋 하나에 두 기능을 담았다.

| 부분 | 내용 | 처리 |
|---|---|---|
| 모달 공개 (#37339 본체) | `window.WebappUtils.modals.openModalById`·`canOpenModalId`, 허용 목록 모달 5개(`user_settings`·`invitation`·`team_settings`·`team_members`·`leave_team`), 빌드 시 props 계약 가드 | **반영** |
| suggestion 타입 이동 | `SuggestionResults`·`ProviderResults` 등을 `@mattermost/shared/types/global/suggestions.ts`로 옮기고 `suggestion_results.ts`는 re-export | **반영** |
| 에디터 공개 (#37514, MM-69774) | `window.WebappUtils.editor` — WYSIWYG 에디터·FormattingBar·SuggestionList·자동완성 provider 넷 | **제외** |

제외한 파일과 줄:

- `webapp/channels/src/plugins/published_editor.ts` (95줄) — 파일째 뺐다
- `webapp/channels/src/plugins/published_editor.test.tsx` (129줄) — 파일째 뺐다
- `webapp/platform/shared/src/types/global/editor.ts` (135줄) — 파일째 뺐다
- `webapp/channels/src/plugins/export.ts` — `PublishedEditorUtils` import, `publishedEditorUtils` import,
  `WindowWithLibraries.WebappUtils.editor` 필드, `window.WebappUtils.editor` 값 네 줄
- `webapp/platform/shared/src/types/global/index.ts` — `./editor` import·re-export,
  `WindowShared.WebappUtils.editor` 필드 세 줄

원본은 `git show 379959ba -- <경로>`로 언제든 꺼낼 수 있다.

**왜 뺐나.** `published_editor.ts`가
`components/advanced_text_editor/wysiwyg_editor/wysiwyg_editor`를 import하고 그
`WysiwygEditorHandle` 타입으로 빌드 가드를 건다. 이 파일은 upstream `0fa2713b`(MM-67755,
Tiptap WYSIWYG, #36143)가 만들었는데 **우리는 그 커밋을 제외했다** — 메시지 작성창
에디터를 Lexical(`components/lexical_editor/`)로 확정했기 때문이다(ledger 제외 부록 참조).
FormattingBar도 upstream은 `forwardRef`로 `FormattingBarHandle`(`openLinkPopover`)을
노출하지만 우리 `formatting_bar.tsx`에는 handle이 없다. merge-tree는 새 파일 추가라
CLEAN으로 나왔지만 그대로 받으면 webapp 빌드가 깨진다.

**외부 영향.** `window.WebappUtils.editor`를 쓰는 upstream 플러그인은 우리 서버에서
해당 기능이 동작하지 않는다(`undefined` 접근). `canOpenModalId`처럼 기능 탐지 함수가 없으니
플러그인 쪽은 `window.WebappUtils.editor` 존재 여부로 확인해야 한다. 모달 공개는 영향 없다.

**검증.** 반영 후 `npx tsc -b`(channels) 오류가 기준선(직전 커밋, 같은 디렉터리)과 29건
동일 목록 — 모달 계약 가드 성립. jest `export.test`·`published_modals.test`·
`components/suggestion` 통과. suggestion 실패 2건
(`AtMentionProvider should suggest for "@h"`, `SuggestionBox should reset selection…`)은
변경 전 HEAD에서도 똑같이 실패하는 기준선이다.

**되살릴 때.** 두 갈래가 있다.

1. **일부는 Tiptap 없이 바로 가능하다.** provider 넷(`AtMentionProvider`·`ChannelMentionProvider`·
   `CommandProvider`·`EmoticonProvider`)과 `components/suggestion/suggestion_list.tsx`는 우리
   트리에 있다. `editor.ts`의 `SuggestionListProps`·provider 생성자 타입이 우리 실제
   시그니처와 맞는지만 확인하면 `editor.providers`·`editor.SuggestionList`는 먼저 공개할 수 있다.
2. **`WysiwygEditor`·`FormattingBar` 공개는 Lexical 대응 설계가 필요하다.** upstream 계약
   (`PublishedWysiwygEditorHandle`: `insertText`·`focus`·`blur`·`getInputBox`,
   `PublishedFormattingBarHandle`: `openLinkPopover`, `WysiwygEditorProps`의
   `value`·`onChange(markdown)`·`onSubmit`·`channelId`…)을 Lexical 에디터로 구현할지
   정해야 한다. upstream 반영이 아니라 자체 기능이므로 brainstorming → `/speckit-specify`로
   시작한다. 계약 타입을 upstream과 같게 맞추면 upstream 플러그인이 그대로 붙는다.

이후 upstream이 `published_editor.ts`나 `types/global/editor.ts`를 고치는 커밋은
modify/delete 충돌로 나타난다 — 이 항목을 근거로 같은 판단(제외 또는 위 설계 후 수용)을 한다.

**후속 반영.** upstream `9a8021b5`(MM-69812, #37515)가 `webapp/AGENTS.md`에 공개 API 규칙을
더했다. 받으면서 `window.WebappUtils.editor` 항목만 "okrbest에는 공개하지 않음"으로 바꿨다 —
에이전트가 없는 `published_editor.ts`를 찾지 않게 한다. 에디터 공개를 되살리면 이 줄도 upstream
원문으로 돌린다.

---

## `AccessControlSettings` — 세션 속성 필드 둘이 없다

**무엇을 했나.** upstream `8d10e91d`(MM-69798, #37519)는 `AccessControlSettings`에
`EnableChannelPolicyIndicators`(기본 `true`)를 넣는다. 끄면 채널 멤버 RHS·초대 모달이 정책
속성 태그를 숨기고, `GET /channels/{id}/access_control/attributes`도 빈 `{}`를 돌려준다.
기능은 **그대로** 받았다. 충돌 7파일을 풀면서 upstream 문맥에 있던 두 필드를 뺐다.

**빠진 두 필드.**

| 필드 | 태그 | 기본값 | 하는 일 (upstream) |
|---|---|---|---|
| `TrustProxyDeviceIdentityHeader` | `access:"write_restrictable,cloud_restrictable"` | `false` | 켜면 mTLS 리버스 프록시가 넣은 `X-Mattermost-Session-Attribute-Device-Id` 헤더로 **TLS device ID** 세션 속성을 채운다 |
| `EnforceDeviceIDConsistency` | `access:"write_restrictable,cloud_restrictable"` | `false` | 켜면 세션에 캐시된 기기 ID와 들어온 기기 ID가 다를 때 막는다 |

**왜 없나.** 두 필드는 upstream `684ddb32`(Session Attributes MVF - Server-work, #36934)가
들여왔고, **우리는 그 커밋을 제외했다**(ledger 제외 부록 — property 시스템 v2 부재,
48파일 +2153 규모의 신규 개발). 읽는 쪽 코드 `server/channels/app/session_attributes.go`도
우리 트리에 없다. 필드만 넣으면 아무도 읽지 않는 설정이 콘솔에 생긴다.

**이 격차를 만난 자리.** `020de7a6`(ABAC 플래그 기본 활성), `469e1e26`(권한 정책 편집기 —
테스트 리터럴 두 줄 삭제, `okrbest:` 주석 남김)에 이어 이번이 세 번째다. 앞으로도
`AccessControlSettings` 끝에 필드를 붙이는 upstream 커밋은 **같은 자리에서 같은 모양으로**
충돌한다. 풀이는 늘 같다 — 새 필드는 받고 두 필드 줄만 뺀다.

**이번에 뺀 자리 (7파일).**

| 파일 | 뺀 것 |
|---|---|
| `server/public/model/config.go` | 구조체 필드 둘 + `SetDefaults()`의 `nil` 기본값 블록 둘 |
| `webapp/platform/types/src/config.ts` | `AccessControlSettings` 타입 필드 둘 |
| `e2e-tests/playwright/lib/src/server/default_config.ts` | 기본 설정 리터럴 두 줄 |
| `webapp/.../access_control/policy_details/policy_details.test.tsx` | 픽스처 두 줄 |
| `webapp/.../permission_policies/policy_details/permission_policy_details.test.tsx` | 픽스처 두 줄 (`469e1e26` 때 이미 빠져 있음, `okrbest:` 주석 있음) |
| `webapp/.../team_settings/team_access_policies_tab/team_access_policies_tab.test.tsx` | 픽스처 두 줄 |
| `webapp/.../team_settings/team_access_policies_tab/team_policy_editor.test.tsx` | 픽스처 두 줄 |

**검증.** server: `go build ./...` 성공, `TestGetChannelAccessControlAttributes` 서브테스트 2개
·`config` `TestGetClientConfig`·`public/model` Config 테스트 통과. webapp: `tsc -b` 오류가
기준선 29건과 동일 목록. 관련 jest 14스위트 통과. 같은 실행에서 실패한
`selectors/entities/users.test.ts`·`channels.test.ts` 7건은 직전 커밋에서 똑같이 실패하는
기준선이다.

**되살릴 때 — 체크리스트.** 세션 속성 기능을 도입하기로 하면(Session Attributes MVF 계보,
선행으로 property 시스템 v2 `48f2fd08` 계보가 필요하다) 아래를 upstream 형태로 되돌린다.
`git grep -l -E "TrustProxyDeviceIdentityHeader|EnforceDeviceIDConsistency" upstream-master`가
upstream의 전체 사용처를 준다(현재 11파일).

1. **설정 정의** — `server/public/model/config.go` 구조체 필드 둘(태그 포함)과 `SetDefaults()`
   블록 둘. 위치는 `EnableChannelPolicyIndicators` **바로 아래**(upstream 순서).
2. **타입** — `webapp/platform/types/src/config.ts`의 `AccessControlSettings`.
3. **e2e 기본값** — `e2e-tests/playwright/lib/src/server/default_config.ts` (둘 다 `false`).
4. **테스트 픽스처 넷** — 위 표의 테스트 4파일. `permission_policy_details.test.tsx`의
   `okrbest:` 주석도 함께 지운다.
5. **기능 코드** — `server/channels/app/session_attributes.go`(+테스트), `server/channels/api4/user_test.go`.
   이건 필드만이 아니라 세션 속성 기능 전체를 들여올 때 딸려 온다.
6. **시스템 콘솔** — `admin_definition.tsx`의 토글 둘. upstream은
   `FeatureFlags.SessionAttributes`가 꺼져 있거나 Enterprise Advanced 미만이면 숨긴다.
   i18n 키 넷(`admin.accesscontrol.trustProxyDeviceIdentityHeader.title`·`.desc`,
   `admin.accesscontrol.enforceDeviceIdConsistency.title`·`.desc` — `Id` 대소문자 주의)을
   en·ko 양쪽에 넣는다.

1~4만 먼저 넣는 것은 권하지 않는다 — 읽는 코드 없이 설정만 생긴다. 5·6과 함께 넣는다.

---

## Playwright 이관 스펙 — 받았지만 우리 포크에서 돌지 않는다

**무엇을 했나.** upstream `f110574b`(#37533)는 Cypress 테스트 셋을 Playwright로 옮긴다.
MM-T1434(서식 없이 붙여넣기)와 MM-T4023·T1987(마켓플레이스 플러그인 설치·설정·제거)이다.
POM 헬퍼(`pasteHtml`, 마켓플레이스·플러그인 관리 POM)와 Cypress 대기 한 줄도 딸려 온다.
`system_console.ts` 충돌 두 곳은 문맥 충돌이라, upstream 문맥에 있던 두 줄을 빼고 받았다.

| 뺀 것 | 출처 (제외한 커밋) |
|---|---|
| `import BoardAttributes ...` | `076370e6` Board Attributes 화면 (property v2 계보) |
| `gotoNotificationsSettings()` | `b052f346` E2E fullyParallel 전면 개편 |

**왜 돌지 않나.** 제품 코드 결함이 아니라 테스트 기반이 포크와 어긋나서다.

1. **공통 장벽.** 두 스펙 모두 `channelsPage.toBeVisible()`로 시작한다. 이 헬퍼는
   `post_create.ts`에서 `getByTestId('post_textbox')`를 기다린다. 우리 입력창은 자체
   `9fae005295`(Lexical WYSIWYG 에디터 통합, #189)의 contenteditable이고 `id`만 내보낸다.
   같은 세션에 받은 `5bae85c9`(#37530, 교차 팀 검색 스펙)도 여기서 멈춘다.
2. **T1434는 전제가 다르다.** upstream은 textarea에 붙여넣은 HTML 표가 마크다운 텍스트
   (`| foo | bar |`)가 되는지 `toHaveValue`로 본다. 우리는
   `lexical_editor/plugins/markdown_paste_plugin.tsx`가 Lexical 표 노드로 바꾼다.
   contenteditable에는 value가 없다. testid를 달아도 이 스펙은 통과하지 못한다.
3. **T4023·T1987은 1만 넘으면 된다.** 제목 문구 차이가 두 번째 장벽이었는데 아래 복원으로
   풀었다. 원격 마켓플레이스에서 실제로 내려받으므로 인터넷이 필요하다.

**받은 이유.** Cypress 레이스 수정은 바로 유효하다. POM은 뒤따르는 upstream 이관 커밋의
토대다. 빼면 그 커밋들이 연쇄로 충돌한다.

**되살릴 때.** Lexical 에디터에 `data-testid`(`post_textbox`/`reply_textbox`)를 달고
`post_create.ts`의 입력 헬퍼를 contenteditable에 맞추는 별도 과제가 먼저다. T1434는 그
뒤에도 우리 붙여넣기 결과(Lexical 표)에 맞게 기대값을 다시 써야 한다.

### 분석 중 찾은 것 — db55f9fa43 문구 누락

`plugin_management.tsx`가 upstream과 리브랜드 외에 두 줄이 달랐다. 둘 다 upstream
`db55f9fa43`(MM-66653, i18n 추출을 mmjstool에서 @formatjs/cli로 이관, #34498)이 고친 줄이다.

| 키 | 우리 (수정 전) | upstream | 증상 |
|---|---|---|---|
| `admin.plugin.management.title` | `Management` | `Plugin Management` | 영문 제목이 사이드바 메뉴명과 다르다 |
| `admin.plugin.uploadAndPluginDisabledDesc` | `**Enable Plugins**` | `<strong>` + `strong` 렌더러 | 영문 화면에 별표가 그대로 보인다. ko.json은 이미 `<strong>`을 써서 렌더러 부재로 태그가 깨진다 |

`ad603577`로 두 줄을 upstream 형태로 되돌렸다. 키는 그대로라 ko.json은 건드리지 않았다.

**제외한 것을 되살린 것인가 — 아니다.** db55f9fa43은 제외 부록에 없다. 자체 spec
`specs/003-i18n-formatjs-migration`으로 재구현해 **반영됨**으로 차감됐다. 다만 그 spec은
범위를 도구 교체로 한정했다(`spec.md` "번역 내용(문구 자체의 의미) 변경을 목적으로 하지
않으며"). 그래서 upstream 커밋이 함께 고친 영문 문구 정합화가 넘어오지 않았다. 그 뒤
`f0c6b474ea`(en.json 재추출)가 소스 기준으로 en.json을 다시 만들면서 옛 문구가 en.json에도
굳었다. 이번 복원은 **spec 003이 범위에서 뺀 부분을 필요한 곳만 가져온 것**이다. 복원 커밋
본문은 `Upstream:`이 아닌 `Reference:`로 적어 ledger 차감에 끼지 않게 했다.

**같은 유형의 앞선 처리.**

| 커밋 | 처리 |
|---|---|
| `5c8daf5dba` | SSO 체험판 카드 문구 복원 |
| `93ff1a8877` | `setIntl`/`IntlCapture` 복원 (문구가 아닌 코드 누락) |
| `684c8fc154` | 복원하지 않고 스냅샷을 우리 문구에 맞춤 ("Enable Group Mention" 등) |
| `5db785e538` | 복원하지 않고 e2e 정규식을 관용화 (채널 헤더 placeholder) |

**남은 과제.** db55f9fa43은 232파일짜리다. 다른 파일에도 같은 누락이 남았을 수 있다.
upstream이 이 커밋에서 바꾼 `defaultMessage` 중 우리 소스에 옛 값으로 남은 것을 전수
점검하는 일은 sync 범위 밖의 별도 과제다. 점검 출발점:
`git show db55f9fa43 -- 'webapp/channels/src/**/*.tsx' | grep "^-.*defaultMessage"`로 옛 값을
뽑아 우리 트리에서 `git grep -F`한다. 복원 시에는 en.json 값을 함께 바꾸고, ko.json 번역이
새 영문과 맞는지 본다.

---

## 팀 ABAC 멤버십 — 120파일을 받으며 7곳을 우리 트리에 맞췄다

**무엇을 했나.** upstream `3a820143`(MM-69100, #37054)은 팀 ABAC의 멤버 동기화 잡과
최종 사용자 화면(팀 설정 멤버십 탭, 초대 모달 안내, 디렉터리 추천 배지, 시스템 콘솔 팀별
정책 패널, 동기화 잡 상세)을 넣는다. 120파일 +11444/-585이고 DB 마이그레이션은 없다.
뿌리 `46417611`(팀 ABAC 백엔드)을 `cd7d9c322b`로 이미 adapt했으므로 같은 계보로 받았다.

**비활성 조건.** `46417611`과 같다. 정책 평가 엔진이 비공개 모듈
`github.com/mattermost/enterprise/access_control`에만 있고, 팀 ABAC 표면 전체가
`TeamMembershipAccessControlEnabled()` 3중 게이트(기능 스위치 기본 false, Enterprise Advanced
라이선스, `EnableAttributeBasedAccessControl`) 뒤에 있다. ledger 비공개 모듈 표에 기록했다.

**게이트 밖에서 모든 사용자에게 바뀐 것.**

| 화면 | 전 | 후 |
|---|---|---|
| 팀 설정 → 접근 탭 | "이 서버 계정이 있는 누구나 가입 허용" 체크박스 | "공개 팀 / 비공개 팀" 카드(`PublicPrivateSelector`). 저장 값은 그대로 `allow_open_invite` |
| 같은 탭의 허용 도메인 | 항상 표시 | 그룹 동기화 팀에서는 숨김 |
| 설정 모달 저장 버튼(`widgets/modals/components/save_changes_panel.tsx`) | 즉시 반응 | 저장 중 스피너, 중복 클릭 방지 |

### 우리 트리에 맞춘 7곳

| # | 위치 | upstream | 우리 | 이유 |
|---|---|---|---|---|
| 1 | `server/channels/api4/job.go` | policy_id 잡 필터 조건에 `JobTypeAccessControlTeamSync` 추가(2줄) | **버림** | 대상 블록이 우리에게 없다 — 아래 절 참조 |
| 2 | `server/public/model/post.go` | 상수 블록에 새 타입 2개 + `PostTypeCard` | 새 타입 2개만 | `PostTypeCard`는 우리 트리에 없는 상수 |
| 3 | import 6곳(`team_details.tsx`, `team_level_access_rules.tsx`(+test), `team_membership_tab.tsx`(+test), `policy_details.tsx`) | `@mattermost/types/properties_user` | `@mattermost/types/properties` | 그 파일은 제외한 `076370e6`(Board Attributes, property v2 계보)이 만든다. 같은 `UserPropertyField` 타입이 우리 쪽에 있다 |
| 4 | 테스트 픽스처 2곳(`team_level_access_rules.test.tsx`, `team_membership_tab.test.tsx`) | `created_by`, `updated_by`, `object_type` 필드 | 세 필드 삭제 | property v2 필드라 우리 `PropertyField` 타입에 없다(TS2353) |
| 5 | `team_settings/team_access_tab/open_invite.tsx` | `selected={... Constants.OPEN_CHANNEL ...}` | `as ChannelType` 형변환 | upstream은 제외한 `263b3c11`(MBE 채널 타입 옵션) 계보에서 선택기 prop을 `string`으로 넓혔다. 우리 선택기는 `ChannelType` |
| 6 | `searchable_sync_job_team_list.tsx`(신규) | `defaultMessage='No results for "{text}"'` | `'No results for {text}'` | 같은 id `more_channels.noMore`를 쓰는 우리 기존 두 파일(`searchable_channel_list.tsx`, `searchable_sync_job_channel_list.tsx`)이 따옴표 없는 옛 값이다. db55f9fa43 누락 유형이다(아래 "남은 과제") |
| 7 | `invitation_modal.test.tsx` | 기본 props `searchProfiles: jest.fn()` | `jest.fn().mockResolvedValue({data: []})` | 우리 `users_emails_input.tsx`는 자체 커밋 `968f9ee416`(채널 초대 시 초대 가능 멤버 보이게)로 `defaultOptions={true}`다. 마운트 때 빈 검색어로 디바운스 검색을 예약하고, `undefined`를 돌려주는 모의 객체가 upstream이 새로 넣은 비동기 테스트로 새어 `Cannot read properties of undefined (reading 'then')`로 실패했다. 제품 동작은 그대로 둔다 |

**i18n.** en.json 충돌 3곳은 소스 기준으로 풀었다. `general_tab.openInviteDesc`는 우리 소스
문구("When enabled…")를 유지했고(upstream en은 "When allowed…" — 역시 db55f9fa43 유형),
`select_team.private.icon`은 우리 값 "Private team"을 유지했다. upstream이 en에서 삭제한
`general_tab.openInviteText`·`openInviteTitle`은 ko.json에서도 지웠다(orphaned는 CI 차단).
새 키 약 70개는 번역이 없어 **게이트 밖 접근 탭 문구("Discoverability", "Public Team" 등)가
한국어 화면에 영어로 보인다** — 세션 마감 i18n 후속 목록으로 넘긴다.

### 잡 policy_id 필터 — 제외한 커밋에 섞여 있던 서버 코드

`3a820143`의 `api4/job.go` 변경은 이 한 줄이다.

```go
-	} else if policyID != "" && c.Params.JobType == model.JobTypeAccessControlSync {
+	} else if policyID != "" && (c.Params.JobType == model.JobTypeAccessControlSync || c.Params.JobType == model.JobTypeAccessControlTeamSync) {
```

고칠 블록(`GET /api/v4/jobs/type/{type}?policy_id=` — 시스템 관리자만 정책별로 잡 목록을 걸러
보는 23줄)을 들인 것은 upstream `b052f3463a`(E2E/Playwright: balance shard timing by enabling
fullyParallel in CI, #36054)다. 우리는 그 커밋을 "우리가 돌리지 않는 CI 샤딩 개편"으로 제외했는데,
그 안에 이 서버 기능과 테스트(`api4/job_test.go` +202, `app/job_test.go` +95)가 섞여 있었다.
[[sync-exclude-overbroad-bundled-commits]] 유형의 사례다.

**지금 영향.** 새 웹앱(`getJobsByType(..., policyId)`)이 `policy_id`를 보내도 우리 서버는 무시하고
그 타입의 잡을 거르지 않은 채 돌려준다. 채널 동기화 잡도 이미 같은 상태였다. 팀 ABAC이
비활성이라 사용자 영향은 없다.

**되살릴 때 — 체크리스트.** 팀 ABAC이나 채널 ABAC 동기화 잡 상세를 실제로 쓰게 되면:

1. `b052f3463a`의 `server/channels/api4/job.go` 변경(23줄)을 받는다 — `policyID := r.URL.Query().Get("policy_id")`
   와 `else if` 블록, `sort` import.
2. 같은 커밋의 `api4/job_test.go`·`app/job_test.go` 테스트를 받는다. `app.GetJobsByTypeAndData`는
   우리 트리에 있는지 먼저 확인한다.
3. 그 위에 이 절의 2줄(팀 동기화 타입 추가)을 얹는다.
4. `server/scripts/shard-split.js`는 CI 샤딩용이라 받지 않는다.

### 남은 과제 — `more_channels.noMore`

upstream은 세 파일 모두 `'No results for "{text}"'`(따옴표 포함)다. 우리는 두 기존 파일이 옛 값이라
새 파일도 거기에 맞췄다. 세 파일을 upstream 값으로 올리고 en.json을 함께 바꾸는 일은
"Playwright 이관 스펙" 절의 db55f9fa43 전수 점검 과제에 포함한다.

---

## 이메일 사용자 프로필 잠금 — 직위는 우리 것, 가입 화면은 우리 입력칸에 맞췄다

**무엇을 했나.** upstream `2851af05`(#37458)는 두 기능을 넣는다. (1) `TeamSettings.LockProfileFieldsForEmailUsers`
(`none` 기본 / `name_and_username` / `all`)로 이메일·비밀번호 사용자의 사용자명·이름(`all`이면 별명·직위·
프로필 사진까지)을 잠근다. 시스템 관리자와 `edit_other_users` 권한은 예외, 빈 이름은 한 번 채울 수 있다.
(2) 팀 이메일 초대에 받는 사람의 사용자명·이름·성을 미리 정해 두면(`MemberInvite.Profiles`) 가입 때
그 값이 적용된다. 68파일, DB 마이그레이션 없음.

**켜지는 조건.** 둘 다 `MinimumEnterpriseLicense`와 설정값(`none` 아님)이 필요하다. 시스템 콘솔 드롭다운도
Enterprise 미만에서 숨는다. 라이선스가 없으면 비활성이다.

**게이트 밖에서 바뀐 것.** 시스템 콘솔 → 사용자 상세에서 관리자가 이름·성을 편집할 수 있다. 초대 재발송 잡이
채널 없이 보낸 초대에서 실패하던 버그가 고쳐지고, 오류를 잡 상태에 남긴다. 초대 메일 코드는
`email.InviteEmailData` 구조체로 재구성됐다(동작 동일).

### 우리 트리에 맞춘 곳

| # | 위치 | upstream | 우리 | 이유 |
|---|---|---|---|---|
| 1 | `user_settings/general/user_settings_general.tsx` 직위 섹션 | 편집 가능한 직위 입력 + "관리자가 잠금" 분기 | **우리 조직 역할 읽기 전용 행 유지** | 자체 커밋 `d0074256e6`·`82797fe393`·`d95e975b71`이 직위·부서·직책을 팀 관리자 지정 값으로 바꾸고 편집을 없앴다. 잠글 편집칸이 애초에 없다. 서버의 `position` 잠금 검사(`CheckLockedProfileFields`)는 그대로 받았다 — API로 직위를 바꾸는 경로는 막힌다 |
| 2 | 같은 파일 import | `@mattermost/types/properties_user` | `@mattermost/types/properties` | 제외한 `076370e6` 계보. `supportsOptions` import도 쓰지 않아 뺐다 |
| 3 | `signup/signup.tsx` | 사용자명만 미리 채우고 잠금, 이름은 "…으로 가입합니다" 문구로만 표시 | **우리 이름(필수)·성 입력칸에 미리 지정된 값을 채우고 잠금** | 자체 커밋 `7bfd555b77`이 가입 화면에 이름(필수)·성(선택)·표시 이름(선택) 입력칸을 넣었다. 서버(`app/user.go` `CreateUserWithToken`)는 초대 토큰의 이름을 클라이언트 값보다 우선 적용하므로, 그대로 두면 "홍길동으로 가입합니다"라고 보여 주면서 이름을 다시 필수로 요구하고 입력값은 버려진다. 이름·성을 각각 따로 판단한다(하나만 지정되면 그 칸만 잠김). upstream의 안내 문구 줄은 그대로 둔다 |
| 4 | `signup.test.tsx` | "미리 지정된 사용자명이 이미 쓰이면 잘못된 초대 화면" 테스트 | 우리 필수 이름칸을 채우고 제출 | 채우지 않으면 제출 전 검증에서 멈춰 서버 오류 경로에 닿지 않는다. 우리 동작 확인 테스트 2건 추가 |
| 5 | `admin_console/system_user_detail/system_user_detail.tsx` | 주석 "select/multiselect/rank" | "select/multiselect" | 제외한 `017a7102`(rank 필드 타입). 코드는 upstream 그대로 |
| 6 | `docs/main/*.mdx` 3개 | 설정·초대·프로필 문서 갱신 | 버림 | 제외한 문서 사이트 계보(`1d3bbc63`) |

**i18n.** webapp 새 키 23개, server 새 키 15개, 삭제 키 없음. 게이트 밖 문구(사용자 상세의 이름·성 편집 등)는
번역 전까지 영어로 보인다 — 세션 마감 i18n 후속 목록으로 넘긴다.

**다시 볼 때.** upstream이 가입 화면에서 이름 입력을 받게 되거나, 우리가 조직 역할 체계를 바꿔 직위를 다시
사용자 편집으로 돌리면 1·3번을 재검토한다.

---

## ABAC 에디터 플러그인 공개 — 노출은 받고 Session Attributes 계보 셋을 버렸다

**무엇을 했나.** upstream `7bc3bbfd`(#37510)는 ABAC 정책 에디터 둘(`TableEditor`·`CELEditor`)을
`window.Components`에 노출해 플러그인이 쓰게 하고, 두 에디터의 네트워크 호출을 플러그인이 주입으로
갈아끼울 수 있게 한다. 8파일 +419/-16.

**받은 것.** 노출 경로 전체와 주입 훅 7개다.

| 받은 것 | 내용 |
|---|---|
| `plugins/access_control_editors.ts` (신규) | `AccessControlTableEditor`·`AccessControlCELEditor`를 `React.lazy`로 내보낸다 (monaco를 main 번들에서 분리) |
| `plugins/export.ts`·`export.test.ts` | 둘을 `window.Components`에 꽂고 타입 인터페이스에 올린다 |
| `TableEditorProps`·`CELEditorProps` | `export`로 승격 — 플러그인이 타입을 쓸 수 있게 |
| `TableEditorProps.actions.searchUsers?` | 내장 `TestResultsModal`의 사용자 검색을 주입으로 대체 (없으면 기존 redux thunk) |
| `CELEditorActions` (신규) + `actions?` prop | `checkExpression?`·`searchUsers?` 주입. 없으면 `Client4.checkAccessControlExpression`·redux thunk 폴백 |

주입은 전부 옵셔널 가드 폴백이라 **아무도 주입하지 않으면 동작이 이전과 같다.**

**왜 받았나.** 우리 포크는 같은 성격의 `window.Components` 노출을 두 번 받았다 —
`cb551237c5`(MBE Phase 12, 채널 모달 노출)와 `fa49f968f4`(MM-69782, 모달 id 공개). 둘 다
"노출은 받고 제외 계보에 묶인 부분만 떼낸다"는 방식이었고 이 커밋도 같은 틀에 맞는다. ledger가
"소비자 부재"로 제외한 MBE 8a/8b/8c(`263b3c11`·`9f7fdadc`·`c5bead3a`)는 배선 파일이
200~388줄 벌어져 손으로 재구성해야 했던 반면, 이 커밋의 주입 지점은 우리 파일에 제자리로 있었다 —
`cel_editor/editor.tsx`의 176·196·452행, `table_editor.tsx`의 556행.

**소비자는 없다.** upstream 전체 이력을 `git log -S`로 훑으면 `AccessControlTableEditor`·
`AccessControlCELEditor`가 이 커밋 하나에만 나온다. 의도된 소비자는 외부 플러그인이고 우리가
번들하는 플러그인 중 ABAC 정책을 편집하는 것은 없다. 즉 지금은 **쓰이지 않는 확장점**이다.

### 버린 셋

| # | 위치 | upstream | 우리 | 이유 |
|---|---|---|---|---|
| 1 | `cel_editor/editor.tsx` `buildCELSchemas` | `objectType === USER_OBJECT_TYPE` 판정을 `!attr.objectType || ...`로 완화 | 훅 자체를 버림 | 우리 `editor.tsx`에는 `buildCELSchemas`도 `CELUserAttribute` 타입도 없다. Monaco 자동완성 스키마를 `{user: ['attributes'], 'user.attributes': [...]}`로 인라인 구성한다. 그 함수를 넣은 것이 Session Attributes MVF(`684ddb32`, 제외) 계보다 |
| 2 | `table_editor.tsx` `isRowValueValid` | 충돌 해결 시 함께 끼어 오려 함 | 버림 | `OPERATOR_CONFIG[...].type === 'native_method'`와 `isValidYoungerThanDaysValue`에 의존한다. 둘 다 우리 `shared.tsx`에 없다 (native 필드 계보 미반영) |
| 3 | `table_editor_channel_admin.test.tsx` `TableEditor - attribute name collision across namespaces` describe | upstream 부모에 이미 있던 테스트 | 버림 | `UserPropertyField.object_type`과 `attrs.managed`로 user/session 동명 속성을 구분해 `user.session.region` 생성을 검증한다. 우리 `PropertyField`에 `object_type`이 없고 session 네임스페이스 자체가 없다 |

### 새로 쓴 파일

`cel_editor/editor.test.tsx`는 **우리에게 없던 파일**이다. upstream 부모의 42줄이 전부
`buildCELSchemas` 테스트였기 때문이다(그 함수가 우리에게 없으니 파일도 없었다). upstream 206줄에서
주입 테스트 5건만 담아 159줄로 새로 만들었다 — `buildCELSchemas` describe 4건
(`treats attributes without an object type`·`offers only user.attributes`·`adds the user.session
bucket`·`drops names with spaces`)은 제외했다.

### 테스트 mock 조정

`table_editor_channel_admin.test.tsx`의 새 describe에서 두 곳을 우리 타입에 맞췄다.

- import 경로 `@mattermost/types/properties_user` → `@mattermost/types/properties`
  (우리 트리에 `properties_user.ts`가 없다 — 제외한 `076370e6` 계보)
- mock에서 `created_by`·`updated_by`·`object_type` 제거 — 우리 `PropertyField`에 없는 필드다
- `fireEvent` import 불필요 (쓰던 describe를 3번에서 버렸다), `userEvent` 추가

### 공개 API 형태

노출하면 prop 타입이 플러그인 공개 API가 되므로 대조했다. `TableEditorProps`는 이 커밋이 넣는
`searchUsers` 한 줄 빼고 우리와 upstream이 **완전히 동일**하다. `CELEditorProps.userAttributes`는
우리가 `Array<{attribute, values}>`, upstream이 `CELUserAttribute[]`(`objectType?`·`isNative?`가
옵셔널로 더 붙음)인데 옵셔널이라 **구조적으로 호환**된다. 차이는 우리가 session·native 속성을
자동완성에 반영하지 않는 **동작 범위**뿐이다 — 플러그인이 그 두 필드를 채워 넘겨도 우리 에디터는
무시한다.

**다시 볼 때.** Session Attributes MVF(`684ddb32`)를 도입하면 1·3번과 새로 쓴 테스트 파일을
upstream 형태로 되돌린다. native 필드 계보를 받으면 2번의 `isRowValueValid`가 따라온다. 이 확장점을
쓸 플러그인을 우리가 만들게 되면 `CELEditorProps.userAttributes`의 동작 범위 차이를 먼저 메워야 한다.

---

## e2e 플레이크 안정화 — Scheduled Recaps 스펙 하나를 버렸다

**무엇을 했나.** upstream `10b780cb`(#37614)는 서로 무관한 플레이크 둘을 고친다. 5파일 +102/-5.

| 받은 것 | 내용 |
|---|---|
| `cypress/.../upload_files_spec.js` (+7/-5) | 포스트 이미지의 `src`를 읽기 전에 `.image-loading__container`가 사라질 때까지 기다리고 `src`에 `data:`가 없음을 단언한다. 로딩 중 data-URI 플레이스홀더가 실제 이미지와 `file thumbnail` aria-label을 공유해 `content-disposition` 없는 URI를 집던 플레이크 |
| `playwright/lib/src/index.ts` (+1) | `export type {ExtendedFixtures} from './test_fixture';` — 신규 fixture가 쓴다 |
| `playwright/specs/.../ai/ai_bridge_fixture.ts` (+93, 신규) | 서버측 AI bridge mock이 프로세스 전역이라 `PW_WORKERS > 1`에서 테스트가 서로를 덮어쓴다. 교차 프로세스 파일 락(`fs.open(path, 'wx')` 단일 원자적 생성)으로 직렬화하고, 락 대기 시간을 테스트 타임아웃에서 차감하지 않게 `testInfo.setTimeout`으로 보정한다. stale 회수 경로는 **의도적으로 없다** — 파일시스템 원시 연산으로 race-free하게 만들 수 없어서, 누수는 조용한 동시 접근이 아니라 4분 획득 타임아웃으로 드러난다 |
| `playwright/specs/.../ai/recaps.spec.ts` (+3/-1) | `{expect, test}`를 `./ai_bridge_fixture`에서 받도록 교체 |

**왜 받았나.** Cypress 수정은 우리 자체 영역에서 비롯된 플레이크다 — 그 플레이스홀더를 넣은 것이
우리가 반영한 `1344890707`(MM-69174 Fix most layout shift caused by images in posts, #37420)이고
`.image-loading__container`가 `webapp/channels/src/components/size_aware_image.tsx:431`에 있다.
AI bridge 락도 우리에게 유효하다 — 우리 `recaps.spec.ts`가 같은 전역 mock을 쓴다
(`setupRecapBridge` 25·99행, `pw.getAIBridgeMock` 73·156행).

### 버린 것

| 위치 | upstream | 우리 | 이유 |
|---|---|---|---|
| `playwright/specs/.../ai/recaps_scheduled.spec.ts` (+3/-1) | import를 `./ai_bridge_fixture`로 교체 | **파일 자체를 버림** | 그 스펙도, 그것이 import하는 `./recaps_helpers`도 우리 트리에 없다. `25f3a75c`([MM-67163] Scheduled Recaps, #35495)를 **보류성 제외**했기 때문이다 — 113파일 +12168, DB 마이그레이션 7개, 신규 권한 생성물 재생성, 게이트 밖 유출 둘(콘솔 설정 화면이 기능 스위치와 무관하게 노출, 기존 수동 요약에 한도 신설) |

merge-tree가 이 파일을 **modify/delete** 충돌로 냈다. "upstream 채택"으로 풀면 보류 제외한 기능의
스펙이 들어오고 그것이 import하는 `./recaps_helpers`가 없어 즉시 깨진다.

### `recaps.spec.ts`를 우리 형태로 유지했다

우리 파일은 **594줄 자체 버전**이고 upstream은 717줄이다. 차이는 헬퍼의 위치다 — 우리는
`setupRecapBridge`를 파일 안(469행)에 직접 정의하고, upstream은 `./recaps_helpers`에서
`createChannelWithManyPosts`·`createRecapAndWaitForStatus`·`createUnreadChannelFixture`·
`markAllCurrentChannelsRead`·`setupRecapBridge`·`waitForRecapStatus`·`waitForRecordedRequestCount`
일곱 개를 import한다. 그 헬퍼 파일이 우리에게 없으므로 import 교체는 `{expect, test}` 한 줄만
적용하고 `@mattermost/client`·`@mattermost/types/channels`·`PlaywrightExtended` 타입 import는
우리 것을 유지했다(import/order 규칙에 맞춰 `@mattermost/*` 그룹 뒤 빈 줄, 그다음 상대 경로).

### 우리 CI는 이 테스트를 돌리지 않는다

워크플로 실측 — 실제 브라우저 실행(`e2e-tests-ci.yml`·`e2e-fulltests-ci.yml`)은 Argo Events
트리거와 `workflow_dispatch`로만 돌고 PR에서 돌지 않는다. PR이 트리거하는 것은
`e2e-tests-check.yml`(경로 `e2e-tests/**`)뿐이고 이건 타입·린트 검사다. 따라서 이 반영의 실효는
CI 신호가 아니라 (1) 디버전스 감소 — 이 영역 후속 커밋의 충돌을 줄인다, (2) 로컬·수동 e2e
실행 시의 정확성이다. 같은 성격의 선례가 `097a9330` 항목("Playwright 이관 스펙 — 받았지만
우리 포크에서 돌지 않는다")이다.

### 검증 중 발견 — playwright tsc 기준선 수치가 잘못 쓰여 왔다

`@mattermost/playwright-lib`는 `package.json`의 `types: "dist/index.d.ts"`로 해석된다.
`lib/dist`는 **gitignore된 미추적 빌드 산출물**(`e2e-tests/playwright/.gitignore:15`)이라
로컬이 낡으면 `lib/src`의 변경이 타입 검사에 반영되지 않고 **오류가 대량으로 부풀려진다**.
낡은 dist로 재면 333건, `cd lib && npm run build` 후 재면 **10건**이다. 10건에 CI `check` 잡을
떨어뜨리는 `display_name_in_selector.spec.ts`의 `managed` 오류 2건이 포함돼 있어 이쪽이
CI와 일치하는 값이다.

**후속 작업 시 주의** — `e2e-tests/playwright`에서 tsc로 기준선을 잴 때는 반드시
`cd lib && npm run build`를 먼저 돌린다. 2026-10-02 이전 세션 보고에 적힌 "playwright tsc
기준선 333건"은 이 이유로 틀린 수치다(결론 자체는 영향 없음 — 접촉 파일 오류 0건은 동일).

**다시 볼 때.** 운영에서 AI Recaps(`EnableAIRecaps`)를 켜기로 해 `25f3a75c`를 반영하면
`recaps_scheduled.spec.ts`와 `recaps_helpers.ts`가 들어오고, 그때 이 커밋의 버린 hunk
(import 교체 한 줄)도 함께 적용한다. 그 시점에 우리 `recaps.spec.ts`의 인라인 헬퍼를
`recaps_helpers.ts`로 옮겨 upstream 형태에 맞출지도 함께 정한다.

---

## 포스트 편집 초안 버그 — 수정은 받았고 테스트는 Lexical 하네스에 막힌다

**무엇을 했나.** upstream `0fed2262`(#37658)는 기존 포스트를 편집할 때 공유
`AdvancedTextEditor`가 작성창과 같은 draft 저장 파이프라인을 타서, unmount / `beforeunload`에
`updateDraft`를 `show: true` + 서버 동기화로 호출해 **실제 채널/스레드 draft를 만들던 버그**를
고친다. 그 draft가 웹소켓으로 돌아와 drafts UI에 유령 항목으로 나타났다. `handleDraftChange`의
`options.show` 분기 앞에 편집 모드 가드를 넣어 편집 내용은 로컬(`edit_draft_*` 키)에만 저장한다.

**이 버그가 우리 트리에 실재했다.** 재현 조건 셋을 실측했다 — (1) 우리 `handleDraftChange`
(227–268행)에 `isInEditMode` 가드가 없었다, (2) `edit_post.tsx:39`가 공유 에디터에
`isInEditMode={true}`를 넘긴다, (3) `AllowSyncedDrafts`가 `server/public/model/config.go:488`에
있고 기본값이 `true`(1018행 `new(true)`)다.

**수정 전후 실측.** 프로덕션 훅을 넣고/빼며 `updateDraft` 호출 인자를 찍었다.

| 상태 | 호출 인자 | 테스트 |
|---|---|---|
| 훅 없음 | 키 `edit_draft_post_id_1`, `show: true`, 서버 upsert `true` | 실패 |
| 훅 적용 | 같은 키, `show: null`, upsert `null` | 통과 |

타이핑도 실제로 등록됐다(메시지 `"original message edited"`). 즉 수정이 정확히 그 경로를 막는다.

### 바꾼 것 — 테스트의 요소 조회 한 줄

upstream은 `screen.getByTestId('edit_textbox')`로 textbox를 찾는다. 우리
`lexical_text_editor.tsx`(244–249행)의 `ContentEditable`은 `id={id}`와 `data-placeholder`만
렌더하고 **`data-testid`를 달지 않는다**(upstream textarea는 둘 다 있었다).
`document.getElementById('edit_textbox')`로 바꿨다 — `AdvancedTextEditorTextboxIds.InEditMode`가
`'edit_textbox'`(`utils/constants.tsx:740`)이므로 id로는 찾을 수 있다.

### 남은 red — 파일 전체 실행에서 타임아웃

| 실행 방식 | 결과 |
|---|---|
| `jest -t "MM-69928"` 격리 | **통과** (206ms) |
| `jest advanced_text_editor.test.tsx` 전체 | **60초 타임아웃** (단언 실패가 아니라 `userEvent.type`이 멈춤) |

`jest.setTimeout(240000)`을 테스트 본문에 넣어도 60초에 걸린다(그 API는 현재 테스트에 적용되지
않는다). 느린 게 아니라 멈추는 것이다.

**원인은 이 파일의 기존 breakage다.** `advanced_text_editor.test.tsx`는 master에서 이미
**10건 실패 / 4건 통과**이고, 실패 전부가 같은 뿌리다 — 우리가 Lexical을 채택해
`getByTestId('post_textbox')`(214행)·`getByTestId('edit_textbox')`(242행)·
`getByPlaceholderText('Write to Test Channel')`(278·287·298·364·445·561행)로 요소를 찾는
upstream 테스트들이 깨졌다. 앞선 10개가 남긴 상태가 Lexical 타이핑을 멈추게 한다.
기준선 대비 테스트 결과 diff를 뜨면 **유일한 차이가 이 새 테스트 1건**이다.

**그대로 red로 두기로 했다** — 같은 뿌리로 깨진 10개 형제 테스트를 저장소가 skip하지 않고
red로 두고 있으므로 그 관행과 맞춘다. `it.skip`을 달면 10개와 처리가 달라져 일관성이 깨지고,
upstream 테스트를 우리가 끈 상태가 된다. webapp jest는 우리 PR CI에서 돌지 않으므로
(`test (channels shard N/4)` 잡이 과거 sync PR에서 전부 skipping) CI 신호에는 영향이 없다.

**다시 볼 때.** Lexical 테스트 하네스를 고치면(`ContentEditable`에 `data-testid`를 달거나
`placeholder` 속성을 실제로 렌더하도록) 이 파일의 11건이 한꺼번에 살아난다. 그 작업을 하면
이 테스트의 `document.getElementById` 조회도 upstream의 `getByTestId`로 되돌릴 수 있다.
우선순위를 매긴다면 `data-testid`를 추가하는 쪽이 11개 테스트를 되살리는 가장 짧은 경로다.

---

## discoverable 비공개 채널 가입 요청 UX — 59파일을 네 단계로, 제외 계보는 버렸다

**무엇을 했나.** upstream `99bc7bd8`(#37078)는 발견 가능한 비공개 채널의 가입 요청 UX 전체를
넣는다(59파일 +3957/-128, server 변경 0). 서버 절반은 `4820fc0a4d`(MM-68763 Discoverable
Private Channels — Server feature complete, #36580)로 이미 보유했고 webapp 쪽에는 타입과
웹소켓 이벤트 이름만 있어 **백엔드가 잠들어 있었다.** 이 커밋이 그 사이를 메운다.

**네 커밋으로 나눴다** — 한 커밋에 59파일을 몰지 않기 위해서다.

| 단계 | 내용 |
|---|---|
| 1/4 redux·platform | Client4 엔드포인트, 웹소켓 메시지, Channel/Config 타입, join request redux 계층(action types·actions·reducer·selectors·initial state·권한 상수) |
| 2/4 신규 컴포넌트 | RequestJoinChannelModal, PendingJoinRequests(RHS 승인·거절), 요청 수 동기화 둘(헤더·사이드바) |
| 3/4 기존 파일 배선 | Browse Channels·채널 스위처·사이드바·채널 헤더·멤버 RHS·새 채널 모달·설정 Info 탭, en.json 35키 |
| 4/4 e2e | Playwright 스펙 + Browse Channels 페이지 객체 |

**기능 플래그.** `FeatureFlags.DiscoverableChannels`는 **upstream도 기본 `false`**다
(`feature_flags.go` — `FEATURE_FLAG_REMOVAL: ... Remove this when the feature is GA`).
우리가 off로 바꾼 것이 아니다 — `d6fd658467`(MM-68762 Server data layer) 반영 때 그 값으로
들어왔고, 저장소에서 켜는 곳은 없다. 따라서 받아도 사용자에게 보이지 않는다.

### 버린 것 — 전부 제외 계보에 속한 부분

merge-tree는 7파일 충돌을 예측했지만 실제 cherry-pick은 **9파일**에서 충돌했고, 더 중요하게는
**59파일 중 30파일이 upstream 부모와 갈라져 있었다.** 충돌이 안 난 파일도 "텍스트로 합쳐졌다"는
뜻일 뿐이어서, `channel_settings_info_tab.tsx`에서는 auto-merge가 **정의 없는 참조**
(`isDMorGroupChannel`)를 들여왔다.

| # | 위치 | 버린 것 | 이유 |
|---|---|---|---|
| 1 | `new_channel_modal.tsx` (우리 -305줄) | upstream 앵커 `pluginOptions`·`showDefaultCategorySelector` 문맥 | MBE Phase 8a(`263b3c11`)·Managed Categories 제외. 삽입 코드 자체는 그 계보를 참조하지 않아(실측 0건) **토글을 type selector 직후에 배치**하는 것만 정하면 됐다. `Toggle` import 추가 |
| 2 | `channel_settings_info_tab.tsx` (-218줄, 충돌 8블록) | Managed Categories 절(`defaultCategoryName`·`managedCategoryName`·`server*`) | 그 필드가 우리에게 없다. deps 배열과 unsaved-changes 비교식에는 `discoverable`만 덧붙였다 |
| 3 | `searchable_channel_list.tsx` | upstream의 `<ChannelIcon channel={...}/>` | `components/channel_type_icon`이 우리에게 없다(MBE Phase 8b/8c 제외). 우리 `getChannelIconComponent` 팩토리를 유지했다 |
| 4 | `en.json` | `channel_settings.classification.*` 3키 | 이 커밋의 추가분이 아니라 **문맥 줄**이다 — 우리에게 없는 기존 upstream 키(MBE classification 제외). 받으면 죽은 i18n이 된다 |
| 5 | `new_channel_modal.scss` | `.new-channel-modal-classification` 블록(약 60줄) | 같은 이유(문맥 줄, 제외 계보). `.Input_subheading`·`.new-channel-modal-discoverable`만 받았다 |
| 6 | `channel_settings_modal.scss` | upstream의 `.Input_subheading { 0.75 }` | 선택자를 넓히고 투명도를 바꿔 **모달의 기존 부제 전부를 재스타일링**한다. 우리 `label.Input_subheading { 0.64 }`를 유지했고, 그 선택자도 신규 섹션의 `<label>`에 적용된다 |

### 직접 써넣은 것

- **`isDMorGroupChannel` 정의** — auto-merge가 참조만(`canManageDiscoverability`,
  `showDiscoverableToggle`) 들여왔다. upstream 부모는 `isDirect || isGroup`으로 파생하는데
  `isPrivate`·`isDirect`·`isGroup` 셋이 우리 파일에 없다(우리 -218줄의 일부). `channel.type`에서
  직접 계산하는 1줄로 넣었다.
- **`channel_header/index.ts`** — 우리 `getMyChannelAutotranslation` 이름(upstream은
  `isMyChannelAutotranslated`로 개명)과 우리 `showBotMessages` prop을 유지하고
  `getPendingJoinRequestsCount`·`hasPendingJoinRequests`만 더했다.
- **`channel_members_rhs`** — 우리 멤버 필터 props(`setMemberFilterUserIds`·`filterUserIds`)를
  유지하고 join request props를 더했다.
- **`searchable_channel_list.tsx`의 상단 `ariaLabel` 제거** — upstream이 아래쪽
  pending-request 인식 버전으로 대체하므로 중복 선언이 됐다(TS2451). upstream 버전의 else
  분기가 우리 기존 문자열과 글자까지 같다.

### 동작을 upstream에 맞춘 한 곳

`channel_settings_info_tab.tsx`의 `patchChannel` 호출을 **"변경된 필드만 전송"**으로 바꿨다.
우리는 4필드를 항상 통째로 보내고 있었고(우리 테스트가 그걸 고정), upstream 부모는 이미
선택적이었다. 이 커밋의 신규 테스트가 `toHaveBeenCalledWith('channel1', {discoverable: true})`와
`{header: 'New header text'}`로 payload 모양을 단언해서 통째 전송으로는 통과할 수 없다.
우리 테스트 기대값 2곳에서 변경되지 않은 `name` 필드를 제거했다.

### 검증

- webapp `tsc` **30건** (master 기준선 29) — **+1건**은 `channel_header.test.tsx`가 18→19로
  늘어난 것이다. upstream이 추가한 render 호출이 우리 필수 prop `showBotMessages`를 넘기지
  않는데, 이는 기존 18건과 **동일한 결함**이다(우리 포크가 required prop을 더하면서 테스트
  기본 props를 갱신하지 않았다). 이 커밋 범위 밖이라 그대로 두었다 — 기본 props에 한 줄
  더하면 19건이 한꺼번에 사라진다
- eslint 변경 파일 전체 **clean**
- jest 접촉 영역 21 스위트 **288개 전부 통과**(신규 리듀서 테스트 262줄·컴포넌트 테스트 314줄 포함)
- en.json 신규 38키·제거 0 → orphaned 없음, `i18n-check-empty` exit 0

### 남은 일

- **ko 번역 38키** — 전부 미번역이다(세션 마감 i18n 후속 목록)
- **플래그 켠 실주행 검증** — `MM_FEATUREFLAGS_DiscoverableChannels=true`로 서버를 띄우고
  요청→승인 흐름을 걸어봐야 신규 경로가 실제로 실행된다. e2e 스펙이
  `pw.skipIfFeatureFlagNotSet('DiscoverableChannels', true)`로 스스로 건너뛰므로 플래그를
  주지 않으면 아무것도 돌지 않는다. upstream도 e2e 기본 설정에서 플래그를 false로 두므로
  같은 방식이다
- **MBE 8a 묶음과의 관계** — ledger의 `263b3c11` 제외 기록이 "8a~12e를 한 묶음으로 spec
  전환해 재검토한다"고 예고해 두었고, 그 작업은 `new_channel_modal.tsx`를 다시 건드린다.
  이번에 토글을 type selector 직후에 둔 선택을 그때 재검토한다

**다시 볼 때.** MBE Phase 8a를 도입하면 1번(앵커)과 토글 배치를, Managed Categories를
도입하면 2·5번을, MBE 8b/8c를 도입하면 3번을, classification을 도입하면 4번을 되돌린다.
`FeatureFlags.DiscoverableChannels`를 켜기로 하면 그 시점에 실주행 검증을 한다.

---

## E2E testcontainers 스택 — 서버 이미지 가드를 더하고 워크플로는 버렸다

**upstream**: [`a8c2307b`](https://github.com/mattermost/mattermost/commit/a8c2307bee9bd60a3a0f72a658f32599b44cab0b)
(E2E/Playwright: Add testcontainers to playwright-lib, #37570)
**우리 커밋**: `252fa6dbd6` + `711f3cbd0e` (rebase 병합으로 SHA가 바뀐다 — 상단 upstream 링크로 찾는다)
**명세**: `specs/013-e2e-testcontainers-stack/`

84파일을 git 상태로 갈라 처리했다 — 신규 추가 56(충돌 0건), 우리가 upstream parent와
**동일한** 수정 19, **갈라진** 수정 7, 우리 트리에 없는 1. 앞의 75개는 upstream 그대로
받았고 갈라진 7개만 훅별로 판단했다.

대부분이 부딪히지 않은 이유는 upstream이 전체를 `PW_USE_TESTCONTAINERS`(기본 `false`)
안에 가뒀기 때문이다. 기존 `external` 모드 동작이 한 줄도 바뀌지 않는다.

### 1. 서버 이미지 가드 — 우리가 더한 유일한 코드

upstream `test_config.ts`는 이렇게 폴백한다.

```ts
this.serverImage = process.env.SERVER_IMAGE || MATTERMOST_SERVER_IMAGE;
// MATTERMOST_SERVER_IMAGE = 'mattermostdevelopment/mattermost-enterprise-edition:master'
```

그대로 두면 `SERVER_IMAGE` 없이 돌릴 때 **upstream 서버를 테스트한다**. 테스트는
초록인데 okrbest를 보지 않는다 — 가장 찾기 어려운 실패 양상이다. 그래서 대입부에서
던지도록 바꿨다(4줄 + 주석).

`lib/src/containers/default_images.ts`는 **바이트 단위로 upstream 그대로** 뒀다. 그 파일은
upstream이 이미지 버전을 올릴 때마다 충돌을 주는 자리라, 손대지 않으면 이후 sync가 공짜다.

**되돌릴 조건**: okrbest가 서버 이미지를 레지스트리에 발행하면, 그 이미지를 기본값으로
두는 upstream 형태(`||` 폴백)로 되돌린다.

### 2. 워크플로 미반영

`.github/workflows/e2e-tests-playwright-template.yml`의 upstream 훅(+21/-14)을 적용하지
않았다. 우리 파일이 **+471/-243**으로 갈라져 있고(`91de3d23` SEC-10179 adapt에서 워크플로
757줄 미반영), CODEOWNERS 보호 경로이며, 브라우저 테스트가 PR에서 돌지 않는다
(Argo Events·`workflow_dispatch` 전용). 적용해도 돌지 않는 코드를 넣고 갈라짐만 키운다.

**되돌릴 조건**: 원격 CI로 testcontainers 모드를 돌리기로 하면, 1번의 레지스트리 발행과
묶어서 워크플로를 함께 다룬다.

### 3. `post_height.spec.ts` — 훅 둘을 갈라 받았다

| 위치 | upstream | 우리 |
|---|---|---|
| ~36행 | `AllowedUntrustedInternalConnections`에 `${new URL(fileServerUrl).hostname}` 추가 | **받았다** (testcontainers 모드에 필요) |
| ~280행대 | `skipProjects: ['firefox']` + TODO | **우리 것 유지** — `['chrome','firefox','ipad']` + MM-67372 SVG DoS 근거 주석 |

280행대를 upstream 훅으로 덮으면 MM-67372 완화 조치의 skip 범위와 근거가 되돌아간다.

### 4. 그 밖에 우리 것을 지킨 자리

- **`lib/src/server/default_config.ts`** — upstream이 바꾸는 건 `ServiceSettings.SiteURL`
  **한 줄**(`baseURL` → `internalBaseURL`)뿐이다. 우리 피처 플래그(`IntegratedBoards: false`,
  `CJKSearch: false`, `MobileEphemeralMode: true`, `PermissionPolicies: true`)와
  `TeammateNameDisplay: 'nickname_full_name'`는 전부 그대로다. 그 한 줄은 설정 취향이
  아니라 기능이 요구하는 기계적 변경이고, `external` 모드에서는 두 값이 같아 동작이 안 바뀐다.
- **`lib/src/index.ts`** — upstream 추가분(+28줄)만 받고 우리가 제거한 export 5건
  (`WysiwygEditor`, `wysiwyg_helpers` 전체, `TextInputSetting`,
  `ensureAutotranslationPermissions`, `licenseTier`)은 되살리지 않았다. 되살리면 없는
  모듈을 export해 `tsc -b`가 깨진다.
- **`package.json`의 `tsc` 스크립트 순서** — 우리 `tsc -b && npm run tsc --workspaces`를
  유지했다(upstream은 역순). 이번 훅이 그 줄을 건드리지 않는다.
- **`package-lock.json`** — upstream 훅(+2589/-268)을 붙이지 않고 `npm install`로 재생성했다.

### 5. 서버 이미지 조달 — 우리만 쓰는 스크립트

`e2e-tests/playwright/script/build_server_image.sh`를 새로 넣었다. upstream에 없는 파일이다.
`server/build/Dockerfile`을 돌리는 데 함정이 넷 있어 손으로 반복하면 틀린다.

1. 빌드 컨텍스트의 `dist/server`·`dist/client`를 저장소가 만들어 주지 않는다
2. `MM_PACKAGE`의 `curl`은 빌드 컨테이너 안에서 돌아 `file://`이 통하지 않는다 → 로컬 HTTP
3. macOS BSD tar 산출물을 컨테이너의 GNU tar가 거부한다(`Member name contains '..'`, AppleDouble)
4. 최종 이미지가 distroless라 셸이 없어 `sh -c`로 검사할 수 없다

이미지는 **amd64**로 만든다. 호스트가 arm64여도 그렇다 — `mattermost_container.ts:80`과
`mmctl_container.ts:97`이 `.withPlatform('linux/amd64')`로 고정하기 때문이다. 그 두 파일은
후속 커밋(`fe9a36e8` rolling upgrade, `67c177a4` SSO 인프라)이 건드릴 자리라 고정을 풀지
않고 이미지를 맞췄다.

### 6. 곁다리로 고친 기존 결함 하나

`server/build/Dockerfile`의 `COPY dist/client/* /mattermost/client`가 와일드카드라
하위 디렉터리를 평탄화했다. `files/` 안 171개가 최상위로 쏟아져 `/static/files/...`가 전부
404가 된다. 와일드카드를 빼서 고쳤다(이미지의 `client/files/` 항목: 0개 → 172개).

okrbest 자체 추가 블록(upstream에 없는 14줄)의 결함이고, 저장소의 어떤 절차도
`server/build/dist`를 만들지 않아 실행된 적이 없어 드러나지 않았다.

### 남은 일

브라우저 스펙은 아직 통과하지 못한다. 막는 것이 둘 더 있고 **둘 다 이 커밋 범위 밖**이다.

- **웹앱 프로덕션 번들** — `@mattermost/shared`가 `parcel build --no-optimize`로 빌드돼
  `jsxDEV` 호출이 dist에 남는데(12파일), React 18.2의 프로덕션 JSX dev 런타임은
  `exports.jsxDEV = void 0`다. 프로덕션 번들에서 반드시 터지고 화면이 백지가 된다.
  `--no-optimize`를 빼고 다시 빌드하면 `jsxDEV`가 0파일이 되는 것까지 실험으로 확인했으나,
  제품 전체에 영향을 주므로 **별도 작업으로 넘긴다**. upstream도 같은 설정이지만 우리는
  보고하지 않고 자체 수정한다.
- **스펙 선택자 vs Lexical** — upstream 스펙이 `getByTestId('post_textbox')`를 찾는데 우리
  `lexical_text_editor.tsx:245-249`의 `ContentEditable`은 `id`와 `data-placeholder`만
  내보내고 `data-testid`가 없다. 의도된 포크 갈라짐이다.

**다시 볼 때.** 레지스트리 발행을 하면 1·2번을, 위 두 결함을 고치면 브라우저 스펙 판정을,
MM-67372를 재검토하면 3번을 다시 본다.

---

## 팀 ABAC 플래그 기본 활성 — 서버는 받고 충돌 두 곳은 버렸다

**upstream**: [`7130ae59`](https://github.com/mattermost/mattermost/commit/7130ae598f8291bd5d5e39473bd2df370b69c3d8)
(MM-70054 - Enable Team Membership ABAC feature flag by default, #37781)

`FeatureFlags.TeamMembershipAccessControl` 기본값을 `false`에서 `true`로 뒤집는다. 서버 쪽
세 파일(`feature_flags.go`, `team_membership_access_control_test.go`,
`team_membership_enforcement_test.go`)은 그대로 받았다. 충돌한 두 파일에서 upstream 몫을
버렸다.

### 버린 것

| 파일 | upstream 변경 | 우리 처리 | 이유 |
|---|---|---|---|
| `server/public/model/feature_flags_test.go` | 문맥에 딸려 온 `TestFeatureFlagsSetDefaults_PropertyFieldRank` | **버림** (팀 ABAC 테스트만 받음) | `PropertyFieldRank` 필드가 우리에게 없다. 제외한 property v2 계보(`48f2fd08` → `9f1fe90b`) 소산이다 — 위 "ABAC 플래그 기본 활성" 항목 3번과 같은 자리, **네 번째로 만났다** |
| `e2e-tests/playwright/lib/src/server/default_config.ts` | `TeamMembershipAccessControl: false → true` (1줄) | **우리 블록 유지** | 우리 FeatureFlags 블록에는 이 키가 아예 없다. upstream 재생성 블록과 갈라진 상태다 — 위 "Playwright e2e" 항목 4번. 이 한 줄을 받으려면 upstream 블록 전체(`AggregatePluginMetrics`, `ManagedChannelCategories`, `SessionAttributes`, `DiscoverableChannels`, `PropertyFieldRank` 등)가 딸려 온다 |

e2e 블록을 버려도 동작은 같다. 서버가 FeatureFlags를 런타임 읽기 전용으로 다루므로 e2e
기본 설정의 플래그 값은 서버 기본값을 바꾸지 못한다.

### 비활성 근거가 하나 줄었다

ledger의 비공개 모듈 부록(`46417611`, `3a820143`)은 팀 ABAC가 비활성인 근거로 **3중 게이트**
(`TeamMembershipAccessControlEnabled()`)를 든다. 이 커밋으로 그중 플래그가 기본 활성이 됐다.
남은 근거는 셋이다.

1. `MinimumEnterpriseAdvancedLicense` — EA 라이선스가 없으면 꺼진다
2. `AccessControlSettings.EnableAttributeBasedAccessControl` — 기본 `false`
3. 정책 엔진 `Channels().AccessControl`이 nil — 평가는 거부(fail-closed)로 끝나고
   (`team_directory_visibility.go`의 `evaluateTeamMembership`, `team.go`의 가입 게이트 403),
   정책 저장 경로도 막혀 정책이 걸린 팀이 생기지 않는다

**웹앱은 라이선스를 보지 않는다.** `selectors/general.ts`의 `isTeamMembershipAccessControlEnabled`는
ABAC 설정과 플래그만 확인한다. 관리자가 ABAC 설정을 켜면 팀 설정 모달에 팀 접근·멤버십 탭이
나타나지만 엔진이 없어 실제로 동작하지 않는다. 채널 ABAC도 같은 조건에서 같은 상태다.

### 되돌릴 조건

- property v2 계보를 도입하면 `PropertyFieldRank` 테스트를 되살린다.
- e2e `default_config.ts`의 FeatureFlags 블록을 우리 서버 기준으로 다시 생성할 때
  `TeamMembershipAccessControl: true`를 함께 넣는다.
- `AccessControlServiceInterface`를 자체 구현하면 웹앱 게이트에 라이선스 확인이 빠진 점을
  다시 본다.

---

## 플러그인 ABAC API — 표면은 전부 받고 제외 계보 셋을 걷어냈다

**upstream**: [`c7eff700`](https://github.com/mattermost/mattermost/commit/c7eff70026ee233a5163fde42f5082134e66b795)
(ABAC: plugin-keyed resource types, trusted plugin PAP/CEL APIs, and AuthZEN-style decision API, #37509)

17파일 +2995줄 중 15파일을 받았다. 플러그인 API 메서드 8개, 구현(`plugin_access_control.go`),
리소스 타입 레지스트리, `AccessDecision.IsNoPolicy()`, 서버 i18n 9키, 감사 이벤트 3개가
그대로 들어왔다. **기능은 비활성이다** — `pluginAccessControlAvailable()`이 정책 엔진
(`Channels().AccessControl`) nil에서 거짓을 돌려줘, 플러그인 호출은 전부 "사용 불가"로
끝난다. ledger 비공개 모듈 부록에 같은 해시로 올렸다.

### 버린 것과 바꾼 것

| 자리 | upstream | 우리 처리 | 이유 |
|---|---|---|---|
| `model/native_attributes.go`·테스트 | 네이티브 속성 select 옵션을 gob 안전 타입으로 교체 | **파일째 버림** | 우리에게 없는 파일이다. 제외한 ABAC 고유 속성 Phase 5(`84a554b2`) 소산 |
| `app/plugin_api.go` | ABAC 메서드 8개 + 문맥의 `Upsert/DeletePropertyValue*WithOptions` | **ABAC 메서드 8개(32줄)만** 붙임 | 문맥 메서드는 제외한 PSAv2 계보(`9f1fe90b`) 것 |
| `plugin/client_rpc_generated.go` | +248줄 | `go generate ./plugin`으로 **재생성** | 결과 diff가 upstream과 줄 단위로 같다 |
| `plugin_access_control_test.go` "subject build failure" | `model.AccessControlPropertyGroupName` 조회를 깨뜨림 | `CustomProfileAttributesPropertyGroupName`으로 교체 | 그 상수는 제외한 `9f1fe90b`에 있다. 우리 `BuildAccessControlSubject`는 CPA 그룹을 읽는다 |
| `plugin_access_control_gob_test.go` 하위 테스트 "fields autocomplete response including native attribute fields" | 네이티브 bool-select 옵션의 gob 회귀 검증 | **버림** | 검증 대상(네이티브 속성)이 없다. 나머지 gob 하위 테스트는 받았다 |
| `plugin_access_control_test.go` "autocomplete requires only a valid acting user" | 첫 페이지가 비어 있지 않음을 단언 | 성공 경로만 검사 | 비어 있지 않은 근거가 네이티브 속성 필드다 |

### 검증

- `go build ./...` 통과, `go generate ./plugin` 재실행해도 변경 없음
- `channels/app` 플러그인 ABAC 테스트 87개(하위 포함) 통과
- `sqlstore` `TestAccessControlPolicyStore`의 새 하위 테스트(`PluginPolicy`, `TypeImmutableOnSave`) 통과
- `public/model`, `public/plugin` 패키지 테스트 통과

### 되돌릴 조건

- ABAC 고유 속성 Phase 5(`84a554b2`)를 도입하면 `native_attributes.go`의 gob 수정과 버린
  하위 테스트·단언 둘을 되살린다.
- property v2 계보(`9f1fe90b`)를 도입하면 테스트 상수를 upstream 것으로 되돌린다.
- `AccessControlServiceInterface`를 자체 구현하면 이 API가 바로 켜진다. 그때 플러그인 리소스
  타입 접두어 검사와 404 통합 동작을 실주행으로 확인한다.

## UserStore.Get request context 이관 — board.go 1줄을 못 받았다

**upstream**: [`9f0ae6a2`](https://github.com/mattermost/mattermost/commit/9f0ae6a220f5da8f4303ee80f2237f395ff9bed4)
([MM-70222] Migrate UserStore Get to request context, #37646) + 후속
[`523292f0`](https://github.com/mattermost/mattermost/commit/523292f0)(#37921, 남은 `"context"` import 제거)

`UserStore`의 `Get`·`PromoteGuestToUser`·`DemoteUserToGuest` 첫 인자를 `request.CTX`로 바꾸는
기계적 이관이다. 56파일 중 55파일을 그대로 받았다. 우리 고유 호출처는 없다 — 패턴 검색에
걸린 9파일은 같은 이름의 App·Client 메서드였고, 컴파일러로도 확인했다.

### 못 받은 것

| 자리 | upstream 변경 | 우리 처리 | 이유 |
|---|---|---|---|
| `server/channels/app/board.go` `CreateBoardChannel` | `User().Get(rctx.Context(), channel.CreatorId)` → `User().Get(rctx, channel.CreatorId)` | **파일째 없음** (modify/delete) | 파일이 제외한 Integrated Boards 계보 `323841e9`(#35887, board channel types BO/BP)의 소산이다. 뿌리 `48f2fd08` 제외 사유는 ledger 부록 — 우리는 자체 Boards 플러그인을 쓴다 |

### 같이 알아 둘 것

- **두 커밋은 짝이다.** `9f0ae6a2`만 적용하면 `mocks/UserStore.go`의 `"context" imported and not used`로
  빌드가 깨진다. upstream도 두 PR 사이 같은 상태였다. 우리 이력에서도 `[MM-70222]` 커밋은 단독으로
  빌드되지 않고 바로 다음 커밋(523292f0 반영분)에서 복구된다 — `git bisect` 때 이 커밋은 건너뛴다.
- **DB 라우팅이 조금 달라졌다.** 예전 호출처 46곳이 `context.Background()`(→ replica)를 넘겼는데
  이제 요청 rctx를 넘긴다. rctx에 `RequestContextWithMaster` 표시가 있으면 사용자 조회가 master로
  간다. 더 최신 데이터를 읽는 쪽이라 정확성 위험은 없고, read replica 환경에서 부하가 조금
  옮겨갈 수 있다. upstream과 같은 동작이다.

### 검증

- `9f0ae6a2`+`523292f0` 적용 후 `go build ./...`, `go vet ./channels/... ./platform/... ./cmd/...` 통과
- `make store-layers`·`make store-mocks` 재생성 결과 diff 0
- user·team store(PostgreSQL), sharedchannel, app(Promote·Demote·GetUser·UpdateUser·CreateUser·팀
  합류·초대·SharedChannel·지속 알림), api4(Promote·Demote·GetUser·PatchUser·UpdateUserRoles) 통과.
  localcachelayer `TestRoleStore/BackfillSchemeId` 실패는 master 기준선과 같다

### 되돌릴 조건

- Integrated Boards 계보(`48f2fd08` → `323841e9`)를 도입하면, `board.go`를 받는 자리에서
  `CreateBoardChannel`의 `User().Get` 인자를 `rctx`로 맞춘다. 맞추지 않으면 컴파일 오류로 바로 드러난다.

## ABAC 편집기 아포스트로피 값 — 우리 패턴 7개만 고쳤다

**upstream**: [`7a06c7ae`](https://github.com/mattermost/mattermost/commit/7a06c7ae5263a37e4916149b029619f1d7fd4b67)
([MM-64357] Fix ABAC policy editor unable to switch back to Simple Mode when a value contains an apostrophe, #37819)

**버그는 우리에게도 있었다.** 우리 `celStringLiteral`(`table_editor.tsx`)이 값을 `"Matt's Department"`처럼
큰따옴표로 감싸 내보내는데, `isSimpleCondition`·`isMultiselectOrGroup`의 `['"][^'"]*['"]`가 값 안의
`'`에서 문자열을 끊어 복잡한 식으로 분류했다. 그래서 Advanced → Simple 전환이 막혔다. 수정 전
아포스트로피 테스트 13개가 실패하는 것을 확인한 뒤 고쳤다.

### 버린 것과 바꾼 것

| 자리 | upstream | 우리 처리 | 이유 |
|---|---|---|---|
| `editors/shared.tsx` 판정 패턴 | `user.(attributes\|session)` 6개 + rank 연산자 `>= <= > <` + 네이티브 속성 6개(`verified`·`isbot`·`email`·`createat`) | **`user.attributes` 6개 + multiselect 1개만** `CEL_STRING`·`CEL_STRING_LIST`로 다시 씀 | 우리 `shared.tsx`가 그 이전 형태다. session은 제외한 `684ddb32`, rank는 `017a7102`, 네이티브는 `84a554b2` 계보 |
| `shared.tsx` 충돌 문맥 | `isRankOperator`·`isNativeMethodOperator`·`isNativeField`·`hasControlledAttributeValues`·`celPathFor` 등 | **버림** | 같은 제외 계보의 헬퍼다. 이 커밋의 수정 대상이 아니다 |
| `table_editor.test.tsx` | 'ranked comparison operators…', 'session attribute equality…', 'native email equality…' | **버림** | 검증 대상 패턴이 우리에게 없다 |
| `table_editor.test.tsx` in-list 경계 단언 3줄 | `user.email in [...]` | `user.attributes.email in [...]`로 바꿈 | 검증하려는 것은 리스트 파싱 규칙(닫히지 않은 문자열, 이스케이프 안 된 큰따옴표)이다. `user.email` 그대로면 우리 쪽에서는 늘 거짓이라 아무것도 검증하지 못한다 |
| `permission_policy_details.test.tsx` | `userEvent` 사용(import는 앞선 upstream 커밋에 있음) | import 한 줄 추가 | 우리 파일엔 그 import가 없었다 |

### 검증

- 수정 전 RED 13개 → 수정 후 access_control·permission_policies·channel_settings_modal·team_settings jest 553개 통과
- eslint 통과

### 되돌릴 조건

- rank(`017a7102`)·Session Attributes(`684ddb32`)·ABAC 고유 속성 Phase 5(`84a554b2`) 계보를 들이면
  `SIMPLE_CONDITION_PATTERNS`에 upstream의 나머지 패턴을 같은 `CEL_STRING` 형태로 더하고, 버린 테스트
  셋과 원래 `user.email` 단언을 되살린다. 같은 파일의 앞선 기록(`469e1e26`, 랭크 연산자 테스트 넷)과
  함께 처리한다.
---

## spec 014 — Slack 디자인 벤치마킹 (포크 자체 기능, 2026-10-06)

adapt 커밋이 아니라 포크 고유 설계 변경이다. upstream 파일을 인라인으로 고친
지점이 있어 후속 sync 충돌에 대비해 적는다. 정본 명세는
`specs/014-slack-design-benchmark/`.

### 인라인으로 고친 upstream 파일

| 파일 | 바꾼 것 | sync 충돌 시 지킬 것 |
|---|---|---|
| `mattermost-redux/constants/preferences.ts` | `slate` 프리셋 추가(첫 항목), 기존 5종의 활성 반전 짝·의미색 교정 | 색 값은 `theme_presets_contrast.test.ts`·`theme_slate.test.ts`가 고정한다. upstream이 값을 되돌리면 테스트가 깨진다 |
| `mattermost-redux/selectors/entities/preferences.ts` | `ThemeKey`·`ThemeType`에 slate, 기본 폴백 denim→slate (L181 부근) | 폴백은 slate 유지 |
| `mattermost-redux/utils/theme_utils.ts` | `themeTypeMap`에 `Slate: 'slate'` | 매핑 유지 |
| `sass/layout/_sidebar-left.scss` | ① 글자 알파 0.64 → 불투명 12곳 ② 활성 항목 완전 반전(배경=active-border, 글자=active-color)·8% 알파 배경과 좌측 4px 바 제거 ③ 폭 `clamp(180px, 19vw, 440px)`·단계식 max-width 통합 ④ 채널명 15px ⑤ Open Sans 스택에 Noto 추가 | 반전·폭 정책이 핵심. upstream이 활성 스타일을 고치면 반전 쪽을 유지 |
| `sass/layout/_headers.scss` | 채널 제목 16/600/16 → 18/900/24, 토픽 12→13px | — |
| `sass/components/_post.scss` | 작성자 이름 600→900 | — |
| `sass/base/_typography.scss` | 폰트 스택에 Noto Sans KR, `@font-face` 5종 추가(Metropolis Black 900, Open Sans 800→900 슬롯, Noto 400/600/900) | — |
| `sass/base/_css_variables.scss` | FOUC 정적 폴백을 slate 값으로 | applyTheme 이전 첫 페인트 색. slate와 함께 움직인다 |
| `components/global_header/global_header.tsx` | 글자 `rgba(sidebar-text, 0.64)` → `var(--sidebar-header-text-color)` | — |
| `components/lexical_editor/lexical_text_editor.scss` | 작성창 14→15px | — |
| `components/{drafts,threading,recaps_link}` SCSS | 사이드바 계열 글자 알파 제거, drafts 활성 뱃지 색 반전 추종 | — |
| `components/admin_console/admin_definition.tsx` + `i18n/{en,ko}.json` | DefaultTheme 드롭다운에 slate 옵션 | i18n 키 `admin.experimental.defaultTheme.options.slate` |
| `components/new_search/new_search.tsx` | 헤더 검색 글자 알파 0.64/0.88 → 불투명 `var(--sidebar-text)` | SC-001 교정 (3.04 → 6.87) |

### 포크 전용 신설 (sync 충돌 없음)

- `sass/okrbest/_overrides.scss` — 포크 스타일 레이어. `styles.scss` **마지막**
  import를 유지해야 한다. 모션 토큰(`--okr-anim-*`), 모달 마감, 활성 보조 규칙,
  본문 15px 기준이 들어 있다.
- `mattermost-redux/utils/wcag_contrast.ts` — 대비 회귀 테스트용 헬퍼.
- 폰트 7파일 (`fonts/README.md`에 라이선스 고지).

### 되돌릴 조건

없다 — 이 차이는 포크의 디자인 정체성이다. upstream이 자체적으로 테마 모델을
바꾸면(예: 활성 배경 필드 신설) R3의 재해석(active-border=배경)을 그 모델로
옮기고 반전 테스트를 유지한다.

---

## spec 015 — 읽지 않은 항목 모아보기 (포크 자체 기능, 2026-10-07)

Slack Unreads 벤치마크 전용 화면. 정본 명세는 `specs/015-unreads-view/`.
신규 코드는 디렉터리 2곳에 격리했고, upstream 파일 수정은 아래 7곳의
삽입뿐이다 (contracts/ui-contract.md §5).

### 인라인으로 고친 upstream 파일

| 파일 | 바꾼 것 | sync 충돌 시 지킬 것 |
|---|---|---|
| `components/channel_layout/center_channel/center_channel.tsx` | `/:team/unreads` Route + UnreadsView lazy 선언 삽입 | Route는 recaps 아래, Redirect 위 |
| `components/root/root.tsx` | `doesRouteBelongToTeamControllerRoutes` 정규식에 `unreads` | `root.test.tsx`의 unreads 케이스가 고정한다 |
| `components/sidebar/sidebar_list/sidebar_list.tsx` | static 영역 최상단에 `<UnreadsLink/>` 삽입 | 순서: Unreads → Threads → Drafts. 스냅샷 갱신됨 |
| `types/store/lhs.ts` + `selectors/lhs.ts` | `LhsPage.Unreads`, `getVisibleStaticPages`에 unreads 상시 항목 | id `unreads`는 URL 세그먼트와 일치해야 Alt+↑/↓ 이동이 동작 |
| `components/unreads_status_handler/` | `inUnreads` 분기 — 탭 제목 `unreads.title` | — |
| `components/mobile_channel_header/` | `inUnreads` 분기 — 모바일 제목 | — |
| `components/sidebar/sidebar_mentions_link·sidebar_saved_posts_link` (포크 커스텀) | `matchPath`를 `(threads\|drafts\|unreads)`로 | 이 두 파일 자체가 포크 전용 |

### 포크 전용 신설 (sync 충돌 없음)

- `components/unreads_view/` — 화면 본체(스냅샷 훅·그룹 카드·배너·테스트).
  `PostList`를 쓰지 않는다 — 마운트 자동 `markChannelAsRead` 때문(FR-007).
- `components/sidebar/unreads_link/` — 사이드바 메뉴.
- `sass/okrbest/_overrides.scss`에 `.SidebarUnreads` 활성 아이콘 규칙 1곳 추가.
- i18n `unreads.*` 키 14쌍 (en/ko).

### 되돌릴 조건

upstream이 자체 Unreads 전역 뷰를 도입하면 이 화면과 비교해 흡수·대체를
결정한다. 그 전에는 유지.

---

## 프로필 버튼 사이드바 하단 이동 (포크 자체 커스텀, 2026-10-07 — #175 계열)

Slack 벤치마크: 계정·상태 관리 버튼을 글로벌 헤더 우측 상단에서 채널 사이드바
좌측 하단으로 이동. 둥근 사각 아바타(32px, r6) + 레일색 링 상태 점, 메뉴는 위로.

| 파일 | 바꾼 것 | sync 충돌 시 지킬 것 |
|---|---|---|
| `components/global_header/right_controls/right_controls.tsx` | `<UserAccountMenu/>` 제거 (SettingsButton은 유지) | 헤더에 계정 버튼을 되살리지 않는다 |
| `components/user_account_menu/user_account_menu.tsx` | 선택 prop `openUp` — 메뉴 앵커를 위/왼쪽으로 뒤집는 분기 | prop 유지 |
| `components/sidebar/sidebar.tsx` | `<SidebarFooter/>` 삽입 (SidebarList 아래) | ~~삽입 유지~~ → 후속 커스텀에서 팀 레일 하단으로 재이동 (아래 항목) |

포크 전용 신설: `components/sidebar/sidebar_footer/`, `_overrides.scss`의
`.SidebarFooter` 블록. 참고: 온보딩 체크리스트 FAB(신규 사용자 한정, 해제 가능)가
좌측 하단에 떠서 일시적으로 겹칠 수 있다 — 온보딩 종료 시 사라지는 요소라 수용.

---

## 팀 레일 상시 표시 + 프로필 버튼 레일 하단 + 설정 메뉴 항목 (포크 자체 커스텀, 2026-10-07)

위 "프로필 버튼 사이드바 하단 이동" 항목의 후속 — 레일 상주 버튼 거치대 확보.

| 파일 | 바꾼 것 | sync 충돌 시 지킬 것 |
|---|---|---|
| `components/team_sidebar/team_sidebar.tsx` | `myTeams.length <= 1 → return null` 제거(레일 상시 표시, root에 multi-teams 상시 부여), Scrollbars 아래 `<SidebarFooter/>` 삽입 | 상시 표시·footer 유지. `team_sidebar.test.tsx`가 고정 |
| `components/sidebar/sidebar.tsx` | 직전 커스텀의 SidebarFooter 삽입을 제거(레일로 이동) | 채널 사이드바에 footer를 되살리지 않는다 |
| `components/global_header/right_controls/right_controls.tsx` | `SettingsButton` + CustomizeYourExperience 투어 블록 제거 | 설정 진입은 프로필 메뉴 항목이 대체. 온보딩 '경험 맞춤' 투어 단계는 앵커가 없어져 비표시 — 수용 |
| `components/user_account_menu/user_account_menu.tsx` | 프로필 항목 아래 `<UserAccountSettingsMenuItem/>` 삽입 | 항목 유지 |

포크 전용 신설: `user_account_settings_menuitem.tsx`(+테스트),
`team_sidebar.test.tsx`. i18n `userAccountMenu.settingsMenuItem.label` (en/ko).
참고: showTeamSidebar=false인 별도 product 화면에서는 레일이 숨어 프로필
버튼도 함께 숨는다 — channels 전용 포크라 수용.

---

## 상단 검색 바 폭 확대 (포크 자체 커스텀, 2026-10-07 — Slack 벤치마크)

Slack 실측(2873px 창에서 검색 바 1512px = 52.6vw) 기준. 변경 후 실측
1024/1280/1920 전부 52.0vw, 우측 컨트롤 겹침 없음.

| 파일 | 바꾼 것 | sync 충돌 시 지킬 것 |
|---|---|---|
| `components/global_header/center_controls/global_search_nav/global_search_nav.css` | `max-width: 432px` → `52vw` | 52vw 유지 |
| `components/global_header/left_controls/left_controls.tsx` | `flex-basis: 30%` → `flex: 0 0 auto` (사이드 영역 내용 폭) | 사이드가 빈 공간을 예약하면 검색 바가 못 넓어진다 |
| `components/global_header/right_controls/right_controls.tsx` | 동일 | 동일 |
| `components/new_search/new_search.tsx` | SearchBoxContainer에 `width: 52vw` 추가 (바닥 `min-width: 600px` 유지) — 검색 팝업을 바와 같은 폭으로 | 팝업 폭 = 바 폭. 실측: 1920에서 998px/998px, 좌우 오차 0 |

시각 치수 변경이라 단위 테스트 불가 — Playwright 실측이 판정 (원칙 III 사유).

---

## 채널 사이드바 표시/숨기기 토글 + 레일 호버 임시 공개 (포크 자체 커스텀, 2026-10-07)

사이드바 헤더의 "채널 둘러보기/만들기" 우측 토글로 채널 사이드바를 접는다.
기본은 펼침(숨기기 모드). 접힌 상태에서 팀 레일 호버 시 사이드바가 본문 위
오버레이(peek)로 임시 공개되고, 토글은 "표시" 모드로 고정 복귀를 맡는다.
상태는 사용자별 localStorage 보존.

| 파일 | 바꾼 것 | sync 충돌 시 지킬 것 |
|---|---|---|
| `utils/constants.tsx` | ActionTypes 2종(SET_CHANNEL_SIDEBAR_COLLAPSED/PEEK) | — |
| `types/store/lhs.ts`·`reducers/views/lhs.ts`(+기존 테스트 기대 보강)·`actions/views/lhs.ts`·`selectors/lhs.ts` | collapsed/peek 상태 배선. 접기 변경 시 peek 초기화 | 리듀서 테스트가 고정 |
| `components/sidebar/sidebar.tsx` + `index.ts` | 클래스 2종(channel-sidebar--hidden/--peek) + 마우스 enter/leave 핸들러 | peek 유지는 사이드바 자신 호버에도 걸린다 |
| `components/sidebar/sidebar_header/sidebar_header.tsx` | `<ChannelSidebarToggle/>` 삽입 (우측 끝) | — |
| `components/team_sidebar/team_sidebar.tsx` + `index.ts` | 레일 호버 핸들러(150ms 유예 + :hover 재확인으로 레일→사이드바 이동 허용) | 타이밍 가드 유지 |

포크 전용 신설: `components/sidebar/channel_sidebar_toggle/`(+테스트),
`_overrides.scss`의 토글·hidden(display:none — 센터 자연 확장)·peek
(.main-wrapper 기준 absolute — 공지 배너 유무와 무관하게 정렬) 블록.
i18n `sidebar.channelSidebarToggle.{hide,show}` (en/ko).
