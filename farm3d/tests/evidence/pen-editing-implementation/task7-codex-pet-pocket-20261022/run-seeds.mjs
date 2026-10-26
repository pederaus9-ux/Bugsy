// Same Beast body, assertions and deadlines as the frozen diagnostic method.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const evidence=new URL('./',import.meta.url),tests=new URL('../../../',evidence);
const label=process.argv[2],seeds=JSON.parse(process.argv[3]||'null');
if(!/^[a-z0-9-]+$/.test(label||'')||!Array.isArray(seeds)||!seeds.length||!seeds.every(Number.isSafeInteger))throw Error('usage: run-seeds.mjs unique-label [seeds]');
const original=fs.readFileSync(new URL('remaining-care-beast.test.mjs',tests),'utf8');
const needle='for(const seed of [4242,1])',replacement='for(const seed of '+JSON.stringify(seeds)+')';
if(original.split(needle).length!==2)throw Error('Frozen diagnostic loop not found exactly once');
const trace=process.argv[4]==='trace',fixture="'./remaining-care-world.mjs'",wrapped="'./evidence/pen-editing-implementation/task7-codex-pet-pocket-20261022/trace-world.mjs'";
let generated=original.replace(needle,replacement);
if(trace)generated=generated.replace(fixture,wrapped);
const target=new URL('remaining-care-pocket-'+label+'.generated.test.mjs',tests);
const manifest=new URL(label+'-manifest.json',evidence),logPath=new URL(label+'.log',evidence);
if(fs.existsSync(manifest)||fs.existsSync(logPath)||fs.existsSync(target))throw Error('Evidence exists; choose a new label');
if((trace?generated.replace(wrapped,fixture):generated).replace(replacement,needle)!==original)throw Error('Body differs beyond documented diagnostic transforms');
fs.writeFileSync(target,generated,{flag:'wx'});
const entry={utc:new Date().toISOString(),node:process.version,seeds,source:'cf29f6d6433ceb3060f6f049045504afb3c87c3a',originalSha256:crypto.hash('sha256',original),generatedSha256:crypto.hash('sha256',generated),unchangedBody:true,fixtureTrace:trace,command:[process.execPath,'--test',fileURLToPath(target)]};
fs.writeFileSync(manifest,JSON.stringify(entry,null,2)+'\n',{flag:'wx'});
const log=fs.openSync(logPath,'wx'),child=spawn(process.execPath,['--test',fileURLToPath(target)],{stdio:['ignore',log,log]});
child.on('exit',code=>{fs.closeSync(log);entry.exitCode=code;entry.finishedUtc=new Date().toISOString();fs.writeFileSync(manifest,JSON.stringify(entry,null,2)+'\n');console.log(JSON.stringify({label,seeds,code,log:fileURLToPath(logPath)}));process.exitCode=code;});
