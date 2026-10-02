import {createQuadruped,updateQuadruped,DOG} from './quadruped3d.js';
export function createDog3D(h=.55,x=0,z=0){return createQuadruped(DOG,h,x,z);}
export function updateDog3D(r,dx,dz,dt,mode='walk'){return updateQuadruped(r,dx,dz,dt,mode);}
