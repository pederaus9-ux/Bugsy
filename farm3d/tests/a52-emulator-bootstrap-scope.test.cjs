'use strict';
const {normalizeA52WorkflowPublication}=require('./helpers/a52-workflow-publication-scope.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {scope,sha,normalizeA52EmulatorBootstrap}=require('./helpers/a52-emulator-bootstrap-scope.cjs');
const {normalizeA52CiWorkflows}=require('./helpers/a52-ci-workflows.cjs');
const root=path.resolve(__dirname,'../..');
test('only four additive setup steps, exact preceding workflow source restored',()=>{
 let count=0;assert.equal(Object.keys(scope.files).length,2);
 for(const [file,e]of Object.entries(scope.files)){
  const current=normalizeA52WorkflowPublication(file,fs.readFileSync(path.join(root,file),'utf8'));assert.equal(sha(current),e.afterSha256);let removed=current;
  for(const a of e.additions){assert(removed.includes(a.block));removed=removed.replace(a.block,'');count++;}
  assert.equal(removed,e.before);assert.equal(normalizeA52EmulatorBootstrap(file,current),e.before);
  assert.notEqual(normalizeA52CiWorkflows(file,e.before),e.before,'preceding frozen workflow inverse still accepts exact bytes');
 }
 assert.equal(count,4);
});
test('unknown workflow bytes cannot be laundered through bootstrap inverse',()=>{
 for(const file of Object.keys(scope.files)){const s=fs.readFileSync(path.join(root,file),'utf8')+'\n# unknown';assert.equal(normalizeA52EmulatorBootstrap(file,s),s);}
});
