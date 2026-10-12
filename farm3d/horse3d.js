import * as THREE from './lib/three.module.min.js';
import {createHoofTrack,beginHoofSwing,updateHoofTrack,resetHoofTrack,retargetSwing,reaimSwing,swingProfile,SWING_PEAK} from './horse-stance3d.js';
import {createHorseIKScratch,solveHorseLegIK} from './horse-ik3d.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export const HORSE={
  name:'horse',height:1.85,bodyY:1.03,hip:.86,upper:.40,lower:.39,hoof:.075,
  stride:1.18,lift:.09,coat:0x8a5a32,face:0x3b2415,muzzle:0x47301e,body:[.30,.30,.78],neck:[0,.16,-.57],head:[0,.23,-.49]
};

// ---------- Horse head (R2 head revision) ----------
// Authored in head-bone space around the poll joint. The face line falls
// FACE_DROP below horizontal at rest, as a relaxed horse carries it; the head
// bone's own rest transform is unchanged. Each section is
// [u along poll->nose, dorsal offset, ventral offset, upper half-width,
// lower half-width], offsets measured perpendicular to the face line.
// Profile: poll rise, broad flat forehead with orbits, deep rounded jowl
// whose rear edge rises sharply into the throatlatch, straight nasal bone,
// slight nostril flare and a blunt rounded upper lip.
const HORSE_HEAD={length:.58,faceDrop:40*Math.PI/180,sections:[
  [-.10,.060,-.075,.062,.064],[-.04,.072,-.095,.070,.074],[.02,.074,-.120,.078,.082],
  [.09,.070,-.160,.090,.089],[.17,.062,-.212,.099,.093],[.25,.052,-.232,.104,.093],
  [.33,.043,-.222,.103,.089],[.42,.034,-.190,.095,.081],[.52,.027,-.158,.080,.070],
  [.63,.021,-.138,.069,.064],[.74,.015,-.128,.064,.061],[.84,.012,-.124,.066,.063],
  [.91,.008,-.118,.065,.061],[.96,-.004,-.106,.058,.054],[.99,-.022,-.088,.047,.043],
  [1.0,-.040,-.072,.030,.027]
]};
const headAxis=new THREE.Vector3(0,-Math.sin(HORSE_HEAD.faceDrop),-Math.cos(HORSE_HEAD.faceDrop));
const headUp=new THREE.Vector3(0,Math.cos(HORSE_HEAD.faceDrop),-Math.sin(HORSE_HEAD.faceDrop));
const headFrame=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0),headUp,headAxis.clone().negate()));
// Catmull-Rom through the section table keeps the profile free of creases.
function headSection(u){
  const S=HORSE_HEAD.sections;let i=0;
  while(i<S.length-2&&u>S[i+1][0])i++;
  const t=clamp((u-S[i][0])/(S[i+1][0]-S[i][0]),0,1),p0=S[Math.max(i-1,0)],p1=S[i],p2=S[i+1],p3=S[Math.min(i+2,S.length-1)];
  return [1,2,3,4].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t));
}
// Superelliptic ring: flat forehead and cheeks above, rounder jaw below.
function headSurface(u,a,out=new THREE.Vector3()){
  const [dorsal,ventral,wTop,wBottom]=headSection(u),s=Math.sin(a),c=Math.cos(a);
  const e=s>0?.72:1,sy=Math.sign(s)*Math.abs(s)**e,sx=Math.sign(c)*Math.abs(c)**e;
  const mid=(dorsal+ventral)/2,half=(dorsal-ventral)/2,w=wBottom+(wTop-wBottom)*(1+s)/2;
  return out.copy(headAxis).multiplyScalar(u*HORSE_HEAD.length).addScaledVector(headUp,mid+half*sy).setX(w*sx);
}
function headMesh(){
  const rings=26,n=24,v=[],idx=[];
  for(let j=0;j<rings;j++){
    const u=-.10+1.10*(1-(1-j/(rings-1))**1.35),p=new THREE.Vector3();
    for(let i=0;i<n;i++){headSurface(u,i*Math.PI*2/n,p);v.push(p.x,p.y,p.z);}
  }
  for(let j=0;j<rings-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;idx.push(a,c(a),b,b,c(a),c(b));}
  function c(k){return k+n;}
  const tip=v.length/3;const p=headSurface(1,0);v.push(0,p.y-.005,p.z-.004);
  const back=headSurface(-.10,Math.PI/2).add(headSurface(-.10,-Math.PI/2)).multiplyScalar(.5);v.push(0,back.y,back.z);
  for(let i=0;i<n;i++){const last=(rings-1)*n;idx.push(last+i,tip,last+(i+1)%n,i,(i+1)%n,tip+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();
  return g;
}
// Highest skull surface under a head-local point; ears and the forelock seat here.
function skullTop(mesh,x,z){
  const p=mesh.attributes.position,ix=mesh.index.array,ray=new THREE.Ray(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0));
  const A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),hit=new THREE.Vector3();let best=-Infinity;
  for(let i=0;i<ix.length;i+=3){
    A.fromBufferAttribute(p,ix[i]);B.fromBufferAttribute(p,ix[i+1]);C.fromBufferAttribute(p,ix[i+2]);
    if(ray.intersectTriangle(A,B,C,false,hit))best=Math.max(best,hit.y);
  }
  return best;
}
// One smooth head/neck junction field shared by every surface near the poll.
// The boundary runs from behind the ear bases down the rear edge of the jaw
// into the throatlatch: skull, ears and jowl are head; crest and throat are
// neck; coincident points always receive identical weights.
function horseHeadBlend(local){
  const d=-.988*(local.z-.08)-.156*local.y;
  return smooth(-.14,.08,d)*(1-smooth(.20,.28,local.z));
}

