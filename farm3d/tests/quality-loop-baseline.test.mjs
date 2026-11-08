import test from 'node:test';
import assert from 'node:assert/strict';
import {contextFromEnv, eligibleRuns, selectBaseline, discoverBaseline} from './quality-loop-baseline.mjs';

const env = {GITHUB_REPOSITORY: 'owner/game', GITHUB_REF_NAME: 'quality/topic', GITHUB_RUN_ID: '100', GITHUB_TOKEN: 'secret-never-echo'};
const context = contextFromEnv(env);
const head = 'a'.repeat(40);
const now = Date.parse('2026-11-08T00:00:00Z');
const run = overrides => ({id: 99, status: 'completed', conclusion: 'success', head_branch: context.branch, head_sha: head, repository: {full_name: context.repository}, head_repository: {full_name: context.repository}, path: '.github/workflows/farm3d-quality-loops.yml', ...overrides});
const artifact = overrides => ({id: 123, name: `game-quality-${head}-1`, expired: false, expires_at: '2026-12-01T00:00:00Z', ...overrides});
const select = (r = run(), a = artifact()) => selectBaseline([r], {[r.id]: [a]}, context, now);
const mock = responses => {
  const calls = [];
  return {calls, fetchImpl: async (url, options) => {
    calls.push({url, options});
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return {ok: true, url, json: async () => next, ...(next?.response || {})};
  }};
};

test('selects same repository/branch success and marks compatibility pending, never game-pass evidence', () => {
  assert.deepEqual(select(), {schemaVersion: 1, status: 'selected', reason: 'Prior successful same-branch artifact; compatibility pending', comparison: 'pending-compatibility', gamePassEvidence: false, runId: '99', artifactId: '123', headSha: head});
});

test('rejects failed, current, future, foreign branch/repository and wrong-workflow runs', () => {
  for (const overrides of [{conclusion: 'failure'}, {status: 'in_progress'}, {id: 100}, {id: 101}, {id: 'x'}, {head_branch: 'main'}, {repository: {full_name: 'other/game'}}, {head_repository: {full_name: 'fork/game'}}, {head_sha: '../bad'}, {path: '.github/workflows/other.yml'}]) assert.equal(select(run(overrides)).status, 'absent', JSON.stringify(overrides));
});

test('rejects expired, wrong-prefix, invalid and mismatched artifact metadata', () => {
  for (const overrides of [{expired: true}, {expired: undefined}, {expires_at: '2026-01-01'}, {expires_at: 'not a date'}, {id: '1\nrun_id=5'}, {name: 'game-quality-wrong-1'}, {workflow_run: {id: 98, head_sha: head}}, {workflow_run: {id: 99, head_sha: 'b'.repeat(40)}}]) assert.equal(select(run(), artifact(overrides)).status, 'absent');
});

test('empty and bounded search explicitly yields no-comparison', () => {
  const absent = selectBaseline([], {}, context, now);
  assert.equal(absent.comparison, 'no-comparison');
  assert.equal(absent.gamePassEvidence, false);
  assert.equal(eligibleRuns([...Array.from({length: 20}, () => run({conclusion: 'failure'})), run()], context).length, 0);
});

test('uses newest listed eligible run and highest artifact id without executing or downloading artifacts', async () => {
  const m = mock([{workflow_runs: [run({id: 98}), run({id: 97})]}, {artifacts: []}, {artifacts: [artifact({id: 121}), artifact({id: 122})]}]);
  const result = await discoverBaseline({env, now, ...m});
  assert.equal(result.runId, '97');
  assert.equal(result.artifactId, '122');
  assert.equal(m.calls.length, 3);
  for (const call of m.calls) {
    assert.equal(new URL(call.url).origin, 'https://api.github.com');
    assert.ok(new URL(call.url).pathname.startsWith('/repos/owner/game/actions/'));
    assert.equal(call.options.redirect, 'error');
    assert.equal(call.options.method, 'GET');
    assert.equal(call.options.headers.Authorization, `Bearer ${env.GITHUB_TOKEN}`);
    assert.ok(!call.url.includes('download'));
  }
  assert.ok(m.calls[0].url.includes('branch=quality%2Ftopic&status=success&per_page=20'));
});

test('mock API no baseline and untrusted runs never request artifacts', async () => {
  for (const runs of [[], [run({head_branch: 'foreign'})], [run({id: 100})], [run({conclusion: 'failure'})]]) {
    const m = mock([{workflow_runs: runs}]);
    assert.equal((await discoverBaseline({env, now, ...m})).status, 'absent');
    assert.equal(m.calls.length, 1);
  }
});

