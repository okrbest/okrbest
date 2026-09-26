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
    readonly switchTeamsMenuItem: Locator;
    readonly switchTeamsMenu: Locator;
    readonly logOutMenuItem: Locator;

    constructor(container: Locator) {
        this.container = container;
        this.headerInfo = container.getByTestId('admin-sidebar-header-info');
        this.title = container.getByText('System Console');
        this.userName = container.getByText(/^@/);
        this.menuButton = container; // container IS the #admin-sidebar-header button

        // Rendered in a portal at the page level once the menu is open.
        this.menu = container.page().getByRole('menu', {name: 'System Console Menu'});
        this.switchTeamsMenuItem = container.page().getByRole('menuitem', {name: 'Switch teams'});
        this.switchTeamsMenu = container.page().getByRole('menu', {name: 'Switch teams'});
        this.logOutMenuItem = container.page().getByRole('menuitem', {name: 'Log Out'});
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

    /**
     * Opens the header menu and the Switch teams submenu.
     * Returns the submenu paper — that is the scroll container, not the list.
     */
    async openSwitchTeamsMenu(): Promise<Locator> {
        await this.openMenu();
        await this.switchTeamsMenuItem.hover();
        await expect(this.switchTeamsMenu).toBeVisible();
        return this.container.page().locator('.MuiPaper-root:has(#adminConsoleSwitchTeamsMenu)');
    }

    async logOut() {
        await this.openMenu();
        await this.logOutMenuItem.click();
    }
}
