import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as T from '../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../cow3d.js';
import {applyCowPenSupport} from '../animal-pen-cow-support.js';
import {getAnimalCarePose} from '../animal-care-poses.js';
import {copyCowRig,captureCowPreviewBase,previewCowPose,previewCowFrame} from './helpers/cow-pose-preview.mjs';

function snapshot(r) {
  const nodes=[];
  r.g.traverse(n=>nodes.push({type:n.type,name:n.name,p:n.position.toArray(),q:n.quaternion.toArray(),e:n.rotation.toArray(),s:n.scale.toArray(),m:n.matrix.toArray(),w:n.matrixWorld.toArray(),auto:n.matrixAutoUpdate,worldAuto:n.matrixWorldAutoUpdate,dirty:n.matrixWorldNeedsUpdate}));
  return {nodes,state:{...r.state},legs:r.legs.map(l=>Object.fromEntries(Object.entries(l).filter(([,v])=>typeof v!=='object'))),q:r.q.toArray(),inverse:r.bodyInverse.toArray(),bind:r.card.bindMatrix.toArray(),bindInverse:r.card.bindMatrixInverse.toArray(),bones:r.card.skeleton.boneMatrices.slice(),boneInverses:r.card.skeleton.boneInverses.map(m=>m.toArray()),disposed:r.disposed};
}
function geometryHash(r) {const h=crypto.createHash('sha256');for(const a of Object.values(r.card.geometry.attributes))h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));return h.digest('hex');}
function advance(r,p){r.g.position.add(new T.Vector3(p.dx||0,p.dy||0,p.dz||0));if(p.alignYaw!==undefined)r.model.rotation.y=p.alignYaw;updateCow3D(r,p.dx||0,p.dz||0,p.dt,p.time||0,p.act||'idle',p.hop||0);if(p.support)applyCowPenSupport(r,()=>p.support.height);if(p.care)getAnimalCarePose('cow',r).apply({...p.care,target:p.care.target&&new T.Vector3(...p.care.target)});r.g.updateMatrixWorld(true);r.card.skeleton.update();}
function prepared(height=1.7,seed=0){const r=createCow3D(height,3,-4,seed);r.g.position.y=.08;for(let i=0;i<35;i++)advance(r,{dx:.8/60,dz:0,dt:1/60});return r;}
const preview=process.env.COW_PREVIEW_IMPL==='live'?(base,p)=>{advance(base.rig,p);return base.rig;}:previewCowPose;

