// Test-only geometry prototype. The supplied endpoint parts are interpolated
// linearly in local coordinates, with linear root translation and yaw. This is
// a proven envelope of THAT interpolation, not arbitrary procedural animation.
// Do not connect to gameplay until its executed motion satisfies the contract.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points){
 const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]).filter((a,i,p)=>!i||a[0]!==p[i-1][0]||a[1]!==p[i-1][1]);if(p.length<=2)return p;
 const lo=[],hi=[];for(const a of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),a)<=0)lo.pop();lo.push(a);}for(const a of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),a)<=0)hi.pop();hi.push(a);}return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function separated(poly,b,r=0){
 const axes=[[1,0],[0,1]];for(let i=0;i<poly.length;i++){const a=poly[i],c=poly[(i+1)%poly.length];axes.push([c[1]-a[1],a[0]-c[0]]);}
 for(const [x,z]of axes){const norm=Math.hypot(x,z);if(!norm)continue;let lo=Infinity,hi=-Infinity;for(const p of poly){const d=p[0]*x+p[1]*z;lo=Math.min(lo,d);hi=Math.max(hi,d);}
  const blo=Math.min(x*b[0],x*b[3])+Math.min(z*b[2],z*b[5]),bhi=Math.max(x*b[0],x*b[3])+Math.max(z*b[2],z*b[5]);
  if(lo-r*norm>bhi||hi+r*norm<blo)return true;
 }return false;
}
const finite=a=>a.every(Number.isFinite),validPose=p=>p&&finite([p.x,p.y,p.z,p.yaw]);
const at=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw:a.yaw+(b.yaw-a.yaw)*t});
function transform(points,p){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);return points.map(([x,z])=>[p.x+c*x+s*z,p.z-s*x+c*z]);}
export function cowRigidSweepClear({parts,from,to,solids,rootObstacles,rootPad=.42}){
 if(!validPose(from)||!validPose(to)||!Number.isFinite(rootPad)||rootPad<.42||!Array.isArray(parts)||!Array.isArray(solids)||!Array.isArray(rootObstacles))return false;
 if(solids.some(b=>b.length!==6||!finite(b)||b[0]>b[3]||b[1]>b[4]||b[2]>b[5])||rootObstacles.some(b=>b.length!==4||!finite(b)||b[2]<0||b[3]<0))return false;
 const angle=to.yaw-from.yaw,n=Math.max(1,Math.ceil(Math.abs(angle)/(Math.PI/8)));if(n>64)return false;
 // Whole root segment, unchanged full padding. Never exempt containing solids.
 const root=hull([from,to].flatMap(p=>[[-rootPad,-rootPad],[rootPad,-rootPad],[rootPad,rootPad],[-rootPad,rootPad]].map(([x,z])=>[x+p.x,z+p.z])));
 for(const [x,z,hw,hd]of rootObstacles)if(!separated(root,[x-hw,-Infinity,z-hd,x+hw,Infinity,z+hd]))return false;
 for(const part of parts){
  const end=part.endPoints??part.points,endMinY=part.endMinY??part.minY,endMaxY=part.endMaxY??part.maxY;
  if(!Array.isArray(part.points)||!part.points.length||!Array.isArray(end)||end.length!==part.points.length||[...part.points,...end].some(p=>p.length!==2||!finite(p))||!finite([part.minY,part.maxY,endMinY,endMaxY])||part.minY>part.maxY||endMinY>endMaxY)return false;
  const radius=Math.max(...[...part.points,...end].map(p=>Math.hypot(...p))),deform=Math.max(...part.points.map((p,j)=>Math.hypot(p[0]-end[j][0],p[1]-end[j][1])));
  const error=(radius*(angle/n)**2+2*Math.abs(angle/n)*deform/n)/8;
  const local=t=>part.points.map((p,j)=>[p[0]+(end[j][0]-p[0])*t,p[1]+(end[j][1]-p[1])*t]);
  for(let i=0;i<n;i++){
   const u=i/n,v=(i+1)/n,a=at(from,to,u),b=at(from,to,v);
   const y0=Math.min(a.y+part.minY+(endMinY-part.minY)*u,b.y+part.minY+(endMinY-part.minY)*v),y1=Math.max(a.y+part.maxY+(endMaxY-part.maxY)*u,b.y+part.maxY+(endMaxY-part.maxY)*v);
   const poly=hull([...transform(local(u),a),...transform(local(v),b)]);
   // For linear yaw, the point trajectory's second derivative has norm at
   // most radius * angle^2 + 2 * abs(angle) * localDeformation. Linear
   // interpolation error is <= M/8. Therefore
   // this endpoint hull plus the disk 'error' encloses every intermediate
   // rotated point, including arcs outside the endpoint hull. Translation is
   // linear and adds no error. Height uses the complete interval.
   const x0=Math.min(...poly.map(p=>p[0]))-error,x1=Math.max(...poly.map(p=>p[0]))+error,z0=Math.min(...poly.map(p=>p[1]))-error,z1=Math.max(...poly.map(p=>p[1]))+error;
   for(const solid of solids){if(y1<solid[1]||y0>solid[4]||x1<solid[0]||x0>solid[3]||z1<solid[2]||z0>solid[5])continue;if(!separated(poly,solid,error))return false;}
  }
 }return true;
}
