import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function roamChicken(seed,height,hz,seconds=20){
 const rng=random(seed),r=createChicken3D(height),g=r.card.geometry,point=new T.Vector3();
 const ids=r.legs.map(l=>{const b=r.card.skeleton.bones.indexOf(l.foot),a=[];for(let v=0;v<g.attributes.position.count;v++)if(g.attributes.skinIndex.getX(v)===b)a.push(v);return a;});
 let yaw=0,change=0,mode='walk',v=0,time=0,worstTarget=0,minSupport=2,maxDrop=0;
 try{
  while(time<seconds){
   const dt=(.8+rng()*.4)/hz;time+=dt;
   if(time>=change){yaw+=(rng()-.5)*Math.PI*2;mode=rng()<.15?'idle':rng()<.3?'run':'walk';v=height===.72?(mode==='run'?2.4:.8):height*(mode==='run'?1.4:.65);change=time+.05+rng()*.6;}
   const dx=mode==='idle'?0:-Math.sin(yaw)*v*dt,dz=mode==='idle'?0:-Math.cos(yaw)*v*dt;
   r.g.position.x+=dx;r.g.position.z+=dz;updateChicken3D(r,dx,dz,dt,mode);r.g.updateMatrixWorld(true);
   let support=0;
   for(let i=0;i<2;i++){
    const l=r.legs[i],f=r.chickenController.feet[i],actual=l.foot.getWorldPosition(point);
    const error=Math.hypot(actual.x-f.x,actual.y-f.y,actual.z-f.z);worstTarget=Math.max(worstTarget,error);
    assert.ok(error<=.002,`seed${seed} h${height} hz${hz} t${time} leg${i} foot-target${error*1000}mm ${JSON.stringify({mode,dx,dz,yaw,bodyDrop:r.chickenController.bodyDrop,feet:r.chickenController.feet,actual:actual.toArray(),root:r.g.position.toArray()})}`);
    assert.ok(Math.abs(l.hip.position.y-(r.spec.hip-r.spec.bodyY))<1e-10||!r.state.everChickenMoved,'hip attachment must stay fixed to body');
    let sole=Infinity;for(const id of ids[i])sole=Math.min(sole,r.card.getVertexPosition(id,point).applyMatrix4(r.card.matrixWorld).y);
    assert.ok(sole>=-.002,'actual toe penetration');if(sole<=.002)support++;
   }
   if(mode==='walk')assert.ok(support>=1,`seed${seed} walk has no physical support at${time}`);
   minSupport=Math.min(minSupport,support);maxDrop=Math.max(maxDrop,r.chickenController.bodyDrop);
  }
  return {worstTargetMm:worstTarget*1000,minSupport,maxBodyDropLocal:maxDrop};
 }finally{r.dispose();}
}
