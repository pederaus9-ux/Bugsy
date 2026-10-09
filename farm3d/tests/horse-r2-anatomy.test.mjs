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
// Head measurements in the head's own frame, derived from actual geometry:
// poll = head bone rest position, facial axis = poll -> farthest head-surface
// vertex (the nose), sagittal perpendicular = x × axis (toward the forehead).
// The R2 head revision carries the face ~40° below horizontal like a relaxed
// horse, so world z/y boxes and absolute z bands that assumed the rejected
// horizontal 0.75 face no longer describe the face; thresholds are unchanged.
function headFrame(r){
  const g=r.card.geometry,p=g.attributes.position,parts=g.userData.horseAnatomyParts;
  const poll=new THREE.Vector3(...g.userData.horseHead.poll),verts=[];
  for(let i=parts.head.start;i<parts.head.start+parts.head.count;i++)verts.push(new THREE.Vector3().fromBufferAttribute(p,i));
  const tip=verts.reduce((a,v)=>v.distanceTo(poll)>a.distanceTo(poll)?v:a);
  const length=tip.distanceTo(poll),axis=tip.clone().sub(poll).normalize();
  const up=new THREE.Vector3(1,0,0).cross(axis).normalize();
  const axial=v=>v.clone().sub(poll).dot(axis),perp=v=>v.clone().sub(poll).dot(up);
  const spanVerts=name=>[].concat(parts[name]).flatMap(({start,count})=>Array.from({length:count},(_,k)=>new THREE.Vector3().fromBufferAttribute(p,start+k)));
  const centroid=vs=>vs.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/vs.length);
  return {g,p,parts,poll,verts,tip,length,axis,up,axial,perp,spanVerts,centroid};
}
const extent=(vs,f)=>{let lo=Infinity,hi=-Infinity;for(const v of vs){const x=f(v);lo=Math.min(lo,x);hi=Math.max(hi,x);}return hi-lo;};
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
    // Adapted: the face is the part of the actual head surface forward of the
    // actual eyes, measured along the facial axis (length) and its sagittal
    // perpendicular (height). Threshold unchanged.
    const H=headFrame(r),eye=H.axial(H.centroid(H.spanVerts('eyes')));
    const face=H.verts.filter(v=>H.axial(v)>=eye);
    const ratio=(Math.max(...face.map(H.axial))-eye)/extent(face,H.perp);
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
    // Adapted: the old absolute z bands (-.20..-.15 and -.685..-.59 from the
    // poll) assumed the rejected horizontal 0.75 face. Bands are now anchored
    // to anatomy along the measured facial axis: the broad upper face just in
    // front of the actual eyes versus the nose band at 88-98% of head length.
    // Width is the x extent, height the extent across the facial axis.
    // All three thresholds are unchanged.
    const H=headFrame(r),eye=H.axial(H.centroid(H.spanVerts('eyes')));
    const band=(lo,hi)=>{
      const vs=H.verts.filter(v=>{const a=H.axial(v);return a>=lo&&a<=hi;});
      assert.ok(vs.length,'face band must contain real vertices');return vs;
    };
    const bridge=band(eye,eye+.05),nose=band(.88*H.length,.98*H.length);
    const w=extent(bridge,v=>v.x)/extent(nose,v=>v.x),h=extent(bridge,H.perp)/extent(nose,H.perp);
    assert.ok(w>1.5,'bridge/nose width taper '+w);
    assert.ok(h>1.5,'bridge/nose height taper '+h);
    assert.ok(H.centroid(bridge).y-H.centroid(nose).y>.08,'face must slope downward toward nose');
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

// ---------- R2 head revision guards (rejected "anteater" head) ----------
const withersHeight=r=>{
  const g=r.card.geometry,p=g.attributes.position,{start,count}=g.userData.horseAnatomyParts.barrel;
  let y=-Infinity;for(let i=start;i<start+count;i++)if(p.getZ(i)>=-.65&&p.getZ(i)<=-.32)y=Math.max(y,p.getY(i));
  return y;// rest geometry stands on y=0
};

