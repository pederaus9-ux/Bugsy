import * as THREE from './lib/three.module.min.js';
import {updateQuadruped} from './quadruped3d.js';
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
export function updateChicken3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  updateQuadruped(r,dx,dz,dt,mode);
  r.head.rotation.x=Math.sin(r.state.amount>.1?r.state.phase*12:r.state.time*1.5)*.06;
}
