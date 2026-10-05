// Regular-link farm integration and the same 3D rig in the owner's standalone preview.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start(),results=[];let failed=true;
 try{
  for(const viewport of [{width:740,height:360},{width:844,height:390},{width:1280,height:720}]){
   const s=await h.setup(viewport,true,'cow3d-'+viewport.width,viewport.width<1000),{page,errors}=s;
   await page.goto(h.base+'farm3d/?testfarm&debug&portrait&shot&sim=0');
   await page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
   const integration=await page.evaluate(()=>{
    const d=__dbg,before=localStorage.getItem('sunny-acres-3d-v1');d.G.opts.quiet=true;d.renderer.shadowMap.enabled=false;
    const types=d.animals.map(a=>({kind:a.kind,real3d:!!a.rig3d}));
    const a=d.animals.find(a=>a.kind==='cow');
    // Live path has no painted animal. .card remains the skinned-mesh hit proxy used by hitAt.
    if(!a||!a.rig3d||!a.card||!a.card.isSkinnedMesh) throw new Error('live cow rig missing');
    const meshes=[]; a.g.traverse(o=>{ if(o.isMesh) meshes.push(o.isSkinnedMesh?'skinned':(o.geometry&&o.geometry.type)||'mesh'); });
    const visuals=d.animals.filter(x=>x.kind==='cow').map(c=>{
      const parts=[]; c.g.traverse(o=>{ if(o.isMesh||o.isSprite) parts.push({type:o.type,name:o.name,skinned:!!o.isSkinnedMesh,geo:o.geometry&&o.geometry.type,map:!!(o.material&&o.material.map),emissiveMap:!!(o.material&&o.material.emissiveMap)}); });
      return {parts,proxy:c.card===c.rig3d.card,skinned:!!(c.card&&c.card.isSkinnedMesh)};
    });
    const lighting=['noon','golden','rain','snow','night'].map(preset=>{d.setPreset(preset);return {preset,cowEmissive:a.card.material.emissive.toArray()};});
    a.mode='fair';a.until=9e15;a.act='idle';a.doing=null;a.need={hunger:0,tired:0,lonely:0};
    a.go(a.g.position.x+.9,a.g.position.z+.6,false,'Test stroll');
    const start=a.rig3d.state.distance;let distance=0;
    for(let i=0;i<120;i++){const x=a.g.position.x,z=a.g.position.z;a.update(1/60,d.clock());distance+=Math.hypot(a.g.position.x-x,a.g.position.z-z);}
    const measured=a.rig3d.state.distance-start;
    const x=a.g.position.x,z=a.g.position.z,fit=a.fit;a.fit=v=>v.set(x,z);a.target=a.pos.addScalar(5);a.until=9e15;
    const phase=a.rig3d.state.phase;for(let i=0;i<180;i++)a.update(1/60,d.clock());a.fit=fit;
    // Pick the real rig from a clear test position: nearby roaming animals can
    // legitimately occlude this cow in its pen and win the same center ray.
    a.g.position.set(40,0,40);d.camera.position.set(42,1.6,37);d.camera.lookAt(40,.9,40);d.camera.updateMatrixWorld(true);d.scene.updateMatrixWorld(true);
    const hit=d.hitAt(innerWidth/2,innerHeight/2);
    return {types,lighting,meshes,visuals,distance,measured,phase,afterPhase:a.rig3d.state.phase,amount:a.rig3d.state.amount,hit:hit?.type,kind:hit?.an?.kind,savePreserved:localStorage.getItem('sunny-acres-3d-v1')===before};
   });
   const live=new Set(['cow','sheep','horse','dog','cat','chicken']);
   assert.ok(integration.types.some(a=>a.kind==='cow'&&a.real3d));
   for(const a of integration.types)assert.equal(a.real3d,live.has(a.kind));
   // One skinned visual. The ground contact decal and mood sprites are not picture cards.
   assert.ok(integration.visuals.every(v=>v.skinned&&v.proxy),'hit proxy is the live skinned mesh');
   assert.ok(integration.visuals.every(v=>v.parts.filter(p=>p.skinned).length===1),'exactly one skinned cow visual');
   assert.ok(integration.visuals.every(v=>v.parts.filter(p=>p.geo==='PlaneGeometry').length===1),'only the contact decal, no picture card');
   for(const l of integration.lighting)assert.deepEqual(l.cowEmissive,[0,0,0],'3D coat must not inherit untextured picture glow');
   assert.ok(integration.distance>.01);assert.ok(Math.abs(integration.distance-integration.measured)<1e-8);
   assert.equal(integration.phase,integration.afterPhase);assert.ok(integration.amount<1e-10);assert.equal(integration.hit,'animal');assert.equal(integration.kind,'cow');assert.ok(integration.savePreserved);
   assert.deepEqual(errors,[]);console.log('PASS 3D cow farm travel, blocking, picking and sandbox save',viewport.width);
   await page.goto(h.base+'farm3d/characters3d.html?capture&debug');await page.waitForFunction(()=>window.cowPreview,null,{timeout:30000});
   for(const mode of ['idle','walk','run','eat']){
    await page.locator('[data-mode="'+mode+'"]').click();
    const check=await page.evaluate(()=>{for(let i=0;i<180;i++)cowPreview.step(1/60);const c=cowPreview.cow;return {amount:c.state.amount,distance:c.state.distance,run:c.state.run,bones:c.card.skeleton.bones.length,angle:c.neck.rotation.x};});
    assert.equal(check.bones,24);if(mode==='walk'||mode==='run')assert.ok(check.amount>.99);else assert.ok(check.amount<.01);
    if(mode==='run')assert.ok(check.run>.99);if(mode==='eat')assert.ok(check.angle<-.4);
   }
   const angles=await page.evaluate(async()=>{
    const THREE=await import('./lib/three.module.min.js'),v=cowPreview,c=v.cow,p=new THREE.Vector3();
    // Genuine geometry remains pickable from the front, flank and rear.
    return [0,Math.PI/2,Math.PI].map(yaw=>{v.setView(-c.model.rotation.y+yaw);v.scene.updateMatrixWorld(true);v.camera.updateMatrixWorld(true);const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),v.camera);const hits=ray.intersectObject(c.card);return {yaw,hits:hits.length};});
   });
   assert.ok(angles.every(a=>a.hits>0));
   const replaced=await page.evaluate(async()=>{
    const THREE=await import('./lib/three.module.min.js'),{createCow3D}=await import('./cow3d.js?v=3'),{replaceRig}=await import('./live3d.js?v=2');
    const parent=new THREE.Group(),first=createCow3D(1.7,0,0,'A'),next=createCow3D(1.7,1,1,'B');
    parent.add(first.g); const out=replaceRig(parent,first,next);
    const meshes=[]; next.g.traverse(o=>{ if(o.isMesh) meshes.push(o.isSkinnedMesh?'skinned':o.geometry.type); });
    return {disposed:first.disposed===true,children:parent.children.length,same:out===next,meshes,proxy:next.card&&next.card.isSkinnedMesh};
   });
   assert.equal(replaced.disposed,true);assert.equal(replaced.children,1);assert.equal(replaced.same,true);assert.deepEqual(replaced.meshes,['skinned']);assert.equal(replaced.proxy,true);
   // Send actual pointer events, checking that the orbit input changes the view.
   const before=await page.evaluate(()=>cowPreview.camera.position.toArray());
   await page.mouse.move(400,160);await page.mouse.down();await page.mouse.move(500,180);await page.mouse.up();
   const after=await page.evaluate(()=>cowPreview.camera.position.toArray());assert.notDeepEqual(after,before);
   const fit=await page.locator('header,footer,button,a').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));assert.ok(fit);
   const cost=await page.evaluate(async()=>{
    const THREE=await import('./lib/three.module.min.js'),{updateCow3D}=await import('./cow3d.js?v=3'),v=cowPreview,r=v.renderer,c=v.cow;
    const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x707050,1));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(2,5,-4);sun.castShadow=true;sc.add(sun);
    c.g.position.set(0,0,0);c.model.rotation.set(0,0,0);v.camera.position.set(3,2,-4);v.camera.lookAt(0,.85,0);
    const tex=await new THREE.TextureLoader().loadAsync('art/cow.webp');tex.colorSpace=THREE.SRGBColorSpace;
    const geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);const card=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,alphaTest:.4,side:THREE.DoubleSide}));card.scale.set(1.7,1.7,1);card.lookAt(3,0,-4);
    const shadow=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));shadow.scale.copy(card.scale);shadow.rotation.y=Math.atan2(sun.position.x,sun.position.z);shadow.castShadow=true;shadow.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:tex,alphaTest:.4});
    const counts=[];r.info.autoReset=false;
    for(const shadows of [false,true]){
      r.shadowMap.enabled=shadows;sc.add(card,shadow);r.info.reset();r.render(sc,v.camera);const baseline={calls:r.info.render.calls,triangles:r.info.render.triangles};sc.remove(card,shadow);
      sc.add(c.g);r.info.reset();r.render(sc,v.camera);const prototype={calls:r.info.render.calls,triangles:r.info.render.triangles};
      const resources={geometries:r.info.memory.geometries,textures:r.info.memory.textures};
      const start=performance.now();for(let i=0;i<2000;i++)updateCow3D(c,0,0,1/60,i/60);const updateMs=(performance.now()-start)/2000;
      r.info.reset();r.render(sc,v.camera);const stable=resources.geometries===r.info.memory.geometries&&resources.textures===r.info.memory.textures;
      counts.push({shadows,baseline,prototype,resources,stable,updateMs});sc.remove(c.g);
    }
    r.info.autoReset=true;r.shadowMap.enabled=false;v.scene.add(c.g);v.draw();geo.dispose();card.material.dispose();shadow.material.dispose();shadow.customDepthMaterial.dispose();tex.dispose();return counts;
   });
   for(const c of cost){assert.ok(c.prototype.calls<=c.baseline.calls);assert.ok(c.prototype.triangles/(c.shadows?2:1)<15000);assert.ok(c.stable);}
   assert.deepEqual(errors,[]);results.push({viewport,integration,angles,cost});console.log('PASS 3D preview controls, orbit, geometry and cost',viewport.width,JSON.stringify(cost));await s.finish();
  }
  const fallback=await h.setup({width:844,height:390},true,'cow2d-fallback');
  await fallback.page.goto(h.base+'farm3d/?testfarm&debug&portrait&shot&sim=0&characters2d');
  await fallback.page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  const old=await fallback.page.evaluate(()=>{
    const d=__dbg,picture=d.animals.find(a=>!a.rig3d),cow=d.animals.find(a=>a.kind==='cow');
    const glow=['noon','golden','rain','snow','night'].map(preset=>{d.setPreset(preset);return picture?picture.card.material.emissiveIntensity:0;});
    return {cows:d.animals.filter(a=>a.kind==='cow').map(a=>({rig:!!a.rig3d,card:!!a.card})),other3d:d.animals.some(a=>!!a.rig3d),save:localStorage.getItem('sunny-acres-3d-v1'),glow,picture:!!picture,cowCard:!!(cow&&cow.card)};
  });
  assert.ok(old.cows.length>0);assert.ok(old.cows.every(a=>!a.rig&&a.card));assert.equal(old.other3d,false);assert.equal(old.cowCard,true);assert.equal(old.picture,true);assert.ok(old.glow.every(v=>v>0));assert.equal(old.save,null);assert.deepEqual(fallback.errors,[]);
  console.log('PASS optional painted-cow comparison and sandbox save');await fallback.finish();
  fs.writeFileSync(path.join(artifacts,'cow3d-results.json'),JSON.stringify(results,null,2));failed=false;
 }finally{await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});
