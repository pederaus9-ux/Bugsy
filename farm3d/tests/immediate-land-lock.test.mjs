import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import vm from 'node:vm';
const source=fs.readFileSync(new URL('./remaining-care-integration.test.mjs',import.meta.url),'utf8').match(/test\('protected implementations and approved pen adapters retain exact reviewed bytes',\(\)=>\{([\s\S]*?)\n\}\);/)[1].replaceAll('import.meta.url',JSON.stringify(new URL('./remaining-care-integration.test.mjs',import.meta.url).href));
const readReal=fs.readFileSync.bind(fs),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function run(mutate=()=>{},registryEdit=()=>{}){const read=(url,encoding)=>{let raw=readReal(url),name=new URL(url).pathname.split('/').pop();if(name==='animal-pen-authorized-adapters.json'){const a=JSON.parse(raw);registryEdit(a);raw=Buffer.from(JSON.stringify(a));}else raw=mutate(name,raw)||raw;return encoding?raw.toString():raw;};return vm.runInNewContext('(function(){'+source+'})()',{fs:{readFileSync:read},crypto,assert,URL});}
test('A6 land exception accepts exact reviewed bytes',()=>run());
test('A6 rejects another mask change without review',()=>assert.throws(()=>run((n,b)=>n==='farm-land.js'?Buffer.from(b.toString().replace('1+24,-46,-25','1+24,-47,-25')):b),/changed outside the reviewed source checkpoint/));
for(const [name,before,after] of [['old farm boundary','radius+1e-9','radius+1'],['terrain heights','return clearing===1?0','return clearing===1?1']])test('A6 rejects changed '+name+' even with a re-registered whole-file digest',()=>{
 const change=b=>Buffer.from(b.toString().replace(before,after)),real=readReal(new URL('../farm-land.js',import.meta.url));assert.notEqual(change(real).toString(),real.toString());
 assert.throws(()=>run((n,b)=>n==='farm-land.js'?change(b):b,a=>a.files['farm-land.js'].reviewedSha256=sha(change(real))),/A6 cannot change terrain, old farm membership or player clamp/);
});
