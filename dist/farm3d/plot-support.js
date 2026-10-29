import {TERRAIN_SPAN,TERRAIN_SEGMENTS} from './workshop-site.js?v=1';

// Bound every rendered triangle touching the rotated 2.2 m bed. Including the
// full surrounding cells is conservative: each triangle is a convex combination
// of its vertex heights. No terrain edits or saved plot-position changes.
export function plotSupport(x,z,rotation,vertexY){
  if(![x,z,rotation].every(Number.isFinite))throw new RangeError('Invalid plot position');
  const half=TERRAIN_SPAN/2,step=TERRAIN_SPAN/TERRAIN_SEGMENTS;
  const extent=1.1*(Math.abs(Math.cos(rotation))+Math.abs(Math.sin(rotation)));
  if(Math.abs(x)+extent>half||Math.abs(z)+extent>half)throw new RangeError('Plot leaves terrain');
  const x0=Math.floor((x-extent+half)/step),x1=Math.ceil((x+extent+half)/step);
  const z0=Math.floor((z-extent+half)/step),z1=Math.ceil((z+extent+half)/step);
  let minY=Infinity,maxY=-Infinity;
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++){
    const y=Math.fround(vertexY(-half+i*step,-half+j*step));
    if(!Number.isFinite(y))throw new RangeError('Invalid plot support');
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  const rootY=Math.max(0,maxY),topY=rootY+.1,bottomY=Math.min(-.02,minY-.02);
  return {rootY,topY,bottomY,height:topY-bottomY,centerY:(topY+bottomY)/2-rootY,minY,maxY};
}
