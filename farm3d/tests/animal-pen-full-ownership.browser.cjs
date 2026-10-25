// Real shell/editor/writer integration at maximum ownership. Debug API input;
// viewport emulation and local pinned browser evidence, not native UI qualification.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const out=path.join(artifacts,'full-ownership'),results=path.join(out,'results.json');
if(fs.existsSync(results))throw Error('Do not overwrite an earlier full-ownership run');fs.mkdirSync(out,{recursive:true});
const expected={chicken:30,cow:5,horse:4,sheep:5,dog:1,cat:1};
const report={status:'RUNNING',utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,playwright:require('playwright/package.json').version,viewport:{width:844,height:390,deviceScaleFactor:.5},input:'debug API; no trusted UI claim',steps:[],hashes:Object.fromEntries(['index.html','animal-pen-editor.js','animal-pen-validation.js','animal-pen-runtime.js','game.js'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'farm3d',p))).digest('hex')]))};
const save=()=>fs.writeFileSync(results,JSON.stringify(report,null,2)+'\n');
let h,s,p,stage='launch';save();
const record=(step,value)=>{report.steps.push({step,value});save();};
async function state(){return p.evaluate(()=>{
 const d=__dbg,w=d.penRuntime.world,layout=d.penRuntime.layout,inside=d.animals.filter(a=>a.pen).map(a=>({kind:a.kind,i:a.ref.i,inside:d.inPen(a.pen,a.g.position.x,a.g.position.z,0)}));
 return {revision:d.penRuntime.revision,owned:w.owned,installed:w.installed,actors:w.actors,animalCounts:Object.fromEntries(Object.keys(w.owned).map(k=>[k,d.animals.filter(a=>a.kind===k).length])),inside,sites:Object.fromEntries(Object.entries(layout.sites).map(([k,v])=>[k,{polygon:v.polygon,structures:v.record?.structures??null,components:v.components,custom:v.custom}])),remainingSites:Object.fromEntries(Object.entries(d.remainingSites).map(([k,v])=>[k,{active:v.active,issues:v.issues}])),cowActive:d.cowYardActive,cowIssues:d.cowYardIssues};
 });}
