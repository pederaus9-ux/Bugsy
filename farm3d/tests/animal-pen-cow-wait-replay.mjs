// Exact retained positions/tasks, actual index fit/route/go/wait functions and
// actual resolved cow geometry. Read-only routing replay; no movement/rig claim.
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
import {pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint} from '../animal-pen-geometry.js';
export function replayCowWait(html,{custom=true,moved=true,solid=false}={}){
 const raw=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task7-codex-facility-install-20261023/trough-five-cow-fixed-60/results.json',import.meta.url)));
 const record=defaultSiteRecord('cow');if(moved)record.structures.trough=[6,-35];
 const site=resolveAnimalPens({v:1,revision:1,sites:{cow:record}}).sites.cow,pen={custom,care:true,poly:site.polygon};
 const obstacles=site.obstacles.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0}));
 for(const [ax,az,bx,bz]of site.fenceSegments){const angle=Math.atan2(bz-az,bx-ax);obstacles.push({x:(ax+bx)/2,z:(az+bz)/2,hw:Math.hypot(bx-ax,bz-az)/2,hd:.1,c:Math.cos(angle),s:Math.sin(angle)});}
 const c=vm.createContext({THREE,pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint,PENS:{courtyard:pen},PEN_LIST:[pen],OBST:obstacles,HOME:new THREE.Vector2(1,3),ROAM:19,clockT:100,cowYard:{stations:site.stations},COW_YARD_LAYOUT:{obstacles:solid?[[3.758439365346363,-34.94218039638436,10,10]]:site.obstacles}});
 const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)+a.length));
 vm.runInContext(section('function edgeDepths(','// where the animals may not walk'),c);
 vm.runInContext('globalThis.fitsPen=(p,x,z,m)=>inPen(p,x,z,m);',c);
 vm.runInContext(section('const toLocal =','const blocked ='),c);
 vm.runInContext('globalThis.methods=(class{'+section('  fit(v, extra = .35)','  stay(')+'}).prototype;',c);
 const animals=raw.failure.actors.filter(a=>a.kind==='cow').map(v=>Object.assign(Object.create(c.methods),{kind:'cow',ref:v.ref,g:{position:new THREE.Vector3(...v.pos)},pen,S:{r:.9},act:v.act,until:0,cowTask:v.task?{...structuredClone(v.task),path:v.task.path?.map(p=>new THREE.Vector2(p.x,p.y))}:null}));
 for(const a of animals)Object.defineProperty(a,'pos',{get(){return new THREE.Vector2(this.g.position.x,this.g.position.z);}});
 c.animals=animals;vm.runInContext(section('function waitCowStation(','\nfunction chooseCowTask('),c);
 const a=animals[4],before=a.g.position.toArray(),tokens=JSON.stringify(animals.map(a=>a.cowTask?.token)),calls=[],go=a.go;
 a.go=function(...args){go.apply(this,args);calls.push({point:args.slice(0,2),target:this.target?.toArray()??null,path:this.path?.map(p=>p.toArray())??null});};
 c.waitCowStation(a,'Waiting for water');
 return{custom,moved,before,after:a.g.position.toArray(),tokensUnchanged:tokens===JSON.stringify(animals.map(a=>a.cowTask?.token)),target:a.target?.toArray()??null,path:a.path?.map(p=>p.toArray())??null,act:a.act,until:a.until,calls,polygon:site.polygon};
}
