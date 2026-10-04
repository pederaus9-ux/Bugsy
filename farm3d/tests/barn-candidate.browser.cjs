const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;const results=[];
try {
 for(const width of (process.env.ART_WIDTH ? [Number(process.env.ART_WIDTH)] : [844,1280])) {
  const session=await h.setup({width,height:width===844?390:720},width===844,'barn-candidate-'+width),p=session.page;
  await p.goto(h.base+'farm3d/?testfarm&debug&portrait&preset=noon');
  await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  await p.evaluate(()=>{const d=__dbg;d.G.opts.quiet=true;d.G.close();d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;});
  await p.waitForTimeout(1500);
  await p.screenshot({path:path.join(artifacts,'barn-'+width+'-before.png'),scale:'css'});
  const model=await p.evaluate(async()=>{
   const {GLTFLoader}=await import('./lib/addons/loaders/GLTFLoader.js'),T=await import('./lib/three.module.min.js');
   const result=await new GLTFLoader().loadAsync('./assets/barn/barn-candidate.glb');
   let meshes=0,triangles=0;result.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.castShadow=o.receiveShadow=true;}});
   window.__barnCandidate=result.scene;__dbg.scene.add(result.scene);__dbg.barn.visible=false;
   const bounds=new T.Box3().setFromObject(result.scene);
   return {meshes,triangles,min:bounds.min.toArray(),max:bounds.max.toArray(),root:!!result.scene.getObjectByName('SunnyBarn')};
  });
  assert.equal(model.root,true);assert.equal(model.meshes,4);assert.ok(model.triangles<30000);
  await p.waitForTimeout(1500);
  await p.screenshot({path:path.join(artifacts,'barn-'+width+'-after.png'),scale:'css'});
  // Same camera/state/light, toggled in place. Live ambient poses can still differ.
  const resources=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js');
   const cam=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,600);cam.position.set(12,6,17);cam.lookAt(0,3.7,0);
   d.renderer.render(d.scene,cam);const candidate={...d.renderer.info.render};
   d.barn.visible=true;__barnCandidate.visible=false;d.renderer.render(d.scene,cam);const before={...d.renderer.info.render};
   d.barn.visible=false;__barnCandidate.visible=true;d.renderer.render(d.scene,cam);const initial={...d.renderer.info.memory};
   // A single hide/show pair checks stable visibility; lifetime disposal below is the key gate.
   __barnCandidate.visible=false;d.renderer.render(d.scene,cam);__barnCandidate.visible=true;d.renderer.render(d.scene,cam);
   const cycled={...d.renderer.info.memory};
   // Direct actual-renderer hero view. Excludes compositor; labeled separately.
   __barnCandidate.visible=false;d.barn.visible=true;d.renderer.render(d.scene,cam);const a=d.renderer.domElement.toDataURL();
   __barnCandidate.visible=true;d.barn.visible=false;d.renderer.render(d.scene,cam);const b=d.renderer.domElement.toDataURL();
   const geometries=new Set(),materials=new Set();__barnCandidate.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});
   d.scene.remove(__barnCandidate);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();d.barn.visible=true;d.renderer.render(d.scene,cam);
   return {before,candidate,initial,cycled,disposed:{...d.renderer.info.memory},a,b};});
  assert.deepEqual(resources.cycled,resources.initial,'visibility cycles do not allocate');
  assert.equal(resources.disposed.geometries,resources.initial.geometries-4,'asset geometry disposed');
  for(const [name,data] of [['hero-before',resources.a],['hero-after',resources.b]])fs.writeFileSync(path.join(artifacts,`barn-${width}-${name}.png`),Buffer.from(data.split(',')[1],'base64'));
  delete resources.a;delete resources.b;assert.deepEqual(session.errors,[]);
  results.push({width,model,resources,scope:'candidate scene swap only; no gameplay integration or physical GPU claim'});await session.finish();
 }
 fs.writeFileSync(path.join(artifacts,'barn-candidate-results.json'),JSON.stringify(results,null,2));failed=false;
}finally{await h.close(failed);}})().catch(e=>{console.error(e);process.exitCode=1;});