test('head length and resting face angle are horse proportions, not an anteater snout',()=>{
  const r=createHorse3D(1.85);
  try{
    const H=headFrame(r),ratio=H.length/withersHeight(r);
    assert.ok(ratio>=.36&&ratio<=.44,'poll-to-nose length / withers height '+ratio);
    const angle=Math.atan2(H.poll.y-H.tip.y,H.poll.z-H.tip.z)*180/Math.PI;
    assert.ok(angle>=30&&angle<=55,'resting face line degrees below horizontal '+angle);
  }finally{r.dispose();}
});

test('deep rounded jowl over a narrower muzzle, with a throatlatch notch into the neck',()=>{
  const r=createHorse3D(1.85);
  try{
    const H=headFrame(r),L=H.length;
    const depth=(lo,hi)=>extent(H.verts.filter(v=>{const a=H.axial(v);return a>=lo*L&&a<=hi*L;}),H.perp);
    const jowl=Math.max(...[.15,.20,.25,.30,.35,.40].map(a=>depth(a,a+.05))),muzzle=depth(.86,.94);
    assert.ok(jowl>=1.5*muzzle,'jowl depth '+jowl+' vs muzzle depth '+muzzle);
    // Underside profile in the sagittal plane from the jowl back into the neck.
    // The jowl is the deepest point below the facial axis behind the face;
    // the lowest world vertex of a head carried at ~45° is the chin instead.
    const neck=H.spanVerts('neck'),all=[...H.verts,...neck];
    const bottom=H.verts.filter(v=>{const a=H.axial(v)/L;return a>=.10&&a<=.45;}).reduce((a,v)=>H.perp(v)<H.perp(a)?v:a);
    const under=z=>{let y=Infinity;for(const v of all)if(Math.abs(v.z-z)<.012&&Math.abs(v.x)<.05)y=Math.min(y,v.y);return y;};
    const samples=[];for(let z=bottom.z;z<=bottom.z+.40;z+=.01)samples.push({z,y:under(z)});
    const notch=samples.filter(s=>s.z<=bottom.z+.25).reduce((a,s)=>s.y>a.y?s:a);
    const behind=samples.filter(s=>s.z>notch.z+.05);
    assert.ok(notch.y-bottom.y>.08,'throatlatch rises above jowl bottom by '+(notch.y-bottom.y));
    assert.ok(behind.length&&Math.min(...behind.map(s=>s.y))<notch.y-.03,'neck underside falls away behind the throatlatch');
  }finally{r.dispose();}
});

test('eyes sit a third down the head, below the forehead line, seated on the skull with orbits',()=>{
  const r=createHorse3D(2.3);
  try{
    const H=headFrame(r),s=r.model.scale.x,tris=[];
    for(let i=0;i<H.verts.length;i+=3)tris.push(new THREE.Triangle(H.verts[i],H.verts[i+1],H.verts[i+2]));
    // Signed distance to the skull: positive outside. An eyeball is half
    // embedded, so only the outside part can "float".
    const signedGap=v=>{let best=Infinity,sign=1;const q=new THREE.Vector3(),n=new THREE.Vector3();
      for(const t of tris){t.closestPointToPoint(v,q);const d=v.distanceTo(q);if(d<best){best=d;t.getNormal(n);sign=v.clone().sub(q).dot(n)>=0?1:-1;}}
      return best*sign;};
    const surfaceGap=v=>Math.abs(signedGap(v));
    for(const part of H.parts.eyes){
      const eye=[];for(let k=0;k<part.count;k++)eye.push(new THREE.Vector3().fromBufferAttribute(H.p,part.start+k));
      const c=H.centroid(eye),u=H.axial(c)/H.length;
      assert.ok(u>=.25&&u<=.45,'eye position along head '+u);
      const dorsal=Math.max(...H.verts.filter(v=>Math.abs(H.axial(v)-H.axial(c))<.02).map(H.perp));
      assert.ok(dorsal-H.perp(c)>=.015,'eye must sit below the forehead line');
      assert.ok(surfaceGap(c)*s<=.012,'eye centre seated within 12 mm of skull '+surfaceGap(c)*s);
      assert.ok(Math.max(...eye.map(signedGap))*s<=.025,'no eye vertex stands more than 25 mm proud of the skull');
      assert.ok(Math.min(...eye.map(signedGap))<0,'eye is embedded in the skull, not stuck on');
    }
    const brows=H.spanVerts('brows'),eyes=H.spanVerts('eyes');
    assert.equal(H.parts.brows.length,2);
    assert.ok(H.perp(H.centroid(brows))>H.perp(H.centroid(eyes)),'orbital ridges sit above the eyes');
  }finally{r.dispose();}
});

