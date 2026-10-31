import settle from './helpers/cow-settle-scope.cjs';
import {normalizeRestoreScope} from './helpers/restore-recovery-scope.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import vm from 'node:vm';
const source=fs.readFileSync(new URL('./remaining-care-integration.test.mjs',import.meta.url),'utf8').match(/test\('protected implementations and approved pen adapters retain exact reviewed bytes',\(\)=>\{([\s\S]*?)\n\}\);/)[1].replaceAll('import.meta.url',JSON.stringify(new URL('./remaining-care-integration.test.mjs',import.meta.url).href));
const readReal=fs.readFileSync.bind(fs),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function run(mutate=()=>{},registryEdit=()=>{}){const read=(url,encoding)=>{let raw=readReal(url),name=new URL(url).pathname.split('/').pop();if(name==='animal-pen-authorized-adapters.json'){const a=JSON.parse(raw);registryEdit(a);raw=Buffer.from(JSON.stringify(a));}else raw=mutate(name,raw)||raw;return encoding?raw.toString():raw;};return vm.runInNewContext('(function(){'+source+'})()',{fs:{readFileSync:read},crypto,assert,URL,normalizeRestoreScope,settle});}
test('A6 land exception accepts exact reviewed bytes',()=>run());
test('A7 rejects unrelated game logic even if the whole-file digest is re-registered',()=>{
 const real=readReal(new URL('../game.js',import.meta.url)),change=b=>Buffer.from(b.toString().replace('export const have = (id) => S.barn[id] || 0','export const have = (id) => 1000'));
 assert.notEqual(change(real).toString(),real.toString());
 assert.throws(()=>run((n,b)=>n==='game.js'?change(b):b,a=>a.files['game.js'].reviewedSha256=sha(change(real))),/A7 cannot change game economy or unrelated gameplay/);
});
test('A6 rejects another mask change without review',()=>assert.throws(()=>run((n,b)=>n==='farm-land.js'?Buffer.from(b.toString().replace('1+24,-46,-25','1+24,-47,-25')):b),/changed outside the reviewed source checkpoint/));
for(const [name,before,after] of [['old farm boundary','radius+1e-9','radius+1'],['terrain heights','return clearing===1?0','return clearing===1?1'],['A8 player clamp','MAP_EDGE,z))','MAP_EDGE+1,z))']])test('A6/A8 rejects changed '+name+' even with a re-registered whole-file digest',()=>{
 const change=b=>Buffer.from(b.toString().replace(before,after)),real=readReal(new URL('../farm-land.js',import.meta.url));assert.notEqual(change(real).toString(),real.toString());
 assert.throws(()=>run((n,b)=>n==='farm-land.js'?change(b):b,a=>a.files['farm-land.js'].reviewedSha256=sha(change(real))),/A8 cannot change old farm membership|A8 reviewed movement clamp changed|A8 cannot change terrain heights/);
});
