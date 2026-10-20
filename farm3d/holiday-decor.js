import * as T from './lib/three.module.min.js';
import {mergeGeometries} from './lib/addons/utils/BufferGeometryUtils.js';

// Visual consumers only. Existing game IDs, inventories and placed records stay authoritative.
export const HOLIDAY_DECOR_IDS=Object.freeze(['spider','jack','haunted','leaves','turkey','cornucopia','gifts','snowman','xmastree','confetti','popper','fireworks','heart','letter','chapel','chick','bunny','eggstatue','clover','lucky','tophat']);
export const HOLIDAY_AMBIENT=Object.freeze({halloween:'jack',thanksgiving:'turkey',christmas:'xmastree',newyear:'popper',valentine:'heart',easter:'eggstatue',stpatrick:'clover'});
const C={wood:0x68452e,dark:0x242b2a,cream:0xf4e5c1,orange:0xdd7026,green:0x385d3b,red:0xab3e36,gold:0xdca448,white:0xeee9da,blue:0x487d96,pink:0xd67b94};
const triangle=(x,y,a,b,c)=>{const cross=(p,q)=>(x-q[0])*(p[1]-q[1])-(p[0]-q[0])*(y-q[1]);const v=[cross(a,b),cross(b,c),cross(c,a)];return !(v.some(n=>n<0)&&v.some(n=>n>0));};
function pumpkinShell(){
 const s=new T.SphereGeometry(1,48,24),p=s.attributes.position,indices=s.index.array,kept=[],edges=new Map();
 for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];
  const x=(p.getX(a)+p.getX(b)+p.getX(c))/3,y=(p.getY(a)+p.getY(b)+p.getY(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;
  const eye=triangle(x,y,[-.56,.12],[-.17,.12],[-.35,.52])||triangle(x,y,[.17,.12],[.56,.12],[.35,.52]);
  const mouth=Math.abs(x)<.57&&y<-.12&&y>-.43+.45*x*x&&!(Math.abs(x)<.09&&y>-.25);
  if(z>.55&&(eye||mouth))continue;
  kept.push(a,b,c);for(const [u,v]of [[a,b],[b,c],[c,a]]){const key=Math.min(u,v)+':'+Math.max(u,v);if(edges.has(key))edges.delete(key);else edges.set(key,[u,v]);}
 }
 const xyz=[],face=(a,b,c,inner=false)=>{for(const i of [a,b,c]){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),theta=Math.atan2(z,x),rib=1+.065*Math.cos(theta*10),k=inner?.91:1;xyz.push(x*.52*rib*k,y*.43*k,z*.47*rib*k);}};
 for(let i=0;i<kept.length;i+=3){const [a,b,c]=kept.slice(i,i+3);face(a,b,c);face(c,b,a,true);}
 // The opening edges have real thickness; light sits inside, behind the carved shell.
 for(const [a,b]of edges.values())for(const verts of [[[a,false],[b,false],[b,true]],[[a,false],[b,true],[a,true]]])for(const [i,inner]of verts){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rib=1+.065*Math.cos(Math.atan2(z,x)*10),k=inner?.91:1;xyz.push(x*.52*rib*k,y*.43*k,z*.47*rib*k);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.computeVertexNormals();s.dispose();return g;
}

