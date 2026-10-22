import fs from 'node:fs';import {farmGroundY} from '../../farm-land.js';import {resolveAnimalPens,defaultSiteRecord} from '../../animal-pen-layout.js';
const baseline=JSON.parse(fs.readFileSync(new URL('./animal-pens-pr95.json',import.meta.url),'utf8')).sites;
const initial=JSON.parse(fs.readFileSync(new URL('./remaining-care-initial-world.json',import.meta.url),'utf8'));
export function makePenWorld(overrides={}){
 const owned={chicken:30,cow:5,horse:4,sheep:5,dog:1,cat:1},margins={chicken:.18,cow:.42,horse:.8,sheep:.55,dog:.42,cat:.32};
 const blocked=initial.existingBlocks.flatMap((b,i)=>i>=10&&i<=15||b[0]>=1000||b[0]===-9.6&&b[1]===-2.4?[]:[{type:'rectangle',x:b[0],z:b[1],hw:b[2],hd:b[3],owner:'fixed-'+i}]);
 const land=[{type:'capsule',a:[1,-22],b:[1,3],r:24},...Object.values(baseline).map(s=>({type:'polygon',points:s.renderFootprint}))];
 for(const kind of ['horse','sheep']){const b=baseline[kind],s=b.shelter,x0=Math.min(b.renderFootprint[0][0],s.x-s.width/2-.15),x1=Math.max(b.renderFootprint[1][0],s.x+s.width/2+.15),z0=Math.min(b.renderFootprint[0][1],s.z-s.depth/2-.125),z1=Math.max(b.renderFootprint[2][1],s.z+s.depth/2+.125);land.push({type:'polygon',points:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]});}
 land.push({type:'polygon',points:[[-33,-46],[-19,-46],[-19,-17],[-33,-17]]});
 const points=[[-1.4,8.1],[-18.4,8.1],[-18.4,-20.5],[-3.25,-25.5],[-3.25,-32.88]],path=points.slice(1).map((b,i)=>({type:'capsule',a:points[i],b,r:.92,owner:'stone-path'}));
 const actors=Object.entries(owned).flatMap(([kind,n])=>Array.from({length:n},(_,i)=>{const b=baseline[kind],station=b.stations.filter(s=>s.kind==='bed')[i];return{id:kind+'-'+i,kind,position:[...station.approach],component:null,stationId:null,clearance:margins[kind]};}));
 return{epoch:'guest-farm-1',obstacleRevision:0,owned,land,blocked,path,groundY:farmGroundY,actors,baselineBlocked:structuredClone(blocked),...overrides};
}
export function translatedLayout(kind,delta){const site=defaultSiteRecord(kind);site.boundary?.forEach(p=>{p.x+=delta[0];p.z+=delta[1];});for(const r of site.runs||[]){r.a=[r.a[0]+delta[0],r.a[1]+delta[1]];r.b=[r.b[0]+delta[0],r.b[1]+delta[1]];}for(const id in site.structures){const p=site.structures[id];site.structures[id]=[p[0]+delta[0],p[1]+delta[1]];}return resolveAnimalPens({v:1,revision:1,sites:{[kind]:site}});}