let template=null;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}], slots={legs:[],ears:[],tail:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,HORSE.bodyY,0]);
  // Rest skeleton must inherit the R2 geometry's measured neck/head offsets.
  // Declaring only HORSE.neck/HORSE.head without wiring these bones leaves
  // the old upright silhouette in the skinned mesh.
  slots.neck=bone('neck',slots.body,HORSE.neck);
  slots.head=bone('head',slots.neck,HORSE.head);
  // Ear bases sit on the poll, closer together than before, at the actual
  // skull surface computed from the head mesh (ear size is unchanged).
  const headGeo=headMesh();
  for(const side of [-1,1])slots.ears.push(bone('ear'+side,slots.head,[side*.058,skullTop(headGeo,side*.058,-.012)-.004,-.012]));
  // Shoulder attachment is forward under the withers, not under the barrel.
  // The R1 IK keeps hip origins fixed and will solve these new rest offsets.
  const feet=[[-.17,-.66,0],[.17,-.66,.5],[-.16,.65,.5],[.16,.65,0]];
  for(const [x,z,phase] of feet){
    const hip=bone('hip'+slots.legs.length,slots.body,[x,HORSE.hip-HORSE.bodyY,z]);
    const knee=bone('knee'+slots.legs.length,hip,[0,-HORSE.upper,0]);
    const foot=bone('hoof'+slots.legs.length,knee,[0,-HORSE.lower,0]);
    slots.legs.push({hip,knee,foot,x,z,phase});
  }
  let parent=slots.body;
  for(let i=0;i<6;i++){const t=bone('tail'+i,parent,[0,i?-.145:.10,i?.015:.76]);slots.tail.push(t);parent=t;}

  const rest=defs.map((d,i)=>{const p=new THREE.Vector3(...d.p);let j=d.parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[],parts={};
  const part=(name,build)=>{const start=pos.length/3;build();parts[name]={start,count:pos.length/3-start};};
  function add(geo,col,p,scale,b,q=new THREE.Quaternion()){
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const o=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),q,new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);
    for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}
    g.dispose();
  }
  const oval=(col,p,s,b,d=12,r=8)=>add(new THREE.SphereGeometry(1,d,r),col,p,s,b);
  const rod=(col,p,r,len,b)=>add(new THREE.CylinderGeometry(r,r*.78,len,8),col,p,[1,1,1],b);
  const link=(col,a,bp,r,b)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...bp),d=B.clone().sub(A);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());add(new THREE.CylinderGeometry(r*.82,r,d.length(),10),col,A.add(B).multiplyScalar(.5).toArray(),[1,1,1],b,q);};

  // Continuous elliptical sections author the back, belly and shoulder as
  // one surface. Separate intersecting balls created the rejected silhouette.
  const loft=(sections,col,boneIndex,paint=null,axis="z")=>{
    const v=[],idx=[],n=20;
    for(const [z,y,w,h] of sections)for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n;v.push(Math.cos(a)*w,axis==="z"?y+Math.sin(a)*h:z,axis==="z"?z:y+Math.sin(a)*h);
    }
    for(let j=0;j<sections.length-1;j++)for(let i=0;i<n;i++){
      const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;
      idx.push(a,b,c,b,d,c);
    }
    for(let i=1;i<n-1;i++)idx.push(0,i+1,i,
      (sections.length-1)*n,(sections.length-1)*n+i,(sections.length-1)*n+i+1);
    if((sections.at(-1)[0]<sections[0][0])!==(axis==="y"))for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    g.setIndex(idx);g.computeVertexNormals();const start=pos.length/3;
    add(g,col,[0,0,0],[1,1,1],boneIndex);
    if(paint)for(let i=start;i<pos.length/3;i++)paint(i);
    return {start,count:pos.length/3-start};
  };
  // One connected indexed surface is authored from croup through poll.
  // Duplicate triangle-corner vertices keep identical weights/normals when
  // flattened into the existing renderer layout; no independent neck shell.
  // The shared head/neck junction field, evaluated in head-bone rest space.
  const headRest=rest[slots.head],local=new THREE.Vector3();
  const blendHead=i=>{
    const w=horseHeadBlend(local.set(pos[i*3]-headRest.x,pos[i*3+1]-headRest.y,pos[i*3+2]-headRest.z));
    if(w<=0&&skin[i*4]!==slots.head)return;
    const inf=[[slots.head,w],[slots.neck,1-w]].sort((a,b)=>b[1]-a[1]);
    for(let k=0;k<4;k++){skin[i*4+k]=k<2?inf[k][0]:0;weight[i*4+k]=k<2?inf[k][1]:0;}
  };
  const trunk=loft([
    [.84,-.025,.06,.12],[.70,.005,.245,.245],[.55,.005,.295,.285],
    [.30,-.025,.29,.28],[0,-.035,.30,.285],[-.32,-.015,.285,.28],
    [-.50,.015,.25,.285],[-.65,.075,.225,.28],[-.78,.18,.18,.235],
    // Throatlatch: the neck narrows and its underside rises to meet the rear
    // edge of the jaw; its end tucks inside the head's rear rings at the poll.
    [-.91,.3475,.12,.1275],[-1.04,.38,.068,.08],[-1.10,.40,.05,.06]
  ],HORSE.coat,slots.body,i=>{
    const z=pos[i*3+2],t=clamp((-z-.38)/.35,0,1);
    skin[i*4]=t>=.5?slots.neck:slots.body;skin[i*4+1]=t>=.5?slots.body:slots.neck;
    weight[i*4]=Math.max(t,1-t);weight[i*4+1]=Math.min(t,1-t);
    if(t>=1)blendHead(i);
  });
  // These overlapping diagnostic spans describe shared triangles of the
  // continuous surface, rather than separate overlapping geometry shells.
  const span=(lo,hi)=>{
    let start=Infinity,end=0;
    for(let i=trunk.start;i<trunk.start+trunk.count;i+=3){
      const zs=[pos[i*3+2],pos[(i+1)*3+2],pos[(i+2)*3+2]];
      if(Math.max(...zs)>=lo&&Math.min(...zs)<=hi){start=Math.min(start,i);end=i+3;}
    }
    return {start,count:end-start};
  };
  parts.barrel=span(-.78,.84);parts.withers=span(-.91,-.32);parts.neck=span(-1.10,-.50);
  // One poll-to-lip head surface (no skull balls, nose oval or pale wedge).
  // Bay points: coat colour darkens over the nasal bone to a near-black muzzle.
  const coat=new THREE.Color(HORSE.coat),dark=new THREE.Color(HORSE.muzzle),mix=new THREE.Color();
  const axial=i=>((pos[i*3]-headRest.x)*headAxis.x+(pos[i*3+1]-headRest.y)*headAxis.y+(pos[i*3+2]-headRest.z)*headAxis.z)/HORSE_HEAD.length;
  part('head',()=>{
    const start=pos.length/3;add(headGeo,HORSE.coat,[0,0,0],[1,1,1],slots.head);
    for(let i=start;i<pos.length/3;i++){
      mix.copy(coat).lerp(dark,smooth(.60,.86,axial(i)));color[i*3]=mix.r;color[i*3+1]=mix.g;color[i*3+2]=mix.b;
      blendHead(i);
    }
  });
  // Facial details are placed on the actual surface function and oriented
  // with the face, so they stay seated when proportions are tuned.
  const feature=(name,col,u,a,lift,scale,turn=new THREE.Quaternion())=>{
    const p=headSurface(u,a);p.addScaledVector(p.clone().sub(headAxis.clone().multiplyScalar(u*HORSE_HEAD.length)).setComponent(0,p.x).normalize(),lift);
    const start=pos.length/3;oval(col,p.toArray(),scale,slots.head,10,6);
    // re-orient the just-added oval with the face frame
    const q=headFrame.clone().multiply(turn),o=new THREE.Vector3(headRest.x+p.x,headRest.y+p.y,headRest.z+p.z),v=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=start;i<pos.length/3;i++){
      v.set(pos[i*3],pos[i*3+1],pos[i*3+2]).sub(o).applyQuaternion(q).add(o);pos[i*3]=v.x;pos[i*3+1]=v.y;pos[i*3+2]=v.z;
      n.set(norm[i*3],norm[i*3+1],norm[i*3+2]).applyQuaternion(q);norm[i*3]=n.x;norm[i*3+1]=n.y;norm[i*3+2]=n.z;
    }
    (parts[name]??=[]).push({start,count:pos.length/3-start});
  };
  const yawOut=side=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),side*.55);
  for(const side of [-1,1]){
    const at=a=>side>0?a:Math.PI-a;
    // Eye a third of the way down the head, below the forehead line, with an orbit ridge.
    feature('eyes',0x18120d,.33,at(.42),-.008,[.017,.026,.032],yawOut(side));
    feature('brows',HORSE.coat,.31,at(.80),-.007,[.012,.008,.038],yawOut(side));
    // Comma-shaped nostrils on the front-sides of the broad muzzle.
    feature('nostrils',0x120d0a,.895,at(1.0),-.005,[.013,.009,.032],
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0,side*.22,side*.85)));
  }
  // Lips, chin and the mouth line under the upper lip.
  feature('lips',0x3a281c,.955,-Math.PI/2,-.016,[.040,.016,.040]);
  feature('lips',0x2a1b11,.875,-Math.PI/2,-.015,[.034,.015,.038]);
  feature('lips',0x0e0a08,.925,-Math.PI/2,-.001,[.047,.0035,.036]);
  for(const side of [-1,1]){
    // Leaf-shaped ear: oval base, cupped darker opening facing forward,
    // tips slightly forward and inward; base vertices seated on the skull.
    const ear=slots.ears[side<0?0:1],earRest=rest[ear],start=pos.length/3;
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.18,0,side*.12));
    const leaf=(r,h)=>new THREE.LatheGeometry([[0,0],[.70,0],[.98,.19],[.94,.44],[.68,.69],[.32,.88],[.06,1]].map(([x,y])=>new THREE.Vector2(x*r,y*h)),10);
    const outer=leaf(.045,.16).toNonIndexed(),base=[];
    for(let i=0;i<outer.attributes.position.count;i++)if(Math.abs(outer.attributes.position.getY(i))<1e-6)base.push(start+i);
    add(outer,HORSE.coat,[0,0,0],[1,1,.74],ear,q);
    for(const i of base){
      const x=pos[i*3]-headRest.x,z=pos[i*3+2]-headRest.z;
      pos[i*3+1]=headRest.y+skullTop(headGeo,x,z)-.002;
    }
    add(leaf(.03,.12),0x5a3a22,[0,.022,-.015],[1,1,.42],ear,q);
    parts['ear'+side]={start,count:pos.length/3-start};
  }
  // Mane sits on the crest and feathers out at the poll instead of ending
  // in a hard slab edge; its poll end shares the head/neck junction weights.
  part('mane',()=>{
    const m=loft([[.13,.12,.028,.055],[.02,.20,.033,.055],
      [-.12,.27,.03,.05],[-.27,.315,.025,.042],
      [-.42,.325,.016,.03],[-.48,.31,.006,.008]],HORSE.face,slots.neck);
    for(let i=m.start;i<m.start+m.count;i++)blendHead(i);
  });

  // Connected tapered limb sections carry blended hip/knee/foot weights.
  // Joint and fetlock radii remain below the .038 cannon radius.
  for(const l of slots.legs){
    const fore=l.z<0;
    // Distinct shoulder/elbow and thigh/hock contours share the proven
    // joint centers and skinning. Extra rings soften the rod-like transition;
    // directional depth reveals joints without oversized lateral balls.
    const sections=fore?[
      [.09,0,.085,.09],[-.10,.018,.068,.075],[-.25,.008,.05,.056],
      [-.33,0,.038,.042],[-HORSE.upper,-.008,.034,.044],
      [-.455,-.008,.033,.031],[-.53,-.004,.038,.030],
      [-.66,-.005,.032,.029],[-.74,-.008,.030,.036],[-.79,-.012,.029,.029]
    ]:[
      [.09,0,.105,.105],[-.10,-.020,.090,.100],[-.25,-.012,.060,.072],
      [-.33,.006,.044,.048],[-HORSE.upper,.022,.034,.054],
      [-.455,.010,.033,.037],[-.53,0,.038,.030],
      [-.66,-.005,.032,.029],[-.74,-.008,.030,.036],[-.79,-.012,.029,.029]
    ];
    part('leg'+slots.legs.indexOf(l),()=>loft(sections,HORSE.coat,l.hip,i=>{
      const y=pos[i*3+1]-rest[l.hip].y;
      const knee=clamp((-y-(HORSE.upper-.08))/.16,0,1);
      const foot=clamp((-y-(HORSE.upper+HORSE.lower-.055))/.055,0,1);
      skin[i*4]=l.hip;skin[i*4+1]=l.knee;skin[i*4+2]=l.foot;
      const influences=[[l.hip,1-knee],[l.knee,knee*(1-foot)],[l.foot,knee*foot]].sort((a,b)=>b[1]-a[1]);
      for(let n=0;n<3;n++){skin[i*4+n]=influences[n][0];weight[i*4+n]=influences[n][1];}
    },'y'));
    // Proven actual hoof sole geometry remains byte-for-byte authored here.
    oval(HORSE.face,[0,-.0245,-.018],[.070,.04975,.105],l.foot,10,6);
  }
  // Six unchanged bones carry a hanging hair bundle: narrow dock, fuller
  // lower hair and a blunt soft end rather than a needle or paired spheres.
  part('tail',()=>loft([
    [.04,.76,.035,.035],[-.12,.775,.038,.038],[-.27,.79,.047,.045],
    [-.42,.805,.057,.050],[-.57,.82,.060,.052],[-.72,.835,.057,.049],
    [-.87,.85,.040,.038],[-.93,.855,.022,.023]
  ],HORSE.face,slots.body,i=>{
    const y=pos[i*3+1]-rest[slots.body].y;
    const segment=clamp((.10-y)/.145,0,5),lo=Math.floor(segment),hi=Math.min(lo+1,5),t=segment-lo;
    const influences=[[slots.tail[lo],1-t],[slots.tail[hi],t]].sort((a,b)=>b[1]-a[1]);
    for(let k=0;k<2;k++){skin[i*4+k]=influences[k][0];weight[i*4+k]=influences[k][1];}
  },'y'));

  const geometry=new THREE.BufferGeometry();
  // Test diagnostics refer to actual vertex spans, not expected dimensions.
  geometry.userData.horseAnatomyParts=parts;
  // Head diagnostics: rest poll (head bone) and the shared junction field.
  geometry.userData.horseHead={poll:rest[slots.head].toArray(),blend:horseHeadBlend};
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88})};
}

export function createHorse3D(h=1.6,x=0,z=0){
  if(!template)template=buildTemplate();
  const t=template,bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(h/HORSE.height);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot],planted:false,ax:0,az:0,ayaw:0}));
  for(const l of legs)l.hip.rotation.order='YXZ';
  const rig={g,model,card,body:bones[t.slots.body],neck:bones[t.slots.neck],head:bones[t.slots.head],ears:t.slots.ears.map(i=>bones[i]),tail:t.slots.tail.map(i=>bones[i]),legs,spec:HORSE,state:{phase:0,amount:0,time:0,gait:'idle'},q:new THREE.Quaternion(),ik:createHorseIKScratch(),disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateHorse3D(rig,0,0,1/60,'idle');return rig;
}