test('nostrils and lips sit on a broad muzzle, not a narrow tube tip',()=>{
  const r=createHorse3D(1.85);
  try{
    const H=headFrame(r),L=H.length;
    assert.equal(H.parts.nostrils.length,2);assert.ok(H.parts.lips.length>=3,'upper/lower lip, chin and mouth line');
    for(const part of H.parts.nostrils){
      const vs=[];for(let k=0;k<part.count;k++)vs.push(new THREE.Vector3().fromBufferAttribute(H.p,part.start+k));
      assert.ok(H.axial(H.centroid(vs))>=.85*L,'nostril on the forward 15% of the head');
    }
    const lips=H.spanVerts('lips'),muzzle=H.verts.filter(v=>H.axial(v)>=.85*L);
    const mid=(Math.max(...muzzle.map(H.perp))+Math.min(...muzzle.map(H.perp)))/2;
    assert.ok(H.perp(H.centroid(lips))<mid,'lips and chin form the lower muzzle');
    // Muzzle stays broad: at least 60% of the forehead width (anteater tip was 36%).
    const forehead=extent(H.verts.filter(v=>Math.abs(H.axial(v)/L-.33)<.03),v=>v.x);
    const nose=extent(H.verts.filter(v=>Math.abs(H.axial(v)/L-.90)<.03),v=>v.x);
    assert.ok(nose/forehead>=.60,'muzzle/forehead width '+nose/forehead);
  }finally{r.dispose();}
});

test('leaf ears stand closer together than the skull edges and are flattened front to back',()=>{
  const r=createHorse3D(1.85);
  try{
    const g=r.card.geometry,p=g.attributes.position,sk=g.attributes.skinIndex;
    const xs=r.ears.map(e=>e.position.x);
    assert.ok(Math.abs(xs[0]-xs[1])<=.13,'ear base spread '+Math.abs(xs[0]-xs[1]));
    for(const ear of r.ears){
      const idx=r.card.skeleton.bones.indexOf(ear),vs=[];
      for(let i=0;i<p.count;i++)if(sk.getX(i)===idx)vs.push(new THREE.Vector3().fromBufferAttribute(p,i));
      // Principal axes of the actual ear vertices: the longest is the ear's
      // height; a leaf is clearly wider across than it is deep.
      const c=vs.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/vs.length);
      const cov=[[0,0,0],[0,0,0],[0,0,0]];
      for(const v of vs){const d=v.clone().sub(c).toArray();for(let a=0;a<3;a++)for(let b=0;b<3;b++)cov[a][b]+=d[a]*d[b];}
      const mul=v=>new THREE.Vector3(...cov.map(row=>row[0]*v.x+row[1]*v.y+row[2]*v.z));
      const principal=(seed,away=[])=>{let v=seed.clone();for(let k=0;k<200;k++){v=mul(v);for(const a of away)v.addScaledVector(a,-v.dot(a));v.normalize();}return v;};
      const e1=principal(new THREE.Vector3(.1,1,.2)),e2=principal(new THREE.Vector3(1,.1,.1),[e1]),e3=e1.clone().cross(e2);
      const w=extent(vs,v=>v.dot(e2)),d=extent(vs,v=>v.dot(e3));
      assert.ok(w>1.2*d,'ear is a flattened leaf, not a round cone: '+w+' vs '+d);
    }
  }finally{r.dispose();}
});

