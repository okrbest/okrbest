// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Locator} from '@playwright/test';
import {expect} from '@playwright/test';

import {ConfirmModal} from '@/ui/components/system_console/base_modal';

/**
 * System Console -> Plugins -> Plugin Management
 */
export default class PluginManagement {
    readonly container: Locator;

    readonly saveButton: Locator;

    readonly restrictUnauthenticatedWebappPluginsTrue: Locator;
    readonly restrictUnauthenticatedWebappPluginsFalse: Locator;
    readonly restrictUnauthenticatedWebappPluginsHelpText: Locator;

    constructor(container: Locator) {
        this.container = container;

        this.saveButton = container.getByRole('button', {name: 'Save'});

        this.restrictUnauthenticatedWebappPluginsTrue = container.getByTestId(
            'restrictUnauthenticatedWebappPluginstrue',
        );
        this.restrictUnauthenticatedWebappPluginsFalse = container.getByTestId(
            'restrictUnauthenticatedWebappPluginsfalse',
        );
        this.restrictUnauthenticatedWebappPluginsHelpText = container.getByTestId(
            'restrictUnauthenticatedWebappPluginshelp-text',
        );
    }

    async toBeVisible() {
        await expect(this.container.getByText('Plugin Management', {exact: true})).toBeVisible();
    }

    async save() {
        await expect(this.saveButton).toBeEnabled();
        await this.saveButton.click();
        await expect(this.saveButton).toBeDisabled();
    }

    /**
     * Locates an installed plugin's row by its manifest id.
     */
    pluginRow(pluginId: string): Locator {
        return this.container.getByTestId(pluginId);
    }

    async notToHavePlugin(pluginId: string) {
        await expect(this.pluginRow(pluginId)).not.toBeVisible();
    }

    /**
     * Removes the given plugin via its "Remove" control and confirms the "Remove plugin?" dialog.
     * The Enable/Remove controls in this list aren't real buttons or links (no ARIA role, no href),
     * so this uses a scoped text locator rather than getByRole.
     */
    async removePlugin(pluginId: string) {
        const row = this.pluginRow(pluginId);
        await row.getByText('Remove', {exact: true}).click();

        const confirmModal = new ConfirmModal(this.container.page().getByRole('dialog', {name: 'Remove plugin?'}));
        await confirmModal.toBeVisible();
        await confirmModal.confirm();
    }
}