// ---------- Locomotion planner ----------
// Gait table. duty is the stance fraction of a stride; tmax caps the stride
// period so slow gaits still take short swings; reachUse caps the distance a
// hoof travels under its hip during one stance, as a share of the moving
// reach disc's diameter (so smaller horses step faster); minSupport is the fewest
// stance hooves a lift may leave; air is the longest allowed interval with
// no stance hoof (seconds). A turn may ask at most turnSwing of any one
// leg's time for swinging, and at most turnSlots summed over the legs.
// Idle governs stationary recovery steps.
const GAITS={
  idle:{mult:1,duty:.62,tmax:.9,reachUse:.6,minSupport:3,air:0,turnSwing:.6,turnSlots:1.7},
  walk:{mult:1,duty:.52,tmax:.9,reachUse:.5,minSupport:2,air:0,turnSwing:.6,turnSlots:1.5},
  trot:{mult:1.12,duty:.48,tmax:.75,reachUse:.8,minSupport:0,air:.10,turnSwing:.75,turnSlots:2.6},
  canter:{mult:1.38,duty:.40,tmax:.65,reachUse:.9,minSupport:0,air:.15,turnSwing:.8,turnSlots:2.6}
};
// Leg phase offsets (LF, RF, LH, RH): four-beat walk, diagonal trot and the
// hind -> diagonal pair -> leading fore three-beat canter.
const gaitOffsets=gait=>gait==='trot'?[0,.5,.5,0]:gait==='canter'?[.5,.75,.75,0]:gait==='walk'?[.75,.25,0,.5]:[0,0,0,0];
const MAX_DROP=.09,REACH_MARGIN=.001,PLAN_REACH=.94,GOVERN_REACH=.96,LEAD_LIMIT=.95;
const YAW_EASE=10,SWING_MIN=.12,SWING_MAX=.45,REPLAN_MIN=.12,REPLAN_LIMIT=3,LAND_EARLY_MIN=.06;
const ACCEL_EASE=4,WALK_LIMIT=1.7,WALK_LOAD=1.8,STANCE_MARGIN=.08,HORIZON=64,HORIZON_STEP=.02,TURN_MIN=.5,TURN_MAX=3;
const YAW_STOP=12,YAW_ACCEL=18,TURN_WALK_TIME=1,TURN_TROT_OFF=.05,CREEP=.05;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Math.hypot for two and three values, computed exactly as V8 does
// (normalised by the largest, Kahan-summed squares, sqrt times the largest)
// so results are bit-identical, without the array V8 allocates per call.
const hyp2=(a,b)=>{
  a=Math.abs(a);b=Math.abs(b);
  if(a!==a||b!==b)return a===Infinity||b===Infinity?Infinity:NaN;
  const m=a>b?a:b;if(m===Infinity)return Infinity;if(m===0)return 0;
  let sum=0,c=0,n=a/m,t=n*n-c,p=sum+t;c=(p-sum)-t;sum=p;
  n=b/m;t=n*n-c;p=sum+t;sum=p;return Math.sqrt(sum)*m;
};
const hyp3=(a,b,d)=>{
  a=Math.abs(a);b=Math.abs(b);d=Math.abs(d);
  if(a!==a||b!==b||d!==d)return a===Infinity||b===Infinity||d===Infinity?Infinity:NaN;
  let m=a>b?a:b;if(d>m)m=d;if(m===Infinity)return Infinity;if(m===0)return 0;
  let sum=0,c=0,n=a/m,t=n*n-c,p=sum+t;c=(p-sum)-t;sum=p;
  n=b/m;t=n*n-c;p=sum+t;c=(p-sum)-t;sum=p;
  n=d/m;t=n*n-c;p=sum+t;sum=p;return Math.sqrt(sum)*m;
};
// Array.prototype.sort as V8 performs it on arrays shorter than 32 (its
// TimSort: reverse an initial strictly descending run, then binary
// insertion; a NaN comparison counts as 0), in place and so in the same
// order, without the work array V8 allocates per call.
const sortSmall=(a,cmp0)=>{
  const n=a.length;if(n<2)return a;if(n>=32)return a.sort(cmp0);
  const cmp=(x,y)=>{const c=+cmp0(x,y);return c!==c?0:c;};
  let run=2,prev=a[1];
  if(cmp(a[1],a[0])<0){
    for(let i=2;i<n&&cmp(a[i],prev)<0;i++){prev=a[i];run++;}
    for(let i=0,j=run-1;i<j;i++,j--){const t=a[i];a[i]=a[j];a[j]=t;}
  }else for(let i=2;i<n&&cmp(a[i],prev)>=0;i++){prev=a[i];run++;}
  for(let k=run;k<n;k++){
    const p=a[k];let lo=0,hi=k;
    while(lo<hi){const m=lo+((hi-lo)>>1);if(cmp(p,a[m])<0)hi=m;else lo=m+1;}
    for(let j=k;j>lo;j--)a[j]=a[j-1];a[lo]=p;
  }
  return a;
};
// Peak hoof speed at body speed v: the per-frame continuity envelope
// max(.10, 2.5d+.002) evaluated at 30 Hz, with 2% headroom.
const hoofSpeedCap=v=>.98*Math.max(3,2.5*v+.06);
// Model yaw eases toward the heading at YAW_EASE/s, never faster than the
// turn rate (rate(sign) is only evaluated when that cap could bind), and
// finishes no slower than a constant YAW_STOP rad/s^2 deceleration would
// rather than creeping in exponentially. While the heading itself keeps
// rotating one way faster than TURN_MIN (a circle tighter than the turn rate
// allows), the yaw keeps turning that way (dir) and is lapped instead of
// reversing when its lag passes half a turn: a sudden reversal of the body's
// rotation is something no hoof in flight can follow. For the same reason the
// yaw rate (w0 is the previous one) of a walking or idling caller changes by
// at most YAW_ACCEL rad/s^2 (headroom over the YAW_STOP finish), so a gait
// change that raises the turn rate does not swing the hips round faster than
// the hooves that keep it supported were planned for. Running gaits, whose
// suspension frees every hoof, follow the heading at the turn rate at once
// (w0 null): a lagging body leaves fast tight turns out of reach.
const yawStep=(yaw,heading,rate,h,dir=0,headingRate=0,w0=null)=>{
  let e=wrap(heading-yaw);
  if(dir&&Math.sign(e)===-dir&&dir*headingRate>TURN_MIN)e+=2*Math.PI*dir;
  const a=Math.abs(e),step=Math.sign(e)*Math.max(a*(1-Math.exp(-h*YAW_EASE)),Math.min(a,h*Math.sqrt(2*YAW_STOP*a)));
  const dv=YAW_ACCEL*h*h,limited=w0===null?step:clamp(step,w0*h-dv,w0*h+dv);
  if(Math.abs(limited)<=TURN_MIN*h)return yaw+limited;
  const cap=rate(Math.sign(limited))*h;
  return yaw+clamp(limited,-cap,cap);
};

// Turn rate budgeted so that the hooves can follow the hips. A hip moving at
// u needs its hoof swinging a fraction k*u/cap of the time (k is the gait
// profile's peak factor); a turn may raise that to turnSwing for any one leg
// and to turnSlots summed over all legs. Both demands are convex in the yaw
// rate, so the largest admissible rate is bisected.
function turnRateFor(r,scale,G,y,hd,ux,uz,limit,sg=0){
  const c=Math.cos(y),n=Math.sin(y),sign=sg||Math.sign(wrap(hd-y))||1,peak=SWING_PEAK.gait;
  const fits=w=>{
    let sum=0;
    for(const l of r.legs){
      const rx=(l.x*c+l.z*n)*scale,rz=(l.z*c-l.x*n)*scale;
      const need=peak*hyp2(ux+sign*w*rz,uz-sign*w*rx)/limit;
      if(need>G.turnSwing)return false;
      sum+=need;
    }
    return sum<=G.turnSlots;
  };
  if(fits(TURN_MAX))return TURN_MAX;
  let lo=0,hi=TURN_MAX;
  for(let i=0;i<9;i++){const mid=(lo+hi)/2;if(fits(mid))lo=mid;else hi=mid;}
  return Math.max(TURN_MIN,lo);
}

