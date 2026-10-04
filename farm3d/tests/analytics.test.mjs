import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAnalytics,encodeReport,decodeReport,summarizeReports,platformClass,screenClass,fpsBucket,durationBucket,ANALYTICS_KEY,DAILY_LIMIT,MAX_QUEUE} from '../analytics.js';
import {dateCutoff} from '../analytics-dashboard.js';
const context={version:'36',platform:'android',screen:'phone',mode:'guest'};
const DAY=864e5, start=Date.parse('2026-10-03T12:00:00Z');
function fixture(over={}) {
  const data=new Map(), writes=[];let clock=start,n=0,online=false;
  const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const options={storage,context:()=>context,now:()=>clock,id:()=>`report_${String(++n).padStart(8,'0')}`,canSend:()=>online,write:async(id,row)=>writes.push({id,row}),...over};
  const a=createAnalytics(options);
  return {a,data,writes,options,time:t=>clock=t,online:v=>online=v,state:()=>JSON.parse(data.get(ANALYTICS_KEY)),reports:()=>JSON.parse(data.get(ANALYTICS_KEY)).queue.map(x=>decodeReport(x.data))};
}
test('compact reports cover all dimensions and keep the existing exact two-field schema',()=>{
  for(const version of ['36','9999'])for(const platform of ['android','ios','desktop','other'])for(const screen of ['phone','tablet','desktop','unknown'])for(const mode of ['guest','account','unknown'])for(const [kind,value] of [['open','0'],['harv','0'],['ord','0'],['tut','0'],['lvl','20'],['ret1','0'],['ret7','0'],['boot','0'],['sess','41a']]){
    const c={version,platform,screen,mode,uid:'private',email:'private',stack:'private'};
    const e=encodeReport(c,kind,value);assert.match(e,/^[a-z0-9_]{1,24}$/);
    const r=decodeReport({e,d:'2026-10-03'});assert.equal(r.kind,kind);assert.equal(r.platform,platform);assert.equal(r.mode,mode);assert.equal(r.value,value);
    assert.ok(!JSON.stringify(r).includes('private'));
  }
  for(const row of [{e:'open',d:'2026-10-03'},{e:'a2_36_apg_sess_41a',d:'2026-02-30'},{e:'a2_36_apg_lvl_99',d:'2026-10-03'},{e:'a2_36_apg_open_0',d:'2026-10-03',uid:'x'},{e:'a2_36_apg_sess_99z',d:'2026-10-03'}])assert.equal(decodeReport(row),null);
  assert.equal(encodeReport({...context,version:'0'},'open'),null);
});
test('FPS and duration boundaries, platform and orientation classification',()=>{
  assert.deepEqual([null,0,29.99,30,44.99,45,59.99,60,120].map(fpsBucket),['x','x','d','c','c','b','b','a','a']);
  assert.deepEqual([0,59999,60000,299999,300000,899999,900000,1799999,1800000].map(durationBucket),[0,0,1,1,2,2,3,3,4]);
  assert.equal(platformClass('Linux; Android 16'),'android');assert.equal(platformClass('Macintosh','MacIntel',5),'ios');assert.equal(platformClass('Windows'),'desktop');assert.equal(platformClass('???'),'other');
  assert.equal(screenClass('android',844,390),'phone');assert.equal(screenClass('android',390,844),'phone');assert.equal(screenClass('ios',1024,768),'tablet');assert.equal(screenClass('desktop',390,844),'desktop');assert.equal(screenClass('other',0,0),'unknown');
  assert.equal(dateCutoff('7',start),'2026-09-27');assert.equal(dateCutoff('30',start),'2026-09-04');assert.equal(dateCutoff('all',start),null);
});
test('milestones wait for gameplay and deduplicate per release, outside the farm save',()=>{
  let play=false;const f=fixture({canPlay:()=>play});
  f.a.milestone('harvest');f.a.milestone('harvest');f.a.frame(0);assert.equal(f.data.size,0);
  play=true;f.a.frame(100);f.a.milestone('order');f.a.milestone('order');f.a.milestone('lvl_5');f.a.milestone('tut_done');f.a.milestone('back_d7');
  assert.deepEqual(f.reports().map(r=>r.kind),['open','harv','ord','lvl','tut']);
  const a=createAnalytics(f.options);a.frame(0);a.milestone('order');assert.equal(f.reports().length,5);
  const b=createAnalytics({...f.options,context:()=>({...context,version:'37'})});b.frame(0);b.milestone('order');assert.equal(f.reports().length,7);
  assert.deepEqual([...f.data.keys()],[ANALYTICS_KEY]);
});
test('returns mean exact UTC day 1 and day 7, rather than any later visit',()=>{
  const f=fixture();f.a.frame(0);f.a.end(100);
  for(const d of [1,2,7,8]){f.time(start+d*DAY);const a=createAnalytics(f.options);a.frame(0);a.end(100);}
  assert.equal(f.reports().filter(r=>r.kind==='ret1').length,1);assert.equal(f.reports().filter(r=>r.kind==='ret7').length,1);
  const g=fixture();g.a.frame(0);g.a.end(100);g.time(start+8*DAY);createAnalytics(g.options).frame(0);
  assert.equal(g.reports().some(r=>r.kind.startsWith('ret')),false);
});
test('foreground duration, rendered FPS, pauses, observed errors and end deduplication',()=>{
  const f=fixture();for(let i=0;i<=600;i++)f.a.frame(i*20);f.a.pause();f.a.frame(1000000);for(let i=1;i<=600;i++)f.a.frame(1000000+i*20);
  f.a.error();f.a.end(1012000);f.a.end(1012000);
  assert.equal(f.reports().find(r=>r.kind==='sess').value,'01b');
  f.a.frame(1013000);f.a.end(1014000);assert.equal(f.reports().filter(r=>r.kind==='sess').at(-1).value,'00x');
  const g=fixture();g.a.error();g.a.error();g.a.frame(0);g.a.end(60000);
  assert.equal(g.reports().filter(r=>r.kind==='boot').length,1);assert.equal(g.reports().find(r=>r.kind==='sess').value,'11x');
});
test('offline reports persist, retry the same document ID, and terminal refusals cannot block the queue',async()=>{
  let tries=0;const f=fixture({canSend:()=>true,write:async(id,row)=>{f.writes.push({id,row});if(++tries===1)throw Object.assign(new Error('offline'),{code:'unavailable'});}});
  f.a.frame(0);await f.a.flush();await new Promise(r=>setImmediate(r));assert.equal(f.state().queue.length,1);
  f.time(start+60001);await f.a.flush();assert.equal(f.state().queue.length,0);assert.equal(f.writes[0].id,f.writes[1].id);
  const g=fixture();g.a.frame(0);g.a.milestone('order');
  const a=createAnalytics({...g.options,canSend:()=>true,write:async()=>{throw Object.assign(new Error('already exists'),{code:'permission-denied'});}});await a.flush();assert.equal(g.state().queue.length,0);
});
test('daily and persisted queue bounds, stale pruning and corrupt/quota/ID failures are nonfatal',()=>{
  const f=fixture();for(let i=0;i<100;i++){f.a.frame(i*100);f.a.end(i*100+1);}assert.equal(f.state().count,DAILY_LIMIT);assert.equal(f.state().queue.length,DAILY_LIMIT);
  f.time(start+DAY);for(let i=0;i<20;i++){f.a.frame(i);f.a.end(i+1);}assert.equal(f.state().queue.length,MAX_QUEUE);
  f.time(start+20*DAY);f.a.frame(0);f.a.end(1);assert.equal(f.state().queue.length,1);
  for(const storage of [{getItem:()=>'{bad',setItem:()=>{throw Error('quota');}},{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}}])assert.doesNotThrow(()=>{const a=createAnalytics({...f.options,storage});a.frame(0);a.end(100);});
  assert.doesNotThrow(()=>{fixture({id:()=>{throw Error('crypto unavailable');}}).a.frame(0);});
});
test('test farms and captures produce no writes, reports or metric storage',async()=>{
  const f=fixture({disabled:true,canSend:()=>true});f.a.frame(0);f.a.milestone('harvest');f.a.error();f.a.end(60000);await f.a.flush();assert.equal(f.data.size,0);assert.equal(f.writes.length,0);
});
test('filtered summaries use reported visits as denominator and exclude malformed/legacy rows',()=>{
  const row=(kind,value,c=context)=>({e:encodeReport(c,kind,value),d:'2026-10-03'});
  const rows=[row('sess','00a'),row('sess','21c'),row('open','0'),row('ord','0'),row('sess','40d',{...context,version:'34',platform:'ios'}),{e:'open',d:'2026-10-03'}];
  const s=summarizeReports(rows,{version:'36',platform:'android'});assert.equal(s.reports,4);assert.equal(s.sessions,2);assert.equal(s.clean,1);assert.equal(s.fps.a,1);assert.equal(s.fps.c,1);assert.equal(s.milestones.ord,1);assert.equal(s.modes.guest,2);
  assert.equal(summarizeReports(rows).sessions,3);assert.equal(summarizeReports(rows,{platform:'desktop'}).reports,0);
});
