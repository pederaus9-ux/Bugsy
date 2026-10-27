const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {OBSERVATION_MS,MAX_SAMPLES,AUTH_AUTOMATIC_FIELDS,CHANGED_FIELD_LABELS,authProgressOf,allowedChangedFields,changedFieldDiagnostics,requestedSaveMatches,pollRequestedSave} = require('./recovery-observation.cjs');
const base = {rev:11,token:'test-sentinel',save:JSON.stringify({__sentinel:'test-sentinel',coins:100,quests:{day:1}})};
const sample = (rev,coins=100,token=base.token) => ({rev,save:JSON.stringify({__sentinel:token,coins,quests:{day:1}})});
function clock() { let ms=0; return {now:()=>ms,advance:n=>{ms+=n;},wait:async n=>{ms+=n;}}; }

test('existing revision from the captured failure cannot satisfy the requested +3 observation',async () => {
  const time=clock(),observed=[];const samples=[sample(12),sample(12),sample(13,103)];
  const after=await pollRequestedSave({read:async()=>samples.shift(),wait:time.wait,now:time.now,base,observe:(value,index,matched)=>observed.push({index,matched})});
  assert.equal(after.rev,13);assert.equal(JSON.parse(after.save).coins,103);
  assert.deepEqual(observed,[{index:0,matched:false},{index:1,matched:false},{index:2,matched:true}]);assert.equal(time.now(),2000);
});
test('stale revision, wrong sentinel and nonmatching newer payloads are rejected',() => {
  for(const value of [sample(11,103),sample(10,103),sample(12,103,'other'),sample(12,100),sample(12,104),{rev:12,save:'broken'},null]) assert.equal(requestedSaveMatches(value,base),false);
  assert.equal(requestedSaveMatches(sample(12,103),base),true);
});
test('later correct save may follow stale and nonmatching revision samples',async () => {
  const time=clock(),samples=[sample(11,103),sample(12,103,'other'),sample(13),sample(14,103)];let reads=0;
  const after=await pollRequestedSave({read:async()=>{reads++;return samples.shift();},wait:time.wait,now:time.now,base});
  assert.equal(after.rev,14);assert.equal(reads,4);assert.equal(time.now(),3000);
});
test('a never-matching revision remains failing at the original 40-second/40-sample limit',async () => {
  const time=clock();let reads=0,waits=0;
  const after=await pollRequestedSave({read:async()=>{reads++;return sample(12);},wait:async ms=>{assert.equal(ms,1000);waits++;time.advance(ms);},now:time.now,base});
  assert.equal(OBSERVATION_MS,40000);assert.equal(MAX_SAMPLES,40);assert.equal(time.now(),40000);assert.equal(reads,40);assert.equal(waits,40);assert.equal(requestedSaveMatches(after,base),false);
});
test('HTTP/read latency consumes the same total observation budget',async () => {
  const time=clock();let reads=0;
  const after=await pollRequestedSave({read:async()=>{reads++;time.advance(1000);return sample(12);},wait:time.wait,now:time.now,base});
  assert.equal(time.now(),40000);assert.equal(reads,20);assert.equal(requestedSaveMatches(after,base),false);
});
test('a qualifying read arriving after the deadline cannot pass',async () => {
  const time=clock();
  await assert.rejects(pollRequestedSave({read:async()=>{time.advance(40001);return sample(12,103);},wait:time.wait,now:time.now,base}),/no sample within40000ms/);
});
test('a stalled read expires at the remaining budget without a real 40-second wait',async () => {
  const time=clock(),pending=new Map();let id=0,lateResolve;
  const timers={setTimeout:(fn,ms)=>{pending.set(++id,{fn,ms});return id;},clearTimeout:id=>pending.delete(id)};
  const result=pollRequestedSave({read:()=>new Promise(resolve=>{lateResolve=resolve;}),wait:time.wait,now:time.now,timers,base});
  const rejection=assert.rejects(result,/no sample within40000ms/);
  await Promise.resolve();assert.equal(pending.size,1);const timeout=[...pending.values()][0];assert.equal(timeout.ms,40000);
  time.advance(40000);timeout.fn();await rejection;lateResolve(sample(12,103));await Promise.resolve();
});
test('read failures remain failures instead of manufacturing a passing sample',async () => {
  await assert.rejects(pollRequestedSave({read:async()=>{throw new Error('synthetic transport refusal');},wait:async()=>{},base}),/synthetic transport refusal/);
});
test('diagnostic callback time is included before accepting a qualifying sample',async () => {
  const time=clock();
  await assert.rejects(pollRequestedSave({read:async()=>sample(12,103),wait:time.wait,now:time.now,base,observe:()=>time.advance(40001)}),/no sample within40000ms/);
});