export function updateHorse3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const s=r.state,distance=hyp2(dx,dz),teleport=distance>1.5;
  const speed=teleport?0:distance/dt,scale=r.model.scale.x;
  s.time+=dt;
  // Longest frame of the last ~second. A swing lands on the first frame whose
  // summed dt reaches its duration, so with varying frame times it can overrun
  // by up to one frame; the swing budget keeps that frame in reserve.
  s.dtHi=dt>=(s.dtHi??0)?dt:s.dtHi+(dt-s.dtHi)*(1-Math.exp(-dt));
  s.amount=mode==='idle'||teleport?0:clamp(speed/.04,0,1);

  // Hysteresis prevents 60-Hz gait chatter around the 1.25 m/s boundary.
  let gait=mode==='idle'?'idle':mode==='run'
    ?(s.gait==='canter'?(speed>=1.10?'canter':'trot'):(speed>=1.35?'canter':'trot'))
    :'walk';
  // Walk-mode motion is drawn as a trot for three reasons, each with its own
  // hysteresis (so a trot promoted for one reason is not held by another's):
  // - speed: a walk cannot step faster than about 1.7 m/s inside the swing and
  //   reach limits (e.g. while a run eases down after 'walk' is requested);
  // - load: the hips' motion (travel plus the current turn) would need more
  //   than WALK_LOAD of the walk's two swing slots (a hoof moving at u swings
  //   at least k*u/cap of the time);
  // - turn: two hooves always down bound how fast the body can yaw (the hips
  //   sit far from the pivot and every hoof is speed-capped by the continuity
  //   envelope), so even a walk at its full swing capacity needs about 1.4 s
  //   for 90 degrees at 1 m/s (h 2.3). When the walk's turn law could not
  //   bring the heading round within TURN_WALK_TIME, the turn is trotted until
  //   the heading is within TURN_TROT_OFF.
  let why=null;
  if(gait==='walk'){
    const held=s.gait==='trot'&&s.walkTrot!=='turn'&&s.walkTrot!=='load';
    if(speed>=WALK_LIMIT||held&&speed>=WALK_LIMIT-.2)why='speed';
    else if(!teleport){
      const w=s.yawRate||0,c=Math.cos(r.model.rotation.y),n=Math.sin(r.model.rotation.y),ux=dx/dt,uz=dz/dt,capNow=hoofSpeedCap(speed);
      let load=0;
      for(const l of r.legs){const rx=(l.x*c+l.z*n)*scale,rz=(l.z*c-l.x*n)*scale;load+=SWING_PEAK.gait*hyp2(ux+w*rz,uz-w*rx)/capNow;}
      // Load thresholds sit above straight walking at this speed (about 1.78
      // at 1.2 m/s): the load test is about the turn, and a band containing
      // straight walking would hold any trot for good.
      const straight=r.legs.length*SWING_PEAK.gait*speed/capNow,on=Math.max(WALK_LOAD,straight+.1),off=Math.max(WALK_LOAD-.15,straight+.05);
      // (The turn is judged first: a trotted turn's own yaw rate raises the
      // load, which must not then hold the trot once the turn is done.)
      if(speed>.02){
        const y=r.model.rotation.y,hd=Math.atan2(-dx,-dz),err=Math.abs(wrap(hd-y));
        const walkTime=err/turnRateFor(r,scale,GAITS.walk,y,hd,ux,uz,capNow);
        if(walkTime>TURN_WALK_TIME||s.walkTrot==='turn'&&err>TURN_TROT_OFF)why='turn';
      }
      if(!why&&(load>on||s.walkTrot==='load'&&load>off))why='load';
    }
    if(why)gait='trot';
  }
  s.walkTrot=why;
  // Likewise an 'idle' request while the root still coasts that fast (eased
  // steering) is stepped, and reported, as a trot.
  if(gait==='idle'&&!teleport&&speed>=WALK_LIMIT)gait='trot';
  if(teleport)gait='idle';
  s.gait=gait;
  // Stepping follows actual root motion: a caller that reports 'idle' while
  // the root still drifts gets walking steps rather than dragged hooves.
  const moving=!teleport&&speed>.002,planGait=gait==='idle'&&moving?(speed>=WALK_LIMIT?'trot':'walk'):gait;
  // A trot drawn while the caller walks (or idles) keeps a hoof down: trot
  // footfalls without the trot's suspension. Its turn budget lets any one
  // leg swing up to 90% of the time and 2.8 legs swing on average (1.2 down),
  // which brings a 1 m/s 180-degree reversal round in about 1.8 s; under the
  // 30 Hz continuity cap no budget gets it below about 1.4 s.
  const G=planGait==='trot'&&mode!=='run'?{...GAITS.trot,minSupport:1,air:0,turnSwing:.9,turnSlots:2.8}:GAITS[planGait],duty=G.duty,offsets=gaitOffsets(planGait);
  // Gait hand-over: a hoof still airborne from the previous gait keeps that
  // gait's support rule (the rule in force, e.g. a walking caller's trot keeps
  // a hoof down) until it lands (as the contact tests apply it).
  for(const l of r.legs)if(!l.track||l.track.mode==='stance'||teleport)l.inherit=undefined;
  if(s.planRule&&(s.planGait!==planGait||s.planRule.minSupport!==G.minSupport)&&!teleport)for(const l of r.legs)if(l.track?.mode==='swing')l.inherit??=s.planRule;
  s.planGait=planGait;s.planRule={minSupport:G.minSupport,air:G.air};
  const soleY=r.g.position.y+(.07425*scale)+.0005,hipY=r.g.position.y+HORSE.hip*scale;
  const reach=(HORSE.upper+HORSE.lower)*scale-REACH_MARGIN,lift=HORSE.lift*scale;
  // Horizontal radius within which a sole-height target is reachable.
  const radius=drop=>{const h=hipY-drop*scale-soleY;return Math.sqrt(Math.max(0,reach*reach-h*h));};
  const planR=PLAN_REACH*radius(MAX_DROP),restR=radius(0);
  // Distance-driven phase. Slow gaits shorten the stride rather than
  // stretching the stride period (and so every swing) beyond tmax, and no
  // stance may sweep more than reachUse of the usable reach: from the largest
  // lead to the rear of the planning reach, less the distance covered during
  // the lift decision margin.
  const strideLength=HORSE.stride*G.mult*scale,rearReach=Math.max(.3*planR,planR-speed*STANCE_MARGIN);
  const stepLength=Math.min(strideLength,speed*G.tmax,G.reachUse*Math.min(2*planR,LEAD_LIMIT*planR+rearReach)/duty);
  const period=speed>1e-6?stepLength/speed:G.tmax;
  const phaseStep=teleport||!(stepLength>0)?0:distance/stepLength;
  s.phase=(s.phase+phaseStep)%1;
  s.totalPhase=(s.totalPhase||0)+phaseStep;

  // Turn rate for the planned gait (turnRateFor); it depends on the body's
  // yaw, so forecasts integrate the same law.
  const heading=speed>.02?Math.atan2(-dx,-dz):null,cap=hoofSpeedCap(speed),peak=SWING_PEAK.gait;
  const vx=teleport?0:dx/dt,vz=teleport?0:dz/dt;
  const turnRate=(y,hd,ux,uz,limit,sg)=>turnRateFor(r,scale,G,y,hd,ux,uz,limit,sg);
  const yawBefore=r.model.rotation.y;
  if(heading!==null){
    let y1=yawStep(yawBefore,heading,sg=>turnRate(yawBefore,heading,vx,vz,cap,sg),dt,s.yawDir||0,s.headingRate||0,mode==='run'?null:s.yawRate||0);
    // Yaw governor. The model's yaw is the one body motion the planner owns:
    // a turn may not carry a planted hoof beyond GOVERN_REACH of the reach
    // radius (nor further, once the root's own travel has). A hoof waiting
    // for support keeps its anchor and the turn waits instead.
    const gR=GOVERN_REACH*radius(MAX_DROP),px=r.g.position.x,pz=r.g.position.z;
    const d=(l,y)=>{const c=Math.cos(y),n=Math.sin(y);return hyp2(l.track.x-px-(l.x*c+l.z*n)*scale,l.track.z-pz-(l.z*c-l.x*n)*scale);};
    const over=a=>r.legs.some(l=>l.track?.mode==='stance'&&d(l,yawBefore+a*(y1-yawBefore))>Math.max(gR,d(l,yawBefore)));
    if(over(1)){
      let lo=0,hi=1;for(let i=0;i<8;i++){const m=(lo+hi)/2;if(over(m))hi=m;else lo=m;}
      y1=yawBefore+lo*(y1-yawBefore);s.yawGoverned=(s.yawGoverned||0)+1;
    }
    r.model.rotation.y=y1;
  }
  s.yawRate=(r.model.rotation.y-yawBefore)/dt;s.yawDir=Math.abs(s.yawRate)>1e-3?Math.sign(s.yawRate):0;
  // Root-motion trend for forecasts: heading rate and acceleration, smoothed
  // over ~0.1 s. A step change (instant turn, start or stop; a heading
  // moving faster than 8 rad/s) is not extrapolated.
  const trend=1-Math.exp(-dt/.1);
  if(heading!==null&&s.lastHeading!=null){const w=wrap(heading-s.lastHeading)/dt;s.headingRate=Math.abs(w)>8?0:(s.headingRate||0)+(w-(s.headingRate||0))*trend;}
  else s.headingRate=0;
  if(!teleport&&s.lastSpeed>.02){const a=(speed-s.lastSpeed)/dt;s.accel=Math.abs(a)>40?0:(s.accel||0)+(a-(s.accel||0))*trend;}
  else s.accel=0;
  s.lastHeading=heading;s.lastSpeed=speed;
  // Fixed hip roots: the caller has already translated r.g by dx/dz.
  // World-space planted hooves articulate the leg under the torso.
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw);
  const gx=r.g.position.x,gz=r.g.position.z;
  const hipX=(l,px,c,n)=>px+(l.x*c+l.z*n)*scale,hipZ=(l,pz,c,n)=>pz+(l.z*c-l.x*n)*scale;
  for(const l of r.legs)if(!l.track){
    l.track=createHoofTrack(hipX(l,gx,cos,sin),soleY,hipZ(l,gz,cos,sin),yaw);
    l.lastSwingCycle=-1;l.stanceAge=Infinity;l.replans=0;l.liftStart=0;
  }

  if(teleport){
    // Explicit reset only for teleports; the torso returns to its rest height.
    for(const l of r.legs){
      resetHoofTrack(l.track,hipX(l,gx,cos,sin),soleY,hipZ(l,gz,cos,sin),yaw);
      l.planted=false;l.stanceAge=Infinity;l.replans=0;
    }
    s.bodyDrop=0;
  }else{
    // Predicted body poses over the planning horizon: speed and heading
    // follow their trend, yaw follows the turn law above.
    const P=r.plan||(r.plan=new Float64Array((HORIZON+1)*5)),hs=HORIZON_STEP;
    // (The turn rate varies slowly with yaw; it is re-evaluated every third
    // step of the forecast. One rate callback reads the step's state from F,
    // so the loop allocates no closure per step.)
    const F=r.planStep||(r.planStep=new Float64Array(5));
    let fRate=null,fRateSign=0,fAge=0;
    const forecastRate=sg=>{if(fRate===null||sg!==fRateSign||++fAge>=3){fRate=turnRate(F[0],F[1],F[2],F[3],hoofSpeedCap(F[4]),sg);fRateSign=sg;fAge=0;}return fRate;};
    for(let k=0,y=yaw,px=gx,pz=gz,sp=speed,hd=heading,fdir=s.yawDir,fw=mode==='run'?null:s.yawRate||0;k<=HORIZON;k++){
      if(k){
        if(hd===null){px+=vx*hs;pz+=vz*hs;}
        else{
          // Speeding up is forecast as an exponential approach with the
          // observed initial rate (exact for eased steering), levelling off
          // after about 1/ACCEL_EASE s. Slowing is not extrapolated: steering
          // often slows only briefly, and a stop is handled once it happens.
          hd+=s.headingRate*hs;
          if(s.accel>0)sp=speed+s.accel/ACCEL_EASE*(1-Math.exp(-ACCEL_EASE*k*hs));
          const ux=-Math.sin(hd)*sp,uz=-Math.cos(hd)*sp;
          px+=ux*hs;pz+=uz*hs;
          if(sp>.02){const y0=y;F[0]=y;F[1]=hd;F[2]=ux;F[3]=uz;F[4]=sp;y=yawStep(y,hd,forecastRate,hs,fdir,s.headingRate,fw);if(fw!==null)fw=(y-y0)/hs;fdir=Math.abs(y-y0)>1e-3*hs?Math.sign(y-y0):0;}
        }
      }
      P[k*5]=px;P[k*5+1]=pz;P[k*5+2]=Math.cos(y);P[k*5+3]=Math.sin(y);P[k*5+4]=y;
    }
    // Forecast body (x, z, yaw) at tau, written to BODY (no array per call).
    const BODY=r.planBody||(r.planBody=new Float64Array(3));
    const bodyAt=tau=>{
      const f=clamp(tau/HORIZON_STEP,0,HORIZON),k=Math.min(HORIZON-1,Math.floor(f)),w=f-k,o=k*5;
      BODY[0]=P[o]+(P[o+5]-P[o])*w;BODY[1]=P[o+1]+(P[o+6]-P[o+1])*w;BODY[2]=P[o+4]+(P[o+9]-P[o+4])*w;
    };
    // Swing budget: every swing, however often it is re-aimed or re-timed,
    // touches down within SWING_MAX of its lift-off (one frame in reserve).
    const swingCap=SWING_MAX-s.dtHi,budget=l=>Math.max(dt,swingCap-(s.time-dt-l.liftStart));
    // Time until a stance hoof at x/z must lift: when it would leave the
    // planning reach of its moving hip, or when even a longest swing could no
    // longer catch that hip at touchdown inside the hoof-speed envelope.
    const spanMax=swingCap*Math.sqrt(Math.max(1e-6,cap*cap-(3.08*lift/swingCap)**2))/peak;
    const spanLag=Math.round((swingCap-dt)/HORIZON_STEP);
    // With hard=true only the true reach (less 1.5%) counts: the planning
    // radius's reserve is what a hoof blocked by support may use up before
    // it is forced to lift.
    const hardR=.985*radius(MAX_DROP);
    // Support scheduling can ask the same reach question repeatedly.
    // Cache only the last exact query per leg, and invalidate each update.
    for(const l of r.legs)if(l.reachMemo)l.reachMemo.valid=false;
    const timeToReachLimit=(l,x,z,hard=false,from=0)=>{
      const memo=l.reachMemo||(l.reachMemo={valid:false});
      if(memo.valid&&memo.x===x&&memo.z===z&&memo.hard===hard&&memo.from===from)return memo.result;
      const limit=hard?hardR:planR,k0=Math.min(HORIZON,Math.ceil(from/HORIZON_STEP-1e-9));
      let before=0,result=Infinity;
      for(let k=k0;k<=HORIZON;k++){
        const o=k*5,d=hyp2(x-hipX(l,P[o],P[o+2],P[o+3]),z-hipZ(l,P[o+1],P[o+2],P[o+3]));
        if(d>limit){result=k>k0?(k-1+(limit-before)/(d-before))*HORIZON_STEP:k*HORIZON_STEP;break;}
        const q=(k+spanLag)*5;
        if(!hard&&k+spanLag<=HORIZON&&hyp2(x-hipX(l,P[q],P[q+2],P[q+3]),z-hipZ(l,P[q+1],P[q+2],P[q+3]))>spanMax){result=k*HORIZON_STEP;break;}
        before=d;
      }
      memo.x=x;memo.z=z;memo.hard=hard;memo.from=from;memo.result=result;memo.valid=true;
      return result;
    };
    // Predicted hip position after tau and the hip's own velocity there,
    // written to one reused object (every caller reads it before the next
    // call).
    const HIP=r.planHip||(r.planHip={x:.5,z:.5,yaw:.5,ux:.5,uz:.5});
    const hipAhead=(l,tau)=>{
      bodyAt(tau);const x0=BODY[0],z0=BODY[1],y0=BODY[2];bodyAt(tau+.05);const x1=BODY[0],z1=BODY[1],y1=BODY[2];
      const c0=Math.cos(y0),n0=Math.sin(y0),c1=Math.cos(y1),n1=Math.sin(y1);
      const x=hipX(l,x0,c0,n0),z=hipZ(l,z0,c0,n0);
      HIP.x=x;HIP.z=z;HIP.yaw=y0;HIP.ux=(hipX(l,x1,c1,n1)-x)/.05;HIP.uz=(hipZ(l,z1,c1,n1)-z)/.05;
      return HIP;
    };
    // While the hoof decelerates into touchdown (the profile's final ramp,
    // a fraction 1-1/k of the swing) the hip keeps moving at v, so the hoof's
    // offset from it peaks beyond the planned lead. Exact for the gait ramp:
    // the peak is where hoof speed falls to v.
    const ramp=1-1/peak;
    const overshoot=(v,D,span)=>{
      if(!(v>0))return 0;
      const c=span>1e-6?Math.min(1,v*D/(span*peak)):1;
      let lo=0,hi=1;
      for(let i=0;i<20;i++){const x=(lo+hi)/2;if(3*x*x-2*x*x*x<c)lo=x;else hi=x;}
      return Math.max(0,ramp*(v*lo*D-span*peak*(lo**3-lo**4/2)));
    };
    // Lead (as a multiple of the hip velocity) that centres the coming stance
    // under the hip, leaving room for the touchdown overshoot; stationary
    // recovery lands directly under the hip.
    const leadFor=(h,D,t)=>{
      const v=hyp2(h.ux,h.uz);
      if(!moving||!(v>1e-4))return 0;
      // Centred stance, biased forward when the rear of the reach is consumed
      // by the lift decision margin at speed.
      const sweep=v*duty*period,lead=Math.min(Math.max(sweep/2,sweep-Math.max(.3*planR,planR-v*STANCE_MARGIN)),LEAD_LIMIT*planR);
      const span=hyp2(h.x+h.ux*lead/v-t.x,h.z+h.uz*lead/v-t.z);
      return Math.max(0,Math.min(lead,LEAD_LIMIT*planR-overshoot(v,D,span)))/v;
    };
    // A swing lands at the predicted hip plus the lead. If the gait profile
    // would need a faster hoof than the continuity envelope allows (lift
    // bump included), the lead is shortened first and the swing lengthened
    // only if the hip itself is out of range; the landing is never truncated.
    // Swings last whole frames: the lift frame already advances the swing by
    // dt, so the hoof lands exactly D-dt after this frame's body pose.
    // (A hair under k frames, so summed dt always reaches it on frame k.)
    const frames=D=>Math.max(1,Math.ceil(D/dt-1e-6))*dt-1e-9,framesBelow=D=>Math.max(1,Math.floor(D/dt+1e-6))*dt-1e-9;
    // Lift height scales with the swing so that the lift's own vertical
    // speed stays under a third of the envelope: quick steps are low.
    const liftFor=(bump,D,speedCap=cap)=>Math.min(bump,speedCap*D/(3*3.08));
    // A swing path (with lift) from u0 on must stay within .985 of the
    // forecast hip's reach at every frame it will be drawn, to touchdown
    // included: on a tight curve the hips sweep sideways and can leave a hoof
    // mid-swing, not only in the final ramp where a decelerating hoof lags
    // its hip.
    const pathFits=(l,t,lx,lz,D,lf,u0=0,lim=.985*reach)=>{
      const s0=u0>0?swingProfile(u0,'gait'):0,k=1/(1-s0),b0=lf*16*u0*u0*(1-u0)*(1-u0);
      const sx=(t.x-lx*s0)*k,sz=(t.z-lz*s0)*k,sy=(t.y-b0-soleY*s0)*k,hy=hipY-MAX_DROP*scale;
      const R=(1-u0)*D,n=Math.max(1,Math.ceil(R/dt-1e-9));
      for(let i=1;i<=n;i++){
        const f=Math.min(1,i*dt/R),u=u0+(1-u0)*f,sp=swingProfile(u,'gait');
        const x=sx+(lx-sx)*sp,z=sz+(lz-sz)*sp,y=sy+(soleY-sy)*sp+lf*16*u*u*(1-u)*(1-u);
        bodyAt(Math.max(0,(u-u0)*D-dt));const bx=BODY[0],bz=BODY[1],by=BODY[2],c=Math.cos(by),n=Math.sin(by);
        if(hyp3(x-hipX(l,bx,c,n),z-hipZ(l,bz,c,n),y-hy)>lim)return false;
      }
      return true;
    };
    const planSwing=(l,t,D,bump,maxD=swingCap,speedCap=cap)=>{
      let h,wx,wz,w2,S2;maxD=framesBelow(maxD);D=Math.min(frames(D),maxD);
      for(let i=0;;i++){
        h=hipAhead(l,D-dt);wx=h.x-t.x;wz=h.z-t.z;w2=wx*wx+wz*wz;
        const rise=3.08*liftFor(bump,D,speedCap)/D,S=D*Math.sqrt(Math.max(1e-6,speedCap*speedCap-rise*rise))/peak,dy=t.y-soleY;
        S2=S*S-dy*dy;
        if(w2<=S2||D>=maxD||i>=6)break;
        D=Math.min(maxD,frames(D*Math.max(1.05,Math.sqrt(w2/Math.max(S2,1e-6)))));
      }
      if(w2>S2){
        // Even the longest swing cannot reach the hip in time: land short, on
        // the near side of the hip's reach, at the envelope's limit.
        const w=Math.sqrt(w2),reachable=Math.sqrt(Math.max(0,S2)),k=Math.min(1,Math.max(reachable,w-planR)/w);
        return {x:t.x+wx*k,y:soleY,z:t.z+wz*k,yaw:h.yaw,D,hipX:h.x,hipZ:h.z,lift:liftFor(bump,D,speedCap)};
      }
      let a=leadFor(h,D,t);
      if(a>0){
        const lu=a*hyp2(h.ux,h.uz);
        const ex=h.ux*a/lu,ez=h.uz*a/lu,wu=wx*ex+wz*ez,m=-wu+Math.sqrt(Math.max(0,wu*wu+S2-w2));
        if(m<lu)a*=Math.max(0,m)/lu;
      }
      const lf=liftFor(bump,D,speedCap);
      for(let j=0;j<5&&a>0&&!pathFits(l,t,h.x+h.ux*a,h.z+h.uz*a,D,lf);j++)a*=.7;
      return {x:h.x+h.ux*a,y:soleY,z:h.z+h.uz*a,yaw:h.yaw,D,hipX:h.x,hipZ:h.z,lift:lf};
    };
    // The touchdown hip a plan was made for; a replan happens only when the
    // body's predicted motion moves that hip, not merely as time passes.
    const begin=(l,p)=>{
      beginHoofSwing(l.track,p,p.D,p.lift,Infinity,'gait');
      l.replans=0;l.liftStart=s.time-dt;l.planHipX=p.hipX;l.planHipZ=p.hipZ;
    };
    const replan=(l,p,lift)=>{
      retargetSwing(l.track,p,p.D,p.lift??lift);
      l.replans++;l.planHipX=p.hipX;l.planHipZ=p.hipZ;
    };
    // Re-aim a swing in flight without restarting it (gait profile): the
    // hoof keeps its pose and progress u, so a hoof re-aimed every frame
    // still travels instead of stalling. The time left starts at rem and
    // grows up to remMax if the speed envelope needs it; past that the hoof
    // lands short, on its hip's side. Falls back to a restart (planSwing).
    // A swing can be re-aimed without restarting while enough of its travel
    // remains; such re-aims keep the hoof moving, so they need no count limit
    // (the limit only stops repeated restarts from stalling a hoof).
    const reaimable=t=>t.profile==='gait'&&1-swingProfile(t.swingElapsed/t.swingDuration,t.profile)>=.01&&t.swingDuration-t.swingElapsed>dt;
    // Largest per-frame hoof step (lift included) left in a swing re-aimed
    // from progress u to land at x/z after rem, at the longest recent frame
    // time (a longer frame takes a longer step).
    const reaimStep=(t,u,x,z,rem,lf)=>{
      const D=rem/(1-u),s0=swingProfile(u,'gait'),k=1/(1-s0),bump=v=>lf*16*v*v*(1-v)*(1-v);
      const sx=(t.x-x*s0)*k,sz=(t.z-z*s0)*k,sy=(t.y-bump(u)-soleY*s0)*k;
      let px=t.x,py=t.y,pz=t.z,worst=0;
      for(let e=u*D+s.dtHi;;e+=s.dtHi){
        const v=Math.min(1,e/D),q=swingProfile(v,'gait');
        const nx=sx+(x-sx)*q,nz=sz+(z-sz)*q,ny=sy+(soleY-sy)*q+bump(v);
        worst=Math.max(worst,hyp3(nx-px,ny-py,nz-pz));px=nx;py=ny;pz=nz;
        if(v>=1)return worst;
      }
    };
    const stepCapNow=.97*Math.max(.10,2.5*distance+.002);
    // Earliest time from `from` (and before `until`) at which a swing could
    // land at its current landing: the remaining path fits the continuity
    // envelope frame by frame and the landing is within its hip's reach then.
    const sooner=(l,from,until)=>{
      const t=l.track;
      if(!reaimable(t))return until;
      const u=t.swingElapsed/t.swingDuration;
      for(let rem=frames(from);rem<until-1e-9;rem=frames(rem+dt)){
        const h=hipAhead(l,Math.max(0,rem-dt));
        if(hyp2(t.landX-h.x,t.landZ-h.z)<=planR&&reaimStep(t,u,t.landX,t.landZ,rem,t.swingLift)<=stepCapNow)return rem;
      }
      return until;
    };
    // Every re-aim is re-timed (within remMax) until each remaining frame's
    // step fits the continuity envelope of the current root motion.
    const reaim=(l,rem,remMax,lift,speedCap=cap,stepCap=stepCapNow,keep=false)=>{
      const t=l.track,u=t.swingElapsed/t.swingDuration,left=1-swingProfile(u,t.profile);
      if(reaimable(t)){
        remMax=Math.max(rem,remMax);rem=Math.min(frames(rem),framesBelow(remMax));const rem0=rem;
        for(let tries=0;;tries++){
          // As for a fresh swing: shorten the lead first, and lengthen the time
          // left only if even the hip itself is out of the envelope.
          let h,x,z,wx,wz,w2,S2;const dy=soleY-t.y;
          for(let i=0;;i++){
            h=hipAhead(l,Math.max(0,rem-dt));wx=h.x-t.x;wz=h.z-t.z;w2=wx*wx+wz*wz;
            const S=left*speedCap*(rem/(1-u))/peak;S2=S*S-dy*dy;
            if(w2<=S2||rem>=framesBelow(remMax)-1e-9||i>=5)break;
            rem=Math.min(framesBelow(remMax),frames(rem*Math.max(1.05,Math.sqrt(w2/Math.max(S2,1e-6)))));
          }
          if(w2>S2){
            // Land short toward the hip, but never outside its reach.
            const w=Math.sqrt(w2),k=Math.min(1,Math.max(Math.sqrt(Math.max(0,S2)),w-planR)/Math.max(w,1e-9));
            x=t.x+wx*k;z=t.z+wz*k;
          }else{
            let a=leadFor(h,rem/(1-u),t);
            if(a>0){
              const lu=a*hyp2(h.ux,h.uz),ex=h.ux*a/lu,ez=h.uz*a/lu,wu=wx*ex+wz*ez,m=-wu+Math.sqrt(Math.max(0,wu*wu+S2-w2));
              if(m<lu)a*=Math.max(0,m)/lu;
            }
            const lf=Math.min(t.swingLift,liftFor(t.swingLift,rem/(1-u)));
            for(let j=0;j<5&&a>0&&!pathFits(l,t,h.x+h.ux*a,h.z+h.uz*a,rem/(1-u),lf,u);j++)a*=.7;
            x=h.x+h.ux*a;z=h.z+h.uz*a;
          }
          const p={x,y:soleY,z,yaw:left<.15?t.landYaw:h.yaw,D:rem/(1-u),hipX:h.x,hipZ:h.z},lf=Math.min(t.swingLift,liftFor(t.swingLift,p.D));
          if(stepCap<Infinity&&reaimStep(t,u,x,z,rem,lf)>stepCap){
            if(tries<12&&rem<framesBelow(remMax)-1e-9){rem=Math.min(framesBelow(remMax),frames(rem+dt));continue;}
            // An early landing (keep) that cannot fit the envelope within
            // remMax keeps the current plan if that plan fits; re-aims for
            // reach always apply.
            const now=t.swingDuration-t.swingElapsed;
            if(keep){
              // Otherwise re-time it to its current landing, as early as that
              // fits the envelope and stays within its hip's reach.
              const r2=sooner(l,rem0,now);
              if(r2<now-1e-9&&reaimSwing(t,{x:t.landX,y:t.landY,z:t.landZ,yaw:t.landYaw},r2/(1-u),null)){l.replans++;return r2;}
              if(reaimStep(t,u,t.landX,t.landZ,now,t.swingLift)<=stepCap)return now;
            }
          }
          if(reaimSwing(t,p,p.D,lf)){l.replans++;l.planHipX=p.hipX;l.planHipZ=p.hipZ;return rem;}
          break;
        }
      }
      const p=planSwing(l,t,rem,lift,remMax,speedCap);
      replan(l,p,lift);return p.D;
    };

    // Swing timing shared by the replans and the support schedule.
    const nominal=moving?clamp((1-duty)*period,SWING_MIN,swingCap):.24,stepLift=moving?lift:.6*lift;
    // Escape margin: the hoof lags its hip for ~4% of a swing after lift-off,
    // plus one decision frame (never less than a 30 Hz frame, so faster frame
    // rates are not given a thinner margin).
    const escape=.04*nominal+Math.max(dt,1/30);
    // Support schedule, earliest deadline first. Each stance hoof must lift
    // before it leaves planning reach (less an escape margin); at most
    // 4-minSupport hooves swing at once and a slot frees when a swinging hoof
    // lands. A lift that would leave a later hoof late is shortened so the
    // slot frees in time; a swinging hoof is landed early for the same reason.
    // Gaits with an airborne allowance are scheduled as if one hoof stays
    // down; the allowance is spent only on a hoof that is due to lift.
    const minSupport=moving?G.minSupport:GAITS.idle.minSupport,slots=r.legs.length-Math.max(minSupport,G.air>0?1:0);
    // A swing sized to touch down on the leg's own cycle boundary, so a hoof
    // that lifted off-schedule rejoins the gait's rhythm within one stride.
    const syncSwing=phase=>clamp((1-phase)*period,SWING_MIN,swingCap);
    const due=[];
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i],t=l.track;
      if(t.mode!=='stance')continue;
      const phase=(s.phase+offsets[i])%1,cycle=Math.floor(s.totalPhase+offsets[i]);
      let deadline=Infinity,scheduled=false;
      if(moving){
        deadline=timeToReachLimit(l,t.x,t.z)-escape;
        scheduled=phase>=duty&&cycle!==l.lastSwingCycle&&l.stanceAge>=.3*duty*period;
        // While the root only creeps (the tail of eased steering) recovery
        // starts as it would at rest, rather than after the creep ends.
        if(speed<CREEP){const d=hyp2(t.x-hipX(l,gx,cos,sin),t.z-hipZ(l,gz,cos,sin));if(d>.5*restR)deadline=Math.min(deadline,0);}
      }else{
        const d=hyp2(t.x-hipX(l,gx,cos,sin),t.z-hipZ(l,gz,cos,sin));
        if(d>.5*restR)deadline=-d;
      }
      // The swing this hoof would actually take now (the speed envelope can
      // lengthen it), so the schedule's slot forecasts are not optimistic.
      const D=moving&&deadline<Infinity?Math.max(nominal,planSwing(l,t,nominal,stepLift).D):nominal;
      due.push({l,deadline,scheduled,phase,cycle,D,start:Infinity,slack:Infinity});
    }
    sortSmall(due,(a,b)=>a.deadline-b.deadline);
    // Whether every hoof in feet still gets a slot before its deadline, given
    // the swinging hooves' remaining times in busy.
    const feasible=(busy,feet)=>{
      const sorted=sortSmall(busy.slice(),(x,y)=>x-y),free=[];
      for(let k=0;k<slots;k++){const j=sorted.length-slots+k;free.push(j>=0?sorted[j]:0);}
      for(const o of sortSmall(feet.slice(),(x,y)=>x.deadline-y.deadline)){
        sortSmall(free,(x,y)=>x-y);const t0=Math.max(free.shift(),o.release||0);
        if(t0>o.deadline+1e-9)return false;free.push(t0+o.D);
      }
      return true;
    };
    // Each swinging hoof (but skip) must lift again after touchdown, by the
    // deadline of its planned landing.
    const nextLifts=skip=>r.legs.filter(o=>o!==skip&&o.track.mode==='swing').map(o=>{
      const t=o.track,rem=t.swingDuration-t.swingElapsed;
      return {l:o,next:true,release:rem,deadline:timeToReachLimit(o,t.landX,t.landZ,false,rem)-escape,D:nominal,start:Infinity,slack:Infinity};
    });
    // A swing may be delayed to touch down after `until` only if every stance
    // hoof, and every other swinging hoof after its touchdown, still gets a
    // slot before its deadline.
    const delayable=(l,until)=>feasible(
      [...r.legs.filter(o=>o!==l&&o.track.mode==='swing').map(o=>o.track.swingDuration-o.track.swingElapsed),until],
      [...due.filter(f=>f.deadline<Infinity&&f.l.track.mode==='stance'),...nextLifts(l)]);
    // Replan swings whose touchdown no longer fits the body's motion (turns,
    // speed changes, stops). The hoof continues from its current pose.
    if(!moving&&s.wasMoving)for(const l of r.legs)l.replans=0;
    // Touchdowns that current support depends on keep their time: when fewer
    // hooves are down than the gait's floor (at least one), the earliest
    // landings that restore it may be re-aimed but never delayed.
    const floorNow=Math.max(moving?G.minSupport:GAITS.idle.minSupport,1);
    const pinned=sortSmall(r.legs.filter(l=>l.track.mode==='swing'),(a,b)=>(a.track.swingDuration-a.track.swingElapsed)-(b.track.swingDuration-b.track.swingElapsed))
      .slice(0,Math.max(0,floorNow-r.legs.filter(l=>l.track.mode==='stance').length));
    for(const l of r.legs){
      const t=l.track;
      if(t.mode!=='swing')continue;
      const remaining=t.swingDuration-t.swingElapsed;
      const h=hipAhead(l,Math.max(0,remaining-dt));
      // A touchdown the hip can no longer reach is always replanned; other
      // prediction changes only while enough of the swing remains.
      const unreachable=hyp2(t.landX-h.x,t.landZ-h.z)>planR;
      if(!moving){
        // Stationary: a reachable touchdown is kept. Otherwise the hoof comes
        // down promptly at the nearest point its hip reaches (recovery steps
        // centre it later), as fast as the envelope allows.
        if(unreachable){
          const wx=t.x-h.x,wz=t.z-h.z,w=hyp2(wx,wz),k=w>.9*planR?.9*planR/w:1;
          const x=h.x+wx*k,z=h.z+wz*k,span=hyp3(x-t.x,z-t.z,t.y-soleY);
          replan(l,{x,y:soleY,z,yaw,D:Math.min(frames(Math.max(2*dt,peak*span/(.97*cap))),framesBelow(budget(l))),hipX:h.x,hipZ:h.z},0);
        }
        continue;
      }
      // A touchdown is also unsafe when, by the current forecast, the planted
      // hoof would reach its lift deadline before it could escape: it would
      // have to lift again at once, behind a hip already pulling away. While
      // the swing can still be re-aimed without restarting, that is done
      // whenever needed (a re-aim keeps the hoof moving, so it has no count
      // limit); the swing budget still bounds the swing.
      const unsafe=!unreachable&&reaimable(t)&&timeToReachLimit(l,t.landX,t.landZ,false,Math.max(0,remaining-dt))-Math.max(0,remaining-dt)<escape+dt;
      const moved=hyp2(h.x-l.planHipX,h.z-l.planHipZ)>.06*scale;
      if(unreachable||unsafe||remaining>REPLAN_MIN&&l.replans<REPLAN_LIMIT&&moved){
        const bump=Math.max(0,.5*lift-(t.y-soleY));
        let B=pinned.includes(l)?Math.min(remaining,budget(l)):budget(l);
        // Nor is a touchdown delayed when the support schedule would then
        // leave a stance hoof without a slot before its deadline: the hoof is
        // re-aimed within its current time instead.
        if(B>remaining+1e-9&&!delayable(l,B))B=remaining;
        reaim(l,Math.min(remaining,B),B,bump);
      }
    }

    // (A swing that completes within this frame's update frees its slot now.)
    const busy=sortSmall(r.legs.filter(l=>l.track.mode==='swing').map(l=>{const rem=l.track.swingDuration-l.track.swingElapsed;return {time:rem<=dt+1e-9?0:rem,leg:l};}),(a,b)=>a.time-b.time);
    const free=[];
    for(let k=0;k<slots;k++){const j=busy.length-slots+k;free.push(j>=0?{time:busy[j].time,leg:busy[j].leg}:{time:0});}
    // Swinging hooves join the schedule too: after touchdown each must lift
    // again by its own deadline (and cannot before), so a long swing granted
    // now cannot starve a hoof that is about to land.
    const queue=sortSmall([...due,...(moving?nextLifts(null):[])],(a,b)=>a.deadline-b.deadline);
    // Soonest a swinging hoof could touch down if asked to land early.
    const earliest=l=>sooner(l,LAND_EARLY_MIN,l.track.swingDuration-l.track.swingElapsed);
    for(const f of queue){
      if(f.deadline===Infinity&&!f.scheduled)continue;
      sortSmall(free,(a,b)=>a.time-b.time);
      // When the first free slot comes too late, take the one that can be
      // brought forward soonest: a hoof lifting now can be shortened to the
      // shortest swing; a swinging hoof can only land as early as its envelope
      // allows.
      let pick=0;
      if(moving&&Math.max(free[0].time,f.release||0)>f.deadline){
        let best=Infinity;
        free.forEach((sl,j)=>{const can=sl.entry?SWING_MIN:sl.leg&&sl.leg!==f.l?Math.min(sl.time,Math.max(LAND_EARLY_MIN,earliest(sl.leg))):sl.time;if(can<best-1e-9){best=can;pick=j;}});
      }
      const slot=free.splice(pick,1)[0];
      f.start=Math.max(slot.time,f.release||0);
      if(moving&&f.start>f.deadline){
        if(slot.entry){slot.entry.D=Math.max(SWING_MIN,Math.min(slot.entry.D,f.deadline));slot.entry.shortened=true;f.start=Math.max(slot.entry.D,f.release||0);}
        else if(slot.leg&&slot.leg!==f.l&&slot.time>LAND_EARLY_MIN){slot.leg.landBy=Math.min(slot.leg.landBy??Infinity,Math.max(LAND_EARLY_MIN,f.deadline));f.start=Math.max(slot.leg.landBy,f.release||0);}
      }
      // A hoof free to lift now is only due when even its shortest swing
      // would no longer free the slot in time for the hoof waiting on it.
      if(slot.entry){slot.entry.slack=Math.min(slot.entry.slack,f.deadline-SWING_MIN);slot.entry.needBy=Math.min(slot.entry.needBy??Infinity,f.deadline);}
      free.push({time:f.start+f.D,entry:f.start<=1e-9?f:null});
    }
    for(const l of r.legs){
      if(l.landBy===undefined)continue;
      const t=l.track,remaining=t.swingDuration-t.swingElapsed;
      if(t.mode==='swing'&&(reaimable(t)||l.replans<REPLAN_LIMIT)&&l.landBy<remaining-dt){
        // Land by then, or as soon after as the continuity envelope itself
        // allows (a hoof high in its swing needs time to come down), never
        // later than already planned.
        reaim(l,l.landBy,remaining,0,Math.max(cap,stepCapNow/dt),stepCapNow,true);
      }
      l.landBy=undefined;
    }
    // This frame's continuity envelope and each swinging hoof's step in it
    // (the continuity guard below re-times a swing whose step exceeds it).
    const frameCap=Math.max(.10,2.5*distance+.002)/dt;
    const stepNow=t=>{
      const u0=t.swingElapsed/t.swingDuration,u1=Math.min(1,(t.swingElapsed+dt)/t.swingDuration);
      const a=swingProfile(u0,t.profile),b=swingProfile(u1,t.profile),bump=u=>t.swingLift*16*u*u*(1-u)*(1-u);
      return hyp3((t.landX-t.startX)*(b-a),(t.landZ-t.startZ)*(b-a),(t.landY-t.startY)*(b-a)+bump(u1)-bump(u0));
    };
    // A hoof whose swing completes within this frame's update is support,
    // unless the continuity guard will re-time its last step.
    let stance=r.legs.filter(l=>l.track.mode==='stance'||l.track.swingDuration-l.track.swingElapsed<=dt+1e-9&&stepNow(l.track)<=.995*frameCap*dt).length;
    const landings=()=>r.legs.filter(l=>l.track.mode==='swing').map(l=>l.track.swingDuration-l.track.swingElapsed);
    // The soonest of those (Infinity if none), without building the list.
    const soonest=()=>{let m=Infinity;for(let i=0;i<r.legs.length;i++){const t=r.legs[i].track;if(t.mode==='swing'){const v=t.swingDuration-t.swingElapsed;if(v<m)m=v;}}return m;};
    // Pass 1: hooves that are due (deadline, or a later hoof depends on the
    // slot) lift now.
    for(const f of due){
      const l=f.l,t=l.track;
      // Late: past the planning deadline and about to leave true reach, with
      // no touchdown due to free a slot before then.
      const hard=moving?timeToReachLimit(l,t.x,t.z,true):0;
      const late=f.deadline<=-escape&&(!moving||hard<=escape&&!(soonest()+.04*nominal+dt<=hard));
      const must=f.deadline<=1.5*dt||f.slack<=1.5*dt;
      if(f.start>1e-9&&!(moving&&(late||must&&G.air>0)))continue;
      if(!must)continue;
      // A swing shortened so that a later hoof gets its slot lands short
      // rather than lengthening again.
      const D1=moving?Math.max(SWING_MIN,Math.min(f.D,syncSwing(f.phase),f.needBy??Infinity)):f.D;
      let p=planSwing(l,t,D1,stepLift,f.shortened||D1<f.D?D1:swingCap);
      let ok=(f.start<=1e-9||must&&G.air>0)&&stance-1>=minSupport;
      // The last stance hoof may lift only if some hoof lands within the
      // gait's airborne allowance; shorten this swing if that suffices.
      if(ok&&stance===1&&Math.min(p.D,soonest())>G.air){
        if(G.air>=SWING_MIN&&soonest()>G.air){
          p=planSwing(l,t,G.air,stepLift,G.air);
          ok=p.D<=G.air+1e-9;
        }else ok=soonest()<=G.air;
      }
      if(!ok){
        if(!(moving&&late))continue;
        // During a hand-over a late hoof may lift down to the more lenient
        // inherited gait's support floor, within that gait's airborne
        // allowance.
        const lenient=r.legs.filter(o=>o.track.mode==='swing'&&o.inherit).map(o=>o.inherit);
        const floor=Math.min(...lenient.map(g=>g.minSupport)),air=Math.max(0,...lenient.map(g=>g.air));
        if(!(stance-1>=floor&&(stance>1||soonest()<=air))){
          // A hoof the root's own travel (yaw held, as the governor holds
          // it) keeps within true reach for now waits for a slot.
          let k=0;for(;k<=HORIZON&&hyp2(t.x-hipX(l,P[k*5],cos,sin),t.z-hipZ(l,P[k*5+1],cos,sin))<=hardR;k++);
          const held=k*HORIZON_STEP;
          if(held>Math.min(escape,soonest()+dt))continue;
          // Hurried touchdown: the airborne hoof nearest to landing comes
          // straight down, within this frame's continuity envelope and at a
          // point its hip reaches (pulled toward the hip if need be), so the
          // late hoof lifts on its support; one that needs two frames does so
          // if the late hoof keeps true reach that long.
          let hurried=0;
          for(const o of sortSmall(r.legs.filter(o=>o!==l&&o.track.mode==='swing'&&reaimable(o.track)),(a,b)=>(a.track.swingDuration-a.track.swingElapsed)-(b.track.swingDuration-b.track.swingElapsed))){
            const ot=o.track,u=ot.swingElapsed/ot.swingDuration,hx=hipX(o,gx,cos,sin),hz=hipZ(o,gz,cos,sin);
            let x=ot.x,z=ot.z;const w=hyp2(x-hx,z-hz);
            if(w>planR){x=hx+(x-hx)*planR/w;z=hz+(z-hz)*planR/w;}
            for(const n of held>dt?[1,2]:[1])if(reaimStep(ot,u,x,z,n*dt,0)<=stepCapNow&&reaimSwing(ot,{x,y:soleY,z,yaw:ot.landYaw},n*dt/(1-u),0)){o.replans++;hurried=n;break;}
            if(hurried)break;
          }
          if(hurried)s.hurriedLandings=(s.hurriedLandings||0)+1;
          if(hurried===2)continue;
          if(hurried===1)stance++;
          // Last resort: a hoof already at the planning reach limit lifts below
          // the support minimum. Counted so tests can require zero.
          else s.emergencyLifts=(s.emergencyLifts||0)+1;
        }
      }
      begin(l,p);
      // A swing that reaches the leg's cycle boundary completes this cycle's
      // step; one that lands earlier leaves the scheduled lift still to come.
      l.lastSwingCycle=f.phase+p.D/period>=.999?f.cycle:f.cycle-1;
      stance--;
    }
    // Pass 2: the gait's own rhythm. A scheduled lift (most overdue first) is
    // granted only if the support schedule stays feasible without it: every
    // remaining stance hoof still gets a slot before its deadline.
    // Swinging hooves count too: after touching down at their planned
    // landing each must lift again by its own deadline (and cannot before).
    const airborneNext=nextLifts(null);
    if(moving)for(const f of sortSmall(due.filter(f=>f.scheduled&&f.l.track.mode==='stance'),(x,y)=>(y.phase-duty)-(x.phase-duty))){
      const l=f.l,t=l.track;
      if(stance-1<minSupport)break;
      const p=planSwing(l,t,syncSwing(f.phase),stepLift);
      if(hyp2(p.x-t.x,p.z-t.z)<.05*scale)continue;
      // The gait's own suspension (all hooves up) is allowed when another
      // hoof will land within the gait's airborne allowance even if a frame
      // runs over and the root stops: one frame in reserve, and a remaining
      // path that already fits the continuity floor.
      if(stance===1&&!(G.air>0&&r.legs.some(o=>{
        const q=o.track,rem=q.swingDuration-q.swingElapsed;
        return q.mode==='swing'&&rem<=G.air-s.dtHi&&(!reaimable(q)||reaimStep(q,q.swingElapsed/q.swingDuration,q.landX,q.landZ,rem,q.swingLift)<=.097);
      })))continue;
      const others=[...due.filter(o=>o!==f&&o.l.track.mode==='stance'),...airborneNext];
      if(!feasible([...landings(),p.D],others))continue;
      begin(l,p);
      l.lastSwingCycle=f.cycle;
      stance--;
    }
    // Reach guard: a swing whose remaining path (by the current forecast)
    // would leave its hip's reach is re-aimed to a closer touchdown.
    if(moving)for(const l of r.legs){
      const t=l.track;
      if(t.mode!=='swing'||t.profile!=='gait')continue;
      const u=t.swingElapsed/t.swingDuration,remaining=t.swingDuration-t.swingElapsed;
      if(remaining>dt&&!pathFits(l,t,t.landX,t.landZ,t.swingDuration,t.swingLift,u)){
        reaim(l,remaining,remaining,t.swingLift);
      }
    }
    // Continuity guard: a swing planned for a faster body can outrun this
    // frame's envelope after a stop or deceleration. Such a swing is re-timed
    // from its current pose (never shortened) so that it fits the envelope.
    // (Touchdowns that restore the support floor after this frame's lifts.)
    const restoring=sortSmall(r.legs.filter(o=>o.track.mode==='swing'),(a,b)=>(a.track.swingDuration-a.track.swingElapsed)-(b.track.swingDuration-b.track.swingElapsed))
      .slice(0,Math.max(0,floorNow-r.legs.filter(o=>o.track.mode==='stance').length));
    for(const l of r.legs){
      const t=l.track;
      if(t.mode!=='swing')continue;
      if(stepNow(t)>.995*frameCap*dt){
        // Always lengthened by the frames the remaining span needs inside the
        // envelope (an existing hard limit, exact for this frame); further,
        // to reach the hip, only as far as the (forecast) support schedule
        // stays feasible, searched frame by frame; beyond that it lands short.
        const remaining=t.swingDuration-t.swingElapsed,B=framesBelow(budget(l));
        const Dc=Math.min(B,frames(peak*hyp3(t.landX-t.x,t.landY-t.y,t.landZ-t.z)/(.97*frameCap)));
        let M=B;
        if(moving&&(restoring.includes(l)||!delayable(l,B))){
          M=Math.max(Dc,Math.min(frames(remaining),B));
          // A touchdown that restores the support floor gets only that.
          if(!restoring.includes(l))while(M<B-1e-9&&delayable(l,Math.min(B,frames(M+dt))))M=Math.min(B,frames(M+dt));
        }
        replan(l,planSwing(l,t,Math.min(remaining,M),0,M,Math.min(cap,.97*frameCap)),0);
      }
    }
    // Postcondition: every swing's remaining path, touchdown included, stays
    // inside its forecast hip's reach at every frame it will be drawn. A swing
    // that does not (a bounded search or a land-short fallback gave up, or the
    // forecast misjudged a root turning faster than it extrapolates) is
    // re-aimed without further lift inside this frame's continuity envelope:
    // shorter toward its hip at touchdown at the same time, else sooner (an
    // earlier touchdown only adds support) at or toward its landing, else
    // straight down this frame at a point this frame's hip reaches. One still
    // failing is counted; tests require zero.
    for(const l of r.legs){
      const t=l.track;
      if(t.mode!=='swing'||t.profile!=='gait')continue;
      const fits=()=>pathFits(l,t,t.landX,t.landZ,t.swingDuration,t.swingLift,t.swingElapsed/t.swingDuration,reach);
      if(fits())continue;
      const u=t.swingElapsed/t.swingDuration,rem=t.swingDuration-t.swingElapsed;
      if(rem>1e-9&&1-swingProfile(u,'gait')>=.01){
        search:for(let rr=rem;rr>dt*.5;rr=frames(rr-dt)){
          const h=hipAhead(l,Math.max(0,rr-dt));
          for(const k of rr<rem?[0,.1,.25,.5,.75,1]:[.1,.25,.5,.75,1]){
            const x=t.landX+(h.x-t.landX)*k,z=t.landZ+(h.z-t.landZ)*k;
            if(reaimStep(t,u,x,z,rr,0)<=stepCapNow&&pathFits(l,t,x,z,rr/(1-u),0,u,reach)&&reaimSwing(t,{x,y:soleY,z,yaw:t.landYaw},rr/(1-u),0)){l.replans++;break search;}
          }
          if(rr<=dt+1e-9)break;
        }
        // Last: touch down this frame, straight down (pulled toward the hip
        // if the ground there is out of its reach); this frame's hip is
        // known, not forecast.
        if(!fits()){
          const hx=hipX(l,gx,cos,sin),hz=hipZ(l,gz,cos,sin);
          let x=t.x,z=t.z;const w=hyp2(x-hx,z-hz);
          if(w>planR){x=hx+(x-hx)*planR/w;z=hz+(z-hz)*planR/w;}
          if(hyp3(x-t.x,soleY-t.y,z-t.z)<=stepCapNow&&pathFits(l,t,x,z,dt/(1-u),0,u,reach)&&reaimSwing(t,{x,y:soleY,z,yaw:t.landYaw},dt/(1-u),0))l.replans++;
        }
      }
      if(!fits())s.unverifiedSwings=(s.unverifiedSwings||0)+1;
    }
    for(const l of r.legs){
      updateHoofTrack(l.track,dt);
      l.stanceAge=l.track.mode==='stance'?l.stanceAge+dt:0;
      l.planted=l.track.mode==='stance'&&s.amount>.05;
    }
  }
  s.wasMoving=moving;

  // Torso compression eases toward .09 while moving and 0 at rest, but never
  // rises above what the current hoof targets allow (the reach floor) and
  // never exceeds the moving envelope. An unmet floor is counted, not hidden.
  const eased=(s.bodyDrop??0)+(MAX_DROP*s.amount-(s.bodyDrop??0))*(1-Math.exp(-dt*18));
  let floor=0;
  for(const l of r.legs){
    const t=l.track,d=hyp2(t.x-hipX(l,gx,cos,sin),t.z-hipZ(l,gz,cos,sin));
    floor=Math.max(floor,d>=reach?Infinity:(hipY-t.y-Math.sqrt(reach*reach-d*d))/scale);
  }
  if(floor>MAX_DROP+1e-9)s.reachViolations=(s.reachViolations||0)+1;
  s.bodyDrop=clamp(Math.max(eased,floor),0,MAX_DROP);
  r.body.position.y=HORSE.bodyY-s.bodyDrop;
  r.body.rotation.x=0;
  for(const l of r.legs){
    const t=l.track;
    l.ax=t.plantX;l.az=t.plantZ;l.ayaw=t.plantYaw;
    // The kinematic solve reads contact state but cannot move the hip root
    // or change the world-space anchor to hide a reach error.
    solveHorseLegIK(r,l,t.x,t.y,t.z,t.yaw);
  }

  const locomotion=s.amount;
  r.neck.rotation.x=Math.sin(s.phase*Math.PI*2+(gait==='canter'?.7:0))*.045*locomotion;
  r.head.rotation.x=-r.neck.rotation.x*.45;
  r.head.rotation.y=Math.sin(s.time*.55)*.085*(1-locomotion);
  for(let i=0;i<r.ears.length;i++)r.ears[i].rotation.z=Math.sin(s.time*1.3+i*2.5)*.065;
  for(let i=0;i<r.tail.length;i++)r.tail[i].rotation.z=Math.sin(s.time*1.7+i*.7)*(.10+.04*locomotion);
}
