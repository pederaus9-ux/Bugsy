import {createQuadruped,updateQuadruped,HORSE} from './quadruped3d.js';
export function createHorse3D(h=1.6,x=0,z=0){return createQuadruped(HORSE,h,x,z);}
export function updateHorse3D(r,dx,dz,dt,mode='walk'){return updateQuadruped(r,dx,dz,dt,mode);}
export {HORSE};
