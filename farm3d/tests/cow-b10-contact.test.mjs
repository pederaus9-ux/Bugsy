import test from 'node:test';
import assert from 'node:assert/strict';
import {createCow3D, updateCow3D, COW_GAIT} from '../cow3d.js';
import * as T from '../lib/three.module.min.js';

test('B10 Hoof Contact and Drift Bounds', () => {
  for (const hz of [30, 60, 120]) {
    const dt = 1/hz;
    const r = createCow3D();
    
    let maxDrift = 0;
    let minPlantedY = Infinity;
    let maxPlantedY = -Infinity;
    let maxSnap = 0;

    // Warm up
    for (let i = 0; i < hz * 2; i++) {
      r.g.position.x += 0.8 * dt;
      updateCow3D(r, 0.8 * dt, 0, dt, 0, 'idle');
    }

    const getHoofBottom = (l) => {
      // The hoof sole is at Y = -0.055 relative to the foot bone
      const local = new T.Vector3(0, -COW_GAIT.hoof, 0);
      l.foot.localToWorld(local);
      return local;
    };

    for (let i = 0; i < hz * 5; i++) {
      const wasPlanted = r.legs.map(l => l.planted);
      r.g.updateMatrixWorld(true);
      r.card.skeleton.update();
      const prevPoints = r.legs.map(l => getHoofBottom(l));

      r.g.position.x += 0.8 * dt;
      updateCow3D(r, 0.8 * dt, 0, dt, 0, 'idle');
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
          if (wasPlanted[j]) {
            const snap = now.distanceTo(prevPoints[j]);
            if (snap > 0.05) maxSnap = Math.max(maxSnap, snap);
          }
        }
      });
    }

    assert.ok(maxDrift < 1e-10, `Drift should be near zero, got ${maxDrift}`);
    assert.ok(Math.abs(minPlantedY) < 1e-10, `No ground penetration, got ${minPlantedY}`);
    assert.ok(Math.abs(maxPlantedY) < 1e-10, `No hovering, got ${maxPlantedY}`);
    assert.ok(maxSnap === 0, `Smooth liftoff required, got snapping of ${maxSnap}`);
  }
});
