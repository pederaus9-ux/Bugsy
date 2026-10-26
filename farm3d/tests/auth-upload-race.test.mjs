import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../auth.js',import.meta.url),'utf8');
const start=source.indexOf('async function upload(force)'),end=source.indexOf('document.addEventListener("visibilitychange"',start);
assert(start>=0&&end>start);
const code=source.slice(start,end);
function fixture(){
 const values=new Map([['save',JSON.stringify({coins:100,lastSeen:1,__sentinel:'unit'})],['owner','unit-user'],['dirty','1'],['rev','13']]),listeners={},timers=new Map(),sent=[];let resolve,reject,next=0,blocked=false,stamp=1;
 const pending=new Promise((a,b)=>{resolve=a;reject=b});
 const c={SAVE_KEY:'save',OWNER:'owner',DIRTY:'dirty',SYNC_REV:'rev',RECOVER:'recover',restoreRecovery:{blocked:()=>blocked,stamp:()=>stamp},ls:{get:k=>values.get(k)||null,set:(k,v)=>values.set(k,v),del:k=>values.delete(k)},cloud:{uid:'unit-user',put:raw=>{sent.push(JSON.parse(raw));return sent.length===1?pending:Promise.resolve(15)}},summary:raw=>JSON.parse(raw),window:{dispatchEvent(){}},CustomEvent:class{},console:{warn(){}},clearTimeout:id=>timers.delete(id),setTimeout:(fn,ms)=>{assert.equal(ms,15000);timers.set(++next,fn);return next},addEventListener:(n,f)=>listeners[n]=f};
 vm.createContext(c);vm.runInContext(code+';globalThis.start=()=>upload();',c);
 return{values,sent,timers,start:c.start,resolve,reject,setBlocked:v=>blocked=v,setStamp:v=>stamp=v,save(patch){values.set('save',JSON.stringify({...JSON.parse(values.get('save')),...patch}));listeners['sa3d:saved']();},async drain(){const f=[...timers.values()].at(-1);assert(f);await f();}};
}
test('a settled unchanged upload clears only its own dirty marker',async()=>{const f=fixture(),p=f.start();f.resolve(14);assert.equal(await p,true);assert.equal(f.values.get('rev'),'14');assert.equal(f.values.has('dirty'),false);assert.equal(f.sent.length,1);});
test('new local progress during an upload remains dirty and is uploaded after that response',async()=>{const f=fixture(),p=f.start();f.save({coins:103});f.resolve(14);await p;assert.equal(f.values.get('dirty'),'1');assert.equal(f.values.get('rev'),'14');await f.drain();assert.deepEqual(f.sent.map(x=>x.coins),[100,103]);assert.equal(f.values.get('rev'),'15');assert.equal(f.values.has('dirty'),false);});
test('automatic lastSeen-only saving never creates a gameplay upload',()=>{const f=fixture();f.values.delete('dirty');f.save({lastSeen:2});assert.equal(f.values.has('dirty'),false);assert.equal(f.timers.size,0);assert.equal(f.sent.length,0);});
test('timestamp changes during an upload do not invent newer gameplay progress',async()=>{const f=fixture(),p=f.start();f.save({lastSeen:2});f.resolve(14);await p;assert.equal(f.values.has('dirty'),false);assert.equal(f.timers.size,0);});
test('real coin and sentinel changes still mark progress dirty',()=>{for(const patch of[{coins:103},{__sentinel:'changed'}]){const f=fixture();f.values.delete('dirty');f.save(patch);assert.equal(f.values.get('dirty'),'1');assert.equal(f.timers.size,1);}});
test('pending recovery blocks sending a farm',async()=>{const f=fixture();f.values.set('recover','1');assert.equal(await f.start(),false);assert.equal(f.sent.length,0);assert.equal(f.values.get('dirty'),'1');});
test('restore stamp change during upload prevents bookkeeping publication',async()=>{const f=fixture(),p=f.start();f.setStamp(2);f.resolve(14);assert.equal(await p,false);assert.equal(f.values.get('rev'),'13');assert.equal(f.values.get('dirty'),'1');});
test('failed upload leaves dirty state intact',async()=>{const f=fixture(),p=f.start();f.reject(new Error('disposable failure'));assert.equal(await p,false);assert.equal(f.values.get('rev'),'13');assert.equal(f.values.get('dirty'),'1');});
