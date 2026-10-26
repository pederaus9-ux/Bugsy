// A35 supplemental integrity scenario. This does NOT replace recovery.browser.cjs:
// its original before-reload 30s timing failure remains a distinct release result.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const K='sunny-acres-3d-v1',damaged='{"a27 quota cut',out=path.resolve(__dirname,'../artifacts/quota-state-integrity.json');
const cowProgress=o=>{const c=o.pens?.cow?.care;return c?[c.feed,c.waterUntil,c.tank,c.queue,c.job,c.receipts,c.cows.map(b=>[b.id,b.cycle,b.ready]),o.gold?.milk,o.decor]:null;};
// Same progress comparison as the original recovery suite; cloud remains byte-exact.
const progress=raw=>{try{const o=JSON.parse(raw);return JSON.stringify([o.__sentinel,o.level,o.xp,o.coins,o.gems,o.barn,o.plots&&o.plots.length,o.stats,cowProgress(o),o.layout?.animalPens,o.pens?.horse,o.v]);}catch{return'unreadable';}};
function sentFarmWrites(body){
 const parsed=[];try{parsed.push(JSON.parse(body));}catch{}
 for(const v of new URLSearchParams(body).values())try{parsed.push(JSON.parse(v));}catch{}
 const writes=[];function visit(v){if(!v||typeof v!=='object')return;if(Array.isArray(v.writes))for(const w of v.writes)if(/\/farms\//.test(w.update?.name||''))writes.push(w.update.fields?.save?.stringValue);for(const x of Object.values(v))if(x&&typeof x==='object')visit(x);}
 parsed.forEach(visit);return writes;
}
function assertBlocked(base,samples,state,writes,uploads){
 assert(samples.length>0,'nonvacuous cloud observation');
 for(const sample of samples)assert.deepEqual(sample,base,'cloud bytes/revision changed during quota refusal');
 assert.equal(state.recover,'1');assert.equal(state.raw,damaged);assert.equal(writes.length,0,'a farm upload was sent during unresolved recovery');assert.equal(uploads,0,'an upload completed during unresolved recovery');
}
function controls(){
 const base={save:'{"__sentinel":"known"}',rev:3},state={recover:'1',raw:damaged};assertBlocked(base,[base],state,[],0);
 for(const args of [[base,[{...base,save:'changed'}],state,[],0],[base,[{...base,rev:4}],state,[],0],[base,[base],{...state,recover:null},[],0],[base,[base],{...state,raw:'{}'},[],0],[base,[base],state,['{}'],0],[base,[base],state,[],1],[base,[],state,[],0]])assert.throws(()=>assertBlocked(...args));
 const write={writes:[{update:{name:'projects/demo-sunny-acres/databases/(default)/documents/farms/disposable',fields:{save:{stringValue:'unsafe'}}}}]};
 assert.deepEqual(sentFarmWrites(JSON.stringify(write)),['unsafe']);assert.deepEqual(sentFarmWrites(new URLSearchParams({'req0___data__':JSON.stringify(write)}).toString()),['unsafe']);assert.deepEqual(sentFarmWrites('database=demo&count=0'),[]);
 return 10;
}
async function main(){
 const {startEmu,readDoc,resetEmulators,fsUrl,PROJECT,FS}=require('./emu-harness.cjs');
 assert.equal(PROJECT,'demo-sunny-acres');assert(/^127\.0\.0\.1:/.test(FS));
 const backup=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../tests/evidence/pen-editing-implementation/task8-codex-edited-recovery-20261025/browser-first/disposable-backup.json')));
 const report={status:'RUNNING',scenario:'supplemental fresh-context state integrity',originalTimingResult:'NOT_REPLACED_OR_REQUALIFIED',checks:[],controls:controls()};let E,stage='setup';
 const save=()=>{fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));};
 const pass=name=>{report.checks.push({name,ok:true});save();console.log('PASS '+name);};
 const cloud=async uid=>{const d=await readDoc('farms/'+uid);return d?{save:d.save,rev:d.rev}:null;};save();
 try{
  await resetEmulators();E=await startEmu();const setup=await E.phone('quota-a35-setup');await setup.context.addInitScript(now=>{Date.now=()=>now;},backup.at);
  const uid=await E.register(setup,'quota-a35@example.com');
  // Test-only emulator identity is transferred in memory, never written to a fixture.
  const state=await setup.context.storageState({indexedDB:true});
  assert(state.origins.every(o=>o.origin===new URL(E.base).origin),'only disposable localhost origin may transfer');
  await setup.context.close();assert.equal(E.browser.contexts().length,0,'preparation renderer fully closed before this separate scenario');
  const farm=structuredClone(backup.farm);farm.__sentinel='a35-quota-disposable';const base={save:JSON.stringify(farm),rev:7};
  const seeded=await fetch(fsUrl('farms/'+uid),{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{save:{stringValue:base.save},level:{integerValue:String(farm.level)},coins:{integerValue:String(farm.coins)},rev:{integerValue:String(base.rev)},updatedAt:{integerValue:String(backup.at)}}})});assert(seeded.ok,'disposable cloud seed refused');assert.deepEqual(await cloud(uid),base);
  const origin=state.origins.find(o=>o.origin===new URL(E.base).origin);assert(origin,'authenticated localhost storage exists');
  const values=new Map(origin.localStorage.map(x=>[x.name,x.value]));values.set(K,damaged);for(const k of ['sa3d-dirty','sa3d-boot','sa3d-recover','__corrupt_once'])values.delete(k);origin.localStorage=[...values].map(([name,value])=>({name,value}));
  const p={name:'quota-a35-fresh',context:await E.browser.newContext({viewport:{width:640,height:360},deviceScaleFactor:.25,serviceWorkers:'block',storageState:state}),page:null};
  await p.context.addInitScript(({key,now})=>{Date.now=()=>now;window.__quotaUploads=0;addEventListener('sa3d:uploaded',()=>window.__quotaUploads++);if(sessionStorage.getItem('a35-writable')!=='1'){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key&&v!=='{"a27 quota cut')throw new DOMException('A35 fixture quota','QuotaExceededError');return set.call(this,k,v);};}},{key:K,now:backup.at});
  await E.newPage(p);assert.equal(p.page.url(),'about:blank');assert.equal(p.context.pages().length,1);
  const writes=[];p.page.on('request',r=>{if(r.url().startsWith('http://'+FS+'/'))writes.push(...sentFarmWrites(r.postData()||''));});
  stage='fresh first navigation and refusal';const started=performance.now();
  const refusal=p.page.waitForEvent('console',{predicate:m=>m.text().includes("Couldn't put the cloud farm on this phone"),timeout:30000});void refusal.catch(()=>{});
  await p.page.goto(E.base+'farm3d/?debug',{waitUntil:'load'});await refusal;
  report.refusalMs=performance.now()-started;pass('fresh context refuses unwritable primary storage within original30s budget');
  stage='25-second unchanged cloud and pending-state observation';const samples=[],t0=Date.now();while(Date.now()-t0<25000){samples.push(await cloud(uid));await new Promise(r=>setTimeout(r,1000));}
  const blocked=await E.P(p,key=>({recover:localStorage.getItem('sa3d-recover'),raw:localStorage.getItem(key),uploads:window.__quotaUploads}),K);
  assertBlocked(base,samples,blocked,writes,blocked.uploads);report.observationMs=Date.now()-t0;report.samples=samples.length;report.attemptedWrites=writes.length;pass('25s preserves exact cloud revision/bytes, damaged local bytes and pending recovery with zero uploads');
  stage='storage writable recovery';await E.P(p,()=>sessionStorage.setItem('a35-writable','1'));await p.page.reload({waitUntil:'load'});
  await p.page.waitForFunction(()=>window.__ready&&window.__dbg&&window.__dbg.G.S&&window.saAuth&&window.saAuth.user,null,{timeout:180000,polling:250});
  const restored=await E.P(p,key=>({recover:localStorage.getItem('sa3d-recover'),raw:localStorage.getItem(key)}),K);
  assert.equal(restored.recover,null);assert.equal(progress(restored.raw),progress(base.save));assert.equal((await cloud(uid)).save,base.save);pass('recovery succeeds when storage is writable with original progress and exact cloud preservation assertions');
  report.status='PASS';
 }catch(e){report.status='FAIL';report.failure={stage,type:e.name};console.error('FAIL supplemental quota integrity: '+stage+' ('+e.name+')');process.exitCode=1;}
 finally{save();if(E)await E.close();console.log('SUPPLEMENTAL QUOTA INTEGRITY '+report.status);}
}
if(require.main===module){if(process.argv.includes('--controls'))console.log('PASS '+controls()+' supplemental predicate/parser controls');else main().catch(e=>{console.error('Supplemental setup failed ('+e.name+')');process.exitCode=1;});}
module.exports={assertBlocked,sentFarmWrites,progress,controls};
