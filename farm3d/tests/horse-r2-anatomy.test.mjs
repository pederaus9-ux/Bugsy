// Horse R2: measure the actual authored skinned geometry and skeleton at rest.
// These guards would have rejected the short barrel, steep neck, ball muzzle,
// forehip location and ivory forehead spike shown in owner screenshots.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,HORSE} from '../horse3d.js';

function boneBounds(r,bone,predicate=()=>true){
  const mesh=r.card,geom=mesh.geometry;
  const index=mesh.skeleton.bones.indexOf(bone);
  assert.ok(index>=0,'expected bone must exist');
  const a=geom.attributes.position,sk=geom.attributes.skinIndex,c=geom.attributes.color;
  const box=new THREE.Box3(),v=new THREE.Vector3();let count=0;
  for(let i=0;i<a.count;i++){
    if(sk.getX(i)!==index || !predicate(c,i))continue;
    box.expandByPoint(v.set(a.getX(i),a.getY(i),a.getZ(i)));count++;
  }
  assert.ok(count>0,'no matched skinned geometry for '+bone.name);
  const size=new THREE.Vector3();box.getSize(size);
  return {box,size,count};
}
const colorMatches=(target)=>(c,i)=>{
  const col=new THREE.Color(target);
  return Math.max(Math.abs(c.getX(i)-col.r),Math.abs(c.getY(i)-col.g),
    Math.abs(c.getZ(i)-col.b))<1e-5;
};

test('R2 barrel has a long horizontal torso, not stacked spherical chest',()=>{
  const r=createHorse3D(1.85);
  try{
    const {size,box}=boneBounds(r,r.body);
    const ratio=size.z/size.y;
    assert.ok(ratio>=2.2,'actual skinned barrel length/depth '+ratio);
    assert.ok(size.z>1.55,'horizontal barrel length '+size.z);
    assert.ok(box.max.z>.75 && box.min.z<-.75,'back/shoulder span '+JSON.stringify(box));
  }finally{r.dispose();}
});

test('R2 neck rises less than 40 degrees and positions head ahead of withers',()=>{
  const r=createHorse3D(1.85);
  try{
    const axis=r.head.position;
    const angle=Math.atan2(Math.abs(axis.y),Math.abs(axis.z))*180/Math.PI;
    assert.ok(angle<40,'head-to-withers neck angle degrees '+angle);
    const torso=boneBounds(r,r.body),head=boneBounds(r,r.head);
    assert.ok(head.box.min.z<torso.box.min.z-.25,
      'skull and muzzle must project substantially ahead of chest');
  }finally{r.dispose();}
});

test('R2 muzzle is long and tapered; no pale vertical forehead horn exists',()=>{
  const r=createHorse3D(1.85);
  try{
    const muzzle=boneBounds(r,r.head,colorMatches(HORSE.muzzle));
    const ratio=muzzle.size.z/muzzle.size.y;
    assert.ok(ratio>1.4,'actual colored muzzle length/height '+ratio);
    const head=boneBounds(r,r.head);
    // Authored mesh positions are in bind/rest geometry coordinates.
    // Comparing those positions to the animated head world transform would
    // falsely count the body's deliberate resting compression as a horn.
    const restHeadY=HORSE.bodyY+HORSE.neck[1]+HORSE.head[1];
    assert.ok(head.box.max.y-restHeadY<.19,
      'non-ear skull apex above rest head '+(head.box.max.y-restHeadY));
    const pale=new THREE.Color(0xeadbc0),c=r.card.geometry.attributes.color,
      sk=r.card.geometry.attributes.skinIndex,headIndex=r.card.skeleton.bones.indexOf(r.head);
    let hornVertices=0;
    for(let i=0;i<c.count;i++)if(sk.getX(i)===headIndex &&
      Math.abs(c.getX(i)-pale.r)<1e-5 && Math.abs(c.getY(i)-pale.g)<1e-5 &&
      Math.abs(c.getZ(i)-pale.b)<1e-5)hornVertices++;
    assert.equal(hornVertices,0,'no ivory forehead spike on skull');
  }finally{r.dispose();}
});

test('R2 forehips attach forward at shoulders while hoof IK roots remain fixed',()=>{
  for(const h of [1.6,2.3]){
    const r=createHorse3D(h);
    try{
      const front=r.legs.filter(l=>l.z<0),hind=r.legs.filter(l=>l.z>0);
      assert.equal(front.length,2);assert.equal(hind.length,2);
      const torso=boneBounds(r,r.body);
      const centerZ=(torso.box.min.z+torso.box.max.z)/2;
      for(const l of front){
        assert.ok(l.hip.position.z-centerZ<-.50,'forehip must leave front of chest mass');
        assert.equal(l.hip.position.z,l.z,'rest offset unchanged by IK');
      }
      for(const l of hind)assert.ok(l.hip.position.z-centerZ>.5,'hindhip must leave haunch');
      for(const l of r.legs){
        assert.equal(l.hip.position.x,l.x);
        assert.equal(l.hip.position.y,HORSE.hip-HORSE.bodyY);
        assert.equal(l.hip.position.z,l.z);
      }
    }finally{r.dispose();}
  }
});
