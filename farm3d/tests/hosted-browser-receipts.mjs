// Read-only verification of hosted evidence. A process exit alone is not coverage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {validateVisualCapture}=createRequire(import.meta.url)('./visual-review-capture.cjs');
const here=path.dirname(fileURLToPath(import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const fileSha=p=>sha(fs.readFileSync(path.join(here,p)));
const progressionSha='14f43186370cd4e6224fe01a4f781fb1dfb7e663a984a1f38292ce685417ece8';
const boundaryNames=[
 'three land gates, insufficient funds, exact purchase and capacity caps',
 'expanded 48-field land persistence',
 'daily seven-day calendar, day8 wrap and repeat claim rejection',
 'claimed daily date/streak survives reload',
 'daily missed-day reset and midnight boundary',
 'daily quests incomplete/invalid/repeat claims and bonus idempotency',
 'daily quest claims/bonus persistence and day rollover',
 'visitor/rush level2 gates and generated level3 scheduling',
 'generated rush missing goods, exact rewards and repeated claims',
 'rush completion/cooldown persistence',
 'active generated visitor/rush persistence',
 'rush exact-expiry stale control rejects reward and expires on tick',
 'visitor missing goods, five-heart cap and repeated request claims',
 'visitor friendship/reward persistence',
 'generated visitors avoid consecutive identity and apply friendship price',
 'visitor exact-expiry stale control must refuse reward',
 'visitor tick expiry and no-request claim reject reward',
];
export function expectedProgressionNames(mode){
 assert.ok(['earned','boundaries'].includes(mode),'known progression mode');
 return mode==='boundaries'?[...boundaryNames]:['resume preserved earned level8 receipt without replay',...Array.from({length:12},(_,i)=>`earned level ${i+9} and new unlock boundaries`),'earned later progression persistence'];
}
export function verifyHostedBrowserReceipt(suite,source,out){
 assert.match(source,/^[a-f0-9]{40}$/,'exact source commit');
 assert.ok(['gallery','earned','boundaries'].includes(suite),'known hosted suite');
 const read=name=>JSON.parse(fs.readFileSync(path.join(out,name),'utf8'));
 if(suite!=='gallery'){
  const r=read('results.json');
  assert.equal(fileSha('qualification-later-progression.browser.cjs'),progressionSha,'original progression assertions remain unchanged');
  assert.equal(r.testSha256,progressionSha,'executed original progression fixture');
  assert.equal(r.priorEarnedReceiptSha256,fileSha('evidence/phase7n-connected/progression-results.json'),'original level8 receipt');
  assert.equal(r.status,'PASS');assert.equal(r.sourceRef,source);assert.equal(r.mode,suite);
  assert.deepEqual(r.results.map(x=>x.name),expectedProgressionNames(suite),'every original assertion group exactly once');
  assert.ok(r.results.every(x=>x.status==='PASS'),'every assertion group passed');
  return {suite,source,status:'passed',assertionGroups:r.results.length,visualAcceptance:false};
 }
 const r=read('visual-review-results.json');
 assert.equal(r.source,source);assert.equal(r.status,'captured');assert.equal(r.visualVerdict,'pending_review');
 for(const [field,file] of [['testSha256','visual-review.browser.cjs'],['helperSha256','visual-review-capture.cjs'],['harnessSha256','browser-harness.cjs']])assert.equal(r[field],fileSha(file),'exact executed '+file);
 const expected=[];
 for(const viewport of [{width:844,height:390},{width:1280,height:720}])for(const mode of ['overview','first-person'])for(const preset of mode==='overview'?['noon','golden','night']:['noon','golden','rain'])expected.push({viewport,mode,preset,filename:`visual-review-${viewport.width}-${mode}-${preset}.png`});
 assert.deepEqual(r.captures.map(c=>c.filename),expected.map(c=>c.filename),'twelve exact gallery captures');
 for(let i=0;i<expected.length;i++){
  const c=r.captures[i],e=expected[i];
  assert.equal(c.source,source);assert.deepEqual(c.viewport,e.viewport);assert.equal(c.mode,e.mode);assert.equal(c.preset,e.preset);
  assert.equal(c.saveUnchanged,true);assert.equal(c.captureStatus,'captured');assert.equal(c.visualVerdict,'pending_review');
  const checked=validateVisualCapture(c,fs.readFileSync(path.join(out,e.filename)));
  assert.deepEqual(c.image,checked.image,'PNG dimensions and hash match receipt');
 }
 return {suite,source,status:'captured',captures:12,visualAcceptance:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  assert.equal(process.argv.length,5,'usage: hosted-browser-receipts.mjs SUITE SOURCE OUTPUT_DIRECTORY');
  const result=verifyHostedBrowserReceipt(...process.argv.slice(2));
  console.log(JSON.stringify(result));
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n${result.suite}: ${result.status}, ${result.assertionGroups??result.captures} verified groups/captures at ${result.source}. Visual acceptance remains pending.\n`);
 }catch(error){console.error(error);process.exitCode=1;}
}
