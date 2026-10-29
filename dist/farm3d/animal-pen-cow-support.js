import * as T from './lib/three.module.min.js';
import {poseCowLeg,COW_GAIT} from './cow3d.js?v=6';
import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
import {pointInPolygon} from './animal-pen-geometry.js?v=1';
// The shelter owns the accepted slab; expanding the fence adds soil, not
// concrete. Test in the slab's original frame so independent moves follow it.
export function cowPenSupportHeight(site,x,z,groundY){
 const [dx,dz]=site.components.shelter.delta,b=PEN_TEMPLATES.cow.baseline;
 return pointInPolygon([x-dx,z-dz],b.polygon)?b.floor:groundY(x,z);
}
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
