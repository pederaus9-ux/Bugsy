import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fallbackFixture} from './fixtures/native-player-hands.mjs';
import {installPlayerMotion} from '../player-motion.js';

// Deterministic scheduling probes, not native-browser or offline qualification.
const current=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const base=execFileSync('git',['show','756df378e7adbe20f34c204dc54172b1030e16bd:farm3d/sw.js'],{encoding:'utf8'});
function store(){
 const rows=new Map(),events=[];
 return {rows,events,async keys(){return [...rows.keys()];},async delete(k){events.push(['delete',k]);return rows.delete(k);},async open(k){events.push(['open',k]);if(!rows.has(k))rows.set(k,new Map());const row=rows.get(k);return {async addAll(files){for(const f of files)row.set(f,'shell');},async put(req,res){row.set(req.url,res);}};},async match(req){for(const row of rows.values())if(row.has(req.url))return row.get(req.url);}};
}
function worker(source,caches,fetch=async()=>({ok:true,clone(){return 'bytes';}})){
 const handlers={};vm.runInNewContext(source,{URL,caches,fetch,self:{location:{origin:'http://fixture'},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(n,f)=>handlers[n]=f}});
 return {async lifecycle(n){let done;handlers[n]({waitUntil:p=>done=p});await done;},async request(url){let done;handlers.fetch({request:{method:'GET',url},respondWith:p=>done=p});return await done;}};
}
test('actual older activation deletes a newer installed cache during rollback',async()=>{
 const c=store(),old=worker(base,c),next=worker(current,c);
 await old.lifecycle('install');await old.lifecycle('activate');await next.lifecycle('install');
 assert(c.rows.get('sa3d-v48').has('game.js?v=27'));
 await old.lifecycle('activate');
 assert.equal(c.rows.has('sa3d-v48'),false);
 console.log('OBSERVED older activate deletes installed candidate shell; synthetic lifecycle order');
});
test('actual old in-flight fetch can recreate cache46 after candidate cleanup',async()=>{
 const c=store();let release;const gate=new Promise(r=>release=r);
 const old=worker(base,c,()=>gate),next=worker(current,c);
 await old.lifecycle('install');await old.lifecycle('activate');
 const inflight=old.request('http://fixture/farm3d/game.js?v=25');
 await next.lifecycle('install');await next.lifecycle('activate');assert.deepEqual(await c.keys(),['sa3d-v48']);
 release({ok:true,clone(){return 'late-old-response';}});await inflight;await new Promise(r=>setImmediate(r));
 assert.deepEqual(await c.keys(),['sa3d-v48','sa3d-v46']);
 assert(c.rows.get('sa3d-v48').has('game.js?v=27'));
 console.log('OBSERVED late old fetch recreates46, but does NOT erase48 shell by itself');
});
test('cache name and activated worker do not establish shell completeness',async()=>{
 const c=store(),old=worker(base,c),next=worker(current,c);
 await next.lifecycle('install');await old.lifecycle('activate');await next.lifecycle('activate');
 await next.request('http://fixture/farm3d/index.html');await new Promise(r=>setImmediate(r));
 assert.deepEqual(await c.keys(),['sa3d-v48']);assert.equal(c.rows.get('sa3d-v48').has('game.js?v=27'),false);
 console.log('OBSERVED only48 exists while game27 missing; synthetic rollback ordering, not native proof');
});
test('actual fallback idle/harvest returns to composed resting bend, not exact zero',()=>{
 const f=fallbackFixture(installPlayerMotion),angles=()=>f.hands.children.map(h=>h.userData.fingers.rotation.x);
 try{
  for(let i=0;i<120;i++)f.step(i);const before=angles();assert.deepEqual(before,[-.1,-.1]);
  f.ctx.punch={kind:'reach',authoredKind:'harvest',t:0};let max=-Infinity;
  for(let i=120;i<210;i++){f.step(i);max=Math.max(max,angles()[1]);}
  assert.equal(f.ctx.punch,null);assert.equal(f.motion.state.rest,1);assert.deepEqual(angles(),before);assert(max>.35);
  assert.equal(angles().every(x=>x===0),false);
  console.log('OBSERVED actual native updateHands + overlay',JSON.stringify({before,after:angles(),max,oldZeroCondition:false}));
 }finally{f.motion.dispose();}
});
