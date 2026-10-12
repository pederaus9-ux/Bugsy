// Test-only horizontal relocation. Preserve the pose and persistent world contacts.
export function translateSheepEvidencePose(r,x,z){
  const dx=x-r.g.position.x,dz=z-r.g.position.z;
  for(const l of r.legs){
    if(Number.isFinite(l.ax))l.ax+=dx;
    if(Number.isFinite(l.az))l.az+=dz;
  }
  if(r.state.sheepStop)for(const target of r.state.sheepStop.legs){target.x+=dx;target.z+=dz;}
  r.g.position.x=x;r.g.position.z=z;r.g.updateMatrixWorld(true);
}
