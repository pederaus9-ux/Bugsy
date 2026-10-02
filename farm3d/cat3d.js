import {createQuadruped,updateQuadruped,CAT} from './quadruped3d.js';
export function createCat3D(h=.4,x=0,z=0){return createQuadruped(CAT,h,x,z);}
export function updateCat3D(r,dx,dz,dt,mode='walk'){return updateQuadruped(r,dx,dz,dt,mode);}
