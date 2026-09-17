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
