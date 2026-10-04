import * as T from '../lib/three.module.min.js';
import {mergeGeometries} from '../lib/addons/utils/BufferGeometryUtils.js';
// Experimental proof slice only. No production imports, state, collisions or AI.
// Runtime canvas studies are NOT the contract's eventual embedded KTX2 assets.
export function createBarnScene(model,scene) {
 const root=new T.Group();root.name='Barn scene study';root.add(model);
 const ownedTextures=[],ownedGeometries=[],ownedMaterials=[];
 let seed=407;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 function texture(kind) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ece7dd';ctx.fillRect(0,0,256,256);
  if(kind==='wood') for(let i=0;i<850;i++) {
   const x=rand()*256,y=rand()*256;
   ctx.strokeStyle=i%3?'rgba(58,36,20,.12)':'rgba(255,255,248,.25)';ctx.lineWidth=.5+rand();
   ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+5,y+20,x-3,y+35,x+2,y+65);ctx.stroke();
  }
  else for(let i=0;i<3800;i++) {
   ctx.fillStyle=i%2?'rgba(72,61,48,.10)':'rgba(255,255,240,.25)';ctx.fillRect(rand()*256,rand()*256,1+rand()*2,1+rand()*2);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;ownedTextures.push(map);return map;
 }
 const wood=texture('wood'),stone=texture('stone');
 model.traverse(o=>{if(!o.isMesh)return;
  ownedGeometries.push(o.geometry);ownedMaterials.push(o.material);
  o.castShadow=o.receiveShadow=true;
  if(o.material.name==='Painted wood'||o.material.name==='Cream trim')o.material.map=wood;
  if(o.material.name==='Foundation stone')o.material.map=stone;
  o.material.needsUpdate=true;
 });
 function material(color) {const m=new T.MeshStandardMaterial({color,roughness:.96,vertexColors:true});ownedMaterials.push(m);return m;}
 const buckets=[[],[],[],[]],mats=[material(0xaf936c),material(0x969389),material(0x73883e),material(0xc9a963)];
 function add(g,b,color) {
  // Yard batches use vertex color only; keep their attribute layouts identical.
  g.deleteAttribute('uv');
  const c=new T.Color(color),p=g.attributes.position,a=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++)a.set([c.r,c.g,c.b],i*3);
  g.setAttribute('color',new T.BufferAttribute(a,3));buckets[b].push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();
 }
 // A vertex-colored irregular apron, clear down the middle for the real path.
 const points=[];for(let i=0;i<44;i++){const a=i/44*Math.PI*2,r=1+.045*Math.sin(i*2.9);points.push([Math.cos(a)*6.0*r,.024,Math.sin(a)*8*r+.7]);}
 const positions=[],colors=[];const centre=[0,.024,.7];
 for(let i=0;i<points.length;i++) {
  for(const [j,p]of [centre,points[(i+1)%points.length],points[i]].entries()) {
   positions.push(...p);const c=new T.Color(j?0x7e8050:0xc1a277);colors.push(c.r,c.g,c.b);
  }
 }
 const apron=new T.BufferGeometry();apron.setAttribute('position',new T.Float32BufferAttribute(positions,3));apron.setAttribute('color',new T.Float32BufferAttribute(colors,3));apron.computeVertexNormals();
 buckets[0].push(apron);
 function pebble(x,z,s,b=1) {
  const g=new T.IcosahedronGeometry(s,0);g.scale(1,.38,.8);g.rotateY(rand()*6.28);g.translate(x,.055,z);add(g,b,0xc5c0b0);
 }
 // Grouped foundation rubble and a low stone edging; no new collision proxies.
 for(let sd of [-1,1])for(let i=0;i<25;i++) {
  pebble(sd*(4.65+rand()*.65),-5.6+i*.48,.12+rand()*.13);
 }
 for(let i=0;i<13;i++){const x=-3.8+i*.64;if(Math.abs(x)>2.1)pebble(x,6.10,.22);}
 // Solid curved leaves: raised centre ridge plus a thin lower shell, not billboards.
 function leaf(x,y,z,h,w,angle,color) {
  const g=new T.BufferGeometry(),front=[[-w/2,0,0],[0,h*.45,.10],[0,h,0],[w/2,0,0]];
  const p=[];for(const [side,idx]of [[0,[0,1,2]],[0,[1,3,2]],[1,[2,1,0]],[1,[2,3,1]]])for(const k of idx){const a=front[k];p.push(a[0],a[1],a[2]-side*.006);}
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();g.rotateY(angle);g.rotateZ((rand()-.5)*.6);g.translate(x,y,z);add(g,2,color);
 }
 // Readable planted masses, varied heights; centres stay outside the doorway/path.
 for(const [cx,cz,size]of [[-5.25,3.9,1],[-5.4,-.8,.9],[-5.2,-4.8,.7],[5.1,4.5,.8],[5.0,1.4,.7],[-3.6,6.4,.9],[3.4,6.5,.9]]) {
  for(let i=0;i<65;i++) {
   const a=rand()*6.28,r=Math.sqrt(rand())*size;
   leaf(cx+Math.cos(a)*r,.06,cz+Math.sin(a)*r,(.35+rand()*.7)*size,.16+rand()*.18,a,[0x526a30,0x94a754,0x718642,0xaeb96a][i%4]);
  }
 }
 // Sculpted sunflowers in two deliberate entry clusters, not a uniform scatter.
 for(const sd of [-1,1])for(let i=0;i<5;i++) {
  const x=sd*(3.0+rand()*.7),z=6.3+rand()*.55,h=1.25+rand()*.55;
  const stem=new T.CylinderGeometry(.025,.038,h,6);stem.translate(x,h/2,z);add(stem,2,0x7d9842);
  leaf(x,.55,z,.6,.34,sd*1.3,0x8eac58);leaf(x,.8,z,.52,.31,-sd*1.3,0x7d9842);
  // Petals have physical thickness and curved surfaces rather than alpha planes.
  for(let k=0;k<9;k++) {
   const a=k/9*Math.PI*2,petal=new T.SphereGeometry(1,7,4);petal.scale(.075,.20,.035);petal.rotateZ(-a);
   petal.translate(x+Math.sin(a)*.21,h+Math.cos(a)*.21,z+.055);add(petal,3,0xffe187);
  }
  const centre=new T.SphereGeometry(.13,8,5);centre.scale(1,1,.45);centre.translate(x,h,z+.07);add(centre,3,0x69452b);
 }
 // Fewer intentional straw/hay silhouettes near the working door.
 for(const [x,z,rot]of [[-3.1,5.3,.16],[-3.2,4.7,-.1]]) {
  const g=new T.BoxGeometry(1.15,.65,.65,4,2,2);g.rotateY(rot);g.translate(x,.35,z);add(g,3,0xd3b773);
  for(let j=0;j<6;j++){const straw=new T.CylinderGeometry(.018,.028,.7,5);straw.rotateZ(Math.PI/2);straw.rotateY(rot);straw.translate(x,.08+j*.1,z+.34);add(straw,3,0xb69d5d);}
 }
 for(let b=0;b<buckets.length;b++) {
  const g=mergeGeometries(buckets[b]);for(const old of buckets[b])old.dispose();ownedGeometries.push(g);
  const mesh=new T.Mesh(g,mats[b]);mesh.name=['Worn barn apron','Stone edging','Barn planted border','Hay stacks'][b];
  mesh.castShadow=b>1;mesh.receiveShadow=true;root.add(mesh);
 }
 // Static comparison scene only: retain exact instance matrices for restoration.
 // A production integration must use the game's clearing ownership, not this mask.
 const masks=[];
 scene?.traverse(o=>{if(!o.isInstancedMesh||!(o.geometry.getAttribute('bladeH')||o.geometry.getAttribute('uvOff')))return;
  const a=o.instanceMatrix.array,entries=[];
  for(let i=0;i<o.count;i++){const off=i*16,x=a[off+12],z=a[off+14];if(x*x/36+(z-.7)*(z-.7)/64<1)entries.push([off,a.slice(off,off+16)]);}
  if(entries.length)masks.push({mesh:o,entries});
 });
 // The previous 58-leaf ivy study extends above the wall into the roof/air.
 // Its transforms do not fit this replacement. Preserve it exactly for controls.
 const oldIvy=scene?.getObjectByName('Phase7M-MaxWow')?.children.find(o=>o.isInstancedMesh&&o.count===58);
 const ivyVisible=oldIvy?.visible;
 function setVisible(on){root.visible=on;if(oldIvy)oldIvy.visible=on?false:ivyVisible;
 for(const {mesh,entries}of masks){const a=mesh.instanceMatrix.array;
  for(const [off,original]of entries){a.set(original,off);if(on){for(const k of [0,1,2,4,5,6,8,9,10])a[off+k]=0;}}
  mesh.instanceMatrix.needsUpdate=true;
 }}
 let disposed=false;
 return {root,setVisible,dispose(){if(disposed)return;disposed=true;setVisible(false);root.removeFromParent();
  for(const g of new Set(ownedGeometries))g.dispose();for(const m of new Set(ownedMaterials))m.dispose();for(const t of new Set(ownedTextures))t.dispose();
 },stats:{extraMeshes:4,canvasTextures:2,maskedInstances:masks.reduce((n,m)=>n+m.entries.length,0)}};
}