test('errors and rejected redirects never expose token or upstream content', async () => {
  for (const response of [new Error(`leaked ${env.GITHUB_TOKEN}`), {response: {ok: false, status: 403}}, {response: {redirected: true, url: 'https://foreign.test/token'}}, {response: {url: 'https://api.github.com/repos/other/repo/actions/runs'}}, {response: {json: async () => {throw new Error(env.GITHUB_TOKEN);}}}, {}]) {
    const m = mock([response]);
    const result = await discoverBaseline({env, now, ...m});
    assert.equal(result.status, 'unavailable');
    assert.equal(result.comparison, 'no-comparison');
    assert.ok(!JSON.stringify(result).includes(env.GITHUB_TOKEN));
    assert.equal(m.calls.length, 1);
  }
});

test('invalid context, foreign origins and missing token cause zero network calls', async () => {
  for (const overrides of [{GITHUB_TOKEN: ''}, {GITHUB_REPOSITORY: 'owner/../foreign'}, {GITHUB_REF_NAME: 'bad\nbranch'}, {GITHUB_RUN_ID: 'bad'}, {GITHUB_API_URL: 'https://foreign.test'}, {GITHUB_SERVER_URL: 'https://foreign.test'}, {GITHUB_HEAD_REF: 'pr-branch'}]) {
    const m = mock([]);
    assert.equal((await discoverBaseline({env: {...env, ...overrides}, now, ...m})).status, 'unavailable');
    assert.equal(m.calls.length, 0);
  }
});

test('PR context requires exact same-repository head and branch', () => {
  const prEnv = {...env, GITHUB_HEAD_REF: 'pr-branch', GITHUB_REF_NAME: '1/merge'};
  const event = {repository: {full_name: env.GITHUB_REPOSITORY}, pull_request: {head: {ref: 'pr-branch', repo: {full_name: env.GITHUB_REPOSITORY}}}};
  assert.equal(contextFromEnv(prEnv, event).branch, 'pr-branch');
  event.pull_request.head.repo.full_name = 'fork/game';
  assert.throws(() => contextFromEnv(prEnv, event), /Untrusted/);
});

test('API-provided URLs cannot redirect credentials or select a foreign artifact host', async () => {
  const m = mock([{workflow_runs: [run({artifacts_url: 'https://foreign.test/steal'})]}, {artifacts: [artifact({archive_download_url: 'https://foreign.test/steal'})]}]);
  assert.equal((await discoverBaseline({env, now, ...m})).status, 'selected');
  assert.equal(m.calls[1].url, 'https://api.github.com/repos/owner/game/actions/runs/99/artifacts?per_page=100');
});

test('network search is bounded to twenty runs even when upstream returns extra data', async () => {
  const runs = Array.from({length: 25}, (_, i) => run({id: 99 - i}));
  const m = mock([{workflow_runs: runs}, ...Array.from({length: 20}, () => ({artifacts: []}))]);
  assert.equal((await discoverBaseline({env, now, ...m})).status, 'absent');
  assert.equal(m.calls.length, 21);
});

test('explicit workflow head branch must agree with built-in GitHub context', () => {
  assert.equal(contextFromEnv({...env, QUALITY_HEAD_BRANCH: env.GITHUB_REF_NAME}).branch, env.GITHUB_REF_NAME);
  assert.throws(() => contextFromEnv({...env, QUALITY_HEAD_BRANCH: 'foreign'}), /Conflicting/);
});

test('total thirty-second deadline stops requests even with further eligible runs', async () => {
  let elapsed = 0;
  const m = mock([{workflow_runs: [run(), run({id: 98}), run({id: 97})]}, {artifacts: []}, {artifacts: []}]);
  const result = await discoverBaseline({env, now, clock: () => elapsed, fetchImpl: async (...args) => {
    const response = await m.fetchImpl(...args);
    elapsed += 10000;
    return response;
  }});
  assert.equal(m.calls.length, 3);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.comparison, 'no-comparison');
  assert.equal(result.gamePassEvidence, false);
});

test('no request starts after discovery deadline is exhausted', async () => {
  let clockCalls = 0;
  const m = mock([]);
  const result = await discoverBaseline({env, now, ...m, clock: () => clockCalls++ === 0 ? 0 : 30000});
  assert.equal(m.calls.length, 0);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.comparison, 'no-comparison');
});
