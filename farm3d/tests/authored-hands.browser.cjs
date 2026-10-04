const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts,root}=require('./browser-harness.cjs');
(async()=>{const harness=await start(),results=[];let failed=true;
try{for(const width of [844,1280]){
 const s=await harness.setup({width,height:width===844?390:720},width===844,'authored-hands-'+width),p=s.page;
 const source=fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8');
 assert.equal(source.split('function frame() {').length,2);
 await p.route('**/farm3d/?*',route=>route.fulfill({contentType:'text/html',body:source.replace('function frame() {',
   'function frame() { if(window.__handsCaptureHold){requestAnimationFrame(frame);return;}')}));
 await p.goto(harness.base+'farm3d/?testfarm&debug&portrait&preset=noon&artHands');
 await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 await p.waitForFunction(()=>__dbg.camera.getObjectByName('Authored first-person hands')?.userData.authoredHands.state.status==='ready');
 await p.evaluate(()=>{const d=__dbg;d.G.opts.quiet=true;d.G.close();d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;});
 await p.locator('#walkBtn').click();await p.waitForFunction(()=>!!__dbg.walk);
 await p.waitForFunction(()=>{const d=__dbg,root=d.camera.getObjectByName('Authored first-person hands');
   const legacy=d.camera.children.find(o=>o.userData.skin);return root.visible&&!legacy.visible;});
 const wardrobe=await p.evaluate(()=>{const d=__dbg,root=d.camera.getObjectByName('Authored first-person hands');
   const legacy=d.camera.children.find(o=>o.userData.skin),colors=[];let meshes=0,bones=0;
   root.traverse(o=>{if(o.isSkinnedMesh){meshes++;if(![legacy.userData.skin,legacy.userData.sleeve].includes(o.material))throw Error('wardrobe material mismatch');}if(o.isBone)bones++;});
   for(let i=0;i<6;i++){d.G.wear('skin',i);d.G.wear('shirt',i%3);colors.push({skin:legacy.userData.skin.color.getHex(),shirt:legacy.userData.sleeve.color.getHex()});}
   return {colors,meshes,bones,visible:root.visible,legacyVisible:legacy.visible};});
 assert.equal(wardrobe.meshes,4);assert.equal(wardrobe.bones,32);assert.equal(wardrobe.visible,true);assert.equal(wardrobe.legacyVisible,false);
 assert.equal(new Set(wardrobe.colors.map(o=>o.skin)).size,6);
 const wardrobeCycles=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js');
   window.__handsCaptureHold=true;const root=d.camera.getObjectByName('Authored first-person hands');
   const isolated=new T.Scene(),camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.05,100);
   isolated.environment=d.scene.environment;root.removeFromParent();isolated.add(root);
   d.renderer.render(isolated,camera);const before={...d.renderer.info.memory};
   // Exercise the real wardrobe API, rendering only its hand consumer. World
   // status sprites lazily upload unrelated textures as simulated time passes;
   // the unchanged scene-polish suite separately tests the whole farm lifecycle.
   for(let i=0;i<30;i++){d.G.wear('skin',i%6);d.G.wear('shirt',i%3);d.renderer.render(isolated,camera);}
   const after={...d.renderer.info.memory};root.removeFromParent();d.camera.add(root);window.__handsCaptureHold=false;
   return {cycles:30,before,after};});
 assert.deepEqual(wardrobeCycles.after,wardrobeCycles.before,'real wardrobe calls do not grow hand GPU resources');
 await p.screenshot({path:path.join(artifacts,'authored-hands-'+width+'-walk.png')});
 // Use the actual Harvest button and authoritative plot flow, sampling real bones.
 await p.evaluate(()=>{const d=__dbg,plot=d.plots[0].g.position;d.walk.pos.set(plot.x,plot.z+1.7);d.walk.vel.set(0,0);d.walk.yaw=0;d.walk.pitch=-.75;
   Object.assign(d.G.S.plots[0],{crop:'wheat',end:Date.now()-1,dur:60000});d.G.view.refresh('all');});
 await p.waitForFunction(()=>{const d=__dbg,h=d.hitAt(innerWidth/2,innerHeight/2);return h?.type==='plot'&&h.i===0&&!document.getElementById('actBtn').hidden;},null,{timeout:60000});
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>__dbg.G.reducedMotion());
 const neutral=await p.evaluate(()=>{const root=__dbg.camera.getObjectByName('Authored first-person hands');
   root.userData.authoredHands.update({visible:true,time:0,reducedMotion:true});return root.getObjectByName('R_finger1_0').quaternion.toArray();});
 await p.evaluate(()=>{window.__authoredSamples=[];window.__authoredSampling=true;let frames=0;const sample=()=>{if(!__authoredSampling)return;const root=__dbg.camera.getObjectByName('Authored first-person hands');
   __authoredSamples.push(root.getObjectByName('R_finger1_0').quaternion.toArray());if(frames++<70)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await p.locator('#actBtn').click();
 await p.waitForFunction(neutral=>__authoredSamples.length>5&&__authoredSamples.some(q=>q.some((n,i)=>Math.abs(n-neutral[i])>.1))&&
   __authoredSamples.slice(-3).every(q=>q.every((n,i)=>Math.abs(n-neutral[i])<1e-6)),neutral,{timeout:10000});
 const harvest=await p.evaluate(()=>({crop:__dbg.G.S.plots[0].crop,samples:__authoredSamples}));
 fs.writeFileSync(path.join(artifacts,'authored-hands-'+width+'-harvest-samples.json'),JSON.stringify({neutral,harvest},null,2));
 assert.equal(harvest.crop,null);assert(harvest.samples.length>5);
 const difference=q=>Math.max(...q.map((n,i)=>Math.abs(n-neutral[i])));
 assert(harvest.samples.some(q=>difference(q)>.1),'actual harvest curls weighted finger joints');
 assert(harvest.samples.slice(-3).every(q=>difference(q)<1e-6),'actual harvest returns fingers to neutral');
 await p.evaluate(()=>window.__authoredSampling=false);
 // With a stopped game loop, sample each adapter clip in the real game camera.
 const poses=await p.evaluate(()=>{const d=__dbg,root=d.camera.getObjectByName('Authored first-person hands'),c=root.userData.authoredHands;
   window.__handsCaptureHold=true;window.__handController=c;window.__handRoot=root;
   return ['idle','harvest','plant','water','pet','feed'].map(kind=>{c.update({visible:true,kind,phase:.5,time:0,reducedMotion:true});
     d.renderer.render(d.scene,d.camera);return {kind,finger:root.getObjectByName('R_finger1_0').quaternion.toArray(),wrist:root.getObjectByName('R_wrist').quaternion.toArray()};});});
 assert(poses.find(p=>p.kind==='harvest').finger.some((n,i)=>Math.abs(n-poses[0].finger[i])>.1));
 assert(poses.find(p=>p.kind==='pet').wrist.some((n,i)=>Math.abs(n-poses[0].wrist[i])>.01));
 await p.evaluate(()=>{__handController.update({visible:true,kind:'harvest',phase:.5});__dbg.renderer.render(__dbg.scene,__dbg.camera);});
 await p.screenshot({path:path.join(artifacts,'authored-hands-'+width+'-harvest.png')});
 const ownership=await p.evaluate(async()=>{const d=__dbg,root=__handRoot,legacy=d.camera.children.find(o=>o.userData.skin),mod=await import('./art/authored-hands.js?v=1');
   const T=await import('./lib/three.module.min.js');
   const {GLTFLoader}=await import('./lib/addons/loaders/GLTFLoader.js');
   const late=await new GLTFLoader().loadAsync('./assets/hands/hands-candidate.glb');
   const resources=new Set();late.scene.traverse(o=>{if(o.isMesh){resources.add(o.geometry);resources.add(o.material);if(o.isSkinnedMesh)resources.add(o.skeleton);}});
   let lateDisposals=0;for(const o of resources){const dispose=o.dispose;o.dispose=function(){lateDisposals++;dispose.call(this);};}
   let resolveLoad;const pending=mod.installAuthoredHands(d.camera,legacy,{load:()=>new Promise(resolve=>{resolveLoad=resolve;})});
   await Promise.resolve();pending.dispose();pending.dispose();resolveLoad(late);
   const lateLoaded=await pending.ready;
   // Drain the actual loaded hands in an isolated scene before disposal. Other
   // farm textures may be lazily uploaded by a new world draw; those are not
   // owned by the hand adapter and must not contaminate its cleanup baseline.
   const isolated=new T.Scene(),camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.05,100);
   isolated.environment=d.scene.environment;root.removeFromParent();isolated.add(root);root.visible=true;
   d.renderer.render(isolated,camera);const before={...d.renderer.info.memory};let borrowedDisposals=0;
   const input={visible:true,kind:'water',phase:.5,time:1,sway:.01,bob:.02};__handController.update(input);
   const arm=root.getObjectByName('R_arm'),position=arm.position.toArray();
   for(let i=0;i<1000;i++)__handController.update(input);
   const stablePose=JSON.stringify(position)===JSON.stringify(arm.position.toArray());
   legacy.userData.skin.addEventListener('dispose',()=>borrowedDisposals++);legacy.userData.sleeve.addEventListener('dispose',()=>borrowedDisposals++);
   __handController.update({visible:false});const hidden=!root.visible;
   const fallback=mod.installAuthoredHands(d.camera,legacy,{load:()=>Promise.reject(Error('deliberate missing candidate'))});
   const loaded=await fallback.ready,status=fallback.state.status;fallback.dispose();fallback.dispose();
   __handController.dispose();__handController.dispose();d.renderer.render(isolated,camera);
   const cleanup={...d.renderer.info.memory};
   const gone=!d.camera.getObjectByName('Authored first-person hands');
   return {before,stablePose,hidden,loaded,status,cleanup,gone,borrowedDisposals,lateLoaded,lateDisposals,lateResources:resources.size};});
 assert.equal(ownership.hidden,true);
 assert.equal(ownership.stablePose,true,'constant animation channels do not accumulate motion offsets');
 assert.equal(ownership.lateLoaded,false);assert.equal(ownership.lateDisposals,ownership.lateResources,'cancelled late load releases each owned resource exactly once');
 assert.equal(ownership.loaded,false);assert.equal(ownership.status,'fallback');assert.equal(ownership.gone,true);assert.equal(ownership.borrowedDisposals,0);
 assert.equal(ownership.cleanup.geometries,ownership.before.geometries-4);assert.equal(ownership.cleanup.textures,ownership.before.textures-1);
 assert.equal(await p.evaluate(()=>localStorage.getItem('sunny-acres-3d-v1')),null);
 assert.deepEqual(s.errors,[]);results.push({width,wardrobe,wardrobeCycles,harvest,poses,ownership});await s.finish();
 console.log('PASS authored game hands: wardrobe, actual harvest, six clip poses, fallback and disposal',width);
}failed=false;}finally{fs.writeFileSync(path.join(artifacts,'authored-hands-results.json'),JSON.stringify(results,null,2));await harness.close(failed);}
})().catch(error=>{console.error(error);process.exitCode=1;});
