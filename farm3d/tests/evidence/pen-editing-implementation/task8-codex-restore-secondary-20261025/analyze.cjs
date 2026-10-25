const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=__dirname,key='sunny-acres-3d-v1';
const raw=JSON.parse(fs.readFileSync(path.join(dir,'native-first/results.json')));
const interrupted=JSON.parse(fs.readFileSync(path.join(dir,'interruption-terminated/interruption.json')));
const comparable=s=>{const c=structuredClone(s);delete c.trace;return c;};
const compare=(a,b)=>assert.deepEqual(comparable(a),comparable(b));
const before=raw.cases[0].before;compare(before,structuredClone(before));
const controls=[
 ['live paid field',s=>s.farm.coins++],
 ['durable paid field',s=>{const f=JSON.parse(s.storage[key]);f.coins++;s.storage[key]=JSON.stringify(f);}],
 ['installed polygon',s=>s.polygon[0][0]+=.1],
 ['durable layout',s=>{const f=JSON.parse(s.storage[key]);f.layout.animalPens.revision++;s.storage[key]=JSON.stringify(f);}],
 ['restore intent',s=>s.storage['sa3d-restored']='1'],
 ['missing animal',s=>s.ids.pop()],
 ['duplicate animal',s=>s.ids[1]=s.ids[0]],
].map(([name,mutate])=>{const s=structuredClone(before);mutate(s);assert.throws(()=>compare(s,before));return {name,status:'REJECTED'};});
const cases=raw.cases.map(c=>{const saved=s=>JSON.parse(s.storage[key]);return {target:c.target,status:c.status,trace:c.afterRefusal.trace,before:{coins:saved(c.before).coins,revision:saved(c.before).layout.animalPens.revision},afterRefusal:{liveCoins:c.afterRefusal.farm.coins,savedCoins:saved(c.afterRefusal).coins,liveRevision:c.afterRefusal.revision,savedRevision:saved(c.afterRefusal).layout.animalPens.revision,restored:c.afterRefusal.storage['sa3d-restored'],dirty:c.afterRefusal.storage['sa3d-dirty']},ordinarySave:{returned:c.ordinarySaveReturned,exactPreAttemptSave:c.afterOrdinarySave.storage[key]===c.before.storage[key],restored:c.afterOrdinarySave.storage['sa3d-restored'],dirty:c.afterOrdinarySave.storage['sa3d-dirty']},browserErrors:c.errors};});
const originals=['native-first/results.json','interruption-first/interruption.json','interruption-terminated/interruption.json'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex')}));
const result={source:raw.source,controls,cases,interruption:{status:interrupted.status,guestBoot:interrupted.guestBoot,restoreIntent:interrupted.restoreIntent,trace:interrupted.atBoundary.trace,termination:interrupted.termination,atBootRestored:interrupted.reopened.atBoot['sa3d-restored'],atBootDirty:interrupted.reopened.atBoot['sa3d-dirty'],animals:interrupted.reopened.ids.length,scope:interrupted.scope},originals};
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
