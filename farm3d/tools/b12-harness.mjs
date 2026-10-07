// Deterministic locomotion-transition harness (B12). Shared by tools/b12-diagnose.mjs and tests/cow-b12-transitions.test.mjs.
// Drives createCow3D/updateCow3D only through the public API and measures per-frame observables.
import * as CUR from '../cow3d.js';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
const {COW_GAIT} = CUR;
export const BASE_SHA = '3fb7eff9f2a9d2da0c4384342fd85e6fd1a448c3';
// Loads the exact pre-B12 cow3d.js from git (base SHA) next to the real one so it resolves the same three.js import.
export async function loadBaseModule() {
  const dir = path.dirname(fileURLToPath(import.meta.url)), tmp = path.join(dir, '..', '.b12-base-cow3d.mjs');
  fs.writeFileSync(tmp, execSync(`git show ${BASE_SHA}:farm3d/cow3d.js`, {maxBuffer: 1 << 26}));
  try { return await import(pathToFileURL(tmp).href + '?base'); } finally { fs.rmSync(tmp, {force: true}); }
}
import * as T from '../lib/three.module.min.js';

export const WALK = 0.8, RUN = 2.6;
export const HZS = [30, 60, 120];
const TAU = Math.PI * 2;
const wrap1 = x => x - Math.round(x);              // wrap to [-.5,.5]
const wrapPi = x => Math.atan2(Math.sin(x), Math.cos(x));

// Segment = {speed, turn (heading rate rad/s), dur (s)}. `pre` runs until the trigger gait phase of the front-left leg.
const S = (speed, turn = 0, dur = 1.5) => ({speed, turn, dur});
export const SCENARIOS = {
  'idle->walk': {pre: S(0), steps: [S(WALK, 0, 2)]},
  'walk->idle': {pre: S(WALK), steps: [S(0, 0, 1.5)]},
  'idle->run': {pre: S(0), steps: [S(RUN, 0, 2.5)]},
  'walk->run': {pre: S(WALK), steps: [S(RUN, 0, 2.5)]},
  'run->walk': {pre: S(RUN), steps: [S(WALK, 0, 2.5)]},
  'run->stop': {pre: S(RUN), steps: [S(0, 0, 2)]},
  'straight->turn': {pre: S(WALK), steps: [S(WALK, 0.4, 2)]},
  'turn->straight': {pre: S(WALK, 0.4), steps: [S(WALK, 0, 2)]},
  'left->right': {pre: S(WALK, 0.4), steps: [S(WALK, -0.4, 2)]},
  'moving->stop->moving': {pre: S(WALK), steps: [S(0, 0, .6), S(WALK, 0, 2)]},
  'repeated start/stop': {pre: S(WALK), steps: [S(0, 0, .4), S(WALK, 0, .8), S(0, 0, .4), S(WALK, 0, .8), S(0, 0, .4), S(WALK, 0, .8)]},
  'repeated walk/run': {pre: S(WALK), steps: [S(RUN, 0, 1.2), S(WALK, 0, 1.2), S(RUN, 0, 1.2), S(WALK, 0, 1.2)]},
  'accelerate while turning': {pre: S(WALK, 0.4), steps: [S(RUN, 0.4, 2.5)]},
  'decelerate while turning': {pre: S(RUN, 0.4), steps: [S(WALK, 0.4, 2.5)]},
  // Steady-state references: no input change, used as the continuity yardstick for each gait at each frame rate.
  'ref:steady walk': {pre: S(WALK), steps: [S(WALK, 0, 3)]},
  'ref:steady run': {pre: S(RUN), steps: [S(RUN, 0, 3)]},
  'ref:steady walk turn': {pre: S(WALK, 0.4), steps: [S(WALK, 0.4, 3)]},
  'ref:steady run turn': {pre: S(RUN, 0.4), steps: [S(RUN, 0.4, 3)]}
};
// Trigger = target phase of the front-left leg in the *source* gait: touchdown, mid-stance, liftoff, mid-swing.
export function triggerPhases(preSpeed) {
  const duty = preSpeed > 1.1 ? COW_GAIT.runStance : COW_GAIT.stance;
  return {touchdown: 0.02, midStance: duty / 2, nearLiftoff: duty - 0.03, midSwing: (1 + duty) / 2};
}

function legPhaseOf(r, l) { return (r.state.phase + (r.state.run > 0.5 ? l.phase : l.walkPhase)) % 1; }

