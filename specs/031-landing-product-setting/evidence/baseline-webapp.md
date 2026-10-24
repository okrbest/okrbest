# webapp baseline @ e1ec43521f 2026-10-25T02:19:02+09:00
# 범위: check·check-types 전체 + 접촉 영역 jest(user_settings/display, team_settings, global_actions, selectors)
# 마감 게이트는 같은 명령을 재실행해 이 목록과 diff한다. 전체 스위트는 PR CI가 집행한다.

## cmd: npm run check
lint error lines: 122 (목록: /tmp/claude-1000/bl-lint-errors.txt, 사본 아래 첨부)
    4:1   error  `@lexical/markdown` import should occur after import of `@lexical/link`                       import/order
    4:37  error  '$convertToMarkdownString' is defined but never used                                          @typescript-eslint/no-unused-vars
    5:1   error  `lexical` import should occur after import of `classnames`                                    import/order
    6:1   error  `@lexical/rich-text` import should occur after import of `@lexical/react/LexicalTablePlugin`  import/order
    7:1   error  `@lexical/list` import should occur after import of `@lexical/link`                           import/order
   25:49  error  'CHANNELS_TRANSFORMERS' is defined but never used                                             @typescript-eslint/no-unused-vars
   30:32  error  Unexpected dangling '_' in '__username'     no-underscore-dangle
   30:39  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
   30:49  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   30:59  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   30:69  error  Unexpected dangling '_' in '__key'          no-underscore-dangle
   30:79  error  Unexpected dangling '_' in '__key'          no-underscore-dangle
   35:9   error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
   35:9   error  Unexpected dangling '_' in '__username'     no-underscore-dangle
   36:9   error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   36:9   error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   40:16  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
   40:16  error  Unexpected dangling '_' in '__username'     no-underscore-dangle
   44:16  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   44:16  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   47:9  error  Unexpected console statement  no-console
   48:20  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
   48:20  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   54:43  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
   54:43  error  Unexpected dangling '_' in '__username'     no-underscore-dangle
   86:46  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
   86:46  error  Unexpected dangling '_' in '__username'     no-underscore-dangle
   87:35  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   87:35  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
   90:30  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
   90:48  error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
   90:69  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
   90:91  error  Unexpected dangling '_' in '__key'            no-underscore-dangle
   92:9  error  Unexpected console statement  no-console
   95:9   error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
   96:9   error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
   97:9   error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
   99:23  error  Unexpected dangling '_' in '__username'     no-underscore-dangle
   99:26  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
  100:26  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
  100:26  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
  101:16  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  105:16  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  108:57  error  Unexpected dangling '_' in '__username'     no-underscore-dangle
  108:65  error  Unexpected dangling '_' in '__channelName'  no-underscore-dangle
  109:16  error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
  109:17  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
  109:17  error  Unexpected dangling '_' in '__displayName'  no-underscore-dangle
  109:9  error  Unexpected console statement  no-console
  111:33  error  The closing bracket must be aligned with the opening tag (expected column 41)  @stylistic/jsx-closing-bracket-location
  112:33  error  Expected line before comment  @stylistic/lines-around-comment
  114:24  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  116:16  error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
  123:48  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  126:45  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  132:9   error  Arrow function expected no return value                                        consistent-return
  138:9  error  Unexpected console statement  no-console
  13:17  error  'screen' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
  13:5  error  'computeReplaceCharCountFromTrigger' is defined but never used  @typescript-eslint/no-unused-vars
  13:9  error  'getProfiles' is defined but never used  @typescript-eslint/no-unused-vars
  14 errors and 0 warnings potentially fixable with the `--fix` option.
  140:48  error  Do not nest ternary expressions          no-nested-ternary
  160:9  error  Unexpected console statement  no-console
  171:5   error  'characterLimit' is defined but never used                                                    @typescript-eslint/no-unused-vars
  172:51  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  173:17  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  174:56  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  179:5   error  'onHeightChange' is defined but never used                                                    @typescript-eslint/no-unused-vars
  181:5   error  'searchUsers' is defined but never used                                                       @typescript-eslint/no-unused-vars
  184:48  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  185:35  error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
  193:1  error  More than 1 blank line not allowed  @stylistic/no-multiple-empty-lines
  198:24  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  199:27  error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
  200:28  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  205:9  error  Unexpected console statement  no-console
  207:17  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  208:51  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  208:69  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  211:28  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  212:32  error  Unexpected dangling '_' in '__emojiImageUrl'  no-underscore-dangle
  219:31  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  221:31  error  Unexpected dangling '_' in '__emojiName'      no-underscore-dangle
  223:13  error  Unexpected dangling '_' in '__emojiUnicode'   no-underscore-dangle
  231:13  error  Unexpected console statement                                                                  no-console
  237:23  error  'setPostError' is assigned a value but never used       @typescript-eslint/no-unused-vars
  238:9   error  Arrow function expected no return value  consistent-return
  23:5   error  Error: Cannot reassign variables declared outside of the component/hook
  241:11  error  'hasDraftMessage' is assigned a value but never used    @typescript-eslint/no-unused-vars
  28:1  error  Expected indentation of 8 spaces but found 15                                  @stylistic/indent
  363:9   error  'enableEmojiPicker' is assigned a value but never used  @typescript-eslint/no-unused-vars
  36:17  error  The closing bracket must be aligned with the opening tag (expected column 24)  @stylistic/jsx-closing-bracket-location
  36:9  error  The closing bracket must be aligned with the opening tag (expected column 16)  @stylistic/jsx-closing-bracket-location
  37:9  error  Expected line before comment  @stylistic/lines-around-comment
  39:42  error  '_blob' is defined but never used  @typescript-eslint/no-unused-vars
  404:35  error  Unexpected negated condition                            no-negated-condition
  4:19  error  '$createParagraphNode' is defined but never used  @typescript-eslint/no-unused-vars
  4:9   error  '$getRoot' is defined but never used              @typescript-eslint/no-unused-vars
  4:9  error  'addMinutes' is defined but never used  @typescript-eslint/no-unused-vars
  52:13  error  The closing bracket must be aligned with the opening tag (expected column 20)  @stylistic/jsx-closing-bracket-location
  66:23  error  There should be no empty line within import group                                                                              import/order
  69:25  error  `mattermost-redux/selectors/entities/search` import should occur before import of `mattermost-redux/selectors/entities/users`  import/order
  6:43  error  'useIntl' is defined but never used  @typescript-eslint/no-unused-vars
  77:17  error  Unexpected console statement  no-console
  780:15  error  'teammateNameDisplaySection' is assigned a value but never used  @typescript-eslint/no-unused-vars
  78:9  error  The closing bracket must be aligned with the opening tag (expected column 16)  @stylistic/jsx-closing-bracket-location
  9:1  error  There should be at least one empty line between import groups  import/order