export function createHolidayDecoration(id,{height=1.15,footprint=1.05}={}){
 if(!HOLIDAY_DECOR_IDS.includes(id))return null;
 const root=new T.Group(),body=new T.Group(),materials=new Map();root.name='Holiday '+id;root.userData.holidayId=id;root.add(body);
 const mat=(color,glow=0)=>{const key=color+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.76,emissive:glow?0xffa33c:0x000000,emissiveIntensity:glow}));return materials.get(key);};
 const mesh=(geo,color,x=0,y=0,z=0,rot=[0,0,0],glow=0)=>{const o=new T.Mesh(geo,mat(color,glow));o.position.set(x,y,z);o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;body.add(o);return o;};
 const box=(x,y,z,w,h,d,c,r=0)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,[0,r,0]);
 const ball=(x,y,z,rx,ry,rz,c)=>{const o=mesh(new T.SphereGeometry(1,12,8),c,x,y,z);o.scale.set(rx,ry,rz);return o;};
 const cylinder=(x,y,z,rt,rb,h,c,rot=[0,0,0])=>mesh(new T.CylinderGeometry(rt,rb,h,12),c,x,y,z,rot);
 const ring=(x,y,z,r,t,c,rot=[0,0,0])=>mesh(new T.TorusGeometry(r,t,5,20),c,x,y,z,rot);
 const rod=(a,b,r,c)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),v=to.clone().sub(from),o=cylinder(0,0,0,r,r,v.length(),c);o.position.copy(from.add(to).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
 const shape=(points,depth,c,x=0,y=0,z=0)=>{const s=new T.Shape();points.forEach(([px,py],i)=>i?s.lineTo(px,py):s.moveTo(px,py));s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:8}),c,x,y,z);};
 const star=(x,y,z,r,c)=>shape(Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,k=i%2?r*.45:r;return [Math.cos(a)*k,Math.sin(a)*k];}),.07,c,x,y,z);
 const heart=(x,y,z,r,c)=>{const s=new T.Shape();s.moveTo(0,-r);s.bezierCurveTo(-r*1.6,0,-r,1.2*r,0,.55*r);s.bezierCurveTo(r,1.2*r,r*1.6,0,0,-r);return mesh(new T.ExtrudeGeometry(s,{depth:r*.45,bevelEnabled:true,bevelSize:r*.08,bevelThickness:r*.08,bevelSegments:1,steps:1,curveSegments:8}),c,x,y,z);};
 const base=()=>cylinder(0,.06,0,.46,.5,.12,C.wood);
 const roof=(x,y,z,w,h,depth,color)=>shape([[-w/2,0],[w/2,0],[0,h]],depth,color,x,y,z-depth/2);
 const house=(haunted)=>{
  box(0,.07,0,1.18,.14,.92,C.wood);box(0,.63,0,.96,1,.7,haunted?0x807466:C.cream);
  roof(0,1.13,0,1.2,.48,.94,haunted?0x473e4c:C.red);
  box(-.24,.59,.36,.2,.27,.035,C.dark);box(.24,.59,.36,.2,.27,.035,C.dark);box(0,.37,.37,.18,.5,.04,C.wood);
  for(const x of [-.24,.24]){box(x,.59,.386,.025,.27,.02,C.gold);box(x,.59,.386,.2,.025,.02,C.gold);}
  if(haunted){box(-.25,.75,.404,.32,.055,.025,C.wood,-.25);box(.3,1.32,-.16,.14,.48,.16,C.wood);ball(.24,1.38,.11,.035,.035,.035,C.gold);}
  else{box(0,1.4,0,.32,.55,.34,C.white);cylinder(0,1.83,0,0,.3,.42,C.green);rod([0,2.04,0],[0,2.29,0],.025,C.gold);rod([-.09,2.2,0],[.09,2.2,0],.025,C.gold);}
 };
 switch(id){
 case 'jack':{
  mesh(pumpkinShell(),C.orange,0,.45,0);const light=mesh(new T.SphereGeometry(.33,12,8),0xffb447,0,.44,0,[0,0,0],.7);light.castShadow=false;
  cylinder(.025,.94,0,.055,.075,.2,C.wood,[0,0,-.2]);ball(.13,.96,0,.13,.025,.065,C.green).rotation.z=.35;break;
 }
 case 'spider':{
  for(const x of [-.5,.5]){box(x,.65,0,.065,1.3,.16,C.wood);cylinder(x,.05,0,.16,.16,.1,C.wood);}rod([-.5,1.2,0],[.5,1.2,0],.035,C.wood);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([0,.72,0],[Math.cos(a)*.45,.72+Math.sin(a)*.45,0],.012,C.cream);}
  for(const r of [.18,.32,.45])ring(0,.72,0,r,.012,C.cream);
  ball(.16,.7,.05,.07,.095,.065,C.dark);for(let i=0;i<4;i++)for(const sign of [-1,1])rod([.16+sign*.04,.66+i*.025,.05],[.16+sign*.16,.62+i*.05,.1],.012,C.dark);break;
 }
 case 'haunted':house(true);break;
 case 'chapel':house(false);break;
 case 'leaves':{
  for(let i=0;i<19;i++){const a=i*2.4,r=.07+Math.sqrt(i/19)*.36,o=ball(Math.cos(a)*r,.08+.1*(1-i/19),Math.sin(a)*r,.19,.045,.09,[C.orange,C.gold,C.red][i%3]);o.rotation.set(.1*Math.sin(i),a,.2*Math.cos(i));}break;
 }
 case 'turkey':{
  for(let i=0;i<7;i++){const a=(i-3)*.32,o=ball(Math.sin(a)*.3,.65+Math.cos(a)*.22,-.18,.095,.35,.06,i%2?C.orange:C.gold);o.rotation.z=-a;}
  ball(0,.48,0,.3,.36,.25,C.wood);ball(0,.88,.16,.14,.18,.14,C.cream);cylinder(.07,.84,.31,0,.08,.17,C.gold,[Math.PI/2,0,0]);ball(-.04,.77,.3,.04,.1,.035,C.red);
  for(const x of [-.08,.08]){ball(x,.94,.27,.02,.025,.012,C.dark);rod([x,.1,.03],[x,.31,.01],.025,C.gold);rod([x-.06,.08,.16],[x+.06,.08,.16],.025,C.gold);}break;
 }
 case 'cornucopia':{
  cylinder(0,.23,0,.44,.32,.42,C.wood);for(const y of [.12,.25,.4])ring(0,y,0,.34+y*.2,.025,C.gold,[Math.PI/2,0,0]);ring(0,.58,0,.4,.04,C.wood);
  for(let i=0;i<7;i++){const a=i*2.4;ball(Math.cos(a)*.25,.43+(i%2)*.13,Math.sin(a)*.23,.13,.14,.12,[C.orange,C.red,C.green,C.gold][i%4]);}break;
 }
 case 'gifts':{
  const gift=(x,y,z,w,h,c)=>{box(x,y+h/2,z,w,h,w,c);box(x,y+h+.018,z,w+.035,.06,w+.035,c);box(x,y+h/2,z,w*.16,h+.08,w+.045,C.gold);box(x,y+h/2,z,w+.045,h+.08,w*.16,C.gold);for(const sign of [-1,1])ring(x+sign*w*.14,y+h+.1,z,w*.15,.025,C.gold,[0,sign*.4,0]);};
  gift(-.18,0,0,.6,.5,C.red);gift(.28,0,.15,.4,.36,C.green);gift(-.15,.56,0,.36,.32,C.blue);break;
 }
 case 'snowman':{
  ball(0,.31,0,.36,.32,.33,C.white);ball(0,.72,0,.27,.26,.26,C.white);ball(0,1.04,0,.2,.2,.2,C.white);ring(0,.91,0,.22,.045,C.red,[Math.PI/2,0,0]);box(.17,.75,.25,.09,.31,.045,C.red);cylinder(0,1.26,0,.25,.25,.055,C.dark);cylinder(0,1.37,0,.15,.16,.2,C.dark);
  cylinder(0,1.04,.26,0,.045,.23,C.orange,[Math.PI/2,0,0]);for(const x of [-.075,.075])ball(x,1.1,.18,.022,.025,.016,C.dark);for(const y of [.62,.76])ball(0,y,.26,.025,.025,.02,C.dark);for(const sign of [-1,1])rod([sign*.2,.75,0],[sign*.5,.93,.02],.024,C.wood);break;
 }
 case 'xmastree':{
  cylinder(0,.1,0,.23,.18,.2,C.wood);cylinder(0,.35,0,.07,.08,.5,C.wood);
  for(let k=0;k<3;k++)cylinder(0,.65+k*.34,0,0,.56-k*.14,.7,k%2?0x416e46:C.green);
  for(let i=0;i<12;i++){const a=i*2.4,y=.42+(i%4)*.23,r=.48-(y-.42)*.34;ball(Math.sin(a)*r,y,Math.cos(a)*r,.045,.045,.045,i%2?C.red:C.gold);}star(0,1.72,0,.15,C.gold);break;
 }
 case 'confetti':{
  base();rod([0,.1,0],[0,.7,0],.04,C.gold);ball(0,.86,0,.35,.35,.35,C.blue);
  for(let i=0;i<16;i++){const a=i*2.4,y=((i%5)/4-.5)*.5,r=Math.sqrt(.35*.35-y*y);box(Math.cos(a)*r,.86+y,Math.sin(a)*r,.09,.09,.07,[C.gold,C.pink,C.cream][i%3],-a);}break;
 }
 case 'popper':{
  base();cylinder(-.04,.45,0,.28,.11,.65,C.blue,[0,0,-.2]);ring(.025,.78,0,.27,.035,C.gold,[Math.PI/2,0,-.2]);
  for(let i=0;i<5;i++){const a=i*1.5;rod([0,.76,0],[Math.cos(a)*.33,1.02+i*.035,Math.sin(a)*.2],.018,[C.red,C.gold,C.pink][i%3]);star(Math.cos(a)*.33,1.05+i*.035,Math.sin(a)*.2,.07,C.gold);}break;
 }
 case 'fireworks':{
  box(0,.16,0,.8,.32,.6,C.wood);for(let i=0;i<3;i++){const x=(i-1)*.24,h=.7+i*.14;rod([x,.2,0],[x,h+.15,0],.022,C.cream);cylinder(x,h,0,.08,.08,.45,[C.red,C.blue,C.green][i]);cylinder(x,h+.32,0,0,.13,.2,C.gold);}break;
 }
 case 'heart':base();heart(0,.65,-.08,.42,C.red);box(0,.65,.14,.12,.66,.07,C.gold);star(0,.64,.19,.12,C.gold);break;
 case 'letter':{
  base();rod([0,.12,0],[0,.75,0],.035,C.wood);box(0,.75,0,.8,.55,.12,C.cream);rod([-.38,.99,.075],[0,.72,.075],.015,C.gold);rod([.38,.99,.075],[0,.72,.075],.015,C.gold);heart(0,.71,.07,.09,C.red);break;
 }
 case 'chick':{
  ball(0,.23,0,.34,.26,.29,C.cream);ball(0,.52,0,.27,.3,.25,C.gold);ball(0,.78,.04,.22,.22,.2,C.gold);for(const x of [-.08,.08])ball(x,.84,.22,.022,.028,.02,C.dark);cylinder(0,.75,.28,0,.06,.16,C.orange,[Math.PI/2,0,0]);for(const sign of [-1,1])ball(sign*.26,.51,0,.08,.18,.16,C.gold);break;
 }
 case 'bunny':{
  ball(0,.3,0,.3,.31,.24,C.cream);ball(0,.64,0,.23,.24,.2,C.cream);
  for(const sign of [-1,1]){ball(sign*.12,1,0,.085,.32,.075,C.cream);ball(sign*.12,1.02,.06,.045,.23,.025,C.pink);ball(sign*.08,.7,.18,.025,.03,.016,C.dark);ball(sign*.16,.08,.17,.14,.08,.15,C.cream);}ball(0,.61,.215,.045,.03,.025,C.pink);ball(.28,.24,-.1,.12,.12,.12,C.white);break;
 }
 case 'eggstatue':{
  base();const egg=ball(0,.66,0,.34,.52,.32,C.cream);const p=egg.geometry.attributes.position;for(let i=0;i<p.count;i++){const k=1-p.getY(i)*.17;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}egg.geometry.computeVertexNormals();
  for(const [y,r,c]of [[.44,.32,C.pink],[.66,.34,C.blue],[.88,.29,C.gold]])ring(0,y,0,r,.035,c,[Math.PI/2,0,0]);break;
 }
 case 'clover':case 'lucky':{
  cylinder(0,.13,0,.23,.18,.26,C.wood);rod([0,.2,0],[0,.8,0],.025,C.green);
  const n=id==='clover'?3:4;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,o=heart(Math.sin(a)*.18,.8+Math.cos(a)*.18,0,.19,C.green);o.rotation.z=-a;}
  break;
 }
 case 'tophat':{
  cylinder(0,.07,0,.48,.48,.12,C.green);cylinder(0,.48,0,.29,.31,.75,C.green);cylinder(0,.29,0,.314,.314,.14,C.dark);box(0,.29,.325,.22,.17,.055,C.gold);box(0,.29,.36,.12,.08,.025,C.dark);break;
 }
 }
 // Fit existing placement footprints; normalize complete geometry onto the ground.
 body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const k=Math.min(height/size.y,footprint/Math.max(size.x,size.z));body.position.set(-center.x*k,-bounds.min.y*k,-center.z*k);body.scale.setScalar(k);body.updateMatrixWorld(true);
 // Merge by material to bound draw calls. Every resulting resource is owned by this prop.
 const buckets=new Map(),sourceGeometries=new Set();body.traverse(o=>{if(o.isMesh){sourceGeometries.add(o.geometry);const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.deleteAttribute('uv');g.applyMatrix4(o.matrixWorld);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);}});
 root.remove(body);for(const [material,geometries]of buckets){const geometry=mergeGeometries(geometries,false);if(!geometry)throw Error('holiday geometry merge failed: '+id);geometries.forEach(g=>g.dispose());const o=new T.Mesh(geometry,material);o.castShadow=true;o.receiveShadow=true;root.add(o);}sourceGeometries.forEach(g=>g.dispose());
 let disposed=false;root.userData.dispose=()=>{if(disposed)return;disposed=true;root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});materials.forEach(m=>m.dispose());};
 return root;
}
