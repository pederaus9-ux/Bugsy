// Discriminate whether linear endpoint skin interpolation encloses the real
// unchanged procedural rig. Same initial state, evaluate dt/2 and dt separately.
import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';import {createCow3D,updateCow3D} from '../cow3d.js';
const dt=1/30,t0=Math.PI/3-dt/2;
function sample(elapsed){const r=createCow3D(1.7,0,0,0);r.state.time=t0-1/60;r.state.nextLook=1e9;updateCow3D(r,0,0,1/60,t0,'idle');assert(Math.abs(r.body.scale.y-(1+.007*Math.sin(t0*1.5)))<1e-15,'initial animation pose must match its clock');if(elapsed)updateCow3D(r,0,0,elapsed,t0+elapsed,'idle');r.g.updateMatrixWorld(true);r.card.skeleton.update();const v=new T.Vector3(),points=[];for(let i=0;i<r.card.geometry.attributes.position.count;i++){r.card.getVertexPosition(i,v);v.applyMatrix4(r.card.matrixWorld);points.push(v.toArray());}const out={points,bodyScale:r.body.scale.y,skinIndex:r.card.geometry.attributes.skinIndex.array,skinWeight:r.card.geometry.attributes.skinWeight.array};r.dispose();return out;}
const a=sample(0),m=sample(dt/2),b=sample(dt);let witness=null;
for(let i=0;i<a.points.length;i+=3){if(![i,i+1,i+2].every(j=>a.skinIndex[j*4]===1&&a.skinWeight[j*4]===1))continue;const cap=Math.max(...a.points.slice(i,i+3).map(p=>p[1]),...b.points.slice(i,i+3).map(p=>p[1]));for(let j=i;j<i+3;j++){const excess=m.points[j][1]-cap;if(excess>0&&(!witness||excess>witness.excess))witness={triangle:i/3,vertex:j,before:a.points[j],middle:m.points[j],after:b.points[j],endpointPrismYMax:cap,excess};}}
assert(witness&&witness.excess>0,'Hypothesis not reproduced; do not infer rig trajectory mismatch');
const result={status:'RIG_ENCLOSURE_RED',runtime:'7017109',dt,t0,bodyScales:[a.bodyScale,m.bodyScale,b.bodyScale],witness,meaning:'Continuous procedural pose is not bounded by endpoint linear vertex morph, even with fixed root/yaw. No runtime integration is safe on that assumption.',negativeControl:'Witness endpoint y values are within endpoint prism; the half-step alone exceeds it.'};
assert(witness.before[1]<=witness.endpointPrismYMax&&witness.after[1]<=witness.endpointPrismYMax);
const file=new URL('./evidence/pen-editing-implementation/task8-codex-cow-motion-contract-20261025/animation-enclosure-coherent-red.json',import.meta.url);if(fs.existsSync(file))throw Error('Preserve previous evidence');fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
process.exitCode=1; // Deliberate retained RED of the live-rig enclosure contract.
