# webapp final gates @ 7c124cd746 2026-10-25T02:47:33+09:00
# 기준선(evidence/baseline-webapp.md)과 같은 명령. lint·ts는 기준선 목록과 diff.

## cmd: npm run check
lint error lines: 122
### diff vs baseline (bl-lint-errors.txt)
105c105
<   780:15  error  'teammateNameDisplaySection' is assigned a value but never used  @typescript-eslint/no-unused-vars
---
>   781:15  error  'teammateNameDisplaySection' is assigned a value but never used  @typescript-eslint/no-unused-vars

## cmd: npm run check-types
ts error lines: 13
### diff vs baseline (bl-ts.txt)
ts diff: 0건

## cmd: (channels) npx jest user_settings/display team_settings actions/global_actions src/selectors src/plugins/products_initialized
      at Object.toEqual (src/packages/mattermost-redux/src/selectors/entities/channels.test.ts:1700:60)


Test Suites: 2 failed, 64 passed, 66 total
Tests:       7 failed, 806 passed, 813 total
Snapshots:   19 passed, 19 total
Time:        5.817 s, estimated 8 s
Ran all test suites matching user_settings/display|team_settings|actions/global_actions|src/selectors|src/plugins/products_initialized.
exit=0
