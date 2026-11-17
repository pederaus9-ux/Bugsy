'use strict';
const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const PRE='40a2bbcef45e5a29f463768937ef849a8aff53075d7820fba613d5064e5a294c';
function observe(a,task,ox,oz,desiredX,desiredZ,next,accepted,blockingCount,branch,dt,t){
 try{
  if(window.__cowBoundaryFirst.center!==null&&window.__cowBoundaryFirst.inset!==null)return;
  if(COW_YARD_LAYOUT.custom)return;
  const poly=PENS.courtyard.poly;
  if(!Array.isArray(poly)||poly.length!==4)throw Error();
  // Allocation-free ordinary-step prefilter; read the current polygon, never cache geometry.
  let beforeDepth=Infinity,afterDepth=Infinity,area=0;
  const finalX=a.g.position.x,finalZ=a.g.position.z;
  if(!Number.isFinite(ox)||!Number.isFinite(oz)||!Number.isFinite(finalX)||!Number.isFinite(finalZ))throw Error();
  for(let i=0;i<4;i++){
   const u=poly[i],v=poly[(i+1)%4];
   if(!Array.isArray(u)||u.length!==2||!Array.isArray(v)||v.length!==2||!Number.isFinite(u[0])||!Number.isFinite(u[1])||!Number.isFinite(v[0])||!Number.isFinite(v[1]))throw Error();
   const ex=v[0]-u[0],ez=v[1]-u[1],l=Math.hypot(ex,ez);
   if(!(l>0)||!Number.isFinite(l)||(ex!==0&&ez!==0))throw Error();
   area+=u[0]*v[1]-v[0]*u[1];
   beforeDepth=Math.min(beforeDepth,(ex*(oz-u[1])-ez*(ox-u[0]))/l);
   afterDepth=Math.min(afterDepth,(ex*(finalZ-u[1])-ez*(finalX-u[0]))/l);
  }
  if(!(area>0)||!Number.isFinite(area))throw Error();
  const centerCross=window.__cowBoundaryFirst.center===null&&beforeDepth>=0&&afterDepth<0,insetCross=window.__cowBoundaryFirst.inset===null&&beforeDepth>=.42&&afterDepth<.42;
  if(!centerCross&&!insetCross)return;
  const num=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e7;
  const pt=p=>Array.isArray(p)&&p.length===2&&p.every(num);
  if(!poly.every(pt))throw Error();
  const desired=[desiredX,desiredZ];
  const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]),bounds=[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)];
  const [x0,x1,z0,z1]=bounds;
  if(!(x0<x1&&z0<z1)||new Set(poly.map(p=>p.join(','))).size!==4||!poly.every(p=>(p[0]===x0||p[0]===x1)&&(p[1]===z0||p[1]===z1)))throw Error();
  const inside=(p,m)=>poly.every(([ax,az],i)=>{const [bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,l=Math.hypot(ex,ez);return (ex*(p[1]-az)-ez*(p[0]-ax))/l>=m;});
  const before=[ox,oz],preferred=[next.x,next.y],final=[a.g.position.x,a.g.position.z];
  if(![before,desired,preferred,final].every(pt))throw Error();
  // Separate diagnostic thresholds; original game assertion remains -0.05 m.
  const id=n=>Number.isInteger(n)&&n>=0&&n<64;
  const state=a.cowSpace||{},neighborId=state.id??null;
  if(!id(a.ref.i)||(neighborId!==null&&!id(neighborId))||!Array.isArray(animals)||animals.length>64)throw Error();
  let neighbor=null,matches=0;
  for(const b of animals)if(b!==a&&b.kind==='cow'&&!b.gone&&b.ref.i===neighborId){matches++;neighbor=[b.g.position.x,b.g.position.z];}
  if(matches>1||(neighbor!==null&&!pt(neighbor)))throw Error();
  const time=n=>n===undefined||n===null?null:(num(n)?n:(()=>{throw Error();})());
  const route=task.path||[];
  if(!Array.isArray(route)||route.length>4096)throw Error();
  const routeHead=route.slice(0,4).map(p=>[p.x,p.y]);
  if(!routeHead.every(pt)||!['bed','feed','drink','robot'].includes(task.kind)||!['approach','exit'].includes(task.stage)||!num(t)||!num(dt)||dt<0||!Number.isInteger(blockingCount)||blockingCount<0||blockingCount>64||![-1,0,1].includes(state.side??0))throw Error();
  for(const [slot,tolerance,cross] of [['center',0,centerCross],['inset',.42,insetCross]])if(cross)window.__cowBoundaryFirst[slot]={schema:1,kind:'first-committed-care-boundary-crossing',cow:a.ref.i,commit:true,clock:t,dt,before,desired,preferred,final,bounds,polygon:poly.map(p=>[p[0],p[1]]),tolerance,branch,task:task.kind,stage:task.stage,normalAccepted:accepted,cowClear:blockingCount===0,gateClear:blockingCount===0?accepted:null,blockingCount,desiredInside:inside(desired,tolerance),preferredInside:inside(preferred,tolerance),finalInsetInside:inside(final,.42),neighborId,neighbor,space:{side:state.side??0,since:time(state.since),until:time(state.until),redirectUntil:time(state.redirectUntil)},routeCount:route.length,route:routeHead};
 }catch{try{const v=window.__cowBoundaryFirst;if(v?.schema===2){if(v.center===null)v.center={schema:0,kind:'invalid-observation'};if(v.inset===null)v.inset={schema:0,kind:'invalid-observation'};}else window.__cowBoundaryFirst={schema:0,kind:'invalid-observation'};}catch{}}
}
const intro='/* A52 FIRST BOUNDARY OBSERVER BEGIN */\nwindow.__cowBoundaryFirst={schema:2,center:null,inset:null};\nconst __a52ObserveCowBoundary='+observe.toString()+';\n/* A52 FIRST BOUNDARY OBSERVER END */\n';
const changes=[
 ['function updateCowTaskStep(a,dt,t){',intro+'function updateCowTaskStep(a,dt,t){'],
 ["      if(typeof steerCowPersonalSpace==='function'){ // personal-space cushion on care trips too", "      const __a52DesiredX=ox+nx,__a52DesiredZ=oz+nz;let __a52Branch='blocked';\n      if(typeof steerCowPersonalSpace==='function'){ // personal-space cushion on care trips too"],
 ["      if(!blockingCows.length&&cowGateSegmentClear(a.pos,next)){a.g.position.x=next.x;a.g.position.z=next.y;}","      const __a52Accepted=!blockingCows.length&&cowGateSegmentClear(a.pos,next);\n      if(__a52Accepted){a.g.position.x=next.x;a.g.position.z=next.y;__a52Branch='normal';}"],
 ["            if(clear){a.g.position.x=x;a.g.position.z=z;task.avoidSide=sign;break;}","            if(clear){a.g.position.x=x;a.g.position.z=z;task.avoidSide=sign;__a52Branch='lateral';break;}"],
 ["      // Finish the final robot approach physically:","      __a52ObserveCowBoundary(a,task,ox,oz,__a52DesiredX,__a52DesiredZ,next,__a52Accepted,blockingCows.length,__a52Branch,dt,t);\n      // Finish the final robot approach physically:"]
];
function replaceOnce(s,a,b){if(s.split(a).length!==2)throw Error('source occurrence');return s.replace(a,b);}
function patch(input){const b=Buffer.from(input);if(hash(b)!==PRE)throw Error('preimage');let s=b.toString();for(const [a,c]of changes)s=replaceOnce(s,a,c);return Buffer.from(s);}
function inverse(input){let s=Buffer.from(input).toString();for(const [a,c]of [...changes].reverse())s=replaceOnce(s,c,a);const b=Buffer.from(s);if(hash(b)!==PRE)throw Error('inverse');return b;}
function validateEvent(e){
 if(e===null)return true;
 if(!e||Object.keys(e).sort().join('|')!=='before|blockingCount|bounds|branch|clock|commit|cow|cowClear|desired|desiredInside|dt|final|finalInsetInside|gateClear|kind|neighbor|neighborId|normalAccepted|polygon|preferred|preferredInside|route|routeCount|schema|space|stage|task|tolerance')return false;
 const n=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e7,p=x=>Array.isArray(x)&&x.length===2&&x.every(n),id=x=>Number.isInteger(x)&&x>=0&&x<64;
 if(e.commit!==true||e.schema!==1||e.kind!=='first-committed-care-boundary-crossing'||!id(e.cow)||!n(e.clock)||!n(e.dt)||e.dt<0||![e.before,e.desired,e.preferred,e.final].every(p)||!Array.isArray(e.bounds)||e.bounds.length!==4||!e.bounds.every(n)||![0,.42].includes(e.tolerance)||!['normal','lateral','blocked'].includes(e.branch)||!['bed','feed','drink','robot'].includes(e.task)||!['approach','exit'].includes(e.stage)||!Number.isInteger(e.blockingCount)||e.blockingCount<0||e.blockingCount>64)return false;
 if(!Array.isArray(e.polygon)||e.polygon.length!==4||!e.polygon.every(p))return false;
 const poly=e.polygon,[x0,x1,z0,z1]=e.bounds,inside=(p,m)=>poly.every(([ax,az],i)=>{const [bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,l=Math.hypot(ex,ez);return (ex*(p[1]-az)-ez*(p[0]-ax))/l>=m;});
 if(new Set(poly.map(p=>p.join(','))).size!==4||!poly.every(p=>(p[0]===x0||p[0]===x1)&&(p[1]===z0||p[1]===z1)))return false;
 let area=0;for(let i=0;i<4;i++){const a=poly[i],b=poly[(i+1)%4],dx=b[0]-a[0],dz=b[1]-a[1];if((dx===0)===(dz===0))return false;area+=a[0]*b[1]-b[0]*a[1];}if(!(area>0))return false;
 if(!(x0<x1&&z0<z1)||!inside(e.before,e.tolerance)||inside(e.final,e.tolerance)||e.desiredInside!==inside(e.desired,e.tolerance)||e.preferredInside!==inside(e.preferred,e.tolerance)||e.finalInsetInside!==inside(e.final,.42)||typeof e.normalAccepted!=='boolean'||e.cowClear!==(e.blockingCount===0)||e.gateClear!==(e.cowClear?e.normalAccepted:null))return false;
 if((e.branch==='normal')!==e.normalAccepted||e.branch==='blocked'||(e.neighborId!==null&&!id(e.neighborId))||(e.neighbor!==null&&!p(e.neighbor)))return false;
 if(!e.space||Object.keys(e.space).sort().join('|')!=='redirectUntil|side|since|until'||![-1,0,1].includes(e.space.side)||!['since','until','redirectUntil'].every(k=>e.space[k]===null||n(e.space[k])))return false;
 return Number.isInteger(e.routeCount)&&e.routeCount>=0&&e.routeCount<=4096&&Array.isArray(e.route)&&e.route.length===Math.min(e.routeCount,4)&&e.route.every(p)&&Buffer.byteLength(JSON.stringify(e))<=4096;
}
function validate(v){return !!v&&Object.keys(v).sort().join('|')==='center|inset|schema'&&v.schema===2&&validateEvent(v.center)&&validateEvent(v.inset)&&(v.center===null||v.center.tolerance===0)&&(v.inset===null||v.inset.tolerance===.42)&&Buffer.byteLength(JSON.stringify(v))<=8192;}
const provenance={path:'farm3d/index.html',preimageSha256:PRE,postimageSha256:'0dd7af769aa48639ab2d95892a359d5c81ae7309bd4ab0993e4a64c9f561baae',postimageBlob:'71af498d50406e36ea41534e2b28d63662b47aec'};
module.exports={patch,inverse,validate,validateEvent,provenance,observe,changes};
