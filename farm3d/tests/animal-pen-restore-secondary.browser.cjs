// Supplemental fault-boundary qualification. Does not replace the original recovery tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const backup=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-edited-recovery-20261025/browser-first/disposable-backup.json')));
const current=structuredClone(backup.farm);current.coins+=17;current.layout.animalPens.revision++;for(const v of current.layout.animalPens.sites.horse.boundary)if(['v0','v3'].includes(v.id))v.x=-36;
backup.weather={mode:'off',lat:null,lon:null,place:'',cur:null,look:'real'};
const keys=['sunny-acres-3d-v1','sa3d-restored','sa3d-dirty','sunny-acres-3d-v1-weather'];
const report={source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),status:'RUNNING',cases:[]};
const write=()=>fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify(report,null,2));
const ready=p=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
const snapshot=p=>p.evaluate(keys=>({farm:JSON.parse(JSON.stringify(__dbg.G.S)),storage:Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),revision:__dbg.penRuntime.revision,polygon:__dbg.remainingLayouts.horse.polygon,ids:__dbg.animals.filter(a=>!a.gone).map(a=>a.kind+':'+(a.ref.i??a.ref.j??0)).sort(),trace:window.__restoreTrace||[]}),keys);
const coherent=s=>{const a=structuredClone(s);delete a.trace;return a;};
let h;
(async()=>{try{
 h=await start({deviceScaleFactor:.25});write();
 for(const [i,target]of keys.slice(1).entries()){
  const session=await h.setup({width:844,height:390},true,'secondary-'+i),p=session.page;const item={target,status:'RUNNING'};report.cases.push(item);write();
  try{
   await p.addInitScript(({current,now})=>{Date.now=()=>now;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');if(!sessionStorage.getItem('secondary-fixture')){localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(current));sessionStorage.setItem('secondary-fixture','1');}},{current,now:backup.at});
   await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready(p);await p.evaluate(()=>{__dbg.G.close();__dbg.G.save();localStorage.removeItem('sa3d-restored');localStorage.removeItem('sa3d-dirty');});
   item.before=await snapshot(p);assert.equal(item.before.ids.length,46);assert.equal(new Set(item.before.ids).size,46);
   await p.evaluate(target=>{window.__restoreOriginalSet=Storage.prototype.setItem;window.__restoreTrace=[];Storage.prototype.setItem=function(k,v){window.__restoreTrace.push({key:k,completed:false});if(k===target)throw new DOMException('Secondary restore fixture quota','QuotaExceededError');const r=window.__restoreOriginalSet.call(this,k,v);window.__restoreTrace.at(-1).completed=true;return r;};},target);
   await p.locator('#restoreInput').setInputFiles({name:'edited-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await p.waitForFunction(()=>__dbg.G.panel?.type==='confirm',null,{timeout:10000});await p.locator('[data-act="confirmYes"]').click();await p.waitForFunction(()=>document.body.textContent.includes("Couldn't restore"),null,{timeout:10000});
   item.afterRefusal=await snapshot(p);try{assert.deepEqual(coherent(item.afterRefusal),coherent(item.before),'secondary failure must preserve exact durable/live state');item.status='PASS';}catch(e){item.status='FAIL';item.error=e.message;}
   await p.evaluate(()=>{Storage.prototype.setItem=window.__restoreOriginalSet;window.__ordinarySaveResult=__dbg.G.save();});item.afterOrdinarySave=await snapshot(p);item.ordinarySaveReturned=await p.evaluate(()=>window.__ordinarySaveResult);item.errors=session.errors;
   await p.screenshot({path:path.join(artifacts,'secondary-'+i+'-after-save.png')});write();console.log(item.status+' '+target+'; ordinary save '+item.ordinarySaveReturned);
  }finally{await session.finish(item.status!=='PASS');}
 }
 report.status=report.cases.every(c=>c.status==='PASS')?'PASS':'FAIL';
}catch(e){report.status='ERROR';report.error=String(e.stack||e);console.error(report.error);}finally{write();if(h)await h.close();process.exitCode=report.status==='PASS'?0:1;console.log(JSON.stringify({status:report.status,cases:report.cases.map(c=>({target:c.target,status:c.status}))}));}})();
