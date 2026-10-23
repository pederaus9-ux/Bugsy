// Read-only diagnosis. The strict native skin assertion remains RED and unchanged.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as T from '../lib/three.module.min.js';
import {createCow3D} from '../cow3d.js';

const out=process.env.TEST_ARTIFACTS;
assert(out,'TEST_ARTIFACTS required');
const resultPath=path.join(out,'results.json');
assert(!fs.existsSync(resultPath),'preserve evidence');
fs.mkdirSync(out,{recursive:true});
const nativePath=new URL('./evidence/pen-editing-implementation/task7-codex-shelter-scope-20261023/native-composed-60/results.json',import.meta.url);
const native=JSON.parse(fs.readFileSync(nativePath));
const publication=native.steps.find(s=>s.name==='native occupied shelter Apply').value.published;
assert.equal(native.status,'FAIL');
assert.match(native.error,/actual skin follows occupied support once/);
const sources=['cow3d.js','lib/three.core.min.js','lib/three.module.min.js'];
const hashes=Object.fromEntries(sources.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+f,import.meta.url))).digest('hex')]));
const cases=[];
for(const delta of [[2.6,0,-1.75],[.6,0,.25],[0,0,0]]) {
  for(const [cow,x] of [-11.8,-7.8,-3.8,.2,4.2].entries()) {
    const rig=createCow3D(1.8,x,-38.2,cow);rig.g.position.y=.08;
    const geometry=rig.card.geometry,weights=geometry.attributes.skinWeight;
    function pose(){rig.g.updateMatrixWorld(true);rig.card.skeleton.update();const v=new T.Vector3();return Array.from({length:geometry.attributes.position.count},(_,i)=>rig.card.getVertexPosition(i,v).applyMatrix4(rig.card.matrixWorld).toArray());}
    const before=pose();
    const local=rig.card.skeleton.bones.map(b=>b.matrix.toArray());
    const beforeRoot=rig.g.position.toArray();
    rig.g.position.add(new T.Vector3(...delta));
    const after=pose();
    assert.deepEqual(rig.card.skeleton.bones.map(b=>b.matrix.toArray()),local,'no local pose changes');
    let maxResidual=0,maxPredictionError=0,maxWeightError=0,maxIndex=-1,worst=null;
    for(let i=0;i<before.length;i++) {
      const w=[weights.getX(i),weights.getY(i),weights.getZ(i),weights.getW(i)],sum=w.reduce((a,b)=>a+b,0);
      const residual=after[i].map((n,j)=>n-before[i][j]-delta[j]);
      const predicted=delta.map(d=>d*(sum-1));
      const size=Math.hypot(...residual);
      const error=Math.hypot(...residual.map((n,j)=>n-predicted[j]));
      if(size>maxResidual){maxResidual=size;maxIndex=i;worst={weights:w,sum,before:before[i],after:after[i],residual,predicted};}
      maxPredictionError=Math.max(maxPredictionError,error);maxWeightError=Math.max(maxWeightError,Math.abs(sum-1));
    }
    assert(maxPredictionError<1e-11,'existing weights explain every vertex residual');
    const strictPass=maxResidual<1e-8;
    assert.equal(strictPass,delta.every(d=>d===0),'both original and composed translations fail the original oracle with no adapter');
    const row={cow,delta,beforeRoot,afterRoot:rig.g.position.toArray(),vertices:before.length,bones:local.length,localBoneMatricesExact:true,maxResidual,maxPredictionError,maxWeightError,maxIndex,worst,originalStrictLimit:1e-8,originalStrictVerdict:strictPass?'PASS':'FAIL'};
    if(delta[0]===2.6){row.nativeResidual=publication.errors.find(e=>e.i===cow).maxVertexDelta;row.nativePredictionDifference=Math.abs(row.nativeResidual-Math.hypot(...delta)*maxWeightError);assert(row.nativePredictionDifference<1e-11,'native RED matches existing-weight prediction');}
    cases.push(row);rig.dispose();
  }
}
const report={status:'DIAGNOSTIC_MATCH',qualification:'Original strict native skin RED remains FAIL. No wake/reload/rate qualification is inferred.',adapterUsed:false,rigEdited:false,libraryEdited:false,hashes,nativeOriginalStatus:native.status,nativeOriginalError:native.error,cases};
fs.writeFileSync(resultPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:cases.length,maxPredictionError:Math.max(...cases.map(c=>c.maxPredictionError)),strictFails:cases.filter(c=>c.originalStrictVerdict==='FAIL').length,nativeResiduals:publication.errors},null,2));
