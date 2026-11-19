'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'daytime-cow-mirror-qualification.browser.cjs'),'utf8');
const body=source.slice(source.indexOf('function installMeetingLedger('),source.indexOf('\nasync function main()'));
const install=vm.runInNewContext(body+';installMeetingLedger');
function fixture(){const calls=[],proto={go(...args){calls.push([this,args]);this.label=args[3];this.doing=args[4];return 42;}};const cows=[-1,0,4].map(x=>Object.assign(Object.create(proto),{kind:'cow',g:{position:{x,z:0}},doing:null,label:'Idle'}));const s={active:cows,night:false,poly:[[-5,-5],[5,-5],[5,5],[-5,5]],projectX:x=>x};cows[0].friend=cows[1];const ledger=install(s);ledger.begin('day1');ledger.sample();return {s,cows,calls,ledger};}
function visit(f){const a=f.cows[0];assert.equal(a.go(0,0,false,'Visiting peer','social'),42);f.ledger.sample();}
function arrive(f){f.cows[0].label='Hanging out with peer';f.ledger.sample();}
test('attempt is not physical arrival and wrapper preserves call',()=>{const f=fixture();visit(f);const m=f.ledger.finish();assert.equal(m.attempts,1);assert.equal(m.confirmed,0);assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],f.cows[0]);});
test('retries before arrival do not count distinct meetings',()=>{const f=fixture();visit(f);visit(f);arrive(f);const m=f.ledger.finish();assert.equal(m.attempts,2);assert.equal(m.repeatedBeforeConfirmation,1);assert.equal(m.confirmed,1);assert.equal(m.distinctUnorderedPairs,1);assert.equal(m.unmatchedConfirmation,0);});
test('repeat actual approaches are separate from distinct pair coverage',()=>{const f=fixture();visit(f);arrive(f);visit(f);arrive(f);const m=f.ledger.finish();assert.equal(m.confirmed,2);assert.equal(m.distinctUnorderedPairs,1);assert.equal(m.repeatConfirmedPairs,1);assert.equal(m.worldDistinctL,1);assert.equal(m.worldL,2);});
test('distant hang label cannot confirm a physical meeting',()=>{const f=fixture();f.cows[1].g.position.x=4;visit(f);arrive(f);assert.equal(f.ledger.finish().confirmed,0);});
test('changed partner cannot confirm original approach',()=>{const f=fixture();visit(f);f.cows[0].friend=f.cows[2];f.cows[2].g.position.x=0;arrive(f);assert.equal(f.ledger.finish().confirmed,0);});
test('nighttime and phase reset cannot create daytime arrivals',()=>{const f=fixture();visit(f);f.s.night=true;arrive(f);assert.equal(f.ledger.finish().confirmed,0);f.s.night=false;f.ledger.begin('day2');f.ledger.sample();assert.equal(f.ledger.finish().confirmed,0);});
test('same pair on new actual half adds side coverage not new unique pair',()=>{const f=fixture();visit(f);arrive(f);f.cows[0].g.position.x=1;visit(f);arrive(f);const m=f.ledger.finish();assert.equal(m.distinctUnorderedPairs,1);assert.equal(m.worldDistinctL,1);assert.equal(m.worldDistinctR,1);assert.equal(m.screenDistinctL,1);assert.equal(m.screenDistinctR,1);});
