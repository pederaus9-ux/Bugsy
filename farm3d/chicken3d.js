import * as THREE from './lib/three.module.min.js';
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
// One controller owns both contacts. Body height is shared: hip attachments never
// move independently to conceal an unreachable foot target.
function chickenController(r){
  return r.chickenController||={initialized:false,next:0,bodyDrop:.001,point:new THREE.Vector3(),
    feet:r.legs.map(()=>({state:'stance',x:0,y:0,z:0,yaw:0,fromX:0,fromY:0,fromZ:0,elapsed:0,duration:0,targetX:0,targetY:0,targetZ:0}))};
}
export function updateChicken3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const distance=Math.hypot(dx,dz);
  // The real frame loop caps dt at0.1s. Interpolate the already-completed caller
  // movement for planning only; never rewind/move the public gameplay root.
  const count=distance>1.5?1:Math.ceil(dt*30),sx=dx/count,sz=dz/count;
  const startX=r.g.position.x-dx,startZ=r.g.position.z-dz;
  for(let i=1;i<=count;i++)stepChickenController(r,sx,sz,dt/count,mode,
    count===1?r.g.position.x:startX+sx*i,count===1?r.g.position.z:startZ+sz*i,i===count);
}
function stepChickenController(r,dx,dz,dt,mode,rootX,rootZ,pose){
  const s=r.state,c=r.spec,scale=r.model.scale.x,p=chickenController(r);
  const distance=Math.hypot(dx,dz),teleport=distance>1.5,moving=distance>0&&!teleport;
  const speed=moving?distance/dt:0;
  if(!p.initialized||teleport){
    // Factory/reset poses use the original neutral sole height and hip positions.
    r.body.position.y=c.bodyY-.001;
    for(const l of r.legs){l.hip.position.y=c.hip-c.bodyY;l.hip.rotation.set(0,0,0);l.knee.rotation.x=0;l.foot.quaternion.identity();}
    r.g.updateMatrixWorld(true);
    for(let i=0;i<2;i++){
      const f=p.feet[i],l=r.legs[i],v=l.foot.getWorldPosition(p.point);
      f.x=v.x-(moving?dx:0);f.z=v.z-(moving?dz:0);f.y=r.g.position.y+c.hoof*scale;f.yaw=r.model.rotation.y;f.state='stance';f.elapsed=0;
      l.planted=false;l.ax=f.x;l.az=f.z;l.ayaw=f.yaw;
    }
    p.initialized=true;p.next=0;s.chickenStop=null;s.chickenResume=null;s.lastChickenMoving=false;s.everChickenMoved=false;
  }
  s.amount=mode==='idle'?0:clamp(speed/.04,0,1);
  s.phase=(s.phase+(moving?distance:0)/scale/(c.stride*(mode==='run'?1.35:1)))%1;s.time+=dt;
  let desired=r.model.rotation.y;
  if(speed>.02){desired=Math.atan2(-dx,-dz);const delta=desired-r.model.rotation.y;r.model.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-dt*12));}
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw),ground=r.g.position.y+c.hoof*scale;
  if(!moving){
    if(s.lastChickenMoving){
      const stop=r.chickenStopCache||={elapsed:0,legs:r.legs.map(()=>({}))};stop.elapsed=0;s.chickenStop=stop;s.chickenResume=null;
      for(let i=0;i<2;i++){const f=p.feet[i],t=stop.legs[i];t.x=f.x;t.z=f.z;t.y=f.y;t.duration=Math.max(dt,f.duration-f.elapsed);t.yaw=f.yaw;}
    }
    if(s.chickenStop){const stop=s.chickenStop;stop.elapsed+=dt;for(let i=0;i<2;i++){const f=p.feet[i],t=stop.legs[i];f.x=t.x;f.z=t.z;f.y=t.y+(ground-t.y)*smooth(Math.min(1,stop.elapsed/t.duration));f.state=f.y-ground<1e-8?'stance':'settle';}}
  }else{
    if(s.chickenStop){const resume=r.chickenResumeCache||={elapsed:0,legs:[]};resume.elapsed=0;resume.duration=.15;s.chickenResume=resume;s.chickenStop=null;}
    if(s.chickenResume){s.chickenResume.elapsed+=dt;if(s.chickenResume.elapsed>=s.chickenResume.duration)s.chickenResume=null;}
    // Finish the active swing before handing support to the opposite foot.
    for(let i=0;i<2;i++){
      const f=p.feet[i];if(f.state==='settle'){f.state='swing';f.fromX=f.x;f.fromY=f.y;f.fromZ=f.z;f.elapsed=-dt;f.duration=Math.max(dt,.085*scale/speed);}
      if(f.state!=='swing')continue;
      const other=p.feet[1-i],l=r.legs[i],o=r.legs[1-i];
      const ox=rootX+(o.x*cos+o.z*sin)*scale,oz=rootZ+(o.z*cos-o.x*sin)*scale;
      const supportReach=Math.hypot(other.x-ox,other.z-oz)/scale;
      // New input can invalidate the original forecast. Shorten the remaining
      // handover before the supporting foot leaves reach; never discard it.
      const supportTime=Math.max(dt,(.12-supportReach)*scale/speed);
      f.duration=Math.min(f.duration,f.elapsed+supportTime);
      f.elapsed+=dt;const u=Math.min(1,f.elapsed/f.duration),blend=u*u*(3-2*u);
      const remaining=Math.max(0,f.duration-f.elapsed),futureYaw=desired+Math.atan2(Math.sin(yaw-desired),Math.cos(yaw-desired))*Math.exp(-12*remaining);
      const fc=Math.cos(futureYaw),fs=Math.sin(futureYaw),lead=.055*scale;
      let x=rootX+dx/dt*remaining+(l.x*fc+l.z*fs)*scale+dx/distance*lead;
      let z=rootZ+dz/dt*remaining+(l.z*fc-l.x*fs)*scale+dz/distance*lead;
      const hx=rootX+(l.x*cos+l.z*sin)*scale,hz=rootZ+(l.z*cos-l.x*sin)*scale;
      // Reach the moving landing point continuously, and validate the actual
      // interpolated path in the current frame rather than sampled guesses.
      x=f.fromX+(x-f.fromX)*blend;z=f.fromZ+(z-f.fromZ)*blend;
      const radius=.135*scale,len=Math.hypot(x-hx,z-hz);if(len>radius){x=hx+(x-hx)*radius/len;z=hz+(z-hz)*radius/len;}
      f.x=x;f.z=z;f.y=ground+(f.fromY-ground)*(1-blend)+c.lift*scale*16*u*u*(1-u)*(1-u);f.yaw=yaw;
      if(u===1){f.state='stance';f.y=ground;p.next=1-i;}
    }
    if(p.feet[0].state==='stance'&&p.feet[1].state==='stance'){
      // A grounded contact is released only after the opposite foot has landed.
      let i=p.next,max=0;
      for(let j=0;j<2;j++){const l=r.legs[j],hx=rootX+(l.x*cos+l.z*sin)*scale,hz=rootZ+(l.z*cos-l.x*sin)*scale,d=Math.hypot(p.feet[j].x-hx,p.feet[j].z-hz)/scale;if(d>max){max=d;i=j;}}
      if(max>.035){const f=p.feet[i];f.state='swing';f.fromX=f.x;f.fromY=f.y;f.fromZ=f.z;f.elapsed=0;f.duration=Math.max(dt,.085*scale/speed);}
    }
    // A new handover can be requested on the same frame the opposite foot
    // lands. Validate its takeoff too, especially after a speed increase.
    for(let i=0;i<2;i++){
      const f=p.feet[i];if(f.state!=='swing')continue;
      const l=r.legs[i],hx=rootX+(l.x*cos+l.z*sin)*scale,hz=rootZ+(l.z*cos-l.x*sin)*scale;
      const radius=.135*scale,len=Math.hypot(f.x-hx,f.z-hz);
      if(len>radius){f.x=hx+(f.x-hx)*radius/len;f.z=hz+(f.z-hz)*radius/len;f.y=Math.max(f.y,ground+c.lift*scale*Math.min(1,dt/f.duration));}
    }
  }
  s.lastChickenMoving=moving;if(moving)s.everChickenMoved=true;
  // Solve both feet with a common body height, preserving body/thigh attachment.
  let rootY=c.hip-.001;
  for(let i=0;i<2;i++){
    const f=p.feet[i],l=r.legs[i],wx=(f.x-rootX)/scale,wz=(f.z-rootZ)/scale;
    const tx=wx*cos-wz*sin-l.x,tz=wx*sin+wz*cos-l.z;
    rootY=Math.min(rootY,c.hoof+(f.y-ground)/scale+Math.sqrt(Math.max(0,(c.upper+c.lower-.001)**2-tx*tx-tz*tz)));
  }
  p.bodyDrop=c.hip-rootY;
  if(!pose)return;
  r.body.position.y=s.everChickenMoved?c.bodyY-p.bodyDrop:c.bodyY;
  for(let i=0;i<2;i++){
    const f=p.feet[i],l=r.legs[i];poseChickenWorldTarget(r,l,f.x,f.y,f.z,f.yaw,rootY);
    l.planted=!teleport&&f.state==='stance';l.ax=f.x;l.az=f.z;l.ayaw=f.yaw;
    f.targetX=f.x;f.targetY=f.y;f.targetZ=f.z;
  }
  r.neck.rotation.x=Math.sin(s.phase*6.28)*.04*s.amount;
  r.head.rotation.y=Math.sin(s.time*.65)*.10*(1-s.amount);
  r.head.rotation.x=Math.sin(s.amount>.1?s.phase*12:s.time*1.5)*.06;
}
const smooth=u=>u*u*u*(10+u*(-15+6*u));
function poseChickenWorldTarget(r,l,x,yWorld,z,footYaw,rootY){
  const scale=r.model.scale.x,c=r.spec,yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw);
  const ground=r.g.position.y+c.hoof*scale,lift=(yWorld-ground)/scale;
  const wx=(x-r.g.position.x)/scale,wz=(z-r.g.position.z)/scale,tx=wx*cos-wz*sin-l.x,tz=wx*sin+wz*cos-l.z;
  l.hip.position.y=rootY-r.body.position.y;
  const y=rootY-c.hoof-lift,dist=Math.min(c.upper+c.lower-.001,Math.hypot(tx,tz,y));
  let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
  const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi),alpha=Math.atan2(horizontal,y);
  const delta=Math.acos(clamp((c.upper*c.upper+dist*dist-c.lower*c.lower)/(2*c.upper*dist),-1,1));
  const bend=Math.acos(clamp((dist*dist-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
  l.hip.rotation.set(alpha-(l.z<0?1:-1)*delta,phi,0);l.knee.rotation.x=(l.z<0?1:-1)*bend;
  l.foot.quaternion.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert();
  l.foot.quaternion.multiply(r.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,footYaw-yaw));
}
