import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
let failed=false;
for(let batch=0;batch<4;batch++){
 const seeds=Array.from({length:20},(_,i)=>2+batch*20+i);
 const r=spawnSync(process.execPath,[fileURLToPath(new URL('run-seeds.mjs',import.meta.url)),'sweep-final-'+(batch+1),JSON.stringify(seeds)],{stdio:'inherit'});
 if(r.status!==0)failed=true;
}
process.exitCode=failed?1:0;
