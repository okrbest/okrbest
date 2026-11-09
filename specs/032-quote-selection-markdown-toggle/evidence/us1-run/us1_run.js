// US1 실주행 (quickstart 시나리오 1~4, 8). 실제 서버(localhost:8065)와 실제 번들을 headless Chromium으로 조작한다.
// 사용: node us1_run.js <e2e-tests/playwright 경로> <결과 디렉터리>
const path = require('path');
const fs = require('fs');

const pwRoot = process.argv[2];
const outDir = process.argv[3];
const {chromium} = require(require.resolve('playwright', {paths: [pwRoot]}));

const BASE = 'http://localhost:8065';
const PASSWORD = 'Qa032-Passw0rd!';
const TEAM = 'qa032';

// upstream webapp/channels/src/utils/quote.ts (caaec8cd) 그대로
function formatQuote(markdown) {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trimEnd());
    while (lines.length && !lines[0]) {
        lines.shift();
    }
    while (lines.length && !lines[lines.length - 1]) {
        lines.pop();
    }
    return lines.map((line) => (line ? `> ${line}` : '>')).join('\n');
}
function appendQuoteToMessage(message, text) {
    const quote = formatQuote(text);
    if (!quote) {
        return message;
    }
    const existing = message.trimEnd();
    if (!existing) {
        return `${quote}\n\n`;
    }
    return `${existing}\n\n${quote}\n\n`;
}

const results = [];
function record(name, pass, detail) {
    results.push({name, pass, detail});
    console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
}

