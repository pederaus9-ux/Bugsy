import {PEN_TEMPLATES} from './animal-pen-templates.js?v=1';
import {NORTH_EXTENSION,WEST_CLEARING,NORTH_LEVEL_BUILD_CLEARING,MAP_EDGE} from './farm-land.js?v=5';
import {resolveAnimalPens,defaultSiteRecord,animalPenYardLayout} from './animal-pen-layout.js?v=1';
import {cowYardConflicts} from './cow-yard.js?v=5';
import {polygonArea,pointInPolygon,pointSegmentDistance,segmentDistance,segmentInPolygon,simplePolygon,shapePolygon,pointInShape,shapeIntersectsPolygon,segmentClearOfShapes,segmentInShapeUnion,volumesOverlap} from './animal-pen-geometry.js?v=1';
const EPS=1e-8,GRID=.3,MAX_NODES=200000,POST=.15;
// Beast.go's ordinary cow contract. Care keeps its separate accepted .42 margin.
const COW_BODY=.9,COW_ROUTE=COW_BODY+.7,COW_ARRIVAL=.35;
const defaults=resolveAnimalPens(),xy=p=>[p[0],p[2]],distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rect=(b,owner)=>({type:'rectangle',x:b[0],z:b[1],hw:b[2],hd:b[3],owner});
const segment=(s,routeHalfDepth=.05)=>({type:'capsule',a:s.slice(0,2),b:s.slice(2),r:.05,routeHalfDepth});
/** Pen-editable land: the ordinary farm capsule (onFarm, radius 24) plus the accepted
 *  animal-site footprints, full horse/sheep shelter roofs and (amendment A1) the levelled
 *  west strip of the north clearing, overlapping the capsule and reaching the horse gate. */
