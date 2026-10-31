import * as THREE from './lib/three.module.min.js';
import {COW_GAIT} from './cow3d.js?v=6';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,w)=>a+(b-a)*w;
// Opt-in overlay. Reset before the next accepted ordinary rig update; neither
// anatomy nor the gait implementation changes. No supplies/rewards live here.
export function getAnimalCarePose(kind,r){
 if(kind==='chicken'&&r?.legs)return chickenCarePose(r);
 if(kind!=='cow'||!r?.legs)return {apply(){},reset(){}};
 const nodes=[r.body,r.neck,r.head,r.jaw,...r.tail,...r.legs.flatMap(l=>[l.hip,l.knee,l.foot])];
 const saved=nodes.map(n=>({p:new THREE.Vector3(),q:new THREE.Quaternion(),s:new THREE.Vector3(),m:new THREE.Matrix4(),auto:true}));let active=false;const AXIS=new THREE.Vector3(1,0,0);
 const v=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion(),sa=new THREE.Vector3(),sb=new THREE.Vector3(),root=new THREE.Matrix4(),targetMatrix=new THREE.Matrix4(),inv=new THREE.Matrix4();
 function blendMatrix(node,m,w){node.matrix.decompose(a,qa,sa);m.decompose(b,qb,sb);a.lerp(b,w);qa.slerp(qb,w);sa.lerp(sb,w);node.matrixAutoUpdate=false;node.matrix.compose(a,qa,sa);}
 function reset(){if(!active)return;nodes.forEach((n,i)=>{const s=saved[i];n.position.copy(s.p);n.quaternion.copy(s.q);n.scale.copy(s.s);n.matrix.copy(s.m);n.matrixAutoUpdate=s.auto;});active=false;}
 return {reset,apply({mode,weight=1,target}={}){
  reset();const w=clamp(weight,0,1);if(!w||!['lie','feed','drink'].includes(mode))return;
  nodes.forEach((n,i)=>{const s=saved[i];s.p.copy(n.position);s.q.copy(n.quaternion);s.s.copy(n.scale);s.m.copy(n.matrix);s.auto=n.matrixAutoUpdate;});active=true;
  if(mode==='lie'){
   r.body.position.y=mix(r.body.position.y,1.03-.58,w);r.body.rotation.z*=1-w;r.neck.position.y-=.47*w;r.neck.rotation.x=mix(r.neck.rotation.x,.18,w);r.head.rotation.y*=1-w;r.tail[0].position.y-=.58*w;r.tail[0].rotation.x=mix(r.tail[0].rotation.x,1.1,w);r.body.updateMatrix();inv.copy(r.body.matrix).invert();
   const c=COW_GAIT,y=c.hip-.58*w-c.hoof;
   for(const l of r.legs){const sign=l.z<0?1:-1,tz=sign*.12*w,d=Math.hypot(y,tz),alpha=-Math.atan2(tz,y),delta=Math.acos(clamp((c.upper*c.upper+d*d-c.lower*c.lower)/(2*c.upper*d),-1,1)),bend=Math.acos(clamp((d*d-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
    q.setFromAxisAngle(AXIS,alpha-sign*delta);root.compose(v.set(l.x,c.hip-.58*w,l.z),q,scale.set(1,1,1));targetMatrix.copy(inv).multiply(root);blendMatrix(l.hip,targetMatrix,1);
    qa.setFromAxisAngle(AXIS,sign*bend);targetMatrix.compose(v.set(0,-c.upper,0),qa,scale);blendMatrix(l.knee,targetMatrix,1);
    q.setFromAxisAngle(AXIS,-(alpha-sign*delta+sign*bend));targetMatrix.compose(v.set(0,-c.lower,0),q,scale);blendMatrix(l.foot,targetMatrix,1);
   }
  }else if(target){
   r.g.updateMatrixWorld(true);v.copy(target);r.model.worldToLocal(v);
   const rz=v.z+.59,L=Math.hypot(.07,.56),desiredY=-Math.sqrt(Math.max(0,L*L-rz*rz)),pitch=Math.atan2(desiredY,-rz)-Math.atan2(.07,.56);
   r.neck.rotation.x=mix(r.neck.rotation.x,clamp(pitch,-1.4,.1),w);r.neck.position.y=mix(r.neck.position.y,v.y-desiredY,w);r.neck.rotation.y*=1-w;r.head.rotation.y*=1-w;r.head.rotation.z*=1-w;if(mode==='drink'){r.jaw.rotation.x=mix(r.jaw.rotation.x,.012+Math.sin(r.state.time*4)*.006,w);r.jaw.rotation.y*=1-w;}
  }
 }};
}

// Poultry keeps its own proportions and two-leg articulation. This overlay is
// opt-in and resets before the ordinary contact controller's next update.
function chickenCarePose(r){
 const nodes=[r.body,r.neck,r.head,...r.legs.flatMap(l=>[l.hip,l.knee,l.foot])],saved=nodes.map(n=>({p:n.position.clone(),q:n.quaternion.clone(),s:n.scale.clone()}));let active=false;
 const targetLocal=new THREE.Vector3(),tipAngle=Math.atan2(-.012,.1225),upper=Math.hypot(.06,.04),lower=Math.hypot(.012,.1225);
 function reset(){if(!active)return;nodes.forEach((n,i)=>{n.position.copy(saved[i].p);n.quaternion.copy(saved[i].q);n.scale.copy(saved[i].s);});active=false;}
 return {reset,apply({mode,weight=1,target}={}){
  reset();const w=clamp(weight,0,1);if(!w||!['lie','feed','drink'].includes(mode))return;
  nodes.forEach((n,i)=>{saved[i].p.copy(n.position);saved[i].q.copy(n.quaternion);saved[i].s.copy(n.scale);});active=true;
  if(mode==='lie'){
   r.body.position.y=mix(r.body.position.y,.13,w);r.neck.rotation.x=mix(r.neck.rotation.x,.22,w);r.head.rotation.y*=1-w;
   for(const l of r.legs){const hip=r.body.position.y+l.hip.position.y,y=hip-r.spec.hoof,z=.09*w,d=Math.hypot(y,z),delta=Math.acos(clamp(d/(2*r.spec.upper),-1,1)),bend=Math.acos(clamp((d*d-2*r.spec.upper*r.spec.upper)/(2*r.spec.upper*r.spec.upper),-1,1));l.hip.rotation.set(-Math.atan2(z,y)-delta,0,0);l.knee.rotation.x=bend;l.foot.quaternion.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert();}
  }else if(target){
   r.g.updateMatrixWorld(true);targetLocal.copy(target);r.model.worldToLocal(targetLocal);
   r.neck.position.y-=.045*w;r.neck.position.z-=.025*w;
   const y=targetLocal.y-r.body.position.y-r.neck.position.y,z=targetLocal.z-r.neck.position.z;
   const bob=mode==='feed'?Math.max(0,Math.sin(r.state.time*7))*.025:Math.sin(r.state.time*4)*.003,dy=y+bob,d=Math.max(1e-6,Math.hypot(dy,z)),angle=Math.atan2(dy,-z);
   const a=angle+Math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1));
   const b=angle-Math.acos(clamp((lower*lower+d*d-upper*upper)/(2*lower*d),-1,1));
   r.neck.rotation.set(mix(r.neck.rotation.x,a-Math.atan2(.06,.04),w),0,0);r.head.rotation.set(mix(r.head.rotation.x,b-(a-Math.atan2(.06,.04))-tipAngle,w),0,0);
  }
 }};
}
