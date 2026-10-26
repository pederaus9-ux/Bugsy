import * as T from '../../lib/three.module.min.js';
import {updateCow3D} from '../../cow3d.js';
import {copyCowRig} from './cow-pose-preview.mjs';
import {cowMotionDomains,cowRecoveryWeight} from './cow-motion-domains.mjs';
import {cacheCowCompound,compoundBounds,cowSweptQuery} from './cow-hierarchical-sweep.mjs';

export function verifyCapturedRecovery(){
 const target=window.__turnDiag.target;if(!target)throw Error('Exact captured frame missing');
 const r=target.base,q=target.q,cache=cacheCowCompound(r),before=JSON.stringify({state:r.state,legs:r.legs.map(l=>Object.fromEntries(Object.entries(l).filter(([k])=>!['hip','knee','foot'].includes(k))))}),rows=[];
 const random=Math.random;Math.random=()=>{throw Error('RNG mutation');};
 try{for(const kind of['motion','recovery']){
  const request=kind==='motion'?{...q,evaluatedRt:r.legs.map(l=>l.rt)}:{...q,recoveryFraction:[0,1]},domain=cowMotionDomains(r,request,0,kind==='motion'?1:0),bounds=compoundBounds(cache,domain);let checked=0;
  for(const fraction of[1e-6,.25,.5,.75,1]){
   const pose=copyCowRig(r),dt=kind==='motion'?q.dt*fraction:1e-12,dx=kind==='motion'?q.dx*fraction:0,dz=kind==='motion'?q.dz*fraction:0;
   if(kind==='recovery')pose.legs.forEach((l,i)=>{if(!l.planted)l.rt=q.evaluatedRt[i]+(l.rt-q.evaluatedRt[i])*fraction;});
   pose.g.position.x+=dx;pose.g.position.z+=dz;updateCow3D(pose,dx,dz,dt,0,q.act);pose.g.updateMatrixWorld(true);
   const v=new T.Vector3();for(const group of cache.groups){const b=bounds.bound(group);for(const tri of group.ids)for(let i=tri*3;i<tri*3+3;i++){pose.card.getVertexPosition(i,v).applyMatrix4(pose.card.matrixWorld);const point=v.toArray();if(!b.every((range,k)=>point[k]>=range[0]&&point[k]<=range[1]))throw Error(JSON.stringify({kind,fraction,vertex:i,point,bounds:b}));checked++;}}pose.dispose();
  }rows.push({kind,checked,events:domain.events});
 }
 const after=JSON.stringify({state:r.state,legs:r.legs.map(l=>Object.fromEntries(Object.entries(l).filter(([k])=>!['hip','knee','foot'].includes(k))))});if(after!==before)throw Error('Captured rig mutation');
 return{status:'PASS',rows,totalVertices:rows.reduce((n,r)=>n+r.checked,0),result:target.result,weight:cowRecoveryWeight([q.evaluatedRt[3],r.legs[3].rt]),nonmutation:true,rngUntouched:true,limits:'Exact captured state. Finite native skin witnesses within corrected full domain; recovery event sampled via positive1e-12 native updates at fixed root. Original guard/collision limits unchanged; not live route proof.'};
 }finally{Math.random=random;}
}
