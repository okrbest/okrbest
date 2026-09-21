// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Locator, Page} from '@playwright/test';
import {expect} from '@playwright/test';

export default class FlagPostConfirmationDialog {
    readonly page: Page;
    readonly container: Locator;

    readonly cancelButton;
    readonly flagPostReasonInput;
    readonly flagPostCommentInput;
    readonly submitButton;
    readonly postContainer;
    readonly postText;
    readonly flagReasonOption;
    readonly flagReasonMenuItems;
    readonly cannotFlagPostErrorMessage;
    readonly requireCommentsErrorMessage;

    constructor(container: Locator, page: Page) {
        this.container = container;
        this.page = page;

        this.flagPostReasonInput = container.locator('#FlagPostModal__reason');
        this.flagPostCommentInput = container.locator('#FlagPostModal__comment');
        this.cancelButton = container.getByRole('button', {name: 'Cancel'});
        this.submitButton = container.getByRole('button', {name: 'Submit'});
        this.postContainer = container.getByTestId('FlagPostModal__post-preview_container');
        this.postText = container.getByTestId('post-message-text');
        this.flagReasonOption = page.getByRole('listbox');
        this.flagReasonMenuItems = (reason: string) => this.flagReasonOption.getByRole('option', {name: reason});
        this.cannotFlagPostErrorMessage = container.getByTestId('flag-post-request-error-text');
        this.requireCommentsErrorMessage = container.getByTestId('advanced-textbox-error-text');
    }

    async fillFlagComment(comment: string) {
        await this.flagPostCommentInput.fill(comment);
    }

    async selectFlagReason(reason: string) {
        // Open the dropdown
        await this.flagPostReasonInput.click();
        // Wait for dropdown options to appear and click the desired one
        await this.flagReasonOption.waitFor({state: 'visible'});
        await this.flagReasonMenuItems(reason).click();
    }

    async toBeVisible() {
        await expect(this.container).toBeVisible();
        await expect(this.cancelButton).toBeVisible();
        await expect(this.submitButton).toBeVisible();
        await expect(this.postContainer).toBeVisible();
    }

    async toContainPostText(message: string) {
        await expect(this.postText).toBeVisible();
        await expect(this.postText).toHaveText(message);
    }

    async notToBeVisible() {
        await expect(this.container).not.toBeVisible();
        await expect(this.cancelButton).not.toBeVisible();
        await expect(this.submitButton).not.toBeVisible();
    }

    async cannotFlagAlreadyFlaggedPostToBeVisible() {
        await expect(this.cannotFlagPostErrorMessage).toBeVisible();
        await expect(this.cannotFlagPostErrorMessage).toHaveText('Cannot flag this post as it is already flagged.');
    }

    async requireCommentsForFlaggingPost() {
        await expect(this.requireCommentsErrorMessage).toBeVisible();
        await expect(this.requireCommentsErrorMessage).toHaveText(
            'Please add a comment explaining why you’re flagging this message.',
        );
    }

    async cannotFlagPreviouslyRetainedPostToBeVisible() {
        await expect(this.cannotFlagPostErrorMessage).toBeVisible();
        await expect(this.cannotFlagPostErrorMessage).toHaveText(
            'Cannot flag this post as it was retained in a previous flagging request.',
        );
    }
}
