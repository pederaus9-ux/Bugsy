const {start} = require('./browser-harness.cjs');
(async () => {
  const h = await start();
  const s = await h.setup({width:960, height:540}, false, 'horse-profile', false);
  await s.page.goto(h.base + 'farm3d/tests/horse-profile.html');
  await s.page.waitForFunction(() => window.__horseReady, null, {timeout:30000});
  await s.page.screenshot({path: require('path').join(require('./browser-harness.cjs').artifacts, 'horse-profile.png')});
  console.log('SHOT', require('./browser-harness.cjs').artifacts + '/horse-profile.png', s.errors);
  await h.close(false);
})().catch(error => { console.error(error); process.exit(1); });
