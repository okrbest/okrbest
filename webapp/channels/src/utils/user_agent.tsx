// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export function isInternetExplorer(): boolean {
    return window.navigator.userAgent.indexOf('Trident') !== -1;
}

export function isEdge(): boolean {
    return window.navigator.userAgent.indexOf('Edge') !== -1;
}

// okrbest: upstream(f6341a17)은 use_orientation_handler와 함께 이 함수를 지웠으나,
// 우리는 그 훅을 Lexical 에디터용으로 유지하므로(9fae005295) 함수도 남긴다.
export function isIosWeb(): boolean {
    const userAgent = window.navigator.userAgent;
    const isIosSafari = (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) &&
        userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('CriOS') === -1;
    const isIosChrome = userAgent.indexOf('CriOS') !== -1;

    return isIosSafari || isIosChrome;
}
