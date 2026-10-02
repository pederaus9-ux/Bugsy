import * as THREE from './lib/three.module.min.js';
let template;
function build(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}];
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  const slots={body:bone('body',0,[0,1.05,0]),neck:bone('neck',0,[0,1.45,0]),head:bone('head',1,[0,.18,0])};
  slots.arms=[bone('arm-1',slots.body,[-.22,.12,0]),bone('arm1',slots.body,[.22,.12,0])];
  slots.legs=[bone('leg-1',slots.body,[-.1,-.42,0]),bone('leg1',slots.body,[.1,-.42,0])];
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
  function add(geo,col,p,scale,b){const g=geo.toNonIndexed();const o=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),new THREE.Quaternion(),new THREE.Vector3(...scale)));const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}g.dispose();}
  add(new THREE.SphereGeometry(1,10,8),0x4d7c4a,[0,0,0],[.22,.28,.12],slots.body);
  add(new THREE.SphereGeometry(1,8,6),0xd7b08a,[0,0,0],[.1,.12,.1],slots.head);
  for(const a of slots.arms)add(new THREE.CylinderGeometry(.04,.035,.32,6),0xd7b08a,[0,-.16,0],[1,1,1],a);
  for(const l of slots.legs)add(new THREE.CylinderGeometry(.05,.04,.42,6),0x3d4c38,[0,-.2,0],[1,1,1],l);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.86})};
}
export function createFarmer3D(options={}){
  template ||= build();const t=template,bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
  if(options.tint)card.material=t.material.clone();card.material.color.set(options.tint||0xffffff);
  const g=new THREE.Group(),model=new THREE.Group();g.add(model);model.add(card);model.scale.setScalar(options.scale||1);
  const rig={g,model,card,body:bones[t.slots.body],head:bones[t.slots.head],arms:t.slots.arms.map(i=>bones[i]),legs:t.slots.legs.map(i=>bones[i]),state:{phase:0,amount:0},disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};updateFarmer3D(rig,0,0,1/60);return rig;
}
export function updateFarmer3D(r,dx,dz,dt,act='idle'){
  if(!(dt>0))return;const s=r.state,distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;s.amount=act==='idle'?0:Math.min(1,speed/.05);s.phase=(s.phase+(distance>1.5?0:distance)/.7)%1;
  r.legs[0].rotation.x=Math.sin(s.phase*6.28)*s.amount*.5;r.legs[1].rotation.x=-r.legs[0].rotation.x;r.arms[0].rotation.x=-r.legs[0].rotation.x*.6;r.arms[1].rotation.x=r.legs[0].rotation.x*.6;
  if(act==='interact')r.arms[1].rotation.x=-1.1;
  if(!Number.isFinite(r.legs[0].rotation.x))throw new Error('farmer joint');
}
export function createVillager3D(look={}){return createFarmer3D({tint:look.tint||0xffffff,scale:look.scale||1});}
