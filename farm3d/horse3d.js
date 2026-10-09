import * as THREE from './lib/three.module.min.js';
import {createHoofTrack,beginHoofSwing,updateHoofTrack,resetHoofTrack,settleHoofOnStop} from './horse-stance3d.js';
import {createHorseIKScratch,solveHorseLegIK} from './horse-ik3d.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const HORSE={
  name:'horse',height:1.85,bodyY:1.03,hip:.86,upper:.40,lower:.39,hoof:.075,
  stride:1.18,lift:.09,coat:0x8a5a32,face:0x3b2415,muzzle:0xc7b49a,body:[.30,.30,.78],neck:[0,.16,-.57],head:[0,.23,-.49]
};

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
  // Ear bases seat into the skull surface; ear height is unchanged.
  for(const side of [-1,1])slots.ears.push(bone('ear'+side,slots.head,[side*.055,.02,-.02]));
  // Shoulder attachment is forward under the withers, not under the barrel.
  // The R1 IK keeps hip origins fixed and will solve these new rest offsets.
  const feet=[[-.17,-.66,0],[.17,-.66,.5],[-.16,.82,.5],[.16,.82,0]];
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
  const trunk=loft([
    [1.05,-.03,.08,.13],[.82,-.02,.25,.25],[.55,-.05,.28,.27],
    [.25,-.07,.27,.27],[0,-.08,.26,.26],[-.28,-.04,.27,.27],
    [-.48,.02,.24,.27],[-.77,.08,.21,.25],[-.80,.2,.16,.21],
    [-.96,.32,.12,.16],[-1.08,.42,.09,.12],[-1.16,.46,.065,.085]
  ],HORSE.coat,slots.body,i=>{
    const z=pos[i*3+2],t=clamp((-z-.7)/.4,0,1);
    skin[i*4]=t>=.5?slots.neck:slots.body;skin[i*4+1]=t>=.5?slots.body:slots.neck;
    weight[i*4]=Math.max(t,1-t);weight[i*4+1]=Math.min(t,1-t);
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
  // Poll, deep cheek and jaw, then a short muzzle. The pale mark is only the
  // nose tip. A long constant taper is what read as an anteater.
  part('head',()=>loft([
    [.08,.04,.05,.06],[0,.02,.11,.12],[-.08,0,.15,.16],
    [-.16,-.06,.145,.18],[-.26,-.14,.11,.14],
    [-.42,-.19,.042,.018],[-.66,-.22,.034,.012]
  ],HORSE.coat,slots.head,i=>{
    if(pos[i*3+2]-rest[slots.head].z<-.36){
      const c=new THREE.Color(HORSE.muzzle);color[i*3]=c.r;color[i*3+1]=c.g;color[i*3+2]=c.b;
    }
  }));
  for(const side of [-1,1]){
    oval(0x1e1b18,[side*.09,.01,-.1],[.026,.030,.025],slots.head,8,6);
    oval(0x25221e,[side*.03,-.11,-.47],[.014,.01,.01],slots.head,8,6);
    const ear=slots.ears[side<0?0:1];
    add(new THREE.ConeGeometry(.045,.16,8),HORSE.coat,
      [0,.02,0],[1,1,1],ear);
  }
  // Mane lies on the back of the new sloped neck. No forehead horn:
  // the R1 ivory vertical oval is removed, not disguised as a blaze.
  loft([[.13,.12,.028,.055],[.02,.20,.033,.055],
    [-.12,.27,.03,.05],[-.27,.325,.025,.045],
    [-.42,.365,.018,.04]],HORSE.face,slots.neck);

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
