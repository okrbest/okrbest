const {chromium} = require(require.resolve('playwright', {paths: [process.argv[2]]}));
(async () => {
  const res = await fetch('http://localhost:8065/api/v4/users/login', {method: 'POST', body: JSON.stringify({login_id: 'qa032a', password: 'Qa032-Passw0rd!'})});
  const token = res.headers.get('token'); const user = await res.json();
  const b = await chromium.launch(); const c = await b.newContext({viewport: {width: 1400, height: 1000}});
  await c.addCookies([{name: 'MMAUTHTOKEN', value: token, domain: 'localhost', path: '/', httpOnly: true}, {name: 'MMUSERID', value: user.id, domain: 'localhost', path: '/'}]);
  await c.addInitScript(() => window.localStorage.setItem('__landingPageSeen__', 'true'));
  const p = await c.newPage();
  await p.goto(`http://localhost:8065/qa032/channels/${process.argv[3]}`);
  const post = p.locator(`#post_${process.argv[4]}`);
  await post.waitFor({timeout: 60000});
  await post.locator('[alt*="red"], [aria-label*="red"]').first().click();
  const modal = p.locator('div[role=dialog].file-preview-modal');
  const img = modal.locator('[data-testid=imagePreview]');
  await img.first().waitFor(); await p.waitForTimeout(1500);
  const size = async () => `${await img.count()} imgs; ${JSON.stringify(await img.first().evaluate((el) => {const r = el.getBoundingClientRect(); const cn = el.parentElement; return [Math.round(r.width), Math.round(r.left), Math.round(r.top), cn.className, cn.scrollLeft, cn.scrollTop, document.activeElement?.tagName + '.' + document.activeElement?.className];}))}`;
  console.log('start', await size());
  await p.keyboard.press('Equal'); await p.waitForTimeout(400); console.log('after Equal', await size());
  await p.keyboard.press('+'); await p.waitForTimeout(400); console.log('after +', await size());
  await p.keyboard.press('0'); await p.waitForTimeout(400); console.log('after 0', await size());
  await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await p.keyboard.press('='); await p.waitForTimeout(400); console.log('after blur + =', await size());
  for (let i = 0; i < 6; i++) { const r = await img.first().boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.wheel(0, -300); await p.waitForTimeout(200); }
  console.log('after 6 wheels', await size());
  const r = await img.first().boundingBox();
  await p.mouse.move(700, 500); await p.mouse.down(); await p.mouse.move(820, 560, {steps: 10}); await p.mouse.up(); await p.waitForTimeout(400);
  console.log('after drag', await size());
  await b.close();
})();
