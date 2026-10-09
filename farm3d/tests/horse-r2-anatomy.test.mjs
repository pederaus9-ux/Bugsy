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
    // Blended neck vertices no longer all belong to the body bone.
    // Measure the actual barrel region, retaining all dimensional limits.
    const geom=r.card.geometry,a=geom.attributes.position,part=geom.userData.horseAnatomyParts.barrel;
    const box=new THREE.Box3();
    for(let i=part.start;i<part.start+part.count;i++)if(a.getZ(i)>=-.78-1e-5)box.expandByPoint(new THREE.Vector3().fromBufferAttribute(a,i));
    const size=box.getSize(new THREE.Vector3());
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
    // Measure the face itself, not the reference's limited pale marking.
    const g=r.card.geometry,part=g.userData.horseAnatomyParts.head;
    const faceStart=HORSE.neck[2]+HORSE.head[2]-.17;
    const muzzle=boneBounds(r,r.head,(_,i)=>i>=part.start&&i<part.start+part.count&&g.attributes.position.getZ(i)<=faceStart+1e-5);
    const ratio=muzzle.size.z/muzzle.size.y;
    assert.ok(ratio>1.4,'actual facial muzzle length/height '+ratio);
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
      const gp=r.card.geometry.attributes.position,barrel=r.card.geometry.userData.horseAnatomyParts.barrel;
      const barrelBox=new THREE.Box3();
      for(let i=barrel.start;i<barrel.start+barrel.count;i++)if(gp.getZ(i)>=-.78-1e-5)barrelBox.expandByPoint(new THREE.Vector3().fromBufferAttribute(gp,i));
      const centerZ=(barrelBox.min.z+barrelBox.max.z)/2;
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
    const head=r.card.skeleton.bones.indexOf(r.head),part=r.card.geometry.userData.horseAnatomyParts.head;
    const zs=[];
    for(let i=part.start;i<part.start+part.count;i++)zs.push(p.getZ(i));
    const min=Math.min(...zs),span=Math.max(...zs)-min;
    const band=(lo,hi)=>{
      const b=new THREE.Box3();
      for(let i=part.start;i<part.start+part.count;i++)if(sk.getX(i)===head){
        const u=(p.getZ(i)-min)/span;if(u>=lo&&u<=hi)b.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,i));
      }
      assert.ok(!b.isEmpty(),'face band must contain real vertices');return b;
    };
    const bridge=band(.45,.7),nose=band(0,.16);
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


test('continuous withers uses body-neck split weights and stays joined at 20 degrees',()=>{
  const r=createHorse3D(2.3);
  try{
    const g=r.card.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
    const body=r.card.skeleton.bones.indexOf(r.body),neck=r.card.skeleton.bones.indexOf(r.neck);
    const {start,count}=g.userData.horseAnatomyParts.withers;
    let blended=0;const duplicates=new Map();
    r.neck.rotation.x=20*Math.PI/180;r.g.updateMatrixWorld(true);r.card.skeleton.update();
    for(let i=start;i<start+count;i++){
      if(!([body,neck].includes(si.getX(i))&&[body,neck].includes(si.getY(i)))||si.getX(i)===si.getY(i)||sw.getY(i)<=0||sw.getY(i)>=1)continue;
      blended++;assert.ok(Math.abs(sw.getX(i)+sw.getY(i)-1)<1e-6);
      const key=[p.getX(i),p.getY(i),p.getZ(i)].join(',');
      const v=r.card.applyBoneTransform(i,new THREE.Vector3().fromBufferAttribute(p,i));
      if(duplicates.has(key))assert.ok(v.distanceTo(duplicates.get(key))<1e-7,'shared triangle edge must stay joined');
      else duplicates.set(key,v);
    }
    assert.ok(blended>100,'real blended withers vertices required');
  }finally{r.dispose();}
});

test('idle foreknee stays under 15 degrees with fixed hip roots',()=>{
  for(const h of [1.6,2.3])for(const hz of [30,60,120]){
    const r=createHorse3D(h);
    try{
      for(let n=0;n<hz;n++)updateHorse3D(r,0,0,1/hz,'idle');
      for(const l of r.legs.filter(l=>l.z<0)){
        assert.ok(Math.abs(l.knee.rotation.x)*180/Math.PI<15,'rest foreknee '+l.knee.rotation.x);
        assert.deepEqual(l.hip.position.toArray(),[l.x,HORSE.hip-HORSE.bodyY,l.z]);
      }
    }finally{r.dispose();}
  }
});

test('continuous limbs keep knee and fetlock radius below cannon radius',()=>{
  const r=createHorse3D();
  try{
    const g=r.card.geometry,p=g.attributes.position;
    for(let j=0;j<4;j++){
      const part=g.userData.horseAnatomyParts['leg'+j],l=r.legs[j];
      const radiusAt=y=>{
        let max=0,found=0;
        for(let i=part.start;i<part.start+part.count;i++)if(Math.abs(p.getY(i)-(HORSE.hip+y))<1e-5){
          max=Math.max(max,Math.abs(p.getX(i)-l.x));found++;
        }
        assert.ok(found>0,'actual limb ring missing');return max;
      };
      const cannon=radiusAt(-.53);
      assert.ok(radiusAt(-HORSE.upper)<cannon,'knee wider than cannon');
      assert.ok(radiusAt(-.74)<cannon,'fetlock wider than cannon');
    }
  }finally{r.dispose();}
});

test('six-bone tapered tail tip hangs below the hock',()=>{
  const r=createHorse3D(2.3);
  try{
    assert.equal(r.tail.length,6);r.g.updateMatrixWorld(true);r.card.skeleton.update();
    const g=r.card.geometry,p=g.attributes.position,part=g.userData.horseAnatomyParts.tail;
    let bottom=Infinity;
    for(let i=part.start;i<part.start+part.count;i++){
      const v=r.card.applyBoneTransform(i,new THREE.Vector3().fromBufferAttribute(p,i));
      bottom=Math.min(bottom,v.y*r.model.scale.x);
    }
    const hock=Math.min(...r.legs.filter(l=>l.z>0).map(l=>l.knee.getWorldPosition(new THREE.Vector3()).y));
    assert.ok(bottom<hock-.10,'tail tip must extend below hock');
  }finally{r.dispose();}
});
