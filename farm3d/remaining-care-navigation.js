// Continuous collision visibility for the opt-in care planner. No global routing changes.
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
 for(const poly of polygons){let lo=0,hi=1,miss=false;
  for(let i=0;i<poly.length;i++){const[ax,az]=poly[i],[bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,n=Math.hypot(ex,ez),at=(ex*(z-az)-ez*(x-ax))/n+pad,slope=(ex*vz-ez*vx)/n;if(Math.abs(slope)<1e-15){if(at<0){miss=true;break;}}else{const t=-at/slope;if(slope>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}}
  if(!miss&&lo<=hi&&hi>=0&&lo<=1)return false;
 }
 return true;
}
