// Retained six-species, three-angle, idle/walk/run evidence. A render is not a human visual verdict.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {start, artifacts} = require('./browser-harness.cjs');
const prefix = process.env.ANIMAL_EVIDENCE_PREFIX || 'animal-visual';
(async () => {
  const h = await start(); let failed = true;
  try {
    const s = await h.setup({width:1620,height:1170},false,prefix+'-gallery-session');
    await s.page.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
    await s.page.setContent('<style>body{margin:0;background:#e5dfd2;font:16px Arial;color:#362d24}h1{margin:12px;font-size:24px}#labels{display:grid;grid-template-columns:repeat(9,1fr);text-align:center}canvas{display:block}#rows div{position:absolute;left:4px;background:#fffd;padding:4px;z-index:1}</style><h1>Six species — idle / walk / run × front / side / rear</h1><div id="labels"></div><div id="rows"></div>');
    const metrics = await s.page.evaluate(async () => {
      const T = await import('/farm3d/lib/three.module.min.js');
      const L = await import('/farm3d/live3d.js?v=2');
      const C = await import('/farm3d/cow3d.js?v=3');
      const E = await import('/farm3d/tests/horse-evidence-placement.mjs');
      const kinds = ['cow','sheep','horse','dog','cat','chicken'];
      const heights = [1.7,.9,1.6,.55,.4,.35];
      const renderer = new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
      renderer.setPixelRatio(1);renderer.setSize(1620,1080);document.body.appendChild(renderer.domElement);
      const scene = new T.Scene();scene.background = new T.Color(0xe5dfd2);
      scene.add(new T.HemisphereLight(0xffffff,0x726651,2));
      const sun = new T.DirectionalLight(0xffffff,2.3);sun.position.set(-3,5,-4);scene.add(sun);
      const floor = new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshStandardMaterial({color:0xb5b98e,roughness:1}));
      floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
      const angles = ['front','side','rear'], modes = ['idle','walk','run'];
      document.getElementById('labels').innerHTML=modes.flatMap(mode=>angles.map(angle=>'<span>'+mode+' '+angle+'</span>')).join('');
      document.getElementById('rows').innerHTML=kinds.map((kind,i)=>'<div style="top:'+(92+i*180)+'px">'+kind+'</div>').join('');
      const rows=[];
      renderer.setScissorTest(true);
      for(let k=0;k<6;k++) {
        const r=k===0?C.createCow3D(heights[k]):L.createLiveAnimal(kinds[k],heights[k],0,0);
        scene.add(r.g);r.model.rotation.set(0,0,0);
        const height=heights[k],half=Math.max(height*.8,k===2?1.25:height*.8);
        const camera=new T.OrthographicCamera(-half,half,half,-half,.01,30);
        for(let m=0;m<3;m++) {
          const mode=modes[m];
          if(k===2)E.resetHorseEvidencePose(r,0,0,0);
          else {r.state.phase=0;r.g.position.set(0,0,0);for(const l of r.legs)l.planted=false;}
          for(let n=0;n<24;n++) {
            const dz=mode==='idle'?0:-height*(mode==='run'?1.4:.65)/60;
            r.g.position.z+=dz;
            if(k===0)C.updateCow3D(r,0,dz,1/60,n/60,mode);else L.updateLiveAnimal(r,0,dz,1/60,mode);
          }
          if(k===2)E.translateHorseEvidencePose(r,0,0,0);else r.g.position.z=0;
          r.g.updateMatrixWorld(true);
          if(k===2)for(const l of r.legs){
            const foot=l.foot.getWorldPosition(new T.Vector3());
            const error=foot.distanceTo(new T.Vector3(l.track.x,l.track.y,l.track.z));
            if(error>.002)throw new Error('horse gallery world contact error '+error);
          }
          const bounds=new T.Box3().setFromObject(r.g), center=new T.Vector3(0,height*.52,0);
          const assertFinite = [bounds.min.x,bounds.min.y,bounds.min.z,bounds.max.x,bounds.max.y,bounds.max.z].every(Number.isFinite);
          if(!assertFinite)throw new Error(kinds[k]+' nonfinite bounds');
          for(let a=0;a<3;a++) {
            const yaw=[.25,Math.PI/2,Math.PI+.25][a];
            camera.position.set(Math.sin(yaw)*5,center.y+.55*height,-Math.cos(yaw)*5);camera.lookAt(center);
            const col=m*3+a;renderer.setViewport(col*180,(5-k)*180,180,180);renderer.setScissor(col*180,(5-k)*180,180,180);
            renderer.render(scene,camera);
            rows.push({kind:kinds[k],mode,angle:angles[a],calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});
          }
        }
        scene.remove(r.g);r.dispose();
      }
      window.__animalReview={T,L,C,renderer,scene,kinds,heights};
      return rows;
    });
    await s.page.screenshot({path:path.join(artifacts,prefix+'-gallery.png'),scale:'css'});
    assert.equal(metrics.length,54);assert.deepEqual(s.errors,[]);
    fs.writeFileSync(path.join(artifacts,prefix+'-metrics.json'),JSON.stringify(metrics,null,2));
    const cost=await s.page.evaluate(()=>{
      const {T,L,C,renderer,scene,kinds,heights}=__animalReview;
      renderer.setScissorTest(false);renderer.setSize(640,360);
      const camera=new T.PerspectiveCamera(38,640/360,.1,30);camera.position.set(0,3,-12);camera.lookAt(0,.8,0);
      const make=i=>i===0?C.createCow3D(heights[i]):L.createLiveAnimal(kinds[i],heights[i],0,0);
      const actors=kinds.map((_,i)=>make(i));actors.forEach((r,i)=>{r.g.position.x=(i-2.5)*1.1;scene.add(r.g);});
      renderer.render(scene,camera);const before={...renderer.info.memory},calls=renderer.info.render.calls,triangles=renderer.info.render.triangles;
      const times=[];for(let k=0;k<7;k++){const start=performance.now();for(let n=0;n<1000;n++)actors.forEach((r,i)=>{if(i===0)C.updateCow3D(r,0,-.01,1/60,n/60);else L.updateLiveAnimal(r,0,-.01,1/60,'moving',false);});times.push((performance.now()-start)/1000);}
      for(let n=0;n<30;n++){const i=n%6,old=actors[i];scene.remove(old.g);old.dispose();old.dispose();const next=make(i);next.g.position.copy(old.g.position);scene.add(next.g);actors[i]=next;renderer.render(scene,camera);}
      const after={...renderer.info.memory};actors.forEach(r=>{scene.remove(r.g);r.dispose();});
      return {calls,triangles,cpuMsPerSix:times.sort((a,b)=>a-b)[3],before,after,fixture:'isolated six animals plus one floor, 640x360 SwiftShader, shadows off; CPU update excludes GPU; not device FPS'};
    });
    assert.equal(cost.calls,7,'one visual per species plus floor');assert.ok(cost.triangles<30000);assert.deepEqual(cost.after,cost.before);
    fs.writeFileSync(path.join(artifacts,prefix+'-performance.json'),JSON.stringify(cost,null,2));
    console.log('PASS six animals: draw/triangle budget and 30 rebuilds',JSON.stringify(cost));
    console.log('PASS six-species 54 rendered pose/angle samples');
    await s.finish();
    const live=[];
    for(const viewport of [{width:844,height:390},{width:1280,height:720}]){
      const session=await h.setup(viewport,viewport.width<1000,prefix+'-farm-session-'+viewport.width);
      const page=session.page;
      // Lock the preset so the 60-second weather refresh cannot restore night.
      await page.goto(h.base+'farm3d/?testfarm&debug&portrait&shot&sim=0&preset=noon');
      await page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
      await page.locator('canvas').first().screenshot({path:path.join(artifacts,prefix+'-farm-'+viewport.width+'.png'),scale:'css'});
      // Retain the normal UI above; remove transient visitor/toast overlays from anatomy crops.
      await page.addStyleTag({content:'body > :not(canvas) {visibility:hidden !important}'});
      await page.evaluate(()=>{__dbg.renderer.shadowMap.enabled=false;__dbg.renderer.setPixelRatio(1);__dbg.G.opts.quiet=true;__dbg.setPreset('noon');});
      for(const kind of ['cow','sheep','horse','dog','cat','chicken']){
        const travel=await page.evaluate(kind=>{
          const d=__dbg,a=d.animals.find(a=>a.kind===kind);
          if(!a?.rig3d)throw new Error(kind+' missing actual farm rig');
          const save=localStorage.getItem('sunny-acres-3d-v1');
          a.mode='fair';a.until=9e15;a.need={hunger:0,tired:0,lonely:0};a.go(a.g.position.x+.9,a.g.position.z+.6,false,'Visual QA stroll');
          let distance=0;for(let n=0;n<120;n++){const x=a.g.position.x,z=a.g.position.z;a.update(1/60,d.clock()+n/60);distance+=Math.hypot(a.g.position.x-x,a.g.position.z-z);}
          return {kind,distance,phase:a.rig3d.state.phase,saveUnchanged:localStorage.getItem('sunny-acres-3d-v1')===save};
        },kind);
        assert.ok(travel.distance>.01,kind+' actual farm movement');assert.ok(Number.isFinite(travel.phase));assert.ok(travel.saveUnchanged);
        for(const mode of ['idle','walk','run']){
          const pose=await page.evaluate(async({kind,mode})=>{
            const T=await import('./lib/three.module.min.js'),L=await import('./live3d.js?v=2'),C=await import('./cow3d.js?v=3');
            const d=__dbg,a=d.animals.find(a=>a.kind===kind),r=a.rig3d;
            const E=kind==='horse'?await import('./tests/horse-evidence-placement.mjs'):null;
            // The existing flat dirt path keeps grass/other animals from hiding anatomy.
            // This is test-only positioning; overview captures retain normal scene placement.
            d.animals.forEach(other=>{other.g.visible=other===a;});
            if(E)E.resetHorseEvidencePose(r,0,0,14);
            else {a.g.position.set(0,0,14);r.model.rotation.set(0,0,0);r.state.phase=0;for(const l of r.legs)l.planted=false;}
            for(let n=0;n<24;n++){
              const dz=mode==='idle'?0:-a.S.h*(mode==='run'?1.4:.65)/60;a.g.position.z+=dz;
              if(kind==='cow')C.updateCow3D(r,0,dz,1/60,n/60,mode);else L.updateLiveAnimal(r,0,dz,1/60,mode,mode==='run');
            }
            if(E)E.translateHorseEvidencePose(r,0,0,14);else a.g.position.set(0,0,14);
            a.status.visible=a.bubble.visible=false;r.g.updateMatrixWorld(true);
            if(E)for(const l of r.legs){
              const foot=l.foot.getWorldPosition(new T.Vector3());
              const error=foot.distanceTo(new T.Vector3(l.track.x,l.track.y,l.track.z));
              if(error>.002)throw new Error('horse capture world contact error '+error);
            }
            const head=r.head.getWorldPosition(new T.Vector3());
            d.camera.position.set(0,a.S.h*.9,14-a.S.h*2.8);d.camera.lookAt(0,a.S.h*.52,14);d.camera.updateMatrixWorld(true);d.scene.updateMatrixWorld(true);
            const projected=head.clone().project(d.camera),hit=d.hitAt((projected.x+1)*innerWidth/2,(1-projected.y)*innerHeight/2);
            return {kind,mode,height:a.S.h,picked:hit?.an?.kind===kind,pose:r.legs.map(l=>({hip:l.hip.rotation.toArray(),knee:l.knee.rotation.toArray()})),skeletons:r.card.skeleton.bones.length};
          },{kind,mode});
          assert.ok(pose.picked,kind+' real head hit proxy');
          for(const [angle,yaw] of [['front',.25],['side',Math.PI/2],['rear',Math.PI+.25]]){
            await page.evaluate(({kind,yaw})=>{
              const d=__dbg,a=d.animals.find(a=>a.kind===kind),height=a.S.h,dist=height*2.8;
              d.camera.position.set(Math.sin(yaw)*dist,height*.9,14-Math.cos(yaw)*dist);d.camera.lookAt(0,height*.52,14);
              d.renderer.render(d.scene,d.camera);
            },{kind,yaw});
            await page.locator('canvas').first().screenshot({path:path.join(artifacts,`${prefix}-live-${viewport.width}-${kind}-${mode}-${angle}.png`),scale:'css'});
          }
          live.push({viewport,travel,pose});
          if(kind==='horse'&&viewport.width===1280&&mode==='idle'){
            for(const detail of ['ears','knees']){
              await page.evaluate(async detail=>{
                const T=await import('./lib/three.module.min.js'),d=__dbg,a=d.animals.find(a=>a.kind==='horse'),r=a.rig3d;
                const center=(detail==='ears'?r.head:r.legs[0].knee).getWorldPosition(new T.Vector3());
                d.camera.position.copy(center).add(new T.Vector3(a.S.h*(detail==='ears'?1.1:.8),a.S.h*.08,0));
                d.camera.lookAt(center);d.renderer.render(d.scene,d.camera);
              },detail);
              await page.locator('canvas').first().screenshot({path:path.join(artifacts,`${prefix}-horse-idle-${detail}-closeup.png`),scale:'css'});
            }
          }
          if(kind==='horse'&&viewport.width===1280&&mode==='idle'){
            for(const degrees of [0,20]){
              await page.evaluate(async degrees=>{
                const T=await import('./lib/three.module.min.js'),d=__dbg,a=d.animals.find(a=>a.kind==='horse'),r=a.rig3d;
                r.neck.rotation.x=degrees*Math.PI/180;r.g.updateMatrixWorld(true);
                const center=r.neck.getWorldPosition(new T.Vector3());
                d.camera.position.copy(center).add(new T.Vector3(a.S.h*1.25,a.S.h*.12,0));
                d.camera.lookAt(center);d.renderer.render(d.scene,d.camera);
              },degrees);
              await page.locator('canvas').first().screenshot({path:path.join(artifacts,`${prefix}-horse-neck-pitch-${degrees}.png`),scale:'css'});
            }
            await page.evaluate(()=>{const r=__dbg.animals.find(a=>a.kind==='horse').rig3d;r.neck.rotation.x=0;r.g.updateMatrixWorld(true);});
            // Head evidence on the actual farm rig: front, side and three-quarter
            // close-ups at rest, lowered (negative neck pitch lowers the head),
            // head turned both ways and neck turned. Evidence only; a render is
            // not a visual verdict.
            const headPoses=[];
            for(const [pose,neckX,headX,headY,neckY] of [['neutral',0,0,0,0],['lowered',-24,-6,0,0],['turn-left',0,0,25,0],['turn-right',0,0,-25,0],['neck-yaw',0,0,0,20]]){
              for(const [view,dir] of [['front',[0,.12,-1]],['side',[1,.08,0]],['three-quarter',[.75,.25,-.75]]]){
                headPoses.push(await page.evaluate(async({pose,view,neckX,headX,headY,neckY,dir})=>{
                  const T=await import('./lib/three.module.min.js'),d=__dbg,a=d.animals.find(a=>a.kind==='horse'),r=a.rig3d,D=Math.PI/180;
                  r.neck.rotation.set(neckX*D,neckY*D,0);r.head.rotation.set(headX*D,headY*D,0);r.g.updateMatrixWorld(true);
                  const q=r.head.getWorldQuaternion(new T.Quaternion()),s=r.model.getWorldScale(new T.Vector3()).x;
                  const center=r.head.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,-.20,-.20).applyQuaternion(q).multiplyScalar(s));
                  const v=new T.Vector3(...dir).normalize().applyQuaternion(r.model.getWorldQuaternion(new T.Quaternion()));
                  d.camera.position.copy(center).addScaledVector(v,a.S.h*.52);d.camera.lookAt(center);d.renderer.render(d.scene,d.camera);
                  return {pose,view,neck:[neckX,neckY],head:[headX,headY],headWorld:r.head.getWorldPosition(new T.Vector3()).toArray()};
                },{pose,view,neckX,headX,headY,neckY,dir}));
                await page.locator('canvas').first().screenshot({path:path.join(artifacts,`${prefix}-horse-head-${pose}-${view}.png`),scale:'css'});
              }
            }
            await page.evaluate(()=>{const r=__dbg.animals.find(a=>a.kind==='horse').rig3d;r.neck.rotation.set(0,0,0);r.head.rotation.set(0,0,0);r.g.updateMatrixWorld(true);});
            fs.writeFileSync(path.join(artifacts,prefix+'-horse-head-poses.json'),JSON.stringify(headPoses,null,2));
          }
          if(kind==='horse'&&viewport.width===1280&&mode==='walk'){
            const sequence=[];
            // Continue the real articulated pose; follow with the camera only.
            // Do not reset contacts between samples or imply that a pose is motion.
            for(let sample=0;sample<12;sample++){
              sequence.push(await page.evaluate(async()=>{
                const T=await import('./lib/three.module.min.js'),L=await import('./live3d.js?v=2');
                const d=__dbg,a=d.animals.find(a=>a.kind==='horse'),r=a.rig3d;
                for(let n=0;n<8;n++){const dz=-a.S.h*.65/60;r.g.position.z+=dz;L.updateLiveAnimal(r,0,dz,1/60,'walk');}
                r.g.updateMatrixWorld(true);
                const center=new T.Vector3(r.g.position.x,a.S.h*.52,r.g.position.z);
                d.camera.position.copy(center).add(new T.Vector3(a.S.h*2.8,a.S.h*.38,0));d.camera.lookAt(center);d.renderer.render(d.scene,d.camera);
                return {time:r.state.time,phase:r.state.phase,gait:r.state.gait,root:r.g.position.toArray(),
                  feet:r.legs.map(l=>({mode:l.track.mode,target:[l.track.x,l.track.y,l.track.z],actual:l.foot.getWorldPosition(new T.Vector3()).toArray()}))};
              }));
              await page.locator('canvas').first().screenshot({path:path.join(artifacts,`${prefix}-horse-walk-sequence-${String(sample).padStart(2,'0')}.png`),scale:'css'});
              // Retain the original farm view and add the opposite side of the
              // same frame: the order-board posts obscure part of the first view.
              // Camera-only inspection must neither advance the gait nor move contacts.
              const opposite=await page.evaluate(async()=>{
                const T=await import('./lib/three.module.min.js'),d=__dbg,a=d.animals.find(a=>a.kind==='horse'),r=a.rig3d;
                const center=new T.Vector3(r.g.position.x,a.S.h*.52,r.g.position.z);
                d.camera.position.copy(center).add(new T.Vector3(-a.S.h*2.8,a.S.h*.38,0));
                d.camera.lookAt(center);d.renderer.render(d.scene,d.camera);
                return {time:r.state.time,phase:r.state.phase,root:r.g.position.toArray(),
                  feet:r.legs.map(l=>({target:[l.track.x,l.track.y,l.track.z],actual:l.foot.getWorldPosition(new T.Vector3()).toArray()}))};
              });
              const current=sequence.at(-1);
              assert.equal(opposite.time,current.time,'camera change must not advance time');
              assert.equal(opposite.phase,current.phase,'camera change must not advance gait');
              assert.deepEqual(opposite.root,current.root,'camera change must not relocate horse');
              assert.deepEqual(opposite.feet,current.feet.map(({target,actual})=>({target,actual})),
                'camera change must preserve actual feet and persistent contacts');
              for(const {target,actual} of opposite.feet)assert.ok(Math.hypot(...actual.map((v,i)=>v-target[i]))<=.002,
                'walking evidence actual hoof must align with world-space target');
              await page.locator('canvas').first().screenshot({path:path.join(artifacts,`${prefix}-horse-walk-opposite-${String(sample).padStart(2,'0')}.png`),scale:'css'});
            }
            assert.ok(sequence.every(s=>s.gait==='walk'),'sequence must exercise walk');
            assert.ok(sequence.at(-1).root[2]<sequence[0].root[2]-.5,'continuous walking travel');
            fs.writeFileSync(path.join(artifacts,prefix+'-horse-walk-sequence.json'),JSON.stringify(sequence,null,2));
          }
        }
        await page.evaluate(kind=>{const a=__dbg.animals.find(a=>a.kind===kind);a.g.position.set(60,0,60);},kind);
      }
      assert.deepEqual(session.errors,[]);console.log('PASS six actual farm species: movement, head picking and 54 pose/angle captures',viewport.width);
      await session.finish();
      const sheet=await h.setup({width:1980,height:1600},false,prefix+'-sheet-'+viewport.width);
      await sheet.page.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
      const items=['cow','sheep','horse','dog','cat','chicken'].flatMap(kind=>['idle','walk','run'].flatMap(mode=>['front','side','rear'].map(angle=>({kind,mode,angle}))));
      await sheet.page.setContent('<style>body{margin:0;background:#e5dfd2;color:#362d24;font:15px Arial}h1{margin:15px;font-size:24px}main{display:grid;grid-template-columns:repeat(9,220px)}figure{margin:0;height:250px}figcaption{height:30px;padding-left:5px;line-height:30px}img{width:220px;height:220px;object-fit:cover}</style><h1>Actual farm rigs — '+viewport.width+'×'+viewport.height+' · sampled poses on existing flat path · shadows off</h1><main>'+items.map(({kind,mode,angle})=>'<figure><figcaption>'+kind+' '+mode+' '+angle+'</figcaption><img src="'+h.base+'farm3d/tests/artifacts/'+prefix+'-live-'+viewport.width+'-'+kind+'-'+mode+'-'+angle+'.png"></figure>').join('')+'</main>');
      await sheet.page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
      await sheet.page.screenshot({path:path.join(artifacts,prefix+'-live-sheet-'+viewport.width+'.png'),scale:'css'});
      assert.deepEqual(sheet.errors,[]);await sheet.finish();
    }
    fs.writeFileSync(path.join(artifacts,prefix+'-live-results.json'),JSON.stringify(live,null,2));
    failed=false;
  } finally {await h.close(failed);}
})().catch(error=>{console.error(error);process.exitCode=1;});
