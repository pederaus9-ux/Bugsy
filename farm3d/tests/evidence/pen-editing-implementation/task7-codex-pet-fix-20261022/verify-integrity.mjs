import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}),sha=p=>crypto.hash('sha256',fs.readFileSync(p)),dir=new URL('./',import.meta.url);
const allowed=['farm3d/index.html','farm3d/remaining-care-controller.js','farm3d/remaining-care-navigation.js','farm3d/tests/remaining-care-world.mjs','farm3d/tests/run-core-game-tests.mjs','farm3d/AI_RELAY.md','farm3d/AI_RELAY_STATE.json'];
const rows=git('ls-tree','-r','--full-tree','HEAD').trim().split('\n'),changed=[];
for(const row of rows){const [meta,p]=row.split('\t'),expected=meta.split(' ')[2],bytes=fs.readFileSync(p),actual=crypto.hash('sha1',Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]));if(actual!==expected)changed.push(p);}
assert(changed.every(p=>allowed.includes(p)),'unexpected tracked changes: '+changed.filter(p=>!allowed.includes(p)));
const fixture=JSON.parse(fs.readFileSync('farm3d/tests/remaining-care-protected.json','utf8')).files,adapters=JSON.parse(fs.readFileSync('farm3d/tests/animal-pen-authorized-adapters.json','utf8')).files;
const protectedFiles={};for(const [p,original]of Object.entries(fixture)){const expected=adapters[p]?.reviewedSha256??original,actual=sha('farm3d/'+p);assert.equal(actual,expected,p);protectedFiles[p]=actual;}
const runnerFiles=s=>s.slice(s.indexOf('const nodeFiles='),s.indexOf('const browserFiles=')).match(/'[^']+\.test\.mjs'/g).map(s=>s.slice(1,-1));
const runner=fs.readFileSync('farm3d/tests/run-core-game-tests.mjs','utf8'),before=git('show','HEAD:farm3d/tests/run-core-game-tests.mjs'),files=runnerFiles(runner),old=runnerFiles(before);
assert.deepEqual(files.filter(p=>p!=='remaining-care-pet-collision.test.mjs'),old);assert.equal(files.length,old.length+1);
const original=git('show','HEAD:farm3d/tests/remaining-care-beast.test.mjs');assert.equal(fs.readFileSync('farm3d/tests/remaining-care-beast.test.mjs','utf8'),original);
const record={utc:new Date().toISOString(),base:git('rev-parse','HEAD').trim(),trackedFilesCompared:rows.length,changedTrackedFiles:changed,allOtherTrackedFilesExact:true,frozenEvidenceUnchanged:true,originalAssertionsSeedsAndDeadlinesUnchanged:true,runner:{before:old.length,after:files.length,originalFilesAndOrderPreserved:true},protectedFiles,runtimeHashes:Object.fromEntries(allowed.slice(0,5).map(p=>[p,sha(p)]))};
record.evidenceHashes=Object.fromEntries(fs.readdirSync(dir,{recursive:true}).map(p=>p.replaceAll('\\','/')).filter(p=>fs.statSync(new URL(p,dir)).isFile()&&p!=='integrity.json').sort().map(p=>[p,crypto.hash('sha256',fs.readFileSync(new URL(p,dir)))]));
fs.writeFileSync(new URL('integrity.json',dir),JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(record,null,2));
