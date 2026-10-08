import * as THREE from './lib/three.module.min.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const HORSE={
  name:'horse',height:1.85,bodyY:1.03,hip:.86,upper:.40,lower:.39,hoof:.075,
  stride:1.18,lift:.09,coat:0x8a5a32,face:0x3b2415,muzzle:0xb99678,body:[.31,.34,.54],neck:[0,.18,-.43],head:[0,.30,-.28]
};

let template=null;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}], slots={legs:[],ears:[],tail:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,HORSE.bodyY,0]);
  slots.neck=bone('neck',slots.body,[0,.18,-.43]);
  slots.head=bone('head',slots.neck,[0,.30,-.28]);
  for(const side of [-1,1])slots.ears.push(bone('ear'+side,slots.head,[side*.105,.17,-.02]));
  const feet=[[-.17,-.46,0],[.17,-.46,.5],[-.16,.45,.5],[.16,.45,0]];
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

  // Torso: separate rib cage, shoulder/withers and hindquarter masses produce a horse silhouette.
  oval(HORSE.coat,[0,.00,.03],[.31,.34,.54],slots.body,16,10);
  oval(HORSE.coat,[0,.04,-.42],[.30,.36,.31],slots.body,14,9);
  oval(HORSE.coat,[0,.03,.43],[.33,.35,.34],slots.body,14,9);
  oval(HORSE.coat,[0,.27,-.30],[.20,.16,.22],slots.body,12,8);

  // Sloped neck into withers; skull is long and narrow with a distinct jaw/muzzle.
  link(HORSE.coat,[0,-.01,-.05],[0,.31,-.28],.145,slots.neck);
  oval(HORSE.coat,[0,.01,-.03],[.14,.20,.30],slots.head,14,9);
  oval(HORSE.muzzle,[0,-.07,-.31],[.125,.13,.20],slots.head,12,8);
  oval(HORSE.coat,[0,-.10,-.12],[.13,.11,.18],slots.head,10,7);
  for(const side of [-1,1]){
    oval(0x1e1b18,[side*.132,.035,-.10],[.026,.035,.025],slots.head,8,6);
    oval(0x25221e,[side*.070,-.095,-.48],[.020,.014,.012],slots.head,8,6);
    const ear=slots.ears[side<0?0:1];
    add(new THREE.ConeGeometry(.045,.16,8),HORSE.coat,[side*.015,.065,0],[1,1,1],ear);
  }
  // Mane is strictly behind the skull/neck: no forward link can intersect the muzzle.
  for(const [y,z,s] of [[.02,.10,.09],[.10,.08,.085],[.18,.055,.075],[.26,.025,.065]]) oval(HORSE.face,[0,y,z],[.105,s,.075],slots.neck,10,7);
  oval(0xeadbc0,[0,.015,-.292],[.032,.13,.018],slots.head,8,6);

  // Horse-specific limb proportions: muscular upper limb -> cannon -> fetlock/pastern -> hoof.
  for(const l of slots.legs){
    oval(HORSE.coat,[0,.025,0],[.13,.15,.12],l.hip,10,7);
    rod(HORSE.coat,[0,-HORSE.upper*.48,0],.060,HORSE.upper*.90,l.hip);
    oval(HORSE.coat,[0,0,0],[.065,.060,.070],l.knee,8,6);
    rod(HORSE.coat,[0,-HORSE.lower*.43,0],.038,HORSE.lower*.78,l.knee);
    oval(HORSE.coat,[0,-HORSE.lower*.82,-.008],[.050,.070,.055],l.knee,8,6);
    oval(HORSE.face,[0,-.025,-.018],[.070,.050,.105],l.foot,10,6);
  }
  for(let i=0;i<slots.tail.length;i++){const b=slots.tail[i];link(HORSE.face,[0,0,0],[0,-.17,.075],.032,b);if(i===2)oval(HORSE.face,[0,-.18,.08],[.065,.16,.060],b,10,7);}

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
  const rig={g,model,card,body:bones[t.slots.body],neck:bones[t.slots.neck],head:bones[t.slots.head],ears:t.slots.ears.map(i=>bones[i]),tail:t.slots.tail.map(i=>bones[i]),legs,spec:HORSE,state:{phase:0,amount:0,time:0,gait:'idle'},q:new THREE.Quaternion(),disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateHorse3D(rig,0,0,1/60,'idle');return rig;
}

