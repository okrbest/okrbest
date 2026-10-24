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
