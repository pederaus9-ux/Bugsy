import * as THREE from '../../../lib/three.module.min.js';
import {updateQuadruped} from '../../../quadruped3d.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let template;
function build(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,.28,0]);slots.neck=bone('neck',slots.body,[0,.08,-.12]);slots.head=bone('head',slots.neck,[0,.06,-.04]);
  slots.wings=[bone('wing-1',slots.body,[-.12,.04,0]),bone('wing1',slots.body,[.12,.04,0])];
  slots.legs=[];
  for(const [x,phase]of [[-.05,0],[.05,.5]]){const hip=bone('hip'+x,slots.body,[x,-.08,.02]);const knee=bone('knee'+x,hip,[0,-.08,0]);const foot=bone('foot'+x,knee,[0,-.08,0]);slots.legs.push({hip,knee,foot,x,z:.02,phase});}
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
  function add(geo,col,p,scale,b,rx=0){const g=geo.toNonIndexed();geo.dispose();const o=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,0)),new THREE.Vector3(...scale)));const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}g.dispose();}
  add(new THREE.SphereGeometry(1,10,8),0xf2efe4,[0,0,0],[.12,.1,.16],slots.body);
  add(new THREE.SphereGeometry(1,10,8),0xf2efe4,[0,-.01,0],[.055,.095,.06],slots.neck);
  add(new THREE.SphereGeometry(1,10,8),0xf7f4ee,[0,0,0],[.065,.06,.07],slots.head);
  add(new THREE.ConeGeometry(.027,.075,8),0xe9ab36,[0,-.012,-.085],[1,1,1],slots.head,-Math.PI/2);
  add(new THREE.SphereGeometry(1,8,6),0xbf3435,[0,-.05,-.05],[.025,.03,.02],slots.head);
  for(let i=0;i<3;i++)add(new THREE.SphereGeometry(1,8,6),0xcd3e3b,[0,.058,-.04+i*.035],[.016,.027,.023],slots.head);
  for(const side of [-1,1]){
    add(new THREE.SphereGeometry(1,8,6),0x1e2422,[side*.059,.015,-.033],[.013,.014,.012],slots.head);
    add(new THREE.SphereGeometry(1,6,4),0xffffff,[side*.067,.02,-.038],[.004,.005,.004],slots.head);
  }
  for(let i=-1;i<=1;i++)add(new THREE.SphereGeometry(1,8,6),0xd7cec1,[i*.025,.075,.145],[.03,.095,.06],slots.body,.6+i*.15);
  for(const w of slots.wings)add(new THREE.SphereGeometry(1,8,6),0xf7f4ee,[0,-.025,0],[.025,.07,.095],w);
  for(const l of slots.legs){
    add(new THREE.SphereGeometry(1,8,6),0xf2efe4,[0,0,0],[.02,.023,.025],l.hip);
    add(new THREE.CylinderGeometry(.012,.01,.08,6),0xd8a24a,[0,-.04,0],[1,1,1],l.hip);
    add(new THREE.CylinderGeometry(.01,.008,.08,6),0xd8a24a,[0,-.04,0],[1,1,1],l.knee);
    for(let toe=-1;toe<=1;toe++)add(new THREE.SphereGeometry(1,6,4),0xd8a24a,[toe*.014,-.018,-.023],[.007,.022,.033],l.foot);
    add(new THREE.SphereGeometry(1,6,4),0xd8a24a,[0,-.018,.01],[.01,.022,.025],l.foot);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88})};
}
export function createChicken3D(height=.35,x=0,z=0){
  template ||= build();const t=template,bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/.52);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot],planted:false}));
  for(const l of legs)l.hip.rotation.order='YXZ';
  const rig={g,model,card,body:bones[t.slots.body],neck:bones[t.slots.neck],head:bones[t.slots.head],wings:t.slots.wings.map(i=>bones[i]),ears:[],tail:[],legs,spec:{bodyY:.28,hip:.2,upper:.08,lower:.08,hoof:.04,stride:.28,lift:.025},state:{phase:0,amount:0,time:0},q:new THREE.Quaternion(),disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};updateChicken3D(rig,0,0,1/60);return rig;
}
// Chicken-specific recovery; the shared walking solver and geometry stay unchanged.
export function updateChicken3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const distance=Math.hypot(dx,dz),s=r.state,scale=r.model.scale.x,c=r.spec;
  const previous=r.chickenStanceCache||=r.legs.map(()=>({}));
  for(let i=0;i<r.legs.length;i++){const l=r.legs[i],p=previous[i];p.planted=l.planted;p.x=l.ax;p.z=l.az;p.yaw=l.ayaw;}
  const lifts=r.chickenLiftCache||=r.legs.map(()=>({active:false}));
  if(distance>1.5){for(const p of lifts){p.active=false;p.hold=false;}if(r.chickenStartCache)r.chickenStartCache.active=false;}
  if(distance>0&&distance<=1.5&&r.chickenStartCache?.active&&!s.chickenStop){
    const start=r.chickenStartCache;start.active=false;
    // Neutral feet are halfway through a stance, not at its forward extreme.
    s.phase=(mode==='run'?.45:.55)/2;s.chickenStop=start;
    const ground=r.g.position.y+c.hoof*scale;
    for(let i=0;i<r.legs.length;i++){const l=r.legs[i],p=start.legs[i];l.planted=p.y-ground<1e-8;l.ax=p.x;l.az=p.z;l.ayaw=p.yaw;}
  }
  if(distance>0){
    if(distance>1.5){s.chickenStop=null;s.chickenResume=null;}
    else{
      if(s.chickenStop){
        r.g.updateMatrixWorld(true);
        const resume=r.chickenResumeCache||={elapsed:0,point:new THREE.Vector3(),legs:r.legs.map(()=>({}))};
        resume.elapsed=0;
        const cycle=c.stride*(mode==='run'?1.35:1)*scale/Math.max(distance/dt,.52*scale*.65);
        resume.duration=Math.min(.15,cycle*(mode==='run'?.55:.45));
        for(let i=0;i<r.legs.length;i++){
          const p=r.legs[i].foot.getWorldPosition(resume.point),target=resume.legs[i];
          // Caller already advanced the root; recover the preceding world pose.
          target.x=p.x-dx;target.y=p.y;target.z=p.z-dz;
        }
        s.chickenResume=resume;
      }
      s.chickenStop=null;s.lastChickenSpeed=distance/dt;s.lastChickenMode=mode;
    }
  }else if(s.amount>0&&!s.chickenStop){
    // Retain actual world contacts instead of snapping all feet to neutral.
    r.g.updateMatrixWorld(true);
    const ground=r.g.position.y+c.hoof*scale;
    const cycle=c.stride*(s.lastChickenMode==='run'?1.35:1)*scale/Math.max(s.lastChickenSpeed||0,.52*scale*.65);
    const stop=r.chickenStopCache||={elapsed:0,point:new THREE.Vector3(),legs:r.legs.map(()=>({}))};
    stop.elapsed=0;
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i],p=l.foot.getWorldPosition(stop.point),target=stop.legs[i];
      target.x=p.x;target.z=p.z;target.y=Math.max(ground,p.y);
      target.duration=Math.max(dt,(1-(s.phase+l.phase)%1)*cycle);target.yaw=l.planted?l.ayaw:r.model.rotation.y;
    }
    s.chickenStop=stop;s.chickenResume=null;for(const p of lifts){p.active=false;p.hold=false;}
  }
  updateQuadruped(r,dx,dz,dt,mode);
  r.head.rotation.x=Math.sin(r.state.amount>.1?r.state.phase*12:r.state.time*1.5)*.06;
  if(s.chickenStop){
    const stop=s.chickenStop;stop.elapsed+=dt;
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i],target=stop.legs[i],u=Math.min(1,stop.elapsed/target.duration),blend=smooth(u);
      const ground=r.g.position.y+c.hoof*scale,y=target.y+(ground-target.y)*blend;
      poseChickenWorldTarget(r,l,target.x,y,target.z,target.yaw);
      l.planted=y-ground<1e-8;l.ax=target.x;l.az=target.z;l.ayaw=target.yaw;
    }
  }else if(s.chickenResume){
    const resume=s.chickenResume;resume.elapsed+=dt;
    const u=Math.min(1,resume.elapsed/resume.duration);
    if(u===1)s.chickenResume=null;
    else{
    const blend=smooth(u);r.g.updateMatrixWorld(true);
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i];if(l.planted)continue; // Established contacts remain fixed.
      const from=resume.legs[i],to=l.foot.getWorldPosition(resume.point);
      poseChickenWorldTarget(r,l,from.x+(to.x-from.x)*blend,from.y+(to.y-from.y)*blend,from.z+(to.z-from.z)*blend,r.model.rotation.y);
    }
    }
  }
  if(distance>0&&distance<=1.5){
    const duty=mode==='run'?.45:.55,cycle=c.stride*(mode==='run'?1.35:1)*scale/(distance/dt),goalYaw=Math.atan2(-dx,-dz);
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i],old=previous[i],p=lifts[i],phase=(s.phase+l.phase)%1;
      if(!p.active&&old.planted&&!l.planted&&phase<duty){
        p.active=true;p.hold=false;p.elapsed=0;p.duration=cycle*(1-duty);p.x=old.x;p.z=old.z;p.fromYaw=old.yaw;
        p.toX=r.g.position.x+dx/dt*p.duration+(l.x*Math.cos(goalYaw)+l.z*Math.sin(goalYaw))*scale;
        p.toZ=r.g.position.z+dz/dt*p.duration+(l.z*Math.cos(goalYaw)-l.x*Math.sin(goalYaw))*scale;
      }
      if(!p.active)continue;
      // Running may have flight. A walking takeoff waits for the opposite foot.
      if(mode==='run'||p.elapsed>0||r.legs[1-i].planted)p.elapsed+=dt;
      const u=Math.min(1,p.elapsed/p.duration),w=u*u*(3-2*u),ground=r.g.position.y+c.hoof*scale;
      const x=p.x+(p.toX-p.x)*w,z=p.z+(p.toZ-p.z)*w,y=ground+c.lift*scale*16*u*u*(1-u)*(1-u);
      const angle=p.fromYaw+Math.atan2(Math.sin(goalYaw-p.fromYaw),Math.cos(goalYaw-p.fromYaw))*w;
      p.targetX=x;p.targetY=y;p.targetZ=z;
      poseChickenWorldTarget(r,l,x,y,z,angle);
      l.planted=u===0||u===1;l.ax=x;l.az=z;l.ayaw=angle;if(u===1)p.active=false;
    }
  }else if(distance===0&&!s.chickenStop&&!r.chickenStartCache?.active){
    r.g.updateMatrixWorld(true);
    const start=r.chickenStartCache||={active:false,point:new THREE.Vector3(),legs:r.legs.map(()=>({}))};
    for(let i=0;i<r.legs.length;i++){const f=r.legs[i].foot.getWorldPosition(start.point),p=start.legs[i];p.x=f.x;p.y=f.y;p.z=f.z;p.yaw=r.model.rotation.y;}
    start.active=true;
  }
}
const smooth=u=>u*u*u*(10+u*(-15+6*u));
function poseChickenWorldTarget(r,l,x,yWorld,z,footYaw){
  const scale=r.model.scale.x,c=r.spec,yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw);
  const ground=r.g.position.y+c.hoof*scale,lift=(yWorld-ground)/scale;
  const wx=(x-r.g.position.x)/scale,wz=(z-r.g.position.z)/scale,tx=wx*cos-wz*sin-l.x,tz=wx*sin+wz*cos-l.z;
  // Identical adaptive root height, reach margin and joint solve to shared gait.
  const rootY=Math.min(c.hip,c.hoof+lift+Math.sqrt(Math.max(0,(c.upper+c.lower-.001)**2-tx*tx-tz*tz)));
  l.hip.position.y=rootY-c.bodyY;
  const y=rootY-c.hoof-lift,dist=Math.min(c.upper+c.lower-.001,Math.hypot(tx,tz,y));
  let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
  const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi),alpha=Math.atan2(horizontal,y);
  const delta=Math.acos(clamp((c.upper*c.upper+dist*dist-c.lower*c.lower)/(2*c.upper*dist),-1,1));
  const bend=Math.acos(clamp((dist*dist-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
  l.hip.rotation.set(alpha-(l.z<0?1:-1)*delta,phi,0);l.knee.rotation.x=(l.z<0?1:-1)*bend;
  l.foot.quaternion.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert();
  l.foot.quaternion.multiply(r.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,footYaw-yaw));
}
