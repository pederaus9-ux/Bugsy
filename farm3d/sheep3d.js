// Sheep volume. Hips stay children of the body so the legs do not detach.
import * as THREE from './lib/three.module.min.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const SHEEP_GAIT=Object.freeze({upper:.22,lower:.23,hip:.52,hoof:.04,stride:.62,stance:.58});
let template;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={legs:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,.72,0]);
  slots.neck=bone('neck',slots.body,[0,.16,-.34]);
  slots.head=bone('head',slots.neck,[0,.08,-.12]);
  for(const [x,z,phase]of [[-.16,-.28,0],[.16,-.28,.5],[-.16,.26,.5],[.16,.26,0]]){
    const hip=bone('hip'+slots.legs.length,slots.body,[x,SHEEP_GAIT.hip-.72,z]);
    const knee=bone('knee'+slots.legs.length,hip,[0,-SHEEP_GAIT.upper,0]);
    const foot=bone('hoof'+slots.legs.length,knee,[0,-SHEEP_GAIT.lower,0]);
    slots.legs.push({hip,knee,foot,x,z,phase});
  }
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
  const wool=new THREE.Color(0xf4f1ea),face=new THREE.Color(0x2b2b2b);
  function add(geo,col,p,scale,b=0){
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const origin=rest[b];
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+origin.x,p[1]+origin.y,p[2]+origin.z),new THREE.Quaternion(),new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);
    for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}
    g.dispose();
  }
  const oval=(col,p,scale,b,detail=12)=>add(new THREE.SphereGeometry(1,detail,8),col,p,scale,b);
  const rod=(col,p,r1,r2,len,b)=>add(new THREE.CylinderGeometry(r1,r2,len,8),col,p,[1,1,1],b);
  oval(wool,[0,0,0],[.34,.28,.46],slots.body,16);
  oval(face,[0,.02,-.08],[.12,.1,.14],slots.head,12);
  for(const l of slots.legs){
    oval(wool,[0,.06,0],[.1,.08,.1],l.hip,8);
    rod(wool,[0,-.1,0],.05,.04,.2,l.hip);
    rod(face,[0,-.1,0],.035,.028,.2,l.knee);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9})};
}
export function createSheep3D(height=.9,x=0,z=0){
  template ||= buildTemplate();
  const t=template,bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/.9);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot],planted:false}));
  const rig={g,model,card,body:bones[t.slots.body],legs,state:{phase:0,amount:0},disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateSheep3D(rig,0,0,1/60);return rig;
}
export function poseSheepLeg(leg,tz,lift){
  const c=SHEEP_GAIT,y=c.hip-c.hoof-lift;
  const distance=Math.min(c.upper+c.lower-.001,Math.hypot(0,tz,y));
  const alpha=Math.atan2(tz,y);
  const delta=Math.acos(clamp((c.upper*c.upper+distance*distance-c.lower*c.lower)/(2*c.upper*distance),-1,1));
  const bend=Math.acos(clamp((distance*distance-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
  const sign=leg.z<0?1:-1;
  leg.hip.rotation.set(alpha-sign*delta,0,0);leg.knee.rotation.x=sign*bend;
}
export function updateSheep3D(r,dx,dz,dt){
  if(!(dt>0))return;
  const s=r.state,c=SHEEP_GAIT,distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;
  s.amount=clamp(speed/.05,0,1);
  s.phase=(s.phase+(distance>1.5?0:distance)/c.stride)%1;
  for(const l of r.legs){
    const phase=(s.phase+l.phase)%1,step=.08;
    const z=phase<c.stance?-step+phase/c.stance*2*step:step*Math.cos((phase-c.stance)/(1-c.stance)*Math.PI);
    const lift=phase<c.stance?0:Math.sin((phase-c.stance)/(1-c.stance)*Math.PI)*.04*s.amount;
    poseSheepLeg(l,z*s.amount,lift);
    assertFinite(l);
  }
}
function assertFinite(l){if(!Number.isFinite(l.knee.rotation.x))throw new Error('sheep knee not finite');}
