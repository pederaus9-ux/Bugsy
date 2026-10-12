// Motion evidence: real candidate chicken, sampled without relocating contacts.
const fs=require('fs');
const path=require('path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{
  const h=await start();let failed=true;
  try{
    const s=await h.setup({width:1200,height:900},false,'chicken-baseline');
    await s.page.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
    const metrics=await s.page.evaluate(async()=>{
      // A standalone deterministic scene; production rig and updater unchanged.
      const T=await import('/farm3d/lib/three.module.min.js');
      const {createChicken3D,updateChicken3D}=await import('/farm3d/chicken3d.js');
      document.body.innerHTML='';document.body.style='margin:0;background:#e4e0d4;font:16px Arial';
      const title=document.createElement('h2');title.textContent='Chicken — real rig · walk, stop, restart and run';document.body.append(title);
      const grid=document.createElement('div');grid.style='display:grid;grid-template-columns:repeat(3,390px)';document.body.append(grid);
      const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(390,250);
      const scene=new T.Scene();scene.background=new T.Color(0xe4e0d4);
      scene.add(new T.HemisphereLight(0xffffff,0x666655,2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(2,4,3);scene.add(light);
      const ground=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x82956d}));ground.rotation.x=-Math.PI/2;scene.add(ground);
      const r=createChicken3D(.72);scene.add(r.g);
      const camera=new T.OrthographicCamera(-.78,.78,.5,-.5,.01,30);
      const rows=[],faceImages=[];let worstContact=0;
      const faceBones=new Set([r.head,...r.ears].map(b=>r.card.skeleton.bones.indexOf(b)));
      function capture(label,yaw,face=false){
        r.g.updateMatrixWorld(true);r.card.skeleton.update();
        const center=new T.Vector3(r.g.position.x,.35,r.g.position.z);
        camera.position.copy(center).add(new T.Vector3(Math.sin(yaw)*4,.15,-Math.cos(yaw)*4));camera.lookAt(center);camera.updateMatrixWorld(true);
        // Frame actual skinned vertices, including ears/head, with 12% padding.
        // Keep the same 390x250 resolution; neither the rig nor its contacts move.
        const viewBounds=new T.Box3(),points=[];
        for(let i=0;i<r.card.geometry.attributes.position.count;i++){
          if(face&&!faceBones.has(r.card.geometry.attributes.skinIndex.getX(i)))continue;
          const p=r.card.getVertexPosition(i,new T.Vector3()).applyMatrix4(r.card.matrixWorld);
          points.push(p);viewBounds.expandByPoint(p.clone().applyMatrix4(camera.matrixWorldInverse));
        }
        const cx=(viewBounds.min.x+viewBounds.max.x)/2,cy=(viewBounds.min.y+viewBounds.max.y)/2;
        const halfY=Math.max((viewBounds.max.y-viewBounds.min.y)/2,(viewBounds.max.x-viewBounds.min.x)/(2*390/250))*1.12;
        const halfX=halfY*390/250;
        camera.left=cx-halfX;camera.right=cx+halfX;camera.top=cy+halfY;camera.bottom=cy-halfY;camera.updateProjectionMatrix();
        let maxProjectedExtent=0;
        for(const p of points){p.project(camera);maxProjectedExtent=Math.max(maxProjectedExtent,Math.abs(p.x),Math.abs(p.y));}
        if(maxProjectedExtent>.98)throw new Error('chicken anatomy clipped by capture camera '+maxProjectedExtent);
        renderer.render(scene,camera);
        const box=document.createElement('figure');box.style='margin:0';const img=document.createElement('img');img.src=renderer.domElement.toDataURL();box.append(img);const caption=document.createElement('figcaption');caption.textContent=label;box.append(caption);grid.append(box);
        if(face)faceImages.push({label,dataURL:img.src});
        rows.push({label,maxProjectedExtent,root:r.g.position.toArray(),phase:r.state.phase,feet:r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()).toArray()),hipY:r.legs.map(l=>l.hip.position.y),bodyDrop:r.chickenController.bodyDrop,contactStates:r.chickenController.feet.map(f=>f.state),planted:r.legs.map(l=>l.planted)});
      }
      updateChicken3D(r,0,0,1/60,'idle');
      capture('Idle front',0);capture('Idle side',Math.PI/2);capture('Idle rear',Math.PI);
      capture('Face front',0,true);capture('Face three-quarter',Math.PI/4,true);capture('Face side',Math.PI/2,true);
      for(let sample=0;sample<6;sample++){
        for(let frame=0;frame<20;frame++){
          r.g.position.z-=.8/60;updateChicken3D(r,0,-.8/60,1/60,'walk');r.g.updateMatrixWorld(true);
          for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());worstContact=Math.max(worstContact,Math.hypot(f.x-l.ax,f.z-l.az));}
        }
        capture('Walk '+(sample+1)+' · frame '+((sample+1)*20),Math.PI/2);
      }
      // Continue the same rig: root stops; camera still follows actual geometry.
      r.g.updateMatrixWorld(true);
      const stoppedXZ=r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()));
      let idleFrame=0;
      for(const frames of [1,2,7,10,20,20]){
        for(let n=0;n<frames;n++){
          updateChicken3D(r,0,0,1/60,'idle');r.g.updateMatrixWorld(true);idleFrame++;
          for(let i=0;i<r.legs.length;i++){
            const f=r.legs[i].foot.getWorldPosition(new T.Vector3());
            worstContact=Math.max(worstContact,Math.hypot(f.x-stoppedXZ[i].x,f.z-stoppedXZ[i].z));
          }
        }
        capture('Stop · frame '+idleFrame,Math.PI/2);
      }
      // Resume the same gait without resetting phase or moving contacts in staging.
      let restartFrame=0;
      for(const frames of [1,2,7,10,20,20]){
        for(let frame=0;frame<frames;frame++){
          restartFrame++;r.g.position.z-=.8/60;updateChicken3D(r,0,-.8/60,1/60,'walk');r.g.updateMatrixWorld(true);
          for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());worstContact=Math.max(worstContact,Math.hypot(f.x-l.ax,f.z-l.az));}
        }
        capture('Restart walk · frame '+restartFrame,Math.PI/2);
      }
      let runFrame=0;
      for(const frames of [1,2,4,8,15,30]){
        for(let frame=0;frame<frames;frame++){
          runFrame++;r.g.position.z-=2.4/60;updateChicken3D(r,0,-2.4/60,1/60,'run');r.g.updateMatrixWorld(true);
          for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());worstContact=Math.max(worstContact,Math.hypot(f.x-l.ax,f.z-l.az));}
        }
        capture('Run · frame '+runFrame,Math.PI/2);
      }
      const runStop=r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()));
      idleFrame=0;
      for(const frames of [1,2,7,10,20,20]){
        for(let n=0;n<frames;n++){
          updateChicken3D(r,0,0,1/60,'idle');r.g.updateMatrixWorld(true);idleFrame++;
          for(let i=0;i<r.legs.length;i++){const f=r.legs[i].foot.getWorldPosition(new T.Vector3());worstContact=Math.max(worstContact,Math.hypot(f.x-runStop[i].x,f.z-runStop[i].z));}
        }
        capture('Run stop · frame '+idleFrame,Math.PI/2);
      }
      for(const [label,side]of [['90° right turn',1],['180° reversal',-1]]){
        let turnFrame=0;
        for(const frames of [1,2,7,10,20,20]){
          for(let n=0;n<frames;n++){
            const dx=side*.8/60;r.g.position.x+=dx;updateChicken3D(r,dx,0,1/60,'walk');r.g.updateMatrixWorld(true);turnFrame++;
            for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());worstContact=Math.max(worstContact,Math.hypot(f.x-l.ax,f.z-l.az));}
          }
          capture(label+' · frame '+turnFrame,Math.PI/4);
        }
      }
      await Promise.all([...grid.querySelectorAll('img')].map(img=>img.decode()));
      if(worstContact>.002)throw new Error('chicken continuous capture contact error '+worstContact);
      renderer.dispose();r.dispose();ground.geometry.dispose();ground.material.dispose();return {rows,worstContactM:worstContact,faceImages};
    });
    await s.page.screenshot({path:path.join(artifacts,'chicken-baseline-gallery.png'),scale:'css',fullPage:true});
    for(const [i,face]of metrics.faceImages.entries())fs.writeFileSync(path.join(artifacts,['chicken-face-front.png','chicken-face-three-quarter.png','chicken-face-side.png'][i]),Buffer.from(face.dataURL.split(',')[1],'base64'));
    delete metrics.faceImages;
    fs.writeFileSync(path.join(artifacts,'chicken-baseline-metrics.json'),JSON.stringify({metrics,errors:s.errors},null,2));
    if(s.errors.length)throw new Error(s.errors.join('\n'));
    console.log('Chicken: 3 idle views,3face close-ups plus42continuous walk/stop/restart/run/run-stop/turn/reversal samples; no browser errors');failed=false;
  }finally{await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});
