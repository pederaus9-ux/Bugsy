import * as THREE from './lib/three.module.min.js';
import {createHoofTrack,beginHoofSwing,updateHoofTrack,resetHoofTrack,settleHoofOnStop} from './horse-stance3d.js';
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
    part('leg'+slots.legs.indexOf(l),()=>loft([
      [.09,0,fore?.085:.105,fore?.09:.105],[-.10,0,.072,.075],
      [-.25,0,.05,.052],[-HORSE.upper,0,.034,.034],
      [-.53,0,.038,.038],[-.66,-.005,.032,.032],
      [-.74,-.008,.030,.030],[-.79,-.012,.029,.029]
    ],HORSE.coat,l.hip,i=>{
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
  // Six bones carry one long hanging tapered tail, with no tuft spheres.
  part('tail',()=>loft([
    [.04,.76,.04,.04],[-.12,.775,.052,.05],[-.27,.79,.047,.045],
    [-.42,.805,.042,.04],[-.57,.82,.036,.035],[-.72,.835,.029,.028],
    [-.87,.85,.014,.014],[-.93,.855,.002,.002]
  ],HORSE.face,slots.body,i=>{
    const y=pos[i*3+1]-rest[slots.body].y;
    const segment=clamp((.10-y)/.145,0,5),lo=Math.floor(segment),hi=Math.min(lo+1,5),t=segment-lo;
    skin[i*4]=slots.tail[lo];skin[i*4+1]=slots.tail[hi];weight[i*4]=1-t;weight[i*4+1]=t;
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

export function updateHorse3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const s=r.state,previousGait=s.gait,distance=Math.hypot(dx,dz),teleport=distance>1.5;
  const speed=teleport?0:distance/dt,scale=r.model.scale.x;
  s.time+=dt;
  s.amount=mode==='idle'||teleport?0:clamp(speed/.04,0,1);

  // Hysteresis prevents 60-Hz gait chatter around the 1.25 m/s boundary.
  let gait=mode==='idle'?'idle':mode==='run'
    ?(s.gait==='canter'?(speed>=1.10?'canter':'trot'):(speed>=1.35?'canter':'trot'))
    :'walk';
  if(teleport)gait='idle';
  s.gait=gait;
  const stride=HORSE.stride*(gait==='trot'?1.12:gait==='canter'?1.38:1);
  const duty=gait==='canter'?.40:gait==='trot'?.48:.62;
  const phaseStep=teleport?0:distance/scale/stride;
  s.phase=(s.phase+phaseStep)%1;
  s.totalPhase=(s.totalPhase||0)+phaseStep;

  if(speed>.02){
    const targetYaw=Math.atan2(-dx,-dz),delta=targetYaw-r.model.rotation.y;
    r.model.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-dt*10));
  }
  // Fixed hip roots: the caller has already translated r.g by dx/dz.
  // World-space planted hooves naturally articulate the leg under the torso.
  // Stand taller at rest, retaining the proven moving reach envelope.
  // Smooth torso compression instead of nudging individual hip roots.
  const targetDrop=.09*s.amount;
  s.bodyDrop=(s.bodyDrop??0)+(targetDrop-(s.bodyDrop??0))*(1-Math.exp(-dt*18));
  r.body.position.y=HORSE.bodyY-s.bodyDrop;
  r.body.rotation.x=0;
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw);
  const soleY=r.g.position.y+(.07425*scale)+.0005;
  const offsets=gait==='trot'?[0,.5,.5,0]:gait==='canter'?[.5,.75,.75,0]:gait==='walk'?[.75,.25,0,.5]:[0,0,0,0];

  for(let i=0;i<r.legs.length;i++){
    const l=r.legs[i];
    // World-space nominal hoof point (XZ). The state machine records actual
    // stance anchors; a gait switch never changes an existing world-space pose.
    const defaultX=r.g.position.x+(l.x*cos+l.z*sin)*scale;
    const defaultZ=r.g.position.z+(l.z*cos-l.x*sin)*scale;
    if(!l.track){
      l.track=createHoofTrack(defaultX,soleY,defaultZ,yaw);
      l.lastSwingCycle=-1;
    }
    const t=l.track;
    // A stop must not finish an old high-speed stride toward a now-stale
    // landing target. Land vertically from the current WORLD pose instead.
    if(gait==='idle'&&previousGait!=='idle'&&t.mode==='swing'&&!teleport){
      settleHoofOnStop(t,soleY);
    }
    if(teleport){
      resetHoofTrack(t,defaultX,soleY,defaultZ,yaw);
      l.planted=false;
    }else{
      const phase=(s.phase+offsets[i])%1;
      const legCycle=Math.floor(s.totalPhase+offsets[i]);
      const stanceDX=t.x-defaultX,stanceDZ=t.z-defaultZ;
      const dist=Math.hypot(stanceDX,stanceDZ);
      // Early step rather than sliding a planted hoof if a turn exhausts reach.
      const overreach=t.mode==='stance'&&dist>.26*scale;
      const scheduled=s.amount>.05&&phase>=duty&&legCycle!==l.lastSwingCycle;
      if(t.mode==='stance'&&s.amount>.05&&(scheduled||overreach)){
        const speedSafe=Math.max(speed,.20),period=stride*scale/speedSafe;
        const swingDuration=clamp(period*(1-duty),.09,.32);
        // Predict where the torso will be at touchdown; the swing starts
        // at the EXACT current foot target, not a new gait-relative position.
        const futureX=r.g.position.x+(dx/dt)*swingDuration;
        const futureZ=r.g.position.z+(dz/dt)*swingDuration;
        // Keep the quintic foot trajectory inside a plausible swing-speed envelope.
        // An instantaneous 90-degree turn must not demand a multi-metre hoof dash.
        // A world-space hoof must advance faster than the moving body during
        // swing or it lands behind the torso and immediately starts another
        // step. Limit peak swing travel to 2.4x body speed, below the existing
        // 2.5x per-frame continuity envelope, while restoring real stance time.
        const maxFootSpeed=Math.max(2.75,2.4*speed);
        beginHoofSwing(t,{
          x:futureX+(l.x*cos+l.z*sin)*scale,
          y:soleY,
          z:futureZ+(l.z*cos-l.x*sin)*scale,
          yaw
        },swingDuration,HORSE.lift*scale,maxFootSpeed);
        l.lastSwingCycle=legCycle;
      }
      updateHoofTrack(t,dt);
      l.planted=t.mode==='stance'&&s.amount>.05;
    }
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
