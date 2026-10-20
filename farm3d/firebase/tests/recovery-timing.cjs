// Test-only diagnostics. Never changes the recovery deadline, import delay or assertions.
const fs = require('node:fs');
const path = require('node:path');
const {performance} = require('node:perf_hooks');

async function startRecoveryTiming(phone, artifacts) {
  const start = performance.now();
  const file = path.join(artifacts, 'recovery-navigation.jsonl');
  const mark = (event, detail = {}) => {
    const row = {event, ms: performance.now() - start, utc: new Date().toISOString(), ...detail};
    fs.appendFileSync(file, JSON.stringify(row) + '\n');
    console.log('RECOVERY TIMING', JSON.stringify(row));
  };
  const urlOf = request => { const u = new URL(request.url()); return u.origin + u.pathname; };
  const relevant = request => request.isNavigationRequest() || /\/cow3d\.js(?:\?|$)/.test(request.url());
  phone.recordRecoveryTiming = mark;
  phone.page.on('request', request => { if (relevant(request)) mark('request', {url: urlOf(request), document: request.isNavigationRequest()}); });
  phone.page.on('requestfinished', request => { if (relevant(request)) mark('request-finished', {url: urlOf(request)}); });
  phone.page.on('requestfailed', request => { if (relevant(request)) mark('request-failed', {url: urlOf(request), failure: request.failure()?.errorText}); });
  phone.page.on('framenavigated', frame => { if (frame === phone.page.mainFrame()) mark('document-commit'); });
  phone.page.on('domcontentloaded', () => mark('dom-content-loaded'));
  phone.page.on('load', () => mark('document-load'));
  await phone.context.tracing.start({screenshots: false, snapshots: false, sources: true});
  mark('trace-start');
  return {
    mark,
    async drainGpu() {
      mark('gpu-drain-call');
      const result = await phone.page.evaluate(() => {
        const gl = window.__dbg.renderer.getContext(), began = performance.now();
        gl.finish(); // Wait for this document's actual GPU commands; do not pause or fake the renderer.
        return {gpuFinishMs: performance.now() - began, contextLost: gl.isContextLost()};
      });
      mark('gpu-drain-return', result);
      if (result.contextLost) throw new Error('Recovery precondition: renderer context is lost');
      return result;
    },
    async finish() {
      mark('trace-stop');
      await phone.context.tracing.stop({path: path.join(artifacts, 'recovery-navigation-trace.zip')});
      phone.recordRecoveryTiming = null;
    },
  };
}
module.exports = {startRecoveryTiming};
