const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;const results=[];
try{for(const width of [844,1280]){
 const s=await h.setup({width,height:width===844?390:720},width===844,'polish-'+width),p=s.page;
 await p.goto(h.base+'farm3d/?testfarm&debug&portrait&preset=noon');await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 await p.evaluate(()=>{const d=__dbg;d.G.opts.quiet=true;d.G.close();d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;});
 const environment=await p.evaluate(async()=>{const d=__dbg,m=await import('./phase7m.js?v=3'),state=window.__sa7m;
  const root=d.scene.getObjectByName('Phase7M-MaxWow'),counts=()=>{let n=0;d.scene.traverse(o=>{if(o.name==='Phase7M-MaxWow')n++;});return n;};
  m.installWorld(d.scene,d.renderer);m.installWorld(d.scene,d.renderer);
  const butterfly=root.getObjectByName('Phase7M butterflies');window.__butterfly=butterfly;
  d.setPreset('noon');const exposure=d.renderer.toneMappingExposure,fog=d.scene.fog.density;
  // A preset rebuilds the PMREM environment. Drain each actual GPU rebuild rather
  // than queueing twenty back-to-back before an unrelated pointer interaction.
  const gl=d.renderer.getContext();
  for(let i=0;i<20;i++){
   d.setPreset('noon');const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
   await new Promise((resolve,reject)=>{const poll=()=>{const result=gl.clientWaitSync(fence,0,0);
    if(result===gl.WAIT_FAILED){gl.deleteSync(fence);reject(new Error('weather GPU fence failed'));}
    else if(result===gl.ALREADY_SIGNALED||result===gl.CONDITION_SATISFIED){gl.deleteSync(fence);resolve();}
    else requestAnimationFrame(poll);};requestAnimationFrame(poll);});
  }
  return {installed:state.installed,roots:counts(),draws:state.extraDrawCalls,flowers:state.flowers,lanterns:state.lanterns,butterflies:state.butterflies,
   stableExposure:d.renderer.toneMappingExposure===exposure,stableFog:d.scene.fog.density===fog,
   fogExamples:[m.visualFog(.004),m.visualFog(.008)],exposureExamples:[m.visualExposure(1),m.visualExposure(1.2)],
   shadowLights:root.children.filter(o=>o.isLight&&o.castShadow).length,overlays:[...document.querySelectorAll('#sa7m-vignette,#sa7m-sunwash')].map(o=>getComputedStyle(o).pointerEvents)};});
 assert.equal(environment.installed,true);assert.equal(environment.roots,1);assert.equal(environment.draws,9);
 assert.equal(environment.flowers,132);assert.equal(environment.lanterns,7);assert.equal(environment.butterflies,18);
 assert.equal(environment.stableExposure,true);assert.equal(environment.stableFog,true);assert.equal(environment.shadowLights,0);
 assert.deepEqual(environment.overlays,['none','none']);assert.deepEqual(environment.fogExamples,[.004*.78,.008*.9]);assert.deepEqual(environment.exposureExamples,[1*1.055,1.2*1.025]);
 await p.evaluate(()=>{document.documentElement.dataset.motion='reduce';window.__butterflyBefore=Array.from(__butterfly.geometry.attributes.position.array);});
 await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>JSON.stringify(__butterflyBefore)===JSON.stringify(Array.from(__butterfly.geometry.attributes.position.array))),true,'new ambient motion stops');
 await p.evaluate(()=>document.documentElement.dataset.motion='full');await p.waitForTimeout(700);
 assert.equal(await p.evaluate(()=>JSON.stringify(__butterflyBefore)!==JSON.stringify(Array.from(__butterfly.geometry.attributes.position.array))),true,'ambient motion resumes');
 await p.locator('#walkBtn').click();await p.waitForFunction(()=>!!__dbg.walk);await p.waitForTimeout(1500);
 const material=await p.evaluate(async()=>{const d=__dbg,mod=await import('./scene-polish.js?v=1'),a=mod.soilCanvas(21),b=mod.soilCanvas(21),c=mod.soilCanvas(22);
  const bytes=canvas=>canvas.getContext('2d').getImageData(0,0,512,512).data;const hash=v=>{let n=2166136261;for(const b of v)n=Math.imul(n^b,16777619);return n>>>0;};
  const normal=d.M.tilled.normalMap;return {same:hash(bytes(a))===hash(bytes(b)),different:hash(bytes(a))!==hash(bytes(c)),size:[a.width,a.height],normal:!!normal,normalScale:d.M.tilled.normalScale.toArray()};});
 assert.equal(material.same,true);assert.equal(material.different,true);assert.deepEqual(material.size,[512,512]);assert.equal(material.normal,true);assert.deepEqual(material.normalScale,[.18*2.6,.18*2.6],'existing global normal enhancement is applied once');
 const wardrobe=await p.evaluate(()=>{const d=__dbg,h=d.camera.children.find(o=>o.userData.skin),out=[];for(let i=0;i<6;i++){d.G.wear('skin',i);d.G.wear('shirt',i%3);let meshes=0;h.traverse(o=>{if(o.isMesh)meshes++;});out.push({skin:h.userData.skin.color.getHex(),shirt:h.userData.sleeve.color.getHex(),meshes});}return out;});
 assert.equal(new Set(wardrobe.map(v=>v.skin)).size,6);assert.ok(wardrobe.every(v=>v.meshes===6));
 await p.evaluate(()=>{const d=__dbg,plot=d.plots[0].g.position;d.walk.pos.set(plot.x,plot.z+1.7);d.walk.vel.set(0,0);d.walk.yaw=0;d.walk.pitch=-.75;const crop=d.G.S.plots[0];Object.assign(crop,{crop:'wheat',end:Date.now()-1,dur:60000});d.G.view.refresh('all');});
 await p.waitForFunction(()=>{const d=__dbg,h=d.hitAt(innerWidth/2,innerHeight/2);return h?.type==='plot'&&h.i===0&&!document.getElementById('actBtn').hidden;},null,{timeout:60000});
 await p.evaluate(()=>{window.__fingerSamples=[];let frames=0;const sample=()=>{const h=__dbg.camera.children.find(o=>o.userData.skin);__fingerSamples.push(h.children.map(o=>o.userData.fingers.rotation.x));if(frames++<90)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await p.locator('#actBtn').click();
 await p.waitForFunction(()=>__fingerSamples.some(v=>v[1]>.35),null,{timeout:10000});
 await p.waitForFunction(()=>__dbg.camera.children.find(o=>o.userData.skin).children.every(o=>o.userData.fingers.rotation.x===0),null,{timeout:10000});const action=await p.evaluate(()=>{const h=__dbg.camera.children.find(o=>o.userData.skin);return {angles:h.children.map(o=>o.userData.fingers.rotation.x),samples:__fingerSamples.slice(0,30),crop:__dbg.G.S.plots[0].crop};});
 assert.equal(action.crop,null,'real harvest reaches the intended crop');assert.ok(action.samples.every(v=>v[0]===0),'inactive fingers stay still');assert.deepEqual(action.angles,[0,0],'real action returns fingers to neutral');
 await p.evaluate(()=>{const d=__dbg,a=d.animals.find(a=>a.ref.type==='pen');a.g.position.set(d.walk.pos.x,0,d.walk.pos.y-1.5);a.mode='fair';a.target=null;a.doing=null;a.until=9e15;a.act='idle';d.G.S.pens[a.kind].list[a.ref.i]=Date.now()-1;window.__markerAnimal=a;});
 await p.waitForFunction(()=>__markerAnimal.status.visible);
 await p.waitForTimeout(250);
 const marker=await p.evaluate(async()=>{const T=await import('./lib/three.module.min.js'),d=__dbg,s=__markerAnimal.status,pos=s.getWorldPosition(new T.Vector3()).applyMatrix4(d.camera.matrixWorldInverse),scale=s.parent.getWorldScale(new T.Vector3());return {pixels:s.scale.y*scale.y*innerHeight/(2*Math.tan(d.camera.fov*Math.PI/360)*-pos.z),visible:s.visible};});
 assert.equal(marker.visible,true);assert.ok(marker.pixels<=48.001,'real nearby animal readiness marker is capped');
 await p.evaluate(()=>__dbg.setPreset('rain'));await p.waitForTimeout(1500);await p.screenshot({path:path.join(artifacts,'polish-'+width+'-rain-hands.png')});
 const memoryBefore=await p.evaluate(()=>({...__dbg.renderer.info.memory}));
 await p.evaluate(()=>{for(let i=0;i<30;i++){__dbg.G.wear('skin',i%6);__dbg.G.wear('shirt',i%3);}});await p.waitForTimeout(1000);
 const memoryAfter=await p.evaluate(()=>({...__dbg.renderer.info.memory}));assert.deepEqual(memoryAfter,memoryBefore,'wardrobe rebuilds do not leak geometry/textures');
 assert.equal(await p.evaluate(()=>localStorage.getItem('sunny-acres-3d-v1')),null,'sandbox preserves player save');assert.deepEqual(s.errors,[]);
 results.push({width,environment,material,wardrobe,action,marker,memoryBefore,memoryAfter});await s.finish();console.log('PASS hands/soil/reach/markers, idempotent environment, weather and reduced motion',width);
 }
 const legacy=await h.setup({width:844,height:390},true,'polish-legacy');await legacy.page.goto(h.base+'farm3d/?testfarm&debug&portrait&preset=noon&visuallegacy');
 await legacy.page.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 const off=await legacy.page.evaluate(async()=>{const m=await import('./phase7m.js?v=3');return {installed:__sa7m.installed,root:!!__dbg.scene.getObjectByName('Phase7M-MaxWow'),overlay:!!document.getElementById('sa7m-skin'),fog:m.visualFog(.008),exposure:m.visualExposure(1.2)};});
 assert.deepEqual(off,{installed:false,root:false,overlay:false,fog:.008,exposure:1.2});assert.deepEqual(legacy.errors,[]);await legacy.finish();console.log('PASS visuallegacy disables environment only');
 failed=false;}finally{fs.writeFileSync(path.join(artifacts,'scene-polish-results.json'),JSON.stringify(results,null,2));await h.close(failed);}})().catch(e=>{console.error(e);process.exitCode=1;});
