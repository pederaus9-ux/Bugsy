import * as THREE from './lib/three.module.min.js';
import {createHoofTrack,beginHoofSwing,updateHoofTrack,resetHoofTrack,settleHoofOnStop} from './horse-stance3d.js';
import {createHorseIKScratch,solveHorseLegIK} from './horse-ik3d.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const HORSE={
  name:'horse',height:1.85,bodyY:1.03,hip:.86,upper:.40,lower:.39,hoof:.075,
  stride:1.18,lift:.09,coat:0x8a5a32,face:0x3b2415,muzzle:0xb99678,body:[.30,.30,.78],neck:[0,.16,-.57],head:[0,.23,-.49]
};

let template=null;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}], slots={legs:[],ears:[],tail:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,HORSE.bodyY,0]);
  slots.neck=bone('neck',slots.body,[0,.18,-.43]);
  slots.head=bone('head',slots.neck,[0,.30,-.28]);
  for(const side of [-1,1])slots.ears.push(bone('ear'+side,slots.head,[side*.105,.17,-.02]));
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
  for(let i=0;i<3;i++){const t=bone('tail'+i,parent,[0,i?-.15:.10,i?.08:.61]);slots.tail.push(t);parent=t;}

  const rest=defs.map((d,i)=>{const p=new THREE.Vector3(...d.p);let j=d.parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
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

  // R2: a long, nearly horizontal barrel. Continuous shoulder and haunch
  // volumes replace the stacked vertical withers ball from R1.
  oval(HORSE.coat,[0,-.01,0],[.30,.30,.78],slots.body,20,12);
  oval(HORSE.coat,[0,-.035,-.54],[.29,.285,.30],slots.body,16,10);
  oval(HORSE.coat,[0,-.01,.56],[.315,.32,.30],slots.body,16,10);
  // A shallow withers ridge flows into the back, not a round chest hump.
  oval(HORSE.coat,[0,.16,-.49],[.205,.105,.19],slots.body,14,8);

  // Neck axis rises roughly 36 degrees from the horizontal, carried forward
  // from the withers to a long skull ahead of the shoulders.
  link(HORSE.coat,[0,-.05,-.02],[0,.25,-.43],.145,slots.neck);
  oval(HORSE.coat,[0,-.025,-.105],[.14,.155,.28],slots.head,16,10);
  oval(HORSE.coat,[0,-.095,-.19],[.122,.105,.185],slots.head,12,8);
  // Forward-tapered face: wide at the bridge, narrower at the nose.
  // The cylinder's axis is rotated from +Y to -Z; its narrow end is forward.
  const forward=new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,-1));
  add(new THREE.CylinderGeometry(.093,.143,.43,12,1),HORSE.muzzle,
    [0,-.055,-.40],[1,1,1],slots.head,forward);
  oval(HORSE.muzzle,[0,-.075,-.61],[.09,.085,.08],slots.head,12,8);
  for(const side of [-1,1]){
    oval(0x1e1b18,[side*.134,.015,-.11],[.026,.030,.025],slots.head,8,6);
    oval(0x25221e,[side*.072,-.095,-.64],[.017,.014,.012],slots.head,8,6);
    const ear=slots.ears[side<0?0:1];
    add(new THREE.ConeGeometry(.045,.16,8),HORSE.coat,
      [side*.015,.065,0],[1,1,1],ear);
  }
  // Mane lies on the back of the new sloped neck. No forehead horn:
  // the R1 ivory vertical oval is removed, not disguised as a blaze.
  for(const [y,z,s] of [[-.01,.10,.08],[.07,.035,.078],[.15,-.05,.068],[.22,-.12,.06]])
    oval(HORSE.face,[0,y,z],[.08,s,.072],slots.neck,10,7);

  // Limb mass begins at the anatomical shoulder/haunch, then narrows to the
  // cannon. Leg IK and world-space hoof anchors are deliberately unchanged.
  for(const l of slots.legs){
    const fore=l.z<0;
    oval(HORSE.coat,[0,.005,0],fore?[.100,.145,.115]:[.13,.16,.135],l.hip,12,8);
    rod(HORSE.coat,[0,-HORSE.upper*.46,0],fore?.082:.065,HORSE.upper*.88,l.hip);
    oval(HORSE.coat,[0,0,0],[.065,.060,.070],l.knee,8,6);
    rod(HORSE.coat,[0,-HORSE.lower*.43,0],.038,HORSE.lower*.78,l.knee);
    oval(HORSE.coat,[0,-HORSE.lower*.82,-.008],[.050,.070,.055],l.knee,8,6);
    // Keep proven R1 skinned-sole contact geometry exactly unchanged.
    oval(HORSE.face,[0,-.0245,-.018],[.070,.04975,.105],l.foot,10,6);
  }
  // A gently fuller tuft replaces the rigid-looking wire tail.
  for(let i=0;i<slots.tail.length;i++){
    const b=slots.tail[i];
    link(HORSE.face,[0,0,0],[0,-.17,.075],i===0?.038:.055,b);
    if(i>=1)oval(HORSE.face,[0,-.16,.06],[.085,.18,.080],b,10,7);
  }

  const geometry=new THREE.BufferGeometry();
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
  r.body.position.y=HORSE.bodyY-.09;
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
