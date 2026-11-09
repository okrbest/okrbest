// Escape로 .md 미리보기 모달이 닫히는지: 바로 / 전환 버튼 클릭 후 / 클릭 후 마우스를 치운 뒤
const {chromium} = require(require.resolve('playwright', {paths: [process.argv[2]]}));
const BASE = 'http://localhost:8065';
(async () => {
    const res = await fetch(`${BASE}/api/v4/users/login`, {method: 'POST', body: JSON.stringify({login_id: 'qa032a', password: 'Qa032-Passw0rd!'})});
    const token = res.headers.get('token');
    const user = await res.json();
    const channelName = process.argv[3];
    const postId = process.argv[4];
    const browser = await chromium.launch();
    const context = await browser.newContext({viewport: {width: 1400, height: 1000}});
    await context.addCookies([{name: 'MMAUTHTOKEN', value: token, domain: 'localhost', path: '/', httpOnly: true}, {name: 'MMUSERID', value: user.id, domain: 'localhost', path: '/'}]);
    await context.addInitScript(() => window.localStorage.setItem('__landingPageSeen__', 'true'));
    const page = await context.newPage();
    await page.goto(`${BASE}/qa032/channels/${channelName}`);
    const modal = page.locator('div[role=dialog].file-preview-modal');
    const open = async () => {
        await page.locator(`#post_${postId}`).getByText('README.md').first().click();
        await modal.locator('.code-preview').first().waitFor({timeout: 15000});
        await page.waitForTimeout(800);
    };
    const closed = async () => {
        await page.waitForTimeout(800);
        return (await modal.count()) === 0;
    };
    await page.locator(`#post_${postId}`).waitFor({timeout: 60000});

    await open();
    await page.keyboard.press('Escape');
    console.log('A 바로 Escape → 닫힘:', await closed());

    await open();
    await modal.getByRole('group', {name: 'Markdown view'}).getByRole('button', {name: 'Code'}).click();
    await page.waitForTimeout(500);
    console.log('   tooltip 열림:', await page.locator('[role=tooltip]').count());
    await page.keyboard.press('Escape');
    const b1 = await closed();
    console.log('B 전환 클릭 후 Escape 1회 → 닫힘:', b1);
    if (!b1) {
        console.log('   tooltip 남음:', await page.locator('[role=tooltip]').count());
        await page.keyboard.press('Escape');
        console.log('B 두 번째 Escape → 닫힘:', await closed());
    }
    if (await modal.count()) {
        await page.keyboard.press('Escape');
        await closed();
    }

    await open();
    await modal.getByRole('button', {name: 'Get a public link'}).hover().catch(() => {});
    await modal.getByRole('button', {name: 'Close'}).hover();
    await page.waitForTimeout(500);
    console.log('C 닫기 버튼 hover 후 tooltip:', await page.locator('[role=tooltip]').count());
    await page.keyboard.press('Escape');
    console.log('C 다른 헤더 버튼 hover 후 Escape 1회 → 닫힘:', await closed());
    await browser.close();
})();
