// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {markProductsInitialized, waitForProductsInitialized} from 'plugins/products_initialized';

describe('plugins/products_initialized', () => {
    test('초기화 표시 전에는 상한 시간까지 기다리다 false로 끝난다', async () => {
        jest.useFakeTimers();
        const wait = waitForProductsInitialized(5000);
        jest.advanceTimersByTime(5001);
        await expect(wait).resolves.toBe(false);
        jest.useRealTimers();
    });

    test('초기화가 표시되면 즉시 true를 돌려준다', async () => {
        markProductsInitialized();
        await expect(waitForProductsInitialized(5000)).resolves.toBe(true);
    });
});
