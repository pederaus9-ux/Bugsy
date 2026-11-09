// Opt-in evidence gallery. No runtime/asset edits or automated aesthetic verdict.
// Uses the real immutable source through the existing isolated browser harness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {start, artifacts} = require('./browser-harness.cjs');
const {validateVisualCapture} = require('./visual-review-capture.cjs');
const source = process.env.VISUAL_REVIEW_REF;
assert.match(source || '', /^[a-f0-9]{40}$/, 'Set VISUAL_REVIEW_REF to the exact source commit');
const profiles = [{width: 844, height: 390}, {width: 1280, height: 720}];
const results = {source, node: process.version, status: 'running', visualVerdict: 'pending_review', captures: [], limits: 'Disposable software-rendered Chromium at full CSS resolution and Best graphics. Native runtime/materials remain unchanged. All external endpoints, including Google Fonts, are stubbed by the existing harness, so typography uses fallback fonts. Fixed test camera, popup suppression and the portrait/fullscreen bypass are capture fixtures, not ordinary-play, orientation or physical-device performance qualification.'};
const receiptPath = path.join(artifacts, 'visual-review-results.json');
const save = () => fs.writeFileSync(receiptPath, JSON.stringify(results, null, 2));
async function capture(page, viewport, mode, preset) {
  const frameBefore = await page.evaluate(preset => {
    const d = __dbg;
    d.G.close(); d.setPreset(preset);
    return d.renderer.info.render.frame;
  }, preset);
  await page.waitForFunction(frame => __dbg.renderer.info.render.frame > frame + 3, frameBefore, {timeout: 60000});
  const metadata = await page.evaluate(({source, viewport, frameBefore, mode, preset}) => {
    const d = __dbg, canvas = d.renderer.domElement, gl = d.renderer.getContext();
    const visible = element => element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none' && Number(getComputedStyle(element).opacity) !== 0;
    const overlays = [...document.querySelectorAll('[role="dialog"], .scrim, #loading, #rotate, #authGate')].filter(visible).map(el => el.getAttribute('aria-label') || el.id || el.className);
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return {source, viewport, frameBefore, frameAfter: d.renderer.info.render.frame, mode, preset, devicePixelRatio, drawingBuffer: {width: canvas.width, height: canvas.height}, quality: d.G.PREFS.quality, shadows: d.renderer.shadowMap.enabled, shadowMapSize: d.sun.shadow.mapSize.toArray(), qualityCut: d.QUALITY.cut, autoQuality: d.QUALITY.auto, contextLost: gl.isContextLost(), overlays, camera: {position: d.camera.position.toArray(), quaternion: d.camera.quaternion.toArray(), fov: d.camera.fov}, renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), saveUnchanged: localStorage.getItem(d.G.SAVE_KEY) === null};
  }, {source, viewport, frameBefore, mode, preset});
  assert.equal(metadata.saveUnchanged, true, 'test farm never writes a real farm save');
  const filename = `visual-review-${viewport.width}-${mode}-${preset}.png`;
  const png = await page.screenshot({path: path.join(artifacts, filename), scale: 'css'});
  const receipt = validateVisualCapture(metadata, png);
  results.captures.push({...receipt, filename}); save();
  console.log('CAPTURE', filename, receipt.image.width, receipt.image.height);
}
(async () => {
  let h, failed = true;
  save();
  try {
    h = await start({ref: source, deviceScaleFactor: 1});
    for (const viewport of profiles) {
      const session = await h.setup(viewport, viewport.width < 1000, 'visual-review-session-' + viewport.width);
      const p = session.page;
      results.browserVersion = p.context().browser().version();
      await p.addInitScript(() => localStorage.setItem('sunny-acres-3d-v1-prefs', JSON.stringify({quality: 'best', motion: 'full', bob: true})));
      await p.goto(h.base + 'farm3d/?testfarm&debug&portrait&preset=noon');
      await p.waitForFunction(() => window.__ready && window.__dbg && !document.getElementById('loading'), null, {timeout: 90000});
      await p.evaluate(() => {
        const d = __dbg; d.G.opts.quiet = true; d.G.close(); d.G.S.tut = 99;
        d.G.S.nextEventAt = d.G.S.nextVisitorAt = d.G.S.nextRushAt = 9e15;
        // Use the game's ordinary overview camera. No scene meshes are moved.
        d.cam.yaw = d.view.yaw = 35 * Math.PI / 180;
        d.cam.pitch = d.view.pitch = 32 * Math.PI / 180;
        d.cam.dist = d.view.dist = 40;
        d.cam.target.set(1.5, 2.5, 2); d.view.target.copy(d.cam.target);
      });
      for (const preset of ['noon', 'golden', 'night']) await capture(p, viewport, 'overview', preset);
      await p.locator('#walkBtn').click();
      await p.waitForFunction(() => !!__dbg.walk);
      await p.evaluate(() => {
        const w = __dbg.walk;
        // Existing clear central path; camera fixture only, no crop/animal edits.
        w.pos.set(-1.4, 22); w.vel.set(0, 0); w.yaw = 0; w.pitch = -.1;
      });
      // First-person entry has a production camera tween. Do not capture its
      // intermediate position or leave the temporary instruction over the scene.
      await p.waitForFunction(() => Math.abs(__dbg.camera.position.x - __dbg.walk.pos.x) < .001 && Math.abs(__dbg.camera.position.z - __dbg.walk.pos.y) < .001 && document.getElementById('walkHint').hidden, null, {timeout: 60000});
      for (const preset of ['noon', 'golden', 'rain']) await capture(p, viewport, 'first-person', preset);
      assert.deepEqual(session.errors, [], 'no page, console or local-resource errors');
      await session.finish();
    }
    assert.equal(results.captures.length, 12, 'both viewports, two views and three lighting presets');
    assert.equal(new Set(results.captures.map(c => c.filename)).size, 12, 'unique evidence files');
    results.status = 'captured'; failed = false;
  } catch (error) {
    results.status = 'failed'; results.error = error.stack; throw error;
  } finally {
    results.testSha256 = crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
    results.helperSha256 = crypto.createHash('sha256').update(fs.readFileSync(require.resolve('./visual-review-capture.cjs'))).digest('hex');
    results.harnessSha256 = crypto.createHash('sha256').update(fs.readFileSync(require.resolve('./browser-harness.cjs'))).digest('hex');
    results.finishedAt = new Date().toISOString(); save();
    await h?.close(failed);
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