function sole(r, l) {
  const p = new T.Vector3(0, -COW_GAIT.hoof, 0); l.foot.localToWorld(p);
  const yaw = r.model.rotation.y, c = Math.cos(yaw), s = Math.sin(yaw), k = r.model.scale.x;
  const wx = (p.x - r.g.position.x) / k, wz = (p.z - r.g.position.z) / k;
  return {wx: p.x, wy: p.y, wz: p.z, lx: wx * c - wz * s, lz: wx * s + wz * c};
}
const jointQ = m => new T.Quaternion().setFromRotationMatrix(m);
function snapshot(r) {
  r.g.updateMatrixWorld(true); r.card.skeleton.update();
  const s = r.state;
  return {
    speed: s.speed, run: s.run, amount: s.amount, phase: s.phase, turnRatio: s.turnRatio || 0,
    yaw: r.model.rotation.y, bodyYaw: r.body.rotation.y, bodyRoll: r.body.rotation.z, modelY: r.model.position.y,
    legs: r.legs.map(l => {
      const o = sole(r, l), ep = legPhaseOf(r, l);
      return {planted: l.planted, slip: !!l.slip, rt: l.rt, r0: l.r0, ep, ax: l.ax, az: l.az, ...o, hipQ: jointQ(l.hip.matrix), kneeQ: jointQ(l.knee.matrix), rootY: l.hip.matrix.elements[13]};
    })
  };
}
export const finiteSnap = f => [f.speed, f.run, f.amount, f.phase, f.turnRatio, f.yaw, f.bodyYaw, f.bodyRoll, f.modelY,
  ...f.legs.flatMap(l => [l.ep, l.lx, l.lz, l.wy, l.rootY, ...l.hipQ.toArray(), ...l.kneeQ.toArray()])].every(Number.isFinite);

// Run a scenario at hz with the trigger at a given source-leg phase. Returns per-frame records + boundary indices.
export function runScenario(name, hz, triggerPhase, opts = {}) {
  const M = opts.mod || CUR, createCow3D = M.createCow3D, updateCow3D = M.updateCow3D;
  const sc = SCENARIOS[name], dt = 1 / hz, r = createCow3D(), frames = [], boundaries = [];
  let theta = 0, prevLp = null;
  const advance = (seg, tag) => {
    theta += seg.turn * dt;
    const dx = -Math.sin(theta) * seg.speed * dt, dz = -Math.cos(theta) * seg.speed * dt;
    r.g.position.x += dx; r.g.position.z += dz;
    updateCow3D(r, dx, dz, dt, 0, 'idle');
    const f = snapshot(r); f.tag = tag; f.input = seg.speed; frames.push(f); return f;
  };
  // Pre-roll: at least 2 s of source gait (0.8 s idle), then continue until front-left leg crosses the trigger phase.
  const minPre = sc.pre.speed > 0 ? 2 : 0.8; let t = 0, triggered = false;
  while (!triggered && t < 12) {
    const f = advance(sc.pre, 'pre'); t += dt;
    const lp = legPhaseOf(r, r.legs[0]);
    if (t >= minPre) {
      if (sc.pre.speed === 0) triggered = true;
      else if (prevLp !== null && ((lp - triggerPhase + 1) % 1) < ((prevLp - triggerPhase + 1) % 1)) triggered = true;
    }
    prevLp = lp;
  }
  const preFrames = frames.length;
  for (const seg of sc.steps) {
    boundaries.push(frames.length);
    for (let i = 0, n = Math.round(seg.dur * hz); i < n; i++) advance(seg, 'post');
  }
  return {name, hz, dt, triggerPhase, preFrames, boundaries, frames, rig: r};
}

