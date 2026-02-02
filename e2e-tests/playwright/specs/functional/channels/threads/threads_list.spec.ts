// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {expect, test} from '@mattermost/playwright-lib';

/**
 * @objective Verify that users can navigate through threads list using keyboard arrow keys
 */
test('Should be able to change threads with arrow keys', {tag: '@smoke'}, async ({pw}, testInfo) => {
    test.skip(testInfo.project.name === 'ipad');

    const {team, user} = await pw.initSetup();

    const {channelsPage, page, threadsPage} = await pw.testBrowser.login(user);

    await channelsPage.goto();
    await channelsPage.toBeVisible();

    // # Start some threads, and leave a draft in one of them
    await channelsPage.centerView.postCreate.postMessage('aaa');
    await (await channelsPage.getLastPost()).openAThread();
    await channelsPage.sidebarRight.postMessage('aaa reply');

    await channelsPage.centerView.postCreate.postMessage('bbb');
    await (await channelsPage.getLastPost()).openAThread();
    await channelsPage.sidebarRight.postMessage('bbb reply');
    await channelsPage.sidebarRight.postCreate.writeMessage('bbb second reply');

    await channelsPage.centerView.postCreate.postMessage('ccc');
    await (await channelsPage.getLastPost()).openAThread();
    await channelsPage.sidebarRight.postMessage('ccc reply');

    // * Ensure that there's a draft
    await channelsPage.sidebarLeft.draftsVisible();

    // # Switch to the threads list
    await threadsPage.goto(team.name);
    await threadsPage.toBeVisible();

    // * Ensure no thread starts selected
    await threadsPage.toNotHaveThreadSelected();

    // # Press the down arrow to select a thread
    await page.keyboard.press('ArrowDown');

    // * Ensure the latest thread was selected
    await threadsPage.toHaveThreadSelected();
    await (await threadsPage.getLastPost()).toContainText('ccc reply');

    // # Press the down arrow again
    await page.keyboard.press('ArrowDown');

    // * Ensure the latest thread was selected
    await threadsPage.toHaveThreadSelected();
    await (await threadsPage.getLastPost()).toContainText('bbb reply');

    await threadsPage.threadsList.focus();

    // # Press the down arrow again
    await page.keyboard.press('ArrowDown');

    // * Ensure the latest thread was selected
    await threadsPage.toHaveThreadSelected();
    await (await threadsPage.getLastPost()).toContainText('aaa reply');

    // # Press the up arrow
    await page.keyboard.press('ArrowUp');

    // * Ensure the latest thread was selected
    await threadsPage.toHaveThreadSelected();
    await (await threadsPage.getLastPost()).toContainText('bbb reply');

    // # Press the up arrow
    await page.keyboard.press('ArrowUp');

    // * Ensure the latest thread was selected
    await threadsPage.toHaveThreadSelected();
    await (await threadsPage.getLastPost()).toContainText('ccc reply');
});

/**
 * @objective Verify that navigating the @mention suggestion list in a thread's reply box
 * does not leak arrow key presses to the global thread list and switch the selected thread.
 */
test('Should not switch threads when navigating mention suggestions in the reply box', async ({pw}, testInfo) => {
    test.skip(testInfo.project.name === 'ipad');

    const {team, user} = await pw.initSetup();

    const {channelsPage, page, threadsPage} = await pw.testBrowser.login(user);

    await channelsPage.goto();
    await channelsPage.toBeVisible();

    // # Start two threads
    await channelsPage.centerView.postCreate.postMessage('aaa');
    await (await channelsPage.getLastPost()).openAThread();
    await channelsPage.sidebarRight.postMessage('aaa reply');

    await channelsPage.centerView.postCreate.postMessage('bbb');
    await (await channelsPage.getLastPost()).openAThread();
    await channelsPage.sidebarRight.postMessage('bbb reply');

    // # Switch to the threads list and select the latest thread
    await threadsPage.goto(team.name);
    await threadsPage.toBeVisible();
    await page.keyboard.press('ArrowDown');
    await threadsPage.toHaveThreadSelected();
    await (await threadsPage.getLastPost()).toContainText('bbb reply');

    const replyInput = channelsPage.sidebarRight.postCreate.input;
    const suggestionList = channelsPage.sidebarRight.postCreate.container.locator('.lexical-suggestion-list');

    // # Start a mention that matches no one, so the suggestion list stays mounted but empty
    await replyInput.click();
    await replyInput.pressSequentially('@nonexistentuser999');

    // # Press arrow keys while the (empty/loading) mention suggestion list is active
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // * The selected thread must not have changed
    await (await threadsPage.getLastPost()).toContainText('bbb reply');

    // # Clear the input and open a populated mention suggestion list
    await replyInput.fill('');
    await replyInput.pressSequentially('@');
    await expect(suggestionList).toBeVisible();
    await expect(suggestionList.locator('.suggestion-list__item')).not.toHaveCount(0);

    // # Press arrow keys to navigate the populated suggestion list
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // * The selected thread must still not have changed
    await (await threadsPage.getLastPost()).toContainText('bbb reply');

    // # Press Escape to close the suggestion list
    await page.keyboard.press('Escape');

    // * The suggestion list should close instead of leaking Escape to the thread list
    await expect(suggestionList).toBeHidden();
});
