import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const files=fs.readdirSync('farm3d/tests').filter(p=>p.endsWith('.test.mjs')&&fs.readFileSync('farm3d/tests/'+p,'utf8').includes('index.html')).sort();
console.log(JSON.stringify({indexConsumerFiles:files,count:files.length}));
const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',...files.map(p=>'farm3d/tests/'+p)],{stdio:'inherit'});process.exitCode=r.status??1;
