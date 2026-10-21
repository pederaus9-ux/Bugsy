import * as T from './lib/three.module.min.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mouths={horse:[0,-.40,-.43],sheep:[0,-.015,-.26],dog:[0,-.047,-.155],cat:[0,-.04,-.088]};
// A resettable, opt-in skeleton overlay: no renderer geometry/gait or save API changes.
export function createQuadrupedCarePose(r){
 const kind=r.liveKind||r.spec.name,c=r.spec,tip=new T.Vector3(...mouths[kind]),nodes=[r.model,r.body,r.neck,r.head,...r.legs.flatMap(l=>[l.hip,l.knee,l.foot]),...r.tail],saved=nodes.map(()=>({p:new T.Vector3(),q:new T.Quaternion(),s:new T.Vector3(),m:new T.Matrix4(),auto:true}));let active=false;const supportCorrections=new Map();
 const v=new T.Vector3(),restBody=c.bodyY,bodyRadius={horse:.30,sheep:.28,dog:.12,cat:.09}[kind];
 function reset(){if(!active)return;nodes.forEach((n,i)=>{const s=saved[i];n.position.copy(s.p);n.quaternion.copy(s.q);n.scale.copy(s.s);n.matrix.copy(s.m);n.matrixAutoUpdate=s.auto;});active=false;}
 function legs(drop,w){
  const hip=c.hip-drop,dy=hip-c.hoof;
  for(const l of r.legs){const sign=l.z<0?1:-1,z=sign*.025*w,d=Math.max(.001,Math.hypot(dy,z)),a=-Math.atan2(z,dy),delta=Math.acos(clamp((c.upper*c.upper+d*d-c.lower*c.lower)/(2*c.upper*d),-1,1)),bend=Math.acos(clamp((d*d-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
   l.hip.position.set(l.x,c.hip-restBody,l.z);l.hip.rotation.set(a-sign*delta,0,0);l.knee.position.set(0,-c.upper,0);l.knee.rotation.set(sign*bend,0,0);l.foot.position.set(0,-c.lower,0);l.foot.rotation.set(-(a-sign*delta+sign*bend),0,0);l.hip.matrixAutoUpdate=l.knee.matrixAutoUpdate=l.foot.matrixAutoUpdate=true;
  }
 }
 function mouthWorld(){r.g.updateMatrixWorld(true);return r.head.localToWorld(tip.clone());}
 return {reset,mouthWorld,apply({mode,weight=1,target,surface=.1}={}){
  reset();const w=clamp(weight,0,1);if(!w||!['lie','feed','drink'].includes(mode))return;
  nodes.forEach((n,i)=>{const s=saved[i];s.p.copy(n.position);s.q.copy(n.quaternion);s.s.copy(n.scale);s.m.copy(n.matrix);s.auto=n.matrixAutoUpdate;n.matrixAutoUpdate=true;});active=true;
  r.body.rotation.set(0,0,0);r.neck.rotation.set(0,0,0);r.head.rotation.set(0,0,0);
  const lieY=Math.max(bodyRadius,c.bodyY-c.hip+c.hoof+.008),drop=mode==='lie'?(restBody-lieY)*w:({horse:0,sheep:.22,dog:.20,cat:.16}[kind])*w;
  r.body.position.y=restBody-drop;legs(drop,w);
  if(mode==='lie'){
   r.model.position.y+=surface*w;r.neck.rotation.x=-.25*w;r.head.rotation.x=-.15*w;
   // The long horse tail otherwise hangs through the mattress after the body lowers.
   r.tail.forEach((n,i)=>n.rotation.set(i===0?(kind==='horse'?-1.5:kind==='sheep'?0:.4)*w:0,0,0));
   const key=Math.round(w*600)+':'+surface;let correction=supportCorrections.get(key);
   if(correction===undefined){r.g.updateMatrixWorld(true);r.card.skeleton.update();let bottom=Infinity;for(let i=0;i<r.card.geometry.attributes.position.count;i++){r.card.getVertexPosition(i,v);v.applyMatrix4(r.card.matrixWorld);bottom=Math.min(bottom,v.y);}correction=r.g.position.y+surface*w-bottom;supportCorrections.set(key,correction);}
   r.model.position.y+=correction;
  }else if(target){
   r.g.updateMatrixWorld(true);v.copy(target);v.y+=mode==='feed'?Math.max(0,Math.sin(r.state.time*6))*.012:Math.max(0,Math.sin(r.state.time*4))*.004;r.body.worldToLocal(v);v.sub(r.neck.position);
   const hy=r.head.position.y,hz=r.head.position.z,L1=Math.hypot(hy,hz),L2=Math.hypot(tip.y,tip.z),d=Math.max(.0001,Math.hypot(v.y,v.z)),theta=Math.atan2(v.y,-v.z),a=theta+Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),b=theta-Math.acos(clamp((L2*L2+d*d-L1*L1)/(2*L2*d),-1,1));
   r.neck.rotation.x=(a-Math.atan2(hy,-hz))*w;r.head.rotation.x=(b-(a-Math.atan2(hy,-hz))-Math.atan2(tip.y,-tip.z))*w;
  }
 }};
}
