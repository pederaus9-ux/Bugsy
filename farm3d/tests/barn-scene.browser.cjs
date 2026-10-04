const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;const results=[];
try{for(const width of [844,1280]){
 const s=await h.setup({width,height:width===844?390:720},width===844,'barn-scene-'+width),p=s.page;
 await p.goto(h.base+'farm3d/?testfarm&debug&portrait&preset=noon');
 await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 await p.evaluate(()=>{__dbg.G.opts.quiet=true;__dbg.G.close();__dbg.G.S.nextEventAt=__dbg.G.S.nextVisitorAt=__dbg.G.S.nextRushAt=9e15;});
 await p.waitForTimeout(1500);
 const lifecycle=await p.evaluate(async()=>{
  const {GLTFLoader}=await import('./lib/addons/loaders/GLTFLoader.js'),{createBarnScene}=await import('./art/barn-scene-candidate.js');
  const d=__dbg,load=()=>new GLTFLoader().loadAsync('./assets/barn/barn-candidate.glb');
  const ivy=d.scene.getObjectByName('Phase7M-MaxWow').children.find(o=>o.isInstancedMesh&&o.count===58),ivyVisible=ivy.visible;
  const model=(await load()).scene,study=createBarnScene(model,d.scene);d.scene.add(study.root);d.barn.visible=false;
  const grass=[];d.scene.traverse(o=>{if(o.isInstancedMesh&&(o.geometry.getAttribute('bladeH')||o.geometry.getAttribute('uvOff')))grass.push([o,o.instanceMatrix.array.slice()]);});
  const restored=()=>ivy.visible===ivyVisible&&grass.every(([o,a])=>a.every((v,i)=>v===o.instanceMatrix.array[i]));
  study.setVisible(true);d.renderer.render(d.scene,d.camera);const live={...d.renderer.info.memory};
  for(let i=0;i<30;i++){study.setVisible(false);if(!restored())throw Error('grass matrix restoration failed');study.setVisible(true);d.renderer.render(d.scene,d.camera);}
  const toggled={...d.renderer.info.memory};
  study.dispose();study.dispose();d.renderer.render(d.scene,d.camera);const released={...d.renderer.info.memory};
  if(!restored())throw Error('dispose did not restore original grass');
  const rebuilds=[];
  for(let i=0;i<10;i++){
   const fresh=createBarnScene((await load()).scene,d.scene);d.scene.add(fresh.root);fresh.setVisible(true);d.renderer.render(d.scene,d.camera);
   const active={...d.renderer.info.memory};fresh.dispose();d.renderer.render(d.scene,d.camera);
   rebuilds.push({active,disposed:{...d.renderer.info.memory},restored:restored()});
  }
  d.barn.visible=true;
  return {live,toggled,released,rebuilds,stats:study.stats,saved:localStorage.getItem('sunny-acres-3d-v1')};
 });
 assert.deepEqual(lifecycle.toggled,lifecycle.live,'30 visibility cycles do not allocate');
 assert.equal(lifecycle.released.geometries,lifecycle.live.geometries-8);
 assert.equal(lifecycle.released.textures,lifecycle.live.textures-2);
 for(const r of lifecycle.rebuilds){assert.equal(r.disposed.geometries,r.active.geometries-8);assert.equal(r.disposed.textures,r.active.textures-2);assert.equal(r.restored,true);}
 assert.equal(lifecycle.saved,null);assert.ok(lifecycle.stats.maskedInstances>0);
 assert.deepEqual(s.errors,[]);results.push({width,lifecycle});await s.finish();
}failed=false;fs.writeFileSync(path.join(artifacts,'barn-scene-results.json'),JSON.stringify(results,null,2));
}finally{await h.close(failed);}})().catch(e=>{console.error(e);process.exitCode=1;});
