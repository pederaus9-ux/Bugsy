// Proposal-only corruption controls. No existing assertion or runtime is changed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as T from '../lib/three.module.min.js';
import {createCow3D} from '../cow3d.js';

const out=process.env.TEST_ARTIFACTS;assert(out);
const file=path.join(out,'results.json');assert(!fs.existsSync(file),'preserve evidence');
fs.mkdirSync(out,{recursive:true});
const delta=[2.6,0,-1.75],limit=1e-8,rows=[];
const mutations=[
  ['root extra X 2e-8 m',r=>{r.g.position.x+=2e-8;}],
  ['root translated twice',r=>r.g.position.add(new T.Vector3(...delta))],
  ['body bone extra X 2e-8 m',r=>{r.body.position.x+=2e-8;}],
  ['body bone rotation 1e-6 rad',r=>{r.body.rotation.z+=1e-6;}],
  ['model scale extra 1e-6',r=>{r.model.scale.x+=1e-6;}],
  ['root rotation 1e-6 rad',r=>{r.g.rotation.y+=1e-6;}],
  ['stored skin weight extra 1e-6',r=>{const w=r.card.geometry.attributes.skinWeight;w.setX(0,w.getX(0)+1e-6);}]
];
const cases=[...[-11.8,-7.8,-3.8,.2,4.2].map((x,i)=>({name:'unchanged local pose cow '+i,x,mutate:()=>{},accept:true})),...mutations.map(([name,mutate])=>({name,x:-11.8,mutate,accept:false}))];
for(const c of cases){
  const r=createCow3D(1.8,c.x,-38.2,0);r.g.position.y=.08;
  // The production rig shares geometry; all corruptions must stay on this private clone.
  const geometry=r.card.geometry.clone();r.card.geometry=geometry;
  const weights=geometry.attributes.skinWeight;
  const sums=Array.from({length:weights.count},(_,i)=>weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i));
  const local=()=>({bones:r.card.skeleton.bones.map(b=>b.matrix.toArray()),model:r.model.matrix.toArray(),card:r.card.matrix.toArray(),state:structuredClone(r.state),rootQuaternion:r.g.quaternion.toArray(),rootScale:r.g.scale.toArray(),weights:Array.from(weights.array)});
  function vertices(){r.g.updateMatrixWorld(true);r.card.skeleton.update();const p=new T.Vector3();return Array.from({length:geometry.attributes.position.count},(_,i)=>r.card.getVertexPosition(i,p).applyMatrix4(r.card.matrixWorld).toArray());}
  const before=vertices(),localBefore=local(),rootBefore=r.g.position.toArray();
  r.g.position.add(new T.Vector3(...delta));c.mutate(r);
  const after=vertices(),localAfter=local(),rootAfter=r.g.position.toArray();
  let vertexError=0,originalVertexError=0;
  for(let i=0;i<before.length;i++){
    const motion=after[i].map((v,j)=>v-before[i][j]);
    vertexError=Math.max(vertexError,Math.hypot(...motion.map((v,j)=>v-delta[j]*sums[i])));
    originalVertexError=Math.max(originalVertexError,Math.hypot(...motion.map((v,j)=>v-delta[j])));
  }
  const rootError=Math.hypot(...rootAfter.map((v,j)=>v-rootBefore[j]-delta[j]));
  const localExact=Object.fromEntries(Object.keys(localBefore).map(k=>[k,JSON.stringify(localBefore[k])===JSON.stringify(localAfter[k])]));
  const proposedPass=rootError<limit&&vertexError<limit&&Object.values(localExact).every(Boolean);
  rows.push({name:c.name,expectedDeltaFrozenBeforeMove:delta,weightSumsFrozenBeforeMove:true,rootError,vertexError,originalVertexError,limit,localExact,proposalVerdict:proposedPass?'PASS':'FAIL',expectedProposalVerdict:c.accept?'PASS':'FAIL',originalStrictSkinVerdict:originalVertexError<limit?'PASS':'FAIL'});
  assert.equal(proposedPass,c.accept,c.name);
  if(c.accept)assert(originalVertexError>=limit,'original strict skin RED remains reproduced');
  geometry.dispose();r.dispose();
}
const hashes=Object.fromEntries(['cow3d.js','lib/three.core.min.js','tests/animal-pen-occupied-shelter.browser.cjs'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+f,import.meta.url))).digest('hex')]));
const result={status:'PROPOSAL_CONTROLS_MATCH_EXPECTATIONS',approved:false,qualification:false,originalAssertionsChanged:false,rigEdited:false,formula:'norm((vertexAfter-vertexBefore)-expectedRootDelta*sumOfBeforeWeights) < 1e-8',independentRootFormula:'norm((rootAfter-rootBefore)-expectedRootDelta) < 1e-8',exactInvariants:'Local bone/model/card transforms, rig state, root quaternion/scale, stored weights',hashes,cases:rows};
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,positiveCases:rows.filter(r=>r.expectedProposalVerdict==='PASS').length,rejectedCorruptions:rows.filter(r=>r.expectedProposalVerdict==='FAIL').length,cases:rows.map(r=>({name:r.name,proposal:r.proposalVerdict,rootError:r.rootError,vertexError:r.vertexError,changedInvariants:Object.keys(r.localExact).filter(k=>!r.localExact[k])}))},null,2));
