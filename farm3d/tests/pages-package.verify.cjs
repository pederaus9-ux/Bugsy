'use strict';
// Verifies a real Jekyll output. --source-only never claims a built package pass.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const EVIDENCE = 'farm3d/tests/evidence/';
const LIMIT = 1_000_000_000;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const blob = b => crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const git = (...args) => execFileSync('git', args, {cwd: ROOT, encoding: 'utf8'}).trim();
const defaults = ['Gemfile', 'Gemfile.lock', 'node_modules', 'vendor/bundle/',
  'vendor/cache/', 'vendor/gems/', 'vendor/ruby/', 'CNAME', 'farm3d/tests/evidence'];

function configCheck() {
  const lines = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8').split(/\r?\n/)
    .map(l => l.replace(/#.*$/, '').trim()).filter(Boolean);
  assert.equal(lines.shift(), 'exclude:', 'Only the exclusion configuration is authorized');
  assert.deepEqual(lines.map(l => {assert(l.startsWith('- ')); return l.slice(2);}), defaults,
    'Preserve default excludes and add only test evidence');
}

function localPath(from, spec) {
  if (!spec || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(spec)) return null;
  const clean = decodeURIComponent(spec.split(/[?#]/)[0]);
  if (!clean) return null;
  const resolved = path.posix.normalize(clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(from), clean));
  assert(!resolved.startsWith('../'), `Dependency leaves website: ${from} -> ${spec}`);
  return clean.endsWith('/') || resolved === '.' ? `${resolved === '.' ? '' : resolved.replace(/\/$/, '') + '/'}index.html` : resolved;
}

function dependencies(file, buffer) {
  if (!/\.(?:js|html|css)$/.test(file)) return [];
  const text = buffer.toString('utf8'), result = new Set();
  const add = spec => {const p = localPath(file, spec); if (p) result.add(p);};
  // Static/dynamic relative module imports and worker/module URL construction.
  for (const m of text.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)["'](\.{1,2}\/[^"']+)["']/g)) add(m[1]);
  for (const m of text.matchAll(/new\s+URL\(\s*["'](\.{1,2}\/[^"']+)["']\s*,\s*import\.meta\.url/g)) add(m[1]);
  // Script templates are executable expressions, not static HTML attributes.
  const markup = /\.html$/.test(file) ? text.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>') : text;
  if (/\.html$/.test(file)) {
    for (const m of markup.matchAll(/<(?:script|link|img|audio|source|video)\b[^>]*?\b(?:src|href|poster)=["']([^"']+)["']/gi)) add(m[1]);
  }
  if (/\.(?:html|css)$/.test(file)) {
    for (const m of markup.matchAll(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/g)) add(m[1]);
  }
  return [...result];
}

function verifyPackage(source, output, totalBytes) {
  assert(totalBytes < LIMIT, `Built output exceeds Pages limit: ${totalBytes}`);
  for (const name of output.keys()) assert(!name.startsWith(EVIDENCE), `Evidence leaked into output: ${name}`);
  let dependencyCount = 0, shellCount = 0;
  for (const [file, bytes] of source) {
    assert(output.has(file), `Missing runtime asset: ${file}`);
    assert.equal(sha(output.get(file)), sha(bytes), `Changed runtime asset: ${file}`);
    for (const dep of dependencies(file, bytes)) {
      assert(output.has(dep), `Missing dependency: ${file} -> ${dep}`);
      dependencyCount++;
    }
    if (file === 'farm3d/sw.js') {
      const match = bytes.toString('utf8').match(/const SHELL\s*=\s*(\[[^;]+\]);/);
      assert(match, 'Expected unchanged service-worker shell');
      const shell = JSON.parse(match[1]);
      for (const spec of shell) {const dep = localPath(file, spec); assert(dep && output.has(dep), `Missing cached resource: ${spec}`); shellCount++;}
    }
  }
  return {runtimeAssets: source.size, dependencyReferences: dependencyCount, serviceWorkerEntries: shellCount, bytes: totalBytes};
}

function negativeControls() {
  const source = new Map([
    ['farm3d/index.html', Buffer.from('<script type="module" src="./entry.js"></script>')],
    ['farm3d/entry.js', Buffer.from('import "./extra.js";')],
    ['farm3d/sw.js', Buffer.from('const SHELL = ["./", "cached.png"];')]
  ]);
  const good = new Map([...source, ['farm3d/extra.js', Buffer.from('export{}')], ['farm3d/cached.png', Buffer.from('image')]]);
  verifyPackage(source, good, 500);
  const controls = [
    ['evidence leak', m => m.set(`${EVIDENCE}kept.zip`, Buffer.from('zip')), /Evidence leaked/],
    ['missing runtime', m => m.delete('farm3d/index.html'), /Missing runtime/],
    ['modified runtime', m => m.set('farm3d/entry.js', Buffer.from('changed')), /Changed runtime/],
    ['missing import', m => m.delete('farm3d/extra.js'), /Missing dependency/],
    ['missing cached resource', m => m.delete('farm3d/cached.png'), /Missing cached resource/]
  ];
  for (const [, mutate, expected] of controls) {const copy = new Map(good); mutate(copy); assert.throws(() => verifyPackage(source, copy, 500), expected);}
  assert.throws(() => verifyPackage(source, good, LIMIT), /exceeds Pages limit/);
  return [...controls.map(c => c[0]), 'oversize output'];
}

function readOutput(dir) {
  const files = new Map(); let bytes = 0;
  function visit(base) {
    for (const entry of fs.readdirSync(base, {withFileTypes: true})) {
      const full = path.join(base, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected built symlink: ${full}`);
      if (entry.isDirectory()) visit(full);
      else {const name = path.relative(dir, full).split(path.sep).join('/'); const data = fs.readFileSync(full); files.set(name, data); bytes += data.length;}
    }
  }
  visit(dir); return {files, bytes};
}

// A39: account for only the approved A38 postimages. The original manifest stays frozen;
// output validation below still compares the actual, current bytes without normalization.
function historicalAccounting(source, manifest) {
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures/release-blocker-scope.json'));
  assert.equal(sha(raw), 'f900182d2ed27b926b1a90d4d940e9bfc8ef48b5588e46e8ef1f8f9cf9848ee4', 'Frozen A38 scope receipt');
  const approved = JSON.parse(raw).files;
  const changes = [], unchanged = [];
  for (const entry of manifest.staticSource) {
    assert(source.has(entry.path), `Missing current source: ${entry.path}`);
    const bytes = source.get(entry.path), file = entry.path.replace(/^farm3d\//, '');
    let historical = bytes;
    if (file === 'auth.js' || file === 'index.html') {
      const exact = approved[file];
      assert.equal(sha(bytes), exact.afterSha256, `Unknown A38 current bytes: ${entry.path}`);
      let text = bytes.toString('utf8');
      for (const h of exact.hunks) {
        assert.equal(text.split(h.after).length, 2, `A38 unique approved hunk: ${entry.path}`);
        text = text.replace(h.after, h.before);
      }
      historical = Buffer.from(text);
      assert.equal(sha(historical), exact.beforeSha256, `A38 exact reconstruction: ${entry.path}`);
    } else if (file === 'sw.js') {
      assert.equal(sha(bytes), '82e259feda9c3fedc0b492d737c35eef08aa4d208195542b4b403d47038109ad', 'Unknown A38 current service worker');
      let text = bytes.toString('utf8');
      for (const [after, before] of [['const CACHE = "sa3d-v75";', 'const CACHE = "sa3d-v74";'], ['"auth.js?v=21"', '"auth.js?v=20"']]) {
        assert.equal(text.split(after).length, 2, 'A38 unique service-worker version hunk');
        text = text.replace(after, before);
      }
      historical = Buffer.from(text);
      assert.equal(sha(historical), '490ca027327721412f0c67a315ac2db63ea98f2562d500214ac9c8cc667c98c0', 'A38 exact service-worker reconstruction');
    }
    assert.equal(blob(historical), entry.blob, `Source changed since tested checkpoint: ${entry.path}`);
    if (historical === bytes) unchanged.push(entry.path);
    else changes.push({path: entry.path, currentSha256: sha(bytes), originalBlob: entry.blob});
  }
  assert.equal(unchanged.length, 118, 'All other runtime assets stay unchanged');
  assert.deepEqual(changes.map(c => c.path).sort(), ['farm3d/auth.js', 'farm3d/index.html', 'farm3d/sw.js']);
  return {unchangedRuntimeAssets: unchanged.length, approvedRuntimeChanges: changes};
}

function accountingControls(source, manifest) {
  historicalAccounting(source, manifest);
  const controls = [
    ['wrong auth', m => m.set('farm3d/auth.js', Buffer.concat([m.get('farm3d/auth.js'), Buffer.from('\n/* unrelated */')]))],
    ['unrelated index change', m => m.set('farm3d/index.html', Buffer.concat([m.get('farm3d/index.html'), Buffer.from('\n<!-- unrelated -->')]))],
    ['missing service worker', m => m.delete('farm3d/sw.js')],
    ['wrong cache version', m => m.set('farm3d/sw.js', Buffer.from(m.get('farm3d/sw.js').toString().replace('sa3d-v75', 'sa3d-v76')))],
    ['unrelated unchanged asset', m => {const file = manifest.staticSource.find(e => !['farm3d/auth.js','farm3d/index.html','farm3d/sw.js'].includes(e.path)).path; m.set(file, Buffer.concat([m.get(file), Buffer.from('corrupt')]));}]
  ];
  for (const [, mutate] of controls) {const copy = new Map(source); mutate(copy); assert.throws(() => historicalAccounting(copy, manifest));}
  return controls.map(c => c[0]);
}

configCheck();
const controls = negativeControls();
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, EVIDENCE,
  'pen-editing-implementation/task8-codex-a28-publication-branch-20261025/provenance.json'), 'utf8'));
assert.equal(manifest.staticSource.length, 121);
const source = new Map(manifest.staticSource.map(entry => {
  const bytes = fs.readFileSync(path.join(ROOT, entry.path));
  return [entry.path, bytes];
}));
const accounting = historicalAccounting(source, manifest);
const sourceControls = accountingControls(source, manifest);
assert.equal(git('diff', '--name-only', '2f9a8241b8230938dd816e1c0fac52551a263f69', 'HEAD', '--', EVIDENCE), '',
  'Previously retained evidence must remain unchanged in Git');
const report = {head: git('rev-parse', 'HEAD'), source: manifest.source, sourceAssetsExact: source.size,
  controls, sourceControls, ...accounting, gameRuntimeChanged: true, evidencePreservedInGit: true, status: 'SOURCE_ONLY_OUTPUT_NOT_BUILT'};
// Check source references before requesting the real build. These are not output bytes.
const sourcePaths = new Map(git('ls-files').split('\n').filter(p => !p.startsWith(EVIDENCE)).map(p => [p, Buffer.alloc(0)]));
for (const [file, bytes] of source) sourcePaths.set(file, bytes);
const references = verifyPackage(source, sourcePaths, 0);
report.sourceDependencyReferences = references.dependencyReferences;
report.sourceServiceWorkerEntries = references.serviceWorkerEntries;
if (!process.argv.includes('--source-only')) {
  const oi = process.argv.indexOf('--output'); assert(oi >= 0 && process.argv[oi + 1], 'Provide real Jekyll --output');
  const output = readOutput(path.resolve(ROOT, process.argv[oi + 1]));
  Object.assign(report, verifyPackage(source, output.files, output.bytes), {outputFiles: output.files.size, evidenceOutputFiles: 0, status: 'PASS'});
}
const ri = process.argv.indexOf('--report');
if (ri >= 0) fs.writeFileSync(process.argv[ri + 1], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