export function updateHorse3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const s=r.state,distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt,scale=r.model.scale.x;
  s.time+=dt;s.amount=mode==='idle'?0:clamp(speed/.04,0,1);
  const gait=mode==='run'?(speed>1.25?'canter':'trot'):(mode==='idle'?'idle':'walk');s.gait=gait;
  const stride=HORSE.stride*(gait==='trot'?1.12:gait==='canter'?1.38:1),duty=gait==='canter'?.40:gait==='trot'?.48:.62;
  s.phase=(s.phase+(distance>1.5?0:distance)/scale/stride)%1;
  if(speed>.02){const yaw=Math.atan2(-dx,-dz),d=yaw-r.model.rotation.y;r.model.rotation.y+=Math.atan2(Math.sin(d),Math.cos(d))*(1-Math.exp(-dt*10));}
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw),step=stride*duty/2;
  const offsets=gait==='trot'?[0,.5,.5,0]:gait==='canter'?[.5,.75,.75,0]:gait==='walk'?[.75,.25,0,.5]:[0,0,0,0];
  for(let i=0;i<r.legs.length;i++){
    const l=r.legs[i],phase=(s.phase+offsets[i])%1,z=phase<duty?-step+phase/duty*2*step:step*Math.cos((phase-duty)/(1-duty)*Math.PI),lift=phase<duty?0:Math.sin((phase-duty)/(1-duty)*Math.PI)*HORSE.lift*s.amount;
    if(phase<duty&&s.amount>.05){if(!l.planted){const rz=l.z+z;l.ax=r.g.position.x+(l.x*cos+rz*sin)*scale;l.az=r.g.position.z+(rz*cos-l.x*sin)*scale;l.ayaw=yaw;l.planted=true;}}else l.planted=false;
    let tx=0,tz=z*s.amount;if(l.planted){const wx=(l.ax-r.g.position.x)/scale,wz=(l.az-r.g.position.z)/scale;tx=wx*cos-wz*sin-l.x;tz=wx*sin+wz*cos-l.z;}if(s.amount<.01){l.planted=false;tx=tz=0;}
    const reach=(HORSE.upper+HORSE.lower)*.82,len=Math.hypot(tx,tz);if(len>reach){tx*=reach/len;tz*=reach/len;l.planted=false;}
    const rootY=Math.min(HORSE.hip,HORSE.hoof+lift+Math.sqrt(Math.max(0,(HORSE.upper+HORSE.lower-.001)**2-tx*tx-tz*tz)));l.hip.position.y=rootY-HORSE.bodyY;
    const y=rootY-HORSE.hoof-lift,dist=Math.min(HORSE.upper+HORSE.lower-.001,Math.hypot(tx,tz,y));let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
    const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi),alpha=Math.atan2(horizontal,y),delta=Math.acos(clamp((HORSE.upper**2+dist**2-HORSE.lower**2)/(2*HORSE.upper*dist),-1,1)),bend=Math.acos(clamp((dist**2-HORSE.upper**2-HORSE.lower**2)/(2*HORSE.upper*HORSE.lower),-1,1));
    l.hip.rotation.set(alpha-(l.z<0?1:-1)*delta,phi,0);l.knee.rotation.x=(l.z<0?1:-1)*bend;l.foot.quaternion.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert();if(l.planted)l.foot.quaternion.multiply(r.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,l.ayaw-yaw));
  }
  const locomotion=s.amount;
  r.body.rotation.x=Math.sin(s.phase*Math.PI*2)*(gait==='canter'?.035:.012)*locomotion;
  r.neck.rotation.x=Math.sin(s.phase*Math.PI*2+(gait==='canter'?.7:0))*.045*locomotion;
  r.head.rotation.x=-r.neck.rotation.x*.45;r.head.rotation.y=Math.sin(s.time*.55)*.085*(1-locomotion);
  for(let i=0;i<r.ears.length;i++)r.ears[i].rotation.z=Math.sin(s.time*1.3+i*2.5)*.065;
  for(let i=0;i<r.tail.length;i++)r.tail[i].rotation.z=Math.sin(s.time*1.7+i*.7)*(.10+.04*locomotion);
}
