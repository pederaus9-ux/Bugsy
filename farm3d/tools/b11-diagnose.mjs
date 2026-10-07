import {createCow3D, updateCow3D, COW_GAIT} from '../cow3d.js';
import * as T from '../lib/three.module.min.js';
import fs from 'fs';
import path from 'path';

function testTurnAtHz(hz) {
  const dt = 1/hz;
  const r = createCow3D();
  
  let leftTravel = 0;
  let rightTravel = 0;
  
  let maxDrift = 0;
  let minPlantedY = Infinity;
  let maxPlantedY = -Infinity;

  const prevHoofPos = [null, null, null, null];
  
  const getHoofBottom = (l) => {
    const local = new T.Vector3(0, -COW_GAIT.hoof, 0);
    l.foot.localToWorld(local);
    return local;
  };

  // Pre-warm
  for (let i = 0; i < hz * 2; i++) {
    r.g.position.x += 0.8 * dt;
    updateCow3D(r, 0.8 * dt, 0, dt, 0, 'idle');
  }

  // Turn in a circle
  let angle = 0;
  const radius = 2.0;
  const speed = 0.8; // m/s
  const angularSpeed = speed / radius;

  for (let i = 0; i < hz * 10; i++) {
    const wasPlanted = r.legs.map(l => l.planted);
    r.g.updateMatrixWorld(true);
    r.card.skeleton.update();
    const prevPoints = r.legs.map(l => getHoofBottom(l));
    
    // Circle path
    const dx = Math.cos(angle + Math.PI/2) * speed * dt;
    const dz = -Math.sin(angle + Math.PI/2) * speed * dt;
    
    r.g.position.x += dx;
    r.g.position.z += dz;
    angle += angularSpeed * dt;

    updateCow3D(r, dx, dz, dt, 0, 'idle');
    r.g.updateMatrixWorld(true);
    r.card.skeleton.update();

    r.legs.forEach((l, j) => {
      const now = getHoofBottom(l);
      
      if (l.planted) {
        if (wasPlanted[j]) {
          const drift = now.distanceTo(prevPoints[j]);
          maxDrift = Math.max(maxDrift, drift);
        }
        minPlantedY = Math.min(minPlantedY, now.y);
        maxPlantedY = Math.max(maxPlantedY, now.y);
      } else {
        if (wasPlanted[j] === false) { // Continuous swing travel
          const travel = Math.hypot(now.x - prevPoints[j].x, now.z - prevPoints[j].z);
          if (l.x < 0) leftTravel += travel;
          else rightTravel += travel;
        }
      }
    });
  }
  
  return {hz, leftTravel, rightTravel, ratioRightToLeft: rightTravel / leftTravel, maxDrift, minPlantedY, maxPlantedY};
}

const results = [];
for (const hz of [30, 60, 120]) {
  results.push(testTurnAtHz(hz));
}

console.log(JSON.stringify(results, null, 2));
const outDir = 'farm3d/evidence';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});
fs.writeFileSync(path.join(outDir, 'b11-diagnosis.json'), JSON.stringify(results, null, 2));
