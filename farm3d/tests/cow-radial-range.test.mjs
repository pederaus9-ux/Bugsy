import fs from 'node:fs';import assert from 'node:assert/strict';
import {cowReachClip} from './helpers/cow-motion-domains.mjs';
import {intervalMath as Q} from './helpers/cow-leg-enclosure.mjs';
const file=new URL('./evidence/pen-editing-implementation/task8-codex-radial-classification-20261025/radial-controls.json',import.meta.url);if(fs.existsSync(file))throw Error('Preserve evidence');
const native=(x,z)=>{const h=Math.hypot(x,z);if(h>.34){const k=.34/Math.hypot(x,z);x*=k;z*=k;}return[x,z];};
const rows=[];let checks=0,error=null;
try{
 const ranges=[[-2,2],[-1,-.34],[-.34,.34],[-.340000000000001,-.339999999999999],[0,0],[Number.MIN_VALUE,1e-300],[0,.34],[.339999999999999,.340000000000001],[.34,1],[-1e-14,1e-14],[.34095021969950084,.5036765402138446]];
 for(const x of ranges)for(const z of ranges){const b=cowReachClip(x,z);for(let i=0;i<=24;i++)for(let j=0;j<=24;j++){const a=native(x[0]+(x[1]-x[0])*i/24,z[0]+(z[1]-z[0])*j/24);assert(a[0]>=b.tx[0]&&a[0]<=b.tx[1]);assert(a[1]>=b.tz[0]&&a[1]<=b.tz[1]);checks++;}rows.push({x,z,b});}
 const a=cowReachClip([-1.1e-15,1.1e-15],[.34095021969950084,.5036765402138446]);assert(a.tz[1]<.5&&a.tz[1]>=.34);assert.throws(()=>assert(.5022728063458718<.5));
 for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1]]){const b=cowReachClip([x,x],[z,z]),p=native(x,z),k=x?'tx':'tz',v=x?p[0]:p[1];assert.throws(()=>assert(v>=b[k][0]+1e-8&&v<=b[k][1]-1e-8));}
 const x=[-.2,.2],z=[-.1,.1],saved=JSON.stringify([x,z]),rand=Math.random;Math.random=()=>{throw Error('RNG');};try{cowReachClip(x,z);assert.equal(JSON.stringify([x,z]),saved);}finally{Math.random=rand;}
 for(const args of [[[1,0],[0,0]],[[NaN,1],[0,0]],[[0,Infinity],[0,0]],[[0,0],[0,0],[-1,1]]])assert.throws(()=>cowReachClip(...args));
 rows.push({controls:'Captured old guard RED; native axes; deliberately shrunken bounds; invalid intervals; input/RNG nonmutation',status:'PASS'});
}catch(e){error=e.stack;console.error(e);}
fs.writeFileSync(file,JSON.stringify({status:error?'RED':'PASS',checks,rows,error,note:'Real disk invariant plus outward supported-engine allowance; finite witnesses complement the analytical range, not universal Math.hypot certification.'},null,2));console.log(JSON.stringify({status:error?'RED':'PASS',checks,groups:rows.length}));if(error)process.exitCode=1;
