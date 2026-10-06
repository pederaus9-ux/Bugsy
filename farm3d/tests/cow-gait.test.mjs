import test from 'node:test';
import assert from 'node:assert/strict';
import {createCow3D, updateCow3D} from '../cow3d.js';

test('cow gait tests at 30, 60, 120Hz', () => {
  for (const hz of [30, 60, 120]) {
    const dt = 1/hz;
    const r = createCow3D();
    
    for (let i = 0; i < hz; i++) updateCow3D(r, 0.8 * dt, 0, dt, 0, 'idle');
    
    let events = [];
    let state = r.legs.map(l => l.planted);
    for (let i = 0; i < hz * 2; i++) {
      updateCow3D(r, 0.8 * dt, 0, dt, 0, 'idle');
      r.legs.forEach((l, idx) => {
        if (l.planted && !state[idx]) events.push(idx);
        state[idx] = l.planted;
      });
    }
    
    const str = events.join('');
    assert.ok(str.includes('2031') || str.includes('0312') || str.includes('3120') || str.includes('1203'), 'Lateral sequence walk order is correct at ' + hz + 'Hz. Events: ' + str);
    
    let maxDrift = 0;
    for (let i = 0; i < hz; i++) {
      r.g.position.x += 0.8 * dt;
      updateCow3D(r, 0.8 * dt, 0, dt, 0, 'idle');
      for (const l of r.legs) {
        if (l.planted) {
          let wx = r.g.position.x + (l.x * Math.cos(r.model.rotation.y) + l.z * Math.sin(r.model.rotation.y)) * r.model.scale.x;
          let wz = r.g.position.z + (l.z * Math.cos(r.model.rotation.y) - l.x * Math.sin(r.model.rotation.y)) * r.model.scale.x;
          let drift = Math.hypot(l.ax - wx, l.az - wz);
          if (drift > maxDrift) maxDrift = drift;
        }
      }
    }
    console.log('maxDrift at ' + hz + 'Hz:', maxDrift);
    assert.ok(maxDrift < 0.45, 'drift is controlled at ' + hz + 'Hz');
    
    r.g.position.x += 10;
    updateCow3D(r, 10, 0, dt, 0, 'idle');
    for (const l of r.legs) {
      if (l.planted) {
        let wx = r.g.position.x + (l.x * Math.cos(r.model.rotation.y) + l.z * Math.sin(r.model.rotation.y)) * r.model.scale.x;
        let wz = r.g.position.z + (l.z * Math.cos(r.model.rotation.y) - l.x * Math.sin(r.model.rotation.y)) * r.model.scale.x;
        assert.ok(Math.hypot(l.ax - wx, l.az - wz) < 0.45, 'teleported legs re-plant locally without stretching');
      }
    }
    
    r.dispose();
  }
});
