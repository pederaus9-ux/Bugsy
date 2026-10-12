import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as T from '../lib/three.module.min.js';
import {createLiveAnimal} from '../live3d.js';
import {createCow3D} from '../cow3d.js';
const frozen=JSON.parse(readFileSync(new URL('./baselines/dog-face-protected.json',import.meta.url)));
// Owner-authorized cat head/upper-leg correction has its own parent-frozen guard.
const catFrozen=JSON.parse(readFileSync(new URL('./baselines/cat-visual-protected.json',import.meta.url)));
const digest=s=>createHash('sha256').update(s).digest('hex');
test('dog face correction and later authorized cat regions preserve frozen meshes and rest bones',()=>{
  const heights={cow:1.7,sheep:1.2,horse:2.3,dog:1.15,cat:.85,chicken:.72};
  for(const[k,h]of Object.entries(heights)){
    const r=k==='cow'?createCow3D(h):createLiveAnimal(k,h);
    try{
      const g=r.card.geometry,head=r.card.skeleton.bones.indexOf(r.head),attrs=Object.keys(g.attributes).sort(),values=[];
      const authorizedCat=k==='cat'?new Set([r.head,...r.ears,...r.legs.map(l=>l.hip)].map(b=>r.card.skeleton.bones.indexOf(b))):new Set();
      for(let i=0;i<g.attributes.position.count;i++)if((k!=='dog'||g.attributes.skinIndex.getX(i)!==head)&&!authorizedCat.has(g.attributes.skinIndex.getX(i))){for(const a of attrs){const v=g.attributes[a];for(let j=0;j<v.itemSize;j++)values.push(v.array[i*v.itemSize+j]);}}
      assert.equal(digest(JSON.stringify(values)),(k==='cat'?catFrozen:frozen).rigs[k].geometryDigest,k+' protected mesh changed');
      assert.equal(digest(JSON.stringify(r.card.skeleton.bones.map(b=>({name:b.name,p:b.position.toArray(),q:b.quaternion.toArray(),parent:r.card.skeleton.bones.indexOf(b.parent)})))),frozen.rigs[k].bonesDigest,k+' rest/initial bone pose changed');
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
test('dog has one embedded central nose, a narrow muzzle, mouth and attached lower jaw',()=>{
  const r=createLiveAnimal('dog',1.15);
  try{
    const g=r.card.geometry,head=r.card.skeleton.bones.indexOf(r.head),origin=new T.Vector3();
    for(let b=r.head;b?.isBone;b=b.parent)origin.add(b.position);
    const points=color=>{
      const c=new T.Color(color),list=[];
      for(let i=0;i<g.attributes.position.count;i++)if(g.attributes.skinIndex.getX(i)===head&&Math.abs(g.attributes.color.getX(i)-c.r)<1e-6&&Math.abs(g.attributes.color.getY(i)-c.g)<1e-6&&Math.abs(g.attributes.color.getZ(i)-c.b)<1e-6)list.push(new T.Vector3().fromBufferAttribute(g.attributes.position,i).sub(origin));
      return list;
    };
    const nose=points(0x151515),muzzle=points(r.spec.muzzle),mouth=points(0x3c2920);
    assert.ok(nose.length>0,'single black dog nose is absent');assert.equal(components(nose).length,1,'nose must be one connected central surface');
    const nb=new T.Box3().setFromPoints(nose),mb=new T.Box3().setFromPoints(muzzle);
    assert.ok(Math.abs(nb.getCenter(new T.Vector3()).x)<1e-6,'nose is centered');
    assert.ok(nb.min.z<mb.min.z,'nose projects ahead of muzzle');assert.ok(nb.max.y<0,'nose stays below eyes');
    const white=components(muzzle);assert.equal(white.length,2,'muzzle and lower jaw volumes required');
    const back=nose.reduce((a,p)=>p.z>a.z?p:a,nose[0]);assert.ok(white.some(v=>inside(v,back)),'nose back must intersect actual muzzle surface');
    assert.ok(mb.max.x-mb.min.x<.11,'broad pig-like muzzle persists');
    assert.ok((mb.max.z-mb.min.z)/(mb.max.x-mb.min.x)>1.2,'muzzle must project forward');
    const boxes=white.map(v=>new T.Box3().setFromPoints(v)),lower=boxes[0].getCenter(new T.Vector3()).y<boxes[1].getCenter(new T.Vector3()).y?0:1;
    const jawTop=white[lower].reduce((a,p)=>p.y>a.y?p:a,white[lower][0]);assert.ok(inside(white[1-lower],jawTop),'lower jaw must meet muzzle');
    assert.ok(mouth.length>0,'mouth line absent');const lip=new T.Box3().setFromPoints(mouth);
    assert.ok(lip.max.y<nb.min.y,'mouth lies below nose');assert.ok(lip.max.y-lip.min.y<.012,'mouth must read as a thin line');
    assert.equal(points(0x25221e).length,0,'paired pig-like nostril dots must be gone');
  }finally{r.dispose();}
});
