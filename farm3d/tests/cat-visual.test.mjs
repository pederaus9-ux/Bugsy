import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as T from '../lib/three.module.min.js';
import {createLiveAnimal,updateLiveAnimal} from '../live3d.js';
import {createCow3D} from '../cow3d.js';
const frozen=JSON.parse(readFileSync(new URL('./baselines/cat-visual-protected.json',import.meta.url)));
const digest=s=>createHash('sha256').update(s).digest('hex');
test('cat visual correction preserves other species, cat body/tail/lower legs/paws and every rest bone',()=>{
 for(const[k,h]of Object.entries({cow:1.7,sheep:1.2,horse:2.3,dog:1.15,cat:.85,chicken:.72})){
  const r=k==='cow'?createCow3D(h):createLiveAnimal(k,h);
  try{
   const g=r.card.geometry,attrs=Object.keys(g.attributes).sort(),values=[];
   const allowed=k==='cat'?new Set([r.head,...r.ears,...r.legs.map(l=>l.hip)].map(b=>r.card.skeleton.bones.indexOf(b))):new Set();
   for(let i=0;i<g.attributes.position.count;i++)if(!allowed.has(g.attributes.skinIndex.getX(i)))for(const a of attrs){const v=g.attributes[a];for(let j=0;j<v.itemSize;j++)values.push(v.array[i*v.itemSize+j]);}
   assert.equal(digest(JSON.stringify(values)),frozen.rigs[k].geometryDigest,k+' protected mesh changed');
   assert.equal(digest(JSON.stringify(r.card.skeleton.bones.map(b=>({name:b.name,p:b.position.toArray(),q:b.quaternion.toArray(),parent:r.card.skeleton.bones.indexOf(b.parent)})))),frozen.rigs[k].bonesDigest,k+' rest pose changed');
  }finally{r.dispose();}
 }
});
function components(points){
  const parent=new Map(),key=p=>p.toArray().map(x=>Math.round(x*1e6)).join(','),keys=points.map(key);
  const find=k=>{if(!parent.has(k))parent.set(k,k);if(parent.get(k)!==k)parent.set(k,find(parent.get(k)));return parent.get(k);};
  for(let i=0;i<keys.length;i+=3){const root=find(keys[i]);for(let j=1;j<3;j++)parent.set(find(keys[i+j]),root);}
  const groups=new Map();points.forEach((p,i)=>{const k=find(keys[i]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);});return [...groups.values()];
}
function inside(points,p){
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flatMap(v=>v.toArray()),3));
  const material=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld(true);
  try{
    const hits=new T.Raycaster(p,new T.Vector3(0,0,1)).intersectObject(mesh);
    return new Set(hits.filter(h=>h.distance>1e-7).map(h=>h.distance.toFixed(6))).size%2===1;
  }finally{geometry.dispose();material.dispose();}
}

