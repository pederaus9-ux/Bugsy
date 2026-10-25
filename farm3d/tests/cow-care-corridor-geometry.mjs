// Bounded read-only feasibility probe. Positive vertex witnesses prove overlap;
// absent witnesses do not certify a collision-free swept movement.
import fs from 'node:fs';
import * as T from '../lib/three.module.min.js';
import {createCow3D} from '../cow3d.js';
import {createCowYard} from '../cow-yard.js';
import {resolveAnimalPens} from '../animal-pen-layout.js';
const site=resolveAnimalPens().sites.cow,y=createCowYard({layout:site});
const volumes=y.componentVolumes(),out=[];
const v=new T.Vector3();
for(const station of y.stations)for(const end of ['approach','dock']){
 const p=station[end],r=createCow3D(1.7,p[0],p[2],0);r.g.position.y=p[1];r.model.rotation.y=station.facing+Math.PI;r.g.updateMatrixWorld(true);r.card.skeleton.update();
 const hits=new Map();
 for(let i=0;i<r.card.geometry.attributes.position.count;i++){
  r.card.getVertexPosition(i,v);v.applyMatrix4(r.card.matrixWorld);
  for(const [owner,boxes]of Object.entries(volumes))for(let j=0;j<boxes.length;j++){
   const b=boxes[j];if(v.x<=b[0]+1e-8||v.y<=b[1]+1e-8||v.z<=b[2]+1e-8||v.x>=b[3]-1e-8||v.y>=b[4]-1e-8||v.z>=b[5]-1e-8)continue;
   const key=owner+':'+j;if(!hits.has(key))hits.set(key,{owner,primitive:j,box:b,count:0,point:v.toArray(),vertex:i});hits.get(key).count++;
  }
 }
 out.push({station:station.id,end,position:p,yaw:r.model.rotation.y,hits:[...hits.values()]});r.dispose();
}
y.dispose();
const result={status:'DIAGNOSTIC_ONLY',runtime:'7017109',cases:out,limitations:'Primitive bounds may overbound tilted/cylindrical geometry; support, food and robot contact need classification. Zero included vertices is not a nonintersection proof.'};
const file=new URL('./evidence/pen-editing-implementation/task8-codex-cow-motion-contract-20261025/corridor-geometry.json',import.meta.url);
if(fs.existsSync(file))throw Error('Preserve prior evidence');fs.writeFileSync(file,JSON.stringify(result,null,2));
console.log(JSON.stringify(out.map(x=>({station:x.station,end:x.end,hits:x.hits.map(h=>({owner:h.owner,primitive:h.primitive,count:h.count,box:h.box}))})),null,2));
