'use strict';
// TEST FIXTURE ONLY. No refs, checkout files, service worker or index are written.
// --prepare writes only content-addressed objects inside the disposable hosted clone.
const assert=require('node:assert/strict'), cp=require('node:child_process'),crypto=require('node:crypto');
const BASE='9e6f2763dd7781b761ccaef2f2cfa680d57b4783', ROOT='8c8361ee29f70ad8d07d32430d5a6c02eab4afe1';
const OLD='ae44d6ade0a2f4542d9431882dc0bd741f35f5ef', NEW='e70d576d1286fbb265e5ce6990608db9c568f04c', TREE='ba02621a9d9805c4fcf9d017be5921e2955fa517', NEW256='c3124b2679e0a49183d22607f32122986453a5c306a475ea7667c5efc3ca0f23';
const before='        if (pal) { const p = pal.pos.add(new THREE.Vector2(rnd() - .5, rnd() - .5).multiplyScalar(2.5)); this.friend = pal; return this.go(p.x, p.y, false, "Visiting " + pal.name, "social"); }';
const after=`        if (pal) {
          const center = pal.pos, offset = new THREE.Vector2(rnd() - .5, rnd() - .5).multiplyScalar(2.5);
          const p = center.clone().add(offset);
          if (this.kind === "cow" && pal.kind === "cow" && pen && pal.pen === pen && !this.cowTask && !pal.cowTask && weather === "fair" && !PRESET.night) {
            const clear = (x,z) => inPen(pen,x,z,roamClearance) && !BLOCKS.some(([bx,bz,hw,hd]) => Math.abs(x-bx)<hw+roamClearance && Math.abs(z-bz)<hd+roamClearance);
            if (!clear(p.x,p.y)) {
              const mx = 2*center.x-p.x, mz = 2*center.y-p.y;
              if (clear(mx,mz)) p.set(mx,mz);
            }
          }
          this.friend = pal; return this.go(p.x, p.y, false, "Visiting " + pal.name, "social");
        }`;
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
function substitute(source){assert.equal(source.split(before).length,2);const out=source.replace(before,()=>after);assert.equal(out.split(after).length,2);assert.equal(out.replace(after,()=>before),source);return out;}
function git(args,input){return cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never',...args],{input,maxBuffer:4e6,env:{...process.env,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}});}
const txt=(a,i)=>git(a,i).toString().trim();
function rebuild(tree,name,old,newSha){const original=git(['ls-tree','-z',tree]);const needle=Buffer.from(old+'\t'+name+'\0'),replacement=Buffer.from(newSha+'\t'+name+'\0');const at=original.indexOf(needle);assert(at>=0&&original.indexOf(needle,at+1)===-1);return txt(['mktree','-z'],Buffer.concat([original.subarray(0,at),replacement,original.subarray(at+needle.length)]));}
function run(mode){
 assert(['--prepare','--verify'].includes(mode));
 assert.equal(txt(['rev-parse',BASE+'^{tree}']),ROOT);assert.equal(txt(['rev-parse',BASE+':farm3d/index.html']),OLD);
 const original=git(['show',BASE+':farm3d/index.html']);assert.equal(sha256(original),'6ed974f5d0571ef070d50fa81d0f30c8b840f5f283e5a75e46fc8d424225131b');
 const candidate=Buffer.from(substitute(original.toString('utf8')));assert.equal(sha256(candidate),NEW256);
 if(mode==='--prepare'){
  const blob=txt(['hash-object','-w','--stdin'],candidate);assert.equal(blob,NEW);
  const farm=txt(['rev-parse',BASE+':farm3d']);const newFarm=rebuild(farm,'index.html',OLD,blob);
  assert.equal(rebuild(ROOT,'farm3d',farm,newFarm),TREE);
 }
 assert.equal(txt(['rev-parse',TREE+':farm3d/index.html']),NEW);
 assert.equal(txt(['diff-tree','-r','--no-renames','--name-only',ROOT,TREE]),'farm3d/index.html');
 assert.deepEqual(git(['show',TREE+':farm3d/index.html']),candidate);
 assert.equal(txt(['rev-parse',TREE+':farm3d/sw.js']),txt(['rev-parse',BASE+':farm3d/sw.js']));
 return TREE;
}
module.exports={BASE,ROOT,OLD,NEW,TREE,NEW256,before,after,substitute};
if(require.main===module){assert.equal(process.argv.length,3);console.log(run(process.argv[2]));}
