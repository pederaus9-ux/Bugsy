import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {NODE_LANES, renderScorecard, escapeText, actionsRunUrl, loadLatestReport, main} from './quality-loop-scorecard.mjs';

function report() {
  return {schemaVersion: 1, id: 'synthetic-run', status: 'passed', head: 'a'.repeat(40), dirty: false, node: 'v22.0.0', platform: 'linux', finishedAt: '2026-11-08T00:00:00Z', lanes: NODE_LANES.map(id => ({id, kind: 'node', status: 'passed', steps: [{file: 'fixture.test.mjs', status: 'passed', durationMs: 1200}]})), comparison: {regressions: [], fixes: [], notComparable: ['No baseline selected']}};
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-scorecard-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  return root;
}
test('all 16 Node lanes, exact environment and qualification limits are visible', () => {
  const value = report();
  const text = renderScorecard(value);
  assert.match(text, /Recorded Node suite passed/);
  assert.match(text, /16 passed \/ 0 failed or timed out \/ 0 pending/);
  assert.ok(text.includes('a'.repeat(40)));
  assert.match(text, /Dirty working tree: false/);
  assert.ok(text.includes(escapeText(value.node)));
  for (const id of NODE_LANES) assert.ok(text.includes(`| ${escapeText(id)} |`));
  assert.match(text, /not FPS/);
  assert.match(text, /1\.20 s/);
  assert.match(text, /No autonomous fixes/);
  assert.match(text, /Not owner visual acceptance or physical-device qualification/);
});
test('missing, interrupted, blocked and inconsistent lanes cannot claim success', () => {
  for (const mutate of [r => r.lanes.pop(), r => r.lanes[0].status = 'blocked', r => r.lanes[0].status = 'interrupted', r => r.lanes[0].steps[0].status = 'pending', r => r.lanes[0].steps = [], r => r.lanes.push(r.lanes[0]), r => delete r.head, r => delete r.finishedAt, r => r.status = 'running']) {
    const value = report(); mutate(value);
    const text = renderScorecard(value);
    assert.match(text, /UNQUALIFIED/);
    assert.doesNotMatch(text, /Recorded Node suite passed/);
  }
  assert.match(renderScorecard(null), /0 passed \/ 0 failed or timed out \/ 16 pending/);
});
test('failed, timed-out and unexecuted counts are not conflated', () => {
  const value = report();
  value.lanes[0].status = 'failed'; value.lanes[1].status = 'timed_out'; value.lanes[2].status = 'running'; value.lanes[3].status = 'blocked';
  assert.match(renderScorecard(value), /12 passed \/ 2 failed or timed out \/ 2 pending/);
});
test('manifest coverage checks missing steps and all visual pattern receipts', () => {
  const value = report();
  const manifest = {visualPatterns: ['a', 'b', 'c', 'd'], lanes: [{id: 'scope', files: ['fixture.test.mjs', 'missing.test.mjs']}]};
  assert.match(renderScorecard(value, {manifest}), /UNQUALIFIED/);
  manifest.lanes = [{id: 'visual-contracts', files: ['animal-visual.test.mjs']}];
  value.lanes.at(-1).steps = manifest.visualPatterns.map(pattern => ({file: 'animal-visual.test.mjs', pattern, status: 'passed'}));
  assert.match(renderScorecard(value, {manifest}), /Recorded Node suite passed/);
  value.lanes.at(-1).steps.pop();
  assert.match(renderScorecard(value, {manifest}), /UNQUALIFIED/);
});
test('baseline regressions, fixes and notComparable remain separate', () => {
  const value = report();
  value.comparison = {regressions: ['scope'], fixes: ['horse'], notComparable: ['Incompatible node']};
  const text = renderScorecard(value);
  assert.match(text, /regressions: 1 \(scope\)/);
  assert.match(text, /fixes: 1 \(horse\)/);
  assert.match(text, /notComparable: 1 \(Incompatible node\)/);
  assert.match(text, /not a clean-baseline claim/);
  value.comparison = {regressions: []};
  assert.match(renderScorecard(value), /Comparison unavailable or incomplete/);
  assert.match(renderScorecard(value), /fixes: unavailable/);
});
test('untrusted fields cannot inject HTML, Markdown links, rows or headings', () => {
  const hostile = '<script>alert(1)</script>\n| fake | passed |\n# heading [click](https://evil.test) `code` **bold** &amp;';
  const value = report();
  value.id = hostile; value.head = hostile; value.node = hostile; value.platform = hostile; value.dirty = hostile; value.lanes[0].title = hostile;
  value.comparison = {regressions: [hostile], fixes: [], notComparable: []};
  const text = renderScorecard(value, {readError: hostile});
  assert.ok(text.includes(escapeText(hostile)));
  for (const raw of ['<script>', '[click]', '\n# heading', '| fake |', '`code`', '**bold**', '&amp;']) assert.ok(!text.includes(raw), raw);
});
test('only a validated same-run GitHub link is rendered, never an artifact ID', () => {
  const env = {GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '123'};
  assert.equal(actionsRunUrl(env), 'https://github.com/owner/repo/actions/runs/123');
  assert.match(renderScorecard(report(), {env}), /artifact upload may still be pending/);
  for (const bad of [{...env, GITHUB_SERVER_URL: 'https://evil.test'}, {...env, GITHUB_REPOSITORY: 'owner/repo)\n#bad'}, {...env, GITHUB_RUN_ID: '../2'}, {}]) assert.equal(actionsRunUrl(bad), null);
});
test('latest loader accepts only matching reports contained in artifact root', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'synthetic-run'));
  fs.writeFileSync(path.join(root, 'synthetic-run/report.json'), JSON.stringify(report()));
  fs.writeFileSync(path.join(root, 'latest.json'), JSON.stringify({id: 'synthetic-run'}));
  assert.equal(loadLatestReport(root).id, 'synthetic-run');
  for (const id of ['../outside', '..', 'C:\\outside', 'synthetic-run/report.json']) {
    fs.writeFileSync(path.join(root, 'latest.json'), JSON.stringify({id}));
    assert.throws(() => loadLatestReport(root), /Invalid latest run ID/);
  }
  fs.writeFileSync(path.join(root, 'latest.json'), JSON.stringify({id: 'synthetic-run'}));
  fs.writeFileSync(path.join(root, 'synthetic-run/report.json'), JSON.stringify({...report(), id: 'other-run'}));
  assert.throws(() => loadLatestReport(root), /does not match/);
});
test('CLI only appends to designated summary, reports missing receipts honestly', t => {
  const root = fixture(t);
  const summary = path.join(root, 'summary.md');
  fs.writeFileSync(summary, 'Existing summary\n');
  assert.equal(main(['--root', root], {GITHUB_STEP_SUMMARY: summary}), 1);
  const text = fs.readFileSync(summary, 'utf8');
  assert.ok(text.startsWith('Existing summary\n'));
  assert.match(text, /UNQUALIFIED/);
  assert.match(text, /Report unavailable/);
  assert.throws(() => main(['--output', summary], {}), /Usage/);
  assert.deepEqual(fs.readdirSync(root), ['summary.md']);
});
test('module is a renderer/reader without network or command execution APIs', () => {
  const source = fs.readFileSync(new URL('./quality-loop-scorecard.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /child_process|\bspawn\s*\(|\bexec(?:File|Sync)?\s*\(|\bfetch\s*\(|node:https?|node:net/);
});
test('incompatible baseline is explicitly no-comparison; unchanged receipts count separately', () => {
  const value = report();
  value.baseline = {status: 'loaded', id: 'prior-run', head: 'b'.repeat(40)};
  value.comparison = {regressions: [], fixes: [], unchanged: [], notComparable: ['Incompatible testFingerprint']};
  let text = renderScorecard(value);
  assert.match(text, /NO COMPARISON/);
  assert.match(text, /unchanged: 0/);
  assert.ok(text.includes('b'.repeat(40)));
  value.comparison.notComparable = [];
  value.comparison.unchanged = [...NODE_LANES];
  text = renderScorecard(value);
  assert.match(text, /unchanged: 16/);
  assert.doesNotMatch(text, /NO COMPARISON/);
  value.comparison.notComparable = ['browser'];
  assert.match(renderScorecard(value), /PARTIAL COMPARISON/);
  value.baseline.reason = '<img src=x>\n# spoof';
  assert.ok(renderScorecard(value).includes(escapeText(value.baseline.reason)));
});
test('without summary environment CLI prints only and creates no output files', t => {
  const root = fixture(t);
  const original = process.stdout.write;
  let text = '';
  try {
    process.stdout.write = chunk => { text += chunk; return true; };
    assert.equal(main(['--root', root], {}), 1);
  } finally { process.stdout.write = original; }
  assert.match(text, /UNQUALIFIED/);
  assert.deepEqual(fs.readdirSync(root), []);
});
test('each lane reports command receipt counts and missing expected executions', () => {
  const value = report();
  value.lanes[0].status = 'failed';
  value.lanes[0].steps = ['passed', 'failed', 'timed_out', 'blocked', 'running', 'interrupted', 'unknown'].map(status => ({status}));
  const manifest = {lanes: [{id: 'scope', files: Array.from({length: 9}, (_, i) => `fixture-${i}.test.mjs`)}]};
  let text = renderScorecard(value, {manifest});
  assert.match(text, /Step receipts \(pass \/ fail \/ pending\)/);
  assert.match(text, /1 \/ 2 \/ 6 \(7 recorded; 9 expected\)/);
  assert.match(text, /not individual test assertions/);
  value.lanes.shift();
  text = renderScorecard(value, {manifest});
  assert.match(text, /0 \/ 0 \/ 9 \(0 recorded; 9 expected\)/);
  assert.match(text, /UNQUALIFIED/);
});
test('baseline source-run and artifact provenance is shown as escaped data', () => {
  const value = report();
  value.baseline = {status: 'loaded', head: 'b'.repeat(40), id: 'prior-run', sourceRunId: '12345', artifactId: '67890'};
  let text = renderScorecard(value);
  assert.match(text, /source Actions run: 12345; artifact ID: 67890/);
  const hostile = '[spoof](https://evil.test)\n| passed |<img src=x>';
  value.baseline.sourceRunId = hostile;
  value.baseline.artifactId = hostile;
  text = renderScorecard(value);
  assert.ok(text.includes(`source Actions run: ${escapeText(hostile)}; artifact ID: ${escapeText(hostile)}`));
  assert.ok(!text.includes(hostile));
});

test('horse lane cannot pass without all nine case receipts and nonzero matched checks',()=>{
  const value=report();
  const horse=value.lanes.find(l=>l.id==='horse');
  const cases=Array.from({length:9},(_,i)=>({name:'case '+i,measurements:i}));
  const manifest={horseContactCases:cases,lanes:[{id:'horse',files:['horse-contact-feasibility.test.mjs']}]};
  horse.steps=cases.map(c=>({file:'horse-contact-feasibility.test.mjs',caseName:c.name,pattern:'^'+c.name+'$',status:'passed',matchedTests:1,measurements:c.measurements,evidenceSha256:'a'.repeat(64)}));
  assert.match(renderScorecard(value,{manifest}),/Recorded Node suite passed/);
  assert.match(renderScorecard(value,{manifest}),/9 recorded; 9 expected/);
  for(const mutate of [s=>s.pop(),s=>s[1]=s[0],s=>delete s[0].matchedTests,s=>s[0].matchedTests=0,s=>delete s[0].evidenceSha256,s=>s[0].measurements=999]){
    const copy=structuredClone(value);mutate(copy.lanes.find(l=>l.id==='horse').steps);
    assert.match(renderScorecard(copy,{manifest}),/UNQUALIFIED/);
  }
});

test('missing horse partition manifest cannot erase that required file from a passing scorecard',()=>{
  const value=report();
  const horse=value.lanes.find(l=>l.id==='horse');
  horse.steps=[{file:'other.test.mjs',status:'passed'}];
  const manifest={lanes:[{id:'horse',files:['other.test.mjs','horse-contact-feasibility.test.mjs']}]};
  assert.match(renderScorecard(value,{manifest}),/UNQUALIFIED/);
});
