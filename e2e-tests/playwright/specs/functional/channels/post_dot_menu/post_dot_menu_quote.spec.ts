// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {expect, test} from '@mattermost/playwright-lib';

const TAGS = {tag: '@channels'};

const MESSAGE = ['Ullamcorper eu mi, dictumst nec.', '', 'Diam sapien **pellentesque** vestibulum.'].join('\n');
const QUOTE = ['> Ullamcorper eu mi, dictumst nec.', '>', '> Diam sapien **pellentesque** vestibulum.', '', ''].join(
    '\n',
);

/**
 * @objective Verify that Quote in the post menu quotes the whole message into the channel message
 * box, and that the quote and the reply typed below it are posted together.
 */
test('quotes a post into the channel message box from the post menu', TAGS, async ({pw}) => {
    const {user, userClient, team} = await pw.initSetup();
    const townSquare = await userClient.getChannelByName(team.id, 'town-square');
    await userClient.createPost({channel_id: townSquare.id, message: MESSAGE});

    const {channelsPage, page} = await pw.testBrowser.login(user);
    await channelsPage.goto(team.name, 'town-square');
    await channelsPage.toBeVisible();

    // # Open the post menu and click Quote
    const post = await channelsPage.getLastPost();
    await post.hover();
    await post.postMenu.openDotMenu();
    await channelsPage.postDotMenu.quoteMenuItem.click();

    // * Verify the message is quoted with its Markdown, followed by an empty line, and the box is focused
    const {postCreate} = channelsPage.centerView;
    await expect(postCreate.input).toHaveValue(QUOTE);
    await expect(postCreate.input).toBeFocused();

    // # Type a reply below the quote and send it
    await page.keyboard.type('What do you mean?');
    await postCreate.sendMessage();

    // * Verify the posted message contains the quote followed by the reply
    const reply = await channelsPage.getLastPost();
    await expect(reply.body.locator('blockquote')).toContainText('Diam sapien pellentesque vestibulum.');
    await reply.toContainText('What do you mean?');
});

/**
 * @objective Verify that pressing Q while the post menu is open quotes the post.
 */
test('quotes a post with the Q shortcut in the post menu', TAGS, async ({pw}) => {
    const {user, userClient, team} = await pw.initSetup();
    const townSquare = await userClient.getChannelByName(team.id, 'town-square');
    await userClient.createPost({channel_id: townSquare.id, message: MESSAGE});

    const {channelsPage, page} = await pw.testBrowser.login(user);
    await channelsPage.goto(team.name, 'town-square');
    await channelsPage.toBeVisible();

    // # Open the post menu and press Q
    const post = await channelsPage.getLastPost();
    await post.hover();
    await post.postMenu.openDotMenu();
    await channelsPage.postDotMenu.toBeVisible();
    await page.keyboard.press('q');

    // * Verify the menu closed and the message is quoted into the message box
    await expect(channelsPage.postDotMenu.container).toBeHidden();
    await expect(channelsPage.centerView.postCreate.input).toHaveValue(QUOTE);
});

/**
 * @objective Verify that quoting a reply from the post menu in the RHS quotes it into the thread's
 * reply box rather than the channel message box.
 */
test('quotes a reply in the RHS into the thread reply box', TAGS, async ({pw}) => {
    const {user, userClient, team} = await pw.initSetup();
    const townSquare = await userClient.getChannelByName(team.id, 'town-square');
    const root = await userClient.createPost({
        channel_id: townSquare.id,
        message: 'What are we doing for the logging points?',
    });
    await userClient.createPost({channel_id: townSquare.id, root_id: root.id, message: MESSAGE});

    const {channelsPage} = await pw.testBrowser.login(user);
    await channelsPage.goto(team.name, 'town-square');
    await channelsPage.toBeVisible();

    // # Open the thread in the RHS
    const rootPost = await channelsPage.centerView.getPostById(root.id);
    await rootPost.reply();
    await channelsPage.sidebarRight.toBeVisible();

    // # Quote the reply from its post menu
    const replyPost = await channelsPage.sidebarRight.getLastPost();
    await replyPost.hover();
    await replyPost.postMenu.openDotMenu();
    await channelsPage.postDotMenu.quoteMenuItem.click();

    // * Verify the quote went into the thread reply box and not the channel message box
    await expect(channelsPage.sidebarRight.postCreate.input).toHaveValue(QUOTE);
    await expect(channelsPage.centerView.postCreate.input).toHaveValue('');
});
