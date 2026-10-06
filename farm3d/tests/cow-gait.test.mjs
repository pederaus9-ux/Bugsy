import test from 'node:test';
import assert from 'node:assert/strict';
import {createCow3D, updateCow3D, COW_GAIT} from '../cow3d.js';
import * as T from '../lib/three.module.min.js';

const near = (a, b, t = 1e-6) => assert.ok(Math.abs(a - b) < t, `${a} differs from ${b} by more than ${t}`);

test('B9 Cow Gait Requirements', () => {
  for (const [speed, expectedCadence, duty, driftThreshold] of [[0.8, 0.8/1.09, 0.65, 0.001], [2.6, 2.6/1.35, 0.45, 0.002]]) {
    for (const hz of [30, 60, 120]) {
      const dt = 1/hz;
      const r = createCow3D();
      
      // Warm up
      for (let i = 0; i < hz * 2; i++) updateCow3D(r, speed * dt, 0, dt, 0, 'idle');
      
      let maxDrift = 0;
      let totalTime = 0;
      let startPhase = r.state.phase;
      
      let phaseCrossings = 0;
      let lastPhase = startPhase;
      
      let touchdowns = [];
      let state = r.legs.map(l => l.planted);
      
      for (let i = 0; i < hz * 5; i++) {
        const was = r.legs.map(l => l.planted);
        r.g.updateMatrixWorld(true);
        r.card.skeleton.update();
        const points = r.legs.map(l => l.foot.getWorldPosition(new T.Vector3()));
        
        r.g.position.x += speed * dt;
        updateCow3D(r, speed * dt, 0, dt, 0, 'idle');
        
        r.g.updateMatrixWorld(true);
        r.card.skeleton.update();
        r.legs.forEach((l, j) => {
          const now = l.foot.getWorldPosition(new T.Vector3());
          if (l.planted && was[j] && r.state.amount > 0.999) {
            maxDrift = Math.max(maxDrift, now.distanceTo(points[j]));
          }
          if (l.planted && !was[j]) {
            // Filter out micro-skips (early unplant/replant due to turn rejection threshold)
            const legPhase = (r.state.phase + (speed > 1.1 ? l.phase : l.walkPhase)) % 1;
            if (legPhase < 0.2) {
              touchdowns.push({leg: j, time: totalTime, phase: r.state.phase});
            }
          }
        });
        
        if (r.state.phase < lastPhase) phaseCrossings++;
        lastPhase = r.state.phase;
        totalTime += dt;
      }
      
      const observedCadence = (phaseCrossings + (r.state.phase - startPhase)) / totalTime;
      near(observedCadence, expectedCadence, 0.01);
      assert.ok(maxDrift < driftThreshold, `drift ${maxDrift} < ${driftThreshold} at ${hz}Hz, speed ${speed}`);
      
      if (speed === 0.8) {
        // Walk specific checks
        const order = touchdowns.slice(0, 8).map(t => t.leg).join('');
        assert.ok(order.includes('2031') || order.includes('0312') || order.includes('3120') || order.includes('1203'), 'Lateral sequence walk order is correct: ' + order);
      }
      
      // Teleport rejection check
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
  }
});
