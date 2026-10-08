// Test-only relocation for world-space horse contact evidence.
// Never import this module from production gameplay.
import {resetHoofTrack} from '../horse-stance3d.js';
export function resetHorseEvidencePose(r,x,y,z){
  r.g.position.set(x,y,z);
  r.model.rotation.set(0,0,0);
  Object.assign(r.state,{phase:0,totalPhase:0,amount:0,gait:'idle'});
  const scale=r.model.scale.x,soleY=y+.07425*scale+.0005;
  for(const l of r.legs){
    if(l.track)resetHoofTrack(l.track,x+l.x*scale,soleY,z+l.z*scale,0);
    l.lastSwingCycle=-1;l.planted=false;
  }
}
export function translateHorseEvidencePose(r,x,y,z){
  const dx=x-r.g.position.x,dy=y-r.g.position.y,dz=z-r.g.position.z;
  for(const l of r.legs)if(l.track){
    for(const key of ['x','plantX','startX','landX'])l.track[key]+=dx;
    for(const key of ['y','plantY','startY','landY'])l.track[key]+=dy;
    for(const key of ['z','plantZ','startZ','landZ'])l.track[key]+=dz;
    l.ax+=dx;l.az+=dz;
  }
  r.g.position.set(x,y,z);r.g.updateMatrixWorld(true);
}
