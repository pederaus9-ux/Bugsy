import * as THREE from './lib/three.module.min.js';
import {mergeGeometries} from './lib/addons/utils/BufferGeometryUtils.js';

const FLOOR=.08;
const station=(id,kind,x,z,ax,az,facing,surface=FLOOR)=>({id,kind,dock:[x,FLOOR,z],approach:[ax,FLOOR,az],facing,surface:kind==='bed'?FLOOR+.12:surface});
// All coordinates are world metres. The old horse/sheep paddock is untouched.
export const COW_YARD_LAYOUT=Object.freeze({
 polygon:[[-14,-15.2],[-2.1,-15.2],[-2.1,-7.8],[-14,-7.8]],
 footprint:[[-14,-15.2],[1.1,-15.2],[1.1,-7.8],[-14,-7.8]],
 gate:[-4.4,-2.1],floor:FLOOR,bed:[-8.9,-13.2,1],
 shelter:{x:[-12.1,-6.4],z:[-13.2,-12.8]},water:[-5.6,-10.4,.8,.7],
 fenceSegments:[[-14,-15.2,-2.1,-15.2],[-14,-15.2,-14,-7.8],[-14,-7.8,-4.4,-7.8],[-2.1,-15.2,-2.1,-7.8]],
 obstacles:[...[[-13.8,-11.45],[-10.8,-11.45],[-5.15,-11.45],[-10.35,-7.95],[-13.8,-7.95]].map(([x,z])=>[x,z,.065,.065]),...[-13.05,-10.55,-8.05,-5.55].map(x=>[x,-13.65,.0275,1.275]),[-12.4,-9.6,1.35,.0275],[-9.5,-15.1,4.5,.1],[-13.9,-11.5,.1,3.7],[-8.2,-8.05,2.7,.22],[-4.8,-10.4,.35,.8],[-4.35,-11.3,.035,1.9],[-2.25,-11.3,.035,1.9],[-1.85,-11.3,.25,.7],[.0,-11.3,1.1,.75]],
 robot:{entry:[-3.3,FLOOR,-9],dock:[-3.3,FLOOR,-11.3],exit:[-3.3,FLOOR,-14.2],turn:[-4.95,FLOOR,-14.2],clear:[-4.95,FLOOR,-12]},
 tank:[0,FLOOR,-11.3],
 stations:[station('cow-bed-1','bed',-11.8,-13.2,-11.8,-11.8,0),station('cow-bed-2','bed',-9.3,-13.2,-9.3,-11.8,0),station('cow-bed-3','bed',-6.8,-13.2,-6.8,-11.8,0),station('cow-bed-4','bed',-12.1,-10.7,-10.6,-10.7,Math.PI/2),station('cow-bed-5','bed',-12.1,-8.5,-10.5,-9,Math.PI/2),station('cow-feed-1','feed',-9.5,-9,-9.5,-10.3,0,.53),station('cow-feed-2','feed',-7.2,-9,-7.2,-10.3,0,.53),station('cow-drink','drink',-5.75,-10.4,-7.1,-10.4,Math.PI/2,.6),station('cow-robot','robot',-3.3,-11.3,-3.3,-9,Math.PI)],
});

// Conservative whole-site guard: never move/erase player-owned objects to install a yard.
// Callers preserve the original enclosure until the reported conflicts are cleared.
export function cowYardConflicts({blocks=[],decor=[]}={}){
 const p=COW_YARD_LAYOUT.footprint,x0=p[0][0],x1=p[1][0],z0=p[0][1],z1=p[2][1],hits=[];
 const hit=(x,z,hw,hd)=>x+hw>x0&&x-hw<x1&&z+hd>z0&&z-hd<z1;
 for(const b of blocks)if(hit(...b))hits.push({type:'block',bounds:[...b]});
 for(const d of decor)if(hit(d.x,d.z,d.r??.6,d.r??.6))hits.push({type:'decor',id:d.id,x:d.x,z:d.z});
 return hits;
}

