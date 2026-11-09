// US1 실주행 — 시나리오 3 팝아웃 창 (quickstart). 스레드를 새 창으로 열고 그 창 안에서 인용한다.
const path = require('path');
const fs = require('fs');

const pwRoot = process.argv[2];
const outDir = process.argv[3];
const {chromium} = require(require.resolve('playwright', {paths: [pwRoot]}));
const BASE = 'http://localhost:8065';
const PASSWORD = 'Qa032-Passw0rd!';

async function login(username) {
    const res = await fetch(`${BASE}/api/v4/users/login`, {method: 'POST', body: JSON.stringify({login_id: username, password: PASSWORD})});
    return {token: res.headers.get('token'), user: await res.json()};
}
async function api(token, method, url, body) {
    const res = await fetch(`${BASE}/api/v4${url}`, {method, headers: {Authorization: `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest'}, body: body ? JSON.stringify(body) : undefined});
    return res.json();
}

(async () => {
    const a = await login('qa032a');
    const b = await login('qa032b');
    const team = await api(b.token, 'GET', '/teams/name/qa032');
    const name = `quote-popout-${Date.now()}`;
    const channel = await api(b.token, 'POST', '/channels', {team_id: team.id, name, display_name: name, type: 'O'});
    await api(b.token, 'POST', `/channels/${channel.id}/members`, {user_id: a.user.id});
    const root = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: '팝아웃에서 인용할 문장입니다'});

    const browser = await chromium.launch();
    const context = await browser.newContext({viewport: {width: 1400, height: 1000}});
    await context.addCookies([
        {name: 'MMAUTHTOKEN', value: a.token, domain: 'localhost', path: '/', httpOnly: true},
        {name: 'MMUSERID', value: a.user.id, domain: 'localhost', path: '/'},
    ]);
    await context.addInitScript(() => window.localStorage.setItem('__landingPageSeen__', 'true'));
    const page = await context.newPage();
    await page.goto(`${BASE}/qa032/channels/${name}`);
    await page.locator(`#postMessageText_${root.id}`).waitFor({timeout: 60000});
    await page.locator(`#post_${root.id}`).hover();
    await page.locator(`#CENTER_commentIcon_${root.id}`).click();
    await page.locator(`#rhsPostMessageText_${root.id}`).waitFor();

    const results = [];
    async function quoteIn(popup, kind, boxSelector) {
        await popup.waitForLoadState();
        const msg = popup.locator(`#rhsPostMessageText_${root.id}, #postMessageText_${root.id}`).first();
        await msg.waitFor({timeout: 60000});
        // 키보드·화면 낭독기 선택처럼 범위를 지정한다(upstream: selectionchange 후 지연을 두고 버튼 표시)
        await msg.evaluate((el) => {
            const node = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
            const range = document.createRange();
            range.setStart(node, 0);
            range.setEnd(node, node.data.length);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        const button = popup.getByRole('button', {name: 'Quote selection'});
        let pass = false;
        let detail = {url: popup.url()};
        try {
            await button.waitFor({timeout: 5000});
            await button.click();
            const box = popup.locator(boxSelector);
            await box.waitFor();
            Object.assign(detail, await box.evaluate((el) => ({blockquotes: el.querySelectorAll('.markdown__quote').length, text: el.innerText})));
            pass = detail.blockquotes === 1 && detail.text.includes('팝아웃에서 인용할 문장입니다');
        } catch (err) {
            detail.error = err.message.split('\n')[0];
        }
        await popup.screenshot({path: path.join(outDir, `s3-popout-${kind}.png`)});
        console.log(`${pass ? 'PASS' : 'FAIL'} S3 ${kind} 팝아웃 창 입력창으로 인용 — ${JSON.stringify(detail)}`);
        results.push({kind, pass, detail});
    }

    const [threadPopup] = await Promise.all([
        context.waitForEvent('page', {timeout: 15000}),
        page.locator('.sidebar--right').getByRole('button', {name: 'Open in new window'}).click(),
    ]);
    await quoteIn(threadPopup, 'thread', '#reply_textbox');

    const [channelPopup] = await Promise.all([
        context.waitForEvent('page', {timeout: 15000}),
        page.locator('.channel-header').getByRole('button', {name: 'Open in new window'}).click(),
    ]);
    await quoteIn(channelPopup, 'channel', '#post_textbox');

    fs.writeFileSync(path.join(outDir, 'us1-popout.json'), JSON.stringify(results, null, 2));
    const pass = results.every((r) => r.pass);
    await browser.close();
    process.exit(pass ? 0 : 1);
})().catch((err) => {
    console.error(err);
    process.exit(2);
});
