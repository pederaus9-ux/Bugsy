// Proposal witness only: existing PR95 assertion and frozen receipt remain unchanged.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {createCowYard} from '../cow-yard.js';import {meshReceipt} from './fixtures/animal-pen-mesh-probe.mjs';
const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/animal-pen-render-pr95.json',import.meta.url))).sites.cow;
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Supply a fresh output path');
function verify(y){
 const a=y.robot.entryGate,b=y.robot.exitGate;
 assert.equal(a.rotation.y,Math.PI/2);assert.equal(b.rotation.y,-Math.PI/2);
 assert.equal(a.position.x,-4.35+.10);assert.equal(b.position.x,-4.35+.18);
 const native=meshReceipt(y.group);
 // Restore exactly A21's two parked transforms in this disposable test instance.
 // No geometry, other transforms, production bytes or frozen receipt are changed.
 a.rotation.y=-Math.PI/2;b.rotation.y=Math.PI/2;a.position.x=b.position.x=-4.35;
 const normalized=meshReceipt(y.group);assert.deepEqual(normalized,expected,'all PR95 rendered vertices outside the exact A21 pose exception');
 return{native,normalized,expected};
}
const yard=createCowYard({north:25});let receipts;try{receipts=verify(yard);}finally{yard.dispose();}
const controls=[['wrong entry parked rotation',y=>y.robot.entryGate.rotation.y=-Math.PI/2],['missing exit offset',y=>y.robot.exitGate.position.x=-4.35],['unrelated whole-yard translation',y=>y.group.position.x=.001],['missing gate geometry',y=>y.robot.entryGate.parent.remove(y.robot.entryGate)]];
for(const[name,mutate]of controls){const y=createCowYard({north:25});try{mutate(y);assert.throws(()=>verify(y),name+' must not pass');}finally{y.dispose();}}
const report={status:'SUPPLEMENTAL_PASS_ORIGINAL_RECEIPT_ASSERTION_REMAINS_RED',...receipts,controls:controls.map(c=>c[0]),proposal:'Require exact A21 current parked transforms, then compare the complete PR95 receipt after undoing only those transforms on a disposable test instance; keep chicken receipt and all other assertions unchanged. Existing A21 closed-barrier and exact-source controls remain required.'};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