async function api(token, method, url, body) {
    const res = await fetch(`${BASE}/api/v4${url}`, {
        method,
        headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

async function login(username) {
    const res = await fetch(`${BASE}/api/v4/users/login`, {method: 'POST', body: JSON.stringify({login_id: username, password: PASSWORD})});
    return {token: res.headers.get('token'), user: await res.json()};
}

async function lastPost(token, channelId) {
    const posts = await api(token, 'GET', `/channels/${channelId}/posts?per_page=5`);
    return posts.order.map((id) => posts.posts[id]).filter((p) => !p.type)[0];
}

async function selectTextWithMouse(page, message, phrase, untilPhrase) {
    await message.scrollIntoViewIfNeeded();
    const bounds = await message.evaluate((element, {start, end}) => {
        const findCharacter = (text, edge) => {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                const index = node.data.indexOf(text);
                if (index !== -1) {
                    const offset = edge === 'first' ? index : index + text.length - 1;
                    const range = document.createRange();
                    range.setStart(node, offset);
                    range.setEnd(node, offset + 1);
                    return range.getBoundingClientRect();
                }
            }
            return null;
        };
        const first = findCharacter(start, 'first');
        const last = findCharacter(end, 'last');
        if (!first || !last) {
            return null;
        }
        return {start: {x: first.left + 1, y: first.top + (first.height / 2)}, end: {x: last.right - 1, y: last.top + (last.height / 2)}};
    }, {start: phrase, end: untilPhrase ?? phrase});
    if (!bounds) {
        throw new Error(`"${phrase}" not found`);
    }
    const box = await message.boundingBox();
    await message.hover({position: {x: bounds.start.x - box.x, y: bounds.start.y - box.y}});
    await page.mouse.down();
    await page.mouse.move(bounds.end.x, bounds.end.y, {steps: 10});
    await page.mouse.up();
}

async function editorMarkdownShape(editor) {
    return editor.evaluate((el) => ({
        blockquotes: el.querySelectorAll('.markdown__quote').length,
        text: el.innerText,
        lastIsEmptyParagraph: el.lastElementChild?.tagName === 'P' && el.lastElementChild.innerText.trim() === '',
        caretInLast: (() => {
            const sel = window.getSelection();
            return Boolean(sel && sel.anchorNode && el.lastElementChild && el.lastElementChild.contains(sel.anchorNode));
        })(),
    }));
}

async function clearEditor(page, editor) {
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
}

(async () => {
    const a = await login('qa032a');
    const b = await login('qa032b');
    // 실행마다 새 채널: 앞선 실행의 글이 쌓여 원본 메시지가 화면 밖으로 밀리지 않게 한다
    const team = await api(b.token, 'GET', `/teams/name/${TEAM}`);
    const channelName = `quote-run-${Date.now()}`;
    const channel = await api(b.token, 'POST', '/channels', {team_id: team.id, name: channelName, display_name: channelName, type: 'O'});
    await api(b.token, 'POST', `/channels/${channel.id}/members`, {user_id: a.user.id});
    const bPost = await api(b.token, 'POST', '/posts', {
        channel_id: channel.id,
        message: '첫 번째 문단입니다. 배포는 금요일 오후 3시에 진행합니다.\n\n두 번째 문단입니다. @qa032a 님이 롤백 담당이고 **굵게** 표시합니다.\n\n- DB 백업\n- 릴리스 노트 공유\n\n```python\nprint("hi")\n```',
    });
    console.log('channel:', channelName, 'post:', bPost.id);

    const browser = await chromium.launch();
    const context = await browser.newContext({viewport: {width: 1400, height: 1000}});
    await context.addCookies([
        {name: 'MMAUTHTOKEN', value: a.token, domain: 'localhost', path: '/', httpOnly: true},
        {name: 'MMUSERID', value: a.user.id, domain: 'localhost', path: '/'},
    ]);
    await context.addInitScript(() => window.localStorage.setItem('__landingPageSeen__', 'true'));
    const page = await context.newPage();
    page.on('pageerror', (err) => console.log('pageerror:', err.message));

    await page.goto(`${BASE}/${TEAM}/channels/${channelName}`);
    const message = page.locator(`#postMessageText_${bPost.id}`);
    await message.waitFor({timeout: 60000});
    const editor = page.locator('#post_textbox');
    await editor.waitFor();
    await clearEditor(page, editor);

    // ---- 시나리오 1: 한 문단 일부 인용 → 전송
    await selectTextWithMouse(page, message, '두 번째 문단입니다', '표시합니다.');
    const button = page.getByRole('button', {name: 'Quote selection'});
    await button.waitFor({timeout: 5000});
    record('S1 선택하면 인용 버튼이 뜬다', true);
    await page.screenshot({path: path.join(outDir, 's1-button.png')});
    await button.click();
    let shape = await editorMarkdownShape(editor);
    record('S1 입력창에 인용 블록 1개', shape.blockquotes === 1, shape);
    record('S1 커서가 인용 아래 빈 문단', shape.lastIsEmptyParagraph && shape.caretInLast, shape);
    await page.keyboard.type('확인했습니다');
    await page.screenshot({path: path.join(outDir, 's1-editor.png')});
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    let sent = await lastPost(a.token, channel.id);
    let selected = '두 번째 문단입니다. @qa032a 님이 롤백 담당이고 **굵게** 표시합니다.';
    let expected = `${appendQuoteToMessage('', selected)}확인했습니다`;
    record('S1 전송 원문 = upstream 기대값', sent.message === expected, {sent: sent.message, expected});

    // ---- 시나리오 2: 서식 섞인 전체 선택 + 쓰던 글
    await clearEditor(page, editor);
    await page.keyboard.type('쓰던 글');
    await selectTextWithMouse(page, message, '첫 번째 문단', ')');
    await button.click();
    shape = await editorMarkdownShape(editor);
    record('S2 인용 블록 1개(빈 줄에서 안 쪼개짐)', shape.blockquotes === 1, shape);
    await page.screenshot({path: path.join(outDir, 's2-editor.png')});
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    sent = await lastPost(a.token, channel.id);
    selected = '첫 번째 문단입니다. 배포는 금요일 오후 3시에 진행합니다.\n\n두 번째 문단입니다. @qa032a 님이 롤백 담당이고 **굵게** 표시합니다.\n\n-   DB 백업\n-   릴리스 노트 공유\n\n```python\nprint("hi")\n```';
    expected = appendQuoteToMessage('쓰던 글', selected).trimEnd();
    record('S2 전송 원문 = upstream 기대값(끝 공백 제외)', sent.message.trimEnd() === expected, {sent: sent.message, expected});
    const rendered = page.locator(`#postMessageText_${sent.id}`);
    await rendered.waitFor();
    const renderedQuotes = await rendered.locator('blockquote').count();
    record('S2 전송된 메시지에 인용이 하나로 렌더링', renderedQuotes === 1, {renderedQuotes});
    await page.screenshot({path: path.join(outDir, 's2-sent.png')});

    // ---- 시나리오 8-6: 인용 끝에 덧붙인 글자가 이스케이프 없이 나간다
    await clearEditor(page, editor);
    await selectTextWithMouse(page, message, '굵게', '굵게');
    await button.click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('End');
    await page.keyboard.type(' **더**');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    sent = await lastPost(a.token, channel.id);
    record('S8-6 인용 끝 덧붙인 글자 원문 유지', sent.message.trimEnd() === '> **굵게** **더**', {sent: sent.message});

    // ---- 시나리오 8-1: 직접 친 인용의 빈 줄은 ">"
    await clearEditor(page, editor);
    await page.keyboard.type('> 첫 줄');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('둘째 줄');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    sent = await lastPost(a.token, channel.id);
    record('S8-1 직접 친 인용 전송(포크 Shift+Enter는 새 문단)', sent.message === '> 첫 줄\n\n둘째 줄', {sent: sent.message});

    // ---- 시나리오 8-2: 멘션 자동완성
    await clearEditor(page, editor);
    await page.keyboard.type('@qa032');
    await page.waitForTimeout(1500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    await page.keyboard.type('안녕하세요', {delay: 50});
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    sent = await lastPost(a.token, channel.id);
    record('S8-2 멘션 자동완성 후 @username 전송', /^@qa032[ab] ?안녕하세요$/.test(sent.message.trim()), {sent: sent.message});

    // ---- 시나리오 8-3·8-4: Markdown 붙여넣기, 해시태그 링크 붙여넣기
    const paste = async (data) => {
        await editor.evaluate((el, d) => {
            const dt = new DataTransfer();
            Object.entries(d).forEach(([type, value]) => dt.setData(type, value));
            el.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true}));
        }, data);
    };
    await clearEditor(page, editor);
    await paste({'text/plain': '## 제목\n\n- 하나\n- 둘\n\n```js\nconst a = 1;\n```'});
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    sent = await lastPost(a.token, channel.id);
    record('S8-3 Markdown 붙여넣기 전송', sent.message.includes('## 제목') && sent.message.includes('- 하나') && sent.message.includes('```'), {sent: sent.message});
    await clearEditor(page, editor);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: BASE});
    await page.evaluate(async () => {
        await navigator.clipboard.write([new ClipboardItem({
            'text/html': new Blob(['<a class="mention-link" href="#">#release</a>'], {type: 'text/html'}),
            'text/plain': new Blob(['#release'], {type: 'text/plain'}),
        })]);
    });
    await editor.click();
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    sent = await lastPost(a.token, channel.id);
    record('S8-4 해시태그 링크 붙여넣기는 평문', sent.message.trim() === '#release', {sent: sent.message});

    // ---- 시나리오 3: RHS 스레드 답글창
    await clearEditor(page, editor);
    await page.locator(`#post_${bPost.id}`).hover();
    await page.locator(`#CENTER_commentIcon_${bPost.id}`).click();
    const rhsMessage = page.locator(`#rhsPostMessageText_${bPost.id}`);
    await rhsMessage.waitFor({timeout: 10000});
    const replyBox = page.locator('#reply_textbox');
    await replyBox.waitFor();
    await selectTextWithMouse(page, rhsMessage, '릴리스 노트', '공유');
    await button.click();
    const rhsShape = await editorMarkdownShape(replyBox);
    const centerShape = await editorMarkdownShape(editor);
    record('S3 RHS 메시지 인용은 스레드 답글창으로', rhsShape.blockquotes === 1 && centerShape.blockquotes === 0, {rhs: rhsShape.text, center: centerShape.text});
    await page.screenshot({path: path.join(outDir, 's3-rhs.png')});
    await clearEditor(page, replyBox);

    // ---- 시나리오 4: 두 메시지에 걸친 선택 → 버튼 없음
    const other = await api(b.token, 'POST', '/posts', {channel_id: channel.id, message: '두 번째 메시지입니다'});
    await page.locator(`#postMessageText_${other.id}`).waitFor();
    await page.mouse.click(5, 500);
    const bounds = await page.evaluate(({id1, id2}) => {
        const r = (el, end) => {
            const range = document.createRange();
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let node = walker.nextNode();
            if (end) {
                let last = node;
                for (let n = node; n; n = walker.nextNode()) {
                    last = n;
                }
                node = last;
            }
            range.setStart(node, end ? node.data.length - 1 : 0);
            range.setEnd(node, end ? node.data.length : 1);
            return range.getBoundingClientRect();
        };
        const s = r(document.getElementById(`postMessageText_${id1}`), false);
        const e = r(document.getElementById(`postMessageText_${id2}`), true);
        return {sx: s.left + 1, sy: s.top + (s.height / 2), ex: e.right - 1, ey: e.top + (e.height / 2)};
    }, {id1: bPost.id, id2: other.id});
    await page.mouse.move(bounds.sx, bounds.sy);
    await page.mouse.down();
    await page.mouse.move(bounds.ex, bounds.ey, {steps: 10});
    await page.mouse.up();
    await page.waitForTimeout(800);
    record('S4 두 메시지에 걸친 선택은 버튼 없음', (await button.count()) === 0);

    // ---- 시나리오 4: 편집 모드 중 인용 → 편집 입력에 안 들어가고, 편집이 끝나면 채널 입력창에 들어감
    await page.mouse.click(5, 500);
    await clearEditor(page, editor);
    await page.keyboard.type('편집할 내 글');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    const mine = await lastPost(a.token, channel.id);
    await page.locator(`#post_${mine.id}`).hover();
    await page.locator(`#CENTER_button_${mine.id}`).click();
    await page.locator(`#edit_post_${mine.id}`).click();
    const editBox = page.locator('#edit_textbox');
    await editBox.waitFor({timeout: 5000});
    // 편집창이 열리며 스크롤이 바뀌므로 화면 아래쪽의 B 두 번째 메시지를 선택한다
    await selectTextWithMouse(page, page.locator(`#postMessageText_${other.id}`), '두 번째 메시지', '메시지입니다');
    await page.waitForTimeout(800);
    console.log('edit-debug:', JSON.stringify(await page.evaluate(() => {
        const sel = window.getSelection();
        const el = sel?.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel?.anchorNode;
        return {text: sel?.toString(), collapsed: sel?.isCollapsed, anchorIn: el?.closest('[id]')?.id, active: document.activeElement?.id};
    })));
    await page.screenshot({path: path.join(outDir, 's4-edit-select.png')});
    const buttonDuringEdit = await button.count();
    if (buttonDuringEdit) {
        await button.click();
    }
    const editShape = await editorMarkdownShape(editBox);
    record('S4 편집 중 인용은 편집 입력에 안 들어감', editShape.blockquotes === 0, {buttonDuringEdit, edit: editShape.text});
    await editBox.click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    const afterEdit = await editorMarkdownShape(editor);
    record('S4 편집이 끝나면 대기 인용이 채널 입력창에 들어감', afterEdit.blockquotes === 1 && afterEdit.text.includes('두 번째 메시지입니다'), {buttonDuringEdit, center: afterEdit.text});
    await page.screenshot({path: path.join(outDir, 's4-after-edit.png')});
    await clearEditor(page, editor);

    // ---- 시나리오 4: 보관된 채널 → 버튼 없음 (채널 권한 조정은 라이선스 필요로 대신함)
    const ro = await api(a.token, 'GET', `/teams/name/${TEAM}/channels/name/readonly-test`);
    await page.goto(`${BASE}/${TEAM}/channels/readonly-test`);
    const roPostId = fs.readFileSync(path.join(outDir, 'ro_post.txt'), 'utf8').trim();
    const roMessage = page.locator(`#postMessageText_${roPostId}`);
    await roMessage.waitFor({timeout: 30000});
    await selectTextWithMouse(page, roMessage, '읽기 전용', '읽기 전용');
    await page.waitForTimeout(800);
    record('S4 보관된 채널은 버튼 없음', (await button.count()) === 0, {channel: ro.id});

    await browser.close();
    fs.writeFileSync(path.join(outDir, 'us1-results.json'), JSON.stringify(results, null, 2));
    process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((err) => {
    console.error(err);
    fs.writeFileSync(path.join(outDir, 'us1-results.json'), JSON.stringify(results, null, 2));
    process.exit(2);
});
