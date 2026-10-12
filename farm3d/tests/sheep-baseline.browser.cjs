// Read-only baseline: real production sheep, sampled without relocating contacts.
const fs=require('fs');
const path=require('path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{
  const h=await start();let failed=true;
  try{
    const s=await h.setup({width:1200,height:900},false,'sheep-baseline');
    await s.page.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
    const metrics=await s.page.evaluate(async()=>{
      // A standalone deterministic scene; production rig and updater unchanged.
      const T=await import('/farm3d/lib/three.module.min.js');
      const {createSheep3D,updateSheep3D}=await import('/farm3d/sheep3d.js');
      document.body.innerHTML='';document.body.style='margin:0;background:#e4e0d4;font:16px Arial';
      const title=document.createElement('h2');title.textContent='Sheep baseline — production rig · idle and continuous walk';document.body.append(title);
      const grid=document.createElement('div');grid.style='display:grid;grid-template-columns:repeat(3,390px)';document.body.append(grid);
      const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(390,250);
      const scene=new T.Scene();scene.background=new T.Color(0xe4e0d4);
      scene.add(new T.HemisphereLight(0xffffff,0x666655,2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(2,4,3);scene.add(light);
      const ground=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x82956d}));ground.rotation.x=-Math.PI/2;scene.add(ground);
      const r=createSheep3D(.9);scene.add(r.g);
      const camera=new T.OrthographicCamera(-.78,.78,.5,-.5,.01,30);
      const rows=[];let worstContact=0;
      function capture(label,yaw){
        r.g.updateMatrixWorld(true);r.card.skeleton.update();
        const center=new T.Vector3(r.g.position.x,.49,r.g.position.z);
        camera.position.copy(center).add(new T.Vector3(Math.sin(yaw)*4,.15,-Math.cos(yaw)*4));camera.lookAt(center);renderer.render(scene,camera);
        const box=document.createElement('figure');box.style='margin:0';const img=document.createElement('img');img.src=renderer.domElement.toDataURL();box.append(img);const caption=document.createElement('figcaption');caption.textContent=label;box.append(caption);grid.append(box);
        rows.push({label,root:r.g.position.toArray(),phase:r.state.phase,feet:r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()).toArray()),hipY:r.legs.map(l=>l.hip.position.y),planted:r.legs.map(l=>l.planted)});
      }
      updateSheep3D(r,0,0,1/60,'idle');
      capture('Idle front',0);capture('Idle side',Math.PI/2);capture('Idle rear',Math.PI);
      for(let sample=0;sample<6;sample++){
        for(let frame=0;frame<20;frame++){
          r.g.position.z-=.35/60;updateSheep3D(r,0,-.35/60,1/60,'walk');r.g.updateMatrixWorld(true);
          for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());worstContact=Math.max(worstContact,Math.hypot(f.x-l.ax,f.z-l.az));}
        }
        capture('Walk '+(sample+1)+' · frame '+((sample+1)*20),Math.PI/2);
      }
      await Promise.all([...grid.querySelectorAll('img')].map(img=>img.decode()));
      if(worstContact>.002)throw new Error('sheep continuous capture contact error '+worstContact);
      renderer.dispose();r.dispose();ground.geometry.dispose();ground.material.dispose();return {rows,worstContactM:worstContact};
    });
    await s.page.screenshot({path:path.join(artifacts,'sheep-baseline-gallery.png'),scale:'css'});
    fs.writeFileSync(path.join(artifacts,'sheep-baseline-metrics.json'),JSON.stringify({metrics,errors:s.errors},null,2));
    if(s.errors.length)throw new Error(s.errors.join('\n'));
    console.log('Sheep baseline: 3 idle views, 6 continuous walk samples; no browser errors');failed=false;
  }finally{await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});
