// Real page controls on disposable farms. External services are blocked by the
// existing harness. CSS sizes are exact; its declared drawing scale is 0.5.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const out=path.join(artifacts,'seed-selection');fs.mkdirSync(out,{recursive:true});
const receipt={status:'RUNNING',drawingScale:.5,physicalDeviceTest:false,results:[],screenshots:[]};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(receipt,null,2)+'\n');
function passed(name,details){receipt.results.push({name,pass:true,details});save();console.log('PASS',name);}
async function state(p){return p.evaluate(()=>({crop:__dbg.G.S.plots.map(p=>p.crop),coins:__dbg.G.S.coins,wheat:__dbg.G.have('wheat'),corn:__dbg.G.have('corn'),armed:__dbg.armed,picker:!document.getElementById('seedTray').hidden,tool:!document.getElementById('seedTool').hidden}));}
async function focusPlot(p,i,label){
  await p.evaluate(i=>{const d=__dbg,v=d.plots[i].g.position,w=d.walk;w.pos.set(v.x,v.z+1.7);w.vel.set(0,0);w.yaw=0;w.pitch=-Math.atan2(1.6,1.7);},i);
  await p.waitForFunction(({i,label})=>{const d=__dbg,h=d.hitAt(innerWidth/2,innerHeight/2),b=document.getElementById('actBtn');
    return h?.type==='plot'&&h.i===i&&!b.hidden&&b.getAttribute('aria-label')===label;},{i,label},{timeout:30000});
}
async function boot(p,base,sandbox){
  await p.addInitScript(()=>localStorage.setItem('sa3d-pov','eyes'));
  await p.goto(base+'farm3d/?debug&portrait&preset=noon'+(sandbox?'&testfarm':''));
  await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  if(!sandbox){if(await p.locator('#authGuest').isVisible())await p.locator('#authGuest').click();await p.waitForFunction(()=>saAuth.guest&&document.getElementById('authGate').hidden);}
  await p.evaluate(()=>{const G=__dbg.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;});
}
async function take(p,width,name){const file=name+'-'+width+'.png';await p.screenshot({path:path.join(out,file)});receipt.screenshots.push(file);save();}
let harness,failed=true,stage='start';save();
(async()=>{
try{
  harness=await start();
  for(const [width,height,touch] of [[740,360,true],[844,390,true],[1280,720,false]]){
    stage=width+' disposable test farm';const s=await harness.setup({width,height},touch,'seed-selection-'+width),p=s.page;
    await boot(p,harness.base,true);
    await p.evaluate(()=>{const G=__dbg.G;G.S.coins=10;G.S.barn={wheat:2,corn:1};G.S.gold={};for(const f of G.S.plots)Object.assign(f,{crop:null,end:0,water:0});G.view.refresh('all');});
    await p.locator('#walkBtn').click();await p.waitForFunction(()=>!!__dbg.walk);
    await focusPlot(p,0,'Plant');await p.locator('#actBtn').click();await p.waitForFunction(()=>!document.getElementById('seedTray').hidden);
    await p.locator('[data-crop="wheat"]').click();await p.waitForFunction(()=>document.getElementById('seedTray').hidden&&!document.getElementById('seedTool').hidden);
    let a=await state(p);assert.equal(a.crop[0],'wheat');assert.equal(a.wheat,1);assert.equal(a.coins,10);assert.equal(a.armed,'wheat');
    const bounds=await p.locator('#seedChoice').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,reachable:!!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('#seedChoice')};});
    assert(bounds.w>=44&&bounds.h>=44&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.w<=width&&bounds.y+bounds.h<=height&&bounds.reachable);
    passed(width+' first selection plants, closes and visibly equips without another charge',{state:a,bounds});await take(p,width,'equipped-wheat');
    const before=await p.evaluate(()=>({x:__dbg.walk.pos.x,y:__dbg.walk.pos.y}));
    await p.keyboard.down('KeyW');try{await p.waitForFunction(before=>Math.hypot(__dbg.walk.pos.x-before.x,__dbg.walk.pos.y-before.y)>.05,before,{timeout:30000});}finally{await p.keyboard.up('KeyW');}
    assert.equal((await state(p)).armed,'wheat');passed(width+' ordinary movement keeps the seed equipped');
    await focusPlot(p,1,'Plant Wheat');await p.locator('#actBtn').dblclick();
    a=await state(p);assert.equal(a.crop[1],'wheat');assert.equal(a.wheat,0);assert.equal(a.coins,10);assert.equal(a.picker,false);
    assert.equal((await state(p)).coins,10,'a double press cannot charge a growing plot');
    passed(width+' next plot plants directly and a repeated press cannot charge it again',a);
    await focusPlot(p,2,'Plant Wheat');await p.locator('canvas').first().focus();await p.keyboard.press('KeyE');
    a=await state(p);assert.equal(a.crop[2],'wheat');assert.equal(a.coins,9);
    await focusPlot(p,3,'Plant Wheat');await p.keyboard.press('Enter');
    a=await state(p);assert.equal(a.crop[3],'wheat');assert.equal(a.coins,8);passed(width+' E and Enter retain the native seed coin prices',a);
    const prior=await state(p);await p.locator('#seedChoice').click();await p.waitForFunction(()=>!document.getElementById('seedTray').hidden);
    await p.locator('[data-crop="corn"]').click();a=await state(p);
    assert.deepEqual(a.crop,prior.crop);assert.equal(a.coins,prior.coins);assert.equal(a.armed,'corn');assert.equal(a.picker,false);
    await focusPlot(p,4,'Plant Corn');await p.locator('#actBtn').click();a=await state(p);
    assert.equal(a.crop[4],'corn');assert.equal(a.corn,0);assert.equal(a.coins,8);passed(width+' changing seed only equips it, then Plant uses that crop',a);
    await take(p,width,'equipped-corn');
    await p.evaluate(()=>{__dbg.G.S.coins=0;});await focusPlot(p,5,'Plant Corn');await p.locator('#actBtn').click();a=await state(p);
    assert.equal(a.crop[5],null);assert.equal(a.coins,0);assert.equal(a.corn,0);assert.equal(a.armed,'corn');assert.equal(a.picker,false);
    passed(width+' unavailable seeds and coins leave the plot unchanged and seed equipped',a);
    await p.locator('#seedPutAway').click();await p.waitForFunction(()=>__dbg.armed===null&&document.getElementById('seedTool').hidden);
    await focusPlot(p,5,'Plant');await p.locator('#actBtn').click();await p.waitForFunction(()=>!document.getElementById('seedTray').hidden);
    passed(width+' put away returns Plant to the chooser');await take(p,width,'seed-picker');
    assert.equal(await p.evaluate(()=>localStorage.getItem(__dbg.G.SAVE_KEY)),null,'test farm never creates a user save');
    assert.deepEqual(s.errors,[]);await s.finish();
  }
  stage='normal disposable guest save/reload';
  const s=await harness.setup({width:844,height:390},true,'seed-selection-normal-save'),p=s.page;
  await boot(p,harness.base,false);await p.locator('#walkBtn').click();await p.waitForFunction(()=>!!__dbg.walk);
  await focusPlot(p,0,'Plant');await p.locator('#actBtn').click();await p.locator('[data-crop="wheat"]').click();
  const before=await state(p);assert.equal(before.armed,'wheat');assert.equal(before.crop[0],'wheat');
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem(__dbg.G.SAVE_KEY)));
  assert.equal(saved.v,1);assert.equal(saved.plots[0].crop,'wheat');assert.equal(saved.armed,undefined);assert.equal(saved.pendingPlot,undefined);
  await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading')&&window.saAuth?.guest,null,{timeout:90000});
  const after=await state(p);assert.equal(after.crop[0],'wheat');assert.equal(after.wheat,before.wheat);assert.equal(after.coins,before.coins);assert.equal(after.armed,null);assert.equal(after.tool,false);
  assert.deepEqual(s.errors,[]);passed('normal guest save retains planted progress; equipment resets only on new page session',{before,after});await s.finish();
  failed=false;receipt.status='PASS';save();
}catch(error){receipt.status='FAIL';receipt.stage=stage;receipt.error=String(error.stack||error);save();throw error;}
finally{if(harness)await harness.close(failed);}
})().catch(error=>{console.error(error);process.exitCode=1;});
