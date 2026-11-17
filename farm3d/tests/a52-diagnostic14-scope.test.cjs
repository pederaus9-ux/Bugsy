const {normalize:normalize15}=require('./helpers/a52-diagnostic15-scope.cjs');
'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pen=require('./helpers/a52-pen-report-scope.cjs'),analytics=require('./helpers/a52-analytics-prerequisites-scope.cjs');
test('pen observer inverse retains exact original save and all source',()=>{const f=pen.scope.path,s=normalize15(f,fs.readFileSync(path.join(__dirname,'../..',f),'utf8'));assert.equal(pen.sha(s),pen.scope.postimageSha256);assert.equal(pen.sha(pen.normalize(f,s)),pen.scope.sourceSha256);assert.equal(pen.normalize(f,s+'\n'),s+'\n');});
for(const [f,e]of Object.entries(analytics.scope.files))test('analytics prerequisite strict inverse '+f,()=>{const s=normalize15(f,fs.readFileSync(path.join(__dirname,f),'utf8'));assert.equal(analytics.sha(s),e.afterSha256);assert.equal(analytics.normalize(f,s),e.before);assert.equal(analytics.normalize(f,s+'\n'),s+'\n');});

test('Firebase detail exact inverse rejects altered observations and actions',()=>{const h=require('./helpers/a52-firebase-detail-scope.cjs'),f=h.scope.path,s=normalize15(f,fs.readFileSync(path.join(__dirname,'../..',f),'utf8'));assert.equal(h.sha(s),h.scope.postimageSha256);assert.equal(h.sha(h.normalize(f,s)),h.scope.sourceSha256);assert.equal(h.normalize(f,s+'\n'),s+'\n');});
