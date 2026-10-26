const {start} = require('../tests/browser-harness.cjs');
(async () => {
  const h = await start({deviceScaleFactor:.5});
  let s;
  try {
    s = await h.setup({width:1280,height:720},false,'safe-preview-smoke');
    const {page} = s;
    const foreign = [];
    page.on('request', req => {
      if (!req.url().startsWith(h.base)) foreign.push(req.url());
    });
    await page.goto(h.base + 'safe-test-preview/index.html', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.__ready === true, {timeout:30000});
    const before = await page.evaluate(() => ({
      farm: !!localStorage.getItem('sunny-acres-3d-v1'),
      owner: localStorage.getItem('sa3d-save-owner'),
      account: !!window.saAuth?.user,
      authGate: document.getElementById('authGate').hidden,
      csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
    }));
    console.log('boot', JSON.stringify({before,foreign,errors:s.errors}));
    await page.waitForTimeout(700);
    const close = page.locator('#panelRoot .xbtn');
    for (let i=0;i<3 && await close.isVisible();i++) await close.click();
    await page.locator('#editBtn').click();
    await page.locator('#animalPensBtn').click();
    const editor = await page.evaluate(() => !!document.querySelector('[data-pen-editor-host]'));
    console.log(JSON.stringify({before,editor,foreign,errors:s.errors}));
    if (!before.farm || before.owner || before.account || !before.authGate || !before.csp || !editor || s.errors.some(e=>e.includes('pageerror')) || foreign.some(u=>/firebase|firestore|discord|cloudfunctions/.test(u))) process.exitCode = 1;
  } finally { await h.close(process.exitCode !== 0); }
})().catch(e=>{console.error(e);process.exitCode=1});