test('head, throat, crest and mane share one junction field with normalized weights',()=>{
  const r=createHorse3D(2.3);
  try{
    const g=r.card.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,parts=g.userData.horseAnatomyParts;
    const blend=g.userData.horseHead.blend,poll=new THREE.Vector3(...g.userData.horseHead.poll);
    const bones=r.card.skeleton.bones,head=bones.indexOf(r.head),neck=bones.indexOf(r.neck),body=bones.indexOf(r.body);
    let shared=0;
    for(const name of ['head','neck','mane'])for(const {start,count} of [].concat(parts[name]))for(let i=start;i<start+count;i++){
      const ids=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)],ws=[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)];
      assert.ok(Math.abs(ws.reduce((a,b)=>a+b,0)-1)<1e-6,'weights normalized');
      assert.ok(ws[0]>=ws[1],'dominant influence first');
      const wHead=ids.reduce((a,b,k)=>a+(b===head?ws[k]:0),0);
      if(ids.reduce((a,b,k)=>a+(b===body?ws[k]:0),0)>0){assert.equal(wHead,0,'no head weight on body-blended trunk');continue;}
      const expected=blend(new THREE.Vector3().fromBufferAttribute(p,i).sub(poll));
      assert.ok(Math.abs(wHead-expected)<1e-6,name+' vertex head weight '+wHead+' field '+expected);
      if(expected>0&&expected<1)shared++;
    }
    assert.ok(shared>200,'real blended junction vertices required: '+shared);
  }finally{r.dispose();}
});

test('junction bends without folding or tearing under head/neck pitch and turns',()=>{
  const r=createHorse3D(2.3),D=Math.PI/180;
  try{
    const g=r.card.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,parts=g.userData.horseAnatomyParts;
    const head=r.card.skeleton.bones.indexOf(r.head);
    const hasHead=i=>[0,1].some(k=>[si.getX(i),si.getY(i)][k]===head&&[sw.getX(i),sw.getY(i)][k]>0);
    const poses=[[-25,0,0,0],[25,0,0,0],[0,-25,0,0],[0,25,0,0],[0,0,30,0],[0,0,-30,0],[0,0,0,20],[-25,-15,25,0]];
    for(const [np,hp,hy,ny] of poses){
      r.neck.rotation.set(np*D,ny*D,0);r.head.rotation.set(hp*D,hy*D,0);r.g.updateMatrixWorld(true);r.card.skeleton.update();
      let lo=Infinity,hi=0,edges=0;
      for(const name of ['head','neck','mane'])for(const {start,count} of [].concat(parts[name]))for(let i=start;i<start+count;i+=3){
        const ids=[i,i+1,i+2];if(!ids.some(hasHead))continue;
        const R=ids.map(j=>new THREE.Vector3().fromBufferAttribute(p,j)),P=ids.map(j=>r.card.applyBoneTransform(j,new THREE.Vector3().fromBufferAttribute(p,j)));
        for(const [a,b] of [[0,1],[1,2],[2,0]]){const l=R[a].distanceTo(R[b]);if(l<1e-4)continue;const q=P[a].distanceTo(P[b])/l;lo=Math.min(lo,q);hi=Math.max(hi,q);edges++;}
      }
      assert.ok(edges>1000,'junction edges measured');
      assert.ok(lo>=.7&&hi<=1.4,'edge stretch '+lo.toFixed(3)+'..'+hi.toFixed(3)+' at pose '+[np,hp,hy,ny]);
    }
  }finally{r.dispose();}
});
