import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const current=readFileSync(new URL('../game.js',import.meta.url),'utf8');
// Frozen exact main8a187155 source: works in shallow CI and offline.
const predecessor=readFileSync(new URL('fixtures/game-before-utility-writer.js',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(predecessor).digest('hex'),'f0e5da372f94ef064140724458907b1ebcb8268f35b529db359fbebaa02a5786','predecessor source is immutable');
// Execute actual whole game modules; DOM/timers and unrelated chicken settlement
// are boundary shims only. Browser/emulator suites cover real input/care/cloud.
function load(source,raw){
 const storage=new Map(raw?[['sunny-acres-3d-v1',raw]]:[]),events=[];
 const ctx={URL,URLSearchParams,structuredClone,console,setTimeout(){},setInterval(){},clearInterval(){},
 location:{search:'',hostname:'127.0.0.1',href:'http://127.0.0.1/farm3d/'},
 localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
 document:{hidden:false,addEventListener(){},getElementById:id=>id==='loading'?{}:null,querySelector(){return null;}},
 window:{addEventListener(){},dispatchEvent:e=>events.push(e.type),matchMedia:()=>({matches:false,addEventListener(){}})},
 navigator:{},CHICKEN_CARE:{},MARKET_WINDOW_MS:21600000,settleChickenCare(){return null;},Event:class{constructor(type){this.type=type;}}};
 const executable=source.replace(/^import .*?;\s*$/gm,'').replace(/export\s*\{[^}]*\};?/g,'').replace(/\bexport\s+/g,'');
 vm.runInNewContext(executable+';globalThis.G={load,save,upgrade,migrate,SAVE_VERSION,MIGRATIONS,get S(){return S}};',ctx);
 ctx.G.load();return {G:ctx.G,storage,events};
}
const rawOf=x=>x.storage.get('sunny-acres-3d-v1');
const plain=x=>JSON.parse(JSON.stringify(x));
function farm(){const x=load(current);Object.assign(x.G.S,{coins:750,decor:{inv:{lantern:2,sunflowers:3},placed:[]}});x.G.S.pens.chicken={owned:true,list:Array(30).fill(0),paidUnknown:{keep:true}};return x;}
test('actual predecessor drops unknown placed IDs and can overwrite an unguarded v1 farm',()=>{
 const x=farm(),s=plain(x.G.S);s.v=1;s.decor.placed=[{id:'utilitylamp',x:2,z:3,rotation:.57}];
 const old=load(predecessor,JSON.stringify(s));assert.equal(old.G.S.decor.placed.length,0);assert.equal(old.G.save(),true);
 assert.equal(JSON.parse(rawOf(old)).decor.placed.length,0);
});
for(const mode of ['placed','inventory'])test('paid utility '+mode+' requires v2; real predecessor cannot overwrite; current writer recovers',()=>{
 const x=farm();if(mode==='placed')x.G.S.decor.placed.push({id:'utilitylamp',x:2,z:3,rotation:.57});else x.G.S.decor.inv.utilitylamp=1;
 assert.equal(x.G.save(),true);const raw=rawOf(x),saved=JSON.parse(raw);assert.equal(saved.v,2);
 const old=load(predecessor,raw);old.G.S.coins+=100;assert.equal(old.G.save(),false);assert.equal(rawOf(old),raw);assert.deepEqual(old.events,[]);
 const reopened=load(current,raw);assert.deepEqual(plain(reopened.G.S.decor),saved.decor);assert.deepEqual(plain(reopened.G.S.pens),saved.pens);assert.equal(reopened.G.S.coins,750);
 assert.equal(reopened.G.save(),true);assert.equal(JSON.parse(rawOf(reopened)).v,2);
});
test('ordinary v1 farms retain predecessor write compatibility,30 birds and paid stock',()=>{
 const x=farm();assert.equal(x.G.save(),true);const saved=JSON.parse(rawOf(x));assert.equal(saved.v,1);
 const old=load(predecessor,rawOf(x));old.G.S.coins+=10;assert.equal(old.G.save(),true);const after=JSON.parse(rawOf(old));
 assert.equal(after.v,1);assert.equal(after.coins,760);assert.deepEqual(after.decor,saved.decor);assert.deepEqual(after.pens,saved.pens);
});
test('future-version farms remain byte-for-byte protected by the actual save guard',()=>{
 const x=farm(),s=plain(x.G.S);s.v=x.G.SAVE_VERSION+1;const raw=JSON.stringify(s),future=load(current,raw);
 future.G.S.coins+=100;assert.equal(future.G.save(),false);assert.equal(rawOf(future),raw);assert.deepEqual(future.events,[]);
});
test('writer-barrier migration is shape-preserving and upgrade remains idempotent',()=>{
 const x=farm(),s=plain(x.G.S),m=x.G.migrate(structuredClone(s),2);assert.equal(m.v,2);assert.deepEqual({...plain(m),v:1},s);
 const a=plain(x.G.upgrade(structuredClone(s))),b=plain(x.G.upgrade(structuredClone(a)));assert.deepEqual(a,b);assert.equal(a.v,1);
 assert.equal(typeof x.G.MIGRATIONS[1],'function');
});