function assertHerd(v){assert.deepEqual(v.owned,expected);assert.deepEqual(v.animalCounts,expected);assert.equal(v.actors.length,46);assert.equal(new Set(v.actors.map(a=>a.id)).size,46);assert(v.actors.every(a=>typeof a.id==='string'&&a.id));assert(Object.values(v.installed).every(Boolean));assert(v.inside.every(a=>a.inside),'animal outside its current pen');assert(v.cowActive);assert.deepEqual(v.cowIssues,[]);for(const [k,site]of Object.entries(v.remainingSites)){assert(site.active,k);assert.deepEqual(site.issues,[],k);}}
(async()=>{try{
 h=await start({deviceScaleFactor:.5});report.browser=await h.setup({width:844,height:390},false,'full-ownership');s=report.browser;delete report.browser;p=s.page;report.browserVersion=s.context.browser().version();save();
 await p.addInitScript(()=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 const ready=()=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 stage='maximum ownership setup';await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready();
 await p.evaluate(()=>{
  const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;G.S.coins=9000;G.S.barnCap=1500;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
  for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Full '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
  G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');if(!G.save())throw Error('Setup save refused');
 });
 const before=await state();record(stage,before);assertHerd(before);
 stage='validate accepted default against full live World';
 const baseline=await p.evaluate(async()=>{const d=__dbg,{validateAnimalPens}=await import('./animal-pen-validation.js?v=4');return validateAnimalPens(d.penRuntime.layout,d.penRuntime.world);});record(stage,baseline);assert.equal(baseline.ok,true,JSON.stringify(baseline.issues));
 stage='fixed chicken yard cardinal moves';
 for(const delta of [[1,0],[-1,0],[0,1],[0,-1]]){
  const result=await p.evaluate(async delta=>{const d=__dbg,e=d.penEditor,before=localStorage.getItem(d.G.SAVE_KEY);if(!e.begin('chicken'))throw Error('Chicken editor failed to open');e.dispatch({type:'movePen',kind:'chicken',delta});const valid=await e.validateNow(),snap=e.snapshot(),applied=await e.apply();e.cancel();return {delta,valid,applied,reason:snap.reason,unchanged:before===localStorage.getItem(d.G.SAVE_KEY),closed:!e.snapshot().open,validation:snap.validation};},delta);
  record(stage,result);assert.equal(result.valid,false);assert.equal(result.applied,false);assert(result.reason);assert(result.unchanged);assert(result.closed);
 }
 stage='apply sheep west one metre with every species owned';
 const applied=await p.evaluate(async()=>{
  const d=__dbg,e=d.penEditor,paid=()=>{const s=structuredClone(d.G.S);delete s.v;if(s.layout)delete s.layout.animalPens;return s;};
  window.__fullOwnershipHerd=d.animals.slice();const previous=localStorage.getItem(d.G.SAVE_KEY),before=paid();if(!e.begin('sheep'))throw Error('Sheep editor failed to open');e.dispatch({type:'movePen',kind:'sheep',delta:[-1,0]});
  const valid=await e.validateNow(),snapshot=e.snapshot(),ok=await e.apply(),raw=JSON.parse(localStorage.getItem(d.G.SAVE_KEY));
  return {valid,reason:snapshot.reason,validation:snapshot.validation,ok,open:e.snapshot().open,v:raw.v,revision:raw.layout?.animalPens?.revision,savedKinds:Object.keys(raw.layout?.animalPens?.sites||{}),changed:previous!==localStorage.getItem(d.G.SAVE_KEY),paidBefore:before,paidAfter:paid()};
 });record(stage,applied);assert.equal(applied.valid,true,applied.reason);assert.equal(applied.ok,true);assert.equal(applied.open,false);assert.equal(applied.v,4);assert.equal(applied.revision,1);assert.deepEqual(applied.savedKinds,['sheep']);assert(applied.changed);assert.deepEqual(applied.paidAfter,applied.paidBefore,'Apply changed equal-clock paid state outside animalPens/writer promotion');
 const after=await state();record('after Apply',after);assertHerd(after);assert.equal(after.sites.sheep.custom,true);assert.deepEqual(after.sites.chicken,before.sites.chicken);assert.deepEqual(after.sites.cow,before.sites.cow);
 for(let i=0;i<before.sites.sheep.polygon.length;i++)assert.deepEqual(after.sites.sheep.polygon[i],[before.sites.sheep.polygon[i][0]-1,before.sites.sheep.polygon[i][1]]);
 await p.screenshot({path:path.join(out,'after-apply.png')});
 stage='same-farm refresh preserves all identities';
 const identity=await p.evaluate(()=>{const d=__dbg;d.G.view.refresh('all');return {count:d.animals.length,same:d.animals.every(a=>window.__fullOwnershipHerd.includes(a))};});record(stage,identity);assert.equal(identity.count,46);assert(identity.same);assertHerd(await state());
 stage='invalid cat edit leaves maximum-ownership save unchanged';
 const refused=await p.evaluate(async()=>{const d=__dbg,e=d.penEditor,before=localStorage.getItem(d.G.SAVE_KEY);e.begin('cat');e.dispatch({type:'movePen',kind:'cat',delta:[40,0]});const valid=await e.validateNow(),ok=await e.apply(),snap=e.snapshot(),unchanged=before===localStorage.getItem(d.G.SAVE_KEY);e.cancel();return {valid,ok,reason:snap.reason,open:snap.open,unchanged,unchangedAfterCancel:before===localStorage.getItem(d.G.SAVE_KEY),closed:!e.snapshot().open};});record(stage,refused);assert.equal(refused.valid,false);assert.equal(refused.ok,false);assert(refused.reason);assert(refused.open);assert(refused.unchanged);assert(refused.unchangedAfterCancel);assert(refused.closed);
 stage='reload restores edited sheep and all46';await p.reload();await ready();const reload=await state();record(stage,reload);assertHerd(reload);assert.equal(reload.revision,1);assert.deepEqual(reload.sites.sheep,after.sites.sheep);assert.deepEqual(reload.sites.chicken,before.sites.chicken);assert.deepEqual(reload.sites.cow,before.sites.cow);
 assert.deepEqual(s.errors,[]);report.status='PASS';
 }catch(error){report.status='FAIL';report.stage=stage;report.error=String(error.stack||error);report.errors=s?.errors;try{report.failureState=await p?.evaluate(()=>({world:__dbg.penRuntime.world,layout:__dbg.penRuntime.layout,editor:__dbg.penEditor.snapshot(),save:localStorage.getItem(__dbg.G.SAVE_KEY),animals:__dbg.animals.map(a=>({kind:a.kind,ref:a.ref,position:a.g.position.toArray(),chickenTask:a.chickenTask&&{kind:a.chickenTask.kind,stage:a.chickenTask.stage,station:a.chickenTask.station?.id},cowTask:a.cowTask&&{kind:a.cowTask.kind,stage:a.cowTask.stage,station:a.cowTask.station?.id},remainingTask:a.remainingTask&&{kind:a.remainingTask.kind,stage:a.remainingTask.stage,station:a.remainingTask.station?.id}}))}));}catch(diagnostic){report.diagnosticError=String(diagnostic);}console.error(report.error);
 }finally{report.finishedUtc=new Date().toISOString();save();if(h)await h.close(report.status!=='PASS');console.log(JSON.stringify({status:report.status,stage,source:report.source,browser:report.browserVersion,results}));process.exitCode=report.status==='PASS'?0:1;}})();
