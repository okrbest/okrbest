// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// 019 레이아웃 토큰 — 치환 지점 실측 매니페스트 (SC-002 무변화 판정).
//
// 실행 형태 (tasks T010, research R5): 측정은 로그인 세션이 필요하므로
// Playwright 세션(MCP 또는 e2e 러너)의 page.evaluate로 아래 collect()를
// 실행한다. 이 파일을 node로 직접 실행하면 브라우저 콘솔/evaluate에 붙여
// 넣을 스니펫을 출력한다 (quickstart 2절의 "래퍼 실행").
//
// 전제: 북마크 RHS 패널 측정 항목은 북마크 탭(#channelHeaderTab-bookmarks)을
// 연 뒤 실행해야 DOM에 존재한다.

export const MANIFEST = [
    {sel: '.channel-header-tabs', props: ['paddingLeft', 'paddingRight', 'gap']},
    {sel: '.channel-header-tabs__tab', props: ['borderTopLeftRadius', 'borderTopRightRadius']},
    {sel: '.channel-header-tabs__badge', props: ['borderTopLeftRadius']},
    {sel: '.channel-member-stack', props: ['gap']},
    {sel: '#SidebarContainer .sidebarHeaderContainer', props: ['gap']},
    {sel: '.sidebarHeaderContainer .ChannelSidebarToggle', props: ['borderTopLeftRadius']},
    {sel: '.team-sidebar .SidebarFooter .userAccountMenu_menuButton .Avatar', props: ['borderTopLeftRadius', 'width', 'height']},
    {sel: '.channel-bookmarks-rhs__body', props: ['paddingTop', 'paddingLeft']},
    {sel: '.channel-bookmarks-rhs__item', props: ['marginBottom']},
    {sel: '.channel-bookmarks-rhs__link', props: ['gap', 'borderTopLeftRadius', 'paddingTop', 'paddingLeft']},
    {sel: '.channel-bookmarks-rhs__actions', props: ['marginTop', 'gap']},
];

export const collectSource = `(manifest) => manifest.map(({sel, props}) => {
    const el = document.querySelector(sel);
    if (!el) {
        return {sel, missing: true};
    }
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const values = {};
    props.forEach((p) => {
        values[p] = cs[p];
    });
    return {sel, values, w: Math.round(rect.width), h: Math.round(rect.height)};
})`;

if (import.meta.url === `file://${process.argv[1]}`) {
    process.stdout.write(`// page.evaluate 스니펫 — MANIFEST와 함께 실행\nconst MANIFEST = ${JSON.stringify(MANIFEST, null, 4)};\nconst collect = ${collectSource};\ncollect(MANIFEST);\n`);
}
