import * as T from './lib/three.module.min.js';
import {poseCowLeg,COW_GAIT} from './cow3d.js?v=5';
// Opt-in support overlay using the accepted public leg solver. No anatomy,
// cadence, planted-anchor state, care progress or production state is changed.
export function applyCowPenSupport(r,sample){
 r.g.updateMatrixWorld(true);
 const inverse=new T.Matrix4().copy(r.model.matrixWorld).invert(),scale=r.model.scale.x;
 for(const leg of r.legs){
  const world=leg.foot.getWorldPosition(new T.Vector3()),dy=sample(world.x,world.z)-r.g.position.y;
  if(Math.abs(dy)<1e-12)continue;
  const local=world.clone().applyMatrix4(inverse);
  poseCowLeg(leg,local.x-leg.x,local.z-leg.z,local.y-COW_GAIT.hoof+dy/scale,r);
 }
 r.g.updateMatrixWorld(true);
}
export function cowPenStep(from,target,budget,sample){
 if(!(budget>0))return [...from];
 const dx=target[0]-from[0],dz=target[2]-from[2],distance=Math.hypot(dx,dz),horizontal=Math.min(distance,budget),probe=[from[0]+dx/(distance||1)*horizontal,from[2]+dz/(distance||1)*horizontal],height=sample(...probe);
 if(!Number.isFinite(height))return [...from];
 const dy=Math.max(-budget*.5,Math.min(budget*.5,height-from[1])),step=Math.min(distance,Math.sqrt(Math.max(0,budget*budget-dy*dy)));
 return[from[0]+dx/(distance||1)*step,from[1]+dy,from[2]+dz/(distance||1)*step];
}