// Per-frame discontinuity series derived from consecutive snapshots.
export function analyse(run) {
  const {frames, dt, hz} = run, k = 1 / dt;
  const out = {n: frames.length};
  const series = {
    hoofLocalStep: [], hoofLocalAccel: [], jointStep: [], jointAccel: [], rootStep: [], yawStep: [], yawAccel: [], bodyYawStep: [], turnRatioStep: [],
    effPhaseJump: [], phaseStepErr: [], stepAmpRate: [], plantedDrift: [], anchorJump: [], earlyRelease: [], flips: [], speedAccel: [], hoofYMax: [], rootYStep: []
  };
  let prevVel = null;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    const vels = b.legs.map((l, j) => [(l.lx - a.legs[j].lx) * k, (l.lz - a.legs[j].lz) * k]);
    series.hoofLocalStep.push(Math.max(...b.legs.map((l, j) => Math.hypot(l.lx - a.legs[j].lx, l.lz - a.legs[j].lz))));
    series.hoofLocalAccel.push(prevVel ? Math.max(...vels.map((v, j) => Math.hypot(v[0] - prevVel[j][0], v[1] - prevVel[j][1]) * k)) : 0);
    prevVel = vels;
    series.jointStep.push(Math.max(...b.legs.map((l, j) => Math.max(l.hipQ.angleTo(a.legs[j].hipQ), l.kneeQ.angleTo(a.legs[j].kneeQ)))));
    series.rootStep.push(Math.max(Math.abs(b.bodyRoll - a.bodyRoll), Math.abs(b.modelY - a.modelY)));
    series.rootYStep.push(Math.max(...b.legs.map((l, j) => Math.abs(l.rootY - a.legs[j].rootY))));
    series.yawStep.push(Math.abs(wrapPi(b.yaw - a.yaw)));
    series.bodyYawStep.push(Math.abs(b.bodyYaw - a.bodyYaw));
    series.turnRatioStep.push(Math.abs(b.turnRatio - a.turnRatio));
    series.speedAccel.push(Math.abs(b.speed - a.speed) * k);
    const dphase = wrap1(b.phase - a.phase);
    series.effPhaseJump.push(Math.max(...b.legs.map((l, j) => Math.abs(wrap1(l.ep - a.legs[j].ep) - dphase))));
    series.phaseStepErr.push(Math.abs(dphase));
    const ampOf = f => (f.run > 0.5 ? COW_GAIT.runStance : COW_GAIT.stance) * (COW_GAIT.stride + (COW_GAIT.runStride - COW_GAIT.stride) * f.run) / 2 * f.amount;
    series.stepAmpRate.push(Math.abs(ampOf(b) - ampOf(a)) * k);
    let drift = 0, aj = 0, er = 0, fl = 0, hy = 0;
    b.legs.forEach((l, j) => {
      const p = a.legs[j];
      if (l.planted && p.planted) { drift = Math.max(drift, Math.hypot(l.wx - p.wx, l.wz - p.wz, l.wy - p.wy)); if (Math.hypot(l.ax - p.ax, l.az - p.az) > 1e-9) aj = Math.max(aj, Math.hypot(l.ax - p.ax, l.az - p.az)); }
      if (p.planted && !l.planted) { fl++; if (l.ep < (b.run > 0.5 ? COW_GAIT.runStance : COW_GAIT.stance) && b.amount > 0.05) er++; }
      if (!p.planted && l.planted) fl++;
      hy = Math.max(hy, l.wy);
    });
    series.plantedDrift.push(drift); series.anchorJump.push(aj); series.earlyRelease.push(er); series.flips.push(fl); series.hoofYMax.push(hy);
  }
  out.series = series; return out;
}
export const peak = (arr, from = 0, to = arr.length) => { let m = 0; for (let i = Math.max(0, from); i < Math.min(arr.length, to); i++) m = Math.max(m, arr[i]); return m; };
export const sum = (arr, from = 0, to = arr.length) => { let m = 0; for (let i = Math.max(0, from); i < Math.min(arr.length, to); i++) m += arr[i]; return m; };

// Summaries over [first boundary, end] (transition window) and over the steady pre segment (after 1 s).
export function summarise(run) {
  const a = analyse(run), s = a.series, hz = run.hz, b0 = run.boundaries[0] - 1;
  const steadyFrom = Math.min(hz, run.preFrames - 1), steadyTo = run.preFrames - 1, post = [b0, s.hoofLocalStep.length];
  const pk = from => Object.fromEntries(Object.keys(s).map(key => [key, peak(s[key], from[0], from[1])]));
  const finite = run.frames.every(finiteSnap);
  // shortest complete planted/unplanted interval (s) per leg after the first boundary (first/last partial runs ignored)
  const shortest = [];
  for (let j = 0; j < 4; j++) { const runs = []; let cur = run.frames[b0].legs[j].planted, len = 0; for (let i = b0 + 1; i < run.frames.length; i++) { const p = run.frames[i].legs[j].planted; if (p === cur) len++; else { runs.push(len + 1); cur = p; len = 0; } } for (const n of runs.slice(1)) shortest.push(n / hz); }
  const maxYawStepRate = peak(s.yawStep, post[0], post[1]) * hz, minPhase = Math.min(...run.frames.map(f => f.phase)), maxPhase = Math.max(...run.frames.map(f => f.phase));
  return {
    hz, trigger: run.triggerPhase, finite, phaseInRange: minPhase >= 0 && maxPhase < 1,
    transitionPeaks: pk(post), steadyPeaks: pk([steadyFrom, steadyTo]),
    earlyReleases: sum(s.earlyRelease, post[0], post[1]), anchorJumps: sum(s.anchorJump.map(x => x > 0 ? 1 : 0), post[0], post[1]),
    flipCount: sum(s.flips, post[0], post[1]), shortestStanceSwingSec: Math.min(...shortest.filter(Number.isFinite), 99),
    maxYawStepRate, finalSpeed: run.frames.at(-1).speed
  };
}
export {TAU};
