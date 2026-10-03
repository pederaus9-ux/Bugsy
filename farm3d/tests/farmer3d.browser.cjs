const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {start,artifacts}=require('./browser-harness.cjs');
const findFarmer=()=>{let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});return f;};
const boot=async(page,base,test=true)=>{
 await page.goto(base+'farm3d/?'+(test?'testfarm&':'')+'debug&portrait&shot&sim=0');
 await page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
};
(async()=>{const h=await start(),results=[];let failed=true;
 try{
  for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:390,height:844}]) {
   const {page,errors}=await h.setup(viewport,viewport.width<1000,'farmer-'+viewport.width,viewport.width<1000);
   await boot(page,h.base);
   const initial=await page.evaluate('('+findFarmer.toString()+')().position.toArray()');assert.deepEqual(initial,[-1.8,0,8.4]);
   const hit=await page.evaluate('('+(()=>{
    const d=__dbg;let f;d.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});
    d.renderer.shadowMap.enabled=false;d.camera.position.set(-1.8,1.3,12);d.camera.lookAt(-1.8,1.3,8.4);d.camera.updateMatrixWorld(true);d.scene.updateMatrixWorld(true);
    d.renderer.render(d.scene,d.camera);return d.hitAt(innerWidth/2,innerHeight/2)?.type;
   }).toString()+')()');assert.equal(hit,'farmer');
   // The real pointer route opens the wardrobe, including mobile touch.
   if(viewport.width<1000)await page.touchscreen.tap(viewport.width/2,viewport.height/2);else await page.mouse.click(viewport.width/2,viewport.height/2);
   await page.waitForFunction(()=>!document.getElementById('wardrobe').hidden);
   await page.evaluate(()=>{__dbg.placeCamera();__dbg.renderer.render(__dbg.scene,__dbg.camera);});
   const framing=await page.evaluate(async()=>{
    const T=await import('./lib/three.module.min.js');let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});
    const rig=f.userData.live;f.updateMatrixWorld(true);const points=[rig.head.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.40,0)),...rig.feet.map(x=>x.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,-.12,0)))];
    return points.map(p=>{p.project(__dbg.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
   });
   const closet=await page.locator('.wsheet').boundingBox();
   for(const p of framing){assert.ok(p.x>0&&p.x<viewport.width&&p.y>0&&p.y<viewport.height,'farmer in viewport '+JSON.stringify({p,viewport}));if(closet)assert.ok(!(p.x>closet.x&&p.x<closet.x+closet.width&&p.y>closet.y&&p.y<closet.y+closet.height),'closet covers farmer '+JSON.stringify({p,closet}));}
   await page.screenshot({path:path.join(artifacts,'farmer-wardrobe-'+viewport.width+'.png'),scale:'css'});
   await page.locator('[data-wc="hat"]').click();
   // Real locked buttons and reasons at level 1; rejected selection cannot change the save.
   await page.evaluate(()=>{__dbg.G.S.level=1;__dbg.G.view.wardrobe(false);__dbg.G.view.wardrobe(true);});
   await page.locator('[data-wc="hat"]').click();
   assert.equal(await page.locator('[data-wi="4"]').getAttribute('aria-disabled'),'true');
   assert.match(await page.locator('[data-wi="4"]').innerText(),/Level 12/);
   const oldHat=await page.evaluate(()=>__dbg.G.lookOf().hat);await page.locator('[data-wi="4"]').click({force:true});assert.equal(await page.evaluate(()=>__dbg.G.lookOf().hat),oldHat);
   await page.evaluate(()=>{__dbg.G.S.level=25;__dbg.G.S.unlocks.ssn_spring=true;__dbg.G.view.wardrobe(false);__dbg.G.view.wardrobe(true);});
   const rebuilt=await page.evaluate(()=>{let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});window.__oldFarmer=f.userData.live;let n=0;window.__disposeCount=()=>n;f.userData.live.card.geometry.addEventListener('dispose',()=>n++);return true;});assert.ok(rebuilt);
   for(const cat of ['hair','hairColor','hat','skin','shirt','overallColor','boots','overalls']) {
    await page.locator('[data-wc="'+cat+'"]').click();const count=await page.locator('[data-wi]').count();
    for(let i=0;i<count;i++){const button=page.locator('[data-wi="'+i+'"]');const locked=await button.getAttribute('aria-disabled');await button.click({force:!!locked});if(!locked)assert.equal(await page.evaluate(c=>__dbg.G.lookOf()[c],cat),i);}
   }
   assert.equal(await page.evaluate(()=>__oldFarmer.disposed),true);assert.equal(await page.evaluate(()=>__disposeCount()),1);
   await page.locator('[data-wd]').click();assert.equal(await page.locator('#wardrobe').isHidden(),true);
   const villagers=await page.evaluate(async()=>{
    const d=__dbg,{createLiveVillager,replaceRig}=await import('./live3d.js?v=1');
    const colors={rosa:0xd9788f,joe:0x8a6a48,mia:0xf2c14e,sam:0x4f8a4a,lily:0x8e6bc2};
    return Object.keys(d.G.VILLAGERS).map(id=>{const rig=createLiveVillager(colors[id]||0x9987bd);let meshes=0;rig.g.traverse(o=>{if(o.isMesh)meshes++;});const out={id,meshes,bones:rig.card.skeleton.bones.length,triangles:rig.card.geometry.attributes.position.count/3};rig.dispose();return out;});
   });assert.equal(villagers.length,5);assert.ok(villagers.every(v=>v.meshes===1&&v.bones===15),JSON.stringify(villagers));
   assert.deepEqual(errors,[]);results.push({viewport,framing,villagers,errors});console.log('PASS farmer wardrobe/touch/locks/rebuild/villagers',viewport);
  }
  const saved=await h.setup({width:1280,height:720},false,'farmer-save');await boot(saved.page,h.base,false);
  const look={skin:5,hair:7,hairColor:3,shirt:2,hat:1,overalls:1,overallColor:0,boots:0};
  await saved.page.evaluate(L=>{for(const [cat,i]of Object.entries(L))if(!__dbg.G.wear(cat,i))throw Error('wear '+cat);},look);
  await saved.page.reload();await saved.page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  const restored=await saved.page.evaluate(()=>{let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});return {look:__dbg.G.lookOf(),hair:f.userData.live.hair,skin:f.userData.live.look.skin};});
  assert.deepEqual(restored.look,look);assert.equal(restored.hair,'braids');assert.equal(restored.skin,0x5b3822);assert.deepEqual(saved.errors,[]);results.push({restored});
  fs.writeFileSync(path.join(artifacts,'farmer3d-results.json'),JSON.stringify(results,null,2));failed=false;console.log('PASS farmer saved look hard reload');
 }finally{await h.close(failed);}
})().catch(e=>{console.error(e);process.exit(1);});
