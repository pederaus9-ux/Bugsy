// Test-only observer: let Three.js invoke the original callbacks, then inspect
// the submitted draw. This module is never imported by the game.
export const MIN_OBSERVATION_MS = 700;
export const MIN_RENDERED_DRAWS = 2;
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const valid = a => a.length > 0 && a.every(Number.isFinite);

export function renderedMotionErrors(sample) {
  const errors = [...sample.violations];
  if (sample.draws < MIN_RENDERED_DRAWS) errors.push('missing rendered observations: need at least two completed draws');
  if (sample.lastDrawAtMs === null || sample.lastDrawAtMs - sample.startedAtMs < MIN_OBSERVATION_MS)
    errors.push('missing rendered observation after the original 700 ms period');
  return errors;
}
export function assertRenderedMotion(sample) {
  const errors = renderedMotionErrors(sample);
  if (errors.length) throw new Error((sample.mode === 'reduce' ? 'new ambient motion stops' : 'ambient motion resumes') + ': ' + errors.join('; '));
  return sample;
}

export function observeRenderedMotion(object, {readMode, now = () => performance.now()} = {}) {
  if (typeof readMode !== 'function') throw new TypeError('readMode is required');
  const originalBefore = object.onBeforeRender, originalAfter = object.onAfterRender;
  const positions = () => Array.from(object.geometry.attributes.position.array);
  let phase = null, sequence = 0, restored = false;
  const pending = [];
  const fail = (p, text) => { if (!p.violations.includes(text)) p.violations.push(text); };

  function before(...args) {
    if (!phase) return Reflect.apply(originalBefore, this, args);
    const p = phase, before = positions(), modeBefore = readMode(), beforeAtMs = now();
    const result = Reflect.apply(originalBefore, this, args);
    pending.push({phase: p, record: {sequence: ++sequence, beforeAtMs, modeBefore,
      modeUpdated: readMode(), before, updated: positions()}});
    return result;
  }
  function after(...args) {
    const result = Reflect.apply(originalAfter, this, args);
    if (!phase) return result;
    const paired = pending.pop(), p = phase;
    if (!paired || paired.phase !== p) {
      fail(p, 'draw callback pair missing or crossed observation phase');
      return result;
    }
    const r = {...paired.record, atMs: now(), modeAfter: readMode(), after: positions()};
    p.draws++; p.lastDrawAtMs = r.atMs;
    if (p.firstDrawAtMs === null) p.firstDrawAtMs = r.atMs;
    if ([r.modeBefore, r.modeUpdated, r.modeAfter].some(mode => mode !== p.mode)) fail(p, 'motion mode changed during observed draw');
    if (![r.before, r.updated, r.after].every(valid)) fail(p, 'invalid observed geometry');
    if (p.mode === 'reduce') {
      if (!same(r.before, p.baseline) || !same(r.updated, p.baseline) || !same(r.after, p.baseline))
        fail(p, 'geometry moved during an actual reduced-motion draw');
    } else {
      if (same(r.before, r.updated)) fail(p, 'native full-motion callback did not update geometry');
      if (same(r.after, p.baseline)) fail(p, 'rendered full-motion geometry stayed at the paused baseline');
    }
    // Keep failures for the entire phase even when detailed receipts roll over.
    if (p.records.length === 128) p.records.shift();
    p.records.push(r);
    return result;
  }
  object.onBeforeRender = before; object.onAfterRender = after;
  return {
    begin(mode) {
      if (restored) throw new Error('observer already restored');
      if (!['reduce', 'full'].includes(mode)) throw new Error('unsupported motion mode');
      if (pending.length) throw new Error('cannot begin inside an unfinished draw');
      const baseline = positions();
      if (!valid(baseline)) throw new Error('invalid baseline geometry');
      phase = {mode, startedAtMs: now(), baseline, draws: 0, firstDrawAtMs: null,
        lastDrawAtMs: null, records: [], violations: []};
    },
    ready() {
      return !!phase && (phase.violations.length > 0 ||
        (phase.draws >= MIN_RENDERED_DRAWS && phase.lastDrawAtMs - phase.startedAtMs >= MIN_OBSERVATION_MS));
    },
    snapshot() {
      if (!phase) throw new Error('observation phase not started');
      return {...phase, baseline: phase.baseline.slice(), records: phase.records.map(r =>
        ({...r, before: r.before.slice(), updated: r.updated.slice(), after: r.after.slice()})), violations: phase.violations.slice()};
    },
    restore() {
      if (restored) return;
      object.onBeforeRender = originalBefore; object.onAfterRender = originalAfter;
      restored = true;
    }
  };
}
