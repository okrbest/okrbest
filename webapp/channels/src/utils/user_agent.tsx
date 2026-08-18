// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// okrbest: upstream(f6341a17)은 use_orientation_handler와 함께 isIosWeb을 지웠으나,
// 우리는 그 훅을 Lexical 에디터용으로 유지하므로(9fae005295) 함수도 남긴다.
// upstream(bf843017)이 IE·구형 Edge 정리로 이 파일 자체를 삭제했지만, 같은 이유로
// 파일을 남기고 isInternetExplorer·isEdge만 제거한다.
export function isIosWeb(): boolean {
    const userAgent = window.navigator.userAgent;
    const isIosSafari = (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) &&
        userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('CriOS') === -1;
    const isIosChrome = userAgent.indexOf('CriOS') !== -1;

    return isIosSafari || isIosChrome;
}
