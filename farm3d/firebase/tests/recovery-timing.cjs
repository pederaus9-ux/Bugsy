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
  // Playwright records network resources with snapshots enabled. Screenshots
  // remain off so diagnostics do not introduce a GPU readback at navigation.
  await phone.context.tracing.start({screenshots: false, snapshots: true, sources: true});
  const cdp = await phone.context.newCDPSession(phone.page);
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent', event => {
    if (event.type === 'Document') mark('cdp-document-request', {requestId: event.requestId, timestamp: event.timestamp});
  });
  cdp.on('Network.responseReceived', event => {
    if (event.type === 'Document') mark('cdp-document-response', {requestId: event.requestId, timestamp: event.timestamp, status: event.response.status, timing: event.response.timing});
  });
  await cdp.send('Tracing.start', {categories: 'devtools.timeline,disabled-by-default-devtools.timeline,loading,toplevel,blink', transferMode: 'ReturnAsStream'});
  let chromeTraceStopped = false, lastTick = performance.now(), maxNodeGapMs = 0;
  const heartbeat = setInterval(() => { const now = performance.now(); maxNodeGapMs = Math.max(maxNodeGapMs, now - lastTick); lastTick = now; }, 100);
  async function stopChromeTrace() {
    if (chromeTraceStopped) return;
    chromeTraceStopped = true;
    clearInterval(heartbeat);
    mark('node-event-loop', {maxGapMs: maxNodeGapMs});
    const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
    await cdp.send('Tracing.end');
    const {stream} = await complete;
    const target = path.join(artifacts, 'recovery-browser-timeline.json');
    for (;;) {
      const chunk = await cdp.send('IO.read', {handle: stream});
      fs.appendFileSync(target, chunk.base64Encoded ? Buffer.from(chunk.data, 'base64') : chunk.data);
      if (chunk.eof) break;
    }
    await cdp.send('IO.close', {handle: stream});
  }
  mark('trace-start');
  return {
    mark,
    stopChromeTrace,
    async releaseRenderer() {
      mark('renderer-release-call');
      const result = await phone.page.evaluate(async () => {
        const renderer = window.__dbg.renderer, gl = renderer.getContext();
        if (!gl.getExtension('WEBGL_lose_context')) throw new Error('Recovery fixture cannot release its WebGL context');
        const lost = new Promise(resolve => renderer.domElement.addEventListener('webglcontextlost', resolve, {once: true}));
        const began = performance.now();
        renderer.forceContextLoss();
        await lost;
        return {releaseMs: performance.now() - began, contextLost: gl.isContextLost()};
      });
      mark('renderer-release-return', result);
      if (!result.contextLost) throw new Error('Recovery fixture WebGL context was not released');
    },
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
      await stopChromeTrace();
      mark('trace-stop');
      await phone.context.tracing.stop({path: path.join(artifacts, 'recovery-navigation-trace.zip')});
      await cdp.detach();
      phone.recordRecoveryTiming = null;
    },
  };
}
module.exports = {startRecoveryTiming};
