// Diagnostic matrix. Actual physical feet/soles must agree with requested paths.
import * as T from '../lib/three.module.min.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
export function measureChickenTurns(create=createChicken3D,update=updateChicken3D){
 const failures=[];let cases=0,worstSlip=0,worstTarget=0;
 for(const h of [.35,.72])for(const hz of [30,60,120])for(const run of [false,true])for(const warm of [.3,.7,1,1.3])for(const side of [-1,1]){
  const r=create(h),dt=1/hz,v=h===.72?(run?2.4:.8):h*(run?1.4:.65),g=r.card.geometry;
  const ids=r.legs.map(l=>{const b=r.card.skeleton.bones.indexOf(l.foot);return Array.from({length:g.attributes.position.count},(_,i)=>i).filter(i=>g.attributes.skinIndex.getX(i)===b);});
  const m=()=>r.legs.map((l,j)=>({f:l.foot.getWorldPosition(new T.Vector3()),plant:l.planted,sole:Math.min(...ids[j].map(i=>r.card.getVertexPosition(i,new T.Vector3()).applyMatrix4(r.card.matrixWorld).y))}));r.g.updateMatrixWorld(true);let prev=m(),maxSlip=0,maxTarget=0,minSupport=2,minSole=Infinity,first=null;
  try{
   for(let n=0;n<Math.round(hz*(warm+2));n++){
    const dx=n<hz*warm?0:side*v*dt,dz=n<hz*warm?-v*dt:0;r.g.position.x+=dx;r.g.position.z+=dz;update(r,dx,dz,dt,run?'run':'walk');r.g.updateMatrixWorld(true);const now=m();minSupport=Math.min(minSupport,now.filter(p=>p.sole>=-.002&&p.sole<=.002).length);
    for(let i=0;i<2;i++){
     minSole=Math.min(minSole,now[i].sole);
     if(n>0&&prev[i].plant&&prev[i].sole<=1e-7&&now[i].sole<=1e-7){const slip=Math.hypot(now[i].f.x-prev[i].f.x,now[i].f.z-prev[i].f.z);maxSlip=Math.max(maxSlip,slip);if(slip>.002&&!first)first={n,i,type:'contact',mm:slip*1000};}
     const p=r.chickenLiftCache?.[i],wanted=(p?.active||p?.hold)?{x:p.targetX,y:p.targetY,z:p.targetZ}:r.chickenController?.feet[i]??r.experimentExpected?.[i];if(wanted){const error=now[i].f.distanceTo(new T.Vector3(wanted.x,wanted.y,wanted.z));maxTarget=Math.max(maxTarget,error);if(error>.002&&!first)first={n,i,type:'target',mm:error*1000};}
    }prev=now;
   }
   cases++;worstSlip=Math.max(worstSlip,maxSlip);worstTarget=Math.max(worstTarget,maxTarget);
   if(maxSlip>.002||maxTarget>.002||minSole<-.002||(!run&&minSupport<1))failures.push({h,hz,run,warm,side,maxSlipMm:maxSlip*1000,maxTargetMm:maxTarget*1000,minSupport,minSoleMm:minSole*1000,first});
  }finally{r.dispose();}
 }
 return {cases,failed:failures.length,worstSlipMm:worstSlip*1000,worstTargetMm:worstTarget*1000,failures};
}
if(import.meta.url===new URL(process.argv[1]??'',`file://${process.cwd()}/`).href){const result=measureChickenTurns();console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;}