export function penEditableLand(){
 const land=[{type:'capsule',a:[1,3-NORTH_EXTENSION],b:[1,3],r:24},...Object.values(PEN_TEMPLATES).map(t=>({type:'polygon',points:t.baseline.renderFootprint.map(p=>[...p])}))];
 for(const kind of ['horse','sheep']){const b=PEN_TEMPLATES[kind].baseline,s=b.shelter,x0=Math.min(b.renderFootprint[0][0],s.x-s.width/2-.15),x1=Math.max(b.renderFootprint[1][0],s.x+s.width/2+.15),z0=Math.min(b.renderFootprint[0][1],s.z-s.depth/2-.125),z1=Math.max(b.renderFootprint[2][1],s.z+s.depth/2+.125);land.push({type:'polygon',points:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]});}
 land.push({type:'polygon',points:[[-23-WEST_CLEARING,-46],[-19,-46],[-19,-17],[-23-WEST_CLEARING,-17]]});
 const [x0,x1,z0,z1]=NORTH_LEVEL_BUILD_CLEARING;
 land.push({type:'polygon',points:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]});
 // Candidate land reaches the rendered map edge. The full validator still
 // checks each footprint, support, obstacle, gate and animal-care route.
 land.push({type:'polygon',points:[[-MAP_EDGE,-MAP_EDGE],[MAP_EDGE,-MAP_EDGE],[MAP_EDGE,MAP_EDGE],[-MAP_EDGE,MAP_EDGE]]});
 return land;
}
export function penEditableLandContains(shape,world){
 if(Array.isArray(shape)){if(!simplePolygon(shape))return false;return shape.every((p,i)=>segmentInShapeUnion(p,shape[(i+1)%shape.length],world.land));}
 return !!shape&&segmentInShapeUnion(shape.a,shape.b,world.land,shape.pad??0);
}
function unchanged(component){return component.delta[0]===0&&component.delta[1]===0;}
function baselineBlock(shape,world){return (world.baselineBlocked||[]).some(s=>eq(s,shape));}
function shapePair(a,b){const p=shapePolygon(a);if(p)return shapeIntersectsPolygon(b,p);if(a.type==='capsule')return !segmentClearOfShapes(a.a,a.b,[b],a.r);if(a.type==='circle')return !segmentClearOfShapes([a.x,a.z],[a.x,a.z],[b],a.r);return false;}
function support(site,p,world){
 if(site.kind==='cow'){const d=site.components.shelter.delta,poly=PEN_TEMPLATES.cow.baseline.polygon.map(v=>[v[0]+d[0],v[1]+d[1]]);if(pointInPolygon(xy(p),poly))return .08;}
 if(site.kind==='chicken'){
  for(const a of site.accesses)if(Math.abs(p[0]-a.entry[0])<=.6+EPS&&p[2]>=a.rampEnd[2]-EPS&&p[2]<=a.rampStart[2]+EPS)return a.floor*Math.max(0,Math.min(1,(a.rampStart[2]-p[2])/(a.rampStart[2]-a.rampEnd[2])));
  const d=site.components.coop.delta;if(p[0]>=-14.25+d[0]-EPS&&p[0]<=-8.55+d[0]+EPS&&p[2]>=-4.58+d[1]-EPS&&p[2]<=.35+d[1]+EPS)return .641*1.05;
 }
 return world.groundY(p[0],p[2]);
}
function supportedLine(site,a,b,world){const n=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[2]-b[2])/.08));let previous=null;for(let i=0;i<=n;i++){const t=i/n,p=a.map((v,j)=>v+(b[j]-v)*t),y=support(site,p,world);if(!Number.isFinite(y)||Math.abs(p[1]-y)>.08+EPS||previous!==null&&Math.abs(y-previous)>.08+EPS)return false;previous=y;}return true;}
function planner(site,world,stats,layout){
 // Unowned sites stay reserved at their saved or accepted position.
 const otherSites=Object.values(layout.sites).filter(s=>s.kind!==site.kind),otherPens=otherSites.filter(s=>s.polygon).map(s=>({type:'polygon',points:s.polygon})),otherFixtures=otherSites.flatMap(s=>[...s.obstacles.map((b,i)=>rect(b,'other-'+s.kind+'-'+i)),...s.fenceSegments.map(f=>segment(f,s.kind==='cow'?.05:.1))]);
 const solids=[...world.blocked,...otherFixtures,...site.obstacles.map((b,i)=>rect(b,'own-'+i)),...site.fenceSegments.map(f=>segment(f,site.kind==='cow'?.05:.1)),...(!site.polygon?otherPens:[])];
 const valid=(p,pad)=>Number.isFinite(p[0])&&Number.isFinite(p[2])&&(site.polygon?pointInPolygon(xy(p),site.polygon,pad):segmentInShapeUnion(xy(p),xy(p),world.land,pad))&&segmentClearOfShapes(xy(p),xy(p),solids,pad);
 const line=(a,b,pad)=>valid(a,pad)&&valid(b,pad)&&(!site.polygon||segmentInPolygon(xy(a),xy(b),site.polygon,pad))&&segmentClearOfShapes(xy(a),xy(b),solids,pad)&&supportedLine(site,a,b,world);
 const all=[...(site.polygon||site.footprint)],x0=Math.min(...all.map(p=>p[0]))-(!site.polygon?6:0),z0=Math.min(...all.map(p=>p[1]))-(!site.polygon?6:0),x1=Math.max(...all.map(p=>p[0]))+(!site.polygon?6:0),z1=Math.max(...all.map(p=>p[1]))+(!site.polygon?6:0),nx=Math.ceil((x1-x0)/GRID)+1,nz=Math.ceil((z1-z0)/GRID)+1;
 const caches=new Map(),edgeCaches=new Map(),coords=i=>{const x=x0+i%nx*GRID,z=z0+Math.floor(i/nx)*GRID;return[x,support(site,[x,0,z],world),z];};
 function path(from,to,pad){
  stats.searches++;if(line(from,to,pad))return[from,to];if(!valid(from,pad)||!valid(to,pad)||nx*nz>MAX_NODES)return null;
  let cache=caches.get(pad);if(!cache){cache=new Int8Array(nx*nz);caches.set(pad,cache);}const free=i=>{if(!cache[i])cache[i]=valid(coords(i),pad)?1:-1;return cache[i]===1;};
  const startX=Math.round((from[0]-x0)/GRID),startZ=Math.round((from[2]-z0)/GRID),goals=[];
  const index=(x,z)=>x>=0&&x<nx&&z>=0&&z<nz?z*nx+x:-1;
  // Short exact connectors prevent nearest-grid snapping through an obstacle.
  let edgeCache=edgeCaches.get(pad);if(!edgeCache){edgeCache=new Map();edgeCaches.set(pad,edgeCache);}const gridLine=(i,j)=>{const k=Math.min(i,j)*nx*nz+Math.max(i,j);if(!edgeCache.has(k))edgeCache.set(k,line(coords(i),coords(j),pad));return edgeCache.get(k);};
  const starts=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const i=index(startX+dx,startZ+dz);if(i>=0&&free(i)&&line(from,coords(i),pad))starts.push(i);}
  const tx=Math.round((to[0]-x0)/GRID),tz=Math.round((to[2]-z0)/GRID);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const i=index(tx+dx,tz+dz);if(i>=0&&free(i)&&line(coords(i),to,pad))goals.push(i);}if(!starts.length||!goals.length)return null;
  const goalSet=new Set(goals),queue=starts.slice(),prev=new Int32Array(nx*nz).fill(-2);for(const i of starts)prev[i]=-1;let end=-1;
  for(let k=0;k<queue.length&&k<MAX_NODES;k++){const i=queue[k];stats.visited++;if(goalSet.has(i)){end=i;break;}const ix=i%nx,iz=Math.floor(i/nx);for(const [dx,dz]of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]]){const j=index(ix+dx,iz+dz);if(j>=0&&prev[j]===-2&&free(j)&&gridLine(i,j)){prev[j]=i;queue.push(j);}}}
  if(end<0)return null;const result=[to];for(let i=end;i!==-1;i=prev[i])result.push(coords(i));result.push(from);return result.reverse();
 }
 // A sufficient direct ordinary route, not a different pathfinder or a clearance
 // relaxation. Match route()/hitsBlock's rectangular padding and endpoint skips;
 // independently keep the complete body segment clear, including skipped boxes.
 // This proves an executable go() destination beyond its arrival threshold. It
 // does not claim that every point or extra square metre is ordinary roaming room.
 let ordinaryPoints=null,ordinaryObstacles=null;const ordinaryCache=new Map();
 function ordinary(from){
  const key=from.join(',');if(ordinaryCache.has(key))return ordinaryCache.get(key);
  let result=null;
  if(site.polygon&&nx*nz<=MAX_NODES&&pointInPolygon(xy(from),site.polygon,COW_ROUTE)&&valid(from,COW_BODY)){
   if(!ordinaryPoints)ordinaryPoints=Array.from({length:nx*nz},(_,i)=>coords(i)).filter(q=>pointInPolygon(xy(q),site.polygon,COW_ROUTE)&&valid(q,COW_BODY));
   if(!ordinaryObstacles)ordinaryObstacles=solids.map(s=>{if(s.type!=='capsule')return s;const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],n=Math.hypot(dx,dz);return{type:'rectangle',x:(s.a[0]+s.b[0])/2,z:(s.a[1]+s.b[1])/2,hw:n/2,hd:s.routeHalfDepth??s.r,c:n?dx/n:1,s:n?dz/n:0};});
   const contains=(s,p)=>{if(s.type==='rectangle'){const dx=p[0]-s.x,dz=p[2]-s.z,c=s.c??1,n=s.s??0;return Math.abs(dx*c+dz*n)<s.hw+COW_ROUTE&&Math.abs(-dx*n+dz*c)<s.hd+COW_ROUTE;}return s.type==='circle'&&Math.hypot(p[0]-s.x,p[2]-s.z)<s.r+COW_ROUTE-EPS;};
   const candidates=ordinaryPoints.filter(q=>distance(q,from)>COW_ARRIVAL+EPS).sort((a,b)=>distance(a,from)-distance(b,from)||a[0]-b[0]||a[2]-b[2]);
   for(const q of candidates){
    if(!line(from,q,COW_BODY)||!segmentInPolygon(xy(from),xy(q),site.polygon,COW_ROUTE))continue;
    const boxes=ordinaryObstacles.filter(s=>!contains(s,from)&&!contains(s,q)).map(s=>s.type==='rectangle'?{...s,hw:s.hw+COW_ROUTE-.05,hd:s.hd+COW_ROUTE-.05}:s.type==='circle'?{...s,r:s.r+COW_ROUTE}:s);
    if(segmentClearOfShapes(xy(from),xy(q),boxes)){result=[[...from],[...q]];break;}
   }
  }
  ordinaryCache.set(key,result);return result;
 }
 return{valid,line,path,solids,ordinary};
}
function coopLeg(site,plan,a,b,pad,world){
 const ignore=new Set(PEN_TEMPLATES.chicken.components.coop.obstacleIndices.map(i=>'own-'+i)),solids=plan.solids.filter(s=>!ignore.has(s.owner));
 return segmentInPolygon(xy(a),xy(b),site.polygon,pad)&&segmentClearOfShapes(xy(a),xy(b),solids,pad)&&supportedLine(site,a,b,world);
}
function coopExit(site,plan,actor,from,world){
 if(site.kind!=='chicken'||!actor.stationId||support(site,from,world)<EPS)return null;
 const station=site.stations.find(s=>s.id===actor.stationId);if(!station?.path)return null;
 const points=[station.approach,...station.path];let nearest=null,best=Infinity;
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],v=b.map((n,j)=>n-a[j]),n=v.reduce((s,x)=>s+x*x,0),t=n?Math.max(0,Math.min(1,v.reduce((s,x,j)=>s+x*(from[j]-a[j]),0)/n)):0,q=a.map((x,j)=>x+v[j]*t),d=Math.hypot(...from.map((x,j)=>x-q[j]));if(d<best){best=d;nearest={i,q};}}
 if(!nearest)return null;const result=[from,nearest.q,...points.slice(0,nearest.i+1).reverse()];return result.every((p,i)=>i===0||coopLeg(site,plan,result[i-1],p,actor.clearance,world))?result:null;
}
/** Complete deterministic layout preflight. Never spends, saves or mutates live actors. */
export function validateAnimalPens(layout,world,{fastReject=false}={}){
 const issues=[],placements={},waiting={},routes=[],ordinaryRoutes={},diagnostics={searches:0,visited:0},add=(code,kind,target,message)=>issues.push({code,kind,target,message}),active=Object.values(layout.sites).filter(s=>world.owned[s.kind]>0&&(s.custom||world.installed?.[s.kind]!==false)),plans=new Map();
 const freeCow=a=>a.kind==='cow'&&layout.sites.cow.custom&&!layout.sites.cow.stations.some(s=>s.id===(a.careStationId??a.stationId));
 const placementPad=a=>freeCow(a)?COW_BODY:a.clearance;
 for(const a of world.actors)if(!active.some(s=>s.kind===a.kind))placements[a.id]=[...a.position];
 for(const site of active){const kind=site.kind,t=PEN_TEMPLATES[kind],base=defaults.sites[kind];issues.push(...site.issues);
  if(kind==='cow'){
   // A5: Apply must satisfy the same full footprint/access reservation that
   // syncCowYard enforces after publication. A clear gate axis alone is not enough.
   const blocks=world.blocked.filter(b=>b.type==='rectangle').map(b=>[b.x,b.z,b.hw,b.hd]);
   for(const other of Object.values(layout.sites))if(other.kind!=='cow'&&(other.kind==='chicken'||world.owned[other.kind]>0&&world.installed?.[other.kind]!==false))blocks.push(...other.obstacles);
   const decor=world.blocked.filter(b=>b.type==='circle');
   if(cowYardConflicts({layout:animalPenYardLayout(site),blocks,decor}).length)add('ACCESS',kind,site.gates[0]?.id??null,'Keep the cow yard and its full gate access area clear of other objects.');
  }
  if(site.polygon){if(!simplePolygon(site.polygon)||polygonArea(site.polygon)+EPS<t.minimumArea)add('GEOMETRY',kind,null,'Keep a simple enclosure with its minimum walking area.');
   for(const r of site.runs){if(Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])<1-EPS||!segmentInPolygon(r.a,r.b,site.polygon))add('GEOMETRY',kind,r.id,'Interior fences need one metre and must stay inside the pen.');}
   const original=defaultSiteRecord(kind).gates;for(const g of site.gates){const old=original.find(a=>a.id===g.id),legacy=old&&g.width===old.width&&g.offset===old.offset&&eq(g.edge,old.edge)&&g.run===old.run;if(!legacy&&g.width<t.gateWidth-EPS)add('GEOMETRY',kind,g.id,'Keep a gate wide enough for this species.');const edge=g.edge?site.boundary.findIndex((v,i)=>v.id===g.edge[0]&&site.boundary[(i+1)%site.boundary.length].id===g.edge[1]):-1,r=g.run?site.runs.find(r=>r.id===g.run):null,len=edge>=0?Math.hypot(site.polygon[(edge+1)%site.polygon.length][0]-site.polygon[edge][0],site.polygon[(edge+1)%site.polygon.length][1]-site.polygon[edge][1]):r?Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]):0;if(!legacy&&(g.offset<POST-EPS||len-g.offset-g.width<POST-EPS))add('GEOMETRY',kind,g.id,'Leave clearance at both gate posts.');}
   for(let i=0;i<site.gates.length;i++)for(let j=i+1;j<site.gates.length;j++){const a=site.gates[i],b=site.gates[j];if(eq(a.edge,b.edge)&&a.run===b.run&&a.offset<b.offset+b.width+POST&&b.offset<a.offset+a.width+POST)add('GEOMETRY',kind,b.id,'Separate gate openings and posts.');}
   if(!penEditableLandContains(site.polygon,world))add('LAND',kind,null,'Keep the entire enclosure on editable farm land.');
   for(const b of world.blocked)if(shapeIntersectsPolygon(b,site.polygon)&&!(baselineBlock(b,world)&&shapeIntersectsPolygon(b,base.polygon)))add('OVERLAP',kind,null,'Keep existing objects outside the animal enclosure.');
   for(const f of site.fenceSegments){for(const b of world.blocked)if(shapePair(segment(f),b)&&!(baselineBlock(b,world)&&base.fenceSegments.some(old=>shapePair(segment(old),b)&&Math.abs((old[2]-old[0])*(f[1]-old[1])-(old[3]-old[1])*(f[0]-old[0]))<EPS&&Math.abs((old[2]-old[0])*(f[3]-old[1])-(old[3]-old[1])*(f[2]-old[0]))<EPS)))add('OVERLAP',kind,null,'Keep fences clear of existing objects.');if(!penEditableLandContains({a:f.slice(0,2),b:f.slice(2),pad:.05},world))add('LAND',kind,null,'Keep the whole fence on editable land.');for(const p of world.path)if(shapePair(segment(f),p)&&!base.fenceSegments.some(b=>eq(b,f)))add('PATH',kind,null,'Keep fences off the stone path.');}
  }
  for(const [id,c]of Object.entries(site.components)){
   if(!penEditableLandContains(c.footprint,world))add('LAND',kind,id,'Keep the whole animal building on editable land.');
   for(const b of world.blocked)if(shapeIntersectsPolygon(b,c.footprint)&&!(unchanged(c)&&baselineBlock(b,world)&&shapeIntersectsPolygon(b,base.components[id].footprint)))add('OVERLAP',kind,id,'This building overlaps an existing farm object.');
   for(const p of world.path)if(shapeIntersectsPolygon(p,c.footprint)&&!(unchanged(c)&&shapeIntersectsPolygon(p,base.components[id].footprint)))add('PATH',kind,id,'Keep the building clear of the stone path.');
   // Accepted component internals translate rigidly. New environment must preserve
   // the existing support heights; this feature cannot grade or lift the land.
   if(!unchanged(c)){for(const p of [...c.footprint,...site.stations.filter(s=>site.stationOwners[s.id]===id).flatMap(s=>[xy(s.dock),xy(s.approach),...(s.contact?[xy(s.contact)]:[])])]){const original=[p[0]-c.delta[0],p[1]-c.delta[1]],before=world.groundY(...original),after=world.groundY(...p);if(!Number.isFinite(after)||Math.abs(after-before)>.01){add('SUPPORT',kind,id,'This move needs unsupported foundations or uneven ground.');break;}}}
   if(site.polygon&&!(kind==='chicken'&&id==='eggStand')&&id!=='robot'&&site.stations.some(s=>site.stationOwners[s.id]===id&&!pointInPolygon(xy(s.dock),site.polygon)))add('ROUTE',kind,id,'Keep animal care docks inside their pen.');
   for(const run of site.runs)if(shapeIntersectsPolygon({type:'capsule',a:run.a,b:run.b,r:.05},c.footprint))add('OVERLAP',kind,run.id,'Keep interior fences clear of care buildings and their approaches.');
  }
  for(const s of site.stations){for(const b of world.blocked)if(shapePair({type:'circle',x:s.dock[0],z:s.dock[2],r:t.margin},b)&&!baselineBlock(b,world))add('OVERLAP',kind,s.id,'An existing object blocks animal care.');}
  plans.set(kind,planner(site,world,diagnostics,layout));
 }
 // No shared fences/overlapping pens. Preserve accepted within-site relationships,
 // including the cow support slab; independent moves cannot add new overlaps.
 const reserved=Object.values(layout.sites).filter(s=>!active.includes(s));
 for(let i=0;i<active.length;i++)for(const b of [...active.slice(i+1),...reserved]){const a=active[i];if(a.polygon&&b.polygon&&shapeIntersectsPolygon({type:'polygon',points:a.polygon},b.polygon))add('OVERLAP',a.kind,null,'Keep animal pens separate.');for(const [id,c]of Object.entries(a.components))for(const d of Object.values(b.components))if(shapeIntersectsPolygon({type:'polygon',points:c.footprint},d.footprint))add('OVERLAP',a.kind,id,'Keep animal buildings separate.');}
 for(const s of active)for(const [id,c]of Object.entries(s.components))for(const [other,d]of Object.entries(s.components))if(id<other&&volumesOverlap(c.volumes,d.volumes)&&!(eq(c.delta,d.delta)&&volumesOverlap(defaults.sites[s.kind].components[id].volumes,defaults.sites[s.kind].components[other].volumes)))add('OVERLAP',s.kind,id,'These animal buildings overlap.');
 // Preview may stop at a definite static rejection. Every green preview still
 // executes all placements and routes; Apply retains the complete default report.
 if(fastReject&&issues.length)return{revision:layout.revision,worldEpoch:world.epoch,obstacleRevision:world.obstacleRevision,ok:false,issues,placements,waiting,routes,ordinaryRoutes,diagnostics};
 for(const actor of world.actors){const site=layout.sites[actor.kind],plan=plans.get(actor.kind);if(!plan)continue;const pad=actor.clearance,c=actor.component&&site.components[actor.component],original=actor.position,old=c?(world.currentLayout?.sites[actor.kind]?.components[actor.component]?.origin??PEN_TEMPLATES[actor.kind].components[actor.component].origin):null,p=c?[original[0]+(c.origin[0]-old[0]),original[1],original[2]+(c.origin[1]-old[1])]:[...original],used=world.actors.filter(a=>placements[a.id]);p[1]=support(site,p,world);
  const separate=q=>used.every(a=>distance(q,placements[a.id])>=placementPad(actor)+placementPad(a)-EPS),away=q=>site.stations.every(s=>pointSegmentDistance(xy(q),xy(s.approach),xy(s.dock))>=placementPad(actor)+.1)&&site.gates.every(g=>pointSegmentDistance(xy(q),xy(g.inside),xy(g.outside))>=placementPad(actor)+.1);
  const occupiedCoop=actor.kind==='chicken'&&actor.component==='coop'&&actor.stationId&&site.stations.some(s=>s.id===actor.stationId)&&support(site,p,world)>EPS&&coopLeg(site,plan,p,p,pad,world);
  let point=(plan.valid(p,pad)||occupiedCoop)&&separate(p)?p:null;
  if(!point){const bounds=site.polygon||site.footprint,x0=Math.min(...bounds.map(p=>p[0])),x1=Math.max(...bounds.map(p=>p[0])),z0=Math.min(...bounds.map(p=>p[1])),z1=Math.max(...bounds.map(p=>p[1])),candidates=[];for(let x=x0+pad;x<=x1-pad;x+=GRID)for(let z=z0+pad;z<=z1-pad;z+=GRID){const q=[x,support(site,[x,0,z],world),z];if(separate(q)&&away(q)&&plan.valid(q,pad))candidates.push(q);}candidates.sort((a,b)=>distance(a,p)-distance(b,p)||a[0]-b[0]||a[2]-b[2]);point=candidates.find(q=>!freeCow(actor)||plan.ordinary(q))||null;}
  if(!point){add('STAGING',actor.kind,actor.id,'There is no separate clear waiting place for every animal.');continue;}placements[actor.id]=point;
  if(freeCow(actor)){const proof=plan.ordinary(point);if(proof)ordinaryRoutes[actor.id]=proof;else add('ROAMING',actor.kind,actor.id,'This cow has no clear ordinary walking step. Adjust the fence or finish its care movement before applying.');}
 }
 // Waiting destinations are distinct from occupied support placements. A
 // sleeping bird stays in its bed at Apply, then walks to its reserved ground
 // destination during wake-up. Never relocate it to clear an ordinary queue.
 for(const site of active.filter(s=>s.kind==='chicken')){
  const plan=plans.get(site.kind),actors=world.actors.filter(a=>a.kind===site.kind),candidates=new Map(),chosen=[];
  for(const actor of actors){
   const pad=actor.clearance;let points=candidates.get(pad);
   if(!points){
    points=[];const poly=site.polygon,x0=Math.min(...poly.map(p=>p[0])),x1=Math.max(...poly.map(p=>p[0])),z0=Math.min(...poly.map(p=>p[1])),z1=Math.max(...poly.map(p=>p[1]));
    for(let x=x0+pad;x<=x1-pad;x+=GRID)for(let z=z0+pad;z<=z1-pad;z+=GRID){
     const q=[x,support(site,[x,0,z],world),z];
     if(Math.abs(q[1]-world.groundY(x,z))>EPS||!plan.valid(q,pad))continue;
     if(site.stations.some(s=>pointSegmentDistance([x,z],xy(s.approach),xy(s.dock))<pad+.32)||site.gates.some(g=>pointSegmentDistance([x,z],xy(g.inside),xy(g.outside))<pad+.32)||site.accesses.some(a=>pointSegmentDistance([x,z],xy(a.outside),xy(a.rampStart))<pad+.32))continue;
     points.push(q);
    }
    candidates.set(pad,points);
   }
   const from=placements[actor.id]||actor.position,ranked=points.filter(q=>chosen.every(c=>distance(q,c.point)>=Math.max(.5,pad+c.pad)-EPS)).sort((a,b)=>distance(a,from)-distance(b,from)||a[0]-b[0]||a[2]-b[2]);
   const exit=coopExit(site,plan,actor,from,world),origin=exit?exit.at(-1):from;
   let selected=null,path=null;for(const q of ranked){path=plan.path(origin,q,pad);if(path){selected=q;break;}}
   if(!selected){add('STAGING',site.kind,actor.id,'Keep separate reachable ground waiting places clear of care approaches.');continue;}
   waiting[actor.id]=[...selected];chosen.push({point:selected,pad});routes.push({actorId:actor.id,targetId:'waiting-'+actor.id,points:exit?[...exit,...path.slice(1)]:path});
  }
 }
 for(const site of active){const plan=plans.get(site.kind),actors=world.actors.filter(a=>a.kind===site.kind),bedStations=site.stations.filter(s=>s.kind==='bed');
  for(const [i,actor]of actors.entries()){const from=placements[actor.id];if(!from)continue;const exit=coopExit(site,plan,actor,from,world),routeTo=to=>{if(!exit)return plan.path(from,to,actor.clearance);const rest=plan.path(exit[exit.length-1],to,actor.clearance);return rest?[...exit,...rest.slice(1)]:null;};
   const relevant=site.stations.filter(s=>s.kind==='bed'?s.id===bedStations[i]?.id:s.slot===undefined||s.slot===i);
   for(const s of relevant){let approach=routeTo(s.approach),tail=s.path||[s.approach,s.dock];
    if(site.kind==='chicken'&&s.kind==='bed'){
     const ignore=new Set(PEN_TEMPLATES.chicken.components.coop.obstacleIndices.map(i=>'own-'+i)),solids=plan.solids.filter(s=>!ignore.has(s.owner));
     if(tail.some((p,j)=>j>0&&(!segmentInPolygon(xy(tail[j-1]),xy(p),site.polygon,actor.clearance)||!segmentClearOfShapes(xy(tail[j-1]),xy(p),solids,actor.clearance)||!supportedLine(site,tail[j-1],p,world))))approach=null;
    }else for(let j=1;j<tail.length;j++)if(!plan.line(tail[j-1],tail[j],actor.clearance))approach=null;
    if(!approach)add('ROUTE',site.kind,s.id,'A required bed, feed or water route is blocked.');else routes.push({actorId:actor.id,targetId:s.id,points:[...approach,...tail.slice(1)]});
   }
   for(const a of site.accesses){const chain=[a.outside,a.rampStart,a.rampEnd,a.entry],approach=routeTo(a.outside),valid=chain.every((p,j)=>j===0||coopLeg(site,plan,chain[j-1],p,actor.clearance,world));if(!approach||!valid)add('ROUTE',site.kind,a.id,'Keep both coop doorways and ramps clear.');else{routes.push({actorId:actor.id,targetId:a.id,points:[...approach,...chain.slice(1)]});routes.push({actorId:actor.id,targetId:a.id+'-exit',points:[...chain].reverse()});}}
   for(const g of site.gates){const bridge=[g.inside,g.outside].map(p=>[p[0],support(site,p,world),p[2]]),foreign=plan.solids,toInside=routeTo(bridge[0]);if(!toInside||!segmentClearOfShapes(xy(bridge[0]),xy(bridge[1]),foreign,actor.clearance)||!penEditableLandContains({a:xy(bridge[0]),b:xy(bridge[1]),pad:actor.clearance},world))add('ROUTE',site.kind,g.id,'Keep clear approaches on both sides of every gate.');else routes.push({actorId:actor.id,targetId:g.id,points:[...toInside,bridge[1]]});}
   if(site.kind==='cow'){const r=site.robot,chain=[r.entry,r.dock,r.exit,r.turn,r.clear];let ok=!!plan.path(from,r.entry,actor.clearance);for(let j=1;j<chain.length;j++)if(!plan.line(chain[j-1],chain[j],actor.clearance))ok=false;if(!ok)add('ROUTE',site.kind,'cow-robot-exit','Keep the robot entry, dock, exit, turn and clear route usable.');else routes.push({actorId:actor.id,targetId:'cow-robot-exit',points:chain});}
  }
 }
 return{revision:layout.revision,worldEpoch:world.epoch,obstacleRevision:world.obstacleRevision,ok:issues.length===0,issues,placements,waiting,routes,ordinaryRoutes,diagnostics};
}
