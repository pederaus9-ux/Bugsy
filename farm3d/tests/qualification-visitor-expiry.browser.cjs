// Focused independent diagnostic: native Date, fresh profile, generated visitor,
// seeded inventory/deadline only. Preserves and confirms the qualification FAIL;
// successful diagnostic execution is not a passing expiry acceptance test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const{start}=require('./qualification-cdp.cjs');
const ref=process.env.QUALIFICATION_REF||'e3b59b7a65a3d9c8710bad3e4a2659d9d76be765';
const out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts','qualification-visitor-expiry'));
let h,result;
(async()=>{try{
 h=await start(out,ref);
 await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');let seed=8309;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};"});
 await h.boot();
 result=await h.cdp.evaluate(`(()=>{
  const G=__dbg.G;G.opts.quiet=true;G.close();const original=JSON.stringify(G.S),rows=[];
  const snap=()=>({coins:G.S.coins,gems:G.S.gems,xp:G.S.xp,barn:structuredClone(G.S.barn),visitors:G.S.stats.visitors,villagers:structuredClone(G.S.villagers)});
  for(const test of ['valid native-clock control','expired native-clock stale button','expired native-clock after tick']){
   const s=JSON.parse(original);Object.assign(s,{level:20,xp:0,coins:1000,gems:0,tut:99,barn:{},gold:{},visitor:null,villagers:{},nextEventAt:9e15,nextRushAt:9e15,nextVisitorAt:Date.now()-1});
   localStorage.setItem(G.SAVE_KEY,JSON.stringify(s));G.load();G.tick();
   const v=structuredClone(G.S.visitor);if(!v)throw Error('No generated visitor');for(const[id,n]of Object.entries(v.items))G.S.barn[id]=n;
   G.openPanel('visitor');const b=document.querySelector('[data-act="helpVisitor"]');if(!b||b.disabled)throw Error('Missing enabled real Give button');
   if(test!=='valid native-clock control')G.S.visitor.end=Date.now()-1;
   const deadline=G.S.visitor.end,before=snap(),clickedAt=Date.now();
   if(test==='expired native-clock after tick')G.tick();
   b.click();const after=snap();rows.push({test,generatedRequest:v,seededDeadline:test!=='valid native-clock control',deadline,clickedAt,expiredAtAction:deadline<=clickedAt,before,after,paid:after.coins-before.coins,consumedInventory:JSON.stringify(after.barn)!==JSON.stringify(before.barn),remainingVisitor:G.S.visitor});G.close();
  }
  return{nativeDate:/native code/.test(Date.toString()),rows};
 })()`);
 assert.equal(result.nativeDate,true);assert.equal(result.rows[0].paid,result.rows[0].generatedRequest.coins);assert.equal(result.rows[1].expiredAtAction,true);assert.equal(result.rows[1].paid,result.rows[1].generatedRequest.coins);assert.equal(result.rows[1].consumedInventory,true);assert.equal(result.rows[2].paid,0);assert.equal(result.rows[2].consumedInventory,false);assert.deepEqual(h.errors,[]);
 result.status='CONFIRMED_PRODUCTION_EXPIRY_GUARD_MISSING';
 await h.cdp.screenshot(path.join(out,'native-expiry-diagnostic.png'));
 console.log('CONFIRMED expired visitor pays via real stale Give button with unmodified native Date; tick/no-request control rejects');
}catch(e){result={status:'DIAGNOSTIC_FAILED',error:e.stack,partial:result};process.exitCode=1;console.error(e.stack);}
finally{if(h)await h.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({sourceRef:ref,testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),node:process.version,limits:'Fresh isolated guest/localhost source. Native Date and real generated requests/buttons; level20, exact inventory and expiry deadline seeded. No runtime edit, live account, clock setting or real30-minute balance claim. Diagnostic confirms the failed contract; does not relabel it PASS.',...result},null,2));}})();
