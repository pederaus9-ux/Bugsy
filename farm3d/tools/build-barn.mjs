import * as T from '../lib/three.module.min.js';
import {writeFileSync,mkdirSync} from 'node:fs';
// Original Sunny Acres mesh recipe. Offline authoring, not runtime construction.
const groups=[[],[],[],[]];
function solid(shape,depth,bevel,material,x=0,y=0,z=0,rotation=0) {
 const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1,curveSegments:1});
 g.translate(0,0,-depth/2);g.rotateY(rotation);g.translate(x,y,z);groups[material].push(g);
}
function block(w,h,d,m,x,y,z,b=.025,r=0) {
 const s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();solid(s,d,b,m,x,y,z,r);
}
function beam(a,b,width,depth,m,z) {
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 const g=new T.BoxGeometry(width,length,depth).toNonIndexed();g.rotateZ(-Math.atan2(dx,dy));g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,z);groups[m].push(g);
}
const profile=[[-4,.7],[4,.7],[4,4.2],[2.75,6.4],[0,7.5],[-2.75,6.4],[-4,4.2]];
const s=new T.Shape(profile.map(p=>new T.Vector2(...p)));
solid(s,.16,.015,0,0,0,-5.5);
// Front gable is a separate loft silhouette; front door aperture remains open.
const loft=new T.Shape([[-4,3.8],[4,3.8],[4,4.2],[2.75,6.4],[0,7.5],[-2.75,6.4],[-4,4.2]].map(p=>new T.Vector2(...p)));solid(loft,.16,.015,0,0,0,5.5);
for(const sd of [-1,1]) {
 block(2.05,3.1,.18,0,sd*2.97,2.25,5.5);
 // Side boards broken into deliberate widths, with subtle material-color variation.
 for(let i=0;i<28;i++) block(.37,3.48,.13,0,sd*4,2.45,-5.3+i*.393,.016,Math.PI/2);
 for(const zz of [-5.53,5.53]) block(.24,3.65,.25,1,sd*4,2.48,zz);
 block(.2,.18,11.5,1,sd*4.06,4.18,0,.02);
 for(const zz of [-2.6,2.6]) {
  // Dark inset plus substantial cream casing and projecting sill.
  block(1.1,1.1,.10,3,sd*4.10,2.65,zz,.01,Math.PI/2);
  for(const dz of [-.65,.65]) block(.18,1.45,.2,1,sd*4.21,2.65,zz+dz,.02);
  for(const dy of [-.65,.65]) block(.22,.18,1.45,1,sd*4.21,2.65+dy,zz,.02);
  block(.28,.13,1.6,1,sd*4.25,1.92,zz,.025);
  block(.15,1.12,.065,1,sd*4.24,2.65,zz,.012);
  block(.15,.065,1.12,1,sd*4.24,2.65,zz,.012);
 }
}
// Broad vertical boards on front wings, loft and back; reveal seams at Walk distance.
for(const zz of [-5.62,5.62]) for(let i=0;i<20;i++) {
 const x=-3.8+i*.4,ax=Math.abs(x);
 const top=ax>2.75?4.2+(4-ax)*2.2/1.25:7.5-ax*1.1/2.75;
 const bottom=zz>0&&ax<1.95?3.82:.72;
 block(.365,Math.max(.1,top-bottom-.12),.055,0,x,(top+bottom)/2,zz,.008);
}
// Foundation courses; four shared materials keep surface count bounded.
for(const sd of [-1,1]) for(let row=0;row<2;row++) for(let i=0;i<15;i++) block(.75,.28,.30,2,sd*4.03,.18+row*.31,-5.4+i*.77,.035,Math.PI/2);
for(const zz of [-5.5,5.5]) for(let i=0;i<10;i++) if(zz<0||Math.abs(-3.6+i*.8)>2) block(.75,.59,.28,2,-3.6+i*.8,.34,zz,.04);
// Gambrel roof panels and raised standing seams follow the existing silhouette.
for(const sd of [-1,1]) for(const [a,b] of [[[4.36,3.8],[2.75,6.48]],[[2.75,6.48],[0,7.6]]]) {
 const p=[a[0]*sd,a[1]],q=[b[0]*sd,b[1]];
 beam(p,q,.14,11.8,3,0);
 const len=Math.hypot(q[0]-p[0],q[1]-p[1]),nx=(q[1]-p[1])/len*sd*.10,ny=-(q[0]-p[0])/len*sd*.10;
 const tx=(q[0]-p[0])/len*.12,ty=(q[1]-p[1])/len*.12;
 for(let i=0;i<19;i++) beam([p[0]+nx+tx,p[1]+ny+ty],[q[0]+nx-tx,q[1]+ny-ty],.04,.045,3,-5.8+i*.64);
 for(const zz of [-5.88,5.88]) beam(p,q,.20,.18,1,zz);
}
block(.30,.20,11.9,3,0,7.64,0);
// Continuous hip caps close the junction between the two roof pitches.
for(const sd of [-1,1])block(.30,.25,11.88,3,sd*2.75,6.52,0,.015);
// Door casing and preview leaves; gameplay integration will retain animated pivots.
for(const x of [-1.98,1.98]) block(.22,3.3,.23,1,x,2.32,5.72);
block(4.18,.25,.25,1,0,3.98,5.72);
for(const sd of [-1,1]) {
 block(1.85,3.08,.13,0,sd*.95,2.24,5.68,.015);
 for(const y of [.73,3.76]) block(1.85,.13,.10,1,sd*.95,y,5.80,.01);
 for(const x of [sd*.04,sd*1.86]) block(.13,3.08,.10,1,x,2.24,5.80,.01);
 beam([sd*.08,.83],[sd*1.82,3.65],.13,.10,1,5.82);
 beam([sd*.08,3.65],[sd*1.82,.83],.13,.10,1,5.82);
 block(.075,.28,.12,3,sd*.22,2.05,5.90,.01);
}
block(1.6,1.4,.14,3,0,5.4,5.7,.02);
for(const x of [-.87,.87]) block(.14,1.58,.16,1,x,5.4,5.82,.015);
for(const y of [4.63,6.17]) block(1.88,.14,.16,1,0,y,5.82,.015);
beam([-.76,4.76],[.76,6.05],.12,.10,1,5.86);
beam([-.76,6.05],[.76,4.76],.12,.10,1,5.86);
block(1.0,.72,1.0,0,0,7.98,0);
block(1.36,.18,1.36,3,0,8.43,0);
block(.06,.8,.06,3,0,8.88,0,.008);
block(.8,.06,.10,3,.1,9.20,0,.008);
// Braced canopy and corbels establish a broad crafted silhouette at phone size.
block(4.75,.18,1.12,3,0,4.35,6.12,.025);
for (const sd of [-1,1]) {
 block(.22,.72,.22,1,sd*2.15,4.0,5.88,.02);
 beam([sd*1.70,3.78],[sd*2.20,4.28],.15,.19,1,5.93);
 block(.22,.70,.18,3,sd*2.42,2.7,5.75,.03);
 block(.36,.36,.28,1,sd*2.42,2.72,5.95,.03);
}

