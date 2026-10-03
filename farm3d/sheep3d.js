// Sheep volume. Hips stay children of the body so the legs do not detach.
import * as THREE from './lib/three.module.min.js';
import {updateQuadruped} from './quadruped3d.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const SHEEP_GAIT=Object.freeze({upper:.22,lower:.23,hip:.52,hoof:.04,stride:.62,stance:.58});
let template;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={legs:[],ears:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,.72,0]);
  slots.neck=bone('neck',slots.body,[0,.16,-.34]);
  slots.head=bone('head',slots.neck,[0,.08,-.12]);
  for(const side of [-1,1])slots.ears.push(bone('ear'+side,slots.head,[side*.10,.04,-.04]));
  slots.tail=bone('tail',slots.body,[0,-.04,.40]);
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
  oval(wool,[0,-.04,.04],[.15,.20,.16],slots.neck,12);
  oval(face,[0,.02,-.08],[.12,.1,.14],slots.head,12);
  oval(face,[0,-.015,-.19],[.10,.065,.08],slots.head,12);
  for(const side of [-1,1]){
    const ear=slots.ears[side===-1?0:1];
    oval(face,[side*.07,0,0],[.11,.035,.06],ear,10);
    oval(0xb89189,[side*.085,.01,-.035],[.065,.018,.024],ear,8);
    oval(0xf6f0e5,[side*.106,.045,-.15],[.028,.03,.025],slots.head,10);
    oval(0x171818,[side*.121,.045,-.164],[.015,.022,.014],slots.head,8);
  }
  oval(wool,[0,-.03,.03],[.09,.10,.10],slots.tail,10);
  for(const l of slots.legs){
    oval(wool,[0,.06,0],[.1,.08,.1],l.hip,8);
    rod(wool,[0,-SHEEP_GAIT.upper/2,0],.05,.04,SHEEP_GAIT.upper,l.hip);
    oval(wool,[0,0,0],[.045,.045,.045],l.knee,10);
    rod(face,[0,-SHEEP_GAIT.lower/2,0],.035,.028,SHEEP_GAIT.lower,l.knee);
    oval(face,[0,-.016,-.02],[.045,.024,.063],l.foot,10);
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
  for(const l of legs)l.hip.rotation.order='YXZ';
  const rig={g,model,card,body:bones[t.slots.body],neck:bones[t.slots.neck],head:bones[t.slots.head],ears:t.slots.ears.map(i=>bones[i]),tail:[bones[t.slots.tail]],legs,spec:{...SHEEP_GAIT,bodyY:.72,lift:.04},state:{phase:0,amount:0,time:0},q:new THREE.Quaternion(),disposed:false};
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
  leg.foot.rotation.x=-leg.hip.rotation.x-leg.knee.rotation.x;
}
export function updateSheep3D(r,dx,dz,dt,mode='walk'){
  updateQuadruped(r,dx,dz,dt,mode);
}
