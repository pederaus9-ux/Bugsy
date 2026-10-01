const fs = require('fs');
const http = require('http');
const path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const artifacts = path.resolve(process.env.TEST_ARTIFACTS || path.join(__dirname, 'artifacts'));
fs.mkdirSync(artifacts, {recursive:true});

async function start() {
  const server = http.createServer((req, res) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(400); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROME_PATH,channel:process.env.CHROME_PATH?undefined:'chromium',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  } catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
  const base = `http://127.0.0.1:${server.address().port}/`;
  const sessions = [];
  return {
    base,
    async setup(viewport, touch, name, mobile = touch) {
      // CSS viewports stay exact; smaller drawing buffers keep software GPU CI responsive.
      const context = await browser.newContext({viewport,deviceScaleFactor:.5,hasTouch:touch,isMobile:mobile,serviceWorkers:'block'});
      await context.tracing.start({screenshots:true,snapshots:true,sources:true});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push('pageerror: ' + error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push('HTTP ' + response.status() + ': ' + response.url()); });
      page.on('requestfailed', request => { if (request.url().startsWith(base)) errors.push('request: ' + request.url() + ': ' + request.failure()?.errorText); });
      // Deliberately exercise offline guest fallback; never contact accounts, weather,
      // analytics or feedback endpoints from CI. This is not a cloud integration test.
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith(base)) return route.continue();
        const sdk = url.includes('gstatic.com/firebasejs/');
        return route.fulfill({contentType:sdk?'text/javascript':'application/json',body:sdk?'export {};':'{}'});
      });
      let closed = false;
      const session = {context,page,errors,async finish(failed = false) {
        if (closed) return;
        closed = true;
        try {
          await page.screenshot({path:path.join(artifacts, name + (failed ? '-failure' : '') + '.png'),timeout:15000});
        } catch (error) { console.error('Screenshot unavailable:', error.message); }
        try { await context.tracing.stop(failed ? {path:path.join(artifacts,name+'-failure.zip')} : {}); }
        finally { await context.close(); }
      }};
      sessions.push(session);
      return session;
    },
    async close(failed = false) {
      try { for (const session of sessions) await session.finish(failed); }
      finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
    }
  };
}
module.exports = {start, artifacts, root};
