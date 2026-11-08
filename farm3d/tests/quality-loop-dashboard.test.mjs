import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createDashboard } from './quality-loop-dashboard.mjs';

async function fixture(t) {
  const base=await mkdtemp(path.join(os.tmpdir(),'quality-dashboard-'));
  const root=path.join(base,'output');await mkdir(path.join(root,'run-001'),{recursive:true});
  const report={id:'run-001',status:'running',head:'abc123',branch:'test',dirty:true,startedAt:'2026-11-08T12:00:00Z',lanes:[{id:'node',title:'Node checks',status:'pending',steps:[]}]};
  await writeFile(path.join(root,'latest.json'),JSON.stringify({id:report.id}));
  await writeFile(path.join(root,report.id,'report.json'),JSON.stringify(report));
  await writeFile(path.join(root,report.id,'checks.log'),'actual log');
  await writeFile(path.join(root,report.id,'unsafe.html'),'<script>alert(1)</script>');
  await writeFile(path.join(base,'private.txt'),'PRIVATE');
  const server=createDashboard({root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(base,{recursive:true,force:true});});
  const request=(url,options={})=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path:url,...options},res=>{let body='';res.setEncoding('utf8');res.on('data',s=>body+=s);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);req.end();});
  return {root,base,report,server,request};
}

test('serves actual reports, local UI and allowlisted logs without external dependencies',async t=>{
  const f=await fixture(t);
  assert.equal(f.server.address().address,'127.0.0.1');
  const latest=await f.request('/api/latest');assert.equal(latest.status,200);assert.deepEqual(JSON.parse(latest.body),f.report);
  assert.deepEqual(JSON.parse((await f.request('/api/runs')).body),[f.report]);
  const log=await f.request('/files/run-001/checks.log');assert.equal(log.status,200);assert.equal(log.body,'actual log');assert.match(log.headers['content-type'],/text\/plain/);
  const page=await f.request('/');assert.equal(page.status,200);assert.match(page.body,/Read-only/);assert.match(page.body,/setTimeout\(refresh,2000\)/);assert.match(page.body,/Source SHA/);assert.match(page.body,/Uncommitted changes/);
  assert.doesNotMatch(page.body,/(?:src|href)=["']https?:\/\//);assert.doesNotMatch(page.body,/innerHTML/);
  assert.match(page.headers['content-security-policy'],/connect-src 'self'/);assert.equal(page.headers['x-content-type-options'],'nosniff');
  const script=page.body.match(/<script>([\s\S]*?)<\/script>/)[1];assert.doesNotThrow(()=>new vm.Script(script));
});

test('denies mutations, cross-origin and DNS-rebinding requests',async t=>{
  const {request}=await fixture(t);
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS','HEAD'])assert.equal((await request('/api/latest',{method})).status,405,method);
  assert.equal((await request('/api/latest',{headers:{host:'attacker.example'}})).status,403);
  assert.equal((await request('/api/latest',{headers:{origin:'https://attacker.example'}})).status,403);
  assert.equal((await request('/api/latest',{headers:{'sec-fetch-site':'cross-site'}})).status,403);
});

test('rejects traversal, Windows paths, alternate streams and executable files',async t=>{
  const {request}=await fixture(t);
  for(const url of ['/files/../private.txt','/files/%2e%2e/private.txt','/files/%252e%252e/private.txt','/files/run-001/%2e%2e/%2e%2e/private.txt','/files/run-001%5c..%5c..%5cprivate.txt','/files/C:%5cprivate.txt','/files/run-001/checks.log:secret.txt','/files/run-001/unsafe.html','/files/run-001/./checks.log','/files/run-001/checks.log%00.txt','/files/run-001/checks.log./x.txt']){
    const result=await request(url);assert.equal(result.status,403,url);assert.doesNotMatch(result.body,/PRIVATE/);
  }
  assert.equal((await request('/files/%zz.txt')).status,400);
});

test('rejects directory symlinks and a symlink root',async t=>{
  const {root,base,request}=await fixture(t);
  // Windows junction creation requires no developer-mode or elevated privilege.
  await symlink(base,path.join(root,'escape'),process.platform==='win32'?'junction':'dir');
  assert.equal((await request('/files/escape/private.txt')).status,403);
  await writeFile(path.join(root,'latest.json'),JSON.stringify({id:'escape'}));
  assert.equal((await request('/api/latest')).status,403);
  const linked=path.join(base,'linked-output');await symlink(root,linked,process.platform==='win32'?'junction':'dir');
  const server=createDashboard({root:linked});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/runs');assert.equal(response.status,403);}finally{await new Promise(resolve=>server.close(resolve));}
});

test('empty or partial evidence does not pretend a passing run',async t=>{
  const {root,request}=await fixture(t);
  await rm(path.join(root,'latest.json'));assert.equal((await request('/api/latest')).body,'null');
  await writeFile(path.join(root,'run-001','report.json'),'{');assert.deepEqual(JSON.parse((await request('/api/runs')).body),[]);
  await writeFile(path.join(root,'latest.json'),JSON.stringify({id:'../private'}));assert.equal((await request('/api/latest')).status,403);
});

test('history is bounded to 50 reports',async t=>{
  const {root,request}=await fixture(t);
  for(let i=2;i<=55;i++){const id='run-'+String(i).padStart(3,'0');await mkdir(path.join(root,id));await writeFile(path.join(root,id,'report.json'),JSON.stringify({id,status:'pending'}));}
  const result=JSON.parse((await request('/api/runs')).body);assert.equal(result.length,50);assert.equal(result.some(r=>r.id==='run-001'),false);
});

test('UI renders untrusted labels as text and only creates local evidence links',async t=>{
  const {request}=await fixture(t);
  const page=await request('/');
  const script=page.body.match(/<script>([\s\S]*?)<\/script>/)[1];
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.value='';}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    addEventListener(){}
  }
  const nodes=new Map();
  const context=vm.createContext({document:{getElementById(id){if(!nodes.has(id))nodes.set(id,new Element('div'));return nodes.get(id);},createElement:tag=>new Element(tag)},fetch:()=>new Promise(()=>{}),setTimeout(){},Option:Element});
  vm.runInContext(script,context);
  vm.runInContext(`draw({id:'run-001',head:'<img src=x onerror=alert(1)>',dirty:true,status:'running',lanes:[{id:'ui',title:'<script>attack</script>',status:'failed',steps:[{file:'check',status:'failed',log:'run-001/checks.log',artifacts:['https://outside.example/a.png','../private.txt','capture.png']},{file:'timeout-check',status:'timed_out',artifacts:'run-001/lane/<folder>'},{file:'stopped-check',status:'interrupted',artifacts:null}]}]})`,context);
  const all=[];function visit(n){if(n&&typeof n==='object'){all.push(n);for(const child of n.children||[])visit(child);}}
  for(const n of nodes.values())visit(n);
  assert.ok(all.some(n=>n.textContent==='Source SHA: <img src=x onerror=alert(1)>'));
  assert.ok(all.some(n=>n.textContent==='<script>attack</script>'));
  const links=all.filter(n=>n.tag==='a');assert.deepEqual(links.map(n=>n.href),['/files/run-001/checks.log','/files/run-001/capture.png']);
  assert.ok(all.some(n=>n.textContent==='failed'));
  assert.ok(all.some(n=>n.textContent==='Artifact folder: run-001/lane/<folder>'));
  assert.ok(all.some(n=>n.textContent==='timed_out' && n.className==='badge timed_out'));
  assert.ok(all.some(n=>n.textContent==='interrupted' && n.className==='badge interrupted'));
});
