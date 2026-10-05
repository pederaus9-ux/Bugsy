// B1 proposed reference targets. Never imported by production; no geometry replacement.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {start}=require('../tests/browser-harness.cjs');
const repo=path.resolve(__dirname,'../..'),out=path.resolve(process.env.COW_B1_OUT||path.join(repo,'farm3d/tests/artifacts/cow-b1'));
const base='75baac10fc3e4294062b67d44dee7c9e1325f94c';
const control=execFileSync('git',['show',base+':farm3d/cow3d.js'],{cwd:repo,encoding:'utf8'});
const proposed=fs.readFileSync(path.join(repo,'farm3d/evidence/cow-b1/proposed-reference-source.txt'),'utf8');
const norm=s=>s.replace(/\r\n/g,'\n'),hash=s=>createHash('sha256').update(norm(s)).digest('hex');
const motion=s=>norm(s).slice(norm(s).indexOf('export function createCow3D('));
assert.equal(motion(control),motion(proposed),'public APIs, movement, gait and behavior remain the frozen control');
assert.equal(control.match(/export const COW_GAIT=.*;/)[0],proposed.match(/export const COW_GAIT=.*;/)[0]);
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const h=await start();let failed=true;const records=[];
 try{
  const s=await h.setup({width:1280,height:720},false,'cow-b1-reference',false),p=s.page;
  await p.route('**/cow-b1-control.js',r=>r.fulfill({contentType:'text/javascript',body:control.replace("from './lib/three.module.min.js'","from '/farm3d/lib/three.module.min.js'")}));
  await p.route('**/cow-b1-proposed.js',r=>r.fulfill({contentType:'text/javascript',body:proposed.replace("from './lib/three.module.min.js'","from '/farm3d/lib/three.module.min.js'")}));
  await p.goto(h.base+'farm3d/tests/fixtures/farmer-stage-a.js');
  await p.setContent('<style>html,body{margin:0;background:#e5dfd2;font:18px Arial;color:#352f28}#title{height:40px;display:flex;align-items:center;padding-left:18px}#row{display:flex}canvas{display:block}.caption{width:640px;text-align:center;height:30px}#captions{display:flex}</style><div id="title"></div><div id="captions"><div class="caption">B0 frozen production control</div><div class="caption">B1 PROPOSED target · owner review pending</div></div><div id="row"></div>');
  const measured=await p.evaluate(async()=>{
   const T=await import('/farm3d/lib/three.module.min.js'),modules=[await import('/cow-b1-control.js'),await import('/cow-b1-proposed.js')],stages=[];
   for(let i=0;i<2;i++){
    const C=modules[i],renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(640,650);renderer.toneMapping=T.ACESFilmicToneMapping;document.getElementById('row').appendChild(renderer.domElement);
    const scene=new T.Scene();scene.background=new T.Color(0xe5dfd2);scene.add(new T.HemisphereLight(0xffffff,0x726651,2));const sun=new T.DirectionalLight(0xffffff,2.3);sun.position.set(-3,5,-4);scene.add(sun);
    const floor=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshStandardMaterial({color:0xb5b98e,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
    const r=C.createCow3D(1.7,0,0,'Bessie');r.g.updateMatrixWorld(true);scene.add(r.g);
    const half=1.7*.8,camera=new T.OrthographicCamera(-half*640/650,half*640/650,half,-half,.01,30);
    const box=new T.Box3(),parts=new Map(),g=r.card.geometry;let blended=0;
    for(let v=0;v<g.attributes.position.count;v++){
     const point=r.card.getVertexPosition(v,new T.Vector3()).applyMatrix4(r.card.matrixWorld);box.expandByPoint(point);
     const bone=r.card.skeleton.bones[g.attributes.skinIndex.getX(v)].name;if(!parts.has(bone))parts.set(bone,new T.Box3());parts.get(bone).expandByPoint(point);
     if(g.attributes.skinWeight.getY(v)>0||g.attributes.skinWeight.getZ(v)>0)blended++;
    }
    stages.push({renderer,scene,camera,r});
    stages[i].measurement={label:i?'proposed':'B0',height:1.7,scale:r.model.scale.x,triangles:g.attributes.position.count/3,bones:r.card.skeleton.bones.length,blendedVertices:blended,actualSkinnedBounds:{min:box.min.toArray(),max:box.max.toArray(),size:box.getSize(new T.Vector3()).toArray()},parts:[...parts].map(([bone,b])=>({primaryWeightBone:bone,min:b.min.toArray(),max:b.max.toArray()}))};
   }
   window.cowB1Stages={T,stages};return stages.map(s=>s.measurement);
  });
  const [b0,target]=measured;
  for(let i=0;i<3;i++){assert.ok(target.actualSkinnedBounds.min[i]>=b0.actualSkinnedBounds.min[i]-.002);assert.ok(target.actualSkinnedBounds.max[i]<=b0.actualSkinnedBounds.max[i]+.002);}
  assert.equal(target.bones,b0.bones);assert.ok(target.triangles<=b0.triangles);assert.equal(b0.blendedVertices,0);assert.ok(target.blendedVertices>100);
  for(const [angle,yaw]of [['front',.25],['side',Math.PI/2],['rear',Math.PI+.25]]){
   const rows=await p.evaluate(({angle,yaw})=>{
    const {T,stages}=cowB1Stages,center=new T.Vector3(0,1.7*.52,0);document.getElementById('title').textContent='B1 proportion reference · '+angle+' · same scale / pose / camera / light · game coordinates';
    return stages.map(({renderer,scene,camera,measurement})=>{camera.position.set(Math.sin(yaw)*5,center.y+.55*1.7,-Math.cos(yaw)*5);camera.lookAt(center);renderer.render(scene,camera);return {...measurement,angle,yaw,camera:{position:camera.position.toArray(),target:center.toArray(),halfHeight:1.7*.8},buffer:renderer.getDrawingBufferSize(new T.Vector2()).toArray(),pixelRatio:renderer.getPixelRatio(),draws:renderer.info.render.calls};});
   },{angle,yaw});
   for(const row of rows){assert.deepEqual(row.buffer,[640,650]);assert.equal(row.pixelRatio,1);assert.equal(row.draws,2);}
   assert.deepEqual(rows[0].camera,rows[1].camera);records.push(...rows);await p.screenshot({path:path.join(out,'cow-b1-'+angle+'.png'),scale:'css'});
  }
  assert.deepEqual(s.errors,[]);
  fs.writeFileSync(path.join(out,'cow-b1-measurements.json'),JSON.stringify({base,cowBlob:'866bb94666a58fd2f5402b440789255ce8264dee',controlNormalizedSha256:hash(control),proposedNormalizedSha256:hash(proposed),publicApiAndMotionEqual:true,units:'game coordinates; no physical meter calibration',measurementMethod:'every actual skinned vertex, Bessie height1.7 initial idle at origin; part bins use dominant weight, not separate anatomical volumes',envelopeTolerance:.002,neutralEnvelopePass:true,meaning:'proposed B1 reference, not accepted production anatomy, B8 or physical acceptance',records},null,2)+'\n');
  console.log('PASS B1 proposed reference: 3 matched pairs, actual neutral envelope, unchanged motion/24 bones, budget',JSON.stringify(measured.map(({label,triangles,actualSkinnedBounds})=>({label,triangles,actualSkinnedBounds}))));
  failed=false;await s.finish();
 }finally{await h.close(failed);}
})().catch(error=>{console.error(error);process.exitCode=1;});
