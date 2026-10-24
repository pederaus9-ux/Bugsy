// A northern extension of the existing farm, not a save or purchased-field migration.
export const NORTH_EXTENSION=25;
// Room for the horse paddock to move: the north clearing is level this much further west.
export const WEST_CLEARING=10;
// The fully level part of the existing north clearing, from farmGroundY's fade
// boundaries. This placement mask changes no terrain or unrelated player limits.
export const NORTH_LEVEL_BUILD_CLEARING=[1-(24+WEST_CLEARING),1+24,-46,-25];
export function buildableLandShapes(radius=23){
 const [x0,x1,z0,z1]=NORTH_LEVEL_BUILD_CLEARING;
 return [{type:'capsule',a:[1,3-NORTH_EXTENSION],b:[1,3],r:radius},
  {type:'capsule',a:[1,3-NORTH_EXTENSION],b:[1,3],r:40},
  {type:'polygon',points:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]}];
}
export function onBuildableLand(x,z,hw=0,hd=0){
 if(onFarm(x,z,23))return true;
 const [x0,x1,z0,z1]=NORTH_LEVEL_BUILD_CLEARING;
 return x-hw>=x0&&x+hw<=x1&&z-hd>=z0&&z+hd<=z1||
  [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].every(([dx,dz])=>onFarm(x+dx,z+dz,40));
}
export function onFarm(x,z,radius=24){
 const nearest=Math.max(3-NORTH_EXTENSION,Math.min(3,z));
 return Math.hypot(x-1,z-nearest)<=radius+1e-9;
}
export function clampToFarm(x,z,radius=40){
 const nearest=Math.max(3-NORTH_EXTENSION,Math.min(3,z)),dx=x-1,dz=z-nearest,d=Math.hypot(dx,dz);
 return d>radius?[1+dx/d*radius,nearest+dz/d*radius]:[x,z];
}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function farmGroundY(x,z){
 const d=Math.hypot(x,z),old=d<16?0:(Math.sin(x*.09)*Math.cos(z*.07)*1.3+Math.sin(x*.23+z*.17)*.4)*Math.min(1,(d-16)/20);
 const clearing=smooth(-21,-25,z)*(1-smooth(-46,-50,z))*(1-(x<1?smooth(24+WEST_CLEARING,28+WEST_CLEARING,1-x):smooth(24,28,x-1)));
 return clearing===1?0:old*(1-clearing);
}
