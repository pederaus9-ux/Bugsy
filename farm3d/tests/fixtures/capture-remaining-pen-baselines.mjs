// Captures remaining-care pen template baselines from the actual factories
// (layout module + yard builder), never from the resolver under test.
// Usage: node tests/fixtures/capture-remaining-pen-baselines.mjs  -> prints JSON {kind: baseline}
import * as T from '../../lib/three.module.min.js';
import {remainingCareLayouts} from '../../remaining-care-layout.js';import {createRemainingCareYards} from '../../remaining-care-yard.js';
import {meshReceipt} from './animal-pen-mesh-probe.mjs';
export function captureRemainingPenBaselines(){
 const layouts=remainingCareLayouts(),yards=createRemainingCareYards(),out={};
 try{for(const kind of ['horse','sheep','dog','cat']){const l=layouts[kind],y=yards[kind];y.group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(y.group);
  out[kind]={baseline:{...structuredClone(l),obstacles:y.obstacles.map(o=>[...o]),fenceSegments:y.fences.map(f=>[...f]),renderFootprint:[[b.min.x,b.min.z],[b.max.x,b.min.z],[b.max.x,b.max.z],[b.min.x,b.max.z]]},render:meshReceipt(y.group)};}}
 finally{Object.values(yards).forEach(y=>y.dispose());}
 return out;
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(captureRemainingPenBaselines()));
