// Render the actual production instanced leaves/flowers with their real materials.
// Missing geometry colors must not multiply the instance palette down to black.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;const results=[];
try{for(const width of [844,1280]){
 const s=await h.setup({width,height:width===844?390:720},width===844,'vegetation-color-'+width),p=s.page;
 await p.goto(h.base+'farm3d/?testfarm&debug&portrait&preset=noon');
 await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 const result=await p.evaluate(async()=>{
  const T=await import('./lib/three.module.min.js'),d=__dbg,root=d.scene.getObjectByName('Phase7M-MaxWow');
  const meshes=root.children.filter(o=>o.isInstancedMesh&&o.instanceColor),samples=[];
  const renderer=d.renderer,target=new T.WebGLRenderTarget(512,256),savedTarget=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
  // Sample display colors, as the game canvas does, rather than linear RGB bytes.
  target.texture.colorSpace=T.SRGBColorSpace;
  try{renderer.setClearColor(0,0);
   for(const original of meshes){
    const scene=new T.Scene(),mesh=original.clone(),bounds=new T.Box3().setFromObject(mesh),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
    const scale=7/Math.max(size.x,size.y,size.z);mesh.position.sub(center).multiplyScalar(scale);mesh.scale.multiplyScalar(scale);scene.add(mesh,new T.AmbientLight(0xffffff,2));
    const camera=new T.OrthographicCamera(-8,8,4,-4,.1,40);camera.position.set(0,0,20);camera.lookAt(0,0,0);
    renderer.setRenderTarget(target);renderer.render(scene,camera);
    const pixels=new Uint8Array(512*256*4);renderer.readRenderTargetPixels(target,0,0,512,256,pixels);
    let visible=0,lit=0,green=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<200)continue;visible++;if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>30)lit++;if(pixels[i+1]>pixels[i]*1.2&&pixels[i+1]>pixels[i+2]*1.2)green++;}
    samples.push({name:original.name,count:original.count,visible,lit,green,vertexColors:original.material.vertexColors,geometryColors:!!original.geometry.attributes.color});
   }
  }finally{renderer.setRenderTarget(savedTarget);renderer.setClearColor(clear,alpha);target.dispose();}
  const ivy=root.children.find(o=>o.isInstancedMesh&&o.count===58),matrix=new T.Matrix4(),centers=[];
  for(let i=0;i<ivy.count;i++){ivy.getMatrixAt(i,matrix);centers.push(new T.Vector3().setFromMatrixPosition(matrix).toArray());}
  return {samples,centers,save:localStorage.getItem('sunny-acres-3d-v1')};
 });results.push({width,...result});
 assert.equal(result.samples.length,2,'actual flower heads and ivy are exercised');
 for(const sample of result.samples){assert.ok(sample.visible>30,'real geometry reached the target');assert.ok(sample.lit/sample.visible>.95,'instanced palette renders color rather than black: '+JSON.stringify(sample));}
 const ivy=result.samples.find(v=>v.count===58);assert.ok(ivy.green/ivy.visible>.95,'ivy keeps its green palette');
 assert.ok(result.centers.every(([x,y,z])=>Math.abs(x)>3.1&&Math.abs(x)<3.85&&y>.7&&y<3.6&&z>5.65&&z<5.8),'ivy belongs to the front wall below the eaves, outside the door and trim');
 assert.equal(result.save,null);assert.deepEqual(s.errors,[]);await s.finish();console.log('PASS real vegetation palette and wall placement',width);
 }failed=false;}finally{fs.writeFileSync(path.join(artifacts,'vegetation-color-results.json'),JSON.stringify(results,null,2));await h.close(failed);}})().catch(e=>{console.error(e);process.exitCode=1;});
