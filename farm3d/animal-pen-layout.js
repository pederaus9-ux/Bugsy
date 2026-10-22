import {PEN_TEMPLATES,freezePenData} from './animal-pen-templates.js?v=1';
import {polygonArea,pointInPolygon,pointSegmentDistance} from './animal-pen-geometry.js?v=1';
/** @typedef {'chicken'|'cow'|'horse'|'sheep'|'dog'|'cat'} Kind */
/** @typedef {[number,number]} Point2 */
/** @typedef {[number,number,number]} Point3 */
/** @typedef {{code:string,kind:Kind|null,target:string|null,message:string}} Issue */
/** @typedef {{template:string,boundary?:{id:string,x:number,z:number}[],runs?:{id:string,a:Point2,b:Point2}[],gates?:{id:string,edge:[string,string]|null,run:string|null,offset:number,width:number}[],structures:Record<string,Point2>}} SiteRecord */
/** @typedef {{v:1,revision:number,sites:Partial<Record<Kind,SiteRecord>>}} AnimalPens */
const clone=x=>structuredClone(x),ID=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/,MAX_BYTES=32768;
const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const exact=(x,allowed)=>obj(x)&&Object.keys(x).every(k=>allowed.includes(k));
const coord=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=128;
const point=x=>Array.isArray(x)&&x.length===2&&x.every(coord);
const identity=x=>typeof x==='string'&&ID.test(x);
const issue=(code,kind,target,message)=>({code,kind,target,message});
function gateEndpoints(kind){
 const b=PEN_TEMPLATES[kind].baseline;
 if(!b.polygon)return [];
 if(kind==='chicken')return[[[-6.8,5],[-5.3,5]]];
 if(kind==='cow')return[[[-4.4,-32.8],[-2.1,-32.8]]];
 return b.gates.map(g=>[g.a,g.b]);
}
/** The first customized edit starts from these exact accepted world coordinates. */
export function defaultSiteRecord(kind){
 const t=PEN_TEMPLATES[kind];if(!t)throw new TypeError('Unknown animal pen');
 const r={template:t.id,structures:Object.fromEntries(Object.entries(t.components).map(([id,c])=>[id,[...c.origin]]))};
 if(t.baseline.polygon){r.boundary=t.baseline.polygon.map(([x,z],i)=>({id:'v'+i,x,z}));r.runs=[];r.gates=gateEndpoints(kind).map(([a,b],i)=>{
  const p=t.baseline.polygon,edge=p.findIndex((v,j)=>pointSegmentDistance(a,v,p[(j+1)%p.length])<.002&&pointSegmentDistance(b,v,p[(j+1)%p.length])<.002);
  const v=p[edge],d=p[(edge+1)%p.length],len=Math.hypot(d[0]-v[0],d[1]-v[1]),offset=Math.min(...[a,b].map(q=>((q[0]-v[0])*(d[0]-v[0])+(q[1]-v[1])*(d[1]-v[1]))/len));
  return{id:'gate'+i,edge:['v'+edge,'v'+((edge+1)%p.length)],run:null,offset,width:Math.hypot(b[0]-a[0],b[1]-a[1])};
 });}
 return r;
}
/** Decode bounded records without mutating, normalizing or discarding unknown data. */
export function decodeAnimalPens(raw){
 if(raw===undefined)return{status:'ok',value:undefined};
 const invalid=(message,kind=null,target=null)=>({status:'invalid',issues:[issue('SCHEMA',kind,target,message)]});
 if(!obj(raw))return invalid('Animal layout must be an object.');
 if(Number.isInteger(raw.v)&&raw.v>1)return{status:'readonly',raw,reason:'This animal layout needs a newer game.'};
 if(obj(raw.sites))for(const [kind,s]of Object.entries(raw.sites))if(Object.hasOwn(PEN_TEMPLATES,kind)&&obj(s)&&typeof s.template==='string'&&s.template!==PEN_TEMPLATES[kind].id)return{status:'readonly',raw,reason:'This animal building template needs a newer game.'};
 let bytes;try{bytes=new TextEncoder().encode(JSON.stringify(raw)).length;}catch{return invalid('Animal layout cannot be serialized.');}
 if(bytes>MAX_BYTES)return{status:'invalid',issues:[issue('LIMIT',null,null,'Animal layout exceeds 32 KiB.')]};
 if(!exact(raw,['v','revision','sites'])||raw.v!==1||!Number.isSafeInteger(raw.revision)||raw.revision<0||!obj(raw.sites))return invalid('Invalid animal layout version or revision.');
 for(const [kind,s]of Object.entries(raw.sites)){
  if(!Object.hasOwn(PEN_TEMPLATES,kind))return invalid('Unknown animal owner.');
  const t=PEN_TEMPLATES[kind],pen=!!t.baseline.polygon,keys=Object.keys(t.components);
  if(!exact(s,pen?['template','boundary','runs','gates','structures']:['template','structures'])||s.template!==t.id||!obj(s.structures)||Object.keys(s.structures).length!==keys.length||keys.some(id=>!Object.hasOwn(s.structures,id)||!point(s.structures[id])))return invalid('Invalid building positions.',kind);
  if(!pen)continue;
  if(!Array.isArray(s.boundary)||s.boundary.length<3||s.boundary.length>24||!Array.isArray(s.runs)||s.runs.length>24||!Array.isArray(s.gates)||s.gates.length<1||s.gates.length>4)return invalid('Invalid fence or gate count.',kind);
  const seen=new Set(),unique=id=>identity(id)&&!seen.has(id)&&!!seen.add(id);
  for(const v of s.boundary)if(!exact(v,['id','x','z'])||!unique(v.id)||!coord(v.x)||!coord(v.z))return invalid('Invalid or duplicate fence post.',kind);
  for(const r of s.runs)if(!exact(r,['id','a','b'])||!unique(r.id)||!point(r.a)||!point(r.b))return invalid('Invalid or duplicate interior fence.',kind);
  for(const g of s.gates)if(!exact(g,['id','edge','run','offset','width'])||!unique(g.id)||!(g.edge===null&&identity(g.run)||g.run===null&&Array.isArray(g.edge)&&g.edge.length===2&&g.edge.every(identity))||!Number.isFinite(g.offset)||g.offset<0||!Number.isFinite(g.width)||g.width<=0||g.width>256)return invalid('Invalid or duplicate gate.',kind);
  if(!s.gates.some(g=>g.edge!==null))return invalid('Keep an exterior gate.',kind);
 }
 return{status:'ok',value:clone(raw)};
}
const p2=(p,d)=>[p[0]+d[0],p[1]+d[1]],p3=(p,d)=>[p[0]+d[0],p[1],p[2]+d[1]];
function stationOwner(kind,s){if(kind==='chicken')return s.kind==='bed'?'coop':s.kind==='feed'?'feeder':'waterer';if(kind==='cow')return s.kind==='bed'?'shelter':s.kind==='feed'?'feedBunk':s.kind==='drink'?'trough':'robot';return kind==='horse'||kind==='sheep'?'shelter':'nook';}
function moveStation(s,d){const r=clone(s);for(const k of ['dock','approach','contact'])if(r[k])r[k]=p3(r[k],d);if(r.path)r.path=r.path.map(p=>p3(p,d));return r;}
function cutFence(a,b,gaps){const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)return[];const v=[(b[0]-a[0])/len,(b[1]-a[1])/len],parts=[];let start=0;for(const g of [...gaps].sort((x,y)=>x.offset-y.offset)){if(g.offset>start)parts.push([start,g.offset]);start=Math.max(start,g.offset+g.width);}if(start<len)parts.push([start,len]);return parts.map(([l,r])=>[a[0]+v[0]*l,a[1]+v[1]*l,a[0]+v[0]*r,a[1]+v[1]*r]);}
function resolveSite(kind,s){
 const t=PEN_TEMPLATES[kind],b=t.baseline,custom=!!s,record=s||defaultSiteRecord(kind),issues=[],components={};
 for(const [id,c]of Object.entries(t.components)){const origin=record.structures[id],delta=[origin[0]-c.origin[0],origin[1]-c.origin[1]];components[id]={origin:[...origin],delta,footprint:c.footprint.map(p=>p2(p,delta)),hitBounds:c.footprint.map(p=>p2(p,delta)),volumes:(c.volumes||[]).map(b=>[b[0]+delta[0],b[1],b[2]+delta[1],b[3]+delta[0],b[4],b[5]+delta[1]]),lightingAnchors:[]};}
 const stations=b.stations.map(s=>moveStation(s,components[stationOwner(kind,s)].delta)),stationOwners=Object.fromEntries(stations.map(s=>[s.id,stationOwner(kind,s)]));
 const polygon=b.polygon?(custom?record.boundary.map(v=>[v.x,v.z]):clone(b.polygon)):null;
 const obstacles=b.obstacles.map((o,i)=>{const id=Object.keys(t.components).find(id=>t.components[id].obstacleIndices.includes(i));if(!id)throw Error('Unowned template obstacle '+kind+'/'+i);const d=components[id].delta;return[o[0]+d[0],o[1]+d[1],...o.slice(2)];});
 const gates=[],fenceSegments=[];
 if(polygon){const edges=record.boundary.map((v,i)=>({id:[v.id,record.boundary[(i+1)%record.boundary.length].id],a:[v.x,v.z],b:[record.boundary[(i+1)%record.boundary.length].x,record.boundary[(i+1)%record.boundary.length].z]})),runs=record.runs;
  for(const g of record.gates){const edge=g.edge?edges.find(e=>e.id[0]===g.edge[0]&&e.id[1]===g.edge[1]):runs.find(r=>r.id===g.run);if(!edge){issues.push(issue('GEOMETRY',kind,g.id,'Place the gate on an existing edge or fence.'));continue;}const a=edge.a,b=edge.b,len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<1e-9||g.offset+g.width>len+1e-8){issues.push(issue('GEOMETRY',kind,g.id,'The gate must fit its fence.'));continue;}
   const d=[(b[0]-a[0])/len,(b[1]-a[1])/len],from=[a[0]+d[0]*g.offset,a[1]+d[1]*g.offset],to=[from[0]+d[0]*g.width,from[1]+d[1]*g.width],mid=[(from[0]+to[0])/2,(from[1]+to[1])/2],n=[-d[1],d[0]],reach=Math.max(1,t.margin*2+.2);let inside=[mid[0]+n[0]*reach,0,mid[1]+n[1]*reach],outside=[mid[0]-n[0]*reach,0,mid[1]-n[1]*reach];if(g.edge&&!pointInPolygon([inside[0],inside[2]],polygon))[inside,outside]=[outside,inside];gates.push({...clone(g),inside,outside,segment:[...from,...to]});
  }
  const original=defaultSiteRecord(kind),sameFence=custom&&JSON.stringify(record.boundary)===JSON.stringify(original.boundary)&&JSON.stringify(record.runs)===JSON.stringify(original.runs)&&JSON.stringify(record.gates)===JSON.stringify(original.gates);
  if(custom&&!sameFence){for(const e of edges)fenceSegments.push(...cutFence(e.a,e.b,record.gates.filter(g=>g.edge?.[0]===e.id[0]&&g.edge[1]===e.id[1]&&gates.some(a=>a.id===g.id))));for(const r of runs)fenceSegments.push(...cutFence(r.a,r.b,record.gates.filter(g=>g.run===r.id&&gates.some(a=>a.id===g.id))));}else fenceSegments.push(...clone(b.fenceSegments));
 }
 const accesses=(b.accesses&&kind==='chicken'?b.accesses:[]).map(a=>{const r=clone(a),d=components.coop.delta;for(const k of ['rampStart','rampEnd','entry','outside'])r[k]=p3(r[k],d);return r;});
 const supports=stations.filter(s=>s.kind==='bed').map(s=>({id:s.id,component:stationOwners[s.id],dock:clone(s.dock),height:s.surface??b.bedSurface??0,size:kind==='chicken'?[.55,.55]:kind==='cow'?[3.3,3]:clone(b.bedSize)}));
 const approaches=stations.map(s=>({id:s.id,point:clone(s.approach)})),waiting=(b.turnouts||b.stations.filter(s=>s.kind==='bed').map(s=>s.approach)).map(p=>p3(p,components[kind==='chicken'?'coop':kind==='cow'?'shelter':polygon?'shelter':'nook'].delta));
 const points=[...(polygon||[]),...Object.values(components).flatMap(c=>c.footprint)],xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),footprint=[[Math.min(...xs),Math.min(...zs)],[Math.max(...xs),Math.min(...zs)],[Math.max(...xs),Math.max(...zs)],[Math.min(...xs),Math.max(...zs)]];
 const result={kind,template:t.id,custom,polygon,boundary:clone(record.boundary??null),runs:clone(record.runs??[]),gateRecords:clone(record.gates??[]),components,stations,stationOwners,obstacles,fenceSegments,gates,supports,approaches,waiting,footprint,accesses,issues};
 if(b.robot){result.robot=Object.fromEntries(Object.entries(b.robot).map(([k,p])=>[k,p3(p,components.robot.delta)]));result.tank=p3(b.tank,components.robot.delta);}
 return result;
}
/** Derive rendering, contact, support and movement coordinates from one revision. */
export function resolveAnimalPens(value){const decoded=decodeAnimalPens(value);if(decoded.status!=='ok')throw new TypeError(decoded.status==='readonly'?decoded.reason:decoded.issues[0].message);return freezePenData({revision:decoded.value?.revision??0,sites:Object.fromEntries(Object.keys(PEN_TEMPLATES).map(kind=>[kind,resolveSite(kind,decoded.value?.sites[kind])]))});}

