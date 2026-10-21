import * as THREE from './lib/three.module.min.js';
import {CHICKEN_CARE} from './chicken-care.js?v=2';
import {mergeGeometries} from './lib/addons/utils/BufferGeometryUtils.js';

const DEFAULT={walls:'wood',roof:'red',trim:'cream',roofType:'metal'};
const PAINT={walls:{wood:0x95683f,sage:0x788b62,cream:0xe4d5ac,red:0x9a3c30,white:0xe8e1cf},roof:{red:0x934336,charcoal:0x353b3a,green:0x3c5548},trim:{cream:0xeee3cc,white:0xf8f4e7,dark:0x493729}};
export const CHICKEN_YARD_LAYOUT=Object.freeze({
  polygon:[[-16.5,-5.8],[-4.9,-5.8],[-4.9,5],[-16.5,5]],gate:[-6.8,-5.3],
  fenceSegments:[[-16.5,-5.8,-4.9,-5.8],[-16.5,-5.8,-16.5,5],[-16.5,5,-6.8,5],[-5.3,5,-4.9,5],[-4.9,-5.8,-4.9,5]],
  obstacles:[[-11.4,-2.2,3.1,3.05],[-11.6,1.55,.82,1.63],[-7.1,3.65,.65,.65],[-6,2.6,.65,.65],[-7.6,6.3,1.15,.88],[-9.5,1.2,.82,1.3]],
  bed:[-7.85,1.5,1.5],shelter:{x:[-8.7,-8.3],z:[-3.4,-1]},water:[-6,2.6,1.1,1.1],
});
export function createChickenYard(){
  const group=new THREE.Group();group.name='chicken-yard';
  const materials={wood:mat(0x805735),walls:mat(PAINT.walls.wood),trim:mat(PAINT.trim.cream),roof:mat(PAINT.roof.red),metal:mat(0x59615b,.55),dark:mat(0x242d26),ivory:mat(0xe2dbbf),feed:mat(0xb99743),water:mat(0x497e88,.28),egg:mat(0xe9dcc0)};
  function mat(color,roughness=.88){return new THREE.MeshStandardMaterial({color,roughness,metalness:0});}
  function box(g,w,h,d,m,x=0,y=0,z=0,rx=0,rz=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials[m]);o.position.set(x,y,z);o.rotation.set(rx,0,rz);g.add(o);return o;}
  function cylinder(g,r1,r2,h,m,x,y,z){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,12),materials[m]);o.position.set(x,y,z);g.add(o);return o;}
  function merge(g){const buckets=new Map();g.updateMatrixWorld(true);for(const o of [...g.children])if(o.isMesh){const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(geo);o.geometry.dispose();g.remove(o);}for(const[m,parts]of buckets){const geometry=mergeGeometries(parts);for(const p of parts)p.dispose();const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}return g;}
  const coop=new THREE.Group();coop.name='coop';
  box(coop,2.8,.17,3,'wood',0,.55,0);
  box(coop,2.8,.006,3,'feed',0,.638,0); // shared straw floor; no new texture or material
  for(const x of [-1.22,1.22])for(const z of [-1.25,1.25])box(coop,.16,.58,.16,'wood',x,.28,z);
  const doorCenters=[(-11.6+11.4)/2.2,(-9.5+11.4)/2.2],doorHalf=.31;
  for(let i=0;i<14;i++)box(coop,.185,1.7,.12,'walls',-1.3+i*.2,1.45,-1.4);
  let edge=-1.4;for(const x of doorCenters){const end=x-doorHalf;if(end>edge)box(coop,end-edge,1.7,.12,'walls',(edge+end)/2,1.45,1.4);box(coop,doorHalf*2,.5,.12,'walls',x,2.05,1.4);edge=x+doorHalf;}
  box(coop,1.4-edge,1.7,.12,'walls',(edge+1.4)/2,1.45,1.4);
  for(const x of [-1.35,1.35])box(coop,.12,1.7,2.8,'walls',x,1.45,0);
  const gableShape=new THREE.Shape();gableShape.moveTo(-1.35,0);gableShape.lineTo(1.35,0);gableShape.lineTo(0,.57);gableShape.closePath();
  const gable=new THREE.Mesh(new THREE.ExtrudeGeometry(gableShape,{depth:2.8,bevelEnabled:false,steps:1}),materials.walls);gable.position.set(0,2.3,-1.4);coop.add(gable);
  for(const x of [-1.4,1.4])for(const z of [-1.44,1.44])box(coop,.13,1.8,.13,'trim',x,1.46,z);
  for(const center of doorCenters){box(coop,.71,.1,.13,'trim',center,1.8,1.5);for(const x of [-.355,.355])box(coop,.09,1.25,.12,'trim',center+x,1.2,1.5);}
  for(const x of [-.94]){box(coop,.48,.48,.06,'dark',x,1.77,1.49);box(coop,.59,.07,.11,'trim',x,2.04,1.52);box(coop,.59,.07,.11,'trim',x,1.5,1.52);box(coop,.05,.5,.1,'trim',x,1.77,1.54);}
  for(const side of [-1,1])box(coop,1.65,.12,3.25,'roof',side*.7,2.55,0,0,-side*.38);
  box(coop,.12,.13,3.27,'trim',0,2.9,0);
  box(coop,1.15,.55,.55,'wood',1,1,-1.6);box(coop,1.25,.1,.66,'roof',1,1.32,-1.6,-.1);
  box(coop,.35,.1,2.2,'roof',1.35,2.1,0,0,-.12); // covered side shelter, clear of the walking lane
  merge(coop);coop.scale.set(2.2,1.05,1.7);coop.position.set(-11.4,0,-2.2);group.add(coop);
  const roofDetails={};for(const kind of ['metal','shingles']){const details=new THREE.Group();const count=kind==='metal'?11:5;for(const side of [-1,1])for(let i=0;i<count;i++)box(details,kind==='metal'?1.65:.025,.025,kind==='metal'?.022:3.12,'roof',kind==='metal'?side*.7:side*(.13+i*.29),kind==='metal'?2.62:2.9-(.13+i*.29)*.4,kind==='metal'?-1.48+i*.296:0,0,-side*.38);merge(details);details.position.copy(coop.position);details.scale.copy(coop.scale);group.add(details);roofDetails[kind]=details;}
  const floor=.641*1.05;
  const accesses=[[-11.6,2.99,3.55,1],[-9.5,2.1,2.75,5]].map(([x,start,outside,obstacle],i)=>({id:'coop-door-'+i,floor,rampStart:[x,0,start],rampEnd:[x,floor,.35],entry:[x,floor,-.38],outside:[x,0,outside],obstacle}));
  const ramp=new THREE.Group();for(const A of accesses){const run=A.rampStart[2]-A.rampEnd[2],pitch=Math.atan2(floor,run);A.pitch=pitch;
   box(ramp,1.2,.06,Math.hypot(run,floor)+.004,'wood',A.entry[0],floor/2-.03*Math.cos(pitch),(A.rampStart[2]+A.rampEnd[2])/2-.03*Math.sin(pitch),pitch);
   for(let i=1;i<10;i++){const u=i/10;box(ramp,1.18,.002,.045,'wood',A.entry[0],floor*u+.001*Math.cos(pitch),A.rampStart[2]-run*u+.001*Math.sin(pitch),pitch);}
  }merge(ramp);group.add(ramp);
  const access=accesses[0],stations=[];
  // Fill each row's outer places before its centre, then advance toward its door.
  // Reverse order on departure clears the centre before its neighbours stand.
  for(let row=0;row<5;row++)for(const dx of [-.7,.7,0])for(const A of accesses){const z=-3.85+row*.73,x=A.entry[0];stations.push({id:'hen-bed-'+stations.length,kind:'bed',lane:A.id,dock:[x+dx,floor,z],approach:A.outside,facing:0,surface:floor,path:[A.rampStart,A.rampEnd,A.entry,[x,floor,z],[x+dx,floor,z]]});}
  for(const [kind,x,z,angles,radius,contactRadius,height] of [['feed',-7.1,3.65,[-Math.PI/2,Math.PI,Math.PI/2],.9,.565,.244],['drink',-6,2.6,[Math.PI,0],.88,.49,.25]])for(const a of angles){const dx=Math.sin(a),dz=Math.cos(a);stations.push({id:'hen-'+kind+'-'+stations.length,kind,dock:[x+dx*radius,0,z+dz*radius],approach:[x+dx*(radius+.3),0,z+dz*(radius+.3)],facing:Math.atan2(dx,dz),contact:[x+dx*contactRadius,height,z+dz*contactRadius]});}
  function sampleStationSupport(id,x,z){
    if(!stations.some(s=>s.id===id))return {height:0,normal:[0,1,0],inside:false};
    for(const A of accesses)if(Math.abs(x-A.entry[0])<=.6&&z>=A.rampEnd[2]-1e-8&&z<=A.rampStart[2]+1e-8)return {height:floor*Math.max(0,Math.min(1,(A.rampStart[2]-z)/(A.rampStart[2]-A.rampEnd[2]))),normal:[0,Math.cos(A.pitch),Math.sin(A.pitch)],inside:true};
    if(x>=-14.25&&x<=-8.55&&z>=-4.58&&z<=.35)return {height:floor,normal:[0,1,0],inside:true};
    return {height:0,normal:[0,1,0],inside:false};
  }
  const fence=new THREE.Group(),wireEdges=[],seen=new Set();
  for(const[ax,az,bx,bz]of CHICKEN_YARD_LAYOUT.fenceSegments){const len=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/len,dz=(bz-az)/len;const posts=Math.max(1,Math.ceil(len/1.9));for(let i=0;i<=posts;i++){const s=i/posts;box(fence,.13,1.5,.13,'wood',ax+(bx-ax)*s,.75,az+(bz-az)*s);box(fence,.18,.07,.18,'trim',ax+(bx-ax)*s,1.51,az+(bz-az)*s);}
    for(let col=0;col<Math.ceil(len/.3);col++)for(let row=0;row<4;row++){const cx=col*.3,cy=.22+row*.346+(col%2)*.173;for(let k=0;k<6;k++){const a=k*Math.PI/3,b=(k+1)*Math.PI/3;const x1=Math.max(0,Math.min(len,cx+.2*Math.cos(a))),x2=Math.max(0,Math.min(len,cx+.2*Math.cos(b))),y1=Math.min(1.43,cy+.2*Math.sin(a)),y2=Math.min(1.43,cy+.2*Math.sin(b));if(Math.hypot(x1-x2,y1-y2)<.001)continue;const p=new THREE.Vector3(ax+dx*x1,y1,az+dz*x1),q=new THREE.Vector3(ax+dx*x2,y2,az+dz*x2);const ends=[p.toArray().map(n=>n.toFixed(3)).join(','),q.toArray().map(n=>n.toFixed(3)).join(',')].sort().join('/');if(!seen.has(ends)){seen.add(ends);wireEdges.push([p,q]);}}}}
  merge(fence);group.add(fence);
  const wireGeo=new THREE.CylinderGeometry(.008,.008,1,3),wire=new THREE.InstancedMesh(wireGeo,materials.metal,wireEdges.length),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  wireEdges.forEach(([p,q],i)=>{const delta=q.clone().sub(p);dummy.position.copy(p).add(q).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,delta.clone().normalize());dummy.scale.set(1,delta.length(),1);dummy.updateMatrix();wire.setMatrixAt(i,dummy.matrix);});wire.castShadow=false;group.add(wire);
  const feed=new THREE.Group();feed.name='feed';cylinder(feed,.47,.42,.12,'metal',0,.12,0);cylinder(feed,.3,.4,.6,'ivory',0,.46,0);cylinder(feed,.35,.35,.08,'roof',0,.8,0);merge(feed);feed.position.set(-7.1,0,3.65);feed.scale.set(1.3,1.2,1.3);group.add(feed);
  const grain=new THREE.Mesh(new THREE.RingGeometry(.404,.455,24),materials.feed);grain.rotation.x=-Math.PI/2;grain.position.set(0,.203333,0);feed.add(grain);
  const water=new THREE.Group();water.name='water';cylinder(water,.45,.4,.12,'metal',0,.12,0);cylinder(water,.29,.29,.75,'ivory',0,.6,0);cylinder(water,.31,.25,.1,'roof',0,1.03,0);merge(water);water.position.set(-6,0,2.6);water.scale.set(1.35,1.25,1.35);group.add(water);
  const waterFill=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.03,12),materials.water);waterFill.position.set(0,.2,0);water.add(waterFill);
  const eggs=new THREE.Group();eggs.name='eggs';for(const x of [-.64,.64])box(eggs,.15,.12,1.15,'wood',x,.08,0);for(let i=0;i<6;i++)box(eggs,1.6,.09,.14,'trim',0,.18,-.5+i*.2);merge(eggs);eggs.position.set(-7.6,0,6.3);eggs.scale.set(1.35,1,1.35);group.add(eggs);
  const crates=[];for(let i=0;i<4;i++){const g=new THREE.Group(),x=i%2? .4:-.4,z=i<2?-.26:.26;box(g,.71,.07,.45,'wood',x,.28,z);for(const xx of [-.35,.35])box(g,.045,.25,.45,'wood',x+xx,.4,z);for(const zz of [-.21,.21])box(g,.71,.25,.045,'wood',x,.4,z+zz);for(let n=0;n<4;n++){const o=new THREE.Mesh(new THREE.SphereGeometry(.075,8,5),materials.egg);o.scale.y=1.3;o.position.set(x+(n%2?.15:-.15),.4,z+(n<2?-.10:.10));g.add(o);}merge(g);eggs.add(g);crates.push(g);}
  const targets=[{kind:'coop',object:coop},{kind:'feed',object:feed},{kind:'water',object:water},{kind:'eggs',object:eggs}];
  for(const t of targets)t.object.userData.hit={type:'chickenStation',station:t.kind};
  // Pick the complete pallet footprint, including the gaps between its slats.
  // This adds no render geometry and leaves genuinely nearer animals selectable.
  const palletBounds=new THREE.Box3(new THREE.Vector3(-.82,.015,-.59),new THREE.Vector3(.82,.55,.59)),pickInverse=new THREE.Matrix4(),pickRay=new THREE.Ray(),pickPoint=new THREE.Vector3();
  eggs.raycast=function(raycaster,hits){pickInverse.copy(this.matrixWorld).invert();pickRay.copy(raycaster.ray).applyMatrix4(pickInverse);if(!pickRay.intersectBox(palletBounds,pickPoint))return;pickPoint.applyMatrix4(this.matrixWorld);const distance=raycaster.ray.origin.distanceTo(pickPoint);if(distance>=raycaster.near&&distance<=raycaster.far)hits.push({distance,point:pickPoint.clone(),object:this});};
  let disposed=false;
  const api={group,targets,stations,access,accesses,sampleStationSupport,layout:CHICKEN_YARD_LAYOUT,applyAppearance(appearance={}){const a={...DEFAULT,...appearance};for(const k of ['walls','roof','trim']){if(!Object.hasOwn(PAINT[k],a[k]))a[k]=DEFAULT[k];materials[k].color.setHex(PAINT[k][a[k]]);}if(!['metal','shingles'].includes(a.roofType))a.roofType='metal';roofDetails.metal.visible=a.roofType==='metal';roofDetails.shingles.visible=a.roofType==='shingles';group.userData.appearance={...a};},setStatus(s){grain.visible=s.feedMs>0;waterFill.visible=s.waterMs>0;crates.forEach((g,i)=>g.visible=s.total>i*(CHICKEN_CARE.capacity/4));},dispose(){if(disposed)return;disposed=true;const geometries=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});for(const g of geometries)g.dispose();for(const m of Object.values(materials))m.dispose();group.removeFromParent();}};
  api.applyAppearance(DEFAULT);api.setStatus({total:0,feedMs:0,waterMs:0});return api;
}
