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
Tests:       1 failed, 12 skipped, 13 total

# fix/landing-once-per-login RED — 랜딩 1회 적용·리셋 테스트 (resetLandingProductRedirect 미구현)
    ✓ toggleSideBarRightMenuAction
      ✓ should redirect to /select_team when no team is available (2 ms)
      ✓ should redirect to last viewed channel in the last viewed team when the user have access to that team (1 ms)
      ✓ should redirect to last channel on first team with channels when the user have no channels in the current team (2 ms)
      ✓ should redirect to /select_team when the user have no channels in the any of his teams
      ✓ should do nothing if there is not current user
      ✓ should redirect to direct message if that's the most recently used
      ✓ should redirect to group message if that's the most recently used
      ✓ should redirect to last channel on first team when current team is no longer available (1 ms)
      ✕ 공통 개인 설정이 보드이고 product가 등록되어 있으면 /boards로 보낸다
      ✕ 개인 설정이 없어도 팀 기본값이 보드면 /boards로 보낸다
      ✕ 설정이 보드인데 product 미등록에 대기 상한을 넘기면 채널로 보내고 저장값은 건드리지 않는다
      ✕ 랜딩 판정은 로그인당 1회만 적용된다 — 이후 "/" 진입(레일 Channels 클릭)은 채널로 간다
      ✕ 로그아웃으로 소비 상태가 리셋되면 다음 로그인에서 랜딩 판정이 다시 적용된다
      ✕ 랜딩 설정이 없으면 product 등록을 기다리지 않고 기존 채널 경로로 간다 (1 ms)
