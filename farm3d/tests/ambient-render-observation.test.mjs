import test from 'node:test';
import assert from 'node:assert/strict';
import {observeRenderedMotion, assertRenderedMotion} from './ambient-render-observation.mjs';
function fixture({moveInReduce = false, freezeInFull = false, freezeAfterFirst = false} = {}) {
  let mode = 'full', time = 0, nativeCalls = 0;
  const object = {geometry: {attributes: {position: {array: new Float32Array([1, 2, 3])}}},
    onBeforeRender(...args) {
      assert.equal(this, object); assert.deepEqual(args, ['native argument']); nativeCalls++;
      if ((mode === 'full' && !freezeInFull && (!freezeAfterFirst || nativeCalls === 1)) || (mode === 'reduce' && moveInReduce))
        this.geometry.attributes.position.array[0] += 1;
      return 41;
    }, onAfterRender(...args) {assert.equal(this, object); assert.deepEqual(args, ['native argument']); return 42;}};
  const before = object.onBeforeRender, after = object.onAfterRender;
  const probe = observeRenderedMotion(object, {readMode: () => mode, now: () => time});
  return {object, probe, begin(next) {mode = next; probe.begin(next);}, setTime(t) {time = t;}, draw(t) {
    time = t; assert.equal(object.onBeforeRender('native argument'), 41); assert.equal(object.onAfterRender('native argument'), 42);
  }, restored() {assert.equal(object.onBeforeRender, before); assert.equal(object.onAfterRender, after);}};
}
test('elapsed time without a draw cannot pass pause or resume', () => {
  for (const mode of ['reduce', 'full']) {const f = fixture(); f.begin(mode); f.setTime(10000);
    assert.equal(f.probe.ready(), false); assert.throws(() => assertRenderedMotion(f.probe.snapshot()), /missing rendered/); f.probe.restore(); f.restored();}
});
test('an update callback without a completed draw cannot pass', () => {
  const f = fixture(); f.begin('reduce'); f.setTime(800); f.object.onBeforeRender('native argument');
  assert.equal(f.probe.snapshot().draws, 0); assert.equal(f.probe.ready(), false);
  assert.throws(() => assertRenderedMotion(f.probe.snapshot()), /missing rendered/); f.probe.restore(); f.restored();
});
test('one draw or two draws before 700 ms cannot satisfy observation coverage', () => {
  const f = fixture(); f.begin('reduce'); f.draw(5); f.draw(699);
  assert.equal(f.probe.ready(), false); assert.throws(() => assertRenderedMotion(f.probe.snapshot()), /700 ms/);
  f.draw(700); assert.equal(f.probe.ready(), true); assertRenderedMotion(f.probe.snapshot());
  const g = fixture(); g.begin('full'); g.draw(900);
  assert.equal(g.probe.ready(), false); assert.throws(() => assertRenderedMotion(g.probe.snapshot()), /two completed/);
});
test('actual stable pause and updating resume pass exact geometry checks', () => {
  const f = fixture(); f.begin('reduce'); f.draw(100); f.draw(1100);
  assertRenderedMotion(f.probe.snapshot()); f.begin('full'); f.draw(1500); f.draw(2500);
  assertRenderedMotion(f.probe.snapshot()); f.probe.restore(); f.probe.restore(); f.restored();
});
test('a rendered moving pause is rejected', () => {
  const f = fixture({moveInReduce: true}); f.begin('reduce'); f.draw(100); f.draw(900);
  assert.throws(() => assertRenderedMotion(f.probe.snapshot()), /geometry moved/);
});
test('a frozen resume and a resume that updates only once are rejected', () => {
  for (const opts of [{freezeInFull: true}, {freezeAfterFirst: true}]) {
    const f = fixture(opts); f.begin('full'); f.draw(100); f.draw(900);
    assert.throws(() => assertRenderedMotion(f.probe.snapshot()), /did not update/);
  }
});
test('wrong motion state and invalid geometry remain failures', () => {
  const f = fixture(); f.begin('reduce'); f.object.geometry.attributes.position.array[0] = NaN; f.draw(100); f.draw(900);
  assert.throws(() => assertRenderedMotion(f.probe.snapshot()), /invalid observed geometry/);
  let mode = 'full', time = 0;
  const object = {geometry: {attributes: {position: {array: [1, 2, 3]}}}, onBeforeRender() {}, onAfterRender() {}};
  const probe = observeRenderedMotion(object, {readMode: () => mode, now: () => time}); probe.begin('reduce');
  for (const t of [100, 900]) {time = t; object.onBeforeRender(); object.onAfterRender();}
  assert.throws(() => assertRenderedMotion(probe.snapshot()), /motion mode changed/);
});
test('early movement cannot disappear when later good receipts roll over', () => {
  let time = 0, calls = 0;
  const object = {geometry: {attributes: {position: {array: [1, 2, 3]}}},
    onBeforeRender() {this.geometry.attributes.position.array[0] = ++calls === 1 ? 2 : 1;}, onAfterRender() {}};
  const probe = observeRenderedMotion(object, {readMode: () => 'reduce', now: () => time}); probe.begin('reduce');
  for (let i = 1; i < 140; i++) {time = i * 10; object.onBeforeRender(); object.onAfterRender();}
  const sample = probe.snapshot(); assert.equal(sample.records.length, 128);
  assert.ok(sample.records.every(r => r.before[0] === 1 && r.after[0] === 1));
  assert.throws(() => assertRenderedMotion(sample), /geometry moved/);
});
