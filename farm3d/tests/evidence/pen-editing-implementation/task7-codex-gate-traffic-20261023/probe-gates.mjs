import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import * as T from '../../../../lib/three.module.min.js';
import {resolveAnimalPens,defaultSiteRecord,animalPenYardLayout}from'../../../../animal-pen-layout.js';
import {validateAnimalPens}from'../../../../animal-pen-validation.js';
import {makePenWorld}from'../../../fixtures/animal-pen-world.mjs';
import {pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint,segmentClearOfShapes}from'../../../../animal-pen-geometry.js';
import {createRemainingCareController}from'../../../../remaining-care-controller.js';
import {createChickenYard}from'../../../../chicken-yard.js';
const html=fs.readFileSync(new URL('../../../../index.html',import.meta.url),'utf8'),kinds=['chicken','cow','horse','sheep'];
const layout=resolveAnimalPens({v:1,revision:1,sites:Object.fromEntries(kinds.map(k=>[k,defaultSiteRecord(k)]))}),world=makePenWorld(),validation=validateAnimalPens(layout,world);
assert(validation.ok,JSON.stringify(validation.issues));
const blocks=[...world.blocked.filter(s=>s.type==='rectangle').map(s=>[s.x,s.z,s.hw,s.hd]),...Object.values(layout.sites).flatMap(s=>s.obstacles)],fences=Object.values(layout.sites).flatMap(s=>s.fenceSegments);
const OBST=[...blocks.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0})),...fences.map(([ax,az,bx,bz])=>{const a=Math.atan2(bz-az,bx-ax);return{x:(ax+bx)/2,z:(az+bz)/2,hw:Math.hypot(bx-ax,bz-az)/2,hd:.1,c:Math.cos(a),s:Math.sin(a)};})];
const pens=Object.fromEntries(kinds.map(k=>[k,{custom:true,care:true,poly:layout.sites[k].polygon}])),c=vm.createContext({THREE:T,pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint,PENS:{courtyard:pens.cow},PEN_LIST:Object.values(pens),OBST,HOME:new T.Vector2(1,3),ROAM:19});
vm.runInContext(html.slice(html.indexOf('function edgeDepths('),html.indexOf('// where the animals may not walk')),c);vm.runInContext('globalThis.fitsPen=(p,x,z,m)=>inPen(p,x,z,m);',c);vm.runInContext(html.slice(html.indexOf('const toLocal ='),html.indexOf('const blocked =')),c);
// Expose only existing private predicates in memory; runtime source stays exact.
const url=new URL('../../../../chicken-stations.js',import.meta.url);let source=fs.readFileSync(url,'utf8').replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,url).href));const old='return {scheduler,request,update,release,snapshotLayout,prepareLayoutRebind};';assert(source.includes(old));source=source.replace(old,'return {scheduler,request,update,release,snapshotLayout,prepareLayoutRebind,diagnostic:{groundRoute,clearStep,inside}};');const {createChickenStationController}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const rows=[];
for(const kind of kinds){const site=layout.sites[kind],gate=site.gates[0],pad={chicken:.26,cow:.42,horse:.8,sheep:.55}[kind],body={chicken:.3,cow:.9,horse:1,sheep:.6}[kind],a={kind,ref:{type:'pen',i:0},g:new T.Group(),vel:new T.Vector2()},row={kind,gate,pad,body,validatorBridge:validation.routes.find(r=>world.actors.find(a=>a.id===r.actorId)?.kind===kind&&r.targetId===gate.id),directions:[]};
 const shapes=[...blocks.map(([x,z,hw,hd])=>({type:'rectangle',x,z,hw,hd})),...fences.map(f=>({type:'capsule',a:f.slice(0,2),b:f.slice(2),r:.05}))];row.bodyBridgeClear=segmentClearOfShapes([gate.inside[0],gate.inside[2]],[gate.outside[0],gate.outside[2]],shapes,body);
 const care=kind==='horse'||kind==='sheep'?createRemainingCareController({layouts:{[kind]:animalPenYardLayout(site)},neighbours:()=>[a],active:()=>true,obstacles:()=>blocks,segments:()=>fences,updateRig:()=>{}}):null;
 const yard=kind==='chicken'?createChickenYard({layout:site}):null,chicken=yard&&createChickenStationController({yard,route:c.route,neighbours:()=>[a],updateRig:()=>{}});
 try{for(const [label,from,to]of [['out',gate.inside,gate.outside],['in',gate.outside,gate.inside]]){
  a.g.position.fromArray(from);const shared=c.route(new T.Vector2(from[0],from[2]),new T.Vector2(to[0],to[2]),pad,pens[kind]);
  const result={label,from,to,sceneRoute:shared.map(p=>p.toArray()),containedFrom:pointInPolygon([from[0],from[2]],site.polygon,pad),containedTo:pointInPolygon([to[0],to[2]],site.polygon,pad)};
  if(care){result.careRoute=care.plan(a,to);result.careDestinationFree=care.free(a,to[0],to[2]);}
  if(chicken){const task={station:yard.stations.find(s=>s.kind==='feed'),access:false};result.chickenGroundRoute=chicken.diagnostic.groundRoute(a,[from[0],from[2]],[to[0],to[2]]);result.chickenDestinationClear=chicken.diagnostic.clearStep(a,task,to,to[0],to[2]);}
  row.directions.push(result);
 }}finally{yard?.dispose();}rows.push(row);
}
const result={base:'cb2af61cee02d2f0c0625aee7c9b66b6eb53e752',node:process.version,utc:new Date().toISOString(),validation:{ok:validation.ok,issues:validation.issues,actorCount:world.actors.length},rows,interpretation:'Validator bridge promises directed gate traversal. Existing ungranted ordinary containment must continue refusing crossing. The runtime has no gate-scoped passage mechanism to execute that bridge; this probe exposes the integration gap, not permission to bypass containment.'};
fs.writeFileSync(new URL('./gate-red.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({validation:result.validation,rows:rows.map(r=>({kind:r.kind,bodyBridgeClear:r.bodyBridgeClear,directions:r.directions}))},null,2));
assert(rows.every(r=>r.directions.every(d=>d.sceneRoute.length>0)),'Validated directed gate bridges have no executable scoped runtime route; ordinary containment alone is correctly restrictive.');
