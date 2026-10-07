import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import { createCow3D, updateCow3D, COW_GAIT } from '../cow3d.js';

// Check the rendered skeleton on matched clockwise/counterclockwise paths.
// Coordinates use the game's existing units, not calibrated physical meters.
function measureTurn(hz, direction) {
  const rig = createCow3D();
  const dt = 1 / hz, speed = .8, radius = 2;
  const travel = [0, 0];
  let angle = 0, maxDrift = 0, maxGroundError = 0, samples = 0;
  const sole = leg => leg.foot.localToWorld(new THREE.Vector3(0, -COW_GAIT.hoof, 0));
  try {
    for (let frame = 0; frame < hz * 12; frame++) {
      rig.g.updateMatrixWorld(true);
      const before = rig.legs.map(leg => ({
        point: sole(leg), planted: leg.planted, ax: leg.ax, az: leg.az,
      }));
      const dx = Math.cos(angle + Math.PI / 2) * speed * dt;
      const dz = -Math.sin(angle + Math.PI / 2) * speed * dt;
      angle += direction * speed / radius * dt;
      rig.g.position.x += dx;
      rig.g.position.z += dz;
      updateCow3D(rig, dx, dz, dt, frame * dt, 'moving');
      rig.g.updateMatrixWorld(true);
      for (const [index, leg] of rig.legs.entries()) {
        const point = sole(leg), previous = before[index];
        assert.ok(point.toArray().every(Number.isFinite), 'finite rendered sole');
        if (frame < hz * 2) continue;
        if (leg.planted) {
          maxGroundError = Math.max(maxGroundError, Math.abs(point.y));
          if (previous.planted && previous.ax === leg.ax && previous.az === leg.az) {
            maxDrift = Math.max(maxDrift, point.distanceTo(previous.point));
            samples++;
          }
        } else if (!previous.planted) {
          travel[leg.x < 0 ? 0 : 1] += Math.hypot(point.x - previous.point.x, point.z - previous.point.z);
        }
      }
    }
    return { travel, maxDrift, maxGroundError, samples, turnRatio: rig.state.turnRatio,
      bodyYaw: rig.body.rotation.y };
  } finally {
    rig.dispose();
    rig.dispose();
  }
}

for (const direction of [-1, 1]) {
  test(`B11 ${direction < 0 ? 'clockwise' : 'counterclockwise'} turn preserves contact and differential travel`, () => {
    for (const hz of [30, 60, 120]) {
      const result = measureTurn(hz, direction);
      const outside = result.travel[direction > 0 ? 1 : 0];
      const inside = result.travel[direction > 0 ? 0 : 1];
      assert.ok(result.samples > hz * 5, 'enough continuous planted samples');
      assert.ok(result.maxDrift < 1e-10, `planted drift ${result.maxDrift} at ${hz} Hz`);
      assert.ok(result.maxGroundError < 1e-10, `ground error ${result.maxGroundError} at ${hz} Hz`);
      assert.ok(outside > inside * 1.2, `outside swing travels farther: ${outside / inside} at ${hz} Hz`);
      assert.ok(result.turnRatio * direction > 0, 'turn direction follows the path');
      assert.ok(result.bodyYaw * direction > .01, 'torso follows the turn');
    }
  });
}
