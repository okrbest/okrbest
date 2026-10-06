// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import path from 'node:path';

import type {Page} from '@playwright/test';
import type {Client4} from '@mattermost/client';

import {expect} from '@mattermost/playwright-lib';

const assetPath = path.resolve(__dirname, '../../../../asset');

const DEMO_PLUGIN_ID = 'com.mattermost.demo-plugin';
const DEMO_PLUGIN_URL =
    'https://github.com/mattermost/mattermost-plugin-demo/releases/download/v0.11.0/mattermost-plugin-demo-v0.11.0.tar.gz';

// Repeated in all Root Modal tests — avoids duplicating the long trigger string
const ROOT_MODAL_TRIGGER_TEXT = 'You have triggered the root component of the demo plugin.';

/**
 * Asserts the Root Modal is visible with its 3 base lines.
 * Pass elementClicked to also assert the "Element clicked in the menu: X" line.
 * Note: "Element clicked in the menu: " and the item name render in separate <span> elements,
 * so they are asserted individually.
 */
export async function assertRootModal(page: Page, elementClicked?: string): Promise<void> {
    await expect(page.getByText(ROOT_MODAL_TRIGGER_TEXT, {exact: true})).toBeVisible();
    await expect(page.getByText('Click anywhere to close.', {exact: true})).toBeVisible();
    await expect(page.getByText('This is the English String', {exact: true})).toBeVisible();
    if (elementClicked) {
        await expect(page.getByText(/Element clicked in the menu:/)).toBeVisible();
        await expect(page.getByText(elementClicked, {exact: true})).toBeVisible();
    }
}

/**
 * Closes the Root Modal by clicking its trigger text and verifies it is gone.
 */
export async function closeRootModal(page: Page): Promise<void> {
    await page.getByText(ROOT_MODAL_TRIGGER_TEXT).click();
    await expect(page.getByText(ROOT_MODAL_TRIGGER_TEXT)).not.toBeVisible();
}

/**
 * Upload a file via the UI attachment menu when the demo plugin is active.
 * The demo plugin intercepts the attachment button and shows a submenu — this
 * helper clicks "Your computer" from that submenu to reach the native file chooser.
 */
export async function uploadFileViaYourComputer(
    page: Page,
    attachmentButton: {click: () => Promise<void>},
    filename: string,
): Promise<void> {
    const filePath = path.join(assetPath, filename);
    const uploadResponsePromise = page.waitForResponse(
        (r) =>
            r.url().includes('/api/v4/files') &&
            r.request().method() === 'POST' &&
            r.status() >= 200 &&
            r.status() < 300,
        {timeout: 60_000},
    );
    const fileChooserPromise = page.waitForEvent('filechooser');
    await attachmentButton.click();
    await page.getByText('Your computer').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    await uploadResponsePromise;
}

export async function setupDemoPlugin(
    adminClient: Client4,
    pw: {
        installAndEnablePlugin: (client: Client4, pluginUrl: string, pluginId: string) => Promise<void>;
        isPluginActive: (client: Client4, pluginId: string) => Promise<boolean>;
    },
) {
    await adminClient.patchConfig({
        FileSettings: {EnablePublicLink: true},
        ServiceSettings: {EnableGifPicker: true},
        PluginSettings: {
            Plugins: {
                'com.mattermost.demo-plugin': {
                    username: 'demouser',
                    channelname: 'demo',
                    lastname: 'User',
                },
            },
        },
    });

    await pw.installAndEnablePlugin(adminClient, DEMO_PLUGIN_URL, DEMO_PLUGIN_ID);

    await expect
        .poll(async () => {
            return pw.isPluginActive(adminClient, DEMO_PLUGIN_ID);
        })
        .toBe(true);
}
