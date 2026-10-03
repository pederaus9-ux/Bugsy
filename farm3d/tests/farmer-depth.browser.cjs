const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;
 try{const s=await h.setup({width:1280,height:720},false,'farmer-extra-qa'),page=s.page;
 await page.goto(h.base+'farm3d/?testfarm&debug&portrait');
 await page.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 await page.evaluate(()=>{const d=__dbg;d.G.opts.quiet=true;d.G.close();d.renderer.shadowMap.enabled=false;d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;});
 const pixels=await page.evaluate(async()=>{
   const T=await import('./lib/three.module.min.js'),d=__dbg;
   let farmer;d.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')farmer=o;});
   const rig=farmer.userData.live;
   const testScene=new T.Scene();testScene.add(new T.AmbientLight(0xffffff,3));
   const blocker=new T.Mesh(new T.BoxGeometry(2,3,.1),new T.MeshBasicMaterial({color:0xff0000}));blocker.position.set(0,.9,-.8);testScene.add(blocker);
   const camera=new T.PerspectiveCamera(35,1,.1,20);camera.position.set(0,.9,-5);camera.lookAt(0,.9,0);
   const rt=new T.WebGLRenderTarget(128,128),rgba=new Uint8Array(4);
   const probe=()=>{const parent=rig.g.parent,p=rig.g.position.clone(),q=rig.g.quaternion.clone(),scale=rig.g.scale.clone();
    testScene.add(rig.g);rig.g.position.set(0,0,0);rig.g.quaternion.identity();rig.g.scale.setScalar(1);
    d.renderer.setRenderTarget(rt);d.renderer.render(testScene,camera);d.renderer.readRenderTargetPixels(rt,64,64,1,1,rgba);
    d.renderer.setRenderTarget(null);parent.add(rig.g);rig.g.position.copy(p);rig.g.quaternion.copy(q);rig.g.scale.copy(scale);return Array.from(rgba);};
   d.G.view.wardrobe(true);const open=probe();d.G.view.wardrobe(false);const closed=probe();
   rt.dispose();blocker.geometry.dispose();blocker.material.dispose();return {open,closed};
 });
 const red=p=>p[0]>150&&p[1]<30&&p[2]<30;
 assert.equal(red(pixels.open),false,'fitting farmer stays in front of foreground blocker');
 assert.equal(red(pixels.closed),true,'normal foreground depth returns after wardrobe close');
 console.log('PASS browser-rendered wardrobe depth restoration',pixels);
 fs.writeFileSync(path.join(artifacts,'farmer-depth-result.json'),JSON.stringify(pixels,null,2));
 await page.evaluate(()=>{const d=__dbg;d.cam.target.set(1.3,0,16.2);d.view.target.set(1.3,0,16.2);d.cam.dist=d.view.dist=5.5;d.cam.yaw=d.view.yaw=0;d.placeCamera();});
 for(const id of ['rosa','joe','mia','sam','lily']){
  await page.evaluate(id=>{__dbg.G.S.visitor={id,items:{wheat:1}};__dbg.G.view.refresh('visitor');},id);
  await page.waitForFunction(id=>{let v;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='visitor')v=o;});return v?.visible&&v.userData.who===id&&v.userData.live;},id);
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(artifacts,'visitor-'+id+'.png')});
 }
 assert.deepEqual(s.errors,[]);failed=false;console.log('PASS five actual in-game visitor screenshots');
 }finally{await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});

