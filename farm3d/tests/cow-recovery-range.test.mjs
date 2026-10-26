import fs from 'node:fs';import assert from 'node:assert/strict';
import {cowRecoveryWeight} from './helpers/cow-motion-domains.mjs';
const file=new URL('./evidence/pen-editing-implementation/task8-codex-recovery-range-20261025/range-controls.json',import.meta.url);if(fs.existsSync(file))throw Error('Preserve evidence');
const w=t=>1-t*t*(3-2*t),rows=[];let checks=0,error=null;
const verify=(name,r)=>{const b=cowRecoveryWeight(r);for(let k=0;k<=256;k++){const t=r[0]+(r[1]-r[0])*k/256,v=w(t);assert(v>=b[0]&&v<=b[1],name);checks++;}rows.push({name,range:r,bound:b});return b;};
try{
 for(const[name,r]of[['whole',[0,1]],['start',[0,1e-12]],['end',[1-1e-12,1]],['captured',[.7999999999999999,.9333333333333332]],['point-half',[.5,.5]],['point-zero',[0,0]],['point-one',[1,1]],['subnormal',[0,Number.MIN_VALUE]],['near-start',[Number.EPSILON,2*Number.EPSILON]],['near-end',[1-2*Number.EPSILON,1-Number.EPSILON]]])verify(name,r);
 // Endpoint extrema are established by -6t(1-t)<=0; samples are adversarial witnesses, not that proof.
 for(let i=0;i<64;i++)verify('dyadic-'+i,[i/64,(i+1)/64]);
 const captured=cowRecoveryWeight([.7999999999999999,.9333333333333332]);assert(captured[0]>0&&captured[1]<.105);
 const badIndependent=[-.2195555555555555,.2746666666666666];assert.throws(()=>assert(badIndependent[0]>0&&badIndependent[1]<.105));
 const half=cowRecoveryWeight([.2,.8]);assert.throws(()=>assert(w(.2)<=half[1]-.01));assert.throws(()=>assert(w(.8)>=half[0]+.01));
 for(const r of[[-.01,.5],[.5,1.01],[.8,.2],[NaN,1],[0,Infinity]])assert.throws(()=>cowRecoveryWeight(r));
 const before=JSON.stringify([.8,.93]),r=[.8,.93],random=Math.random;Math.random=()=>{throw Error('RNG use');};try{cowRecoveryWeight(r);assert.equal(JSON.stringify(r),before);}finally{Math.random=random;}
 rows.push({name:'invalid-underbound-independent-negative-and-nonmutation-controls',status:'PASS'});
}catch(e){error=e.stack;console.error(e);}
fs.writeFileSync(file,JSON.stringify({status:error?'RED':'PASS',checks,rows,error,limits:'Monotonic polynomial proof plus outward endpoint arithmetic/native-operation allowance. No geometry or accepted tolerance change.'},null,2));console.log(JSON.stringify({status:error?'RED':'PASS',checks,groups:rows.length}));if(error)process.exitCode=1;