/** Adapter to existing public yard contracts. Rendering and care consume the same revision. */
export function animalPenYardLayout(site){
 const t=PEN_TEMPLATES[site.kind],b=clone(t.baseline),main=site.components[site.kind==='chicken'?'coop':site.kind==='cow'||site.polygon?'shelter':'nook'].delta;
 Object.assign(b,{polygon:clone(site.polygon),footprint:clone(site.footprint),stations:clone(site.stations),obstacles:clone(site.obstacles),fenceSegments:clone(site.fenceSegments),custom:true,revision:site.revision});
 if(b.bed){b.bed[0]+=main[0];b.bed[1]+=main[1];}
 if(b.turnouts)b.turnouts=b.turnouts.map(p=>p3(p,main));
 if(b.shelter){if(Array.isArray(b.shelter.x)){b.shelter.x=b.shelter.x.map(x=>x+main[0]);b.shelter.z=b.shelter.z.map(z=>z+main[1]);}else{b.shelter.x+=main[0];b.shelter.z+=main[1];}}
 if(b.water){const d=site.components[site.kind==='cow'?'trough':'waterer'].delta;b.water[0]+=d[0];b.water[1]+=d[1];}
 if(site.kind==='chicken')b.accesses=clone(site.accesses);
 if(site.robot){b.robot=clone(site.robot);b.tank=clone(site.tank);}
 b.gates=site.gates.map(g=>({id:g.id,a:g.segment.slice(0,2),b:g.segment.slice(2),width:g.width,inside:clone(g.inside),outside:clone(g.outside)}));
 if(b.gates.length){const g=b.gates[0];b.gate=[Math.min(g.a[0],g.b[0]),Math.max(g.a[0],g.b[0])];b.accesses=site.kind==='chicken'?b.accesses:b.gates.map(g=>{const dx=g.b[0]-g.a[0],dz=g.b[1]-g.a[1],len=Math.hypot(dx,dz),normal=[-dz/len,dx/len],points=[g.a,g.b].flatMap(p=>[-2.5,2.5].map(n=>[p[0]+normal[0]*n,p[1]+normal[1]*n]));return[Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];});if(site.kind==='cow')b.access=[b.gate[0],b.gate[1],Math.min(g.inside[2],g.outside[2])-1,Math.max(g.inside[2],g.outside[2])+1];}
 return b;
}
