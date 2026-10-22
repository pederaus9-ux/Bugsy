import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir=new URL('./',import.meta.url),read=name=>fs.readFileSync(new URL(name,dir),'utf8'),json=name=>JSON.parse(read(name)),hash=p=>crypto.hash('sha256',fs.readFileSync(p));
const results={};
for(const name of ['focused-verified','core-node-verified','index-consumers-verified','observed-seed41-verified']){
 const m=json(name+'-manifest.json');assert.equal(m.exitCode,0,name);for(const [p,sha]of Object.entries(m.hashes))assert.equal(hash(p),sha,p+' differs from '+name);
 const log=read(name+'.log'),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped'].map(k=>[k,Number([...log.matchAll(new RegExp('(?:# |\\u2139 )'+k+' (\\d+)','g'))].at(-1)?.[1]??NaN)]));
 if(name==='core-node-verified'){assert(log.includes('ALL 93 Node test files and 0 browser suites passed (group node).'));results.core={files:93,exitCode:0,originalOfficialBeastSeeds:[4242,1],note:'Runner preserves its existing isolated visual-pattern execution; individual nonmatching visual cases appear skipped per isolated process and all four patterns execute.'};}
 else{assert.equal(counts.fail,0,name);assert.equal(counts.skipped,0,name);assert.equal(counts.cancelled,0,name);results[name]=counts;}
}
const seeds=[];let passed=0;
for(let i=1;i<=4;i++){
 const name='sweep-verified-'+i,m=json(name+'-manifest.json');assert.equal(m.exitCode,0,name);assert.equal(m.unchangedBody,true);assert.equal(m.originalSha256,hash('farm3d/tests/remaining-care-beast.test.mjs'));
 for(const [p,sha]of Object.entries(m.runtimeHashes))assert.equal(hash(p),sha,p+' differs from '+name);
 const log=read(name+'.log');for(const [k,v]of [['tests',20],['pass',20],['fail',0],['cancelled',0],['skipped',0]])assert(new RegExp(k+' '+v+'(?:\\r?\\n|$)').test(log),name+' '+k);
 const milestones=s=>s.split(/\r?\n/).filter(l=>/^(?:# )?(START|DONE|PROGRESS) seed/.test(l));assert.deepEqual(milestones(log),milestones(read('sweep-final-'+i+'.log')),'zero-time guard changed positive-time milestones');
 seeds.push(...m.seeds);passed+=20;
}
assert.deepEqual(seeds,Array.from({length:80},(_,i)=>i+2));
results.sweep={passed,total:80,failed:[],seeds,originalFailuresResolved:[23,26,41,62,69],goalSeconds:500,wakeSeconds:40,assertionsUnchanged:true,positiveTimeMilestonesIdenticalBeforeAndAfterZeroGuard:true};
const ordinary=json('seed-41-ordinary-safety.json');assert.deepEqual(ordinary.events,[]);results.ordinarySeed41=ordinary;
const record={utc:new Date().toISOString(),base:'6e3b40159347a99b7069e1eecc6495c2312c0ab9',branch:'codex/pet-pocket-20261022',main:'1115f93101a0e86fdcc9780e053c17b73dd6dac5',ownerAuthority:'farm3d/docs/superpowers/specs/2026-10-22-pet-collision-correction.md',results,runtimeHashes:json('focused-verified-manifest.json').hashes,limits:['Local Windows Node v24.19.0 diagnostics; no hosted CI or physical-device clearance','No visual acceptance, merge or deployment','Task 7/8 remaining work unchanged; final polish planned on gpt-6-astra/xhigh by owner preference','Existing invalid seed41 collision cage remains impassable; no teleport or reduced-clearance recovery','Author self-review only; no independent audit'],failedAttemptsRetained:['original-five-red','focused-red','focused-attempt-1','zero-time-red'],intermediatePassesRetained:['five-attempt-1','focused-attempt-2','focused-final','core-node-final','sweep-final-1','sweep-final-2','sweep-final-3','sweep-final-4']};
fs.writeFileSync(new URL('checkpoint.json',dir),JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(results,null,2));