const doc={asset:{version:'2.0',generator:'Sunny Acres original barn recipe v1'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'SunnyBarn',children:[]}],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[]};
const chunks=[];let total=0;
function attribute(array,type,min,max) {
 const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),offset=total;chunks.push(bytes);total+=bytes.length;
 const bufferView=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target:34962})-1;
 return doc.accessors.push({bufferView,componentType:5126,count:array.length/(type==='VEC2'?2:3),type,...(min?{min,max}:{})})-1;
}
const colors=[0xa84335,0xf0dbaf,0x868078,0x424e57];
for(let m=0;m<4;m++) {
 const pos=[],nor=[],col=[],uv=[];let n=0;
 for(const g of groups[m]) {
  pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);
  const p=g.attributes.position,normal=g.attributes.normal;
  for(let i=0;i<p.count;i++) {
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),ny=Math.abs(normal.getY(i));
   uv.push((Math.abs(normal.getX(i))>.7?z:x)*.75,(ny>.7?z:y)*.75);
  }
  const tone=.93+((n++*7)%11)*.013,c=new T.Color(colors[m]).multiplyScalar(tone);
  for(let i=0;i<g.attributes.position.count;i++)col.push(c.r,c.g,c.b);g.dispose();
 }
 const p=new Float32Array(pos),normal=new Float32Array(nor),color=new Float32Array(col),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.length;i++){min[i%3]=Math.min(min[i%3],p[i]);max[i%3]=Math.max(max[i%3],p[i]);}
 const attributes={POSITION:attribute(p,'VEC3',min,max),NORMAL:attribute(normal,'VEC3'),COLOR_0:attribute(color,'VEC3'),TEXCOORD_0:attribute(new Float32Array(uv),'VEC2')};
 doc.materials.push({name:['Painted wood','Cream trim','Foundation stone','Roof and hardware'][m],pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:m===3?.12:0,roughnessFactor:m===3?.72:.93}});
 doc.meshes.push({primitives:[{attributes,material:m}]});doc.nodes[0].children.push(doc.nodes.length);doc.nodes.push({name:'BarnSurface'+m,mesh:m});
}
doc.buffers=[{byteLength:total}];const jsonRaw=Buffer.from(JSON.stringify(doc)),json=Buffer.alloc(Math.ceil(jsonRaw.length/4)*4,32);jsonRaw.copy(json);
const bin=Buffer.concat(chunks),out=Buffer.alloc(12+8+json.length+8+bin.length);
out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);out.writeUInt32LE(bin.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);bin.copy(out,28+json.length);
mkdirSync(new URL('../assets/barn/',import.meta.url),{recursive:true});writeFileSync(new URL('../assets/barn/barn-candidate.glb',import.meta.url),out);console.log({bytes:out.length,triangles:doc.meshes.reduce((n,m)=>n+doc.accessors[m.primitives[0].attributes.POSITION].count/3,0)});
