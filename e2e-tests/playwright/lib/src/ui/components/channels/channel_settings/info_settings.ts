// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Locator} from '@playwright/test';
import {expect} from '@playwright/test';

export default class InfoSettings {
    readonly container: Locator;
    readonly nameInput: Locator;
    readonly purposeInput: Locator;
    readonly headerInput: Locator;
    readonly saveChangesPanel: Locator;

    constructor(container: Locator) {
        this.container = container;
        this.nameInput = container.locator('#input_channel-settings-name');
        // okrbest: the channel purpose and header placeholders differ from upstream's ("Enter a
        // purpose for this channel (optional)", "Enter a header description or important links"),
        // so match on the shared prefix instead of the full upstream string.
        this.purposeInput = container.getByPlaceholder(/^Enter a purpose/);
        this.headerInput = container.getByPlaceholder(/^Enter a header/);
        this.saveChangesPanel = container.locator('.SaveChangesPanel');
    }

    async toBeVisible() {
        await expect(this.container).toBeVisible();
    }

    async updateName(name: string) {
        await expect(this.nameInput).toBeVisible();
        await this.nameInput.clear();
        await this.nameInput.fill(name);
    }

    async updateHeader(header: string) {
        await expect(this.headerInput).toBeVisible();
        await this.headerInput.fill(header);
    }

    async updatePurpose(purpose: string) {
        await expect(this.purposeInput).toBeVisible();
        await this.purposeInput.fill(purpose);
    }
}
