import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const NODE_LANES = Object.freeze(['scope', 'gameplay', 'saves', 'pens', 'routing', 'cow-care', 'cow-motion', 'horse', 'chickens', 'pets', 'remaining-care', 'player', 'world', 'performance', 'services', 'visual-contracts']);
const statuses = new Set(['passed', 'failed', 'pending', 'running', 'blocked', 'timed_out', 'interrupted']);
// Numeric entities keep hostile HTML, links, table separators and newlines inert.
export function escapeText(value) {
  const text = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : 'unknown';
  return text.replace(/[&<>"'\\`*_[\]{}()|#!+\-=~.:@\r\n\u0000-\u001f\u007f]/g, c => `&#${c.charCodeAt(0)};`);
}
export function actionsRunUrl(env = {}) {
  if (env.GITHUB_SERVER_URL !== 'https://github.com' || !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(env.GITHUB_REPOSITORY || '') || !/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID || '')) return null;
  return `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
}
function laneStatus(lane, definition, manifest) {
  if (!lane) return 'missing';
  if (!statuses.has(lane.status)) return 'unknown';
  if (lane.status !== 'passed') return lane.status;
  if (!Array.isArray(lane.steps) || !lane.steps.length || lane.steps.some(step => !step || step.status !== 'passed')) return 'incomplete';
  if (definition?.files) {
    const expected = definition.files.flatMap(file => file === 'animal-visual.test.mjs' ? (manifest.visualPatterns || []).map(pattern => ({file, pattern})) : [{file}]);
    if (!expected.length || expected.length !== lane.steps.length || expected.some(step => lane.steps.filter(actual => actual.file === step.file && actual.pattern === step.pattern).length !== 1)) return 'incomplete';
  }
  return 'passed';
}
export function renderScorecard(report, {manifest, env = {}, readError} = {}) {
  const r = report && typeof report === 'object' ? report : {};
  const lanes = Array.isArray(r.lanes) ? r.lanes : [];
  const definitions = Array.isArray(manifest?.lanes) ? manifest.lanes : [];
  const rows = NODE_LANES.map(id => {
    const matching = lanes.filter(lane => lane?.id === id);
    const definition = definitions.find(lane => lane.id === id);
    return {id, title: definition?.title || matching[0]?.title || id, status: matching.length > 1 ? 'duplicate' : laneStatus(matching[0], definition, manifest), lane: matching[0], definition};
  });
  const passed = rows.filter(row => row.status === 'passed').length;
  const failed = rows.filter(row => ['failed', 'timed_out'].includes(row.status)).length;
  const pending = rows.length - passed - failed;
  const identity = r.schemaVersion === 1 && /^[0-9a-f]{40}$/i.test(r.head || '') && typeof r.dirty === 'boolean' && typeof r.node === 'string' && !!r.node && typeof r.platform === 'string' && !!r.platform;
  const complete = identity && passed === NODE_LANES.length && r.status === 'passed' && !!r.finishedAt;
  const lines = ['## Game quality-loop scorecard', '', `**${complete ? 'Recorded Node suite passed' : 'UNQUALIFIED: incomplete, failing, or invalid evidence'}**`, '', `- Runner status: ${escapeText(r.status)}`, `- Exact head: ${escapeText(r.head)}`, `- Dirty working tree: ${escapeText(r.dirty)}`, `- Node: ${escapeText(r.node)}; platform: ${escapeText(r.platform)}`, `- Run: ${escapeText(r.id)}`, `- Node lane counts: ${passed} passed / ${failed} failed or timed out / ${pending} pending or unqualified (16 total).`, ''];
  if (readError) lines.push(`Report unavailable: ${escapeText(readError)}`, '');
  lines.push('| Node lane | Coverage | Status | Step receipts (pass / fail / pending) | Test-process duration |', '| --- | --- | --- | --- | --- |');
  for (const row of rows) {
    const steps = row.lane?.steps;
    const receipts = Array.isArray(steps) ? steps : [];
    const expected = Array.isArray(row.definition?.files) ? row.definition.files.reduce((count, file) => count + (file === 'animal-visual.test.mjs' ? (manifest?.visualPatterns?.length || 0) : 1), 0) : null;
    const passedSteps = receipts.filter(step => step?.status === 'passed').length;
    const failedSteps = receipts.filter(step => ['failed', 'timed_out'].includes(step?.status)).length;
    const pendingSteps = Math.max(expected || 0, receipts.length) - passedSteps - failedSteps;
    const counts = !receipts.length && expected === null ? 'not recorded' : `${passedSteps} / ${failedSteps} / ${pendingSteps} (${receipts.length} recorded${expected === null ? '; expected unknown' : `; ${expected} expected`})`;
    const duration = Array.isArray(steps) && steps.length && steps.every(step => Number.isFinite(step?.durationMs) && step.durationMs >= 0) ? `${(steps.reduce((sum, step) => sum + step.durationMs, 0) / 1000).toFixed(2)} s` : 'not fully recorded';
    lines.push(`| ${escapeText(row.id)} | ${escapeText(row.title)} | ${escapeText(row.status)} | ${counts} | ${duration} |`);
  }
  lines.push('', 'Step counts describe runner command receipts, not individual test assertions. Fail includes timed out; pending includes running, blocked, interrupted, unknown and missing receipts. Duplicate or inconsistent receipts remain unqualified.', '', 'Duration is test-process wall time, not FPS, frame time, or a gameplay performance improvement.', '', '### Baseline comparison');
  const comparison = r.comparison;
  const validComparison = comparison && ['regressions', 'fixes', 'notComparable'].every(key => Array.isArray(comparison[key]) && comparison[key].every(item => typeof item === 'string'));
  if (r.baseline) lines.push(`- Baseline selection: ${escapeText(r.baseline.status)}; head: ${escapeText(r.baseline.head)}; run: ${escapeText(r.baseline.id)}; source Actions run: ${escapeText(r.baseline.sourceRunId)}; artifact ID: ${escapeText(r.baseline.artifactId)}; reason: ${escapeText(r.baseline.reason)}`);
  const unchanged = validComparison && Array.isArray(comparison.unchanged) && comparison.unchanged.every(item => typeof item === 'string') ? comparison.unchanged : null;
  if (!validComparison) lines.push('Comparison unavailable or incomplete; no regression or fix conclusion.');
  else if (comparison.notComparable.length) lines.push(comparison.regressions.length || comparison.fixes.length || unchanged?.length ? 'PARTIAL COMPARISON: some lanes are not comparable.' : 'NO COMPARISON: baseline unavailable, incompatible, or lane evidence incomplete.');
  else if (!unchanged) lines.push('Comparison coverage incomplete: unchanged lane receipts unavailable.');
  else lines.push('Comparison recorded for compatible lane receipts only.');
  lines.push(`- unchanged: ${unchanged ? unchanged.length : 'unavailable'}`);
  for (const key of ['regressions', 'fixes', 'notComparable']) {
    const values = validComparison ? comparison[key] : null;
    lines.push(`- ${key}: ${values ? `${values.length}${values.length ? ' (' + values.map(escapeText).join(', ') + ')' : ' recorded'}` : 'unavailable'}`);
  }
  lines.push('', 'Zero recorded regressions is not a clean-baseline claim when any lanes are notComparable or evidence is incomplete.', '', '### Qualification limits', '- No autonomous fixes, code changes, or merges are performed by this scorecard.', '- Not owner visual acceptance or physical-device qualification.', '- Browser rendering, installed-cache, Firebase emulator and existing required CI gates remain separate.', '- Passing Node contracts does not qualify the whole game or authorize deployment.');
  const browser = lanes.filter(lane => lane?.kind === 'browser');
  lines.push(`- Browser lane receipts: ${browser.length ? browser.map(lane => `${escapeText(lane.id)}: ${escapeText(laneStatus(lane))}`).join('; ') : 'not recorded; unqualified'}.`);
  const link = actionsRunUrl(env);
  if (link) lines.push('', `[This Actions run and its available artifacts](${link}) (artifact upload may still be pending).`);
  return lines.join('\n') + '\n';
}
export function loadLatestReport(root) {
  const realRoot = fs.realpathSync(root);
  const contained = file => {
    const real = fs.realpathSync(file);
    const relative = path.relative(realRoot, real);
    if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw Error('Report path escapes artifact root');
    return real;
  };
  const latest = JSON.parse(fs.readFileSync(contained(path.join(realRoot, 'latest.json')), 'utf8'));
  if (typeof latest?.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(latest.id)) throw Error('Invalid latest run ID');
  const report = JSON.parse(fs.readFileSync(contained(path.join(realRoot, latest.id, 'report.json')), 'utf8'));
  if (report?.id !== latest.id) throw Error('Latest run ID does not match report');
  return report;
}
export function main(args = process.argv.slice(2), env = process.env) {
  let root = path.join(here, 'artifacts/quality-loops');
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--root' || !args[1] || args[1].startsWith('--')) throw Error('Usage: node quality-loop-scorecard.mjs [--root ARTIFACT_ROOT]');
    root = path.resolve(args[1]);
  }
  let report, readError;
  try { report = loadLatestReport(root); } catch (error) { readError = error.message; }
  const manifest = JSON.parse(fs.readFileSync(path.join(here, 'quality-loops.json'), 'utf8'));
  const markdown = renderScorecard(report, {manifest, env, readError});
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, markdown, 'utf8');
  else process.stdout.write(markdown);
  return readError ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
