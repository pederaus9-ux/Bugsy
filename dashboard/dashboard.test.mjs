import test from 'node:test';
import assert from 'node:assert/strict';
import {API,GitHubClient,defaultPR,exactRuns,latestRuns,summarize,verdict,stateOf,badge,duration,nextPage,safe,mergeParentsMatch} from './dashboard.mjs';

const head='a'.repeat(40), old='b'.repeat(40);
const run=(id,state='success',extra={})=>({id,workflow_id:1,event:'pull_request',head_sha:head,head_branch:'feature',status:'completed',conclusion:state,run_attempt:1,created_at:`2026-10-21T12:${String(id).padStart(2,'0')}:00Z`,...extra});
test('merge parents must include the source head and independently fresh target, with matching PR base',()=>{
  const target='c'.repeat(40);
  assert.equal(mergeParentsMatch([head,target],head,target,target),true);
  assert.equal(mergeParentsMatch([head,old],head,target,old),false);
  assert.equal(mergeParentsMatch([head,target],head,old,target),false);
  assert.equal(mergeParentsMatch([head,old],head,null,old),false);
  assert.equal(mergeParentsMatch([old,target],head,target,target),false);
});
test('old commits and PR events cannot qualify current main',()=>{
  assert.equal(exactRuns([run(1),run(2,'success',{head_sha:old})],head).length,1);
  assert.equal(exactRuns([run(1),run(2,'success',{head_branch:'main',event:'push'})],head,true).length,1);
  assert.equal(exactRuns([run(1)],null).length,0);
});
test('latest workflow/event/revision wins; older green and attempts do not mask new failures',()=>{
  const results=[run(1),run(2,'failure',{run_attempt:3}),run(3,'success',{workflow_id:2}),run(4,'success',{event:'workflow_dispatch'})];
  assert.deepEqual(latestRuns(results).map(r=>r.id),[4,3,2]);
  assert.equal(summarize(results).failed,1);
  assert.equal(summarize(results).passed,2);
  assert.equal(latestRuns([run(2,'success'),run(2,'failure',{run_attempt:2})])[0].run_attempt,2);
});
test('running, queued, cancelled, skipped, failure and unknown stay distinct',()=>{
  const values=['success','failure','cancelled','skipped','unknown','in_progress','queued'].map((s,i)=>run(i+1,s,{workflow_id:i,status:['queued','in_progress'].includes(s)?s:'completed'}));
  assert.deepEqual(summarize(values),{total:7,passed:1,failed:1,cancelled:1,skipped:1,unknown:1,active:2});
  for(const s of ['success','failure','cancelled','skipped','unknown','in_progress','queued'])assert.ok(badge(s)[0]);
  assert.equal(stateOf({status:'completed',conclusion:null}),'unknown');
});
test('empty, partial and cancelled evidence never says passed',()=>{
  assert.equal(verdict([])[0],'No runs found');
  assert.equal(verdict([run(1)],true)[0],'Incomplete evidence');
  assert.equal(verdict([run(1,'cancelled')])[0],'Review incomplete checks');
  assert.equal(verdict([run(1)])[0],'Observed runs passed');
});
test('default follows recent active animal work rather than old horse or dashboard PR',()=>{
  assert.equal(defaultPR([{number:1,title:'Horse R1',updated_at:'2026-10-01'}, {number:92,title:'Chickens: larger coop',updated_at:'2026-10-21'}, {number:93,title:'Sunny Acres dashboard',updated_at:'2026-10-22'}]).number,92);
  assert.equal(defaultPR([]),null);
});
test('duration handles completed, active and missing timestamps',()=>{
  assert.equal(duration({status:'completed',started_at:'2026-10-21T12:00:00Z',completed_at:'2026-10-21T12:02:05Z'}),'2m 5s');
  assert.equal(duration({status:'in_progress',started_at:'2026-10-21T12:00:00Z'},Date.parse('2026-10-21T12:03:00Z')),'3m 0s elapsed');
  assert.equal(duration({}),'Duration unknown');
});
test('pagination parses only next and prevents unrelated API or credential-bearing URLs',async()=>{
  const next=API+'/actions/runs?head_sha='+head+'&page=2';
  assert.equal(nextPage(`<${next}>; rel="next", <${API}>; rel="last"`),next);
  assert.equal(nextPage(null),null);
  let request;
  const client=new GitHubClient(async(url,options)=>{request={url,options};return new Response('{"workflow_runs":[]}',{headers:{link:`<${next}>; rel="next"`}});});
  assert.equal((await client.get('actions/runs')).next,next);
  assert.equal(request.options.method,'GET');assert.equal(request.options.credentials,'omit');
  assert.equal(request.options.headers.Authorization,undefined);
  await assert.rejects(()=>client.get('https://example.com/page'),/Untrusted/);
  await assert.rejects(()=>client.get('https://user:secret@api.github.com/repos/pederaus9-ux/Bugsy/actions'),/Untrusted/);
  await assert.rejects(()=>client.get('https://api.github.com/repos/another/repo/actions'),/Untrusted/);
});
test('rate-limit reset is respected and blocks further calls until reset',async()=>{
  let now=1000000,calls=0;
  const client=new GitHubClient(async()=>{calls++;return new Response('{}',{status:429,headers:{'retry-after':'120','x-ratelimit-reset':'1600'}});},()=>now);
  await assert.rejects(()=>client.get('actions/runs'),/HTTP 429/);
  assert.equal(client.blockedUntil,1600000);
  await assert.rejects(()=>client.get('actions/runs'),/paused/);assert.equal(calls,1);
});
test('native fetch receiver is preserved when the client invokes it',async()=>{
  await new GitHubClient(function(){assert.equal(this,globalThis);return Promise.resolve(new Response('{}'));}).get('actions/runs');
});
test('per-tab budget caps reads, offline errors are surfaced, and HTML is escaped',async()=>{
  const client=new GitHubClient(async()=>new Response('{}'),()=>1000000);
  client.calls=Array(40).fill(999999);
  await assert.rejects(()=>client.get('actions/runs'),/40-request/);
  await assert.rejects(()=>new GitHubClient(async()=>{throw new Error('Offline');}).get('actions/runs'),/Offline/);
  assert.equal(safe('<img src=x onerror="bad">'), '&lt;img src=x onerror=&quot;bad&quot;&gt;');
});
