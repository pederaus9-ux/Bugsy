// A northern extension of the existing farm, not a save or purchased-field migration.
export const NORTH_EXTENSION=25;
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
 const clearing=smooth(-21,-25,z)*(1-smooth(-46,-50,z))*(1-smooth(24,28,Math.abs(x-1)));
 return clearing===1?0:old*(1-clearing);
}
