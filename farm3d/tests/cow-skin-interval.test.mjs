import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as T from '../lib/three.module.min.js';import {createCow3D} from '../cow3d.js';
import {captureCowPreviewBase,previewCowPose} from './helpers/cow-pose-preview.mjs';
import {interval,add,multiply,pointMatrix,matrixProduct,skinInterval,contains} from './helpers/cow-skin-interval.mjs';
const world=r=>r.card.skeleton.bones.map(b=>pointMatrix(b.matrixWorld));
test('outward intervals preserve exact zeros/identities and contain cancellation',()=>{
 assert.deepEqual(add([0,0],[1,1]),[1,1]);assert.deepEqual(multiply([1,1],[-2,3]),[-2,3]);
 // Compare exact dyadic values of the input doubles. Decimal literal .3 is
 // itself rounded and equals the lower adjacent double, not the exact sum.
 const units=x=>{const b=new DataView(new ArrayBuffer(8));b.setFloat64(0,x);const bits=b.getBigUint64(0),e=Number((bits>>52n)&2047n),mant=bits&((1n<<52n)-1n);return(e?((1n<<52n)|mant)<<BigInt(e-1):mant)*(bits>>63n?-1n:1n);};
 const a=add(interval(.1),interval(.2)),exact=units(.1)+units(.2);assert(units(a[0])<exact&&units(a[1])>exact);assert(units(.1+.2)>exact,'unrounded-point negative control');
 assert.throws(()=>interval(NaN));assert.throws(()=>interval(2,1));assert.throws(()=>multiply(interval(1e308),interval(1e308)));
});
test('affine LBS matches all real skinned vertices without changing rounded weights',()=>{
 const r=createCow3D(1.7,3,-4,5);r.g.position.y=.08;const base=captureCowPreviewBase(r,{overlayState:'reset'}),p=previewCowPose(base,{dx:.01,dz:.02,dt:1/30,care:{mode:'lie',weight:.4}}),v=new T.Vector3(),m=world(p);let nonUnit=0;
 for(let i=0;i<p.card.geometry.attributes.position.count;i++){
  const weights=p.card.geometry.attributes.skinWeight.array.slice(i*4,i*4+4);if(weights.reduce((s,x)=>s+x,0)!==1)nonUnit++;
  p.card.getVertexPosition(i,v).applyMatrix4(p.card.matrixWorld);assert(contains(skinInterval(p,i,m),v.toArray()),'vertex '+i);
 }
 assert(nonUnit>0,'must exercise original Float32 weight sums');p.dispose();r.dispose();
});
test('analytic breathing scale interval contains retained interior RED, unlike endpoint range',()=>{
 const red=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task8-codex-cow-motion-contract-20261025/animation-enclosure-coherent-red.json',import.meta.url))),r=createCow3D(1.7,0,0,0);
 r.state.time=red.t0;r.g.updateMatrixWorld(true);const base=captureCowPreviewBase(r,{overlayState:'reset'}),p=previewCowPose(base,{dt:red.dt/2}),m=world(p),body=p.card.skeleton.bones.indexOf(p.body),local=pointMatrix(p.body.matrix);
 // sin is in [-1,1] for all real time: this analytic domain also includes the
 // interior maximum. No new tolerance or endpoint inflation guessed from RED.
 local[5]=add(interval(1),multiply(interval(.007),interval(-1,1)));
 m[body]=matrixProduct(pointMatrix(p.body.parent.matrixWorld),local);
 assert(contains(skinInterval(p,red.witness.vertex,m),red.witness.middle));
 const wrong=world(p);wrong[body]=matrixProduct(pointMatrix(p.body.parent.matrixWorld),pointMatrix(new T.Matrix4().makeScale(1,red.bodyScales[0],1).setPosition(p.body.position)));
 assert.equal(contains(skinInterval(p,red.witness.vertex,wrong),red.witness.middle),false,'endpoint-only control must fail');
 p.dispose();r.dispose();
});
test('continuous arbitrary rotation, scale and translation domains bound a weighted vertex',()=>{
 const r=createCow3D();r.g.updateMatrixWorld(true);const index=5038,m=world(r),body=1;
 // Analytic family Rz(2*pi*t), scale [0.5,2], translation x[-2,3].
 // Every rotation coefficient is in [-1,1]. Independent intervals overbound
 // correlation; the proof uses these global ranges, not the sample witness.
 const b=pointMatrix(new T.Matrix4());for(const i of[0,1,4,5])b[i]=interval(-2,2);b[10]=interval(.5,2);b[12]=interval(-2,3);b[13]=interval(-1,4);m[body]=b;
 const bound=skinInterval(r,index,m),v=new T.Vector3();
 const original=r.body.matrixWorld.clone();for(let j=0;j<=32;j++){const t=j/32;r.body.matrixWorld.compose(new T.Vector3(-2+5*t,-1+5*t,0),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),2*Math.PI*t),new T.Vector3(.5+1.5*t,.5+1.5*t,.5+1.5*t));r.card.getVertexPosition(index,v).applyMatrix4(r.card.matrixWorld);assert(contains(bound,v.toArray()));}r.body.matrixWorld.copy(original);r.dispose();
});
test('missing limb enclosure and non-affine bounds fail rather than certify sampled motion',()=>{
 const r=createCow3D();r.g.updateMatrixWorld(true);const m=world(r),joint=r.card.geometry.attributes.skinIndex.array[23927*4];m[joint]=undefined;assert.throws(()=>skinInterval(r,23927,m),/enclosure/);
 const n=world(r);n[1][3]=interval(-1,1);assert.throws(()=>skinInterval(r,5038,n),/Projective/);r.dispose();
});
test('controls reject negative weights and detect unauthorized weight normalization',()=>{
 const r=createCow3D(1.7,15,-32,0);r.g.updateMatrixWorld(true);const original=r.card.geometry,g=original.clone(),w=new Float64Array(g.attributes.skinWeight.array),v=new T.Vector3();g.setAttribute('skinWeight',new T.BufferAttribute(w,4));let index=-1;
 for(let i=0;i<w.length/4;i++)if(w.slice(i*4,i*4+4).reduce((s,x)=>s+x,0)!==1){index=i;break;}
 assert(index>=0);r.card.getVertexPosition(index,v).applyMatrix4(r.card.matrixWorld);r.card.geometry=g;
 // Deliberately wrong bound algebra: normalize the stored rounded values in
 // double precision, as a convex-combination implementation might do.
 try{const sum=w.slice(index*4,index*4+4).reduce((s,x)=>s+x,0);for(let k=0;k<4;k++)w[index*4+k]/=sum;
  assert.equal(contains(skinInterval(r,index,world(r)),v.toArray()),false,'normalized weights must not masquerade as unchanged skin');
  w[index*4]=-.1;assert.throws(()=>skinInterval(r,index,world(r)),/weight/);
 }finally{r.card.geometry=original;g.dispose();r.dispose();}
});
