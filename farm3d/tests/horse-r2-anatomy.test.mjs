// Horse R2: measure the actual authored skinned geometry and skeleton at rest.
// These guards would have rejected the short barrel, steep neck, ball muzzle,
// forehip location and ivory forehead spike shown in owner screenshots.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D,HORSE} from '../horse3d.js';

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

test('ear bases meet actual skull triangles within 5 mm at farm scale',()=>{
  const r=createHorse3D(2.3);
  try{
    const p=r.card.geometry.attributes.position,sk=r.card.geometry.attributes.skinIndex;
    const head=r.card.skeleton.bones.indexOf(r.head);
    for(const ear of r.ears){
      const idx=r.card.skeleton.bones.indexOf(ear),vertices=[];
      for(let i=0;i<p.count;i++)if(sk.getX(i)===idx)vertices.push(new THREE.Vector3().fromBufferAttribute(p,i));
      const bottom=Math.min(...vertices.map(v=>v.y));let nearest=Infinity;
      for(const v of vertices.filter(v=>Math.abs(v.y-bottom)<1e-5)){
        for(let i=0;i<p.count;i+=3)if(sk.getX(i)===head){
          const tri=new THREE.Triangle(...[i,i+1,i+2].map(j=>new THREE.Vector3().fromBufferAttribute(p,j)));
          nearest=Math.min(nearest,v.distanceTo(tri.closestPointToPoint(v,new THREE.Vector3())));
        }
      }
      assert.ok(nearest*r.model.scale.x<=.005,ear.name+' skull attachment gap '+nearest*r.model.scale.x);
    }
  }finally{r.dispose();}
});

test('muzzle narrows in width and height while its face slopes downward',()=>{
  const r=createHorse3D(1.85);
  try{
    const p=r.card.geometry.attributes.position,sk=r.card.geometry.attributes.skinIndex;
    const head=r.card.skeleton.bones.indexOf(r.head),col=colorMatches(HORSE.muzzle);
    const restZ=HORSE.neck[2]+HORSE.head[2];
    const band=(lo,hi)=>{
      const b=new THREE.Box3();
      for(let i=0;i<p.count;i++)if(sk.getX(i)===head&&col(r.card.geometry.attributes.color,i)){
        const z=p.getZ(i)-restZ;if(z>=lo&&z<=hi)b.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,i));
      }
      assert.ok(!b.isEmpty(),'face band must contain real vertices');return b;
    };
    const bridge=band(-.20,-.15),nose=band(-.685,-.59);
    const a=bridge.getSize(new THREE.Vector3()),b=nose.getSize(new THREE.Vector3());
    assert.ok(a.x/b.x>1.5,'bridge/nose width taper '+a.x/b.x);
    assert.ok(a.y/b.y>1.5,'bridge/nose height taper '+a.y/b.y);
    assert.ok(bridge.getCenter(new THREE.Vector3()).y-nose.getCenter(new THREE.Vector3()).y>.08,'face must slope downward toward nose');
  }finally{r.dispose();}
});

test('authored withers overlaps both actual barrel and neck bounds',()=>{
  const r=createHorse3D(1.85);
  try{
    const g=r.card.geometry,p=g.attributes.position,parts=g.userData.horseAnatomyParts;
    const bounds=name=>{
      const {start,count}=parts[name],b=new THREE.Box3();
      for(let i=start;i<start+count;i++)b.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,i));
      return b;
    };
    const withers=bounds('withers');
    for(const name of ['barrel','neck']){
      const overlap=withers.clone().intersect(bounds(name)).getSize(new THREE.Vector3());
      assert.ok(overlap.x>.05&&overlap.y>.05&&overlap.z>.05,name+' withers overlap '+overlap.toArray());
    }
  }finally{r.dispose();}
});

test('resting forelegs reach at least 95 percent without moving hip roots',()=>{
  for(const h of [1.6,2.3])for(const hz of [30,60,120]){
    const r=createHorse3D(h);
    try{
      for(let n=0;n<hz;n++)updateHorse3D(r,0,0,1/hz,'idle');
      r.g.updateMatrixWorld(true);
      for(const l of r.legs.filter(l=>l.z<0)){
        const length=l.hip.getWorldPosition(new THREE.Vector3()).distanceTo(l.foot.getWorldPosition(new THREE.Vector3()));
        const ratio=length/((HORSE.upper+HORSE.lower)*r.model.scale.x);
        assert.ok(ratio>=.95&&ratio<=1,'idle foreleg extension '+ratio);
        assert.deepEqual(l.hip.position.toArray(),[l.x,HORSE.hip-HORSE.bodyY,l.z]);
      }
    }finally{r.dispose();}
  }
});
