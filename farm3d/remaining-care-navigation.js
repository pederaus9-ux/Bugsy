import {segmentClearOfShapes} from './animal-pen-geometry.js?v=1';
// Continuous collision visibility for care and the ordinary pet movement adapter.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function nearest(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);return[ax+dx*t,az+dz*t];}
function pointDistance(x,z,ax,az,bx,bz){const q=nearest(x,z,ax,az,bx,bz);return Math.hypot(x-q[0],z-q[1]);}
function segmentsDistance(ax,az,bx,bz,cx,cz,dx,dz){const vx=bx-ax,vz=bz-az,wx=dx-cx,wz=dz-cz,den=vx*wz-vz*wx;if(Math.abs(den)>1e-14){const px=cx-ax,pz=cz-az,t=(px*wz-pz*wx)/den,u=(px*vz-pz*vx)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return 0;}return Math.min(pointDistance(ax,az,cx,cz,dx,dz),pointDistance(bx,bz,cx,cz,dx,dz),pointDistance(cx,cz,ax,az,bx,bz),pointDistance(dx,dz,ax,az,bx,bz));}
export function careSegmentClear(from,to,{pad=0,rectangles=[],segments=[],circles=[],polygons=[],escape=false}={}){
 const x=from[0],z=from[2],vx=to[0]-x,vz=to[2]-z,length=Math.hypot(vx,vz);
 for(const[bx,bz,hw,hd]of rectangles){
  const left=bx-hw-pad,right=bx+hw+pad,bottom=bz-hd-pad,top=bz+hd+pad;let lo=0,hi=1,miss=false;
  for(const[a,v,min,max]of [[x,vx,left,right],[z,vz,bottom,top]]){if(Math.abs(v)<1e-15){if(a<=min||a>=max){miss=true;break;}}else{const t0=(min-a)/v,t1=(max-a)/v;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}}
  if(miss||hi<=lo||hi<=0||lo>=1)continue;
  const d=[x-left,right-x,z-bottom,top-z],depth=Math.min(...d),derivatives=[vx,-vx,vz,-vz],outward=Math.min(...derivatives.filter((_,i)=>d[i]<=depth+1e-12));
  if(!(escape&&depth>0&&outward<0))return false;
 }
 for(const[ax,az,bx,bz]of segments){
  const radius=pad+.05;if(segmentsDistance(x,z,to[0],to[2],ax,az,bx,bz)>=radius)continue;
  const q=nearest(x,z,ax,az,bx,bz),dx=x-q[0],dz=z-q[1],start=Math.hypot(dx,dz),away=dx*vx+dz*vz;
  if(!(escape&&start<radius&&length>0&&(away>0||start<1e-12&&Math.abs(vx*(bz-az)-vz*(bx-ax))>1e-12)))return false;
 }
 for(const c of circles){
  const r=c.r-1e-8;if(pointDistance(c.x,c.z,x,z,to[0],to[2])>=r)continue;const dx=x-c.x,dz=z-c.z,start=Math.hypot(dx,dz);
  if(!(escape&&start<r&&length>0&&(dx*vx+dz*vz>0||start<1e-12)))return false;
 }
 if(!segmentClearOfShapes([x,z],[to[0],to[2]],polygons.map(points=>({type:'polygon',points})),pad))return false;
 return true;
}

// Default pens use shifted half-planes (mitered corners); custom pens use radial
// edge distance. Evaluate the caller's actual point rule at every possible change
// and between changes, including intervals shorter than a planner sample or step.
export function carePointRuleClear(from,to,{pad=0,polygons=[],clearPoint}={}){
 const x=from[0],z=from[2],vx=to[0]-x,vz=to[2]-z,vv=vx*vx+vz*vz,ts=[0,1];
 if(![x,z,vx,vz,pad].every(Number.isFinite)||pad<0)return false;
 const add=t=>{if(t>0&&t<1)ts.push(t);};
 for(const poly of polygons)for(let i=0;i<poly.length;i++){
  const [ax,az]=poly[i],[bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,len=Math.hypot(ex,ez);
  if(!len)continue;
  const d=(ex*(z-az)-ez*(x-ax))/len,dv=(ex*vz-ez*vx)/len;
  // The geometry point predicate includes a 1e-9 arithmetic tolerance on radial
  // boundaries. Include those events too; do not subtract any physical clearance.
  for(const r of [0,pad,pad+1e-9]){
   if(dv!==0){add((r-d)/dv);add((-r-d)/dv);}
   if(vv>0){const qx=x-ax,qz=z-az,b=qx*vx+qz*vz,c=qx*qx+qz*qz-r*r,disc=b*b-vv*c;if(disc>=0){const root=Math.sqrt(disc);add((-b-root)/vv);add((-b+root)/vv);}}
  }
 }
 ts.sort((a,b)=>a-b);
 const clear=t=>{
  const px=x+vx*t,pz=z+vz*t;if(!clearPoint(px,pz))return false;
  // A tangent can round just outside both half-planes at once. Fail closed within
  // arithmetic noise at an interior boundary event, without reducing any margin.
  if(t>0&&t<1)for(const dx of [-1e-12,1e-12])for(const dz of [-1e-12,1e-12])if(!clearPoint(px+dx,pz+dz))return false;
  return true;
 };
 for(let i=0;i<ts.length;i++)if(!clear(ts[i])||i>0&&!clear((ts[i-1]+ts[i])/2))return false;
 return true;
}
