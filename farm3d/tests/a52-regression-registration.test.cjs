'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {normalizeA52Registration,scope,sha}=require('./helpers/a52-regression-registration.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const frozen=JSON.parse(read('farm3d/tests/fixtures/a52-browser-journey-scope.json'));
const nodeList=s=>Array.from(vm.runInNewContext(s.match(/const nodeFiles=(\[[\s\S]*?\n\]);/)[1]));
test('exact registration inverse returns frozen journey postimages, never unknown bytes',()=>{
 assert.deepEqual(Object.keys(scope.files),['farm3d/tests/run-core-game-tests.mjs','farm3d/tests/quality-loops.json']);
 for(const [f,e]of Object.entries(scope.files)){const s=read(f);assert.equal(sha(s),e.afterSha256);assert.equal(sha(normalizeA52Registration(f,s)),frozen.files[f].afterSha256);assert.equal(normalizeA52Registration(f,s+'\n'),s+'\n');}
});
test('all supplemental controls registered once while existing lists/order, commands and budgets survive',()=>{
 const wanted=[...fs.readdirSync(__dirname).filter(f=>/^a52-.*\.test\.(cjs|mjs)$/.test(f)),'ci-isolated-runner.test.cjs','a52-jekyll-build.test.cjs','a52-jekyll-workflow-scope.test.cjs'];
 const core='farm3d/tests/run-core-game-tests.mjs',s=read(core),e=scope.files[core],current=nodeList(s),previous=nodeList(e.before);
 assert.deepEqual(current,[...previous,...e.added]);for(const f of new Set(wanted))assert.equal(current.filter(x=>x===f).length,1,f);
 assert.equal(s.slice(s.indexOf('const browserFiles=')),e.before.slice(e.before.indexOf('const browserFiles=')));
 const m=JSON.parse(read('farm3d/tests/quality-loops.json')),old=JSON.parse(scope.files['farm3d/tests/quality-loops.json'].before),lane=m.lanes.find(l=>l.id==='scope'),oldLane=old.lanes.find(l=>l.id==='scope');
 assert.deepEqual(lane.files,[...oldLane.files,...scope.files['farm3d/tests/quality-loops.json'].added]);for(const f of new Set(wanted))assert.equal(lane.files.filter(x=>x===f).length,1,f);
 lane.files=oldLane.files;assert.deepEqual(m,old);assert(e.added.every(f=>/\.test\.(cjs|mjs)$/.test(f)));
});
