// Endpoint prerequisite for the restricted provider, not a care-route pass.
import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';import {createCow3D,updateCow3D} from '../cow3d.js';import {getAnimalCarePose} from '../animal-care-poses.js';import {createCowYard} from '../cow-yard.js';import {resolveAnimalPens} from '../animal-pen-layout.js';
const dir=new URL('./evidence/pen-editing-implementation/task8-codex-cow-restricted-provider-20261025/',import.meta.url),file=new URL('care-solid-endpoints.json',dir);if(fs.existsSync(file))throw Error('Preserve evidence');
const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),volumes=yard.componentVolumes(),centers=new Map(yard.targets.filter(t=>['feed','water'].includes(t.kind)).map(t=>[t.kind,new T.Box3().setFromObject(t.object).getCenter(new T.Vector3())])),rows=[];
const v=new T.Vector3(),triangle=new T.Triangle();
for(const s of yard.stations.filter(s=>['feed','drink'].includes(s.kind))){const r=createCow3D(1.7,s.dock[0],s.dock[2],0);r.g.position.y=s.dock[1];r.model.rotation.y=s.facing+Math.PI;const care=getAnimalCarePose('cow',r),owner=s.kind==='feed'?'feedBunk':'trough',target=new T.Vector3(s.kind==='feed'?s.dock[0]:centers.get('water').x,s.surface,s.kind==='feed'?centers.get('feed').z:s.dock[2]);
 for(const weight of [0,1]){care.reset();updateCow3D(r,0,0,1/60,0,'eating');care.apply({mode:s.kind,weight,target});r.g.updateMatrixWorld(true);const geometry=r.card.geometry,points=[];for(let i=0;i<geometry.attributes.position.count;i++){r.card.getVertexPosition(i,v).applyMatrix4(r.card.matrixWorld);points.push(v.toArray());}
  const witnesses=[];for(let j=0;j<volumes[owner].length;j++){const b=volumes[owner][j],box=new T.Box3(new T.Vector3(...b.slice(0,3)),new T.Vector3(...b.slice(3))),inside=[];let triangles=0,firstTriangle=null;
   for(let i=0;i<points.length;i++){const p=points[i];if(p.every((x,k)=>x>b[k]&&x<b[k+3])){if(inside.length<3)inside.push({vertex:i,point:p,weights:Array.from(geometry.attributes.skinWeight.array.slice(i*4,i*4+4)),bones:Array.from(geometry.attributes.skinIndex.array.slice(i*4,i*4+4)).map(k=>r.card.skeleton.bones[k].name)});}}
   for(let i=0;i<points.length;i+=3){triangle.a.fromArray(points[i]);triangle.b.fromArray(points[i+1]);triangle.c.fromArray(points[i+2]);if(box.intersectsTriangle(triangle)){triangles++;firstTriangle??={index:i/3,points:points.slice(i,i+3)};}}
   witnesses.push({primitive:j,box:b,inside,intersectingTriangles:triangles,firstTriangle});
  }
  const result={station:s.id,weight,root:r.g.position.toArray(),yaw:r.model.rotation.y,target:target.toArray(),mouthDistance:r.jaw.localToWorld(new T.Vector3(0,-.05,-.33)).distanceTo(target),witnesses};rows.push(result);console.log(JSON.stringify({station:s.id,weight,mouthDistance:result.mouthDistance,hits:witnesses.filter(w=>w.intersectingTriangles).map(w=>({primitive:w.primitive,vertices:w.inside.length,triangles:w.intersectingTriangles}))}));
 }
 care.reset();r.dispose();
}
assert.equal(rows.length,6);fs.writeFileSync(file,JSON.stringify({source:'42dc5c59c3557cf380cd9a1b5983a2f78fa9215c',status:'ENDPOINT_DIAGNOSTIC_CLASSIFY_SOLIDS_BEFORE_CLAIM',rows,limitations:'Seed0 static dock fixture,60Hz single updates,no approach or live care progress. All primitive boxes included; food/water contact must be classified separately. Positive strict-inside vertex witnesses are stronger than absence of triangle intersections; axis-aligned box primitive source must be checked.'},null,2));yard.dispose();