function authoredPoints(r,bone,color){
 const g=r.card.geometry,b=r.card.skeleton.bones.indexOf(bone),c=new T.Color(color),points=[];
 for(let i=0;i<g.attributes.position.count;i++)if(g.attributes.skinIndex.getX(i)===b&&Math.abs(g.attributes.color.getX(i)-c.r)<1e-6&&Math.abs(g.attributes.color.getY(i)-c.g)<1e-6&&Math.abs(g.attributes.color.getZ(i)-c.b)<1e-6)points.push(new T.Vector3().fromBufferAttribute(g.attributes.position,i));
 return points;
}
test('cat has compact cheek pads, one triangular nose, whiskers and embedded ears',()=>{
 const r=createLiveAnimal('cat',.85);
 try{
  const nose=authoredPoints(r,r.head,0xd58d96),pads=authoredPoints(r,r.head,r.spec.muzzle),skull=authoredPoints(r,r.head,r.spec.coat);
  assert.ok(nose.length>0,'one pink feline nose required');assert.equal(components(nose).length,1);
  assert.equal(new Set(nose.map(p=>p.toArray().map(x=>x.toFixed(6)).join(','))).size,6,'triangular prism nose required');
  const nb=new T.Box3().setFromPoints(nose),cheeks=components(pads);assert.equal(cheeks.length,3,'two cheek pads and lower jaw required');
  assert.ok(nb.max.x-nb.min.x<.025,'nose must stay compact');assert.ok(Math.abs(nb.getCenter(new T.Vector3()).x)<1e-7,'single centered nose');
  const mb=new T.Box3().setFromPoints(pads);assert.ok(mb.max.x-mb.min.x<.10,'broad pig snout persists');
  const back=nose.reduce((a,p)=>p.y<a.y&&p.z>nb.min.z+.004?p:a,nose[3]);assert.ok(cheeks.some(c=>inside(c,back)),'actual nose back must intersect cheek pad');
  assert.equal(authoredPoints(r,r.head,0x25221e).length,0,'paired nostril dots must be gone');
  assert.ok(authoredPoints(r,r.head,0x302d2b).length>0,'mouth line required');
  assert.equal(components(authoredPoints(r,r.head,0xf3eee3)).length,6,'three whiskers each side');
  for(const ear of r.ears)assert.ok(authoredPoints(r,ear,r.spec.coat).some(p=>inside(skull,p)),'ear base must intersect actual skull');
 }finally{r.dispose();}
});
test('cat upper legs are continuous and remain attached to actual body across motion',()=>{
 for(const height of [.4,.85])for(const hz of [30,60,120])for(const mode of ['walk','run','turn']){
  const r=createLiveAnimal('cat',height),g=r.card.geometry,dt=1/hz,body=r.card.skeleton.bones.indexOf(r.body);
  const bodyIds=[],anchors=r.legs.map(()=>[]),tips=r.legs.map(()=>[]);
  for(let i=0;i<g.attributes.position.count;i++){
   if(g.attributes.skinIndex.getX(i)===body)bodyIds.push(i);
   for(const[j,l]of r.legs.entries())if(g.attributes.skinIndex.getX(i)===r.card.skeleton.bones.indexOf(l.hip)){
    if(g.attributes.skinWeight.getY(i)>.999)anchors[j].push(i);
    if(g.attributes.position.getY(i)<.101)tips[j].push(i);
   }
  }
  try{
   for(let i=0;i<g.attributes.skinWeight.count;i++){const w=g.attributes.skinWeight;assert.equal(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i),1,'stored skin weights must sum exactly to one');}
   for(const[j,l]of r.legs.entries()){
    assert.equal(components(authoredPoints(r,l.hip,r.spec.coat)).length,1,'upper leg must be a single connected volume');
    assert.ok(anchors[j].length>=8,'body-weighted upper attachment band required');assert.ok(tips[j].length>=8,'knee attachment ring required');
   }
   const vertex=i=>r.card.getVertexPosition(i,new T.Vector3()).applyMatrix4(r.card.matrixWorld);
   for(let n=0;n<hz*2;n++){
    const run=mode==='run',speed=height===.85?(run?3.6:.9):height*(run?1.4:.65),turn=mode==='turn'&&n>=hz;
    const dx=turn?speed*dt:0,dz=turn?0:-speed*dt;r.g.position.x+=dx;r.g.position.z+=dz;
    updateLiveAnimal(r,dx,dz,dt,run?'run':'walk',run);r.g.updateMatrixWorld(true);
    if(n%Math.max(1,Math.round(hz/10))===0){
     const points=bodyIds.map(vertex);
     for(const[j,l]of r.legs.entries()){
      for(const i of anchors[j])assert.ok(inside(points,vertex(i)),'upper anchor must remain inside actual body');
      const knee=l.knee.getWorldPosition(new T.Vector3());
      for(const i of tips[j])assert.ok(vertex(i).distanceTo(knee)<=r.spec.lower*.17*r.model.scale.x+.000001,'upper leg end must meet knee');
     }
    }
   }
   for(let n=0;n<hz;n++){updateLiveAnimal(r,0,0,dt,'idle');r.g.updateMatrixWorld(true);}
   const points=bodyIds.map(vertex);for(const a of anchors)for(const i of a)assert.ok(inside(points,vertex(i)),'idle shoulder attached');
  }finally{r.dispose();}
 }
});
