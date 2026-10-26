const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {start,artifacts}=require('./browser-harness.cjs');
const out=path.join(artifacts,'north-clearing-build');fs.mkdirSync(out,{recursive:true});
const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/immediate-buildable-land-20261024/browser-v7/immediate-buildable-land/results.json')));
const saved=prior.current.applied.save,key=prior.current.before.key;
const report={status:'RUNNING',oldRef:'7db138c0ab50e45a9a5d5dc8ebc45c6b7508615a',physicalDevice:false,hosted:false};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
let h;
(async()=>{try{
 h=await start({ref:report.oldRef,deviceScaleFactor:.5});
 for(const phase of ['old','new']){
  if(phase==='new')h.serveRef(null);
  const s=await h.setup({width:1280,height:720},false,'north-clearing-'+phase),p=s.page;
  await p.addInitScript(data=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');if(!localStorage.getItem(data.key))localStorage.setItem(data.key,data.saved);},{key,saved});
  await p.goto(h.base+'farm3d/index.html?debug&preset=noon');await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.evaluate(()=>{__dbg.G.opts.quiet=true;__dbg.G.close();});await p.locator('#editBtn').click();
  const status=await p.evaluate(()=>{const d=__dbg,k=Object.keys(d.G.BUILDINGS);return{workshops:Object.fromEntries(k.map(id=>[id,d.editValid('b:'+id,-28,-40)])),blockedWest:d.editValid('b:loom',-34,-40),blockedNorth:d.editValid('b:loom',-30,-47),blockedTree:d.editValid('b:loom',10,-7),blockedPath:d.editValid('b:loom',1,15),loom:d.BUILD_SPOT.loom,grid:d.grid.userData.bounds,tiles:d.grid.userData.tileCount,gridAtWest:d.grid.userData.tiles.some(t=>t[0]===-28&&t[1]===-40),owned:d.penRuntime.world.owned,save:localStorage.getItem(d.G.SAVE_KEY)};});
  if(phase==='old'){assert.equal(status.workshops.loom,false);assert.equal(status.gridAtWest,false);report.old=status;await s.finish();continue;}
  report.new={before:status};assert.deepEqual(status.loom,[20,-40]);for(const [id,v] of Object.entries(status.workshops))assert.equal(v,true,id+' must fit the same real full footprint');
  assert.equal(status.gridAtWest,true,'neutral grid must reach the newly buildable west ground');
  for(const k of ['blockedWest','blockedNorth','blockedTree','blockedPath'])assert.equal(status[k],false,k);
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{const d=__dbg;d.cam.target.set(-4,0,-40);d.cam.dist=85;d.cam.pitch=1.53;d.view.target.copy(d.cam.target);d.view.dist=85;d.view.pitch=1.53;d.view.yaw=d.cam.yaw;d.placeCamera(1);d.camera.updateMatrixWorld(true);});
  const screen=await p.evaluate(async()=>{const T=await import('./lib/three.module.min.js'),d=__dbg,point=([x,z])=>{const v=new T.Vector3(x,0,z).project(d.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}};return{from:point([20,-40]),to:point([-28,-40])};});report.new.screen=screen;
  for(const v of Object.values(screen))assert(v.x>40&&v.x<1240&&v.y>80&&v.y<640,'real drag stays clear of UI');
  await p.screenshot({path:path.join(out,'before-west-1280.png')});
  await p.mouse.move(screen.from.x,screen.from.y);await p.mouse.down();await p.mouse.move(screen.to.x,screen.to.y,{steps:12});
  const draft=await p.evaluate(()=>{const d=__dbg.editMode?.drag;return d&&{key:d.key,x:d.x,z:d.z,ok:d.ok,moved:d.moved};});report.new.draft=draft;assert(draft&&draft.key==='b:loom'&&draft.x===-28&&draft.z===-40&&draft.ok);
  await p.mouse.up();const applied=await p.evaluate(()=>({loom:__dbg.BUILD_SPOT.loom,save:localStorage.getItem(__dbg.G.SAVE_KEY)}));assert.deepEqual(applied.loom,[-28,-40]);assert.deepEqual(JSON.parse(applied.save).layout.b.loom,[-28,-40]);
  for(const k of ['coins','gems','xp','level','pens','plots','decor'])assert.deepEqual(JSON.parse(applied.save)[k],JSON.parse(status.save)[k],k+' unchanged');report.new.applied=applied;
  await p.evaluate(()=>{const d=__dbg;d.cam.target.set(-28,0,-40);d.cam.dist=30;d.view.target.copy(d.cam.target);d.view.dist=30;d.placeCamera(1);d.camera.updateMatrixWorld(true);});await p.screenshot({path:path.join(out,'after-west-1280.png')});
  await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});const reloaded=await p.evaluate(()=>({loom:__dbg.BUILD_SPOT.loom,save:localStorage.getItem(__dbg.G.SAVE_KEY)}));assert.deepEqual(reloaded.loom,[-28,-40]);assert.deepEqual(JSON.parse(reloaded.save).layout.b.loom,[-28,-40]);report.new.reloaded=reloaded;assert.deepEqual(s.errors,[]);await s.finish();
 }
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=String(e.stack||e);console.error(report.error);}
finally{save();if(h)await h.close(report.status!=='PASS');console.log(JSON.stringify({status:report.status,file:path.join(out,'results.json')}));process.exitCode=report.status==='PASS'?0:1;}})();