test('preview preserves live/base/geometry/request and consumes no randomness',()=>{
 const r=prepared(),before=snapshot(r),hash=geometryHash(r),random=Math.random;
 try{Math.random=()=>{throw Error('Preview consumed RNG');};const base=captureCowPreviewBase(r,{overlayState:'reset'}),baseBefore=snapshot(base.rig),request={dx:0,dz:.8/30,dt:1/30},requestBefore=structuredClone(request),p=preview(base,request);assert.deepEqual(snapshot(r),before);assert.deepEqual(snapshot(base.rig),baseBefore);assert.equal(geometryHash(r),hash);assert.deepEqual(request,requestBefore);assert.notEqual(p.body,r.body);assert.notEqual(p.card.skeleton.boneMatrices,r.card.skeleton.boneMatrices);assert.equal(p.card.geometry,r.card.geometry);p.dispose();assert.equal(r.disposed,false);}finally{Math.random=random;r.dispose();}
});
test('shadow predicts exact production state/transforms and all skin vertices at 30/60/120Hz',()=>{
 const v=new T.Vector3(),w=new T.Vector3();let checked=0;
 for(const hz of [30,60,120])for(const mode of ['idle','walk','run','turn','support','feed','drink','lie']){
  const r=prepared(mode==='run'?1.8:1.7,hz),expected=prepared(mode==='run'?1.8:1.7,hz),dt=1/hz;
  const p={dt,time:2,dx:mode==='run'?2.6*dt:['walk','support'].includes(mode)?.8*dt:0,dz:mode==='turn'?.8*dt:0,act:mode==='lie'?'sleeping':mode==='feed'?'eating':'moving'};
  if(mode==='support')p.support={kind:'plane',height:.1};
  if(['feed','drink','lie'].includes(mode))p.care={mode,weight:.6,...(mode==='lie'?{}:{target:[3,.6,-3]})};
  const predicted=preview(captureCowPreviewBase(r,{overlayState:'reset'}),p);advance(expected,p);
  assert.deepEqual(snapshot(predicted),snapshot(expected),mode+'/'+hz);
  for(let i=0;i<expected.card.geometry.attributes.position.count;i++){predicted.card.getVertexPosition(i,v).applyMatrix4(predicted.card.matrixWorld);expected.card.getVertexPosition(i,w).applyMatrix4(expected.card.matrixWorld);assert(v.distanceTo(w)<=1e-8,mode+'/'+hz+' vertex '+i);checked++;}
  r.dispose();predicted.dispose();expected.dispose();
 }
 // Frozen current geometry census: all 31,728 vertices in each of 24 cases.
 // The first harness draft guessed >1M; the actual unchanged mesh has 761,472
 // comparisons. Keep exact coverage, not an arbitrary rounded count.
 assert.equal(checked,31728*24,'all-vertex coverage unexpectedly changed');
});
test('live displayed care overlay stays untouched using its recorded pre-overlay base',()=>{
 const r=prepared(),base=captureCowPreviewBase(r,{overlayState:'reset'}),care=getAnimalCarePose('cow',r);care.apply({mode:'lie',weight:.8});r.g.updateMatrixWorld(true);const shown=snapshot(r);
 const p=preview(base,{dt:1/60,act:'sleeping',care:{mode:'lie',weight:.7}});assert.deepEqual(snapshot(r),shown);care.reset();assert.deepEqual(r.body.position.toArray(),base.rig.body.position.toArray());p.dispose();r.dispose();
});
test('unsupported domains fail before mutating live data, including missing overlay provenance',()=>{
 const r=prepared(),before=snapshot(r),base=captureCowPreviewBase(r,{overlayState:'reset'});
 assert.throws(()=>captureCowPreviewBase(r),/pre-overlay/);
 for(const p of [{dt:NaN},{dt:0},{dt:1/30,support:{kind:'arbitrary-callback'}},{dt:1/30,care:{mode:'feed',weight:1}}])assert.throws(()=>previewCowPose(base,p));
 assert.deepEqual(snapshot(r),before);r.dispose();
});
test('controls detect manual-matrix, anchor/state sharing, and omitted support/care',()=>{
 const r=prepared(),base=captureCowPreviewBase(r,{overlayState:'reset'}),before=snapshot(base.rig);
 const broken=copyCowRig(base.rig);broken.legs[0].hip.matrix.elements[12]+=.01;assert.notDeepEqual(snapshot(broken),before);
 broken.state.amount+=.1;broken.legs[0].ax+=1;assert.deepEqual(snapshot(base.rig),before);
 for(const extra of [{support:{kind:'plane',height:.12}},{care:{mode:'lie',weight:.8}}]){const a=previewCowPose(base,{dt:1/60,...extra}),b=previewCowPose(base,{dt:1/60});assert.notDeepEqual(snapshot(a),snapshot(b));a.dispose();b.dispose();}
 broken.dispose();r.dispose();
});
test('successive previews preserve care reset history and transformed scene ancestry',()=>{
 for(const hz of[30,60,120]){
  const r=prepared(),parent=new T.Group();parent.position.set(-5,.2,8);parent.rotation.y=.2;parent.add(r.g);parent.updateMatrixWorld(true);
  const care=getAnimalCarePose('cow',r);let base=captureCowPreviewBase(r,{overlayState:'reset'});
  for(let frame=0;frame<12;frame++){
   const mode=frame<4?'lie':frame<8?'feed':'drink',p={dt:1/hz,act:mode==='lie'?'sleeping':'eating',care:{mode,weight:(frame%4)/4,...(mode==='lie'?{}:{target:[1,.7,3]})}};
   const before=snapshot(r),prediction=previewCowFrame(base,p);assert.deepEqual(snapshot(r),before,'preview changed displayed live frame');
   care.reset();updateCow3D(r,0,0,p.dt,0,p.act,0);care.apply({...p.care,target:p.care.target&&new T.Vector3(...p.care.target)});r.g.updateMatrixWorld(true);r.card.skeleton.update();
   // matrixWorld/cache dirty flags can differ before recomputation, but the
   // complete recomputed displayed rig and next animation state must match.
   assert.deepEqual(snapshot(prediction.rig),snapshot(r),'successive '+hz+'/'+frame);
   base=prediction.nextBase;prediction.rig.dispose();
  }
  care.reset();r.dispose();
 }
});
