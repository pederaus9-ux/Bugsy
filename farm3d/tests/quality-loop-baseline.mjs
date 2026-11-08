import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const workflow = 'farm3d-quality-loops.yml';
const id = value => /^[1-9]\d*$/.test(String(value)) && (typeof value !== 'number' || Number.isSafeInteger(value));
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const noComparison = (status, reason) => ({schemaVersion: 1, status, reason, comparison: 'no-comparison', gamePassEvidence: false});

export function contextFromEnv(env, event = null) {
  const repository = env.GITHUB_REPOSITORY;
  const branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository || '') || ['.', '..'].includes(repository.split('/')[1])) throw new Error('Invalid repository context');
  if (typeof branch !== 'string' || !branch || branch.length > 255 || /[\s~^:?*\[\\\x00-\x1f\x7f]/.test(branch) || branch.includes('..') || branch.includes('@{') || branch.startsWith('/') || branch.endsWith('/') || branch.includes('//')) throw new Error('Invalid branch context');
  if (env.QUALITY_HEAD_BRANCH && env.QUALITY_HEAD_BRANCH !== branch) throw new Error('Conflicting branch context');
  if (!id(env.GITHUB_RUN_ID)) throw new Error('Invalid run context');
  if (env.GITHUB_API_URL && env.GITHUB_API_URL !== 'https://api.github.com') throw new Error('Unsupported API origin');
  if (env.GITHUB_SERVER_URL && env.GITHUB_SERVER_URL !== 'https://github.com') throw new Error('Unsupported server origin');
  if (env.GITHUB_HEAD_REF || env.GITHUB_EVENT_NAME?.startsWith('pull_request')) {
    if (!event?.pull_request || event.repository?.full_name !== repository || event.pull_request.head?.repo?.full_name !== repository || event.pull_request.head?.ref !== branch) throw new Error('Untrusted pull request context');
  }
  return {repository, branch, currentRunId: String(env.GITHUB_RUN_ID)};
}

export function eligibleRuns(runs, context) {
  return runs.slice(0, 20).filter(run => id(run.id) && BigInt(run.id) < BigInt(context.currentRunId)
    && run.status === 'completed' && run.conclusion === 'success'
    && run.head_branch === context.branch && run.repository?.full_name === context.repository
    && run.head_repository?.full_name === context.repository && sha(run.head_sha)
    && run.path === `.github/workflows/${workflow}`);
}

// Pure metadata selection only. Compatibility of the actual reports is checked by the runner.
export function selectBaseline(runs, artifactsByRun, context, now = Date.now()) {
  for (const run of eligibleRuns(runs, context)) {
    const artifacts = artifactsByRun[String(run.id)] || [];
    const artifact = artifacts.filter(a => id(a.id) && a.expired === false
      && typeof a.name === 'string' && a.name.startsWith(`game-quality-${run.head_sha}-`)
      && Number.isFinite(Date.parse(a.expires_at)) && Date.parse(a.expires_at) > now
      && (!a.workflow_run || (String(a.workflow_run.id) === String(run.id) && a.workflow_run.head_sha === run.head_sha)))
      .sort((a, b) => BigInt(a.id) > BigInt(b.id) ? -1 : 1)[0];
    if (artifact) return {schemaVersion: 1, status: 'selected', reason: 'Prior successful same-branch artifact; compatibility pending', comparison: 'pending-compatibility', gamePassEvidence: false, runId: String(run.id), artifactId: String(artifact.id), headSha: run.head_sha};
  }
  return noComparison('absent', 'No eligible baseline in the bounded prior-run search');
}

export async function discoverBaseline({env = process.env, event = null, fetchImpl = globalThis.fetch, now = Date.now(), clock = () => performance.now()} = {}) {
  const deadline = clock() + 30000;
  let context;
  try { context = contextFromEnv(env, event); }
  catch { return noComparison('unavailable', 'Invalid or untrusted GitHub context'); }
  if (!env.GITHUB_TOKEN) return noComparison('unavailable', 'GitHub token unavailable');
  const base = `https://api.github.com/repos/${context.repository}/actions/`;
  async function get(suffix) {
    const remaining = deadline - clock();
    if (remaining <= 0) throw new Error('Metadata deadline exhausted');
    // URLs are constructed here, never taken from API payloads or redirect locations.
    const url = new URL(base + suffix);
    if (url.origin !== 'https://api.github.com' || !url.pathname.startsWith(`/repos/${context.repository}/actions/`)) throw new Error('Untrusted endpoint');
    const response = await fetchImpl(url.href, {method: 'GET', redirect: 'error', signal: AbortSignal.timeout(Math.min(10000, Math.ceil(remaining))), headers: {Accept: 'application/vnd.github+json', Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28'}});
    if (!response.ok || response.redirected || (response.url && response.url !== url.href)) throw new Error('Metadata request failed');
    const data = await response.json();
    if (clock() >= deadline) throw new Error('Metadata deadline exhausted');
    return data;
  }
  try {
    const data = await get(`workflows/${workflow}/runs?branch=${encodeURIComponent(context.branch)}&status=success&per_page=20`);
    if (!Array.isArray(data.workflow_runs)) throw new Error('Invalid metadata');
    const runs = eligibleRuns(data.workflow_runs, context);
    for (const run of runs) {
      const data = await get(`runs/${run.id}/artifacts?per_page=100`);
      if (!Array.isArray(data.artifacts)) throw new Error('Invalid metadata');
      const selected = selectBaseline([run], {[run.id]: data.artifacts.slice(0, 100)}, context, now);
      if (selected.status === 'selected') return selected;
    }
    return selectBaseline([], {}, context, now);
  } catch {
    // Do not echo response bodies, request headers, exception messages, or secrets.
    return noComparison('unavailable', 'GitHub metadata unavailable; no comparison performed');
  }
}

export async function main(env = process.env) {
  let event = null;
  try { if (env.GITHUB_EVENT_PATH) event = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8')); }
  catch { /* Invalid PR context is rejected by discoverBaseline. */ }
  const receipt = await discoverBaseline({env, event});
  const outputDirectory = fileURLToPath(new URL('./artifacts/quality-loops/', import.meta.url));
  fs.mkdirSync(outputDirectory, {recursive: true});
  fs.writeFileSync(path.join(outputDirectory, 'baseline-selection.json'), JSON.stringify(receipt, null, 2) + '\n');
  if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `status=${receipt.status}\nrun_id=${receipt.runId || ''}\nartifact_id=${receipt.artifactId || ''}\nhead_sha=${receipt.headSha || ''}\n`);
  console.log(`Baseline: ${receipt.status}. ${receipt.reason}. This is not game-pass evidence.`);
  return receipt;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error('Baseline receipt/output could not be written'); process.exitCode = 1; });
}
