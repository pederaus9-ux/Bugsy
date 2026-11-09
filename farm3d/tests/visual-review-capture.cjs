const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const positive = n => Number.isSafeInteger(n) && n > 0;
function validateVisualCapture(meta, png) {
  assert.match(meta.source, /^[a-f0-9]{40}$/, 'capture requires an immutable source commit');
  assert.ok(positive(meta.viewport?.width) && positive(meta.viewport?.height), 'valid CSS viewport');
  assert.ok(Number.isFinite(meta.devicePixelRatio) && meta.devicePixelRatio >= 1, 'no sub-CSS-resolution capture');
  assert.ok(positive(meta.drawingBuffer?.width) && positive(meta.drawingBuffer?.height) && meta.drawingBuffer.width >= meta.viewport.width && meta.drawingBuffer.height >= meta.viewport.height, 'drawing buffer covers CSS viewport');
  assert.equal(meta.quality, 'best', 'real Best graphics setting');
  assert.equal(meta.shadows, true, 'production shadows remain enabled');
  assert.equal(meta.qualityCut, 0, 'no automatic quality downgrade');
  assert.equal(meta.autoQuality, false, 'fixed quality during capture');
  assert.equal(meta.contextLost, false, 'WebGL context is available');
  assert.ok(Number.isSafeInteger(meta.frameBefore) && meta.frameBefore >= 0 && Number.isSafeInteger(meta.frameAfter) && meta.frameAfter > meta.frameBefore, 'actual frame advanced after camera/state setup');
  assert.deepEqual(meta.overlays, [], 'no modal/loading/rotation layer obscures the scene');
  assert.ok(Array.isArray(meta.camera?.position) && meta.camera.position.length === 3 && meta.camera.position.every(Number.isFinite), 'finite camera position');
  assert.ok(Array.isArray(meta.camera?.quaternion) && meta.camera.quaternion.length === 4 && meta.camera.quaternion.every(Number.isFinite), 'finite camera orientation');
  assert.ok(Buffer.isBuffer(png) && png.length >= 33, 'PNG envelope exists');
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG signature');
  assert.equal(png.readUInt32BE(8), 13, 'PNG first chunk is an IHDR');
  assert.equal(png.subarray(12, 16).toString(), 'IHDR');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(width, meta.viewport.width, 'PNG retains full CSS width');
  assert.equal(height, meta.viewport.height, 'PNG retains full CSS height');
  return {...meta, captureStatus: 'captured', visualVerdict: 'pending_review', image: {width, height, bytes: png.length, sha256: crypto.createHash('sha256').update(png).digest('hex')}};
}
module.exports = {validateVisualCapture};
