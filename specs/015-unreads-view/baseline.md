# 구현 전 게이트 기준선 (T001)

- 측정 시각: 2026-10-07 04:09~04:15 KST
- HEAD: 50f2156b94ec47d8f4d2e553c3f03a832fde4216
- 작업 트리: 소스 무변경. 비소스 잔여 2건은 게이트와 무관 —
  `M webapp/package-lock.json`(대화 이전부터 존재), `?? .playwright-mcp/`(브라우저 도구 산출물)
- 명령: `cd webapp && npm run check / check-types / test` (workspaces 전체)

## 종합

| 게이트 | exit | 실패 규모 |
|---|---|---|
| npm run check | 1 | eslint 107 errors (channels) |
| npm run check-types | 2 | 아래 파일별 TS 오류 |
| npm run test | 1 | channels: Test Suites 27 failed / 1 skipped / 1147 passed (1174 of 1175). platform 워크스페이스 전부 통과 |

## check — eslint 오류 파일별 건수
```
channels/src/actions/views/rhs.test.ts
channels/src/components/admin_console/license_settings/license_settings.tsx
channels/src/components/advanced_text_editor/advanced_text_editor.tsx
channels/src/components/boards_modal/boards_modal.tsx
channels/src/components/channel_header_menu/channel_header_menu_items/channel_header_direct_menu.tsx
channels/src/components/channel_header_menu/channel_header_menu_items/channel_header_group_menu.tsx
channels/src/components/channel_header_menu/channel_header_menu_items/channel_header_public_private_menu.tsx
channels/src/components/global_header/left_controls/product_menu/product_menu_list/product_menu_list.tsx
channels/src/components/invitation_modal/index.tsx
channels/src/components/lexical_editor/lexical_text_editor.integration.test.tsx
channels/src/components/lexical_editor/lexical_text_editor.test.tsx
channels/src/components/lexical_editor/lexical_text_editor.tsx
channels/src/components/lexical_editor/nodes/channel_mention_node.ts
channels/src/components/lexical_editor/nodes/emoji_node.ts
channels/src/components/lexical_editor/nodes/mention_node.test.ts
channels/src/components/lexical_editor/nodes/mention_node.ts
channels/src/components/lexical_editor/plugins/keyboard_plugin.test.tsx
channels/src/components/lexical_editor/plugins/mention_plugin.tsx
channels/src/components/lexical_editor/plugins/on_change_plugin.test.tsx
channels/src/components/lexical_editor/plugins/on_change_plugin.test.tsx:23:5
channels/src/components/lexical_editor/plugins/slash_command_plugin.tsx
channels/src/components/lexical_editor/utils/apply_mention_replacement.ts
channels/src/components/user_settings/display/user_settings_display.tsx
channels/src/utils/local_storage.test.ts
channels/src/utils/local_storage.ts
```

## check-types — 오류 위치 전체
```
src/components/admin_console/admin_definition_ldap_wizard.tsx:40 TS2322
src/components/admin_console/admin_definition_ldap_wizard.tsx:263 TS2322
src/components/admin_console/admin_definition_ldap_wizard.tsx:384 TS2322
src/components/admin_console/admin_definition_ldap_wizard.tsx:608 TS2322
src/components/admin_console/admin_definition_ldap_wizard.tsx:656 TS2322
src/components/admin_console/admin_definition_ldap_wizard.tsx:657 TS2322
src/components/channel_header/channel_header.test.tsx:75 TS2741
src/components/channel_header/channel_header.test.tsx:82 TS2741
src/components/channel_header/channel_header.test.tsx:94 TS2741
src/components/channel_header/channel_header.test.tsx:125 TS2741
src/components/channel_header/channel_header.test.tsx:137 TS2741
src/components/channel_header/channel_header.test.tsx:153 TS2741
src/components/channel_header/channel_header.test.tsx:165 TS2741
src/components/channel_header/channel_header.test.tsx:177 TS2741
src/components/channel_header/channel_header.test.tsx:194 TS2741
src/components/channel_header/channel_header.test.tsx:207 TS2741
src/components/channel_header/channel_header.test.tsx:220 TS2741
src/components/channel_header/channel_header.test.tsx:232 TS2741
src/components/channel_header/channel_header.test.tsx:244 TS2741
src/components/channel_header/channel_header.test.tsx:255 TS2741
src/components/channel_header/channel_header.test.tsx:280 TS2741
src/components/channel_header/channel_header.test.tsx:306 TS2741
src/components/channel_header/channel_header.test.tsx:313 TS2741
src/components/channel_header/channel_header.test.tsx:339 TS2741
src/components/channel_header/channel_header.test.tsx:363 TS2741
src/components/lexical_editor/nodes/emoji_node.test.ts:95 TS2345
src/components/lexical_editor/nodes/emoji_node.test.ts:96 TS2345
src/components/lexical_editor/plugins/markdown_paste_plugin.tsx:53 TS2353
src/components/post_view/post_view.test.tsx:30 TS7006
src/components/post_view/post_view.test.tsx:32 TS7006
```

## test — 실패 스위트 27개
```
FAIL src/actions/views/channel.test.js
FAIL src/components/about_build_modal/about_build_modal.test.tsx
FAIL src/components/admin_console/custom_terms_of_service_settings/custom_terms_of_service_settings.test.tsx
FAIL src/components/admin_console/org_role_management/org_role_management.test.tsx
FAIL src/components/advanced_text_editor/advanced_text_editor.test.tsx
FAIL src/components/channel_header/channel_header.test.tsx
FAIL src/components/lexical_editor/lexical_text_editor.integration.test.tsx
FAIL src/components/lexical_editor/lexical_text_editor.test.tsx
FAIL src/components/lexical_editor/utils/apply_mention_replacement.test.ts
FAIL src/components/more_direct_channels/index.test.tsx
FAIL src/components/more_direct_channels/list/index.test.ts
FAIL src/components/post_view/post_time/post_time.test.tsx
FAIL src/components/preparing_workspace/invite_members.test.tsx
FAIL src/components/profile_popover/profile_popover.test.tsx
FAIL src/components/profile_popover/profile_popover_call_button_wrapper/index.test.tsx
FAIL src/components/properties_card_view/propertyValueRenderer/user_property_renderer/userPropertyRenderer.test.tsx
FAIL src/components/sidebar/sidebar_channel/sidebar_channel_menu/sidebar_channel_menu.test.tsx
FAIL src/components/start_trial_form_modal/start_trial_form_modal.test.tsx
FAIL src/components/suggestion/at_mention_provider/at_mention_provider.test.tsx
FAIL src/components/suggestion/suggestion_box/suggestion_box.test.jsx
FAIL src/packages/mattermost-redux/src/actions/channel_categories.test.js
FAIL src/packages/mattermost-redux/src/selectors/entities/channels.test.ts
FAIL src/packages/mattermost-redux/src/selectors/entities/users.test.ts
FAIL src/packages/mattermost-redux/src/utils/user_utils.test.ts
FAIL src/utils/admin_console_index.test.tsx
FAIL src/utils/local_storage.test.ts
FAIL src/utils/markdown/index.test.ts
```