test('auth comparison mirrors the actual unchanged production progressOf function',() => {
  const source=fs.readFileSync(path.resolve(__dirname,'../../auth.js'),'utf8');
  const exact=source.slice(source.indexOf('function progressOf(raw) {'),source.indexOf('\nlet lastProgress'));
  const original=vm.runInNewContext('('+exact+')');
  const examples=[base.save,'broken','null','[]',null,JSON.stringify({coins:100,quests:{day:2},lastSeen:33,orders:[{id:'not-emitted'}]}),JSON.stringify({lastSeen:1,coins:100})];
  for(const raw of examples) assert.equal(authProgressOf(raw),original(raw));
  assert.deepEqual(AUTH_AUTOMATIC_FIELDS,['orders','event','nextEventAt','lastNag','lastBackup','lastSeen']);
});
test('automatic fields are named while auth progress remains equal',() => {
  const before={coins:100,quests:{day:1}},after={...before,lastSeen:5,lastNag:3,orders:[{private:'DO_NOT_EMIT'}]};
  const result=changedFieldDiagnostics(JSON.stringify(after),JSON.stringify(before));
  assert.deepEqual(result.changedFields,['orders','lastSeen','lastNag']);assert.equal(result.authProgressEqual,true);assert(!JSON.stringify(result).includes('DO_NOT_EMIT'));
});
test('quests and animal care changes remain visible to auth progress equality',() => {
  const before={coins:100,quests:{day:1},pens:{chicken:{care:{feed:1}}}};
  const after={coins:100,quests:{day:2},pens:{chicken:{care:{feed:2}}}};
  const result=changedFieldDiagnostics(JSON.stringify(after),JSON.stringify(before));
  assert.deepEqual(result.changedFields,['pens','quests','pens.chicken.care']);assert.equal(result.authProgressEqual,false);
});
test('dynamic keys, values and animal identity data never become diagnostic field names',() => {
  const before={coins:100,barn:{},pens:{chicken:{meta:[]}}};
  const after={...before,barn:{SECRET_ITEM_ID:99},SECRET_ROOT_ID:'SECRET_VALUE',pens:{chicken:{meta:[{id:'SECRET_ANIMAL_ID',name:'SECRET_NAME'}]}}};
  const result=changedFieldDiagnostics(JSON.stringify(after),JSON.stringify(before));
  assert.equal(result.unclassifiedTopLevelChange,true);assert(allowedChangedFields(result.changedFields));assert(!JSON.stringify(result).includes('SECRET'));
});
test('unreadable or nonobject snapshots never leak raw data',() => {
  for(const raw of ['SECRET_MALFORMED','null','[]','3']) assert.deepEqual(changedFieldDiagnostics(raw,base.save),{fieldComparisonReadable:false});
});
test('field-name validation rejects unknown names and oversized arrays',() => {
  assert.equal(allowedChangedFields(['quests','lastSeen']),true);assert.equal(allowedChangedFields(['SECRET']),false);assert.equal(allowedChangedFields('quests'),false);assert.equal(allowedChangedFields(Array(CHANGED_FIELD_LABELS.length+1).fill('quests')),false);
});
test('byte-only formatting differences stay distinguished from known value changes',() => {
  const result=changedFieldDiagnostics('{ "coins": 100 }','{"coins":100}');
  assert.deepEqual(result.changedFields,[]);assert.equal(result.unclassifiedByteDifference,true);assert.equal(result.authProgressEqual,true);
});
test('receipt writer independently revalidates names and discards arbitrary strings',() => {
  const source=fs.readFileSync(path.join(__dirname,'emu-harness.cjs'),'utf8');
  const code=source.slice(source.indexOf('const rollbackDiagnosticEnabled'),source.indexOf('const PROJECT'));
  const lines=[];
  const sandbox={process:{env:{ROLLBACK_DIAGNOSTIC:'1',ROLLBACK_DIAGNOSTIC_FILE:'synthetic.jsonl'},argv:['node','recovery.browser.cjs']},path,allowedChangedFields,Buffer,Date,fs:{statSync:()=>{throw new Error('absent');},mkdirSync:()=>{},appendFileSync:(_p,line)=>lines.push(line)}};
  vm.createContext(sandbox);vm.runInContext(code,sandbox);
  vm.runInContext("rollbackDiagnostic('recovery-at-recovery',{changedFields:['quests','lastSeen'],authProgressEqual:false,save:'SECRET_SAVE',token:'SECRET_TOKEN'});rollbackDiagnostic('recovery-at-recovery',{changedFields:['quests','SECRET_FIELD']});rollbackDiagnostic('recovery-at-recovery',{changedFields:Array(100).fill('quests')});",sandbox);
  const rows=lines.map(JSON.parse);assert.deepEqual(rows[0].changedFields,['quests','lastSeen']);assert.equal(rows[0].authProgressEqual,false);assert.equal(rows[1].fieldNamesRejected,true);assert.equal(rows[2].fieldNamesRejected,true);assert(!JSON.stringify(rows).includes('SECRET'));
});
