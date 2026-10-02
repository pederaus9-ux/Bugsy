// Owner-requested 3D character prototype. The farm's AI/saves are kept outside this module.
import * as THREE from './lib/three.module.min.js';
const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=(dt,k)=>1-Math.exp(-dt*k), mix=(a,b,k)=>a+(b-a)*k;
const UP=new THREE.Vector3(0,1,0);
export const COW_GAIT=Object.freeze({walk:.8,run:2.6,stride:1.04,runStride:1.35,stance:.6,runStance:.45,upper:.36,lower:.37,hip:.77,hoof:.055});
let template;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={legs:[],ears:[],eyes:[],tail:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,1.03,0]);
  slots.neck=bone('neck',0,[0,1.12,-.59]);slots.head=bone('head',slots.neck,[0,.21,-.15]);
  slots.jaw=bone('jaw',slots.head,[0,-.09,-.08]);
  for(const side of [-1,1]){slots.ears.push(bone('ear'+side,slots.head,[side*.20,.15,.01]));slots.eyes.push(bone('eye'+side,slots.head,[side*.175,.065,-.153]));}
  // Hips are body children. The offset is body-local so the rest hip stays at the old root position.
  for(const [x,z,phase]of [[-.265,-.46,0],[.265,-.46,.5],[-.265,.48,.5],[.265,.48,0]]){
    const hip=bone('hip'+slots.legs.length,slots.body,[x,COW_GAIT.hip-1.03,z]);
    const knee=bone('knee'+slots.legs.length,hip,[0,-COW_GAIT.upper,0]);
    const foot=bone('hoof'+slots.legs.length,knee,[0,-COW_GAIT.lower,0]);slots.legs.push({hip,knee,foot,x,z,phase});
  }
  let parent=0;
  for(let i=0;i<3;i++){const b=bone('tail'+i,parent,i?[0,-.22,.02]:[0,1.17,.74]);slots.tail.push(b);parent=b;}
  // All colored pieces share a single skin/material/draw. Each vertex follows its part's bone.
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);if(i)p.add(restParent(i));return p;});
  function restParent(i){let p=new THREE.Vector3(),j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;}
  const pos=[],norm=[],color=[],skin=[],weight=[];
  const cream=0xf2eee1,ink=0x282b2a,pink=0xd89b91,horn=0xc8bba1;
  const white=new THREE.Color(cream),black=new THREE.Color(ink),matCol=new THREE.Color();
  function coat(x,y,z){
    // Rounded, irregular Holstein patches in object space; no image cards or texture atlas.
    const side=x>0?1:-1;
    const p1=((x-side*.30)/.22)**2+((y-1.12)/.34)**2+((z+.37)/.36)**2;
    const p2=((x-side*.26)/.27)**2+((y-1.13-side*.06)/.29)**2+((z-.40)/.32)**2;
    const p3=(x/.29)**2+((y-1.37)/.16)**2+((z-.04)/.34)**2;
    const d=Math.min(p1,p2,p3)+Math.sin(y*24+z*15)*.10+Math.sin(x*35-z*22)*.07;
    const k=clamp((1.02-d)/.16,0,1);matCol.copy(white).lerp(black,k);return matCol;
  }
  function add(geo,col,p,scale,b=0,rx=0,rz=0){
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const origin=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+origin.x,p[1]+origin.y,p[2]+origin.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=typeof col==='number'?new THREE.Color(col):null;
    for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),rgb=c||col(x,y,z);pos.push(x,y,z);norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(rgb.r,rgb.g,rgb.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}
    g.dispose();
  }
  const oval=(col,p,scale,b=0,rx=0,rz=0,detail=12)=>add(new THREE.SphereGeometry(1,detail,Math.round(detail*.65)),col,p,scale,b,rx,rz);
  const rod=(col,p,r1,r2,len,b=0,rx=0,rz=0)=>add(new THREE.CylinderGeometry(r1,r2,len,10),col,p,[1,1,1],b,rx,rz);
  oval(coat,[0,0,0],[.38,.40,.77],slots.body,0,0,32);
  oval(coat,[0,.02,-.42],[.32,.36,.34],slots.body,0,0,20);
  oval(cream,[0,-.02,-.03],[.255,.28,.26],slots.neck,-.2,0,20);
  oval(cream,[0,.025,-.015],[.215,.265,.235],slots.head,0,0,24);
  oval(ink,[-.139,.082,-.142],[.087,.142,.09],slots.head);
  oval(pink,[0,-.10,-.211],[.198,.105,.13],slots.jaw,0,0,20);
  oval(cream,[0,-.14,-.06],[.165,.075,.13],slots.jaw);
  for(const side of [-1,1]){
    oval(ink,[side*.082,-.082,-.328],[.031,.018,.012],slots.jaw);
    const ear=slots.ears[side===-1?0:1];
    oval(cream,[side*.093,.015,0],[.152,.057,.092],ear,0,side*.18);
    oval(pink,[side*.103,.02,-.059],[.095,.034,.041],ear,0,side*.18);
    add(new THREE.ConeGeometry(.043,.16,10),horn,[side*.142,.315,.008],[1,1,1],slots.head,0,-side*.18);
    const eye=slots.eyes[side===-1?0:1];
    oval(0x694b2b,[0,0,0],[.041,.045,.035],eye);
    oval(0x171c1b,[side*.006,0,-.027],[.023,.032,.016],eye);
    oval(0xffffff,[-.009,.013,-.04],[.009,.010,.006],eye,0,0,10);
    oval(cream,[side*.006,.052,.005],[.058,.027,.042],eye);
  }
  // Warm cream forelock, understated rather than a helmet-like hair cap.
  for(let i=0;i<5;i++)oval(0xe7dfc8,[(i-2)*.043,.24,-.10],[.047,.048,.054],slots.head);
  oval(pink,[0,.68,.30],[.19,.12,.23]);
  for(const x of [-.10,.10])for(const z of [.20,.39])rod(pink,[x,.55,z],.024,.013,.11);
  for(const [i,l]of slots.legs.entries()){
    // Haunch overlaps the torso bottom and the thigh top so the hip swing does not open a gap.
    oval(coat,[0,.08,0],[.16,.13,.15],l.hip,0,0,12);
    rod(cream,[0,-.16,0],.077,.052,.32,l.hip);
    oval(cream,[0,0,0],[.057,.061,.057],l.knee,0,0,12);
    rod(i<2?cream:0xdad5c7,[0,-.165,0],.045,.034,.33,l.knee);
    for(const side of [-1,1])oval(0x423d32,[side*.029,-.012,-.025],[.033,.043,.079],l.foot,0,0,12);
  }
  for(const b of slots.tail)rod(cream,[0,-.10,.01],.021,.016,.22,b);
  oval(ink,[0,-.20,.015],[.041,.084,.050],slots.tail[2],0,0,14);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.86});
  return {defs,slots,geometry,material};
}
export function createCow3D(height=1.7,x=0,z=0,seed=0){
  if (typeof seed === 'string') { let hash=7; for (const ch of seed) hash=(hash*31+ch.charCodeAt(0))>>>0; seed=(hash%997)/17; }
  template ||= buildTemplate();const t=template;
  const bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));card.castShadow=card.receiveShadow=true;
  // Conservative static bounds avoid a full vertex scan during each animation frame.
  card.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.9,0),1.7);
  card.boundingBox=new THREE.Box3(new THREE.Vector3(-.8,-.15,-1.5),new THREE.Vector3(.8,2.1,1.25));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/1.8);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot],planted:false,ax:0,az:0,ayaw:0}));
  for(const l of legs)l.hip.rotation.order='YXZ';
  const rig={g,model,card,h:height,legs,head:bones[t.slots.head],neck:bones[t.slots.neck],jaw:bones[t.slots.jaw],body:bones[t.slots.body],ears:t.slots.ears.map(i=>bones[i]),eyes:t.slots.eyes.map(i=>bones[i]),tail:t.slots.tail.map(i=>bones[i]),
    state:{phase:0,distance:0,speed:0,amount:0,run:0,time:0,seed,look:0,lookTo:0,nextLook:1.3+seed%2,hold:0,earTime:0,nextEar:1+seed%2,earSide:0,earEvent:0,blinkTime:0,nextBlink:2.3+seed%3,pet:0},q:new THREE.Quaternion(),disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateCow3D(rig,0,0,1/60,0);return rig;
}
export function poseCowLeg(leg,tx,tz,lift,rig){
  const c=COW_GAIT;
  // Body-local rest only. Cancels breath scale. The stride does not drop the hip.
  leg.hip.position.set(leg.x,(c.hip-1.03)/rig.body.scale.y,leg.z);
  leg.hip.scale.set(1/rig.body.scale.x,1/rig.body.scale.y,1/rig.body.scale.z);
  const y=c.hip-c.hoof-lift;
  const distance=Math.min(c.upper+c.lower-.001,Math.hypot(tx,tz,y));
  let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
  const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi);
  const alpha=Math.atan2(horizontal,y);
  const delta=Math.acos(clamp((c.upper*c.upper+distance*distance-c.lower*c.lower)/(2*c.upper*distance),-1,1));
  const bend=Math.acos(clamp((distance*distance-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
  const sign=leg.z<0?1:-1;
  leg.hip.rotation.set(alpha-sign*delta,phi,0);leg.knee.rotation.x=sign*bend;
  leg.foot.quaternion.copy(leg.hip.quaternion).multiply(leg.knee.quaternion).invert();
  if(leg.planted)leg.foot.quaternion.multiply(rig.q.setFromAxisAngle(UP,leg.ayaw-rig.model.rotation.y));
}
export function updateCow3D(r,dx,dz,dt,time,act='idle',hop=0){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const s=r.state,c=COW_GAIT;s.time+=dt;s.pet=Math.max(0,s.pet-dt);
  const distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;s.distance+=distance>1.5?0:distance;
  if (distance > 1.5) for (const l of r.legs) l.planted=false;
  s.speed=mix(s.speed,speed,ease(dt,10));s.run=mix(s.run,clamp((speed-1.1)/(c.run-1.1),0,1),ease(dt,6));
  s.amount=mix(s.amount,clamp(speed/.06,0,1),ease(dt,12));
  const stride=mix(c.stride,c.runStride,s.run),duty=mix(c.stance,c.runStance,s.run);
  s.phase=(s.phase+(distance>1.5?0:distance)/stride)%1;
  if(speed>.02){const yaw=Math.atan2(-dx,-dz),d=yaw-r.model.rotation.y;r.model.rotation.y+=Math.atan2(Math.sin(d),Math.cos(d))*ease(dt,14);}
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw),scale=r.model.scale.x;
  for(const l of r.legs){
    const phase=(s.phase+l.phase)%1,reach=duty*stride/2;
    let z,lift=0;
    if(phase<duty){z=-reach+phase/duty*2*reach;
      if(!l.planted&&s.amount>.05){const rz=l.z+z*s.amount;l.ax=r.g.position.x+(l.x*cos+rz*sin)*scale;l.az=r.g.position.z+(rz*cos-l.x*sin)*scale;l.ayaw=yaw;l.planted=true;}
    }else{const u=(phase-duty)/(1-duty);z=reach*Math.cos(u*Math.PI);lift=Math.sin(u*Math.PI)*mix(.075,.13,s.run)*s.amount;l.planted=false;}
    let tx=0,tz=z*s.amount;
    if(l.planted){const wx=(l.ax-r.g.position.x)/scale,wz=(l.az-r.g.position.z)/scale;tx=(wx*cos-wz*sin-l.x)*s.amount;tz=(wx*sin+wz*cos-l.z)*s.amount;}
    if(s.amount<.01){l.planted=false;tx=tz=lift=0;}
    // A very tight turn can pull a planted foot beyond its reach; release rather than stretch a leg.
    if(Math.hypot(tx,tz)>.34){const k=.34/Math.hypot(tx,tz);tx*=k;tz*=k;l.planted=false;}
    poseCowLeg(l,tx,tz,lift,r);
  }
  const sleeping=act==='sleeping'||act==='resting',quiet=sleeping?.12:1;
  s.nextLook-=dt;s.hold=Math.max(0,s.hold-dt);
  if(s.nextLook<=0){s.lookTo=Math.sin(s.seed*2.1+s.time*1.3)*.48;s.hold=1.6;s.nextLook=4.5+2*(.5+.5*Math.sin(s.time+s.seed));}
  s.look=mix(s.look,(s.pet>0?.28:s.hold>0?s.lookTo:0)*quiet*(1-s.amount*.6),ease(dt,3.5));
  r.neck.rotation.y=s.look*.65;r.head.rotation.y=s.look*.35;
  r.neck.rotation.x=mix(r.neck.rotation.x,act==='eating'?-.95: sleeping?.11:.012*Math.sin(s.phase*TAU*2)*s.amount,ease(dt,5));
  r.neck.position.y=mix(r.neck.position.y,act==='eating'?.80:1.12,ease(dt,5));
  r.head.rotation.z=mix(r.head.rotation.z,s.pet>0?.08:s.look*.06,ease(dt,5));
  r.jaw.rotation.x=act==='eating'?(.03+.025*Math.sin(s.time*4)):0;
  s.nextEar-=dt;s.earTime=Math.max(0,s.earTime-dt);
  if(s.nextEar<=0){s.earSide=++s.earEvent%2;s.earTime=.65;s.nextEar=2.5+3*(.5+.5*Math.sin(s.seed*1.7+s.time));}
  const flick=s.earTime>0?Math.sin((1-s.earTime/.65)*Math.PI)**2*.42*quiet:0;
  for(let i=0;i<2;i++){const side=i===0?-1:1;r.ears[i].rotation.z=mix(r.ears[i].rotation.z,(i===s.earSide?side*flick:-side*flick*.15),ease(dt,22));r.ears[i].rotation.y=-side*s.look*.18;}
  s.nextBlink-=dt;s.blinkTime=Math.max(0,s.blinkTime-dt);
  if(s.nextBlink<=0){s.blinkTime=.20;s.nextBlink=3+2*(.5+.5*Math.sin(s.seed+s.time));}
  const shut=s.blinkTime>0?Math.sin((1-s.blinkTime/.20)*Math.PI):0;for(const eye of r.eyes)eye.scale.y=sleeping?.18:1-shut*.90;
  for(let i=0;i<3;i++){r.tail[i].rotation.z=Math.sin(s.time*.9+s.seed-i*.5)*(.12+i*.04)*quiet;r.tail[i].rotation.x=.08+Math.sin(s.time*.7-i*.3)*.04;}
  r.body.scale.y=1+Math.sin(s.time*1.5+s.seed)*.007*quiet;
  r.body.rotation.z=Math.sin(s.phase*TAU)*.009*s.amount;
  r.model.position.y=hop>0?Math.sin((1-hop)*Math.PI)*r.h*.18:0;
}
