// US2~US4 실주행 (quickstart 시나리오 5·6·7). 실제 서버와 번들을 headless Chromium으로 조작한다.
// 사용: node us234_run.js <e2e-tests/playwright 경로> <결과 디렉터리>
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const pwRoot = process.argv[2];
const outDir = process.argv[3];
const {chromium} = require(require.resolve('playwright', {paths: [pwRoot]}));
const BASE = 'http://localhost:8065';
const PASSWORD = 'Qa032-Passw0rd!';

const results = [];
function record(name, pass, detail) {
    results.push({name, pass, detail});
    console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
}
async function login(username) {
    const res = await fetch(`${BASE}/api/v4/users/login`, {method: 'POST', body: JSON.stringify({login_id: username, password: PASSWORD})});
    return {token: res.headers.get('token'), user: await res.json()};
}
async function api(token, method, url, body) {
    const res = await fetch(`${BASE}/api/v4${url}`, {method, headers: {Authorization: `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest'}, body: body ? JSON.stringify(body) : undefined});
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}
async function upload(token, channelId, name, bytes, type) {
    const form = new FormData();
    form.append('channel_id', channelId);
    form.append('files', new Blob([bytes], {type}), name);
    const res = await fetch(`${BASE}/api/v4/files`, {method: 'POST', headers: {Authorization: `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest'}, body: form});
    return (await res.json()).file_infos[0];
}
function png(width, height, rgb) {
    const crc32 = (buf) => {
        let c;
        let crc = 0xffffffff;
        for (let n = 0; n < buf.length; n++) {
            c = (crc ^ buf[n]) & 0xff;
            for (let k = 0; k < 8; k++) {
                c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            }
            crc = (crc >>> 8) ^ c;
        }
        return (crc ^ 0xffffffff) >>> 0;
    };
    const chunk = (type, data) => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const td = Buffer.concat([Buffer.from(type), data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(td));
        return Buffer.concat([len, td, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(width).fill(rgb).flat())]);
    const raw = Buffer.concat(Array(height).fill(row));
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const MD_BLOCK = '```markdown\n## 배포 체크리스트\n- [ ] DB 백업\n- **릴리스 노트** 공유\n```';
const README = '# OKR.BEST 설치 안내\n\n1. 서버를 준비합니다.\n2. `make run`을 실행합니다.\n\n' + Array.from({length: 40}, (_, i) => `- 항목 ${i + 1}: 아주 긴 설명 문장이 이어집니다 ${'가나다라마바사 '.repeat(8)}`).join('\n');

(async () => {
    const a = await login('qa032a');
    const b = await login('qa032b');
    const team = await api(b.token, 'GET', '/teams/name/qa032');
    const name = `toggle-run-${Date.now()}`;
    const channel = await api(b.token, 'POST', '/channels', {team_id: team.id, name, display_name: name, type: 'O'});
    await api(b.token, 'POST', `/channels/${channel.id}/members`, {user_id: a.user.id});

    const mdPost = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: MD_BLOCK});
    const untaggedPost = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: '```\n## 언어 표시 없는 제목\n본문\n```'});
    const pyPost = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: '```python\n## not markdown\nprint(1)\n```'});
    const md1 = await upload(b.token, channel.id, 'README.md', Buffer.from(README), 'text/markdown');
    const md2 = await upload(b.token, channel.id, 'GUIDE.md', Buffer.from('# 두 번째 문서\n\n본문입니다.'), 'text/markdown');
    const filePost = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: 'md 파일', file_ids: [md1.id]});
    const filePost2 = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: 'md 파일 2', file_ids: [md2.id]});
    const img1 = await upload(b.token, channel.id, 'red.png', png(400, 300, [220, 40, 40]), 'image/png');
    const img2 = await upload(b.token, channel.id, 'blue.png', png(400, 300, [40, 40, 220]), 'image/png');
    const imgPost = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: '이미지 2장', file_ids: [img1.id, img2.id]});

    const browser = await chromium.launch();
    const context = await browser.newContext({viewport: {width: 1400, height: 1000}});
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: BASE});
    await context.addCookies([
        {name: 'MMAUTHTOKEN', value: a.token, domain: 'localhost', path: '/', httpOnly: true},
        {name: 'MMUSERID', value: a.user.id, domain: 'localhost', path: '/'},
    ]);
    await context.addInitScript(() => window.localStorage.setItem('__landingPageSeen__', 'true'));
    const page = await context.newPage();
    const url = `${BASE}/qa032/channels/${name}`;
    await page.goto(url);
    const mdMsg = page.locator(`#postMessageText_${mdPost.id}`);
    await mdMsg.waitFor({timeout: 60000});

    // ---- 시나리오 5: Markdown 코드 블록
    const toggle = mdMsg.getByRole('group', {name: 'Markdown view'});
    record('S5 markdown 블록에 전환 버튼', await toggle.count() === 1);
    const pressed = async (scope) => scope.getByRole('group', {name: 'Markdown view'}).evaluate((g) => Array.from(g.querySelectorAll('button')).map((btn) => `${btn.getAttribute('aria-label')}:${btn.getAttribute('aria-pressed')}`).join(','));
    record('S5 기본은 코드', (await pressed(mdMsg)) === 'Preview:false,Code:true', await pressed(mdMsg));
    await page.screenshot({path: path.join(outDir, 's5-raw.png')});
    await mdMsg.hover();
    await toggle.getByRole('button', {name: 'Preview'}).click();
    await page.waitForTimeout(800);
    const rendered = await mdMsg.evaluate((el) => ({h2: el.querySelectorAll('h2').length, strong: el.querySelectorAll('strong').length, checkbox: el.querySelectorAll('input[type=checkbox]').length}));
    record('S5 미리보기로 렌더링', rendered.h2 === 1 && rendered.strong >= 1, rendered);
    await page.screenshot({path: path.join(outDir, 's5-rendered.png')});
    await mdMsg.hover();
    await mdMsg.getByRole('button', {name: /copy code/i}).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    record('S5 미리보기에서도 복사는 원문', copied === '## 배포 체크리스트\n- [ ] DB 백업\n- **릴리스 노트** 공유', copied);

    // US2 수용 시나리오 7: 미리보기 블록 일부 인용
    const editor = page.locator('#post_textbox');
    await mdMsg.evaluate((el) => {
        const strong = el.querySelector('strong');
        const range = document.createRange();
        range.selectNodeContents(strong);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });
    const quoteBtn = page.getByRole('button', {name: 'Quote selection'});
    let quoteText = '';
    try {
        await quoteBtn.waitFor({timeout: 5000});
        await quoteBtn.click();
        quoteText = await editor.evaluate((el) => el.querySelector('.markdown__quote')?.innerText ?? '');
    } catch (e) {
        quoteText = `error: ${e.message.split('\n')[0]}`;
    }
    record('S5 미리보기 블록 일부 인용', quoteText.includes('릴리스 노트'), quoteText);
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    await page.reload();
    await mdMsg.waitFor({timeout: 60000});
    record('S5 새로고침 후에도 미리보기 유지', (await pressed(mdMsg)) === 'Preview:true,Code:false', await pressed(mdMsg));
    const untagged = page.locator(`#postMessageText_${untaggedPost.id}`);
    record('S5 언어 표시 없는 ## 블록에 전환 버튼', await untagged.getByRole('group', {name: 'Markdown view'}).count() === 1);
    record('S5 같은 선택을 다른 블록도 따름', (await pressed(untagged)) === 'Preview:true,Code:false', await pressed(untagged));
    const py = page.locator(`#postMessageText_${pyPost.id}`);
    record('S5 python 블록에는 전환 버튼 없음', await py.getByRole('group', {name: 'Markdown view'}).count() === 0);

    // ---- 시나리오 6: .md 파일 미리보기
    const openFile = async (post, fileName) => {
        await page.locator(`#post_${post.id}`).scrollIntoViewIfNeeded();
        await page.locator(`#post_${post.id}`).getByText(fileName).first().click();
        await page.locator('div[role=dialog].file-preview-modal').waitFor({timeout: 15000});
    };
    await openFile(filePost, 'README.md');
    const modal = page.locator('div[role=dialog].file-preview-modal');
    await modal.locator('.code-preview, .code-preview--markdown').first().waitFor({timeout: 15000});
    await page.waitForTimeout(800);
    const modalToggle = modal.getByRole('group', {name: 'Markdown view'});
    record('S6 모달 헤더에 전환 버튼', await modalToggle.count() === 1);
    record('S6 기본은 미리보기', (await pressed(modal)) === 'Preview:true,Code:false', await pressed(modal));
    const box1 = await modal.locator('.code-preview').first().boundingBox();
    const renderedHeading = await modal.locator('.code-preview h1').count();
    record('S6 렌더링 결과(h1)', renderedHeading === 1);
    record('S6 언어 레이블 없음', await modal.locator('.post-code__language').count() === 0);
    await page.screenshot({path: path.join(outDir, 's6-rendered.png')});
    await modalToggle.getByRole('button', {name: 'Code'}).click();
    await page.waitForTimeout(800);
    const box2 = await modal.locator('.code-preview').first().boundingBox();
    record('S6 전환해도 상자 크기 같음', Math.abs(box1.width - box2.width) < 1 && Math.abs(box1.height - box2.height) < 1, {box1, box2});
    const wraps = await modal.locator('.code-preview').first().evaluate((el) => el.classList.contains('code-preview--wrap'));
    record('S6 원문은 줄바꿈', wraps);
    record('S6 코드 보기에도 레이블 없음', await modal.locator('.post-code__language').count() === 0);
    await page.screenshot({path: path.join(outDir, 's6-raw.png')});
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    record('S6 파일 하나일 때 화살표 키 후에도 전환 버튼 유지', await modal.getByRole('group', {name: 'Markdown view'}).count() === 1);
    await modal.getByRole('button', {name: 'Close'}).first().click();
    await page.waitForTimeout(800);
    await openFile(filePost2, 'GUIDE.md');
    await modal.locator('.code-preview').first().waitFor({timeout: 15000});
    await page.waitForTimeout(800);
    record('S6 다른 .md도 코드로(선택 기억)', (await pressed(modal)) === 'Preview:false,Code:true', await pressed(modal));
    await modal.getByRole('button', {name: 'Close'}).first().click();
    await page.waitForTimeout(500);
    record('S6 코드 블록 선택과 따로 기억', (await pressed(mdMsg)) === 'Preview:true,Code:false', await pressed(mdMsg));

    // ---- 시나리오 7: 이미지 미리보기 헤더 버튼과 포크 이미지 조작
    const themes = [['light', null], ['dark', 'onyx']];
    for (const [themeName, themeType] of themes) {
        if (themeType) {
            await api(a.token, 'PUT', `/users/${a.user.id}/preferences`, [{user_id: a.user.id, category: 'theme', name: '', value: JSON.stringify({type: 'Onyx', sidebarBg: '#121317', sidebarText: '#ffffff', centerChannelBg: '#191b1f', centerChannelColor: '#e3e4e8', buttonBg: '#4a7ce8', buttonColor: '#ffffff', linkColor: '#4a7ce8', mentionHighlightBg: '#0177e7', mentionHighlightLink: '#ffffff'})}]);
            await page.reload();
            await mdMsg.waitFor({timeout: 60000});
        }
        await page.locator(`#post_${imgPost.id}`).scrollIntoViewIfNeeded();
        await page.locator(`#post_${imgPost.id} [alt*="red"], #post_${imgPost.id} [aria-label*="red"]`).first().click();
        await modal.waitFor({timeout: 15000});
        await page.waitForTimeout(1500);
        const buttons = await modal.locator('.file-preview-modal__icon-button').evaluateAll((els) => els.map((el) => ({tag: el.tagName, label: el.getAttribute('aria-label'), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), download: el.getAttribute('download'), href: Boolean(el.getAttribute('href'))})));
        record(`S7[${themeName}] 헤더·내비 버튼이 36px`, buttons.length >= 4 && buttons.every((btn) => btn.w === 36 && btn.h === 36), buttons);
        const download = buttons.find((btn) => btn.label === 'Download');
        record(`S7[${themeName}] 다운로드는 download 링크(asChild)`, Boolean(download && download.tag === 'A' && download.href && download.download), download);
        const close = modal.getByRole('button', {name: 'Close'}).first();
        await close.hover();
        await page.waitForTimeout(400);
        const hoverBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor);
        record(`S7[${themeName}] 닫기 버튼 hover 배경`, hoverBg !== 'rgba(0, 0, 0, 0)' && hoverBg !== 'transparent', hoverBg);
        await page.screenshot({path: path.join(outDir, `s7-${themeName}-hover.png`)});
        await modal.locator('#previewArrowRight').hover();
        await page.locator('#previewArrowRight').click();
        await page.waitForTimeout(800);
        await modal.locator('#previewArrowLeft').hover();
        await page.waitForTimeout(800);
        const tip = await page.locator('[role=tooltip]').allInnerTexts();
        record(`S7[${themeName}] 이전 화살표 툴팁은 Previous`, tip.some((t) => t.includes('Previous')) && !tip.some((t) => t.trim() === 'Close'), tip);

        // 포크 image_preview: 확대는 img width/height, 이동은 컨테이너 스크롤·위치로 한다
        const img = modal.locator('[data-testid=imagePreview]').first();
        await img.waitFor({timeout: 10000});
        const transformOf = () => img.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const c = el.parentElement;
            return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)},${Math.round(r.top)}|scroll ${c.scrollLeft},${c.scrollTop}`;
        });
        const before = await transformOf();
        await page.keyboard.press('Equal');
        await page.waitForTimeout(400);
        const afterKey = await transformOf();
        record(`S7[${themeName}] 키보드 확대(+) 동작`, before !== afterKey, {before, afterKey});
        const ib = await img.boundingBox();
        await page.mouse.move(ib.x + (ib.width / 2), ib.y + (ib.height / 2));
        await page.mouse.wheel(0, -300);
        await page.waitForTimeout(400);
        const afterWheel = await transformOf();
        record(`S7[${themeName}] 휠 확대 동작`, afterWheel !== afterKey, {afterKey, afterWheel});
        await page.mouse.down();
        await page.mouse.move(ib.x + (ib.width / 2) + 60, ib.y + (ib.height / 2) + 30, {steps: 8});
        await page.mouse.up();
        await page.waitForTimeout(400);
        const afterDrag = await transformOf();
        record(`S7[${themeName}] 확대 후 끌기 이동`, afterDrag !== afterWheel, {afterWheel, afterDrag});
        await page.screenshot({path: path.join(outDir, `s7-${themeName}-zoomed.png`)});
        await close.click();
        await page.waitForTimeout(800);
        record(`S7[${themeName}] 닫기 버튼으로 닫힘`, await modal.count() === 0);

        await page.locator(`#post_${imgPost.id} [alt*="red"], #post_${imgPost.id} [aria-label*="red"]`).first().click();
        await modal.waitFor({timeout: 15000});
        await page.waitForTimeout(1000);
        const vp = page.viewportSize();
        await page.mouse.click(vp.width / 2, vp.height - 15);
        await page.waitForTimeout(800);
        record(`S7[${themeName}] 바깥 클릭으로 닫힘`, await modal.count() === 0);
        if (await modal.count()) {
            await page.keyboard.press('Escape');
        }
    }
    await api(a.token, 'DELETE', `/users/${a.user.id}/preferences/delete`, null);
    await fetch(`${BASE}/api/v4/users/${a.user.id}/preferences/delete`, {method: 'POST', headers: {Authorization: `Bearer ${a.token}`, 'X-Requested-With': 'XMLHttpRequest'}, body: JSON.stringify([{user_id: a.user.id, category: 'theme', name: ''}])});

    // ---- 시나리오 6: 모바일 폭에서는 원문
    const mobile = await context.newPage();
    await mobile.setViewportSize({width: 390, height: 844});
    await mobile.goto(url);
    await mobile.locator(`#post_${filePost.id}`).waitFor({timeout: 60000});
    await mobile.locator(`#post_${filePost.id}`).scrollIntoViewIfNeeded();
    await mobile.locator(`#post_${filePost.id}`).getByText('README.md').first().click();
    const mModal = mobile.locator('div[role=dialog].file-preview-modal');
    await mModal.waitFor({timeout: 15000});
    await mModal.locator('.code-preview').first().waitFor({timeout: 15000});
    await mobile.waitForTimeout(800);
    record('S6 모바일은 전환 버튼 없이 원문', await mModal.getByRole('group', {name: 'Markdown view'}).count() === 0 && await mModal.locator('.code-preview--markdown').count() === 0);
    await mobile.screenshot({path: path.join(outDir, 's6-mobile.png')});

    await browser.close();
    fs.writeFileSync(path.join(outDir, 'us234-results.json'), JSON.stringify(results, null, 2));
    process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((err) => {
    console.error(err);
    fs.writeFileSync(path.join(outDir, 'us234-results.json'), JSON.stringify(results, null, 2));
    process.exit(2);
});
