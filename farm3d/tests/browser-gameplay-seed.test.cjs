const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {applyTestGameplaySeed}=require('./browser-harness.cjs');
const source='function rng(seed){let s=seed;return()=> (s=(s*16807)%2147483647)/2147483647;}\nconst texture=rng(31);\nconst rnd = rng(4242);\nconst values=[rnd(),rnd(),rnd()];';
test('local test override uses seed 1 for the actual ordinary RNG stream without advancing or altering other streams',()=>{
 const transformed=applyTestGameplaySeed(source,1),context={window:{}};
 vm.runInNewContext(transformed+'\nwindow.values=values;window.textureFirst=texture();',context);
 const expected=[16807,282475249,1622650073].map(n=>n/2147483647);
 assert.deepEqual(Array.from(context.window.values),expected);
 assert.equal(context.window.textureFirst,(31*16807)/2147483647);
 assert.equal(context.window.__testGameplaySeed.value,1);
 assert.equal(context.window.__testGameplaySeed.firstCall,expected[0]);
 assert.equal(context.window.__testGameplaySeed.calls,3);
});
test('override refuses absent, duplicate or unsupported game RNG declarations',()=>{
 assert.throws(()=>applyTestGameplaySeed(source.replace('const rnd = rng(4242);',''),1));
 assert.throws(()=>applyTestGameplaySeed(source+'\nconst rnd = rng(4242);',1));
 assert.throws(()=>applyTestGameplaySeed(source,0));
});