npm error Lifecycle script `check:eslint` failed with error:
npm error Lifecycle script `check` failed with error:
npm error code 1
npm error code 1
npm error command failed
npm error command failed
npm error command sh -c eslint ./src eslint.config.mjs --quiet --cache
npm error command sh -c npm run check:eslint && npm run check:stylelint
npm error location /home/sdh/okrbest/okrbest/webapp/channels
npm error location /home/sdh/okrbest/okrbest/webapp/channels
npm error path /home/sdh/okrbest/okrbest/webapp/channels
npm error path /home/sdh/okrbest/okrbest/webapp/channels
npm error workspace mattermost-webapp@12.1.0
npm error workspace mattermost-webapp@12.1.0
✖ 106 problems (106 errors, 0 warnings)

## cmd: npm run check-types
ts error lines: 13
src/components/admin_console/admin_definition_ldap_wizard.tsx(263,9): error TS2322: Type '{ id: string; defaultMessage: string; }' is not assignable to type 'string'.
src/components/admin_console/admin_definition_ldap_wizard.tsx(384,9): error TS2322: Type '{ id: string; defaultMessage: string; }' is not assignable to type 'string'.
src/components/admin_console/admin_definition_ldap_wizard.tsx(40,9): error TS2322: Type '{ id: string; defaultMessage: string; }' is not assignable to type 'string'.
src/components/admin_console/admin_definition_ldap_wizard.tsx(608,9): error TS2322: Type '{ id: string; defaultMessage: string; }' is not assignable to type 'string'.
src/components/admin_console/admin_definition_ldap_wizard.tsx(656,9): error TS2322: Type '{ id: string; defaultMessage: string; }' is not assignable to type 'string'.
src/components/admin_console/admin_definition_ldap_wizard.tsx(657,9): error TS2322: Type '{ id: string; defaultMessage: string; }' is not assignable to type 'string'.
src/components/lexical_editor/nodes/emoji_node.test.ts(95,37): error TS2345: Argument of type 'LexicalNode | LexicalNode[] | null | undefined' is not assignable to parameter of type 'LexicalNode | null | undefined'.
src/components/lexical_editor/nodes/emoji_node.test.ts(96,34): error TS2345: Argument of type 'LexicalNode | LexicalNode[] | null | undefined' is not assignable to parameter of type 'LexicalNode | null | undefined'.
src/components/lexical_editor/plugins/markdown_paste_plugin.tsx(53,13): error TS2353: Object literal may only specify known properties, and 'children' does not exist in type 'SerializedLexicalNode'.
src/components/post_view/post_view.test.tsx(30,82): error TS7006: Parameter 'cb' implicitly has an 'any' type.
src/components/post_view/post_view.test.tsx(32,82): error TS7006: Parameter 'cb' implicitly has an 'any' type.
src/components/resizable_sidebar/resizable_lhs/index.tsx(31,13): error TS2322: Type 'MouseEventHandler<"div"> | undefined' is not assignable to type 'MouseEventHandler<HTMLDivElement> | undefined'.
src/components/resizable_sidebar/resizable_lhs/index.tsx(32,13): error TS2322: Type 'MouseEventHandler<"div"> | undefined' is not assignable to type 'MouseEventHandler<HTMLDivElement> | undefined'.

## cmd: (channels) npx jest user_settings/display team_settings actions/global_actions src/selectors
      1699 |
    > 1700 |         expect(Selectors.getDirectAndGroupChannels(state)).toEqual([
           |                                                            ^
      1701 |             {...channel1, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
      1702 |             {...channel2, display_name: user2.username},
      1703 |             {...channel3, display_name: user3.username},

      at Object.toEqual (src/packages/mattermost-redux/src/selectors/entities/channels.test.ts:1700:60)


Test Suites: 2 failed, 60 passed, 62 total
Tests:       7 failed, 780 passed, 787 total
Snapshots:   19 passed, 19 total
Time:        7.204 s
Ran all test suites matching user_settings/display|team_settings|actions/global_actions|src/selectors.
exit=0
