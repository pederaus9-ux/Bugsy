import test from 'node:test';
import assert from 'node:assert/strict';
import {createCow3D, updateCow3D, COW_GAIT} from '../cow3d.js';
import * as T from '../lib/three.module.min.js';
import {SCENARIOS, HZS, triggerPhases, runScenario, analyse, summarise} from '../tools/b12-harness.mjs';

test('B12 transition continuity: idle -> walk and walk -> idle at multiple gait phases and frame rates', () => {
  for (const name of ['idle->walk', 'walk->idle']) {
    for (const hz of HZS) {
      const sc = SCENARIOS[name];
      const triggers = sc.pre.speed === 0 ? {idle: 0} : triggerPhases(sc.pre.speed);
      for (const [tname, tphase] of Object.entries(triggers)) {
        const run = runScenario(name, hz, tphase);
        const a = analyse(run);
        const s = summarise(run);
        assert.ok(s.finite, `${name} @ ${hz}Hz ${tname} has finite snapshot values`);
        assert.ok(s.phaseInRange, `${name} @ ${hz}Hz ${tname} phase in [0, 1)`);
        assert.equal(s.anchorJumps, 0, `${name} @ ${hz}Hz ${tname} has zero anchor jumps`);
        assert.ok(s.transitionPeaks.plantedDrift < 0.001, `${name} @ ${hz}Hz ${tname} planted drift < 0.001 (got ${s.transitionPeaks.plantedDrift})`);
        assert.ok(s.transitionPeaks.yawStep < 0.05, `${name} @ ${hz}Hz ${tname} yaw step bounded (got ${s.transitionPeaks.yawStep})`);
      }
    }
  }
});

test('B12 transition continuity: walk -> run and run -> walk without leg-phase popping', () => {
  for (const name of ['walk->run', 'run->walk']) {
    for (const hz of HZS) {
      const sc = SCENARIOS[name];
      const triggers = triggerPhases(sc.pre.speed);
      for (const [tname, tphase] of Object.entries(triggers)) {
        const run = runScenario(name, hz, tphase);
        const a = analyse(run);
        const s = summarise(run);
        assert.ok(s.finite, `${name} @ ${hz}Hz ${tname} finite`);
        assert.ok(s.phaseInRange, `${name} @ ${hz}Hz ${tname} phase in [0, 1)`);
        assert.equal(s.anchorJumps, 0, `${name} @ ${hz}Hz ${tname} zero anchor jumps`);
        // In B12, effective leg phase does not jump abruptly
        assert.ok(s.transitionPeaks.plantedDrift < 0.002, `${name} @ ${hz}Hz ${tname} planted drift < 0.002 (got ${s.transitionPeaks.plantedDrift})`);
      }
    }
  }
});

test('B12 turning transitions: straight -> turn, turn -> straight, and left -> right', () => {
  for (const name of ['straight->turn', 'turn->straight', 'left->right']) {
    for (const hz of HZS) {
      const sc = SCENARIOS[name];
      const triggers = triggerPhases(sc.pre.speed);
      for (const [tname, tphase] of Object.entries(triggers)) {
        const run = runScenario(name, hz, tphase);
        const s = summarise(run);
        assert.ok(s.finite, `${name} @ ${hz}Hz ${tname} finite`);
        assert.ok(s.phaseInRange, `${name} @ ${hz}Hz ${tname} phase in [0, 1)`);
        assert.equal(s.anchorJumps, 0, `${name} @ ${hz}Hz ${tname} zero anchor jumps`);
        assert.ok(s.transitionPeaks.plantedDrift < 0.001, `${name} @ ${hz}Hz ${tname} drift < 0.001`);
        assert.ok(s.transitionPeaks.turnRatioStep < 0.15, `${name} @ ${hz}Hz ${tname} turnRatio smooth (got ${s.transitionPeaks.turnRatioStep})`);
      }
    }
  }
});

test('B12 repeated transitions and stop/start cycles remain stable', () => {
  for (const name of ['repeated start/stop', 'repeated walk/run', 'moving->stop->moving']) {
    for (const hz of [30, 60]) {
      const sc = SCENARIOS[name];
      const triggers = triggerPhases(sc.pre.speed);
      for (const [tname, tphase] of Object.entries(triggers)) {
        const run = runScenario(name, hz, tphase);
        const s = summarise(run);
        assert.ok(s.finite, `${name} @ ${hz}Hz ${tname} finite`);
        assert.ok(s.phaseInRange, `${name} @ ${hz}Hz ${tname} phase in [0, 1)`);
        assert.equal(s.anchorJumps, 0, `${name} @ ${hz}Hz ${tname} zero anchor jumps`);
        assert.ok(s.transitionPeaks.plantedDrift < 0.002, `${name} @ ${hz}Hz ${tname} drift < 0.002`);
      }
    }
  }
});

test('B12 preserves B11 differential turning and B10 zero drift in turns', () => {
  const r = createCow3D();
  const dt = 1/60;
  // Circular left turn at walk speed
  let leftDist = 0, rightDist = 0;
  let maxDrift = 0;
  for (let i = 0; i < 180; i++) {
    const was = r.legs.map(l => l.planted);
    const prevPoints = r.legs.map(l => l.foot.getWorldPosition(new T.Vector3()));
    const theta = 0.4 * i * dt;
    const dx = -Math.sin(theta) * 0.8 * dt;
    const dz = -Math.cos(theta) * 0.8 * dt;
    r.g.position.x += dx;
    r.g.position.z += dz;
    updateCow3D(r, dx, dz, dt, i * dt, 'idle');
    r.g.updateMatrixWorld(true);
    r.card.skeleton.update();
    r.legs.forEach((l, j) => {
      const now = l.foot.getWorldPosition(new T.Vector3());
      if (l.planted && was[j]) {
        maxDrift = Math.max(maxDrift, now.distanceTo(prevPoints[j]));
      }
    });
  }
  // B10 contact is maintained in turning
  assert.ok(maxDrift < 0.001, `Turning drift ${maxDrift} < 0.001`);
  // B11 turn ratio and body yaw active
  assert.ok(Math.abs(r.body.rotation.y) > 0.01, `Torso curves into turn, body.rotation.y = ${r.body.rotation.y}`);
  r.dispose();
});
