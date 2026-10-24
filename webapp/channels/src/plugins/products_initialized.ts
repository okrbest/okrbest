// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// 랜딩 판정이 제품(보드·플레이북)일 때, product 등록(initializeProducts +
// initializePlugins)이 끝나기를 기다리는 장벽. root.tsx가 초기화 완료 시점에
// markProductsInitialized를 호출한다.

let resolved = false;
let resolveBarrier: () => void;
const barrier = new Promise<void>((resolve) => {
    resolveBarrier = resolve;
});

export function markProductsInitialized() {
    resolved = true;
    resolveBarrier();
}

// 초기화가 끝나면 true, 상한 시간을 넘기면 false. 호출자는 false여도 저장값을
// 바꾸지 않고 그 판정에 한해 채널로 대체한다.
export function waitForProductsInitialized(timeoutMs: number): Promise<boolean> {
    if (resolved) {
        return Promise.resolve(true);
    }
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), timeoutMs);
        barrier.then(() => {
            clearTimeout(timer);
            resolve(true);
        });
    });
}
