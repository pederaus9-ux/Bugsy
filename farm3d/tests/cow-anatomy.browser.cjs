// B8 stationary anatomy inspection, separate from B18 player acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{
 const h=await start();let failed=true;const results=[];
 try{
  for(const viewport of [{width:844,height:390},{width:1280,height:720}]){
   const s=await h.setup(viewport,false,'cow-anatomy-'+viewport.width,false),page=s.page;
   await page.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
   await page.setContent('<style>html,body{margin:0;background:#e5dfd2}canvas{display:block}#label{position:absolute;top:12px;left:16px;font:18px Arial;color:#352f28}</style><div id="label"></div>');
   await page.evaluate(async()=>{
    const T=await import('/farm3d/lib/three.module.min.js'),C=await import('/farm3d/cow3d.js?v=3');
    const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);const scene=new T.Scene();scene.background=new T.Color(0xe5dfd2);
    scene.add(new T.HemisphereLight(0xffffff,0x726651,2));const sun=new T.DirectionalLight(0xffffff,2.3);sun.position.set(-3,5,-4);scene.add(sun);
    const floor=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshStandardMaterial({color:0xb5b98e,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
    const half=1.7*.8,aspect=innerWidth/innerHeight,camera=new T.OrthographicCamera(-half*aspect,half*aspect,half,-half,.01,30);
    window.anatomyStage={T,C,renderer,scene,camera};
   });
   for(const pose of ['idle','eating'])for(const [angle,yaw]of [['front',.25],['side',Math.PI/2],['rear',Math.PI+.25],['three-quarter',Math.PI/4]]){
    const row=await page.evaluate(({pose,angle,yaw})=>{
     const {T,C,renderer,scene,camera}=anatomyStage,r=C.createCow3D(1.7,0,0,'Bessie');scene.add(r.g);
     for(let n=0;n<120;n++)C.updateCow3D(r,0,0,1/60,n/60,pose);
     r.model.rotation.y=0;r.g.updateMatrixWorld(true);
     const center=new T.Vector3(0,1.7*.52,0);camera.position.set(Math.sin(yaw)*5,center.y+.55*1.7,-Math.cos(yaw)*5);camera.lookAt(center);renderer.render(scene,camera);
     const box=new T.Box3(),p=new T.Vector3();for(let v=0;v<r.card.geometry.attributes.position.count;v++)box.expandByPoint(r.card.getVertexPosition(v,p).applyMatrix4(r.card.matrixWorld));
     const buffer=renderer.getDrawingBufferSize(new T.Vector2()),before={...renderer.info.memory};
     for(let n=0;n<30;n++){const other=C.createCow3D(1.7,2,0,'Daisy');scene.add(other.g);renderer.render(scene,camera);scene.remove(other.g);other.dispose();other.dispose();renderer.render(scene,camera);}
     const after={...renderer.info.memory};
     document.getElementById('label').textContent='B8 anatomy candidate · '+pose+' · '+angle+' · '+innerWidth+'×'+innerHeight+' · no gait retune';
     const row={pose,angle,yaw,viewport:[innerWidth,innerHeight],buffer:buffer.toArray(),pixelRatio:renderer.getPixelRatio(),draws:renderer.info.render.calls,cowTriangles:r.card.geometry.attributes.position.count/3,actualSkinnedBounds:{min:box.min.toArray(),max:box.max.toArray()},before,after};
     scene.remove(r.g);r.dispose();return row;
    },{pose,angle,yaw});
    assert.deepEqual(row.buffer,[viewport.width,viewport.height]);assert.equal(row.pixelRatio,1);assert.equal(row.draws,2);assert.ok(row.cowTriangles<=10592);assert.deepEqual(row.after,row.before);
    await page.screenshot({path:path.join(artifacts,'cow-anatomy-'+viewport.width+'-'+pose+'-'+angle+'.png'),scale:'css'});results.push(row);
   }
   assert.deepEqual(s.errors,[]);await s.finish();
  }
  fs.writeFileSync(path.join(artifacts,'cow-anatomy-rendered.json'),JSON.stringify(results,null,2));console.log('PASS B8 full-resolution 16 views, rigid soles, geometry budget and 30 rebuilds per view');failed=false;
 }finally{await h.close(failed);}
})().catch(error=>{console.error(error);process.exitCode=1;});
