      7 |
      8 | import {LandingProducts, Preferences, suitePluginIds} from 'utils/constants';
      9 |

      at Resolver._throwModNotFoundError (../node_modules/jest-resolve/build/index.js:863:11)
      at Object.require (src/selectors/landing.test.ts:6:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.484 s
Ran all test suites matching src/selectors/landing.
      at Resolver._throwModNotFoundError (../node_modules/jest-resolve/build/index.js:863:11)
      at Object.require (src/plugins/products_initialized.test.ts:4:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.456 s
Ran all test suites matching src/plugins/products_initialized.
    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      701 |
      702 |             await redirectUserToDefaultTeam();
    > 703 |             expect(waitForProductsInitialized).toHaveBeenCalled();
          |                                                ^
      704 |             expect(getHistory().push).toHaveBeenCalledWith('/team2/channels/channel-in-team-2');
      705 |             expect(reduxStore.dispatch).not.toHaveBeenCalledWith(
      706 |                 expect.objectContaining({type: expect.stringContaining('PREFERENCES')}),

      at Object.toHaveBeenCalled (src/actions/global_actions.test.ts:703:48)

Test Suites: 1 failed, 1 total
Tests:       3 failed, 10 passed, 13 total
Snapshots:   0 total
Time:        1.324 s, estimated 2 s
Ran all test suites matching src/actions/global_actions.

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.493 s
Ran all test suites matching src/components/user_settings/display/landing_product.

      at Object.toHaveBeenCalledWith (src/components/team_settings/team_info_tab/team_info_tab.test.tsx:167:27)

Test Suites: 2 failed, 2 total
Tests:       4 failed, 6 passed, 10 total
Snapshots:   0 total
Time:        2.1 s
Ran all test suites matching src/components/team_settings/team_info_tab.
    ✓ 활성화된 제품만 선택지로 노출한다 (65 ms)
    ✓ 보드를 선택해 저장하면 공통(name="") preference로 저장한다 (40 ms)
    ✓ 팀 기본값 따르기를 선택해 저장하면 preference를 삭제한다 (24 ms)
    ✕ 팀별 저장값이 있으면 "모든 팀에 적용"이 해제된 채 열린다 (26 ms)
    ✕ "모든 팀에 적용"을 끄고 저장하면 팀별(name=팀 ID) preference로 저장한다 (22 ms)
    ✕ "모든 팀에 적용"으로 저장하면 공통으로 저장하고 팀별 키를 삭제한다 (23 ms)
    ✓ 저장값의 제품이 비활성이면 접힌 화면에 기본값(팀 기본값 따르기)을 표시하고 저장값은 건드리지 않는다 (4 ms)
Tests:       3 failed, 4 passed, 7 total
