'use strict';
const {normalizeA52WorkflowPublication}=require('./helpers/a52-workflow-publication-scope.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {normalizeA52QualityWorkflow,scope,sha}=require('./helpers/a52-quality-workflow-scope.cjs');
const {normalizeA52CiWorkflows,scope:inner}=require('./helpers/a52-ci-workflows.cjs');
const file='.github/workflows/farm3d-quality-loops.yml',read=()=>normalizeA52WorkflowPublication(file,fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8'));
test('outer quality export exactly reverses before frozen CI ledger with original commands/budgets/triggers intact',()=>{
 assert.deepEqual(Object.keys(scope.files),[file]);const now=read(),row=scope.files[file];assert.equal(sha(now),row.afterSha256);const prior=normalizeA52QualityWorkflow(file,now);assert.equal(sha(prior),inner.files[file].afterSha256);assert.equal(sha(normalizeA52CiWorkflows(file,prior)),inner.files[file].beforeSha256);
 for(const x of inner.files[file].executions)assert(now.includes(x.wrapper.split('\n').map(l=>'          '+l).join('\n')));
 assert.equal(now.slice(now.indexOf('\non:'),now.indexOf('\npermissions:')),prior.slice(prior.indexOf('\non:'),prior.indexOf('\npermissions:')));
 assert.equal(normalizeA52QualityWorkflow(file,now+'\n'),now+'\n');assert.equal(normalizeA52QualityWorkflow('other',now),now);
});
test('only report artifact retains baseline prefix; public summary requires successful finite projection',()=>{
 const now=read();assert.equal((now.match(/name: game-quality-/g)||[]).length,1);assert(now.includes('name: a52-quality-isolation-'));assert(!now.includes('-execution-receipts-only'));
 assert(now.includes('path: ${{ runner.temp }}/a52-public-quality/'));assert(now.includes('id: public_quality'));assert.equal((now.match(/steps.public_quality.outcome == 'success'/g)||[]).length,2);
 assert(now.includes('A52_EXPECTED_HEAD: ${{ github.event.pull_request.head.sha || github.sha }}'));assert(!now.includes('          GITHUB_SHA:'));
});
