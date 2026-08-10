# upstream-master 미반영 커밋 목록

`HEAD`에 반영되지 않은 `upstream-master`(mattermost/mattermost) 커밋 목록 (오래된 순).
`/speckit-sync` 스킬이 이 목록을 갱신·소비한다. 반영 완료된 커밋은 목록에서 제거된다.

- 갱신일: 2026-08-10 22:38
- 기준: `git log HEAD..upstream-master` − 처리 완료(cherry-pick/adapt 커밋 본문의 upstream 참조, 하단 부록의 제외·spec 전환)
- 남은 커밋: 940개

**마지막 반영 커밋:** `c9a4092a` | [keeps plugin config on reenablement (#35545)](https://github.com/mattermost/mattermost/commit/c9a4092ac0a20351e3c2e0ac0cb593cc28b5bc0e) | 2026-03-12

| 커밋 해시 | 커밋 제목 | 커밋 일자 |
|---|---|---|
| ff2364b5 | [Multiple AI Recaps fixes (#35548)](https://github.com/mattermost/mattermost/commit/ff2364b56c6b7c9d48194eb80a1aeb1fbb6b3d87) | 2026-03-13 |
| 742e0be9 | [Validate RefreshedToken differs from original invite token (#34864)](https://github.com/mattermost/mattermost/commit/742e0be9507454a7e662668e1d9ec1b94b636e9b) | 2026-03-13 |
| e0fa9c78 | [Bumping prepackaged GitLab plugin version to v1.12.1 (#35595)](https://github.com/mattermost/mattermost/commit/e0fa9c78186fb83a84aeb4ce7dd3801bf8a214d3) | 2026-03-13 |
| a744a758 | [Fix an E2E test broken in #35499 (#35599)](https://github.com/mattermost/mattermost/commit/a744a758057e509b5268156adf4d3514928ff256) | 2026-03-13 |
| 33437b7e | [\[MM-67883\] Add "Open in new tab" button to Product Switcher menu items (#35560)](https://github.com/mattermost/mattermost/commit/33437b7ef6e4510a07ca041b64e832556f05ec31) | 2026-03-13 |
| 3e38cbc5 | [Add --workers flag to mmctl import process to control concurrency (#35582)](https://github.com/mattermost/mattermost/commit/3e38cbc5ca2230b513d12748d7def54075d5f3fc) | 2026-03-13 |
| 0b9c7330 | [Validate membership change channel_id matches sync message channel_id before processing (#34862)](https://github.com/mattermost/mattermost/commit/0b9c733011e625629ae3d5db20c48a46716abb4c) | 2026-03-13 |
| 0192d529 | [PermissionManageOauth removal impact (#35554)](https://github.com/mattermost/mattermost/commit/0192d529edbb95de3ad6d7a20b057ed33bc006c7) | 2026-03-15 |
| 9e73b9bb | [Update docs-impact-review.yml (#35589)](https://github.com/mattermost/mattermost/commit/9e73b9bb0cb998c5c88b664cc087776d848fd14f) | 2026-03-16 |
| 02b92666 | [Translations update from Mattermost Weblate (#35628)](https://github.com/mattermost/mattermost/commit/02b92666534086ce63c3b06387c9f51a712d286f) | 2026-03-16 |
| 39f7f4fd | [\[MM-67135\] show premade themes when custom themes are disabled (#35540)](https://github.com/mattermost/mattermost/commit/39f7f4fddfcf04b46588c0c26066252e88390258) | 2026-03-16 |
| 090408f0 | [\[MM-67809\] Check create post permission when editing posts (#35558)](https://github.com/mattermost/mattermost/commit/090408f09f53ffc9afc6c65c7c7c1fd3a8cd22f3) | 2026-03-16 |
| 7425c681 | [\[MM-67741\] Scope role_updated WS events to affected team/channel (#35497)](https://github.com/mattermost/mattermost/commit/7425c6817bf244f976c729f8a73cecac8039a1e1) | 2026-03-16 |
| 1db86973 | [\[MM-67514\] Fix crash when AppDownloadLink is set to a malformed URL (#35462)](https://github.com/mattermost/mattermost/commit/1db869731502cd7b42f71cd10df65a83f9e25118) | 2026-03-16 |
| 3a2cc5e2 | [ES search: include footer and author name in indexed fields.  (#35603)](https://github.com/mattermost/mattermost/commit/3a2cc5e242344d41715c9024a2d5e5251b8cd0e0) | 2026-03-16 |
| e39be2b7 | [Improves the Property System Architecture groups (#35395)](https://github.com/mattermost/mattermost/commit/e39be2b7e5210005804d0cdd177608ec4fc9ef93) | 2026-03-16 |
| f165e082 | [Bumping prepackaged Jira version to 4.6.0 (#35637)](https://github.com/mattermost/mattermost/commit/f165e08246735699c79a34d31f20cc8e90004d55) | 2026-03-17 |
| 17f2efd9 | [Translations update from Mattermost Weblate (#35645)](https://github.com/mattermost/mattermost/commit/17f2efd95c2027a08ce0b0729969a6e71c59d38e) | 2026-03-17 |
| bd6fe81b | [MM-67506: Angle brackets display as HTML entities in inline code blocks (#35219)](https://github.com/mattermost/mattermost/commit/bd6fe81b815ea44c3ba11ba79d40766ba36f65f3) | 2026-03-17 |
| 37028a79 | [\[MM-677967\] Send updated title template for popouts when state changes (#35635)](https://github.com/mattermost/mattermost/commit/37028a794d579c119713536879963167b258488d) | 2026-03-17 |
| b1034649 | [\[MM-67886\] Remove height cap on Feature Flags table in System Console (#35556)](https://github.com/mattermost/mattermost/commit/b10346496b4eb40ea06781ee2641c67ef7de198d) | 2026-03-18 |
| 9dacec36 | [\[MM-29973\] Adds E2E tests for `mmctl plugin disable` (#35464)](https://github.com/mattermost/mattermost/commit/9dacec36723b2d88a5700274c191df4775f5cdcd) | 2026-03-18 |
| 08f09274 | [mmctl: Add support for listing user roles through mmctl (#34064)](https://github.com/mattermost/mattermost/commit/08f09274e8d4d26caf09dc917e69268a6857a54b) | 2026-03-18 |
| 0a21b88f | [MM-55536 Support Inline image when image proxy is enabled (#31020)](https://github.com/mattermost/mattermost/commit/0a21b88f948e2701680e8c394775883a9fcbb762) | 2026-03-18 |
| 04baff8c | [Hyphenation (#30373)](https://github.com/mattermost/mattermost/commit/04baff8c8de8422285f5724f3d9b2a9b6297f273) | 2026-03-18 |
| 314ed375 | [Fix import failures for Japanese filenames with dakuten on macOS (#35204)](https://github.com/mattermost/mattermost/commit/314ed3756aa04be0e985bd5bd3d36f8fe95bfbc1) | 2026-03-18 |
| da62a280 | [Run i18n-extract (#35675)](https://github.com/mattermost/mattermost/commit/da62a280093e12004bd44eda4596cf2b9717ce32) | 2026-03-18 |
| 1dea4b13 | [Add unit tests for ScheduledPost model (#35565)](https://github.com/mattermost/mattermost/commit/1dea4b13781e54e02509f5e600ea84309d93f423) | 2026-03-18 |
| e9ae890a | [oauth check (#35553)](https://github.com/mattermost/mattermost/commit/e9ae890a013bb57989fcbdb548d8b7b86b240237) | 2026-03-18 |
| 0085d149 | [MM-67518 Increase amount that the post list is considered to be at the bottom (#35680)](https://github.com/mattermost/mattermost/commit/0085d14979ae7241e3c9459d6e457b3222c938ff) | 2026-03-18 |
| fee649d0 | [Run docs-impact-review as regular CI instead of slash command (#35620)](https://github.com/mattermost/mattermost/commit/fee649d06353948763d4fb09c6664fa942a82428) | 2026-03-19 |
| aea8cbdc | [Fix typos in webapp: receivedStatus and separately (#35254)](https://github.com/mattermost/mattermost/commit/aea8cbdc7a970a3c5e647682b05d4cbd7925e77a) | 2026-03-19 |
| b9aeb629 | [\[MM-67905\] Allow full Markdown rendering in message attachment footer (#35570)](https://github.com/mattermost/mattermost/commit/b9aeb629be642c2ba82d7992c7bfd769fa53700a) | 2026-03-19 |
| 76b8e3f5 | [\[MM-66838\] Update throttled library to v2.15.0 with Go modules support (#34657)](https://github.com/mattermost/mattermost/commit/76b8e3f5f78f70574439123065c491b0b63d71bb) | 2026-03-19 |
| ad03248c | [MM-67872 Fixing detection issue in image proxy (#35669)](https://github.com/mattermost/mattermost/commit/ad03248cd3fb2b2ce4568dbc49f2c6db10f0b520) | 2026-03-19 |
| 92533c44 | [Fix EXIF profile picture orientation bug (#34275) (#35594)](https://github.com/mattermost/mattermost/commit/92533c44c1a6abb25ef1b79993ac09e1dc87f746) | 2026-03-19 |
| d5fdc1f5 | [chore(i18n): add i18n-verify-translations script (#34917)](https://github.com/mattermost/mattermost/commit/d5fdc1f534ff01301a998116d14211901d9f9a80) | 2026-03-19 |
| 5af5b6df | [\[MM-67744\] Add -buildvcs=false to default GOFLAGS (#35587)](https://github.com/mattermost/mattermost/commit/5af5b6dfacd71a2ffbb8d5636f9f41af2b19d3bb) | 2026-03-20 |
| 8740152d | [MM-66944 Change PlatformService.IsLeader to always be true when license doesn't support clustering (#35577)](https://github.com/mattermost/mattermost/commit/8740152df7d95d88ce2079a1647819ad2621e65b) | 2026-03-20 |
| a357d4f0 | [ci: skip server CI for docs-only changes (#35719)](https://github.com/mattermost/mattermost/commit/a357d4f024408b4726dd47e8a690a73669088632) | 2026-03-20 |
| 4c25d03f | [Automate setup-go-work as a dependency for Make targets (#35476)](https://github.com/mattermost/mattermost/commit/4c25d03f67d851bb438e9585035267ba4e9815cf) | 2026-03-20 |
| 5f8c77a3 | [MM-67953 Changed sorting of channels in some places to prioritize display name matches (#35679)](https://github.com/mattermost/mattermost/commit/5f8c77a3efcc31260cde2d8e800577a2c4a18d68) | 2026-03-20 |
| e6b8e12f | [SEC-9862: Add CI check for test analysis (#35555)](https://github.com/mattermost/mattermost/commit/e6b8e12fb94e8d4ef45b3f0d765c00f8f7087fe7) | 2026-03-22 |
| b4163449 | [ci: cache prepackaged plugins in mmctl tests (#35720)](https://github.com/mattermost/mattermost/commit/b4163449319c422f462a845294808084d0c6b332) | 2026-03-22 |
| ae1691a3 | [fix(pr-analysis): on large diff and reduce gh pr calls (#35734)](https://github.com/mattermost/mattermost/commit/ae1691a3685d7ff4817593adab7741b4ce884784) | 2026-03-23 |
| 156bdc5f | [MM-67742 Fixing text color in marketplace banner (#35674)](https://github.com/mattermost/mattermost/commit/156bdc5fa64330b0e1b730b441941f1c07183e10) | 2026-03-23 |
| f0b2a36d | [MM-67616: Refactor shared channel membership sync to use ChannelMemberHistory (#35619)](https://github.com/mattermost/mattermost/commit/f0b2a36dbc4a9e8a5e5f6232ba51a1940e90fddf) | 2026-03-23 |
| 2ce50d7c | [MM-66742 - add BoR e2e tests (#34829)](https://github.com/mattermost/mattermost/commit/2ce50d7c8df2bfd137f91f18b881e79cc63ddd71) | 2026-03-23 |
| f04c3f00 | [Fix nil pointer dereference in UpdateUser (MATTERMOST-SERVER-VF) (#35717)](https://github.com/mattermost/mattermost/commit/f04c3f0071ee26a7fe86934e0e173cf4fd3e139a) | 2026-03-23 |
| a3cdef8b | [Fix docs-impact-review CI hitting max turns limit (#35744)](https://github.com/mattermost/mattermost/commit/a3cdef8b0f1b31c931895fbd5011a17fa6869afa) | 2026-03-23 |
| 7d26b7f3 | [Fix datepicker calendar overflow in AppsForm modal (#35437)](https://github.com/mattermost/mattermost/commit/7d26b7f3174649868b05569505dd5eaf02f93415) | 2026-03-24 |
| 43130d80 | [MM-67158 - fix overlap in post actions menu (#35415)](https://github.com/mattermost/mattermost/commit/43130d8085cdbb7ae098027b46b764ee22ae33e6) | 2026-03-24 |
| 4b1b3cee | [refactor(pdf_preview): migrate PDFPreview to function component (#33648)](https://github.com/mattermost/mattermost/commit/4b1b3cee69cc7db260352450eb57da310651f7a9) | 2026-03-24 |
| 8bfa1ff0 | [fix: allow substring matching when searching channel members (#35017)](https://github.com/mattermost/mattermost/commit/8bfa1ff09ff3d593cb7c98786d719d2bc42d3851) | 2026-03-25 |
| cc66081f | [Fix flaky test for makeGetProfilesInChannel (#35765)](https://github.com/mattermost/mattermost/commit/cc66081f6b6812a77158847d5270072313553287) | 2026-03-24 |
| 95e33dbc | [MM-63848: Enforce unique names for parent access control policies (#35676)](https://github.com/mattermost/mattermost/commit/95e33dbc7229a28d768ce1f5c4a14a673d0303a4) | 2026-03-25 |
| 7d6d834f | [MM-68016, MM-68017, MM-68018 Add plugin pre-hooks for membership and channel archive (#35731)](https://github.com/mattermost/mattermost/commit/7d6d834f1f4feea8ecbf2eedf505cc76cbe62998) | 2026-03-25 |
| 4f16a29c | [MM-67793: Remove dependency on blang/semver/v4 (#35742)](https://github.com/mattermost/mattermost/commit/4f16a29cb5e8bf4978763581602caa6012865091) | 2026-03-25 |
| 8de0b366 | [ MM-63056 Migrate thread menu to new component and minor a11y tweaks (#33401)](https://github.com/mattermost/mattermost/commit/8de0b36639641e1459f21142380fe8deb2749c03) | 2026-03-25 |
| b0c38bac | [Fix channel not found after creation on deployments with read replicas (#35728)](https://github.com/mattermost/mattermost/commit/b0c38bac0bab915a0b717c6dc356c9cd52b4f3b8) | 2026-03-25 |
| 85dcb8b9 | [MM-67944: Add shared channel integration test tool  (#35639)](https://github.com/mattermost/mattermost/commit/85dcb8b9e7e89977584922709b74e597139d5f23) | 2026-03-25 |
| e738016c | [\[MM-67143\] Fix for custom slash command response URL (#34922)](https://github.com/mattermost/mattermost/commit/e738016c592045e14bf926eafaeda6f8521def6d) | 2026-03-25 |
| 553e9948 | [Fix chevron toggle not working for edited post history title (#34797)](https://github.com/mattermost/mattermost/commit/553e9948f6c4500440c55e8c27a93ce9ebe52ad4) | 2026-03-26 |
| fb11968f | [\[MM-65701\] Fix for docextractor archive handling (#34983)](https://github.com/mattermost/mattermost/commit/fb11968f8798925c7b75711025bc5f991124ba26) | 2026-03-25 |
| 8f0f4239 | [\[MM-65627\] Add Channel popout window (#35596)](https://github.com/mattermost/mattermost/commit/8f0f4239eb60ca6024bb0c7ee7def5e41e618994) | 2026-03-25 |
| 8a17f508 | [MM-68071 Upgrade core-js and update target browsers for @babel/preset-env (#35764)](https://github.com/mattermost/mattermost/commit/8a17f508bee13524b2691b1376b2752fb2f45785) | 2026-03-25 |
| 58dd9e1b | [Add property system app layer architecture (#35157)](https://github.com/mattermost/mattermost/commit/58dd9e1bb415573e4ef4af5b4a4803df1f8ae367) | 2026-03-26 |
| c0dcaf2c | [MM-68021 H10-17 Enzyme to RTL bulk migration (#35735)](https://github.com/mattermost/mattermost/commit/c0dcaf2cd676971c3da7b16d805b8e8f5794002d) | 2026-03-27 |
| 51232b58 | [ci: shard server Postgres tests into 4 parallel runners (#35739)](https://github.com/mattermost/mattermost/commit/51232b58efa9b1199f53ae4059fd846080d466c7) | 2026-03-26 |
| fac92f4a | [Added FakeSetting for keys generation for support package (#35346)](https://github.com/mattermost/mattermost/commit/fac92f4a71f356009e27983a980f729f599e8ba5) | 2026-03-27 |
| 0d016195 | [updates buildserver go base image versions to 1.25.8 (#35811)](https://github.com/mattermost/mattermost/commit/0d01619585892efd40d7393aa404550d2901f505) | 2026-03-26 |
| 656a0248 | [Fix datetime MinDate/MaxDate validation and add sub-day relative patterns (#35327)](https://github.com/mattermost/mattermost/commit/656a0248ebcade5e5e88a7d5db99c138ed88ddd9) | 2026-03-27 |
| 7a339a64 | [MM-68001 - enforce X-Requested-With header validation on BoR reveal endpoint (#35793)](https://github.com/mattermost/mattermost/commit/7a339a6438f5a4a5feba6b8de887f17a1378b207) | 2026-03-27 |
| a6d1942f | [Fix issue where "Docs/Needed label is not getting added (#35794)](https://github.com/mattermost/mattermost/commit/a6d1942ff69ff3342023a6a2a63a960e16786905) | 2026-03-27 |
| adbe7365 | [MM-68022 Bulk migration H18-28 Enzyme to RTL (#35753)](https://github.com/mattermost/mattermost/commit/adbe736576422dbc421ed294aad21ebb7e8080a6) | 2026-03-27 |
| 48f2fd08 | [Merge the Integrated Boards MVP feature branch (#35796)](https://github.com/mattermost/mattermost/commit/48f2fd087339695673c9ab2f898ccf47007e6db8) | 2026-03-27 |
| 006f1027 | [Adds COALESCE guard for property fields before PSAv2 migrations (#35830)](https://github.com/mattermost/mattermost/commit/006f102768ca9bf2016521b3e5af78993f1776cf) | 2026-03-27 |
| 66894045 | [Allow Cursor bot to trigger docs impact review workflow (#35756)](https://github.com/mattermost/mattermost/commit/66894045e78b84de1687d46cc885bcd2c2c52497) | 2026-03-27 |
| a19cc4b9 | [improves time limit checks (#35638)](https://github.com/mattermost/mattermost/commit/a19cc4b90960f23851ceb5600eeaaa5dc2fb4714) | 2026-03-27 |
| dad9cab4 | [Add guards to avoid cards being created when the integrated boards feature flag is disabled (#35836)](https://github.com/mattermost/mattermost/commit/dad9cab48327b9638c37dd76a213984a23c19d68) | 2026-03-27 |
| d0128492 | [Fix docs-impact-review workflow to reliably post analysis comments (#35831)](https://github.com/mattermost/mattermost/commit/d012849219222eba532ad0ae54e1b2678eb0c9e6) | 2026-03-27 |
| 30837f7c | [move error back to logging warning...as caused breaking change (#35841)](https://github.com/mattermost/mattermost/commit/30837f7c4edc6a9293e719aba49c4eec50b6357f) | 2026-03-27 |
| 71fe83ae | [Add concurrentIndex vet rule and fix migrations (#35809)](https://github.com/mattermost/mattermost/commit/71fe83aea21a7dcb2d76b4b252041dd23e6e0647) | 2026-03-27 |
| fd2dd1c6 | [updated go to version 1.25.8 (#35817)](https://github.com/mattermost/mattermost/commit/fd2dd1c6188c3cf0f33462cad5b29c51d5830119) | 2026-03-27 |
| 36bc59c1 | [MM-67957 H2-H9 Enzyme to RTL bulk migration (#35670)](https://github.com/mattermost/mattermost/commit/36bc59c1b768d8ed001b904ee341ffdb9f6f69f3) | 2026-03-30 |
| 0278ad4d | [MM-66620 Fixing compact image attachment alignment (#35678)](https://github.com/mattermost/mattermost/commit/0278ad4d1a0f61884c140b0691c93a9ec31f7e25) | 2026-03-30 |
| ece6b956 | [Add single-channel guest count to support packet stats (#35846)](https://github.com/mattermost/mattermost/commit/ece6b956facb44cc4ab10e17ff15bbe5914a6aea) | 2026-03-30 |
| c81d0ddd | [Ability to E2E AI Bridge features + Initial Recaps E2E (#35541)](https://github.com/mattermost/mattermost/commit/c81d0ddd73d1f41c6ac2811cd9f8a6821f576b29) | 2026-03-30 |
| f7f2d944 | [upgrade golangci-lint (#35845)](https://github.com/mattermost/mattermost/commit/f7f2d944e80eae9131b8fd53d298e25bb53266d1) | 2026-03-30 |
| 9742dff9 | [MM-67518/MM-67762 Attempt to fix keep-at-bottom logic and scrolling when loading older posts (#35866)](https://github.com/mattermost/mattermost/commit/9742dff9d37ae41699bdce5ffdd658c610dd6431) | 2026-03-30 |
| 96e4d7a7 | [MM-68076 Chunk bulk INSERTs to respect PostgreSQL parameter limit (#35767)](https://github.com/mattermost/mattermost/commit/96e4d7a76902d98a41c7d15e7618ad4ed8015dbc) | 2026-03-30 |
| 4b8a4ae2 | [fix: resolve DATA RACE in TestReplicaLagQuery, TestInvalidReplicaLagDataSource, and TestMetrics (#35881)](https://github.com/mattermost/mattermost/commit/4b8a4ae2b35381a46b891f831518a731d6f9e313) | 2026-03-31 |
| 3e2c3f70 | [fix: prevent sql.DB connectionCleaner race and harden flaky tests (#35891)](https://github.com/mattermost/mattermost/commit/3e2c3f70c25b261a164595854ce8a8cb00247e3c) | 2026-03-31 |
| 2550ecd8 | [ci: post success to required e2e status contexts when no relevant changes (#35880)](https://github.com/mattermost/mattermost/commit/2550ecd87bd1ad1dbb1c21054958be3ee46da0c9) | 2026-04-01 |
| 47d2c607 | [Docs impact fixes (#35877)](https://github.com/mattermost/mattermost/commit/47d2c6074d61c2d7b4ecec2ddd58e3c024b36742) | 2026-04-01 |
| f4d1abe7 | [MM-68140: Validate post read access before rewrite thread context (#35864)](https://github.com/mattermost/mattermost/commit/f4d1abe7e8f545f1a87f463fa9fe451c731aebf8) | 2026-04-01 |
| d0012512 | [disable burn on read posts on shared channels (#35460)](https://github.com/mattermost/mattermost/commit/d00125121edc4053fc0fca666dc20a7eb78c9ca1) | 2026-04-01 |
| aaefd410 | [MM-68120 - Use repo checkout for build files in server-ci-artifacts (#35842)](https://github.com/mattermost/mattermost/commit/aaefd4109be344f8a7ce71e971cabb242b6d1e1c) | 2026-04-01 |
| eb8310a3 | [simplify CODEOWNERS (#35770)](https://github.com/mattermost/mattermost/commit/eb8310a30c416b721efbe42ed47c80d3d310b6ce) | 2026-04-01 |
| 4d20645a | [Inline mattermost-govet into the monorepo (#35869)](https://github.com/mattermost/mattermost/commit/4d20645a5bcfb72b832fc8cfdfbc838fef852bb1) | 2026-04-01 |
| 50f31ae8 | [Mm 66662 bump dependencies (#35849)](https://github.com/mattermost/mattermost/commit/50f31ae87cbd5ef34f65a21ba818c3157cdb31af) | 2026-04-01 |
| 9b01e406 | [Move password hashers from server/v8 to server/public to fix module layering violation (#35805)a](https://github.com/mattermost/mattermost/commit/9b01e406f4a6660347aec4e187be56902763d606) | 2026-04-01 |
| 596730c9 | [skip broken e2e test (#35926)](https://github.com/mattermost/mattermost/commit/596730c9b3a0c96064d105a8740362af542d03da) | 2026-04-02 |
| edd637c5 | [MM-68173 Add write-permission guard to AllowDownloadLogs toggle (#35915)](https://github.com/mattermost/mattermost/commit/edd637c5396a758e220d165f19e1ebd377e9959a) | 2026-04-02 |
| 5a73fb02 | [Translations update from Mattermost Weblate (#35890)](https://github.com/mattermost/mattermost/commit/5a73fb022d43195190ebf04808f8327ac283b461) | 2026-04-03 |
| 3888a694 | [MM-68158: Fix shared channel remote display and notify UI on invite completion (#35908)](https://github.com/mattermost/mattermost/commit/3888a694799793d52cd9ba7733582d8119df6274) | 2026-04-03 |
| 38e26fbd | [chore: fix typos in comments (#34960)](https://github.com/mattermost/mattermost/commit/38e26fbd2da2997f12d1a02435e37fad235c316a) | 2026-04-03 |
| 050e41f7 | [Doc line for new websocket event (#35939)](https://github.com/mattermost/mattermost/commit/050e41f7b7e144e260a7b3371702afb0b748ff4a) | 2026-04-03 |
| 24e38f2b | [Update server/public to v0.3.0 to avoid import cycle in v0.2.1 (#35946)](https://github.com/mattermost/mattermost/commit/24e38f2bd7f2e04aece54fbe77e7647403d1c6aa) | 2026-04-03 |
| f6d5d9e1 | [\[MM-67859\] Update license renewal and expiry email branding (#35701)](https://github.com/mattermost/mattermost/commit/f6d5d9e1bc7d90b0b0a7fcd2ea0d062eeac71096) | 2026-04-04 |
| 00b25946 | [MM-68156: Fix space key clearing input in invite modal (#35913)](https://github.com/mattermost/mattermost/commit/00b2594648cedbd505db0bbe9e7043b96f7c3d14) | 2026-04-05 |
| 2b45e43e | [MM-66627 (test): VH1-8 + EC Enzyme to RTL bulk migration (#35768)](https://github.com/mattermost/mattermost/commit/2b45e43e05046a78194869b59358acd19f7449dd) | 2026-04-06 |
| ad35eba6 | [Added nil checks (#35755)](https://github.com/mattermost/mattermost/commit/ad35eba60b5e2ac4dcbf7ab48c998255ca4f738d) | 2026-04-06 |
| 0ca124fa | [Fixed a bug where attachment-only post would send on enter when when set to only send on ctrl/cmd + enter (#35828)](https://github.com/mattermost/mattermost/commit/0ca124fa8fe66f5cf6d00714175e20cffca07a14) | 2026-04-06 |
| ca726867 | [MM-67743 Fixing styling issues in Browse Channels modal (#35772)](https://github.com/mattermost/mattermost/commit/ca726867663b6f1a43bb72ef1873ab759abefbd4) | 2026-04-06 |
| f68557c1 | [Fix Enterprise Advanced upsell messaging for Enterprise licenses (#35933)](https://github.com/mattermost/mattermost/commit/f68557c179385e1746267b2dbc68b5074008fc1d) | 2026-04-06 |
| e694e86d | [MM-68204: Use multi-level logging for shared channel and remote cluster service errors (#35949)](https://github.com/mattermost/mattermost/commit/e694e86d631b14ac357dd468a0813a0d482d56d7) | 2026-04-06 |
| 1c26ab94 | [test(enzyme migration): final bulk migration, removed enzyme dependencies and helpers (#35950)](https://github.com/mattermost/mattermost/commit/1c26ab9464882676634f4c47605bf311eb71e661) | 2026-04-07 |
| 6662021d | [Update latest minor version to 11.7.0 (#35964)](https://github.com/mattermost/mattermost/commit/6662021dd5afe4542a6dd167e9bbc4dcd7dc8e5b) | 2026-04-07 |
| 087b20d8 | [E2E \| Fix mock server response for translations (#35929)](https://github.com/mattermost/mattermost/commit/087b20d81c9ab2865cd2828e57c90a20cd83b5de) | 2026-04-07 |
| 252eb966 | [Update docs-impact workflow to keep stale comment instead of deleting (#35940)](https://github.com/mattermost/mattermost/commit/252eb9661d9be1ce247db9029035211e7297ec88) | 2026-04-07 |
| faa7d75b | [Improved processing of attachments (#35854)](https://github.com/mattermost/mattermost/commit/faa7d75b4ea041701e97948f8aa1332e3626a39a) | 2026-04-07 |
| e2e7aed6 | [Add prepackaged version of github plugin v2.7. (#35968)](https://github.com/mattermost/mattermost/commit/e2e7aed678d12e9d2ed121682933943a917a32ba) | 2026-04-07 |
| 83819e3d | [Specify target Safari version as a string (#35955)](https://github.com/mattermost/mattermost/commit/83819e3db4b167efd84ccefdb92eb9e83c457073) | 2026-04-07 |
| 540ccc59 | [MM-68179: Run sendLoop workers on all HA nodes (#35909)](https://github.com/mattermost/mattermost/commit/540ccc599be98ea130b48ae4b8df6ab90259e44b) | 2026-04-07 |
| 8eb98632 | [Redact password reset token from audit log (#35911)](https://github.com/mattermost/mattermost/commit/8eb9863215893d8fcf15094d0b4dfa6578a0326e) | 2026-04-07 |
| cf40f440 | [Markdown message preview fixed (#34942)](https://github.com/mattermost/mattermost/commit/cf40f44023c123cd628d2fe952264faf0a91fd5f) | 2026-04-08 |
| 7dccd6eb | [MM-68199: Fix shared channel membership sync error for local users (#35938)](https://github.com/mattermost/mattermost/commit/7dccd6eba648a626d9233c696627a7179b0dd17d) | 2026-04-07 |
| 9075204f | [Add demo plugin E2E tests for hook toggle and crash recovery (#35337)](https://github.com/mattermost/mattermost/commit/9075204f5f6840e3ff00f777d36617f7c6399881) | 2026-04-08 |
| 9a412c53 | [MM-67946 Added entity decoding to message attachments (#35667)](https://github.com/mattermost/mattermost/commit/9a412c535f5b157dc8e36386ddaca9dd8f1f2bcf) | 2026-04-08 |
| 12aedfdc | [Simplify Apple Silicon docker-compose support (#35975)](https://github.com/mattermost/mattermost/commit/12aedfdcaeb9b9bbd012a21a35de9b8ef511d757) | 2026-04-08 |
| 5b76fb11 | [MM-67647: Rename shared_channel_manager roles to follow system_ prefix convention (#35944)](https://github.com/mattermost/mattermost/commit/5b76fb11a55ad1d947bddafd1a3630a4bddb16f5) | 2026-04-08 |
| 220cd725 | [MM-66887 Fix results in Invite to Team modal (#35936)](https://github.com/mattermost/mattermost/commit/220cd725ccee2b9a8022c2ae2620ca4db011d620) | 2026-04-08 |
| f9b69898 | [Remove babel-plugin-typescript-to-proptypes and use of prop-types from web app (#35954)](https://github.com/mattermost/mattermost/commit/f9b69898245a11e5d9945f8418465c0e2ef903b6) | 2026-04-08 |
| fba382d5 | [feat(test analysis): using reusable workflow (#35852)](https://github.com/mattermost/mattermost/commit/fba382d5bdfe594db3323ef442227679e5650209) | 2026-04-09 |
| c303dd8e | [fix: test analysis (#35986)](https://github.com/mattermost/mattermost/commit/c303dd8e086efa506f6b779629b0619f3a7c7589) | 2026-04-09 |
| 993c3cb5 | [fix: test analysis override (#35987)](https://github.com/mattermost/mattermost/commit/993c3cb5d20847301dcd346ae2372f05e38db6be) | 2026-04-09 |
| 71ca373d | [Generate instead of hard-coding test passwords, enforce new minimum for FIPS, shard CI, fix FIPS builds (#35905)](https://github.com/mattermost/mattermost/commit/71ca373de7c5b17e864896e9f8e4b11cc075a4ad) | 2026-04-08 |
| 6fdef8c9 | [ci: enable fullyparallel mode for server tests (#35816)](https://github.com/mattermost/mattermost/commit/6fdef8c9cc3d7e7f2c27118297dd795a527c9555) | 2026-04-08 |
| fc9d3be3 | [Strip remote_id field from user patch API requests (#35910)](https://github.com/mattermost/mattermost/commit/fc9d3be3689d7218f9bd5dd8699e74b33c440911) | 2026-04-08 |
| 010aad63 | [Fixed a bug where signup link showed up when signup was disabled (#35769)](https://github.com/mattermost/mattermost/commit/010aad6308f87e659971f80f985dfe96855772f2) | 2026-04-09 |
| 1c093d37 | [Upgraded board prepackaged version to v9.2.4 (#35969)](https://github.com/mattermost/mattermost/commit/1c093d3760d71df55edc62b465d9dfee9ade986a) | 2026-04-09 |
| d1ca2977 | [Revert "Strip remote_id field from user patch API requests (#35910)" (#35996)](https://github.com/mattermost/mattermost/commit/d1ca297721b75700b212370e339ed37ae1b1d6b1) | 2026-04-09 |
| cf102afc | [ci: disable fullyparallel for binary parameters job (#35995)](https://github.com/mattermost/mattermost/commit/cf102afc17f0efbd512994a491e742b107730fcf) | 2026-04-09 |
| 6878d095 | [refactor(brand_image_setting): migrate BrandImageSetting to a function component (#34536)](https://github.com/mattermost/mattermost/commit/6878d095476d3fdbbafd93ee4df99b79262af151) | 2026-04-09 |
| f441b34d | [Fix interactive dialog bugs: dynamic select lookups, radio values, field refresh (#35640)](https://github.com/mattermost/mattermost/commit/f441b34deeda1c3d0e474518352dc0d3cfaca30e) | 2026-04-09 |
| 2be57a7e | [adds team member data sanitizing (#35562)](https://github.com/mattermost/mattermost/commit/2be57a7ec0c67004b77c76386f20a630920196e3) | 2026-04-09 |
| 860df696 | [ci: re-enable server test coverage with 4-shard parallelism (#35743)](https://github.com/mattermost/mattermost/commit/860df69621bf8940ccf2aa4b3350a38034435c27) | 2026-04-09 |
| 78b2980e | [fix: remove duplicate allow-failure input in server test template (#36004)](https://github.com/mattermost/mattermost/commit/78b2980ed5f1bd5c0ef05e0f81cc1b6c5179d44e) | 2026-04-09 |
| c96d215f | [Translations update from Mattermost Weblate (#35966)](https://github.com/mattermost/mattermost/commit/c96d215ff196cb352844080074778363944c3f6e) | 2026-04-10 |
| a244c170 | [Fixed URL validation for integration actions (#35857)](https://github.com/mattermost/mattermost/commit/a244c1704e77ede605d00f920e7f534d88f09079) | 2026-04-10 |
| 5476f69f | [\[MM-68048\] Add focus/blur listeners for popouts to determine focused channel/thread (#35990)](https://github.com/mattermost/mattermost/commit/5476f69f718f3c280a906c8e4153b58149911c30) | 2026-04-10 |
| 1574bda3 | [Server: Docs label prompt fix (#36020)](https://github.com/mattermost/mattermost/commit/1574bda3622e80252227f169a167605f43c98698) | 2026-04-10 |
| 4d028d55 | [Support Elasticsearch v9 alongside v8 (#35781)](https://github.com/mattermost/mattermost/commit/4d028d557ba53b85bfd004bc56bb1db90cb45696) | 2026-04-10 |
| f3c2e52b | [Bumping prepackaged zoom version to 1.13.0 (#35998)](https://github.com/mattermost/mattermost/commit/f3c2e52b76dd4fb07fff6e33537c46a5c72ef4a4) | 2026-04-10 |
| 73c6e6a7 | [MM-68258 Remove `system_secure_connection_manager` role (#36009)](https://github.com/mattermost/mattermost/commit/73c6e6a7cff7d05d2607ec28789910ecb2e1821b) | 2026-04-10 |
| 008373ad | [fix: add explicit permission grant in team members test (#36007)](https://github.com/mattermost/mattermost/commit/008373ad5065aff87c4bf5df243dd0c18c480e0b) | 2026-04-10 |
| f83d32e4 | [Strip remote_id field from user patch API requests (#36008)](https://github.com/mattermost/mattermost/commit/f83d32e42c45d80d4ec2a6747652ddd5a3c01951) | 2026-04-10 |
| 17939826 | [Update msgpack fork dependency (#35988)](https://github.com/mattermost/mattermost/commit/17939826efa20a97f087b3d390ec5136df350bae) | 2026-04-10 |
| 8f458060 | [MM-63588: Add e2e tests for System Console User Attributes (#35931)](https://github.com/mattermost/mattermost/commit/8f45806004ea74486b1584667ed7687a69cb96a2) | 2026-04-10 |
| b3a0ad9c | [Fix FIPS-incompatible passwords and config in e2e test suites (#36001)](https://github.com/mattermost/mattermost/commit/b3a0ad9c53f0d4292275fb99f55c4a5826b9a1c6) | 2026-04-13 |
| a2a896a5 | [MM-67433: Elasticsearch health monitor (#35747)](https://github.com/mattermost/mattermost/commit/a2a896a5def63cb1a6299e0b5f3dfa68bfc9113b) | 2026-04-13 |
| f2a964fa | [fix(cypress): demo plugin (#36056)](https://github.com/mattermost/mattermost/commit/f2a964faf3f9276b2fddcbce30f04ba8daf222a2) | 2026-04-13 |
| 4dcf6916 | [feat: automatically trigger fips e2e tests for relevant prs (#36014)](https://github.com/mattermost/mattermost/commit/4dcf6916f73452a74d28f24f718d96b94cd7fe45) | 2026-04-13 |
| 8e14c8ed | [MM-67505 Add AnalyticsQueryTimeout setting and use when refreshing materialized views (#35906)](https://github.com/mattermost/mattermost/commit/8e14c8ed58d187687bf6f049d4b560188c5ab081) | 2026-04-13 |
| 28dffaa5 | [MM-68235: Rename user-visible "Custom Profile Attributes" to "User Attributes" (#36046)](https://github.com/mattermost/mattermost/commit/28dffaa574e788c6c3123957ae0286c7e15ca179) | 2026-04-13 |
| e3b2b0a5 | [Improve CJK handling in autocompletes and Find Channels modal and using Firefox (#35937)](https://github.com/mattermost/mattermost/commit/e3b2b0a5215d54daad814393d3af4046e8b325c3) | 2026-04-13 |
| 2fb38fe7 | [\[MM-68266\] Pass through menu props to popout menu item, guard at menu definition to avoid null component blocking keyboard navigation (#36024)](https://github.com/mattermost/mattermost/commit/2fb38fe71d7b5d34885dd7d38915c0ff929048e1) | 2026-04-13 |
| 161f0713 | [MM-66612: Add health flag to fast-fail when ES is offline (#35843)](https://github.com/mattermost/mattermost/commit/161f0713a4ea711b3765976edda3315f6e6470df) | 2026-04-13 |
| e7b60bbd | [MM-67291: ES health metric (#35844)](https://github.com/mattermost/mattermost/commit/e7b60bbd100de8732d0a182690fb1d19c89d83ac) | 2026-04-13 |
| ed80e8ba | [Shared channel UI for channel admins (#35448)](https://github.com/mattermost/mattermost/commit/ed80e8ba91aea94a6acf27ca42dc4c0764d737e5) | 2026-04-14 |
| baea603c | [Updated sharedchannel test package dependencies to match those in server (#36055)](https://github.com/mattermost/mattermost/commit/baea603c4004d1f8706fb000e5bd0d3e32ddf9d0) | 2026-04-14 |
| 01219efb | [\[MM-68037\] Managed Sidebar Categories (MVF) (#35935)](https://github.com/mattermost/mattermost/commit/01219efbf4204055ffddb58902c1f870a216cd43) | 2026-04-14 |
| 5af77b7e | [MM-67095: Hide Workspace Optimization for cloud-licensed workspaces (#36077)](https://github.com/mattermost/mattermost/commit/5af77b7e089cb5faca94ccfb7087e4d2c78c68f6) | 2026-04-14 |
| 2b2ae477 | [test: clean up channel store data after TestChannelStore (#36066)](https://github.com/mattermost/mattermost/commit/2b2ae4778f6d3aad52f73ac3b958812456b42824) | 2026-04-14 |
| 9be83a99 | [Fix command injection in server-test-template workflow (#36080)](https://github.com/mattermost/mattermost/commit/9be83a998acee113727bc208f11b07cf831296a9) | 2026-04-14 |
| 88954db3 | [\[MM-63434\] Use forked PDF library with parsing depth limit (#35947)](https://github.com/mattermost/mattermost/commit/88954db3de2c10e8c4de5395130caaf6dc60e549) | 2026-04-14 |
| fff3820c | [fix(ci): restore testname format in sharded gotestsum runs (#36078)](https://github.com/mattermost/mattermost/commit/fff3820ce430cebe00716bf7634a33e1eae1de24) | 2026-04-14 |
| c3ab0f7f | [MM-68191: Add plugin Receive APIs for shared channel sync (#35962)](https://github.com/mattermost/mattermost/commit/c3ab0f7f78e28543e101b9d3f1264d084777aa84) | 2026-04-14 |
| 0f2c1675 | [Add pluggable AI actions menu with custom prompts extension point (#35930)](https://github.com/mattermost/mattermost/commit/0f2c16754ff05f7ab1c201294c1262c4784f0ccf) | 2026-04-14 |
| 3cb00848 | [Add COALESCE guard for property values before PSAv2 migrations (#36079)](https://github.com/mattermost/mattermost/commit/3cb00848a6c19cf92043e38cdf6ecb0081dea479) | 2026-04-14 |
| b712595d | [Fixed the UI for compact mode file editing (#35878)](https://github.com/mattermost/mattermost/commit/b712595dd0f76b6da9a8e1b151e9b189946c89da) | 2026-04-15 |
| 9fa8c8c0 | [Add bulk set (replace) channel memberships API endpoint  (#36031)](https://github.com/mattermost/mattermost/commit/9fa8c8c0c80bb67442b6f17dc69c15ce3ea2238b) | 2026-04-15 |
| c66bb0ec | [\[MM-68109\] Introduce new policy version v0.3 (#35904)](https://github.com/mattermost/mattermost/commit/c66bb0ecdbf7c86a17059ea4345e4f6ab5c633c8) | 2026-04-15 |
| bff35776 | [chore(playwright): upgrade to v1.59 and to typescript@6.0 (#36071)](https://github.com/mattermost/mattermost/commit/bff35776904caf10dd5d9dae7a6fd44a50e1fc3d) | 2026-04-15 |
| 0fcf3b5e | [Update docs-impact-review.yml (#36105)](https://github.com/mattermost/mattermost/commit/0fcf3b5ef20e587b6c45ead8147e53ab0e2fd635) | 2026-04-15 |
| 62d0ab63 | [\[GH-29948\] \[GH-32467\] Avoid fetching resources requiring a license if it isn't the case (#34206)](https://github.com/mattermost/mattermost/commit/62d0ab633f1885fa45ed64c50171689655157273) | 2026-04-15 |
| d4d65c8c | [Add manage_own_agent and manage_others_agent permissions (#35924)](https://github.com/mattermost/mattermost/commit/d4d65c8cfb56b63cd21020f06032330e1eb7752f) | 2026-04-15 |
| 455815a0 | [Update permission_system_scheme_settings snapshots (#36121)](https://github.com/mattermost/mattermost/commit/455815a06725f97637785490243cf2317d913dad) | 2026-04-15 |
| 80b97780 | [Feature mm 64509 team admin abac channels (#36061)](https://github.com/mattermost/mattermost/commit/80b977807a8194fb85396078fa167125a3b2f854) | 2026-04-16 |
| beb96185 | [\[MM-68183\] Permission policies (#36003)](https://github.com/mattermost/mattermost/commit/beb96185cd6ab1ff72bf1b8b0349a542de019d8e) | 2026-04-16 |
| d1657996 | [add override for e2e test on fips (#36128)](https://github.com/mattermost/mattermost/commit/d16579964c954e38f4eb17d4379f55a01ed13659) | 2026-04-16 |
| 7bd18f5d | [fix(editor): restore focus to main textbox after editing a post (#35518)](https://github.com/mattermost/mattermost/commit/7bd18f5dec758c82e25946e251da27fc934fe5dc) | 2026-04-16 |
| ab0a579b | [SEC-10098 E2E/Cypress chore(cypress): upgrade to v15.13 and to typescript@6.0 (#36091)](https://github.com/mattermost/mattermost/commit/ab0a579b477d30eddf8eb620be18916c67d19b8d) | 2026-04-16 |
| 034799c2 | [Fixed a bug where user profile popover closed automatically when opened for the first time for a user from channel member list in RHS (#35918)](https://github.com/mattermost/mattermost/commit/034799c22194ca624dc29c27b2b11e2a95b292de) | 2026-04-16 |
| d2848a89 | [MM-68274 - Adding watermarking toggle in server (#36025)](https://github.com/mattermost/mattermost/commit/d2848a893ac79cb8d5e1a8a1a75b4931270e90b2) | 2026-04-16 |
| 49f3c747 | [Bumping prepackaged MS Calendar plugin version to v1.6.1 (#36137)](https://github.com/mattermost/mattermost/commit/49f3c747376b461c96472a7512ea4c70af482111) | 2026-04-16 |
| a21e25e4 | [MM-68352 - update permission policy ff correctly checks in tests (#36142)](https://github.com/mattermost/mattermost/commit/a21e25e415f7bf60780e5e32f78035954ac23f25) | 2026-04-16 |
| faf1118b | [Update en.json (#36139)](https://github.com/mattermost/mattermost/commit/faf1118b6a280dc363bafa0ff9dcdcc8cb800430) | 2026-04-16 |
| 983ea5a4 | [MM-68356 - ensure files are stripped when session is nil for fail-secure handling (#36145)](https://github.com/mattermost/mattermost/commit/983ea5a49f22375da9a3385f074a74ac7ef3fd34) | 2026-04-16 |
| dc724194 | [MM-68276: Apply default values for plugin settings inside sections (#36119)](https://github.com/mattermost/mattermost/commit/dc7241941e8b6cbff9a5898620964ad60115abcf) | 2026-04-16 |
| 846e45a1 | [\[MM-68103\] Add channel banner to thread view (#35942)](https://github.com/mattermost/mattermost/commit/846e45a114405813cb78b990586e82c9c517213a) | 2026-04-16 |
| f6341a17 | [MM-68247 Move user agent utilities into shared package and clean it up (#36033)](https://github.com/mattermost/mattermost/commit/f6341a17baa0b7133a5622a0a208dd22c978fa65) | 2026-04-16 |
| 23ab604b | [ci: pin enterprise repo to explicit commit hash (#35957)](https://github.com/mattermost/mattermost/commit/23ab604b964a6ee8c07d56c2fced57bea621a643) | 2026-04-16 |
| 588ee428 | [MM-68155: Add tooltip for urgent mention badges (#35912)](https://github.com/mattermost/mattermost/commit/588ee4281a915de82556dedeb790d20a9a4fc9a8) | 2026-04-16 |
| 41e59bf1 | [Update Agents plugin to v2.0.0-rc3 (#36157)](https://github.com/mattermost/mattermost/commit/41e59bf1d5e71315fbe6b375d4de7943072489c7) | 2026-04-16 |
| 66461e75 | [\[MM-67949\] Harden notification email filename rendering (#36082)](https://github.com/mattermost/mattermost/commit/66461e75538e888dc727d7024c695f0d0aca3bef) | 2026-04-17 |
| 73100fcb | [Bump Boards FIPS version to v9.2.4 (#36165)](https://github.com/mattermost/mattermost/commit/73100fcb566e54ac24395e57093d33437429a0cd) | 2026-04-17 |
| bf843017 | [MM-38308 Remove remaining support for IE and pre-Chromium Edge (#36034)](https://github.com/mattermost/mattermost/commit/bf84301784777a6e08f9709ee882b0eac029437a) | 2026-04-17 |
| 0c99cc36 | [Add Playwright E2E tests for demo plugin server-side slash commands (#36146)](https://github.com/mattermost/mattermost/commit/0c99cc36cc45900f784a0cec3fa95d91988f6a5d) | 2026-04-20 |
| 8cd48d46 | [\[MM-67880\] Add /mobile-logs slash command (#35658)](https://github.com/mattermost/mattermost/commit/8cd48d46514dfe42e1693c890e02ff5228be9d3d) | 2026-04-20 |
| 978b0385 | [chore: Update NOTICE.txt file with updated dependencies (#36184)](https://github.com/mattermost/mattermost/commit/978b038561bed7935f9748776c78e55ca5f138b3) | 2026-04-20 |
| 827fafca | [MM-68367: Warn in System Console when cluster sniffing is enabled (#36174)](https://github.com/mattermost/mattermost/commit/827fafca857f9d7d1fe487c9781cabcd4e5e1463) | 2026-04-20 |
| c8f0a314 | [ci: move FIPS and binary params tests to weekly schedule (#36036)](https://github.com/mattermost/mattermost/commit/c8f0a31425a01cb7b95cc9ff1ef08714f88ffe52) | 2026-04-20 |
| 5b810f91 | [fix(tests): re-enable 10 flaky tests across 12 JIRA tickets (#36159)](https://github.com/mattermost/mattermost/commit/5b810f917c54fa79310cd9ae915cf9ef1d07d7ef) | 2026-04-20 |
| 9c8191c3 | [ci: add yamllint workflow to detect duplicate YAML keys (#36010)](https://github.com/mattermost/mattermost/commit/9c8191c3b8a8a41352d21ca69be5b05a5f1de800) | 2026-04-20 |
| 39d25d94 | [MM-68259 Fixing text and emojis being clipped in channel banners (#36076)](https://github.com/mattermost/mattermost/commit/39d25d94ddd766ac9445eba0d2afdaffe74cc768) | 2026-04-21 |
| 9aae84bc | [\[MM-67981\] Add process ID (PID) to support packet diagnostics (#35832)](https://github.com/mattermost/mattermost/commit/9aae84bc3f23be506f9a3b93f221290841555de6) | 2026-04-21 |
| 52fa113d | [\[MM-67977\] Add Go runtime version to support packet diagnostics (#35833)](https://github.com/mattermost/mattermost/commit/52fa113dfc58af3c002ad5f3f5a743d2ebba328d) | 2026-04-21 |
| bfaff4da | [Add server/AGENTS.md (#35903)](https://github.com/mattermost/mattermost/commit/bfaff4da7e8d31188b2c34563b908c5472784dd0) | 2026-04-21 |
| 848ceb3c | [\[MM-67978\] Add open file descriptor count to support packet diagnostics (#35834)](https://github.com/mattermost/mattermost/commit/848ceb3c732dc04cf187a1beb43aeca069d5b79d) | 2026-04-21 |
| 58052db8 | [\[MM-67976\] Add server uptime to support packet (#35838)](https://github.com/mattermost/mattermost/commit/58052db8e3ee75f7bb3a0dffca0daa908edfa551) | 2026-04-21 |
| 0431659c | [\[MM-68237\] Unshare channels when remote is removed (#35997)](https://github.com/mattermost/mattermost/commit/0431659c93605ed777c665cce1f04570fc3bc08a) | 2026-04-21 |
| 66502c2e | [MM-68047: Hide update status button in RHS post header (#36120)](https://github.com/mattermost/mattermost/commit/66502c2e677096a6fd1649528d6526b4cd931e2f) | 2026-04-21 |
| d3ecc090 | [MM-67782: Fetch group members on popover open to fix empty member list (#36122)](https://github.com/mattermost/mattermost/commit/d3ecc09064671f50d5a192cb473ca3c001f200a1) | 2026-04-21 |
| 67a645d2 | [MM-68378: Fix silent bulk failures in OpenSearch/Elasticsearch indexers (#36189)](https://github.com/mattermost/mattermost/commit/67a645d2c6cbe9a2841d3731c7eb13a321739abf) | 2026-04-21 |
| ef80288c | [MM-68160: Fix post reminder confirmation not appearing for replies in RHS (#36124)](https://github.com/mattermost/mattermost/commit/ef80288cacd97c85ecb289d1112fd22a6976632e) | 2026-04-21 |
| 2d7a71b0 | [ci: fix startup_failure in nightly race and weekly workflows (#36198)](https://github.com/mattermost/mattermost/commit/2d7a71b01810112269a22329042534fe739fee12) | 2026-04-21 |
| 3fa87760 | [\[MM-68100\] Implement Linked Properties for the Property System (#35808)](https://github.com/mattermost/mattermost/commit/3fa8776095087a9c928dee5d1b21d9aba5bcc0c3) | 2026-04-21 |
| 29bab218 | [e2e: adjust some pipeline settings (#36178)](https://github.com/mattermost/mattermost/commit/29bab2184db42103dd30c0827059ef3f854847d4) | 2026-04-21 |
| 50b8e108 | [Quick fixes for docs label automation (#36185)](https://github.com/mattermost/mattermost/commit/50b8e1086fa2efd07cd50c475a53165061473667) | 2026-04-22 |
| 863d581f | [Update Agents plugin to v2.0.0-rc5 (#36207)](https://github.com/mattermost/mattermost/commit/863d581f98f4ae17d36646a8efccb2a50284bc69) | 2026-04-22 |
| 694e6f40 | [fix: bot import panic when user exists without bot record (#36072)](https://github.com/mattermost/mattermost/commit/694e6f40dcda8ac682a8f7d24e50cad3565078fa) | 2026-04-22 |
| 8d169e9f | [Rename system statistics sidebar label (#36179)](https://github.com/mattermost/mattermost/commit/8d169e9ff84b97007e964e82045312e8e46c86a8) | 2026-04-22 |
| 65500cc8 | [MM Build 2025 - Skadoosh - Serve plugin metrics to standard /metrics endpoint (#34678)](https://github.com/mattermost/mattermost/commit/65500cc820a9b3d1c3f86e351598bde99a28ba5f) | 2026-04-22 |
| b63e3205 | [docs: document enterprise.pin workflow in root AGENTS.md (#36200)](https://github.com/mattermost/mattermost/commit/b63e32057de19e0176c034d3ca7decafd5a779f9) | 2026-04-22 |
| b82cfe1a | [ci: collect coverage inline on Postgres job, remove duplicate Coverage job (#36216)](https://github.com/mattermost/mattermost/commit/b82cfe1a4e8f31822c364cc62bf079abc344b830) | 2026-04-22 |
| e5a72302 | [ci: fix cypress statuses perms (#36220)](https://github.com/mattermost/mattermost/commit/e5a723024213451932fddc68019693f480159afe) | 2026-04-22 |
| 435a6d1d | [Surface WebSocket event context in oversized cluster publish message logs (#36214)](https://github.com/mattermost/mattermost/commit/435a6d1dd9832bfcd5c8442895b0b6134ad56570) | 2026-04-22 |
| 7627784a | [Require sysadmin permission to create templates (#36217)](https://github.com/mattermost/mattermost/commit/7627784ae1288bdcc00f1459512ffce3613a60b1) | 2026-04-22 |
| e8c9e525 | [Fix silent test discovery failure in sharded CI (#36222)](https://github.com/mattermost/mattermost/commit/e8c9e525e1586d6da3526ae0ac3c591295431729) | 2026-04-22 |
| ee9938fe | [\[MM-68162\] Allow only "in" operator for multiselect type attributes in basic editor (#35896)](https://github.com/mattermost/mattermost/commit/ee9938fead45acd20be8ab18018c85eaf30bbbda) | 2026-04-23 |
| 795672f0 | [Raise shard-split HEAVY_MS above sqlstore timing (#36233)](https://github.com/mattermost/mattermost/commit/795672f07765f292cd36fff76dc9b31bb53e58cc) | 2026-04-23 |
| 0b1d1728 | [\[MM-67975\] Add container CPU and memory limits to support packet diagnostics (#35835)](https://github.com/mattermost/mattermost/commit/0b1d1728a4c199f4b845a063551f3fc6b7645f7e) | 2026-04-23 |
| 93ab9a4c | [\[MM-68351\] Fix nil pointer panic in mmctl websocket command on connection failure (#36138)](https://github.com/mattermost/mattermost/commit/93ab9a4cccabadb59028811ccfe648ba3799efa8) | 2026-04-23 |
| 6bb9c582 | [MM-67352 Prevent composer scroll jumps on formatting click (#36081)](https://github.com/mattermost/mattermost/commit/6bb9c5826a896ea413cc21e4834d70b179a14cc4) | 2026-04-23 |
| bc9c69ba | [MM-66082: Fix paste into Invite People modal (#36201)](https://github.com/mattermost/mattermost/commit/bc9c69ba3964fe6e5d1d4fe51283adc276ef117c) | 2026-04-23 |
| 9d33d87e | [Fix Managed Category creatable input color on dark themes (#36242)](https://github.com/mattermost/mattermost/commit/9d33d87e0a92f44113af46a01ed9003f3cee9fa7) | 2026-04-23 |
| 3f97021f | [Keep recap menu available after read (#35547)](https://github.com/mattermost/mattermost/commit/3f97021fc7bffc34e4772902e0fcb40e37a627ab) | 2026-04-23 |
| c021eeaf | [MM-68439 Centralize filename handling for FileInfo (#36223)](https://github.com/mattermost/mattermost/commit/c021eeaff8f003034ab40f82c552cc26a710a8fd) | 2026-04-23 |
| 1911e181 | [Fix invite modal input text clipping and modal width overflow (#36241)](https://github.com/mattermost/mattermost/commit/1911e18127d242dc3b80efd7b51cc60ec76cc1da) | 2026-04-23 |
| 6ce4db65 | [Skip sqlstore DB setup during go test -list discovery (#36249)](https://github.com/mattermost/mattermost/commit/6ce4db65dc5d99248d42aa571fba0187b22669bb) | 2026-04-23 |
| 9c684e63 | [Property System v2 Generic APIs blacklist (#36171)](https://github.com/mattermost/mattermost/commit/9c684e6313b161d0e9cb07442235b962709b37cb) | 2026-04-24 |
| 5817a6d6 | [Simplify PULL_REQUEST_TEMPLATE.md and document it in AGENTS.md (#36239)](https://github.com/mattermost/mattermost/commit/5817a6d687cc64ea3aa79c87c9eaebe317d69d1f) | 2026-04-24 |
| 46624d1f | [\[MM-68231\] Tighten post info authorization (#36111)](https://github.com/mattermost/mattermost/commit/46624d1f47d9b70c6db940c5a4e7b3066edca895) | 2026-04-24 |
| 1ed4d021 | [Fix FIPS test failures by using model.NewTestPassword() for short passwords (#36262)](https://github.com/mattermost/mattermost/commit/1ed4d0215a01bcd6520bc1e481918c1fdc3cc81d) | 2026-04-24 |
| 9eb070b7 | [Reorder channel banner (#36268)](https://github.com/mattermost/mattermost/commit/9eb070b72bad03d9a2f599b101558e6fd4922636) | 2026-04-24 |
| 5b4efbd2 | [Remove unused property fields index (#36279)](https://github.com/mattermost/mattermost/commit/5b4efbd28a90305ac4edb2e8e6bc809548977bea) | 2026-04-27 |
| dda4bb12 | [Mm 68353 show placeholder for redacted files in preview (#36153)](https://github.com/mattermost/mattermost/commit/dda4bb129c6b778629cfa2cb40248917104d1499) | 2026-04-27 |
| 24f9da39 | [Update docs-impact-review.yml (#36260)](https://github.com/mattermost/mattermost/commit/24f9da39cd6dae56de527cdf88b3af9253a857a2) | 2026-04-27 |
| 95f1f32a | [Fixing weblate (#36283)](https://github.com/mattermost/mattermost/commit/95f1f32a4238fd7399ab2af10809627cbe87220a) | 2026-04-27 |
| 291c7cd0 | [MM-68378: Fix empty error fields and spurious failures for OS/ES bulk deletes (#36264)](https://github.com/mattermost/mattermost/commit/291c7cd08147eb94378b2516cbb56e276a078150) | 2026-04-27 |
| 5e42f6f8 | [Fix web app run script crashing (#36271)](https://github.com/mattermost/mattermost/commit/5e42f6f80c9b211e8f979723ebb60382de141fcd) | 2026-04-27 |
| 1af7d823 | [Remove AGENTS.CLOUD.md (#36286)](https://github.com/mattermost/mattermost/commit/1af7d823ded361df5ace499e2dc55ce2de8f3bce) | 2026-04-27 |
| 6bb804c5 | [ci: treat HTTP 429 as a warning in check-external-links (#36221)](https://github.com/mattermost/mattermost/commit/6bb804c503588042c929354bab596119b996d321) | 2026-04-27 |
| f8bf924e | [MM-67319/MM-67320 Move ShortcutKey and WithTooltip into shared package (#36037)](https://github.com/mattermost/mattermost/commit/f8bf924ebfcd4ad419cf3d3b35e8dfedb48fec1e) | 2026-04-27 |
| 6103e95b | [ci: resolve enterprise branch from mattermost merge-base time (#36245)](https://github.com/mattermost/mattermost/commit/6103e95b79a51bc4e52857d09c5a279e7a9ab978) | 2026-04-27 |
| 016e2fd6 | [ci: compile mmctl e2e tests with requirefips when FIPS_ENABLED=true (#36267)](https://github.com/mattermost/mattermost/commit/016e2fd6fbfea9b8f13cc62d3c6b088bc8d2bb79) | 2026-04-27 |
| 45ec78b5 | [\[MM-68457\] Expose audit logging API via pluginapi.Client (#36232)](https://github.com/mattermost/mattermost/commit/45ec78b595427a115dcfbd19fe00ca50ede9d18c) | 2026-04-28 |
| 81d4fe37 | [MM-68339: Add XML struct tags and multi-remote registration for shared channels plugin API  (#36126)](https://github.com/mattermost/mattermost/commit/81d4fe37938436d8e971aaa418c0b71519acd54f) | 2026-04-28 |
| 2283b51b | [MM-67974: Add disk space info to Support Packet for local file store (#36300)](https://github.com/mattermost/mattermost/commit/2283b51b0e1f625c825706b30de7f94af2013c9e) | 2026-04-28 |
| 5c43e4b1 | [\[MM-68459\] Implement dictionary style end user indicators for membership policies (#36240)](https://github.com/mattermost/mattermost/commit/5c43e4b15fbac964ee2301ee94f7acbca1369e58) | 2026-04-28 |
| c85601dc | [\[MM-67979\] \[MM-67980\] Add SMTP and push proxy connectivity status to support packet diagnostics (#35837)](https://github.com/mattermost/mattermost/commit/c85601dc7fcad9ded56ee490b5c71dc5ab454cc6) | 2026-04-28 |
| bd8fc922 | [MM-68526: Harden remote cluster patch response (#36288)](https://github.com/mattermost/mattermost/commit/bd8fc92226726da06c8fabaef568cc9ebaee1cb8) | 2026-04-28 |
| c79c3831 | [MM-68264: return error on bot username conflict (#36064)](https://github.com/mattermost/mattermost/commit/c79c3831061a0880c0962c7d567c9e24dd35f44c) | 2026-04-28 |
| fdaea9de | [MM-68339: slugify RemoteCluster.Name in plugin registration (#36309)](https://github.com/mattermost/mattermost/commit/fdaea9dec316d6a10014b7010f3558675e300490) | 2026-04-28 |
| 2b7b398a | [\[MM-68102\] Add Classification Markings admin console page (#35934)](https://github.com/mattermost/mattermost/commit/2b7b398a2225d166cfe6eb7b6796d037c0dcef87) | 2026-04-28 |
| 85dc0851 | [\[MM-68535\] Invalidate channel cache after policy assignment (#36292)](https://github.com/mattermost/mattermost/commit/85dc0851972483cff74fd0c01c64a922b31cf25e) | 2026-04-28 |
| 320383d8 | [MM-67326 - add channel settings abac e2e (#36277)](https://github.com/mattermost/mattermost/commit/320383d8947691196695b88cbe5da3118dd17794) | 2026-04-29 |
| f275a339 | [MM-67913: fix white flash on product navigation by centralizing app__body ownership (#36186)](https://github.com/mattermost/mattermost/commit/f275a339676ec8d19c914bba24fc649a1c858ee8) | 2026-04-29 |
| 641d5a4e | [\[MM-68538\] Wrap incoming query from the CEL -> SQL conversion with parentheses (#36293)](https://github.com/mattermost/mattermost/commit/641d5a4eb7faa8037f9050b926800a875e8927e0) | 2026-04-29 |
| c2ec9e96 | [Add stronger EnableTesting warnings (#36158)](https://github.com/mattermost/mattermost/commit/c2ec9e967da6314375cd1df525d0ff1304741ce6) | 2026-04-29 |
| 6c0e0fee | [\[MM-68464\] Introduce system object type for property fields and values (#36250)](https://github.com/mattermost/mattermost/commit/6c0e0fee4a337902c75b7c3dfe98f93654a59cc1) | 2026-04-29 |
| 4da11e81 | [\[MM-68497\] Enables membership policies on public channels with advisory semantics (#36275)](https://github.com/mattermost/mattermost/commit/4da11e81afed0cb3919482c71f5dc3bfea50fb0f) | 2026-04-30 |
| ba9c96a3 | [fix: detect ADFS when IdpDescriptorURL has no trailing slash (#36333)](https://github.com/mattermost/mattermost/commit/ba9c96a354b61dfdbb48d18e8f8ddc9305655081) | 2026-04-30 |
| b0b9f2ee | [MM-68499 - auto run sync jobs on team admin abac policy creation (#36276)](https://github.com/mattermost/mattermost/commit/b0b9f2ee84bdd382df90c0a1203541a1e50f83cb) | 2026-04-30 |
| 797c7374 | [Avoid setting an empty value on slash command IconURL (#36327)](https://github.com/mattermost/mattermost/commit/797c7374212176eebf3a8f99af5ceea26bbe968b) | 2026-04-30 |
| 1cb46538 | [Update Agents plugin to v2.0.0 (#36336)](https://github.com/mattermost/mattermost/commit/1cb465383801f2a770d247db1215859794f2bb3c) | 2026-04-30 |
| e70e8c0e | [Fix themed text colors in Invite Guest modal channel picker (#36299)](https://github.com/mattermost/mattermost/commit/e70e8c0e9e3b29566f27c437e4754c9423fbf9c6) | 2026-04-30 |
| cad4a450 | [Disable morph logging in NewTestPool (#36308)](https://github.com/mattermost/mattermost/commit/cad4a4509c5d429600744fbfe228508e77c9d44b) | 2026-04-30 |
| 8d7507b1 | [Update Agents plugin FIPS version to v2.0.0 (#36344)](https://github.com/mattermost/mattermost/commit/8d7507b1eb2e8ded5d6268208717f2daa61608e7) | 2026-04-30 |
| 082f6ba8 | [Prepackage Agents plugin v2.0.2 (#36349)](https://github.com/mattermost/mattermost/commit/082f6ba85a9b019885e9a99ef0a6cf751a452f8a) | 2026-04-30 |
| 1ead9ff0 | [update buildserver go base image versions to 1.25.9 (#36348)](https://github.com/mattermost/mattermost/commit/1ead9ff03837ef13adaef872eb26dd5c2897e58a) | 2026-05-01 |
| 01bb3dcf | [MM-64977: Fix channel switcher row overlap with long channel and team names (#36330)](https://github.com/mattermost/mattermost/commit/01bb3dcf7ab7d56b60d7037e6a2ff4f3838f4835) | 2026-05-01 |
| 99b73d4c | [\[MM-68393\] Tighten protected role patch authorization (#36197)](https://github.com/mattermost/mattermost/commit/99b73d4c4acf5ff3546c2548a5aaa804c2aa1b04) | 2026-05-01 |
| 035c3ba4 | [Update go version to 1.25.9 (#36357)](https://github.com/mattermost/mattermost/commit/035c3ba4b9f0c5ce28f5c6787ae5122284d27a7a) | 2026-05-01 |
| 7d6816ab | [MM-68382: Align team creation invite permission checks (#36188)](https://github.com/mattermost/mattermost/commit/7d6816abdfd170169f717aea43c5716a1f9ef6b0) | 2026-05-01 |
| 5bad893c | [  Move interactive dialog date/datetime properties into datetime_config (#36067)](https://github.com/mattermost/mattermost/commit/5bad893cade2640e447d16394582e9dd7fa72e62) | 2026-05-01 |
| 0aa28f98 | [Fix the gap between trail branner and the button (#34688)](https://github.com/mattermost/mattermost/commit/0aa28f9812038a3f377e7b44573dd358afc7be27) | 2026-05-02 |
| ace28cd5 | [\[MM-67867\] Update Playbooks plugin to v2.8.1 (#36361)](https://github.com/mattermost/mattermost/commit/ace28cd5165156dfcb62d428f566d447cbc726da) | 2026-05-03 |
| d4f147e2 | [Data spillage deletion summary (#36018)](https://github.com/mattermost/mattermost/commit/d4f147e2dae350ee8e52619b29e40e37482b40b1) | 2026-05-04 |
| e5344bc5 | [Update Agents plugin FIPS version to v2.0.2 (#36389)](https://github.com/mattermost/mattermost/commit/e5344bc57d7a057da5f9299ec904a39adf9f51e4) | 2026-05-04 |
| 1b7b15b1 | [MM-67931: Prepackage the FIPS flavour of Playbooks v2.8.1 (#36387) (#36391)](https://github.com/mattermost/mattermost/commit/1b7b15b1212b89b5e66ff6b3b2e9a5afd28d8222) | 2026-05-04 |
| 7ddf5847 | [Removing Beta Label From Hungarian Language (#36386)](https://github.com/mattermost/mattermost/commit/7ddf584741e1f7b0c671ab1992056c923d4757e8) | 2026-05-04 |
| b7a97f4b | [ci: disable fullyparallel for unsharded weekly Postgres jobs (#36390)](https://github.com/mattermost/mattermost/commit/b7a97f4bdc08abc08a296e5d03065f03e9ebd626) | 2026-05-04 |
| 846791aa | [MM-68622: start inter-cluster services before plugin activation (#36366)](https://github.com/mattermost/mattermost/commit/846791aa65217996b25c7d6ec9304e0e780dbde5) | 2026-05-04 |
| 724c5b71 | [CPA Display Name Support  (#36247)](https://github.com/mattermost/mattermost/commit/724c5b719191c88c1d79f018b765f75520986183) | 2026-05-04 |
| 154286f5 | [fix: only run e2e tests for fips for versions v11+ (#36374)](https://github.com/mattermost/mattermost/commit/154286f53f008c50c458c5e36dc3f6892a6acfeb) | 2026-05-04 |
| 49260c42 | [Prepackage mattermost-plugin-agents v2.0.3 (#36401)](https://github.com/mattermost/mattermost/commit/49260c42899b4b36ffcfddb93f80761bab9c4592) | 2026-05-04 |
| 022acb74 | [MM-68536: Show actual remote names in system console channel list (#36298)](https://github.com/mattermost/mattermost/commit/022acb74c5752a2d6212ef6e22d7dd8abbb3f9dc) | 2026-05-04 |
| 8f9b08f0 | [MM-56762: Bookmarks overflow menu with drag-and-drop reordering (#35118)](https://github.com/mattermost/mattermost/commit/8f9b08f07b23420d58f675f59ddbd56258a81d83) | 2026-05-04 |
| 9e955bf6 | [Edit attachment permission (#36227)](https://github.com/mattermost/mattermost/commit/9e955bf683b68383dfe6050f318c15bedd6698b7) | 2026-05-05 |
| 969ae195 | [MM-68500 - add AttributeValueMasking flag and HasMaskedValues field (#36408)](https://github.com/mattermost/mattermost/commit/969ae195e1c993c9d9001dc8a65e79657d644694) | 2026-05-05 |
| 9bbe9ea6 | [Update Agents plugin FIPS version to v2.0.3 (#36417)](https://github.com/mattermost/mattermost/commit/9bbe9ea6e6ecdd7440f0161a9ffc08f6e471257a) | 2026-05-05 |
| 8c720834 | [MM-68547: Tighten authorization on group syncable link and patch endpoints (#36316)](https://github.com/mattermost/mattermost/commit/8c72083414e675c97987374395e36d1f36b4bd8a) | 2026-05-05 |
| 357d1ef0 | [MM-67982 Only focus mobile search box when search is opened (#36346)](https://github.com/mattermost/mattermost/commit/357d1ef0bd4c0520eef8f770149ec89234212148) | 2026-05-05 |
| ebc066e7 | [\[MM-68273\] Add system messages for share / unshare events (#36032)](https://github.com/mattermost/mattermost/commit/ebc066e7fdbcf6fd4409b51a8fd307de51947e43) | 2026-05-05 |
| 0502d6b3 | [\[MM-68655\] Surface RPC errors from plugin hooks (#36414)](https://github.com/mattermost/mattermost/commit/0502d6b3c59ede0e625a718f338b28e46245d275) | 2026-05-05 |
| dd9d1612 | [MM-68149: upgrade mattermost-server-build images to Go 1.26.2 (#36419)](https://github.com/mattermost/mattermost/commit/dd9d16128cbf77fb009de92b17b6f941aa255054) | 2026-05-05 |
| e4360876 | [docs: clarify PR template rules in AGENTS.md (#36422)](https://github.com/mattermost/mattermost/commit/e43608762d4e781fbadbc88d1f7b35d89c1c3d06) | 2026-05-05 |
| c787d065 | [MM-68494 Directly import WithTooltip/ShortcutKey from shared package (#36270)](https://github.com/mattermost/mattermost/commit/c787d06506ee3771a5903563b1f5f478211278ac) | 2026-05-05 |
| 2b753c49 | [Remove unused GetChannelCounts store and app methods (#36351)](https://github.com/mattermost/mattermost/commit/2b753c49f2297ecc0144442f9aa6e932d5b3f8cd) | 2026-05-05 |
| 71fb5b1e | [fix: tolerate concurrent update conflicts in content flagging migration (#36421)](https://github.com/mattermost/mattermost/commit/71fb5b1e549e8dd099822f1fb3c7a10f9ceea484) | 2026-05-05 |
| 7d1ee48c | [MM-68647: Fix Data Spillage reviewer pill background in dark mode (#36424)](https://github.com/mattermost/mattermost/commit/7d1ee48c080bb0a2d47ee0e6ddffaa75ec7d12c9) | 2026-05-05 |
| d5946e94 | [Update latest minor version to 11.8.0 (#36437)](https://github.com/mattermost/mattermost/commit/d5946e9477967e62ea22117dd5c1f5ad1c56a174) | 2026-05-06 |
| 1a88e3b3 | [Adds experimental label to the views endpoints (#36398)](https://github.com/mattermost/mattermost/commit/1a88e3b3223a012cb1e9d78896256e47f35b6464) | 2026-05-06 |
| 5124cc73 | [\[MM-68590\] Clarify membership policy UI copy (#36428)](https://github.com/mattermost/mattermost/commit/5124cc738763b2c53f325b322212a84989ac936a) | 2026-05-06 |
| 97c3b538 | [MM-68532: default EnableSearchPublicChannelsWithoutMembership to true for new installations (#36399)](https://github.com/mattermost/mattermost/commit/97c3b53873b0eca02e830dd4a92f7c9da97c3097) | 2026-05-06 |
| ecf8a741 | [Add unread badge to Recaps sidebar link (#36246)](https://github.com/mattermost/mattermost/commit/ecf8a741ac1f26b77071606026274f967355ddb2) | 2026-05-06 |
| a6ea65b4 | [Bumping prepackaged gitlab version to 1.12.2 (#36430)](https://github.com/mattermost/mattermost/commit/a6ea65b44b3ba4ce2be19fb500f3d458fbdcaabf) | 2026-05-06 |
| 34ef034d | [MM-68261 Add Button component to shared package (#36191)](https://github.com/mattermost/mattermost/commit/34ef034dd95c0e42c0c0cca3546170cb8283711a) | 2026-05-06 |
| 076beaff | [Update interdependency between packages to 11.8.0 (#36449)](https://github.com/mattermost/mattermost/commit/076beaff52256c9560cc7732218c6ae89e6e42bd) | 2026-05-06 |
| 6293e354 | [Translations update from Mattermost Weblate (#36404)](https://github.com/mattermost/mattermost/commit/6293e354c9999f373a6cdc4634f5de026deea0b0) | 2026-05-06 |
| e898ccdf | [MM-68397 Add shared package to STYLE_GUIDE.md (#36425)](https://github.com/mattermost/mattermost/commit/e898ccdf3d7ba09cf41785ee26b32d1b395c6998) | 2026-05-06 |
| 3b86b9e1 | [refactor(color_input): migrate ColorInput to a function component (#33363)](https://github.com/mattermost/mattermost/commit/3b86b9e14a2f6aef848c0df2bb388671dbf0b23d) | 2026-05-06 |
| 7f161bb2 | [Lower default test console log level from stdlog to debug (#36455)](https://github.com/mattermost/mattermost/commit/7f161bb24c78a8766d0e8d2381d9644e512f9a80) | 2026-05-06 |
| c1ddd774 | [MM-68654 Add Button to the Component Library (#36412)](https://github.com/mattermost/mattermost/commit/c1ddd77481f7cdc046cfa675b6b98aa5bc021bc3) | 2026-05-06 |
| 10ad2505 | [Split out buttonClassNames utility and use for most places Button isn't (#36328)](https://github.com/mattermost/mattermost/commit/10ad2505a787269d9a5505f55259778d03b8a397) | 2026-05-06 |
| c1107620 | [docs: import server/AGENTS.md from platform/AGENTS.md to ensure eager loading (#36400)](https://github.com/mattermost/mattermost/commit/c1107620bc69d2b7e662f86891e6db94786ff94b) | 2026-05-07 |
| 870c2c6b | [Add root id to webhooks (#36415)](https://github.com/mattermost/mattermost/commit/870c2c6b13f73b2833050036596fef4869f907be) | 2026-05-07 |
| 5da794ab | [MM-68543 Invalidate active WebConn session cache on global session revocation (#36332)](https://github.com/mattermost/mattermost/commit/5da794aba089efda18d05a02b254eaf8200cba5b) | 2026-05-07 |
| b1e44427 | [Update jira prepackaged version (#36442)](https://github.com/mattermost/mattermost/commit/b1e444274ff24db48d7e36ab31d257cb6b718d3e) | 2026-05-07 |
| d9b0e27f | [Fix flaky TestPluginAPIUpdateUserPreferences (#36458)](https://github.com/mattermost/mattermost/commit/d9b0e27fe8d44634ec32e3c3d846bb173e080fea) | 2026-05-07 |
| 69fbaece | [\[MM-68496\] Feature flag Managed Categories, expose Default Category Name to UI for channel creation and settings (#36289)](https://github.com/mattermost/mattermost/commit/69fbaeced9a52afffb8dcc37278e6084ef570880) | 2026-05-07 |
| 81f3af47 | [MM-67904 Fix inflated count in search results Messages tab (#36465)](https://github.com/mattermost/mattermost/commit/81f3af47389b7f1eeb390bc35ad862492a25db11) | 2026-05-07 |
| d1a4d74b | [MM-68589 add ever-member history lookup for ABAC sync (#36429)](https://github.com/mattermost/mattermost/commit/d1a4d74b423d5771e9e47fa364772786036c0e87) | 2026-05-07 |
| 826c2cef | [fix(bookmarks): disable DnD with one item; don't open menu without overflow (#36457)](https://github.com/mattermost/mattermost/commit/826c2cef0f9729d9799894342f5b9fc4b36d7a7f) | 2026-05-07 |
| 6d30bff0 | [fix: use Blob with application/json type for client_perf sendBeacon (#36466)](https://github.com/mattermost/mattermost/commit/6d30bff0a6887832444e2812c3bb7f72fc7f5c85) | 2026-05-08 |
| 97f0ad7c | [\[MM-68697\] Preserve sender file ID in plugin-relayed shared channel attachments (#36468)](https://github.com/mattermost/mattermost/commit/97f0ad7c3bd3a5a1583cf2d3f8ca8c43adbd8a33) | 2026-05-07 |
| 91de3d23 | [SEC-10179 Integrate test system IO for Playwright and Cypress (#36376)](https://github.com/mattermost/mattermost/commit/91de3d23837c2ec9293c73cb570d08aa86ccba1d) | 2026-05-08 |
| 33ddd8a4 | [fix: permission required by test-system-io actions (#36477)](https://github.com/mattermost/mattermost/commit/33ddd8a47bbf944688dfffb09f86d9256c7f6a3d) | 2026-05-08 |
| c3322b3a | [fix: permission required by e2e test-system-io actions (#36478)](https://github.com/mattermost/mattermost/commit/c3322b3a05ef35c6556e4a352a30ae5d482df949) | 2026-05-08 |
| 7795766a | [Update user active endpoint (#36469)](https://github.com/mattermost/mattermost/commit/7795766aa26e9d91ff94925efffe4849c412b3e3) | 2026-05-08 |
| e7c517bc | [Fix modal title line-height regression (#36452)](https://github.com/mattermost/mattermost/commit/e7c517bc98d0e69f1cc071ab7267d7ba8dc9d076) | 2026-05-08 |
| 56089922 | [Data spillage report generation (#36339)](https://github.com/mattermost/mattermost/commit/56089922e367257a9283a19f01c943622fee02b1) | 2026-05-08 |
| 3c792a05 | [MM-68433 - Fix DM/GM menu gating and header save in Channel Settings (#36213)](https://github.com/mattermost/mattermost/commit/3c792a0535d4372af8e1b10b105fd161d5e333c7) | 2026-05-08 |
| 40fe8782 | [Fix compact mode: consecutive bot reply header floating incorrectly in RHS (#36467)](https://github.com/mattermost/mattermost/commit/40fe8782efef1263aac10a3d52bae9350a49132b) | 2026-05-08 |
| 4a1fa5e2 | [Fix autocomplete clipping when RHS is open (#36287)](https://github.com/mattermost/mattermost/commit/4a1fa5e2af2f290fde02bdfb9116d8f14fab9192) | 2026-05-08 |
| 55044352 | [MM-68705 - Order-tolerant Shared Channel plugin API's for receiving attachments (#36486)](https://github.com/mattermost/mattermost/commit/5504435231e5264c79d6a794fed82bbf4e50bb23) | 2026-05-08 |
| b052f346 | [E2E/Playwright: balance shard timing by enabling fullyParallel in CI (#36054)](https://github.com/mattermost/mattermost/commit/b052f3463a618d98c2f335f9d96c1f6f6531cef5) | 2026-05-09 |
| e2700a96 | [test: mark autotranslation tests as fixme for quick green in ci and to address those separately (#36492)](https://github.com/mattermost/mattermost/commit/e2700a961afdb06cc7c4608dfa87f2047a22ef1b) | 2026-05-10 |
| 52c400ed | [Update E2E test workflows to use context names and server images and bump playwright workers to 10 (#36496)](https://github.com/mattermost/mattermost/commit/52c400ed1ff92c91b776898678148c279b476c13) | 2026-05-11 |
| 0afef776 | [Include connection ID in plugin context (#36074)](https://github.com/mattermost/mattermost/commit/0afef7760c40d87a492d540e1bb428a094e66cce) | 2026-05-11 |
| ef8a8cf2 | [Add Azurite to test infrastructure (#36485)](https://github.com/mattermost/mattermost/commit/ef8a8cf2cbf180ae18d94be060ddf08d8c07e68e) | 2026-05-11 |
| 55496c07 | [Update API docs (#36302)](https://github.com/mattermost/mattermost/commit/55496c07c116f415244b14bbead53bc728f04d6e) | 2026-05-11 |
| 71949aff | [chore: Update NOTICE.txt file with updated dependencies (#36499)](https://github.com/mattermost/mattermost/commit/71949aff69281fc17379ae642457a7f4b3dbc7d1) | 2026-05-11 |
| 7e1bec4d | [MM-68233: Fix sidebar icon not updating on channel privacy conversion via WS (#36006)](https://github.com/mattermost/mattermost/commit/7e1bec4d4f545ad6a62d7655513c865ef15c5fb8) | 2026-05-11 |
| 068e15f3 | [Bumping version of prepackaged github plugin to v2.7.1 (#36482)](https://github.com/mattermost/mattermost/commit/068e15f31cbd84c72a886634080ab346749d416a) | 2026-05-11 |
| bbbfc019 | [Replace bild imaging library with boxes-ltd/imaging (#36261)](https://github.com/mattermost/mattermost/commit/bbbfc019a97bb8248e01943f30299f3825d7be33) | 2026-05-11 |
| dbaaa364 | [ci: gate flaky PR comments on zero merged failures (#36474)](https://github.com/mattermost/mattermost/commit/dbaaa364162599c3a89ec7788e6daf64d9122902) | 2026-05-11 |
| 5bdf2b66 | [Fix flaky TestCreatePost upload_file subtests (#36453)](https://github.com/mattermost/mattermost/commit/5bdf2b6633498bc745a74d38272ba4d1ddef6e4a) | 2026-05-11 |
| 91f8297c | [store: use noTimeoutContext for schema dump queries (#36502)](https://github.com/mattermost/mattermost/commit/91f8297c931110efa90beb736bb6042cb3b8b895) | 2026-05-11 |
| 6083cc22 | [MM-68196 Adding Global Classification configuration and banners (#36231)](https://github.com/mattermost/mattermost/commit/6083cc22822255631fabbfcbe72fc57edb9a609d) | 2026-05-11 |
| 3c39d615 | [Fix invite modal autocomplete clipping (#36505)](https://github.com/mattermost/mattermost/commit/3c39d615443e6a5782fe68d30fc63382bf11953c) | 2026-05-11 |
| 5c21fbbc | [\[MM-68588\] Add notice in System Console when policy has mixed channel… (#36350)](https://github.com/mattermost/mattermost/commit/5c21fbbc0f9145ed083a0f0bccd5848457676401) | 2026-05-12 |
| 69f30c21 | [MM-68708 - Fix TestCreatePost shared DM/GM subtests when env pins feature flag (#36488)](https://github.com/mattermost/mattermost/commit/69f30c21e93f87cd7f2f08b913ec052bffb8ac6d) | 2026-05-12 |
| 0530d60e | [MM-68722 - Set higher statistics target on posts.rootid and posts.channelid (#36506)](https://github.com/mattermost/mattermost/commit/0530d60e4af9d45d779af773a8e25c0bf0922b3f) | 2026-05-12 |
| f3ec71f2 | [wrap instead of embedding sqlx.DB (#36510)](https://github.com/mattermost/mattermost/commit/f3ec71f25faf0621656d5fffe1257a205fe5c2b9) | 2026-05-12 |
| e3fbf871 | [MM-68149: Upgrade to Go 1.26.2 (#36418)](https://github.com/mattermost/mattermost/commit/e3fbf8711f73ac1266ebc943f88999175c2594ef) | 2026-05-12 |
| 5661fe19 | [MM-68501 - implement GetMaskedVisualAST and wire API handler (#36413)](https://github.com/mattermost/mattermost/commit/5661fe19416045eb06eff77e2a2f532d428b007f) | 2026-05-12 |
| 8a8a4ac8 | [Add `Session` field to `Subject` (#36523)](https://github.com/mattermost/mattermost/commit/8a8a4ac8b14ff50f3423008024c6751cd0852b32) | 2026-05-12 |
| d8612e37 | [\[MM-2541\] Shortcut to mark all channels as read for a team (#34012)](https://github.com/mattermost/mattermost/commit/d8612e378f61933ae8fb7e66c0308eb9a13c42e6) | 2026-05-13 |
| 11b55b77 | [Document Mattermost cloud startup flow (#36559)](https://github.com/mattermost/mattermost/commit/11b55b77f33f13de3b2f4c885ac9a3911e0e42ae) | 2026-05-13 |
| 323841e9 | [Add board channel types (BO/BP) for Integrated Boards (#35887)](https://github.com/mattermost/mattermost/commit/323841e9c560e75a4f8fd3d106b0fd2d780216fc) | 2026-05-13 |
| 47d4720f | [chore(ci): consolidate openldap runner prep into a composite action (#36563)](https://github.com/mattermost/mattermost/commit/47d4720ff4e83063a0583b460d976b7033bed26a) | 2026-05-14 |
| 0c98113a | [MM-65058 Make Direct Messages modal load GMs when needed (#36548)](https://github.com/mattermost/mattermost/commit/0c98113a1708a9a73867795d52f755b4ec160ef3) | 2026-05-14 |
| d1fb57bc | [Add .envrc to .gitignore (#36567)](https://github.com/mattermost/mattermost/commit/d1fb57bc375db6e313596090438a6a2fa65cdfef) | 2026-05-14 |
| 4aa1c58e | [ci: invalidate poisoned shard-timing cache and guard future saves (#36568)](https://github.com/mattermost/mattermost/commit/4aa1c58e37bd8fcc01455d4f7747a2495fccc20f) | 2026-05-14 |
| 9f1fe90b | [Migrate CPA to the v2 Property System (#36180)](https://github.com/mattermost/mattermost/commit/9f1fe90b69853f5f6111011bbbe02da4b404b1cc) | 2026-05-14 |
| f604ec7a | [MM-68662: Add Azure Blob Storage filestore backend (#36498)](https://github.com/mattermost/mattermost/commit/f604ec7a5ca540dd7a94a99781276fde34427ad8) | 2026-05-14 |
| d43dbe97 | [Update Playbooks plugin to v2.9.0 (incl. FIPS) (#36570)](https://github.com/mattermost/mattermost/commit/d43dbe972ed35ee419d4eda0d66f259c5d5ff08f) | 2026-05-14 |
| d4fc0ecb | [MM-68150: Upgrade golangci-lint to v2.12.2 (#36554)](https://github.com/mattermost/mattermost/commit/d4fc0ecb1c352280ecc07aa48386756cf234d6ad) | 2026-05-14 |
| 51fd952a | [MM-67771: Update Report a Problem to email flow (#35900)](https://github.com/mattermost/mattermost/commit/51fd952ae6fe02555b7ed1b7b05d9e97f1e90c09) | 2026-05-15 |
| 54bee006 | [MM-68332: consistently enforce query timeouts (#36522)](https://github.com/mattermost/mattermost/commit/54bee00622d4ada34a92b893e988afd29223a5d1) | 2026-05-15 |
| fa1255f1 | [Update Calls to v1.11.5 (#36574)](https://github.com/mattermost/mattermost/commit/fa1255f149f210b94b96c0a98aa3ff37d37d5986) | 2026-05-15 |
| d75155b3 | [Add flaky test webhook notification (#36573)](https://github.com/mattermost/mattermost/commit/d75155b39df6989dab6df13d965886c50668c483) | 2026-05-15 |
| 6aae94f2 | [Add Display Name to User Properties in Webapp (#36363)](https://github.com/mattermost/mattermost/commit/6aae94f20bbfafe0289a00de65f4990eaac2da76) | 2026-05-15 |
| 3f3d8408 | [Return descriptive errors from Role.IsValid and Role.IsValidWithoutId (#36582)](https://github.com/mattermost/mattermost/commit/3f3d8408b2877e73401b8706363eaf1f45a5814c) | 2026-05-15 |
| deafd88f | [MM-68762: Discoverable Private Channels — Server data layer (#36539)](https://github.com/mattermost/mattermost/commit/deafd88fd5a8cf423ee2caa660fd8958673456ef) | 2026-05-15 |
| 02023f03 | [\[MM-68463\] New endpoint to GET user by auth_data (#36352)](https://github.com/mattermost/mattermost/commit/02023f0328e5bb9e04ca06f25c2284efbc1f1759) | 2026-05-15 |
| 8eb97fa6 | [refactor: remove redundant status update jobs from E2E test workflows (#36579)](https://github.com/mattermost/mattermost/commit/8eb97fa6c3960aeb12cf17a9c526eb02e149d9b8) | 2026-05-16 |
| 238867e2 | [MM-68732: Remove global mutex for login attempts in favour of database serialization (#36515)](https://github.com/mattermost/mattermost/commit/238867e24762ab1557f676c589820615d7293d5b) | 2026-05-18 |
| 669eb104 | [Fix webhook list ordering instability when paginating (MM-65732) (#36470)](https://github.com/mattermost/mattermost/commit/669eb104c60c82e3e3eed2b18d1e7c64877aa71e) | 2026-05-18 |
| 9d061555 | [Update bot checks (#36503)](https://github.com/mattermost/mattermost/commit/9d0615554077ca123057e9bab158f94f2e0c52a9) | 2026-05-18 |
| f067fcde | [MM-66339 Hide empty content-flagging "With comment" section in reviewer DM (#36552)](https://github.com/mattermost/mattermost/commit/f067fcde92eb16ef1bec24a8ddc1856fc3ca7f1d) | 2026-05-18 |
| bab90098 | [MM-68592: Add leave confirmation modal for policy-added public channels (#36439)](https://github.com/mattermost/mattermost/commit/bab90098251922b8c7df136b0f3a30c7de7727bc) | 2026-05-18 |
| 479103d8 | [chore: Update NOTICE.txt file with updated dependencies (#36609)](https://github.com/mattermost/mattermost/commit/479103d8684e9dd79b0e861f03259fe89be25c4e) | 2026-05-18 |
| f0360a83 | [Data spillage report generation UI (#36340)](https://github.com/mattermost/mattermost/commit/f0360a838af51ab1e204ed05b0bcb9234f530a41) | 2026-05-18 |
| d4471bec | [Mm 68503 be abac mask save path masking (#36513)](https://github.com/mattermost/mattermost/commit/d4471bece166ea55aa605e750cfa1ac4a9580eb8) | 2026-05-18 |
| 9bd77d3f | [MM-68702: Reject demoting bot accounts to guest (#36487)](https://github.com/mattermost/mattermost/commit/9bd77d3fc4d2af3f7f0259a205174e76a1a276e1) | 2026-05-18 |
| 548183d7 | [Mm 68282 admin ephemeral mode (#36194)](https://github.com/mattermost/mattermost/commit/548183d748ada9af25eb8d7a4cced1064cec4532) | 2026-05-18 |
| 23b4d827 | [MM-68197 Show classification banners in web and desktop apps (#36490)](https://github.com/mattermost/mattermost/commit/23b4d8275bb2d8d8649e67cbd07e8bc564aa58d0) | 2026-05-19 |
| 1d1580cb | [chore: update reusable workflows to specific commit sha (#36600)](https://github.com/mattermost/mattermost/commit/1d1580cb3c62681346120a1689fa392952fbb899) | 2026-05-19 |
| 9d318dc4 | [refactor: speed up E2E test workflows and eliminate npm cache-restore failures (#36599)](https://github.com/mattermost/mattermost/commit/9d318dc4cdabe6c9fd76a286ba7c07515a991fec) | 2026-05-19 |
| 0675d0ea | [Automations for config.json, API, audit log event, and Go release notes (#36075)](https://github.com/mattermost/mattermost/commit/0675d0ea0b38e29976af4774041216d182f7e9fc) | 2026-05-19 |
| 92f6870a | [Add "last used" field for incoming webhooks (#36416)](https://github.com/mattermost/mattermost/commit/92f6870a2b97636876a3a6ebedf7ddac962a1e9f) | 2026-05-19 |
| 7bb6fb34 | [Fix AI toolbar separator visibility (#36356)](https://github.com/mattermost/mattermost/commit/7bb6fb347b75b99779351615bdb0968b94099c81) | 2026-05-19 |
| 5cd26002 | [Hide Download Apps link when running in Desktop app (#36614)](https://github.com/mattermost/mattermost/commit/5cd26002d3e91da57ab565af9941f12c7ecfd407) | 2026-05-19 |
| 5566604e | [MM-68838: Ping a restored plugin remote immediately on re-register (#36592)](https://github.com/mattermost/mattermost/commit/5566604e030b8e3085c0b1a708e739557a0c394e) | 2026-05-19 |
| 1ffa4d89 | [Add Docker Hub login to Cloud Agent start hook. (#36632)](https://github.com/mattermost/mattermost/commit/1ffa4d89941e9b5cdbe50466081e5149f83415c2) | 2026-05-19 |
| 345a0b76 | [Mm 68506 fe abac mask fe table editor cel and e2e (#36517)](https://github.com/mattermost/mattermost/commit/345a0b76a6d1a3c4dfc467b4b10700ee30a08ca8) | 2026-05-19 |
| 2db50746 | [Add auth token to flaky test webhook (#36636)](https://github.com/mattermost/mattermost/commit/2db507464d18afeaf975204f89223258e41bf8a6) | 2026-05-19 |
| 41f3b226 | [Fix flaky E2E tests (Cypress + Playwright) (#36637)](https://github.com/mattermost/mattermost/commit/41f3b22679300652a4fa0e2c818a6387f553479e) | 2026-05-19 |
| 51c6d521 | [Fix config Sanitize fields missing from desanitize, causing FakeSetting to be persisted (#36619)](https://github.com/mattermost/mattermost/commit/51c6d5219f10a5a2b264e88181740b4ebb18fef1) | 2026-05-20 |
| c74e51f3 | [chore(ci): upgrade Go to 1.26.3 in build container Dockerfiles (#36648)](https://github.com/mattermost/mattermost/commit/c74e51f35ec77c14b0283c88449bb701cb03cb7e) | 2026-05-20 |
| 0790fc72 | [Upgrade Go to 1.26.3 (#36656)](https://github.com/mattermost/mattermost/commit/0790fc7281d7e31ba070ae8bc126df70501ef1d1) | 2026-05-20 |
| 6189a3f5 | [\[MM-66489\] Pull and populate certificate from metadata endpoint (#36557)](https://github.com/mattermost/mattermost/commit/6189a3f54a072a339b9e2943072e11ac4b2f4083) | 2026-05-20 |
| a84941be | [Remove Legacy Interactive Dialog code (#35874)](https://github.com/mattermost/mattermost/commit/a84941bec1bdf4f069e75650ec48b0aff61bdcba) | 2026-05-20 |
| 448a6428 | [Add inline action buttons for bot-posted markdown (#36219)](https://github.com/mattermost/mattermost/commit/448a642835da50b82106ec8ad9ae6d0a200f6bae) | 2026-05-20 |
| 2c925ccf | [MM-68151: Update server dependencies (#36571)](https://github.com/mattermost/mattermost/commit/2c925ccf88245bef4fe9bb84c8d1e97b65dee3e5) | 2026-05-20 |
| c4b36dee | [Add user attribute validation banners (#36595)](https://github.com/mattermost/mattermost/commit/c4b36dee168f0a841acae674c800cc51c7928717) | 2026-05-20 |
| 77f9ecdf | [Upgrade Go to 1.26.3 and update deps in tool modules (#36658)](https://github.com/mattermost/mattermost/commit/77f9ecdfde76ce011a0573d33de0dfda764ff20a) | 2026-05-20 |
| 981e5341 | [Fix flaky TestUserHasJoinedChannel (#36660)](https://github.com/mattermost/mattermost/commit/981e5341ca86180820b9d8695713c499d96d96df) | 2026-05-20 |
| a7ef484f | [\[MM-68576\] Add SAML connectivity status to support packet diagnostics (#36321)](https://github.com/mattermost/mattermost/commit/a7ef484feea794095a6ca5f0de9b767fe5db5fdc) | 2026-05-21 |
| 5cacd267 | [Fix config-change-checker to use merge-base for per-file diffs (#36670)](https://github.com/mattermost/mattermost/commit/5cacd26776684792de1f6b4b1bf5bac56f0edf14) | 2026-05-21 |
| 02bae8c3 | [Fix: Global Threads view shows only 1 quick reaction emoji instead of 3 (MM-68681) (#36512)](https://github.com/mattermost/mattermost/commit/02bae8c3a1caaacc435267c00aeee31a42fe6a1b) | 2026-05-21 |
| 6b20092e | [Fix MM-57406: prevent IPv6 hex segments from parsing as emoji (#36541)](https://github.com/mattermost/mattermost/commit/6b20092e7a1fc204c1176be1ab31dc23ca802d8b) | 2026-05-21 |
| 2ab07701 | [\[MM-68577\] Add OAuth2/OpenID Connect provider status to support packet (#36451)](https://github.com/mattermost/mattermost/commit/2ab07701b5b8fe352367121d820b3192047cabe4) | 2026-05-21 |
| bc757c5c | [Fix content flagging update for unloaded posts (#36504)](https://github.com/mattermost/mattermost/commit/bc757c5c547299ece1c46aec28c708242e8e2220) | 2026-05-21 |
| 7739b349 | [\[MM-68578\] Add support packet DB performance diagnostics (#36324)](https://github.com/mattermost/mattermost/commit/7739b349a01c1805ae2684764b890702a3433a00) | 2026-05-21 |
| ba1cec51 | [\[MM-68693\] Resource level permission policies and new simulation (#36472)](https://github.com/mattermost/mattermost/commit/ba1cec51a54474496875fc8e14e144bfffa4919e) | 2026-05-21 |
| eeb3c1ec | [MM-67237 - Open file preview modal when clicking draft attachment thumbnails. (#36590)](https://github.com/mattermost/mattermost/commit/eeb3c1ec04560f449fb0aa791f2ca097e3ac18fb) | 2026-05-21 |
| 29fe2789 | [Exclude webhook posts from thread participation check (#36673)](https://github.com/mattermost/mattermost/commit/29fe2789a0e0a68bb354b2772eb2b67ac432daf4) | 2026-05-21 |
| e6c59693 | [MM-68763: Discoverable Private Channels — Server feature complete (visibility, ABAC, queue API) (#36580)](https://github.com/mattermost/mattermost/commit/e6c59693af1778e9bc17c5c34adadfa71d796d1c) | 2026-05-21 |
| b9e8d5ce | [MM-68763: fix BuildAccessControlSubject call missing channelID argument (#36681)](https://github.com/mattermost/mattermost/commit/b9e8d5ce8213cef0295ece336989b16ef84ffbe3) | 2026-05-21 |
| 03f2eaaa | [\[MM-68400\] Four plugin hooks and ChannelGuard enforcement (#36152)](https://github.com/mattermost/mattermost/commit/03f2eaaa0b81b555dc33790a8d1846481a830f4c) | 2026-05-21 |
| 3570814d | [MM-68316: add `mattermost db ping` subcommand (#36406)](https://github.com/mattermost/mattermost/commit/3570814ddd3c2afffc01c244c8ce7d77a9c3f857) | 2026-05-21 |
| 6ee3fb9a | [Fix membership policy edit action navigation (#36690)](https://github.com/mattermost/mattermost/commit/6ee3fb9af19120245e5ca44dce3296d1e0419dbf) | 2026-05-22 |
| b0d2f836 | [Translations update from Mattermost Weblate (#36695)](https://github.com/mattermost/mattermost/commit/b0d2f83620e0f02dfb7818f837d278234fbdc087) | 2026-05-22 |
| 209606f1 | [MM-68419: Add expires_at to PAT data model and enforce expiry at token validation (#36243)](https://github.com/mattermost/mattermost/commit/209606f15b2aefd95c80c8b0db1ba7d3b9d5eba5) | 2026-05-22 |
| b4aa46a4 | [Bumping version of prepackaged boards plugin (#36701)](https://github.com/mattermost/mattermost/commit/b4aa46a4be5f4eef83163e41d6b1ef880592d01f) | 2026-05-22 |
| 18204958 | [Skip flaky TestGetLogs (MM-68910) (#36659)](https://github.com/mattermost/mattermost/commit/182049583bd2a44d8db93211b4173b0a84811309) | 2026-05-22 |
| efdebec6 | [Fix flaky TestPatchTeam GroupConstrained subtest (#36689)](https://github.com/mattermost/mattermost/commit/efdebec6ad71d3d7fe3c750e40cd4ac30cf5970d) | 2026-05-22 |
| 27d14422 | [Fix inactive team icon active styling (#36683)](https://github.com/mattermost/mattermost/commit/27d144226f89cdca5c995f18569d259801adfcae) | 2026-05-22 |
| c6315459 | [MM-66162: harden GET /sharedchannels/{id}/remotes error path and add WS guard (#36696)](https://github.com/mattermost/mattermost/commit/c63154598c6137e4452d4ee0ca83ddbe028da57a) | 2026-05-22 |
| 4e01dae5 | [Fix flaky TestPreparePostForClient/files (#36631)](https://github.com/mattermost/mattermost/commit/4e01dae5342ffaa5db7be23160d3e7c3b46b2d73) | 2026-05-22 |
| e8632bd4 | [\[MM-68777\] Add `admin` property field permission level (#36558)](https://github.com/mattermost/mattermost/commit/e8632bd45687f65f606efd944d86262156eee5fe) | 2026-05-22 |
| f8e233cc | [Fix Group Details role dropdown not updating UI when changing role (#36561)](https://github.com/mattermost/mattermost/commit/f8e233cc391babde53bc7df8b0903456c0d34c7b) | 2026-05-22 |
| 834a86b5 | [MM-68248: Support OpenSearch v3 (#36617)](https://github.com/mattermost/mattermost/commit/834a86b5e3dde472b042316556253b69e399f7f3) | 2026-05-22 |
| b0185d98 | [update packages to Fix npm audit vulnerabilities (#35810)](https://github.com/mattermost/mattermost/commit/b0185d9817bd61bc118a32a86f30ddeecf4f91fb) | 2026-05-22 |
| 44ba06ee | [MM-68248: Handle missing OpenSearch indexes gracefully before reindex (#36712)](https://github.com/mattermost/mattermost/commit/44ba06ee3c8b53f1267928e6a189c137d75f43e0) | 2026-05-22 |
| b60ba8b6 | [chore(ci): allow build-server-image to build and push from release branches (#36716)](https://github.com/mattermost/mattermost/commit/b60ba8b6b4100797d7a22374682f3aafc3d44bfc) | 2026-05-22 |
| 7e75035c | [Add Data Spillage discovery page (#36697)](https://github.com/mattermost/mattermost/commit/7e75035cb6766afc8424c7ee299ef4184a249e92) | 2026-05-22 |
| 508f1551 | [Fix flaky TestScrubPost (#36686)](https://github.com/mattermost/mattermost/commit/508f1551e3897b7d0f763e4176bdae822312c273) | 2026-05-25 |
| cfafefe5 | [Used short mode of data spillage report card in threads view to fix spacing issue (#36709)](https://github.com/mattermost/mattermost/commit/cfafefe58c8eac2682e08bc9dd2eefe7d368af2b) | 2026-05-25 |
| 4d8c25f0 | [\[MM-68736\] Reconcile partial GM membership in bulk import (#36542)](https://github.com/mattermost/mattermost/commit/4d8c25f040f870848df47334867c8a2cf37c77b9) | 2026-05-25 |
| c6b59cc9 | [MM-68663: Admin console support and Test Connection generalization for Azure Blob Storage (#36583)](https://github.com/mattermost/mattermost/commit/c6b59cc9a757999f7f68a1f8f5a8daa76e4f7664) | 2026-05-25 |
| b609ec59 | [chore: Update NOTICE.txt file with updated dependencies (#36729)](https://github.com/mattermost/mattermost/commit/b609ec59fc606563f6e9dc892bbc1d694b12ebde) | 2026-05-25 |
| 25bf5edc | [MM-68773 Fix bug with HTML encoding in proxied image URL (#36555)](https://github.com/mattermost/mattermost/commit/25bf5edc4f3b2b8597ebeafb6fab1d66c25e6cd1) | 2026-05-25 |
| 462f34ac | [Generate default_roles_permissions.js from a live server snapshot (#36698)](https://github.com/mattermost/mattermost/commit/462f34ac6cd7ef10dc7a4fd975660081f49d5f7f) | 2026-05-25 |
| e1189a30 | [MM-68914 - Fix DM/GM channel member import defaulting SchemeUser to false (#36661)](https://github.com/mattermost/mattermost/commit/e1189a3005aa1cb8afb3b922562c9e1a71a0b597) | 2026-05-25 |
| 67b49ad5 | [MM-68154: Upgrade imagemeta to v0.17.2 (#36588)](https://github.com/mattermost/mattermost/commit/67b49ad5c07417a0f2e4e77c5a5878f22f9b5c34) | 2026-05-25 |
| 099a18b8 | [Remove some leftover code related to removed notify admin feature (#36680)](https://github.com/mattermost/mattermost/commit/099a18b84e3be1037ac1fe30dc4797d8378a2909) | 2026-05-25 |
| 1e98d75e | [MM-68944 Fix data spillage report affordances (#36685)](https://github.com/mattermost/mattermost/commit/1e98d75e80ec13f53856d7d226e2cd90a3e9b649) | 2026-05-26 |
| 16c8f9d6 | [MM-68955 Offset onboarding checklist above bottom classification banner (#36691)](https://github.com/mattermost/mattermost/commit/16c8f9d6e3287f3466599e79fd0d633ec193d034) | 2026-05-26 |
| d9c13884 | [\[MM-68649\] Add Session Attributes from user agent for use in Permission Policies (#36511)](https://github.com/mattermost/mattermost/commit/d9c1388461553fbb6d0dca7cf2fba963265b6096) | 2026-05-26 |
| ecd72f79 | [MM-68787: Support sovereign-cloud endpoints for Azure Blob Storage (#36732)](https://github.com/mattermost/mattermost/commit/ecd72f79bdeb1b7129230b09c6689b7e499f2081) | 2026-05-26 |
| 41367fa7 | [Fix missing peer fields in package-lock.json (#36744)](https://github.com/mattermost/mattermost/commit/41367fa7b17c6d5c7e49e654e1c5a86e7a40e2e1) | 2026-05-26 |
| fc7b5c78 | [MM-68943 Wrap data spillage RHS action buttons (#36682)](https://github.com/mattermost/mattermost/commit/fc7b5c78a5d7113fbc5a88eb9bbadc8fadadc6e3) | 2026-05-27 |
| 8a957afc | [\[MM-68458\] Improve diagnostics.yaml readability: reorder server fields and add inline YAML comments (#36703)](https://github.com/mattermost/mattermost/commit/8a957afce2f1664582f450b925c246cef9bfdede) | 2026-05-27 |
| d563fdd5 | [Data spillage report api use available data (#36699)](https://github.com/mattermost/mattermost/commit/d563fdd5ac287044bf82c79b9ce87e81c3dfac8a) | 2026-05-27 |
| 472e4a01 | [MM-68664: Microsoft Entra ID / Default Credential authentication for Azure Blob Storage (#36733)](https://github.com/mattermost/mattermost/commit/472e4a01d2c2220d6b4dd20ecbb7f7f9f7653e12) | 2026-05-27 |
| 88e48a0e | [Fixed a bug where deleted post was broadcasted by the server and rest… (#36646)](https://github.com/mattermost/mattermost/commit/88e48a0e799d08164dbf8dac6a6ea85876eabd91) | 2026-05-27 |
| 5984d7d6 | [MM-68938 Fix clipped policy editor tooltips (#36684)](https://github.com/mattermost/mattermost/commit/5984d7d6e3d8fca0294bb162df29a5bbcfee7ddf) | 2026-05-27 |
| 159ed5ad | [Return error when plugins use deprecated custom_profile_attributes group name (#36748)](https://github.com/mattermost/mattermost/commit/159ed5ad96e192921d9c3c1b9f0bc284deb48d20) | 2026-05-27 |
| a6e01986 | [\[MM-68999\] Add SchemaVersion to PropertyGroup for group-specific field schema versioning (#36747)](https://github.com/mattermost/mattermost/commit/a6e019863edbc518ae552ea6782762ec42fcbca2) | 2026-05-27 |
| b632c9ed | [Stop logging email subject when sending mail (#36765)](https://github.com/mattermost/mattermost/commit/b632c9ed1c76f9c7f07a99e78ac77617ce3696f7) | 2026-05-28 |
| 23d83b74 | [MM-65723 Validate user auth update requests (#36749)](https://github.com/mattermost/mattermost/commit/23d83b74d2fb5f77304e87b9246249c4121053f3) | 2026-05-28 |
| bf39b41c | [MM-68845: Tighten authorization on /share-channel autocomplete (#36662)](https://github.com/mattermost/mattermost/commit/bf39b41ca85f26217513a108325f2f3742e1097e) | 2026-05-28 |
| 1379beae | [MM-68840: Apply team sanitization on scheme teams endpoint (#36640)](https://github.com/mattermost/mattermost/commit/1379beae9833a490161cf654f9e661717984b42d) | 2026-05-28 |
| 800810e8 | [\[MM-69028\] Enable ClassificationMarkings feature flag by default (#36776)](https://github.com/mattermost/mattermost/commit/800810e88080a0a46d39ed6993ff5b456b1a8d67) | 2026-05-28 |
| 42f02158 | [Tighten CI workflows (#36778)](https://github.com/mattermost/mattermost/commit/42f021581fbed633dcd43e7e93a9127583f7944c) | 2026-05-28 |
| 0d0dd16d | [Fix classification modal save state (#36693)](https://github.com/mattermost/mattermost/commit/0d0dd16d4053732bbc617b96d92974e7c903d68a) | 2026-05-28 |
| 8c8f28f9 | [MM-69042 Add user setting to experimentally enable concurrent React (#36785)](https://github.com/mattermost/mattermost/commit/8c8f28f943e811572e16c63f9dfd80b4e3fe081a) | 2026-05-28 |
| 5ad66d3f | [Fix flaky TestUpdatePropertyValues_WriteAccessControl (#36784)](https://github.com/mattermost/mattermost/commit/5ad66d3f76d2db69008aba9af4c5ffc27d1fc7f4) | 2026-05-29 |
| 495fbc84 | [MM-68978 - Harden ABAC masking guards and fix sentinel detection (#36740)](https://github.com/mattermost/mattermost/commit/495fbc84373c100c541582f001cd7aa548197b38) | 2026-05-29 |
| e3823a51 | [Fix flaky TestScheduleOnceSequential (#36805)](https://github.com/mattermost/mattermost/commit/e3823a51ce5ce522f296306dbcb142dd76a5c07e) | 2026-05-29 |
| 1f4f1b4c | [ \[MM-69025\] Enable session attributes in simulation (#36773)](https://github.com/mattermost/mattermost/commit/1f4f1b4c5979b58a3978ea183f21683343282031) | 2026-05-29 |
| 9fdcad41 | [Fix flaky TestCheckTeamsChannelsIntegrity (#36754)](https://github.com/mattermost/mattermost/commit/9fdcad41c21461a42da1242c4bfb8a133c5eea69) | 2026-05-29 |
| bcf51196 | [MM-68854: Dispatch Test Connection on ExportDriverName when dedicated export filestore is active (#36759)](https://github.com/mattermost/mattermost/commit/bcf511968217cd0f65cbead926e03260bfcd1011) | 2026-05-29 |
| 307452bb | [\[MM-67113\] Add license preview/diff view when uploading a new license (#34877)](https://github.com/mattermost/mattermost/commit/307452bb55f7bd9c752109802f46688220840836) | 2026-06-01 |
| 8d885139 | [chore: Update NOTICE.txt file with updated dependencies (#36825)](https://github.com/mattermost/mattermost/commit/8d8851396816f5a1e375c9e6610973fbed159d31) | 2026-06-01 |
| 7c759e8a | [\[MM-69058\] Don't enable native channel banner when creating a classification banner (#36810)](https://github.com/mattermost/mattermost/commit/7c759e8ae4f24ea2a39614129220a8f41cf08918) | 2026-06-01 |
| 5283ca54 | [add PushNotification.Transport and related const (#36829)](https://github.com/mattermost/mattermost/commit/5283ca54b46b82e599306891a7561c957b472b60) | 2026-06-01 |
| da480519 | [Upgrade "@mattermost/compass-icons" to 0.1.61 (#36831)](https://github.com/mattermost/mattermost/commit/da48051967a28bbb0ccd063b46792d581532bb7d) | 2026-06-01 |
| ea6ac3f2 | [MM-68983: Tighten OAuth token issuance and cleanup on user deactivation (#36743)](https://github.com/mattermost/mattermost/commit/ea6ac3f229a82d61c4124998d8af26287b66d29b) | 2026-06-01 |
| a57695da | [MM-69002 Convert ESLint configs to flat config (#36750)](https://github.com/mattermost/mattermost/commit/a57695daa3e9dab5c6a798ae1cf107a91384e5d1) | 2026-06-01 |
| e9f62a66 | [MM-69003 Replace eslint-plugin-header with eslint-plugin-headers (#36766)](https://github.com/mattermost/mattermost/commit/e9f62a663918f1587d711d4beb1656208aca5c43) | 2026-06-01 |
| 5c360d80 | [MM-68995: reject deactivated guests on REST magic-link login (#36746)](https://github.com/mattermost/mattermost/commit/5c360d8077ae994681253c852f7ceb6f7c130d01) | 2026-06-01 |
| a84032f4 | [MM-69053 Log server message when a user has concurrent React enabled (#36837)](https://github.com/mattermost/mattermost/commit/a84032f40a6ab1dadc344914a1ab92a2fb934577) | 2026-06-02 |
| 19e7a2be | [Fix flaky TestCheckUsersEmojiIntegrity (#36756)](https://github.com/mattermost/mattermost/commit/19e7a2be283415958757eca10d65825d9e1f099f) | 2026-06-02 |
| 6c401066 | [Deleted removed post from content flagging redux store (#36803)](https://github.com/mattermost/mattermost/commit/6c401066f73462d445d4f6e3571646320debb8a5) | 2026-06-02 |
| 1b3dc637 | [\[MM-69078\] Surface plugin upload rejections as a toast (parity with download rejections) (#36838)](https://github.com/mattermost/mattermost/commit/1b3dc637845e65adf2ae0ea45212526d4914e58c) | 2026-06-02 |
| 127552ce | [Add user setting to disable auto-follow on channel-wide mentions (#36068)](https://github.com/mattermost/mattermost/commit/127552ce84201f4e442f8b41aebf2e8d93c7910b) | 2026-06-02 |
| 8e8b807a | [MM-68665: Implement FileBackendWithLinkGenerator for Azure (SAS for export downloads) (#36758)](https://github.com/mattermost/mattermost/commit/8e8b807a429115d27bf2d51e8761b10b67bdaf27) | 2026-06-02 |
| 9d27c060 | [Restrict group_constrained to channels that support group sync (#36812)](https://github.com/mattermost/mattermost/commit/9d27c06085d27d236278e8e374f374e18aea97d6) | 2026-06-02 |
| 6ef5d58b | [Board channel bookmarks with target_id and readonly bookmark API (#36572)](https://github.com/mattermost/mattermost/commit/6ef5d58b7f12950def5383e732415755859ed27b) | 2026-06-02 |
| 1e0bdaf0 | [MM-69057: Verify post ownership on inbound shared-channel edit/delete (#36814)](https://github.com/mattermost/mattermost/commit/1e0bdaf068ef2af7294d0ae0eff9b10e06cbfbc5) | 2026-06-02 |
| ab31663f | [MM-69010: Validate incoming webhook user membership (#36811)](https://github.com/mattermost/mattermost/commit/ab31663fce2c6faff4c051ae30e740e4af0dbc93) | 2026-06-02 |
| 6dac3b9d | [Harden post action request verification (#36840)](https://github.com/mattermost/mattermost/commit/6dac3b9df47b00dcdd6b6481305a3092b043aed4) | 2026-06-03 |
| 61643e10 | [MM-68952: Resolve public channel mentions for non-members under Compliance (#36815)](https://github.com/mattermost/mattermost/commit/61643e106605134bd88695f3cba206cd641169f0) | 2026-06-03 |
| 50952dec | [\[MM-68648\] Implement GetForGroup to get fields in the Property System, add caching for fields (#36836)](https://github.com/mattermost/mattermost/commit/50952dec3ff880bc031cd47628ebdf98f3fe6898) | 2026-06-03 |
| fb8cfbae | [Fix flaky TestSharedChannelPostMetadataSync (#36862)](https://github.com/mattermost/mattermost/commit/fb8cfbaef7617f8a4dd427a601cb34f2e36d7a4c) | 2026-06-03 |
| 563e1a95 | [ci: standardize checkout action inputs across workflows (#36876)](https://github.com/mattermost/mattermost/commit/563e1a951da9dfb0aab9a1e91bfb2d532a471999) | 2026-06-04 |
| aa03fae7 | [\[MM-69026\] Add zoom and pan to the image file preview (#36775)](https://github.com/mattermost/mattermost/commit/aa03fae744f73030357531df853f5c2eef75b852) | 2026-06-04 |
| 85dae1b8 | [MM-68417, MM-68420: API support for PAT expiry and admin policy settings (#36706)](https://github.com/mattermost/mattermost/commit/85dae1b8841cf7f64334937f5399c49e390c6b6e) | 2026-06-04 |
| ca19b0b8 | [Remove dynamic-virtualized-list from ignoreDependencies in config.yaml  (#36897)](https://github.com/mattermost/mattermost/commit/ca19b0b834c1c929eb1731d5fe885b20996438fc) | 2026-06-04 |
| 3fc5b942 | [\[MM-69115\] Fixed issue where channels could end up in two categories (#36875)](https://github.com/mattermost/mattermost/commit/3fc5b942927dede596ead4ebfec4f40085365f4b) | 2026-06-04 |
| 3af36e0a | [ci: scope GitHub Actions workflows (#36890)](https://github.com/mattermost/mattermost/commit/3af36e0a499b35a823ae39a715d4a1a72017bf4d) | 2026-06-04 |
| 4245b697 | [Pass explicit secrets to reusable server CI workflows (#36896)](https://github.com/mattermost/mattermost/commit/4245b69744ac33fbbb860fb2140e129e1489e352) | 2026-06-04 |
| 56015e8b | [ci: use variables in shell for workflows (#36904)](https://github.com/mattermost/mattermost/commit/56015e8b87711ad43ccf1faf3b23bcdf1a1c48e0) | 2026-06-04 |
| b4fcb472 | [Remove agent-browser skill and lockfile (#36930)](https://github.com/mattermost/mattermost/commit/b4fcb4720124074b360c0dca1239263a63298e50) | 2026-06-04 |
| 3440453d | [\[MM-68425\] Update marked (#36710)](https://github.com/mattermost/mattermost/commit/3440453d82613b1d8d67c93011c11d56a1380869) | 2026-06-04 |
| 1fc2824e | [chore(webapp): remove orphaned @types/react-custom-scrollbars (#36818)](https://github.com/mattermost/mattermost/commit/1fc2824e58d547165dd0bbcf1a88c9fee9edf543) | 2026-06-05 |
| 01892e9d | [MM-69132 Migrate DynamicVirtualizedList to TypeScript (#36923)](https://github.com/mattermost/mattermost/commit/01892e9d06035f14895769138c745f4c05cca5de) | 2026-06-05 |
| b5ee857a | [MM-67616: Load synced remote member profiles so participant list refreshes (#36861)](https://github.com/mattermost/mattermost/commit/b5ee857af81befcbe348c88bd9be70b7812ab455) | 2026-06-05 |
| ff01f820 | [MM-69131: Keep app__body off backstage routes to fix dark-theme styling (#36928)](https://github.com/mattermost/mattermost/commit/ff01f820439f7e91ac2016af943f5f54096f9386) | 2026-06-05 |
| ca87bd7d | [MM-60669 Prevent bot users from becoming the first system admin (#36867)](https://github.com/mattermost/mattermost/commit/ca87bd7d24ecce9ad0da4ae58a30342e68143d0d) | 2026-06-08 |
| 20c4d892 | [Add additional PluggableErrorBoundaries (#36854)](https://github.com/mattermost/mattermost/commit/20c4d8925e7400550924ca62b369acad5fb4c461) | 2026-06-08 |
| 27b2525e | [Fix flaky TestPluginAPIGetUserPreferences (#36855)](https://github.com/mattermost/mattermost/commit/27b2525e88c3b38eb11ce6c5eeb46620eb50f7f9) | 2026-06-08 |
| b7dda343 | [Move flaky test report from PR comment to Mattermost channel (#36965)](https://github.com/mattermost/mattermost/commit/b7dda3435c3f2f355619fc52d385b241e765e0ea) | 2026-06-08 |
| ffd48149 | [MM-T3436: add Cypress E2E for Actiance XML compliance export download (#36970)](https://github.com/mattermost/mattermost/commit/ffd48149404f4a5d6cd00128be244b44aea4bb2a) | 2026-06-08 |
| f6e7e716 | [Migrate Zephyr manual tests to Cypress E2E (#36971)](https://github.com/mattermost/mattermost/commit/f6e7e716953f4e30e3d65c0466651bb697c53ed2) | 2026-06-08 |
| 755925fb | [MM-68830: Preserve unknown permissions during migrations on downgrade (#36888)](https://github.com/mattermost/mattermost/commit/755925fb739ba40ac2486fdcfb8e90c2eaf4f35b) | 2026-06-09 |
| 7ad8f71b | [Automate schema migration release notes process (#36760)](https://github.com/mattermost/mattermost/commit/7ad8f71bf50da156bf8ad3a8e1165d29b535dd93) | 2026-06-09 |
| 684ddb32 | [\[MM-68988\]\[MM-68989\]\[MM-68990\]\[MM-68991\]\[MM-68997\]\[MM-68998\] Session Attributes MVF - Server-work (#36934)](https://github.com/mattermost/mattermost/commit/684ddb32a90378760ee2b3d6b0be4224e01a8e43) | 2026-06-09 |
| cc1547ac | [\[MM-68618\] Harden file removals (#36427)](https://github.com/mattermost/mattermost/commit/cc1547ac46b49e9484c1dcf95119b67dc6bf7409) | 2026-06-09 |
| f3836530 | [MM-69003 Mostly share ESLint config between web app and E2E tests (#36767)](https://github.com/mattermost/mattermost/commit/f3836530b72e0822a60e83ad00a49258d88e306a) | 2026-06-09 |
| 493fb0ce | [Fix Permission/Membership Policies list columns running together (#36963)](https://github.com/mattermost/mattermost/commit/493fb0ce554da9cffb647151029080138c0ab1b9) | 2026-06-09 |
| de0779d1 | [Update latest minor version to 11.9.0 (#36976)](https://github.com/mattermost/mattermost/commit/de0779d1bfcf5a10ca2d14d245406bb7d72e0988) | 2026-06-10 |
| 7ecd62dd | [ci: invoke post-server-ci workflows via workflow_call from Server CI (#36880)](https://github.com/mattermost/mattermost/commit/7ecd62ddc1220edb911181722d9a6829dabac509) | 2026-06-10 |
| 2e3c0ff2 | [MM-69175: Fix broken CI steps (#36989)](https://github.com/mattermost/mattermost/commit/2e3c0ff2788cbff793f2ff07544dc73c33d82219) | 2026-06-10 |
| fb77dec4 | [Configure Dependabot cooldown for GitHub Actions updates (#36887)](https://github.com/mattermost/mattermost/commit/fb77dec49360b7eae9fca5071ea11197c071081e) | 2026-06-10 |
| 58022aad | [Fix flaky TestUserHasJoinedChannel (#36985)](https://github.com/mattermost/mattermost/commit/58022aad5437e5049d25142e9998d7d70c5f4ba6) | 2026-06-10 |
| 6ecf1900 | [Keep plugin post action menus open when hovering away (#36991)](https://github.com/mattermost/mattermost/commit/6ecf19008f0f071b155901e523d01c17c39ddc05) | 2026-06-10 |
| 8a267c8a | [MM-69104: Elide plugin_statuses_changed payload (#36966)](https://github.com/mattermost/mattermost/commit/8a267c8ababdc7d2acd0aceed7c8451748603fd1) | 2026-06-10 |
| 99dd99b8 | [Fix flaky TestThreadStore Get unread reply counts for thread (#36926)](https://github.com/mattermost/mattermost/commit/99dd99b8e681af126785ceb8141413e43a7bf255) | 2026-06-10 |
| 3535473d | [Fix flaky TestBasicAPIPlugins/test_send_mail_plugin (#36834)](https://github.com/mattermost/mattermost/commit/3535473d967611d3043539a86f0d0282636e6ffb) | 2026-06-10 |
| 471fd8d1 | [Bound document content extraction time and decouple it from uploads (MM-69098) (#36856)](https://github.com/mattermost/mattermost/commit/471fd8d1ddff33457fc381aae1c1b40b6ab2d69a) | 2026-06-10 |
| 6583982b | [Fix stale channel members RHS list after ABAC access-rule member removal (#36964)](https://github.com/mattermost/mattermost/commit/6583982b26f4e63b68f060d65abc7359de49f3a0) | 2026-06-11 |
| d562481f | [Added pre-migration infra and a pre-migration for fixing schema ID migration numbers (#36870)](https://github.com/mattermost/mattermost/commit/d562481f82ad8801ba8c1b63f51e2e7f073efe6b) | 2026-06-11 |
| a08d806a | [Fix flaky-test Mattermost table for colspan section rows (#36993)](https://github.com/mattermost/mattermost/commit/a08d806a485547adddf73a0329dccdab2ad1cecb) | 2026-06-11 |
| d358d621 | [Fix "Mark as Unread" from channel sidebar when latest post is a system join/leave message (#36969)](https://github.com/mattermost/mattermost/commit/d358d621b2c56461a94a8a05141d42b1ced9eca4) | 2026-06-11 |
| 263b3c11 | [\[MM-68779\] MBE Phase 8a: registerChannelTypeOption (#36569)](https://github.com/mattermost/mattermost/commit/263b3c11d3754b631c8aa9012efa1b719fbf40db) | 2026-06-11 |
| d5415c0a | [Fix flaky TestPreparePostForClient/files (#36992)](https://github.com/mattermost/mattermost/commit/d5415c0a0dd150b3b752f9118d6759f642a86b53) | 2026-06-11 |
| 80eb4980 | [Fixes for the session attributes manifest (#37012)](https://github.com/mattermost/mattermost/commit/80eb49802dcb2135139527ef9afecec9e718b6fc) | 2026-06-11 |
| 93d0e619 | [Route Calls pushes through a VoIP token if present (#36726)](https://github.com/mattermost/mattermost/commit/93d0e6198daac749e0f35cb53cba9b07d0f4194d) | 2026-06-12 |
| ebf41be7 | [Stop shared channel sync error spam for deleted remote clusters (#36931)](https://github.com/mattermost/mattermost/commit/ebf41be7041077a656ba0d1653d2152b588d2149) | 2026-06-11 |
| 2db07164 | [Fix flaky TestGetMattermostLog (#36927)](https://github.com/mattermost/mattermost/commit/2db07164df09dc00c4b388b91a98f0e94c218fc1) | 2026-06-11 |
| 5cbbb76b | [MM-69003 Switch to using @stylistic/eslint-plugin for deprecated ESLint rules (#36770)](https://github.com/mattermost/mattermost/commit/5cbbb76b7b2598c93b3f271ef259f8753f986a6f) | 2026-06-11 |
| 4539cf73 | [Fix: Scroll pop caused because of delayed correction. (#36879)](https://github.com/mattermost/mattermost/commit/4539cf73fb17e634253d429c7d24969aca62bc62) | 2026-06-12 |
| aad6c8af | [\[MM-69228\] Default the CJKSearch feature flag to true (#37032)](https://github.com/mattermost/mattermost/commit/aad6c8afe846a9e3c3709fdea57dd7706ea605d4) | 2026-06-12 |
| 20c4cc42 | [Seed display names for session attribute fields (#37033)](https://github.com/mattermost/mattermost/commit/20c4cc42b2ee5b33b463189503ec146b550665bf) | 2026-06-12 |
| 46417611 | [MM - 69063 -  team abac backend and security gate (#36903)](https://github.com/mattermost/mattermost/commit/46417611228df242d939cfb4c21b44a79087f3f2) | 2026-06-12 |
| d4186537 | [Allow syncing any User Attribute field with LDAP/SAML and disable the editable toggle when synced (#37018)](https://github.com/mattermost/mattermost/commit/d41865371704120a65e03f0a481b60e17dbc692e) | 2026-06-12 |
| d081ae0c | [fix the mocks and the store layer (#37049)](https://github.com/mattermost/mattermost/commit/d081ae0c9e8b995f96f5e6d63c5479098dfd26a6) | 2026-06-14 |
| 9f7fdadc | [\[MM-68780\] MBE Phase 8b: registerChannelIconOverride (#36575)](https://github.com/mattermost/mattermost/commit/9f7fdadc70033dc568800fc4751d326f28268d86) | 2026-06-14 |
| 162322cc | [\[MM-68797\] MBE Phase 8c: registerChannelIconOverride follow-ups (#36576)](https://github.com/mattermost/mattermost/commit/162322cc4ce050e8e38573b1e07e6513bdc1efe2) | 2026-06-14 |
| f83ca8b9 | [Fix Permission Policy tab 403 for channel admins when no policy exists (#36980)](https://github.com/mattermost/mattermost/commit/f83ca8b9fa6fc1583e4063cc565e84e6bb3a0efc) | 2026-06-15 |
| 0a738be9 | [Fix S3 MoveFile/CopyFile failing on files larger than 5GiB (#37035)](https://github.com/mattermost/mattermost/commit/0a738be909b175e3e220500c1e981bf48762c9d7) | 2026-06-15 |
| c5bead3a | [\[MM-68781\] MBE Phase 8d: add hooks ChannelComposerBanner & ChannelIntro (#36581)](https://github.com/mattermost/mattermost/commit/c5bead3a4bfa5e59c280460422f3b169968b1c4f) | 2026-06-15 |
| c45a6755 | [MM-68976 Preserve PluginSettings.SignaturePublicKeyFiles on config patch endpoint (#36868)](https://github.com/mattermost/mattermost/commit/c45a67555359b161aeb931094c96c3b9557ac143) | 2026-06-15 |
| 00730d07 | [MM-68960 Improving UX for custom selections (#36878)](https://github.com/mattermost/mattermost/commit/00730d0744e34a26d3af80425580f50e93a48cc3) | 2026-06-15 |
| c621c9f7 | [MM-69213: Validate Azure storage account names and use httpservice for custom endpoints (#37014)](https://github.com/mattermost/mattermost/commit/c621c9f7e0ea6fa422e6c9a9df00f65aacbac055) | 2026-06-15 |
| c6f89ed7 | [Prevent plugins from changing the push notification transport type (#37059)](https://github.com/mattermost/mattermost/commit/c6f89ed71b598965b2a1c0aa5e428a2d830b9be6) | 2026-06-15 |
| c4b82e53 | [Fix flaky TestUserHasJoinedChannel (#37052)](https://github.com/mattermost/mattermost/commit/c4b82e53e4d0718e493435062926b2b37e813013) | 2026-06-15 |
| 79c7fe62 | [\[MM-68782\] MBE Phase 8e: add hook registerComposerPlaceholder (#36584)](https://github.com/mattermost/mattermost/commit/79c7fe6238981b8f3ecad3927fb5e124f6a311e7) | 2026-06-15 |
| d067d355 | [Fix flaky TestGetLinkMetadataFromCache (#37050)](https://github.com/mattermost/mattermost/commit/d067d355030f2f073d2979d61cc85812ac73c372) | 2026-06-15 |
| d90ea343 | [MM-69003 Update ESLint and related dependencies (#37039)](https://github.com/mattermost/mattermost/commit/d90ea343bcc2f33129c16cb6577ceb511b59cfcf) | 2026-06-15 |
| 2c0d2779 | [fix: user account menu ellipsis fixes (#34663)](https://github.com/mattermost/mattermost/commit/2c0d2779cbab2f87bfe14f43b2f6efaefe107c81) | 2026-06-16 |
| fbb05c58 | [\[MM-69126\] Fix custom emoji upload size and GIF frame limits (#36984)](https://github.com/mattermost/mattermost/commit/fbb05c584fe43e5a36758955a899541807e1f777) | 2026-06-16 |
| 2f47a0da | [Update docs impact review workflow to Claude Sonnet 4.6 (#37071)](https://github.com/mattermost/mattermost/commit/2f47a0dafb77e2bc527151bdfc2cf7324001878d) | 2026-06-16 |
| c48a6df9 | [Fix flaky TestStartServerPortUnavailable (#37047)](https://github.com/mattermost/mattermost/commit/c48a6df9106b166bffbf878b8b7bf8e6654abd2b) | 2026-06-16 |
| 6a3b21eb | [Mm 68846 masking from visual to canonical walker (#36772)](https://github.com/mattermost/mattermost/commit/6a3b21eb8f1133a95c5628cb474aefbe9b55d8ec) | 2026-06-16 |
| 52f30c33 | [\[MM-68783\] MBE Phase 8f: add registerPostHeaderComponent (#36586)](https://github.com/mattermost/mattermost/commit/52f30c332014f91549023e3327549a05f40f15f2) | 2026-06-16 |
| ab7a5364 | [Tighten thread membership cleanup on team membership changes (#36764)](https://github.com/mattermost/mattermost/commit/ab7a536435565c70f6d0debe4a3007dec6e18506) | 2026-06-16 |
| 8e409c48 | [\[MM-68785\] MBE Phase 8h: add registerProductSwitcherMenuItem (#36591)](https://github.com/mattermost/mattermost/commit/8e409c4890425c7564b3d517d17d8bafb84b77df) | 2026-06-16 |
| 0d08ed27 | [\[MM-68972\] MBE Phase 12: expose channel modals + favorite actions to plugins; reposition new-channel extraContent (#36860)](https://github.com/mattermost/mattermost/commit/0d08ed27141fecbe57d27aa0939607bbe1cd95dc) | 2026-06-16 |
| 3a74d876 | [\[MM-69119\] MBE Phase 12e: createButtonText for registerChannelTypeOption (#36938)](https://github.com/mattermost/mattermost/commit/3a74d876f82ecd007d0d1bfd1e65ea95d171f62f) | 2026-06-16 |
| 56291ddd | [\[MM-68620\] MBE Phase 13: channel-guard enforcement for scheduled posts & drafts (#36961)](https://github.com/mattermost/mattermost/commit/56291ddd1d46b897fd6398845f9cc39086c278ed) | 2026-06-16 |
| ffb86ddc | [Mattermost emoji reaction fix (#34903)](https://github.com/mattermost/mattermost/commit/ffb86ddcae526ff0c189000f8b41c3c9c98e6fba) | 2026-06-17 |
| 99ea984e | [Remove unused streaming port 8075 from cluster configuration (#37024)](https://github.com/mattermost/mattermost/commit/99ea984ead4e89bbc51de167004a70c5f1193fdc) | 2026-06-17 |
| 7581f5ca | [update Calls to v1.12.0 (#37077)](https://github.com/mattermost/mattermost/commit/7581f5ca605e8dc1e548babf7b9f15b0d73680c8) | 2026-06-17 |
| da5d7c8c | [Add Classification Markings discovery page for licenses below Enterprise (#37060)](https://github.com/mattermost/mattermost/commit/da5d7c8c6e90a0e85b6e2d89e55e38ba2ff57680) | 2026-06-17 |
| 29025d47 | [\[MM-69343\] Add MessagesWillBeConsumedWithContext hook (#37091)](https://github.com/mattermost/mattermost/commit/29025d478dc0030df9bc9ff65dbf60a772ec05eb) | 2026-06-17 |
| 9defd980 | [MM-60617 Add unit tests for admin_console secure_connections (#36484)](https://github.com/mattermost/mattermost/commit/9defd980928b4635b40bca66ff4cd97d43e13fd7) | 2026-06-17 |
| b3e2e8b8 | [Update prepackaged Agents, Boards, and Playbooks plugins for release-11.9 (#37092)](https://github.com/mattermost/mattermost/commit/b3e2e8b8e4f7498d42ff2ea38ee0b0ae98c78cc2) | 2026-06-18 |
| e1188034 | [Fix migration 184 number collision between master and release-11.8 (#37100)](https://github.com/mattermost/mattermost/commit/e1188034ffd62bc08ad21e2e116ab0abe3e77311) | 2026-06-18 |
| 5b132e22 | [\[MM-68421\] Frontend: PAT creation UI: expiry picker and status display (#36707)](https://github.com/mattermost/mattermost/commit/5b132e2230f4a9528e4c6f5f1d8d9c1516f1020c) | 2026-06-18 |
| f825da57 | [Fix flaky TestUserHasJoinedChannel (#37110)](https://github.com/mattermost/mattermost/commit/f825da577263e3ccae0b858832ccf5c43383c2a6) | 2026-06-18 |
| 017a7102 | [\[MM-69055\] Add rank property field type (#36809)](https://github.com/mattermost/mattermost/commit/017a7102f82ed9a36864d566690f1fe8d4e2beef) | 2026-06-18 |
| 7ed01d74 | [Skip docs impact review when Docs/Not Needed label is present (#37109)](https://github.com/mattermost/mattermost/commit/7ed01d749e2d8213ed36517652128d5495732a6a) | 2026-06-19 |
| 0bdd22bd | [Bumping prepackaged Gitlab version to 1.13.0 (#37124)](https://github.com/mattermost/mattermost/commit/0bdd22bdab58cd4f668b8314c492e21bc8c5d6f9) | 2026-06-19 |
| ee04f28e | [MM-69311: Add a new ClusterReliableFallbackLength metric (#37122)](https://github.com/mattermost/mattermost/commit/ee04f28e873d990a1719cfc13809ad8aa7cc6554) | 2026-06-19 |
| 3972ae0b | [Read pending scheduled posts from master to avoid replica lag gaps (#37104)](https://github.com/mattermost/mattermost/commit/3972ae0b4e0ac9082060e8be45324672c652b440) | 2026-06-22 |
| 489d08c0 | [Bring back Level check in testlib.hasMsg (#37121)](https://github.com/mattermost/mattermost/commit/489d08c0c9104d6ed457419565b18441d015f6a5) | 2026-06-22 |
| eb76344e | [Add showPopout opt-out to plugin RHS registerRightHandSidebarComponent (#37125)](https://github.com/mattermost/mattermost/commit/eb76344ec73110e4f27bbb508540b09ca8677c95) | 2026-06-22 |
| 94e2efbd | [MM-51016 Re-implement layout logic for Markdown lists (#36678)](https://github.com/mattermost/mattermost/commit/94e2efbd995c599f11362ec6a5260252b6433df1) | 2026-06-22 |
| a4ecc008 | [MM-68232: Remove external Google Fonts from email templates (#36011)](https://github.com/mattermost/mattermost/commit/a4ecc008fac61faab80b247e8c45311201b3f293) | 2026-06-22 |
| 159fe550 | [Fix MM-T643 long URL embedded image E2E test (#37073)](https://github.com/mattermost/mattermost/commit/159fe5502b78b59df8614a5f500b851cc595ec6c) | 2026-06-22 |
| 1eb4c62c | [PSAv2 endpoint improvements (#36782)](https://github.com/mattermost/mattermost/commit/1eb4c62cf921f4e01c933a0ca2a3cc452c266d7d) | 2026-06-22 |
| 149e10bc | [Translations update from Mattermost Weblate (#37093)](https://github.com/mattermost/mattermost/commit/149e10bc4c9df295f2b8fbba4a8582de1fa61513) | 2026-06-22 |
| 9a2ea895 | [Fix how Redux store is re-exported (#37038)](https://github.com/mattermost/mattermost/commit/9a2ea89575cf1b6989df5e3fc311db7f8ce1f465) | 2026-06-22 |
| 08eef111 | [Migrate most remaining files to TypeScript (#36954)](https://github.com/mattermost/mattermost/commit/08eef111b82f042ba491448d554e9d4f677c3c9a) | 2026-06-22 |
| 62f0880e | [Downgrade missing-profile thread notification from error to warning (#37144)](https://github.com/mattermost/mattermost/commit/62f0880e7d2c40c8c51f5fc3b715bddeaf5a3f28) | 2026-06-22 |
| ce1235f1 | [Fix Playbooks participant modal alignment (#36988)](https://github.com/mattermost/mattermost/commit/ce1235f1feacdf8aacf471dc0f0741c644d66a52) | 2026-06-23 |
| a05afe9a | [Fix and re-enable flaky TestCreatePostNotificationsWithCRT (#37139)](https://github.com/mattermost/mattermost/commit/a05afe9a80b90589a7932584028080e1ccf69194) | 2026-06-22 |
| 86732989 | [\[MM-69229\] Remove orphaned DeprecateCloudFree feature flag (#37149)](https://github.com/mattermost/mattermost/commit/86732989e8b350e0a1d66b8e361484b7d08df1bf) | 2026-06-22 |
| c55282c7 | [\[MM-69229\] Remove orphaned PermalinkPreviews feature flag (#37147)](https://github.com/mattermost/mattermost/commit/c55282c7380bc08ca5f8b1097a8fd808855f5fd3) | 2026-06-23 |
| 3ad7e2cc | [MM-64636 Show managing plugin in bot accounts list (#37136)](https://github.com/mattermost/mattermost/commit/3ad7e2cc8e9fbbdeac2b542f56be4f6099e740e3) | 2026-06-23 |
| 08c3f6fa | [\[MM-69183\] Gate expensive user/guest count queries behind admin check in getServerLimits (#36999)](https://github.com/mattermost/mattermost/commit/08c3f6faa98a5c6465b90e5a6aacf027e653586e) | 2026-06-23 |
| 0f49f337 | [Fix typo in support packet FileStore error field YAML tag (#37157)](https://github.com/mattermost/mattermost/commit/0f49f337dc5a928934788120d361dfeea054aae3) | 2026-06-23 |
| 1bfb13db | [Bump prepackaged Playbooks plugin to v2.10.0 (#37179)](https://github.com/mattermost/mattermost/commit/1bfb13dbc0754320a26d63a29f0f5ae5bb0bdb91) | 2026-06-23 |
| dbcd904c | [\[MM-69229\] Promote CloudIPFiltering: remove the feature flag (#37150)](https://github.com/mattermost/mattermost/commit/dbcd904cc23c32dde5e0c92f499f0cbd7ec7ff91) | 2026-06-23 |
| ba033eae | [\[MM-69229\] Promote ConsumePostHook: remove the feature flag (#37148)](https://github.com/mattermost/mattermost/commit/ba033eae470449940b6f954379b090019f481d50) | 2026-06-23 |
| 7b104091 | [\[MM-69229\] Remove CloudAnnualRenewals feature flag and dead code (#37151)](https://github.com/mattermost/mattermost/commit/7b10409141c9f5963a7aad272e641591e8001cd5) | 2026-06-24 |
| 54ecdfd7 | [Add mattermost_system_server_info metric exposing version and build info (#37209)](https://github.com/mattermost/mattermost/commit/54ecdfd7ab32c87cd70361983daced75d96e8a90) | 2026-06-24 |
| f91f67aa | [Include team name in Content Flagging reviewer toggle aria-label (#37212)](https://github.com/mattermost/mattermost/commit/f91f67aa1b0384f3255e02685766fca443e60e64) | 2026-06-25 |
| 9c456b0e | [Prepackage mattermost-plugin-agents v2.4.1. (#37184)](https://github.com/mattermost/mattermost/commit/9c456b0e821736e7e09037d4648b238e992984c8) | 2026-06-25 |
| 0dccdfb0 | [\[MM-69333\] Native ABAC user attributes: populate runtime subject (Phase 2) (#37107)](https://github.com/mattermost/mattermost/commit/0dccdfb0f9e29d6e49cd6097e10a8799d72d709f) | 2026-06-25 |
| 5dfcb93e | [MM-69314: Show permission-only-policy channels in the guest invite picker (#37172)](https://github.com/mattermost/mattermost/commit/5dfcb93ebda0a1335357881df1f5cb9b5ece8727) | 2026-06-25 |
| b6a9a0b5 | [Move `mmctl user deleteall` to `mmctl system nuke users` (#37197)](https://github.com/mattermost/mattermost/commit/b6a9a0b51c3b7f16a259bcb65204404ceb9c2aa4) | 2026-06-25 |
| ab23e5a4 | [Fix Playbook Administrators role title to be plural on permissions page (#37158)](https://github.com/mattermost/mattermost/commit/ab23e5a4fa5f5c1e786a4868b8ba9f96d5b818a9) | 2026-06-25 |
| 9a1e9a01 | [Don't show guest tag for bot and webhook posts (#37166)](https://github.com/mattermost/mattermost/commit/9a1e9a010ec2043ae8394f4ae6e07c3430b928c8) | 2026-06-25 |
| 4fe11a7d | [Fix flaky TestCheckTeamsTeamMembersIntegrity (#36797)](https://github.com/mattermost/mattermost/commit/4fe11a7d5d14616f3c31363762617ddfd99895df) | 2026-06-25 |
| 9bc14450 | [\[MM-69366\] Scope property field lookups by object type (#37146)](https://github.com/mattermost/mattermost/commit/9bc14450ece340b1404f55f55c3a8706a1e24838) | 2026-06-25 |
| 0f797479 | [Fix AI sparkle indicator on consecutive agent posts (#37064)](https://github.com/mattermost/mattermost/commit/0f797479c4697c93dbcbfb6a3bef5b4dff67ec95) | 2026-06-25 |
| c9b42e93 | [\[MM-69335\] Strip native attributes from self-inclusion check (Phase 4) (#37123)](https://github.com/mattermost/mattermost/commit/c9b42e932f2c84d7539faa25f202012203565512) | 2026-06-25 |
| 1fd45ab3 | [Tighten authorization on OAuth deauthorize and access token endpoints (#37153)](https://github.com/mattermost/mattermost/commit/1fd45ab33eca77dca0f7cb30f528dc3e06681cfd) | 2026-06-25 |
| 2d05d063 | [ci: replace volatile e2e-platform-pkgs cache with shared webapp-setup (#37182)](https://github.com/mattermost/mattermost/commit/2d05d063711fdb25f022c961660a031e2f4ae65c) | 2026-06-25 |
| 429e03cd | [\[MM-69464\] Fix data race in pluginapi.ConfigureLogrus (#37183)](https://github.com/mattermost/mattermost/commit/429e03cddc0123f8ab880fcb6cf8d4dc875834bf) | 2026-06-25 |
| e2b69fde | [Fix extra gap at the bottom of the Channel Settings Add Permission Rule modal (#37230)](https://github.com/mattermost/mattermost/commit/e2b69fde6d5f98a314934f0912849a6ba0c2236c) | 2026-06-25 |
| a64a606c | [Tighten validation on channel member role updates (#37075)](https://github.com/mattermost/mattermost/commit/a64a606c5d31582f8e57a37492f0f8938968687a) | 2026-06-25 |
| 9f4ac623 | [Fix operator symbol hover color in Channel Settings Permissions Policy editor (#37233)](https://github.com/mattermost/mattermost/commit/9f4ac6230067464fcc100b60c1711ed28668bc1f) | 2026-06-26 |
| 3a74d782 | [Skip flaky TestKeepFlaggedPost file-attachments subtest (#37250)](https://github.com/mattermost/mattermost/commit/3a74d782a8162f8e280c1a70ec416a822c83ee33) | 2026-06-26 |
| 84a554b2 | [\[MM-69336\] Surface native user attributes in ABAC autocomplete (Phase 5) (#37133)](https://github.com/mattermost/mattermost/commit/84a554b28b9e36f204aeccd8fac6bde3c40063b1) | 2026-06-26 |
| 741d1740 | [Mm 68291 send wipe (#36945)](https://github.com/mattermost/mattermost/commit/741d1740a2e92be1b7fe0f8711ad6f3f53972b86) | 2026-06-26 |
| b48f95d2 | [Point feature discovery "Learn more" links to their corresponding docs pages (#37204)](https://github.com/mattermost/mattermost/commit/b48f95d22dda49ae17e699d46814e38aad9fba50) | 2026-06-26 |
| 74e42768 | [Bumping prepackaged Jira version to 4.7.1 (#37227)](https://github.com/mattermost/mattermost/commit/74e4276842392db3f3ee5a1a9f1e9bdd5c34bc03) | 2026-06-26 |
| 379ea0bb | [Fix alphabetical ordering of GetAllSessionsWithActiveDeviceIds in generated store layers (#37258)](https://github.com/mattermost/mattermost/commit/379ea0bba4bf24cffd1dcaf29dd47023cf8fe0ea) | 2026-06-26 |
| ea43a687 | [\[MM-69351\] Fix membership store queries for users without AttributeView rows (#37257)](https://github.com/mattermost/mattermost/commit/ea43a687ecc553dbe934b6d104898ac21902cc79) | 2026-06-26 |
| f31c2869 | [\[MM-69328\] Preserve option ranks across property field type changes (#37143)](https://github.com/mattermost/mattermost/commit/f31c2869bad3db05a8bd909e563ccaa955095a8d) | 2026-06-26 |
| 73b00d13 | [Include team membership data in System Console user CSV export (#37214)](https://github.com/mattermost/mattermost/commit/73b00d132b78da726c96773b27f79e66c0d87720) | 2026-06-26 |
| 1efe1aa9 | [Fix inaccurate "Max Users Per Team" description in System Console (#37256)](https://github.com/mattermost/mattermost/commit/1efe1aa9bb2e656ecdcf457e2d1b554e4d329d0c) | 2026-06-26 |
| 891b59d4 | [Server: Create product documentation automation (#36282)](https://github.com/mattermost/mattermost/commit/891b59d4599bef8f43c92cbd822452b8849cdc99) | 2026-06-29 |
| f4f69470 | [MM-24208: Improve multiple image previews and add video preview (#36922)](https://github.com/mattermost/mattermost/commit/f4f69470d37f9f8e266a1a112331181a09b61f4f) | 2026-06-29 |
| 7fbbf0be | [Add CI check to prevent renumbering or renaming existing DB migrations (#37099)](https://github.com/mattermost/mattermost/commit/7fbbf0beefa3cc718ff75bf68548f7acd8986be1) | 2026-06-29 |
| e0bfadc4 | [MM-69172 Ensure note on post preview is always displayed for DM channels (#37232)](https://github.com/mattermost/mattermost/commit/e0bfadc46f0a249ca9a571a9f3979fc2a48455f6) | 2026-06-29 |
| 652861cb | [Fix flaky TestUserHasJoinedChannel (#37273)](https://github.com/mattermost/mattermost/commit/652861cb91ab29f1663dc7cf6a0f8781f5542e86) | 2026-06-29 |
| 1c801690 | [Mattermost Blocks (#36338)](https://github.com/mattermost/mattermost/commit/1c801690a06a39ad5ad467a621196c19229295bb) | 2026-06-29 |
| 40728a4f | [chore(webapp): remove orphaned prettier devDependency (#36817)](https://github.com/mattermost/mattermost/commit/40728a4fd294b66e822c8a2ec7f9c42f423d4deb) | 2026-06-30 |
| 743b565c | [Fix Quarantine for Review modal overflow with many post attachments (#37255)](https://github.com/mattermost/mattermost/commit/743b565c2d24c86e35dda87b993a52ed041657fb) | 2026-06-30 |
| d85da5ce | [E2E/Playwright: Upgrade Playwright to 1.61 and its deps (#37277)](https://github.com/mattermost/mattermost/commit/d85da5ce2c7bf9a8718b2bba620ba0992043ef3d) | 2026-06-30 |
| 245944c3 | [Bump prepackaged Agents plugin to v2.4.2 (#37289)](https://github.com/mattermost/mattermost/commit/245944c3252c61d25048d911f112906c070def81) | 2026-06-30 |
| 510d1c03 | [Make SAML algorithm help text links clickable in System Console (#37140)](https://github.com/mattermost/mattermost/commit/510d1c0309dca1ddf004e0dbc7bc34c0563efaf4) | 2026-06-30 |
| 9d06c9de | [Fix missing return after c.Err in two api4 handlers (#37281)](https://github.com/mattermost/mattermost/commit/9d06c9de9aa9a9e797e1da01951453438ca237e0) | 2026-06-30 |
| 4d1849f3 | [Client4.GetUsersNotInChannelWithOptions accesses options.Etag outside the existing if options != nil guard, causing a nil pointer dereference (panic) when options is nil (#37045)](https://github.com/mattermost/mattermost/commit/4d1849f346cbf26806d1c8d75b63b25eed574461) | 2026-06-30 |
| 577d84d8 | [\[MM-69484\] Fix SetJobWarning not decrementing active job metric (#37213)](https://github.com/mattermost/mattermost/commit/577d84d82c284e8aacdc0fa6480b52e0ab9170ad) | 2026-06-30 |
| 97cf1a4f | [Update docs-needed workflow (#37294)](https://github.com/mattermost/mattermost/commit/97cf1a4f4227949f8b15ae8a314107ebe88fc5c7) | 2026-06-30 |
| 43e8e12e | [Fix flaky TestUserHasJoinedChannel (#37288)](https://github.com/mattermost/mattermost/commit/43e8e12e2ee492c167f51efe4437a83a217f4798) | 2026-06-30 |
| 2111c438 | [Bump golang.org/x/net to v0.56.0 (#37293)](https://github.com/mattermost/mattermost/commit/2111c4387e5077d5d701e94cfb5954307fd6d9d0) | 2026-06-30 |
| a54b4b0a | [ci: make setup-go-work a Makefile prereq, remove explicit CI steps (#37268)](https://github.com/mattermost/mattermost/commit/a54b4b0a4ff8904da88597a88bc998bf1aa5dc9d) | 2026-06-30 |
| 0fa2713b | [MM-67755: WYSIWYG editor for message composition (#36143)](https://github.com/mattermost/mattermost/commit/0fa2713b59d5c4920ded6734ce5d7927f34e6fba) | 2026-06-30 |
| abf24032 | [MM-67818 Fix Recaps sidebar icon opacity to match other LHS items (#37063)](https://github.com/mattermost/mattermost/commit/abf24032f32aba94a6d6b9adb94fdbd418c90277) | 2026-06-30 |
| 98a9c895 | [preserve individual plugin configs during patch when absent (#37171)](https://github.com/mattermost/mattermost/commit/98a9c89514af7c0d8c6252cf2d03ec5c3877c9a4) | 2026-06-30 |
| 939afca4 | [\[MM-69528\] Enable feature flags for ranked attributes, permission policies and masking by default (#37265)](https://github.com/mattermost/mattermost/commit/939afca46faeec7b65bbd02de8b11911935c515e) | 2026-06-30 |
| 229575b0 | [Add direct message support to mmctl post create (#37159)](https://github.com/mattermost/mattermost/commit/229575b0a7914dd1dce4875abf290461b0f50166) | 2026-06-30 |
| e8e47bd5 | [\[MM-69506\] Preserve channel permission rule fields on save validation error (#37236)](https://github.com/mattermost/mattermost/commit/e8e47bd528f0cc637734d3cc0b022a54aaf9451e) | 2026-06-30 |
| 637319b9 | [Fix flaky mmctl plugin e2e tests by using local HTTP server (#37211)](https://github.com/mattermost/mattermost/commit/637319b9bd30ca9cdfa1302f8d466edbd924310b) | 2026-06-30 |
| cb136ac8 | [MM-61199: Remove channelBookmarks feature flag (#37120)](https://github.com/mattermost/mattermost/commit/cb136ac81e8576f398683d82d3406e9df71c0260) | 2026-06-30 |
| 68668c87 | [Mirror postgres images for versions 15, 16, and 17 (#37305)](https://github.com/mattermost/mattermost/commit/68668c871e69aa79bf73439eb8cb5c5fabb64853) | 2026-06-30 |
| 82657b2e | [update Calls to v1.12.1 (#37307)](https://github.com/mattermost/mattermost/commit/82657b2e4a6d142f307c2889c45611a3faa45200) | 2026-07-01 |
| 236e39b9 | [Update docs-impact-review prompt (#37224)](https://github.com/mattermost/mattermost/commit/236e39b9fc552bb7c9293f02396e2bd3499e1e51) | 2026-07-01 |
| 9e3d8efc | [chore: remove deprecated shared channels feature flags (#37154)](https://github.com/mattermost/mattermost/commit/9e3d8efc1a62b53e883a5a08ce3552c7c9fc896d) | 2026-07-01 |
| 430bedef | [Fix "Upload Files" permission pre-selected when creating a new channel permission rule (#37234)](https://github.com/mattermost/mattermost/commit/430bedef831c4a16abe99ee6d476316bf5e8209c) | 2026-07-01 |
| be8f7fe0 | [Fix permission policy rule editor defaulting to Advanced mode (#37267)](https://github.com/mattermost/mattermost/commit/be8f7fe02f65a506b1734e13eb68e44902d8bd80) | 2026-07-01 |
| 91ad3c34 | [\[MM-69600\] Add --show-ids flag to mmctl channel list (#37313)](https://github.com/mattermost/mattermost/commit/91ad3c34f066b5f90655822e696cf6126517bc47) | 2026-07-02 |
| 97750a86 | [\[MM-69596\] Show user roles in mmctl user search plain-text output (#37309)](https://github.com/mattermost/mattermost/commit/97750a8641a8e710b6c3095fbf4b9d0a5c5c97bd) | 2026-07-02 |
| 3759dd50 | [\[MM-69598\] Add mmctl user status command to get and set a user's status (#37312)](https://github.com/mattermost/mattermost/commit/3759dd503110970e2ceffb50bc336dc380e34606) | 2026-07-02 |
| 6332bc94 | [\[MM-64430\] Allow editing team name and description from the System Console (#37206)](https://github.com/mattermost/mattermost/commit/6332bc948d5ccf611afe0e5db3a36eb0c9085259) | 2026-07-02 |
| c820db72 | [ci: auto-build missing buildenv images for in-flight Go version bumps (#37286)](https://github.com/mattermost/mattermost/commit/c820db72841dc0531078f3109ead3633cdedaf83) | 2026-07-02 |
| 78decd39 | [chore: bump Go version to 1.26.4 (#37287)](https://github.com/mattermost/mattermost/commit/78decd39ceb5d26125784975083bdafefb2a61ad) | 2026-07-02 |
| f0e1893e | [Bumping version of prepackaged boards plugin to 9.3.0 (#37329)](https://github.com/mattermost/mattermost/commit/f0e1893e8426c6b80d4e90b0e30ec52e61345a79) | 2026-07-02 |
| 6d2f843e | [MM-68730 Update TestUserHasJoinedChannel to track hook calls differently (#37228)](https://github.com/mattermost/mattermost/commit/6d2f843ede699f19bb0b6d88f0436ee4d8607fda) | 2026-07-02 |
| 1d3bbc63 | [feat(docs): move docs-experimental content into monorepo docs/ (#37330)](https://github.com/mattermost/mattermost/commit/1d3bbc638b140e19541cdc4acb73d5dafa22c6ac) | 2026-07-02 |
| ef60931a | [\[MM-69075\] Revoke non-compliant personal access tokens (#37030)](https://github.com/mattermost/mattermost/commit/ef60931ab99c117c2f11765ac3f2e8f3596c8186) | 2026-07-02 |
| 057453fa | [Reserve image attachment height during thumbnail checks (#37007)](https://github.com/mattermost/mattermost/commit/057453fad2d1c884e10f80805c15d44e568f0551) | 2026-07-02 |
| bc7db8bf | [\[MM-69656\] Paginate Bot Accounts list so all bots load and are searchable (#37336)](https://github.com/mattermost/mattermost/commit/bc7db8bf2120f4e3eb23f45f4227cca181caf777) | 2026-07-02 |
| 076370e6 | [MM-67412: System Console — Board Attributes screen (PSAv2-based) (#36518)](https://github.com/mattermost/mattermost/commit/076370e690a23bb50ca030ba514d6e698b320d87) | 2026-07-02 |
| 780170e6 | [MM-69340: fix NULL Type scan error in Draft.Get() (#37337)](https://github.com/mattermost/mattermost/commit/780170e67bfe4a56e46b94f7d1f186b6b0d165ff) | 2026-07-03 |
| 68389fab | [MM-69466: re-fetch admin config on config_changed to prevent concurrent save clobber (#37338)](https://github.com/mattermost/mattermost/commit/68389fabbb182d246870dad0f1fe4e6f50d9da48) | 2026-07-03 |
| 7434f994 | [\[MM-69688\] Fix /share-channel status always showing "--" for Last Sync (#37345)](https://github.com/mattermost/mattermost/commit/7434f994925110c25fbbce17fc8a62816d606ef7) | 2026-07-03 |
| 5433e6ee | [\[MM-69689\] Self-heal orphaned shared channel remotes for deleted remote clusters (#37346)](https://github.com/mattermost/mattermost/commit/5433e6eef9e9fb16b623a4a851ec9a21352a2f49) | 2026-07-03 |
| ce23427d | [\[MM-69691\] Fix /secure-connection status ordering and malformed table header (#37347)](https://github.com/mattermost/mattermost/commit/ce23427d98a85628757b86cd9f64af449de801a2) | 2026-07-04 |
| 87b7433d | [E2E/Cypress: Upgrade cypress to 15.18 and its deps (#37278)](https://github.com/mattermost/mattermost/commit/87b7433d2d330e91f82c281b3a8e3b71809e95ff) | 2026-07-06 |
| 8fa7e72a | [E2E/Playwright: Reorg POM using accessibility locators (#37315)](https://github.com/mattermost/mattermost/commit/8fa7e72a6ed2d796db9f63243f1d29635b26dd9c) | 2026-07-06 |
| ed681250 | [chore: Update NOTICE.txt file with updated dependencies (#37359)](https://github.com/mattermost/mattermost/commit/ed6812504b2594d797f591f757cbcc0df94b4255) | 2026-07-06 |
| bca41e56 | [Add job create, show, and cancel commands to mmctl (#37280)](https://github.com/mattermost/mattermost/commit/bca41e5650c70ca7dcdee9ba34ed4f42553dac60) | 2026-07-06 |
| 91422dbb | [Fix confusing empty state in access control job details modal (#37203)](https://github.com/mattermost/mattermost/commit/91422dbb03f827ada83a64e48b011b1bac1039dc) | 2026-07-07 |
| 1d377586 | [Virtualize the scheduled posts list to fix slowness with 100+ scheduled posts (#37259)](https://github.com/mattermost/mattermost/commit/1d3775866c11595029727887b00b27ebffd4b5c6) | 2026-07-07 |
| cdc2d453 | [\[MM-69599\] Add `mmctl channel users list` command to list channel members (#37311)](https://github.com/mattermost/mattermost/commit/cdc2d4535850ce4295f25e041a441adf41410eee) | 2026-07-07 |
| 44ab0466 | [\[MM-68856\] Respect default agent and persist last-selected agent in the agent selector (#37017)](https://github.com/mattermost/mattermost/commit/44ab0466d2fcb931a54093d0980e46d5f82a02ce) | 2026-07-07 |
| 95f4687b | [Fix package-lock.json (#37365)](https://github.com/mattermost/mattermost/commit/95f4687b677ab2388f6902766894d99f64a12f73) | 2026-07-07 |
| 3ba841e4 | [Change resizable LHS/RHS to only drag with left mouse button (#37364)](https://github.com/mattermost/mattermost/commit/3ba841e499df2c476b3b5586f2c7768e1c89b2c0) | 2026-07-07 |
| 17c77e27 | [\[MM-69337\] Surface native user attributes in ABAC webapp editors (Phase 6) (#37174)](https://github.com/mattermost/mattermost/commit/17c77e27d6bbabc92503bdff06456f6939bb5159) | 2026-07-07 |
| 4255e314 | [Support pluggable channel settings tabs (#35591)](https://github.com/mattermost/mattermost/commit/4255e31412918b85e37cd9ec4bbc0e844aca3cf7) | 2026-07-07 |
| ea636064 | [Fix flaky TestSendInviteEmails (#37254)](https://github.com/mattermost/mattermost/commit/ea636064f47febdec581179924b2f633291e4953) | 2026-07-07 |
| dd4f2fe8 | [Fix plugin RPC teardown race on shutdown (#37340)](https://github.com/mattermost/mattermost/commit/dd4f2fe8db6d3d1da5f3600d7acaacfb85e668fd) | 2026-07-07 |
| 332e14e3 | [mmctl: list and optionally auto-add missing team members on channel move (#37199)](https://github.com/mattermost/mattermost/commit/332e14e3997fcb726b89be69541bbb91544d277e) | 2026-07-07 |
| 0ef9b7bf | [Improve license error message for wrong service environment (#37198)](https://github.com/mattermost/mattermost/commit/0ef9b7bf52d04a789a9cf54f94a7acd7d13e151b) | 2026-07-07 |
| ac44b555 | [Fix milestone lookup piping jq output through gh api --jq (#37381)](https://github.com/mattermost/mattermost/commit/ac44b555303fb3faeba46ac73b4f1cf917880a94) | 2026-07-08 |
| 5c7c19aa | [Update latest minor version to 11.10.0 (#37397)](https://github.com/mattermost/mattermost/commit/5c7c19aaa3b0d05ad407338d49c994506e7e155e) | 2026-07-08 |
| 92388143 | [model: add strict validation and tests for CommandResponse (#36824)](https://github.com/mattermost/mattermost/commit/923881436f97194cbc0f64846cdb135d8b127ebf) | 2026-07-08 |
| 02d770d6 | [SEC-10587 E2E/Playwright: Migrate RFQA browser tests (batch 1, 1-20) (#37352)](https://github.com/mattermost/mattermost/commit/02d770d64bf42a0bacb692d26e40157c0950b60a) | 2026-07-08 |
| feb34720 | [\[MM-67500\] Fix an issue where expired posts gettin into post cursor (#35339)](https://github.com/mattermost/mattermost/commit/feb347200c0fcf6f891d46d7e9c0531870909ea2) | 2026-07-08 |
| 5c44f428 | [Fix flaky TestSendMailWithEmbeddedFilesUsingConfig (#37373)](https://github.com/mattermost/mattermost/commit/5c44f428ae90b3d1f54ffd1214030af955c3a081) | 2026-07-08 |
| 09585a01 | [\[MM-69724\] Submit session attribute WS updates directly to Desktop App (#37392)](https://github.com/mattermost/mattermost/commit/09585a013451c7774bef5430bfe55970a97fb1c2) | 2026-07-08 |
| f2e8dbac | [MM-61199: Restore ChannelBookmarks feature flag for mobile compatibility (#37368)](https://github.com/mattermost/mattermost/commit/f2e8dbac7b3e856987660a55a01a171bd3e30d57) | 2026-07-08 |
| 147777a8 | [SEC-10588 E2E/Playwright: Migrate RFQA browser tests (batch 2, 21-40) (#37375)](https://github.com/mattermost/mattermost/commit/147777a8c65476e23e76f9457b7d64a6c7c813ae) | 2026-07-09 |
| c3726ccb | [chore(ci): warm node and npm caches daily; make CI jobs restore read-only (#37393)](https://github.com/mattermost/mattermost/commit/c3726ccb6bd4ad78828dd93239a1f3b0335a6005) | 2026-07-08 |
| fe7fd4eb | [SEC-10721 E2E/Playwright: Migrate RFQA browser tests (batch 3, 41-60) (#37380)](https://github.com/mattermost/mattermost/commit/fe7fd4ebec577e1130b9cedfed6fa05522835520) | 2026-07-09 |
| 7870605f | [\[MM-69590\] Remove NotificationMonitoring feature flag (#37386)](https://github.com/mattermost/mattermost/commit/7870605fb1c8b297eedb67a83eef0bf21f3ab6cd) | 2026-07-08 |
| af43bfdb | [\[MM-69593\] Remove StreamlinedMarketplace feature flag (#37390)](https://github.com/mattermost/mattermost/commit/af43bfdbb0f249d4298e17d47c206cdad8921a60) | 2026-07-08 |
| f0abe8a5 | [\[MM-69591\] Remove WebSocketEventScope feature flag (#37384)](https://github.com/mattermost/mattermost/commit/f0abe8a596068924caa79d120c614b16f09a69e7) | 2026-07-08 |
| 49b7406a | [Add Playwright E2E test for maximum login attempts lockout (#36932)](https://github.com/mattermost/mattermost/commit/49b7406ad7c159820557bcf27a761e2b25b6f195) | 2026-07-08 |
| 49891e2f | [Bump Playwright v2 CI workers from 10 to 15 (#37414)](https://github.com/mattermost/mattermost/commit/49891e2f15535bee96183f1b095b707b0d5eb583) | 2026-07-09 |
| c4620b9f | [\[MM-69215\] warn users before their personal access tokens expire (#37272)](https://github.com/mattermost/mattermost/commit/c4620b9f265dd7c62085b2ea068bec874cf581bd) | 2026-07-09 |
| 384b404f | [\[MM-68652\] Fix saved state on channel settings shared channels (#37173)](https://github.com/mattermost/mattermost/commit/384b404f6cb768120179f200729997985a80e40c) | 2026-07-09 |
| 13b7dc91 | [\[MM-69693\] notify token owners when an expired PAT is deleted (#37349)](https://github.com/mattermost/mattermost/commit/13b7dc91195252cf4241e519e0e9bdcad11f9e0e) | 2026-07-09 |
| dd69d06d | [Migrate docs site: Docusaurus config, Algolia, OpenAPI pipeline, and CI (#37402)](https://github.com/mattermost/mattermost/commit/dd69d06dc6d06293751994e5199b17bc984c59f6) | 2026-07-09 |
| befdb017 | [Stop leaking message body via the Notifications API tag (#36364)](https://github.com/mattermost/mattermost/commit/befdb0175a882cecb722cc03d961044ddfe489c0) | 2026-07-09 |
| 1b27d5d7 | [ci: add docs CD workflow (#37421)](https://github.com/mattermost/mattermost/commit/1b27d5d7e2a73e8430a178f24c9a33f5e69a4002) | 2026-07-09 |
| 70b62d9e | [docs: fix broken images, cross-links, and layout overflow after docs-experimental migration (#37418)](https://github.com/mattermost/mattermost/commit/70b62d9e3f369ac90945d85493e3a5beaea8afd2) | 2026-07-09 |
| 1addfd5e | [\[MM-24529\] Preserve hyphenated compound words in Postgres search (#37360)](https://github.com/mattermost/mattermost/commit/1addfd5e91630db21e8acee92f57f83670f32a30) | 2026-07-09 |
| 3c9979f5 | [docs: fix broken admonitions and anchors in product-overview changelog pages (#37423)](https://github.com/mattermost/mattermost/commit/3c9979f551856ac89abaa625b92e5aec69072e15) | 2026-07-09 |
| 593ddc5d | [On successful SAML auth log the user's email (#37428)](https://github.com/mattermost/mattermost/commit/593ddc5d43e666988e6c2c56c73b4be7f38546af) | 2026-07-09 |
| d7052a10 | [Prevent broken draft state when uploads fail or are interrupted, allowing users to send messages again (#37266)](https://github.com/mattermost/mattermost/commit/d7052a1087eaf5ecd1197e50dc90daaadaf8ccf4) | 2026-07-09 |
| a6060f5d | [MM-68754: Add silent post delivery for bots and integrations (#36771)](https://github.com/mattermost/mattermost/commit/a6060f5d0581d1619201d7b2c0cbf3800710ee9a) | 2026-07-09 |
| ca25611b | [ MM-69219: Add multiple concurrent dialogs via action_button element type (#37119)](https://github.com/mattermost/mattermost/commit/ca25611b0c2cdd4036eadddb1f73e19992ac094f) | 2026-07-09 |
| 0d7ae8e5 | [Add file upload element to interactive dialogs (#36881)](https://github.com/mattermost/mattermost/commit/0d7ae8e58d6a65601f27740a0428a2ed91668f65) | 2026-07-09 |
| fcdda554 | [Move e2e npm registry cache out of the node-cache- namespace (#37427)](https://github.com/mattermost/mattermost/commit/fcdda55454effbf09e87bc43bac946ed6ed64348) | 2026-07-10 |
| a20929b1 | [MM-69408 - Fix quadratic markdown autolink trimming (#37201)](https://github.com/mattermost/mattermost/commit/a20929b1b7ad79f760db138e45d9ad6034cd7fa8) | 2026-07-10 |
| 6619448f | [\[MM-69589\] Remove ExperimentalAuditSettingsSystemConsoleUI feature flag (#37385)](https://github.com/mattermost/mattermost/commit/6619448fec2d5384e9ef88a6f8ec06490d304102) | 2026-07-10 |
| d4fdff72 | [Remove internal only pages from develop (#37436)](https://github.com/mattermost/mattermost/commit/d4fdff72cc54d7d478ddb725497f142a5d44cec6) | 2026-07-10 |
| f3849f83 | [docs: fix broken path links, anchors, and tab rendering from RST-to-MDX migration (#37433)](https://github.com/mattermost/mattermost/commit/f3849f83decc762a1e519846a3a27b9aa658f982) | 2026-07-10 |
| 9588492b | [MM-69392 - Make DCR redirect URI allowlist matching URL-component aware (#37170)](https://github.com/mattermost/mattermost/commit/9588492b619a1c0e3d5a8453e067c0bbf548905a) | 2026-07-10 |
| be7cc0ba | [Bucket server test-timing cache by date to cut cache churn (#37425)](https://github.com/mattermost/mattermost/commit/be7cc0ba3e40da14cff31d441dd2b9e12474120f) | 2026-07-10 |
| 14288c74 | [Adopt per-target .PHONY directives in server Makefiles (#37447)](https://github.com/mattermost/mattermost/commit/14288c742ba5e4aa66e3b2bbef28de50451ff517) | 2026-07-10 |
| af49e8dc | [Preserve 429/503 retry status codes through DoActionRequest (#36700)](https://github.com/mattermost/mattermost/commit/af49e8dc80ed721e3cd7c7d7576d14dfe5bbdd94) | 2026-07-11 |
| 09bda773 | [MM-69585: remove AttributeBasedAccessControl feature flag (#37366)](https://github.com/mattermost/mattermost/commit/09bda773d80d364b8c6a660868db77d213d93f29) | 2026-07-10 |
| 836857ab | [\[MM-69403\] Push WebSocket events on job status changes (#37130)](https://github.com/mattermost/mattermost/commit/836857ab92769766cf131e4a89975c5b175bcbc1) | 2026-07-10 |
| 5ddee464 | [Fix interactive message action buttons overflowing on long text (#37142)](https://github.com/mattermost/mattermost/commit/5ddee4647bbe2ff60a7fc0d2d5e1f1551beefdba) | 2026-07-10 |
| cce485f6 | [\[MM-69561\] Add ability to rotate (regenerate) Personal Access Tokens (#37295)](https://github.com/mattermost/mattermost/commit/cce485f60598d8eada1c0afb50d29fa172163bd4) | 2026-07-10 |
| b530799a | [Add plugin metadata panel to management and settings pages (#37331)](https://github.com/mattermost/mattermost/commit/b530799aeb0393ac5c24ecb2f1d2664db688dbf1) | 2026-07-13 |
| 4e428ef3 | [Fix docs automation workflow (#37401)](https://github.com/mattermost/mattermost/commit/4e428ef393f1420759afe1a5fd2f2e5c90509288) | 2026-07-13 |
| 17466f36 | [E2E/Playwright: Migrate RFQA browser tests (batch 4, 61-80) (#37411)](https://github.com/mattermost/mattermost/commit/17466f36380cba48096061308c6e659610de4d35) | 2026-07-13 |
| 10555f15 | [Converge generated-file CI checks on a single `make generated` target (#37451)](https://github.com/mattermost/mattermost/commit/10555f155c745617becfd10bea2e9d4f679b013f) | 2026-07-13 |
| 7748bf74 | [E2E/Playwright: Migrate RFQA browser tests (batch 5, 81-100) (#37417)](https://github.com/mattermost/mattermost/commit/7748bf749e34a27d2bbe7dc71cac52230ead8358) | 2026-07-13 |
| d628dbc0 | [E2E/Playwright: Migrate RFQA browser tests (batch 6, 101-120) (#37431)](https://github.com/mattermost/mattermost/commit/d628dbc0ec0ba902aa4fa96e46bc38feeef5a68a) | 2026-07-13 |
| 33eb5b1a | [ci: add docs PR preview workflows (#37440)](https://github.com/mattermost/mattermost/commit/33eb5b1a28330f52359ccb8073f135ed3e8ce256) | 2026-07-13 |
| 303b0c7f | [\[MM-69221\] (#37301)](https://github.com/mattermost/mattermost/commit/303b0c7ff280642f1dea675522188af912424248) | 2026-07-13 |
| a217050a | [\[MM-69394\] fix for data retention teams endpoint (#37370)](https://github.com/mattermost/mattermost/commit/a217050a0bc23dbd607e68de4521235ebbd45610) | 2026-07-13 |
| 1f7fd136 | [\[MM-69699\] Strip metadata from single post consume hooks (#37367)](https://github.com/mattermost/mattermost/commit/1f7fd13666486bb84e93bc94bcba510defbc2844) | 2026-07-13 |
| 3bf22ab3 | [Fix NewJobServer call in extract_content worker_test (#37478)](https://github.com/mattermost/mattermost/commit/3bf22ab3395f3fa33142984e74d0b328399cd619) | 2026-07-13 |
| 5634530e | [Add ClusterGracefulDrain feature flag (#37304)](https://github.com/mattermost/mattermost/commit/5634530e64ae77db938c03876f41f684c01b33d6) | 2026-07-13 |
| bd0d8866 | [Remove deprecated Playwright/Cypress v1 dispatch (#37413)](https://github.com/mattermost/mattermost/commit/bd0d8866d623e77e48b36befca1ba66e0372c54f) | 2026-07-14 |
| 51a2dbf1 | [E2E/Playwright: Complete Rainforest browser test migration (batch 7, 121-142) (#37453)](https://github.com/mattermost/mattermost/commit/51a2dbf1b93eb259a5b6631de8e80e917df999b4) | 2026-07-14 |
| f091e95e | [docs(P13d): reconcile Manage content drift — ABAC updates, telemetry, mmctl, health checks (#37482)](https://github.com/mattermost/mattermost/commit/f091e95e20554f8e9d844f3cbaf2ea18bdfbf587) | 2026-07-14 |
| f88a8b21 | [docs(P13e): reconcile docs drift — Administration Guide: Onboard + Upgrade + Comply (#37480)](https://github.com/mattermost/mattermost/commit/f88a8b214125f9b4ba29a805f30b81d3e47f4d8c) | 2026-07-14 |
| 1b33301d | [docs(P13h): reconcile drift for End User Guide (#37490)](https://github.com/mattermost/mattermost/commit/1b33301d75a9ca6c97a0adb5bf8554fc9136ce56) | 2026-07-14 |
| bf487943 | [docs(P13g): reconcile drift for Deployment Guide (#37489)](https://github.com/mattermost/mattermost/commit/bf4879433a91b08467604f7d85fda3376705e0eb) | 2026-07-14 |
| f898ea36 | [docs(P13i+P13j): reconcile drift for Integrations Guide, Security Guide, Use Case Guide, Get Help (#37488)](https://github.com/mattermost/mattermost/commit/f898ea3615e5e8fdaadc0112d24bc2c6d13d413d) | 2026-07-14 |
| 3cf63487 | [docs(P13c): reconcile docs drift — Administration Guide: Configure (#37483)](https://github.com/mattermost/mattermost/commit/3cf63487ea67928725ec70c705d68dd72313cecb) | 2026-07-14 |
| 7345d1fb | [Reconcile Product Overview content drift from docs repo (P13 sub-phase 4.1) (#37476)](https://github.com/mattermost/mattermost/commit/7345d1fb90044d4ca3db6adff9dddbd82ef421fe) | 2026-07-14 |
| d7e14fa1 | [docs(P13a): reconcile docs drift — new pages + images (#37479)](https://github.com/mattermost/mattermost/commit/d7e14fa123e3c162547fa1dc476f81cd69aa1ada) | 2026-07-14 |
| 444b5c46 | [MM-69293: Auth (#37403)](https://github.com/mattermost/mattermost/commit/444b5c46b9b0fada248661cbbfad3d14df64dba8) | 2026-07-14 |
| 6b4b7772 | [Update config change checker script and workflow (#37226)](https://github.com/mattermost/mattermost/commit/6b4b77723cebf5ccbd29583ea6f35b5a618d494d) | 2026-07-14 |
| 72250e68 | [MM-69390: Migrate from archived gopkg.in/mail.v2 to github.com/wneessen/go-mail (#37302)](https://github.com/mattermost/mattermost/commit/72250e687ee1ec7e16e84dbde2841240ecc3c309) | 2026-07-14 |
| 2d8a5f94 | [Stop posting docs preview PR comments; link preview from status check (#37491)](https://github.com/mattermost/mattermost/commit/2d8a5f94baa48be310aecb357d8b7b794d0e1237) | 2026-07-14 |
| 04c3524a | [MM-69293: Expect a 401 instead of a 403 after updating auth (#37493)](https://github.com/mattermost/mattermost/commit/04c3524aa7ae855805905bcb9f474d9b6873fe89) | 2026-07-14 |
| a91ac6db | [\[MM-69592\] Remove feature flag: OnboardingTourTips (#37475)](https://github.com/mattermost/mattermost/commit/a91ac6db9dfc0f50d7ab75ebb3506f698ab337a7) | 2026-07-14 |
| b959e88b | [\[MM-69721\] Fix empty text/plain part in transactional emails (#37383)](https://github.com/mattermost/mattermost/commit/b959e88bf6b0f5227c4b78c4e665ec580520f1af) | 2026-07-14 |
| d3ebd0ff | [MM-69751 Replace concurrent React user setting with feature flag and add to root.html (#37422)](https://github.com/mattermost/mattermost/commit/d3ebd0ff65574bbf9a33d3fbb50c512bad93a543) | 2026-07-14 |
| e73df622 | [\[MM-69778\] Changes needed to NewChannelModal for plugins (#37452)](https://github.com/mattermost/mattermost/commit/e73df622cb1f257b8e8d32e7066c54b57455ad1b) | 2026-07-14 |
| 922276c1 | [MM-69728: support team-scoped product baseURLs (#37410)](https://github.com/mattermost/mattermost/commit/922276c1347e78ece7bd86f29ac3100ac933cf92) | 2026-07-14 |
| 901b4256 | [Fix assorted down migrations, add additional testing (#37464)](https://github.com/mattermost/mattermost/commit/901b4256bdbeea7db350a874cc342cf19878b2b3) | 2026-07-15 |
| 7778bb79 | [MM-69792: Recover shared channel sync after a brief remote outage (#37499)](https://github.com/mattermost/mattermost/commit/7778bb79d1a4920df6f4d6c5cc0999453fc0464b) | 2026-07-15 |
| 379959ba | [MM-69782: let plugins open core modals by id (#37339)](https://github.com/mattermost/mattermost/commit/379959ba32abf832be77195e4a72789a923f1f99) | 2026-07-15 |
| b9179642 | [update Calls to v1.12.2 (#37502)](https://github.com/mattermost/mattermost/commit/b9179642f3b5effce0305fc4ceabc6737970d8fb) | 2026-07-15 |
| 8d10e91d | [MM-69798: Add AccessControlSettings setting to disable channel access indicators (#37519)](https://github.com/mattermost/mattermost/commit/8d10e91d3899f35ed8272f1c0d4a88f352ad8be6) | 2026-07-16 |
| 1388ba47 | [Update Playbooks plugin to v2.11.0 (incl. FIPS) (#37528)](https://github.com/mattermost/mattermost/commit/1388ba477cc7e9cc9f02756b2e2a882b825ea30a) | 2026-07-15 |
| 5bae85c9 | [E2E/Playwright Migrate MM-T5801 to 06 (#37530)](https://github.com/mattermost/mattermost/commit/5bae85c921dadab2d0148c9b49ab630b1e5b158c) | 2026-07-16 |
| f110574b | [E2E/Playwright Migrate T1434, T4023 and T1987 (#37533)](https://github.com/mattermost/mattermost/commit/f110574b559df9bc121b4239d03f524a9bdb8cd2) | 2026-07-16 |
| 86888cba | [\[MM-69007\] Speed up Support Packet tests by shortening the CPU profile sample (#36761)](https://github.com/mattermost/mattermost/commit/86888cbac650febc303e94c193c7211075662baa) | 2026-07-16 |
| 57fe965a | [Session Attributes: System Console management page and permission-policy picker integration (#37362)](https://github.com/mattermost/mattermost/commit/57fe965ac7276b1a305811a3a704f437dc38219e) | 2026-07-16 |
| 14b4e8ee | [Disable Codecov PR comments (#37391)](https://github.com/mattermost/mattermost/commit/14b4e8ee55f298d9d84a28fbd40c1a47bb7b0620) | 2026-07-16 |
| eee6722e | [Fix docs migration rendering issues (Mermaid, tables, callouts, version filter) (#37511)](https://github.com/mattermost/mattermost/commit/eee6722ef0cd20bb846d956436fac39ca24e88e3) | 2026-07-16 |
| 18260207 | [fix(ui): fix layout conflicts in Thread previews with robust CSS (#37503)](https://github.com/mattermost/mattermost/commit/18260207222103f0cd8109ef4907ccfc3b031e34) | 2026-07-17 |
| 442226ef | [Remove some usage of changeCss (#37382)](https://github.com/mattermost/mattermost/commit/442226efce5973bdbc738e4b0df2380a56d6d83c) | 2026-07-16 |
| 5f7f967a | [MM-69268 - Add ChannelTypeSpace backing-channel type for Docs (#37321)](https://github.com/mattermost/mattermost/commit/5f7f967a7dbfbfe3fe7dae96ad6b7142268be5bc) | 2026-07-16 |
| 3b64a2ac | [Property owners for property fields and values, new audit logs for cpa value changes and new pluginapis (#37299)](https://github.com/mattermost/mattermost/commit/3b64a2ac8440806864473af03b209b3c861d5382) | 2026-07-16 |
| b56f4332 | [MM-69305: Add e2e tests for WYSIWYG editor (#37498)](https://github.com/mattermost/mattermost/commit/b56f433243beaf8028ed13a08215a411f74c9b33) | 2026-07-17 |
| 3a820143 | [MM 69100 - Team ABAC Membership - members sync and end user surfaces (#37054)](https://github.com/mattermost/mattermost/commit/3a820143a1a5384172386a6c728e65825696a1e0) | 2026-07-17 |
| e4669f6e | [migrate T349 and T369 (#37544)](https://github.com/mattermost/mattermost/commit/e4669f6e047eedf304b6703a7736075aced8880f) | 2026-07-17 |
| 1bca3763 | [Remove stray root package-lock.json (#37555)](https://github.com/mattermost/mattermost/commit/1bca37636e66ceb193fe2cebe57d9dde760aa431) | 2026-07-17 |
| 0a572cd6 | [MM-69174 Fix most layout shift caused by images in posts (#37420)](https://github.com/mattermost/mattermost/commit/0a572cd642bb23e2c01e2a79a6f6fd63bea7b674) | 2026-07-17 |
| d6d2c501 | [Clear session cache on OAuth token refresh (#37459)](https://github.com/mattermost/mattermost/commit/d6d2c501899acb365222d53ab3de59031163a8d2) | 2026-07-17 |
| 91a1c3f1 | [MM-69802: Fix avatar alt text rendering visibly on broken image load (#37521)](https://github.com/mattermost/mattermost/commit/91a1c3f1e522f355f51366f49e18a3f0c476d886) | 2026-07-17 |
| 2851af05 | [Add admin-locked profile fields for email users and pre-provisioned names on invites (#37458)](https://github.com/mattermost/mattermost/commit/2851af059d62cb3eebe73debdaa812d5fa440a94) | 2026-07-17 |
| f4e141cc | [\[MM-69610\] Fix membership policy value chips wrapping onto multiple lines (#37320)](https://github.com/mattermost/mattermost/commit/f4e141cc1dd07e6e30a1b89edf30effb9362ad82) | 2026-07-20 |
| 28113e5a | [Bumping prepackaged mscalendar version to v1.7.0 (#37575)](https://github.com/mattermost/mattermost/commit/28113e5a7a683aae51d765841eb8cb0bfd16ae88) | 2026-07-20 |
| 9e51e325 | [Add --active flag to mmctl user list (#37560)](https://github.com/mattermost/mattermost/commit/9e51e325f595c7be007708847a19e1cfb23cfabf) | 2026-07-20 |
| fa92268d | [Add Algolia site verification to docs robots.txt (#37578)](https://github.com/mattermost/mattermost/commit/fa92268d4768a852ed6f69bcd8aa4564546d3552) | 2026-07-20 |
| ef7bafc4 | [chore: Update NOTICE.txt file with updated dependencies (#37574)](https://github.com/mattermost/mattermost/commit/ef7bafc48cd2dc524b2f21ff555f6773fbe6a709) | 2026-07-21 |
| fc18ad4e | [docs(P13f): reconcile docs drift — Administration Guide: Scale (#37481)](https://github.com/mattermost/mattermost/commit/fc18ad4e6e67ea9ee737d61c0e1662d779de82ca) | 2026-07-21 |
| 6417c934 | [docs: port P13/P14 content drift into monorepo (#37590)](https://github.com/mattermost/mattermost/commit/6417c9342a89ebf333b139c2d8ad6cf6c139e45c) | 2026-07-21 |
| 24a5dd28 | [ci: consolidate docs-preview checks into one status with preview URL (#37524)](https://github.com/mattermost/mattermost/commit/24a5dd2859bb8b65e370c0e38dae6bc9fb5379bb) | 2026-07-21 |
| b27f213f | [docs(sidebar): restructure sidebar grouping, fix Samples/Recipes stubs, self-host sample downloads (#37591)](https://github.com/mattermost/mattermost/commit/b27f213f4a9046c494611a845223a9fe40d3cb90) | 2026-07-21 |
| f84dd257 | [Prepackage mattermost-plugin-agents v2.5.0-rc1. (#37582)](https://github.com/mattermost/mattermost/commit/f84dd257542b3965c58b378bdbd54503407192b6) | 2026-07-21 |
| 518b6b2c | [Updated minimum supported Edge and Chrome versions (#37589)](https://github.com/mattermost/mattermost/commit/518b6b2c3941ded03b197db1cb881816b02a5d33) | 2026-07-21 |
| 25f3a75c | [\[MM-67163\] Scheduled Recaps (#35495)](https://github.com/mattermost/mattermost/commit/25f3a75cb7977e1af675cb1f22b704614ea052b5) | 2026-07-21 |
| d851305b | [docs(site): remove What's New in v11 stub page and fix heading typography (#37617)](https://github.com/mattermost/mattermost/commit/d851305b38c9fbee00d5e1efa54bb4d2a937e633) | 2026-07-22 |
| 376b5532 | [MM-69828 - Fix ABAC team Access-tab stuck-public cards, parent-policy mode-flip count (#37558)](https://github.com/mattermost/mattermost/commit/376b553286409950aba874d49d83b4ce04ea7eac) | 2026-07-22 |
| 1bfa2e51 | [Bumping prepackaged boards version to 9.3.1 (#37594)](https://github.com/mattermost/mattermost/commit/1bfa2e5113c43b20ac35b9d4e9f772d586613187) | 2026-07-22 |
| a8f55e53 | [\[MM-69885\] Allow integrations to update mm_blocks_actions on their own posts (#37583)](https://github.com/mattermost/mattermost/commit/a8f55e5327638269d53ba0d56b2865b49b36d4a9) | 2026-07-22 |
| 38b66d22 | [\[MM-69845\] Add Global Attributes access gate to System Console (#37580)](https://github.com/mattermost/mattermost/commit/38b66d2262d904e8ef28588d5fa8f830b4743f41) | 2026-07-22 |
| f06971b6 | [Fix two Session Attribute issues (#37620)](https://github.com/mattermost/mattermost/commit/f06971b657de292ae8482175d7aebf846ce101f5) | 2026-07-22 |
| 06ddf503 | [docs: mark scale partial pages as unlisted with proper titles (#37628)](https://github.com/mattermost/mattermost/commit/06ddf5032375e40b0bb606ec8d204109f62265cf) | 2026-07-23 |
| 12018e56 | [Mm 69829 -  fix team policy management qa (#37568)](https://github.com/mattermost/mattermost/commit/12018e56cde4eb9b7ff6b24bcc0a9c1740a6eacf) | 2026-07-23 |
| 5afa3b8c | [ci: run yamllint on ubuntu-24.04 (#37641)](https://github.com/mattermost/mattermost/commit/5afa3b8cbf402c370fa675bba43d48b1900eab66) | 2026-07-23 |
| bc3ad86a | [Update Playbooks plugin to v2.11.1 (incl. FIPS) (#37631)](https://github.com/mattermost/mattermost/commit/bc3ad86a236431364a13ab03942902eb84daaf9f) | 2026-07-23 |
| 1cc20031 | [MM-69857 - Keep parent imports and team scope system-managed on the policy update endpoint (#37625)](https://github.com/mattermost/mattermost/commit/1cc20031fe883bba65214dd12aaae91ff82af3a7) | 2026-07-24 |
| 5fbb2a32 | [docs: vendor and stage Mattermost Agents docs for Docusaurus build (#37627)](https://github.com/mattermost/mattermost/commit/5fbb2a32d618c3da6757ca0663f3ea043c2335fd) | 2026-07-24 |
| 7bc3bbfd | [ABAC: share TableEditor/CELEditor with plugins via window.Components (#37510)](https://github.com/mattermost/mattermost/commit/7bc3bbfd0c94b2a9577f40815d4fb25955c8ea38) | 2026-07-24 |
| 1dacc2d5 | [Mm 69830 abac membership messaging fixes (#37618)](https://github.com/mattermost/mattermost/commit/1dacc2d514a444a9f5e513e57415ae7dd4e51ba2) | 2026-07-25 |
| 10b780cb | [E2E/Test: Stabilize flaky tests (#37614)](https://github.com/mattermost/mattermost/commit/10b780cb097b2ec94ab0f9df7ebcbd5b7850f13f) | 2026-07-25 |
| f0de1f48 | [\[Docs Revamp Feedback\] Readability & accessibility fixes (#37665)](https://github.com/mattermost/mattermost/commit/f0de1f485bd0c3168b31767b37d388fb1a5fa8a4) | 2026-07-27 |
| 8828e5a2 | [fix(docs-preview): set commit status via gh api for correct target_url (#37664)](https://github.com/mattermost/mattermost/commit/8828e5a2585e8272555253a20e0efdf5bbda795c) | 2026-07-27 |
| 7a1c7e4b | [\[Docs Revamp Feedback\] Fix content rendering bugs (admonitions, broken images, table wrapping, oversized icons) (#37669)](https://github.com/mattermost/mattermost/commit/7a1c7e4b6b997a52213cc00a4614a7a94e745fd7) | 2026-07-27 |
| 9ac8f227 | [docs: fix broken mm-ref:/mm-doc: placeholder links from RST migration (#37673)](https://github.com/mattermost/mattermost/commit/9ac8f2273c0d46895fc1aef17192609aef8354fa) | 2026-07-27 |
| e5d490e6 | [Remove unreviewed IA-redesign content, restructure air-gapped docs from legacy source (#37674)](https://github.com/mattermost/mattermost/commit/e5d490e6808f4b21e7d1aeb47ea0da814970a5f8) | 2026-07-27 |
| 0e7b8a2f | [\[Docs Revamp Feedback\] Remove/restyle "vibe coded" yellow left-border signal (#37666)](https://github.com/mattermost/mattermost/commit/0e7b8a2ff60a70a73dd7154ecb5e622e86b1072a) | 2026-07-27 |
| 0fed2262 | [Fix editing a post creating a draft (MM-69928) (#37658)](https://github.com/mattermost/mattermost/commit/0fed2262813c57bec6f47088efcbfe9e4335b5c4) | 2026-07-27 |
| d73adf5b | [Fix image preview opening when clicking outside the image in a post (#37642)](https://github.com/mattermost/mattermost/commit/d73adf5b24fc5ff7f9e4fa67030d81d5cd45d59e) | 2026-07-27 |
| 99bc7bd8 | [Add discoverable private channels request-to-join UX (#37078)](https://github.com/mattermost/mattermost/commit/99bc7bd886c97d33149a839b29a59b8301242d7e) | 2026-07-27 |
| 90df14fa | [\[Dead code\] Remove unused prop from virt-list component (#36871)](https://github.com/mattermost/mattermost/commit/90df14faecc5ac48f733e583f1d607226b1dae63) | 2026-07-27 |
| a0475a69 | [docs(developers): fix broken Integrate & Extend link on developers landing page (#37690)](https://github.com/mattermost/mattermost/commit/a0475a696ce9f230b6cbfcb915712d9c59988413) | 2026-07-27 |
| ef002933 | [MM-66940 Fix layout shift in ChannelView during loading (#37652)](https://github.com/mattermost/mattermost/commit/ef002933bf7ba4500cbc7602c5e67154cbe91a90) | 2026-07-27 |
| 5c409049 | [Fix docs site homepage width, unreadable bold text, and deploy-k8s / icon UI bugs (#37681)](https://github.com/mattermost/mattermost/commit/5c409049b5c6732939655c91d6f99e7e894a0e68) | 2026-07-28 |
| 3e6399cf | [Remove denim left-border accent from IME diagram intro panels (#37682)](https://github.com/mattermost/mattermost/commit/3e6399cf8895aab201f5f803f831af7e3bf6967c) | 2026-07-28 |
| c77efb5a | [ci: update actions/test-system-io to latest with upload retries (#37612)](https://github.com/mattermost/mattermost/commit/c77efb5ab380d9816b5c93de18a64da614d061dd) | 2026-07-28 |
| 044261a1 | [\[Docs Revamp Feedback\] Support three levels of TOC nesting (End-user Guide > Collaborate) (#37663)](https://github.com/mattermost/mattermost/commit/044261a1dafa326997367b14af187c2ccc829dd3) | 2026-07-28 |
| a8c2307b | [E2E/Playwright: Add testcontainers to playwright-lib (#37570)](https://github.com/mattermost/mattermost/commit/a8c2307bee9bd60a3a0f72a658f32599b44cab0b) | 2026-07-28 |
| e388d4dc | [Fix low-contrast mobile nav sidebar text in light mode (#37695)](https://github.com/mattermost/mattermost/commit/e388d4dcd981c87a1663883593c78e469344b588) | 2026-07-28 |
| 4cd57370 | [ci: remove testcontainers teardown step from playwright e2e workflow (#37697)](https://github.com/mattermost/mattermost/commit/4cd57370aca697cfb636f9dc2374c7059abb320b) | 2026-07-28 |
| e11843b0 | [docs(sidebar): regroup Administration Guide Onboard and Scale sections (#37630)](https://github.com/mattermost/mattermost/commit/e11843b08ef6547727d57bc8cc9fe0d9a9f53537) | 2026-07-28 |
| dc41b72f | [Prepackage mattermost-plugin-agents v2.5.0-rc2. (#37691)](https://github.com/mattermost/mattermost/commit/dc41b72fdd62e935c80fc05c7ca3949476aa8858) | 2026-07-28 |
| d33ad5a7 | [\[MM-69810\] Update golang.org/x/image dep (#37595)](https://github.com/mattermost/mattermost/commit/d33ad5a7e9fa374ceb18e43ab6fc413ff09d290c) | 2026-07-28 |
| f6c1459e | [MM-69612: Add opt-in EnableAuditLogging setting for ABAC (#37322)](https://github.com/mattermost/mattermost/commit/f6c1459ebf597b2097d07e447eec4300121d1086) | 2026-07-28 |
| 6fefcc80 | [MM-67336: Request structured JSON output for AI message rewrites (#37581)](https://github.com/mattermost/mattermost/commit/6fefcc80a402a73fd91576e51a0bf52d58838f21) | 2026-07-28 |
| 9230eb6f | [MM-69725: Propagate context through Extractor.Extract using new mattermost/pdf fork (#37579)](https://github.com/mattermost/mattermost/commit/9230eb6f6a6395bd8dea6a7706f94b84e847ea05) | 2026-07-28 |
| 75823b96 | [Update snapshot and try to fix flaky test (#37722)](https://github.com/mattermost/mattermost/commit/75823b96c3b160f473094059d3fd078eb190b148) | 2026-07-28 |
| 9de00278 | [\[MM-69982\] Fix intermittent remote cluster ping failures from stale keep-alive connection reuse (#37694)](https://github.com/mattermost/mattermost/commit/9de00278680adb7c87fce922a94e60c1f66b6774) | 2026-07-28 |
| 90ee5da7 | [docs: fix dark-mode code block contrast issues (#37736)](https://github.com/mattermost/mattermost/commit/90ee5da701b1b2732afb70e689ffd6e1ce6a46af) | 2026-07-29 |
| 638a1970 | [MM-69929: Fix clipped focus outline on multi-image gallery thumbnails (#37713)](https://github.com/mattermost/mattermost/commit/638a19702c7fdd597be79ff933f2cbd27aaae8bd) | 2026-07-29 |
| 8f0ab3f2 | [Add owners fields to policies (#37655)](https://github.com/mattermost/mattermost/commit/8f0ab3f2088817f06d4f104d82840965500fe534) | 2026-07-29 |
| a5739da6 | [Make options editable when a select field is owned (#37720)](https://github.com/mattermost/mattermost/commit/a5739da6923f3eeba883b2455206c95120ddedb1) | 2026-07-29 |
| 10804f80 | [Prepackage mattermost-plugin-agents v2.5.1 (#37727)](https://github.com/mattermost/mattermost/commit/10804f80f5739898f854203833c1dbab5e37f059) | 2026-07-29 |
| cdbc9263 | [Translations update from Mattermost Weblate (#37689)](https://github.com/mattermost/mattermost/commit/cdbc92639c51b64243cf7a0c8f622c720a312029) | 2026-07-30 |
| 6b90bb30 | [Make server-ci.yml always trigger so required checks never get stuck pending (#37557)](https://github.com/mattermost/mattermost/commit/6b90bb306383fe1147376016294e9d3bd6ba34db) | 2026-07-30 |
| 0b034ca9 | [Fix flaky TestExtractConcurrency (#37527)](https://github.com/mattermost/mattermost/commit/0b034ca9a79680cecf16956f57306791fd3bf4a5) | 2026-07-30 |
| 9a8021b5 | [\[MM-69812\] webapp: document plugin-facing global surface governance (#37515)](https://github.com/mattermost/mattermost/commit/9a8021b5926b8e75b0458403a7719c88e1fde7eb) | 2026-07-30 |
| 8a9aacb0 | [MM-69831 - Add configurable interval for the ABAC membership sync schedulers (#37623)](https://github.com/mattermost/mattermost/commit/8a9aacb0fb782504e3e4ed65afdd1f408319e9a9) | 2026-07-30 |
| b021e5be | [\[MM-69734\] Add no session data, ensure session attributes are not leaked through evaluation trace to non sysadmins (#37600)](https://github.com/mattermost/mattermost/commit/b021e5be06e761fb7fccd4b0f3547cb4cb1fa7d6) | 2026-07-30 |
| d4d216e9 | [Add ClusterInterface.Shutdown to surface skipped cluster sends (#37753)](https://github.com/mattermost/mattermost/commit/d4d216e93e492c3c7c2b3d481e966e22841b6825) | 2026-07-30 |
| b9cea257 | [MM-69912: let plugins bring their own editor extensions and read structured content (#37678)](https://github.com/mattermost/mattermost/commit/b9cea25748f7f64a148e22ad51658a190378670c) | 2026-07-30 |
| 5ef9e70d | [Mm 69832 abac review nits (#37640)](https://github.com/mattermost/mattermost/commit/5ef9e70d95d912d4bbe7b3f525b507e3e42ce3fd) | 2026-07-30 |
| 348f869b | [Mm 69841 team aback ux enhancements (#37677)](https://github.com/mattermost/mattermost/commit/348f869b717ebc330e167508fe38087665d11aa3) | 2026-07-30 |
| ae4b48d4 | [MM-69842 - Update Team Settings discoverability help text for Public/… (#37728)](https://github.com/mattermost/mattermost/commit/ae4b48d47d5a8a46733195edc5444afe4ebc0664) | 2026-07-30 |
| a70e8751 | [Gate ci-report and ci-artifacts on relevant-changed to fix skipped-job failures (#37777)](https://github.com/mattermost/mattermost/commit/a70e8751d4c3cae6125ed95dfa925f78b37c95fc) | 2026-07-30 |
| f5a7e403 | [Mm 69827 team abac job details ux (#37744)](https://github.com/mattermost/mattermost/commit/f5a7e40352089e6ec6fa16b44123dc792c831d38) | 2026-07-30 |
| c6db95f3 | [Preserve relative redirect_to on root SiteURL (#37725)](https://github.com/mattermost/mattermost/commit/c6db95f35d25aa0cd3c3c226f75bb2becfa2c7c6) | 2026-07-30 |
| 4ec0fe9c | [\[MM-69846\] List access_control/template attributes on the Manage Attributes page (#37608)](https://github.com/mattermost/mattermost/commit/4ec0fe9cc9dd35229c99260782ed011211f36e01) | 2026-07-30 |
| 466b5bb7 | [redact logs (#37757)](https://github.com/mattermost/mattermost/commit/466b5bb783a814c173fc2ccf06ad3d4bebc1b3b3) | 2026-07-30 |
| 20d3cdd6 | [\[MM-70023\] Consider attachment fields with no title for block translation (#37762)](https://github.com/mattermost/mattermost/commit/20d3cdd6f5774869be6ed100ced6d8b68568b514) | 2026-07-31 |
| 3019460a | [MM-69445: Markdown fixes (#37388)](https://github.com/mattermost/mattermost/commit/3019460ac55ff3d54c5f77363a0dde814fb13a39) | 2026-07-31 |
| 5152df24 | [Mm 70056 missing info banner team abac team admin (#37790)](https://github.com/mattermost/mattermost/commit/5152df2418a9e86d0e0291f179301ed0993ea8fb) | 2026-07-31 |
| d5d5b2ca | [Fix UI flash when closing the Decision details modal in permission policy simulation (#37141)](https://github.com/mattermost/mattermost/commit/d5d5b2ca2973ef92f3b3eaad182fe78816cf1481) | 2026-08-01 |
| 0785004b | [MM-65803 Add strict E2E tests for post list scrolling (#37653)](https://github.com/mattermost/mattermost/commit/0785004bcc78639b99a195c2f565d6ab903d723d) | 2026-08-01 |
| c17064f7 | [Fix flaky TestImportValidateDirectPostImportData (#37795)](https://github.com/mattermost/mattermost/commit/c17064f72c97e6e7ac4ee2c9ad02f2239faa10f9) | 2026-08-02 |
| acf883c8 | [chore: Update NOTICE.txt file with updated dependencies (#37814)](https://github.com/mattermost/mattermost/commit/acf883c825a6f59be1f6301c0f84c6f8f5df8ddc) | 2026-08-03 |
| ae0bec4d | [Add MFI plugin signature public key behind feature flag (#37793)](https://github.com/mattermost/mattermost/commit/ae0bec4d6741cafea7eca7beafbac1929826e20b) | 2026-08-03 |
| 7130ae59 | [MM-70054 - Enable Team Membership ABAC feature flag by default (#37781)](https://github.com/mattermost/mattermost/commit/7130ae598f8291bd5d5e39473bd2df370b69c3d8) | 2026-08-04 |
| b4beed37 | [MM-69974: keep focus in the WYSIWYG composer and stop the Enter crash (#37815)](https://github.com/mattermost/mattermost/commit/b4beed37f88b15d6eb50d4dff0be082043077b55) | 2026-08-04 |
| f4185af0 | [Update latest minor version to 11.11.0 (#37827)](https://github.com/mattermost/mattermost/commit/f4185af07a956c7bbbd41becd81293e8b87deff5) | 2026-08-04 |
| cd920652 | [Bumping prepackaged github version to v2.8.0 (#37831)](https://github.com/mattermost/mattermost/commit/cd920652fb6fba828da217e070b879f1d495a2c8) | 2026-08-04 |
| ddffe789 | [Fix: mobile menu backdrop fails to dismiss modal (#37430)](https://github.com/mattermost/mattermost/commit/ddffe7896ee03166281fff23d0296a0a24e9e742) | 2026-08-04 |
| c7eff700 | [ABAC: plugin-keyed resource types, trusted plugin PAP/CEL APIs, and AuthZEN-style decision API (#37509)](https://github.com/mattermost/mattermost/commit/c7eff70026ee233a5163fde42f5082134e66b795) | 2026-08-04 |
| 85acba42 | [Skip flaky TestExtractConcurrency (#37834)](https://github.com/mattermost/mattermost/commit/85acba42e1f9ae8a6bfb2f724bbf819b21a45c7a) | 2026-08-04 |
| 61bc7f18 | [\[MM-69647\] Remove CloudDedicatedExportUI feature flag and dead code (#37836)](https://github.com/mattermost/mattermost/commit/61bc7f18e4459b3ad7cca27db26924845d0c966b) | 2026-08-04 |
| 36af1ee5 | [Post attributes feature flag group (#37829)](https://github.com/mattermost/mattermost/commit/36af1ee5fc8f86ca671bf813e253806332eacf65) | 2026-08-05 |
| 63077696 | [\[MM-69847\] Add Classification Markings read-only exception to Manage Attributes listing (#37633)](https://github.com/mattermost/mattermost/commit/6307769639d5ea135dcabafdca5e0628df25bea7) | 2026-08-05 |
| f9227b1a | [Open Mattermost in the browser when the desktop landing page setting is disabled, with unit tests (#37833)](https://github.com/mattermost/mattermost/commit/f9227b1a2f644414e761b9ac513da1deab2c6b8a) | 2026-08-05 |
| 4eac9292 | [\[MM-69587\] Remove CustomProfileAttributes feature flag (#37389)](https://github.com/mattermost/mattermost/commit/4eac9292c02363461423aee51333000ed0633fea) | 2026-08-05 |
| 5b273440 | [\[MM-70113\] Gate Classification Markings behind Enterprise Advanced license (#37838)](https://github.com/mattermost/mattermost/commit/5b273440bf1b2f735429239960524e9e0854db43) | 2026-08-05 |
| eed994d1 | [\[MM-70114\] Fix flaky channel guard broadcast test (#37847)](https://github.com/mattermost/mattermost/commit/eed994d1062da9305ec950ba10ddb5faf0d6396f) | 2026-08-06 |
| 318fd812 | [Fix flaky TestComplianceStore/postgres/MessageExport_UntilUpdateAt (#37856)](https://github.com/mattermost/mattermost/commit/318fd81259c9c1b8859a3f6e357b26e9603d3e4a) | 2026-08-06 |
| dce666b0 | [MM-69980 Fix edited posts being slightly taller than unedited ones (#37693)](https://github.com/mattermost/mattermost/commit/dce666b02d8ec1864ed7b368157cc6d8ab96e5b4) | 2026-08-06 |
| fbf8402d | [\[MM-65680\] Add new configuration 'AttributeRefreshIntervalSeconds' to Access Control (#37854)](https://github.com/mattermost/mattermost/commit/fbf8402d4bce027823d7788c8f48401d839f8b31) | 2026-08-06 |
| 67496bd1 | [Bumping prepackaged Jira version to v4.8.0 (#37862)](https://github.com/mattermost/mattermost/commit/67496bd1575a0d4ad56355f9a5967b4395dfd642) | 2026-08-07 |
| 5ddb96d8 | [\[MM-69737\] Show a red warning callout in the System Console when settings are not recommended for production (#37407)](https://github.com/mattermost/mattermost/commit/5ddb96d8175435838580ca90f3dc69ab4178ac9e) | 2026-08-07 |
| 04a0efba | [MM-70115: Update account type switch handling (#37861)](https://github.com/mattermost/mattermost/commit/04a0efba6fad655c7bf0b88b278111643c605037) | 2026-08-07 |
| bf194bc9 | [MM-57390: Return error when inviting deactivated users to a team (#37096)](https://github.com/mattermost/mattermost/commit/bf194bc9d4e25eff93032897a2be1c3496a7d5b5) | 2026-08-07 |
| 68535c13 | [\[MM-70130\] Add permanent banner for non-production developer license keys (#37846)](https://github.com/mattermost/mattermost/commit/68535c13bcaa0026ed3d0622e11aa2cea4f4ff4e) | 2026-08-07 |
| 53373e37 | [Add Playwright E2E tests for demo plugin webapp components (#36560)](https://github.com/mattermost/mattermost/commit/53373e3752c6e8d7979b787f342fea4c56e68472) | 2026-08-07 |
| 351b4f96 | [Updated order of validation in getFile API (#37843)](https://github.com/mattermost/mattermost/commit/351b4f96865c44f0dedbd8a5243ad35f1f04154e) | 2026-08-10 |
| a2a49032 | [\[MM-62445\] Allow changing a team's name (slug) via mmctl team rename (#37169)](https://github.com/mattermost/mattermost/commit/a2a4903293f2412e7aa6ad66833cde795a4031e7) | 2026-08-10 |
| d04687af | [Fix flaky TestNewSyncsMarkdownMaxLenWithMaxPostSize (#37830)](https://github.com/mattermost/mattermost/commit/d04687af22172a6f915abd5c1999a19aae73e091) | 2026-08-10 |
| e0202119 | [\[MM-70141\] Remove dead experimental SAML login button color settings (#37857)](https://github.com/mattermost/mattermost/commit/e02021193ae75278cc6fb79140746b0fcafa0b1a) | 2026-08-10 |
| 6242bc3e | [\[MM-70140\] Remove experimental AD/LDAP login button color settings (#37855)](https://github.com/mattermost/mattermost/commit/6242bc3e2f4433d322e2f1a1087ed280ed9a5fb2) | 2026-08-10 |

## 제외된 커밋

| 커밋 해시 | 커밋 제목 | 사유 |
|---|---|---|

| b8c9f931 | [Update package-lock.json (#34958)](https://github.com/mattermost/mattermost/commit/b8c9f931bb22652c486bb82ee73f92d0e6249e0e) | webapp/package-lock.json에서 고아 optional 패키지 6개(deep-extend, expand-template, github-from-package, mkdirp-classic, napi-build-utils, node-abi) 제거하는 lockfile 정리 커밋. 우리 자체 node24 업그레이드(343e40f3a4)와 peer 플래그 안정화(3ed114d934)로 lockfile이 이미 완전히 재생성되어 해당 6개 항목이 애초에 존재하지 않음(grep 0건) — 이미 동일한 결과 달성, 반영 실익 없음. |

| df001842 | [fix merge defect on server/channels/app/post_test.go (#35057)](https://github.com/mattermost/mattermost/commit/df0018425021695232de4bd81915291494955b67) | 5d3de44c2a로 동일 내용 선반영 (post_test.go의 CreatePost/UpdatePost 3-값 시그니처 대응). 포크는 isMemberForPreviews 추가 반환으로 원래 3-값이라 원인은 다르나 최종 코드가 동일. |

| eeaf9c8e | [Fix bad merge (#35079)](https://github.com/mattermost/mattermost/commit/eeaf9c8e3e860faaacf968da8cce9988919dd97f) | fe305207(MM-67074) adapt 시 우리 fork의 CreatePostAsUser 3-value 반환 시그니처에 맞춰 integration_action_test.go의 동일한 두 줄(232, 275)에 이미 '_,' 보정을 적용함 — 이 커밋(upstream 자체 빌드 수정)은 완전히 동일한 변경이라 반영할 것이 없음 |

| 67226f32 | [Avoid `simple` config when doing FTS in Postgres (#35063)](https://github.com/mattermost/mattermost/commit/67226f32a40fe3cc584920cd3064c2e5d4cb0b16) | 우리 fork가 자체 커밋 6eecf5ee32(채널 검색을 Postgres FTS(to_tsvector/to_tsquery)에서 LIKE/ILIKE 기반으로 전면 교체, 한글 형태소 검색 오류 수정 목적)로 이 코드 영역을 완전히 재작성함. post_store.go에 simpleSearch/pgDefaultTextSearchConfig/to_tsvector/to_tsquery 참조가 전혀 남아있지 않아 upstream의 되돌리기(revert) 패치가 적용될 대상 코드가 존재하지 않음. |

| a8dc8baa | [\[MM-67235\] Add support for autotranslations on GM and DM (#35255)](https://github.com/mattermost/mattermost/commit/a8dc8baa905630d28c9d6966aca67c3ee01df16c) | 자동번역(AutoTranslation)을 GM/DM으로 확장하는 프론트엔드 배선(selector 리네이밍 + 채널 헤더/설정 모달 UI). 실제 번역 실행 로직은 github.com/mattermost/enterprise/autotranslation(비공개 저장소)에만 있어 okrbest에서는 작동 불가. d87527b3(flag 비활성 유지)와 동일 계열. 또한 충돌 파일(channel_header/index.ts, channel_settings_info_tab.tsx, post_list/index.tsx)이 우리 자체 커스텀 기능(봇 메시지 필터 #164/#161, 멤버 필터링 #159/#156, 채널 북마크 메뉴 개편 #195)과 겹쳐 반영 비용 대비 실익 없음. |

| 45f54a0e | [Implementation of Documentation Impact Review Workflow via GH Actions (#35358)](https://github.com/mattermost/mattermost/commit/45f54a0e3fbf1c1d92af52bb228a54f027d6b1c9) | PR 코멘트 /docs-review 트리거로 Mattermost, Inc. 소유의 mattermost/docs(공식 문서 사이트 docs.mattermost.com 소스) 저장소를 체크아웃해 문서 반영 필요 여부를 분석하는 GH Actions 워크플로. 프롬프트 전체가 'Mattermost project'/docs.mattermost.com 문맥에 하드코딩돼 있어 okrbest에 그대로 켜도 우리와 무관한 upstream 공개 문서를 분석하는 무의미한 결과만 생성(ANTHROPIC_API_KEY만 소모). okrbest는 대응하는 자체 공개 문서 저장소를 운영하지 않아 adapt 대상도 없음. |

| 0fa5e235 | [Fix Permission Request for Docs Agent (#35373)](https://github.com/mattermost/mattermost/commit/0fa5e235bc061a089ecf17830c71b7c5fe8f7c4e) | 부모 워크플로 45f54a0e(Documentation Impact Review Workflow)와 동일 사유로 제외 — okrbest에 docs-impact-review.yml 자체가 없어(Mattermost 공식 docs 저장소 전용, adapt 대상 없음) 그 후속 권한 수정(id-token: write 추가)도 반영할 대상이 없음. |

| 7ccafd79 | [Fix PR Checkout (#35375)](https://github.com/mattermost/mattermost/commit/7ccafd79886ad26a2cf71f1f845e207793d19057) | 부모 워크플로 45f54a0e(Documentation Impact Review Workflow)와 동일 사유로 제외 — okrbest에 docs-impact-review.yml 자체가 없어 PR checkout 로직 수정(6줄)도 반영할 대상이 없음. |

| 202334aa | [Allow GH Bash Invocations (#35376)](https://github.com/mattermost/mattermost/commit/202334aaa01fba88c11e3764b6b2568ebece2870) | 부모 워크플로 45f54a0e(Documentation Impact Review Workflow)와 동일 사유로 제외 — okrbest에 docs-impact-review.yml 자체가 없어 GH Bash 실행 허용 수정도 반영할 대상이 없음. |

| 60fbce7d | [\[MM-67671\] Add CJK Post search support for PostgreSQL (#35260)](https://github.com/mattermost/mattermost/commit/60fbce7d03f2bbe00238c4c988b9d86b3360a0bd) | 우리 포크가 이미 6eecf5ee32(채널 검색을 Postgres FTS에서 ILIKE 부분일치로 전면 교체, 한글 형태소 검색오류 수정목적)로 전체 언어에 대해 CJK를 포함한 부분일치 검색을 상시 지원 중 — upstream의 CJKSearch 피처플래그 기반 LIKE 폴백은 도달 불가능한 죽은 코드가 되며, 의존 심볼(quotedStringsRegex)이 6eecf5ee32에서 삭제되어 그대로 cherry-pick 시 컴파일 에러 발생 확인 |

| 5ddd76ec | [Development environment setup (#35513)](https://github.com/mattermost/mattermost/commit/5ddd76ec39f94f177c7f8a21d6855d822346f421) | Mattermost Inc. 내부 Cursor Cloud 전용 개발 환경 문서(AGENTS.CLOUD.md) — 비공개 mattermost/enterprise, mattermost-plugin-agents 저장소와 CURSOR_GH_TOKEN/TEST_LICENSE 등 내부 시크릿을 전제로 해 okrbest에 적용 불가. .gitignore에 AGENTS.md를 추가하려는 변경도 우리가 의도적으로 추적 중인 !/AGENTS.md 규칙(spec-kit/superpowers용)과 충돌. upstream도 후속 커밋 1af7d823(#36286, 2026-04-27)에서 이 파일을 스스로 제거함. |

| f1b9aa05 | [Rename Content Flagging to Data Spillage Handling (#35407)](https://github.com/mattermost/mattermost/commit/f1b9aa052e821701c9184e16337558f96b8755f4) | Content Flagging 기능을 'Data Spillage Handling'/'Quarantine for Review'로 전면 개명하는 커밋. 기본 신고 사유를 'OPSEC concern', 'CUI violation', 'Need-to-know violation' 등 미국 국방·정보기관(DISC) 특화 용어로 교체 — okrbest는 일반 협업·OKR 툴로 리브랜드된 포크라 이 용어가 제품 성격과 맞지 않음(사용자 확인). 41개 파일 525줄 규모에 실제 conflict 2건(flag_post_modal.tsx, en.json) 발생. 커밋에 포함된 부수 수정(getContentReviewBot의 nil bot 방지, postContentReviewBotMessage 시그니처 리팩터, 아이콘 컴포넌트 교체)은 전부 이 rename 작업 자체가 만든 파생 버그/작업이라 용어를 유지하면 분리 반영할 실익도 없음. 현재 'Content Flagging'/'Flag message' 용어 유지. |

| ac9d99bd | [Add agent-browser skill and update cloud agent docs (#35534)](https://github.com/mattermost/mattermost/commit/ac9d99bdd4657a78c9612444888d09fcda16db3e) | Mattermost 자체 Claude Code Cloud 에이전트용 실험적 도구(agent-browser 스킬, skills-lock.json, AGENTS.CLOUD.md). upstream 자신도 이후 b4fcb472012(#36930)에서 완전히 되돌림 — 우리는 AGENTS.CLOUD.md를 가진 적 없고 이 클라우드 에이전트 인프라를 쓰지 않음. |

## spec 전환 커밋

| 커밋 해시 | 커밋 제목 | spec |
|---|---|---|

| 2ada8d76 | [MM-67540 - Allow searching public channel messages without channel membership (#35298)](https://github.com/mattermost/mattermost/commit/2ada8d7659a53815ea96c7917b6816706755dbaf) | 공개채널 멤버십 없이 메시지 검색 허용 (ES/OpenSearch channel_type 인덱싱 + 백필 + 컴플라이언스 오버라이드) |

| 2bd143ce | [\[MM-65630\] Implement Search RHS popout, clean up and rework parts of search RHS (#35499)](https://github.com/mattermost/mattermost/commit/2bd143ced747794d40e17bae5654ebc837d085fa) | 008-search-rhs-popout |

## Mattermost 비공개 사설 모듈 커밋

| 커밋 해시 | 커밋 제목 | 비공개 모듈 · 비고 |
|---|---|---|
| a1c85007 | [Autotranslations MVP (#34696)](https://github.com/mattermost/mattermost/commit/a1c85007e156adee66583b0f13e88d5da6386dd4) | `github.com/mattermost/enterprise/autotranslation` (비공개). 인터페이스·DB 스키마·관리 콘솔 UI는 ac434e9812(adapt)로 반영했으나 실제 번역/마스킹 로직은 okrbest가 별도 구현해야 활성화됨 — `server/einterfaces/autotranslation.go`의 `AutoTranslationInterface`를 구현해 `RegisterAutoTranslationInterface()`로 등록. |
| 4195b8bc | [Metrics for Autotranslations (#34900)](https://github.com/mattermost/mattermost/commit/4195b8bc5c1fd5063aa0d6385cbca891e68813b3) | Autotranslation 메트릭 인터페이스/Prometheus 등록만 추가. 실제 번역 로직은 github.com/mattermost/enterprise/autotranslation(비공개 저장소)에 있어 okrbest에선 호출되지 않는 비활성(inert) 계측으로 남음. 향후 자체 autotranslation 기능 구현 시 재사용 가능. |
| 36479bd7 | [Configurable workers and move sweeper job to job infra (#35007)](https://github.com/mattermost/mattermost/commit/36479bd721fe892371795844a16125dadb78cd3b) | AutoTranslation Workers 설정 및 sweeper job 등록(interface만, 실제 로직은 비공개 모듈 github.com/mattermost/enterprise/autotranslation) |
| d87527b3 | [\[MM-67488\] Set autotranslation feature flag default to true (#35288)](https://github.com/mattermost/mattermost/commit/d87527b374636ace6e5ef7bff2fcb8238a9d3385) | AutoTranslation 실제 구현(번역 엔진 호출 로직)이 github.com/mattermost/enterprise/autotranslation 비공개 저장소에만 있음 - 자체 모듈(LibreTranslate 등) 개발 전까지 feature flag 비활성 유지 |
| a8dc8baa | [\[MM-67235\] Add support for autotranslations on GM and DM (#35255)](https://github.com/mattermost/mattermost/commit/a8dc8baa905630d28c9d6966aca67c3ee01df16c) | GM/DM 자동번역 프론트엔드 배선(selector·UI). 실제 번역 로직은 github.com/mattermost/enterprise/autotranslation(비공개)에 있어 okrbest에서 작동 불가 — exclude 처리(위 부록 참조). 자체 모듈 개발 시 UI 참고 가능. |
| 932086e2 | [separate websocket event for translations metrics (#35296)](https://github.com/mattermost/mattermost/commit/932086e29cf3e2574d69417ddd9140be76784d7a) | AutoTranslation 관련 websocket 이벤트(post_translation_updated) 전용 Prometheus 카운터 등록만 추가. 실제 번역 로직은 github.com/mattermost/enterprise/autotranslation(비공개 저장소)에 있어 okrbest에선 이 이벤트가 발생하지 않아 카운터는 항상 0으로 남는 비활성(inert) 계측. 향후 자체 autotranslation 기능 구현 시 재사용 가능. |
| 100cde3a | [\[MM-67587\] Exclude system messages from autotranslation queue (#35267)](https://github.com/mattermost/mattermost/commit/100cde3a1aeee2faf5a537d1cb1a280b4c24f594) | 제목이 표방하는 '자동번역 큐에서 시스템 메시지 제외' 실제 로직은 github.com/mattermost/enterprise/autotranslation(비공개, //go:build enterprise 태그) 안에만 있음. 우리 저장소에는 RegisterAutoTranslationInterface()를 호출해 구현체를 등록하는 코드가 없고 go.mod/go.sum에도 참조 없음 — cherry-pick한 건 이 로직을 호출하는 post.go의 if/else→switch 스타일 리팩터뿐, 시스템 메시지 제외 기능 자체는 우리 쪽에서 비활성 상태. |
