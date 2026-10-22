import * as T from './lib/three.module.min.js';
// Keep each primitive's physical bounds before batching removes its logical owner.
export function rememberPenPrimitive(group,geometry){geometry.computeBoundingBox();const b=geometry.boundingBox;(group.userData.penPrimitives??=[]).push([...b.min.toArray(),...b.max.toArray()]);}
export function markPenBatch(mesh){mesh.userData.penBatched=true;return mesh;}
export function penComponentVolumes(groups){
 const result={};for(const [id,roots]of Object.entries(groups)){const boxes=[];for(const root of roots){root.updateWorldMatrix(true,true);root.traverse(o=>{for(const a of o.userData.penPrimitives||[]){const b=new T.Box3(new T.Vector3(...a.slice(0,3)),new T.Vector3(...a.slice(3))).applyMatrix4(o.matrixWorld);boxes.push([...b.min.toArray(),...b.max.toArray()]);}if(o.isMesh&&!o.userData.penBatched){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);boxes.push([...b.min.toArray(),...b.max.toArray()]);}});}result[id]=boxes;}return result;
}
