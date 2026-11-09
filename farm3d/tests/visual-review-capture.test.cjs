const test = require('node:test');
const assert = require('node:assert/strict');
const {validateVisualCapture} = require('./visual-review-capture.cjs');
// A real one-pixel PNG is sufficient for the file-envelope contract. Actual
// scene quality is reviewed from full gallery captures, never from this fixture.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==', 'base64');
const metadata = () => ({source: 'a'.repeat(40), viewport: {width: 1, height: 1}, devicePixelRatio: 1, drawingBuffer: {width: 1, height: 1}, quality: 'best', shadows: true, qualityCut: 0, autoQuality: false, contextLost: false, frameBefore: 10, frameAfter: 12, overlays: [], camera: {position: [1, 2, 3], quaternion: [0, 0, 0, 1]}, browserVersion: 'test browser', mode: 'overview', preset: 'noon'});
test('capture rejects reduced-resolution graphics rather than labeling them full-resolution', () => {
  const good = metadata();
  const result = validateVisualCapture(good, png);
  assert.equal(result.captureStatus, 'captured');
  assert.equal(result.visualVerdict, 'pending_review');
  assert.equal(result.image.width, 1);
  assert.match(result.image.sha256, /^[a-f0-9]{64}$/);
  for (const mutate of [m => m.devicePixelRatio = .5, m => m.drawingBuffer.width = 0, m => m.drawingBuffer.width = Infinity, m => m.drawingBuffer.height = 1.5, m => m.viewport.width = 2, m => m.shadows = false, m => m.quality = 'battery', m => m.qualityCut = 1, m => m.autoQuality = true]) {
    const value = metadata(); mutate(value);
    assert.throws(() => validateVisualCapture(value, png));
  }
});
test('capture rejects an unrendered state change, obscuring overlay or lost context', () => {
  for (const mutate of [m => m.frameAfter = m.frameBefore, m => m.frameAfter = NaN, m => m.frameBefore = -1, m => m.frameAfter = 12.5, m => m.overlays.push('Special Event'), m => m.contextLost = true, m => m.camera.position[0] = NaN]) {
    const value = metadata(); mutate(value);
    assert.throws(() => validateVisualCapture(value, png));
  }
});
test('capture requires verifiable source and PNG dimensions, never grants visual acceptance', () => {
  for (const bad of [Buffer.alloc(0), Buffer.from('not a picture'), png.subarray(0, 20)]) assert.throws(() => validateVisualCapture(metadata(), bad));
  for (const source of ['', 'main', '../path']) assert.throws(() => validateVisualCapture({...metadata(), source}, png));
  assert.equal(validateVisualCapture({...metadata(), visualVerdict: 'approved'}, png).visualVerdict, 'pending_review');
});
