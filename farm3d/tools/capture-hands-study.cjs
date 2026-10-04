const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || '../tests/node_modules/playwright');
const root = path.resolve(__dirname,'../..');
const study = path.resolve(root,process.argv[2] || 'farm3d/assets/hands');
const reportDir = path.resolve(root,process.argv[3] || 'farm3d/tests/artifacts/hands-study');
fs.mkdirSync(reportDir, {recursive:true});
const assetUrl = '/'+path.relative(root,path.join(study,'hands-candidate.glb')).split(path.sep).join('/');
const html = `<!doctype html><html><head><style>html,body{margin:0;overflow:hidden}</style>
<script type="importmap">{"imports":{"three":"/farm3d/lib/three.module.min.js"}}</script></head><body>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from '/farm3d/lib/addons/loaders/GLTFLoader.js';
import {clone} from '/farm3d/lib/addons/utils/SkeletonUtils.js';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#263632');
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,100);
scene.add(new THREE.HemisphereLight(0xffedcd,0x526573,1.5));
const light=new THREE.DirectionalLight(0xfff1db,2);light.position.set(-1,2,1);scene.add(light);
// Warm the same PBR renderer before measuring asset ownership. r186 lazily
// creates a shared DFG lookup texture on the first StandardMaterial draw.
const warm=new THREE.Mesh(new THREE.BoxGeometry(.01,.01,.01),new THREE.MeshStandardMaterial());
warm.position.z=-1;scene.add(warm);renderer.render(scene,camera);
scene.remove(warm);warm.geometry.dispose();warm.material.dispose();renderer.render(scene,camera);
const baseline={...renderer.info.memory};
const gltf=await new GLTFLoader().loadAsync(${JSON.stringify(assetUrl)});scene.add(gltf.scene);
const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
const bones=[];gltf.scene.traverse(o=>{if(o.isBone)bones.push(o)});
const mixer=new THREE.AnimationMixer(gltf.scene);
const neutral=bones.map(o=>o.quaternion.toArray());
function show(name,time){mixer.stopAllAction();const clip=gltf.animations.find(a=>a.name===name);
 const action=mixer.clipAction(clip);action.reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;
 action.play();mixer.setTime(time);gltf.scene.updateMatrixWorld(true);renderer.render(scene,camera);
 return {name,time,quaternions:bones.map(o=>o.quaternion.toArray()),calls:renderer.info.render.calls,
  triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}
const copy=clone(gltf.scene), src=gltf.scene.getObjectByName('R_finger1_0'), dst=copy.getObjectByName('R_finger1_0');
dst.rotation.x=.3;
const cloneIndependent=src!==dst&&src.rotation.x!==dst.rotation.x;
const copyMeshes=[];copy.traverse(o=>{if(o.isSkinnedMesh)copyMeshes.push(o)});
const sharedGeometry=copyMeshes.every(o=>meshes.find(m=>m.name===o.name).geometry===o.geometry);
const clonedBonesIndependent=copyMeshes.every(o=>o.skeleton.bones.every(b=>!bones.includes(b)));
function cycles(){
 renderer.render(scene,camera);const start={...renderer.info.memory};let peakTextures=start.textures;
 for(let i=0;i<30;i++){
   const other=clone(gltf.scene);scene.add(other);renderer.render(scene,camera);
   peakTextures=Math.max(peakTextures,renderer.info.memory.textures);
   const skeletons=new Set();other.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton)});
   scene.remove(other);skeletons.forEach(s=>s.dispose());renderer.render(scene,camera);
   if(renderer.info.memory.geometries!==start.geometries||renderer.info.memory.textures!==start.textures)
     throw new Error('clone resource growth on cycle '+i);
 }return {cycles:30,start,end:{...renderer.info.memory},peakTextures};
}
function dispose(){mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);scene.remove(gltf.scene);
 const geometries=new Set(meshes.map(o=>o.geometry)),materials=new Set(meshes.map(o=>o.material));
 const skeletons=new Set([...meshes,...copyMeshes].map(o=>o.skeleton));
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());skeletons.forEach(s=>s.dispose());
 renderer.render(scene,camera);return {...renderer.info.memory};}
window.study={show,dispose,cycles,neutral,baseline,meshCount:meshes.length,boneCount:bones.length,
 animations:gltf.animations.map(a=>({name:a.name,duration:a.duration,tracks:a.tracks.length})),
 cloneIndependent,sharedGeometry,clonedBonesIndependent};
</script></body></html>`;
const server=http.createServer((req,res)=>{
  if(req.url==='/study.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  if(req.url==='/favicon.ico'){res.statusCode=204;res.end();return;}
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.statusCode=403;res.end();return;}
  fs.readFile(file,(error,bytes)=>{if(error){res.statusCode=404;res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(bytes);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,
   args:process.platform==='win32'?['--use-angle=d3d11']:[]});
 const results=[];
 try{
 for(const width of [844,1280]){
   const page=await browser.newPage({viewport:{width,height:width===844?390:720},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/study.html');
   await page.waitForFunction(()=>window.study,{timeout:30000});
   const info=await page.evaluate(()=>({meshCount:study.meshCount,boneCount:study.boneCount,
     animations:study.animations,cloneIndependent:study.cloneIndependent,
     sharedGeometry:study.sharedGeometry,clonedBonesIndependent:study.clonedBonesIndependent,baseline:study.baseline}));
   assert.equal(info.meshCount,4);assert.equal(info.boneCount,32);
   assert(info.cloneIndependent&&info.sharedGeometry&&info.clonedBonesIndependent);
   assert.deepEqual(info.animations.map(a=>a.name).sort(),['feed','harvest','idle','pet','plant','water']);
   const poses=[];
   for(const clip of info.animations){
     assert(clip.tracks>0&&clip.duration>0);
     const pose=await page.evaluate(a=>study.show(a.name,a.duration/2),clip);
     assert.equal(pose.calls,4);assert(pose.triangles>0&&pose.triangles<6000);
     assert.equal(pose.geometries,4);
     await page.screenshot({path:path.join(reportDir,width+'-'+clip.name+'.png'),timeout:30000});
     const end=await page.evaluate(a=>{const pose=study.show(a.name,a.duration);
       const error=Math.max(...pose.quaternions.flatMap((q,i)=>q.map((n,k)=>Math.abs(n-study.neutral[i][k]))));
       return {error,pose};},clip);
     assert(end.error<1e-6,'clip must return to neutral: '+clip.name);
     poses.push({...pose,neutralResetError:end.error});
   }
   const cycles=await page.evaluate(()=>study.cycles());
   assert.equal(cycles.cycles,30);assert.equal(cycles.end.textures,cycles.start.textures);
   const cleanup=await page.evaluate(()=>study.dispose());
   assert.equal(cleanup.geometries,info.baseline.geometries);
   assert.equal(cleanup.textures,info.baseline.textures);
   assert.deepEqual(errors,[]);
   results.push({width,info,poses,cycles,cleanup,errors});await page.close();
 }
 fs.writeFileSync(path.join(reportDir,'results.json'),JSON.stringify({scope:'isolated exported asset, not game/device acceptance',results},null,2));
 console.log('PASS exported GLTFLoader: six clips, neutral reset, clone independence, draw budget and cleanup at both viewports');
 }finally{await browser.close();server.close();}
})().catch(e=>{fs.writeFileSync(path.join(reportDir,'failure.txt'),e.stack);console.error(e);server.close();process.exitCode=1;});
