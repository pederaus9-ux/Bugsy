import * as THREE from './lib/three.module.min.js';
let template;
function build(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,.28,0]);slots.neck=bone('neck',slots.body,[0,.08,-.12]);slots.head=bone('head',slots.neck,[0,.06,-.04]);
  slots.wings=[bone('wing-1',slots.body,[-.12,.04,0]),bone('wing1',slots.body,[.12,.04,0])];
  slots.legs=[];
  for(const [x,phase]of [[-.05,0],[.05,.5]]){const hip=bone('hip'+x,slots.body,[x,-.08,.02]);const foot=bone('foot'+x,hip,[0,-.16,0]);slots.legs.push({hip,foot,x,phase});}
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
  function add(geo,col,p,scale,b){const g=geo.toNonIndexed();const o=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),new THREE.Quaternion(),new THREE.Vector3(...scale)));const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}g.dispose();}
  add(new THREE.SphereGeometry(1,10,8),0xf2efe4,[0,0,0],[.12,.1,.16],slots.body);
  add(new THREE.SphereGeometry(1,8,6),0xd8a24a,[0,0,0],[.05,.05,.06],slots.head);
  for(const w of slots.wings)add(new THREE.SphereGeometry(1,6,4),0xf7f4ee,[0,0,0],[.08,.02,.05],w);
  for(const l of slots.legs)add(new THREE.CylinderGeometry(.012,.01,.16,6),0xd8a24a,[0,-.08,0],[1,1,1],l.hip);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88})};
}
export function createChicken3D(height=.35,x=0,z=0){
  template ||= build();const t=template,bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/.35);
  const rig={g,model,card,body:bones[t.slots.body],head:bones[t.slots.head],wings:t.slots.wings.map(i=>bones[i]),legs:t.slots.legs.map(l=>({...l,hip:bones[l.hip],foot:bones[l.foot]})),state:{phase:0,amount:0},disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};updateChicken3D(rig,0,0,1/60);return rig;
}
export function updateChicken3D(r,dx,dz,dt){
  if(!(dt>0))return;const s=r.state,distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;s.amount=Math.min(1,speed/.03);s.phase=(s.phase+(distance>1.5?0:distance)/.28)%1;
  r.head.rotation.x=s.amount<.1?Math.sin(s.phase*12)*.25:0;
  for(const l of r.legs){const phase=(s.phase+l.phase)%1;l.hip.rotation.x=Math.sin(phase*6.28)*s.amount*.4;if(!Number.isFinite(l.hip.rotation.x))throw new Error('chicken joint');}
}
