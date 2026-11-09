import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {expectedProgressionNames, verifyHostedBrowserReceipt} from './hosted-browser-receipts.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)), source='a'.repeat(40);
const hash=b=>createHash('sha256').update(b).digest('hex');
const fileHash=p=>hash(fs.readFileSync(path.join(here,p)));
function progression(mode){return {status:'PASS',sourceRef:source,mode,testSha256:fileHash('qualification-later-progression.browser.cjs'),priorEarnedReceiptSha256:fileHash('evidence/phase7n-connected/progression-results.json'),results:expectedProgressionNames(mode).map(name=>({name,status:'PASS'}))};}
function temporary(t){const out=fs.mkdtempSync(path.join(os.tmpdir(),'sunny-hosted-receipts-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));return out;}
function write(out,report,name='results.json'){fs.writeFileSync(path.join(out,name),JSON.stringify(report));}
test('hosted progression requires exact original earned and boundary receipts',t=>{
 const out=temporary(t);
 for(const mode of ['earned','boundaries']){const r=progression(mode);write(out,r);const summary=verifyHostedBrowserReceipt(mode,source,out);assert.equal(summary.assertionGroups,mode==='earned'?14:17);assert.equal(summary.status,'passed');assert.equal(summary.visualAcceptance,false);}
});
test('hosted progression rejects missing, duplicate, failed, wrong-source and stale-script receipts',t=>{
 const out=temporary(t);
 for(const change of [r=>r.results.pop(),r=>r.results[1]=r.results[0],r=>r.results[0].status='FAIL',r=>r.status='FAIL',r=>r.sourceRef='b'.repeat(40),r=>r.mode='all',r=>r.testSha256='0'.repeat(64),r=>r.priorEarnedReceiptSha256='0'.repeat(64)]){const r=progression('earned');change(r);write(out,r);assert.throws(()=>verifyHostedBrowserReceipt('earned',source,out));}
 assert.throws(()=>verifyHostedBrowserReceipt('unknown',source,out));assert.throws(()=>verifyHostedBrowserReceipt('earned','main',out));
});
function gallery(out){
 const report={source,status:'captured',visualVerdict:'pending_review',testSha256:fileHash('visual-review.browser.cjs'),helperSha256:fileHash('visual-review-capture.cjs'),harnessSha256:fileHash('browser-harness.cjs'),captures:[]};
 for(const viewport of [{width:844,height:390},{width:1280,height:720}])for(const mode of ['overview','first-person'])for(const preset of mode==='overview'?['noon','golden','night']:['noon','golden','rain']){
  const png=Buffer.alloc(33);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.writeUInt32BE(13,8);png.write('IHDR',12);png.writeUInt32BE(viewport.width,16);png.writeUInt32BE(viewport.height,20);
  const filename=`visual-review-${viewport.width}-${mode}-${preset}.png`;fs.writeFileSync(path.join(out,filename),png);
  report.captures.push({source,viewport,mode,preset,devicePixelRatio:1,drawingBuffer:viewport,quality:'best',shadows:true,qualityCut:0,autoQuality:false,contextLost:false,frameBefore:1,frameAfter:5,overlays:[],camera:{position:[1,2,3],quaternion:[0,0,0,1]},saveUnchanged:true,captureStatus:'captured',visualVerdict:'pending_review',filename,image:{width:viewport.width,height:viewport.height,bytes:png.length,sha256:hash(png)}});
 }
 return report;
}
test('hosted gallery verifies all twelve exact files without granting visual approval',t=>{
 const out=temporary(t),r=gallery(out);write(out,r,'visual-review-results.json');const result=verifyHostedBrowserReceipt('gallery',source,out);assert.equal(result.captures,12);assert.equal(result.visualAcceptance,false);assert.equal(result.status,'captured');
});
test('hosted gallery rejects partial, duplicate, swapped, corrupted and misleading receipts',t=>{
 const out=temporary(t);
 for(const change of [r=>r.captures.pop(),r=>r.captures[1]=r.captures[0],r=>r.source='b'.repeat(40),r=>r.captures[0].source='b'.repeat(40),r=>r.captures[0].mode='wrong',r=>r.captures[0].filename='../outside.png',r=>r.captures[0].image.sha256='0'.repeat(64),r=>r.captures[0].quality='fast',r=>r.captures[0].saveUnchanged=false,r=>r.visualVerdict='passed',r=>r.harnessSha256='0'.repeat(64)]){const r=gallery(out);change(r);write(out,r,'visual-review-results.json');assert.throws(()=>verifyHostedBrowserReceipt('gallery',source,out));}
 const r=gallery(out);write(out,r,'visual-review-results.json');fs.writeFileSync(path.join(out,r.captures[0].filename),'broken');assert.throws(()=>verifyHostedBrowserReceipt('gallery',source,out));
});
