// Rendered Stage B review evidence and an isolated six-character comparison against PR #41.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;
 try{
  const {page,errors}=await h.setup({width:1200,height:1560},false,'farmer-matrix');
  await page.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
  await page.setContent('<style>body{margin:0;background:#e5dfd2;font:15px Arial;color:#362d24}canvas{position:absolute;top:70px}h1{font-size:23px;margin:12px 16px}#cols{display:grid;grid-template-columns:repeat(8,1fr);text-align:center;font-weight:bold}#rows div{position:absolute;left:4px;background:#fffa;padding:3px;border-radius:4px;z-index:1}</style><h1>Stage B farmer: all hair / hat combinations</h1><div id="cols"></div><div id="rows"></div>');
  await page.evaluate(async()=>{
   const T=await import('/farm3d/lib/three.module.min.js'),M=await import('/farm3d/farmer3d.js');
   const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,1440);renderer.setPixelRatio(1);document.body.appendChild(renderer.domElement);
   const hairs=['short','long','pony','bun','curly','buzz','bob','braids'],hats=['straw','none','cap','beanie','cowboy','flowers'];
   document.getElementById('cols').innerHTML=hairs.map(x=>'<span>'+x+'</span>').join('');
   document.getElementById('rows').innerHTML=hats.map((x,i)=>'<div style="top:'+(76+i*240)+'px">'+x+'</div>').join('');
   const scene=new T.Scene();scene.background=new T.Color(0xe5dfd2);scene.add(new T.HemisphereLight(0xffffff,0x726651,2));const light=new T.DirectionalLight(0xffffff,2.3);light.position.set(-3,5,-4);scene.add(light);
   const camera=new T.OrthographicCamera(-.66,.66,1.18,-1.20,.1,20);camera.position.set(.38,1.2,-4);camera.lookAt(0,1.2,0);
   const rigs=hats.flatMap(hat=>hairs.map(hair=>M.createFarmer3D({look:{hair,hat}})));
   window.__gallery={T,M,renderer,scene,camera,rigs};
   window.__renderGallery=rear=>{renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);for(let i=0;i<48;i++){const r=rigs[i];r.model.rotation.y=rear?Math.PI:0;r.head.rotation.y=0;scene.add(r.g);const x=i%8*150,y=(5-Math.floor(i/8))*240;renderer.setViewport(x,y,150,240);renderer.setScissor(x,y,150,240);renderer.render(scene,camera);scene.remove(r.g);}};
   __renderGallery(false);
  });
  await page.screenshot({path:path.join(artifacts,'farmer-matrix-front.png'),scale:'css'});
  await page.evaluate(()=>__renderGallery(true));await page.screenshot({path:path.join(artifacts,'farmer-matrix-rear.png'),scale:'css'});
  await page.evaluate(()=>{
   document.getElementById('rows').style.display='none';
   const {T,M,renderer,scene}=__gallery;renderer.setScissorTest(false);renderer.setSize(1200,420);renderer.setViewport(0,0,1200,420);
   const camera=new T.OrthographicCamera(-3.57,3.57,1.2,-1.3,.1,20);camera.position.set(0,1.2,-4);camera.lookAt(0,1.2,0);
   const rigs=[0xf6d7c3,0xf0c6a0,0xd9a577,0xb57c52,0x8a5635,0x5b3822].map((skin,i)=>{const r=M.createFarmer3D({look:{skin,hat:'none'}});r.g.position.x=(2.5-i)*1.14;scene.add(r.g);return r;});
   renderer.render(scene,camera);rigs.forEach(r=>{scene.remove(r.g);r.dispose();});
  });
  await page.locator('canvas').screenshot({path:path.join(artifacts,'farmer-skin-tones.png'),scale:'css'});
  await page.evaluate(()=>{
   const {T,M,renderer,scene}=__gallery;renderer.setSize(1200,280);renderer.setScissorTest(true);
   const camera=new T.OrthographicCamera(-.66,.66,1.18,-1.3,.1,20);camera.position.set(2,1.2,-4);camera.lookAt(0,1.2,0);
   for(let i=0;i<8;i++){const r=M.createFarmer3D({look:{hat:'none'}});r.state.amount=1;M.updateFarmer3D(r,0,-3/60,1/60,'walk',{phase:i/8,run:0});scene.add(r.g);renderer.setViewport(i*150,0,150,280);renderer.setScissor(i*150,0,150,280);renderer.render(scene,camera);scene.remove(r.g);r.dispose();}
  });
  await page.locator('canvas').screenshot({path:path.join(artifacts,'farmer-gait-poses.png'),scale:'css'});
  const performance=await page.evaluate(async()=>{
   const {T,M,renderer,scene,camera,rigs}=__gallery;for(const r of rigs)r.dispose();
   const old=await import('/farm3d/tests/fixtures/farmer-stage-a.js');renderer.setScissorTest(false);renderer.setViewport(0,0,1200,1440);renderer.setSize(640,360);
   const cam=new T.PerspectiveCamera(35,640/360,.1,40);cam.position.set(0,2,-12);cam.lookAt(0,1,0);
   const look={hair:'short',hat:'straw',skin:0xf0c6a0,shirt:0xd24d3f,overalls:true};
   const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
   function measure(module){
    const actors=[module.createFarmer3D({look}),...[0xd9788f,0x8a6a48,0xf2c14e,0x4f8a4a,0x8e6bc2].map(tint=>module.createVillager3D({tint}))];
    actors.forEach((r,i)=>{r.g.position.x=(i-2.5)*.75;scene.add(r.g);});
    for(let k=0;k<10;k++){actors.forEach(r=>module.updateFarmer3D(r,0,-3/60,1/60,'walk'));renderer.render(scene,cam);}
    renderer.render(scene,cam);const calls=renderer.info.render.calls,triangles=renderer.info.render.triangles;
    const cpu=[];for(let k=0;k<7;k++){const start=performance.now();for(let i=0;i<1000;i++)for(const r of actors)module.updateFarmer3D(r,0,-3/60,1/60,'walk');cpu.push((performance.now()-start)/1000);}
    const render=[];for(let k=0;k<15;k++){const start=performance.now();renderer.render(scene,cam);renderer.getContext().finish();render.push(performance.now()-start);}
    const out={calls,triangles,cpuMsPerSix:median(cpu),softwareRenderMs:median(render),resources:{...renderer.info.memory}};
    actors.forEach(r=>{scene.remove(r.g);r.dispose();});return out;
   }
   const baseline=measure(old),upgraded=measure(M);
   const live=[];for(let i=0;i<6;i++){const r=M.createFarmer3D({look});r.g.position.x=(i-2.5)*.75;live.push(r);scene.add(r.g);}renderer.render(scene,cam);const before={...renderer.info.memory};
   for(let i=0;i<30;i++){const j=i%6,r=live[j];scene.remove(r.g);r.dispose();const next=M.createFarmer3D({look:{...look,hair:['curly','braids','long'][i%3]}});next.g.position.copy(r.g.position);live[j]=next;scene.add(next.g);renderer.render(scene,cam);}
   const after={...renderer.info.memory};live.forEach(r=>{scene.remove(r.g);r.dispose();});
   return {baseline,upgraded,rebuild:{before,after},fixture:'640x360 SwiftShader, isolated farmer + five villagers, shadows off; CPU pose timing excludes GPU work'};
  });
  assert.equal(performance.upgraded.calls,6);assert.ok(performance.upgraded.calls<=performance.baseline.calls);assert.ok(performance.upgraded.triangles<30000);assert.deepEqual(performance.rebuild.after,performance.rebuild.before);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(artifacts,'farmer-performance.json'),JSON.stringify(performance,null,2));console.log('PASS farmer evidence/performance',JSON.stringify(performance));failed=false;
 }finally{await h.close(failed);}
})().catch(e=>{console.error(e);process.exit(1);});
