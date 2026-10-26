import fs from 'node:fs';import crypto from 'node:crypto';import {spawn,execFileSync} from 'node:child_process';
const dir=new URL('./',import.meta.url),label=process.argv[2],args=JSON.parse(process.argv[3]||'null');
if(!/^[a-z0-9-]+$/.test(label||'')||!Array.isArray(args))throw Error('label and Node argument array required');
const log=new URL(label+'.log',dir),manifest=new URL(label+'-manifest.json',dir);
for(const p of [log,manifest])if(fs.existsSync(p))throw Error('Evidence exists');
const runtime=['farm3d/index.html','farm3d/remaining-care-controller.js','farm3d/remaining-care-navigation.js','farm3d/tests/remaining-care-world.mjs','farm3d/tests/remaining-care-pet-collision.test.mjs'];
const record={utc:new Date().toISOString(),node:process.version,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),command:[process.execPath,...args],coreGroup:process.env.FARM3D_CORE_GROUP??null,hashes:Object.fromEntries(runtime.map(p=>[p,crypto.hash('sha256',fs.readFileSync(p))]))};
fs.writeFileSync(manifest,JSON.stringify(record,null,2)+'\n',{flag:'wx'});const fd=fs.openSync(log,'wx'),child=spawn(process.execPath,args,{stdio:['ignore',fd,fd]});
child.on('exit',(code,signal)=>{fs.closeSync(fd);Object.assign(record,{exitCode:code,signal,finishedUtc:new Date().toISOString()});fs.writeFileSync(manifest,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({label,code,signal}));process.exitCode=code??1;});
