import {pointInPolygon} from './animal-pen-geometry.js?v=1';
// Meadow meshes are shared by old/new revisions during atomic preparation.
// Keep one original and compose ownership; never snapshot another owner's zeros.
const ownership=new WeakMap(),scaleEntries=[0,1,2,4,5,6,8,9,10];
export function createPenPlantClearing(meshes,sites){
 const entries=meshes.filter(m=>m?.isInstancedMesh).map(mesh=>{let state=ownership.get(mesh);if(!state){state={original:mesh.instanceMatrix.array.slice(),owners:new Map()};ownership.set(mesh,state);}const indices=Object.fromEntries(Object.entries(sites).map(([kind,l])=>[kind,new Set(Array.from({length:mesh.count},(_,i)=>i).filter(i=>pointInPolygon([state.original[i*16+12],state.original[i*16+14]],l.footprint)))]));return{mesh,state,indices};}),tokens=new Map(),active=new Set();let disposed=false;
 const repaint=(entry,indices)=>{const{mesh,state}=entry,a=mesh.instanceMatrix.array;for(const i of indices){const o=i*16;a.set(state.original.subarray(o,o+16),o);if([...state.owners.values()].some(owned=>owned.has(i)))for(const j of scaleEntries)a[o+j]=0;}if(indices.size)mesh.instanceMatrix.needsUpdate=true;};
 const setActive=(kind,value)=>{if(disposed||!Object.hasOwn(sites,kind)||active.has(kind)===!!value)return;let token=tokens.get(kind);if(!token){token={};tokens.set(kind,token);}if(value)active.add(kind);else active.delete(kind);for(const e of entries){if(value)e.state.owners.set(token,e.indices[kind]);else e.state.owners.delete(token);repaint(e,e.indices[kind]);}};
 return{setActive,dispose(){if(disposed)return;for(const kind of [...active])setActive(kind,false);disposed=true;}};
}
