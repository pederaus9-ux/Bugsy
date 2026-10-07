import {SCENARIOS, HZS, triggerPhases, runScenario, summarise, analyse, loadBaseModule, BASE_SHA} from './b12-harness.mjs';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
// Usage: node farm3d/tools/b12-diagnose.mjs <label> <outfile>   e.g. "pre-B12-baseline" b12-pre-diagnosis.json
const label = process.argv[2] || 'unlabelled', outName = process.argv[3] || 'b12-diagnosis.json';
const useBase = process.argv.includes('--base'), mod = useBase ? await loadBaseModule() : undefined;
const sha = execSync('git rev-parse HEAD').toString().trim();
const out = {label, codeUnderTest: useBase ? `pre-B12 baseline: farm3d/cow3d.js from base SHA ${BASE_SHA}` : 'working tree farm3d/cow3d.js', gitHeadWhenMeasured: sha, note: 'Per-frame discontinuity measurements; peaks are over [first input change, end of scenario]; steadyPeaks over the pre-transition steady segment. Accel values are m/s^2 (hoof, model frame) or rad/s (joint step*hz not applied).', scenarios: {}, traces: {}};
for (const [name, sc] of Object.entries(SCENARIOS)) {
  out.scenarios[name] = {};
  const trig = triggerPhases(sc.pre.speed);
  for (const [tn, tp] of Object.entries(sc.pre.speed === 0 ? {idle: 0} : trig)) {
    out.scenarios[name][tn] = {};
    for (const hz of HZS) out.scenarios[name][tn][hz] = summarise(runScenario(name, hz, tp, {mod}));
  }
}
// One full per-frame trace of the known B9 phase-switch case for inspection.
{ const run = runScenario('walk->run', 60, triggerPhases(0.8).midStance, {mod}), a = analyse(run);
  out.traces['walk->run@60Hz midStance'] = {boundaryFrame: run.boundaries[0], frames: run.frames.map((f, i) => ({i, run: +f.run.toFixed(4), phase: +f.phase.toFixed(4), ep0: +f.legs[0].ep.toFixed(4), planted: f.legs.map(l => l.planted ? 1 : 0).join(''), effPhaseJump: i ? +a.series.effPhaseJump[i - 1].toFixed(4) : 0, hoofStep0: i ? +a.series.hoofLocalStep[i - 1].toFixed(5) : 0})).slice(run.boundaries[0] - 5, run.boundaries[0] + 80)}; }
const dir = path.join('farm3d', 'evidence', 'cow-b12'); fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, outName), JSON.stringify(out, null, 1));
console.log('wrote', path.join(dir, outName));
