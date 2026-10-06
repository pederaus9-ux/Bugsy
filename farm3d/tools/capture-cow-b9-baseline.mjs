import {createCow3D, updateCow3D, COW_GAIT} from './farm3d/cow3d.js';
import {execSync} from 'node:child_process';
import {writeFileSync, mkdirSync} from 'node:fs';
import * as T from './farm3d/lib/three.module.min.js';

const sha = execSync('git rev-parse HEAD').toString().trim();

function hashBuffer(attr) {
  let hash = 0;
  if (!attr) return hash;
  for (let i = 0; i < attr.count * attr.itemSize; i++) {
    const val = attr.array[i];
    // Simple hash for float arrays
    const intVal = Math.round(val * 1e5); 
    hash = Math.imul(31, hash) + intVal | 0;
  }
  return hash;
}

const evidence = {
  baseline: "CURRENT-MAIN PRE-B9 BASELINE",
  sha,
  COW_GAIT: {...COW_GAIT},
  runPhaseMapping: {},
  cadence: {
    walk: 0,
    run: 0
  },
  drift: {
    walk: { hz30: 0, hz60: 0, hz120: 0 },
    run: { hz30: 0, hz60: 0, hz120: 0 }
  },
  distancePhaseEquivalence: {
    hz30: 0,
    hz60: 0,
    hz120: 0
  },
  runNeckBehavior: 0,
  staticAnatomyHashes: {}
};

function getBones(r) {
  const bones = r.card.skeleton.bones;
  const parentMap = {};
  const names = [];
  bones.forEach((b, i) => {
    names.push(b.name);
    parentMap[b.name] = b.parent ? b.parent.name : null;
  });
  return { names, parentMap, count: bones.length };
}

function captureDriftAndCadence(speed, duration, hz) {
  const dt = 1/hz;
  const steps = Math.floor(duration / dt);
  const r = createCow3D();
  
  // Warm up
  for (let i = 0; i < hz; i++) updateCow3D(r, speed * dt, 0, dt, 0, 'idle');
  
  let maxDrift = 0;
  let strides = 0;
  let lastPhase = r.state.phase;
  
  const tempPos = new T.Vector3();
  
  for (let i = 0; i < steps; i++) {
    const prevPlanted = r.legs.map(l => l.planted);
    const prevFootPos = r.legs.map(l => {
      r.card.skeleton.update();
      l.foot.updateMatrixWorld(true);
      return l.foot.getWorldPosition(new T.Vector3());
    });
    
    r.g.position.x += speed * dt;
    updateCow3D(r, speed * dt, 0, dt, 0, 'idle');
    r.model.updateMatrixWorld(true);
    r.card.skeleton.update();
    
    // Check phase for cadence
    if (r.state.phase < lastPhase) {
      strides++;
    }
    lastPhase = r.state.phase;
    
    // Measure actual foot drift if it was planted and still is planted
    for (let j = 0; j < r.legs.length; j++) {
      if (prevPlanted[j] && r.legs[j].planted) {
        const l = r.legs[j];
        l.foot.updateMatrixWorld(true);
        const curFootPos = l.foot.getWorldPosition(new T.Vector3());
        
        const dx = curFootPos.x - prevFootPos[j].x;
        const dy = curFootPos.y - prevFootPos[j].y;
        const dz = curFootPos.z - prevFootPos[j].z;
        const drift = Math.hypot(dx, dy, dz);
        
        if (drift > maxDrift) {
          maxDrift = drift;
        }
      }
    }
  }
  
  const distance = r.state.distance;
  const phaseEq = r.state.phase;
  const cadence = strides / duration;
  
  const neckRx = r.neck.rotation.x;
  
  r.dispose();
  return { maxDrift, cadence, distance, phaseEq, neckRx };
}

// 1. Static Anatomy Hashes
const r = createCow3D();
const geo = r.card.geometry;
evidence.staticAnatomyHashes = {
  triangles: geo.attributes.position.count / 3,
  positionHash: hashBuffer(geo.attributes.position),
  normalHash: hashBuffer(geo.attributes.normal),
  colorHash: hashBuffer(geo.attributes.color),
  skinIndexHash: hashBuffer(geo.attributes.skinIndex),
  skinWeightHash: hashBuffer(geo.attributes.skinWeight),
  boneInfo: getBones(r)
};

// Also record runPhaseMapping from pre-B9
evidence.runPhaseMapping = r.legs.map(l => l.phase);

r.dispose();

// 2. Walk measurements (0.8 speed)
for (const hz of [30, 60, 120]) {
  const res = captureDriftAndCadence(0.8, 5.0, hz);
  evidence.drift.walk[`hz${hz}`] = res.maxDrift;
  evidence.cadence.walk = res.cadence; // approximate, should be stable
  evidence.distancePhaseEquivalence[`hz${hz}`] = res.phaseEq;
}

// 3. Run measurements (2.6 speed)
for (const hz of [30, 60, 120]) {
  const res = captureDriftAndCadence(2.6, 5.0, hz);
  evidence.drift.run[`hz${hz}`] = res.maxDrift;
  evidence.cadence.run = res.cadence;
  if (hz === 60) {
    evidence.runNeckBehavior = res.neckRx;
  }
}

// Write performance tests
function measurePerf() {
  const cow = createCow3D();
  const start = performance.now();
  for(let i=0; i<10000; i++) {
    updateCow3D(cow, 0.8 * 1/60, 0, 1/60, 0, 'idle');
  }
  const end = performance.now();
  cow.dispose();
  return end - start;
}
const perf = measurePerf();
evidence.perf10kFrames = perf;

writeFileSync('./pre-b9-baseline.json', JSON.stringify(evidence, null, 2));
console.log("Done generating pre-B9 evidence.");
