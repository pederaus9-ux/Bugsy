import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=new URL('./',import.meta.url),tests=new URL('../../../',dir),original=fs.readFileSync(new URL('remaining-care-beast.test.mjs',tests),'utf8');
const importFrom="'./remaining-care-world.mjs'",importTo="'./evidence/pen-editing-implementation/task7-codex-pet-fix-20261022/observe-world.mjs'",loopFrom='for(const seed of [4242,1])',loopTo='for(const seed of [41])';
const observed=original.replace(importFrom,importTo).replace(loopFrom,loopTo);
if(observed.replace(importTo,importFrom).replace(loopTo,loopFrom)!==original)throw Error('Test body differs');
const target=new URL('remaining-care-pet-fix-observed.generated.test.mjs',tests);fs.writeFileSync(target,observed,{flag:'wx'});
const r=spawnSync(process.execPath,['--test','--test-reporter=tap',fileURLToPath(target)],{stdio:'inherit'});process.exitCode=r.status??1;
