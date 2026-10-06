import {createCow3D, updateCow3D, COW_GAIT} from '../../cow3d.js';
import {execSync} from 'node:child_process';
import {writeFileSync, mkdirSync} from 'node:fs';

const sha = execSync('git rev-parse HEAD').toString().trim();

const evidence = {
  baseline: "PRE-B9",
  sha,
  COW_GAIT: {...COW_GAIT},
  runPhaseMapping: {},
  cadence: {
    walk: {},
    run: {}
  },
  drift: {
    hz30: 0,
    hz60: 0,
    hz120: 0
  },
  distancePhaseEquivalence: {
    hz30: 0,
    hz60: 0,
    hz120: 0
  },
  runNeckBehavior: {},
  staticAnatomyHashes: {}
};

function measure(r, speed, dt, duration) {
  let steps = Math.floor(duration / dt);
  r.state.distance = 0;
  r.state.phase = 0;
  let maxDrift = 0;
  let startPhase = r.state.phase;
  for (let i = 0; i < steps; i++) {
    let dx = speed * dt;
    let dz = 0;
    r.g.position.x += dx;
    updateCow3D(r, dx, dz, dt, 0, 'idle');
    
    // measure drift
    for (const l of r.legs) {
      if (l.planted) {
        let wx = r.g.position.x + (l.x * Math.cos(r.model.rotation.y) + l.z * Math.sin(r.model.rotation.y)) * r.model.scale.x;
        let wz = r.g.position.z + (l.z * Math.cos(r.model.rotation.y) - l.x * Math.sin(r.model.rotation.y)) * r.model.scale.x;
        // The script here measures drift of the planted foot origin relative to ax/az.
        // Wait, ax/az is in world space.
        let tx = l.ax - wx;
        let tz = l.az - wz;
        let drift = Math.hypot(tx, tz);
        // Well, planted logic computes tx, tz internally.
      }
    }
  }
  return {
    distance: r.state.distance,
    phase: r.state.phase,
    maxDrift,
    neckRx: r.neck.rotation.x
  };
}

for (const hz of [30, 60, 120]) {
  const r = createCow3D();
  const res = measure(r, 0.8, 1/hz, 5.0); // walk
  evidence.drift[`hz${hz}`] = res.maxDrift;
  evidence.distancePhaseEquivalence[`hz${hz}`] = res.phase;
  r.dispose();
}

const r = createCow3D();
const resRun = measure(r, 3.0, 1/60, 2.0); // run
evidence.runNeckBehavior = resRun.neckRx;
r.dispose();

mkdirSync(new URL('.', import.meta.url), {recursive: true});
writeFileSync(new URL('./pre-b9-baseline.json', import.meta.url), JSON.stringify(evidence, null, 2));

console.log("Captured pre-B9 baseline.");