export function createCowYard(){
 const group=new THREE.Group();group.name='cow-yard';
 const materials=Object.fromEntries(Object.entries({blue:0x7fabb7,cream:0xeae0c7,roof:0x506e7c,metal:0x9baaaa,dark:0x3a4949,straw:0xbfa257,feed:0xb58d43,water:0x507f89,concrete:0xaaa998,grass:0x748b49,milk:0xf2e9cf}).map(([k,color])=>[k,new THREE.MeshStandardMaterial({color,roughness:k==='metal'?.4:.85,metalness:k==='metal'?.4:0})]));
 const makeGroup=name=>{const g=new THREE.Group();g.name=name;group.add(g);return g;};
 function box(g,w,h,d,m,x,y,z,ry=0,rx=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials[m]);o.position.set(x,y,z);o.rotation.set(rx,ry,0);g.add(o);return o;}
 function cylinder(g,r,h,m,x,y,z,rx=0,rz=0){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),materials[m]);o.position.set(x,y,z);o.rotation.set(rx,0,rz);g.add(o);return o;}
 function merge(g){const buckets=new Map();g.updateMatrix();for(const o of [...g.children])if(o.isMesh){o.updateMatrix();const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(geo);o.geometry.dispose();g.remove(o);}for(const[m,parts]of buckets){const geometry=mergeGeometries(parts);for(const p of parts)p.dispose();const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}}
 const foundation=makeGroup('cow-foundation');box(foundation,11.9,.6,7.4,'concrete',-8.05,-.22,-11.5);merge(foundation);
 const grazing=makeGroup('cow-grazing');box(grazing,3.8,.025,1.65,'grass',-8.2,FLOOR+.0125,-10.9);merge(grazing);
 const shelter=makeGroup('cow-shelter');
 box(shelter,8.9,1.65,.14,'blue',-9.5,.9,-15.08);box(shelter,.14,1.65,7.2,'blue',-13.88,.9,-11.5);
 for(const[x,z]of [[-13.8,-11.45],[-10.8,-11.45],[-5.15,-11.45],[-10.35,-7.95],[-13.8,-7.95]])box(shelter,.13,2.7,.13,'cream',x,1.43,z);
 box(shelter,9.1,.17,3.9,'roof',-9.5,2.86,-13.25,0,-.055);box(shelter,3.75,.17,3.65,'roof',-12.15,2.82,-9.65,0,-.055);
 box(shelter,9.1,.2,.16,'cream',-9.5,2.72,-11.34);box(shelter,.16,.2,3.65,'cream',-10.23,2.72,-9.65);merge(shelter);
 const beds=makeGroup('cow-beds');for(const s of COW_YARD_LAYOUT.stations.filter(s=>s.kind==='bed')){const[x,,z]=s.dock,side=s.facing!==0;box(beds,side?3:2.15,.12,side?1.95:3,'straw',x,FLOOR+.06,z);}
 for(const x of [-13.05,-10.55,-8.05,-5.55]){box(beds,.055,.8,2.55,'metal',x,.55,-13.65);}
 box(beds,2.7,.6,.055,'metal',-12.4,.5,-9.6);merge(beds);
 const fence=makeGroup('cow-fence');for(const[ax,az,bx,bz]of COW_YARD_LAYOUT.fenceSegments){const len=Math.hypot(bx-ax,bz-az),a=Math.atan2(bz-az,bx-ax),n=Math.ceil(len/2);for(let i=0;i<=n;i++)box(fence,.1,1.2,.1,'cream',ax+(bx-ax)*i/n,.68,az+(bz-az)*i/n);for(const y of [.55,1.05])box(fence,len,.075,.075,'metal',(ax+bx)/2,y,(az+bz)/2,-a);}merge(fence);
 const feed=makeGroup('cow-feed');box(feed,5.4,.12,.65,'dark',-8.2,.3,-8.05);for(const z of [-8.37,-7.73])box(feed,5.4,.4,.08,'metal',-8.2,.47,z);merge(feed);
 const grain=box(feed,5.15,.06,.48,'feed',-8.2,.53,-8.05);
 const water=makeGroup('cow-water');box(water,.7,.1,1.65,'dark',-4.8,.28,-10.4);for(const x of [-5.16,-4.44])box(water,.07,.48,1.7,'metal',x,.48,-10.4);for(const z of [-11.22,-9.58])box(water,.7,.48,.07,'metal',-4.8,.48,z);merge(water);
 const waterFill=box(water,.6,.025,1.5,'water',-4.8,.6,-10.4);
 const robot=makeGroup('cow-robot');for(const x of [-4.35,-2.25])for(const z of [-9.4,-13.2])box(robot,.1,1.6,.1,'metal',x,.88,z);for(const x of [-4.35,-2.25])for(const y of [.7,1.35])box(robot,.07,.07,3.8,'metal',x,y,-11.3);
 box(robot,.45,1.5,1.4,'blue',-1.85,.83,-11.3);box(robot,.12,.34,.4,'dark',-2.11,1.25,-11.1);box(robot,2.6,.15,4.3,'roof',-3.25,2.6,-11.3);merge(robot);
 const entryGate=new THREE.Group(),exitGate=new THREE.Group();for(const[g,z]of [[entryGate,-9.4],[exitGate,-13.2]]){g.position.set(-4.35,0,z);for(const y of [.65,1.15])box(g,2.1,.065,.065,'metal',1.05,y,0);merge(g);robot.add(g);}
 const arm=new THREE.Group();arm.name='robot-arm';arm.position.set(-2.3,.35,-11.02);box(arm,1.15,.09,.09,'metal',-.5,0,0);box(arm,.4,.06,.48,'dark',-1,.07,0);for(const x of [-1.13,-.87])for(const z of [-.14,.14])cylinder(arm,.045,.16,'metal',x,.17,z);merge(arm);robot.add(arm);
 const pipe=makeGroup('cow-pipe');cylinder(pipe,.045,1.8,'metal',-1.7,1.5,-11.3);cylinder(pipe,.045,1.7,'metal',-.85,2.4,-11.3,0,Math.PI/2);cylinder(pipe,.045,1.05,'metal',0,1.88,-11.3);merge(pipe);
 const tank=makeGroup('cow-tank');cylinder(tank,.7,2.15,'metal',0,1,-11.3,0,Math.PI/2);for(const x of [-.75,.75])box(tank,.2,.4,.8,'dark',x,.28,-11.3);box(tank,.7,.45,.04,'blue',0,1.1,-10.58);box(tank,.5,.12,.055,'cream',0,1.13,-10.54);
 for(const x of [-1.05,1.05])for(const z of [-12.15,-10.4])box(tank,.08,2.65,.08,'cream',x,1.4,z);box(tank,2.3,.14,2.1,'roof',0,2.8,-11.3);merge(tank);
 const gauge=box(tank,.5,.01,.06,'milk',0,.97,-10.535);
 // Batch fixed pieces across logical components; their groups remain stable
 // anchors for inspection, interaction and moving robot attachments.
 const fixed=makeGroup('cow-static');for(const g of [foundation,grazing,shelter,beds,fence,pipe,robot]){g.userData.bounds=new THREE.Box3().setFromObject(g);for(const o of [...g.children])if(o.isMesh)fixed.add(o);}merge(fixed);
 const robotBounds=new THREE.Box3(new THREE.Vector3(-4.5,.08,-13.5),new THREE.Vector3(-1.6,2.7,-9.1)),point=new THREE.Vector3();
 robot.raycast=function(raycaster,hits){if(!raycaster.ray.intersectBox(robotBounds,point))return;const distance=raycaster.ray.origin.distanceTo(point);if(distance>=raycaster.near&&distance<=raycaster.far)hits.push({distance,point:point.clone(),object:robot});};
 const targets=[{kind:'feed',object:feed},{kind:'water',object:water},{kind:'robot',object:robot},{kind:'tank',object:tank}];for(const t of targets)t.object.userData.hit={type:'cowStation',station:t.kind};
 let disposed=false;
 const api={group,layout:COW_YARD_LAYOUT,stations:COW_YARD_LAYOUT.stations,targets,robot:{arm,entryGate,exitGate},setStatus(c={}){grain.visible=c.feed>0;waterFill.visible=c.waterUntil>Date.now();const total=(c.tank?.normal??0)+(c.tank?.gold??0);gauge.scale.y=Math.max(.01,total/50*25);gauge.position.y=.97+(gauge.scale.y*.01)/2;entryGate.rotation.y=c.job?.stage==='milking'?0:-Math.PI/2;exitGate.rotation.y=c.job?.stage==='milking'?0:Math.PI/2;},setRobotPose(progress){const w=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;const attach=Math.min(1,w*8,(1-w)*8);arm.position.x=-1.2-attach*1.1;arm.position.y=.25+attach*.1;},dispose(){if(disposed)return;disposed=true;const geo=new Set();group.traverse(o=>{if(o.geometry)geo.add(o.geometry);});for(const g of geo)g.dispose();for(const m of Object.values(materials))m.dispose();group.removeFromParent();}};
 api.setStatus();api.setRobotPose(0);return api;
}
