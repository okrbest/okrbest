// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Locator} from '@playwright/test';
import {expect} from '@playwright/test';

/**
 * System Console Sidebar Header component
 */
export default class SystemConsoleSidebarHeader {
    readonly container: Locator;
    readonly headerInfo: Locator;
    readonly title: Locator;
    readonly userName: Locator;
    readonly menuButton: Locator;
    readonly menu: Locator;

    constructor(container: Locator) {
        this.container = container;
        this.headerInfo = container.getByTestId('admin-sidebar-header-info');
        this.title = container.getByText('System Console');
        this.userName = container.getByText(/^@/);
        this.menuButton = container.getByRole('button', {name: 'Menu Icon'});
        this.menu = container.getByRole('menu');
    }

    async toBeVisible() {
        await expect(this.container).toBeVisible();
        await expect(this.title).toBeVisible();
    }

    /**
     * Opens the sidebar header's menu and returns the menu list.
     */
    async openMenu(): Promise<Locator> {
        await this.menuButton.click();
        await expect(this.menu).toBeVisible();
        return this.menu;
    }
}
