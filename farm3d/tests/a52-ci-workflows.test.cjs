'use strict';
const {normalizeA52WorkflowPublication}=require('./helpers/a52-workflow-publication-scope.cjs');
// Source-only proof: bash -n parses commands but never runs tests, installs or servers.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {scope,sha,normalizeA52CiWorkflows}=require('./helpers/a52-ci-workflows.cjs');
const {normalizeA52EmulatorBootstrap}=require('./helpers/a52-emulator-bootstrap-scope.cjs');
const {normalizeA52QualityWorkflow}=require('./helpers/a52-quality-workflow-scope.cjs');
const {normalizeA52JekyllWorkflow}=require('./helpers/a52-jekyll-workflow-scope.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>normalizeA52EmulatorBootstrap(f,normalizeA52QualityWorkflow(f,normalizeA52JekyllWorkflow(f,normalizeA52WorkflowPublication(f,fs.readFileSync(path.join(root,f),'utf8')))));
const trigger=s=>s.slice(s.indexOf('\non:'),s.indexOf('\npermissions:'));
test('six exact workflow adaptations reverse to unchanged predecessor bytes; all eleven trigger scopes retained',()=>{
 assert.equal(Object.keys(scope.files).length,6);assert.equal(Object.keys(scope.untouchedWorkflows).length,5);
 for(const [f,e]of Object.entries(scope.files)){
  const s=read(f);assert.equal(sha(s),e.afterSha256);assert.equal(sha(normalizeA52CiWorkflows(f,s)),e.beforeSha256);
  assert.equal(trigger(s),trigger(e.before));
 }
 for(const [f,hash]of Object.entries(scope.untouchedWorkflows))assert.equal(sha(read(f)),hash);
});
test('unknown workflow bytes cannot be normalized into approved history',()=>{
 for(const f of Object.keys(scope.files)){const bad=read(f)+'\n# unreviewed\n';assert.equal(normalizeA52CiWorkflows(f,bad),bad);}
 assert.equal(normalizeA52CiWorkflows('unknown','text'),'text');
});
test('all 59 whole protected commands are present, bounded and valid bash without execution',()=>{
 let total=0;
 for(const [f,e]of Object.entries(scope.files))for(const x of e.executions){
  const s=read(f),rendered=x.wrapper.split('\n').map(l=>'          '+l).join('\n');assert(s.includes(rendered),x.name);total++;
  assert(x.wrapper.includes('-- bash --noprofile --norc -e -o pipefail -c ')||x.wrapper.includes('-- env "FLOCK_WIDTH=$FLOCK_WIDTH" bash --noprofile --norc -e -o pipefail -c '));
  assert(x.wrapper.includes('--timeout-ms '+x.timeoutMs+' --max-output-bytes 16777216'));assert(x.wrapper.includes('/a52-ci-safe/'+x.job+'/step-'));
  const r=cp.spawnSync('bash',['--noprofile','--norc','-n'],{input:x.wrapper,encoding:'utf8',timeout:5000});assert.equal(r.status,0,r.stderr);
  if(x.originalCommand!==x.protectedCommand){assert.equal(f,'.github/workflows/field-support-qualification.yml');assert(x.originalCommand.startsWith('git fetch'));assert.equal(x.protectedCommand,'node farm3d/tests/animal-pen-cache-v74-to-v75.browser.cjs\n');}
 }
 assert.equal(total,59);
});
test('raw artifact publication replaced by 26 explicitly labeled execution-receipt uploads',()=>{
 let n=0;for(const [f,e]of Object.entries(scope.files)){const s=read(f);for(const u of e.uploads){assert(s.includes('name: '+u.name+'-execution-receipts-only'));assert(s.includes('path: ${{ runner.temp }}/a52-ci-safe/'+u.job+'/'));assert(u.originalPath);n++;}}
 assert.equal(n,26);
});
test('historical field source stays frozen; candidate guard provision verifies blob and checkout',()=>{
 const s=read('.github/workflows/field-support-qualification.yml');assert(s.includes('ref: 0d0542bf93e4e010b5543e81a40fae4bca2dd5f9'));
 assert(s.includes('git --no-lazy-fetch -c protocol.allow=never show "$CI_CANDIDATE_HEAD:$runner"'));
 assert(s.includes('git hash-object "$RUNNER_TEMP/ci-isolated-runner.cjs"'));assert(s.includes('"$(git rev-parse "$CI_CANDIDATE_HEAD:$runner")"'));
});
test('FLOCK_WIDTH passes a finite validated argument inside the unchanged boundary',()=>{
 const e=scope.files['.github/workflows/farm3d-regression.yml'].executions.filter(x=>x.job==='chicken-flock30');assert.equal(e.length,1);
 assert(e[0].wrapper.startsWith('case "$FLOCK_WIDTH" in 390|844) ;; *) exit 64;; esac\n'));assert(e[0].wrapper.includes('-- env "FLOCK_WIDTH=$FLOCK_WIDTH" bash'));
});
test('official Jekyll step stays exact and preparation blockers are explicit',()=>{
 const f='.github/workflows/pages-package-validation.yml',s=read(f),b=scope.files[f].before;
 const step=x=>x.slice(x.indexOf('      - name: Build using the official'),x.indexOf('      - name: Verify actual output'));
 assert.equal(step(s),step(b));assert(scope.blockers.some(x=>x.includes('Jekyll')));assert(scope.blockers.some(x=>x.includes('Firebase')));assert(scope.blockers.some(x=>x.includes('not equivalent')));
});
