// Pure x/z geometry shared by pen validation, containment and directed movement.
// Distances are metres. EPS handles arithmetic noise, never animal clearance.
const EPS=1e-9;
const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
export function polygonArea(poly){if(!Array.isArray(poly)||poly.length<3||!poly.every(finite))return 0;return Math.abs(signedArea(poly));}
function signedArea(p){return p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;}
export function pointSegmentDistance(p,a,b){const d=sub(b,a),n=dot(d,d),t=n?Math.max(0,Math.min(1,dot(sub(p,a),d)/n)):0;return Math.hypot(p[0]-a[0]-d[0]*t,p[1]-a[1]-d[1]*t);}
function project(p,a,b){const d=sub(b,a),n=dot(d,d),t=n?Math.max(0,Math.min(1,dot(sub(p,a),d)/n)):0;return[a[0]+t*d[0],a[1]+t*d[1]];}
function valid(poly){return Array.isArray(poly)&&poly.length>=3&&poly.every(finite)&&polygonArea(poly)>EPS;}
export function pointInPolygon(point,poly,pad=0){
 if(!finite(point)||!valid(poly)||!Number.isFinite(pad))return false;
 let inside=false,min=Infinity;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];min=Math.min(min,pointSegmentDistance(point,a,b));
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 if(pad<0)return inside||min<=-pad+EPS;
 return (inside||min<=EPS)&&min+EPS>=pad;
}
// All intersection parameters, including collinear endpoint contacts.
function cuts(a,b,c,d){
 const r=sub(b,a),s=sub(d,c),q=sub(c,a),den=cross(r,s),rr=dot(r,r);
 if(Math.abs(den)>EPS){const t=cross(q,s)/den,u=cross(q,r)/den;return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?[Math.max(0,Math.min(1,t))]:[];}
 if(Math.abs(cross(q,r))>EPS||rr<EPS)return [];
 return[c,d].map(p=>dot(sub(p,a),r)/rr).filter(t=>t>=-EPS&&t<=1+EPS).map(t=>Math.max(0,Math.min(1,t)));
}
export function segmentDistance(a,b,c,d){if(cuts(a,b,c,d).length||cuts(c,d,a,b).length)return 0;return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));}
function lineIntersection(a,b,c,d){const r=sub(b,a),s=sub(d,c),den=cross(r,s);if(Math.abs(den)<EPS)return null;const t=cross(sub(c,a),s)/den;return[a[0]+r[0]*t,a[1]+r[1]*t];}
function circleCuts(a,b,c,r){const v=sub(b,a),q=sub(a,c),A=dot(v,v),B=2*dot(q,v),C=dot(q,q)-r*r,disc=B*B-4*A*C;if(A<EPS||disc<-EPS)return [];const root=Math.sqrt(Math.max(0,disc));return[(-B-root)/(2*A),(-B+root)/(2*A)];}
export function segmentInPolygon(a,b,poly,pad=0){
 if(!finite(a)||!finite(b)||!valid(poly)||!Number.isFinite(pad)||!pointInPolygon(a,poly,pad)||!pointInPolygon(b,poly,pad))return false;
 const ts=[0,1],v=sub(b,a);
 for(let i=0;i<poly.length;i++){
  const c=poly[i],d=poly[(i+1)%poly.length];ts.push(...cuts(a,b,c,d));
  if(pad>0&&segmentDistance(a,b,c,d)<pad-EPS)return false;
  if(pad<0){
   ts.push(...circleCuts(a,b,c,-pad));const e=sub(d,c),len=Math.hypot(...e),n=len?[-e[1]/len,e[0]/len]:[0,0];
   for(const sign of [-1,1]){const o=n.map(x=>x*(-pad)*sign),p=lineIntersection(a,b,[c[0]+o[0],c[1]+o[1]],[d[0]+o[0],d[1]+o[1]]);if(p&&dot(v,v)>EPS)ts.push(dot(sub(p,a),v)/dot(v,v));}
  }
 }
 const sorted=ts.filter(t=>t>=0&&t<=1).sort((x,y)=>x-y);
 for(let i=1;i<sorted.length;i++){const t=(sorted[i-1]+sorted[i])/2;if(!pointInPolygon([a[0]+v[0]*t,a[1]+v[1]*t],poly,pad))return false;}
 return true;
}
export function nearestLegalPoint(point,poly,pad=0){
 if(!finite(point)||!valid(poly)||!Number.isFinite(pad))return null;
 if(pointInPolygon(point,poly,pad))return [...point];
 const candidates=[],lines=[],sign=Math.sign(signedArea(poly)),r=Math.abs(pad);
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],d=sub(b,a),len=Math.hypot(...d);if(len<EPS)continue;
  const n=[-d[1]/len*sign,d[0]/len*sign],c=[a[0]+n[0]*pad,a[1]+n[1]*pad],e=[b[0]+n[0]*pad,b[1]+n[1]*pad];lines.push([c,e]);candidates.push(project(point,c,e),c,e);
  const v=sub(point,a),dist=Math.hypot(...v);if(dist>EPS)candidates.push([a[0]+v[0]/dist*r,a[1]+v[1]/dist*r]);
 }
 for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){const p=lineIntersection(...lines[i],...lines[j]);if(p)candidates.push(p);}
 if(r>0){for(const [a,b]of lines)for(const c of poly){const v=sub(b,a);for(const t of circleCuts(a,b,c,r))candidates.push([a[0]+v[0]*t,a[1]+v[1]*t]);}
  for(let i=0;i<poly.length;i++)for(let j=i+1;j<poly.length;j++){const a=poly[i],b=poly[j],d=Math.hypot(...sub(b,a));if(d<EPS||d>2*r+EPS)continue;const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],h=Math.sqrt(Math.max(0,r*r-d*d/4)),n=[-(b[1]-a[1])/d,(b[0]-a[0])/d];for(const s of [-1,1])candidates.push([mid[0]+s*n[0]*h,mid[1]+s*n[1]*h]);}
 }
 let best=null,dist=Infinity;for(const p of candidates)if(pointInPolygon(p,poly,pad)){const d=Math.hypot(...sub(p,point));if(d<dist-EPS){best=p;dist=d;}}
 return best;
}
