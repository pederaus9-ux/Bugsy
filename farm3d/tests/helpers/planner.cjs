'use strict';
// Pure bounded candidate: no application imports, callbacks, movement or persistence.
const PAD=.42,CORNER=.005,MAX_OBSTACLES=256,MAX_VISITS=8192;
const finite=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e6;
const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
function local(o,p){const dx=p[0]-o.x,dz=p[1]-o.z;return[dx*o.c+dz*o.s,-dx*o.s+dz*o.c];}
function pointBlocked(o,p){const [x,z]=local(o,p);return o.radius!==undefined?Math.hypot(x,z)<o.radius+PAD-1e-8:Math.abs(x)<o.hw+PAD&&Math.abs(z)<o.hd+PAD;}
// Full .42 box sweep, deliberately stricter than source hitsBlock's .37 sweep.
function segmentBlocked(o,a,b){
 const A=local(o,a),B=local(o,b),dx=B[0]-A[0],dz=B[1]-A[1];
 if(o.radius!==undefined){const u=Math.max(0,Math.min(1,-(A[0]*dx+A[1]*dz)/(dx*dx+dz*dz||1)));return Math.hypot(A[0]+dx*u,A[1]+dz*u)<o.radius+PAD-1e-8;}
 let lo=0,hi=1;for(const [p,d,h]of [[A[0],dx,o.hw+PAD],[A[1],dz,o.hd+PAD]]){if(Math.abs(d)<1e-12){if(Math.abs(p)>=h)return false;}else{let u=(-h-p)/d,v=(h-p)/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>=hi)return false;}}return lo<hi;
}
function createRepair(input,{maxVisits=MAX_VISITS}={}){
 if(!Number.isSafeInteger(maxVisits)||maxVisits<0||maxVisits>MAX_VISITS)throw Error('invalid budget');
 let total=0,result=null;
 function* work(){
  if(!input||!point(input.from)||!point(input.to)||!Array.isArray(input.obstacles)||input.obstacles.length>MAX_OBSTACLES)return{status:'invalid'};
  const from=[...input.from],to=[...input.to],p=input.pen;
  if(!p||![p.minX,p.maxX,p.minZ,p.maxZ].every(finite)||p.maxX-p.minX<2*PAD||p.maxZ-p.minZ<2*PAD)return{status:'invalid'};
  const pen={...p},inside=v=>v[0]>=pen.minX+PAD&&v[0]<=pen.maxX-PAD&&v[1]>=pen.minZ+PAD&&v[1]<=pen.maxZ-PAD;
  if(!inside(from)||!inside(to))return{status:'no-route'};
  const obs=[],count=input.obstacles.length;for(let index=0;index<count;index++){
   if(input.obstacles.length!==count)return{status:'invalid'};const o=input.obstacles[index];
   if(!o||![o.x,o.z,o.hw,o.hd,o.c,o.s].every(finite)||o.hw<=0||o.hd<=0||Math.abs(o.c*o.c+o.s*o.s-1)>1e-10||o.radius!==undefined&&(!finite(o.radius)||o.radius<=0))return{status:'invalid'};
   obs.push({x:o.x,z:o.z,hw:o.hw,hd:o.hd,c:o.c,s:o.s,...(o.radius!==undefined?{radius:o.radius}:{})});yield 1;
  }
  if(input.obstacles.length!==count)return{status:'invalid'};
  let blocker=null;for(const o of obs){if(pointBlocked(o,from)||pointBlocked(o,to))return{status:'no-route'};if(!blocker&&segmentBlocked(o,from,to))blocker=o;yield 1;}
  if(!blocker)return{status:'path',path:[to],snapshot:obs,from,to,pen};
  if(blocker.radius!==undefined)return{status:'unsupported'};
  const nodes=[from,to];for(const [sx,sz]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=sx*(blocker.hw+PAD+CORNER),z=sz*(blocker.hd+PAD+CORNER);nodes.push([blocker.x+x*blocker.c-z*blocker.s,blocker.z+x*blocker.s+z*blocker.c]);}
  const valid=[true,true];for(let i=2;i<6;i++){valid[i]=inside(nodes[i]);if(valid[i])for(const o of obs){const bad=pointBlocked(o,nodes[i]);yield 1;if(bad){valid[i]=false;break;}}}
  const edges=Array.from({length:6},()=>Array(6).fill(Infinity));
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(valid[i]&&valid[j]){
   let clear=true;for(const o of obs){const bad=segmentBlocked(o,nodes[i],nodes[j]);yield 1;if(bad){clear=false;break;}}
   if(clear)edges[i][j]=edges[j][i]=Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1]);
  }
  const dist=[0,...Array(5).fill(Infinity)],prev=Array(6).fill(-1),done=Array(6).fill(false);
  for(let k=0;k<6;k++){let u=-1;for(let i=0;i<6;i++)if(!done[i]&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u])||u===1)break;done[u]=true;for(let v=0;v<6;v++){const d=dist[u]+edges[u][v];if(!done[v]&&d<dist[v]){dist[v]=d;prev[v]=u;}}}
  if(prev[1]<0)return{status:'no-route'};
  const path=[];for(let v=1;v>0;v=prev[v])path.unshift(nodes[v]);
  return{status:'path',path,snapshot:obs,from,to,pen};
 }
 const iterator=work();
 return{step(budget){if(!Number.isSafeInteger(budget)||budget<0||budget>512)throw Error('invalid slice');let used=0;while(!result&&used<budget){if(total>=maxVisits){result={status:'budget'};break;}const r=iterator.next();if(r.done){result=r.value;break;}used++;total++;}return{done:!!result,used,total,result:result?{...result,visits:total}:null};}};
}
module.exports={createRepair,pointBlocked,segmentBlocked,MAX_OBSTACLES,MAX_VISITS};
