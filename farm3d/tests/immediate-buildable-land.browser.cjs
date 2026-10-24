const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {start,artifacts}=require('./browser-harness.cjs');
const out=path.join(artifacts,'immediate-buildable-land');fs.mkdirSync(out,{recursive:true});
const report={status:'RUNNING',baseline:null,current:null,errors:[],hosted:false,physicalDevice:false};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
let h,oldSave;
(async()=>{try{
 h=await start({ref:'c6e5df5a9f294a041a9e22dd6b8a96930782cd98',deviceScaleFactor:.5});
 for(const ref of ['baseline','current']){
  if(ref==='current')h.serveRef(null);
  const s=await h.setup({width:1280,height:900},false,'buildable-land-'+ref),p=s.page;
  await p.addInitScript(old=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');if(old&&!localStorage.getItem(old.key))localStorage.setItem(old.key,old.save);},oldSave);
  await p.goto(h.base+'farm3d/index.html?debug&preset=noon');
  await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.evaluate(()=>{__dbg.G.opts.quiet=true;__dbg.G.close();});
  await p.locator('#editBtn').click();
  if(ref==='baseline')await p.evaluate(()=>__dbg.G.save());
  const snapshot=await p.evaluate(()=>{const d=__dbg;return{valid:d.editValid('b:loom',20,-40),blockedTree:d.editValid('b:loom',10,-7),blockedPath:d.editValid('b:loom',1,15),blockedSlope:d.editValid('b:loom',24,-40),grid:d.grid.userData.bounds,tiles:d.grid.userData.tileCount,key:d.G.SAVE_KEY,save:localStorage.getItem(d.G.SAVE_KEY),position:d.BUILD_SPOT.loom};});
  if(ref==='baseline'){assert.equal(snapshot.valid,false);report.baseline=snapshot;oldSave={key:snapshot.key,save:snapshot.save};await s.finish();continue;}
  report.current={before:snapshot};assert.equal(snapshot.valid,true);assert.equal(snapshot.blockedTree,false);assert.equal(snapshot.blockedPath,false);assert.equal(snapshot.blockedSlope,false);
  await p.waitForTimeout(3000); // let the ordinary opening camera animation finish
  await p.evaluate(()=>{const d=__dbg;d.cam.target.set(17,0,-7);d.cam.dist=105;d.cam.pitch=1.53;d.view.target.copy(d.cam.target);d.view.dist=105;d.view.pitch=1.53;d.view.yaw=d.cam.yaw;d.placeCamera(1);d.camera.updateMatrixWorld(true);});
  await p.waitForFunction(()=>__dbg.view.target.distanceTo(__dbg.cam.target)<.03,null,{timeout:12000});
  const screen=await p.evaluate(async()=>{const T=await import('./lib/three.module.min.js'),d=__dbg,point=([x,z])=>{const v=new T.Vector3(x,0,z).project(d.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}};return{from:point(d.BUILD_SPOT.loom),to:point([20,-40])};});
  report.current.screen=screen;assert(screen.from.x>0&&screen.from.x<1280&&screen.from.y>0&&screen.from.y<900);assert(screen.to.x>0&&screen.to.x<1280&&screen.to.y>0&&screen.to.y<900);
  await p.screenshot({path:path.join(out,'before-1280.png')});
  await p.mouse.move(screen.from.x,screen.from.y);await p.mouse.down();await p.mouse.move(screen.to.x,screen.to.y,{steps:12});
  const draft=await p.evaluate(()=>{const d=__dbg.editMode?.drag;return d&&{key:d.key,x:d.x,z:d.z,ok:d.ok,moved:d.moved};});report.current.draft=draft;
  assert(draft&&draft.key==='b:loom'&&draft.x===20&&draft.z===-40&&draft.ok,'actual editor pointer drag reaches a valid newly opened site');
  await p.mouse.up();
  const applied=await p.evaluate(()=>({position:__dbg.BUILD_SPOT.loom,save:localStorage.getItem(__dbg.G.SAVE_KEY),grid:__dbg.grid.userData.bounds}));
  assert.deepEqual(applied.position,[20,-40]);assert.deepEqual(JSON.parse(applied.save).layout.b.loom,[20,-40]);
  const beforeSave=JSON.parse(snapshot.save),afterSave=JSON.parse(applied.save);for(const k of ['coins','gems','xp','level','pens','plots','decor'])assert.deepEqual(afterSave[k],beforeSave[k],k+' from old save stays unchanged');
  assert.deepEqual(afterSave.layout.t,beforeSave.layout.t,'saved near trees stay unchanged');report.current.applied=applied;
  await p.evaluate(()=>{__dbg.cam.target.set(20,0,-40);__dbg.cam.dist=30;__dbg.placeCamera(1);});await p.waitForFunction(()=>__dbg.view.target.distanceTo(__dbg.cam.target)<.03,null,{timeout:12000});
  await p.screenshot({path:path.join(out,'after-1280.png')});
  await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  const reloaded=await p.evaluate(()=>({position:__dbg.BUILD_SPOT.loom,save:localStorage.getItem(__dbg.G.SAVE_KEY)}));assert.deepEqual(reloaded.position,[20,-40]);assert.deepEqual(JSON.parse(reloaded.save).layout.b.loom,[20,-40]);report.current.reloaded=reloaded;
  report.errors=s.errors;assert.deepEqual(report.errors,[]);await s.finish();
  const phone=await h.setup({width:844,height:390},true,'buildable-land-phone');
  await phone.page.addInitScript(old=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem(old.key,old.save);},{key:snapshot.key,save:applied.save});
  await phone.page.goto(h.base+'farm3d/index.html?debug&preset=noon');await phone.page.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await phone.page.evaluate(()=>{__dbg.G.opts.quiet=true;__dbg.G.close();});await phone.page.locator('#editBtn').click();
  await phone.page.evaluate(()=>{const d=__dbg;d.cam.target.set(20,0,-40);d.cam.dist=30;d.view.target.copy(d.cam.target);d.view.dist=30;d.view.pitch=1.53;d.view.yaw=d.cam.yaw;d.placeCamera(1);d.camera.updateMatrixWorld(true);});
  const phoneState=await phone.page.evaluate(()=>({loom:__dbg.BUILD_SPOT.loom,tiles:__dbg.grid.userData.tileCount,editing:!!__dbg.editMode,gridVisible:__dbg.grid.visible}));
  assert.deepEqual(phoneState.loom,[20,-40]);assert(phoneState.editing&&phoneState.gridVisible&&phoneState.tiles>2000);assert.deepEqual(phone.errors,[]);report.current.phone=phoneState;
  await phone.page.screenshot({path:path.join(out,'phone-844x390.png')});await phone.finish();
 }
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=String(e.stack||e);console.error(report.error);}
finally{save();if(h)await h.close(report.status!=='PASS');console.log(JSON.stringify({status:report.status,file:path.join(out,'results.json')}));process.exitCode=report.status==='PASS'?0:1;}})();
