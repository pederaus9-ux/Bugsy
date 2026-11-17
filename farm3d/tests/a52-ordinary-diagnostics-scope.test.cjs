'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {normalize,auth,chars,sha}=require('./helpers/a52-ordinary-diagnostics-scope.cjs');
for(const [file,e]of [...Object.entries(auth.files).map(([f,e])=>['farm3d/tests/'+f,e]),...Object.entries(chars.files)])test('strict ordinary diagnostic inverse '+file,()=>{const input=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');assert.equal(sha(input),e.afterSha256);assert.equal(sha(normalize(file,input)),e.beforeSha256);assert.equal(sha(normalize(file,Buffer.from(input))),e.beforeSha256);for(const bad of [input+'\n',input.replace('assert.equal','assert.notEqual')])if(bad!==input)assert.equal(normalize(file,bad),bad);});
test('unrecognized ordinary input and file remain unchanged',()=>{assert.equal(normalize('farm3d/tests/unknown.cjs','anything'),'anything');assert.equal(normalize('farm3d/tests/authored-hands.browser.cjs','anything'),'anything');});
